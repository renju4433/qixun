import Header from '@/components/Header';
import {
  checkBan,
  getPointProfile,
  getqixunUserProfile,
} from '@/services/api';
import { useModel } from '@@/exports';
import { Alert, Card, Col, Row, Spin, Statistic, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './style.less';

const renderValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '-';
  }
  return value;
};

const ProfilePage = () => {
  const { id } = useParams();
  const userId = Number(id);
  const { currentUser } = useModel('@@initialState', (model) => ({
    currentUser: model.initialState?.user,
  }));

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<API.UserProfile>();
  const [pointProfile, setPointProfile] = useState<API.PointProfile>();
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, pointRes, banRes] = await Promise.all([
          getqixunUserProfile({ userId }, { skipErrorHandler: true }),
          getPointProfile({ userId }, { skipErrorHandler: true }),
          checkBan({ userId }, { skipErrorHandler: true }),
        ]);

        if (!mounted) {
          return;
        }

        if (profileRes.success && profileRes.data) {
          setUserProfile(profileRes.data);
          document.title = `${profileRes.data.userName} - 个人主页 - 棋寻`;
        }
        if (pointRes.success && pointRes.data) {
          setPointProfile(pointRes.data);
        }
        if (banRes.success) {
          setIsBanned(Boolean(banRes.data));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const renderScoreRate = (rank?: API.TypeRank) => {
    const total = rank?.soloTimes || 0;
    const win = rank?.soloWin || 0;
    const lose = rank?.soloLose || 0;
    const draw = Math.max(0, total - win - lose);
    if (!total) {
      return '-';
    }
    return `${(((win + draw * 0.5) / total) * 100).toFixed(2)}%`;
  };

  const renderDrawCount = (rank?: API.TypeRank) => {
    const total = rank?.soloTimes || 0;
    const win = rank?.soloWin || 0;
    const lose = rank?.soloLose || 0;
    return Math.max(0, total - win - lose);
  };

  return (
    <div className={styles.page}>
      <div style={{ marginTop: 10 }}>
        <Header canBack={true} />
      </div>

      <div className={styles.container}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : !userProfile ? (
          <Card className={styles.panel}>
            <Alert type="warning" showIcon message="没有找到这个用户" />
          </Card>
        ) : (
          <>
            <Card className={styles.panel}>
              <div className={styles.hero}>
                <div className={styles.heroInfo}>
                  <div className={styles.nameRow}>
                    <h1>{userProfile.userName}</h1>
                    {currentUser?.userId === userProfile.userId && <Tag color="blue">我</Tag>}
                    {isBanned && <Tag color="red">封禁中</Tag>}
                  </div>
                  <div className={styles.uid}>UID: {userProfile.userId}</div>
                </div>
              </div>
            </Card>

            {pointProfile && (
              <Row gutter={[16, 16]} className={styles.section}>
                <Col xs={24}>
                  <Card className={styles.panel} title="对局数据">
                    <div className={styles.rankGrid}>
                      <Statistic title="积分" value={renderValue(pointProfile.worldRank?.rating)} />
                      <Statistic
                        title="得分率"
                        value={renderScoreRate(pointProfile.worldRank)}
                      />
                      <Statistic
                        title="对局数"
                        value={renderValue(pointProfile.worldRank?.soloTimes)}
                      />
                      <Statistic title="胜" value={renderValue(pointProfile.worldRank?.soloWin)} />
                      <Statistic title="平" value={renderDrawCount(pointProfile.worldRank)} />
                      <Statistic title="负" value={renderValue(pointProfile.worldRank?.soloLose)} />
                    </div>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
