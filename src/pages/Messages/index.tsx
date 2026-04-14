import HeaderLogo from '@/components/Header/Logo';
import MessageContent from '@/pages/Messages/MessageContent';

import { listMessage, messageReadAll } from '@/services/api';
import { useModel } from '@umijs/max';
import { Button, List, Select } from 'antd';
import { useEffect, useState } from 'react';
import styles from './style.less';

// 消息类型定义
type MessageType =
  | 'all'
  | 'add_friend'
  | 'friend_message'
  | 'text'
  | 'invite_team'
  | 'invite_party'
  | 'post_comment';

const Message = () => {
  const [messages, setMessages] = useState<API.Message[]>([]);
  const [isMessageLoading, setIsMessageLoading] = useState<boolean>(false);
  const [isFirstFetch, setIsFirstFetch] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<MessageType>('all');

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  // 消息类型选项
  const messageTypeOptions = [
    { label: '全部', value: 'all' as const },
    { label: '加好友', value: 'add_friend' as const },
    { label: '好友消息', value: 'friend_message' as const },
    { label: '文本消息', value: 'text' as const },
    { label: '组队匹配邀请', value: 'invite_team' as const },
    { label: '派对邀请', value: 'invite_party' as const },
    { label: '互动评论', value: 'post_comment' as const },
  ];

  const fetchMessage = () => {
    setIsMessageLoading(true);
    listMessage({
      type: selectedType === 'all' ? undefined : selectedType,
    }).then((res) => {
      if (!isFirstFetch) {
        if (res.success) {
          setMessages(res.data);
        }
      } else setMessages(res.data);
    });
    messageReadAll();
    setIsMessageLoading(false);
  };

  useEffect(() => {
    fetchMessage();
    setIsFirstFetch(false);
  }, [selectedType]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <HeaderLogo canBack />
        <Button
          style={{ marginTop: isInApp ? '2rem' : '0px' }}
          onClick={fetchMessage}
        >
          刷新
        </Button>
      </header>

      <div className={styles.container}>
        <h1 style={{ fontSize: '2.5rem', textAlign: 'center' }}>我的消息</h1>

        {/* 消息分类选择器 */}
        <div className={styles.typeSelector}>
          <Select<MessageType>
            options={messageTypeOptions}
            value={selectedType}
            onChange={setSelectedType}
            size="large"
            placeholder="选择消息类型"
            style={{
              width: '200px',
            }}
          />
        </div>

        {/* {messages.length !== 0 ? (
          messages.map((message) => {
            return (
              <div key={message.id}>
                <div style={{ color: 'gray', fontSize: '12px' }}>
                  {moment(message.gmtCreate).format('YYYY-MM-DD HH:mm')}
                </div>
                <MessageContent
                  message={message}
                  fetchMessage={fetchMessage}
                />
              </div>
            );
          })
        ) : (
          <div className={styles.noMessage}> 暂无消息 </div>
        )} */}
        <List
          loading={isMessageLoading}
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={(item) => (
            <MessageContent message={item} fetchMessage={fetchMessage} />
          )}
          locale={{
            emptyText:
              selectedType === 'all'
                ? '暂无消息'
                : `暂无${
                    messageTypeOptions.find((opt) => opt.value === selectedType)
                      ?.label
                  }消息`,
          }}
        />
      </div>
    </div>
  );
};

export default Message;
