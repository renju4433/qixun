import { approveBanReview, listAlt, listBanHistory } from '@/services/api';
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
  reviewId?: number;
  bUid?: number;
  open: boolean;
  onClose: () => undefined;
  bMore?: string;
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

const BanUser: FC<BanUserProps> = ({
  open,
  onClose,
  bUid,
  bMore,
  bReason,
  reviewId,
}) => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [banDays, setBanDays] = useState<number | null>(null);
  const [banDaysUnit, setBanDaysUnit] = useState<string>('day');

  const [banHistoryList, setBanHistoryList] = useState<BanHistoryItem[]>();
  const [isBanHistoryLoading, setIsBanHistoryLoading] =
    useState<boolean>(false);
  const [altList, setAltList] = useState<UserAltItem[]>([]);
  const [isAltLoading, setIsAltLoading] = useState<boolean>(false);
  const [banMore, setBanMore] = useState<string>(bMore ?? '');

  useEffect(() => {
    setBanMore(bMore ?? '');
  }, [bMore]);

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

  const clear = () => {
    setBanDays(null);
    setBanDaysUnit('day');
    setBanMore('');
    onClose();
  };

  const ban = () => {
    if (bUid && (banDays || banDaysUnit === 'forever'))
      try {
        approveBanReview({
          id: reviewId,
          time: banDays,
          timeUnit: banDaysUnit,
          detail: banMore,
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
    if (!bUid) {
      loadBanHistory(-1);
      loadAltList(-1);
    } else {
      loadBanHistory(bUid);
    }
  }, [bUid]);

  return (
    <Modal
      centered
      destroyOnClose
      open={open}
      onOk={ban}
      onCancel={clear}
      okText="确认封禁"
      title="封禁用户"
    >
      <Flex vertical gap="small">
        <Flex justify="space-between">
          <InputNumber
            value={bUid}
            disabled
            controls={false}
            placeholder="userId"
          />
          <Button
            type="dashed"
            onClick={() => loadAltList(bUid)}
            disabled={isAltLoading || !bUid}
          >
            查小号
          </Button>
        </Flex>
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
        {bReason}
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
