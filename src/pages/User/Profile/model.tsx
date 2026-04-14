import { FC } from 'react';
import styles from './style.less';

type VIPLabelProps = {
  fontSize?: string;
  color?: string;
  children?: React.ReactNode;
  /** 点击「棋寻会员」文字时触发（如他人首页可点击打开续费开通 modal） */
  onLabelClick?: () => void;
};

export const VIPLabel: FC<VIPLabelProps> = ({
  fontSize,
  color,
  children,
  onLabelClick,
}) => {
  if (
    new Date().getTime() >= 1743436800000 &&
    new Date().getTime() <= 1743523200000
  ) {
    return <div style={{ fontSize, color: 'red' }}>封禁中{children}</div>;
  }
  const label = (
    <span
      style={
        onLabelClick ? { cursor: 'pointer' } : undefined
      }
      onClick={onLabelClick}
      onKeyDown={
        onLabelClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onLabelClick();
              }
            }
          : undefined
      }
      role={onLabelClick ? 'button' : undefined}
    >
      棋寻会员
    </span>
  );
  return (
    <div style={{ fontSize, color }}>
      {label}
      {children}
    </div>
  );
};

type RatingInfoProps = {
  typeRank: API.TypeRank;
  rank: string;
};

export const RatingInfo: FC<RatingInfoProps> = ({ rank, typeRank }) => (
  <div className={styles.point}>
    <div className={styles.title}>
      {`${rank}积分: ${typeRank.rating ?? '-'}`}
      <span className={styles.rank}>(排名: {typeRank.rank ?? '-'})</span>
    </div>
    <div className={styles.grid}>
      {[
        { name: '总场次', value: typeRank.gameTimes },
        { name: '最高分', value: typeRank.maxRating },
        { name: '上赛季排名', value: typeRank.lastRanking },
        {
          name: '匹配胜率',
          value:
            typeRank.soloTimes === 0
              ? '-'
              : `${((typeRank.soloWin / typeRank.soloTimes) * 100).toFixed(
                  2,
                )}%`,
        },
        { name: '匹配次数', value: typeRank.soloTimes },
        { name: '当前连胜', value: typeRank.winningStreak || '0' },
        { name: '最长连胜', value: typeRank.longestWinningStreak || '0' },
        { name: '当前连败', value: typeRank.loseStreak || '0' },
        { name: '最长连败', value: typeRank.longestLoseStreak || '0' },
      ].map(({ name, value }) => (
        <div className={styles.cell} key={name}>
          <div className={styles.name}>{name}</div>
          <div className={styles.number}>{value ?? '-'}</div>
        </div>
      ))}
    </div>
  </div>
);
