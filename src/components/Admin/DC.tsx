import {
  banUser,
  getDailyChallengeId,
  getDailyChallengeRank,
  listDailyChallengeLink,
} from '@/services/api';
import { Modal, Table, Tag, message, Button, Space, InputNumber } from 'antd';
import { useEffect, useState } from 'react';

type DCProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

type DailyChallengeBanUser = {
  user: API.UserProfile;
  mode?: string[];
  scoreChina?: number;
  scoreWorld?: number;
};

const SCORE_THRESHOLD_DEFAULT = 24990;

const DC: React.FC<DCProps> = ({ show, setShow }) => {
  const [waitingForBanList, setWaitingForBanList] = useState<
    DailyChallengeBanUser[]
  >([]);
  const [banList, setBanList] = useState<API.UserIdParams[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoreThreshold, setScoreThreshold] = useState(SCORE_THRESHOLD_DEFAULT);
  const [allRankData, setAllRankData] = useState<DailyChallengeBanUser[]>([]);

  useEffect(() => {
    if (!show) return;

    const fetchData = async (type: 'china' | 'world') => {
      try {
        const res = await getDailyChallengeId({ type });
        const rankRes = await getDailyChallengeRank({
          challengeId: res.data,
          rankType: 'rankNew',
        });
        return rankRes.data.rank.map((user) => ({
          user: user.user,
          score: user.score,
          mode: [type],
        }));
      } catch (error) {
        message.error(`获取每日挑战数据失败: ${type}`);
        return [];
      }
    };
    const fetchAllData = async () => {
      setLoading(true);
      const worldData = await fetchData('world');
      const chinaData = await fetchData('china');
      const userMap = new Map<number, DailyChallengeBanUser>();
      worldData.forEach((u) => {
        userMap.set(u.user.userId, {
          user: u.user,
          mode: ['world'],
          scoreWorld: u.score,
        });
      });
      chinaData.forEach((u) => {
        const existing = userMap.get(u.user.userId);
        if (existing) {
          existing.mode = [...new Set([...(existing.mode || []), 'china'])];
          existing.scoreChina = u.score;
        } else {
          userMap.set(u.user.userId, {
            user: u.user,
            mode: ['china'],
            scoreChina: u.score,
          });
        }
      });
      setAllRankData(Array.from(userMap.values()));
      setLoading(false);
    };
    fetchAllData();
  }, [show]);

  useEffect(() => {
    setWaitingForBanList(
      allRankData.filter(
        (user) =>
          (user.scoreChina ?? 0) > scoreThreshold ||
          (user.scoreWorld ?? 0) > scoreThreshold,
      ),
    );
  }, [allRankData, scoreThreshold]);

  const handleBanUser = async (banList: API.UserIdParams[]) => {
    for (const user of banList) {
      try {
        // 从 waitingForBanList 中查找用户信息（包括模式）
        const userInfo = waitingForBanList.find((u) => u.user.userId === user.userId);
        if (!userInfo) {
          message.error(`未找到用户 ${user.userId} 的信息`);
          continue;
        }

        // 获取复盘链接
        const replayRes = await listDailyChallengeLink({ userId: String(user.userId) });

        let moreContent = '';
        if (replayRes.success && replayRes.data) {
          const { gameIdChina, gameIdWorld } = replayRes.data;
          const links: string[] = [];

          // 根据用户参与的模式添加对应的复盘链接
          if (userInfo.mode?.includes('china') && gameIdChina) {
            links.push(`https://saiyuan.top/replay?gameId=${gameIdChina}`);
          }
          if (userInfo.mode?.includes('world') && gameIdWorld) {
            links.push(`https://saiyuan.top/replay?gameId=${gameIdWorld}`);
          }

          // 构建 more 参数：链接（如果有多个用换行分割）+ 说明文字
          if (links.length > 0) {
            moreContent = links.join('\n') + '\n在每日挑战中作弊取得高分的，以任何方式提前获取答案的，处7日以上封禁。';
          } else moreContent = '在每日挑战中作弊取得高分的，以任何方式提前获取答案的，处7日以上封禁。';
        } else moreContent = '在每日挑战中作弊取得高分的，以任何方式提前获取答案的，处7日以上封禁。';

        await banUser({
          time: 7,
          userId: user.userId,
          timeUnit: 'day',
          reason: '每日挑战作弊',
          more: moreContent,
        });
        message.success(`封禁用户 ${user.userId} 成功`);
      } catch (error) {
        message.error(`封禁用户 ${user.userId} 失败`);
      }
    }
  };

  const handleViewReplay = async (userId: number, modes: string[]) => {
    try {
      const res = await listDailyChallengeLink({ userId: String(userId) });
      if (res.success && res.data) {
        const { gameIdChina, gameIdWorld } = res.data;

        // 根据用户参与的模式打开对应的复盘链接
        if (modes.includes('china') && gameIdChina) {
          window.open(`/replay?gameId=${gameIdChina}`, '_blank');
        }
        if (modes.includes('world') && gameIdWorld) {
          window.open(`/replay?gameId=${gameIdWorld}`, '_blank');
        }

        if (!gameIdChina && !gameIdWorld) {
          message.warning('暂无复盘数据');
        }
      } else {
        message.error('获取复盘链接失败');
      }
    } catch (error) {
      message.error('获取复盘链接失败');
    }
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
      render: (text: string, record: DailyChallengeBanUser) => (
        <span>{record.user.userId}</span>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
      render: (text: string, record: DailyChallengeBanUser) => (
        <span>{record.user.userName}</span>
      ),
    },
    {
      title: '中国区',
      dataIndex: 'scoreChina',
      key: 'scoreChina',
      width: 90,
      render: (score: number | undefined) =>
        score !== undefined ? (
          <span style={{ color: score > scoreThreshold ? '#f5222d' : undefined, fontWeight: score > scoreThreshold ? 600 : undefined }}>
            {score}
          </span>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        ),
    },
    {
      title: '世界区',
      dataIndex: 'scoreWorld',
      key: 'scoreWorld',
      width: 90,
      render: (score: number | undefined) =>
        score !== undefined ? (
          <span style={{ color: score > scoreThreshold ? '#1890ff' : undefined, fontWeight: score > scoreThreshold ? 600 : undefined }}>
            {score}
          </span>
        ) : (
          <span style={{ color: '#ccc' }}>-</span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (text: string, record: DailyChallengeBanUser) => (
        <Space>
          <a href={`/user/${record.user.userId}`} target="_blank" rel="noreferrer">
            查看主页
          </a>
          <Button
            type="link"
            size="small"
            onClick={() => handleViewReplay(record.user.userId, record.mode || [])}
          >
            查看复盘
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      centered
      title={`每日挑战一键封禁 (共 ${waitingForBanList.length} 个高分用户)`}
      open={show}
      onCancel={() => {
        setBanList([]);
        setShow(false);
      }}
      onOk={() => handleBanUser(banList)}
      okText={`确认封禁 (${banList.length}个)`}
      okButtonProps={{ disabled: banList.length === 0 }}
      width={800}
      bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
    >
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>分数阈值:</span>
        <InputNumber
          min={20000}
          max={25000}
          step={100}
          value={scoreThreshold}
          onChange={(v) => setScoreThreshold(v ?? SCORE_THRESHOLD_DEFAULT)}
          style={{ width: 100 }}
        />
        <Tag color="orange">&gt; {scoreThreshold}</Tag>
        <Tag color="red">中国区: {waitingForBanList.filter(u => (u.scoreChina ?? 0) > scoreThreshold).length} 人</Tag>
        <Tag color="blue">世界区: {waitingForBanList.filter(u => (u.scoreWorld ?? 0) > scoreThreshold).length} 人</Tag>
      </div>
      <Table
        size="small"
        tableLayout="fixed"
        scroll={{ y: 400 }}
        pagination={false}
        loading={loading}
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys, selectedRows) =>
            setBanList(
              selectedRows.map((row) => ({ userId: row.user.userId })),
            ),
        }}
        columns={columns}
        dataSource={waitingForBanList}
        rowKey={(record) => record.user.userId}
      />
    </Modal>
  );
};

export default DC;