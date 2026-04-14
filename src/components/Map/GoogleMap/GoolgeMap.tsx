import detect from '@/components/Admin/detect';
import Countdown from '@/components/Game/Countdown';
import ChallengeCountdown from '@/components/Game/Countdown/Challenge';
import DamageMultiple from '@/components/Game/DamageMultiple';
import SendBox from '@/components/Game/Danmu/SendBox';
import HealthBar from '@/components/Game/HealthBar';
import UidVersionBar from '@/components/Game/UidVersionBar';
import Loading from '@/components/Game/Loading';
import OnlineMember from '@/components/Game/OnlineMember';
import RoundInfo from '@/components/Game/RoundInfo';
import HeaderLogo from '@/components/Header/Logo';
import BaiduLogo from '@/components/Map/GoogleMap/BaiduLogo';
import {
  getCustomPanoramaTileUrl,
  getQQPanoramaTileUrl,
  preloadImage,
  preloadQQImage,
} from '@/components/Map/GoogleMap/common';
import {
  gameAgain,
  getPanoInfo,
  getQQPanoInfo,
  reportErrorPano,
} from '@/services/api';
import { settings } from '@/services/valtio';
import { qixunGoHome } from '@/utils/HisotryUtils';
import {
  CommentOutlined,
  CompassOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { BiCurrentLocation } from '@react-icons/all-files/bi/BiCurrentLocation';
import { BiFlag } from '@react-icons/all-files/bi/BiFlag';
import { BiLocationPlus } from '@react-icons/all-files/bi/BiLocationPlus';
import { BiRedo } from '@react-icons/all-files/bi/BiRedo';
import { RxRulerHorizontal } from '@react-icons/all-files/rx/RxRulerHorizontal';
import { history, useModel, useSearchParams, useSnapshot } from '@umijs/max';
import { useFullscreen, useKeyPress } from 'ahooks';
import { Button, Col, Divider, Modal, Row, Space, Spin, Switch } from 'antd';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isMobile } from 'react-device-detect';
import ClassicCompass from '../ClassicCompass';
import Compass from '../Compass';
import { PanoramaEventHandler } from './PanoramaEventHandler';
import styles from './style.less';

type GoogleMapProps = {
  model: CompetitionModel;
};

// heading数组
let headingMap: Record<string, number> = {};
let locationgMap: Record<string, { lat: number; lng: number }> = {};

const GoogleMap: FC<GoogleMapProps> = ({ model }) => {
  const [searchParams] = useSearchParams();
  const fromChallengeHub = searchParams.get('fromHub') === '1';

  // 接入模型
  const {
    lastRound,
    timerStartTime,
    pano,
    confirmed,
    player,
    viewOptions,
    status,
    type,
    roundResult,
    gameData,
    currentRound,
  } = useModel(model, (model) => ({
    pano: model.pano,
    viewOptions: model.viewOptions,
    status: model.status,
    confirmed: model.confirmed,
    type: model.type,
    player: model?.gameData?.player,
    timerStartTime: model?.gameData?.timerStartTime,
    lastRound: model?.lastRound,
    roundResult: model.roundResult,
    gameData: model.gameData,
    currentRound: model.gameData?.currentRound,
  }));

  // 接入全景路由模型
  const {
    onPanoLocationChange,
    hasPrevLocation,
    getPrevLocation,
    onReturnToPrevLocation,
    clearHistory,
  } = useModel('PanoLocationHistory');

  // 全景实例
  const [viewer, setViewer] = useState<google.maps.StreetViewPanorama>();

  //监听器实例
  const [panoramaHandler, setPanoramaHandler] = useState<
    PanoramaEventHandler | undefined
  >(undefined);

  // 跟踪已初始化的回合，避免重复初始化
  const initializedRoundRef = useRef<number | null>(null);

  // Loading状态
  const [spinning, setSpinning] = useState<boolean>(false);
  // 报警
  const [alarm, setAlarm] = useState<boolean>(false);

  // 设置相关状态
  const [settingModal, setSettingModal] = useState<boolean>(false);
  const settingData = useSnapshot(settings);

  const [isFullscreen, { toggleFullscreen }] = useFullscreen(document.body);

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  // 检查点
  const [checkpoint, setCheckpoint] = useState<{
    panoId: string;
    heading: number;
    pitch: number;
  }>();

  // ====== 比赛设置处理 Start ======
  const toggleClassicCompass = (checked: boolean) => {
    settings.classicCompass = checked;
  };
  const toggleNewCompass = (checked: boolean) => {
    settings.newCompass = checked;
  };
  const toggleDanmu = (checked: boolean) => {
    settings.danmu = checked;
  };
  // ====== 比赛设置处理 End ======

  // ====== 自定义Pano Start ======
  // 百度TileURL处理函数

  /**
   * 设置自定义Pano（百度地图，棋寻）
   * @param panoId
   * @returns
   */
  const getCustomPanorama = useCallback(
    (
      panoId: string,
      h: Record<string, number>,
      l: Record<string, { lat: number; lng: number }>,
    ) => {
      // 百度地图处理
      if (pano?.source === 'baidu_pano') {
        return {
          location: {
            pano: panoId,
            latLng: l[panoId]
              ? new google.maps.LatLng(l[panoId].lat, l[panoId].lng)
              : new google.maps.LatLng(pano.lat, pano.lng),
          },
          links: panoId === pano.panoId ? pano.links : [], // 如果是初始Pano，使用初始Links
          copyright: 'baidu',
          tiles: {
            tileSize: new google.maps.Size(512, 512),
            worldSize: new google.maps.Size(8192, 4096),
            centerHeading: h[panoId] ?? pano.heading ?? 0,
            getTileUrl: getCustomPanoramaTileUrl,
          },
        };
      } else if (pano?.source === 'qq_pano') {
        return {
          location: {
            pano: panoId,
            latLng: l[panoId]
              ? new google.maps.LatLng(l[panoId].lat, l[panoId].lng)
              : new google.maps.LatLng(pano.lat, pano.lng),
          },
          links: panoId === pano.panoId ? pano.links : [], // 如果是初始Pano，使用初始Links
          copyright: 'qq',
          tiles: {
            tileSize: new google.maps.Size(512, 512),
            worldSize: new google.maps.Size(8192, 4096),
            centerHeading: h[panoId] ?? pano.heading ?? 0,
            getTileUrl: getQQPanoramaTileUrl,
          },
        };
      }
      return null;
    },
    [pano?.source],
  );
  // ====== 自定义Pano End ======

  // ====== 初始化 Pano Start ======
  // 初始化Viewer
  const initPanoViewer = useCallback(
    (panoId?: string) => {
      // 初始化Viewer
      const panorama = new google.maps.StreetViewPanorama(
        document.getElementById('viewer')!,
        {
          pano: panoId ?? null,
          fullscreenControl: false,
          panControl: true,
          disableDoubleClickZoom: true,
          linksControl: true,
          addressControl: false,
          imageDateControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          showRoadLabels: false,
          zoomControl: false,
          visible: false,
        },
      );

      // Pano状态改变事件监听
      panorama.addListener('status_changed', () => {
        // === 移除Goolge Logo和Report Start ===
        document
          .getElementById('viewer')
          ?.querySelectorAll(
            'a[href*="google.com/maps"], a[href*="google.com/cbk"]',
          )
          .forEach((e) => {
            if (e.parentNode) e.parentNode.removeChild(e);
          });
        document
          .getElementById('viewer')
          ?.querySelector(".gm-style-cc a[title*='Google']")
          ?.parentElement?.parentElement?.parentElement?.remove();

        // 罗盘移除
        document
          ?.querySelectorAll<HTMLDivElement>('.gm-bundled-control-on-bottom')
          ?.forEach((e) => {
            if (e.parentNode) {
              e.parentNode.removeChild(e);
            }
          });
        // === 移除Goolge Logo和Report End ===

        if (panorama.getStatus() === google.maps.StreetViewStatus.OK) {
          setSpinning(false);

          // 更新PanoLocationHistory
          const currentPanoPov = panorama.getPov();
          const currentPanoId = panorama.getPano();
          const currentPosition = panorama.getPosition();
          if (currentPosition) {
            onPanoLocationChange({
              panoId: currentPanoId,
              ...currentPanoPov,
            });
          }
        } else {
          // 汇报错误
          reportErrorPano({
            panoId: panorama.getPano(),
            status: panorama.getStatus(),
            page: 'qixun_home',
          });
        }
      });

      // 街景切换事件监听
      panorama.addListener('pano_changed', async () => {
        setSpinning(false);

        // 获取当前全景图
        const currentPanoId = panorama.getPano();

        // 更新Links
        if (currentPanoId && currentPanoId.length === 27) {
          const result = await getPanoInfo({ pano: currentPanoId });

          // 暂存坐标
          locationgMap[currentPanoId] = {
            lat: result.data.lat,
            lng: result.data.lng,
          };

          // 暂存CenterHeading
          result.data.links.forEach((link) => {
            if (link.pano && !headingMap[link.pano]) {
              headingMap[link.pano] = link.centerHeading;
              preloadImage(link.pano);
            }
          });
          panorama?.setLinks(result.data.links);
        } else if (currentPanoId && currentPanoId.length === 23) {
          const result = await getQQPanoInfo({ pano: currentPanoId });

          // 暂存坐标
          locationgMap[currentPanoId] = {
            lat: result.data.lat,
            lng: result.data.lng,
          };

          // 暂存CenterHeading
          result.data.links.forEach((link) => {
            if (link.pano && !headingMap[link.pano]) {
              headingMap[link.pano] = link.centerHeading;
              preloadQQImage(link.pano);
            }
          });
          panorama?.setLinks(result.data.links);
        }
      });

      // 积分赛模式下直接注册PanoProvider，不再分开
      // if (type && type === 'point') {
      //   panorama.registerPanoProvider((panoId) => {
      //     if (panoId.length === 27) {
      //       return {
      //         location: {
      //           pano: panoId,
      //         },
      //         links: [], // 如果是初始Pano，使用初始Links
      //         copyright: 'baidu',
      //         tiles: {
      //           tileSize: new google.maps.Size(512, 512),
      //           worldSize: new google.maps.Size(8192, 4096),
      //           centerHeading: headingMap[panoId] ?? 0,
      //           getTileUrl: getCustomPanoramaTileUrl,
      //         },
      //       };
      //     }
      //     return null;
      //   });
      // }

      return panorama;
    },
    [model],
  );

  useEffect(() => {
    // 初始化街景事件监听器 PanoramaEventHandler
    if (!panoramaHandler) {
      const handler = new PanoramaEventHandler();
      setPanoramaHandler(handler); // 设置 panoramaHandler
    }

    // 初始化Viewer
    const panorama = initPanoViewer();
    setViewer(panorama);

    // 卸载组件操作
    return () => {
      // 卸载Viewer
      if (viewer) {
        google?.maps.event.clearInstanceListeners(viewer);
        google?.maps.event.clearInstanceListeners(window);
        google?.maps.event.clearInstanceListeners(document);
        viewer.unbindAll();
        setViewer(undefined);
        if (panoramaHandler) {
          // 强制停止自动保存，确保数据立即写入缓存
          panoramaHandler.stopAutoSave();

          // 尝试异步上传，但不阻塞组件卸载
          if (currentRound) {
            panoramaHandler.uploadData(currentRound, gameData?.id).catch(err => {
              console.error('[GoogleMap] Upload on unmount failed, data cached:', err);
            });
          }

          panoramaHandler.removeAllListeners();
          panoramaHandler.clearEvents();
          setPanoramaHandler(undefined);
        }
      }

      const viewerElement = document.getElementById('viewer');
      if (viewerElement) {
        viewerElement.innerHTML = ''; // 清空内容
      }

      // 清空历史记录
      clearHistory();

      // 清空headingMap
      headingMap = {};
      // 清空locationgMap
      locationgMap = {};
    };
  }, []);

  //根据猜测状态添加街景事件变化监听器
  useEffect(() => {
    // 只在需要录制时才处理
    const shouldRecord = gameData?.type === 'daily_challenge' || gameData?.record;
    if (!panoramaHandler || !shouldRecord) return;

    // 如果 confirmed 为 true，停止事件监听并输出所有事件数据
    if (confirmed) {
      if (currentRound) {
        panoramaHandler.uploadData(currentRound, gameData?.id).catch(err => {
          console.error('[GoogleMap] Upload on confirm failed, data cached:', err);
        });
      }
      panoramaHandler.removeAllListeners();
      initializedRoundRef.current = null; // 重置初始化标记
      // clearEvents 不需要调用：uploadData 成功会自动删除该轮数据，失败则保留以便重试
    } else {
      // 如果 confirmed 为 false 且 viewer 存在，开始注册事件监听器
      if (viewer && currentRound) {
        // 检查是否是新回合或回合发生变化
        if (initializedRoundRef.current !== currentRound) {
          // 先移除旧的监听器（防止重复注册）
          panoramaHandler.removeAllListeners();

          // 设置全景目标并初始化回合
          panoramaHandler.setTarget(viewer);
          panoramaHandler.initRound(currentRound, gameData?.id);
          panoramaHandler.addListeners();

          // 标记该回合已初始化
          initializedRoundRef.current = currentRound;
        }
      }
    }
  }, [confirmed, viewer, currentRound, gameData?.type, gameData?.record, gameData?.id, panoramaHandler]);

  useEffect(() => {
    if (alarm && panoramaHandler) {
      panoramaHandler.recordEvent('Alarm', gameData?.type);
    }
  }, [alarm]);

  // 添加浏览器关闭/刷新保护
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (panoramaHandler && currentRound && !confirmed) {
        const hasRecords = panoramaHandler.hasRecords();
        if (hasRecords) {
          // 强制停止自动保存，确保数据立即缓存
          panoramaHandler.stopAutoSave();
          // 尝试快速上传（可能不会完成）
          panoramaHandler.uploadData(currentRound, gameData?.id).catch(() => { });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [panoramaHandler, currentRound, gameData?.id, confirmed]);

  // ====== 初始化 Pano End ======

  // ====== 设置Pano Start ======
  // 处理无车模式shader更新
  useEffect(() => {
    if (gameData?.noCar) {
      if (!pano?.panoId) {
        return;
      }
      // 检查是否已经注入过无车模式脚本
      if (!(window as any).__noCarModeInjected) {
        // 标记已注入
        (window as any).__noCarModeInjected = true;

        // 注入无车模式脚本
        const script = document.createElement('script');
        const scriptContent = pano?.panoId.length === 27 ? `
        function injected() {
    const vertexOld = "const float f=3.1415926;varying vec3 a;uniform vec4 b;attribute vec3 c;attribute vec2 d;uniform mat4 e;void main(){vec4 g=vec4(c,1);gl_Position=e*g;a=vec3(d.xy*b.xy+b.zw,1);a*=length(c);}";
    const fragOld = "precision highp float;const float h=3.1415926;varying vec3 a;uniform vec4 b;uniform float f;uniform sampler2D g;void main(){vec4 i=vec4(texture2DProj(g,a).rgb,f);gl_FragColor=i;}";
    const vertexNew = \`
          varying vec3 a;
          varying vec3 potato;
          uniform vec4 b;
          attribute vec3 c;
          attribute vec2 d;
          uniform mat4 e;
           
          void main(){
              vec4 g=vec4(c,1);
              gl_Position=e*g;
              a = vec3(d.xy * b.xy + b.zw,1);
              a *= length(c);
              potato = vec3(d.xy, 1.0) * length(c);
          }\`;
        const fragNew = \`
          precision highp float;
          const float h=3.1415926;
          varying vec3 a;
          varying vec3 potato;
          uniform vec4 b;
          uniform float f;
          uniform sampler2D g;
          void main(){

          vec2 aD = potato.xy / a.z;
          float thetaD = aD.y;

          float thresholdD1 = 0.6;
          float thresholdD2 = 0.7;

          float thresholdD1S = 0.8;
          float thresholdD2S = 0.9;

          float x = aD.x;
          float y = abs(4.0*x - 2.0);
          float phiD = smoothstep(1.0, 0.0, y > 1.0 ? 2.0 - y : y);

          vec4 i = vec4(
            thetaD > mix(thresholdD1, thresholdD2, phiD)
            ? (thetaD > mix(thresholdD1S, thresholdD2S, phiD) ? vec3(float(0), float(0), float(0)) : vec3(float(0.5), float(0.5), float(0.5)))
            : texture2DProj(g,a).rgb
          ,f);
          gl_FragColor=i;
          }\`;

        function installShaderSource(ctx) {
          const oldShaderSource = ctx.shaderSource;
          function shaderSource() {
            if (typeof arguments[1] === 'string') {
              if (arguments[1] === vertexOld) arguments[1] = vertexNew;
              else if (arguments[1] === fragOld) arguments[1] = fragNew;
            }
            return oldShaderSource.apply(this, arguments);
          }
          shaderSource.bestcity = 'bintulu';
          ctx.shaderSource = shaderSource;
        }
        
        function installGetContext(el) {
          const oldGetContext = el.getContext;
          el.getContext = function () {
            const ctx = oldGetContext.apply(this, arguments);
            if ((arguments[0] === 'webgl' || arguments[0] === 'webgl2') && ctx && ctx.shaderSource && ctx.shaderSource.bestcity !== 'bintulu') {
              installShaderSource(ctx);
            }
            return ctx;
          };
        }
        
        const oldCreateElement = document.createElement;
        document.createElement = function () {
          const el = oldCreateElement.apply(this, arguments);
          if (arguments[0] === 'canvas' || arguments[0] === 'CANVAS') {
            installGetContext(el);
          }
          return el;
        };
        }
        injected();`
          : `
        function injected() {
    const vertexOld = "const float f=3.1415926;varying vec3 a;uniform vec4 b;attribute vec3 c;attribute vec2 d;uniform mat4 e;void main(){vec4 g=vec4(c,1);gl_Position=e*g;a=vec3(d.xy*b.xy+b.zw,1);a*=length(c);}";
    const fragOld = "precision highp float;const float h=3.1415926;varying vec3 a;uniform vec4 b;uniform float f;uniform sampler2D g;void main(){vec4 i=vec4(texture2DProj(g,a).rgb,f);gl_FragColor=i;}";
    const vertexNew = \`
          varying vec3 a;
          varying vec3 potato;
          uniform vec4 b;
          attribute vec3 c;
          attribute vec2 d;
          uniform mat4 e;
           
          void main(){
              vec4 g=vec4(c,1);
              gl_Position=e*g;
              a = vec3(d.xy * b.xy + b.zw,1);
              a *= length(c);
              potato = vec3(d.xy, 1.0) * length(c);
          }\`;
        const fragNew = \`
          precision highp float;
          const float h=3.1415926;
          varying vec3 a;
          varying vec3 potato;
          uniform vec4 b;
          uniform float f;
          uniform sampler2D g;
          void main(){
              vec2 aD = potato.xy / a.z;
              float thetaD = aD.y;
              float thresholdD1 = 0.6;
              float thresholdD2 = 0.7;
              float x = aD.x;
              float y = abs(4.0*x - 2.0);
              float phiD = smoothstep(0.0, 1.0, y > 1.0 ? 2.0 - y : y);
              vec4 i = vec4(thetaD > mix(thresholdD1, thresholdD2, phiD) ? vec3(float(0.5), float(0.5), float(0.5)) : texture2DProj(g,a).rgb , f);
              gl_FragColor=i;
          }\`;

        function installShaderSource(ctx) {
          const oldShaderSource = ctx.shaderSource;
          function shaderSource() {
            if (typeof arguments[1] === 'string') {
              if (arguments[1] === vertexOld) arguments[1] = vertexNew;
              else if (arguments[1] === fragOld) arguments[1] = fragNew;
            }
            return oldShaderSource.apply(this, arguments);
          }
          shaderSource.bestcity = 'bintulu';
          ctx.shaderSource = shaderSource;
        }
        
        function installGetContext(el) {
          const oldGetContext = el.getContext;
          el.getContext = function () {
            const ctx = oldGetContext.apply(this, arguments);
            if ((arguments[0] === 'webgl' || arguments[0] === 'webgl2') && ctx && ctx.shaderSource && ctx.shaderSource.bestcity !== 'bintulu') {
              installShaderSource(ctx);
            }
            return ctx;
          };
        }
        
        const oldCreateElement = document.createElement;
        document.createElement = function () {
          const el = oldCreateElement.apply(this, arguments);
          if (arguments[0] === 'canvas' || arguments[0] === 'CANVAS') {
            installGetContext(el);
          }
          return el;
        };
      }
      injected();`;
        script.textContent = scriptContent;
        document.body.appendChild(script);
        script.remove();
      }
    } else {
      // 非无车模式，正常初始化
      if ((window as any).__noCarModeInjected) {
        delete (window as any).__noCarModeInjected;
        const viewer = document.getElementById('viewer');
        if (viewer) {
          viewer.innerHTML = '';
          const panorama = initPanoViewer(pano?.panoId);
          setViewer(panorama);
        }
      }
    }
  }, [gameData?.noCar, pano?.panoId]);

  // 组件卸载时清理无车模式标记
  useEffect(() => {
    return () => {
      // 组件卸载时移除全局标记，允许下次游戏重新注入
      if ((window as any).__noCarModeInjected) {
        delete (window as any).__noCarModeInjected;
      }
    };
  }, []);

  useEffect(() => {
    if (viewer && pano?.panoId) {
      // 清空历史记录
      clearHistory();

      // 取消报警
      setAlarm(false);

      if (
        pano.source === 'qixun_pano' ||
        pano.source === 'baidu_pano' ||
        pano.source === 'qq_pano'
      ) {
        // 如果没有PanoProvider，设置PanoProvider
        // if (!viewer.get('panoProvider')) {
        // 设置自定义Pano（百度地图或棋寻）
        viewer.registerPanoProvider(
          (panoId) => getCustomPanorama(panoId, headingMap, locationgMap),
          {
            cors: true,
          },
        );
        // }

        // 初次加载，定义Links Heading
        headingMap[pano.panoId] = pano.heading ?? 0;
        pano.links.forEach((link) => {
          if (link.pano && link.centerHeading) {
            headingMap[link.pano] = link.centerHeading;
            if (pano.source === 'qq_pano') {
              preloadQQImage(link.pano);
            } else if (pano.source === 'baidu_pano') {
              preloadImage(link.pano);
            }
          }
        });
      } else {
        // 如果没有PanoProvider，设置PanoProvider
        if (viewer.get('panoProvider')) {
          // 非百度地图或棋寻，清空自定义Pano Provider
          viewer.unbindAll();

          // TODO: 临时处理等待更优雅的处理方式
          // 重新初始化Viewer
          const panorama = initPanoViewer(pano.panoId);
          // 百度→谷歌切换时，panorama 异步加载可能覆盖 POV，需在加载完成后重新应用视角
          const heading = viewOptions?.heading ?? 0;
          const pitch = viewOptions?.pitch ?? 0;
          const zoom = viewOptions?.zoom ?? 0;
          let povListener: google.maps.MapsEventListener;
          povListener = panorama.addListener('status_changed', () => {
            if (panorama.getStatus() === google.maps.StreetViewStatus.OK) {
              panorama.setPov({ heading, pitch });
              panorama.setZoom(zoom);
              google.maps.event.removeListener(povListener);
            }
          });
          setViewer(panorama);
          // 因为会自动调用useEfffect，所以这里直接返回
          return;
        }
      }

      // 设置PanoId
      if (pano.panoId !== viewer.getPano()) {
        // 换图 （增加延迟测试换图问题）
        setTimeout(() => {
          viewer.setPano(pano.panoId);
          // 还原缩放
          viewer.setZoom(viewOptions?.zoom ?? 0);

          // 切换Pano时清空检查点
          setCheckpoint(undefined);
        }, 100);
      }

      // 设置显示
      if (!viewer.getVisible()) viewer.setVisible(true);
    }
  }, [viewer, pano?.panoId, viewOptions]);

  useEffect(() => {
    if (
      pano &&
      lastRound &&
      !lastRound.endTime &&
      gameData &&
      gameData.blinkTime
    ) {
      const roundStart = lastRound.startTime;
      const viewer = document.getElementById("viewer");
      if (!viewer) return;

      viewer.style.zIndex = "-1";
      if (roundStart && roundStart + gameData.blinkTime + 1500 < Date.now()) return;

      let elapsedTime = 0;
      const totalBlinkTime = 1500 + gameData.blinkTime;
      const interval = setInterval(() => {
        elapsedTime += 100;

        if (elapsedTime >= 1500) {
          viewer.style.zIndex = "";
        }

        if (elapsedTime >= totalBlinkTime) {
          viewer.style.zIndex = "-1";
          clearInterval(interval);
        }
      }, 100);

      return () => {
        clearInterval(interval);
      };
    }
  }, [pano, viewer]);


  // ====== 设置Pano End ======

  // ====== 可移动相关操作 Start ======
  /**
   * 返回起点
   */
  const returnToStart = useCallback(() => {
    if (viewer && pano?.panoId) {
      // 更改街景ID
      if (viewOptions?.move) viewer.setPano(pano.panoId);
      // 设置Pov
      if (viewOptions?.pan) {
        viewer.setPov({
          heading: viewOptions?.heading ?? 0,
          pitch: viewOptions?.pitch ?? 0,
        });
        viewer.setZoom(viewOptions?.zoom ?? 0);
      }
    }
  }, [viewer, pano?.panoId, viewOptions]);

  /**
   * 返回上个位置
   */
  const handleReturnToPrevLocation = useCallback(() => {
    if (viewer) {
      const prevLocation = getPrevLocation();
      if (prevLocation) {
        viewer.setPano(prevLocation.panoId);
        viewer.setPov({
          heading: prevLocation.heading,
          pitch: prevLocation.pitch,
        });
        onReturnToPrevLocation();
      }
    }
  }, [getPrevLocation, onReturnToPrevLocation, viewer]);

  /**
   * 添加检查点
   */
  const handleSetCheckpoint = useCallback(() => {
    if (viewer) {
      const pov = viewer.getPov();
      setCheckpoint({
        panoId: viewer.getPano(),
        heading: pov.heading ?? 0,
        pitch: pov.pitch ?? 0,
      });
    }
  }, [viewer]);

  /**
   * 返回检查点
   */
  const handleReturnToCheckpoint = useCallback(() => {
    if (viewer && checkpoint) {
      viewer.setPano(checkpoint.panoId);
      viewer.setPov({
        heading: checkpoint.heading,
        pitch: checkpoint.pitch,
      });
      setCheckpoint(undefined);
    }
  }, [viewer, checkpoint]);

  /**
   * 一键指北
   */
  const t = useRef(false); // 控制动画是否进行中
  const n = useRef(0); // 用于跟踪动画的时间戳

  const animatePovNorth = useCallback(() => {
    if (!viewer || !viewOptions?.pan) return;

    // 初始化新的动画状态
    const startTime = new Date().getTime();
    n.current = startTime;

    const currentPov = viewer.getPov();
    const currentZoom = viewer.getZoom();

    const isHeadingZero = currentPov.heading % 360 === 0 || t.current;
    const targetPov = {
      heading: 0,
      pitch: isHeadingZero ? -89 : currentPov.pitch,
    };

    // 计算最短旋转角度
    if (Math.abs(targetPov.heading - currentPov.heading) > 180) {
      targetPov.heading += 360;
    }

    const transitionDuration =
      4 * Math.max(Math.abs(targetPov.heading - currentPov.heading), 100);
    let previousTimestamp: number | null = null;

    // 动画更新函数
    const updatePov = (timestamp: number) => {
      if (n.current !== startTime) return; // 如果时间戳不匹配，跳过
      if (!previousTimestamp) previousTimestamp = timestamp;

      const progress = Math.min(
        (timestamp - previousTimestamp) / transitionDuration,
        1,
      );
      const easing = 1 - Math.pow(1 - progress, 3);

      const newHeading =
        currentPov.heading + (targetPov.heading - currentPov.heading) * easing;
      const newPitch =
        currentPov.pitch + (targetPov.pitch - currentPov.pitch) * easing;

      viewer.setPov({ heading: newHeading, pitch: newPitch });

      // Zoom transition
      viewer.setZoom(currentZoom + (0 - currentZoom) * easing);

      if (progress < 1) {
        requestAnimationFrame(updatePov);
      } else {
        t.current = false; // 动画完成后，允许新的动画开始
      }
    };

    t.current = true; // 标记当前动画正在进行
    requestAnimationFrame(updatePov);
  }, [viewer, viewOptions]);

  useKeyPress('N', animatePovNorth);

  // ====== 可移动相关操作 End ======

  // ====== 设置可移动 Start ======
  useEffect(() => {
    const canvas = document.getElementById('viewer');
    if (!canvas) return;

    // 屏蔽快捷键
    const keyboardShortcuts = (event: KeyboardEvent) => {
      if (viewOptions?.move && viewOptions?.pan) return true;

      // key转换成小写
      const key = event.key.toLowerCase();
      if (
        // 不能移动情况
        (!viewOptions?.move &&
          ['arrowup', 'arrowdown', 'w', 's', 'numpad8', 'numpad2'].includes(
            key,
          )) ||
        // 不能转动视角情况
        (!viewOptions?.pan &&
          [
            'arrowleft',
            'arrowright',
            'a',
            'd',
            'numpad4',
            'numpad6',
            '+',
            '-',
          ].includes(key))
      ) {
        event.stopPropagation();
        return false;
      }
    };

    canvas.addEventListener('keydown', keyboardShortcuts, {
      capture: true,
    });

    // 设置可移动
    if (viewer) {
      viewer.setOptions({
        linksControl: !!viewOptions?.move,
        clickToGo: !!viewOptions?.move,
        disableDoubleClickZoom: !viewOptions?.pan,
        scrollwheel: viewOptions?.pan,
      });
    }

    return () => {
      canvas.removeEventListener('keydown', keyboardShortcuts, {
        capture: true,
      });
    };
  }, [viewer, viewOptions?.move, viewOptions?.pan, spinning]);

  // 设置目标点点等操作
  useEffect(() => {
    const keyboardShortcuts = (event: KeyboardEvent) => {
      // 返回起点按键
      if (['R', 'r'].includes(event.key)) returnToStart();

      if (!viewOptions?.move) return;

      // 设置检查点按键
      if (['C', 'c'].includes(event.key)) {
        if (checkpoint) handleReturnToCheckpoint();
        else handleSetCheckpoint();
      }

      // 返回起点按键
      if (['Z', 'z'].includes(event.key)) handleReturnToPrevLocation();

      return true;
    };

    window.addEventListener('keydown', keyboardShortcuts, {
      capture: true,
    });

    return () => {
      window.removeEventListener('keydown', keyboardShortcuts, {
        capture: true,
      });
    };
  }, [
    viewOptions?.move,
    checkpoint,
    spinning,
    panoramaHandler,
    hasPrevLocation,
    pano,
  ]);
  // ====== 设置可移动 End ======

  // ====== 设置固定视角 Start ======
  useEffect(() => {
    const canvas = document.getElementById('viewer');
    if (!canvas) return;

    const mouseEvent = (event: Event) => {
      if (!viewOptions?.pan) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    };

    canvas.addEventListener('mousedown', mouseEvent, {
      capture: true,
      passive: true,
    });

    canvas.addEventListener('mousemove', mouseEvent, {
      capture: true,
      passive: true,
    });

    canvas.addEventListener('pointerdown', mouseEvent, {
      capture: true,
      passive: true,
    });

    canvas.addEventListener('pointermove', mouseEvent, {
      capture: true,
      passive: true,
    });

    canvas.addEventListener('touchdown', mouseEvent, {
      capture: true,
      passive: true,
    });

    canvas.addEventListener('touchmove', mouseEvent, {
      capture: true,
      passive: true,
    });

    return () => {
      canvas.removeEventListener('mousedown', mouseEvent, {
        capture: true,
      });

      canvas.removeEventListener('mousemove', mouseEvent, {
        capture: true,
      });

      canvas.removeEventListener('pointerdown', mouseEvent, {
        capture: true,
      });

      canvas.removeEventListener('pointermove', mouseEvent, {
        capture: true,
      });

      canvas.removeEventListener('touchdown', mouseEvent, {
        capture: true,
      });

      canvas.removeEventListener('touchmove', mouseEvent, {
        capture: true,
      });
    };
  }, [spinning, viewer, viewOptions?.pan]);
  // ====== 设置固定视角 End ======

  // ====== 设置视角方向 Start ======
  // 仅在切换回合/街景时设置初始 POV 和 Zoom，避免 nopan nozoom 模式下百度/谷歌街景切换时视角未正确调整
  // 注意：不能把 viewOptions 放入依赖，否则每次父组件重渲染传入新对象引用时会重复执行，导致用户转动视角时被强制拉回正北
  useEffect(() => {
    if (viewer && pano?.panoId && viewOptions) {
      viewer.setPov({
        heading: viewOptions.heading ?? 0,
        pitch: viewOptions.pitch ?? 0,
      });
      viewer.setZoom(viewOptions.zoom ?? 0);
    }
  }, [viewer, pano?.panoId]);
  // ====== 设置视角方向 End ======

  useEffect(() => {
    if (status === 'rank') setSpinning(true);
    if (status === 'finish') {
      if (panoramaHandler) {
        const hasRecords = panoramaHandler.hasRecords();
        if (currentRound && hasRecords) {
          panoramaHandler.uploadData(currentRound, gameData?.id).catch(err => {
            console.error('[GoogleMap] Upload on finish failed, data cached:', err);
          });
        }
      }
    }
  }, [status]);

  // ====== 设置ESC Start ======
  useKeyPress('esc', () => {
    setSettingModal(!settingModal);
  });
  // ====== 设置ESC End ======

  // ====== detect start ======
  useEffect(detect, []);
  // ====== detect end ======

  return (
    <>
      <Spin
        spinning={spinning}
        wrapperClassName={styles.spinning}
        size="large"
        indicator={<Loading />}
      >
      <div className={styles.wrap}>
        {alarm && <div className={styles.alarmContainer} />}

        <div className={styles.header}>
          {/* 单人模式显示Logo */}
          {type ? (
            ['battle_royale', 'point', 'rank'].includes(type) || player ? (
              <HeaderLogo className={styles.googleMapLogo} />
            ) : (
              // 左侧比分
              !roundResult && !(status === 'finish') && <HealthBar team={0} />
            )
          ) : (
            ''
          )}

          {/* 水平指南针 */}
          {pano?.panoId && (settingData.newCompass ?? true) && (
            <Compass googleMapInstance={viewer} />
          )}

          {/* 倒计时组件 */}
          {type && type === 'point' && status !== 'rank' && (
            <div className={styles.middleContainer}>
              <Countdown
                model="Point.model"
                setAlarm={setAlarm}
                hasNewCompass={settingData.newCompass}
              />
            </div>
          )}

          {model === 'Challenge.model' && (
            <div className={styles.middleContainer}>
              {((lastRound && lastRound.timerStartTime && !lastRound.endTime) ||
                (type &&
                  ['solo_match', 'battle_royale'].includes(type) &&
                  status === 'ready' &&
                  timerStartTime)) && (
                  <ChallengeCountdown
                    hasNewCompass={settingData.newCompass}
                    model="Challenge.model"
                    setAlarm={setAlarm}
                  />
                )}
              {lastRound &&
                lastRound.isDamageMultiple &&
                !lastRound.endTime && (
                  <DamageMultiple damageMultiple={lastRound.damageMultiple} />
                )}
            </div>
          )}

          {type &&
            (type === 'point' ? (
              // 积分赛模式下显示在线人数
              <OnlineMember model="Point.model" />
            ) : [
              'daily_challenge',
              'challenge',
              'infinity',
              'map_country_streak',
              'country_streak',
              'province_streak',
            ].includes(type) && status === 'ongoing' ? (
              // 日挑、无限模式下显示当前关卡信息
              <RoundInfo model="Challenge.model" />
            ) : ['solo', 'solo_match', 'team', 'team_match'].includes(type) ? (
              // 组队赛模式下显示当前关卡信息
              !roundResult && !(status === 'finish') && <HealthBar team={1} />
            ) : (
              // 淘汰赛显示剩余人数
              <OnlineMember model="Challenge.model" />
            ))}
        </div>

        {/* 全景 */}
        <div className={styles.viewer} id="viewer" />
        {pano?.source === 'baidu_pano' && <BaiduLogo />}
        <aside className={styles.controls}>
          {(settingData.classicCompass ?? true) && (
            <ClassicCompass
              googleMapInstance={viewer}
              animate={animatePovNorth}
            />
          )}

          {/* 2023.09.22 用户反馈放大缩小没有用，取消 */}
          {/* <div className={styles.zoomControl}>
            <Button
              onClick={() => viewer?.setZoom(viewer.getZoom() + 1)}
              icon={<PlusOutlined />}
            />
            <Button
              onClick={() => viewer?.setZoom(viewer.getZoom() - 1)}
              icon={<MinusOutlined />}
            />
          </div> */}
          <div className={styles.settingControlInline}>
            <Button
              shape="circle"
              icon={<SettingOutlined />}
              onClick={() => setSettingModal(true)}
              title="设置"
            />
          </div>

          {/* 可移动模式下才能显示 */}
          {viewOptions?.move && (
            <div className={styles.panoControl}>
              {/* 暂时只有谷歌街景支持返回上个点 */}
              {pano?.source === 'google_pano' && (
                <Button
                  shape="circle"
                  onClick={handleReturnToPrevLocation}
                  icon={<BiRedo />}
                  title="回到上个位置 (Z)"
                  disabled={!hasPrevLocation}
                />
              )}
              {checkpoint ? (
                <Button
                  shape="circle"
                  onClick={handleReturnToCheckpoint}
                  icon={<BiCurrentLocation />}
                  title="回到检查点 (C)"
                />
              ) : (
                <Button
                  shape="circle"
                  onClick={handleSetCheckpoint}
                  icon={<BiLocationPlus />}
                  title="添加检查点 (C)"
                />
              )}
              <Button
                shape="circle"
                onClick={returnToStart}
                icon={<BiFlag />}
                title="返回起始位置 (R)"
              />
            </div>
          )}

          {/* 积分赛模式下显示弹幕 */}
          {model === 'Point.model' && settings.danmu && (
            <SendBox model={model} />
          )}
        </aside>
        <UidVersionBar mapsName={gameData?.mapsName} />
      </div>
      <Modal
        open={settingModal}
        centered
        closeIcon={null}
        maskClosable={false}
        styles={{
          body: { background: 'transparent' },
          mask: {
            background: 'rgba(9, 7, 35, 0.8)',
            backdropFilter: 'blur(0.5rem)',
          },
        }}
        wrapClassName={styles.settingModal}
        title="设置"
        footer={
          <>
            <Space
              className={styles.settingOptionControl}
              wrap
              size="large"
              align="center"
            >
              <div style={{ alignItems: 'center', textAlign: 'center' }}>
                <Button
                  size="large"
                  shape="round"
                  style={{ margin: 'auto' }}
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  刷新
                </Button>
              </div>
              {(type === 'challenge' ||
                type === 'map_country_streak' ||
                type === 'infinity') && (
                  <div style={{ alignItems: 'center', textAlign: 'center' }}>
                    <Button
                      size="large"
                      shape="round"
                      style={{ margin: 'auto' }}
                      onClick={() => {
                        if (
                          fromChallengeHub &&
                          type === 'challenge' &&
                          gameData?.challengeId
                        ) {
                          history.push(
                            `/challenge-hub/${encodeURIComponent(gameData.challengeId)}`,
                          );
                          setSettingModal(false);
                          return;
                        }
                        gameAgain({ gameId: gameData!.id! }).then((res) => {
                          if (res.success && res.data) {
                            if (res.data.challengeId) {
                              history.push(`/challenge/${res.data.challengeId}`);
                            } else {
                              history.push(`/solo/${res.data.gameId}`);
                            }
                          }
                          setSettingModal(false);
                        });
                      }}
                    >
                      {fromChallengeHub && type === 'challenge'
                        ? '回到挑战'
                        : '重开'}
                    </Button>
                  </div>
                )}
            </Space>
            <Space
              className={styles.settingOptionControl}
              wrap
              size="large"
              align="center"
            >
              <Button
                type="primary"
                size="large"
                onClick={() => setSettingModal(false)}
                shape="round"
              >
                回到比赛
              </Button>
              <Button
                size="large"
                shape="round"
                onClick={() => {
                  qixunGoHome();
                }}
              >
                离开比赛
              </Button>
            </Space>
          </>
        }
        onCancel={() => setSettingModal(false)}
      >
        <Row gutter={[16, 16]} wrap justify="space-around">
          <Col sm={6} xs={12}>
            <div className={styles.settingOption}>
              <div className={styles.settingOptionIcon}>
                <CompassOutlined
                  rotate={settingData.classicCompass ?? true ? 0 : 90}
                />
              </div>
              <div className={styles.settingOptionLabel}>传统指南针</div>
              <div className={styles.settingOptionSwitch}>
                <Switch
                  checked={settingData.classicCompass ?? true}
                  onChange={toggleClassicCompass}
                />
              </div>
            </div>
          </Col>

          <Col sm={6} xs={12}>
            <div className={styles.settingOption}>
              <div className={styles.settingOptionIcon}>
                <RxRulerHorizontal
                  rotate={settingData.newCompass ?? true ? 0 : 90}
                />
              </div>
              <div className={styles.settingOptionLabel}>标尺指南针</div>
              <div className={styles.settingOptionSwitch}>
                <Switch
                  checked={settingData.newCompass ?? true}
                  onChange={toggleNewCompass}
                />
              </div>
            </div>
          </Col>

          {!isMobile && (
            <Col sm={6} xs={12}>
              <div className={styles.settingOption}>
                <div className={styles.settingOptionIcon}>
                  {isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )}
                </div>
                <div className={styles.settingOptionLabel}>全屏</div>
                <div className={styles.settingOptionSwitch}>
                  <Switch checked={isFullscreen} onChange={toggleFullscreen} />
                </div>
              </div>
            </Col>
          )}

          {type === 'point' && (
            <Col sm={6} xs={12}>
              <div className={styles.settingOption}>
                <div className={styles.settingOptionIcon}>
                  <CommentOutlined />
                </div>
                <div className={styles.settingOptionLabel}>弹幕</div>
                <div className={styles.settingOptionSwitch}>
                  <Switch checked={settingData.danmu} onChange={toggleDanmu} />
                </div>
              </div>
            </Col>
          )}
        </Row>
        <Divider />
        </Modal>
      </Spin>
      {roundResult &&
        createPortal(
          <div className={styles.settingControl}>
            <Button
              shape="circle"
              icon={<SettingOutlined />}
              onClick={() => setSettingModal(true)}
              title="设置"
            />
          </div>,
          document.body,
        )}
    </>
  );
};

export default GoogleMap;
