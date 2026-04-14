import BaiduLogo from '@/components/Map/GoogleMap/BaiduLogo';
import {
  getCustomPanoramaTileUrl,
  getQQPanoramaTileUrl,
  preloadImage,
  preloadQQImage,
} from '@/components/Map/GoogleMap/common';
import { getPanoInfo, getQQPanoInfo, reportErrorPano } from '@/services/api';
import {
  ForwardRefRenderFunction,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import BlackoutOverlay from './BlackoutOverlay';
import styles from './style.less';

let headingMap: Record<string, number> = {};
let locationgMap: Record<string, { lat: number; lng: number }> = {};

type PanoramaProps = {
  round: API.GameRound;
  useProp?: boolean;
};
export type PanoramaRef = {
  reset: () => void;
  panorama: google.maps.StreetViewPanorama | undefined;
};

const Panorama: ForwardRefRenderFunction<PanoramaRef, PanoramaProps> = (
  { round, useProp = false },
  ref,
) => {
  // 全景实例
  const [viewer, setViewer] = useState<google.maps.StreetViewPanorama>();

  // Loading状态
  const [spinning, setSpinning] = useState<boolean>(false);
  // 黑屏覆盖逻辑已抽离到 BlackoutOverlay

  // ====== 初始化 Pano Start ======
  // 初始化Viewer
  const initPanoViewer = (panoId?: string) => {
    // 初始化Viewer
    const panorama = new google.maps.StreetViewPanorama(
      document.getElementById('viewer')!,
      {
        pano: panoId ?? null,
        fullscreenControl: false,
        panControl: useProp ? round.pan : true,
        disableDoubleClickZoom: true,
        linksControl: true,
        addressControl: false,
        imageDateControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        showRoadLabels: false,
        zoomControl: false,
        panControlOptions: {
          position: google.maps.ControlPosition.LEFT_BOTTOM,
        },
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
          if (e.parentNode) {
            e.parentNode.removeChild(e);
          }
        });
      document
        .getElementById('viewer')
        ?.querySelector(".gm-style-cc a[title*='Google']")
        ?.parentElement?.parentElement?.parentElement?.remove();

      // === 移除Goolge Logo和Report End ===

      if (panorama.getStatus() === google.maps.StreetViewStatus.OK) {
        setSpinning(false);
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
      // 其他业务在 BlackoutOverlay 里处理

      // 更新Links
      if (currentPanoId && currentPanoId.length === 27) {
        // baidu_pano
        const result = await getPanoInfo({ pano: currentPanoId });

        // 暂存坐标
        locationgMap[currentPanoId] = {
          lat: result.data.lat,
          lng: result.data.lng,
        };

        // 暂存CenterHeading
        // headingMap[currentPanoId] = result.data.centerHeading;
        result.data.links.forEach((link) => {
          if (link.pano && !headingMap[link.pano]) {
            headingMap[link.pano] = link.centerHeading;
            preloadImage(link.pano);
          }
        });
        panorama?.setLinks(result.data.links);
      } else if (currentPanoId && currentPanoId.length === 23) {
        // qq_pano
        const result = await getQQPanoInfo({ pano: currentPanoId });

        // 暂存坐标
        locationgMap[currentPanoId] = {
          lat: result.data.lat,
          lng: result.data.lng,
        };

        // 暂存CenterHeading
        // headingMap[currentPanoId] = result.data.centerHeading;
        result.data.links.forEach((link) => {
          if (link.pano && !headingMap[link.pano]) {
            headingMap[link.pano] = link.centerHeading;
            preloadQQImage(link.pano);
          }
        });
        panorama?.setLinks(result.data.links);
      }
    });

    return panorama;
  };

  useEffect(() => {
    // 初始化Viewer
    const panorama = initPanoViewer();
    setViewer(panorama);

    // 卸载组件操作
    return () => {
      console.log('卸载Viewer');
      // 卸载Viewer
      if (viewer) {
        google?.maps.event.clearInstanceListeners(viewer);
        google?.maps.event.clearInstanceListeners(window);
        google?.maps.event.clearInstanceListeners(document);
        viewer.unbindAll();
        setViewer(undefined);
      }

      const viewerElement = document.getElementById('viewer');
      if (viewerElement) {
        viewerElement.innerHTML = ''; // 清空内容
      }
    };
  }, []);

  const getCustomPanorama = (
    panoId: string,
    h: Record<string, number>,
    l: Record<
      string,
      {
        lat: number;
        lng: number;
      }
    >,
  ) => {
    // 百度地图处理
    if (round?.source === 'baidu_pano') {
      return {
        location: {
          pano: panoId,
          latLng: l[panoId]
            ? new google.maps.LatLng(l[panoId].lat, l[panoId].lng)
            : new google.maps.LatLng(round.lat, round.lng),
        },
        links: [], // 如果是初始Pano，使用初始Links
        copyright: 'baidu',
        tiles: {
          tileSize: new google.maps.Size(512, 512),
          worldSize: new google.maps.Size(8192, 4096),
          centerHeading: h[panoId] ?? round.heading ?? 0,
          getTileUrl: getCustomPanoramaTileUrl,
        },
      };
    } else if (round?.source === 'qq_pano') {
      return {
        location: {
          pano: panoId,
          latLng: l[panoId]
            ? new google.maps.LatLng(l[panoId].lat, l[panoId].lng)
            : new google.maps.LatLng(round.lat, round.lng),
        },
        links: [], // 如果是初始Pano，使用初始Links
        copyright: 'qq',
        tiles: {
          tileSize: new google.maps.Size(512, 512),
          worldSize: new google.maps.Size(8192, 4096),
          centerHeading:
            h[panoId] ??
            round.heading ??
            // (await getQQPanoInfo({ pano: panoId })).data.centerHeading ??
            0,
          getTileUrl: getQQPanoramaTileUrl,
        },
      };
    }

    return null;
  };

  const _rest = () => {
    if (viewer) {
      if (useProp) {
        viewer.setOptions({
          linksControl: !!round.move,
          clickToGo: !!round.move,
          disableDoubleClickZoom: !round.pan,
          scrollwheel: round.pan,
        });
      }
      if (round.source === 'baidu_pano' || round.source === 'qq_pano') {
        viewer.registerPanoProvider(
          (panoId) => getCustomPanorama(panoId, headingMap, locationgMap),
          {
            cors: true,
          },
        );
      } else {
        viewer.registerPanoProvider(() => null);
      }
      viewer.setPano(round.panoId);
      viewer.setPov({
        heading: round.vHeading ?? 0,
        pitch: round.vPitch ?? 0,
      });
      viewer.setZoom(round.vZoom ?? 1);
      viewer.setVisible(true);
      // 其他业务在 BlackoutOverlay 里处理
    }
  };

  useEffect(_rest, [viewer]);
  useEffect(_rest, [round]);

  useImperativeHandle(ref, () => ({
    reset: () => _rest(),
    panorama: viewer, // 暴露街景对象引用
  }));

  // ====== 设置固定视角 Start ======
  useEffect(() => {
    const canvas = document.getElementById('viewer');
    if (!canvas) return;

    const mouseEvent = (event: Event) => {
      if (!round.pan && useProp) {
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
  }, [spinning, viewer, round.pan]);

  return (
    <div className={styles.panorama}>
      <div
        id="viewer"
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      ></div>
      <BlackoutOverlay panorama={viewer} round={round} />
      {round.source === 'baidu_pano' && <BaiduLogo zIndex="1" />}
    </div>
  );
};

export default forwardRef(Panorama);
