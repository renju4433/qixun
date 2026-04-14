import { publicPath } from '@/constants';
import { checkMessage, checkVipState, logout } from '@/services/api';
import { history } from '@@/core/history';
import { setUser } from '@sentry/react';
import { useModel, useRequest } from '@umijs/max';
import { Badge, Button, Dropdown } from 'antd';
import BigNumber from 'bignumber.js';
import type { MenuInfo } from 'rc-menu/lib/interface';
import { FC, useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import HeaderLogo from './Logo';
import qixunAvatar from '../User/qixunAvatar';
import styles from './style.less';

type HeaderProps = {
  canBack?: boolean;
  showSlogan?: boolean;
};

const Header: FC<HeaderProps> = ({ canBack: canBack, showSlogan = false }) => {
  const { user, setInitialState, isInApp } = useModel(
    '@@initialState',
    (model) => ({
      user: model.initialState?.user,
      setInitialState: model.setInitialState,
      isInApp: model.initialState?.isInApp,
    }),
  );

  const [showHasMessage, setShowHasMessage] = useState<boolean>(false);
  useEffect(() => {
    checkMessage().then((res) => {
      if (res.data) setShowHasMessage(true);
    });
  }, []);
  const { data: vipExpireDate } = useRequest(checkVipState);

  const handleLogout = useCallback(async () => {
    // 注销登录
    await logout();

    // 清空用户缓存信息
    flushSync(() => {
      setInitialState((s) => ({ ...s, user: undefined }));

      // 设置Sentry用户信息，忽略错误
      try {
        setUser(null);
      } catch (error) {}
    });

    // 返回首页
    // history.push('/');
    location.href = 'https://saiyuan.top';
  }, [setInitialState]);

  /**
   * 菜单点击事件
   *
   * @param {MenuInfo} event 事件
   * @return {void}
   */
  const onMenuClick = (event: MenuInfo): void => {
    const { key } = event;
    // 退出登录
    if (key === 'logout') {
      handleLogout();
      return;
    }
    if (key === 'friends') history.push('/friend');
    if (key === 'myHome') history.push('/user/' + user?.userId);
    if (key === 'message') history.push('/message');
  };

  return (
    <div className={styles.headerWrapper}>
      <header className={styles.headerContainer}>
        <div>
          <HeaderLogo canBack={canBack} className={styles.logoContainer} />
          {showSlogan && <div className={styles.slogan}>探索世界</div>}
        </div>
        {isInApp ? (
          <div></div>
        ) : user?.userId ? (
          // 已登录显示
          <Dropdown
            menu={{
              onClick: onMenuClick,
              items: [
                { label: '个人首页', key: 'myHome' },
                {
                  label: showHasMessage ? (
                    <Badge dot>消息通知</Badge>
                  ) : (
                    '消息通知'
                  ),
                  key: 'message',
                },
                { label: '我的好友', key: 'friends' },
                // { label: '退出登录', key: 'logout' },
              ],
            }}
            trigger={['hover']}
          >
            <Badge dot={showHasMessage}>
              <div className={styles.profile}>
                <div className={styles.avatar}>
                  <qixunAvatar user={user!} size={50} />
                </div>

                <div className={styles.userInfo}>
                  <div className={styles.username}>{user?.userName}</div>
                  {vipExpireDate ? (
                    <div className={styles.vipState}>
                      <img
                        src={`${publicPath}/images/user/vip.svg`}
                        width={20}
                      />{' '}
                      {new BigNumber(vipExpireDate)
                        .minus(Date.now())
                        .div(24 * 3600 * 1000)
                        .toFormat(0)}{' '}
                      天到期
                    </div>
                  ) : (
                    <div></div>
                    // <div
                    //   className={styles.vipState}
                    //   onClick={(e) => {
                    //     e.stopPropagation();
                    //     alert('开通会员提示');
                    //   }}
                    // >
                    //   <img src="/images/user/vip-2.svg" width={20} /> 开通会员
                    // </div>
                  )}
                </div>
              </div>
            </Badge>
          </Dropdown>
        ) : (
          // 未登录显示
          <div className={styles.profile}>
            <div className={styles.userInfo}>
              <Button
                className={styles.loginBtn}
                shape="round"
                onClick={() =>
                  history.push(
                    '/user/login?redirect=' + encodeURIComponent(location.href),
                  )
                }
                size="large"
              >
                登录
              </Button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
