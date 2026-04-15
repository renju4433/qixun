import { baseWSURL } from '@/constants';
import {
  confirmGuess,
  getPanoInfo,
  getQQPanoInfo,
  getSoloGameInfo,
  nextRound,
  submitPin,
} from '@/services/api';
import { useWebSocket } from 'ahooks';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

// 进入比赛指令
const subscribeMessage = (gameId: string) =>
  JSON.stringify({
    data: { type: 'subscribe_solo', text: gameId },
    scope: 'qixun',
  });

// 心跳指令
const heartBeatMessage = JSON.stringify({ scope: 'heart_beat' });

export default () => {
  // 比赛ID
  const [gameId, setGameId] = useState<string>();
  const [onlineNums] = useState<number>(0);
  // 比赛类型
  const [type, setType] = useState<GameType>();
  // 比赛状态
  const [status, setStatus] = useState<GameStatus>();
  // 血条
  const [health, setHealth] = useState<number>(0);
  // 最新轮次
  const [lastRound, setLastRound] = useState<API.GameRound | null>(null);
  // 比赛结果显示
  const [gameEndVisible, setGameEndVisible] = useState<boolean>(false);
  // 回合
  const [round, setRound] = useState<number>();
  // 设置Game Data
  const [gameData, setGameData] = useState<API.GameInfo | null>(null);
  // 是否确认选择
  const [confirmed, setConfirmed] = useState<boolean>();
  // 是否回合结束
  const [roundResult, setRoundResult] = useState<boolean>(false);
  // const [gameResult, setGameResult] = useState<GameResult | null>(null);
  // 目标位置
  const [targetCoord, setTargetCoord] = useState<PanoTarget | null>(null);
  // 选择位置
  const [pickCoord, setPickCoord] = useState<{
    longitude: number;
    latitude: number;
  }>();
  const [emoji, setEmoji] = useState<any | null>();

  // ====== 交互保护（防连点/防串题） ======
  // 移动端连点“下一轮”时，第二次点击有概率落到新回合地图上（ghost click），导致直接选点。
  // 这里用一个短窗口抑制 map pick，并用 next 单飞锁避免并发 nextRound。
  const suppressPickUntilRef = useRef<number>(0);
  const nextInFlightRef = useRef<boolean>(false);
  const nextSeqRef = useRef<number>(0);

  const confirmInFlightRef = useRef<boolean>(false);

  const suppressPickFor = (ms: number) => {
    const until = Date.now() + ms;
    if (until > suppressPickUntilRef.current) suppressPickUntilRef.current = until;
  };

  // ====== 街景相关状态 Start ======
  // Panorama ID
  const [panoId, setPanoId] = useState<string>();

  // 街景信息
  const [pano, setPano] = useState<PanoInfo | null>(null);

  // 街景视图选项（设置视角、移动等）
  const [viewOptions, setViewOptions] = useState<ViewOptions>();

  // 是否允许加载
  const [canLoad, setCanLoad] = useState<boolean>(false);

  // ====== 街景相关状态 End ======

  // 初始化WebSocket
  const { sendMessage, readyState, latestMessage, connect, disconnect } =
    useWebSocket(`${baseWSURL}/v0/qixun`, {
      manual: true,
      reconnectLimit: 10,  // 增加重连次数限制
      reconnectInterval: 3000,  // 3秒重连间隔
      onError: (event) => {
        console.error('WebSocket连接错误，将自动重连:', event);
      },
      onClose: (event) => {
        console.log('WebSocket连接关闭，将自动重连');
      }
    });

  // const navigate = useNavigate();

  /**
   * 处理比赛数据
   *
   * @param {API.GameInfo} data 比赛数据
   * @param {string} [code] 比赛指令
   * @return {Promise<void>} 无返回值
   */
  const processGameData = async (
    data: API.GameInfo,
    code?: string,
  ): Promise<void> => {
    // 设置游戏数据
    setGameData(data);

    // 设置比赛类型
    setType(data.type);
    switch (data.type) {
      case 'challenge':
        document.title = '题库经典五题 - 棋寻 - 以棋会友';
        break;
      case 'infinity':
        document.title = '题库无限模式 - 棋寻 - 以棋会友';
        break;
      case 'map_country_streak':
        document.title = '题库国家连胜 - 棋寻 - 以棋会友';
        break;
      case 'daily_challenge':
        document.title = '每日挑战 - 棋寻 - 以棋会友';
        break;
      case 'country_streak':
        document.title = '国家连胜 - 棋寻 - 以棋会友';
        break;
      case 'province_streak':
        document.title = '省份连胜 - 棋寻 - 以棋会友';
        break;
      default:
        break;
    }

    // 设置初始血条
    setHealth(data.health);

    const currentRoundData =
      data.rounds && data.currentRound !== null && data.currentRound !== undefined
        ? data.rounds[data.currentRound]
        : undefined;
    const hasChessFen = Boolean(
      (data as any)?.currentFen ||
        (data as any)?.fen ||
        (currentRoundData as any)?.fen ||
        currentRoundData?.content,
    );

    // === 浏览器通知 Start ===
    if (data.status === 'wait_join' && data.type === 'solo_match') {
      // 匹配成功准备开始
    }

    if (status === 'match_fail') {
      // 匹配失败，重新匹配！
      message.error('匹配失败，重新匹配！');

      // TODO: 重新匹配

      // 结束处理
      return;
    }

    if (code === 'game_start' && data.type === 'battle_royale') {
      // TODO: 淘汰赛开始了，点击进入
    }

    if (code === 'player_join' && data.type === 'solo') {
      // TODO: 您的邀请Solo赛已经准备就绪，可以开始了！
    }
    // === 浏览器通知 End ===

    let tGameEndVisible = gameEndVisible;
    // 比赛结束结算相关逻辑
    if (!data.player && (code === 'game_end' || data.status === 'finish')) {
      // 挑战赛处理
      if (['daily_challenge', 'challenge'].includes(data.type)) {
        // setMapVisible(false);
        // 日挑比赛结束，不显示结果
        // setGameEndVisible(true);
      } else {
        // setMapVisible(false);
        setGameEndVisible(true);
        tGameEndVisible = true;
      }

      // 大逃杀处理
      if (
        ['country_streak', 'province_streak', 'map_country_streak'].includes(
          data.type,
        )
      ) {
        // setMapVisible(false);
        // TODO: 比赛结束，显示结果
      }
    }

    // 获取最新轮次
    let lastRoundData = lastRound;
    // 设置最新轮次
    if (data.rounds && data.rounds.length > 0) {
      lastRoundData = data.rounds[data.rounds.length - 1];
      setLastRound(lastRoundData);
    }

    // 加载比赛地图
    if (
      ['wait_join', 'ready', 'ongoing', 'finish', 'match_fail'].includes(
        data.status,
      )
    ) {
      // 设置比赛状态
      setStatus(data.status);

      if (['ongoing', 'finish'].includes(data.status) && !hasChessFen) {
        if (
          panoId !== lastRoundData?.panoId ||
          round !== lastRoundData?.round
        ) {
          // 切回合/换图瞬间抑制一次选点，避免连点/事件延迟导致把上一回合的点击落到新回合上
          suppressPickFor(800);

          const panoData: PanoInfo = {
            panoId: lastRoundData?.panoId ?? '',
            heading: lastRoundData?.heading ?? 0,
            source: lastRoundData?.source ?? 'google_pano',
            lng: lastRoundData?.lng ?? 0,
            lat: lastRoundData?.lat ?? 0,
            links: [],
            worldSize: null,
          };

          // 百度街景和棋寻街景处理
          if (lastRoundData?.source === 'baidu_pano') {
            const result = await getPanoInfo({ pano: lastRoundData?.panoId });
            panoData.heading = result?.data.centerHeading; // 设置街景朝向
            panoData.lng = result?.data.lng; // 设置街景经度
            panoData.lat = result?.data.lat; // 设置街景经度

            // 设置街景链接
            if (result.data.links && result.data.links.length > 0) {
              panoData.links = result.data.links; // 设置街景链接图
            }

            panoData.worldSize = null; // 设置街景尺寸
          } else if (lastRoundData?.source === 'qq_pano') {
            const result = await getQQPanoInfo({ pano: lastRoundData?.panoId });
            panoData.heading = result?.data.centerHeading; // 设置街景朝向
            panoData.lng = result?.data.lng; // 设置街景经度
            panoData.lat = result?.data.lat; // 设置街景经度

            // 设置街景链接
            if (result.data.links && result.data.links.length > 0) {
              panoData.links = result.data.links; // 设置街景链接图
            }

            panoData.worldSize = null; // 设置街景尺寸
          } else if (lastRoundData?.source === 'qixun_pano') {
            const result = await getPanoInfo({ pano: lastRoundData?.panoId });
            panoData.heading = result?.data.centerHeading; // 设置街景朝向
            panoData.lng = result?.data.lng; // 设置街景经度
            panoData.lat = result?.data.lat; // 设置街景经度
            if (result.data.width && result.data.height) {
              panoData.worldSize = new google.maps.Size(
                result.data.width,
                result.data.height,
              ); // 设置街景尺寸
            }

            // 设置街景链接
            panoData.links = []; // 设置街景链接图
          }

          // 改成多合一
          setPano(panoData); // 设置街景信息

          // TODO: 检测异步问题是否存在
          setPanoId(lastRoundData?.panoId); // 切换街景

          setRound(lastRoundData?.round); // 设置回合

          // 设置街景视图选项
          setViewOptions({
            move: lastRoundData?.move ?? false,
            pan: lastRoundData?.pan ?? false,
            heading: lastRoundData?.vHeading ?? 0,
            pitch: lastRoundData?.vPitch ?? 0,
            zoom: lastRoundData?.vZoom ?? 0,
          });

          setTargetCoord(null); // 清空目标位置
          setConfirmed(false); // 清空确认状态
          setPickCoord(undefined); // 清空选点位置
        }
      }
    }

    // ====== 回合结束 Start ======
    // TODO: 回合结束处理
    // 回合结束
    if (code === 'round_end' || (lastRoundData && lastRoundData.endTime)) {
      // TODO: showGameEnd情况下不显示回合结果

      if (data.player?.guesses) {
        const lastGuess = data.player.guesses?.find(
          (item) => item.round === lastRoundData?.round,
        );
        if (lastGuess) {
          // 设置选择位置
          setPickCoord({ latitude: lastGuess.lat, longitude: lastGuess.lng });
        }
      }

      if (!targetCoord && lastRoundData) {
        // 淘汰赛模式选手处理
      }

      // 设置目标位置
      setTargetCoord({
        longitude: lastRoundData?.lng ?? 0,
        latitude: lastRoundData?.lat ?? 0,
      });

      //:todo 显示回合结果, 有点不合理，回头在优化
      if (!tGameEndVisible) setRoundResult(true);
      else setRoundResult(false);
    } else {
      setRoundResult(false);
      // 只有没有结束的时候，采取添加队友，其余的话只添加Ranks，在结算页面处理逻辑

      data?.teams?.forEach((team) => {
        team.teamUsers.forEach((user) => {
          console.log(data?.requestUserId);
          if (user.user.userId === data.requestUserId) {
            const lastGuess = user.guesses?.find(
              (item) => item.round === lastRoundData?.round,
            );

            if (lastGuess) {
              setPickCoord({
                latitude: lastGuess.lat,
                longitude: lastGuess.lng,
              });
              setConfirmed(true);
            }
          }
        });
      });
    }

    // ====== 回合结束 End ======
  };

  /**
   * 获取比赛信息
   */
  const getGameInfo = useCallback(
    async (gid: string) => {
      const { data, success } = await getSoloGameInfo({
        gameId: gid,
      });
      if (success) {
        setCanLoad(true);
        processGameData(data);
      }
    },
    [getSoloGameInfo],
  );

  useEffect(() => {
    if (status === 'wait_join' && type === 'solo_match') {
      // 匹配成功准备开始
      // TODO: 浏览器通知
    }
  }, [status, type]);

  // ====== 地图点选操作 Start ======
  // 选择地点
  const onPickLocation = useCallback(
    async (lat: number, lng: number) => {
      // 切题后的短时间内忽略选点，防止移动端 ghost click 串到下一题
      if (Date.now() < suppressPickUntilRef.current) return;

      if (confirmed) {
        // 已经确认选择，团队模式下发送提示
        if (!type || !gameId) return;
        if (
          [
            'team',
            'team_match',
            'solo',
            'solo_match',
            'battle_royale',
            'rank',
          ].includes(type)
        ) {
          await submitPin({ type: 'game', gameId, lat, lng });
        }
      } else {
        setPickCoord({ latitude: lat, longitude: lng });

        // 没有比赛类型或者比赛ID，不发送
        if (!type || !gameId) return;

        if (
          [
            'team',
            'team_match',
            'solo',
            'solo_match',
            'battle_royale',
            'rank',
          ].includes(type)
        ) {
          // === 团队/Solo模式 ===
          await submitPin({ type: 'game', gameId, lat, lng });
        } else if (['daily_challenge', 'challenge'].includes(type)) {
          // === 每日挑战模式 ===
          await submitPin({ type: 'challenge', gameId, lat, lng });
        } else if (['map_country_streak'].includes(type)) {
          // === 连胜模式 ===
          await submitPin({ type: 'streak', gameId, lat, lng });
        } else if (['infinity'].includes(type)) {
          // === 无限轮次 ===
          await submitPin({ type: 'infinity', gameId, lat, lng });
        }
      }
    },
    [setPickCoord, gameId, type, confirmed],
  );

  // 确认选择
  const onConfirm = useCallback(
    async (lat: number, lng: number) => {
      // 没有比赛类型或者比赛ID，不发送
      if (!type || !gameId) return;

      // 已确认的情况不做任何处理
      if (confirmed) return;

      // ref 级别防并发：两次快速点击只有第一次能进入
      if (confirmInFlightRef.current) return;
      confirmInFlightRef.current = true;

      // 没有选择地点，不发送
      if (!lat || !lng) {
        message.info('请在地图上选择位置！');
        confirmInFlightRef.current = false;
        return;
      }

      let guessType: API.SubmitPinParams['type'] = 'game';
      if (
        [
          'team',
          'team_match',
          'solo',
          'solo_match',
          'battle_royale',
          'rank',
        ].includes(type)
      ) {
        // === 团队/Solo模式 ===
        guessType = 'game';
      } else if (['daily_challenge', 'challenge'].includes(type)) {
        // === 每日挑战模式 ===
        guessType = 'challenge';
      } else if (
        ['map_country_streak', 'province_streak', 'country_streak'].includes(
          type,
        )
      ) {
        // === 连胜模式 ===
        guessType = 'streak';
      } else if (['infinity'].includes(type)) {
        // === 连胜模式 ===
        guessType = 'infinity';
      }

      try {
        // 确认后通常很快切题/出结果，提前抑制一次选点避免连点
        suppressPickFor(800);
        const { data, success } = await confirmGuess(
          { type: guessType, gameId, lat, lng },
          { skipErrorHandler: true },
        );

        if (success) {
          // 更改状态
          setConfirmed(true);

          if (
            [
              'country_streak',
              'province_streak',
              'map_country_streak',
              'infinity',
              'challenge',
              'daily_challenge',
            ].includes(type)
          ) {
            // 处理下一题
            processGameData(data);
          }
        }
      } catch (error: any) {
        // 异常处理
        const { errorCode, errorMessage } = error.info;
        message.error(errorMessage);
        if (errorCode === 'need_vip') {
          // TODO: 需要VIP
        }
      } finally {
        confirmInFlightRef.current = false;
      }
    },
    [setPickCoord, gameId, type, confirmed],
  );
  // ====== 地图点选操作 End ======

  /**
   * 下一题处理
   *
   * @return {Promise<void>}
   */
  const next = useCallback(async (): Promise<void> => {
    if (!type || !gameId) return;

    // 防止连点导致 nextRound 并发/乱序
    if (nextInFlightRef.current) return;
    nextInFlightRef.current = true;
    const seq = ++nextSeqRef.current;

    // 清除已确认状态
    setConfirmed(false);
    // 清除选点，防止空格键重复触发时用旧坐标锁定答案
    setPickCoord(undefined);
    // 切题瞬间抑制地图选点，避免 ghost click
    suppressPickFor(800);

    try {
      if (['daily_challenge', 'challenge'].includes(type)) {
        const { data } = await nextRound({ type: 'challenge', gameId });
        if (seq === nextSeqRef.current) processGameData(data);
      } else if (['infinity'].includes(type)) {
        const { data } = await nextRound({ type: 'infinity', gameId });
        if (seq === nextSeqRef.current) processGameData(data);
      } else if (
        type === 'map_country_streak' ||
        type === 'province_streak' ||
        type === 'country_streak'
      ) {
        const { data } = await nextRound({ type: 'streak', gameId });
        if (seq === nextSeqRef.current) processGameData(data);
      }
    } finally {
      // 只释放最新一次 next 的锁，避免旧请求完成时误释放
      if (seq === nextSeqRef.current) nextInFlightRef.current = false;
    }
  }, [type, gameId, processGameData]);

  /**
   * 重开处理
   *
   * @return {Promise<void>}
   */
  const again = useCallback(async (): Promise<void> => { }, [type, gameId]);

  // ================== WebSocket处理 Start ==================
  // ========= 心跳处理 Start =========
  const [heartBeatInterval, setHeartBeatInterval] = useState<NodeJS.Timeout>();

  // 发送订阅指令
  const sendSubscribeMessage = (gid: string) =>
    sendMessage(subscribeMessage(gid));

  /**
   * 唤醒WebSocket
   */
  const wakeUpWebsocket = useCallback(() => {
    if (!document.hidden) {
      console.log('wake up websocket');
      if (readyState === ReadyState.Closed) connect();
    }
  }, [readyState, connect]);

  // 发送心跳指令
  const sendHeartBeatMessage = useCallback(() => {
    if (readyState === ReadyState.Open) {
      try {
        sendMessage(heartBeatMessage);
      } catch (e) {
        console.log('心跳发送失败，尝试重连:', e);
        // 心跳失败时触发重连
        wakeUpWebsocket();
      }
    } else if (readyState === ReadyState.Closed) {
      // 如果连接已关闭，尝试重连
      wakeUpWebsocket();
    }
  }, [sendMessage, readyState, wakeUpWebsocket]);

  useEffect(() => {
    if (readyState === ReadyState.Open && gameId) {
      // 发送进入比赛指令
      sendSubscribeMessage(gameId);
      // 设置心跳定时器
      setHeartBeatInterval(setInterval(sendHeartBeatMessage, 2000));
    } else if (readyState === ReadyState.Closed) {
      // 清除心跳定时器
      if (heartBeatInterval) clearInterval(heartBeatInterval);
    }
  }, [readyState, gameId]);

  // === 关闭时清除定时器 ===
  useEffect(() => {
    return () => {
      clearInterval(heartBeatInterval);
    };
  }, [heartBeatInterval]);
  // ========= 心跳处理 End =========

  // ========= 消息处理 Start =========
  const processMessage = async (scope: string, data: any) => {
    // 无用消息
    if (
      !scope ||
      (!canLoad && data && data.game && data.game.type === 'solo_match')
    )
      return;

    if (scope === 'qixun_game') processGameData(data.game, data.code);
    else if (scope === 'qixun_emoji') setEmoji(data);
  };

  // 监听消息
  useEffect(() => {
    if (latestMessage) {
      const { data } = latestMessage;
      try {
        const message = JSON.parse(data);
        processMessage(message.scope, message.data);
      } catch (error) {
        // JSON解析失败，不处理
      }
    }
  }, [latestMessage]);
  // ========= 消息处理 End =========
  // ================== WebSocket处理 End ==================

  // 清除当前比赛状态
  const clearState = useCallback(() => {
    // 断开WebSocket
    disconnect();
    setGameId(undefined);
    setType(undefined);
    setStatus(undefined);
    setHealth(0);
    setLastRound(null);
    setGameEndVisible(false);
    setRound(undefined);
    setGameData(null);
    setConfirmed(undefined);
    setRoundResult(false);
    setTargetCoord(null);
    setPickCoord(undefined);
    setPanoId(undefined);
    setPano(null);
    setViewOptions(undefined);
    setEmoji(null);
  }, [disconnect]);

  return {
    gameId,
    setGameId,
    onlineNums,
    type,
    status,
    health,
    lastRound,
    gameEndVisible,
    processGameData,
    panoId,
    pano,
    viewOptions,
    round,
    confirmed,
    setConfirmed,
    onPickLocation,
    onConfirm,
    roundResult,
    pickCoord,
    setPickCoord,
    targetCoord,
    setTargetCoord,
    gameData,
    getGameInfo,
    next,
    again,
    connect,
    disconnect,
    wakeUpWebsocket,
    clearState,
    emoji,
    setCanLoad,
  };
};
