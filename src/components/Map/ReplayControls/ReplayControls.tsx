import React, { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import './style.less';

interface ReplayControlsProps {
  totalTime: number;
  hasMobile: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onSeek: (time: number) => void;
  onChangeSpeed: (speed: number) => void;
  isPlaying: boolean;
  currentSpeed?: number;
}

const ReplayControls: React.FC<ReplayControlsProps> = ({
  totalTime,
  hasMobile,
  onPlayPause,
  onRewind,
  onFastForward,
  onSeek,
  onChangeSpeed,
  isPlaying,
  currentSpeed = 1
}) => {

  const [speed, setSpeed] = useState(1);
  const [opacity, setOpacity] = useState(0.8);
  const [internalTime, setInternalTime] = useState(0);  // 内部时间从 0 开始

  // 同步外部倍速变化
  useEffect(() => {
    if (currentSpeed !== speed) {
      setSpeed(currentSpeed);
    }
  }, [currentSpeed]);

  useEffect(() => {
    if (isPlaying) {
      if (internalTime >= totalTime) setInternalTime(0)
      const interval = setInterval(() => {
        setInternalTime(prevTime => {
          const newTime = prevTime + speed / 10;
          if (newTime >= totalTime) {
            clearInterval(interval); // 到达总时间后停止
            return totalTime;
          }
          return newTime;
        });
      }, 100); // 每秒更新时间

      return () => clearInterval(interval); // 清理定时器
    }
  }, [isPlaying, speed, totalTime]);

  useEffect(() => {
    setOpacity(isPlaying ? 0.4 : isMobile ? 0.9 : 0.8);
  }, [isPlaying]);

  useEffect(() => {
    setInternalTime(0)
  }, [totalTime]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSpeedChange = () => {
    // 循环切换：1x -> 2x -> 5x -> 0.5x -> 1x
    const speedCycle = [1, 2, 5, 0.5];
    const currentIndex = speedCycle.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speedCycle.length;
    const newSpeed = speedCycle[nextIndex];
    setSpeed(newSpeed);
    onChangeSpeed(newSpeed);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setInternalTime(newTime);  // 更新当前内部时间
    onSeek(newTime);  // 传递修改后的时间给外部
  };

  const handleFastForward = () => {
    onFastForward()
    setInternalTime(Math.min(totalTime, internalTime + 5))
  }

  const handleRewind = () => {
    onRewind()
    setInternalTime(Math.max(0, internalTime - 5))
  }

  return (
    <div className={`replay-controls ${(hasMobile && !isMobile) ? 'mobile' : ''}`} style={{ opacity }}>
      {/* 播放/暂停按钮 */}
      <button className="play-pause-btn" onClick={onPlayPause}>
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      {/* 回退按钮 */}
      <button className="fast-rewind-btn" onClick={handleRewind}>
        ⏪
      </button>

      {/* 快进按钮 */}
      <button className="fast-forward-btn" onClick={handleFastForward}>
        ⏩
      </button>

      {/* 进度条 */}
      <div className="progress-bar-container">
        <span className={!isPlaying ? "" : "current-time"}>
          {formatTime(internalTime)}
        </span>
        <div className="progress-bar">
          <input
            type="range"
            min="0"
            max={totalTime}
            value={internalTime}
            onChange={handleSeek}  // 即使在暂停时也允许修改进度条
            style={{
              backgroundSize: `${(internalTime / totalTime) * 100}% 100%`, // 动态设置背景的填充比例
            }}
          />
        </div>
        <span className="total-time">{formatTime(totalTime)}</span> {/* 右侧总时长 */}
      </div>

      {/* 倍速控制 */}
      <div className="speed-controls">
        <button className="speed-btn" onClick={handleSpeedChange}>
          {speed}x
        </button>
      </div>
    </div>
  );
};

export default ReplayControls;
