import qixunAvatar from '@/components/User/qixunAvatar';
import { distanceDisplay } from '@/services/extend';
import { ShareAltOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Button, Divider, Statistic, Tooltip, message } from 'antd';
import BigNumber from 'bignumber.js';
import copy from 'copy-to-clipboard';
import dayjs from 'dayjs';
import { FC, useCallback } from 'react';
import styles from './style.less';

type DailyChallengeInfoProps = {
  type: DailyChallengeType;
  data: API.MyDailyChallengeRank;
  totalScore: number;
  results: API.GameRoundResult[];
  gameId: string;
};

const DailyChallengeScore = ({ score, distance }: API.GameRoundResult) => (
  <Tooltip
    title={
      <div>
        <div className={styles.scoreTip}>得分：{score.toFixed(0)}</div>
        <div className={styles.distanceTip}>{distanceDisplay(distance)}</div>
      </div>
    }
  >
    <div
      className={styles.scoreSquare}
      style={
        score === 5000
          ? {
              background:
                'linear-gradient(135deg, #ff0000 0%, #ff7f00 20%, #ffff00 40%, #00ff00 55%, #0000ff 70%, #4b0082 90%, #8b00ff 100%)',
            }
          : score > 4000
          ? { backgroundColor: 'rgb(135, 206, 250)' }
          : score > 3000
          ? { backgroundColor: 'rgb(144, 238, 144)' }
          : score > 2000
          ? { backgroundColor: 'rgb(255, 255, 224)' }
          : score > 1000
          ? { backgroundColor: 'rgb(255, 215, 179)' }
          : { backgroundColor: 'rgb(240, 128, 128)' }
      }
    />
  </Tooltip>
);

const scoreEmoji = (score: number) =>
  score === 5000
    ? '🌈'
    : score > 4000
    ? '🟦'
    : score > 3000
    ? '🟩'
    : score > 2000
    ? '🟨'
    : score > 1000
    ? '🟧'
    : '🟥';

const DailyChallengeInfo: FC<DailyChallengeInfoProps> = ({
  type,
  data,
  totalScore,
  results,
  gameId,
}) => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  /**
   * 在图片分享未完成前使用文字分享
   */
  const handleShare = useCallback(() => {
    const shareText = `棋寻${dayjs().format('YYYY年MM月DD日')}
每日挑战-${type === 'china' ? '中国' : '全球'}
我的得分：${totalScore}
${results.map((result) => scoreEmoji(result.score)).join(' ')}
排名：${data?.rank}/${data?.total}
https://saiyuan.top/daily-challenge/${type}`;
    copy(shareText);
    message.success('复制成功，去分享吧！');
  }, [data, results, totalScore, type]);

  return (
    <>
      <ProCard className={styles.infoWrapper}>
        <div className={styles.userInfo}>
          {user && <qixunAvatar user={user!} size={40} />}
          <p>{user?.userName}</p>
        </div>
        <Divider type="vertical" />
        <Statistic
          title="得分"
          value={totalScore}
          suffix="/ 25000"
          formatter={(value) => value.toString().replace(/,/g, '')}
        />
        <Divider type="vertical" />
        <Statistic
          title="排名"
          value={data?.rank ?? 0}
          suffix={`/ ${data?.total}`}
          formatter={(value) => value.toString().replace(/,/g, '')}
        />
        <Divider type="vertical" />
        <div className={styles.roundResult}>
          <div className={styles.roundResultTitle}>回合</div>
          <div className={styles.roundResultValue}>
            {results.map((result) => (
              <DailyChallengeScore key={result.round} {...result} />
            ))}
          </div>
        </div>
      </ProCard>
      <p className={styles.rankPercent}>
        已超越{' '}
        <span>
          {`${new BigNumber(1)
            .minus(data?.percent ?? 1)
            .times(100)
            .toFixed(2)}%`}
        </span>{' '}
        选手{' '}
        <Button
          type="primary"
          ghost
          shape="round"
          size="small"
          onClick={() => history.push(`/replay?gameId=${gameId}`)}
        >
          复盘
        </Button>{' '}
        <Button
          type="primary"
          ghost
          shape="circle"
          icon={<ShareAltOutlined />}
          size="small"
          title="分享"
          onClick={handleShare}
        />
      </p>
    </>
  );
};

export default DailyChallengeInfo;
