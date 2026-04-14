import { baseWSURL } from '@/constants';
import {
  changeCountDown,
  changeFree,
  changeRecord,
  changeNoCar,
  changeBlinkTime,
  changeHealth,
  changeHost,
  changeMultiplier,
  changePartyMaps,
  changePartyType,
  changeRoundNumber,
  hostChangeOnlooker,
  hostSwitchTeam,
  joinByParty,
  kickOffPlayer,
  switchTeam,
  switchToOnlooker,
  switchToPlayer,
} from '@/services/api';
import { history } from '@umijs/max';
import { useWebSocket } from 'ahooks';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

// 进入比赛指令
const subscribeMessage = (partyId: string) =>
  JSON.stringify({
    data: { type: 'subscribe_party', text: partyId },
    scope: 'qixun',
  });

// 心跳指令
const heartBeatMessage = JSON.stringify({
  scope: 'heart_beat',
});

export default () => {
  // 设置派对 Data
  const [partyData, setPartyData] = useState<API.PartyInfo | null>(null);
  // 比赛状态
  const [status, setStatus] = useState<GameStatus>();
  const [emoji, setEmoji] = useState<any | null>();
  // 无车模式状态
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

  const wakeUpWebsocket = useCallback(() => {
    if (!document.hidden) {
      console.log('wake up websocket');
      if (readyState === ReadyState.Closed) {
        connect();
      }
    }
  }, [readyState, connect]);

  const processPartyData = useCallback((data: API.PartyInfo, code?: string) => {
    // 排除空数据
    if (!data) return;

    // 被踢出
    if (code === 'host_change_user_leave') {
      if (data.blockPlayerIds.includes(data.requestUserId)) {
        message.error('你已被踢出并禁止进入该派对');
        setPartyData(null);
        setStatus(undefined);
        history.push('/party/error/party_block');
      }
    }

    // 设置游戏数据
    setPartyData(data);
    setStatus(data.status);

    // 开始游戏
    if (code && code === 'start_game') {
      history.push(`/party/${data.gameId}`);
    }
  }, []);

  // ================== WebSocket处理 Start ==================
  // ========= 心跳处理 Start =========
  const [heartBeatInterval, setHeartBeatInterval] = useState<NodeJS.Timeout>();

  // 发送订阅指令
  const sendSubscribeMessage = (gid: string) =>
    sendMessage(subscribeMessage(gid));

  // 发送心跳指令
  const sendHeartBeatMessage = () => sendMessage(heartBeatMessage);

  useEffect(() => {
    if (readyState === ReadyState.Open && partyData?.id) {
      // 发送进入比赛指令
      sendSubscribeMessage(partyData.id);
      // 设置心跳定时器
      setHeartBeatInterval(setInterval(sendHeartBeatMessage, 2000));
    } else if (readyState === ReadyState.Closed) {
      // 清除心跳定时器
      if (heartBeatInterval) {
        clearInterval(heartBeatInterval);
      }
    }
  }, [readyState, partyData?.id]);

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
    if (!scope) {
      return;
    }

    if (scope === 'qixun_party') {
      processPartyData(data.party, data.code);
    } else if (scope === 'qixun_emoji') {
      setEmoji(data);
    }
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

  /**
   * 加入派对
   */
  const joinParty = useCallback(async () => {
    try {
      const { data } = await joinByParty({
        skipErrorHandler: true,
      });

      // 处理派对数据
      processPartyData(data);

      // 连接WebSocket
      connect();
      // 解决息屏、后台后websocket断开的问题
      try {
        document.addEventListener('visibilitychange', wakeUpWebsocket);
      } catch (error) { }
    } catch (error: any) {
      if (!error || !error.info) {
        return;
      }
      if (error.info.errorCode === 'need_login') {
        message.error('请先登录');
        history.push('/user/login?redirect=/party');
      } else if (error.info.errorCode === 'party_disband') {
        history.push('/party/error/party_disband');
      } else if (error.info.errorCode === 'party_block') {
        history.push('/party/error/party_block');
      } else if (error.info.errorCode === 'party_not_found') {
        history.push('/party/error/party_not_found');
      }
    }
  }, [connect, processPartyData, wakeUpWebsocket]);

  /**
   * 改变派对类型
   */
  const changeType = useCallback(
    async (type: PartyMatchType) => {
      const { data } = await changePartyType({ type });

      // 处理派对数据
      processPartyData(data);
    },
    [changePartyType],
  );

  /**
   * 改变派对地图
   */
  const changeMap = useCallback(
    async (mapsId: number, move?: boolean) => {
      const { data } = await changePartyMaps({
        mapsId,
        type: move ? 'move' : 'noMove',
      });

      // 处理派对数据
      processPartyData(data);
    },
    [changePartyMaps],
  );

  /**
   * 设置回合时间参数
   */
  const setCountDownTime = useCallback(
    async (
      countDown: RoundCountDownType,
      roundTimerPeriod: number,
      roundTimerGuessPeriod: number,
    ) => {
      const { data } = await changeCountDown({
        countDown,
        roundTimerPeriod,
        roundTimerGuessPeriod,
      });

      // 处理派对数据
      processPartyData(data);
    },
    [changeCountDown],
  );

  /**
   * 设置眨眼时间参数
   */
  const setBlinkTime = useCallback(
    async (
      blinkTime: number | null
    ) => {
      const { data } = await changeBlinkTime({
        blinkTime
      });

      // 处理派对数据
      processPartyData(data);
    },
    [changeBlinkTime],
  );

  /**
   * 设置倍率
   */
  const setMultipler = useCallback(
    async (
      open: boolean,
      startRound: number | null,
      increment: number | null,
    ) => {
      const { data } = await changeMultiplier({
        open,
        startRound,
        increment,
      });

      // 处理派对数据
      processPartyData(data);
    },
    [changeMultiplier],
  );

  /**
   * 设置生命值
   */
  const setHealth = useCallback(
    async (health: number) => {
      const { data } = await changeHealth({ health });

      // 处理派对数据
      processPartyData(data);
    },
    [changeHealth],
  );

  const setRoundNumber = useCallback(
    async (roundNumber: number) => {
      const { data } = await changeRoundNumber({ roundNumber });

      // 处理派对数据
      processPartyData(data);
    },
    [changeRoundNumber],
  );

  /**
   * 设置是否自由视角
   */
  const setFree = useCallback(
    async (free: boolean) => {
      const { data } = await changeFree({ free });

      // 处理派对数据
      processPartyData(data);
    },
    [changeFree],
  );

  /**
   * 设置无车模式
   */
  const setNoCar = useCallback(
    async (noCar: boolean) => {
      const { data } = await changeNoCar({ noCar });
      processPartyData(data);
    },
    [changeNoCar],
  );

  /**
   * 设置是否开启回放
   */
  const setRecord = useCallback(
    async (record: boolean) => {
      const { data } = await changeRecord({ record });

      // 处理派对数据
      processPartyData(data);
    },
    [changeRecord],
  );

  /**
   * 从观察者加入游戏
   */
  const joinAsPlayer = useCallback(
    async (teamIndex: number) => {
      let teamId: string | null = null;
      console.log(partyData?.teams);
      if (
        Array.isArray(partyData?.teams) &&
        partyData!.teams.length > teamIndex
      ) {
        teamId = partyData!.teams[teamIndex].id;
      }

      const { data } = await switchToPlayer({ teamId });

      // 处理派对数据
      processPartyData(data);
    },
    [partyData],
  );

  /**
   * 加入围观
   */
  const joinAsObserver = useCallback(async () => {
    const { data } = await switchToOnlooker();

    // 处理派对数据
    processPartyData(data);
  }, []);

  /**
   * 踢出用户
   */
  const kickOffUser = useCallback(
    async (userId: number) => {
      const { data } = await kickOffPlayer({ userId });

      // 处理派对数据
      processPartyData(data);
    },
    [kickOffPlayer],
  );

  /**
   * 切换房主
   */
  const switchHost = useCallback(
    async (userId: number) => {
      const { data } = await changeHost({ userId });

      // 处理派对数据
      processPartyData(data);
    },
    [changeHost],
  );

  /**
   * 房主强制切换队伍
   */
  const switchTeamByHost = useCallback(
    async (userId: number) => {
      const { data } = await hostSwitchTeam({ userId });

      // 处理派对数据
      processPartyData(data);
    },
    [hostSwitchTeam],
  );

  /**
   * 切换为观察者
   */
  const changePlayerToLooker = useCallback(
    async (userId: number) => {
      const { data } = await hostChangeOnlooker({ userId });

      // 处理派对数据
      processPartyData(data);
    },
    [hostChangeOnlooker],
  );

  /**
   * 切换队伍
   */
  const changeTeam = useCallback(async () => {
    const { data } = await switchTeam();

    // 处理派对数据
    processPartyData(data);
  }, [switchTeam]);

  // 清除当前比赛状态
  const clearState = useCallback(() => {
    // 断开WebSocket
    disconnect();

    setPartyData(null);
    setStatus(undefined);
    try {
      document.removeEventListener('visibilitychange', wakeUpWebsocket);
    } catch (error) { }
  }, [disconnect, wakeUpWebsocket]);

  return {
    partyData,
    joinParty,
    joinAsPlayer,
    joinAsObserver,
    changeType,
    changeMap,
    kickOffUser,
    switchHost,
    changePlayerToLooker,
    changeTeam,
    switchTeamByHost,
    setFree,
    setRecord,
    setHealth,
    setCountDownTime,
    setBlinkTime,
    status,
    clearState,
    emoji,
    setRoundNumber,
    setMultipler,
    setNoCar,
  };
};
