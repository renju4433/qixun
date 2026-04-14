import { checkTicketLogin, checkWXCodeLogin, getTicket } from '@/services/api';
import { setUser } from '@sentry/react';
import { useModel, useRequest } from '@umijs/max';

import { Button, Image, Spin } from 'antd';
import { FC, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const WeixinLoginComponent: FC = () => {
  const [checkTimer, setCheckTimer] = useState<NodeJS.Timeout | null>(null);

  const { initialState, setInitialState } = useModel('@@initialState');

  const [scan, setScan] = useState<boolean>(false);

  const urlParams = new URL(window.location.href).searchParams;

  const { isInWeChat } = useModel('@@initialState', (model) => ({
    isInWeChat: model.initialState?.isInWeChat,
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
      } catch (error) {}
    }
  };

  const { data, loading, refresh, run } = useRequest(
    () => getTicket({ platform: 'qixun' }),
    {
      manual: true,
    },
  );

  async function afterLoginSuccess() {
    await fetchUserInfo();

    // 跳转到登录前的页面
    if (urlParams.get('redirect')) {
      location.href = decodeURI(urlParams.get('redirect')!);
    } else {
      location.href = 'https://saiyuan.top';
    }
  }
  // 初始化执行
  useEffect(() => {
    run();
    if (urlParams.get('code')) {
      checkWXCodeLogin({
        code: urlParams.get('code')!,
        platform: 'qixun',
      }).then((res) => {
        if (res.success && res.data) {
          afterLoginSuccess();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!data) return;

    // 如果已经存在了Timer需要先销毁
    if (checkTimer !== null) {
      clearInterval(checkTimer);
      setCheckTimer(null);
    }

    const check = setInterval(() => {
      checkTicketLogin({
        ticket: data,
      }).then(async (res) => {
        if (res.success && res.data) {
          // 登录成功
          if (checkTimer !== null) {
            clearInterval(checkTimer);
            setCheckTimer(null);
          }
          afterLoginSuccess();
        }
      });
    }, 2000);
    setCheckTimer(check);
  }, [data]);

  useEffect(() => {
    return () => {
      if (checkTimer !== null) {
        clearInterval(checkTimer);
        setCheckTimer(null);
      }
    };
  }, [checkTimer]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {(!isInWeChat || scan) && (
        <>
          <p>扫码关注「棋寻」公众号自动注册/登录</p>
          <Spin spinning={loading}>
            {data && (
              <Image
                preview={false}
                src={`https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${data}`}
                title="点击刷新"
                width={200}
                onClick={refresh}
              />
            )}
          </Spin>
          {isInWeChat && (
            <>
              <div style={{ height: '20px' }}></div>
              <p>检测到在微信中</p>
              <Button onClick={() => setScan(false)}>
                切换一键授权登录/注册
              </Button>
            </>
          )}
        </>
      )}
      {isInWeChat && !scan && (
        <>
          <p>检测到在微信中</p>
          <Button
            type="primary"
            onClick={() => {
              location.href =
                'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx59fc2a25d80a5812&redirect_uri=' +
                encodeURIComponent(location.href) +
                '&response_type=code&scope=snsapi_userinfo';
            }}
          >
            微信一键授权登录/注册
          </Button>
          <div style={{ height: '20px' }}></div>
          <Button onClick={() => setScan(true)}>切换扫码登录</Button>
        </>
      )}
    </div>
  );
};

export default WeixinLoginComponent;
