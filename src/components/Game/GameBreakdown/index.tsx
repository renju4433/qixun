import { FC, useState, useRef, useEffect } from 'react';
import { Button, Avatar, Modal, Popover } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined, AimOutlined, EnvironmentOutlined, ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { isMobile } from 'react-device-detect';
import { history, useModel, useSearchParams } from '@umijs/max';
import { CFBizUri } from '@/constants';
import styles from './style.less';
import { getGameTypeName } from '@/utils/GameUtils';
import HeaderLogo from '@/components/Header/Logo';
import UserReportModal from '@/pages/User/UserReportModal';
import { qixunCopy } from '@/utils/CopyUtils';

// 使用 SVG 内联替代 MUI 的 GamepadOutlined 图标
const GamepadIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="#d87a16">
    <path d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z" />
  </svg>
);

interface BestGuess {
  score: number;
  distance: number;
  lat: number;
  lng: number;
  user: any;
}

interface RoundResult {
  round: number;
  teams: {
    teamId: string;
    bestGuess: BestGuess;
    damage: number;
    health: number;
  }[];
}

interface GameBreakdownProps {
  gameSummary: RoundResult[];
  teams: any[];
  data: any;
  chooseRound?: number;
  chooseUser?: number;
  onRoundSelect: (round: number) => void;
  onUserSelect: (userId?: number) => void;
  formatDistance: (distance: number) => string;
  formatTime: (timestamp: number) => string;
  formatDuration: (start: number, end: number) => string;
  mapContent: React.ReactNode;
  isSinglePlayer?: boolean;
  onReportPlayer?: () => void;
  showReportChoose?: boolean;
  showReport?: boolean;
  reportUserId?: number;
  onReportChooseClose?: () => void;
  onReportClose?: () => void;
  onReportUserSelect?: (userId: number) => void;
}

const GameBreakdown: FC<GameBreakdownProps> = ({
  gameSummary,
  teams,
  data,
  chooseRound,
  chooseUser,
  onRoundSelect,
  onUserSelect,
  formatDistance,
  formatTime,
  formatDuration,
  mapContent,
  isSinglePlayer = false,
  onReportPlayer,
  showReportChoose = false,
  showReport = false,
  reportUserId,
  onReportChooseClose,
  onReportClose,
  onReportUserSelect,
}) => {
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { requestUser, isInApp } = useModel('@@initialState', (model) => ({
    requestUser: model.initialState?.user,
    isInApp: model.initialState?.isInApp,
  }));

  const enterNativeFullscreen = async (el: HTMLElement) => {
    try {
      const anyEl: any = el as any;
      if (anyEl.requestFullscreen) return await anyEl.requestFullscreen();
      if (anyEl.webkitRequestFullscreen) return await anyEl.webkitRequestFullscreen();
      if (anyEl.msRequestFullscreen) return await anyEl.msRequestFullscreen();
      throw new Error('No fullscreen API');
    } catch (e) {
      throw e;
    }
  };

  const exitNativeFullscreen = async () => {
    try {
      const anyDoc: any = document as any;
      if (document.fullscreenElement) return await document.exitFullscreen();
      if (anyDoc.webkitFullscreenElement) return await anyDoc.webkitExitFullscreen();
      if (anyDoc.msFullscreenElement) return await anyDoc.msExitFullscreen();
    } catch (e) {
      // ignore
    }
  };

  const toggleMapFullscreen = async () => {
    const element = mapContainerRef.current;
    if (!element) return;

    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false);
      setIsMapFullscreen(false);
      return;
    }

    if (!isMapFullscreen) {
      try {
        await enterNativeFullscreen(element);
        setIsMapFullscreen(true);
        setIsPseudoFullscreen(false);
      } catch (err) {
        // 移动端启用伪全屏作为备选方案
        setIsPseudoFullscreen(true);
        setIsMapFullscreen(true);
      }
    } else {
      await exitNativeFullscreen();
      setIsMapFullscreen(false);
      setIsPseudoFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      const anyDoc: any = document as any;
      const active = !!(document.fullscreenElement || anyDoc.webkitFullscreenElement || anyDoc.msFullscreenElement);
      setIsMapFullscreen(active || isPseudoFullscreen);
      if (!active && !isPseudoFullscreen) {
        setIsMapFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler as any);
    document.addEventListener('msfullscreenchange', handler as any);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler as any);
      document.removeEventListener('msfullscreenchange', handler as any);
    };
  }, [isPseudoFullscreen]);

  const getTeamColor = (index: number) => {
    const colors = ['#ff4d4f', '#3fa7ff', '#52c41a', '#faad14'];
    return colors[index % colors.length];
  };

  const calculateHealthChanges = () => {
    if (!gameSummary || gameSummary.length === 0 || isSinglePlayer) return [];

    const results: Array<{
      round: number;
      teamHealths: Array<{ teamId: string; currentHealth: number; damage: number }>;
    }> = [];

    gameSummary.forEach((roundSummary, roundIndex) => {
      if (roundSummary.teams.length < 2) return;

      const scores = roundSummary.teams.map(team => team.bestGuess.score || 0);
      const maxScore = Math.max(...scores);
      const minScore = Math.min(...scores);

      const multiplier = data?.rounds?.[roundSummary.round - 1]?.damageMultiple || 1;
      const damageValue = Math.floor((maxScore - minScore) * multiplier);

      const roundHealths = roundSummary.teams.map(team => {
        const teamScore = team.bestGuess.score || 0;
        const tookDamage = teamScore !== maxScore;

        const prevHealth = roundIndex === 0
          ? roundSummary.teams.find(t => t.teamId === team.teamId)?.health ?? 6000
          : results[roundIndex - 1]?.teamHealths.find(h => h.teamId === team.teamId)?.currentHealth ?? 6000;

        const newHealth = tookDamage ? Math.max(0, prevHealth - damageValue) : prevHealth;

        return {
          teamId: team.teamId,
          currentHealth: newHealth,
          damage: tookDamage ? damageValue : 0
        };
      });

      results.push({
        round: roundSummary.round,
        teamHealths: roundHealths
      });
    });

    return results;
  };

  const healthData = calculateHealthChanges();

  const getHealthStyle = (currentHealth: number) => {
    if (currentHealth <= 0) {
      return {
        backgroundColor: 'rgba(255, 77, 79, 0.2)',
        borderColor: 'rgba(255, 77, 79, 0.5)',
        color: '#ff4d4f'
      };
    }
    const percentage = Math.max(0, Math.min(1, currentHealth / 6000));
    const brightness = 0.3 + (percentage * 0.7);
    return {
      backgroundColor: `rgba(105, 218, 49, ${0.1 * brightness})`,
      borderColor: `rgba(105, 218, 49, ${0.3 * brightness})`,
      color: `rgba(105, 218, 49, ${brightness})`
    };
  };

  const formatGuessTime = (ms?: number | null) => {
    if (ms === null || ms === undefined) return '';
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const singleTotals = isSinglePlayer && data?.player?.guesses
    ? data.player.guesses.reduce(
      (acc: { score: number; distance: number; time: number }, g: any) => {
        acc.score += g?.score || 0;
        acc.distance += g?.distance || 0;
        acc.time += g?.timeConsume || 0;
        return acc;
      },
      { score: 0, distance: 0, time: 0 },
    )
    : { score: 0, distance: 0, time: 0 };

  const isBattleRoyale = data?.gameType === 'battle_royale' || data?.type === 'battle_royale' || data?.type === 'rank';

  // 判断是否为solo对战模式（每个队伍只有1个玩家）
  const isSoloVersusMode = !isSinglePlayer && !isBattleRoyale && teams?.length > 0 && teams.every((team: any) => team.teamUsers?.length === 1);

  // 用于追踪是否已经初始化过默认选中
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // 只在初次进入且没有URL参数指定轮次时，默认选中最后一轮
    if (isBattleRoyale && !hasInitializedRef.current && (!chooseRound || chooseRound === 0) && data?.rounds?.length > 0) {
      const urlRound = searchParams.get('round');
      // 检查URL中是否有round参数，如果没有才设置默认值
      if (!urlRound) {
        onRoundSelect(data.rounds.length);
        hasInitializedRef.current = true;
      }
    }
  }, [isBattleRoyale, chooseRound, data?.rounds?.length, onRoundSelect, searchParams]);

  useEffect(() => {
    const urlRound = searchParams.get('round');
    const urlUser = searchParams.get('user');

    if (urlRound && parseInt(urlRound) !== chooseRound) {
      onRoundSelect(parseInt(urlRound));
    }

    if (urlUser && parseInt(urlUser) !== chooseUser) {
      onUserSelect(parseInt(urlUser));
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (chooseRound) {
      params.set('round', chooseRound.toString());
    } else {
      params.delete('round');
    }

    if (chooseUser) {
      params.set('user', chooseUser.toString());
    } else {
      params.delete('user');
    }

    setSearchParams(params, { replace: true });
  }, [chooseRound, chooseUser, setSearchParams]);

  // 大逃杀模式距离计算
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getBattleRoyalePlayersForRound = (roundIndex: number) => {
    if (!isBattleRoyale || !teams || !data?.rounds) return { players: [], omittedCount: 0 };

    const roundData = data.rounds[roundIndex];
    if (!roundData) return { players: [], omittedCount: 0 };

    const MAX_DISPLAY_PLAYERS = 10;

    const previouslyEliminatedTeamIds = new Set<string>();
    for (let i = 0; i < roundIndex; i++) {
      const prevRoundData = data.rounds[i];
      if (prevRoundData?.obsoleteTeamIds) {
        prevRoundData.obsoleteTeamIds.forEach((teamId: string) => {
          previouslyEliminatedTeamIds.add(teamId);
        });
      }
    }

    const activePlayers = teams
      .filter(team => !previouslyEliminatedTeamIds.has(team.id))
      .map(team => {
        const teamUser = team.teamUsers?.[0];
        const guess = teamUser?.guesses?.find((g: any) => g.round === roundIndex + 1);

        if (!teamUser?.user) return null;

        const isEliminatedThisRound = roundData.obsoleteTeamIds?.includes(team.id) || false;
        const isCurrentUser = teamUser.user.userId === requestUser?.userId;

        if (!guess) {
          return {
            user: teamUser.user,
            guess: null,
            team: team,
            distance: null,
            isEliminatedThisRound: isEliminatedThisRound,
            isAlive: team.health > 0,
            noGuess: true,
            isCurrentUser: isCurrentUser
          };
        }

        const distance = calculateDistance(
          guess.lat,
          guess.lng,
          roundData.lat,
          roundData.lng
        );

        return {
          user: teamUser.user,
          guess: guess,
          team: team,
          distance: distance,
          isEliminatedThisRound: isEliminatedThisRound,
          isAlive: team.health > 0,
          noGuess: false,
          isCurrentUser: isCurrentUser
        };
      })
      .filter((player): player is NonNullable<typeof player> => player !== null);

    // 找到当前用户
    const currentUserPlayer = activePlayers.find(p => p.isCurrentUser);

    // 分离正常玩家、被淘汰玩家和未猜测玩家
    const normalPlayers = activePlayers.filter(p => !p.isEliminatedThisRound && !p.noGuess);
    const eliminatedOrNoGuessPlayers = activePlayers.filter(p => p.isEliminatedThisRound || p.noGuess);

    // 按距离排序正常玩家（有效猜测且未被淘汰）
    normalPlayers.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance === null && b.distance !== null) return 1;
      if (a.distance !== null && b.distance === null) return -1;
      return 0;
    });

    // 排序被淘汰或未猜测的玩家（被淘汰的排在未猜测之前）
    eliminatedOrNoGuessPlayers.sort((a, b) => {
      if (a.isEliminatedThisRound && !b.isEliminatedThisRound) return -1;
      if (!a.isEliminatedThisRound && b.isEliminatedThisRound) return 1;

      // 同类型玩家按距离排序
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance === null && b.distance !== null) return 1;
      if (a.distance !== null && b.distance === null) return -1;
      return 0;
    });

    let displayPlayers = [];
    let availableSlots = MAX_DISPLAY_PLAYERS - 1; // 为省略项保留一个位置

    // 确保当前用户始终显示
    if (currentUserPlayer) {
      displayPlayers.push(currentUserPlayer);
      availableSlots--;

      // 从对应的分组中移除当前用户，避免重复显示
      if (!currentUserPlayer.isEliminatedThisRound && !currentUserPlayer.noGuess) {
        const index = normalPlayers.findIndex(p => p.user.userId === currentUserPlayer.user.userId);
        if (index !== -1) normalPlayers.splice(index, 1);
      } else {
        const index = eliminatedOrNoGuessPlayers.findIndex(p => p.user.userId === currentUserPlayer.user.userId);
        if (index !== -1) eliminatedOrNoGuessPlayers.splice(index, 1);
      }
    }

    // 优先显示正常玩家
    const normalPlayersToShow = normalPlayers.slice(0, Math.max(0, availableSlots - eliminatedOrNoGuessPlayers.length));
    displayPlayers.push(...normalPlayersToShow);
    availableSlots -= normalPlayersToShow.length;

    // 显示被淘汰或未猜测玩家
    const eliminatedToShow = eliminatedOrNoGuessPlayers.slice(0, availableSlots);
    displayPlayers.push(...eliminatedToShow);

    // 计算省略的玩家数量
    const totalPlayers = normalPlayers.length + eliminatedOrNoGuessPlayers.length + (currentUserPlayer ? 1 : 0);
    const omittedCount = Math.max(0, totalPlayers - displayPlayers.length);

    return { players: displayPlayers, omittedCount };
  };

  const getPlayerRoundsParticipated = (team: any) => {
    if (!team.teamUsers?.[0]?.guesses || !data?.rounds) return 0;

    const playerGuesses = team.teamUsers[0].guesses;
    let roundsParticipated = 0;

    data.rounds.forEach((roundData: any, roundIndex: number) => {
      const roundNumber = roundIndex + 1;
      const hasGuess = playerGuesses.some((guess: any) => guess.round === roundNumber);

      let wasEliminatedBefore = false;
      for (let i = 0; i < roundIndex; i++) {
        const prevRoundData = data.rounds[i];
        if (prevRoundData?.obsoleteTeamIds?.includes(team.id)) {
          wasEliminatedBefore = true;
          break;
        }
      }

      if (hasGuess || !wasEliminatedBefore) {
        roundsParticipated++;
      }
    });

    return roundsParticipated;
  };

  return (
    <div className={styles.gameBreakdown}>
      <div className={styles.header}>
        <HeaderLogo canBack={true} />
        <div className={styles.title}>
          <h2>对局复盘</h2>
          <div className={styles.subtitle}>
            {getGameTypeName(data)}
          </div>
        </div>
        <div className={styles.headerSpacer}></div>
      </div>

      <div className={styles.mainContent}>
        <div className={`${styles.mapContainer} ${isPseudoFullscreen ? styles.pseudoFullscreen : ''}`} ref={mapContainerRef}>
          <div className={styles.mapContentWrapper}>
            {data && !isPseudoFullscreen && (
              <div className={styles.gameInfo}>
                <div>题库：{data.mapsName}</div>
                <div>
                  开始时间：
                  {formatTime(data?.rounds[0].startTime)}
                </div>
                <div>
                  时长：
                  {formatDuration(
                    data?.rounds[0].startTime,
                    data?.rounds[data?.rounds.length - 1].endTime,
                  )}
                </div>
              </div>
            )}
            {mapContent}
          </div>
          <Button
            className={styles.fullscreenBtn}
            icon={isMapFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleMapFullscreen}
            title={isMapFullscreen ? '退出全屏' : '全屏显示'}
          />

          <div className={styles.mapActionButtons}>
            <Button
              onClick={() => {
                const currentUrl = new URL(window.location.href);
                qixunCopy(currentUrl.toString());
              }}
              className={styles.mapActionBtn}
              title="复制链接"
            >
              <span className={styles.btnTextFull}>复制链接</span>
            </Button>
            {!isSinglePlayer && (
              <Button
                onClick={onReportPlayer}
                className={styles.mapActionBtn}
                title="举报玩家"
              >
                <span className={styles.btnTextFull}>举报玩家</span>
              </Button>
            )}
            {(data.record || data.type === 'daily_challenge') && <Button
              className={styles.mapActionBtn}
              title="查看回放"
              onClick={() => { history.push(`replayplayer?gameId=${data?.id}&round=${chooseRound || 1}&userId=${chooseUser ? chooseUser : (data?.playerIds || [1])[0]}`) }
              }
            >
              <span className={styles.btnTextFull}>查看回放</span>
            </Button>}
          </div>
          <Modal
            open={showReportChoose}
            okButtonProps={{ style: { display: 'none' } }}
            onCancel={onReportChooseClose}
            title="选择您要举报的用户"
            getContainer={false}
            zIndex={10000}
          >
            {teams?.map((team: any) =>
              team.teamUsers.map((user: any) => (
                <Button
                  key={user.user.userId}
                  style={{ marginRight: '5px' }}
                  onClick={() => {
                    onReportUserSelect?.(user.user.userId);
                  }}
                >
                  {user.user.userName}
                </Button>
              )),
            )}
          </Modal>

          {reportUserId && showReport && onReportClose && (
            <UserReportModal
              userId={reportUserId}
              open={showReport}
              gameId={data?.id}
              gameType={data?.type}
              partyId={data?.partyId}
              source="replay"
              getContainer={false}
              zIndex={10000}
              onClose={onReportClose}
            />
          )}
        </div>
        <div className={styles.roundsContainer}>
          <div className={`${styles.roundsHeader} ${isSinglePlayer ? styles.singlePlayer : ''} ${isBattleRoyale ? styles.battleRoyale : ''}`}>
            <div className={styles.teamCol}>
              <div
                style={{ cursor: 'pointer', display: 'inline-block' }}
                title="重置选择"
                onClick={() => {
                  onRoundSelect(0);
                  onUserSelect(undefined);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onRoundSelect(0);
                    onUserSelect(undefined);
                  }
                }}
              >
                <GamepadIcon />
              </div>
            </div>
            {isSinglePlayer ? (
              <>
                <div className={styles.teamCol}>
                  <AimOutlined style={{ color: "#d87a16", fontSize: '24px' }} />
                </div>
                <div className={styles.teamCol}>
                  <EnvironmentOutlined style={{ color: "#d87a16", fontSize: '24px' }} />
                </div>
                <div className={styles.teamCol}>
                  <ClockCircleOutlined style={{ color: "#d87a16", fontSize: '24px' }} />
                </div>
              </>
            ) : isBattleRoyale ? (
              <div key={`player-header`} className={styles.teamCol}>
                <TeamOutlined style={{ color: "#d87a16", fontSize: '24px' }} />
              </div>
            ) : isSoloVersusMode ? (
              // Solo对战模式：显示图标
              teams?.slice(0, 2).map((team, index) => {
                const userId = team.teamUsers?.[0]?.user?.userId;
                const isSelected = chooseUser === userId && chooseRound === 0;
                return (
                  <div
                    key={team.id || `team-${index}`}
                    className={styles.teamCol}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (isSelected) {
                        onUserSelect(undefined);
                        onRoundSelect(0);
                      } else {
                        onUserSelect(userId);
                        onRoundSelect(0);
                      }
                    }}
                  >
                    <EnvironmentOutlined style={{
                      color: getTeamColor(index),
                      fontSize: '24px',
                      filter: isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                      opacity: isSelected ? 1 : 0.8
                    }} />
                  </div>
                );
              })
            ) : (
              // Team对战模式：显示玩家头像，限制数量
              teams?.slice(0, 2).map((team, teamIndex) => {
                const MAX_DISPLAY_AVATARS = 3; // 每个队伍最多显示4个头像
                const displayUsers = team.teamUsers?.slice(0, MAX_DISPLAY_AVATARS) || [];
                const hasMoreUsers = team.teamUsers?.length > MAX_DISPLAY_AVATARS;
                const omittedUsers = hasMoreUsers ? team.teamUsers?.slice(MAX_DISPLAY_AVATARS) : [];

                // Popover 内容：显示所有省略的玩家
                const popoverContent = (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    maxWidth: '240px',
                    padding: '4px'
                  }}>
                    {omittedUsers.map((teamUser: any, userIndex: number) => {
                      const user = teamUser.user;
                      const userId = user?.userId;
                      const isSelected = chooseUser === userId && chooseRound === 0;
                      return (
                        <span title={user?.userName || '未知玩家'}>
                          <Avatar
                            key={userId || `omitted-user-${userIndex}`}
                            size={isMobile ? "small" : "default"}
                            src={user?.icon ? `${CFBizUri}${user.icon}?x-oss-process=image/resize,h_32/quality,q_95` : undefined}
                            style={{
                              cursor: 'pointer',
                              border: isSelected ? `2px solid ${getTeamColor(teamIndex)}` : '1px solid rgba(255,255,255,0.2)',
                              boxShadow: isSelected ? `0 0 8px ${getTeamColor(teamIndex)}` : 'none',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => {
                              if (isSelected) {
                                onUserSelect(undefined);
                                onRoundSelect(0);
                              } else {
                                onUserSelect(userId);
                                onRoundSelect(0);
                              }
                            }}
                          >
                            {!user?.icon && (user?.userName?.[0] || '?')}
                          </Avatar>
                        </span>
                      );
                    })}
                  </div>
                );

                return (
                  <div key={team.id || `team-${teamIndex}`} className={styles.teamCol}>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'center',
                      maxWidth: '100%'
                    }}>
                      {displayUsers.map((teamUser: any, userIndex: number) => {
                        const user = teamUser.user;
                        const userId = user?.userId;
                        const isSelected = chooseUser === userId && chooseRound === 0;
                        return (
                          <span key={userId || `user-${userIndex}`} title={user?.userName || '未知玩家'}>
                            <Avatar
                              size={isMobile ? "small" : "default"}
                              src={user?.icon ? `${CFBizUri}${user.icon}?x-oss-process=image/resize,h_32/quality,q_95` : undefined}
                              style={{
                                cursor: 'pointer',
                                border: isSelected ? `2px solid ${getTeamColor(teamIndex)}` : '1px solid rgba(255,255,255,0.2)',
                                boxShadow: isSelected ? `0 0 8px ${getTeamColor(teamIndex)}` : 'none',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => {
                                if (isSelected) {
                                  onUserSelect(undefined);
                                  onRoundSelect(0);
                                } else {
                                  onUserSelect(userId);
                                  onRoundSelect(0);
                                }
                              }}
                            >
                              {!user?.icon && (user?.userName?.[0] || '?')}
                            </Avatar>
                          </span>
                        );
                      })}
                      {hasMoreUsers && (
                        <Popover
                          content={popoverContent}
                          title={`其他队员 (${omittedUsers.length})`}
                          trigger="hover"
                          placement="bottom"
                        >
                          <div style={{
                            width: isMobile ? '24px' : '32px',
                            height: isMobile ? '24px' : '32px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.6)',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            }}
                          >
                            +{team.teamUsers.length - MAX_DISPLAY_AVATARS}
                          </div>
                        </Popover>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.roundsList}>
            {isSinglePlayer ? (
              <>
                {data?.player?.guesses?.map((guess: any) => (
                  <div
                    key={guess.round}
                    ref={el => itemRefs.current[guess.round] = el}
                    className={`${styles.roundItem} ${styles.singlePlayer} ${chooseRound === guess.round ? styles.selected : ''}`}
                    onClick={() => {
                      if (chooseRound === guess.round) {
                        onUserSelect(undefined);
                      } else {
                        onRoundSelect(guess.round);
                      }
                    }}
                  >
                    <div className={styles.roundNumber}>
                      第{guess.round}轮
                      {data?.rounds?.[guess.round - 1]?.damageMultiple > 1 && (
                        <span className={styles.multiplier}>
                          ×{data.rounds[guess.round - 1].damageMultiple}
                        </span>
                      )}
                    </div>

                    <div
                      className={`${styles.perfItem} ${styles.scoreCol} ${chooseUser === data?.player?.user?.userId && chooseRound === guess.round ? styles.selectedPlayer : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chooseUser === data?.player?.user?.userId && chooseRound === guess.round) {
                          onUserSelect(undefined);
                          onRoundSelect(0);
                        } else {
                          onUserSelect(data?.player?.user?.userId);
                        }
                      }}
                    >
                      <div className={styles.perfValue}>{guess.score || 0} 分</div>
                    </div>

                    <div className={styles.perfItem}>
                      <div className={styles.perfValue}>
                        {guess.distance ? formatDistance(guess.distance) : '--'}
                      </div>
                    </div>

                    <div className={styles.perfItem}>
                      <div className={styles.perfValue}>
                        {formatGuessTime(guess.timeConsume) || '--'}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : isBattleRoyale ? (
              data?.rounds?.map((roundData: any, roundIndex: number) => {
                const roundPlayersData = getBattleRoyalePlayersForRound(roundIndex);
                const roundNumber = roundIndex + 1;

                return (
                  <div
                    key={roundNumber}
                    ref={el => itemRefs.current[roundNumber] = el}
                    className={`${styles.roundItem} ${styles.battleRoyale} ${chooseRound === roundNumber ? styles.selected : ''}`}
                    onClick={() => {
                      onUserSelect(undefined);
                      if (chooseRound === roundNumber) {
                        onRoundSelect(0); // 重置到显示所有轮次
                      } else {
                        onRoundSelect(roundNumber);
                      }
                    }}
                  >
                    <div className={styles.roundNumber}>
                      第{roundNumber}轮
                      {roundData?.damageMultiple > 1 && (
                        <span className={styles.multiplier}>
                          ×{roundData.damageMultiple}
                        </span>
                      )}
                      <span className={styles.playersCount}>({roundPlayersData.players.length + roundPlayersData.omittedCount}人)</span>
                    </div>

                    <div className={styles.battleRoyaleContainer}>
                      <div className={styles.battleRoyalePlayersGroup}>
                        {roundPlayersData.players.map((playerData: any, playerIndex: number) => (
                          <div key={playerData.user.userId} className={styles.battleRoyalePlayer}>
                            <div
                              className={`${styles.playerInfo} ${styles.battleRoyaleInfo} ${playerData.isEliminatedThisRound ? styles.eliminated :
                                playerData.noGuess ? styles.noGuess : ''
                                } ${chooseUser === playerData.user.userId && chooseRound === roundNumber
                                  ? styles.selectedPlayer
                                  : ''
                                } ${playerData.isCurrentUser ? styles.currentUser : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (chooseUser === playerData.user.userId && chooseRound === roundNumber) {
                                  onUserSelect(undefined);
                                } else {
                                  onUserSelect(playerData.user.userId);
                                }
                              }}
                            >
                              {playerData.user.icon && (
                                <Avatar
                                  size={isMobile ? "default" : "large"}
                                  src={`${CFBizUri}${playerData.user.icon}?x-oss-process=image/resize,h_32/quality,q_95`}
                                  className={styles.playerAvatar}
                                />
                              )}
                              <div className={styles.battleRoyaleDetails}>
                                <div className={styles.playerName} title={playerData.user.userName || '未知玩家'}>
                                  {playerData.user.userName || '未知玩家'}
                                  {playerData.isCurrentUser && <span className={styles.currentUserBadge}>(我)</span>}
                                </div>

                                <div className={styles.distanceInfo}>
                                  <span className={styles.distance}>
                                    {playerData.noGuess
                                      ? '未猜测'
                                      : data.type === 'rank' ? `${playerData.guess.score} 分` : playerData.distance !== null
                                        ? formatDistance(playerData.distance)
                                        : '--'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {roundPlayersData.omittedCount > 0 && (
                          <div className={`${styles.battleRoyalePlayer} ${styles.omittedPlayer}`}>
                            <div className={`${styles.playerInfo} ${styles.battleRoyaleInfo} ${styles.omitted}`}>
                              <div className={styles.omittedIcon}>...</div>
                              <div className={styles.battleRoyaleDetails}>
                                <div className={styles.playerName}>
                                  还有 {roundPlayersData.omittedCount} 人
                                </div>
                                <div className={styles.distanceInfo}>
                                  <span className={styles.distance}>未显示</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              gameSummary.map((round) => {
                const roundHealthData = healthData.find(h => h.round === round.round);
                return (
                  <div
                    key={round.round}
                    ref={el => itemRefs.current[round.round] = el}
                    className={`${styles.roundItem} ${chooseRound === round.round ? styles.selected : ''}`}
                    onClick={() => {
                      if (chooseRound === round.round && !chooseUser) {
                        onRoundSelect(0);
                      } else {
                        onRoundSelect(round.round);
                        onUserSelect(undefined);
                      }
                    }}
                  >
                    <div className={styles.roundNumber}>
                      第{round.round}轮
                      {data?.rounds?.[round.round - 1]?.damageMultiple > 1 && (
                        <span className={styles.multiplier}>
                          ×{data.rounds[round.round - 1].damageMultiple}
                        </span>
                      )}
                    </div>

                    {round.teams.slice(0, 2).map((team, teamIndex) => {
                      const teamHealth = roundHealthData?.teamHealths.find(h => h.teamId === team.teamId);
                      return (
                        <div key={team.teamId} className={styles.teamScore}>
                          <div
                            className={`${styles.playerInfo} ${chooseUser === team.bestGuess.user?.userId && chooseRound === round.round
                              ? styles.selectedPlayer
                              : ''
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (chooseUser === team.bestGuess.user?.userId && chooseRound === round.round) {
                                onUserSelect(undefined);
                              } else {
                                onRoundSelect(round.round);
                                onUserSelect(team.bestGuess.user?.userId);
                              }
                            }}
                          >
                            {team.bestGuess.user?.icon && (
                              <Avatar
                                size={isMobile ? "default" : "large"}
                                src={`${CFBizUri}${team.bestGuess.user.icon}?x-oss-process=image/resize,h_40/quality,q_95`}
                                className={styles.playerAvatar}
                              />
                            )}
                            <div className={styles.playerDetails}>
                              <div className={styles.playerName}>
                                {team.bestGuess.user?.userName || '未知玩家'}
                              </div>
                              <div className={styles.scoreInfo}>
                                <span className={styles.score}>{team.bestGuess.score || 0} 分</span>
                              </div>
                              <div className={styles.playerMeta}>
                                <span className={styles.distance}>
                                  {team.bestGuess.distance ? formatDistance(team.bestGuess.distance) : ''}
                                </span>
                                {!isSinglePlayer && teamHealth && (
                                  <>
                                    {teamHealth.currentHealth <= 0 ? (
                                      <span className={`${styles.hpCurrent} ${styles.hpDead}`} style={getHealthStyle(teamHealth.currentHealth)}>
                                        💀
                                      </span>
                                    ) : (
                                      <span
                                        className={styles.hpCurrent}
                                        style={getHealthStyle(teamHealth.currentHealth)}
                                      >
                                        {teamHealth.currentHealth}
                                      </span>
                                    )}
                                    {teamHealth.damage > 0 && (
                                      <span className={styles.hpDamage}>-{teamHealth.damage}</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                );
              })
            )}
          </div>

          {isSinglePlayer && (
            <div className={styles.singlePlayerFooter}>
              <div className={styles.playerSummary}>
                {data?.player?.user?.icon && (
                  <Avatar
                    size={isMobile ? "default" : "large"}
                    src={`${CFBizUri}${data.player.user.icon}?x-oss-process=image/resize,h_40/quality,q_75`}
                    className={styles.playerAvatar}
                  />
                )}
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>
                    {data?.player?.user?.userName || '未知玩家'}
                  </div>
                  <div className={styles.playerStats}>
                    总得分: <span className={styles.statValue}>{singleTotals.score}</span> 分
                    | 总距离: <span className={styles.statValue}>{singleTotals.distance ? formatDistance(singleTotals.distance) : '--'} </span>
                    | 总用时: <span className={styles.statValue}>{singleTotals.time ? formatGuessTime(singleTotals.time) : '--'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isBattleRoyale && teams?.length > 0 && (
            <div className={styles.battleRoyaleFooter}>
              <div className={styles.battleRoyaleRanking}>
                <h4>最终结果</h4>
                <div className={styles.rankingList}>
                  {(() => {
                    let displayTeams: any[] = [];
                    if (data.type === 'rank') {
                      // 只显示前20名，按总分排序
                      const teamsWithTotalScore = teams.map(t => {
                        let score = 0;
                        if (t.teamUsers?.[0]?.guesses) {
                          score = t.teamUsers[0].guesses.reduce((acc: number, g: any) => acc + (g.score || 0), 0);
                        }
                        return { ...t, totalScore: score };
                      });
                      teamsWithTotalScore.sort((a, b) => b.totalScore - a.totalScore);
                      displayTeams = teamsWithTotalScore.slice(0, 20);
                      // 布局参照roundlist
                      return displayTeams.map((team, index) => {
                        const user = team.teamUsers?.[0]?.user;
                        const isAlive = team.health > 0;
                        const rank = index + 1;
                        return (
                          <div key={team.id} className={styles.rankingItem}>
                            <div className={styles.roundNumber}>#{rank}</div>
                            <div className={styles.battleRoyalePlayer}>
                              <div className={styles.playerInfo}>
                                {user?.icon && (
                                  <Avatar
                                    size={isMobile ? "small" : "default"}
                                    src={`${CFBizUri}${user.icon}?x-oss-process=image/resize,h_32/quality,q_95`}
                                    className={styles.playerAvatar}
                                  />
                                )}
                                <div className={styles.battleRoyaleDetails}>
                                  <div className={styles.playerName}>{user?.userName || '未知玩家'}</div>
                                  <div className={styles.distanceInfo}>
                                    <span className={styles.distance}>{team.totalScore} 分</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                    // 非rank模式，原有逻辑
                    const winners = teams.filter(team => team.health > 0);
                    const eliminated = teams.filter(team => team.health <= 0);
                    if (winners.length > 0) {
                      displayTeams.push(...winners.slice(0, 1));

                      const lastRoundEliminated: any[] = [];
                      const secondLastRoundEliminated: any[] = [];

                      if (data?.rounds) {
                        const lastRoundIndex = data.rounds.length - 1;
                        const secondLastRoundIndex = lastRoundIndex - 1;

                        if (data.rounds[lastRoundIndex]?.obsoleteTeamIds) {
                          data.rounds[lastRoundIndex].obsoleteTeamIds.forEach((teamId: string) => {
                            const team = teams.find(t => t.id === teamId);
                            if (team) {
                              const teamUser = team.teamUsers?.[0];
                              const lastGuess = teamUser?.guesses?.find((g: any) => g.round === lastRoundIndex + 1);
                              const distance = lastGuess ? calculateDistance(
                                lastGuess.lat,
                                lastGuess.lng,
                                data.rounds[lastRoundIndex].lat,
                                data.rounds[lastRoundIndex].lng
                              ) : null;

                              lastRoundEliminated.push({ ...team, lastRoundDistance: distance });
                            }
                          });
                        }

                        if (secondLastRoundIndex >= 0 && data.rounds[secondLastRoundIndex]?.obsoleteTeamIds) {
                          data.rounds[secondLastRoundIndex].obsoleteTeamIds.forEach((teamId: string) => {
                            const team = teams.find(t => t.id === teamId);
                            if (team) secondLastRoundEliminated.push(team);
                          });
                        }
                      }

                      lastRoundEliminated.sort((a, b) => {
                        if (a.lastRoundDistance === null && b.lastRoundDistance !== null) return 1;
                        if (a.lastRoundDistance !== null && b.lastRoundDistance === null) return -1;
                        if (a.lastRoundDistance !== null && b.lastRoundDistance !== null) {
                          return a.lastRoundDistance - b.lastRoundDistance;
                        }
                        return 0;
                      });

                      if (lastRoundEliminated.length >= 2) {
                        displayTeams.push(...lastRoundEliminated.slice(0, 2));
                      } else {
                        displayTeams.push(...lastRoundEliminated);
                        const needed = 3 - displayTeams.length;
                        displayTeams.push(...secondLastRoundEliminated.slice(0, needed));
                      }
                    } else {
                      const teamsWithStats = teams.map(team => ({
                        ...team,
                        roundsParticipated: getPlayerRoundsParticipated(team)
                      }));

                      teamsWithStats.sort((a, b) => {
                        if (a.roundsParticipated !== b.roundsParticipated) {
                          return b.roundsParticipated - a.roundsParticipated;
                        }
                        return b.health - a.health;
                      });

                      displayTeams = teamsWithStats.slice(0, 3);
                    }

                    while (displayTeams.length < 3 && displayTeams.length < teams.length) {
                      const remainingTeams = teams.filter(team => !displayTeams.find(dt => dt.id === team.id));
                      if (remainingTeams.length > 0) {
                        displayTeams.push(remainingTeams[0]);
                      } else {
                        break;
                      }
                    }

                    return displayTeams.map((team, index) => {
                      const user = team.teamUsers?.[0]?.user;
                      const isAlive = team.health > 0;
                      let originalRank = 1;
                      let totalScore = 0;
                      const allTeamsWithStats = teams.map((t: any) => ({
                        ...t,
                        roundsParticipated: getPlayerRoundsParticipated(t)
                      }));
                      allTeamsWithStats.sort((a: any, b: any) => {
                        if (a.roundsParticipated !== b.roundsParticipated) {
                          return b.roundsParticipated - a.roundsParticipated;
                        }
                        return b.health - a.health;
                      });
                      const current = allTeamsWithStats.findIndex((t: any) => t.id === team.id);
                      if (current !== -1) {
                        originalRank = current + 1;
                      }
                      return (
                        <div key={team.id} className={styles.rankingItem}>
                          <div className={`${styles.rankNumber} ${isAlive ? styles.alive : styles.eliminated}`}>
                            #{originalRank}
                          </div>
                          {user?.icon && (
                            <Avatar
                              size={isMobile ? "small" : "default"}
                              src={`${CFBizUri}${user.icon}?x-oss-process=image/resize,h_32/quality,q_95`}
                            />
                          )}
                          <div className={styles.rankInfo}>
                            <div className={styles.rankName}>
                              {user?.userName || '未知玩家'}
                            </div>
                            <div className={`${styles.rankStatus} ${isAlive ? styles.alive : styles.eliminated}`}>
                              {isAlive ? '胜出' : `淘汰`}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameBreakdown;
