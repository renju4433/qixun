import { Button, Space } from 'antd';
import BigNumber from 'bignumber.js';
import { FC } from 'react';
import resultStyles from '@/components/Map/ChallengeResult/style.less';

type ChessRoundResultProps = {
  round: number;
  roundNumber: number;
  roundResult: {
    score: number;
    cpDiff: number;
    bestMove: string;
    userMove: string;
    totalScore: number;
  };
  finished: boolean;
  onNext: () => void;
  onBack: () => void;
};

const ChessRoundResult: FC<ChessRoundResultProps> = ({
  round,
  roundNumber,
  roundResult,
  finished,
  onNext,
  onBack,
}) => {
  return (
    <div className={`${resultStyles.wrapper} ${resultStyles.challengeWrap}`}>
      <div className={resultStyles.innerWrapper}>
        <div className={resultStyles.scoreReulst}>
          <div className={resultStyles.round}>
            <div className={resultStyles.scoreReulstLabel}>回合</div>
            <div className={resultStyles.scoreReulstValue}>
              {round} / {roundNumber}
            </div>
          </div>

          <div className={resultStyles.distance}>
            <div className={resultStyles.scoreReulstLabel}>估分差</div>
            <div className={resultStyles.scoreReulstValue}>
              {new BigNumber(roundResult.cpDiff || 0).toFormat()}
            </div>
          </div>

          <div className={resultStyles.score}>
            <div className={resultStyles.scoreReulstLabel}>得分</div>
            <div className={resultStyles.scoreReulstValue}>
              {new BigNumber(roundResult.score || 0).toFormat()} <small>/ 5000</small>
            </div>
          </div>

          <div className={resultStyles.totalScore}>
            <div className={resultStyles.scoreReulstLabel}>总分</div>
            <div className={resultStyles.scoreReulstValue}>
              {new BigNumber(roundResult.totalScore || 0).toFormat()}
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem 1rem 0', textAlign: 'center', color: '#fff' }}>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>你的走法</div>
          <div style={{ fontSize: '1.6rem', marginBottom: 18 }}>{roundResult.userMove}</div>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>最佳走法</div>
          <div style={{ fontSize: '1.6rem' }}>{roundResult.bestMove}</div>
        </div>

        <div className={resultStyles.controls}>
          <Space wrap align="center" style={{ justifyContent: 'center' }}>
            <Button type="primary" ghost shape="round" size="large" onClick={onBack}>
              返回
            </Button>
            {!finished && (
              <Button type="primary" shape="round" size="large" onClick={onNext}>
                下一题
              </Button>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ChessRoundResult;
