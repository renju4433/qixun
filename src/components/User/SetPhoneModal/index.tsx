import { useCaptcha } from '@/hooks/use-captcha';
import { getCaptchaCodeNew, setPhone } from '@/services/api';
import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormCaptcha,
  ProFormText,
} from '@ant-design/pro-components';
import { InputRef, Modal, message, notification } from 'antd';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

type ResetPhoneModalProps = {
  open: boolean;
  onClose: () => void;
};

const ResetPhoneModal: FC<ResetPhoneModalProps> = ({ open, onClose }) => {
  const [values, setValues] = useState<any>();
  const captchaRef = useRef<InputRef | null>(null);
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
    if (!open) return;
    captcha((param) => {
      setTimeout(() => {
        sendMessage(param);
      }, 200);
      return {
        captchaResult: true,
        bizResult: true,
      };
    });
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => {
        setPhone(values).then((res) => {
          if (res.success) {
            message.success('设置成功');
            onClose();
          }
        });
      }}
      okText="绑定"
      title="绑定手机号"
    >
      <ProForm
        submitter={false}
        onValuesChange={(v) => setValues({ ...values, ...v })}
      >
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
            ref: captchaRef,
          }}
          captchaProps={{ size: 'large' }}
          placeholder="请输入验证码"
          label="获取绑定手机的验证码"
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
            captchaRef.current?.input?.focus();
            phoneRef.current = phone;
          }}
        />
      </ProForm>
    </Modal>
  );
};

export default ResetPhoneModal;
