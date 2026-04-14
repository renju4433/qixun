import { useModel } from '@umijs/max';
import { Divider } from 'antd';
import BigNumber from 'bignumber.js';
import { FC } from 'react';
import GameTitle from '../GameTitle';
import styles from './style.less';

type RoundInfoProps = {
  model: 'Challenge.model';
};

const RoundInfo: FC<RoundInfoProps> = ({ model }) => {
  const { mapsName, mapsId, round, roundNumber, totalScore, type } = useModel(
    model,
    (model) => ({
      type: model?.gameData?.type,
      mapsId: model?.gameData?.mapsId,
      mapsName: model?.gameData?.mapsName,
      round: model?.gameData?.currentRound,
      roundNumber: model?.gameData?.roundNumber,
      totalScore: model?.gameData?.player.totalScore,
    }),
  );

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  return (
    <div className={`${styles.roundWrapper} ${isInApp ? styles.inApp : ''}`}>
      {mapsId && !window.matchMedia('(max-width: 679px)').matches && (
        <>
          <div className={styles.roundInfoBox}>
            <div className={styles.roundInfoTitle}>题库</div>
            <div className={styles.roundInfoValue}>
              <GameTitle mapsName={mapsName} type={type} mapsId={mapsId} />
            </div>
          </div>
          <Divider type="vertical" />
        </>
      )}
      {type !== 'map_country_streak' &&
        type !== 'country_streak' &&
        type !== 'province_streak' && (
          <>
            <div className={styles.roundInfoBox}>
              <div className={styles.roundInfoTitle}>回合</div>
              {type !== 'infinity' && (
                <div className={styles.roundInfoValue}>
                  {round} / {roundNumber}
                </div>
              )}
              {type === 'infinity' && (
                <div className={styles.roundInfoValue}>{round}</div>
              )}
            </div>
            <Divider type="vertical" />
            <div className={styles.roundInfoBox}>
              <div className={styles.roundInfoTitle}>总分</div>
              <div className={styles.roundInfoValue}>
                {new BigNumber(totalScore || 0).toFormat()}
              </div>
            </div>
          </>
        )}

      {type?.includes('streak') && (
        <div className={styles.roundInfoBox}>
          {type === 'country_streak' && (
            <div className={styles.roundInfoTitle}>国家连胜</div>
          )}
          {type === 'province_streak' && (
            <div className={styles.roundInfoTitle}>省份连胜</div>
          )}
          {type === 'map_country_streak' && (
            <div className={styles.roundInfoTitle}>题库国家连胜</div>
          )}
          <div className={styles.roundInfoValue}>{(round ?? 1) - 1}</div>
        </div>
      )}
    </div>
  );
};

export default RoundInfo;
