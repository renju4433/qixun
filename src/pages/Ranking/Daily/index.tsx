import DailyChallengeRank from '@/components/Game/DailyChanllengerank/Rank';
import HeaderLogo from '@/components/Header/Logo';
import { CFBizUri } from '@/constants';
import {
  checkDrawDailyChalelnge,
  drawDailyChalelnge,
  getDailyChallengeId,
  getDailyChallengeTotal,
  getGameInfo,
  getMyDailyChallengeRank,
} from '@/services/api';
import { history } from '@@/core/history';
import { BiArrowFromBottom } from '@react-icons/all-files/bi/BiArrowFromBottom';
import { useModel, useParams, useRequest } from '@umijs/max';
import { Badge, Divider, FloatButton } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import WarningChecker from '@/components/TimeChekcer';
import { useDevTools } from '@/hooks/use-dev-tools';
import styles from './style.less';

const DailyChallenge = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  useDevTools();

  const { type = 'world' } = useParams<{ type: DailyChallengeType }>();
  const [challengers, setChallengers] = useState<number>(0);
  const [myChallengeRank, setMyChallengeRank] =
    useState<API.MyDailyChallengeRank | null>(null);
  const [myRank, setMyRank] = useState<{
    china: number | null;
    world: number | null;
  } | null>(null);

  const [drawResult, setDrawResult] = useState<API.DrawDailyChallenge>({
    status: 'not_finish',
  });

  // 更改类型
  const handleChangeType = (type: DailyChallengeType) => {
    history.replace(`/daily-challenge/${type}`);
  };

  // 每日挑战完成后抽奖
  const draw = () => {
    drawDailyChalelnge().then((res) => {
      setDrawResult(res.data);
    });
  };

  useEffect(() => {
    checkDrawDailyChalelnge().then((res) => {
      setDrawResult(res.data);
    });
  }, []);

  // 获取比赛信息
  const { data: gameData } = useRequest(() => getGameInfo({ day: 1, type }), {
    refreshDeps: [type],
    onSuccess: async (res) => {
      if (res) {
        const { data: myChallengeRankRes } = await getMyDailyChallengeRank({
          gameId: res.id,
          challengeId: res.challengeId,
        });
        setMyChallengeRank(myChallengeRankRes);

        // 获取另外一个类型的比赛信息
        const { data: otherGameData } = await getGameInfo({
          day: 1,
          type: type === 'china' ? 'world' : 'china',
        });
        if (otherGameData) {
          const { data: otherMyChallengeRankRes } =
            await getMyDailyChallengeRank({
              gameId: otherGameData.id,
              challengeId: otherGameData.challengeId,
            });
          setMyRank({
            china:
              type === 'china'
                ? myChallengeRankRes?.rank
                : otherMyChallengeRankRes?.rank,
            world:
              type === 'world'
                ? myChallengeRankRes?.rank
                : otherMyChallengeRankRes?.rank,
          });
        }
      }
    },
    onError: () => {},
  });

  // 获取挑战ID
  const { data: challengeId } = useRequest(
    () => getDailyChallengeId({ type }),
    {
      refreshDeps: [type],
      onSuccess: async (res) => {
        if (res) {
          const { data: number } = await getDailyChallengeTotal({
            challengeId: res,
          });
          setChallengers(number);
        }
      },
    },
  );
  // 判断是否手机
  // const isMobile = useIsMobile();
  // useEffect(() => {
  //   // 兼容手机版视频播放
  //   if (isMobile) {
  //     document.addEventListener(
  //       'touchstart',
  //       () => {
  //         const video = document.querySelector('video');
  //         if (video && video.currentTime === 0) {
  //           video.play();
  //         }
  //       },
  //       {
  //         once: true,
  //       },
  //     );
  //   }
  // }, []);
  // ====== 兼容手机视频播放问题 End ======

  return (
    <>
      <div className={styles.wrapper}>
        <HeaderLogo canBack className={styles.header} />
        <div className={styles.dailyChallengeContainer}>
          <main>
            <div className={styles.dailyChallengeTitle}>
              <Badge
                count={dayjs().format('MM/DD')}
                className={styles.challengeDate}
                offset={[32, 10]}
              >
                <h2>每日挑战</h2>
              </Badge>
              <WarningChecker />
              <p>
                每日0点更新，两个模式各5个所有人统一的题目，每个模式前两题为移动，后三题为固定，每题5000分，满分25000，作弊（开小号或者网络搜索）会清空成绩&短期封禁。
                完成后的解题思路学习和讨论可以加入{' '}
                <a href={`https://pd.qq.com/s/4ucup3tev`}>每日挑战</a>{' '}
                QQ子频道讨论，完成两项可以在本页抽取棋寻会员。
              </p>
              <Divider />

              <div className={styles.dailyChallengeType}>
                <Badge.Ribbon
                  text={myRank?.china ? `No.${myRank?.china}` : null}
                  color="#00000000"
                  style={{
                    display: myRank?.china ? 'block' : 'none',
                    overflow: myRank?.china ? 'visible' : 'hidden',
                    backgroundColor: '#00000000',
                  }}
                >
                  <a
                    className={`${styles.dailyChallengeTypeContainer} ${
                      type === 'china' ? styles.active : ''
                    }`}
                    onClick={() => handleChangeType('china')}
                  >
                    <div className={styles.typeImage}>
                      <img
                        src={`${CFBizUri}/front/china-white.png`}
                        alt="中国"
                      />
                    </div>
                    <div className={styles.typeDescription}>
                      <div className={styles.optionName}>中国</div>
                    </div>
                  </a>
                </Badge.Ribbon>

                <Badge.Ribbon
                  text={myRank?.world ? `No.${myRank.world}` : null}
                  color="#00000000"
                  style={{
                    display: myRank?.world ? 'block' : 'none',
                    overflow: myRank?.world ? 'visible' : 'hidden',
                  }}
                >
                  <a
                    className={`${styles.dailyChallengeTypeContainer} ${
                      type === 'world' ? styles.active : ''
                    }`}
                    onClick={() => handleChangeType('world')}
                  >
                    <div className={styles.typeImage}>
                      <img
                        src={`${CFBizUri}/front/world-white.png`}
                        alt="全球"
                      />
                    </div>
                    <div className={styles.typeDescription}>
                      <div className={styles.optionName}>全球</div>
                    </div>
                  </a>
                </Badge.Ribbon>
              </div>
              <p className={styles.challengers}>
                已有
                <span>{challengers ?? 0}</span>
                名用户完成{type === 'world' ? '全球' : '中国'}挑战
              </p>
              <DailyChallengeRank challengeId={challengeId} />
            </div>
          </main>
        </div>
        <FloatButton.BackTop type="primary" icon={<BiArrowFromBottom />} />
      </div>
    </>
  );
};

export default DailyChallenge;
