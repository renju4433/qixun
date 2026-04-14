import { useModel } from '@umijs/max';
import { FC, useCallback, useEffect, useRef } from 'react';
import styles from './style.less';

type ChallengeCountdownProps = {
  model: 'Challenge.model';
  setAlarm: (alarm: boolean) => void;
  hasNewCompass: boolean;
};

const ChallengeCountdown: FC<ChallengeCountdownProps> = ({
  model,
  setAlarm,
  hasNewCompass,
}) => {
  const color = {
    red: 'rgb(233, 69, 96)',
    yellow: '#FF9427',
  };

  const { roundTimePeriod, startTime } = useModel(model, (model) => ({
    roundTimePeriod: model.lastRound?.timerGuessStartTime
      ? model.gameData?.roundTimeGuessPeriod ?? 0
      : model.gameData?.roundTimePeriod ?? 0,
    startTime:
      model.lastRound?.timerGuessStartTime ??
      model.lastRound?.timerStartTime ??
      0,
  }));

  const timeleftRef = useRef(roundTimePeriod);
  const timerInsRef = useRef<number>();
  const timerRef = useRef<HTMLDivElement>(null);
  const timerSvgRef = useRef<SVGGeometryElement>(null);
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const updateTimer = useCallback(() => {
    const endTime = startTime + roundTimePeriod;
    const now = new Date();
    const realTimeLeft = Math.max(
      0,
      Math.min(endTime - now.getTime(), roundTimePeriod),
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
        pathLength - Math.floor((realTimeLeft / roundTimePeriod) * pathLength),
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
  }, [startTime, roundTimePeriod]);

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
        styles.countdownCenterContainer
      } ${isInApp && !hasNewCompass ? styles.appNavigate : ''}`}
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

export default ChallengeCountdown;
