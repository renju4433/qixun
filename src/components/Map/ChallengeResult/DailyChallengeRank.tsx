import { getMyDailyChallengeRank } from '@/services/api';
import { useRequest } from '@umijs/max';
import BigNumber from 'bignumber.js';
import { FC } from 'react';
import styles from './style.less';

type DailyChallengeRankProps = {
  challengeId: string;
  gameId: string;
};
const DailyChallengeRank: FC<DailyChallengeRankProps> = ({
  challengeId,
  gameId,
}) => {
  const { data } = useRequest(() =>
    getMyDailyChallengeRank({ challengeId, gameId }),
  );
  return (
    <div className={styles.dailyChallengeRank}>
      排名 <span>{data?.rank}</span>，超过{' '}
      <span>
        {`${new BigNumber(1)
          .minus(data?.percent ?? 1)
          .times(100)
          .toFixed(2)}%`}
      </span>{' '}
      选手
    </div>
  );
};

export default DailyChallengeRank;
