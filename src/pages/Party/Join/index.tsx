import HeaderLogo from '@/components/Header/Logo';
import { joinByCode, leaveParty } from '@/services/api';
import { useModel } from '@@/exports';
import { history } from '@umijs/max';
import { Button, Input, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './style.less';

const Join = () => {
  const [value, setValue] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<string>();
  const [errorMessage, setErrorMessage] = useState('');
  const { isInApp } = useModel('@@initialState', (model) => ({
    isInApp: model.initialState?.isInApp,
  }));

  const [searchParams] = useSearchParams();

  /**
   * Code输入
   * @param value 输入Code
   * @returns
   */
  const handleOnChange = async (v: string) => {
    setValue(v);

    // 长度小于4不校验
    if (!v || v.length < 4) {
      setIsValid(true);
      setErrorMessage('');
      return;
    }

    setLoading(true);

    try {
      const { success } = await joinByCode(
        { joinCode: v },
        { skipErrorHandler: true }, // 跳过默认处理
      );

      if (success) {
        setIsValid(true);
        // 跳转到派对页面
        history.push('/party');
      }
    } catch (error: any) {
      if (!error || !error.info) return;

      setIsValid(false);

      // 错误情况处理判断
      if (error.info.errorCode === 'party_disband') {
        setErrorMessage('派对不存在或者已经解散！');
        setErrorType('party_disband');
      } else if (error.info.errorCode === 'party_block') {
        setErrorMessage('你已经被移除和禁止加入该派对');
        setErrorType('party_block');
      } else if (error.info.errorCode === 'party_not_found') {
        setErrorMessage('派对不存在或者已经解散！');
        setErrorType('party_not_found');
      } else if (error.info.errorCode === 'need_login') {
        message.error('请先登录');
        history.push(`/user/login?redirect=/join/${v}`);
      }
    }

    setLoading(false);
  };

  /**
   * 跳转到派对首页
   */
  const handleGoToParty = useCallback(async () => {
    // 如果是被移除或者解散的情况，需要离开派对
    if (errorType === 'party_disband' || errorType === 'party_block') {
      await leaveParty();
    }

    location.href = 'https://saiyuan.top/party-new';
    // TODO: history.push('/party-new');
  }, [errorType]);

  useEffect(() => {
    const code = searchParams.get('code') ?? null;
    if (code) handleOnChange(code);
  }, []);

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
      <div className={styles.joinBody}>
        <div
          className={`${styles.inputContainer} ${
            !isValid ? styles.inputInvalid : ''
          }`}
        >
          {/*在手机下有BuG*/}
          {/*<ReactCodeInput*/}
          {/*  type="text"*/}
          {/*  fields={4}*/}
          {/*  name="code"*/}
          {/*  inputMode="latin"*/}
          {/*  value={value}*/}
          {/*  isValid={isValid}*/}
          {/*  onChange={handleOnChange}*/}
          {/*  inputStyle={{ paddingRight: 0 }}*/}
          {/*/>*/}
          <Input
            style={{
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bolder',
            }}
            // size={'large'}
            placeholder="4位邀请码"
            maxLength={4}
            autoFocus
            value={value}
            onChange={(e) => handleOnChange(e.target.value)}
          />
          <h3>在上方输入4位派对邀请码</h3>
          <div style={{ color: 'gray' }}>邀请链接后四位，输入后自动检测</div>
          <div className={styles.inputStatus}>
            <p className={loading ? '' : styles.errorMsg}>
              {loading ? '正在验证...' : errorMessage}
            </p>
          </div>
        </div>
        <h2>加入派对</h2>
      </div>
    </div>
  );
};

export default Join;
