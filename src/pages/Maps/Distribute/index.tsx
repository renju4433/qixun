import NormalPage from '@/pages/NormalPage';
import { deleteMapPanoRequest, listSimplePanoRequest } from '@/services/api';
import { useParams } from '@umijs/max';
import { Button, Modal, message } from 'antd';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import styles from './style.less';
import { CFMapTile } from '@/constants';

const MapDistribute = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [manager, setManager] = useState<boolean>(false);
  const managerRef = useRef<boolean>(false);
  const [data, setData] = useState<API.MapContain[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);
  const iconLoadedRef = useRef<boolean>(false);

  const url = CFMapTile;
  const tileSize = 512;

  const changeManager = () => {
    setManager(true);
    managerRef.current = true;
  };

  const changeNormal = () => {
    setManager(false);
    managerRef.current = false;
  };

  const handleDelete = (containId: number) => {
    Modal.confirm({
      title: '提示',
      content: '此操作将删除该街景, 是否继续?',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        deleteMapPanoRequest({ mapsId: Number(mapId), containId }).then(
          (res) => {
            if (res.success) {
              message.success('删除成功');
              // 删除后不是初始加载，保持当前视野
              isInitialLoadRef.current = false;
              getData();
            } else {
              message.error('删除失败');
            }
          },
        );
      },
    });
  };

  const toPanorama = (source: string, panoId: string) => {
    if (!source || !panoId) {
      message.warning('该街景暂不支持跳转');
      return;
    }
    if (source === 'baidu_pano') {
      window.open(
        `https://maps.baidu.com/#panoid=${panoId}&panotype=street&pitch=0&l=13&tn=B_NORMAL_MAP&sc=0&newmap=1&shareurl=1&pid=${panoId}`,
      );
    } else {
      if (panoId.indexOf('AF') === 0) {
        window.open(
          `https://www.google.com/maps/@0.0,0.0,3a,75y,90t/data=!3m7!1e1!3m5!1s${panoId}!2e10!3e11!7i8192!8i4096`,
        );
      } else {
        window.open(
          `https://www.google.com/maps/@?api=1&map_action=pano&pano=${panoId}`,
        );
      }
    }
  };

  const getData = () => {
    setLoading(true);
    listSimplePanoRequest({ mapsId: Number(mapId) })
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          addMarker(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const addMarker = (panoData: API.MapContain[]) => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // 准备要素数据
    const bounds = new maplibregl.LngLatBounds();
    const features: GeoJSON.Feature[] = [];

    panoData.forEach((finder) => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [finder.lng, finder.lat],
        },
        properties: {
          containId: (finder as any).containId || finder.id,
          panoId: finder.panoId,
          source: finder.source,
          lat: finder.lat,
          lng: finder.lng,
        },
      });
      bounds.extend([finder.lng, finder.lat]);
    });

    // 检查数据源是否已存在
    const source = map.getSource('points') as maplibregl.GeoJSONSource;

    if (source) {
      // 如果数据源已存在，只更新数据（性能优化）
      source.setData({
        type: 'FeatureCollection',
        features: features,
      });

      // 只在初始加载时自动适配视野
      if (isInitialLoadRef.current && panoData.length > 0) {
        map.fitBounds(bounds, {
          padding: { top: 10, bottom: 80, left: 15, right: 5 },
        });
        isInitialLoadRef.current = false;
      }
    } else {
      // 首次加载，需要加载图标并创建图层
      const iconUrl =
        'https://b68v.daai.fun/biz/1662830770348_9499340182724556af66f2b42846135b_0.png';

      // 只加载一次图标
      if (!iconLoadedRef.current) {
        map.loadImage(iconUrl, (error, image) => {
          if (error) {
            console.error('加载图标失败:', error);
            return;
          }

          if (image && !map.hasImage('custom-marker')) {
            map.addImage('custom-marker', image);
            iconLoadedRef.current = true;
          }

          // 创建数据源和图层
          createSourceAndLayer(map, features);

          // 只在初始加载时自动适配视野
          if (isInitialLoadRef.current && panoData.length > 0) {
            map.fitBounds(bounds, {
              padding: { top: 10, bottom: 80, left: 15, right: 5 },
            });
            isInitialLoadRef.current = false;
          }
        });
      } else {
        // 图标已加载，直接创建数据源和图层
        createSourceAndLayer(map, features);

        if (isInitialLoadRef.current && panoData.length > 0) {
          map.fitBounds(bounds, {
            padding: { top: 10, bottom: 80, left: 15, right: 5 },
          });
          isInitialLoadRef.current = false;
        }
      }
    }
  };

  const createSourceAndLayer = (
    map: maplibregl.Map,
    features: GeoJSON.Feature[],
  ) => {
    map.addSource('points', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features,
      },
    });

    map.addLayer({
      id: 'points',
      type: 'symbol',
      source: 'points',
      layout: {
        'icon-image': 'custom-marker',
        'icon-anchor': 'bottom',
        'icon-size': 0.7,
        'icon-allow-overlap': true,
      },
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      attributionControl: false,
      // style: 'mapbox://styles/mapbox/streets-v11', // style URL
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [url],
            tileSize: tileSize,
          },
        },
        layers: [
          { id: 'simple-tiles', type: 'raster', source: 'raster-tiles' },
        ],
      },
      center: [106.0, 38.0],
      zoom: 2, // starting zoom
      minZoom: 0,
      maxZoom: 17,
      dragRotate: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: false,
        customAttribution: '华为地图 GS（2022）2885号',
      }),
      'bottom-left',
    );

    map.on('load', () => {
      const logo = document.querySelector(
        '.maplibregl-ctrl-logo',
      ) as HTMLElement;
      if (logo) {
        logo.style.display = 'none';
      }
      getData();
    });

    // 添加鼠标悬停效果
    map.on('mouseenter', 'points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'points', () => {
      map.getCanvas().style.cursor = '';
    });

    // 注册点击事件监听器（只注册一次）
    map.on('click', 'points', (e) => {
      if (e.features && e.features[0]) {
        const properties = e.features[0].properties;
        const coordinates = (e.features[0].geometry as GeoJSON.Point)
          .coordinates;

        if (!managerRef.current) {
          toPanorama(properties?.source, properties?.panoId);
        } else {
          const popup = new maplibregl.Popup()
            .setLngLat([coordinates[0], coordinates[1]])
            .setHTML(
              `<p style="cursor: pointer; color: red" id="delete-btn-${properties?.containId}">删除</p>`,
            )
            .addTo(map);

          // 使用 setTimeout 确保 DOM 已经渲染
          setTimeout(() => {
            const deleteBtn = document.getElementById(
              `delete-btn-${properties?.containId}`,
            );
            if (deleteBtn) {
              deleteBtn.onclick = (event) => {
                event.stopPropagation();
                handleDelete(properties?.containId);
                popup.remove();
              };
            }
          }, 0);
        }
      }
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return (
    <NormalPage fullscreen={true} feedbackButton={false}>
      <div className={styles.container}>
        <div ref={mapContainerRef} className={styles.maps}></div>
        <div className={styles.modeSwitch}>
          {manager ? (
            <Button onClick={changeNormal} size="large" shape="round">
              🔒 浏览模式
            </Button>
          ) : (
            <Button onClick={changeManager} size="large" shape="round">
              🔧 管理模式
            </Button>
          )}
        </div>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}>加载中...</div>
          </div>
        )}
      </div>
    </NormalPage>
  );
};

export default MapDistribute;
