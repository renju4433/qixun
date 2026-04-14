import { useDevTools } from '@/hooks/use-dev-tools';
import { Card } from 'antd';
import React, { useEffect, useRef } from 'react';
import styles from './index.less';

declare global {
  interface Window {
    google: any;
  }
}

const GooglePanoTest: React.FC = () => {
  const panoramaRef = useRef<HTMLDivElement>(null);
  const panoramaInstanceRef = useRef<any>(null);

  useDevTools();

  const initializeStreetView = () => {
    if (!panoramaRef.current) return;

    panoramaInstanceRef.current = new window.google.maps.StreetViewPanorama(
      panoramaRef.current,
      {
        pano: 'CAoSFkNJSE0wb2dLRUlDQWdJRHF4WlhQQlE.',
        // pano: 'CAoSLEFGMVFpcFB3R2liS2VMMkdoejdYdnBINWVYTXk5QzV1OXREbmFhRHRWVTNZ',
        pov: { heading: 34, pitch: 10 },
        zoom: 1,
        addressControl: true,
        showRoadLabels: true,
        zoomControl: true,
      },
    );
  };

  useEffect(() => {
    // 加载 Google Maps JavaScript API
    const script = document.createElement('script');
    // script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCdt719yJI_9hg8WNct5hSbFim7vApmdrU&v=3.58`;
    script.src = `https://b68v.daai.fun/st_v3/js_v32.js`;
    script.async = true;
    script.defer = true;
    script.onload = initializeStreetView;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <Card title="谷歌街景测试" className={styles.container}>
      <div ref={panoramaRef} style={{ width: '100%', height: '500px' }} />
    </Card>
  );
};

export default GooglePanoTest;
