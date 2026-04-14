import { FC } from 'react';
import styles from './style.less';

type ScoreShareProps = {
  type: 'china' | 'world';
  rank: API.MyDailyChallengeRank;
};

const ScoreShare: FC<ScoreShareProps> = ({ type }) => (
  <div className={styles.wrapper}>
    <div className={styles.header}>
      <div className={styles.headerLogo}>
        <span>棋寻</span>
      </div>
      <div className={styles.headerTitle}>
        每日挑战-{type === 'china' ? '中国' : '世界'}
      </div>
    </div>
    <div className={styles.body}></div>
  </div>
);

export default ScoreShare;
