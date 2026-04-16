const crypto = require('crypto');
const { RapfiLocalEngine } = require('./rapfi-local');

const BOARD_SIZE = 15;
const ANALYZE_MAX_DEPTH = Number(process.env.GOMOKU_ANALYZE_DEPTH || 10);
const ANALYZE_THREADS = Number(process.env.GOMOKU_ANALYZE_THREADS || 1);

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

async function loadGameWithMoves(conn, gameId) {
  const [gameRows] = await conn.query(
    'SELECT * FROM gomoku_games WHERE id = ? LIMIT 1',
    [gameId],
  );
  const game = gameRows[0];
  if (!game) return null;

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
  const viewerColor =
    game.black_user_id === viewerUserId
      ? 1
      : game.white_user_id === viewerUserId
      ? 2
      : null;

  return {
    id: game.id,
    status: game.status,
    boardSize: game.board_size,
    currentTurn: game.current_turn,
    winnerColor: game.winner_color,
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
      board_size INT NOT NULL DEFAULT 15,
      black_user_id BIGINT NOT NULL,
      white_user_id BIGINT NULL,
      current_turn TINYINT NOT NULL DEFAULT 1,
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

async function joinMatch(pool, userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existingRows] = await conn.query(
      `SELECT id
       FROM gomoku_games
       WHERE status IN ('queued', 'ongoing')
         AND (black_user_id = ? OR white_user_id = ?)
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [userId, userId],
    );

    let gameId = existingRows[0]?.id;

    if (!gameId) {
      const [queueRows] = await conn.query(
        `SELECT id
         FROM gomoku_games
         WHERE status = 'queued'
           AND white_user_id IS NULL
           AND black_user_id <> ?
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE`,
        [userId],
      );

      if (queueRows[0]) {
        gameId = queueRows[0].id;
        await conn.query(
          `UPDATE gomoku_games
           SET white_user_id = ?, status = 'ongoing', current_turn = 1
           WHERE id = ?`,
          [userId, gameId],
        );
      } else {
        gameId = crypto.randomUUID();
        await conn.query(
          `INSERT INTO gomoku_games(
            id, status, board_size, black_user_id, current_turn
          ) VALUES (?, 'queued', ?, ?, 1)`,
          [gameId, BOARD_SIZE, userId],
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
    const playerColor =
      game.black_user_id === userId
        ? 1
        : game.white_user_id === userId
        ? 2
        : null;

    if (playerColor === null) throw new Error('你不是该对局玩家');
    if (game.status !== 'ongoing') throw new Error('当前对局未进行中');
    if (game.current_turn !== playerColor) throw new Error('还没轮到你');
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
             analysis_json = NULL
         WHERE id = ?`,
        [winner.winnerColor, JSON.stringify(winner.winLine), gameId],
      );
    } else if (isDraw) {
      await conn.query(
        `UPDATE gomoku_games
         SET status = 'finished',
             winner_color = 0,
             win_line_json = NULL,
             analysis_json = NULL
         WHERE id = ?`,
        [gameId],
      );
    } else {
      await conn.query(
        `UPDATE gomoku_games
         SET current_turn = ?, analysis_json = NULL
         WHERE id = ?`,
        [playerColor === 1 ? 2 : 1, gameId],
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

module.exports = {
  ensureMatchTables,
  joinMatch,
  cancelQueuedMatch,
  getGameState,
  playMove,
  analyzeFinishedGame,
};
