import MapContainer from '@/components/Map/MapContainer';
import TargetMarker from '@/components/Map/TargetMarker';
import UserMarker from '@/components/Map/UserMarker';
import { getSoloGameInfo } from '@/services/api';
import { useSearchParams } from '@@/exports';
import { history } from '@umijs/max';
import 'maplibre-gl/dist/maplibre-gl.css';
import moment from 'moment';
import { useEffect, useMemo, useState, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';
import GameBreakdown from '@/components/Game/GameBreakdown';

const ReplayContainer = () => {
  const { map } = useMap();

  const [data, setData] = useState<API.GameInfo>();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');
  const [allRound, setAllRound] = useState(true);
  const [chooseRound, setChooseRound] = useState<number>();
  const [chooseUser, setChooseUser] = useState<number>();
  const [allUser, setAllUser] = useState(true);
  const [reportUserId, setReportUserId] = useState<number>();
  const [showReport, setShowReport] = useState(false);
  const [showReportChoose, setShowReportChoose] = useState(false);

  // 地图自动适配函数
  const fitMapBounds = () => {
    if (!map || !data) return;

    const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
    let hasValidPoints = false;

    // 添加目标点
    const targetRounds = data.rounds.filter(round =>
      allRound || chooseRound === round.round
    );

    targetRounds.forEach(round => {
      bounds[0] = Math.min(bounds[0], round.lng);
      bounds[1] = Math.min(bounds[1], round.lat);
      bounds[2] = Math.max(bounds[2], round.lng);
      bounds[3] = Math.max(bounds[3], round.lat);
      hasValidPoints = true;
    });

    // 添加猜测点
    data.teams?.forEach(team => {
      team.teamUsers.forEach(user => {
        if ((user.user.userId === chooseUser || allUser) && user.guesses) {
          user.guesses.forEach(guess => {
            if ((guess.round === chooseRound || allRound) &&
              guess.lat !== undefined && guess.lng !== undefined) {
              bounds[0] = Math.min(bounds[0], guess.lng);
              bounds[1] = Math.min(bounds[1], guess.lat);
              bounds[2] = Math.max(bounds[2], guess.lng);
              bounds[3] = Math.max(bounds[3], guess.lat);
              hasValidPoints = true;
            }
          });
        }
      });
    });

    // 添加单人模式的猜测点
    if (data.player?.guesses) {
      data.player.guesses.forEach(guess => {
        if ((guess.round === chooseRound || allRound) &&
          guess.lat !== undefined && guess.lng !== undefined) {
          bounds[0] = Math.min(bounds[0], guess.lng);
          bounds[1] = Math.min(bounds[1], guess.lat);
          bounds[2] = Math.max(bounds[2], guess.lng);
          bounds[3] = Math.max(bounds[3], guess.lat);
          hasValidPoints = true;
        }
      });
    }

    if (hasValidPoints && bounds[0] !== Infinity) {
      // 添加边距
      const padding = 0.1;
      const lngPadding = (bounds[2] - bounds[0]) * padding;
      const latPadding = (bounds[3] - bounds[1]) * padding;

      const finalBounds: [number, number, number, number] = [
        bounds[0] - lngPadding,
        bounds[1] - latPadding,
        bounds[2] + lngPadding,
        bounds[3] + latPadding
      ];

      try {
        map.fitBounds(finalBounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000
        });
      } catch (error) {
        console.warn('Failed to fit bounds:', error);
      }
    }
  };

  // 监听选择变化，触发地图适配
  useEffect(() => {
    const timer = setTimeout(() => {
      fitMapBounds();
    }, 100); // 延迟执行，确保地图已经渲染完成

    return () => clearTimeout(timer);
  }, [chooseRound, chooseUser, allRound, allUser, data, map]);

  const fetchData = async () => {
    if (gameId) {
      const res = await getSoloGameInfo({ gameId: gameId || '' });
      if (res && res.data) {
        setData(res.data);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [gameId]);

  // Calculate derived data
  const is2Teams = data?.teams && data.teams.length === 2;

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${(1000 * distance).toFixed(0)} m`;
    } else {
      return `${(distance).toFixed(2)} km`;
    }
  };

  const formatTime = (time: number) => {
    return moment(time).year() === moment().year()
      ? moment(time).month() === moment().month() &&
        moment(time).date() === moment().date()
        ? moment(time).format('今天 HH:mm')
        : moment(time).format('M月D日 HH:mm')
      : moment(time).format('YYYY年M月D日 HH:mm');
  };

  const formatDuration = (startTime: any, endTime: any) => {
    if (!endTime) return '尚未结束';
    const duration = moment.duration(moment(endTime).diff(moment(startTime)));
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    if (hours > 0) {
      return `${hours}小时${minutes}分${seconds}秒`;
    }
    else if (minutes > 0) {
      if (seconds === 0) return `${minutes}分`;
      return `${minutes}分${seconds}秒`;
    }
    else {
      return `${seconds}秒`;
    }
  };

  // Create lines between guesses and target for selected round/user
  const createGuessLines = useMemo(() => {
    if (!data) return { type: 'FeatureCollection', features: [] };

    const features: any[] = [];

    const targetRounds = data.rounds.filter(round =>
      allRound || chooseRound === round.round
    );

    targetRounds.forEach(round => {
      // Add lines for team guesses
      data.teams?.forEach((team, teamIndex) => {
        team.teamUsers.forEach(user => {
          if ((user.user.userId === chooseUser || allUser) && user.guesses) {
            const guess = user.guesses.find(g => g.round === round.round);
            if (guess && guess.lat !== undefined && guess.lng !== undefined) {
              features.push({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [[round.lng, round.lat], [guess.lng, guess.lat]],
                },
                properties: {
                  title: `${user.user.userName} - 第${round.round}轮`,
                  color: is2Teams ? (teamIndex === 0 ? '#ff4d4f' : '#3fa7ff') : '#ff942a'
                },
              });
            }
          }
        });
      });

      // Add lines for single player
      if (data.player?.guesses) {
        const guess = data.player.guesses.find(g => g.round === round.round);
        if (guess && guess.lat !== undefined && guess.lng !== undefined) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[round.lng, round.lat], [guess.lng, guess.lat]],
            },
            properties: {
              title: `${data.player.user.userName} - 第${round.round}轮`,
              color: '#ff942a'
            },
          });
        }
      }
    });

    return { type: 'FeatureCollection', features };
  }, [data, chooseRound, chooseUser, allRound, allUser, is2Teams]);

  // Calculate game summary for GameBreakdown (including single player)
  const gameSummary = useMemo(() => {
    if (!data) return [];

    // Single player mode
    if (data.player) {
      return data.rounds.map(round => {
        const guess = data.player.guesses?.find(g => g.round === round.round);
        return {
          round: round.round,
          teams: [{
            teamId: 'player',
            bestGuess: {
              score: guess?.score ?? 0,
              distance: guess?.distance ?? 0,
              lat: guess?.lat ?? 0,
              lng: guess?.lng ?? 0,
              user: data.player.user
            },
            damage: 0,
            health: 0
          }]
        };
      });
    }

    // Multi-player mode
    if (!data.teams) return [];

    return data.rounds.map(round => ({
      round: round.round,
      teams: data.teams!.map((team, teamIndex) => {
        const teamGuesses = team.teamUsers.flatMap(user =>
          user.guesses?.filter(g => g.round === round.round) || []
        );
        if (teamGuesses.length === 0) {
          return {
            teamId: `team-${teamIndex}`,
            bestGuess: { score: 0, distance: 0, lat: 0, lng: 0, user: null },
            damage: 0,
            health: data.health || 6000
          };
        }

        const bestGuess = teamGuesses.reduce((best, current) =>
          (current.score ?? 0) > (best.score ?? 0) ? current : best
        );

        return {
          teamId: `team-${teamIndex}`,
          bestGuess: {
            score: bestGuess.score ?? 0,
            distance: bestGuess.distance ?? 0,
            lat: bestGuess.lat ?? 0,
            lng: bestGuess.lng ?? 0,
            user: team.teamUsers.find(u =>
              u.guesses?.some(g => g.round === round.round && g.score === bestGuess.score)
            )?.user
          },
          damage: 0,
          health: data.health || 6000
        };
      })
    }));
  }, [data]);

  const rankLinesGeoJSON = useMemo(() => {
    if (!data) return { type: 'FeatureCollection', features: [] };

    const features = data.rounds.map((round) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [round.lng, round.lat],
      },
      properties: {
        title: `第${round.round}轮`,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [data]);

  // Setup dropdown items
  return (
    <>
      {/* 所有模式都使用GameBreakdown组件 */}
      {data && (
        <GameBreakdown
          gameSummary={gameSummary}
          teams={data?.teams || []}
          data={data}
          chooseRound={chooseRound}
          chooseUser={chooseUser}
          onRoundSelect={(round) => {
            if (round === 0) {
              setAllRound(true);
              setChooseRound(undefined);
            } else {
              setChooseRound(round);
              setAllRound(false);
            }
          }}
          onUserSelect={(userId) => {
            if (userId === undefined) {
              setChooseUser(undefined);
              setAllUser(true);
            } else {
              setChooseUser(userId);
              setAllUser(false);
            }
          }}
          formatDistance={formatDistance}
          formatTime={formatTime}
          formatDuration={formatDuration}
          isSinglePlayer={!!data.player}
          onReportPlayer={() => setShowReportChoose(true)}
          // Modal相关属性
          showReportChoose={showReportChoose}
          showReport={showReport}
          reportUserId={reportUserId}
          onReportChooseClose={() => setShowReportChoose(false)}
          onReportClose={() => {
            setShowReport(false);
            setReportUserId(undefined);
          }}
          onReportUserSelect={(userId) => {
            setShowReport(true);
            setShowReportChoose(false);
            setReportUserId(userId);
          }}
          mapContent={
            <MapContainer cursor="grab">
              <Source type="geojson" data={rankLinesGeoJSON}>
                <Layer
                  id="lines"
                  type="line"
                  paint={{ 'line-width': 2, 'line-dasharray': [0, 1, 1] }}
                />

                <Layer
                  id="symbols"
                  type="symbol"
                  layout={{
                    'symbol-placement': 'line-center',
                    'text-field': '{title}',
                    'text-font': ['OpenSansRegular'],
                    'text-size': 12,
                    'text-offset': [0, 1],
                  }}
                  paint={{ 'text-color': 'black' }}
                />
              </Source>

              {/* 添加猜测连接线 */}
              <Source type="geojson" data={createGuessLines}>
                <Layer
                  id="guess-lines"
                  type="line"
                  paint={{
                    'line-width': 2,
                    'line-color': 'black',
                    'line-opacity': 0.7,
                    'line-dasharray': [0, 1, 1]
                  }}
                />
              </Source>

              {data?.rounds.map((round) => {
                if (allRound || chooseRound === round.round) {
                  return (
                    <TargetMarker
                      key={`${round.round}`}
                      lat={round.lat}
                      lng={round.lng}
                      round={round.round}
                      onClick={() => {
                        const path = `/replay-pano?gameId=${gameId}&round=${round.round}&userId=${chooseUser ? chooseUser : (data?.playerIds || [1])[0]}`;
                        if (isMobile) history.push(path);
                        else window.open(`https://saiyuan.top${path}`);
                      }}
                    />
                  );
                } else return null;
              })}

              {data?.teams?.map((team, teamIndex) =>
                team.teamUsers.map((user) => {
                  if (user.user.userId === chooseUser || allUser) {
                    return user.guesses?.map((guess) => {
                      if (guess.round === chooseRound || allRound) {
                        return (
                          <UserMarker
                            key={`${user.user.userId}_${guess.round}`}
                            user={user.user}
                            guess={guess}
                            teamIndex={teamIndex}
                            is2Teams={!!is2Teams}
                            onClick={() =>
                              history.push('/user/' + user.user.userId)
                            }
                          />
                        );
                      } else return null;
                    });
                  } else return null;
                }),
              )}

              {data?.player?.guesses?.map((guess) => {
                if (guess.round === chooseRound || allRound) {
                  return (
                    <UserMarker
                      key={`${data?.player.user.userId}_${guess.round}`}
                      user={data?.player.user}
                      guess={guess}
                      onClick={() => {
                        history.push('/user/' + data?.player.user.userId);
                      }}
                    />
                  );
                } else return null;
              })}
            </MapContainer>
          }
        />
      )}
    </>
  );
};

export default ReplayContainer;
