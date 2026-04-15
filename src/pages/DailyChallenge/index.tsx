import init from '@/components/Admin/Init';
import DailyChallengeInfo from '@/components/Game/DailyChanllenge/Info';
import DailyChallengeRank from '@/components/Game/DailyChanllenge/Rank';
import Header from '@/components/Header';
import { CFBizUri } from '@/constants';
import {
  checkDrawDailyChalelnge,
  drawDailyChalelnge,
  getDailyChallengeInfo,
  getDailyChallengeTotal,
  getGameInfo,
  getMyDailyChallengeRank,
  startGame,
} from '@/services/api';
import { history } from '@@/core/history';
import { BiArrowFromBottom } from '@react-icons/all-files/bi/BiArrowFromBottom';
import { useModel, useNavigate, useParams, useRequest } from '@umijs/max';
import { Badge, Button, Divider, FloatButton, message, Modal } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import WarningChecker from '@/components/TimeChekcer';
import { useDevTools } from '@/hooks/use-dev-tools';
import styles from './style.less';

/** 愚人节活动：仅 4/1，未真实中奖者显示中奖文案，点击见弹窗 */
const isAprilFoolMemberDay = () => {
  const now = dayjs();
  return now.month() === 3 && now.date() === 1;
};

const DailyChallenge = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const chessTypeMap = {
    gomoku: '五子棋',
    xiangqi: '中国象棋',
    chess: '国际象棋',
  };

  const navigator = useNavigate();

  useDevTools();

  const { type = 'gomoku' } = useParams<{ type: DailyChallengeType }>();
  const [challengers, setChallengers] = useState<number>(0);
  const [myChallengeRank, setMyChallengeRank] =
    useState<API.MyDailyChallengeRank | null>(null);
  const [myRank, setMyRank] = useState<{
    gomoku: number | null;
    xiangqi: number | null;
    chess: number | null;
  } | null>(null);

  useEffect(init, []);
  const [drawResult, setDrawResult] = useState<API.DrawDailyChallenge>({
    status: 'not_finish',
  });

  // 更改类型
  const handleChangeType = (newType: DailyChallengeType) => {
    history.replace(`/daily-challenge/${newType}`);
  };

  // 每日挑战完成后抽奖
  const draw = () => {
    drawDailyChalelnge().then((res) => setDrawResult(res.data));
  };

  useEffect(() => {
    checkDrawDailyChalelnge().then((res) => setDrawResult(res.data));
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

        // 获取其他两个类型的比赛信息
        const allTypes: DailyChallengeType[] = ['gomoku', 'xiangqi', 'chess'];
        const otherTypes = allTypes.filter(t => t !== type);
        const otherRanks: { [key: string]: number | null } = {};

        for (const otherType of otherTypes) {
          const { data: otherGameData } = await getGameInfo({
            day: 1,
            type: otherType,
          });
          if (otherGameData) {
            const { data: otherMyChallengeRankRes } =
              await getMyDailyChallengeRank({
                gameId: otherGameData.id,
                challengeId: otherGameData.challengeId,
              });
            otherRanks[otherType] = otherMyChallengeRankRes?.rank || null;
          }
        }

        setMyRank({
          gomoku: type === 'gomoku' ? myChallengeRankRes?.rank : otherRanks['gomoku'],
          xiangqi: type === 'xiangqi' ? myChallengeRankRes?.rank : otherRanks['xiangqi'],
          chess: type === 'chess' ? myChallengeRankRes?.rank : otherRanks['chess'],
        });
      }
    },
    onError: () => { },
  });

  // 获取挑战ID
  const { data } = useRequest(() => getDailyChallengeInfo({ type }), {
    refreshDeps: [type],
    onSuccess: async (res) => {
      if (res) {
        const { data: number } = await getDailyChallengeTotal({
          challengeId: res.challengeId,
        });
        setChallengers(number);
      }
    },
  });

  /**
   * 开始比赛
   * @returns
   */
  const handleStart = async () => {
    // 判断是否登录
    if (!user?.userId) {
      // 跳转登录
      history.push('/user/login?redirect=' + encodeURIComponent(location.href));
      return;
    }

    if (!gameData?.id) {
      message.error('无法获取挑战ID，请重试或联系客服');
      return;
    }

    const { data: gameInfo } = await startGame({ gameId: gameData.id });
    history.push(`/challenge/${gameInfo.challengeId}`);
  };

  /**
   * 继续比赛
   * @returns
   */
  const handleResume = async () => {
    if (!gameData?.challengeId) {
      message.error('无法获取挑战ID，请重试或联系客服');
      return;
    }

    history.push(`/challenge/${gameData.challengeId}`);
  };

  // ====== 兼容手机视频播放问题 Start ======
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
        <div className={styles.dailyChallengeContainer}>
          <Header canBack />
          <main className={styles.dailyChallengeTitle}>
            <Badge
              count={dayjs().format('MM/DD')}
              className={styles.challengeDate}
              offset={[32, 10]}
            >
              <h2>每日挑战</h2>
            </Badge>
            <WarningChecker />
            <p>
              每日0点更新，所有人统一。三个模式各5个题目，每题5000分，满分25000分。
              <b>
                作弊（开小号、使用棋软、获取他人答案）会清空成绩并短期封禁。
              </b>
            </p>
            <Divider />

            <div className={styles.dailyChallengeType}>
              <Badge.Ribbon
                text={myRank?.gomoku ? `No.${myRank?.gomoku}` : null}
                color="#00000000"
                style={{
                  display: myRank?.gomoku ? 'block' : 'none',
                  overflow: myRank?.gomoku ? 'visible' : 'hidden',
                  backgroundColor: '#00000000',
                  textShadow: '#fa8c16 1px 1px 5px',
                }}
              >
                <a
                  className={`${styles.dailyChallengeTypeContainer} ${type === 'gomoku' ? styles.active : ''
                    }`}
                  onClick={() => handleChangeType('gomoku')}
                >
                  <div className={styles.typeDescription}>
                    <div className={styles.optionName}>五子棋</div>
                  </div>
                </a>
              </Badge.Ribbon>

              <Badge.Ribbon
                text={myRank?.xiangqi ? `No.${myRank?.xiangqi}` : null}
                color="#00000000"
                style={{
                  display: myRank?.xiangqi ? 'block' : 'none',
                  overflow: myRank?.xiangqi ? 'visible' : 'hidden',
                  textShadow: '#fa8c16 1px 1px 5px',
                }}
              >
                <a
                  className={`${styles.dailyChallengeTypeContainer} ${type === 'xiangqi' ? styles.active : ''
                    }`}
                  onClick={() => handleChangeType('xiangqi')}
                >
                  <div className={styles.typeDescription}>
                    <div className={styles.optionName}>中国象棋</div>
                  </div>
                </a>
              </Badge.Ribbon>

              <Badge.Ribbon
                text={myRank?.chess ? `No.${myRank?.chess}` : null}
                color="#00000000"
                style={{
                  display: myRank?.chess ? 'block' : 'none',
                  overflow: myRank?.chess ? 'visible' : 'hidden',
                  textShadow: '#fa8c16 1px 1px 5px',
                }}
              >
                <a
                  className={`${styles.dailyChallengeTypeContainer} ${type === 'chess' ? styles.active : ''
                    }`}
                  onClick={() => handleChangeType('chess')}
                >
                  <div className={styles.typeDescription}>
                    <div className={styles.optionName}>国际象棋</div>
                  </div>
                </a>
              </Badge.Ribbon>
            </div>
            <p className={styles.challengers}>
              已有
              <span>{challengers ?? 0}</span>
              名玩家完成挑战
            </p>

            {!gameData || gameData.status === 'ready' ? (
              <Button
                type="primary"
                shape="round"
                size="large"
                onClick={handleStart}
              >
                开始今日挑战
              </Button>
            ) : gameData.status === 'ongoing' ? (
              <Button shape="round" size="large" onClick={handleResume}>
                继续今日挑战
              </Button>
            ) : (
              // 显示得分
              gameData.id &&
              myChallengeRank && (
                <DailyChallengeInfo
                  type={type}
                  data={myChallengeRank}
                  totalScore={gameData.player.totalScore}
                  results={gameData.player.roundResults}
                  gameId={gameData.id}
                  provider={data?.provider}
                />
              )
            )}

            <DailyChallengeRank challengeId={data?.challengeId} />
          </main>
        </div>
        <FloatButton.BackTop type="primary" icon={<BiArrowFromBottom />} />
      </div>
    </>
  );
};

export default DailyChallenge;
