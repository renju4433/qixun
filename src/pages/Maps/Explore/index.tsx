import { getMapInfo } from '@/services/api';
import { useParams } from '@@/exports';
import { Button } from 'antd';
import { useEffect, useState } from 'react';

const MapExplore = () => {
  let { mapId } = useParams();

  const [mapsInfo, setMapsInfo] = useState<API.MapItem>();

  useEffect(() => {
    getMapInfo({ mapsId: Number(mapId) }).then((result) => {
      if (result.success) {
        setMapsInfo(result.data);
      }
    });
  }, []);

  return (
    <div>
      <Button>探索</Button>
    </div>
  );
};

export default MapExplore;
