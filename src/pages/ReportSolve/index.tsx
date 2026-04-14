import { batchIgnoreReport, ignoreReport, listReport } from '@/services/api';
import {
  ArrowRightOutlined,
  CloseOutlined,
  CloseSquareFilled,
  InfoCircleOutlined,
  LockOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useModel, useNavigate } from '@umijs/max';
import type { GetProp, TableProps } from 'antd';
import {
  Button,
  Flex,
  FloatButton,
  Grid,
  Popover,
  Popconfirm,
  Table,
  message,
} from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import BanUser from '../../components/Admin/Ban'; // 引入BanUser组件
import ReportList from '../../components/ReportManage/ReportList';
import NormalPage from '../NormalPage';
import './style.less';

type TablePaginationConfig = Exclude<
  GetProp<TableProps, 'pagination'>,
  boolean
>;

// 使用全局 API 类型，移除重复定义

// interface UserReportItems {
//   reports: UserReportItem;
//   total: number;
// }

interface TableParams {
  pagination?: TablePaginationConfig;
  filters?: Record<string, any>;
}

const ReportSolve = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const actionButtonSize: 'small' | 'middle' = screens.md ? 'middle' : 'small';

  const [reportTotal, setReportTotal] = useState<number>(0);
  const [reportList, setReportList] = useState<API.UserReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBan, setShowBan] = useState<boolean>(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [banUid, setBanUid] = useState<number>();

  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: { current: 1, pageSize: 20 },
    filters: {},
  });

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const loadReports = () => {
    setIsLoading(true);
    const reason = tableParams.filters?.reason?.[0];
    listReport({
      count: tableParams.pagination?.pageSize,
      page: tableParams.pagination?.current,
      reason: reason === '' ? undefined : reason,
    }).then((res) => {
      if (res.data) {
        const formattedData = res.data.reports.map(
          (item: API.UserReportItem) => ({
            ...item,
            reason: item.reason ?? '',
            more: item.more?.replace(/复盘链接:.*$/, '') ?? '',
            gameId: item.gameId,
          }),
        );
        setReportList(formattedData);
        setReportTotal(res.data.total);
        setIsLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res.data.total ?? 0,
          },
        });
      }
    });
  };

  const handleTableChange: TableProps<API.UserReportItem>['onChange'] = (
    pagination,
    filters,
  ) => {
    setTableParams({ pagination, filters });
  };

  useEffect(loadReports, [
    tableParams.pagination?.current,
    tableParams.pagination?.pageSize,
    tableParams.filters?.reason,
  ]);

  const columns = [
    {
      title: '举报者',
      dataIndex: 'reportUser',
      key: 'reportUser',
      render: (reportUser: API.UserProfile) => (
        <span>
          <a
            style={{ textDecoration: 'underline', color: 'inherit' }}
            onClick={() => navigate('/user/' + reportUser.userId)}
          >
            {reportUser.userName}
          </a>
          <br />
          uid: {reportUser.userId}
          <br />
          全球: {reportUser.rating}
          <br />
          中国: {reportUser.chinaRating}
        </span>
      ),
      width: '12.5%',
    },
    {
      title: '被举报者',
      dataIndex: 'user',
      key: 'user',
      render: (user: API.UserProfile) => (
        <span style={{ cursor: 'pointer' }}>
          <a
            style={{ textDecoration: 'underline', color: 'inherit' }}
            onClick={() => navigate('/user/' + user.userId)}
          >
            {user.userName}
          </a>
          <br />
          uid: {user.userId}
          <br />
          全球: {user.rating}
          <br />
          中国: {user.chinaRating}
        </span>
      ),
      width: '12.5%',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      width: '10%',
      filters: [
        { text: '全部', value: '' },
        { text: '中国匹配作弊', value: '中国匹配作弊' },
        { text: '全球匹配作弊', value: '全球匹配作弊' },
        { text: '高分用户小号/炸鱼', value: '高分用户小号/炸鱼' },
        { text: '派对/娱乐匹配作弊', value: '派对/娱乐匹配作弊' },
        { text: '私信骚扰', value: '私信骚扰' },
        { text: '故意掉分', value: '故意掉分' },
        { text: '全球积分赛作弊', value: '全球积分赛作弊' },
      ],
      filterMultiple: false,
      showFilterConfirm: false,
    },
    {
      title: '日期',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      width: '8%',
      render: (gmtCreate: number) => moment(gmtCreate).format('MM-DD'),
    },
    {
      title: '详情',
      dataIndex: 'more',
      key: 'more',
      // filters: [{ text: '非空', value: '非空' }],
      // onFilter: (value: any, record: UserReportItem) => record.more !== '',
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (text: any, record: API.UserReportItem) => (
        <Flex align="center" justify="right" gap="small" wrap="wrap">
          <Button
            icon={<InfoCircleOutlined />}
            size={actionButtonSize}
            onClick={() => window.open(`/activities?userId=${record.user.userId}`, '_blank')}
          >
            活动
          </Button>
          {record.gameId && (
            <Button
              icon={<ArrowRightOutlined />}
              size={actionButtonSize}
              onClick={() => {
                const parsedMeta = record.meta ? JSON.parse(record.meta) : null;
                const rounds = parsedMeta?.rounds;
                const url =
                  rounds?.length === 1
                    ? `/replay?gameId=${record.gameId}&chooseRound=${rounds[0]}`
                    : `/replay?gameId=${record.gameId}`;
                if (isInApp) {
                  navigate(url);
                } else {
                  window.open(url, '_blank');
                }
              }}
            >
              复盘
            </Button>
          )}
          {record.reason === '私信骚扰' && (
            <Button
              icon={<MessageOutlined />}
              size={actionButtonSize}
              onClick={() => window.open("/api/v0/qixun/message/reviewMessages?sender=" +
                record.user.userId + "&receiver=" + record.reportUser.userId, '_blank')}
            >
              私信
            </Button>
          )}
          <Button
            danger
            icon={<LockOutlined />}
            size={actionButtonSize}
            onClick={() => {
              setBanReason(record.reason);
              setBanUid(record.user.userId);
              setShowBan(true);
            }}
          >
            封禁
          </Button>
          <Button
            icon={<CloseOutlined />}
            size={actionButtonSize}
            onClick={() => {
              ignoreReport({ id: record.id }).then((res) => {
                if (res.success) {
                  message.success('已忽略该举报');
                  loadReports();
                } else message.error('操作失败');
              });
            }}
          >
            忽略
          </Button>
          {record.reason === '中国匹配作弊' && (
            <Popover
              content={<ReportList userId={record.user.userId} />}
              title={`${record.user.userName} (${record.user.userId}) 的所有作弊举报`}
              trigger="click"
              placement="left"
              overlayStyle={{ maxWidth: '70%' }}
            >
              <Button icon={<UserOutlined />} size={actionButtonSize}>
                关联
              </Button>
            </Popover>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <NormalPage title="管理员举报审核">
      {reportList && (
        <>
          <div className="table-wrapper">
            <Table
              className="table"
              dataSource={reportList}
              columns={columns}
              rowKey={(record) => record.id.toString()}
              onChange={handleTableChange}
              loading={isLoading}
              pagination={tableParams.pagination}
              footer={() => (
                <Flex justify="end">
                  <Popconfirm
                    title="批量忽略"
                    description={`确定要忽略本页全部 ${reportList.length} 条举报吗？`}
                    onConfirm={() => {
                      const ids = reportList.map((item) => item.id);
                      batchIgnoreReport({ ids }).then((res) => {
                        if (res.success) {
                          message.success(
                            `已忽略 ${res.data?.ignored ?? 0} 条，跳过 ${res.data?.skipped ?? 0} 条`,
                          );
                          loadReports();
                        } else {
                          message.error(res.errorMessage || '操作失败');
                        }
                      });
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      icon={<CloseOutlined />}
                      loading={isLoading}
                      disabled={reportList.length === 0}
                    >
                      批量忽略本页举报
                    </Button>
                  </Popconfirm>
                </Flex>
              )}
            />
          </div>
          <FloatButton.Group shape="square">
            <FloatButton description={reportTotal} tooltip="待处理举报数量" />
            <FloatButton
              icon={<CloseSquareFilled />}
              description="Ban"
              tooltip="一键封禁用户"
              onClick={() => {
                setBanReason(null);
                setBanUid(undefined);
                setShowBan(true);
              }}
            />
            <FloatButton.BackTop />
          </FloatButton.Group>
          <BanUser
            show={showBan}
            setShow={setShowBan}
            bReason={banReason}
            bUid={banUid}
            onClose={loadReports}
          />
        </>
      )}
    </NormalPage>
  );
};

export default ReportSolve;