import HeaderLogo from '@/components/Header/Logo';
import { leaveParty } from '@/services/api';
import { history, useModel, useParams } from '@umijs/max';
import { Button, Flex, Result } from 'antd';
import { useCallback, useMemo } from 'react';
import styles from './style.less';

const PartyError = () => {
  const { type } = useParams<{
    type: 'party_disband' | 'party_block' | 'party_not_found';
  }>();

  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const errorMessage = useMemo(() => {
    if (!type) history.push('/party');
    return type === 'party_disband'
      ? '派对不存在或者已经解散'
      : type === 'party_block'
      ? '你已经被移除和禁止加入该派对'
      : type === 'party_not_found'
      ? '派对不存在或者已经解散'
      : '未知错误';
  }, [type]);

  /**
   * 跳转到派对首页
   */
  const handleGoToParty = useCallback(async () => {
    // 如果是被移除或者解散的情况，需要离开派对
    if (type === 'party_disband' || type === 'party_block') {
      await leaveParty();
    }

    history.push('/party');
  }, [type]);

  const handleGoToJoin = useCallback(async () => {
    // 如果是被移除或者解散的情况，需要离开派对
    if (type === 'party_disband' || type === 'party_block') {
      await leaveParty();
    }

    history.push('/join');
  }, [type]);

  return (
    <div className={styles.join}>
      <div className={styles.joinHeader}>
        <header>
          <div className={styles.joinHeaderLeft}>
            <HeaderLogo canBack />
          </div>
          <div
            className={`${styles.joinHeaderRight} ${
              isInApp ? styles.appNavigate : ''
            }`}
          >
            <Button shape="round" onClick={handleGoToParty}>
              派对首页
            </Button>
          </div>
        </header>
      </div>
      <Result
        status="404"
        icon={null}
        title={errorMessage}
        subTitle="您要查找的派对不存在或已解散，但请随时开始自己的派对！"
        extra={
          <Flex align="center" gap="middle" vertical>
            <Button shape="round" onClick={handleGoToParty} type="primary">
              离开自己创建
            </Button>
            <Button shape="round" onClick={handleGoToJoin} type="primary">
              邀请码加入
            </Button>
          </Flex>
        }
      />
    </div>
  );
};

export default PartyError;
