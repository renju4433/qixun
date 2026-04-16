import { history } from '@@/core/history';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styles from './style.less';

type HeaderLogoProps = {
  className?: string;
  canBack?: boolean;
};

const HeaderLogo = ({ className = '', canBack = false }: HeaderLogoProps) => {
  const canGoBack =
    typeof window !== 'undefined' &&
    window.history &&
    window.history.state &&
    window.history.state.idx !== null &&
    window.history.state.idx !== undefined &&
    window.history.state.idx > 0;

  return (
    <div className={`${styles.navigate} ${className}`}>
      {canBack && canGoBack && (
        <Button
          className={styles.backBtn}
          icon={<ArrowLeftOutlined />}
          onClick={() => history.back()}
          size="large"
        />
      )}
      <div
        className={styles.logo}
        onClick={() => {
          history.push('/');
        }}
      >
        <span className={styles.logoText}>棋寻</span>
      </div>
    </div>
  );
};

export default HeaderLogo;
