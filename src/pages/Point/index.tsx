import Danmu from '@/components/Game/Danmu';
import GoogleMap from '@/components/Map/GoogleMap/GoolgeMap';
import MapPicker from '@/components/Map/MapPicker';
import MapResult from '@/components/Map/MapResult';
import { useLoadGoogle } from '@/hooks/use-load-google';
import { settings } from '@/services/valtio';
import { useModel, useSnapshot } from '@umijs/max';
import { FC, useEffect, useState } from 'react';
import { MapProvider } from 'react-map-gl';
import styles from './style.less';

const Point: FC = () => {
  const { status, result, start, stop } = useModel('Point.model', (model) => ({
    status: model.status,
    result: model.result,
    start: model.start,
    stop: model.stop,
  }));

  const [loaded, setLoaded] = useState<boolean>(false);

  useLoadGoogle({ setLoaded });

  useEffect(() => {
    start();

    return stop;
  }, []);

  const { danmu } = useSnapshot(settings);

  return (
    <MapProvider>
      <div className={styles.wrapper}>
        {(!status || status !== 'rank') && <MapPicker model="Point.model" />}
        {loaded && <GoogleMap model="Point.model" />}
        {status && status === 'rank' && <MapResult {...result} />}
        {danmu && <Danmu model="Point.model" />}
      </div>
    </MapProvider>
  );
};

export default Point;
