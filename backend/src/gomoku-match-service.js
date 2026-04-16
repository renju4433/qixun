const crypto = require('crypto');
const { RapfiLocalEngine } = require('./rapfi-local');

const BOARD_SIZE = 15;
const ANALYZE_MAX_DEPTH = Number(process.env.GOMOKU_ANALYZE_DEPTH || 10);
const ANALYZE_THREADS = Number(process.env.GOMOKU_ANALYZE_THREADS || 1);
const MATCH_MODES = {
  fast: {
    key: 'fast',
    name: '快棋场',
    baseTimeMs: 3 * 60 * 1000,
    incrementMs: 2 * 1000,
    ruleText: '塔拉山口-10',
  },
  slow: {
    key: 'slow',
    name: '慢棋场',
    baseTimeMs: 15 * 60 * 1000,
    incrementMs: 5 * 1000,
    ruleText: '塔拉山口-10',
  },
};

function getMatchModeConfig(mode) {
  return MATCH_MODES[mode] || MATCH_MODES.fast;
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function buildBoard(moves) {
  const board = createEmptyBoard();
  for (const move of moves) {
    board[move.y][move.x] = move.color;
  }
  return board;
}

function insideBoard(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function findWinner(moves) {
  const board = buildBoard(moves);
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const move of moves) {
    for (const [dx, dy] of directions) {
      const line = [{ x: move.x, y: move.y }];

      let x = move.x + dx;
      let y = move.y + dy;
      while (insideBoard(x, y) && board[y][x] === move.color) {
        line.push({ x, y });
        x += dx;
        y += dy;
      }

      x = move.x - dx;
      y = move.y - dy;
      while (insideBoard(x, y) && board[y][x] === move.color) {
        line.unshift({ x, y });
        x -= dx;
        y -= dy;
      }

      if (line.length >= 5) {
        return {
          winnerColor: move.color,
          winLine: line.slice(0, 5),
        };
      }
    }
  }

  return null;
}

function profileFromRow(row) {
  if (!row) return null;
  return {
    userId: row.id,
    userName: row.user_name,
    icon: row.icon || '',
  };
}

function getRemainingTimeMs(game, now = Date.now()) {
  let blackTimeMs = game.black_time_ms ?? 0;
  let whiteTimeMs = game.white_time_ms ?? 0;

  if (game.status === 'ongoing' && game.turn_started_at) {
    const elapsed = Math.max(0, now - new Date(game.turn_started_at).getTime());
    if (game.current_turn === 1) {
      blackTimeMs = Math.max(0, blackTimeMs - elapsed);
    } else if (game.current_turn === 2) {
      whiteTimeMs = Math.max(0, whiteTimeMs - elapsed);
    }
  }

  return { blackTimeMs, whiteTimeMs };
}

async function finalizeTimeoutIfNeeded(conn, game) {
  if (game.status !== 'ongoing' || !game.turn_started_at) {
    return game;
  }

  const { blackTimeMs, whiteTimeMs } = getRemainingTimeMs(game);
  let winnerColor = null;
  if (game.current_turn === 1 && blackTimeMs <= 0) {
    winnerColor = 2;
  } else if (game.current_turn === 2 && whiteTimeMs <= 0) {
    winnerColor = 1;
  }

  if (winnerColor === null) {
    return game;
  }

  await conn.query(
    `UPDATE gomoku_games
     SET status = 'finished',
         winner_color = ?,
         black_time_ms = ?,
         white_time_ms = ?,
         analysis_json = NULL
     WHERE id = ?`,
    [winnerColor, blackTimeMs, whiteTimeMs, game.id],
  );

  return {
    ...game,
    status: 'finished',
    winner_color: winnerColor,
    black_time_ms: blackTimeMs,
    white_time_ms: whiteTimeMs,
  };
}

async function loadGameWithMoves(conn, gameId) {
  const [gameRows] = await conn.query(
    'SELECT * FROM gomoku_games WHERE id = ? LIMIT 1',
    [gameId],
  );
  let game = gameRows[0];
  if (!game) return null;
  game = await finalizeTimeoutIfNeeded(conn, game);

  const [moveRows] = await conn.query(
    'SELECT move_index, x, y, color, created_at FROM gomoku_moves WHERE game_id = ? ORDER BY move_index ASC',
    [gameId],
  );

  const userIds = [game.black_user_id, game.white_user_id].filter(Boolean);
  let userMap = new Map();
  if (userIds.length > 0) {
    const [users] = await conn.query(
      `SELECT id, user_name, icon
       FROM users
       WHERE id IN (${userIds.map(() => '?').join(',')})`,
      userIds,
    );
    userMap = new Map(users.map((row) => [row.id, row]));
  }

  return {
    game,
    moves: moveRows.map((row) => ({
      moveIndex: row.move_index,
      x: row.x,
      y: row.y,
      color: row.color,
      createdAt: row.created_at,
    })),
    blackUser: profileFromRow(userMap.get(game.black_user_id)),
    whiteUser: profileFromRow(userMap.get(game.white_user_id)),
  };
}

function formatGameState(payload, viewerUserId) {
  const { game, moves, blackUser, whiteUser } = payload;
  const { blackTimeMs, whiteTimeMs } = getRemainingTimeMs(game);
  const viewerColor =
    game.black_user_id === viewerUserId
      ? 1
      : game.white_user_id === viewerUserId
      ? 2
      : null;

  return {
    id: game.id,
    status: game.status,
    matchMode: game.match_mode,
    ruleText: game.rule_text,
    boardSize: game.board_size,
    currentTurn: game.current_turn,
    winnerColor: game.winner_color,
    baseTimeMs: game.base_time_ms,
    incrementMs: game.increment_ms,
    blackTimeMs,
    whiteTimeMs,
    blackUser,
    whiteUser,
    viewerColor,
    canMove:
      game.status === 'ongoing' &&
      viewerColor !== null &&
      viewerColor === game.current_turn,
    moves,
    winLine: game.win_line_json ? JSON.parse(game.win_line_json) : null,
    analysis: game.analysis_json ? JSON.parse(game.analysis_json) : null,
  };
}

async function ensureMatchTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gomoku_games (
      id VARCHAR(64) PRIMARY KEY,
      status VARCHAR(16) NOT NULL,
      match_mode VARCHAR(16) NOT NULL DEFAULT 'fast',
      rule_text VARCHAR(64) NOT NULL DEFAULT '塔拉山口-10',
      board_size INT NOT NULL DEFAULT 15,
      black_user_id BIGINT NOT NULL,
      white_user_id BIGINT NULL,
      current_turn TINYINT NOT NULL DEFAULT 1,
      base_time_ms INT NOT NULL DEFAULT 180000,
      increment_ms INT NOT NULL DEFAULT 2000,
      black_time_ms INT NOT NULL DEFAULT 180000,
      white_time_ms INT NULL,
      turn_started_at DATETIME NULL,
      winner_color TINYINT NULL,
      win_line_json JSON NULL,
      analysis_json JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status(status),
      INDEX idx_black_user(black_user_id),
      INDEX idx_white_user(white_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS match_mode VARCHAR(16) NOT NULL DEFAULT 'fast'`);
  await pool.query(`ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS rule_text VARCHAR(64) NOT NULL DEFAULT '塔拉山口-10'`);
  await pool.query(`ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS base_time_ms INT NOT NULL DEFAULT 180000`);
  await pool.query(`ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS increment_ms INT NOT NULL DEFAULT 2000`);
  await pool.query(`ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS black_time_ms INT NOT NULL DEFAULT 180000`);
  await pool.query(`ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS white_time_ms INT NULL`);
  await pool.query(`ALTER TABLE gomoku_games ADD COLUMN IF NOT EXISTS turn_started_at DATETIME NULL`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gomoku_moves (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      game_id VARCHAR(64) NOT NULL,
      move_index INT NOT NULL,
      x INT NOT NULL,
      y INT NOT NULL,
      color TINYINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_game_move(game_id, move_index),
      UNIQUE KEY uniq_game_pos(game_id, x, y),
      INDEX idx_game(game_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function joinMatch(pool, userId, matchMode) {
  const mode = getMatchModeConfig(matchMode);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existingRows] = await conn.query(
      `SELECT id
       FROM gomoku_games
       WHERE status IN ('queued', 'ongoing')
         AND match_mode = ?
         AND (black_user_id = ? OR white_user_id = ?)
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [mode.key, userId, userId],
    );

    let gameId = existingRows[0]?.id;

    if (!gameId) {
      const [queueRows] = await conn.query(
        `SELECT id
         FROM gomoku_games
         WHERE status = 'queued'
           AND match_mode = ?
           AND white_user_id IS NULL
           AND black_user_id <> ?
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE`,
        [mode.key, userId],
      );

      if (queueRows[0]) {
        gameId = queueRows[0].id;
        await conn.query(
          `UPDATE gomoku_games
           SET white_user_id = ?,
               status = 'ongoing',
               current_turn = 1,
               white_time_ms = base_time_ms,
               turn_started_at = NOW()
           WHERE id = ?`,
          [userId, gameId],
        );
      } else {
        gameId = crypto.randomUUID();
        await conn.query(
          `INSERT INTO gomoku_games(
            id, status, match_mode, rule_text, board_size, black_user_id, current_turn,
            base_time_ms, increment_ms, black_time_ms, white_time_ms
          ) VALUES (?, 'queued', ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
          [
            gameId,
            mode.key,
            mode.ruleText,
            BOARD_SIZE,
            userId,
            mode.baseTimeMs,
            mode.incrementMs,
            mode.baseTimeMs,
            mode.baseTimeMs,
          ],
        );
      }
    }

    await conn.commit();
    const payload = await loadGameWithMoves(conn, gameId);
    return formatGameState(payload, userId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function cancelQueuedMatch(pool, userId, gameId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id FROM gomoku_games
       WHERE id = ?
         AND status = 'queued'
         AND black_user_id = ?
       LIMIT 1`,
      [gameId, userId],
    );
    if (!rows[0]) return false;
    await conn.query('DELETE FROM gomoku_games WHERE id = ?', [gameId]);
    return true;
  } finally {
    conn.release();
  }
}

async function getGameState(pool, gameId, viewerUserId) {
  const conn = await pool.getConnection();
  try {
    const payload = await loadGameWithMoves(conn, gameId);
    if (!payload) return null;
    return formatGameState(payload, viewerUserId);
  } finally {
    conn.release();
  }
}

async function playMove(pool, gameId, userId, x, y) {
  if (!insideBoard(x, y)) {
    throw new Error('落子超出棋盘范围');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const payload = await loadGameWithMoves(conn, gameId);
    if (!payload) throw new Error('对局不存在');

    const { game, moves } = payload;
    const liveTimes = getRemainingTimeMs(game);
    const playerColor =
      game.black_user_id === userId
        ? 1
        : game.white_user_id === userId
        ? 2
        : null;

    if (playerColor === null) throw new Error('你不是该对局玩家');
    if (game.status !== 'ongoing') throw new Error('当前对局未进行中');
    if (game.current_turn !== playerColor) throw new Error('还没轮到你');
    if ((playerColor === 1 ? liveTimes.blackTimeMs : liveTimes.whiteTimeMs) <= 0) {
      throw new Error('已超时，无法继续落子');
    }
    if (moves.some((move) => move.x === x && move.y === y)) {
      throw new Error('该位置已有棋子');
    }

    const moveIndex = moves.length + 1;
    const nextMoves = [...moves, { moveIndex, x, y, color: playerColor }];
    const winner = findWinner(nextMoves);
    const isDraw = nextMoves.length >= BOARD_SIZE * BOARD_SIZE;

    await conn.query(
      `INSERT INTO gomoku_moves(game_id, move_index, x, y, color)
       VALUES (?, ?, ?, ?, ?)`,
      [gameId, moveIndex, x, y, playerColor],
    );

    if (winner) {
      await conn.query(
        `UPDATE gomoku_games
         SET status = 'finished',
             winner_color = ?,
             win_line_json = ?,
             black_time_ms = ?,
             white_time_ms = ?,
             analysis_json = NULL
         WHERE id = ?`,
        [winner.winnerColor, JSON.stringify(winner.winLine), liveTimes.blackTimeMs, liveTimes.whiteTimeMs, gameId],
      );
    } else if (isDraw) {
      await conn.query(
        `UPDATE gomoku_games
         SET status = 'finished',
             winner_color = 0,
             win_line_json = NULL,
             black_time_ms = ?,
             white_time_ms = ?,
             analysis_json = NULL
         WHERE id = ?`,
        [liveTimes.blackTimeMs, liveTimes.whiteTimeMs, gameId],
      );
    } else {
      const nextBlackTimeMs =
        playerColor === 1 ? liveTimes.blackTimeMs + game.increment_ms : liveTimes.blackTimeMs;
      const nextWhiteTimeMs =
        playerColor === 2 ? liveTimes.whiteTimeMs + game.increment_ms : liveTimes.whiteTimeMs;
      await conn.query(
        `UPDATE gomoku_games
         SET current_turn = ?,
             black_time_ms = ?,
             white_time_ms = ?,
             turn_started_at = NOW(),
             analysis_json = NULL
         WHERE id = ?`,
        [playerColor === 1 ? 2 : 1, nextBlackTimeMs, nextWhiteTimeMs, gameId],
      );
    }

    await conn.commit();
    const latest = await loadGameWithMoves(conn, gameId);
    return formatGameState(latest, userId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

function toMoveLabel(move) {
  return `${String.fromCharCode(65 + move.x)}${BOARD_SIZE - move.y}`;
}

async function analyzeFinishedGame(pool, gameId, viewerUserId) {
  const conn = await pool.getConnection();
  try {
    const payload = await loadGameWithMoves(conn, gameId);
    if (!payload) throw new Error('对局不存在');
    if (payload.game.status !== 'finished') throw new Error('对局尚未结束');

    if (payload.game.analysis_json) {
      return {
        ...formatGameState(payload, viewerUserId),
        analysis: JSON.parse(payload.game.analysis_json),
      };
    }

    const engine = new RapfiLocalEngine({ liveOutput: false });
    const perMove = [];
    let blackMistakes = 0;
    let whiteMistakes = 0;

    try {
      for (let index = 0; index < payload.moves.length; index += 1) {
        const actualMove = payload.moves[index];
        const prefix = payload.moves
          .slice(0, index)
          .map((move) => ({ x: move.x, y: move.y, color: move.color }));

        const analysis = await engine.analyzePosition(prefix, {
          threads: ANALYZE_THREADS,
          maxDepth: ANALYZE_MAX_DEPTH,
          maxRetries: 1,
          timeoutMs: 12000,
          idleMs: 200,
        });

        const bestLabel = analysis.bestMove
          ? toMoveLabel(analysis.bestMove)
          : analysis.bestMoveLabel || null;
        const playedLabel = toMoveLabel(actualMove);
        const isMistake = Boolean(bestLabel && bestLabel !== playedLabel);

        if (isMistake) {
          if (actualMove.color === 1) blackMistakes += 1;
          else whiteMistakes += 1;
        }

        perMove.push({
          moveIndex: actualMove.moveIndex,
          color: actualMove.color,
          played: playedLabel,
          best: bestLabel,
          evalText: analysis.evalText,
          isMistake,
        });
      }
    } finally {
      await engine.close();
    }

    const summary = {
      blackMistakes,
      whiteMistakes,
      moves: perMove,
    };

    await conn.query(
      'UPDATE gomoku_games SET analysis_json = ? WHERE id = ?',
      [JSON.stringify(summary), gameId],
    );

    return {
      ...formatGameState(
        {
          ...payload,
          game: { ...payload.game, analysis_json: JSON.stringify(summary) },
        },
        viewerUserId,
      ),
      analysis: summary,
    };
  } finally {
    conn.release();
  }
}

async function getUserMatchStats(pool, userId) {
  const [rows] = await pool.query(
    `SELECT
        match_mode,
        COUNT(*) AS gameCount,
        SUM(CASE WHEN winner_color = 0 THEN 1 ELSE 0 END) AS drawCount,
        SUM(CASE
          WHEN (winner_color = 1 AND black_user_id = ?)
            OR (winner_color = 2 AND white_user_id = ?)
          THEN 1 ELSE 0 END) AS winCount,
        SUM(CASE
          WHEN winner_color IN (1, 2)
           AND NOT ((winner_color = 1 AND black_user_id = ?)
             OR (winner_color = 2 AND white_user_id = ?))
          THEN 1 ELSE 0 END) AS loseCount
     FROM gomoku_games
     WHERE status = 'finished'
       AND (black_user_id = ? OR white_user_id = ?)
     GROUP BY match_mode`,
    [userId, userId, userId, userId, userId, userId],
  );

  const [userRows] = await pool.query(
    'SELECT fast_rating, slow_rating FROM users WHERE id = ? LIMIT 1',
    [userId],
  );
  const fastRating = userRows[0]?.fast_rating ?? 1200;
  const slowRating = userRows[0]?.slow_rating ?? 1200;

  const result = {
    fast: { rating: fastRating, gameCount: 0, winCount: 0, drawCount: 0, loseCount: 0, scoreRate: null },
    slow: { rating: slowRating, gameCount: 0, winCount: 0, drawCount: 0, loseCount: 0, scoreRate: null },
  };

  for (const row of rows) {
    const target = result[row.match_mode];
    if (!target) continue;
    target.gameCount = Number(row.gameCount || 0);
    target.winCount = Number(row.winCount || 0);
    target.drawCount = Number(row.drawCount || 0);
    target.loseCount = Number(row.loseCount || 0);
    target.scoreRate =
      target.gameCount > 0
        ? Number((((target.winCount + target.drawCount * 0.5) / target.gameCount) * 100).toFixed(2))
        : null;
  }

  return result;
}

module.exports = {
  getMatchModeConfig,
  ensureMatchTables,
  joinMatch,
  cancelQueuedMatch,
  getGameState,
  playMove,
  analyzeFinishedGame,
  getUserMatchStats,
};
