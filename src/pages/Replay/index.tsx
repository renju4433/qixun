import { useCheckLogin } from '@/hooks/use-check-login';
import { useEffect } from 'react';
import { MapProvider } from 'react-map-gl';
import ReplayContainer from './ReplayContainer';
const Replay = () => {
  const checkLogin = useCheckLogin();
  useEffect(() => {
    checkLogin(() => {});
  });

  return (
    <MapProvider>
      <ReplayContainer />
    </MapProvider>
  );
};

export default Replay;
