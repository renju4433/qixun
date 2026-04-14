import { useModel } from '@@/exports';
import { Viewer } from 'photo-sphere-viewer';
import {
  createRef,
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './style.less';

type PrefixProps = {
  margin: number;
};

const PrefixSpan: FC<PrefixProps> = ({ margin }) => (
  <>
    {Array.from(Array(4).keys()).map((num) => (
      <span
        key={num}
        className={styles.latitudeLines}
        style={{ left: `${(num * margin) / 4 + margin / 8}rem` }}
      />
    ))}
  </>
);
const Prefix = memo(PrefixSpan);

type SuffixProps = {
  margin: number;
  labelWidth: number;
};

const SuffixSpan: FC<SuffixProps> = ({ margin, labelWidth }) => (
  <>
    {Array.from(Array(4).keys()).map((num) => (
      <span
        key={num}
        className={styles.latitudeLines}
        style={{
          left: `${margin + labelWidth + (num * margin) / 4 + margin / 8}rem`,
        }}
      />
    ))}
  </>
);
const Suffix = memo(SuffixSpan);

const degrees = [
  { value: 315, label: '西北' },
  { value: 0, label: '北' },
  { value: 45, label: '东北' },
  { value: 90, label: '东' },
  { value: 135, label: '东南' },
  { value: 180, label: '南' },
  { value: 225, label: '西南' },
  { value: 270, label: '西' },
];

const container = () => {
  const labelWidth = 1.5;
  const latitudePadding = 2.625;

  // const containerWidth = Math.min((window.innerWidth / 679) * 15, 15);

  const containerWidth = 15;

  return {
    containerWidth: containerWidth,
    labelWidth,
    latitudePadding,
    latitudeWidth: 6.75,
    pixelsPerDegrees: 0.15,
    initialMiddle: 17.5,
    latitudesArrayWidth: 3.375 * (1 + 2 * degrees.length) - 3.375,
  };
};

type CompassProps = {
  photoSphereInstance?: Viewer;
  googleMapInstance?: google.maps.StreetViewPanorama;
};

const Compass: FC<CompassProps> = ({
  photoSphereInstance,
  googleMapInstance,
}) => {
  const n = useRef<number>(0);

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const degreeRefs = useMemo(
    () => degrees.map(() => createRef<HTMLDivElement>()),
    [],
  );
  const g = useRef(container());
  const m = useRef<number>();
  const [f, setF] = useState<number>(0);
  const v = useCallback(
    (e: number) => {
      m.current = requestAnimationFrame(() => {
        degreeRefs.forEach((degreeRef, index) => {
          if (degreeRef.current) {
            n.current = e;
            const a = g.current;
            const l = (1 + 2 * index) * (a.latitudeWidth / 2);
            const i = -e * a.pixelsPerDegrees;
            const o = a.latitudePadding + a.labelWidth;
            let s = l + i;
            if (
              (s < -o && (s = a.latitudesArrayWidth + s),
              s + o > a.latitudesArrayWidth && (s -= a.latitudesArrayWidth),
              Math.abs(s - a.containerWidth / 2) < 30 * a.pixelsPerDegrees)
            ) {
              const c = degreeRef.current.querySelector(
                '#latitude-label',
              ) as HTMLSpanElement;
              if (c) {
                let u = Math.abs(s - a.containerWidth / 2) / a.pixelsPerDegrees;
                c.style.transform = `scale(${1 + (30 - u) / 60})`;
              }
            }
            const d = s - l;
            degreeRef.current.style.transform = `translate(${d}rem)`;
          }
        });
      });
    },
    [degreeRefs],
  );

  const p = useCallback(
    (e: number) => {
      v((g.current.initialMiddle + e) % 360);
    },
    [v],
  );

  useEffect(() => {
    if (m.current) cancelAnimationFrame(m.current);
  }, []);

  const b = useCallback(() => {
    g.current = container();
    p(n.current);
    setF(f + 1);
  }, [f, p]);

  useEffect(() => {
    window.addEventListener('resize', b);
    return () => window.removeEventListener('resize', b);
  }, [b]);

  useEffect(() => {
    // Google Map 事件绑定
    if (googleMapInstance) {
      const event = googleMapInstance.addListener('pov_changed', () => {
        p(googleMapInstance.getPov().heading || 0);
      });

      return () => {
        event?.remove();
      };
    } else {
      // PhotoSphereViewer 事件绑定
      if (photoSphereInstance) {
        photoSphereInstance.on('position-updated', (e, position) => {
          const pos = (position.longitude / Math.PI) * 180;
          p(pos || 0);
        });

        return () => {
          if (photoSphereInstance) {
            photoSphereInstance.off('position-updated');
          }
        };
      }
    }
  }, [googleMapInstance, photoSphereInstance, p]);

  return (
    <div
      className={`${styles.compassContainer} ${isInApp ? styles.inApp : ''}`}
      style={{ width: `${g.current.containerWidth}rem` }}
    >
      <div className={styles.compassCompass}>
        {degrees.map((degree, index) => (
          <div
            key={degree.value}
            ref={degreeRefs[index]}
            className={styles.latitude}
            style={{ width: `${g.current.latitudeWidth}rem` }}
          >
            <Prefix margin={g.current.latitudePadding} />
            <Suffix
              margin={g.current.latitudePadding}
              labelWidth={g.current.labelWidth}
            />
            <span className={styles.latitudeLabel}>{degree.label}</span>
          </div>
        ))}
      </div>
      <div
        className={styles.topIndicator}
        style={{
          left: `calc(${
            g.current.containerWidth / 2
          }rem + 0.5rem - 0.09375rem)`,
        }}
      />
      <div
        className={styles.bottomIndicator}
        style={{
          left: `calc(${
            g.current.containerWidth / 2
          }rem + 0.5rem - 0.09375rem)`,
        }}
      />
    </div>
  );
};

export default Compass;
