import NormalPage from '@/pages/NormalPage';
import {
  checkPasswordChange,
  getPasswordChangeQrcode,
} from '@/services/api';
import { history } from '@umijs/max';
import { Button, Flex, Input, Result, Spin, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

type Status =
  | 'input_password'
  | 'loading'
  | 'scanning'
  | 'success'
  | 'expired'
  | 'wechat_mismatch'
  | 'error';

const ChangePassword = () => {
  const [status, setStatus] = useState<Status>('input_password');
  const [qrcodeUrl, setQrcodeUrl] = useState<string>('');
  const [ticket, setTicket] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 生成二维码
  const generateQrcode = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await getPasswordChangeQrcode({ platform: 'qixun' });
      if (res.success && res.data) {
        setQrcodeUrl(res.data.qrcodeUrl);
        setTicket(res.data.ticket);
        setStatus('scanning');
      } else {
        setStatus('error');
        setErrorMessage(res.errorMessage || '生成二维码失败');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('网络错误，请稍后重试');
    }
  }, []);

  // 处理轮询状态的通用函数
  const handlePollStatus = useCallback(
    (statusData: { status: string; message?: string } | undefined) => {
      if (!statusData) return;
      const newStatus = statusData.status;
      if (newStatus === 'success') {
        // 扫码验证通过，密码已修改
        setStatus('success');
        message.success('密码修改成功');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (newStatus === 'expired') {
        setStatus('expired');
        setErrorMessage('二维码已过期，请重新操作');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (newStatus === 'wechat_mismatch') {
        setStatus('wechat_mismatch');
        setErrorMessage(statusData.message || '扫码的微信与绑定的微信不一致');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
      // pending状态继续轮询
    },
    [],
  );

  // 轮询检查状态（带着密码，验证成功直接改密码）
  const pollStatus = useCallback(async () => {
    if (!ticket || !newPassword) return;
    try {
      // 每次轮询都带上密码，后端验证成功时直接修改密码
      const res = await checkPasswordChange({ ticket, newPassword });
      if (res.success && res.data) {
        handlePollStatus(res.data);
      }
    } catch (err: any) {
      // 检查是否是业务错误（success: false 时抛出的错误）
      if (err.name === 'BizError') {
        const errorInfo = err.info || {};
        // 如果 data 中有状态信息，处理它
        if (errorInfo.data && errorInfo.data.status) {
          handlePollStatus(errorInfo.data);
          return;
        }
        // 如果 data 为 null 或没有 status，可能是 pending 状态，继续轮询
        return;
      }
      // 其他网络错误时不停止轮询，继续尝试
    }
  }, [ticket, newPassword, handlePollStatus]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 开始轮询
  useEffect(() => {
    if (status === 'scanning' && ticket && newPassword) {
      pollingRef.current = setInterval(pollStatus, 2000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status, ticket, newPassword, pollStatus]);

  // 验证密码并进入下一步
  const handleNextStep = () => {
    if (!newPassword) {
      message.error('请输入新密码');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      message.error('密码长度至少6位');
      return;
    }
    // 密码验证通过，生成二维码
    generateQrcode();
  };

  // 重新开始
  const handleRestart = () => {
    setNewPassword('');
    setConfirmPassword('');
    setTicket('');
    setQrcodeUrl('');
    setErrorMessage('');
    setStatus('input_password');
  };

  // 渲染不同状态的内容
  const renderContent = () => {
    switch (status) {
      case 'input_password':
        return (
          <Flex
            vertical
            align="center"
            gap="middle"
            style={{ maxWidth: 300, width: '100%' }}
          >
            <div style={{ color: '#666', textAlign: 'center' }}>
              请先输入新密码，然后使用微信扫码验证身份
            </div>
            <Input.Password
              placeholder="请输入新密码"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%' }}
              size="large"
            />
            <Input.Password
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%' }}
              size="large"
              onPressEnter={handleNextStep}
            />
            <Button
              type="primary"
              onClick={handleNextStep}
              style={{ width: '100%' }}
              size="large"
            >
              下一步
            </Button>
          </Flex>
        );

      case 'loading':
        return (
          <Flex justify="center" align="center" style={{ minHeight: 300 }}>
            <Spin size="large" tip="生成二维码中..." />
          </Flex>
        );

      case 'scanning':
        return (
          <Flex vertical align="center" gap="middle">
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>
              请使用微信扫描二维码验证身份
            </div>
            <div style={{ color: '#666' }}>
              请使用绑定的微信账号扫码，扫码成功后密码将自动修改
            </div>
            {qrcodeUrl && (
              <img
                src={qrcodeUrl}
                alt="微信扫码"
                style={{ width: 200, height: 200 }}
              />
            )}
            <div style={{ color: '#999', fontSize: 12 }}>
              二维码有效期5分钟
            </div>
            <Spin tip="等待扫码验证..." />
            <Button onClick={handleRestart}>返回修改密码</Button>
          </Flex>
        );

      case 'success':
        return (
          <Result
            status="success"
            title="密码修改成功"
            subTitle="您的密码已成功修改，请使用新密码重新登录"
            extra={[
              <Button type="primary" key="login" onClick={() => history.push('/user/login')}>
                去登录
              </Button>,
            ]}
          />
        );

      case 'expired':
        return (
          <Result
            status="warning"
            title="二维码已过期"
            subTitle={errorMessage}
            extra={[
              <Button type="primary" key="retry" onClick={handleRestart}>
                重新开始
              </Button>,
            ]}
          />
        );

      case 'wechat_mismatch':
        return (
          <Result
            status="error"
            title="微信验证失败"
            subTitle={errorMessage}
            extra={[
              <Button type="primary" key="retry" onClick={handleRestart}>
                重新开始
              </Button>,
            ]}
          />
        );

      case 'error':
        return (
          <Result
            status="error"
            title="出错了"
            subTitle={errorMessage}
            extra={[
              <Button type="primary" key="retry" onClick={handleRestart}>
                重新开始
              </Button>,
              <Button key="back" onClick={() => history.back()}>
                返回
              </Button>,
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <NormalPage>
      <Flex vertical align="center" style={{ padding: '20px 0' }}>
        <h2 style={{ marginBottom: 20 }}>微信扫码修改密码</h2>
        {renderContent()}
      </Flex>
    </NormalPage>
  );
};

export default ChangePassword;
