import HeaderLogo from '@/components/Header/Logo';
import Panorama, { PanoramaRef } from '@/components/Map/GoogleMap/Panorama';
import { useLoadGoogle } from '@/hooks/use-load-google';
import { checkHasRecord, getSoloGameInfo } from '@/services/api';
import { qixunCopy } from '@/utils/CopyUtils';
import { useSearchParams } from '@@/exports';
import { DownOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Button, Dropdown, Menu, Modal } from 'antd';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import PanoCollectModal from '../../../components/Pano/PanoCollections';
import PanoReportModal from '../../../components/Pano/PanoReportModal';
import styles from './style.less';
const { Item } = Menu;

const PanoReplay: FC = () => {
  const [params] = useSearchParams();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [showCollect, setShowCollect] = useState<boolean>(false);
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);
  const hasReplayMapRef = useRef<Map<number, string>>(new Map());

  const { user, isInApp } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
    isInApp: model.initialState?.isInApp,
  }));

  const gameId = params.get('gameId');
  const round = Number(params.get('round'));
  const [chooseRound, setChooseRound] = useState<number>(round);
  const panoRef = useRef<PanoramaRef | null>(null);
  /* const checkLogin = useCheckLogin(); */

  useEffect(() => {
    console.log(gameId);
    if (!user?.userId) {
      // 跳转登录
      history.push(
        `/user/login?redirect=` +
        encodeURIComponent(
          '/replay-pano?gameId=' + gameId + '&round=' + round,
        ),
      );
      return;
    }
  }, [user]);
  const [roundInfo, setRoundInfo] = useState<API.GameRound>();
  const [data, setData] = useState<API.GameInfo>();
  const [playerList, setPlayerList] = useState<any[]>([]); // 存储玩家列表

  useLoadGoogle({ setLoaded });

  const checkReplayData = async (playerId: number) => {
    try {
      const data = await checkHasRecord({
        gameId: gameId || '',
        userId: playerId,
        round: round,
      });
      if (data?.success && data.data) {
        return playerId;
      }
      return null;
    } catch (error) {
      console.error('检查回放数据失败', error);
      return null;
    }
  };

  useEffect(() => {
    let queryParams = [];

    queryParams.push(`gameId=${gameId}`);
    if (chooseRound) queryParams.push(`round=${chooseRound}`);

    const queryString = queryParams.join('&');
    const url = queryString ? `/replay-pano?${queryString}` : '/replay-pano';

    history.replace(url);
  }, [chooseRound]);

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

  useEffect(() => {
    if (gameId) {
      getSoloGameInfo({ gameId }).then((res) => {
        if (res.success) {
          setData(res.data);

          // 获取玩家列表
          let players =
            res.data?.teams?.flatMap((team) => team.teamUsers) || [];
          if (players.length === 0) players = [res.data.player];
          // 对每个玩家检查回放数据，筛选出有回放数据的玩家
          if (res.data?.record || ['solo_match', 'daily_challenge'].includes(res.data.type)) {
            Promise.all(
              players.map(async (player) => {
                const hasRecordPlayer = await checkReplayData(
                  player.user.userId,
                );
                if (hasRecordPlayer) {
                  // 使用 useRef 更新 Map
                  hasReplayMapRef.current.set(
                    player.user.userId,
                    player.user.userName,
                  );
                  return player;
                }
                return null;
              }),
            ).then((playersWithReplay) => {
              setPlayerList(playersWithReplay.filter((player) => player !== null));
            });
          }
          // 根据回合号获取当前回合的详细信息
          const roundInfo = res.data.rounds.find((r) => r.round === round);
          setRoundInfo(roundInfo);
        }
      });
    }
  }, [gameId, round]);

  const moreMenu = (
    <Menu>
      <Item onClick={() => location.reload()}>黑屏刷新</Item>
      <Item onClick={() => panoRef?.current?.reset()}>返回原点</Item>
    </Menu>
  );

  return (
    <div>
      <HeaderLogo canBack={true} className={styles.header} />
      {loaded && roundInfo && <Panorama round={roundInfo} ref={panoRef} />}
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
      </div>
      {roundInfo && data && (
        <div className={`${styles.buttons} ${isInApp ? styles.inApp : ''}`}>
          <Button
            className={styles.customButton}
            onClick={() => (location.href = `/replay?gameId=${gameId}`)}
          >
            地图复盘
          </Button>
          <Button
            className={styles.customButton}
            onClick={() => setShowCollect(true)}
          >
            收藏街景
          </Button>
          <Button
            className={styles.customButton}
            onClick={() => qixunCopy(location.href)}
          >
            复制链接
          </Button>
          <Button
            className={styles.customButton}
            onClick={() => setShowReport(true)}
          >
            坏题反馈
          </Button>
          {playerList.length > 0 ? (
            <Button
              className={styles.customButton}
              onClick={() => setShowPlayerModal(true)}
            >
              查看回放
            </Button>
          ) : (
            <Button className={styles.customButton} disabled>
              无回放
            </Button>
          )}
          <Dropdown overlay={moreMenu}>
            <Button className={styles.customButton}>更多</Button>
          </Dropdown>
          <PanoReportModal
            show={showReport}
            mapsId={data.mapsId!}
            panoId={roundInfo.panoId}
            onClose={() => setShowReport(false)}
          />
          <PanoCollectModal
            show={showCollect}
            panoId={roundInfo.panoId}
            onClose={() => setShowCollect(false)}
          />
          <Modal
            title="选择用户查看回放"
            open={showPlayerModal}
            onCancel={() => setShowPlayerModal(false)}
            footer={<Button onClick={() => setShowPlayerModal(false)}>关闭</Button>}
            centered
          >
            {playerList.map((player) => (
              <Button
                key={player.user.userId}
                onClick={() => {
                  setShowPlayerModal(false);
                  history.push(`/replayplayer?gameId=${gameId}&userId=${player.user.userId}&round=${round}`);
                }}
              >
                {player.user.userName} ({player.user.userId})
              </Button>
            ))}
          </Modal>
        </div>
      )}
      {roundInfo && data && (
        <div className={styles.verson}>
          uid:{user?.userId}｜{data?.move ? '移动' : '固定'}｜
          {data?.pan ? '自由' : '固定视角'}｜{data?.mapsName}
        </div>
      )}
    </div>
  );
};

export default PanoReplay;