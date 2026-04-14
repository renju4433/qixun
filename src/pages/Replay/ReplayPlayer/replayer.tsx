import { Map } from "maplibre-gl";
import { isMobile } from "react-device-detect";
import { message } from "antd";

interface ReplayOptions {
  events: API.RecordItem[];
  panorama: google.maps.StreetViewPanorama | undefined;
  guessMap: Map;
  playSpeed: number;
  timerStartTime: number;
  timerLeftTime: number;
  pinOnMap: (lat: number, lng: number, opacity: number) => void;
  setTeamPins: (userId: number, lat: number, lng: number, opacity: number) => void;
  setTeamHints: (userId: number, lat: number, lng: number) => void;
  setAlarm: (timer: boolean) => void;
  resetSpeed: (speed: number) => void;
  resetSeconds: (seconds: number) => void;
  pauseAndResume: () => void;
  setMapSize: (size: number, active?: boolean) => void;
  setMapShow: (isMapShow: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export const startReplay = ({
  events,
  panorama,
  guessMap,
  playSpeed: initialPlaySpeed,
  timerStartTime,
  timerLeftTime,
  setMapShow,
  setMapSize,
  setAlarm,
  resetSpeed,
  resetSeconds,
  pauseAndResume,
  pinOnMap,
  setTeamPins,
  setTeamHints,
  onStart,
  onEnd,
}: ReplayOptions) => {
  let playSpeed = initialPlaySpeed;

  // 空数组检查
  if (!events || events.length === 0) {
    console.error('回放数据为空');
    return {
      start: () => { },
      stop: () => { },
      pause: () => { },
      resume: () => { },
      seek: () => { },
      fastForward: () => { },
      rewind: () => { },
      changeSpeed: () => { },
    };
  }

  let index = 0;
  let startTime = events[0].time;
  let previousTime = startTime;
  let totalDuration = (events[events.length - 1].time - startTime) / 1000;
  let isPlaying = false;
  let isMapShow = false;
  let normalTime = 0;
  let lastTime = performance.now();
  let animationFrameId: number | null = null;
  let hasMobile = events.some(item => 'MobileMap' === item.action);
  let timerOn = false;

  // 工具函数
  const vwToPx = (vw: number) => (window.innerWidth / 100) * vw;

  const calculateMapSize = (width: number): number => {
    if (width >= vwToPx(65)) return 4;
    if (width >= vwToPx(45)) return 3;
    if (width >= vwToPx(30)) return 2;
    if (width >= vwToPx(16)) return 1;
    return 1;
  };

  const safeParseJSON = (data: string) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('JSON 解析失败:', error, data);
      return null;
    }
  };

  const parseCoords = (data: string, minLength: number = 2) => {
    const parsed = safeParseJSON(data);
    if (parsed && Array.isArray(parsed) && parsed.length >= minLength) {
      return parsed.map(v => parseFloat(v));
    }
    return null;
  };

  // 更新播放时间
  const updateTime = (deltaTime: number) => {
    if (!isPlaying) return;
    normalTime += (deltaTime * playSpeed);
    if (normalTime * 1000 + startTime >= timerStartTime && !timerOn) {
      timerOn = true;
      setAlarm(true);
    }
  };

  // 处理地图大小变化（统一处理 MapSize/MapStyle/MobileMap）
  const handleMapSizeChange = (action: string, data: string) => {
    const mapSizeData = safeParseJSON(data);
    if (mapSizeData === null) return;

    if (action === 'MapSize' && Array.isArray(mapSizeData) && mapSizeData.length >= 2) {
      const [width, height] = mapSizeData;
      if (width !== null && height !== null) {
        if (isMobile) {
          isMapShow = !isMapShow;
          setMapShow(isMapShow);
        } else {
          setMapSize(calculateMapSize(width));
        }
      }
    } else if (typeof mapSizeData === 'number') {
      // MobileMap 事件：无论当前是什么设备，都需要控制 mapShow
      // 因为前端 UI 在 hasMobile 为 true 时依赖 mapShow 来控制地图显示
      if (action === 'MobileMap') {
        const shouldShow = mapSizeData >= 1;
        isMapShow = shouldShow;
        setMapShow(shouldShow);
        // PC 端额外设置地图大小和激活状态
        if (!isMobile) {
          setMapSize(shouldShow ? 2 : 1, shouldShow);
        }
      } else {
        // MapStyle 事件（PC 端录制的）
        if (isMobile) {
          // 手机端查看 PC 录制的回放：控制地图显示/隐藏
          const shouldShow = mapSizeData >= 1;
          isMapShow = shouldShow;
          setMapShow(shouldShow);
        } else {
          // PC 端查看 PC 录制的回放：控制地图大小和激活状态
          // 0 = 地图未激活（小尺寸）
          // 1-4 = 地图激活并使用对应尺寸
          if (mapSizeData === 0) {
            setMapSize(1, false); // 地图未激活
          } else {
            setMapSize(mapSizeData, true); // 地图激活
          }
        }
      }
    }
    guessMap.resize();
  };

  // 应用单个事件（播放和seek都会用到）
  const applySingleEvent = (event: API.RecordItem, useAnimation: boolean = true) => {
    if (!panorama || !guessMap) return;

    const delay = useAnimation ? (event.time - previousTime) / playSpeed : 0;

    try {
      switch (event.action) {
        case 'PanoLocation':
          panorama.setPano(event.data);
          break;

        case 'PanoPov': {
          const coords = parseCoords(event.data);
          if (coords) panorama.setPov({ heading: coords[0], pitch: coords[1] });
          break;
        }

        case 'PanoZoom': {
          const zoom = parseFloat(safeParseJSON(event.data));
          if (!isNaN(zoom)) panorama.setZoom(zoom);
          break;
        }

        case 'MapView': {
          const coords = parseCoords(event.data);
          if (coords) {
            const method = useAnimation ? 'flyTo' : 'jumpTo';
            guessMap[method]({ center: [coords[1], coords[0]] });
          }
          break;
        }

        case 'MapZoom': {
          const coords = parseCoords(event.data, 3);
          if (coords) {
            const options: any = {
              zoom: coords[2],
              center: [coords[1], coords[0]],
            };
            if (useAnimation) {
              options.duration = delay / 1000;
              options.essential = true;
              guessMap.flyTo(options);
            } else {
              guessMap.jumpTo(options);
            }
          }
          break;
        }

        case 'MapSize':
        case 'MapStyle':
        case 'MobileMap':
          handleMapSizeChange(event.action, event.data);
          break;

        case 'Pin': {
          const coords = parseCoords(event.data);
          if (coords) pinOnMap(coords[0], coords[1], 0.8);
          break;
        }

        case 'Confirm': {
          const coords = parseCoords(event.data);
          if (coords) {
            pinOnMap(coords[0], coords[1], 1);
            index = events.length;
          }
          break;
        }

        case 'TeammatePin': {
          const pin = parseCoords(event.data, 3);
          if (pin) setTeamPins(pin[0], pin[1], pin[2], 0.5);
          break;
        }

        case 'TeammateConfirm': {
          const pin = parseCoords(event.data, 3);
          if (pin) setTeamPins(pin[0], pin[1], pin[2], 1);
          break;
        }

        case 'TeammateHint': {
          const pin = parseCoords(event.data, 3);
          if (pin) setTeamHints(pin[0], pin[1], pin[2]);
          break;
        }

        case 'Switch':
          if (event.data === 'out') message.loading('用户切屏中', 0);
          else message.destroy();
          break;
      }
    } catch (error) {
      console.error('处理事件失败:', error, event);
    }
  };

  // 应用下一个事件（正常播放）
  const applyNextEvent = () => {
    if (index >= events.length) {
      // 停止播放
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      pauseAndResume();
      isPlaying = false;
      message.destroy();
      setAlarm(false);
      timerOn = false;
      if (onEnd) onEnd();
      return;
    }

    const event = events[index];
    const timeDifference = (event.time - startTime) / 1000 - normalTime;

    if (timeDifference <= 0) {
      applySingleEvent(event, true);
      previousTime = event.time;
      index++;
    }
  };

  // 游戏主循环
  const gameLoop = () => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;

    if (deltaTime > 0) {
      applyNextEvent();
      updateTime(deltaTime);
      lastTime = currentTime;
    }

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  };

  // 跳转到指定时间（简化版）
  const seek = (value: number) => {
    normalTime = value;
    const targetTime = normalTime * 1000 + startTime;
    const newIndex = events.findIndex((event) => event.time >= targetTime);
    index = newIndex !== -1 ? newIndex : events.length;

    // 重置状态
    if (isMobile || hasMobile) {
      isMapShow = false;
      setMapShow(false);
    } else {
      setMapSize(1, false); // 重置为未激活状态
    }
    pinOnMap(0, 0, 0);

    // 重建状态：遍历并应用所有事件到目标时间
    for (let i = 0; i < index; i++) {
      applySingleEvent(events[i], false);
    }

    // 更新计时器
    if (targetTime < timerStartTime) {
      setAlarm(false);
      timerOn = false;
    } else {
      setAlarm(true);
      timerOn = true;
      const newTimerLeftTime = Math.abs(Math.abs(targetTime - timerStartTime) / 1000 - timerLeftTime);
      resetSeconds(newTimerLeftTime);
    }
  };

  const start = () => {
    if (!isPlaying) {
      isPlaying = true;
      if (onStart) onStart();
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  };

  const pause = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    pauseAndResume();
    isPlaying = false;
  };

  const resume = () => {
    if (!isPlaying) {
      isPlaying = true;
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(gameLoop);
      pauseAndResume();
    }
  };

  const fastForward = () => {
    normalTime += 5;
    if (normalTime > totalDuration) normalTime = totalDuration;
    seek(normalTime);
  };

  const rewind = () => {
    normalTime -= 5;
    if (normalTime < 0) normalTime = 0;
    seek(normalTime);
  };

  const changeSpeed = (speed: number) => {
    playSpeed = speed;
    resetSpeed(speed);
  };

  const stop = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    isPlaying = false;
    setAlarm(false);
    timerOn = false;
    message.destroy();
  };

  return {
    start,
    stop,
    pause,
    resume,
    seek,
    fastForward,
    rewind,
    changeSpeed,
  };
};
