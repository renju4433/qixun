import { CFMapTile } from '@/constants';
import { counterDay, logServer } from '@/services/api';
import * as Sentry from '@sentry/react';

import 'maplibre-gl/dist/maplibre-gl.css';
import { FC, useEffect } from 'react';
import Map, {
  AttributionControl,
  MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import ResizeObserver from 'resize-observer-polyfill';

type MapContainerProps = {
  cursor?: 'grab' | 'crosshair';
  onClick?: (e: MapLayerMouseEvent) => void;
  children?: React.ReactNode;
  reuse?: boolean;
  interactiveLayerIds?: string[];
  onMapLoad?: (map: any) => void;
};

const MapContainer: FC<MapContainerProps> = ({
  cursor,
  onClick,
  children,
  reuse = true,
  interactiveLayerIds,
  onMapLoad,
}) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      window.ResizeObserver = ResizeObserver;
      logServer({ text: 'ResizeObserver polyfill installed' });
    }
  }, []);

  return (
    <Map
      id="map"
      interactiveLayerIds={interactiveLayerIds}
      reuseMaps={reuse}
      style={{
        width: '100%',
        height: '100%',
        flex: '1 1 auto',
        backgroundColor: '#ebe9e4',
      }}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      // dragPan={{
      //   linearity: 0.3, // 平移灵敏度
      //   maxSpeed: 500, // 平移最大速度
      //   deceleration: 1400, // 平移结束后惯性
      // }}
      // fadeDuration={1000}
      minZoom={0}
      maxZoom={17}
      RTLTextPlugin="" // 去除RTL插件
      initialViewState={{
        longitude: 108.778,
        latitude: 32.05,
        zoom: 0,
        fitBoundsOptions: { maxZoom: 10, minZoom: 0 },
      }}
      attributionControl
      mapStyle={{
        version: 8,
        sources: {
          'petal-tiles': {
            type: 'raster',
            tiles: [CFMapTile],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'petal',
            type: 'raster',
            source: 'petal-tiles',
            minzoom: 0,
            maxzoom: 18,
          },
        ],
        glyphs: 'https://b68v.daai.fun/front/{fontstack}/{range}.pbf', // 添加这一行
      }}
      onLoad={(e) => {
        const map = e.target; // 获取地图实例
        // 禁止旋转地图
        map.touchZoomRotate.disableRotation();
        // 控制速度的
        map.scrollZoom.setWheelZoomRate(1 / 100);
        map.scrollZoom.setZoomRate(1 / 200);
        // 如果有传入 onMapLoad 回调，将地图实例传递给父组件
        if (onMapLoad) {
          onMapLoad(map);
        }
      }}
      onError={(e) => {
        if (e.error.message.includes('Failed to fetch')) {
          return;
        }
        counterDay({ event: 'map_error' });
        // 记录完整错误，包括错误信息和错误堆栈
        logServer({
          text: '地图失败 ' + e.error + ' ' + e.error.stack,
        });
        console.error(e);
        console.error(e.error + ' ' + e.error.stack);
        Sentry.captureException(e);
      }}
      cursor={cursor}
      onClick={onClick}
    >
      <AttributionControl
        customAttribution="华为地图"
        // customAttribution="华为地图 | GS（2022）2885号"
        style={{ color: '#000' }}
      />
      {children}
    </Map>
  );
};

export default MapContainer;
