import Loading from '@/components/Game/Loading';
import HeaderLogo from '@/components/Header/Logo';
import { joinByCode } from '@/services/api';
import { history, useParams, useRequest } from '@umijs/max';
import { Button, Spin, message } from 'antd';
import styles from './style.less';

const Redirect = () => {
  const { code } = useParams<{ code: string }>();

  const { loading } = useRequest(
    () => code && joinByCode({ joinCode: code }, { skipErrorHandler: true }),
    {
      refreshDeps: [code],
      onSuccess: () => {
        history.push('/party');
      },
      onError: (error: any) => {
        if (!error || !error.info) return;
        // 错误情况处理判断
        if (error.info.errorCode === 'need_login') {
          message.error('请先登录');
          history.push(`/user/login?redirect=/join/${code}`);
        } else if (error.info.errorCode === 'party_disband') {
          history.push('/party/error/party_disband');
        } else if (error.info.errorCode === 'party_block') {
          history.push('/party/error/party_block');
        } else if (error.info.errorCode === 'party_not_found') {
          history.push('/party/error/party_not_found');
        }
      },
    },
  );

  return (
    <div className={styles.join}>
      <div className={styles.joinHeader}>
        <header>
          <div className={styles.joinHeaderLeft}>
            <HeaderLogo canBack />
          </div>
          <div className={styles.joinHeaderRight}>
            <Button shape="round" onClick={() => history.push('/party')}>
              派对首页
            </Button>
          </div>
        </header>
      </div>
      <div className={styles.joinBody}>
        <Spin spinning={loading} indicator={<Loading />} />
      </div>
    </div>
  );
};

export default Redirect;
