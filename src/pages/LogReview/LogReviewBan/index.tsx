import {
  banByLog,
  listAlt,
  listBanHistory,
  rejectLogBatch,
  checkDetect,
} from '@/services/api';
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
import React, { FC, useEffect, useState } from 'react';
const { Title, Link } = Typography;
const { TextArea } = Input;

type BanUserProps = {
  logs?: API.CheatLogItem[];
  open: boolean;
  onClose: () => undefined;
  bReason?: string;
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

const columnsAlt: TableProps<UserAltItem>['columns'] = [
  { title: 'UID', dataIndex: 'userId', key: 'uid' },
  { title: '用户名', dataIndex: 'userName', key: 'userName' },
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

const LogReviewBan: FC<BanUserProps> = ({ open, logs, onClose, bReason }) => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [banDays, setBanDays] = useState<number | null>(30);
  const [banDaysUnit, setBanDaysUnit] = useState<string>('day');

  const [banHistoryList, setBanHistoryList] = useState<BanHistoryItem[]>();
  const [isBanHistoryLoading, setIsBanHistoryLoading] =
    useState<boolean>(false);
  const [detectHistoryList, setDetectHistoryList] = useState<CheckHistoryItem[]>([]);
  const [isDetectLoading, setIsDetectLoading] = useState<boolean>(false);
  const [altList, setAltList] = useState<UserAltItem[]>([]);
  const [isAltLoading, setIsAltLoading] = useState<boolean>(false);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reason, setReason] = useState<string>(bReason ?? '积分赛事网络搜索');

  const columnsLog: TableProps<API.CheatLogItem>['columns'] = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      render: (link: string) => (
        <a href={link} target="_blank" rel="noreferrer">
          打开链接
        </a>
      ),
    },
    {
      title: '提交者',
      dataIndex: 'submitter',
      key: 'submitter',
      render: (submitter: API.UserProfile) =>
        submitter ? submitter.userName : '系统',
    },
    {
      title: '操作',
      key: 'action',
      render: (record) => (
        <Button
          onClick={() => {
            rejectLogBatch({ ids: [record.id] }).then((res) => {
              if (res.success) {
                setRejectedIds([...rejectedIds, record.id]);
                message.success('忽略成功');
              }
            });
          }}
          size="small"
          danger
        >
          忽略
        </Button>
      ),
    },
  ];
  //   const [banMore, setBanMore] = useState<string>(bMore ?? '');

  //   useEffect(() => {
  //     setBanMore(bMore ?? '');
  //   }, [bMore]);

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
        const formattedData = res.data.map((item: API.UserAltItem) => ({
          ...item,
          userId: item.userId,
          userName: item.userName,
          rating: item.rating,
          chinaRating: item.chinaRating,
          lastRating: item.lastRating,
        }));
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
        const currentUser = logs?.[0]?.user;
        if (currentUser) {
          setDetectHistoryList([{
            userId: currentUser.userId,
            userName: currentUser.userName,
            detectResult: detectResult
          }]);
        }
      } else {
        const currentUser = logs?.[0]?.user;
        if (currentUser) {
          setDetectHistoryList([{
            userId: currentUser.userId,
            userName: currentUser.userName,
            detectResult: 'error'
          }]);
        }
        message.error('查询检测记录失败');
      }
      setIsDetectLoading(false);
    }).catch(() => {
      const currentUser = logs?.[0]?.user;
      if (currentUser) {
        setDetectHistoryList([{
          userId: currentUser.userId,
          userName: currentUser.userName,
          detectResult: 'error'
        }]);
      }
      setIsDetectLoading(false);
      message.error('查询检测记录失败');
    });
  };

  const clear = () => {
    setBanDays(30);
    setBanDaysUnit('day');
    // setBanMore('');
    onClose();
  };

  const ban = () => {
    if (
      logs &&
      logs.length > 0 &&
      logs[0].user.userId &&
      (banDays || banDaysUnit === 'forever')
    )
      try {
        banByLog({
          userId: logs[0].user.userId,
          time: banDays,
          timeUnit: banDaysUnit,
          logIds: selectedIds,
          reason,
        }).then((res) => {
          if (res.success) {
            message.success('封禁成功');
            clear();
          } else message.error('网络错误，封禁失败');
        });
      } catch (error) {
        message.error('未知错误，封禁失败');
      }
    else message.error('请填写完整信息');
  };

  useEffect(() => {
    if (logs && logs.length > 0) {
      const uid = logs[0].user.userId;
      loadBanHistory(uid);
      loadAltList(uid);
      loadDetectResult(uid);
      setSelectedIds(logs.map((log) => log.id));
    } else {
      loadBanHistory(-1);
      loadAltList(-1);
      setSelectedIds([]);
    }
  }, [logs]);

  //   useEffect(() => {
  //     if (!bUid) {
  //       loadBanHistory(-1);
  //       loadAltList(-1);
  //     } else {
  //       loadBanHistory(bUid);
  //     }
  //   }, [bUid]);

  return (
    <>
      {logs && logs.length > 0 && (
        <Modal
          centered
          destroyOnClose
          open={open}
          onOk={ban}
          onCancel={clear}
          okText="确认封禁"
          title="封禁用户"
        // okButtonProps={{ disabled: true }}
        >
          <Flex vertical gap="small">
            <InputNumber
              value={logs[0].user.userId}
              disabled
              controls={false}
              placeholder="userId"
              style={{ width: '100%' }}
            />
            <Title level={5} style={{ margin: '0.5rem 0 0' }}>
              同设备账号情况
            </Title>

            <Watermark content={`${user?.userId}`} gap={[5, 5]}>
              <Table
                dataSource={altList}
                loading={isAltLoading}
                columns={columnsAlt}
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
            <Table
              dataSource={logs.filter((log) => !rejectedIds.includes(log.id))}
              columns={columnsLog}
              pagination={false}
              showHeader={false}
              size="small"
              locale={{ emptyText: '空' }}
              rowKey={(record) => record.id}
              rowSelection={{
                type: 'checkbox',
                onChange: (selectedRowKeys: React.Key[]) => {
                  setSelectedIds(selectedRowKeys as number[]);
                },
                selectedRowKeys: selectedIds,
                defaultSelectedRowKeys: logs.map((log) => log.id),
              }}
            />
            <TextArea
              value={logs
                .filter((log) => selectedIds.includes(log.id))
                .map((log) => log.link)
                .join('\n')}
              //   onChange={(e) => setBanMore(e.target.value)}
              disabled
              placeholder="填写复盘链接等"
              autoSize={{ minRows: 6, maxRows: 12 }}
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
              onChange={(e) => setReason(e.target.value)}
              value={reason}
            >
              <Radio value="积分赛事开挂作弊">积分-开挂作弊</Radio>
              <Radio value="积分赛事网络搜索">积分-网络搜索</Radio>
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
      )}
    </>
  );
};

export default LogReviewBan;
