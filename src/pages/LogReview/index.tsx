import { listCheatLogs, rejectLogBatch } from '@/services/api';
import {
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  FloatButton,
  Input,
  InputRef,
  message,
  Popover,
  Space,
  Table,
} from 'antd';
import { FilterDropdownProps } from 'antd/es/table/interface';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import ManualAdd from '../../components/ReportManage/ManualAdd';
import ReportList from '../../components/ReportManage/ReportList';
import LogReviewBan from './LogReviewBan';
import './style.less';

interface UserLog {
  userId: number;
  data: API.CheatLogItem[];
}

const LogReview = () => {
  const [reviewList, setReviewList] = useState<UserLog[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [addUid, setAddUid] = useState<number>();
  // const [reviewId, setReviewId] = useState<number>();
  // const [banUid, setBanUid] = useState<number>();
  // const [detail, setDetail] = useState<string>();
  // const [reason, setReason] = useState<string>();
  const [review, setReview] = useState<UserLog>();

  const loadReviews = () => {
    setIsLoading(true);
    listCheatLogs().then((res) => {
      if (res.data) {
        setReviewList(
          Object.values(
            res.data.reduce((acc, item) => {
              const userId = item.user.userId;
              if (!acc[userId]) {
                acc[userId] = { userId, data: [] } as UserLog;
              }
              acc[userId].data.push(item);
              return acc;
            }, {} as Record<number, UserLog>),
          ).sort((a, b) =>
            a.data.length === b.data.length
              ? (b.data[0].user.chinaRating ?? 0) -
              (a.data[0].user.chinaRating ?? 0)
              : b.data.length - a.data.length,
          ),
        );
        setIsLoading(false);
      }
    });
  };

  useEffect(loadReviews, []);

  const searchInput = useRef<InputRef>(null);

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
  ) => {
    confirm();
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
  };

  const columns: any[] = [
    {
      title: '封禁用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: number, record: UserLog) => (
        <span>
          <a
            style={{ textDecoration: 'underline', color: 'inherit' }}
            onClick={() => window.open('/user/' + userId)}
          >
            {record.data[0].user.userName}
          </a>
          <br />
          uid: {userId}
          <br />
          全球: {record.data[0].user.rating}
          <br />
          中国: {record.data[0].user.chinaRating}
          <br />
          作弊次数: {record.data.length}
        </span>
      ),
      width: '10%',
      filterDropdown: (props: FilterDropdownProps) => {
        const { setSelectedKeys, selectedKeys, confirm, clearFilters } = props;
        return (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              ref={searchInput}
              placeholder={`搜索 UID 或用户名`}
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={() =>
                handleSearch(selectedKeys as string[], confirm)
              }
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => handleSearch(selectedKeys as string[], confirm)}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                搜索
              </Button>
              <Button
                onClick={() => clearFilters && handleReset(clearFilters)}
                size="small"
                style={{ width: 90 }}
              >
                重置
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
      ),
      onFilter: (value: any, record: UserLog) =>
        record.data[0].user.userName
          .toLowerCase()
          .includes((value as string).toLowerCase()) ||
        record.data[0].user.userId
          .toString()
          .includes((value as string).toLowerCase()),
    },
    // {
    //   title: '提交者',
    //   dataIndex: 'helper',
    //   key: 'helper',
    //   render: (helper: User) => (
    //     <span style={{ cursor: 'pointer' }}>
    //       <a
    //         style={{ textDecoration: 'underline', color: 'inherit' }}
    //         onClick={() => window.open('/user/' + helper.userId)}
    //       >
    //         {helper.userName}
    //       </a>
    //       <br />
    //       uid: {helper.userId}
    //     </span>
    //   ),
    //   width: '10%',
    // },
    // {
    //   title: '提交时间',
    //   dataIndex: 'gmtCreate',
    //   key: 'gmtCreate',
    //   render: (gmtCreate: number) => moment(gmtCreate).format('MM-DD HH:mm'),
    //   width: '6%',
    // },
    // {
    //   title: '封禁原因',
    //   dataIndex: 'reason',
    //   key: 'reason',
    //   width: '10%',
    //   // filters: [
    //   //   { text: '中国匹配作弊', value: '中国匹配作弊' },
    //   //   { text: '全球匹配作弊', value: '全球匹配作弊' },
    //   //   { text: '高分用户小号/炸鱼', value: '高分用户小号/炸鱼' },
    //   //   { text: '个人信息违规', value: '个人信息违规' },
    //   //   { text: '私信骚扰', value: '私信骚扰' },
    //   //   { text: '故意掉分', value: '故意掉分' },
    //   //   { text: '全球积分赛作弊', value: '全球积分赛作弊' },
    //   // ],
    //   // onFilter: (value: any, record: UserReviewItem) => record.reason === value,
    // },
    {
      title: '详情',
      dataIndex: 'data',
      key: 'data',
      render: (data: API.CheatLogItem[]) => (
        <Table
          dataSource={data}
          columns={[
            {
              title: '链接',
              dataIndex: 'link',
              key: 'link',
              render: (link: string) => (
                <a href={link} target="_blank" rel="noreferrer">
                  {link}
                </a>
              ),
              width: '70%',
            },
            {
              title: '提交人',
              dataIndex: 'submitter',
              key: 'submitter',
              render: (submitter: API.UserProfile | undefined) =>
                submitter
                  ? `${submitter.userName} (uid: ${submitter.userId})`
                  : '系统',
              width: '15%',
            },
            {
              title: '时间',
              dataIndex: 'gmtCreate',
              key: 'gmtCreate',
              render: (gmtCreate: number) =>
                moment(gmtCreate).format('MM-DD HH:mm'),
              width: '10%',
            },
            {
              title: '操作',
              key: 'action',
              render: (record: API.CheatLogItem) => (
                <>
                  <Button
                    onClick={() => {
                      rejectLogBatch({ ids: [record.id] }).then((res) => {
                        if (res.success) {
                          message.success('已忽略');
                          loadReviews();
                        }
                      });
                    }}
                    size="small"
                    danger
                  >
                    忽略
                  </Button>
                </>
              ),
              width: '5%',
            },
          ]}
          // renderItem={(item) => (
          //   <List.Item>
          //     {item.link} {item.submitter.userName}
          //   </List.Item>
          // )}
          size="small"
          bordered={false}
          pagination={false}
          rowHoverable={false}
          showHeader={false}
        ></Table>
      ),
    },
    {
      title: '操作',
      key: 'action',
      // width: '15%',
      render: (text: any, record: UserLog) => (
        <div>
          <Button
            onClick={() => {
              setReview(record);
              setShow(true);
            }}
            type="primary"
          >
            封禁
          </Button>
          <Button
            onClick={() => {
              const name = record.data[0].user.userName;
              const uid = record.userId;
              if (
                window.confirm(
                  `确认忽略用户 ${name} (uid: ${uid}) 的全部待处理日志吗？`,
                )
              ) {
                rejectLogBatch({ userId: uid, ignoreUser: true }).then(
                  (res) => {
                    if (res.success) {
                      message.success('已忽略该用户全部待处理日志');
                      loadReviews();
                    }
                  },
                );
              }
            }}
            danger
            type="dashed"
          >
            忽略该用户
          </Button>
          <Button
            onClick={() => {
              setAddUid(record.userId);
              setShowAdd(true);
            }}
            icon={<UploadOutlined />}
          >
            手动上传
          </Button>
          <Popover
            content={<ReportList userId={record.userId} />}
            title={`${record.data[0].user.userName} 的所有 作弊 举报`}
            trigger="click"
            placement="left"
            overlayStyle={{ maxWidth: '70%' }}
          >
            <Button icon={<UserOutlined />}>查看关联举报</Button>
          </Popover>
        </div>
      ),
    },
  ];

  return (
    <>
      {reviewList && (
        <>
          <Table
            className="table"
            dataSource={reviewList}
            columns={columns}
            rowKey={(record) => record.userId.toString()}
            loading={isLoading}
            rowHoverable={false}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `共 ${total} 个用户`,
            }}
          />
          <FloatButton.Group shape="square">
            <FloatButton
              icon={<UploadOutlined />}
              tooltip="手动上传"
              onClick={() => {
                setShowAdd(true);
              }}
            />
            <FloatButton.BackTop />
          </FloatButton.Group>
          <ManualAdd
            open={showAdd}
            uid={addUid}
            onClose={() => {
              setShowAdd(false);
              setAddUid(undefined);
            }}
          />
          <LogReviewBan
            open={show}
            logs={review?.data}
            onClose={() => {
              setShow(false);
              loadReviews();
            }}
            bReason="积分赛事网络搜索"
          ></LogReviewBan>
        </>
      )}
    </>
  );
};

export default LogReview;
