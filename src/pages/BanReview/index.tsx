import ReviewBan from '@/components/Admin/ReviewBan';
import { listBanReview, rejectBanReview } from '@/services/api';
import { Button, FloatButton, Popconfirm, Table, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import './style.less';

interface User {
  userId: number;
  userName: string;
  rating: number;
  chinaRating: number;
}

interface BanReviewItem {
  id: number;
  user: User;
  helper: User;
  reviewer?: User;
  reason: string;
  detail: string;
  status: string;
  gmtCreate: number;
  gmtModified: number;
}

const ReviewReview = () => {
  const [reviewList, setReviewList] = useState<API.BanReviewItem[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  // const [reviewId, setReviewId] = useState<number>();
  // const [banUid, setBanUid] = useState<number>();
  // const [detail, setDetail] = useState<string>();
  // const [reason, setReason] = useState<string>();
  const [review, setReview] = useState<BanReviewItem>();

  const loadReviews = () => {
    setIsLoading(true);
    listBanReview().then((res) => {
      if (res.data) {
        setReviewList(res.data);
        setIsLoading(false);
      }
    });
  };

  useEffect(loadReviews, []);

  const columns = [
    {
      title: '封禁用户',
      dataIndex: 'user',
      key: 'user',
      render: (user: User) => (
        <span>
          <a
            style={{ textDecoration: 'underline', color: 'inherit' }}
            onClick={() => window.open('/user/' + user.userId)}
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
      width: '10%',
    },
    {
      title: '提交者',
      dataIndex: 'helper',
      key: 'helper',
      render: (helper: User) => (
        <span style={{ cursor: 'pointer' }}>
          <a
            style={{ textDecoration: 'underline', color: 'inherit' }}
            onClick={() => window.open('/user/' + helper.userId)}
          >
            {helper.userName}
          </a>
          <br />
          uid: {helper.userId}
        </span>
      ),
      width: '10%',
    },
    {
      title: '提交时间',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      render: (gmtCreate: number) => moment(gmtCreate).format('MM-DD HH:mm'),
      width: '6%',
    },
    {
      title: '封禁原因',
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
      // onFilter: (value: any, record: UserReviewItem) => record.reason === value,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
    },
    {
      title: '操作',
      key: 'action',
      // width: '15%',
      render: (text: any, record: BanReviewItem) => (
        <div>
          <Button
            onClick={() => {
              setReview(record);
              setShow(true);
            }}
            type="primary"
          >
            执行封禁
          </Button>
          <Popconfirm
            title="确认驳回?"
            description={`确认驳回 ${record.helper.userName} 提交的 ${record.user.userName} 的封禁?`}
            onConfirm={() => {
              rejectBanReview({ id: record.id }).then((res) => {
                if (res.success) {
                  message.success('已驳回该封禁');
                  loadReviews();
                } else message.error('操作失败');
              });
            }}
            okText="确认驳回"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button>驳回封禁</Button>
          </Popconfirm>
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
            rowKey={(record) => record.id.toString()}
            loading={isLoading}
          />
          <FloatButton.Group shape="square">
            <FloatButton.BackTop />
          </FloatButton.Group>
          <ReviewBan
            open={show}
            reviewId={review?.id}
            onClose={() => {
              setShow(false);
            }}
            bMore={review?.detail}
            bUid={review?.user.userId}
            bReason={review?.reason}
          ></ReviewBan>
        </>
      )}
    </>
  );
};

export default ReviewReview;
