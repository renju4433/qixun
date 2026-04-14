import MapTopInfo from '@/components/Maps/MapTopInfo';
import VipModal from '@/components/Vip';
import NormalPage from '@/pages/NormalPage';
import {
  checkVipState,
  createChallenge,
  createInfinity,
  createMapCountryStreak,
  getMapInfo,
} from '@/services/api';
import { useParams } from '@@/exports';
import { history, useRequest } from '@umijs/max';
import { Button, Flex, InputNumber, Segmented, Spin, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

const CarCrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ verticalAlign: 'middle' }}>
    <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z" />
    <path d="M1.39 4.22l18.38 18.38 1.41-1.41L2.8 2.81z" fill="#f5222d" />
  </svg>
);

const MapDetail = () => {
  let { mapId } = useParams();

  const [mapInfo, setMapInfo] = useState<API.MapItem>();
  const [showVip, setShowVip] = useState<boolean>(false);
  const [options, setOptions] = useState<string[]>([
    '固定',
    '固定视角',
    '眨眼模式',
  ]);
  const [chooseOption, setChooseOption] = useState<string>('固定');
  const [setRoundTimer, setSetRoundTimer] = useState<boolean>(false);
  const [roundTime, setRoundTime] = useState<number | null>(null);
  const [blinkTime, setBlinkTime] = useState<number>(0.5);
  const [noCar, setNoCar] = useState<boolean>(false);
  const { data: vipExpireDate } = useRequest(checkVipState);

  interface StringDictionary {
    [key: string]: string;
  }

  const chooseHints: StringDictionary = {
    移动: '可以自由走动和转动视角收集线索的街景',
    固定: '不能走动但是可以转动视角的街景',
    固定视角: '不能走动也不能转动视角的图片, 手机建议横屏使用',
    眨眼模式: '只会显示一小会的街景',
  };

  useEffect(() => {
    getMapInfo({ mapsId: Number(mapId) }).then((result) => {
      if (result.success) {
        setMapInfo(result.data);
        document.title = result.data.name + ' - 题库 - 棋寻';
        if (result.data.canMove) {
          setOptions(['移动', '固定', '固定视角', '眨眼模式']);
        }
      }
    });
  }, []);

  function getParams(): API.CreateChallengeParams {
    const params: API.CreateChallengeParams = {
      mapsId: Number(mapId),
      type: 'noMove',
      move: false,
    };

    if (roundTime) params.timeLimit = roundTime * 1000;

    if (chooseOption === '移动') {
      params.type = 'move';
      params.move = true;
    } else if (chooseOption === '固定视角') {
      params.type = 'noMove';
      params.pan = false;
      params.zoom = false;
    }
    if (chooseOption === '眨眼模式' && blinkTime) {
      params.blinkTime = blinkTime * 1000;
      params.type = 'noMove';
      params.pan = false;
      params.zoom = false;
    }

    if (noCar && chooseOption !== '移动') {
      params.noCar = true;
    }

    return params;
  }

  function solveError(reason: any) {
    if (reason.toString().includes('会员')) setShowVip(true);
    if (reason.toString().includes('登录')) {
      history.push('/user/login?redirect=' + encodeURIComponent(location.href));
    }
  }

  function hubPath(seed: string) {
    return `/challenge-hub/${encodeURIComponent(seed)}`;
  }

  function startInfinity() {
    const params = getParams();
    createInfinity(params)
      .then((result) => {
        if (!result.success) {
          if (result.errorCode === 'need_vip') setShowVip(true);
          return;
        }
        const gameId = String(result.data);
        history.push(`/solo/${gameId}`);
      })
      .catch((reason) => solveError(reason));
  }

  function startCountryStreak() {
    const params = getParams();
    createMapCountryStreak(params)
      .then((result) => {
        if (!result.success) {
          if (result.errorCode === 'need_vip') setShowVip(true);
          return;
        }
        const gameId = String(
          (result.data as unknown as { id: string | number }).id,
        );
        history.push(`/solo/${gameId}`);
      })
      .catch((reason) => solveError(reason));
  }

  function startClassicChallenge(destination: 'play' | 'hub') {
    const params = getParams();
    createChallenge(params, {})
      .then((result) => {
        if (!result.success) {
          if (result.errorCode === 'need_vip') setShowVip(true);
          return;
        }
        const cid = String(result.data);
        history.push(destination === 'hub' ? hubPath(cid) : `/challenge/${cid}`);
      })
      .catch((reason) => solveError(reason));
  }

  return (
    <NormalPage>
      {mapInfo && (
        <>
          <MapTopInfo map={mapInfo} />
          <Flex align="center" gap="middle" vertical>
            {mapInfo.canMove || (
              <div style={{ color: 'gray' }}>该题库不支持移动模式</div>
            )}
            <Segmented
              value={chooseOption}
              size="large"
              onChange={(e) => setChooseOption(e)}
              options={options}
            />
            <div style={{ color: 'gray', fontSize: 12 }}>
              {chooseHints[chooseOption]}
            </div>
            <Flex align="center" gap="small" vertical key="setting">
              {chooseOption === '眨眼模式' && (
                <Flex align="center" gap="small">
                  眨眼时间：
                  <InputNumber
                    controls
                    min={0.1}
                    max={3.0}
                    step={0.1}
                    defaultValue={blinkTime}
                    onChange={(e) => {
                      if (e) setBlinkTime(e);
                    }}
                  />
                  秒
                </Flex>
              )}
              {chooseOption !== '移动' && (
                <Flex align="center" gap="small">
                  <CarCrashIcon />
                  <span style={{ fontSize: 16 }}>无车模式</span>
                  <Tooltip
                    title={!vipExpireDate ? '请先开通VIP' : '隐藏街景中的车辆'}
                  >
                    <Switch
                      size="small"
                      disabled={!vipExpireDate}
                      checked={noCar}
                      onChange={(checked) => setNoCar(checked)}
                    />
                  </Tooltip>
                </Flex>
              )}
              <Flex align="center" gap="small">
                轮次时间：
                {setRoundTimer ? (
                  <>
                    <InputNumber
                      controls
                      min={5}
                      max={600}
                      step={5}
                      defaultValue={30}
                      onChange={(e) => setRoundTime(e)}
                    />
                    秒
                  </>
                ) : (
                  '不限'
                )}
                {setRoundTimer ? (
                  <Button
                    onClick={() => {
                      setSetRoundTimer(false);
                      setRoundTime(null);
                    }}
                  >
                    取消
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setSetRoundTimer(true);
                      setRoundTime(30);
                    }}
                  >
                    设置
                  </Button>
                )}
              </Flex>
            </Flex>

            <Button size="large" onClick={() => startClassicChallenge('play')}>
              开始经典五题
            </Button>
            <Tooltip title="进入挑战页：可复制链接邀请好友、查看排行榜；与下方无限轮次、国家连胜可同时使用。">
              <Button size="large" onClick={() => startClassicChallenge('hub')}>
                创建五题挑战
              </Button>
            </Tooltip>
            <Button size="large" onClick={startInfinity}>
              开始无限轮次
            </Button>
            {mapInfo && mapInfo.countryStreak && (
              <Button size="large" onClick={startCountryStreak}>
                开始国家连胜
              </Button>
            )}
          </Flex>
        </>
      )}
      {!mapInfo && <Spin />}

      {showVip && <VipModal open={showVip} hide={() => setShowVip(false)} />}
    </NormalPage>
  );
};

export default MapDetail;
