import HealthBar from '@/components/Game/HealthBar';
import UidVersionBar from '@/components/Game/UidVersionBar';
import TeamRank from '@/components/Map/ChallengeResult/TeamRank';
import { CFBizUri } from '@/constants';
import { qixunGoback, qixunGoHome } from '@/utils/HisotryUtils';
import { history, useModel } from '@umijs/max';
import { Badge, Button, Space } from 'antd';
import BigNumber from 'bignumber.js';
import confetti from 'canvas-confetti';
import { FC, useEffect, useMemo } from 'react';
import styles from './style.less';

type ChallengeGameEndProps = {
  model: 'Challenge.model';
};

const ChallengeGameEnd: FC<ChallengeGameEndProps> = ({ model }) => {
  const { user, isInApp } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
    isInApp: model.initialState?.isInApp,
  }));

  const { gameId, teams, type, playerIds, saveTeamCount, gameData } = useModel(
    model,
    (model) => ({
      gameId: model.gameId,
      gameData: model.gameData,
      teams: model.gameData?.teams,
      type: model.gameData?.type,
      playerIds: model.gameData?.playerIds,
      saveTeamCount: model.gameData?.saveTeamCount,
    }),
  );
  const is2Teams = useMemo(
    () => type && ['solo', 'solo_match', 'team', 'team_match'].includes(type),
    [type],
  );

  const gameResult: GameResult = useMemo(() => {
    // 比赛结束，显示结果
    const toSetGameResult: GameResult = {};
    // 非淘汰赛
    if (type !== 'battle_royale') {
      // 生命值大于0，获胜
      toSetGameResult.winTeam = teams?.find((team) => !!team.health);
      // 设置获胜队伍
      toSetGameResult.winner = toSetGameResult.winTeam?.users[0];
      // 查找你的队伍
      toSetGameResult.yourTeam = teams?.find((team) =>
        team?.users.find((teamUser) => teamUser.userId === user?.userId),
      );

      // 根据你的队伍生命值, 设置是否获胜
      toSetGameResult.isWin = !!toSetGameResult.yourTeam?.health;

      // 淘汰赛
      if (user?.userId && !playerIds?.includes(user?.userId)) {
        // 设置你的队伍
        toSetGameResult.isWin = true;
      }

      // 围观设置胜利队伍
      if (!toSetGameResult.yourTeam) {
        toSetGameResult.yourTeam = undefined;
        toSetGameResult.isWin = true;
      }
    } else {
      // 淘汰赛
      // 设置获胜队伍
      toSetGameResult.winTeam = teams?.find((team) => !!team.health);
      // 设置获胜者
      toSetGameResult.winner = toSetGameResult.winTeam?.users[0];
      // 设置是否获胜
      toSetGameResult.isWin = true;
      // 设置你的队伍
      toSetGameResult.yourTeam = toSetGameResult.winTeam;
    }

    return toSetGameResult;
  }, [teams, type, playerIds]);

  useEffect(() => {
    if (gameResult?.isWin) {
      const shoot = () => {
        confetti({
          spread: 400,
          ticks: 50,
          gravity: 0,
          decay: 0.94,
          startVelocity: 30,
          colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
          particleCount: 50,
          scalar: 1.2,
          shapes: ['star'],
        });
        confetti({
          spread: 400,
          ticks: 50,
          gravity: 0,
          decay: 0.84,
          startVelocity: 30,
          colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
          particleCount: 10,
          scalar: 0.75,
          shapes: ['star'],
        });
      };

      setTimeout(shoot, 100);
      setTimeout(shoot, 200);
      setTimeout(shoot, 500);
      setTimeout(shoot, 600);
      setTimeout(shoot, 900);
      setTimeout(shoot, 1000);
    }
  }, [gameResult?.isWin]);

  return (
    <>
      <div className={styles.challengeGameEndWrap}>
        {is2Teams && (
          <div className={styles.avatarHealth}>
            <HealthBar team={0} />
            <HealthBar team={1} />
          </div>
        )}
        <div className={styles.challengeGameEndInner}>
          {/* TODO: 显示胜利者头像 */}
          {type !== 'battle_royale' && type !== 'rank' && (
            <>
              {gameResult?.isWin ? (
                <div>
                  <div className={styles.challengeGameEndTitle}>胜利!</div>
                </div>
              ) : (
                <div>
                  <div
                    className={`${styles.challengeGameEndTitle} ${styles.challengeGameEndTitleError}`}
                  >
                    失败！
                  </div>
                </div>
              )}
              {gameData?.type === 'solo_match' && gameResult.yourTeam && (
                <>
                  <div>
                    积分变化：
                    {gameResult.yourTeam?.ratingChange &&
                    gameResult.yourTeam?.ratingChange > 0
                      ? '+'
                      : ''}
                    {gameResult.yourTeam?.ratingChange ?? '-'}
                  </div>
                  <div>
                    最新{gameData?.china ? '中国' : '全球'}积分：
                    {gameResult.yourTeam?.finalRating ?? '-'}
                  </div>
                  <Button
                    style={{ marginTop: '1rem' }}
                    onClick={() => {
                      history.push(
                        `/user/${
                          teams?.find((team) => team !== gameResult.yourTeam)
                            ?.users[0].userId
                        }`,
                      );
                    }}
                  >
                    对手主页
                  </Button>
                </>
              )}
            </>
          )}
          {type === 'battle_royale' &&
            (saveTeamCount === 0 ? (
              <div
                className={`${styles.challengeGameEndTitle} ${styles.challengeGameEndTitleError}`}
              >
                无人存活
              </div>
            ) : (
              <>
                <div className={styles.challengeGameEndTitle}>最终存活</div>

                <div
                  className={styles.winnerPlayer}
                  onClick={() =>
                    (location.href = `https://saiyuan.top/user/${gameResult?.winner?.userId}`)
                  }
                >
                  <Badge
                    count={new BigNumber(
                      gameResult?.winner?.rating ?? 0,
                    ).toFormat(0)}
                    overflowCount={10000000}
                    offset={[-40, 68]}
                    classNames={{ indicator: styles.hostBadge }}
                  >
                    <div className={styles.avatarContainer}>
                      <div
                        className={styles.avatarCover}
                        style={{
                          backgroundImage: `url(${CFBizUri}${gameResult?.winner?.icon}?x-oss-process=image/resize,h_80/quality,q_75)`,
                        }}
                      />
                    </div>
                  </Badge>

                  <div className={styles.userName}>
                    {gameResult?.winner?.userName}
                  </div>
                </div>
              </>
            ))}

          {type === 'rank' && (
            <div
              style={{ width: '90%', maxWidth: '640px' }}
              className={styles.teamRank}
            >
              <div style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                最终排行
              </div>
              <TeamRank model="Challenge.model" currentUserId={user?.userId} />
            </div>
          )}
          <div className={styles.challengeGameEndBottom}>
            <Space wrap align="center">
              {gameData?.type === 'team_match' && (
                <Button
                  shape="round"
                  size="large"
                  onClick={() => qixunGoback('/match?tab=team')}
                >
                  返回
                </Button>
              )}

              {gameData?.type === 'solo_match' && (
                <Button
                  shape="round"
                  size="large"
                  onClick={() => {
                    if (gameData.china) qixunGoback('/match?tab=china');
                    else qixunGoback('/match?tab=world');
                  }}
                >
                  返回
                </Button>
              )}
              {(gameData?.type === 'solo_match' ||
                gameData?.type === 'team_match') && (
                <Button
                  shape="round"
                  size="large"
                  onClick={() => {
                    qixunGoHome();
                  }}
                >
                  首页
                </Button>
              )}
              {gameData?.partyId && (
                <Button
                  shape="round"
                  size="large"
                  type="primary"
                  onClick={() => qixunGoback('/party')}
                >
                  返回
                </Button>
              )}

              <Button
                shape="round"
                size="large"
                type="primary"
                ghost
                onClick={() => history.push(`/replay?gameId=${gameId}`)}
              >
                复盘
              </Button>

              {gameData?.type === 'solo_match' && (
                <Button
                  shape="round"
                  size="large"
                  type="primary"
                  onClick={() => {
                    let tab = gameData.china ? 'china' : 'world';
                    let path = `/match?tab=${tab}`;

                    if (gameData.move) path = path + '&from=move';
                    else {
                      if (gameData.pan) path = path + '&from=noMove';
                      else path = path + '&from=npmz';
                    }
                    history.push(path);
                  }}
                >
                  继续
                </Button>
              )}
            </Space>
          </div>
        </div>
        <UidVersionBar mapsName={gameData?.mapsName} />
      </div>
    </>
  );
};

export default ChallengeGameEnd;
