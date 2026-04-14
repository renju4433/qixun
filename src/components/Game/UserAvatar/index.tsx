import qixunAvatar from '@/components/User/qixunAvatar';
import { DeleteOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Badge, Button, Modal, Popconfirm, Space } from 'antd';
import { FC, useCallback, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styles from './style.less';

type UserAvatarProps = {
  user: API.UserProfile;
  team?: number;
  observer?: boolean;
  host?: number;
  me?: number;
  size?: number;
};

const UserAvatar: FC<UserAvatarProps> = ({
  user,
  team,
  observer,
  host,
  me,
  size = 1,
}) => {
  const {
    changePlayerToLooker,
    kickOffUser,
    switchHost,
    type,
    switchTeamByHost,
  } = useModel('Party.model', (model) => ({
    type: model.partyData?.gameType,
    changePlayerToLooker: model.changePlayerToLooker,
    kickOffUser: model.kickOffUser,
    switchHost: model.switchHost,
    switchTeamByHost: model.switchTeamByHost,
  }));

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [kickOffModalshow, setKickOffModalshow] = useState<boolean>(false);

  // ====== 用户相关操作 Start ======
  /**
   * 查看用户主页
   */
  const handleGoToUserProfile = useCallback(() => {
    setModalVisible(false);
    // TODO: 跳转到用户主页
    history.push(`/user/${user.userId}`);
  }, [user]);

  /**
   * 转移房主
   */
  const handleSwitchHost = useCallback(() => {
    switchHost(user.userId);
    setModalVisible(false);
  }, [user]);

  /**
   * 转换为围观者
   */
  const handleChangeUserToLooker = useCallback(() => {
    changePlayerToLooker(user.userId);
    setModalVisible(false);
  }, [user]);

  /**
   * 踢出用户
   */
  const handleKickOff = useCallback(() => {
    setKickOffModalshow(true);
  }, [user]);

  /**
   * 房主强制切换队伍
   */
  const handleChangeTeamByHost = useCallback(() => {
    switchTeamByHost(user.userId);
    setModalVisible(false);
  }, [switchTeamByHost]);
  // ====== 用户相关操作 End ======

  // 头像尺寸响应式
  const avatarSize = useMemo(
    () =>
      size < 5
        ? styles.avatarLarge
        : size < 10
        ? styles.avatarMiddle
        : styles.avatarSmall,
    [size],
  );

  return (
    <>
      <div
        className={`${styles.player} ${
          observer ? styles.observer : ''
        } ${avatarSize}`}
        onClick={() => setModalVisible(true)}
      >
        <Badge
          count={host === user.userId ? '房主' : ''}
          classNames={{ indicator: styles.hostBadge }}
        >
          <div
            className={`${styles.avatarContainer} ${
              team === 0 ? styles.redTeam : team === 1 ? styles.blueTeam : ''
            }`}
          >
            <qixunAvatar user={user} size={observer ? 45 : 55} />
          </div>
        </Badge>

        <div className={styles.userName}>{user?.userName}</div>
      </div>
      <Modal
        centered
        title={user.userName}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        maskStyle={{
          background: 'rgba(9, 7, 35, 0.8)',
          backdropFilter: 'blur(0.5rem)',
        }}
        styles={{ body: { background: 'transparent' } }}
        wrapClassName={styles.avatarModal}
        footer={
          <Space direction="vertical">
            {me !== user.userId && host === me && (
              <Button
                shape="round"
                type="primary"
                danger
                onClick={handleKickOff}
                icon={<DeleteOutlined />}
              >
                踢出派对
              </Button>
            )}
            {!isMobile && (
              <p>
                返回派对 <span>ESC</span>
              </p>
            )}
          </Space>
        }
      >
        <div className={`${observer ? styles.observer : ''}`}>
          <qixunAvatar user={user} size={150} />
        </div>

        <Space wrap>
          <Button shape="round" onClick={handleGoToUserProfile}>
            查看主页
          </Button>

          {me !== user.userId && host === me && (
            <Popconfirm
              title="转移房主"
              description={'确认转移房主给' + user.userName + '?'}
              onConfirm={handleSwitchHost}
              okText="确认"
              cancelText="取消"
            >
              <Button shape="round" danger>
                转移房主
              </Button>
            </Popconfirm>
          )}

          {!observer &&
            me !== user.userId &&
            host === me &&
            type &&
            ['team', 'team_match'].includes(type) && (
              <Button shape="round" onClick={handleChangeTeamByHost}>
                强制换队
              </Button>
            )}

          {!observer && me !== user.userId && host === me && (
            <Button shape="round" onClick={handleChangeUserToLooker}>
              强制围观
            </Button>
          )}
        </Space>
      </Modal>
      <Modal
        open={kickOffModalshow}
        title="确认将TA踢出派对吗？"
        onOk={() => {
          kickOffUser(user.userId);
          setModalVisible(false);
        }}
        onCancel={() => setKickOffModalshow(false)}
      >
        <div>踢出后他将无法再加入该派对</div>
      </Modal>
    </>
  );
};

export default UserAvatar;
