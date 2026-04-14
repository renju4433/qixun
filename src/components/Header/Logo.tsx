import { qixunGoback, qixunGoHome } from '@/utils/HisotryUtils';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { Button } from 'antd';
import { FC } from 'react';
import styles from './style.less';

type HeaderLogoProps = {
  className?: string;
  canBack?: boolean;
};

export function checkCanBack(): boolean {
  console.log(history.state);
  return (
    history &&
    history.state &&
    history.state.idx !== null &&
    history.state.idx !== undefined &&
    history.state.idx > 0
  );
}

const HeaderLogo: FC<HeaderLogoProps> = ({
  className = '',
  canBack: canBack,
}) => {
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  return (
    <div
      className={`${styles.navigate} ${className} ${
        isInApp ? styles.appNavigate : ''
      }`}
    >
      {canBack && (checkCanBack() || isInApp) && (
        <Button
          className={styles.backBtn}
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            qixunGoback('/');
          }}
          size="large"
        />
      )}
      <div
        className={styles.logo}
        onClick={() => {
          qixunGoHome();
        }}
      >
        <span className={styles.logoText}>棋寻</span>
        {/*<sup>新版</sup>*/}
      </div>
    </div>
  );
};

export default HeaderLogo;
