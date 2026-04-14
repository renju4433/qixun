import init from '@/components/Admin/Init';
import Tips from '@/components/Match/Tips';
import PointHint from '@/components/Point/PointHint';
import WarningChecker from '@/components/TimeChekcer';
import NormalPage from '@/pages/NormalPage';
import {
  checkMatchOpenRequest,
  startChinaMatching,
  startWorldMoveMatching,
  startWorldNoMoveMatching,
  startWorldNpmzMatching,
} from '@/services/api';
import { history, useModel, useNavigate } from '@@/exports';
import { Alert, Button, Flex, Spin, Tabs, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeamMatch from './TeamMatch';
const { Text } = Typography;

const AllMatch = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'team';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // 全球积分匹配状态
  const [worldMatching, setWorldMatching] = useState<boolean>(false);
  const [worldMatchingType, setWorldMatchingType] = useState<string>();
  const [matchOpen, setMatchOpen] = useState<boolean>(false);
  const worldTimer = useRef<number | null>(null);

  // 中国积分匹配状态
  const [chinaMatching, setChinaMatching] = useState<boolean>(false);
  const chinaTimer = useRef<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    init();
    checkOpen();

    // 自动开始匹配：如果 URL 有 from 参数
    const from = searchParams.get('from');
    const tab = searchParams.get('tab');

    if (from && tab) {
      setTimeout(() => {
        if (tab === 'china') {
          startChinaMatchingFn();
        } else if (tab === 'world') {
          startWorldMatching(from);
        }
      }, 200);
    }
  }, []);

  const checkOpenTimer = useRef<number | null>(null);

  const checkOpen = () => {
    checkMatchOpenRequest().then((res) => {
      if (res.success) setMatchOpen(res.data);
    });
    checkOpenTimer.current = window.setInterval(() => {
      checkMatchOpenRequest().then((res) => {
        if (res.success) setMatchOpen(res.data);
      });
    }, 10000);
  };

  // 清理 URL 中的 from 参数
  const clearFromParam = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newSearchParams.has('from')) {
      newSearchParams.delete('from');
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  // ===== 全球积分匹配 =====
  const cleanWorldTimer = () => {
    setWorldMatching(false);
    if (worldTimer.current) window.clearInterval(worldTimer.current);
  };

  // 用户手动取消匹配
  const cancelWorldMatching = () => {
    cleanWorldTimer();
    clearFromParam();
  };

  const worldMatchApi = {
    move: startWorldMoveMatching,
    noMove: startWorldNoMoveMatching,
    npmz: startWorldNpmzMatching,
  };

  const worldTypeNames: Record<string, string> = {
    move: '移动',
    noMove: '固定',
    npmz: '固定视角',
  };

  const startWorldMatching = (type: string) => {
    if (!user) {
      history.push('/user/login');
      return;
    }
    cleanWorldTimer();
    setWorldMatching(true);
    setWorldMatchingType(type);

    const api = worldMatchApi[type as keyof typeof worldMatchApi];
    if (!api) return;

    worldTimer.current = window.setInterval(() => {
      api({ interval: 1500 }).then((res) => {
        if (res.success && res.data) {
          cleanWorldTimer();
          history.push('/solo/' + res.data);
        }
      });
    }, 1500);
  };

  // ===== 中国积分匹配 =====
  const cleanChinaTimer = () => {
    setChinaMatching(false);
    if (chinaTimer.current) window.clearInterval(chinaTimer.current);
  };

  // 用户手动取消匹配
  const cancelChinaMatching = () => {
    cleanChinaTimer();
    clearFromParam();
  };

  const startChinaMatchingFn = () => {
    if (!user) {
      history.push('/user/login');
      return;
    }
    cleanChinaTimer();
    setChinaMatching(true);
    chinaTimer.current = window.setInterval(() => {
      startChinaMatching({ interval: 1500 }).then((res) => {
        if (res.success && res.data) {
          cleanChinaTimer();
          history.push('/solo/' + res.data);
        }
      });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      cleanWorldTimer();
      cleanChinaTimer();
      if (checkOpenTimer.current) window.clearInterval(checkOpenTimer.current);
    };
  }, []);

  // 处理 tab 切换，更新 URL 参数
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', key);
    setSearchParams(newSearchParams, { replace: true });
  };

  const items = [
    {
      key: 'team',
      label: '娱乐/组队',
      children: <TeamMatch />,
    },
    {
      key: 'china',
      label: '中国积分',
      children: (
        <Flex gap="2rem" style={{ textAlign: 'center' }} vertical>
          <Flex gap="middle" vertical>
            <Alert
              type="warning"
              message={
                <>
                  在积分赛事中搜索题中信息/查询手机号归属地均属
                  <a
                    href="https://www.yuque.com/chaofun/qixun/rules"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    作弊行为
                  </a>
                </>
              }
            />
            <PointHint />
            <Text type="secondary">
              有一处莫斯科街景作为平衡点 用以均衡题目得分
            </Text>
            <WarningChecker />
          </Flex>

          {chinaMatching ? (
            <Flex align="center" gap="middle" vertical>
              <Spin size="large" />
              <Tips />
              <Text type="warning">正在匹配</Text>
              <Button onClick={cancelChinaMatching}>结束匹配</Button>
            </Flex>
          ) : (
            <Flex align="center" gap="2rem" vertical>
              <Button size="large" onClick={startChinaMatchingFn}>
                开始匹配
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/point-rank?type=china')}
              >
                积分排行
              </Button>
            </Flex>
          )}
        </Flex>
      ),
    },
    {
      key: 'world',
      label: '全球积分',
      children: (
        <Flex gap="2rem" style={{ textAlign: 'center' }} vertical>
          <Flex gap="middle" vertical>
            <Alert
              type="warning"
              message={
                <>
                  在积分赛事中搜索题中信息属于
                  <a
                    href="https://www.yuque.com/chaofun/qixun/rules"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    作弊行为
                  </a>
                </>
              }
            />
            <PointHint />
            <WarningChecker />
          </Flex>

          {worldMatching ? (
            <Flex align="center" gap="middle" vertical>
              <Spin size="large" />
              <Tips />
              <Text type="warning">
                正在{worldTypeNames[worldMatchingType || '']}匹配
              </Text>
              <Button onClick={cancelWorldMatching}>结束匹配</Button>
            </Flex>
          ) : (
            <Flex align="center" gap="2rem" vertical>
              <Button size="large" onClick={() => history.push('/point')}>
                积分赛
              </Button>
              <Button size="large" onClick={() => startWorldMatching('noMove')}>
                固定匹配
              </Button>
              <Flex align="center" vertical>
                <Button
                  disabled={!matchOpen}
                  size="large"
                  onClick={() => startWorldMatching('move')}
                >
                  移动匹配
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  周六日晚20:00-22:00点开启
                </Text>
              </Flex>
              <Flex align="center" vertical>
                <Button
                  disabled={!matchOpen}
                  size="large"
                  onClick={() => startWorldMatching('npmz')}
                >
                  固定视角匹配
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  周六日晚20:00-22:00点开启
                </Text>
              </Flex>
              <Button
                size="large"
                onClick={() => navigate('/point-rank?type=world')}
              >
                积分排行
              </Button>
            </Flex>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <NormalPage title="匹配" desc="">
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={items}
        centered
        size="large"
      />
    </NormalPage>
  );
};

export default AllMatch;