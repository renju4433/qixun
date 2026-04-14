import MapCard from '@/components/Maps/MapCard';
import PointHint from '@/components/Point/PointHint';
import UserAchievementList from '@/components/User/AchievementList';
import qixunAvatar from '@/components/User/qixunAvatar';
import VipModal from '@/components/Vip';
import SendMessageModal from '@/pages/Friend/SendMessageModal';
import NormalPage from '@/pages/NormalPage';
import ChallengeList from '@/pages/User/Profile/ChallengeList';
import InteractList from '@/pages/User/Profile/InteractList';
import { RatingInfo, VIPLabel } from '@/pages/User/Profile/model';
import UserReportModal from '@/pages/User/UserReportModal';
import {
  addFriend,
  checkBan,
  checkFrind,
  checkqixunRole,
  checkUserVip,
  checkVipState,
  deleteFriend,
  getPointProfile,
  getqixunUserProfile,
  getUserDailyActivity,
  getUserMaps,
  listUserAchievement,
  logout,
} from '@/services/api';
import { useModel } from '@@/exports';
import { setUser } from '@sentry/react';
import { history, useParams } from '@umijs/max';
import { Button, Flex, Modal, Popconfirm, Segmented, message } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { flushSync } from 'react-dom';
import styles from './style.less';

const Profile = () => {
  const { id } = useParams();
  const userId = Number(id!);

  const { isInApp, /*isIniOS,*/ me, setInitialState } = useModel(
    '@@initialState',
    (model) => ({
      isInApp: model.initialState?.isInApp,
      isIniOS: model.initialState?.isIniOS,
      me: model.initialState?.user,
      setInitialState: model.setInitialState,
    }),
  );

  const [userProfile, setqixunUserProfile] = useState<API.UserProfile>();
  const [tab, setTab] = useState<string>('main');
  const [vip, setVip] = useState<boolean>(false);
  const [vipExpire, setVipExpire] = useState<number>();
  const [ban, setBan] = useState<boolean>(false);
  const [friend, setFriend] = useState<boolean>(false);
  const [mapsCount, setMapsCount] = useState<number>();
  const [maps, setMaps] = useState<API.MapItem[]>([]);
  const [pointProfile, setPointProfile] = useState<API.PointProfile>();
  const [activity, setActivity] = useState<API.UserActivity[]>([]);
  const [maxCount, setMaxCount] = useState<number>(0);
  const [achievements, setAchievements] = useState<API.UserAchievement[]>([]);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showSend, setShowSend] = useState<boolean>(false);
  const [showVip, setShowVip] = useState<boolean>(false);
  const [showVolunteer, setShowVolunteer] = useState<boolean>(false);
  const [isqixunAdmin, setIsqixunAdmin] = useState<boolean>(false);

  async function _logout() {
    await logout();
    // 清空用户缓存信息
    flushSync(() => {
      setInitialState((s) => ({ ...s, user: undefined }));
      // 设置Sentry用户信息，忽略错误
      try {
        setUser(null);
      } catch (error) { }
    });
    location.href = 'https://saiyuan.top';
  }

  const checkIsFriend = () => {
    checkFrind({ friend: userId }).then((res) => setFriend(res.data));
  };

  useEffect(() => {
    setTab('main');
    // 重置状态
    setVip(false);
    setVipExpire(undefined);
    // 先加载基本信息
    getqixunUserProfile({ userId }).then((res) => {
      setqixunUserProfile(res.data);
      if (res.data) {
        document.title = res.data.userName + ' - 用户 - 棋寻';
      }
      if (me?.userId === userId) {
        checkVipState().then((res) => {
          if (res.data) {
            setVip(true);
            setVipExpire(res.data);
          }
        });
      } else checkUserVip({ userId }).then((res) => setVip(res.data ?? false));
    });
    checkIsFriend();
    checkBan({ userId }).then((res) => setBan(res.data));
    // 积分
    getPointProfile({ userId }).then((res) => {
      if (res.success) setPointProfile(res.data);
    });
    getUserDailyActivity({ userId }).then((res) => {
      if (res.success && res.data) {
        setActivity(res.data);
        setMaxCount(
          res.data && res.data.length > 0
            ? res.data.reduce((pre, cur) => {
              if (pre.count > cur.count) {
                return pre;
              } else return cur;
            }).count
            : 0,
        );
      }
    });
    // 题库
    getUserMaps({ userId }).then((res) => {
      if (res.success) {
        setMaps(res.data);
        setMapsCount(res.data.length);
      }
    });
    // 成就
    listUserAchievement({ userId }).then((res) => setAchievements(res.data));
    // 检查是否是 qixun 管理员/志愿者
    if (me?.userId === userId) {
      checkqixunRole().then((res) => {
        if (res.success && res.data && (res.data.isAdmin || res.data.isVolunteer)) {
          setIsqixunAdmin(true);
        }
      });
    }
  }, [userId, me]);

  const countAchievements = (items: API.UserAchievement[]) => {
    const uniqueSeriesIds = new Set<string>();
    let independentCount = 0;
    for (const item of items) {
      if (!item.achievement.seriesId) independentCount++;
      else uniqueSeriesIds.add(item.achievement.seriesId);
    }
    return independentCount + uniqueSeriesIds.size;
  };

  return (
    <NormalPage>
      <Flex className={styles.wrapper} gap="small" vertical>
        {me?.userId === userId && (
          <Flex gap={10} className={styles.header} wrap="wrap">
            {!isInApp && (
              <Button type="link" onClick={_logout}>
                退出登录
              </Button>
            )}
            <Button type="link" onClick={() => history.push('/user/settings')}>
              个人设置
            </Button>
            <Button
              type="link"
              onClick={() => history.push(`/activities?userId=${userId}`)}
            >
              比赛历史
            </Button>
            <Button type="link" onClick={() => history.push(`/user/analysis`)}>
              技术分析
            </Button>
            <Button type="link" onClick={() => history.push(`/mall`)}>
              商店
            </Button>
            <Button type="link" onClick={() => history.push(`/user/bag`)}>
              背包
            </Button>
            {isqixunAdmin && (
              <Button type="link" onClick={() => history.push(`/qixunAdmin`)}>
                管理后台
              </Button>
            )}
          </Flex>
        )}

        {userProfile && (
          <Flex gap="middle">
            <qixunAvatar user={userProfile} size={100} />
            <Flex align="flex-start" gap={5} vertical>
              <div style={{ fontSize: 20 }}>{userProfile.userName}</div>
              <div>
                uid: {id}
                {userProfile.desc && <div>签名：{userProfile.desc}</div>}
                {userProfile.province && (
                  <div>地域：中国{userProfile.province}</div>
                )}
              </div>
              {vip ? (
                <Flex vertical>
                  <VIPLabel
                    fontSize="20px"
                    color="#ff8d1a"
                    onLabelClick={() => setShowVip(true)}
                  >
                    {' '}
                    {vipExpire && (
                      <Button onClick={() => setShowVip(true)}>续费</Button>
                    )}
                  </VIPLabel>
                  {vipExpire && (
                    <div
                      style={{ color: 'gray', fontSize: 12, marginTop: '3px' }}
                    >
                      到期时间：{moment(vipExpire).format('YYYY年MM月DD日')}
                    </div>
                  )}
                </Flex>
              ) : me && me.userId === userId ? (
                <Button onClick={() => setShowVip(true)}>开通会员</Button>
              ) : null}
              {ban && (
                <div
                  style={{
                    color:
                      new Date().getTime() >= 1743436800000 &&
                        new Date().getTime() <= 1743523200000
                        ? 'rgb(255, 141, 26)'
                        : 'red',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    window.open(
                      'https://www.yuque.com/chaofun/qixun/rules',
                    );
                  }}
                >
                  {new Date().getTime() >= 1743436800000 &&
                    new Date().getTime() <= 1743523200000
                    ? '棋寻会员'
                    : '封禁中'}
                </div>
              )}
            </Flex>
          </Flex>
        )}

        {(!me || me.userId !== userId) && (
          <Flex wrap="wrap" gap="small">
            {friend ? (
              <>
                <Popconfirm
                  title="确定删除好友吗？"
                  description="删除后，你将无法再收到该好友的消息。"
                  onConfirm={() => {
                    deleteFriend({ friend: userId }).then((res) => {
                      if (res.success) {
                        message.info('移除成功～');
                        checkIsFriend();
                      }
                    });
                  }}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button>删除好友</Button>
                </Popconfirm>
                <Button onClick={() => setShowSend(true)}>发送消息</Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  addFriend({ friend: userId }).then((res) => {
                    if (res.success) message.info('申请成功，等待对方同意');
                    else message.error('申请失败，请稍后再试');
                  });
                }}
              >
                请求好友
              </Button>
            )}
            <Button onClick={() => setShowReport(true)}>举报用户</Button>
            <Button
              type="link"
              onClick={() => history.push(`/activities?userId=${userId}`)}
            >
              比赛历史
            </Button>
          </Flex>
        )}

        <Segmented
          options={[
            { label: '基础信息', value: 'main' },
            { label: `题库(${mapsCount ?? 0})`, value: 'maps' },
            {
              label: `成就(${countAchievements(achievements) ?? 0})`,
              value: 'achieve',
            },
            { label: '互动', value: 'interact' },
            { label: '迷踪', value: 'challenge' },
          ]}
          value={tab}
          onChange={(value) => setTab(value)}
          style={{ width: 'fit-content' }}
        />

        {tab === 'main' && (
          <Flex gap="small" vertical className={styles.main}>
            <PointHint />
            {me?.userId === userId &&
              pointProfile &&
              ((pointProfile.chinaRank &&
                !!pointProfile.chinaRank.soloTimes &&
                !!pointProfile.chinaRank.soloWin &&
                pointProfile.chinaRank.rating &&
                pointProfile.chinaRank.rating >= 2000 &&
                pointProfile.chinaRank.soloWin /
                pointProfile.chinaRank.soloTimes >=
                0.7) ||
                (pointProfile.worldRank &&
                  pointProfile.worldRank.rating &&
                  pointProfile.worldRank.rating >= 2000 &&
                  pointProfile.worldRank.soloWin /
                  pointProfile.worldRank.soloTimes >=
                  0.7)) && (
                <Button
                  style={{
                    margin: '0 auto',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    color: 'gold',
                  }}
                  onClick={() => {
                    setShowVolunteer(true);
                  }}
                >
                  你已满足志愿者条件，点击申请
                </Button>
              )}

            {pointProfile && pointProfile.worldRank && (
              <RatingInfo rank="全球" typeRank={pointProfile.worldRank} />
            )}
            {pointProfile && pointProfile.chinaRank && (
              <RatingInfo rank="中国" typeRank={pointProfile.chinaRank} />
            )}
            <div className={styles.title}>活跃度</div>
            <CalendarHeatmap
              monthLabels={[
                '一月',
                '二月',
                '三月',
                '四月',
                '五月',
                '六月',
                '七月',
                '八月',
                '九月',
                '十月',
                '十一月',
                '十二月',
              ]}
              startDate={
                new Date(new Date().setFullYear(new Date().getFullYear() - 1))
              }
              classForValue={(value) => {
                if (!value) return `color-github-0`;
                const ratio = value.count / maxCount;
                switch (true) {
                  case ratio < 0.25:
                    return `color-github-1`;
                  case ratio < 0.5:
                    return `color-github-2`;
                  case ratio < 0.75:
                    return `color-github-3`;
                  default:
                    return `color-github-4`;
                }
              }}
              endDate={new Date()}
              values={activity}
              showWeekdayLabels
              weekdayLabels={[
                '周日',
                '周一',
                '周二',
                '周三',
                '周四',
                '周五',
                '周六',
              ]}
            />
          </Flex>
        )}

        {tab === 'maps' && (
          <div className={styles.grid}>
            {maps?.map((map) => (
              <MapCard key={map.id} map={map} />
            ))}
          </div>
          //   <Flex gap="middle" wrap="wrap">
          //   {maps?.map((map) => (
          //     <MapCard key={map.id} map={map} />
          //   ))}
          // </Flex>
        )}

        {tab === 'achieve' && (
          <>
            <div>注: 系列成就合并展示</div>
            <UserAchievementList
              user={userProfile}
              me={me}
              achievements={achievements}
            />
          </>
        )}

        {tab === 'interact' && <InteractList userId={userId} />}
        {tab === 'challenge' && <ChallengeList userId={userId} />}
      </Flex>

      <UserReportModal
        userId={userId}
        open={showReport}
        source="profile"
        onClose={() => setShowReport(false)}
      />
      <VipModal open={showVip} hide={() => setShowVip(false)} />
      <SendMessageModal
        open={showSend}
        friend={userProfile!}
        onClose={() => setShowSend(false)}
      />
      <Modal
        open={showVolunteer}
        onCancel={() => setShowVolunteer(false)}
        okButtonProps={{ style: { display: 'none' } }}
      >
        <div>志愿者申请</div>
        <div>
          <div style={{ marginBottom: '1rem' }}>
            1.中国匹配题库志愿者，要求：中国积分2000分以上，70%+胜率，（有奖励）
          </div>
          <div style={{ marginBottom: '1rem' }}>
            2. 鉴搜志愿者，要求：中国或全国积分2000分以上，70%+胜率，主要工作为：查看举报
            提供证据协助封禁。（有奖励）
          </div>
          <div style={{ marginBottom: '1rem' }}>
            3. 中国/全球日挑出题志愿者，要求：中国/全球积分2000分以上，70%+胜率，申请 QQ: 2759464549（有奖励）
          </div>
          <div style={{ marginBottom: '1rem' }}>
            要求账号无违规记录, 申请后管理员会综合评判看过不过。
          </div>
          <div>感兴趣可以联系QQ: 344580894</div>
        </div>
      </Modal>
    </NormalPage>
  );
};

export default Profile;
