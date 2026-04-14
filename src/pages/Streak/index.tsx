import StreakRank from '@/components/Game/Streak/Rank';
import { checkVipState, CreateStreak } from '@/services/api';
import { useModel, useNavigate } from '@umijs/max';
import { useRequest } from 'ahooks';
import { Button, Divider, Flex, message, Tabs, Typography } from 'antd';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NormalPage from '../NormalPage';

const { Text } = Typography;

const Streak = () => {
  const navigate = useNavigate();
  const { user } = useModel('@@initialState', (model: any) => ({
    user: model.initialState?.user,
  }));
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: vipExpireDate } = useRequest(checkVipState);
  const initialTab = searchParams.get('tab') || 'province';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // 开始挑战
  const startStreakGame = (startType: StreakType) => {
    // 判断是否登录
    if (!user?.userId) {
      navigate('/user/login?redirect=' + encodeURIComponent(location.href));
      return;
    }
    // 判断会员
    if (startType.includes('move') && !vipExpireDate?.data) {
      message.warning('请开通 VIP');
      return;
    }
    // 跳转连胜
    CreateStreak({ type: startType }).then((res) => navigate(`/solo/${res.data.id}`));
  };

  // 处理 tab 切换，更新 URL 参数
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', key);
    setSearchParams(newSearchParams, { replace: true });
  };

  // 创建 Tab 项
  const createTabItem = (
    key: StreakType,
    label: string,
    ruleText: string,
    loadingMessage?: string
  ) => {
    const isMove = key.includes('move');
    const needsVip = isMove && !vipExpireDate?.data;

    return {
      key,
      label,
      children: (
        <Flex gap="middle" style={{ textAlign: 'center' }} vertical>
          <Text type="secondary">连续选对正确的{ruleText}，你最多坚持多少轮呢？</Text>
          <Flex align="center" gap="small" vertical>
            <Button
              size="large"
              type="primary"
              disabled={needsVip}
              onClick={() => {
                if (loadingMessage) message.loading(loadingMessage);
                startStreakGame(key);
              }}
            >
              开始新挑战
            </Button>
            {needsVip && (
              <Text type="warning" style={{ fontSize: 12 }}>
                需要 VIP 权限
              </Text>
            )}
          </Flex>
          <Divider style={{ margin: 0 }} />
          <StreakRank type={key} />
        </Flex>
      ),
    };
  };

  const items = [
    createTabItem('province', '省份连胜-固定', '中国省份'),
    createTabItem('province_move', '省份连胜-移动 (VIP)', '中国省份'),
    createTabItem('country', '国家连胜-固定', '国家'),
    createTabItem('country_move', '国家连胜-移动 (VIP)', '国家'),
  ];

  return (
    <NormalPage title="连胜挑战">
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

export default Streak;