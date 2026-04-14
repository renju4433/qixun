import { publicPath } from '@/constants';
import { FC, useEffect, useRef, useState, useCallback} from 'react';
import styles from './style.less';

type ClassicCompassProps = {
  googleMapInstance?: google.maps.StreetViewPanorama;
  animate: () => void;
};

const ClassicCompass: FC<ClassicCompassProps> = ({
  googleMapInstance,
  animate,
}) => {
  const compassContainerRef = useRef<HTMLDivElement>(null);
  const [heading, setHeading] = useState<number>(0);

  /*const onClick = (e: MouseEvent) => {
    if (!move || !compassContainerRef.current || !googleMapInstance) return;
    const rect = compassContainerRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.x - rect.width / 2,
      y: rect.height / 2 - (e.clientY - rect.y),
    };
    const c = 0 * position.x + 1 * position.y;
    const l = Math.sqrt(Math.pow(position.x, 2) + Math.pow(position.y, 2));
    let u = Math.acos(c / l);
    if (position.x < 0) {
      u = 2 * Math.PI - u;
    }
    const d = (u * 180) / Math.PI;
    setHeading(-d);

    if (googleMapInstance) {
      googleMapInstance.setPov({
        heading: -d,
        pitch: googleMapInstance.getPov().pitch || 0,
      });
    }
  };*/

  const onClick = useCallback(() => {
    if (!compassContainerRef.current || !googleMapInstance) return;

    animate();
  },
    [googleMapInstance, animate]
  );

  useEffect(() => {
    // Google Map 事件绑定
    if (googleMapInstance) {
      const event = googleMapInstance.addListener('pov_changed', () => {
        setHeading(googleMapInstance.getPov().heading || 0);
      });

      return () => {
        event?.remove();
      };
    }
  }, [googleMapInstance]);

  return (
    <div className={styles.classicCompassWrap}>
      <div
        className={styles.classicCompassContainer}
        ref={compassContainerRef}
        onClick={onClick}
      >
        <div className={styles.classicCompassCircle} />
        <img
          src={`${publicPath}/images/compass.svg`}
          draggable={false}
          className={styles.classicCompassIndicator}
          style={{
            transform: `rotate(${-heading}deg)`,
          }}
        />
      </div>
    </div>
  );
};

export default ClassicCompass;
