import { useModel } from '@umijs/max';
import { FC, useCallback, useEffect, useRef } from 'react';
import styles from './style.less';

type CountdownProps = {
  model: 'Point.model';
  setAlarm: (alarm: boolean) => void;
  hasNewCompass: boolean;
};

const Countdown: FC<CountdownProps> = ({ model, setAlarm, hasNewCompass }) => {
  console.log('hasNewCompass ' + hasNewCompass);
  const color = {
    red: 'rgb(233, 69, 96)',
    yellow: '#FF9427',
  };

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const { timeleft } = useModel(model, (model) => ({
    timeleft: model.timeleft,
  }));

  const timeleftRef = useRef(30 * 1000);
  const startTimeRef = useRef<number>(0);
  const timerInsRef = useRef<number>();
  const timerRef = useRef<HTMLDivElement>(null);
  const timerSvgRef = useRef<SVGGeometryElement>(null);

  const updateTimer = useCallback(() => {
    const endTime = startTimeRef.current + 30 * 1000;
    const now = new Date();
    const realTimeLeft = Math.max(
      0,
      Math.min(endTime - now.getTime(), 30 * 1000),
    );
    timeleftRef.current = realTimeLeft;

    const realSeconds = Math.ceil(realTimeLeft / 1000);
    const minutes = Math.floor(realSeconds / 60);
    const seconds = realSeconds % 60;
    const displayMinutes = `0${minutes}`.slice(-2);
    const displaySeconds = `0${seconds}`.slice(-2);
    const displayTimer = `${displayMinutes}:${displaySeconds}`;
    if (timerRef.current && timerRef.current.innerHTML !== displayTimer) {
      timerRef.current.innerHTML = displayTimer;
    }

    if (timerSvgRef.current) {
      // 根据时间变化进度条
      let pathLength = timerSvgRef.current.getTotalLength();
      if (
        timerSvgRef.current.style.strokeDasharray.includes(
          pathLength.toFixed(3),
        )
      ) {
        timerSvgRef.current.style.strokeDasharray = pathLength.toFixed(3);
      }
      const a = Math.min(
        pathLength,
        pathLength - Math.floor((realTimeLeft / 30000) * pathLength),
      );
      timerSvgRef.current.style.strokeDashoffset = `${a}`;

      if (realTimeLeft > 0) {
        // 根据时间变化颜色
        if (realTimeLeft < 10000) {
          setAlarm(true);
          if (timerSvgRef.current.style.stroke !== color.red) {
            timerSvgRef.current.style.stroke = color.red;
          }
        } else if (timerSvgRef.current.style.stroke !== color.yellow) {
          timerSvgRef.current.style.stroke = color.yellow;
        }

        timerInsRef.current = requestAnimationFrame(updateTimer);
      } else {
      }
    }
  }, [timeleft]);

  useEffect(() => {
    startTimeRef.current = new Date().getTime() - (30 - (timeleft ?? 0)) * 1000;
  }, [timeleft]);

  useEffect(() => {
    timerInsRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (timerInsRef.current) {
        cancelAnimationFrame(timerInsRef.current);
      }
    };
  }, [updateTimer]);

  return (
    <div
      className={`${styles.countdownContainer} ${
        isInApp && !hasNewCompass ? styles.appNavigate : ''
      }`}
    >
      <div className={styles.countdownTimer} ref={timerRef} />
      <svg
        className={styles.countdownSvg}
        width="100%"
        height="100%"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
      >
        <path
          width="100%"
          height="100%"
          className={styles.countdownPath}
          ref={timerSvgRef}
          fill="rgba(0,0,0,0)"
          stroke="#FF9427"
          strokeWidth="8"
          d="M38.56,4C19.55,4,4,20.2,4,40c0,19.8,15.55,36,34.56,36h122.88C180.45,76,196,59.8,196,40       c0-19.8-15.55-36-34.56-36H38.56z"
          style={{
            strokeDasharray: 467.347,
            strokeDashoffset: 306.347,
            stroke: '#FF9427',
          }}
        ></path>
      </svg>
    </div>
  );
};

export default Countdown;
