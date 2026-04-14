import { Avatar } from 'antd';
import { FC } from 'react';
import styles from './style.module.less';

type qixunAvatarProps = {
  user:
    | API.UserProfile
    | { userId: number; icon: string; avatarFrame?: string };
  size?: number;
};

const qixunAvatar: FC<qixunAvatarProps> = ({ user, size }) => (
  <div
    className={styles.qixunAvatar}
    style={
      size
        ? {
            height: `${size}px`,
            width: `${size}px`,
            minHeight: `${size}px`,
            minWidth: `${size}px`,
            maxHeight: `${size}px`,
            maxWidth: `${size}px`,
          }
        : {}
    }
  >
    <Avatar
      src={
        new Date().getTime() >= 1743436800000 &&
        new Date().getTime() <= 1743523200000
          ? `https://b68v.daai.fun/${user.icon}?x-oss-process=image/resize,h_120,image/rotate,180`
          : `https://b68v.daai.fun/${user.icon}?x-oss-process=image/resize,h_120`
      }
      style={{
        minWidth: '75%',
        maxWidth: '75%',
        minHeight: '75%',
        maxHeight: '75%',
        margin: 'auto',
      }}
    />

    {user.avatarFrame && (
      <img
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        src={
          new Date().getTime() >= 1743436800000 &&
          new Date().getTime() <= 1743523200000
            ? `https://b68v.daai.fun/${user.avatarFrame}?x-oss-process=image/resize,h_120,image/rotate,180`
            : `https://b68v.daai.fun/${user.avatarFrame}?x-oss-process=image/resize,h_120`
        }
      />
    )}
  </div>
);

export default qixunAvatar;
