import HealthBar from '@/components/Game/HealthBar';
import UidVersionBar from '@/components/Game/UidVersionBar';
import TeamRank from '@/components/Map/ChallengeResult/TeamRank';
import VipModal from '@/components/Vip';
import { CFBizUri, publicPath } from '@/constants';
import { gameAgain } from '@/services/api';
import { distanceDisplay } from '@/services/extend';
import { qixunGoback, qixunGoHome } from '@/utils/HisotryUtils';
import { FlagTwoTone } from '@ant-design/icons';
import { history, useModel, useSearchParams } from '@umijs/max';
import { useKeyPress } from 'ahooks';
import { Avatar, Badge, Button, Divider, Space } from 'antd';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Layer, Marker, Source, useMap } from 'react-map-gl/maplibre';
import MapContainer from '../MapContainer';
import DailyChallengeRank from './DailyChallengeRank';
import EliminatedUsers from './EliminatedUsers';
import styles from './style.less';

type ChallengeResultProps = {
  model: 'Challenge.model';
};

const ChallengeResult: FC<ChallengeResultProps> = ({ model }) => {
  const { map } = useMap();
  const [searchParams] = useSearchParams();
  const fromChallengeHub = searchParams.get('fromHub') === '1';

  const { user, isInApp } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
    isInApp: model.initialState?.isInApp,
  }));

  const [yourTeamIndex, setyourTeamIndex] = useState<number | null>();

  const [showVip, setShowVip] = useState<boolean>(false);

  const {
    type,
    status,
    round,
    roundNumber,
    targetCoord,
    pickCoord,
    lastRoundResult,
    totalScore,
    gameId,
    challengeId,
    teams,
    next,
    isDamageMultiple,
    damageMultiple,
    playerIds,
    player,
    mapsName,
  } = useModel(model, (model) => ({
    type: model.type,
    round: model.gameData?.currentRound,
    roundNumber: model.gameData?.roundNumber,
    isDamageMultiple: model.lastRound?.isDamageMultiple,
    damageMultiple: model.lastRound?.damageMultiple,
    status: model.gameData?.status,
    targetCoord: model.targetCoord,
    pickCoord: model.pickCoord,
    lastRoundResult: model.gameData?.player?.lastRoundResult,
    totalScore: model.gameData?.player?.totalScore,
    teams: model.gameData?.teams,
    gameId: model.gameId,
    challengeId: model.gameData?.challengeId,
    playerIds: model.gameData?.playerIds,
    next: model.next,
    player: model.gameData?.player,
    mapsName: model.gameData?.mapsName,
  }));

  // 判断是否对局类
  const is2Teams = useMemo(
    () => type && ['solo', 'solo_match', 'team', 'team_match'].includes(type),
    [type],
  );

  // 判断是否是观战者
  const isObserver = useMemo(
    () => playerIds && !playerIds.includes(user?.userId ?? 0),
    [playerIds, user?.userId],
  );

  const trickGameAgain = () => {
    gameAgain({ gameId: gameId! })
      .then((res) => {
        if (res.success) {
          if (res.data.challengeId) {
            history.push(`/challenge/${res.data.challengeId}`);
          } else {
            history.push(`/solo/${res.data.gameId}`);
          }
        }
      })
      .catch((reason) => {
        if (reason.toString().includes('会员')) {
          setShowVip(true);
        }
      });
  };

  const goToChallengeHub = () => {
    if (challengeId) {
      history.push(`/challenge-hub/${encodeURIComponent(challengeId)}`);
    }
  };

  const finishReplayAction = () => {
    if (fromChallengeHub && type === 'challenge') {
      goToChallengeHub();
    } else {
      trickGameAgain();
    }
  };

  // 空格按钮事件
  useKeyPress('space', () => {
    if (status === 'ongoing' && targetCoord) {
      next();
    } else if (
      status === 'finish' &&
      (type === 'challenge' ||
        type === 'map_country_streak' ||
        type === 'country_streak' ||
        type === 'province_streak')
    ) {
      finishReplayAction();
    }
  });

  // ======== 多人模式的选点 渲染 Start ============
  const teamCoords = useMemo(() => {
    const coords: {
      user: API.UserProfile;
      guess: API.UserGuessPinHint;
      teamIndex: number;
    }[] = [];

    teams?.forEach((team, teamIndex) => {
      team?.teamUsers?.forEach((u) => {
        const guess = u.guesses?.find((g) => g.round === round);
        if (guess && u.user.userId !== user?.userId) {
          coords.push({
            user: u.user,
            guess,
            teamIndex,
          });
        }
      });
    });

    return coords;
  }, [teams]);

  const allCoords = useMemo(() => {
    const coords: {
      user: API.UserProfile;
      guess: API.UserGuessPinHint;
      teamIndex: number;
    }[] = [];

    teams?.forEach((team, teamIndex) => {
      team?.teamUsers?.forEach((u) => {
        if (user?.userId === u.user.userId) {
          setyourTeamIndex(teamIndex);
        }
        const guess = u.guesses?.find((g) => g.round === round);
        if (guess) {
          coords.push({
            user: u.user,
            guess,
            teamIndex,
          });
        }
      });
    });

    return coords;
  }, [teams]);

  // ======== Markers 渲染 Start ============
  const teamsMarkers = useMemo(
    () =>
      teamCoords.map((u) => (
        <Marker
          key={u.user.userId}
          longitude={u.guess.lng}
          latitude={u.guess.lat}
          anchor="bottom"
          pitchAlignment="map"
          offset={[0, 0]}
          style={{
            height: '42px',
            backgroundImage: is2Teams
              ? u.teamIndex === 0
                ? `url(${publicPath}/images/marker_background_red.png)`
                : `url(${publicPath}/images/marker_background_blue.png)`
              : `url(${publicPath}/images/marker_background.png)`,
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <Badge
            count={u.user.userName}
            overflowCount={10000000000}
            offset={[-18, -12]}
            color="#FFF"
            style={{
              color: '#000',
              fontWeight: '700',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <Avatar
              src={`${CFBizUri}${u.user.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
              style={{
                border: '2px solid #13c2c2',
                borderColor: u.teamIndex === 0 ? '#eb2f96' : '#1677ff',
              }}
            />
          </Badge>
        </Marker>
      )),
    [teamCoords],
  );
  // ======== Markers 渲染 End ============

  // ======== Line 渲染 Start ============
  const teamsLinesGeoJSON = useMemo(() => {
    if (targetCoord && teams && teams.length > 0) {
      return {
        type: 'FeatureCollection',
        features: teamCoords?.map((u) => ({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [u.guess.lng, u.guess.lat],
              [targetCoord.longitude, targetCoord.latitude],
            ],
          },
        })),
      };
    } else return null;
  }, [targetCoord]);
  // ======== Line 渲染 End ============
  // ======== 多人模式的选点 渲染 End ============

  // 控制地图聚焦标记位置
  useEffect(() => {
    if (map && targetCoord) {
      // 多人模式要进行特殊操作
      if (allCoords && allCoords.length >= 1) {
        // 获取四边界
        const bounds = allCoords.reduce(
          (acc, cur) => {
            acc[0] = Math.min(acc[0], cur.guess.lng);
            acc[1] = Math.min(acc[1], cur.guess.lat);
            acc[2] = Math.max(acc[2], cur.guess.lng);
            acc[3] = Math.max(acc[3], cur.guess.lat);
            return acc;
          },
          [
            Math.min(
              targetCoord.longitude,
              pickCoord?.longitude ?? targetCoord.longitude,
            ),
            Math.min(
              targetCoord.latitude,
              pickCoord?.latitude ?? targetCoord.latitude,
            ),
            Math.max(
              targetCoord.longitude,
              pickCoord?.longitude ?? targetCoord.longitude,
            ),
            Math.max(
              targetCoord.latitude,
              pickCoord?.latitude ?? targetCoord.latitude,
            ),
          ],
        );

        try {
          map.fitBounds(
            [
              [bounds[0], bounds[1]],
              [bounds[2], bounds[3]],
            ],
            {
              padding: window.innerHeight < 500 ? 20 : 100,
              duration: 500,
            },
          );
        } catch (e) { }
      } else if (!pickCoord) {
        map.flyTo({
          center: [targetCoord.longitude, targetCoord.latitude],
          zoom: 8,
          duration: 500,
        });
      } else {
        try {
          map.fitBounds(
            [
              [targetCoord.longitude, targetCoord.latitude],
              [pickCoord.longitude, pickCoord.latitude],
            ],
            {
              padding: window.innerHeight < 500 ? 20 : 100,
              duration: 500,
            },
          );
        } catch (e) { }
      }
    }
  }, [pickCoord, targetCoord, map]);

  return (
    <div
      className={`${styles.wrapper} ${type &&
        [
          'solo',
          'solo_match',
          'team',
          'team_match',
          'battle_royale',
          'map_country_streak',
          'country_streak',
          'province_streak',
          'rank',
        ].includes(type)
        ? styles.challengeWrap
        : ''
        }`}
    >
      {showVip && <VipModal open={showVip} hide={() => setShowVip(false)} />}
      <div className={styles.innerWrapper}>
        {/* 日挑模式头部（需要重做） */}
        {type &&
          ['daily_challenge', 'challenge', 'infinity'].includes(type) && (
            <div className={styles.scoreReulst}>
              <div className={styles.round}>
                <div className={styles.scoreReulstLabel}>回合</div>
                <div className={styles.scoreReulstValue}>
                  {round} / {type === 'infinity' ? '∞' : roundNumber}
                </div>
              </div>

              <div className={styles.distance}>
                <div className={styles.scoreReulstLabel}>距离</div>
                <div
                  className={`${styles.scoreReulstValue} ${lastRoundResult?.distance === null
                    ? styles.timeoutValue
                    : ''
                    }`}
                >
                  {lastRoundResult?.distance !== null
                    ? distanceDisplay(lastRoundResult?.distance ?? 0)
                    : '超时选择'}
                </div>
              </div>

              <div className={styles.score}>
                <div className={styles.scoreReulstLabel}>得分</div>
                <div className={styles.scoreReulstValue}>
                  {new BigNumber(lastRoundResult?.score ?? 0).toFormat()}{' '}
                  <small>/ 5000</small>
                </div>
              </div>

              {!isMobile && type === 'infinity' && (
                <div className={styles.score}>
                  <div className={styles.scoreReulstLabel}>平均分</div>
                  <div className={styles.scoreReulstValue}>
                    {new BigNumber((totalScore || 0) / (round || 1)).toFormat(
                      1,
                    )}{' '}
                  </div>
                </div>
              )}

              <div className={styles.totalScore}>
                <div className={styles.scoreReulstLabel}>总分</div>
                <div className={styles.scoreReulstValue}>
                  {new BigNumber(totalScore || 0).toFormat()}
                </div>
              </div>
            </div>
          )}
        {/* 轮次模式头部 */}
        {is2Teams && (
          <>
            <div className={styles.teamHeader}>
              第 {round} 轮
              {isDamageMultiple && (
                <span> - {damageMultiple?.toFixed(1)} 倍伤害</span>
              )}
            </div>
            <Divider />
          </>
        )}
        {/* 淘汰赛模式头部 */}
        {type && ['battle_royale'].includes(type) && (
          <>
            <div className={styles.teamHeader}>淘汰赛 - 第 {round} 轮</div>
            <Divider />
            <div className={styles.eliminatedUsers}>
              <div className={styles.eliminatedUsersLabel}>淘汰选手</div>
              <div className={styles.eliminatedUsersValue}>
                <EliminatedUsers />
              </div>
            </div>
            <Divider />
          </>
        )}

        {type && ['rank'].includes(type) && (
          <>
            <div className={styles.teamHeader}>
              排位赛 - 第 {round} / {roundNumber} 轮
            </div>
            <Divider />
          </>
        )}

        {/* 题库淘汰赛 */}
        {type &&
          ['map_country_streak', 'province_streak', 'country_streak'].includes(
            type,
          ) && (
            <>
              <div className={styles.teamHeader}>
                {type.includes('map') ? '题库' : ''}
                {type.includes('country') ? '国家' : '省份'}连胜 - 第 {round} 轮
              </div>
              <Divider />
              <div className={styles.streakEnd}>
                {status === 'finish' && <div className={styles.end}>结束</div>}
                <div className={styles.streak}>
                  {status === 'finish' ? (round ?? 1) - 1 : round ?? 1} 连胜
                </div>
                <div className={styles.choose}>
                  猜测{type.includes('country') ? '国家' : '省份'}：
                  {lastRoundResult?.guessPlace}
                </div>
                <div className={styles.target}>
                  目标{type.includes('country') ? '国家' : '省份'}：
                  {lastRoundResult?.targetPlace}
                </div>
              </div>
              <Divider />
            </>
          )}

        <div className={styles.mapResult}>
          <MapContainer cursor="grab">
            {/* 多人模式的选点 */}
            <Source type="geojson" data={teamsLinesGeoJSON}>
              <Layer
                type="line"
                paint={{
                  'line-width': 3,
                  'line-dasharray': [0, 1, 1],
                }}
              />
            </Source>
            {teamsMarkers}

            {/* 选点和目标点之间的连线 */}
            {pickCoord && targetCoord && (
              <Source
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: [
                          [pickCoord.longitude, pickCoord.latitude],
                          [targetCoord.longitude, targetCoord.latitude],
                        ],
                      },
                    },
                  ],
                }}
              >
                <Layer
                  type="line"
                  paint={{
                    'line-width': 3,
                    'line-dasharray': [0, 1, 1],
                  }}
                />
              </Source>
            )}

            {/* 选点 */}
            {pickCoord && (
              <Marker
                {...pickCoord}
                anchor="bottom"
                pitchAlignment="map"
                offset={[0, 0]}
                style={{
                  height: '42px',
                  backgroundImage: is2Teams
                    ? yourTeamIndex === 0
                      ? `url(${publicPath}/images/marker_background_red.png)`
                      : `url(${publicPath}/images/marker_background_blue.png)`
                    : `url(${publicPath}/images/marker_background.png)`,
                  backgroundSize: '100%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <Avatar
                  src={`${CFBizUri}${player?.user.icon ?? user?.icon
                    }?x-oss-process=image/resize,h_80/quality,q_75`}
                  style={{
                    border: '2px solid #FF9427',
                  }}
                />
              </Marker>
            )}

            {/* 目标点 */}
            {targetCoord && (
              <Marker
                {...targetCoord}
                anchor="bottom"
                pitchAlignment="map"
                offset={[0, 0]}
                style={{
                  color: '#FFF',
                  height: '44px',
                  backgroundImage: `url(${publicPath}/images/marker_background_black.png`,
                  backgroundSize: '100%',
                  backgroundRepeat: 'no-repeat',
                  zIndex: 1000,
                  padding: '4px',
                  boxSizing: 'border-box',
                }}
              >
                <Avatar
                  size={28}
                  style={{
                    border: 'none',
                    backgroundColor: '#000',
                  }}
                  src={
                    <FlagTwoTone
                      style={{ fontSize: '20px' }}
                      twoToneColor="warning"
                      rotate={-45}
                    />
                  }
                />
              </Marker>
            )}
          </MapContainer>
          {is2Teams && (
            <div className={styles.avatarHealth}>
              <HealthBar team={0} showMembers={false} />
              <HealthBar team={1} showMembers={false} />
            </div>
          )}
        </div>
        {type &&
          [
            'daily_challenge',
            'challenge',
            'infinity',
            'map_country_streak',
            'country_streak',
            'province_streak',
          ].includes(type) && (
            <div className={styles.controls}>
              <Space wrap align="center" style={{ justifyContent: 'center' }}>
                {round === roundNumber &&
                  type === 'daily_challenge' &&
                  gameId &&
                  challengeId && (
                    <DailyChallengeRank
                      gameId={gameId}
                      challengeId={challengeId}
                    />
                  )}

                {/* TODO: 按钮样式太丑了!!!! */}
                <Button
                  type="primary"
                  ghost
                  shape="round"
                  size="large"
                  onClick={
                    () => {
                      if (type === 'daily_challenge') {
                        qixunGoback('/daily-challenge');
                      } else if (type === 'challenge') {
                        qixunGoback('/maps-new');
                      } else if (type === 'infinity') {
                        qixunGoback('/maps-new');
                      } else {
                        qixunGoback('/');
                      } // 返回首页总是不会错的
                    }
                    // 每日挑战
                  }
                >
                  返回
                </Button>

                {status === 'finish' && (
                  <Button
                    type="primary"
                    ghost
                    shape="round"
                    size="large"
                    onClick={() => {
                      qixunGoHome();
                    }}
                  >
                    首页
                  </Button>
                )}

                {status === 'finish' && (
                  <Button
                    type="primary"
                    ghost
                    shape="round"
                    size="large"
                    onClick={() => history.push(`/replay?gameId=${gameId}`)}
                  >
                    复盘
                  </Button>
                )}

                {(type === 'infinity' || type === 'challenge') &&
                  status !== 'finish' && (
                    <Button
                      type="primary"
                      ghost
                      shape="round"
                      size="large"
                      onClick={() => {
                        history.push(
                          `/replay-pano?gameId=${gameId}&round=${round}`,
                        );
                      }}
                    >
                      街景
                    </Button>
                  )}

                {(round !== roundNumber || type === 'infinity') &&
                  status !== 'finish' && (
                    <Button
                      type="primary"
                      shape="round"
                      size="large"
                      onClick={next}
                    >
                      下一轮
                    </Button>
                  )}
                {status === 'finish' &&
                  (type === 'challenge' ||
                    type === 'infinity' ||
                    type === 'map_country_streak' ||
                    type === 'country_streak' ||
                    type === 'province_streak') && (
                    <Button
                      type="primary"
                      shape="round"
                      size="large"
                      onClick={
                        fromChallengeHub && type === 'challenge'
                          ? goToChallengeHub
                          : trickGameAgain
                      }
                    >
                      {fromChallengeHub && type === 'challenge'
                        ? '回到挑战'
                        : '再来一局'}
                    </Button>
                  )}
              </Space>
              {round !== roundNumber && status !== 'finish' && !isMobile && (
                <p>
                  或使用<span>空格</span>进入下一轮
                </p>
              )}
              {(type === 'challenge' ||
                type === 'map_country_streak' ||
                type === 'country_streak' ||
                type === 'province_streak') &&
                status === 'finish' && (
                  <p>
                    {fromChallengeHub && type === 'challenge' ? (
                      <>
                        或使用<span>空格</span>返回挑战页
                      </>
                    ) : (
                      <>
                        或使用<span>空格</span>再来一局
                      </>
                    )}
                  </p>
                )}
            </div>
          )}
        {/* 对战模式显示结果 */}
        {is2Teams && (
          <div className={styles.roundScore}>
            {(type === 'team' || type === 'team_match') && (
              <>
                <div
                  className={`${styles.roundScoreDistance} ${styles.roundScoreRow}`}
                >
                  <div className={styles.roundScoreValue}>
                    {teams?.[0]?.lastRoundResult?.user?.userName ?? '无'}
                  </div>
                  <div className={styles.roundScoreLabel}>最佳</div>
                  <div className={styles.roundScoreValue}>
                    {teams?.[1]?.lastRoundResult?.user?.userName ?? '无'}
                  </div>
                </div>
                <Divider />
              </>
            )}
            <div
              className={`${styles.roundScoreDistance} ${styles.roundScoreRow}`}
            >
              <div className={styles.distance}>
                {teams?.[0]?.lastRoundResult?.distance === undefined
                  ? '无'
                  : distanceDisplay(teams?.[0]?.lastRoundResult?.distance)}
              </div>
              <div className={styles.roundScoreLabel}>距离</div>
              <div className={styles.distance}>
                {teams?.[1]?.lastRoundResult?.distance === undefined
                  ? '无'
                  : distanceDisplay(teams[1].lastRoundResult.distance)}
              </div>
            </div>
            <Divider />
            <div
              className={`${styles.roundScoreScore} ${styles.roundScoreRow}`}
            >
              <div className={styles.roundScoreValue}>
                {new BigNumber(
                  teams?.[0]?.lastRoundResult?.score ?? 0,
                ).toFormat(0)}
              </div>
              <div className={styles.roundScoreLabel}>得分</div>
              <div className={styles.roundScoreValue}>
                {new BigNumber(
                  teams?.[1]?.lastRoundResult?.score ?? 0,
                ).toFormat(0)}
              </div>
            </div>
            <Divider />

            <div
              className={`${styles.roundScoreHealth} ${styles.roundScoreRow}`}
            >
              <div className={styles.roundScoreValue}>
                {new BigNumber(teams?.[0]?.lastRoundResult?.healthAfter ?? 0)
                  .minus(teams?.[0]?.lastRoundResult?.healthBefore ?? 0)
                  .toFormat(0)}
              </div>
              <div className={styles.roundScoreLabel}>血量变化</div>
              <div className={styles.roundScoreValue}>
                {new BigNumber(teams?.[1]?.lastRoundResult?.healthAfter ?? 0)
                  .minus(teams?.[1]?.lastRoundResult?.healthBefore ?? 0)
                  .toFormat(0)}
              </div>
            </div>

            <Divider />
          </div>
        )}
        {type === 'rank' && (
          <TeamRank model="Challenge.model" currentUserId={user?.userId} />
        )}
      </div>
      <UidVersionBar mapsName={mapsName} />
    </div>
  );
};

export default ChallengeResult;
