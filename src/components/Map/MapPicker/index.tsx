import { CFBizUri, publicPath } from '@/constants';
import { logServer, getUATime } from '@/services/api';
import { settings } from '@/services/valtio';
import { CloseOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { FiMap } from '@react-icons/all-files/fi/FiMap';
import { TbPin } from '@react-icons/all-files/tb/TbPin';
import { TbPinnedOff } from '@react-icons/all-files/tb/TbPinnedOff';
import { history, useModel, useSnapshot } from '@umijs/max';
import { useKeyPress } from 'ahooks';
import { Avatar, Badge, Button, notification } from 'antd';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { CaretRight } from 'react-iconly';
import { MapLayerMouseEvent, Marker, useMap } from 'react-map-gl/maplibre';
import MapContainer from '../MapContainer';
import { MapEventHandler } from './MapEventHandler';
import styles from './style.less';

type MapPickerProps = {
  model: CompetitionModel;
};

const MapPicker: FC<MapPickerProps> = ({ model }) => {
  const { map } = useMap();
  const { mapSize, mapPin } = useSnapshot(settings);

  const { user, isInApp } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
    isInApp: model.initialState?.isInApp,
  }));

  const [hintUpdate, setHintUpdate] = useState<number>(0);

  // 防连点：confirm 操作的 ref 锁
  const confirmingRef = useRef(false);
  // 防 ghost click：round 切换后短暂屏蔽地图选点
  const pickSuppressUntilRef = useRef<number>(0);

  //监听器实例
  const [mapHandler, setMapHandler] = useState<MapEventHandler | undefined>(
    undefined,
  );

  const {
    confirmed,
    onConfirm,
    onPickLocation,
    pickCoord,
    setPickCoord,
    teams,
    currentRound,
    playerIds,
    gameData,
  } = useModel(model, (model) => ({
    confirmed: model.confirmed,
    onConfirm: model.onConfirm,
    onPickLocation: model.onPickLocation,
    pickCoord: model.pickCoord,
    setPickCoord: model.setPickCoord,
    currentRound: model.gameData?.currentRound,
    teams: model.gameData?.teams,
    playerIds: model.gameData?.playerIds,
    gameData: model.gameData,
  }));

  // 判断是否是观战者
  const isObserver = useMemo(
    () => playerIds && !playerIds.includes(user?.userId ?? 0),
    [playerIds, user?.userId],
  ) as boolean;

  // 设置缩放
  const setZoom = (isIn?: boolean) => {
    if (isIn === false) {
      return map?.setZoom(map?.getZoom() - 1);
    }
    map?.setZoom(Math.floor(map.getZoom()) + 1);
  };

  // 选点操作（带 ghost click 防护）
  const handlePick = useCallback((e: MapLayerMouseEvent) => {
    // 判断是否登录
    if (!user?.userId) {
      history.push('/user/login?redirect=/point');
      return;
    }

    // round 切换后短暂忽略点击，防止上一题的连点穿透到下一题
    if (Date.now() < pickSuppressUntilRef.current) return;

    onPickLocation(e.lngLat.lat, e.lngLat.lng);
  }, [user?.userId, onPickLocation]);

  // 确认操作（ref 锁防连点）
  const handleConfirm = useCallback(() => {
    // 已确认则忽略
    if (confirmed) return;

    // ref 级别防连点：快速连按只有第一次生效
    if (confirmingRef.current) return;
    confirmingRef.current = true;

    // 判断是否登录
    if (!user?.userId) {
      history.push('/user/login?redirect=/point');
      confirmingRef.current = false;
      return;
    }

    // 判断是否选点
    if (!pickCoord) {
      notification.warning({ message: '请先选择地点' });
      confirmingRef.current = false;
      return;
    }

    onConfirm(pickCoord.latitude, pickCoord.longitude);
    if (mapHandler) mapHandler.recordEvent('Confirm', [pickCoord.latitude, pickCoord.longitude]);
  }, [confirmed, user?.userId, pickCoord, onConfirm, mapHandler]);

  // 空格确认
  useKeyPress('space', handleConfirm);

  const handleF12Press = () => {
    if (mapHandler) {
      getUATime({ extra: 'f12' });
      mapHandler.recordEvent('F12', 'on');
      if (currentRound) mapHandler.uploadData(currentRound, gameData?.id);
    }
  };

  useKeyPress('F12', handleF12Press);

  useKeyPress(
    (event) => event.key === 'I' && event.metaKey && event.altKey,
    handleF12Press,
  );

  useKeyPress(
    (event) => event.key === 'I' && event.ctrlKey && event.shiftKey,
    handleF12Press,
  );

  const initMapView = () => {
    if (map) {
      map.resize();
      if (
        gameData?.mapMaxLat &&
        gameData?.mapMinLat &&
        gameData?.mapMinLng &&
        gameData?.mapMaxLng
      ) {
        map.fitBounds(
          [
            [gameData.mapMaxLng, gameData.mapMaxLat],
            [gameData.mapMinLng, gameData.mapMinLat],
          ],
          { padding: 10, linear: true, duration: 0 },
        );
      } else if (
        gameData?.centerLat &&
        gameData?.centerLng &&
        gameData?.mapZoom
      ) {
        map.setZoom(gameData.mapZoom);
        map.setCenter([gameData.centerLng, gameData.centerLat]);
      } else {
        map.setZoom(1);
        map.setCenter([106.0, 38.0]);
      }
    }
  };

  // confirmed 变为 false 时重置防连点锁；变为 true 时设置选点抑制
  useEffect(() => {
    if (!confirmed) {
      confirmingRef.current = false;
      // 新回合开始，短暂屏蔽地图选点防止 ghost click 串题
      pickSuppressUntilRef.current = Date.now() + 800;
    }
  }, [confirmed]);

  useEffect(() => {
    // 重置选点
    setPickCoord(undefined);
    if (map) {
      initMapView();
    }
  }, [map]);

  useEffect(() => {
    // 初始化 MapEventHandler 实例
    if (!mapHandler && (gameData?.type === 'daily_challenge' || gameData?.record)) {
      const handler = new MapEventHandler();
      setMapHandler(handler); // 创建并设置 MapEventHandler 实例
    }

    // 清理事件监听器
    return () => {
      if (mapHandler) {
        //在重置map前上传地图事件
        if (currentRound) mapHandler.uploadData(currentRound, gameData?.id);

        mapHandler.removeAllListeners();
        mapHandler.stopAutoSave();
        mapHandler.clearEvents();
        setMapHandler(undefined); // 清空 handler
      }
    };
  }, [map]);

  //根据是否作出猜测控制地图事件监听
  useEffect(() => {
    if (mapHandler) {
      if (confirmed) {
        if (currentRound) mapHandler.uploadData(currentRound, gameData?.id);

        mapHandler.removeAllListeners(); // 清理之前添加的监听器
        // clearEvents 不需要调用：uploadData 成功会自动删除该轮数据，失败则保留以便重试
      } else {
        if (map && currentRound) {
          mapHandler.setTarget(map); // 设置地图目标
          mapHandler.initRound(currentRound, gameData?.id); // 初始化回合数据
          mapHandler.addListeners();
          mapHandler.recordEvent('playerWindow', [window.innerWidth, window.innerHeight])
          // 记录初始地图状态
          // 使用 mapPin 判断：mapPin 为 true 表示地图固定放大显示
          // 注：bigMap 在初始化时总是 false，所以这里只检查 mapPin
          mapHandler.recordEvent('MapStyle', mapPin ? Number(mapSize) : 0);
        }
      }
    }
  }, [map, confirmed, currentRound]);

  const backgroundImage = useMemo(() => {
    if (!teams || 0 === teams?.length) {
      return 'marker_background_yellow.png';
    }

    if (!user) {
      return 'marker_background_yellow.png';
    }

    if (teams?.[0]?.users.find((u) => u.userId === user?.userId)) {
      return 'marker_background_red.png';
    } else {
      return 'marker_background_blue.png';
    }
  }, [teams, user]);

  // 队伍标记(用于比赛时显示队友的标记)
  const teamsMarkers = useMemo(
    () => {
      let markers =
        teams
          ?.find((team) => team.users.find((u) => u.userId === user?.userId))
          ?.teamUsers.map((u) => {
            const guess = u.guesses?.find((g) => g.round === currentRound);
            // 没有选位置并且排除自己的位置
            if (guess && u.user.userId !== user?.userId) {
              if (mapHandler) mapHandler.recordEvent('TeammateConfirm', [u.user.userId, guess.lat, guess.lng]);
              return (
                <Marker
                  key={`${u.user.userId}guess`}
                  longitude={guess.lng}
                  latitude={guess.lat}
                  anchor="bottom"
                  pitchAlignment="map"
                  offset={[0, 0]}
                  style={{
                    height: '42px',
                    backgroundImage: `url(${publicPath}/images/${backgroundImage})`,
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
                      style={{ border: '2px solid #13c2c2' }}
                    />
                  </Badge>
                </Marker>
              );
            }
            return null;
          })
          .filter((marker) => !!marker) ?? [];

      markers = [
        ...markers,
        ...(teams
          ?.find((team) => team.users.find((u) => u.userId === user?.userId))
          ?.teamUsers.map((u) => {
            const guess = u.guesses?.find((g) => g.round === currentRound);
            if (!guess && u.pin && u.user.userId !== user?.userId) {
              if (mapHandler) mapHandler.recordEvent('TeammatePin', [u.user.userId, u.pin.lat, u.pin.lng]);
              return (
                <Marker
                  key={`${u.user.userId}pin`}
                  longitude={u.pin.lng}
                  latitude={u.pin.lat}
                  anchor="bottom"
                  pitchAlignment="map"
                  offset={[0, 0]}
                  style={{
                    height: '42px',
                    backgroundImage: `url(${publicPath}/images/${backgroundImage})`,
                    backgroundSize: '100%',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.5,
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
                      style={{ border: '2px solid #13c2c2' }}
                    />
                  </Badge>
                </Marker>
              );
            }
            return null;
          })
          .filter((marker) => !!marker) ?? []),
      ];

      markers = [
        ...markers,
        ...(teams
          ?.find((team) => team.users.find((u) => u.userId === user?.userId))
          ?.teamUsers.map((u) => {
            if (u.hint && u.hint.gmtCreate + 2000 - new Date().getTime() > 0) {
              if (mapHandler) mapHandler.recordEvent('TeammateHint', [u.user.userId, u.hint.lat, u.hint.lng]);
              setTimeout(() => {
                setHintUpdate((v) => v + 1);
              }, 2000);
              return (
                <Marker
                  key={`${u.user.userId}hint`}
                  longitude={u.hint.lng}
                  latitude={u.hint.lat}
                  anchor="bottom"
                  pitchAlignment="map"
                  offset={[0, 0]}
                  style={{
                    height: '42px',
                    backgroundImage: `url(${publicPath}/images/${backgroundImage})`,
                    backgroundSize: '100%',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.5,
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
                      style={{ border: '2px solid #13c2c2' }}
                    />
                  </Badge>
                </Marker>
              );
            }
            return null;
          })
          .filter((marker) => !!marker) ?? []),
      ];

      return markers;
    }, // 过滤为null的标记
    [teams, user, hintUpdate, backgroundImage],
  );

  const [mapShow, setMapShow] = useState<boolean>(false);
  const [fistMapShow, setFirstMapShow] = useState<boolean>(true);
  const [bigMap, setBigMap] = useState<boolean>(false);
  const needSmallRef = useRef(false);

  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isMouseInside, setIsMouseInside] = useState(true);

  useEffect(() => {

    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    const handleFocus = () => setIsPageVisible(true);
    const handleBlur = () => setIsPageVisible(false);
    const handleMouseEnter = () => setIsMouseInside(true);
    const handleMouseLeave = () => setIsMouseInside(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // 清理事件监听器
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  /*useEffect(() => {
    /*let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const setVisible = (visible: boolean) => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }

      if (visible) {
        setIsPageVisible(true);
      } else {
        setIsPageVisible(false);
        hideTimer = setTimeout(() => {
          if (map && gameData?.type && ['solo_match', 'daily_challenge'].includes(gameData.type) && !pickCoord) {
            map.setZoom(0);
            map.setCenter(gameData?.centerLat && gameData.centerLng ? [gameData.centerLng, gameData.centerLat] : [106.0, 38.0]);
            // if (pickCoord) setPickCoord(undefined);
          }
          hideTimer = null;
        }, 1500);
      }
    };

    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    const handleFocus = () => setVisible(true);
    const handleBlur = () => setVisible(false);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("mouseleave", handleBlur);
    document.addEventListener("mouseenter", handleFocus);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("mouseleave", handleBlur);
      document.removeEventListener("mouseenter", handleFocus);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [map]);*/

  //切屏监听
  useEffect(() => {
    if (mapHandler) {
      if (currentRound && !confirmed) {
        if (isPageVisible) mapHandler.recordEvent('Switch', 'in');
        else mapHandler.recordEvent('Switch', 'out');
      }
    }
  }, [isPageVisible]);

  useEffect(() => {
    if (mapHandler) {
      if (currentRound && !confirmed) {
        if (isMouseInside) mapHandler.recordEvent('Mouse', 'in');
        else mapHandler.recordEvent('Mouse', 'out');
      }
    }
  }, [isMouseInside]);

  //监听地图大小变化 - 只在用户主动点击调整大小按钮时记录
  // hover 产生的 bigMap 变化在 mapMouseEnter/mapMouseLeave 中记录
  useEffect(() => {
    // 只在用户通过按钮调整 mapSize 且地图处于放大状态时记录
    if (mapHandler && map && !isMobile && mapSize && bigMap) {
      // 记录 MapStyle: 1-4 表示地图放大并使用对应尺寸
      mapHandler.recordEvent('MapStyle', Number(mapSize));
    }
  }, [mapSize]);

  // 监听地图固定（mapPin）状态变化
  useEffect(() => {
    if (mapHandler && map && !isMobile) {
      if (mapPin) {
        // 固定地图时记录放大状态
        mapHandler.recordEvent('MapStyle', Number(mapSize));
      } else if (!bigMap) {
        // 取消固定且地图不在 hover 放大状态时，记录缩小状态
        mapHandler.recordEvent('MapStyle', 0);
      }
    }
  }, [mapPin]);

  useEffect(() => {
    if (fistMapShow && mapShow) {
      map?.resize();
      initMapView();
      setFirstMapShow(false);
    }
    if (mapHandler && isMobile) {
      if (mapShow) mapHandler.recordEvent('MobileMap', 1);
      else mapHandler.recordEvent('MobileMap', 0);
    }
  }, [mapShow]);

  const mapCanHover = (): boolean => {
    if (window.matchMedia('(hover: hover)').matches) return true;
    if (!window.matchMedia('(hover: none)').matches) return true;

    // Edg 133.0.3065.59 支持 hover 但是 matchMedia 失败，先通过这种方式兼容
    if (/Edg\/133\.0\.0\.0/.test(navigator.userAgent)) {
      // if (window.matchMedia('(any-hover: hover)').matches) {
      //   logServer({
      //     text: 'window match (any-hover: hover), and match (hover: none)',
      //   });
      // }
      return true;
    }
    return false;
  };

  function mapMouseEnter() {
    if (mapCanHover() && !isMobile && !mapPin) {
      setBigMap(true);
      needSmallRef.current = false;
      // 记录地图放大事件：MapStyle: 1-4 表示地图激活并使用对应尺寸
      if (mapHandler) mapHandler.recordEvent('MapStyle', Number(mapSize));
    }
  }

  function mapMouseLeave() {
    // if (mapCanHover()) {
    //   logServer({ text: 'window match (hover: hover)' });
    // } else {
    //   logServer({ text: 'window not match (hover: hover)' });
    // }

    // if (!isMobile) {
    //   logServer({ text: 'mapMouseLeave is not Mobile' });
    // } else {
    //   logServer({ text: 'mapMouseLeave is Mobile' });
    // }

    // if (mapPin) {
    //   logServer({ text: 'mapPin' });
    // } else {
    //   logServer({ text: 'no mapPin' });
    // }

    if (mapCanHover() && !isMobile && !mapPin) {
      needSmallRef.current = true;
      setTimeout(() => {
        // logServer({ text: 'needSmallRef.current ' + needSmallRef.current });
        if (needSmallRef.current) {
          setBigMap(false);
          // logServer({ text: 'setBigMap(false)' });
          // 记录地图缩小事件：MapStyle: 0 表示地图未激活（小尺寸）
          if (mapHandler) mapHandler.recordEvent('MapStyle', 0);
        }
      }, 500);
    }
  }
  return (
    <div
      className={
        isMobile ? styles.inApp : '' // 判断是否在app内
      }
    >
      <div
        className={`${styles.mapBox} ${isMobile ? '' : styles[`mapSize${mapSize}`] // 手机不能选择大小
          } ${(isMobile ? mapShow : mapPin || bigMap) ||
            // 判断 ipad，电视等等, 这里需不需要加在App里的判断呢
            (!isMobile && !mapCanHover())
            ? styles.mapBoxActive
            : ''
          } `}
        onMouseOver={mapMouseEnter}
        onMouseLeave={mapMouseLeave}
      >
        <div className={styles.mapWrapper}>
          <div className={styles.mapControl}>
            <Button
              shape="circle"
              icon={
                <CaretRight
                  set="broken"
                  style={{ transform: 'rotate(-135deg)' }}
                />
              }
              disabled={mapSize === 4}
              onClick={() => {
                settings.mapSize += 1;
              }}
            />
            <Button
              shape="circle"
              icon={
                <CaretRight
                  set="broken"
                  style={{ transform: 'rotate(45deg)' }}
                />
              }
              disabled={mapSize === 1}
              onClick={() => {
                settings.mapSize -= 1;
              }}
            />

            <Button
              shape="circle"
              icon={mapPin ? <TbPin /> : <TbPinnedOff />}
              onClick={() => {
                settings.mapPin = mapPin ? false : true;
              }}
            />
          </div>
          <div className={styles.zoomControl}>
            <Button
              shape="circle"
              icon={<PlusOutlined />}
              onClick={() => setZoom()}
            />
            <Button
              shape="circle"
              icon={<MinusOutlined />}
              onClick={() => setZoom(false)}
            />
          </div>
          <div className={styles.map}>
            <MapContainer cursor="crosshair" onClick={handlePick}>
              {user && pickCoord && (
                <Marker
                  {...pickCoord}
                  anchor="center"
                  offset={[0, -21]}
                  style={{
                    height: '42px',
                    backgroundImage: `url(${publicPath}/images/${backgroundImage})`,
                    backgroundSize: '100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  <Avatar
                    src={`${CFBizUri}${user?.icon}?x-oss-process=image/resize,h_80/quality,q_75`}
                    style={{ border: '2px solid #FF9427' }}
                  />
                </Marker>
              )}
              {teamsMarkers}
            </MapContainer>
          </div>
          <div className={styles.mapConfirm}>
            <Button
              type="primary"
              shape="round"
              size="large"
              disabled={!pickCoord || confirmed || isObserver}
              onClick={handleConfirm}
            >
              {isObserver
                ? '你未参赛'
                : pickCoord
                  ? confirmed
                    ? '等待结果'
                    : '确定选择'
                  : '选择位置'}
            </Button>
          </div>
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
      {/*gameData?.status === 'ongoing' && gameData?.type && ['solo_match', 'daily_challenge'].includes(gameData?.type) && <ComeBackMask pickCoord={pickCoord} />*/}
    </div>
  );
};

export default MapPicker;
