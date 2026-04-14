import { getBannedLocations } from '@/services/api';
import { decryptAesEcbBase64Url } from '@/utils/aes';
import { FC, useEffect, useRef, useState } from 'react';
import styles from './style.less';

type Props = {
  panorama: google.maps.StreetViewPanorama | undefined;
  round: API.GameRound;
};

type CircleArea = {
  lat: number;
  lng: number;
  radius: number;
  panoId: string;
  reason: string;
};

const getBlackPanoIdSet = (): Set<string> => {
  return new Set(['']);
};

const distanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isInCircle = (lat: number, lng: number, c: CircleArea): boolean => {
  return distanceMeters(lat, lng, c.lat, c.lng) <= c.radius;
};

const BlackoutOverlay: FC<Props> = ({ panorama, round }) => {
  const [isBlack, setIsBlack] = useState<boolean>(false);
  // const [banIds, setBanIds] = useState<Set<string> | null>(null);
  const [banCircles, setBanCircles] = useState<CircleArea[]>([]);
  const fetchedRef = useRef<boolean>(false);

  // 拉取封禁街景列表（加密字符串），解密并提取 panoId
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const res = await getBannedLocations({ skipErrorHandler: true });
        const enc = res?.data;
        if (enc && typeof enc === 'string') {
          const json = decryptAesEcbBase64Url(
            enc,
            // 与后端 qixunController.AES_LOCATION_BAN 保持一致
            'qixun_location_ban_20250827',
          );
          // console.log('json', json);
          const arr: Array<{
            panoId?: string | null;
            lat?: number;
            lng?: number;
            radius?: number;
          }> = JSON.parse(json || '[]');
          const circles: CircleArea[] = [];
          arr.forEach((it) => {
            if (it.lat && it.lng && it.radius && it.panoId) {
              circles.push({
                lat: it.lat!,
                lng: it.lng!,
                radius: it.radius!,
                panoId: it.panoId!,
                reason: '封禁',
              });
            }
          });
          setBanCircles(circles);
        }
      } catch (e) {}
    })();
  }, []);

  const isBlackByLatLng = (lat: number, lng: number): boolean => {
    if (banCircles.some((c) => isInCircle(lat, lng, c))) return true;
    return false;
  };

  const evaluateBlackout = () => {
    if (!panorama) return;
    const currentPanoId = panorama.getPano() || '';
    const loc = panorama.getLocation()?.latLng;
    const lat = loc?.lat() ?? round.lat;
    const lng = loc?.lng() ?? round.lng;
    const idHit = getBlackPanoIdSet().has(currentPanoId);
    const geoHit = isBlackByLatLng(lat, lng);
    setIsBlack(idHit || geoHit);
  };

  useEffect(() => {
    if (!panorama) return;
    evaluateBlackout();
    const listener = panorama.addListener('pano_changed', () => {
      evaluateBlackout();
    });
    return () => {
      try {
        listener?.remove();
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panorama, round.panoId, round.lat, round.lng, banCircles]);

  if (!isBlack) return null;
  return <div className={styles.blackOverlay} />;
};

export default BlackoutOverlay;
