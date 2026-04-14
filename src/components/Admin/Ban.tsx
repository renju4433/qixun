import { banUser, listAlt, listBanHistory, checkDetect } from '@/services/api';
import { DownOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import type { MenuProps, TableProps } from 'antd';
import {
  Badge,
  Button,
  Dropdown,
  Flex,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Table,
  Typography,
  Watermark,
  message,
} from 'antd';
import copy from 'copy-to-clipboard';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
const { Title, Link } = Typography;
const { TextArea } = Input;

type BanUserProps = {
  show: boolean;
  setShow: (show: boolean) => void;
  bUid?: number;
  bReason?: string | null;
  onClose?: () => void;
};

interface User {
  userId: number;
  userName: string;
  rating: number;
  chinaRating: number;
}

interface BanHistoryItem {
  user: User;
  gmtCreate: number;
  banUntil: number;
  banReason: string;
  more: string;
  moreDisplay: MenuProps['items'];
  revoked: boolean;
}

interface CheckHistoryItem {
  userId: number;
  userName: string;
  detectResult: string;
}

interface UserAltItem {
  userId: number;
  userName: string;
  rating: number | null;
  chinaRating: number | null;
  ban: boolean;
  lastRating: string | null;
}

const onClick: MenuProps['onClick'] = ({ key }) => {
  copy(key);
  message.success('封禁详情复制成功');
};

const columnsHistory: TableProps<BanHistoryItem>['columns'] = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    render: (_, { gmtCreate }) => <>{new Date(gmtCreate).toLocaleString()}</>,
  },
  {
    title: '封禁原因',
    dataIndex: 'reason',
    key: 'reason',
    render: (_, { banReason, more, moreDisplay }) =>
      more ? (
        <Space size="middle">
          <Dropdown menu={{ items: moreDisplay, onClick }}>
            <a onClick={(e) => e.preventDefault()}>
              {banReason} <DownOutlined />
            </a>
          </Dropdown>
        </Space>
      ) : (
        <>{banReason}</>
      ),
  },
  {
    title: '封禁时长',
    dataIndex: 'duration',
    key: 'duration',
    render: (_, { gmtCreate, banUntil }) => (
      <>
        {banUntil
          ? Math.floor((banUntil - gmtCreate) / 86400000) + ' 天'
          : '永久'}
      </>
    ),
  },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    render: (_, { banUntil, revoked }) => (
      <Badge
        status={
          revoked
            ? 'warning'
            : Date.now() > banUntil && banUntil
              ? 'default'
              : 'processing'
        }
        text={
          revoked
            ? '已解封'
            : Date.now() > banUntil && banUntil
              ? '已过期'
              : '生效中'
        }
      />
    ),
  },
];

const columnsDetect: TableProps<CheckHistoryItem>['columns'] = [
  {
    title: 'UID',
    dataIndex: 'userId',
    key: 'userId',
  },
  {
    title: '检测结果',
    dataIndex: 'detectResult',
    key: 'detectResult',
    render: (detectResult: string) => {
      if (detectResult === 'none') {
        return <Badge status="success" text="无检测记录" />;
      } else if (detectResult === 'error') {
        return <Badge status="error" text="查询失败" />;
      } else if (detectResult.startsWith('uid')) {
        return <Badge status="warning" text="该用户有检测记录" />;
      } else if (detectResult.startsWith('ip')) {
        return <Badge status="error" text="该用户当前IP下有检测记录" />;
      } else {
        return <Badge status="default" text={detectResult} />;
      }
    },
  },
];

const getColumnsAlt = (
  onUidClick: (uid: number) => void,
): TableProps<UserAltItem>['columns'] => [
    {
      title: '用户',
      key: 'user',
      render: (_, { userId, userName }) => (
        <a style={{ color: '#1677ff' }} onClick={() => onUidClick(userId)}>
          {userName}
        </a>
      ),
    },
    {
      title: '积分',
      dataIndex: 'rating',
      key: 'rating',
      render: (_, { rating, chinaRating }) => (
        <>
          全球 {rating ?? '1500'} / 中国 {chinaRating ?? '1500'}
        </>
      ),
    },
    {
      title: '上次活动时间',
      key: 'lastRating',
      render: (_, { lastRating }) => (
        <>
          {lastRating &&
            (Number(lastRating?.slice(0, 4)) === moment().year()
              ? lastRating?.slice(4, 6) + '-' + lastRating?.slice(6, 8)
              : lastRating?.slice(0, 4) +
              '/' +
              lastRating?.slice(4, 6) +
              '/' +
              lastRating?.slice(6, 8))}
        </>
      ),
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      render: (_, { ban }) => (
        <Badge
          status={ban ? 'error' : 'success'}
          text={ban ? '封禁中' : '正常'}
        />
      ),
    },
  ];

const BanUser: FC<BanUserProps> = ({ show, setShow, bUid, bReason, onClose }) => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [banUid, setBanUid] = useState<number>();
  const [banDays, setBanDays] = useState<number | null>(null);
  const [banReason, setBanReason] = useState<string | null>();
  const [banDaysUnit, setBanDaysUnit] = useState<string>('day');

  const [isFastBan, setIsFastBan] = useState<boolean>(false);
  const [banHistoryList, setBanHistoryList] = useState<BanHistoryItem[]>();
  const [isBanHistoryLoading, setIsBanHistoryLoading] =
    useState<boolean>(false);
  const [detectHistoryList, setDetectHistoryList] = useState<CheckHistoryItem[]>([]);
  const [isDetectLoading, setIsDetectLoading] = useState<boolean>(false);
  const [altList, setAltList] = useState<UserAltItem[]>([]);
  const [isAltLoading, setIsAltLoading] = useState<boolean>(false);
  const [banMore, setBanMore] = useState<string>('');
  const [hasBanned, setHasBanned] = useState<boolean>(false);

  const handleAltUidClick = (uid: number) => {
    setBanUid(uid);
    loadBanHistory(uid);
    loadAltList(uid);
    loadDetectResult(uid);
  };

  const loadBanHistory = (banUid: number | undefined) => {
    setIsBanHistoryLoading(true);
    setBanHistoryList([]);
    if (!banUid || banUid === -1) {
      setIsBanHistoryLoading(false);
      return;
    }
    listBanHistory({ userId: banUid }).then((res) => {
      if (res.data) {
        const formattedData = res.data.map((item: API.BanHistoryItem) => ({
          ...item,
          gmtCreate: item.gmtCreate ?? 0,
          banUntil: item.banUntil ?? 0,
          banReason: item.banReason ?? '',
          more: item.more ?? '',
          moreDisplay: [
            { key: item.more, label: '复制' },
          ] as MenuProps['items'],
        }));
        setBanHistoryList(formattedData);
        setIsBanHistoryLoading(false);
      }
    });
  };

  const loadAltList = (banUid: number | undefined) => {
    setIsAltLoading(true);
    setAltList([]);
    if (!banUid || banUid === -1) {
      setIsAltLoading(false);
      return;
    }
    listAlt({ userId: banUid }).then((res) => {
      if (res.data) {
        const formattedData = res.data
          .map((item: API.UserAltItem) => ({
            ...item,
            userId: item.userId,
            userName: item.userName,
            rating: item.rating,
            chinaRating: item.chinaRating,
            lastRating: item.lastRating,
          }))
          .sort((a: UserAltItem, b: UserAltItem) =>
            a.userId === banUid ? -1 : b.userId === banUid ? 1 : 0,
          );
        setAltList(formattedData);
        setIsAltLoading(false);
      }
    });
  };

  const loadDetectResult = (banUid: number | undefined) => {
    setIsDetectLoading(true);
    setDetectHistoryList([]);
    if (!banUid || banUid === -1) {
      setIsDetectLoading(false);
      return;
    }
    checkDetect({ userId: banUid }).then((res) => {
      if (res.success) {
        const detectResult = res.data || 'none';
        setDetectHistoryList([{
          userId: banUid,
          userName: '',
          detectResult: detectResult
        }]);
      } else {
        setDetectHistoryList([{
          userId: banUid,
          userName: '',
          detectResult: 'error'
        }]);
        message.error('查询检测记录失败');
      }
      setIsDetectLoading(false);
    }).catch(() => {
      setDetectHistoryList([{
        userId: banUid,
        userName: '',
        detectResult: 'error'
      }]);
      setIsDetectLoading(false);
      message.error('查询检测记录失败');
    });
  };

  const getBanReasonByReportReason = (reason: string): string | null => {
    switch (reason) {
      case '全球积分作弊':
      case '中国积分作弊':
      case '全球匹配作弊':
      case '中国匹配作弊':
        return '积分赛事网络搜索';
      case '每日挑战作弊':
        return '每日挑战作弊';
      case '高分用户小号/炸鱼':
        return '疑似小号';
      case '派对作弊':
        return null;
      case '故意掉分':
        return '故意掉分';
      case '个人信息违规':
      case '头像违规':
      case '用户名违规':
        return '昵称/头像违规';
      default:
        return null;
    }
  };

  const resetState = () => {
    setBanUid(undefined);
    setBanDays(null);
    setBanDaysUnit('day');
    setBanReason(undefined);
    setBanMore('');
    setBanHistoryList([]);
    setAltList([]);
    setDetectHistoryList([]);
    setIsFastBan(false);
  };

  const clear = () => {
    setShow(false);
    resetState();
    setHasBanned(false);
    onClose?.();
  };

  const ban = () => {
    if (banUid && (banDays || banDaysUnit === 'forever'))
      try {
        banUser({
          userId: banUid,
          time: banDays,
          timeUnit: banDaysUnit,
          reason: banReason,
          more: banMore,
        }).then((res) => {
          if (res.success) {
            message.success('封禁成功');
            setHasBanned(true);
            setBanMore('');
            loadBanHistory(banUid);
            loadAltList(banUid);
          } else message.error('网络错误，封禁失败');
        });
      } catch (error) {
        message.error('未知错误，封禁失败');
      }
    else message.error('请填写完整信息');
  };

  const getBanDaysByReason = (reason: string | null): number | null => {
    switch (reason) {
      case '恶意举报':
      case '扰乱积分赛秩序':
        return 7;
      case '每日挑战作弊':
      case '疑似小号':
      case '私信违规':
      case '昵称/头像违规':
      case '互动违规':
        return 7;
      case '故意掉分':
        return 30;
      case '积分赛事大小号互刷积分':
      case '积分赛事网络搜索':
      case '违规脚本':
        return 30;
      default:
        return 7;
    }
  };

  const handleBanReasonChange = (value: string | null) => {
    setBanReason(value);
    if (value === '积分赛事开挂作弊') {
      // 如果积分赛事开挂作弊，则封禁时长为永久
      setBanDaysUnit('forever');
      setBanDays(null);
    } else {
      // 否则根据选择的封禁理由设置对应的封禁时长
      setBanDaysUnit('day');
      setBanDays(getBanDaysByReason(value));
    }
  };

  useEffect(() => {
    if (!show) return;
    resetState();
    if (bUid) {
      setBanUid(bUid);
      loadBanHistory(bUid);
      loadAltList(bUid);
      loadDetectResult(bUid);
    }
    if (bReason) {
      handleBanReasonChange(getBanReasonByReportReason(bReason));
      setIsFastBan(true);
    }
  }, [show, bUid, bReason]);

  useEffect(() => {
    if (!isFastBan && banUid) loadBanHistory(banUid);
  }, [banUid, isFastBan]);

  return (
    <Modal
      centered
      destroyOnClose
      maskClosable={false}
      open={show}
      onOk={ban}
      onCancel={clear}
      okText="确认封禁"
      title="封禁用户"
    >
      <Flex vertical gap="small">
        <InputNumber
          onChange={(e) => {
            setBanUid(Number(e));
            setAltList([]);
          }}
          value={banUid}
          disabled={isFastBan}
          controls={false}
          placeholder="userId"
          style={{ width: '100%' }}
        />
        <Flex gap="small" wrap="wrap">
          <Button
            type="dashed"
            onClick={() => loadAltList(banUid)}
            disabled={isAltLoading || !banUid}
          >
            查小号
          </Button>
          <Button
            type="dashed"
            onClick={() => loadDetectResult(banUid)}
            disabled={isDetectLoading || !banUid}
          >
            查外挂
          </Button>
          <Button
            type="dashed"
            onClick={() => window.open(`/user/analysis?userId=${banUid}`, '_blank')}
            disabled={!banUid}
          >
            查技术分析
          </Button>
          <Button
            type="dashed"
            onClick={() => window.open(`/activities?userId=${banUid}`, '_blank')}
            disabled={!banUid}
          >
            匹配记录
          </Button>
          <Button
            type="dashed"
            onClick={() => window.open(`/user/${banUid}`, '_blank')}
            disabled={!banUid}
          >
            个人首页
          </Button>
        </Flex>

        <Title level={5} style={{ margin: '0.5rem 0 0' }}>
          同设备账号情况
        </Title>
        <Watermark content={`${user?.userId}`} gap={[5, 5]}>
          <Table
            dataSource={altList}
            loading={isAltLoading}
            columns={getColumnsAlt(handleAltUidClick)}
            pagination={false}
            showHeader={false}
            size="small"
            locale={{ emptyText: '无' }}
            rowKey={(record) => record.userId.toString()}
          />
        </Watermark>

        <Title level={5} style={{ margin: '0.5rem 0 0' }}>
          外挂检测记录
        </Title>
        <Watermark content={`${user?.userId}`} gap={[5, 5]}>
          <Table
            dataSource={detectHistoryList}
            loading={isDetectLoading}
            columns={columnsDetect}
            pagination={false}
            showHeader={false}
            size="small"
            locale={{ emptyText: '无' }}
            rowKey={(record) => record.userId.toString()}
          />
        </Watermark>

        <Title level={5} style={{ margin: '0.5rem 0 0' }}>
          封禁记录
        </Title>
        <Table
          dataSource={banHistoryList as BanHistoryItem[]}
          loading={isBanHistoryLoading}
          columns={columnsHistory}
          pagination={false}
          showHeader={false}
          size="small"
          locale={{ emptyText: '无' }}
          rowKey={(record) => record.gmtCreate.toString()}
        />

        <Title level={5} style={{ margin: '0.5rem 0 0' }}>
          封禁证据
        </Title>
        <TextArea
          value={banMore}
          onChange={(e) => setBanMore(e.target.value)}
          placeholder="填写复盘链接等"
          autoSize={{ minRows: 2, maxRows: 8 }}
        />

        <Title level={5} style={{ margin: '0.5rem 0 0' }}>
          封禁理由
          <Link
            href="https://www.yuque.com/chaofun/qixun/rules"
            target="_blank"
            style={{ marginLeft: '0.5rem', color: 'inherit' }}
          >
            查看详细规则
          </Link>
        </Title>
        <Radio.Group
          name="封禁理由"
          onChange={(e) => handleBanReasonChange(e.target.value)}
          value={banReason}
        >
          <Radio value="每日挑战作弊">每日挑战作弊</Radio>
          <br />
          <Radio value="扰乱积分赛秩序">积分-弹幕报答案</Radio>
          <Radio value="积分赛事开挂作弊">积分-开挂作弊</Radio>
          <Radio value="积分赛事大小号互刷积分">积分-多账号刷分</Radio>
          <Radio value="积分赛事网络搜索">积分-网络搜索</Radio>
          <Radio value="疑似小号">积分-疑似小号</Radio>
          <Radio value="故意掉分">积分-故意掉分</Radio>
          <br />
          <Radio value="私信违规">用户-私信违规</Radio>
          <Radio value="昵称/头像违规">用户-个人资料违规</Radio>
          <br />
          <Radio value="违规脚本">违规脚本</Radio>
          <Radio value="互动违规">互动违规</Radio>
          <Radio value="恶意举报">恶意举报</Radio>
          <Radio value="其他">其他</Radio>
        </Radio.Group>

        <Title level={5} style={{ margin: '0.5rem 0 0' }}>
          封禁时长
        </Title>
        <Radio.Group
          name="封禁时长"
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'forever') {
              setBanDaysUnit('forever');
              setBanDays(null);
            } else {
              setBanDaysUnit('day');
              setBanDays(val);
            }
          }}
          value={banDaysUnit === 'forever' ? 'forever' : banDays}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value={7}>7 天</Radio.Button>
          <Radio.Button value={15}>15 天</Radio.Button>
          <Radio.Button value={30}>30 天</Radio.Button>
          <Radio.Button value={60}>60 天</Radio.Button>
          <Radio.Button value="forever">永久</Radio.Button>
        </Radio.Group>
      </Flex>
    </Modal>
  );
};

export default BanUser;
