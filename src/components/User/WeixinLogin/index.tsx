import { checkTicketLogin, getTicket } from '@/services/api';
import { setUser } from '@sentry/react';
import { useModel, useRequest } from '@umijs/max';
import { Image, Modal, Spin } from 'antd';
import { FC, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

type WeixinLoginModalProps = {
  open: boolean;
  onOpen: (open: boolean) => void;
};

const WeixinLoginModal: FC<WeixinLoginModalProps> = ({ open, onOpen }) => {
  const [checkTimer, setCheckTimer] = useState<NodeJS.Timeout | null>(null);

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
      } catch (error) {}
    }
  };

  const { data, loading, refresh, run } = useRequest(
    () => getTicket({ platform: 'qixun' }),
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (open) {
      run();
    } else {
      // 关闭Modal时候清除定时器
      if (checkTimer) {
        clearInterval(checkTimer);
        setCheckTimer(null);
      }
    }
  }, [open]);

  useEffect(() => {
    if (!data) return;

    // 如果已经存在了Timer需要先销毁
    if (checkTimer) clearInterval(checkTimer);

    const check = setInterval(() => {
      checkTicketLogin({
        ticket: data,
      }).then(async (res) => {
        if (res.success && res.data) {
          // 登录成功
          clearInterval(check);
          setCheckTimer(null);

          await fetchUserInfo();

          onOpen(false);

          // 跳转到登录前的页面
          const urlParams = new URL(window.location.href).searchParams;
          if (urlParams.get('redirect')) {
            location.href = decodeURI(urlParams.get('redirect')!);
          } else {
            location.href = 'https://saiyuan.top';
          }
        }
      });
    }, 2000);
    setCheckTimer(check);
  }, [data]);

  return (
    <Modal
      title="微信登录"
      open={open}
      footer={null}
      onCancel={() => onOpen(false)}
      width={320}
    >
      <p>扫码关注「棋寻」公众号自动注册/登录</p>
      <Spin spinning={loading}>
        {data && (
          <Image
            preview={false}
            src={`https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${data}`}
            title="点击刷新"
            onClick={refresh}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default WeixinLoginModal;
