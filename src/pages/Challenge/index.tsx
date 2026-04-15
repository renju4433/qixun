// import detectDevtool from '@/components/Admin/detectDevtool';
import ChallengeGameEnd from '@/components/Map/ChallengeGameEnd';
import ChallengeResult from '@/components/Map/ChallengeResult';
import { ChallengeEmoji } from '@/components/Map/Emoji';
import SoloMatchCountDown from '@/components/Map/SoloMatchCountDown';
import Chessboard from '@/components/Chess/Chessboard';
import ChessRoundResult from '@/components/Chess/ChessRoundResult';
import { useDevTools } from '@/hooks/use-dev-tools';
import { getGameInfo, joinGame, nextChessChallenge, submitChessChallenge } from '@/services/api';
import { history, useModel, useParams } from '@umijs/max';
import { Button, message } from 'antd';
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
  const [positionHistory, setPositionHistory] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [chessRoundResult, setChessRoundResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const boardFen = positionHistory[positionHistory.length - 1] || currentFen;
  const firstMove = moveHistory.length > 0 ? moveHistory[0] : '';
  const latestMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : '';
  const canUndoChessMove = moveHistory.length > 0;
  const canRestoreChessBoard = positionHistory.length > 1;
  const canSubmitChessMove =
    (gameData as any)?.chess?.canSubmit !== false &&
    !!firstMove;
  const isDailyChessChallenge = Boolean(
    challengeId && /^daily-\d{4}-\d{2}-\d{2}-chess$/.test(challengeId),
  );

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
    setPositionHistory(fen ? [fen as string] : []);
    setMoveHistory([]);
  }, [gameData, lastRound]);

  const handleSubmitChessMove = async () => {
    if (!challengeId || !firstMove || !canSubmitChessMove || submitting) return;
    try {
      setSubmitting(true);
      const res = await submitChessChallenge({ challengeId, userMove: firstMove });
      if (!res.success) {
        message.error(res.errorMessage || '提交失败');
        return;
      }
      processGameData(res.data.gameInfo as any);
      setChessRoundResult(res.data.roundResult);
    } catch (err: any) {
      message.error(err?.info?.errorMessage || err?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextChessRound = async () => {
    if (!challengeId || advancing) return;
    try {
      setAdvancing(true);
      const res = await nextChessChallenge({ challengeId });
      if (!res.success) {
        message.error(res.errorMessage || '进入下一题失败');
        return;
      }
      processGameData(res.data as any);
      setPositionHistory([]);
      setMoveHistory([]);
      setChessRoundResult(null);
    } catch (err: any) {
      message.error(err?.info?.errorMessage || err?.message || '进入下一题失败');
    } finally {
      setAdvancing(false);
    }
  };

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

    if (!isDailyChessChallenge) {
      // 连接socket
      connect();

      // 解决息屏、后台后websocket断开的问题
      try {
        document.addEventListener('visibilitychange', wakeUpWebsocket);
      } catch (error) { }
    }
  }, [id, challengeId, streakId, knockoutId, infinityId]);

  // 离开页面时候，断开socket
  useEffect(() => {
    return () => {
      clearState();

      // 退出视图后取消监听
      if (!isDailyChessChallenge) {
        try {
          document.removeEventListener('visibilitychange', wakeUpWebsocket);
        } catch (error) { }
      }
    };
  }, [isDailyChessChallenge]);

  useDevTools();

  return (
    <div className={styles.wrapper}>
      {isDailyChessChallenge && chessRoundResult && (
        <ChessRoundResult
          round={Number((gameData as any)?.currentRound ?? 0) + 1}
          roundNumber={Number((gameData as any)?.roundNumber ?? 5)}
          roundResult={chessRoundResult}
          finished={Number((gameData as any)?.currentRound ?? 0) + 1 >= Number((gameData as any)?.roundNumber ?? 5)}
          onNext={handleNextChessRound}
          onBack={() => history.push('/daily-challenge/chess')}
        />
      )}
      {!roundResult && !gameEndVisible && (
        <div className={styles.chessboardWrap}>
          <Chessboard
            fen={boardFen}
            showFenInfo={false}
            highlightedSquares={latestMove ? [latestMove.slice(0, 2), latestMove.slice(2, 4)] : []}
            onMove={({ uci, fen }) => {
              setMoveHistory((prev) => [...prev, uci]);
              setPositionHistory((prev) => [...prev, fen]);
            }}
          />
          {isDailyChessChallenge && (
            <div className={styles.infoRow}>
              <div className={styles.infoText}>{currentFen || '等待题目加载...'}</div>
              <Button
                shape="round"
                disabled={!canRestoreChessBoard}
                onClick={() => {
                  setMoveHistory([]);
                  setPositionHistory(currentFen ? [currentFen] : []);
                }}
              >
                复原
              </Button>
              <Button
                shape="round"
                disabled={!canUndoChessMove}
                onClick={() => {
                  setMoveHistory((prev) => prev.slice(0, -1));
                  setPositionHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
                }}
              >
                撤销
              </Button>
              <Button
                type="primary"
                shape="round"
                disabled={!canSubmitChessMove || submitting || !!chessRoundResult}
                loading={submitting}
                onClick={handleSubmitChessMove}
              >
                提交
              </Button>
            </div>
          )}
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
