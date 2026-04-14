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
  DeleteOutlined,
  EyeOutlined,
  StarFilled,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { history, Link } from '@umijs/max';
import { Button, Image, message, Modal, Table } from 'antd';
import moment from 'moment';
import { FC, useEffect, useState } from 'react';
import { MapProvider } from 'react-map-gl';
import styles from './style.less';
import cellStyles from '../Cell/style.less';

interface WaterfallCellProps {
  post: API.PostParams;
  userId?: number;
  fetch?: () => void;
  isAdmin?: boolean;
  autoOpen?: boolean;
  onClose?: () => void;
  onOpen?: (postId: number) => void;
}

const WaterfallCell: FC<WaterfallCellProps> = ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const handleDeleteQuestion = async (postId: number) => {
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

  const isChallenge = post.type === 'challenge';
  const isSolved = isChallenge && !!post.successUser;

  return (
    <div className={styles.card}>
      {/* 封面图片 */}
      <div className={styles.coverWrapper} onClick={handleStart}>
        {post.question.items && post.question.items.length !== 0 ? (
          <Image
            preview={false}
            className={styles.coverImage}
            src={`https://b68v.daai.fun/${post.question.items[0].path}?x-oss-process=image/resize,w_400`}
            alt="Preview"
            placeholder={
              <div className={styles.imagePlaceholder} />
            }
          />
        ) : (
          <div className={styles.noImage}>暂无图片</div>
        )}
        {/* 状态标签 */}
        {isSolved && <div className={styles.solvedBadge}>已解决</div>}
        {post.question.items && post.question.items.length > 1 && (
          <div className={styles.multiImageBadge}>
            {post.question.items.length}图
          </div>
        )}
        {/* 挑战距离标签 */}
        {post.question.distance && (
          <div className={styles.distanceBadge}>{post.question.distance}m</div>
        )}
      </div>

      {/* 内容区域 */}
      <div className={styles.content}>
        {/* 标题 */}
        <div className={styles.title} onClick={handleStart}>
          {post.title}
        </div>

        {/* 成功信息 */}
        {isSolved && post.successUser && (
          <div className={styles.successInfo}>
            <Link to={`/user/${post.successUser.userId}`}>
              {post.successUser.userName}
            </Link>
            <span> 于 {formatTime(post.successTime)} 解决</span>
          </div>
        )}

        {/* 用户信息和时间 */}
        <div className={styles.footer}>
          <Link
            className={styles.userInfo}
            to={`/user/${post.user.userId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <qixunAvatar user={post.user} size={18} />
            <span className={styles.userName}>{post.user.userName}</span>
          </Link>
          <span className={styles.time}>{formatTime(post.gmtCreate)}</span>
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button
            size="small"
            type="primary"
            onClick={handleStart}
            disabled={isSolved}
          >
            {isChallenge ? '挑战' : '查看'} {post.startTimes}
          </Button>
          {isSolved && (
            <Button size="small" onClick={handleStart} icon={<EyeOutlined />}>
              答案
            </Button>
          )}
          {!isChallenge && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                loadRanking();
                setRankVisible(true);
              }}
              icon={<TrophyOutlined />}
            >
              {post.endTimes}
            </Button>
          )}
          <Button
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setCommentVisible(true);
            }}
            icon={<CommentOutlined />}
          >
            {post.commentCount}
          </Button>
          {post.question.items && post.question.items.length > 1 && (
            <Button
              size="small"
              icon={<AppstoreOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setMultiImageVisible(true);
              }}
            >
              多图
            </Button>
          )}
          {isChallenge && (
            <Button
              size="small"
              loading={collectLoading}
              icon={
                collected ? (
                  <StarFilled style={{ color: '#faad14' }} />
                ) : (
                  <StarOutlined />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                toggleCollection();
              }}
            />
          )}
          {post.canDelete && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteQuestion(post.id);
              }}
            >
              删除
            </Button>
          )}
        </div>
      </div>

      {/* 模态框 */}
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
          className={cellStyles.fullScreenModal}
          title={post.title}
          destroyOnClose
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
    </div>
  );
};

export default WaterfallCell;
