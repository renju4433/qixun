import { getTime } from '@/services/api';
import { useEffect, useState } from 'react';
import { isAndroid } from 'react-device-detect';
import { abs } from 'stylis';

const WarningChecker = () => {
  const [showTimeDiff, setShowTimeDiff] = useState<boolean>(false);
  const [showQQBrowser, setShowQQBrowser] = useState<boolean>(false);
  const [showBaiduBrowser, setShowBaiduBrowser] = useState<boolean>(false);

  useEffect(() => {
    getTime().then((res) => {
      if (res.success && res.data) {
        if (abs(res.data - new Date().getTime()) > 3000) setShowTimeDiff(true);
        else setShowTimeDiff(false);
      }
    });
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isQQ = userAgent.indexOf('QQBrowser') > -1; // 检查是否含有"QQBrowser"字符串
    setShowQQBrowser(isQQ);
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isBaidu =
      userAgent.indexOf('baiduboxapp') > -1 ||
      userAgent.indexOf('Baidu') > -1 ||
      userAgent.indexOf('bdapp') > -1 ||
      userAgent.indexOf('bdhonorbrowser') > -1 ||
      userAgent.indexOf('baidu') > -1; // 检查是否含有"QQBrowser"字符串
    setShowBaiduBrowser(isBaidu && isAndroid);
  }, []);

  const warningStyle = {
    color: '#FA8B16',
    fontSize: '13px',
    textAlign: 'center',
  };
  return (
    <>
      {/* <div style={warningStyle as React.CSSProperties}>
      街景服务故障中，部分街景无法展示，正在修复
      </div> */}
      {showTimeDiff && (
        <div style={warningStyle as React.CSSProperties}>
          检测到您的系统时间不准，会影响倒计时展示，建议您
          <a
            color="inherit"
            href="https://time.is/"
            rel="noreferrer"
            target="_blank"
          >
            调整和同步系统时间
          </a>
          ；如准确，请忽略
        </div>
      )}
      {showQQBrowser && (
        <div style={warningStyle as React.CSSProperties}>
          检测到您在QQ浏览器中：QQ浏览器会误拦截棋寻街景地图造成黑灰屏幕，建议您关闭QQ浏览器广告拦截功能(设置-网页-广告拦截)，谢谢。
        </div>
      )}
      {showBaiduBrowser && (
        <div style={warningStyle as React.CSSProperties}>
          检测到您在百度浏览器中：百度浏览器近期版本有Bug，如遇点击无法跳转的问题，请切换其他浏览器使用，谢谢。
        </div>
      )}
    </>
  );
};

export default WarningChecker;
