import { useCaptcha } from '@/hooks/use-captcha';
import {
  getCaptchaCodeNew,
  getLoginCaptchaCode,
  resetPasswordByPhone,
} from '@/services/api';
import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Modal, message, notification } from 'antd';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
  login: boolean;
};

const ChangePasswordModal: FC<ChangePasswordModalProps> = ({
  open,
  onClose,
  login = false,
}) => {
  const [values, setValues] = useState<any>({});
  const phoneRef = useRef<string>('');

  const captcha = useCaptcha();

  const sendMessage = useCallback(
    (param: any) => {
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
    if (login && open) {
      captcha((param) => {
        setTimeout(() => {
          sendMessage(param);
        }, 200);
        return {
          captchaResult: true,
          bizResult: true,
        };
      });
    }
  }, [login, open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => {
        resetPasswordByPhone(values).then((res) => {
          if (res.success) {
            message.success('修改成功，请使用新密码重新登录');
            onClose();
            history.push('/user/login');
          }
        });
      }}
      okText="修改"
      title="手机验证码修改密码"
    >
      <div>{'绑定微信的用户直接在「棋寻」公众号回复"密码"即可。'}</div>
      <ProForm
        submitter={false}
        onValuesChange={(v) => setValues({ ...values, ...v })}
      >
        {login && (
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
        )}
        <ProFormCaptcha
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className="prefixIcon" />,
            // ref: captchaRef,
          }}
          captchaProps={{ size: 'large' }}
          placeholder="请输入验证码"
          label={login ? '验证码' : '获取绑定手机的验证码'}
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
            if (login) {
              phoneRef.current = phone;
            } else {
              await getLoginCaptchaCode();
              // captchaRef.current?.input?.focus();
              notification.success({
                message: '获取验证码成功！',
                description: '验证码已经发送到你的手机，请注意查收！',
              });
            }
          }}
        />
        <ProFormText.Password
          label="新密码"
          placeholder="请输入较为复杂的密码"
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className="prefixIcon" />,
          }}
          rules={[{ required: true, message: '请输入密码！' }]}
        />
      </ProForm>
    </Modal>
  );
};

export default ChangePasswordModal;
