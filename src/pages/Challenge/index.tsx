// import detectDevtool from '@/components/Admin/detectDevtool';
import ChallengeGameEnd from '@/components/Map/ChallengeGameEnd';
import ChallengeResult from '@/components/Map/ChallengeResult';
import { ChallengeEmoji } from '@/components/Map/Emoji';
import SoloMatchCountDown from '@/components/Map/SoloMatchCountDown';
import Chessboard from '@/components/Chess/Chessboard';
import { useDevTools } from '@/hooks/use-dev-tools';
import { getGameInfo, joinGame } from '@/services/api';
import { history, useModel, useParams } from '@umijs/max';
import { useCallback, useEffect, useState } from 'react';
import styles from './style.less';

const Match = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  // if (
  //   // (data.type === 'solo_match' || data.type === 'daily_challenge' || data.type=='challenge' ) &&
  //   !isAndroid &&
  //   isDesktop
  // ) {
  //   detectDevtool();
  // }

  const {
    challengeId,
    gameId: id,
    streakId,
    knockoutId,
    infinityId,
  } = useParams<{
    challengeId?: string;
    gameId?: string;
    streakId?: string;
    knockoutId?: string;
    infinityId?: string;
  }>();

  // 从Challenge.model中获取数据
  const {
    setGameId,
    processGameData,
    getSoloGameInfo,
    roundResult,
    gameEndVisible,
    status,
    gameData,
    lastRound,
    connect,
    wakeUpWebsocket,
    clearState,
    setCanLoad,
  } = useModel('Challenge.model', (model) => ({
    setGameId: model.setGameId,
    processGameData: model.processGameData,
    getSoloGameInfo: model.getGameInfo, // 转换名字避免和Challenge冲突
    status: model.status,
    roundResult: model.roundResult,
    gameEndVisible: model.gameEndVisible,
    gameData: model.gameData,
    lastRound: model.lastRound,
    connect: model.connect,
    wakeUpWebsocket: model.wakeUpWebsocket,
    clearState: model.clearState,
    setCanLoad: model.setCanLoad,
  }));

  const [currentFen, setCurrentFen] = useState<string>('');

  useEffect(() => {
    const candidates = [
      (lastRound as any)?.fen,
      (lastRound as any)?.content,
      (gameData as any)?.fen,
      (gameData as any)?.currentFen,
      (gameData as any)?.rounds?.[(gameData as any)?.currentRound ?? 0]?.fen,
      (gameData as any)?.rounds?.[(gameData as any)?.currentRound ?? 0]?.content,
    ].filter(Boolean);
    const fen = candidates.find((x: any) =>
      typeof x === 'string'
        ? /^([pnbrqkPNBRQK1-8]+\/){7}[pnbrqkPNBRQK1-8]+ [wb] /.test(x)
        : false,
    );
    if (fen) setCurrentFen(fen as string);
  }, [gameData, lastRound]);

  /**
   * 初始化Challenge
   */
  const challengeInit = async () => {
    const { data } = await getGameInfo({ challengeId });
    if (data) {
      setGameId(data.id);
      processGameData(data);
    }
  };

  /**
   * 初始化Game
   */
  const gameInit = useCallback(async () => {
    if (!id) return;

    try {
      // 首先尝试加入游戏
      const { data } = await joinGame(
        { gameId: id },
        { skipErrorHandler: true },
      );
      if (data) {
        processGameData({ ...data, me: user });
        if (data.playerIds?.includes(user?.userId ?? 0)) setCanLoad(true);
      }
    } catch (error: any) {
      if (!user?.userId) {
        history.push(`/user/login?redirect=/party/${id}`);
      }

      if (error && error.info && error.info.errorCode === 'need_vip') {
        // TODO: 需要VIP
      } else await getSoloGameInfo(id);
    }
  }, [id]);

  useEffect(() => {
    // ==================== 对战 ====================
    if (id) {
      setGameId(id);
      gameInit();
    } else if (challengeId) {
      if (!user?.userId) {
        history.push('/user/login?redirect=/daily-challenge');
        return;
      }

      // 初始化Challenge
      challengeInit();
    } else if (streakId) {
    } else if (knockoutId) {
    } else if (infinityId) {
    }

    // 连接socket
    connect();

    // 解决息屏、后台后websocket断开的问题
    try {
      document.addEventListener('visibilitychange', wakeUpWebsocket);
    } catch (error) { }
  }, [id, challengeId, streakId, knockoutId, infinityId]);

  // 离开页面时候，断开socket
  useEffect(() => {
    return () => {
      clearState();

      // 退出视图后取消监听
      try {
        document.removeEventListener('visibilitychange', wakeUpWebsocket);
      } catch (error) { }
    };
  }, []);

  useDevTools();

  return (
    <div className={styles.wrapper}>
      {!roundResult && !gameEndVisible && (
        <div className={styles.chessboardWrap}>
          <Chessboard fen={currentFen} />
        </div>
      )}
      {/* 比赛结果 */}
      {roundResult && !gameEndVisible && (
        <ChallengeResult model="Challenge.model" />
      )}
      {gameEndVisible && <ChallengeGameEnd model="Challenge.model" />}
      <ChallengeEmoji />
      {/*匹配倒计时*/}
      {!roundResult &&
        !gameEndVisible &&
        status &&
        (status === 'ready' ||
          status === 'wait_join' ||
          status === 'match_fail') && (
          <SoloMatchCountDown model="Challenge.model" />
        )}
    </div>
  );
};

export default Match;
