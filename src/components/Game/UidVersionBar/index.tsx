import { useModel } from '@umijs/max';
import { FC } from 'react';
import styles from './style.less';

type UidVersionBarProps = {
  mapsName?: string | null;
};

const UidVersionBar: FC<UidVersionBarProps> = ({ mapsName }) => {
  const { userInfo } = useModel('@@initialState', (model) => ({
    userInfo: model.initialState?.user,
  }));

  if (!userInfo?.userId) return null;

  return (
    <div className={styles.bar}>
      uid:{userInfo.userId}｜v{process.env.VERSION}
      {mapsName ? `｜${mapsName}` : ''}
    </div>
  );
};

export default UidVersionBar;
