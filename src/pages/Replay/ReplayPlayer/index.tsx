import Countdown, { CountdownHandle } from '@/components/Game/Countdown/Replay';
import Panorama, { PanoramaRef } from '@/components/Map/GoogleMap/Panorama';
import MapContainer from '@/components/Map/MapContainer';
import ReplayControls from '@/components/Map/ReplayControls/ReplayControls';
import TargetMarker from '@/components/Map/TargetMarker';
import UserMarker from '@/components/Map/UserMarker';
import { CFBizUri, publicPath } from '@/constants';
import { useLoadGoogle } from '@/hooks/use-load-google';
import NormalPage from '@/pages/NormalPage';
import UserReportModal from '@/pages/User/UserReportModal';
import { getRecords, getSoloGameInfo } from '@/services/api';
import { qixunCopy } from '@/utils/CopyUtils';
import { useSearchParams } from '@@/exports';
import { DownOutlined, CloseOutlined } from '@ant-design/icons';
import { FiMap } from '@react-icons/all-files/fi/FiMap';
import { history, useModel } from '@umijs/max';
import { Avatar, Button, Dropdown, Modal, message } from 'antd';
import {
  FC,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isMobile } from 'react-device-detect';
import { Marker } from 'react-map-gl/maplibre';
import { startReplay } from './replayer';
import styles from './style.less';

const ReplayPlayer: FC = () => {
  const [data, setData] = useState<API.GameInfo | undefined>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showReportChoose, setShowReportChoose] = useState<boolean>(false);
  const [reportUserId, setReportUserId] = useState<number | undefined>();
  const [replayData, setReplayData] = useState<any>(undefined);
  const [map, setMap] = useState<any>(null);
  const [mapShow, setMapShow] = useState<boolean>(false);
  const panoRef = useRef<PanoramaRef | null>(null);
  const [mapSize, setMapSize] = useState(1);
  const [mapActive, setMapActive] = useState<boolean>(false); // 地图是否激活（放大状态），用于回放时控制
  const [playing, setPlaying] = useState<boolean>(false);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [timerStartTime, setTimerStartTime] = useState<number>(0);
  const [alarm, setAlarm] = useState<boolean>(false);
  const replayInstance = useRef<any>(null);
  const countdownRef = useRef<CountdownHandle>(null);
  const [markersVisible, setMarkersVisible] = useState(true);
  const [hasMobile, setHasMobile] = useState<boolean>(false);

  const { user, isInApp } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
    isInApp: model.initialState?.isInApp,
  }));

  const gameId = searchParams.get('gameId')!;
  const round = Number(searchParams.get('round'));
  const userId = Number(searchParams.get('userId'));

  const [roundInfo, setRoundInfo] = useState<API.GameRound | undefined>();
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
    opacity: number;
  } | null>(null);
  const [chooseRound, setChooseRound] = useState<number>(round);
  const [chooseUser, setChooseUser] = useState<number>(userId);
  const [chooseUserName, setChooseUserName] = useState<string>();
  const [teamPins, setTeamPins] = useState<any>({});
  const [teamHints, setTeamHints] = useState<any>({});

  useLoadGoogle({ setLoaded });

  useEffect(() => {
    if (!user?.userId) {
      history.push(
        `/user/login?redirect=/replayplayer?gameId=${gameId}&userId=${userId}&round=${round}`,
      );
    }
  }, [user]);

  const fetchReplayData = async (playerId: number, round: number) => {
    try {
      const data = await getRecords({
        gameId: gameId || '',
        userId: playerId,
        round,
      });
      if (data?.success && data.data.records.length > 0) {
        const filtered_records = data.data.records.map((item) => {
          if (String(item.time).length < 13) item.time = 10 * item.time;
          return item;
        });
        const records = filtered_records.sort((a, b) => a.time - b.time);
        setReplayData(records);
        setHasMobile(records.some((item) => 'MobileMap' === item.action));
        if (isMobile) setHasMobile(true);
      } else {
        setReplayData([]);
        if (data && data.data?.game?.gmtCreate + 30 * 24 * 3600 * 1000 < Date.now()) {
          message.warning('该局游戏回放数据已过期', 5);
        } else {
          message.warning('该局游戏暂无回放数据', 5);
        }
      }
    } catch (error) {
      console.error('请求回放数据失败', error);
    }
  };

  // 禁止街景交互
  const forbidInteraction = () => {
    const canvas = document.getElementById('viewer');
    if (!canvas) return;

    const mouseEvent = (event: Event) => {
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    };

    [
      'mousedown',
      'mousemove',
      'pointerdown',
      'pointermove',
      'touchdown',
      'touchmove',
    ].forEach((eventType) => {
      canvas.addEventListener(eventType, mouseEvent, {
        capture: true,
        passive: true,
      });
    });
  };

  const resetSpeed = (speed: number) => {
    if (countdownRef.current) {
      countdownRef.current.resetSpeed(speed);
    }
  };

  const resetSeconds = (seconds: number) => {
    if (countdownRef.current) {
      countdownRef.current.resetSeconds(seconds);
    }
  };

  const pauseAndResume = () => {
    if (countdownRef.current) {
      countdownRef.current.pauseAndResume();
    }
  };

  const initMapView = () => {
    if (map) {
      if (isMobile) setMapShow(false);
      else setMapSize(1);
      map.resize();
      if (
        data?.mapMaxLat &&
        data?.mapMinLat &&
        data?.mapMinLng &&
        data?.mapMaxLng
      ) {
        map.fitBounds(
          [
            [data.mapMaxLng, data.mapMaxLat],
            [data.mapMinLng, data.mapMinLat],
          ],
          { padding: 10, linear: true, duration: 0 },
        );
      } else if (data?.centerLat && data?.centerLng && data?.mapZoom) {
        map.setZoom(data.mapZoom);
        map.setCenter([data.centerLng, data.centerLat]);
      } else {
        data?.china ? map.setZoom(1) : map.setZoom(0);
        data?.china
          ? map.setCenter([106.0, 38.0])
          : map.setCenter([0.5, -14.5]);
      }
    }
  };

  const roundItems = useMemo(() => {
    if (data) {
      return [
        ...data.rounds.map((round) => ({
          key: round.round,
          label: `第${round.round}轮`,
          onClick: () => {
            setChooseRound(round.round);
          },
        })),
      ];
    }
  }, [data]);

  const userItems = useMemo(() => {
    if (data) {
      // @ts-ignore
      return [
        // @ts-ignore
        ...data.teams
          ?.map((team) =>
            team.teamUsers.map((user) => ({
              key: user.user.userId,
              label: user.user.userName,
              onClick: () => {
                setChooseUser(user.user.userId);
              },
            })),
          )
          .reduce((acc, cur) => [...acc, ...cur], []),
      ];
    }
  }, [data]);

  const resetWindow = () => {
    const body = document.body;
    body.style.width = '';
    body.style.height = '';
    body.style.position = '';
    body.style.left = '';
  };

  useEffect(() => {
    const body = document.body;

    if (hasMobile && !isMobile) {
      const playerWindow = replayData?.find(
        (item: any) => item.action === 'playerWindow',
      ) || { data: '[390,844]' };

      const playerWidth = JSON.parse(playerWindow.data)[0];
      const playerHeight = JSON.parse(playerWindow.data)[1];

      window.innerWidth = playerWidth;
      window.innerHeight = playerHeight;

      if (playerWidth < playerHeight) {
        body.style.width = `${(window.innerWidth * 100) / window.innerHeight
          }vh`;
        body.style.height = '100vh';
        body.style.position = 'absolute';
        body.style.left = `${((window.outerWidth - playerWidth) * 48) / window.outerWidth
          }vw`;
      } else {
        resetWindow();
      }
    } else {
      resetWindow();
    }
  }, [hasMobile, replayData]);

  useEffect(() => {
    if (chooseUser && chooseRound && gameId) {
      fetchReplayData(chooseUser, chooseRound);
      const nextParams: Record<string, string> = { gameId };
      if (chooseUser) nextParams.userId = chooseUser.toString();
      if (chooseRound) nextParams.round = chooseRound.toString();
      setSearchParams(nextParams, { replace: true });
    }
  }, [chooseRound, chooseUser, gameId, setSearchParams]);

  const onTarget = () => {
    if (!map) return;

    // 查找当前选择用户的猜测位置
    let targetGuess = null;

    data?.teams?.forEach((team) => {
      team.teamUsers?.forEach((userItem) => {
        if (userItem.user.userId === chooseUser) {
          targetGuess = userItem.guesses?.find((guess) => guess.round === chooseRound);
        }
      });
    });

    // 如果没找到，检查单人玩家
    if (!targetGuess && data?.player) {
      targetGuess = data.player.guesses?.find((guess) => guess.round === chooseRound);
    }

    // 如果找到了猜测位置，移动地图到该位置
    if (targetGuess) {
      setMapSize(1);
      map.resize();
      map.setCenter([targetGuess.lng, targetGuess.lat]);
      map.setZoom(5);
    }
  };

  useEffect(() => {
    if (replayData) onTarget();

    if (replayData && replayData.length > 0) {
      const firstTime = replayData[0].time;
      const endTime = replayData[replayData.length - 1].time;
      const confirmTime = replayData.find(
        (item: any) => item.action === 'Confirm',
      )?.time;
      // 优先使用 Confirm 时间，其次使用实际数据的最后时间
      // 不使用 roundInfo?.endTime，因为可能大于实际记录的时间
      const timeConsume = (confirmTime || endTime) - firstTime;

      // 如果有 Confirm 事件且在数据末尾之前，过滤掉 Confirm 之后的数据
      if (timeConsume < endTime - firstTime) {
        const filteredReplayData = replayData.filter(
          (item: any) => item.time <= firstTime + timeConsume,
        );
        setReplayData(filteredReplayData);
        return; // 提前返回，等待下次 effect 重新计算 totalTime
      }
      setTotalTime(timeConsume / 1000);
    } else {
      setTotalTime(0);
    }

    // 清理旧的回放实例
    if (replayInstance.current) {
      replayInstance.current.stop();
      replayInstance.current = null;
      setPlaying(false);
      setTeamPins({});
      setTeamHints({});
      setMarkersVisible(true);
    }
  }, [data, replayData]);

  // 获取游戏信息和回合数据
  useEffect(() => {
    if (gameId) {
      getSoloGameInfo({ gameId }).then((res) => {
        if (res.success) {
          setData(res.data);
        }
      });
    }
  }, [gameId]);

  // 当选择轮次变化时，更新轮次信息
  useEffect(() => {
    if (chooseRound && data) {
      const roundInfo = data.rounds.find((r) => r.round === chooseRound);
      setRoundInfo(roundInfo);

      if (roundInfo?.timerStartTime) {
        setTimerStartTime(roundInfo.timerStartTime);
      }
    }
  }, [chooseRound, data]);

  useEffect(() => {
    if (chooseUser && data) {
      let userName = '';
      for (const team of data.teams || []) {
        const player = team.users.find(p => p.userId === chooseUser);
        if (player) {
          userName = player.userName;
          break;
        }
      }
      if (userName) setChooseUserName(userName);
    }
  }, [chooseUser, data]);

  useLayoutEffect(() => {
    if (panoRef.current?.panorama) {
      panoRef.current.panorama.setOptions({
        linksControl: false,
        clickToGo: false,
        disableDoubleClickZoom: true,
        scrollwheel: false,
      });
      forbidInteraction();
    }
  }, [loaded, roundInfo]);

  const handleMapLoad = (loadedMap: any) => {
    setMap(loadedMap);
    if (isMobile) setMapShow(false);
    else setMapSize(1);
  };

  const is2Teams = useMemo(() => {
    return (
      data && ['solo', 'solo_match', 'team', 'team_match'].includes(data.type)
    );
  }, [data]);

  const initReplayer = () => {
    if (!panoRef.current || !map || !replayData || !data) return;

    replayInstance.current = startReplay({
      events: replayData,
      panorama: panoRef.current.panorama,
      guessMap: map,
      playSpeed,
      timerStartTime,
      timerLeftTime: data?.type === 'daily_challenge' ? 180 : 15,
      pinOnMap: (lat, lng, opacity) => {
        setMarkerPosition({ lat, lng, opacity });
      },
      setTeamPins: (userId, lat, lng, opacity) => {
        setTeamPins(prev => ({ ...prev, [userId]: { lat, lng, opacity } }));
      },
      setTeamHints: (userId, lat, lng) => {
        setTeamHints(prev => ({ ...prev, [userId]: { lat, lng } }));
      },
      setMapSize: (size: number, active?: boolean) => {
        setMapSize(size);
        // 如果传入了 active 参数，则设置地图激活状态
        if (active !== undefined) {
          setMapActive(active);
        }
      },
      setMapShow: (isMapShow: boolean) => {
        setMapShow(isMapShow);
      },
      setAlarm: (timer) => {
        setAlarm(timer);
      },
      resetSeconds: (seconds) => {
        resetSeconds(seconds);
      },
      resetSpeed: (speed) => {
        resetSpeed(speed);
      },
      pauseAndResume: pauseAndResume,
      onStart: () => {
        if (panoRef.current) panoRef.current.reset();
        setMarkersVisible(false);
        initMapView();
        setPlaying(true);
      },
      onEnd: () => {
        setTimeout(() => {
          setMarkerPosition({ lat: 0, lng: 0, opacity: 0 });
          setPlaying(false);
          setMarkersVisible(true);
          replayInstance.current = null;
        }, 500);
      },
    });
  };

  const handlePlayPause = () => {
    if (!replayData || replayData.length < 1) return;

    setTeamPins({});
    setTeamHints({});

    if (replayInstance.current) {
      if (playing) {
        replayInstance.current.pause();
      } else {
        replayInstance.current.resume();
      }
      setPlaying(!playing);
    } else {
      initReplayer();
      replayInstance.current.start();
    }
  };

  const handleRewind = () => replayInstance?.current?.rewind();
  const handleFastForward = () => replayInstance?.current?.fastForward();
  const handleSeek = (value: number) => {
    if (replayInstance && replayInstance.current)
      replayInstance.current.seek(value);
  };
  const handleChangeSpeed = (speed: number) => {
    setPlaySpeed(speed);
    if (replayInstance && replayInstance.current)
      replayInstance.current.changeSpeed(speed);
  };

  // 倍速循环切换：1x -> 2x -> 5x -> 0.5x -> 1x
  const handleSpeedCycle = () => {
    const speedCycle = [1, 2, 5, 0.5];
    const currentIndex = speedCycle.indexOf(playSpeed);
    const nextIndex = (currentIndex + 1) % speedCycle.length;
    const nextSpeed = speedCycle[nextIndex];
    handleChangeSpeed(nextSpeed);
  };

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果用户在输入框中，不触发快捷键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleRewind();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleFastForward();
          break;
        case 'KeyS':
          e.preventDefault();
          handleSpeedCycle();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playing, replayData, replayInstance, playSpeed]);

  return (
    <NormalPage feedbackButton={false}>
      <div className={hasMobile ? styles.inApp : ''}>
        <div className={`${styles.select} ${isInApp ? styles.inApp : ''}`}>
          <Dropdown
            menu={{ items: roundItems }}
            trigger={['click']}
            overlayStyle={{ maxHeight: '70vh', overflow: 'auto' }}
          >
            <Button
              style={{ backgroundColor: 'black', pointerEvents: 'auto' }}
              onClick={(e) => e.preventDefault()}
            >
              {`第${chooseRound}轮`}
              <DownOutlined />
            </Button>
          </Dropdown>
          {data?.teams && data?.teams.length !== 0 && (
            <Dropdown
              menu={{ items: userItems }}
              trigger={['click']}
              overlayStyle={{ maxHeight: '70vh', overflow: 'auto' }}
            >
              <Button
                style={{ backgroundColor: 'black', pointerEvents: 'auto' }}
                onClick={(e) => e.preventDefault()}
              >
                {chooseUserName}
                <DownOutlined />
              </Button>
            </Dropdown>
          )}
        </div>
        {loaded && roundInfo && <Panorama round={roundInfo} ref={panoRef} />}
        <div
          className={`${styles.mapBox} ${hasMobile ? '' : styles[`mapSize${mapSize}`] // 仅在非手机设备上应用 mapSize 样式
            } ${(hasMobile && mapShow) || (!hasMobile && (mapActive || !playing)) ? styles.mapBoxActive : ''}`}
        >
          <div className={styles.mapWrapper}>
            <MapContainer cursor="grab" onMapLoad={handleMapLoad}>
              {markersVisible &&
                data?.rounds.map(
                  (roundItem) =>
                    roundItem.round === chooseRound && (
                      <TargetMarker
                        key={roundItem.round}
                        lat={roundItem.lat}
                        lng={roundItem.lng}
                        round={roundItem.round}
                        onClick={() => {
                          const path = `/replay-pano?gameId=${gameId}&round=${roundItem.round}`;
                          if (isMobile) {
                            history.push(path);
                          } else {
                            window.open(`https://saiyuan.top${path}`);
                          }
                        }}
                      />
                    ),
                )}
              {markersVisible &&
                data?.teams?.map((team, teamIndex) =>
                  team.teamUsers.map((userItem) =>
                    userItem.guesses?.map(
                      (guess) =>
                        guess.round === chooseRound && (
                          <UserMarker
                            key={`${userItem.user.userId}_${guess.round}`}
                            user={userItem.user}
                            guess={guess}
                            teamIndex={teamIndex}
                            is2Teams={is2Teams}
                            onClick={() =>
                              history.push(`/user/${userItem.user.userId}`)
                            }
                          />
                        ),
                    ),
                  ),
                )}
              {markersVisible &&
                data?.player?.guesses.map(
                  (guess) =>
                    guess.round === chooseRound && (
                      <UserMarker
                        key={`${data.player.user.userId}_${guess.round}`}
                        user={data.player.user}
                        guess={guess}
                        onClick={() =>
                          history.push(`/user/${data.player.user.userId}`)
                        }
                      />
                    ),
                )}
              {!markersVisible &&
                markerPosition &&
                markerPosition.lat !== 0 &&
                data?.teams?.map((team) =>
                  team.teamUsers.map(
                    (userItem) =>
                      userItem.user.userId === chooseUser &&
                      userItem.guesses?.map(
                        (guess) =>
                          guess.round === chooseRound && (
                            <Marker
                              anchor="center"
                              key={`${userItem.user.userId}_${guess.round}`}
                              latitude={markerPosition.lat}
                              longitude={markerPosition.lng}
                              offset={[0, -21]}
                              style={{
                                height: '42px',
                                backgroundImage: `url(${publicPath}/images/marker_background_yellow.png)`,
                                backgroundSize: '100%',
                                backgroundRepeat: 'no-repeat',
                                opacity: markerPosition.opacity,
                              }}
                            >
                              <Avatar
                                src={`${CFBizUri}${userItem.user.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
                                style={{ border: '2px solid #FF9427' }}
                              />
                            </Marker>
                          ),
                      ),
                  ),
                )}
              {!markersVisible &&
                teamPins &&
                data?.teams?.map((team) =>
                  team.teamUsers.map(
                    (userItem) =>
                      userItem.user.userId != chooseUser &&
                      userItem.guesses?.map(
                        (guess) =>
                          guess.round === chooseRound &&
                          teamPins[userItem.user.userId] && (
                            <Marker
                              anchor="center"
                              key={`${userItem.user.userId}_${guess.round}`}
                              latitude={teamPins[userItem.user.userId].lat}
                              longitude={teamPins[userItem.user.userId].lng}
                              offset={[0, -21]}
                              style={{
                                height: '42px',
                                backgroundImage: `url(${publicPath}/images/marker_background_yellow.png)`,
                                backgroundSize: '100%',
                                backgroundRepeat: 'no-repeat',
                                opacity: teamPins[userItem.user.userId].opacity,
                              }}
                            >
                              <Avatar
                                src={`${CFBizUri}${userItem.user.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
                                style={{ border: '2px solid #FF9427' }}
                              />
                            </Marker>
                          ),
                      ),
                  ),
                )}
              {!markersVisible &&
                teamHints &&
                data?.teams?.map((team) =>
                  team.teamUsers.map(
                    (userItem) =>
                      userItem.user.userId != chooseUser &&
                      userItem.guesses?.map(
                        (guess) =>
                          guess.round === chooseRound &&
                          teamHints[userItem.user.userId] && (
                            <Marker
                              anchor="center"
                              key={`${userItem.user.userId}_${guess.round}`}
                              latitude={teamHints[userItem.user.userId].lat}
                              longitude={teamHints[userItem.user.userId].lng}
                              offset={[0, -21]}
                              style={{
                                height: '42px',
                                backgroundImage: `url(${publicPath}/images/marker_background_yellow.png)`,
                                backgroundSize: '100%',
                                backgroundRepeat: 'no-repeat',
                                opacity: 0.5,
                              }}
                            >
                              <Avatar
                                src={`${CFBizUri}${userItem.user.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
                                style={{ border: '2px solid #FF9427' }}
                              />
                            </Marker>
                          ),
                      ),
                  ),
                )}
              {!markersVisible &&
                markerPosition &&
                markerPosition.lat !== 0 &&
                data?.player?.guesses?.map(
                  (guess) =>
                    guess.round === chooseRound && (
                      <Marker
                        anchor="center"
                        key={`${data.player.user.userId}_${guess.round}`}
                        latitude={markerPosition.lat}
                        longitude={markerPosition.lng}
                        offset={[0, -21]}
                        style={{
                          height: '42px',
                          backgroundImage: `url(${publicPath}/images/marker_background_yellow.png)`,
                          backgroundSize: '100%',
                          backgroundRepeat: 'no-repeat',
                          opacity: markerPosition.opacity,
                        }}
                      >
                        <Avatar
                          src={`${CFBizUri}${data.player.user.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
                          style={{ border: '2px solid #FF9427' }}
                        />
                      </Marker>
                    ),
                )}
            </MapContainer>
            <div
              className={`${styles.mapContainerClose} ${isInApp ? styles.appBtn : ''
                }`}
            >
              <Button
                type="primary"
                shape="circle"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setMapShow(false);
                }}
              />
            </div>
          </div>
        </div>
        <div className={styles.timer}>
          {alarm && (
            <Countdown
              ref={countdownRef}
              hasNewCompass={false}
              setAlarm={setAlarm}
              timeleft={data?.type === 'daily_challenge' ? 180 : 15}
              speed={playSpeed || 1}
            />
          )}
        </div>
        <div className={styles.mobileBtn}>
          <Button
            shape="circle"
            type="primary"
            icon={<FiMap />}
            onClick={(e) => {
              e.stopPropagation();
              setMapShow(true);
            }}
          />
        </div>
        <div className={`${styles.buttons} ${isInApp ? styles.inApp : ''}`}>
          <Button
            className={styles.customButton}
            onClick={() => (location.href = `/replay?gameId=${gameId}`)}
          >
            地图复盘
          </Button>
          <Button
            className={styles.customButton}
            onClick={() =>
              qixunCopy(
                `https://saiyuan.top/replayplayer?gameId=${gameId}&userId=${chooseUser}&round=${chooseRound}`,
              )
            }
          >
            复制链接
          </Button>
          {!isMobile && hasMobile && (
            <Button
              className={styles.customButton}
              onClick={() => setHasMobile(!hasMobile)}
            >
              切换模式
            </Button>
          )}
          {data && !data.player && (
            <Button
              style={{ backgroundColor: 'black' }}
              onClick={() => setShowReportChoose(true)}
            >
              举报
            </Button>
          )}
        </div>
        {
          <ReplayControls
            hasMobile={hasMobile}
            isPlaying={playing}
            totalTime={totalTime}
            currentSpeed={playSpeed}
            onPlayPause={handlePlayPause}
            onRewind={handleRewind}
            onFastForward={handleFastForward}
            onSeek={handleSeek}
            onChangeSpeed={handleChangeSpeed}
          />
        }
        <Modal
          open={showReportChoose}
          okButtonProps={{ style: { display: 'none' } }}
          onCancel={() => setShowReportChoose(false)}
          title="选择您要举报的用户"
        >
          {data?.teams?.map((team) =>
            team.teamUsers.map(
              (player) =>
                player.user.userId != user?.userId && (
                  <Button
                    key={player.user.userId}
                    style={{ marginRight: '5px' }}
                    onClick={() => {
                      setShowReport(true);
                      setShowReportChoose(false);
                      setReportUserId(player.user.userId);
                    }}
                  >
                    {player.user.userName}
                  </Button>
                ),
            ),
          )}
        </Modal>
        {reportUserId && showReport && (
          <UserReportModal
            userId={reportUserId}
            open={showReport}
            source="replay"
            gameType={data?.type}
            partyId={data?.partyId}
            gameId={gameId}
            onClose={() => {
              setShowReport(false);
              setReportUserId(undefined);
            }}
          />
        )}
        {roundInfo && data && (
          <div className={styles.verson}>
            uid:{user?.userId}｜{data?.move ? '移动' : '固定'}｜
            {data?.pan ? '自由' : '固定视角'}｜{data?.mapsName}
          </div>
        )}
      </div>
    </NormalPage>
  );
};

export default ReplayPlayer;
