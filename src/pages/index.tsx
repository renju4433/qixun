import Header from '@/components/Header';
import sync from '@/components/Admin/Mgr';
import WarningChecker from '@/components/TimeChekcer';
import { useDevTools } from '@/hooks/use-dev-tools';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './style.less';

export default function HomePage() {
  useDevTools();
  useEffect(sync, []);
  const navigator = useNavigate();

  return (
    <>
      <div className={styles.home} />
      <div className={styles.homePage}>
        <div style={{ marginTop: 10 }}>
          <Header showSlogan={true} />
        </div>
        <WarningChecker />
        <div className={styles.container}>
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
          </div>
          <div className={styles.footer}>
          </div>
        </div>
      </div>
    </>
  );
}
