import { login } from '@/services/api';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { setUser } from '@sentry/react';
import { Link, useModel } from '@umijs/max';
import { Space, message } from 'antd';
import { useEffect } from 'react';
import { flushSync } from 'react-dom';
import styles from './style.less';

const Login = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const urlParams = new URL(window.location.href).searchParams;

  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  // 获取用户信息
  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          user: userInfo,
        }));
      });

      // 设置Sentry用户信息，忽略错误
      try {
        setUser({
          id: userInfo.userId,
          username: userInfo.userName,
        });
      } catch (error) { }
    }
  };
  const jump = () => {
    if (urlParams.get('redirect')) {
      location.href = decodeURIComponent(urlParams.get('redirect')!);
    } else location.href = 'https://saiyuan.top';
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // 登录
      const { success } = await login(values);
      if (success) {
        message.success('登录成功！');
        await fetchUserInfo();
        jump();
        return;
      }
    } catch (error) { }
  };

  useEffect(() => {
    if (user && urlParams.get('redirect'))
      location.href = decodeURIComponent(urlParams.get('redirect')!);
  }, [user]);

  return (
    <div className={styles.wrapper}>
      <LoginForm
        title="棋寻"
        subTitle="以棋会友"
        requiredMark={false}
        actions={
          <Space
            direction="vertical"
            style={{ width: '100%', textAlign: 'center' }}
          >
            <Link to="/user/register" className={styles.registerLink}>
              还未注册？ 去注册
            </Link>
          </Space>
        }
        submitter={{ submitButtonProps: { shape: 'round' } }}
        onFinish={async (values) => {
          await handleSubmit(values as API.LoginParams);
        }}
      >
        <ProFormText
          label="用户名/手机号"
          placeholder="请输入用户名或手机号"
          name="userName"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined className="prefixIcon" />,
          }}
          rules={[{ required: true, message: '请输入用户名 / 手机！' }]}
        />
        <ProFormText.Password
          label="密码"
          placeholder="请输入密码"
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className="prefixIcon" />,
          }}
          rules={[{ required: true, message: '请输入密码！' }]}
        />
        {/*  {loginType === 'PHONE' && (*/}
        {/*    <>*/}
        {/*      <ProFormText*/}
        {/*        fieldProps={{*/}
        {/*          size: 'large',*/}
        {/*          prefix: <MobileOutlined className="prefixIcon" />,*/}
        {/*        }}*/}
        {/*        name="phone"*/}
        {/*        label="手机号"*/}
        {/*        placeholder="请输入手机号"*/}
        {/*        rules={[*/}
        {/*          { required: true, message: '请输入手机号！' },*/}
        {/*          { pattern: /^1\d{10}$/, message: '手机号格式错误！' },*/}
        {/*        ]}*/}
        {/*      />*/}
        {/*      <ProFormCaptcha*/}
        {/*        fieldProps={{*/}
        {/*          size: 'large',*/}
        {/*          prefix: <LockOutlined className="prefixIcon" />,*/}
        {/*          ref: captchaRef,*/}
        {/*        }}*/}
        {/*        captchaProps={{ size: 'large' }}*/}
        {/*        placeholder="请输入验证码"*/}
        {/*        label="验证码"*/}
        {/*        captchaTextRender={(timing, count) => {*/}
        {/*          if (timing) return `${count} ${'获取验证码'}`;*/}
        {/*          return '获取验证码';*/}
        {/*        }}*/}
        {/*        name="code"*/}
        {/*        phoneName="phone"*/}
        {/*        rules={[{ required: true, message: '请输入验证码！' }]}*/}
        {/*        onGetCaptcha={async (phone) => {*/}
        {/*          await getCaptchaCode({ phone });*/}
        {/*          captchaRef.current?.input?.focus();*/}
        {/*          notification.success({*/}
        {/*            message: '获取验证码成功！',*/}
        {/*            description: '验证码已经发送到你的手机，请注意查收！',*/}
        {/*          });*/}
        {/*        }}*/}
        {/*      />*/}
        {/*    </>*/}
        {/*  )}*/}
      </LoginForm>
    </div>
  );
};

export default Login;
