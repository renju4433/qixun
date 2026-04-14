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

  const navigator = useNavigate();

  useDevTools();

  const { type = 'china' } = useParams<{ type: DailyChallengeType }>();
  const [challengers, setChallengers] = useState<number>(0);
  const [myChallengeRank, setMyChallengeRank] =
    useState<API.MyDailyChallengeRank | null>(null);
  const [myRank, setMyRank] = useState<{
    china: number | null;
    world: number | null;
  } | null>(null);

  useEffect(init, []);
  const [drawResult, setDrawResult] = useState<API.DrawDailyChallenge>({
    status: 'not_finish',
  });

  // 更改类型
  const handleChangeType = (type: DailyChallengeType) => {
    history.replace(`/daily-challenge/${type}`);
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
              每日0点更新，所有人统一。两个模式各5个题目，前两题为移动，后三题为固定，每题5000分，满分25000分。完成两项可以在本页抽取棋寻会员。
              <b>
                作弊（开小号、网络搜索、获取他人答案）会清空成绩并短期封禁。
              </b>
            </p>
            <Divider />

            {/*消息*/}
            {drawResult &&
              drawResult.status !== 'not_finish' &&
              new Date().getTime() >= 1738080000000 &&
              new Date().getTime() <= 1738166400000 && (
                <div className={styles.newYear}>
                  <div className={styles.first}>辰龙辞 极浦拂尘呈玉宇</div>
                  <div className={styles.first}>螣蛇起 蛟河赴海献金平</div>
                  <div
                    className={styles.third}
                    style={{
                      marginBottom: 8,
                    }}
                  >
                    祝各位玩家2025年春节快乐，新年大吉！
                  </div>
                  {/*<div style={{ height: '16px' }}></div>*/}
                  {/*<Button*/}
                  {/*  onClick={() => {*/}
                  {/*    navigator('/2024');*/}
                  {/*  }}*/}
                  {/*  shape="round"*/}
                  {/*  size="large"*/}
                  {/*>*/}
                  {/*  棋寻2024年度报告*/}
                  {/*</Button>*/}
                  {/* <div className={styles.third}>
                    中国供题(部分): @728, 全球供题: @Det.RZ
                  </div> */}
                  <Divider />
                </div>
              )}

            {/*抽奖*/}
            {drawResult && drawResult.status !== 'not_finish' && (
              <div className={styles.drawContainer}>
                <div className={styles.title}>完成两项后抽棋寻会员</div>
                <div className={styles.desc}>有机会中7日会员</div>
                {!drawResult.drawResult && (
                  <Button
                    size="large"
                    type="dashed"
                    onClick={draw}
                    className={styles.button}
                  >
                    抽
                  </Button>
                )}
                {drawResult.drawResult &&
                  drawResult.drawResult.result === '7_days' && (
                    <div className={styles.ok} style={{ color: 'green' }}>
                      你抽中了7天会员
                    </div>
                  )}
                {drawResult.drawResult &&
                  !drawResult.drawResult.result &&
                  isAprilFoolMemberDay() && (
                    <div
                      className={styles.ok}
                      style={{ color: 'green', cursor: 'pointer' }}
                      onClick={() =>
                        Modal.info({
                          title: '愚人节快乐',
                          content: '其实并没有中奖哦～',
                          okText: '知道了',
                        })
                      }
                    >
                      你抽中了7天会员
                    </div>
                  )}
                {drawResult.drawResult &&
                  !drawResult.drawResult.result &&
                  !isAprilFoolMemberDay() && (
                    <div className={styles.not_ok}>今天没中，明天再来吧</div>
                  )}
                <Divider />
              </div>
            )}

            <div className={styles.dailyChallengeType}>
              <Badge.Ribbon
                text={myRank?.china ? `No.${myRank?.china}` : null}
                color="#00000000"
                style={{
                  display: myRank?.china ? 'block' : 'none',
                  overflow: myRank?.china ? 'visible' : 'hidden',
                  backgroundColor: '#00000000',
                  textShadow: '#fa8c16 1px 1px 5px',
                }}
              >
                <a
                  className={`${styles.dailyChallengeTypeContainer} ${
                    type === 'china' ? styles.active : ''
                  }`}
                  onClick={() => handleChangeType('china')}
                >
                  <div className={styles.typeImage}>
                    <img src={`${CFBizUri}/front/china-white.png`} alt="中国" />
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
                  textShadow: '#fa8c16 1px 1px 5px',
                }}
              >
                <a
                  className={`${styles.dailyChallengeTypeContainer} ${
                    type === 'world' ? styles.active : ''
                  }`}
                  onClick={() => handleChangeType('world')}
                >
                  <div className={styles.typeImage}>
                    <img src={`${CFBizUri}/front/world-white.png`} alt="全球" />
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
              名玩家完成{type === 'world' ? '全球' : '中国'}挑战
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
