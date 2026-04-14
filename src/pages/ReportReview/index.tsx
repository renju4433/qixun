import { ignoreReport, listReportHelper } from '@/services/api';
import {
  ArrowRightOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useModel, useNavigate } from '@umijs/max';
import type { GetProp, TableProps } from 'antd';
import {
  Button,
  Flex,
  FloatButton,
  Grid,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Popover,
  Table,
} from 'antd';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import ManualAdd from '../../components/ReportManage/ManualAdd';
import ReportList from '../../components/ReportManage/ReportList';
import SubmitBan from '../../components/ReportManage/SubmitBan';
import SubmitLogModal from '../../components/ReportManage/SubmitLogModal';
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
}

const STORAGE_KEY = 'reportReview_state';

const getSavedState = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return null;
};

const ReportReview = () => {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const actionButtonSize: 'small' | 'middle' = screens.md ? 'middle' : 'small';

  const savedStateRef = useRef(getSavedState());

  const [reportTotal, setReportTotal] = useState<number>(0);
  const [reportList, setReportList] = useState<API.UserReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showBan, setShowBan] = useState<boolean>(false);
  const [showLog, setShowLog] = useState<boolean>(false);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [banUid] = useState<number>();
  const [logReport, setLogReport] = useState<API.UserReportItem>();
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchUid, setSearchUid] = useState<number>();
  const [finalSearchUid, setFinalSearchUid] = useState<number>();
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: savedStateRef.current?.pagination ?? { current: 1, pageSize: 20 },
  });
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  // 清除已恢复的 sessionStorage
  useEffect(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  // 数据加载完成后恢复滚动位置
  useEffect(() => {
    if (savedStateRef.current?.scrollY !== undefined && !isLoading && reportList.length > 0) {
      const scrollY = savedStateRef.current.scrollY;
      savedStateRef.current = null;
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [isLoading, reportList]);

  // 导航到用户主页前保存当前状态
  const navigateToUser = (userId: number) => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pagination: tableParams.pagination,
        scrollY: window.scrollY,
      }),
    );
    navigate('/user/' + userId);
  };

  const loadReports = () => {
    setIsLoading(true);
    listReportHelper({
      count: tableParams.pagination?.pageSize,
      page: tableParams.pagination?.current,
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
  ) => setTableParams({ pagination });

  useEffect(loadReports, []);
  useEffect(loadReports, [
    tableParams.pagination?.current,
    tableParams.pagination?.pageSize,
  ]);

  const closeSearch = () => {
    setShowSearch(false);
    setSearchUid(undefined);
  };

  const columns = [
    {
      title: '举报者',
      dataIndex: 'reportUser',
      key: 'reportUser',
      render: (reportUser: API.UserProfile) => (
        <span>
          <a
            style={{ textDecoration: 'underline', color: 'inherit' }}
            onClick={() => navigateToUser(reportUser.userId)}
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
            onClick={() => navigateToUser(user.userId)}
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
      // filters: [
      //   { text: '中国匹配作弊', value: '中国匹配作弊' },
      //   { text: '全球匹配作弊', value: '全球匹配作弊' },
      //   { text: '高分用户小号/炸鱼', value: '高分用户小号/炸鱼' },
      //   { text: '个人信息违规', value: '个人信息违规' },
      //   { text: '私信骚扰', value: '私信骚扰' },
      //   { text: '故意掉分', value: '故意掉分' },
      //   { text: '全球积分赛作弊', value: '全球积分赛作弊' },
      // ],
      // onFilter: (value: any, record: UserReportItem) => record.reason === value,
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
            onClick={() => window.open(`/activities?userId=${record.user.userId}`, '_blank')}
            icon={<InfoCircleOutlined />}
            size={actionButtonSize}
          >
            活动
          </Button>
          {record.gameId && (
            <Button
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
              icon={<ArrowRightOutlined />}
              size={actionButtonSize}
            >
              复盘
            </Button>
          )}
          <Popconfirm
            title="忽略确认"
            description={`确认忽略 ${record.user.userName} 的一条举报？`}
            onConfirm={() => {
              ignoreReport({ id: record.id }).then((res) => {
                if (res.success) {
                  message.success('已忽略该举报');
                  loadReports();
                } else message.error('操作失败');
              });
            }}
            okText="确认忽略"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="dashed"
              icon={<CloseOutlined />}
              size={actionButtonSize}
            >
              忽略
            </Button>
          </Popconfirm>
          <Button
            onClick={() => {
              setLogReport(record);
              setShowLog(true);
            }}
            danger
            icon={<CloudUploadOutlined />}
            size={actionButtonSize}
          >
            提交
          </Button>
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
        </Flex>
      ),
    },
  ];

  return (
    <NormalPage title="志愿者举报处理">
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
            />
          </div>
          <FloatButton.Group shape="square">
            <FloatButton
              icon={<UploadOutlined />}
              tooltip="手动上传"
              onClick={() => setShowAdd(true)}
            />
            <FloatButton
              icon={<SearchOutlined />}
              tooltip="查询记录"
              onClick={() => setShowSearch(true)}
            />
            <FloatButton description={reportTotal} tooltip="举报余量" />
            <FloatButton.BackTop />
          </FloatButton.Group>
        </>
      )}

      <ManualAdd open={showAdd} onClose={() => setShowAdd(false)} />
      <SubmitBan
        open={showBan}
        onClose={() => setShowBan(false)}
        userId={banUid}
      />
      <Modal
        title="中国/全球匹配作弊 举报查询"
        open={showSearch}
        onCancel={closeSearch}
        destroyOnClose
        okButtonProps={{ hidden: true }}
        cancelText="关闭"
      >
        <Flex vertical gap="small">
          <Flex gap="small">
            <InputNumber
              addonBefore={<UserOutlined />}
              maxLength={7}
              onChange={(value) => setSearchUid(Number(value))}
              placeholder="UID"
              size="large"
            />
            <Button
              icon={<SearchOutlined />}
              onClick={() => setFinalSearchUid(searchUid)}
              size="large"
            />
          </Flex>
          <ReportList userId={finalSearchUid} />
        </Flex>
      </Modal>
      <SubmitLogModal
        open={showLog}
        report={logReport}
        onClose={() => setShowLog(false)}
      />
    </NormalPage>
  );
};

export default ReportReview;