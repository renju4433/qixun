import Header from '@/components/Header';
import sync from '@/components/Admin/Mgr';
import WarningChecker from '@/components/TimeChekcer';
import { useDevTools } from '@/hooks/use-dev-tools';
import { listActivities } from '@/services/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './style.less';

export default function HomePage() {
  const [normalActivities, setNormalActivities] = useState<API.Activity[]>([]);
  const [specialActivities, setSpecialActivities] = useState<API.Activity[]>(
    [],
  );
  useDevTools();
  useEffect(sync, []);
  const navigator = useNavigate();

  useEffect(() => {
    listActivities().then((res) => {
      if (res.data) {
        setNormalActivities(res.data.normalActivities);
        setSpecialActivities(res.data.specialActivities);
      }
    });
  }, []);

  return (
    <>
      <div className={styles.home} />
      <div className={styles.homePage}>
        <div style={{ marginTop: 10 }}>
          <Header showSlogan={true} />
        </div>
        <WarningChecker />
        <div className={styles.container}>
          {normalActivities.length > 0 && (
            <div className={styles.activities}>
              {normalActivities.map((activity) => (
                <div
                  key={activity.title}
                  className={styles.activity}
                  onClick={() => window.open(activity.link)}
                >
                  {activity.title}
                </div>
              ))}
            </div>
          )}
          {specialActivities.length > 0 &&
            specialActivities.map((activity) => (
              <div
                key={activity.title}
                style={{
                  textAlign: 'center',
                  color: '#fa8c16',
                  textDecoration: 'underline',
                  marginBottom: '20px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => window.open(activity.link)}
              >
                <div
                  style={{
                    backgroundColor: '#000000AA',
                    padding: '5px 10px',
                    borderRadius: '7px',
                  }}
                >
                  {activity.title}
                </div>
              </div>
            ))}
          <div className={styles.first}>
            <div
              className={styles.card}
              onClick={() => navigator('/daily-challenge')}
            >
              <div>每日挑战</div>
            </div>
            <div
              className={styles.card}
              onClick={() =>
                navigator('/match')
              }
            >
              &nbsp;&nbsp;&nbsp;匹配&nbsp;&nbsp;&nbsp;
            </div>
            <div className={styles.card} onClick={() => navigator('/party')}>
              &nbsp;&nbsp;&nbsp;派对&nbsp;&nbsp;&nbsp;
            </div>
            <div className={styles.card} onClick={() => navigator('/maps')}>
              &nbsp;&nbsp;&nbsp;题库&nbsp;&nbsp;&nbsp;
            </div>
            <div className={styles.card} onClick={() => navigator('/interact')}>
              &nbsp;&nbsp;&nbsp;互动&nbsp;&nbsp;&nbsp;
            </div>
          </div>
          <div className={styles.seperate}></div>
          <div className={styles.second}>
            <div className={styles.header}>娱乐</div>
            <div className={styles.body}>
              <div className={styles.card} onClick={() => navigator('/streak')}>
                连胜
              </div>
              <div
                className={styles.card}
                onClick={() => navigator('/interact/challenge')}
              >
                网络迷踪
              </div>
            </div>
          </div>
          <div className={styles.third}>
            <div className={styles.header}>其他</div>
            <div className={styles.body}>
              <div className={styles.card} onClick={() => navigator('/mall')}>
                商店
              </div>
              <div
                className={styles.card}
                onClick={() => navigator('/point-rank')}
              >
                积分排行
              </div>
              <div
                className={styles.card}
                onClick={() => navigator('/achievement')}
              >
                成就
              </div>
              <div className={styles.card} onClick={() => navigator('/event')}>
                寻景
              </div>
              <div
                className={styles.card}
                onClick={() => navigator('/explain')}
              >
                图解
              </div>
              <div className={styles.card} onClick={() => navigator('/app')}>
                App
              </div>
              <div
                className={styles.card}
                onClick={() =>
                  window.open('https://www.yuque.com/chaofun/qixun')
                }
              >
                棋寻文档
              </div>
              <div
                className={styles.card}
                onClick={() => window.open('https://xiaoce.fun')}
              >
                猜盐
              </div>
            </div>
          </div>
          <div className={styles.footer}>
            <p>
              交流QQ群：
              <a
                rel="noreferrer"
                target="_blank"
                href="http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=YRq8jU3MFd-ylHCFC0lcJX9npaG0FRmi&authKey=W3wNh8n8zybypY08JK4g4YCcA0o3GdiwKXFqYCff4Ejan%2BKymBCWUSwjplXsZJva&noverify=0&group_code=943507031"
              >
                943507031
              </a>
            </p>
            <p>微信公众号：棋寻</p>
            <p>
              开发者微博：
              <a
                rel="noreferrer"
                target="_blank"
                href="https://weibo.com/u/3050203537"
              >
                @此间 ZY
              </a>
            </p>
            <p>地图审图号：GS（2022）2885 号</p>
            <p>
              问题反馈：棋寻公众号，棋寻群，电话：15058139992 可能有会员奖励
            </p>
            <p>简历投递（成都/远程）：cijianzy@gmail.com</p>
            <p>
              <a
                rel="noreferrer"
                target="_blank"
                href="https://www.yuque.com/chaofun/qixun/changelog"
              >
                更新日志
              </a>
            </p>
            <p>
              <a
                rel="noreferrer"
                target="_blank"
                href="https://beian.miit.gov.cn/"
              >
                浙ICP备2022031450号
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
