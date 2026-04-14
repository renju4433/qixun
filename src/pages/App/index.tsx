import { publicPath } from '@/constants';
import { getAppLastVersion } from '@/services/api';
import { useModel } from '@@/exports';
import { useEffect, useState } from 'react';
import styles from './style.less';

const App = () => {
  const [androidVersion, setAndroidAppVersion] = useState<string>();
  const [iOSVersion, setIOSVersion] = useState<string>();
  const [device, setDevice] = useState<string>('');

  const { isInWeChat } = useModel('@@initialState', (model) => ({
    isInWeChat: model.initialState?.isInWeChat,
  }));

  getAppLastVersion().then((res) => {
    setAndroidAppVersion(res.data.android.version);
    setIOSVersion(res.data.ios.version);
  });

  useEffect(() => {
    if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
      setDevice('ios');
    } else if (/(Android)/i.test(navigator.userAgent)) {
      setDevice('android');
    } else {
      setDevice('pc');
    }
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <img
          style={{ width: '100%' }}
          src={`${publicPath}/images/app/top.png`}
          alt=""
        />
      </div>

      {isInWeChat && (
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '24px',
            color: 'black',
            marginBottom: '2rem',
          }}
        >
          点击右上角在浏览器打开
        </div>
      )}
      <div className={styles.logo_con}>
        <div className={styles.logo}>
          <span>棋寻</span>
        </div>

        <div className={styles.app_name}>
          <img
            className={styles.plat_icon}
            src={`${publicPath}/images/app/android.png`}
          />
          <img
            className={styles.plat_icon}
            src={`${publicPath}/images/app/ios.png`}
          />
          <span>棋寻</span>

          <div className={styles.hint}>
            <p>如在微信中请点击右上角...在浏览器打开下载</p>
            <p>App起步阶段，可能会有较多Bug，如遇无法使用的情况请访问网页</p>
          </div>
        </div>

        <div className={styles.build_info}>
          {androidVersion && iOSVersion && (
            <div className={styles.info_item}>
              {' '}
              iOS: {iOSVersion} | Android: {androidVersion}{' '}
            </div>
          )}
        </div>

        <div
          className={styles.updates}
          onClick={() =>
            window.open('https://www.yuque.com/chaofun/qixun/app_changelog')
          }
        >
          更新日志
        </div>
      </div>
      <div className={styles.down_btn}>
        {iOSVersion && (device === 'ios' || device === 'pc') && (
          <div
            onClick={() => {
              location.href = `https://apps.apple.com/cn/app/%E5%9B%BE%E5%AF%BB/id6467752803`;
              return;
            }}
            className={styles.btn_green}
          >
            iOS 下载/更新
          </div>
        )}
        {androidVersion && (device === 'android' || device === 'pc') && (
          <div
            onClick={() => {
              window.open(
                `https://chaofun.oss-cn-hangzhou.aliyuncs.com/qixun_app/qixun-${androidVersion}.apk`,
                '_blank',
              );
              return;
            }}
            className={styles.btn_green}
          >
            Android 下载/更新
          </div>
        )}
      </div>

      <div className={styles.home_btn}>
        <div
          onClick={() => (location.href = 'https://saiyuan.top')}
          className={styles.btn_green}
        >
          访问棋寻
        </div>
      </div>
    </div>
  );
};

export default App;
