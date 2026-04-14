import MapContainer from '@/components/Map/MapContainer';
import { useEffect } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';
import styles from '../style.less';

const MapWithMarker = ({ round }) => {
  const { map } = useMap();
  useEffect(() => {
    if (round && round.lng && round.lat) {
      map?.fitBounds(
        [
          [round.lng - 0.1, round.lat - 0.1],
          [round.lng + 0.1, round.lat + 0.1],
        ],
        { padding: 100, duration: 500 },
      );
    }
  }, [round]);
  return (
    <div className={styles.map}>
      <MapContainer>
        {round && round.lat && round.lng && (
          <Marker latitude={round.lat} longitude={round.lng} color="orange" />
        )}
        {/* <Source
          id="baidu"
          type="raster"
          tiles={['https://mapsv0.bdimg.com/?qt=tile&x={x}&y={y}&z={z}']}
        >
          <Layer id="baiduu" type="raster"></Layer>
        </Source> */}
      </MapContainer>
    </div>
  );
};

export default MapWithMarker;
