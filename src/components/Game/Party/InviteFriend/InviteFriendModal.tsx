import qixunAvatar from '@/components/User/qixunAvatar';
import { listFriend } from '@/services/api';
import { Modal } from 'antd';
import { FC, useEffect, useState } from 'react';
import styles from './style.less';

type InviteFriendProps = {
  open: boolean;
  onClose: () => void;
  onClick: (userId: number) => void;
};

const InviteFriend: FC<InviteFriendProps> = ({ open, onClose, onClick }) => {
  const [friends, setFriends] = useState<API.FriendProfile[]>([]);

  useEffect(() => {
    if (open) listFriend().then((res) => setFriends(res.data));
  }, [open]);

  return (
    <Modal
      open={open}
      // centered
      maskClosable={false}
      title="邀请朋友"
      footer={false}
      onCancel={onClose}
      wrapClassName={styles.partyInviteModal}
    >
      {friends &&
        friends.map((friend) => (
          <div
            className={styles.friend}
            onClick={() => onClick(friend.userId)}
            key={friend.userId}
            style={{ whiteSpace: 'pre' }}
          >
            <qixunAvatar user={friend} size={30} />
            {friend.userName}
            {friend.nickname && (
              <>
                {' ('}
                <div style={{ textDecoration: 'underline' }}>
                  {friend.nickname}
                </div>
                {')'}
              </>
            )}
            <span style={{ color: 'grey' }}> (uid: {friend.userId})</span>
          </div>
        ))}
    </Modal>
  );
};

export default InviteFriend;
