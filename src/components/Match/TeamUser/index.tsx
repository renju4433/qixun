import qixunAvatar from '@/components/User/qixunAvatar';
import { Tag } from 'antd';
import { FC } from 'react';
import styles from './style.less';

type TeamUserProps = {
  user: API.UserProfile;
  size: number;
  suffix?: string | null;
};

const TeamUser: FC<TeamUserProps> = ({ user, size, suffix }) => {
  return (
    <div className={styles.teamUser}>
      <div className={styles.avatar}>
        <qixunAvatar user={user} size={size} />
      </div>
      <div>
        {user.userName} {suffix && <Tag>{suffix}</Tag>}
      </div>
    </div>
  );
};

export default TeamUser;
