import InteractComment from '@/components/Interact/Comment';
import InteractQuestion from '@/components/Interact/Question';
import qixunAvatar from '@/components/User/qixunAvatar';
import {
  deleteQuestion,
  addPostCollection,
  postRanking,
  questionStartCheck,
  removePostCollection,
} from '@/services/api';
import {
  AppstoreOutlined,
  CommentOutlined,
  PlayCircleOutlined,
  StarFilled,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { history, Link } from '@umijs/max';
import {
  Button,
  Flex,
  Image,
  message,
  Modal,
  Space,
  Table,
  Typography,
} from 'antd';
import { EyeOutline } from 'antd-mobile-icons';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { MapProvider } from 'react-map-gl';
import styles from './style.less';

interface InteractCellProps {
  post: API.PostParams;
  userId?: number;
  fetch?: () => void;
  isAdmin?: boolean;
  autoOpen?: boolean;
  onClose?: () => void;
  onOpen?: (postId: number) => void;
}

const InteractCell: FC<InteractCellProps> = ({
  post,
  userId,
  fetch,
  isAdmin,
  autoOpen,
  onClose,
  onOpen,
}) => {
  const [start, setStart] = useState<boolean>(false);
  const [fetchTriggle, setFetchTriggle] = useState<boolean>(false);
  const [rankVisible, setRankVisible] = useState<boolean>(false);
  const [commentVisible, setCommentVisible] = useState<boolean>(false);
  const [multiImageVisible, setMultiImageVisible] = useState<boolean>(false);
  const [rankData, setRankData] = useState<any[]>([]);
  const [collected, setCollected] = useState<boolean | null>(
    post.collected ?? null,
  );
  const [collectLoading, setCollectLoading] = useState<boolean>(false);

  const formatTime = (time: number) => {
    return moment(time).year() === moment().year()
      ? moment(time).month() === moment().month() &&
        moment(time).date() === moment().date()
        ? moment(time).format('今天 HH:mm')
        : moment(time).format('MM-DD')
      : moment(time).format('YYYY-MM-DD');
  };

  const loadRanking = async () => {
    const res = await postRanking({ postId: post.id });
    if (res.success) {
      setRankData(res.data.rankList);
    } else message.error('排行加载失败，请检查网络或联系管理员');
  };

  const handleStart = async () => {
    try {
      if (post.type === 'question') {
        const questionResponse = await questionStartCheck({
          postId: post.id,
        });
        if (questionResponse.success) {
          setStart(true);
          if (onOpen) onOpen(post.id);
        }

        // 注释: 修改为 开始只计时，答题时 非会员扣除宝石
        // const vipResponse = await checkVipState();
        // console.log('正在检测VIP状态');
        // if (vipResponse.success) {
        //   console.log('检测成功');
        //   if (vipResponse.data && vipResponse.data > 0) {
        //     console.log('您是VIP用户，可以使用VIP开始');
        //     const questionResponse = await questionStartCheck({
        //       postId: post.id,
        //     });
        //     if (questionResponse.success) {
        //       console.log('使用VIP开始成功');
        //       setStart(true);
        //       if (onOpen) onOpen(post.id);
        //     }
        //   } else {
        //     console.log('您不是VIP，因此将使用宝石进行互动');
        //     const gemsResponse = await checkGems();
        //     if (gemsResponse.success) {
        //       if (gemsResponse.data >= 1) {
        //         console.log('您有剩余的宝石可以使用');
        //         const questionResponse = await questionStartCheck({
        //           postId: post.id,
        //         });
        //         if (questionResponse.success) {
        //           setStart(true);
        //           if (onOpen) onOpen(post.id);
        //           message.warning('已为您消耗1宝石开始互动');
        //         }
        //       } else message.error('您没有足够的宝石，请充值后再试');
        //     }
        //   }
        // } else message.error('请检查网络连接！');
      } else {
        setStart(true);
        if (onOpen) onOpen(post.id);
      }
    } catch (error) {
      message.error('发生错误，请稍后再试');
    }
  };

  useEffect(() => {
    if (!start && fetchTriggle && fetch) fetch();
    if (start) setFetchTriggle(true);
  }, [start, fetchTriggle]);

  // list 返回 collected，不再逐条请求 checkPostCollection
  useEffect(() => {
    setCollected(post.collected ?? null);
  }, [post.id, post.collected]);

  useEffect(() => {
    if (autoOpen && !start) {
      handleStart();
    }
    // 仅在 autoOpen 变化时尝试
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const handleDeleteQuestion = async (postId: number) => {
    // 需要二次确认
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该题目吗？',
      onOk: async () => {
        const res = await deleteQuestion({ postId: postId });
        if (res.success) {
          message.success('删除成功');
          if (fetch) fetch();
        } else message.error('删除失败，请检查网络或联系管理员');
      },
    });
  };

  const toggleCollection = async () => {
    if (!userId) {
      message.warning('请先登录后再收藏');
      return;
    }
    setCollectLoading(true);
    try {
      if (collected) {
        const res = await removePostCollection({ postId: post.id });
        if (res.success) {
          setCollected(false);
          message.success('已取消收藏');
          if (fetch) fetch();
        } else {
          message.error('取消收藏失败，请稍后重试');
        }
      } else {
        const res = await addPostCollection({ postId: post.id });
        if (res.success) {
          setCollected(true);
          message.success('收藏成功');
          if (fetch) fetch();
        } else {
          message.error('收藏失败，请稍后重试');
        }
      }
    } catch (error) {
      message.error('操作失败，请稍后再试');
    } finally {
      setCollectLoading(false);
    }
  };

  const renderRankList = () => {
    const columns = [
      {
        title: '用户',
        dataIndex: 'user',
        key: 'user',
        render: (user: any) => (
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => history.push(`/user/${user.userId}`)}
          >
            <qixunAvatar user={user} size={30} />
            <span style={{ cursor: 'pointer' }}>{user.userName}</span>
          </div>
        ),
      },
      {
        title: '距离 (千米)',
        dataIndex: 'distance',
        key: 'distance',
        render: (text: number) => text.toFixed(2),
      },
      {
        title: '用时 (秒)',
        dataIndex: 'usedTime',
        key: 'usedTime',
        render: (text: number) => (text / 1000).toFixed(2),
      },
    ];

    const data = rankData.map((item: any) => ({
      key: item.id,
      user: item.user,
      userName: item.user.userName,
      usedTime: item.usedTime,
      distance: item.distance,
    }));

    return <Table columns={columns} dataSource={data} pagination={false} />;
  };

  return (
    <Flex vertical>
      <Space align="start" direction="vertical" size="small">
        {/*用户信息*/}
        <Link
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#dcdcdc',
          }}
          to={`/user/${post.user.userId}`}
        >
          <qixunAvatar user={post.user} size={30} />
          {post.user.userName}
        </Link>
        {/*帖子标题*/}
        <Typography.Title level={5} style={{ margin: '0' }}>
          {post.title}
        </Typography.Title>
        {/*首图预览*/}
        {post.question.items && post.question.items.length !== 0 && (
          <Image
            preview={false}
            src={`https://b68v.daai.fun/${post.question.items[0].path}?x-oss-process=image/resize,h_120`}
            alt="Preview of the First Picture of the Question"
            onClick={handleStart}
          />
        )}
        {
          <div>
            {post.question.distance && (
              <span>{post.question.distance}m挑战</span>
            )}
            {post.type === 'challenge' && post.successUser && (
              <span style={{ color: 'green' }}>
                <Link
                  style={{ fontWeight: 'bold', color: 'inherit' }}
                  to={`/user/${post.successUser.userId}`}
                >
                  {' '}
                  {post.successUser.userName}
                </Link>{' '}
                在 {formatTime(post.successTime)} 挑战成功{' '}
              </span>
            )}
            <div></div>
            <span style={{ color: 'gray' }}>{formatTime(post.gmtCreate)}</span>
          </div>
        }
        {/*控制按钮*/}
        <Flex justify="flex-start" gap="small" wrap={true}>
          <Button
            onClick={handleStart}
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={post.type === 'challenge' && !!post.successUser}
          >
            {/*TODO '查看（免宝石）' 应修改为 '查看'，只为暂时突出计费方式的修改*/}
            {`${post.type === 'challenge' ? '挑战' : '查看'} ${post.startTimes
              }`}
          </Button>
          {post.type === 'challenge' && post.successUser && (
            <Button onClick={handleStart} icon={<EyeOutline />}>
              答案
            </Button>
          )}
          {post.type !== 'challenge' && (
            <Button
              onClick={() => {
                loadRanking();
                setRankVisible(true);
              }}
              icon={<TrophyOutlined />}
            >
              {post.endTimes}
            </Button>
          )}
          <Button
            onClick={() => setCommentVisible(true)}
            icon={<CommentOutlined />}
          >
            {post.commentCount}
          </Button>
          {post.question.items && post.question.items.length > 1 && (
            <Button
              icon={<AppstoreOutlined />}
              onClick={() => setMultiImageVisible(true)}
            >
              多图
            </Button>
          )}
          {post.type === 'challenge' ? (
            <Button
              loading={collectLoading}
              icon={
                collected ? (
                  <StarFilled style={{ color: '#faad14' }} />
                ) : (
                  <StarOutlined />
                )
              }
              onClick={toggleCollection}
            />
          ) : (
            // 互动模式暂时停用收藏功能（网络迷踪模式仍保留）
            null
          )}
          {post.canDelete && (
            <Button danger onClick={() => handleDeleteQuestion(post.id)}>
              删除
            </Button>
          )}
        </Flex>
      </Space>

      {start && (
        <Modal
          open={start}
          onCancel={() => {
            setStart(false);
            if (onClose) onClose();
          }}
          footer={null}
          width="100vw"
          centered={true}
          className={styles.fullScreenModal}
          title={post.title}
          destroyOnClose
          maskClosable={!autoOpen}
        >
          <MapProvider>
            <InteractQuestion
              postId={post.id}
              question={post.question}
              type={post.type}
              postUser={post.user}
              postCommentCount={post.commentCount}
              userId={userId}
              done={() => {
                setStart(false);
                if (onClose) onClose();
              }}
              success={!!post.successUser}
              canDelete={post.canDelete}
            />
          </MapProvider>
        </Modal>
      )}

      {rankVisible && (
        <Modal
          open={rankVisible}
          onCancel={() => setRankVisible(false)}
          footer={null}
          title="排行"
        >
          {rankData.length ? renderRankList() : null}
        </Modal>
      )}

      {commentVisible && (
        <Modal
          open={commentVisible}
          onCancel={() => setCommentVisible(false)}
          footer={null}
          title="评论"
        >
          <InteractComment postId={post.id} userId={userId}></InteractComment>
        </Modal>
      )}

      {multiImageVisible && (
        <Modal
          open={multiImageVisible}
          onCancel={() => setMultiImageVisible(false)}
          footer={null}
          title="多图"
        >
          <p>
            <strong>Q: 什么是多图互动？</strong>
          </p>
          <p>
            A: 这类互动由多张图片组成，答题用时和距离会根据所有图片叠加计算。
          </p>
        </Modal>
      )}
    </Flex>
  );
};

export default InteractCell;
