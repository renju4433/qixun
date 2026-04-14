import { ignoreReport, listReportUserAll } from '@/services/api';
import { useNavigate } from '@umijs/max';
import { Button, Flex, message, Spin, Table } from 'antd';
import { useEffect, useState } from 'react';
import SubmitLogModal from './SubmitLogModal';

interface ReportListProps {
  userId?: number;
}

const ReportList: React.FC<ReportListProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<API.UserReportItems>();
  const [loading, setLoading] = useState<boolean>(false);
  const [showLog, setShowLog] = useState<boolean>(false);
  const [logReport, setLogReport] = useState<API.UserReportItem>();

  const loadReports = () => {
    if (userId) {
      setLoading(true);
      listReportUserAll({ userId: userId }).then((res) => {
        if (res.success) {
          setData(res.data);
          setLoading(false);
        }
      });
    }
  };

  useEffect(loadReports, [userId]);

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
          <br />({reportUser.userId})
        </span>
      ),
      minWidth: 100,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 110,
    },
    {
      title: '详情',
      dataIndex: 'more',
      key: 'more',
    },
    // {
    //   title: '时间',
    //   dataIndex: 'gmtCreate',
    //   key: 'gmtCreate',
    //   render: (gmtCreate: number) => moment(gmtCreate).format('YYYY-MM-DD'),
    // },
    {
      title: '操作',
      key: 'replay',
      render: (record: API.UserReportItem) => (
        <Flex vertical>
          <Button
            variant="link"
            size="small"
            color="primary"
            href={`https://saiyuan.top/replay?gameId=${record.gameId}`}
            target="_blank"
            rel="noreferrer"
          >
            复盘
          </Button>
          <Button
            variant="link"
            size="small"
            color="default"
            onClick={() => {
              ignoreReport({ id: record.id }).then((res) => {
                if (res.success) {
                  message.success('忽略成功');
                  loadReports();
                }
              });
            }}
          >
            忽略
          </Button>
          <Button
            variant="link"
            size="small"
            color="danger"
            onClick={() => {
              setLogReport(record);
              setShowLog(true);
            }}
          >
            提交
          </Button>
        </Flex>
      ),
    },
  ];

  return loading ? (
    <Spin />
  ) : (
    <>
      <Table
        columns={columns}
        dataSource={data?.reports}
        pagination={false}
        size="small"
        tableLayout="auto"
      />
      <SubmitLogModal
        open={showLog}
        report={logReport}
        onClose={() => setShowLog(false)}
        onSuccess={loadReports}
      />
    </>
  );
};

export default ReportList;
