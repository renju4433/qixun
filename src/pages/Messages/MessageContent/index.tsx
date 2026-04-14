import qixunAvatar from '@/components/User/qixunAvatar';
import {
  appealBan,
  approveFriendAdd,
  rejectFriendAdd,
  sendFriendMessage,
} from '@/services/api';
import { history } from '@@/core/history';
import { useModel } from '@@/exports';
import * as antd from 'antd';
import {
  Alert,
  Button,
  Checkbox,
  Flex,
  Input,
  List,
  Modal,
  Skeleton,
  Space,
  Tag,
} from 'antd';
import moment from 'moment';
import { FC, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { JSX } from 'react/jsx-runtime';
const { TextArea } = Input;
const { Item } = List;
const { Meta } = Item;

// 添加样式对象
const styles = { whiteText: { color: '#fff' } };

type MessageContentProps = {
  message: API.Message;
  fetchMessage: () => void;
};

const MessageContent: FC<MessageContentProps> = ({ message, fetchMessage }) => {
  const [chooseMessage, setChooseMessage] = useState<API.Message>();
  const [showAppeal, setShowAppeal] = useState<boolean>(false);
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const [friendMessage, setFriendMessage] = useState<string>('');
  const [showSend, setShowSend] = useState<boolean>(false);
  const [appealMessage, setAppealMessage] = useState<string>('');

  const [checked, setChecked] = useState<boolean>(false);

  const toUser = (user: API.UserProfile | null) => {
    window.open(`https://saiyuan.top/user/${user?.userId}`, '_blank');
  };

  const toParty = (data: string | null) => {
    window.open(`https://saiyuan.top/join/${data}`, '_blank');
  };

  const toTeam = (data: string | null) => {
    window.open(`https://saiyuan.top/teamJoin/${data}`, '_blank');
  };

  const renderMore = (text: string) => {
    try {
      const linkRegex =
        /https:\/\/qixun\.fun\/replay-pano\?gameId=[a-f0-9-]+&round=\d+/g;
      const parts = text.split(linkRegex);
      const result: (JSX.Element | JSX.Element[])[] = [];

      parts.forEach((part, index) => {
        result.push(
          part.split('\n').map((v, i) => (
            <>
              {v}
              {i < part.split('\n').length - 1 && <br></br>}
            </>
          )),
        );

        if (index < parts.length - 1) {
          if (!text.match(linkRegex)) return;
          const url = text.match(linkRegex)[index];
          result.push(
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ wordBreak: 'break-all' }}
            >
              {url}
            </a>,
          );
        }
      });

      return result;
    } catch {
      return text;
    }
  };

  const onCheckChange = (e) => {
    setChecked(e.target.checked);
  };

  switch (message.type) {
    case 'post_comment': {
      // 互动 / 网络迷踪评论通知
      let commentInfo: {
        postId?: number;
        commentId?: number;
        postType?: string;
        senderName?: string;
        senderUid?: number;
        commentText?: string;
      } = {};
      try {
        if (message.data) {
          commentInfo = JSON.parse(message.data);
        }
      } catch {
        commentInfo = {};
      }

      const postId = commentInfo.postId;
      const postType = commentInfo.postType;
      const senderName = commentInfo.senderName;
      const senderUid = commentInfo.senderUid;
      const commentId = commentInfo.commentId;
      const commentText = commentInfo.commentText ?? '';

      // 判断是否为解谜通知：commentId 为 null 且 commentText 为空
      const isSolvedNotification = commentId === null && !commentText;

      const goToPost = () => {
        if (!postId) return;
        const base =
          postType === 'challenge' ? '/interact/challenge' : '/interact';
        if (isMobile || isInApp) {
          history.push(`${base}?id=${postId}`);
        } else {
          window.open(`${window.location.origin}${base}?id=${postId}`, '_blank');
        }
      };

      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              avatar={
                message.sender && (
                  <div
                    onClick={() => toUser(message.sender)}
                    style={{ cursor: 'pointer' }}
                  >
                    <qixunAvatar user={message.sender} size={50} />
                  </div>
                )
              }
              title={
                <Flex gap="middle" justify="space-between">
                  <span
                    onClick={() => toUser(message.sender)}
                    style={{ ...styles.whiteText, cursor: 'pointer' }}
                  >
                    {message.sender?.userName}
                  </span>
                  <span style={styles.whiteText}>
                    {moment(message.gmtCreate)
                      .format('YYYY-MM-DD HH:mm')
                      .replace(new Date().getFullYear() + '-', '')}
                  </span>
                </Flex>
              }
              description={
                <Space
                  direction="vertical"
                  style={{ ...styles.whiteText, width: '100%' }}
                >
                  <span>
                    {isSolvedNotification
                      ? `您收藏的${postType === 'challenge' ? '网络迷踪帖子' : '互动帖子'}已被寻友${senderName} (uid:${senderUid}) 解决。`
                      : `${postType === 'challenge' ? '网络迷踪帖子' : '互动帖子'} 有新的评论：${commentText}`}
                  </span>
                  {postId && (
                    <Button type="primary" size="small" onClick={goToPost}>
                      前往查看
                    </Button>
                  )}
                </Space>
              }
            />
          </Skeleton>
        </Item>
      );
    }
    case 'add_friend':
      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              avatar={
                message.sender && (
                  <div
                    onClick={() => toUser(message.sender)}
                    style={{ cursor: 'pointer' }}
                  >
                    <qixunAvatar user={message.sender} size={50} />
                  </div>
                )
              }
              title={
                <Flex gap="middle" justify="space-between">
                  <span
                    onClick={() => toUser(message.sender)}
                    style={{ ...styles.whiteText, cursor: 'pointer' }}
                  >
                    {message.sender?.userName}
                  </span>
                  <span style={styles.whiteText}>
                    {moment(message.gmtCreate)
                      .format('YYYY-MM-DD HH:mm')
                      .replace(new Date().getFullYear() + '-', '')}
                  </span>
                </Flex>
              }
              description={
                <Flex
                  gap="middle"
                  justify="space-between"
                  style={styles.whiteText}
                >
                  请求加你为好友
                  {message.solve ? (
                    <div>
                      {message.solveAction === 'approve' && (
                        <Tag color="green">已同意</Tag>
                      )}
                      {message.solveAction === 'reject' && (
                        <Tag color="red">已拒绝</Tag>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: '5px' }}>
                      <Button
                        onClick={() => {
                          approveFriendAdd({ messageId: message.id }).then(fetchMessage);
                        }}
                      >
                        同意
                      </Button>
                      <Button
                        style={{ marginLeft: '5px' }}
                        onClick={() => {
                          rejectFriendAdd({ messageId: message.id }).then(fetchMessage);
                        }}
                      >
                        拒绝
                      </Button>
                    </div>
                  )}
                </Flex>
              }
            />
          </Skeleton>
        </Item>
      );
    case 'text':
      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              avatar={message.sender && (<qixunAvatar user={message.sender} size={50} />)}
              description={
                <div style={styles.whiteText}>
                  {message.data?.includes(
                    'https://saiyuan.top/replay-pano?gameId=',
                  ) && message.data?.includes('申诉结果反馈: ')
                    ? renderMore(message.data)
                    : message.data}
                </div>
              }
            />
          </Skeleton>
          <Space direction="vertical" align="end">
            <span style={styles.whiteText}>
              {moment(message.gmtCreate)
                .format('YYYY-MM-DD HH:mm')
                .replace(new Date().getFullYear() + '-', '')}
            </span>
          </Space>
        </Item>
      );
    case 'new':
      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              title={
                <span
                  onClick={() => toUser(message.sender)}
                  style={styles.whiteText}
                >
                  {message.sender?.userName}
                </span>
              }
              description={
                <Space direction="horizontal" style={styles.whiteText}>
                  欢迎您来到棋寻！需要了解更多信息可以查看棋寻新手教程。
                  <Button onClick={() => window.open(message.data!, '_blank')}>
                    查看
                  </Button>
                </Space>
              }
            />
          </Skeleton>
          <Space direction="vertical" align="end">
            <span style={styles.whiteText}>
              {moment(message.gmtCreate)
                .format('YYYY-MM-DD HH:mm')
                .replace(new Date().getFullYear() + '-', '')}
            </span>
          </Space>
        </Item>
      );
    case 'friend_message':
      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              avatar={
                message.sender && (
                  <div
                    onClick={() => toUser(message.sender)}
                    style={{ cursor: 'pointer' }}
                  >
                    <qixunAvatar user={message.sender} size={50} />
                  </div>
                )
              }
              title={
                <Flex gap="middle" justify="space-between">
                  <span
                    onClick={() => toUser(message.sender)}
                    style={{ ...styles.whiteText, cursor: 'pointer' }}
                  >
                    {message.sender?.userName}
                  </span>
                  <span style={styles.whiteText}>
                    {moment(message.gmtCreate)
                      .format('YYYY-MM-DD HH:mm')
                      .replace(new Date().getFullYear() + '-', '')}
                  </span>
                </Flex>
              }
              description={
                <Space direction="vertical" style={styles.whiteText}>
                  {'给你发消息: ' + message.data}
                  <Button
                    onClick={() => {
                      setChooseMessage(message);
                      setShowSend(true);
                    }}
                  >
                    回复
                  </Button>
                  {showSend && (
                    <Modal
                      title={`回复消息给 ${chooseMessage?.sender?.userName}`}
                      open={showSend}
                      onOk={() => {
                        sendFriendMessage({
                          friend: chooseMessage!.sender!.userId,
                          message: friendMessage,
                        }).then(() => {
                          setFriendMessage('');
                          setShowSend(false);
                          setChooseMessage(undefined);
                          antd.message.success('发送成功！');
                        });
                      }}
                      onCancel={() => {
                        setFriendMessage('');
                        setShowSend(false);
                        setChooseMessage(undefined);
                      }}
                    >
                      <Flex vertical gap="small" wrap="wrap">
                        <div style={styles.whiteText}>
                          每天最多发送10条消息, 发送骚扰和敏感信息会被封禁账号。
                        </div>
                        <TextArea
                          value={friendMessage}
                          onChange={(e) => setFriendMessage(e.target.value)}
                          placeholder="输入消息"
                          autoSize={{ minRows: 3, maxRows: 5 }}
                        />
                      </Flex>
                    </Modal>
                  )}
                </Space>
              }
            />
          </Skeleton>
        </Item>
      );
    case 'invite_party':
      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              avatar={message.sender && (<qixunAvatar user={message.sender} size={50} />)}
              title={
                <span
                  onClick={() => toUser(message.sender)}
                  style={styles.whiteText}
                >
                  {message.sender?.userName}
                </span>
              }
              description={<div style={styles.whiteText}>邀请你参加派对</div>}
            />
          </Skeleton>
          <Space direction="vertical" align="end">
            <span style={styles.whiteText}>
              {moment(message.gmtCreate)
                .format('YYYY-MM-DD HH:mm')
                .replace(new Date().getFullYear() + '-', '')}
            </span>
            <Button
              onClick={() => {
                if (isMobile || isInApp) history.push(`/join/${message.data}`);
                else toParty(message.data);
              }}
            >
              加入
            </Button>
          </Space>
        </Item>
      );
    case 'invite_team':
      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              avatar={message.sender && (<qixunAvatar user={message.sender} size={50} />)}
              title={
                <span
                  onClick={() => toUser(message.sender)}
                  style={styles.whiteText}
                >
                  {message.sender?.userName}
                </span>
              }
              description={<div style={styles.whiteText}>邀请你加入队伍一起组队匹配</div>}
            />
          </Skeleton>
          <Space direction="vertical" align="end">
            <span style={styles.whiteText}>
              {moment(message.gmtCreate)
                .format('YYYY-MM-DD HH:mm')
                .replace(new Date().getFullYear() + '-', '')}
            </span>
            <Button onClick={() => toTeam(message.data)}>加入</Button>
          </Space>
        </Item>
      );
    case 'ban':
      return (
        <Item key={message.id}>
          <Skeleton avatar title={false} loading={false} active>
            <Meta
              description={
                <div style={styles.whiteText}>
                  你因为
                  {message.data}
                  {message.banTimeUnit === 'day'
                    ? ' 被封禁 ' +
                    message.banTime +
                    ' 天，解封时间为 ' +
                    moment(message.banUntil).format('YYYY-MM-DD HH:mm')
                    : ' 被永久封禁，'}
                  。封禁期间，你仍然可以使用题库和派对等功能。
                  {message.more ? (
                    <>
                      封禁详细理由如下：<br />
                      {renderMore(message.more)}
                    </>
                  ) : (
                    ''
                  )}
                  {message.more &&
                    message.data === '积分赛事网络搜索' &&
                    message.more.includes('https://saiyuan.top/replay-pano?gameId')
                    ? '\n申诉时，请依次说明你每一轮的选点思路。'
                    : ''}
                </div>
              }
            />
          </Skeleton>
          <Space direction="vertical" align="end">
            <span style={styles.whiteText}>
              {moment(message.gmtCreate)
                .format('YYYY-MM-DD HH:mm')
                .replace(new Date().getFullYear() + '-', '')}
            </span>
            <Button
              onClick={() => {
                setChooseMessage(message);
                setShowAppeal(true);
              }}
            >
              申诉
            </Button>
            {showAppeal && (
              <Modal
                title="申诉"
                open={showAppeal}
                onOk={() => {
                  if (!appealMessage || appealMessage.length === 0) {
                    antd.message.warning('申诉内容不能为空');
                    return;
                  }
                  if (!checked) {
                    antd.message.warning('请勾选多选框');
                    return;
                  }
                  appealBan({
                    messageId: chooseMessage!.id,
                    reason: appealMessage,
                  }).then(() => {
                    setAppealMessage('');
                    setShowAppeal(false);
                    setChooseMessage(undefined);
                    antd.message.success('申诉成功，处理结果将在消息界面显示');
                  });
                }}
                onCancel={() => {
                  setAppealMessage('');
                  setShowAppeal(false);
                  setChooseMessage(undefined);
                }}
              >
                <Flex vertical gap="small" wrap="wrap">
                  <div style={styles.whiteText}>
                    申诉内容：{chooseMessage?.data}
                    <br />
                    {renderMore(chooseMessage?.more ?? '')}
                  </div>
                  <TextArea
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    placeholder="申诉时，请保持文明理性。如为网络搜索申诉，请完整说明每一轮次的选点思路。"
                    autoSize={{ minRows: 5, maxRows: 15 }}
                  />
                  <Alert
                    type="info"
                    style={{ padding: 10 }}
                    description={
                      <div style={styles.whiteText}>
                        申诉前，请仔细查看
                        <a href="https://www.yuque.com/chaofun/qixun/rules?singleDoc" target="_blank" rel="noopener noreferrer">
                          《违规封禁规则》
                        </a>
                        <a href="https://www.yuque.com/chaofun/qixun/appeal?singleDoc" target="_blank" rel="noopener noreferrer">
                          《违规申诉指南》
                        </a>
                        ，了解申诉流程和注意事项。
                      </div>
                    }
                  />
                  <Checkbox onChange={onCheckChange}>
                    我确认已完整陈述所有申诉意见，并了解只有一次申诉机会。
                  </Checkbox>
                </Flex>
              </Modal>
            )}
          </Space>
        </Item>
      );
  }
};

export default MessageContent;
