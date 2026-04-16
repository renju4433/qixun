import Header from '@/components/Header';
import GomokuBoard from '@/components/Gomoku/Board';
import {
  analyzeGomokuGame,
  cancelGomokuMatch,
  getGomokuGame,
  joinGomokuMatch,
  playGomokuMove,
} from '@/services/api';
import { history, useModel } from '@@/exports';
import { Alert, Button, Card, Flex, List, Spin, Statistic, Tag, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './style.less';

type GomokuPlayer = {
  userId: number;
  userName: string;
  icon?: string;
};

type GomokuMove = {
  moveIndex: number;
  x: number;
  y: number;
  color: number;
};

type GomokuAnalysisMove = {
  moveIndex: number;
  color: number;
  played: string;
  best: string | null;
  evalText: string | null;
  isMistake: boolean;
};

type GomokuGame = {
  id: string;
  status: 'queued' | 'ongoing' | 'finished';
  matchMode: 'fast' | 'slow';
  ruleText: string;
  boardSize: number;
  currentTurn: number;
  winnerColor: number | null;
  baseTimeMs: number;
  incrementMs: number;
  blackTimeMs: number;
  whiteTimeMs: number;
  blackUser: GomokuPlayer | null;
  whiteUser: GomokuPlayer | null;
  viewerColor: number | null;
  canMove: boolean;
  moves: GomokuMove[];
  winLine: { x: number; y: number }[] | null;
  analysis?: {
    blackMistakes: number;
    whiteMistakes: number;
    moves: GomokuAnalysisMove[];
  } | null;
};

const COLOR_TEXT: Record<number, string> = {
  0: '和棋',
  1: '黑方',
  2: '白方',
};

const AllMatch = () => {
  const { user } = useModel('@@initialState', (model) => ({
    user: model.initialState?.user,
  }));

  const [game, setGame] = useState<GomokuGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchMode, setMatchMode] = useState<'fast' | 'slow'>('fast');
  const pollingRef = useRef<number | null>(null);

  const statusText = useMemo(() => {
    if (!game) return '未开始匹配';
    if (game.status === 'queued') return '正在等待对手';
    if (game.status === 'ongoing') {
      return game.canMove ? '轮到你落子' : '等待对手落子';
    }
    return game.winnerColor === 0
      ? '对局结束，和棋'
      : `对局结束，${COLOR_TEXT[game.winnerColor || 0]}胜`;
  }, [game]);

  const refreshGame = async (gameId: string) => {
    const res = await getGomokuGame({ gameId }, { skipErrorHandler: true });
    if (res.success && res.data) {
      setGame(res.data);
    }
  };

  useEffect(() => {
    if (!game?.id || !['queued', 'ongoing'].includes(game.status)) {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = null;
      return;
    }

    pollingRef.current = window.setInterval(() => {
      refreshGame(game.id).catch(() => { });
    }, 1500);

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [game?.id, game?.status]);

  const startMatch = async () => {
    if (!user?.userId) {
      history.push('/user/login?redirect=/match');
      return;
    }
    setLoading(true);
    try {
      const res = await joinGomokuMatch({ matchMode });
      if (res.success && res.data) {
        setGame(res.data);
      } else {
        message.error(res.errorMessage || '匹配失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelMatch = async () => {
    if (!game?.id) return;
    setLoading(true);
    try {
      const res = await cancelGomokuMatch({ gameId: game.id });
      if (res.success) {
        setGame(null);
      } else {
        message.error(res.errorMessage || '取消失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (x: number, y: number) => {
    if (!game?.id || !game.canMove || playing) return;
    setPlaying(true);
    try {
      const res = await playGomokuMove({ gameId: game.id, x, y });
      if (res.success && res.data) {
        setGame(res.data);
      } else {
        message.error(res.errorMessage || '落子失败');
      }
    } finally {
      setPlaying(false);
    }
  };

  const handleAnalyze = async () => {
    if (!game?.id) return;
    setAnalyzing(true);
    try {
      const res = await analyzeGomokuGame({ gameId: game.id });
      if (res.success && res.data) {
        setGame(res.data);
      } else {
        message.error(res.errorMessage || '复盘分析失败');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const renderPlayerName = (player: GomokuPlayer | null, color: 1 | 2) => {
    if (!player) {
      return <div>等待匹配中</div>;
    }

    const isCurrentTurn = game?.status === 'ongoing' && game.currentTurn === color;
    const isMe = user?.userId === player.userId;

    return (
      <div className={styles.playerNameRow}>
        <span className={isCurrentTurn ? styles.activePlayerName : styles.playerName}>
          {player.userName}
        </span>
        {isMe && <Tag color="blue">我</Tag>}
      </div>
    );
  };

  const formatClock = (timeMs?: number) => {
    const safe = Math.max(0, Math.floor((timeMs || 0) / 1000));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className={styles.page}>
      <div style={{ marginTop: 10 }}>
        <Header canBack={true} />
      </div>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1>匹配</h1>
        </div>

        {!game && (
          <Card className={styles.panel}>
            <Flex vertical gap={16} align="center">
              <div className={styles.modeSwitch}>
                <Button
                  type={matchMode === 'fast' ? 'primary' : 'default'}
                  onClick={() => setMatchMode('fast')}
                >
                  快棋场
                </Button>
                <Button
                  type={matchMode === 'slow' ? 'primary' : 'default'}
                  onClick={() => setMatchMode('slow')}
                >
                  慢棋场
                </Button>
              </div>
              <div className={styles.modeHint}>
                {matchMode === 'fast'
                  ? '塔拉山口-10规则，基础用时 3 分钟，每步加 2 秒'
                  : '塔拉山口-10规则，基础用时 15 分钟，每步加 5 秒'}
              </div>
              <Button type="primary" size="large" loading={loading} onClick={startMatch}>
                开始匹配
              </Button>
            </Flex>
          </Card>
        )}

        {game && (
          <div className={styles.gameLayout}>
            <div className={styles.left}>
              <Card className={styles.panel}>
                <Flex vertical gap={16}>
                  <Flex
                    justify="center"
                    align="center"
                    wrap="wrap"
                    gap={12}
                    className={styles.statusBar}
                  >
                    <Tag color={game.status === 'finished' ? 'gold' : 'blue'}>{statusText}</Tag>
                    {game.status === 'queued' && (
                      <Button onClick={cancelMatch} loading={loading}>
                        取消匹配
                      </Button>
                    )}
                    {game.status === 'finished' && (
                      <Button type="primary" onClick={handleAnalyze} loading={analyzing}>
                        引擎复盘
                      </Button>
                    )}
                  </Flex>

                  <Flex className={styles.players} gap={12}>
                    <Card size="small" className={styles.playerCard}>
                      <div className={styles.playerTitle}>黑方</div>
                      {renderPlayerName(game.blackUser, 1)}
                      <div className={styles.playerClock}>{formatClock(game.blackTimeMs)}</div>
                    </Card>
                    <Card size="small" className={styles.playerCard}>
                      <div className={styles.playerTitle}>白方</div>
                      {renderPlayerName(game.whiteUser, 2)}
                      <div className={styles.playerClock}>{formatClock(game.whiteTimeMs)}</div>
                    </Card>
                  </Flex>

                  <GomokuBoard
                    moves={game.moves}
                    canPlay={game.canMove && !playing}
                    onPlay={handlePlay}
                    winLine={game.winLine}
                  />
                </Flex>
              </Card>
            </div>

            <div className={styles.right}>
              {game.analysis && (
                <Card className={styles.panel} title="赛后复盘">
                  <Flex gap={12} className={styles.summary}>
                    <Statistic title="黑方错着数" value={game.analysis.blackMistakes} />
                    <Statistic title="白方错着数" value={game.analysis.whiteMistakes} />
                  </Flex>
                  <List
                    size="small"
                    dataSource={game.analysis.moves}
                    renderItem={(item) => (
                      <List.Item>
                        <div className={styles.analysisRow}>
                          <span>
                            第 {item.moveIndex} 手 {item.color === 1 ? '黑' : '白'}:
                            {item.played}
                          </span>
                          <span>最优 {item.best || '-'}</span>
                          <span>{item.evalText || '-'}</span>
                          <Tag color={item.isMistake ? 'red' : 'green'}>
                            {item.isMistake ? '错着' : '正常'}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </div>
          </div>
        )}

        {(loading || playing) && (
          <div className={styles.loadingMask}>
            <Spin />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMatch;
