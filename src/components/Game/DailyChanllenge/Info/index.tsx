import qixunAvatar from '@/components/User/qixunAvatar';
import { getDailyChallengeSolution } from '@/services/api';
import { distanceDisplay } from '@/services/extend';
import { ShareAltOutlined } from '@ant-design/icons';
import { ProCard } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import {
  Button,
  Divider,
  Flex,
  message,
  Modal,
  Statistic,
  Tooltip,
  Typography,
} from 'antd';
import BigNumber from 'bignumber.js';
import copy from 'copy-to-clipboard';
import dayjs from 'dayjs';
import { FC, useCallback, useEffect, useState } from 'react';
import styles from './style.less';

const { Paragraph } = Typography;

type DailyChallengeInfoProps = {
  type: DailyChallengeType;
  data: API.MyDailyChallengeRank;
  totalScore: number;
  results: API.GameRoundResult[];
  gameId: string;
  provider?: API.UserProfile;
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
  provider,
}) => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [open, setOpen] = useState(false);
  const [solution, setSolution] = useState<string>();

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

  useEffect(() => {
    getDailyChallengeSolution({ type: type }).then((res) => {
      if (res.success) {
        setSolution(res.data);
      }
    });
  }, [type]);

  return (
    <>
      {provider && (
        <div
          style={{
            borderRadius: '6px',
            paddingBottom: 10,
            boxSizing: 'border-box',
          }}
        >
          <Flex style={{ alignItems: 'center' }}>
            <span style={{ color: '#9d9ca7' }}>出题人</span>{' '}
            <Divider type="vertical" />
            <qixunAvatar user={provider!} size={50} />
            <span style={{ fontSize: 18 }}>{provider?.userName}</span>
          </Flex>
        </div>
      )}
      {solution && (
        <>
          <Button
            type="link"
            style={{ paddingBottom: 15 }}
            onClick={() => {
              setOpen(true);
            }}
          >
            查看解析
          </Button>
          <Modal
            okButtonProps={{ style: { display: 'none' } }}
            cancelText="关闭"
            title="今日解析"
            open={open}
            onCancel={() => {
              setOpen(false);
            }}
          >
            <Typography>
              {solution?.split('\n').map((v, i) => (
                <Paragraph key={i}>{v}</Paragraph>
              ))}
            </Typography>
          </Modal>
        </>
      )}

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
        超过了{' '}
        <span>
          {`${new BigNumber(1)
            .minus(data?.percent ?? 1)
            .times(100)
            .toFixed(2)}%`}
        </span>{' '}
        玩家{' '}
        <Button
          type="primary"
          ghost
          shape="round"
          size="small"
          onClick={() => history.push(`/replay?gameId=${gameId}`)}
          style={{ marginLeft: 2, marginRight: 2 }}
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
