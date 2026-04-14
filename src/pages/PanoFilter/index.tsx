import {
  checkPano,
  deletePano,
  generateQueue,
  getPanoContent,
  getPanoInfo,
} from '@/services/api';
import { useLoadGoogle } from '@/hooks/use-load-google';
import { history, useModel } from '@umijs/max';
import { Button, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styles from './style.less';
import { qixunGoHome } from '@/utils/HisotryUtils';

const PanoFilter = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [loaded, setLoaded] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [mapsName, setMapsName] = useState<string>();
  const [mapsId, setMapsId] = useState<number>();
  const [nation, setNation] = useState<string>();
  const [currentId, setCurrentId] = useState<number>();
  const [currentPanoId, setCurrentPanoId] = useState<string>('');
  const [index, setIndex] = useState(-1);

  const viewerRef = useRef<google.maps.StreetViewPanorama>();
  const headingMapRef = useRef<Record<string, number>>({});

  const queryId = new URLSearchParams(window.location.search).get('id');
  const queryMapsId = new URLSearchParams(window.location.search).get('mapsid');

  useLoadGoogle({ setLoaded });

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.keyCode === 32) {
        // 空格键 - 加入题库
        e.preventDefault();
        handleCheck();
      } else if (e.keyCode === 8) {
        // 删除键 - 删除题目
        e.preventDefault();
        handleDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentId, queryId, index]);

  // 登录检查
  useEffect(() => {
    if (!user) {
      history.push('/user/login?redirect=/panofilter');
    } else {
      loadNextPano();
    }
  }, [user]);

  // 初始化Google Street View
  useEffect(() => {
    if (loaded && !viewerRef.current) {
      initViewer();
    }
  }, [loaded]);

  // 初始化查看器
  const initViewer = () => {
    // 添加隐藏Google地图链接的样式
    const style = document.createElement('style');
    style.innerHTML = `
      a[href^="http://maps.google.com/maps"],
      a[href^="https://maps.google.com/maps"] { display:none !important; }
      .gmnoprint a, .gmnoprint span, .gm-style-cc { display:none; }
    `;
    document.head.appendChild(style);

    const viewer = new google.maps.StreetViewPanorama(
      document.getElementById('viewer') as HTMLElement,
      {
        fullscreenControl: false,
        panControl: true,
        addressControl: false,
        imageDateControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        streetViewControl: false,
        showRoadLabels: false,
        scaleControl: false,
        zoomControl: false,
        panControlOptions: {
          position: google.maps.ControlPosition.BOTTOM_LEFT,
        },
      },
    );

    viewer.registerPanoProvider(getCustomPanorama, { cors: true });

    viewer.addListener('pano_changed', () => {
      const panoId = viewer.getPano();
      if (panoId && panoId.length === 27) {
        fetchPanoInfo(panoId);
      }
    });

    viewer.addListener('status_changed', () => {
      const status = viewer.getStatus();
      if (status && status !== 'OK') {
        console.error('Street View status:', status);
      }
    });

    viewerRef.current = viewer;
  };

  // 自定义全景提供者（支持百度全景）
  const getCustomPanorama = (pano: string): google.maps.StreetViewPanoramaData | null => {
    if (pano.length === 27) {
      return {
        location: {
          pano: pano,
        },
        links: [],
        copyright: 'baidu',
        tiles: {
          tileSize: new google.maps.Size(512, 512),
          worldSize: new google.maps.Size(8192, 4096),
          centerHeading: headingMapRef.current[pano] ?? 0,
          getTileUrl: getCustomPanoramaTileUrl,
        },
      };
    }
    return null;
  };

  // 获取全景瓦片URL（百度地图）
  const getCustomPanoramaTileUrl = (
    pano: string,
    zoom: number,
    tileX: number,
    tileY: number,
  ) => {
    zoom = zoom + 1;
    if (zoom === 1) {
      return `https://map.chao-fan.com/bd/thumb/${pano}`;
    }
    return `https://mapsv1.bdimg.com/?qt=pdata&sid=${pano}&pos=${tileY}_${tileX}&z=${zoom}`;
  };

  // 获取全景信息
  const fetchPanoInfo = async (pano: string) => {
    try {
      const res = await getPanoInfo({ pano });
      if (res.success && res.data) {
        if (viewerRef.current) {
          viewerRef.current.setLinks(res.data.links || []);
        }
        headingMapRef.current[res.data.pano] = res.data.centerHeading || 0;

        // 预加载相邻全景
        if (res.data.links) {
          res.data.links.forEach((link: any) => {
            preloadImage(link.pano);
            headingMapRef.current[link.pano] = link.centerHeading || 0;
          });
        }
      }
    } catch (error) {
      console.error('获取全景信息失败:', error);
    }
  };

  // 预加载图片
  const preloadImage = (pano: string) => {
    const img = new Image();
    img.src = `https://map.chao-fan.com/bd/thumb/${pano}`;
  };

  // 设置Google全景
  const setGooglePano = (panoId: string) => {
    if (viewerRef.current && panoId) {
      viewerRef.current.setPano(panoId);
      viewerRef.current.setVisible(true);
      setTimeout(() => {
        viewerRef.current?.setZoom(0);
      }, 50);
    }
  };

  // 加载下一个全景
  const loadNextPano = async () => {
    const newIndex = index + 1;
    setIndex(newIndex);

    try {
      if (queryId) {
        // 根据ID加载内容
        const res = await getPanoContent({ id: parseInt(queryId) });
        if (res.success && res.data) {
          setCurrentPanoId(res.data.panoId);
          setCurrentId(res.data.id);
          setTotalCount(res.data.totalCount || 0);
          setGooglePano(res.data.panoId);
        }
      } else {
        // 根据队列加载
        const res = await generateQueue({
          index: newIndex,
          mapsId: queryMapsId ? parseInt(queryMapsId) : undefined,
        });
        if (res.success && res.data) {
          setCurrentId(res.data.id);
          setCurrentPanoId(res.data.panoId);
          setTotalCount(res.data.totalCount);
          setMapsName(res.data.mapsName);
          setMapsId(queryMapsId ? parseInt(queryMapsId) : undefined);
          setNation(res.data.nation);
          if (res.data.heading) {
            headingMapRef.current[res.data.panoId] = res.data.heading;
          }
          setGooglePano(res.data.panoId);
        }
      }
    } catch (error) {
      message.error('加载全景失败');
      console.error(error);
    }
  };

  // 加入题库
  const handleCheck = async () => {
    if (!currentId) return;

    if (queryId) {
      window.close();
      return;
    }

    try {
      await checkPano({ id: currentId });
      setIndex(index - 1);
      loadNextPano();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  // 删除题目
  const handleDelete = async () => {
    if (!currentId) return;

    try {
      await deletePano({ id: currentId });
      setIndex(index - 1);
      if (queryId) {
        window.close();
      } else {
        loadNextPano();
      }
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <div id="viewer" className={styles.viewer}></div>

      <div className={styles.confirm}>
        <div className={styles.countText}>剩余 {totalCount}</div>
        <Button type="primary" onClick={handleCheck} size="large">
          加入题库(空格键)
        </Button>
        <Button onClick={handleDelete} danger size="large">
          删除题目(删除键)
        </Button>
        <Button onClick={loadNextPano} size="large">
          黑屏刷新
        </Button>
        <Button onClick={qixunGoHome} type="dashed" size="large">回到首页</Button>
      </div>

      {mapsName && (
        <div className={styles.info}>
          用户投稿题库：{mapsName} {mapsId}
        </div>
      )}

      {nation && <div className={styles.location}>{nation}</div>}
    </div>
  );
};

export default PanoFilter;