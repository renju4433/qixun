import WeixinLoginModal from '@/components/User/WeixinLogin';
import { useCaptcha } from '@/hooks/use-captcha';
import { getCaptchaCodeNew, register } from '@/services/api';
import {
  LockOutlined,
  MobileOutlined,
  UserOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { setUser } from '@sentry/react';
import { Link, useModel } from '@umijs/max';
import { Button, Divider, Space, message, notification } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import styles from './style.less';

const Register = () => {
  const [wxModalOpen, setWxModalOpen] = useState<boolean>(false);
  const { initialState, setInitialState } = useModel('@@initialState');

  const phoneRef = useRef<string>('');
  const captcha = useCaptcha();

  const sendMessage = useCallback(
    (param) => {
      getCaptchaCodeNew({
        phone: phoneRef.current,
        captchaVerifyParam: param,
      }).then((res) => {
        if (res.success) {
          notification.success({
            message: '获取验证码成功！',
            description: '验证码已经发送到你的手机，请注意查收！',
          });
        }
      });
    },
    [phoneRef.current],
  );

  useEffect(() => {
    captcha((param) => {
      setTimeout(() => {
        sendMessage(param);
      }, 200);
      return {
        captchaResult: true,
        bizResult: true,
      };
    });
  }, []);

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
      } catch (error) {}
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
    } catch (error) {}
  };

  return (
    <div className={styles.wrapper}>
      <LoginForm
        title="棋寻"
        subTitle="探索世界"
        requiredMark={false}
        actions={
          <Space
            direction="vertical"
            style={{ width: '100%', textAlign: 'center' }}
          >
            <Link to="/user/login" className={styles.registerLink}>
              已有账号？去登录
            </Link>
            <Divider>其他方式</Divider>
            <Button
              icon={<WechatOutlined />}
              shape="round"
              size="large"
              block
              onClick={() => setWxModalOpen(true)}
            >
              使用微信快速注册
            </Button>
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

        <ProFormText
          fieldProps={{
            size: 'large',
            prefix: <MobileOutlined className="prefixIcon" />,
          }}
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          rules={[
            { required: true, message: '请输入手机号！' },
            { pattern: /^1\d{10}$/, message: '手机号格式错误！' },
          ]}
        />
        <ProFormCaptcha
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className="prefixIcon" />,
          }}
          captchaProps={{ size: 'large' }}
          placeholder="请输入验证码"
          label="验证码"
          captchaTextRender={(timing, count) => {
            if (timing)
              return (
                <div id={'captcha-button'}>{`${count} ${'获取验证码'}`}</div>
              );
            return <div id={'captcha-button'}>获取验证码</div>;
          }}
          name="code"
          phoneName="phone"
          rules={[{ required: true, message: '请输入验证码！' }]}
          onGetCaptcha={async (phone) => {
            phoneRef.current = phone;
          }}
        />
      </LoginForm>
      <WeixinLoginModal open={wxModalOpen} onOpen={setWxModalOpen} />
    </div>
  );
};

export default Register;
