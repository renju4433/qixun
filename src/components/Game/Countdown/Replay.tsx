import { useModel } from '@umijs/max';
import { useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import styles from './style.less';


type CountdownProps = {
  setAlarm: (alarm: boolean) => void;
  hasNewCompass: boolean;
  timeleft: number;
  speed?: number;
};

export type CountdownHandle = {
  resetSeconds: (newTimeleft: number) => void;
  resetSpeed: (newSpeed: number) => void;
  pauseAndResume: () => void;
};

const Countdown = forwardRef<CountdownHandle, CountdownProps>(
  ({ setAlarm, hasNewCompass, timeleft, speed = 1 }, ref) => {
    const color = {
      red: 'rgb(233, 69, 96)',
      yellow: '#FF9427',
    };

    const { isInApp } = useModel('@@initialState', (model) => ({
      isInApp: model.initialState?.isInApp,
    }));

    const timeleftRef = useRef(timeleft * 1000);
    const startTimeRef = useRef<number>(0);
    const timerInsRef = useRef<number>();
    const timerRef = useRef<HTMLDivElement>(null);
    const timerSvgRef = useRef<SVGGeometryElement>(null);
    const speedRef = useRef(speed);
    const isPlayingRef = useRef(true);
    const pauseTimeRef = useRef<number>(0)

    const updateTimer = useCallback(() => {
      if (!isPlayingRef.current) return;

      const now = Date.now();
      const elapsedTime = now - startTimeRef.current;
      const adjustedElapsedTime = elapsedTime * speedRef.current;
      const realTimeLeft = Math.max(0, timeleftRef.current - adjustedElapsedTime);

      // 更新显示
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
        let pathLength = timerSvgRef.current.getTotalLength();
        if (timerSvgRef.current.style.strokeDasharray.includes(pathLength.toFixed(3))) {
          timerSvgRef.current.style.strokeDasharray = pathLength.toFixed(3);
        }
        const a = Math.min(
          pathLength,
          pathLength - Math.floor((realTimeLeft / timeleftRef.current) * pathLength),
        );
        timerSvgRef.current.style.strokeDashoffset = `${a}`;

        if (realTimeLeft > 0) {
          if (realTimeLeft < 10000) {
            setAlarm(true); // 触发警报
            if (timerSvgRef.current.style.stroke !== color.red) {
              timerSvgRef.current.style.stroke = color.red;
            }
          } else if (timerSvgRef.current.style.stroke !== color.yellow) {
            timerSvgRef.current.style.stroke = color.yellow;
          }

          timerInsRef.current = requestAnimationFrame(updateTimer);
        } else {
          setAlarm(false);
        }
      }
    }, [setAlarm]);

    const pauseAndResume = () => {
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        pauseTimeRef.current = Date.now();
        if (timerInsRef.current) {
          cancelAnimationFrame(timerInsRef.current);
          timerInsRef.current = undefined;
        }
      } else {
        isPlayingRef.current = true;
        const pauseDuration = Date.now() - pauseTimeRef.current;
        startTimeRef.current += pauseDuration;
        timerInsRef.current = requestAnimationFrame(updateTimer);
      }
    };

    useEffect(() => {

      startTimeRef.current = Date.now();
      timeleftRef.current = timeleft * 1000;

    }, [timeleft]);

    useEffect(() => {
      if (isPlayingRef.current) {
        timerInsRef.current = requestAnimationFrame(updateTimer);
      }

      return () => {
        if (timerInsRef.current) {
          cancelAnimationFrame(timerInsRef.current);
        }
      };
    }, [updateTimer]);

    useImperativeHandle(ref, () => ({
      resetSeconds: (newTimeleft: number) => {
        timeleftRef.current = newTimeleft * 1000;
        startTimeRef.current = Date.now();
        if (timerInsRef.current) {
          cancelAnimationFrame(timerInsRef.current);
        }
        timerInsRef.current = requestAnimationFrame(updateTimer);
      },
      resetSpeed: (newSpeed: number) => {
        speedRef.current = newSpeed; // 只更新速度
        /*if (timerInsRef.current) {
          cancelAnimationFrame(timerInsRef.current);
        }
        timerInsRef.current = requestAnimationFrame(updateTimer);*/
      },
      pauseAndResume,
    }));

    return (
      <div
        className={`${styles.countdownContainer} ${isInApp && !hasNewCompass ? styles.appNavigate : ''
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
  },
);

export default Countdown;
