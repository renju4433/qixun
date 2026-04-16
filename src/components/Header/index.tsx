import { logout } from '@/services/api';
import { history } from '@@/core/history';
import { setUser } from '@sentry/react';
import { useModel } from '@umijs/max';
import { Avatar, Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { flushSync } from 'react-dom';
import HeaderLogo from './Logo';
import styles from './style.less';

type HeaderProps = {
  canBack?: boolean;
  showSlogan?: boolean;
};

const Header = ({ canBack, showSlogan = false }: HeaderProps) => {
  const { user, setInitialState } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
    setInitialState: model.setInitialState,
  }));

  const handleLogout = async () => {
    await logout({ skipErrorHandler: true }).catch(() => {});
    flushSync(() => {
      setInitialState((s) => ({ ...s, user: undefined }));
      try {
        setUser(null);
      } catch (error) {}
    });
    history.push('/');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人主页',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  return (
    <div className={styles.headerWrapper}>
      <header className={styles.headerContainer}>
        <div>
          <HeaderLogo canBack={canBack} className={styles.logoContainer} />
          {showSlogan && <div className={styles.slogan}>以棋会友</div>}
        </div>

        {user?.userId ? (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key }) => {
                if (key === 'profile' && user?.userId) {
                  history.push(`/user/${user.userId}`);
                  return;
                }
                if (key === 'logout') {
                  handleLogout();
                }
              },
            }}
            trigger={['hover', 'click']}
          >
            <div className={styles.profile}>
              <Avatar size={50} src={user.icon ? `https://b68v.daai.fun/${user.icon}` : undefined}>
                {user.userName?.[0]}
              </Avatar>
              <div className={styles.userInfo}>
                <div className={styles.username}>{user.userName}</div>
              </div>
            </div>
          </Dropdown>
        ) : (
          <div className={styles.authActions}>
            <Button
              className={styles.registerBtn}
              shape="round"
              size="large"
              onClick={() => history.push('/user/register')}
            >
              注册
            </Button>
            <Button
              className={styles.loginBtn}
              shape="round"
              size="large"
              onClick={() =>
                history.push(
                  '/user/login?redirect=' + encodeURIComponent(window.location.href),
                )
              }
            >
              登录
            </Button>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
