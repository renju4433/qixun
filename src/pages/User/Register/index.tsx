import { register } from '@/services/api';
import {
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormText,
} from '@ant-design/pro-components';
import { setUser } from '@sentry/react';
import { Link, useModel } from '@umijs/max';
import { Space, message } from 'antd';
import { flushSync } from 'react-dom';
import styles from './style.less';

const Register = () => {
  const { initialState, setInitialState } = useModel('@@initialState');

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

  const handleSubmit = async (values: API.RegisterParams) => {
    try {
      // 登录
      const { success } = await register(values);
      if (success) {
        message.success('注册成功！');
        await fetchUserInfo();

        // 跳转到登录前的页面
        const urlParams = new URL(window.location.href).searchParams;
        if (urlParams.get('redirect')) {
          location.href = decodeURI(urlParams.get('redirect')!);
        } else {
          location.href = 'https://saiyuan.top';
        }
        return;
      }
    } catch (error) { }
  };

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
            <Link to="/user/login" className={styles.registerLink}>
              已有账号？去登录
            </Link>
          </Space>
        }
        submitter={{
          submitButtonProps: { shape: 'round' },
          searchConfig: { submitText: '注册' },
        }}
        onFinish={async (values) => {
          await handleSubmit(values as API.RegisterParams);
        }}
      >
        <ProFormText
          label="用户名"
          placeholder="请输入用户名"
          name="userName"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined className="prefixIcon" />,
          }}
          rules={[{ required: true, message: '请输入用户名！' }]}
        />

        <ProFormText.Password
          label="密码"
          placeholder="请输入复杂点的密码"
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className="prefixIcon" />,
          }}
          rules={[{ required: true, message: '请输入密码！' }]}
        />
      </LoginForm>
    </div>
  );
};

export default Register;
