import Header from '@/components/Header';
import { useNavigate } from 'react-router-dom';
import styles from './style.less';

export default function HomePage() {
  const navigator = useNavigate();

  return (
    <>
      <div className={styles.home} />
      <div className={styles.homePage}>
        <div style={{ marginTop: 10 }}>
          <Header showSlogan={true} />
        </div>
        <div className={styles.container}>
          <div className={styles.first}>
            <div className={styles.card} onClick={() => navigator('/match')}>
              <div>匹配</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
