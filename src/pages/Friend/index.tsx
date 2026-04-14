import HeaderLogo from '@/components/Header/Logo';
import qixunAvatar from '@/components/User/qixunAvatar';
import {
  blockUser,
  deleteFriend,
  listFriend,
  searchUser,
  setFriendNickname,
} from '@/services/api';
import { history, useModel } from '@@/exports';
import { useDebounce } from 'ahooks';
import { Button, Dropdown, Flex, Input, MenuProps, Modal, message } from 'antd';
import { useEffect, useState } from 'react';
import SendMessageModal from './SendMessageModal';
import styles from './style.less';

const Friend = () => {
  const [friends, setFriends] = useState<API.FriendProfile[]>([]);
  const [globalSerachUsers, setGlobalSerachUsers] = useState<API.UserProfile[]>(
    [],
  );
  const [chooseFriend, setChooseFriend] = useState<API.UserProfile>();
  const [showSend, setShowSend] = useState<boolean>(false);
  const [showDelete, setShowDelete] = useState<boolean>(false);
  const [showNickname, setShowNickname] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [showBlock, setShowBlock] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  // 使用 debounce，延迟 500ms
  const debouncedSearchKeyword = useDebounce(searchKeyword, { wait: 500 });

  const fetchFriends = () => {
    listFriend().then((res) => setFriends(res.data));
  };

  useEffect(fetchFriends, []);

  useEffect(() => {
    if (!showSearch) return;
    let ok = true;
    searchUser({ keyword: debouncedSearchKeyword, pageNum: 1 }).then((res) => {
      if (ok) setGlobalSerachUsers(res.data);
    });
    return () => {
      ok = false;
    };
  }, [debouncedSearchKeyword, showSearch]);

  const friendMenuItems = (friend: API.FriendProfile) => {
    const items: MenuProps['items'] = [
      {
        label: '查看首页',
        onClick: () => history.push(`user/${friend.userId}`, '_blank'),
        key: 'main',
      },
      {
        label: '发送消息',
        onClick: () => {
          setShowSend(true);
          setChooseFriend(friend);
        },
        key: 'message',
      },
      {
        label: '设置昵称',
        onClick: () => {
          setChooseFriend(friend);
          setNickname(friend.nickname);
          setShowNickname(true);
        },
        key: 'nickname',
      },
      {
        label: '删除好友',
        onClick: () => {
          setChooseFriend(friend);
          setShowDelete(true);
        },
        key: 'delete',
      },
    ];

    if (isInApp) {
      items.push({
        label: '屏蔽用户',
        onClick: () => {
          setChooseFriend(friend);
          setShowBlock(true);
        },
        key: 'block',
      });
    }

    return items;
  };

  return !showSearch ? (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <HeaderLogo canBack />
        {!showSearch && (
          <Button
            onClick={() => setShowSearch(true)}
            className={`${isInApp ? styles.inApp : ''}`}
          >
            搜索添加
          </Button>
        )}
      </header>
      <div className={styles.container}>
        <h2
          className={`${isInApp ? styles.inApp : ''}`}
          style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            paddingTop: '4rem',
          }}
        >
          我的好友
        </h2>
        {friends.map((friend) => (
          <Dropdown
            menu={{ items: friendMenuItems(friend) }}
            key={friend.userId}
            trigger={['click']}
          >
            <Flex
              justify="space-between"
              style={{ borderBottom: '1px solid #eee', marginBottom: 14 }}
            >
              <Flex align="center" gap="small">
                <qixunAvatar user={friend} size={40} />
                <div style={{ cursor: 'pointer' }}>
                  {friend.userName}
                  {friend.nickname && (
                    <span style={{ color: 'grey' }}> ({friend.nickname})</span>
                  )}
                  {/* {friend.nickname ? (
                    <>
                      {friend.nickname}
                      <span style={{ color: 'grey' }}>
                        {' '}
                        ({friend.userName})
                      </span>
                    </>
                  ) : (
                    friend.userName
                  )} */}
                </div>
              </Flex>
              <Flex align="center" gap="middle">
                <div>{friend.province}</div>
                <div>
                  全球: {friend.rating}／中国: {friend.chinaRating}
                </div>
              </Flex>
            </Flex>
          </Dropdown>
        ))}

        <SendMessageModal
          open={showSend}
          friend={chooseFriend}
          onClose={() => {
            setShowSend(false);
            setChooseFriend(undefined);
          }}
        />

        <Modal
          title={`你确定要删除好友 ${chooseFriend?.userName} 吗？`}
          open={showDelete}
          onOk={() => {
            deleteFriend({ friend: chooseFriend!.userId }).then(() => {
              setShowDelete(false);
              fetchFriends();
              setChooseFriend(undefined);
              message.success('删除成功！');
            });
          }}
          onCancel={() => {
            setShowDelete(false);
            setChooseFriend(undefined);
          }}
        >
          <div>此操作不可撤销，确定要继续吗？</div>
        </Modal>

        <Modal
          title={`为 ${chooseFriend?.userName} 设置昵称`}
          open={showNickname}
          onOk={() => {
            setFriendNickname({
              friend: chooseFriend!.userId,
              nickname: nickname,
            }).then(() => {
              setShowNickname(false);
              fetchFriends();
              setChooseFriend(undefined);
              message.success('设置成功！');
            });
          }}
          onCancel={() => {
            setShowNickname(false);
            setChooseFriend(undefined);
          }}
        >
          <Input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
            }}
            placeholder="输入昵称"
          />
        </Modal>

        <Modal
          title={`你确定要屏蔽 ${chooseFriend?.userName} 吗？`}
          open={showBlock}
          onOk={() => {
            blockUser({ targetUserId: chooseFriend!.userId }).then(() => {
              setChooseFriend(undefined);
              fetchFriends();
              setShowBlock(false);
              message.success('屏蔽成功！');
            });
          }}
          onCancel={() => {
            setShowBlock(false);
            setChooseFriend(undefined);
          }}
        />
      </div>
    </div>
  ) : (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div style={{ marginTop: '2rem', fontSize: '32px' }}>
          搜索用户
          <Button
            onClick={() => {
              setShowSearch(false);
              setSearchKeyword('');
            }}
            style={{ marginLeft: '1rem' }}
          >
            取消搜索
          </Button>
        </div>
        <Input
          style={{ marginTop: '1rem' }}
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
          }}
          placeholder="同时支持 uid 和用户名搜索"
        />
        {globalSerachUsers.map((user) => (
          <div
            key={user.userId}
            style={{
              borderBottom: '1px solid #eee',
              fontSize: 16,
              cursor: 'pointer',
              marginTop: 12,
            }}
            onClick={() => history.push(`/user/${user.userId}`)}
          >
            {user.userName} (uid: {user.userId})
          </div>
        ))}
      </div>
    </div>
  );
};

export default Friend;
