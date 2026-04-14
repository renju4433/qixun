import { FC } from 'react';

type EmptyAvatarProps = {
  handleInvite?: () => void;
};

const EmptyAvatar: FC<EmptyAvatarProps> = ({ handleInvite }) => (
  <div></div>
  // <div className={`${styles.player} ${styles.empty}`}>
  //   <div className={styles.avatarContainer}>
  //     <div
  //       className={styles.avatarCover}
  //       style={{
  //         backgroundImage: `url(${publicPath}/images/user/anonymous.jpg)`,
  //       }}
  //     />
  //   </div>
  //   <div className={styles.userName}>
  //     <Button shape="round" onClick={handleInvite}>
  //       邀请朋友
  //     </Button>
  //   </div>
  // </div>
);

export default EmptyAvatar;
