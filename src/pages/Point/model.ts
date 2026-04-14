import { baseWSURL } from '@/constants';
import { getPanoInfo } from '@/services/api';
import { history } from '@umijs/max';
import { useWebSocket } from 'ahooks';
import { ReadyState } from 'ahooks/lib/useWebSocket';
import { notification } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

// 进入比赛指令
const enterMessage = JSON.stringify({
  data: { type: 'enter_main_game' },
  scope: 'qixun',
});

// 心跳指令
const heartBeatMessage = JSON.stringify({
  scope: 'heart_beat',
});

export type Rank = {
  distance: number;
  rank: number;
  longitude: number;
  latitude: number;
  rating: number;
  ratingChange: number;
  user: {
    userId: number;
    icon: string;
    userName: string;
    avatarFrame: string;
  };
};

type Result = {
  target: {
    longitude: number;
    latitude: number;
  };
  ranks: Rank[];
};

export default () => {
  // ====== 街景相关状态 Start ======
  // Panorama ID
  const [panoId, setPanoId] = useState<string>();
  // 街景信息
  const [pano, setPano] = useState<PanoInfo | null>(null);
  // 街景视图选项（设置视角、移动等）
  const [viewOptions] = useState<ViewOptions>({
    move: false,
    pan: true,
    heading: 0,
    zoom: 0,
    pitch: 0,
  });
  // ====== 街景相关状态 End ======

  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [onlineNums, setOnlineNums] = useState<number>();
  const [timeleft, setTimeleft] = useState<number>();
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<'wait' | 'wait_result' | 'rank'>();
  const [pickCoord, setPickCoord] = useState<{
    longitude: number;
    latitude: number;
  }>();
  const [newDanmu, setNewDanmu] = useState<string>();

  // 防 ghost click：切题后短暂抑制选点
  const suppressPickUntilRef = useRef<number>(0);
  // 防并发 confirm
  const confirmInFlightRef = useRef<boolean>(false);

  // TODO: 统一处理固定参数
  const [type] = useState<GameType>('point');
  // 设置Game Data
  const [gameData] = useState<API.GameInfo | null>(null);
  const [lastRound] = useState<API.GameRound | null>(null);
  const [roundResult] = useState<boolean>(false);
  const [emoji, setEmoji] = useState<string>('');

  // ========= WebSocket处理 Start =========
  const { sendMessage, readyState, latestMessage, connect, disconnect } =
    useWebSocket(`${baseWSURL}/v0/qixun`, {
      // useWebSocket('ws://127.0.0.1:8080', {
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
  // ========= WebSocket处理 End =========

  // ========= 心跳处理 Start =========
  const [heartBeatInterval, setHeartBeatInterval] = useState<NodeJS.Timeout>();

  /**
   * 唤醒WebSocket
   */
  const wakeUpWebsocket = useCallback(() => {
    if (!document.hidden) {
      console.log('wake up websocket');
      if (readyState === ReadyState.Closed) {
        connect();
      }
    }
  }, [readyState, connect]);

  /**
   * 心跳发送
   */
  const heartBeat = useCallback(() => {
    if (readyState === ReadyState.Open) {
      try {
        sendMessage(heartBeatMessage);
      } catch (error) {
        console.log('心跳发送失败，尝试重连:', error);
        // 心跳失败时触发重连
        wakeUpWebsocket();
      }
    } else if (readyState === ReadyState.Closed) {
      // 如果连接已关闭，尝试重连
      wakeUpWebsocket();
    }
  }, [sendMessage, readyState, wakeUpWebsocket]);

  useEffect(() => {
    if (readyState === ReadyState.Open) {
      // 发送进入比赛指令
      sendMessage(enterMessage);
      // 设置心跳定时器
      setHeartBeatInterval(setInterval(heartBeat, 2000));
    } else if (readyState === ReadyState.Closed) {
      // 清除心跳定时器
      clearInterval(heartBeatInterval);
    }
  }, [readyState]);

  // === 关闭时清除定时器 ===
  useEffect(() => {
    return () => {
      clearInterval(heartBeatInterval);
    };
  }, [heartBeatInterval]);

  // ========= 心跳处理 End =========

  // ========= 消息处理 Start =========
  const processMessage = async (data: any) => {
    // 无用消息
    if (!data?.type) {
      return;
    }
    if (data.type === 'tick') {
      if (data.status && data.status !== status) {
        setStatus(data.status);
      }
      setOnlineNums(data.newOnlineNums);
      // ==== 切换全景图 ====
      if (data.panoId && panoId !== data.panoId) {
        // 切题瞬间抑制选点，防止上一题的连点穿透到新题
        suppressPickUntilRef.current = Date.now() + 800;
        confirmInFlightRef.current = false;

        // 设置全景图ID
        const panoData: PanoInfo = {
          panoId: data?.panoId,
          heading: data?.heading,
          source: data?.baiduPano ? 'baidu_pano' : 'google_pano',
          links: [],
          worldSize: null,
          lng: data?.lng ?? 0,
          lat: data?.lat ?? 0,
        };

        // 如果全景图ID等于27，是百度地图
        if (panoData.source === 'baidu_pano') {
          const result = await getPanoInfo({ pano: data.panoId });
          if (result.success) {
            panoData.lng = result?.data.lng; // 设置街景经度
            panoData.lat = result?.data.lat; // 设置街景经度
            panoData.heading = result?.data.centerHeading; // 设置街景朝向
            panoData.worldSize = null; // 设置街景尺寸
            panoData.links = []; // 设置街景链接图
          }
        }

        // 改成多合一
        setPano(panoData); // 设置街景信息

        setPanoId(data.panoId); // 切换街景ID
      }

      setConfirmed(data.confirmed);
      if (data.chooseLat || data.chooseLng) {
        setPickCoord({ latitude: data.chooseLat, longitude: data.chooseLng });
      }

      if (data.status === 'wait') {
        // Wait的时候才设置剩余时间
        setTimeleft(data.timeLeft);

        if (result !== null) {
          setResult(null);
        }
      } else if (data.status === 'wait_result') {
        // Wait的时候才设置剩余时间
        setTimeleft(data.timeLeft);
      } else if (data.status === 'rank') {
        // 判断经纬度不同再更新
        if (
          result === null ||
          data.lng !== result?.target.longitude ||
          data.lat !== result?.target.latitude ||
          data.ranks.length !== result?.ranks.length
        ) {
          setResult({
            target: {
              longitude: data.lng,
              latitude: data.lat,
            },
            ranks: data.ranks.map((rank: any) => ({
              distance: rank.distance,
              longitude: rank.latLng.lng,
              latitude: rank.latLng.lat,
              rank: rank.rank,
              rating: rank.rating,
              ratingChange: rank.ratingChange,
              user: rank.userAO,
            })),
          });
        }
      }
    } else if (data.type === 'need_login') {
      // 需要登录
      history.push('/user/login?redirect=/point');
    } else if (data.type === 'warning') {
      notification.warning({
        message: data.noteMessage,
      });
    } else if (data.type === 'receive_bullet') {
      // 弹幕处理
      setNewDanmu(data.text);
    }
  };

  // 监听消息
  useEffect(() => {
    if (latestMessage) {
      const { data } = latestMessage;
      const message = JSON.parse(data);
      processMessage(message.data);
    }
  }, [latestMessage]);
  // ========= 消息处理 End =========

  // ====== 地图点选操作 Start ======
  // 选择地点
  const onPickLocation = useCallback(
    (lat: number, lng: number) => {
      if (confirmed) return;

      // 切题后短暂忽略选点，防止 ghost click 串到新题
      if (Date.now() < suppressPickUntilRef.current) return;

      // 设置选择的坐标
      setPickCoord({ latitude: lat, longitude: lng });

      sendMessage(
        JSON.stringify({
          scope: 'qixun',
          data: {
            type: 'pin',
            lat,
            lng,
          },
        }),
      );
    },
    [sendMessage, setPickCoord, confirmed],
  );

  // 确认选择
  const onConfirm = useCallback(
    (lat: number, lng: number) => {
      if (confirmInFlightRef.current) return;
      confirmInFlightRef.current = true;

      sendMessage(
        JSON.stringify({
          scope: 'qixun',
          data: {
            type: 'confirm',
            lat,
            lng,
          },
        }),
      );
      setConfirmed(true);
    },
    [sendMessage, setConfirmed],
  );
  // ====== 地图点选操作 End ======

  // ====== 初始化和卸载操作 Start ======
  const start = useCallback(() => {
    connect();

    // 解决息屏、后台后websocket断开的问题
    try {
      document.addEventListener('visibilitychange', wakeUpWebsocket);
    } catch (error) { }
  }, [connect, wakeUpWebsocket]);

  const stop = useCallback(() => {
    disconnect();

    // 退出视图后取消监听
    try {
      document.removeEventListener('visibilitychange', wakeUpWebsocket);
    } catch (error) { }
  }, [disconnect, wakeUpWebsocket]);
  // ====== 初始化和卸载操作 End ======

  return {
    readyState,
    type,
    gameData,
    lastRound,
    start,
    stop,
    sendMessage,
    panoId,
    pano,
    onlineNums,
    status,
    result,
    timeleft,
    newDanmu,
    viewOptions,
    confirmed,
    setConfirmed,
    onPickLocation,
    onConfirm,
    pickCoord,
    setPickCoord,
    roundResult,
  };
};
