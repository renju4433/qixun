import { FaUserGroup } from '@react-icons/all-files/fa6/FaUserGroup';
import { useModel } from '@umijs/max';
import { Statistic } from 'antd';
import { FC } from 'react';
import styles from './style.less';

type OnlineMemberProps = {
  model: 'Point.model' | 'Challenge.model';
};

const OnlineMember: FC<OnlineMemberProps> = ({ model }) => {
  const { onlineNums } = useModel(model, (m) => ({
    onlineNums:
      model === 'Point.model'
        ? m.onlineNums
        : m.gameData?.type === 'rank'
        ? m.gameData?.teams?.length
        : m.gameData?.saveTeamCount,
  }));
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  return (
    <div className={`${styles.status} ${isInApp ? styles.inApp : ''}`}>
      <Statistic
        className={styles.statistic}
        title=""
        value={onlineNums}
        prefix={<FaUserGroup />}
      />
    </div>
  );
};

export default OnlineMember;
