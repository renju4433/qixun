import NormalPage from '@/pages/NormalPage';
import { listReports, solveReport, solveReportMessage } from '@/services/api';
import { CheckCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  Image,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate } from '@umijs/max';
const { Paragraph, Text, Title } = Typography;

const UserInfo = () => {
  const navigate = useNavigate();
  const [reportList, setReportList] = useState<API.ReportItem[]>([]);
  const loadReports = () => {
    listReports({ desc: true }).then((res) => {
      setReportList(res.data);
      if (!res.data || res.data.length === 0) {
        message.info('暂无待审核信息');
      }
    });
  };

  useEffect(loadReports, []);

  const solveUserReport = (id: number, action: string) => {
    solveReport({ id, action }).then((res) => {
      if (res.success) loadReports();
      else message.error(res.errorMessage || '操作失败');
    });
  };

  const solveCommentReport = (id: number, action: string) => {
    solveReportMessage({ id, action }).then((res) => {
      if (res.success) loadReports();
      else message.error(res.errorMessage || '操作失败');
    });
  };

  const UserReportCell = ({ report }: { report: API.ReportItem }) => (
    <Flex gap="small" vertical>
      <Flex gap="middle">
        <Image
          alt={`${report.userInfo?.userName}的头像`}
          src={`https://b68v.daai.fun/${report.userInfo?.icon}?x-oss-process=image/resize,h_300/quality,q_75`}
          preview={{
            src: `https://b68v.daai.fun/${report.userInfo?.icon}`,
            mask: false,
          }}
          height={100}
          width={100}
        />
        <Paragraph>
          <Title level={5} style={{ margin: 0 }}>
            {report.userInfo?.userName}
          </Title>
          <div>
            <Text>描述：{report.userInfo?.desc}</Text>
          </div>
          <div>
            <Text>uid：{report.userInfo?.userId}</Text>
          </div>
        </Paragraph>
      </Flex>
      <Flex gap="small" wrap="wrap">
        <Button
          type="primary"
          onClick={() => solveUserReport(report.id, 'ignore')}
        >
          通过
        </Button>
        <Button
          onClick={() => {
            const url = `/user/${report.userInfo?.userId}`;
            if (isMobile) navigate(url);
            else window.open(url, '_blank');
          }}
        >
          首页
        </Button>
        <Popconfirm
          title={`确定要重置${report.userInfo?.userName}的用户名吗？`}
          onConfirm={() => solveUserReport(report.id, 'clear_user_name')}
        >
          <Button>重置昵称</Button>
        </Popconfirm>
        <Popconfirm
          title={`确定要重置${report.userInfo?.userName}的个人描述吗？`}
          onConfirm={() => solveUserReport(report.id, 'clear_user_desc')}
        >
          <Button>重置描述</Button>
        </Popconfirm>
        <Popconfirm
          title={`确定要重置${report.userInfo?.userName}的头像吗？`}
          onConfirm={() => solveUserReport(report.id, 'clear_user_icon')}
        >
          <Button>重置头像</Button>
        </Popconfirm>
        <Popconfirm
          title={`确定要重置${report.userInfo?.userName}的所有信息吗？`}
          onConfirm={() => solveUserReport(report.id, 'clear_user_thing')}
        >
          <Button danger>重置所有</Button>
        </Popconfirm>
      </Flex>
    </Flex>
  );

  const CommentReportCell = ({ report }: { report: API.ReportItem }) => (
    <Flex gap="small" vertical>
      {report.postInfo?.imageName !== null && (
        <Image
          src={`https://b68v.daai.fun/${report.postInfo?.imageName}?x-oss-process=image/resize,h_300/quality,q_75`}
          height={100}
          width={100}
        />
      )}
      <Title level={5} style={{ margin: 0 }}>
        {report.postInfo?.forum.name}版块
      </Title>
      <Text>原帖标题：{report.postInfo?.title}</Text>
      <Text>
        {report.commentInfo?.userInfo.userName} (
        {report.commentInfo?.userInfo.userId}) 说：
      </Text>
      <Text>{report.commentInfo?.text}</Text>
      <Flex gap="small">
        <Button
          type="primary"
          onClick={() => solveCommentReport(report.id, 'ignore')}
        >
          通过
        </Button>
        <Button onClick={() => solveCommentReport(report.id, 'delete')}>
          删除
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <NormalPage title="个人信息审核">
      <Flex gap="middle" vertical>
        {reportList.map((report) =>
          report.type === 'user' ? (
            <UserReportCell key={report.id} report={report} />
          ) : report.type === 'comment' ? (
            <CommentReportCell key={report.id} report={report} />
          ) : null,
        )}
        <Flex justify="flex-start">
          <Popconfirm
            title={`确定要全部通过${reportList.length}条吗？`}
            disabled={reportList.length === 0}
            onConfirm={async () => {
              const tasks = reportList.map((report) =>
                report.type === 'comment'
                  ? solveReportMessage({ id: report.id, action: 'ignore' })
                  : solveReport({ id: report.id, action: 'ignore' }),
              );
              const results = await Promise.allSettled(tasks);
              const failed = results.filter(
                (r) =>
                  r.status === 'rejected' ||
                  (r.status === 'fulfilled' && !r.value?.success),
              ).length;

              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (failed === 0) message.success('全部通过');
              else message.warning(`已提交，失败${failed}条`);
              setTimeout(loadReports, 300);
            }}
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={reportList.length === 0}
            >
              批量确认
            </Button>
          </Popconfirm>
        </Flex>
      </Flex>
    </NormalPage>
  );
};

export default UserInfo;
