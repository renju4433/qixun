import MapContainer from '@/components/Map/MapContainer';
import { useEffect } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';
import styles from '../style.less';

const isValidCoord = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng);

const MapWithMarker = ({ round }) => {
  const { map } = useMap();
  useEffect(() => {
    if (!map || !round || !isValidCoord(round.lat, round.lng)) return;
    const container = map.getContainer();
    if (!container) return;
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    if (w < 40 || h < 40) return;
    const padding = Math.min(100, Math.floor(Math.min(w, h) / 4));
    try {
      map.fitBounds(
        [
          [round.lng - 0.9, Math.max(-90, round.lat - 0.9)],
          [round.lng + 0.9, Math.min(90, round.lat + 0.9)],
        ],
        { padding, duration: 500 },
      );
    } catch (e) {
      console.warn('fitBounds failed:', e);
    }
  }, [round, map]);
  return (
    <div className={styles.map}>
      <MapContainer>
        {round && isValidCoord(round.lat, round.lng) && (
          <Marker latitude={round.lat} longitude={round.lng} color="orange" />
        )}
      </MapContainer>
    </div>
  );
};

export default MapWithMarker;
