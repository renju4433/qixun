#!/usr/bin/env node

/**
 * 国际象棋题目生成脚本（直接调用本地 Stockfish exe）
 *
 * 只存题目 FEN，不存走法和估值。
 *
 * 用法:
 *   node backend/scripts/generate-chess-puzzles.js --count 100
 *
 * 环境变量:
 *   DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
 *   STOCKFISH_EXE_PATH (可选，默认使用项目根目录 exe)
 */

const mysql = require('mysql2/promise');
const { analyzeFenLocal, findExePath } = require('../src/stockfish-local');

const hasFlag = (flag) => process.argv.includes(flag);
const getArg = (name, fallback) => {
  const idx = process.argv.findIndex((x) => x === name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
};

const DEFAULT_WHITE_PIECES = 'KQRRBBNNPPPPPPPP';
const DEFAULT_BLACK_PIECES = 'kqrrbbnnpppppppp';

function parsePieceList(value, side) {
  const normalized = String(value || '').replace(/\s+/g, '');
  if (!normalized) return [];

  const allowed = side === 'white' ? /^[KQRBNP]+$/ : /^[kqrbnp]+$/;
  if (!allowed.test(normalized)) {
    throw new Error(
      side === 'white'
        ? '白方棋子参数只能包含大写 KQRBNP'
        : '黑方棋子参数只能包含小写 kqrbnp',
    );
  }

  return normalized.split('');
}

function resolvePieceConfig() {
  const piecesArg = getArg('--pieces', '');
  const whiteArg = getArg('--white-pieces', '');
  const blackArg = getArg('--black-pieces', '');

  if (piecesArg) {
    const combined = String(piecesArg).replace(/\s+/g, '');
    if (!/^[KQRBNPkqrbnp]+$/.test(combined)) {
      throw new Error('--pieces 只能包含 KQRBNP 和 kqrbnp');
    }
    const whitePieces = combined
      .split('')
      .filter((ch) => ch >= 'A' && ch <= 'Z');
    const blackPieces = combined
      .split('')
      .filter((ch) => ch >= 'a' && ch <= 'z');
    return {
      whitePieces,
      blackPieces,
      source: `--pieces ${combined}`,
    };
  }

  const whitePieces = parsePieceList(whiteArg || DEFAULT_WHITE_PIECES, 'white');
  const blackPieces = parsePieceList(blackArg || DEFAULT_BLACK_PIECES, 'black');
  const source =
    whiteArg || blackArg
      ? `--white-pieces ${whitePieces.join('')} --black-pieces ${blackPieces.join('')}`
      : 'default';

  return { whitePieces, blackPieces, source };
}

function validatePieceSetup(whitePieces, blackPieces) {
  const whiteKings = whitePieces.filter((piece) => piece === 'K').length;
  const blackKings = blackPieces.filter((piece) => piece === 'k').length;

  if (whiteKings !== 1 || blackKings !== 1) {
    throw new Error('白方和黑方都必须且只能有 1 个王（K 和 k）');
  }

  if (whitePieces.length + blackPieces.length > 64) {
    throw new Error('棋子总数不能超过 64');
  }
}

const PIECE_CONFIG = resolvePieceConfig();
validatePieceSetup(PIECE_CONFIG.whitePieces, PIECE_CONFIG.blackPieces);

const CONFIG = {
  PUZZLE_COUNT: parseInt(getArg('--count', '50'), 10),
  MAX_ATTEMPTS: parseInt(getArg('--max-attempts', '999999'), 10),
  DEPTH: parseInt(process.env.SF_DEPTH || getArg('--depth', '22'), 10),
  MULTIPV: parseInt(process.env.SF_MULTIPV || getArg('--multipv', '2'), 10),
  MIN_CP_GAP: parseInt(process.env.SF_MIN_CP_GAP || getArg('--min-cp-gap', '100'), 10),
  TIMEOUT_MS: parseInt(process.env.SF_TIMEOUT_MS || getArg('--timeout-ms', '999999'), 10),
  ENGINE_LOG: hasFlag('--engine-log') || hasFlag('-v'),
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomFen() {
  const board = Array(8).fill(null).map(() => Array(8).fill('.'));

  const placePiece = (piece) => {
    for (let i = 0; i < 80; i++) {
      const r = randomInt(0, 7);
      const c = randomInt(0, 7);
      if ((piece === 'P' || piece === 'p') && (r === 0 || r === 7)) continue;
      if (board[r][c] === '.') {
        board[r][c] = piece;
        return true;
      }
    }
    return false;
  };

  PIECE_CONFIG.whitePieces.forEach(placePiece);
  PIECE_CONFIG.blackPieces.forEach(placePiece);

  let fenBoard = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === '.') empty++;
      else {
        if (empty > 0) {
          fenBoard += empty;
          empty = 0;
        }
        fenBoard += board[r][c];
      }
    }
    if (empty > 0) fenBoard += empty;
    if (r < 7) fenBoard += '/';
  }

  const side = 'w';
  return `${fenBoard} ${side} - - 0 0`;
}

async function validateFenByStockfish(fen) {
  let data = null;
  try {
    data = await analyzeFenLocal({
      fen,
      depth: CONFIG.DEPTH,
      timeoutMs: CONFIG.TIMEOUT_MS,
      multipv: CONFIG.MULTIPV,
    });
  } catch (err) {
    return { ok: false, reason: err.message || 'engine failed' };
  }

  if (CONFIG.ENGINE_LOG) {
    console.log('[stockfish]', data);
  }

  const raw =
    (data &&
      (data.bestmove ||
        data.bestMove ||
        data.move ||
        (data.from && data.to ? `${data.from}${data.to}${data.promotion || ''}` : '') ||
        data.continuation)) ||
    '';
  const bestMove = String(raw).trim();

  if (!bestMove || bestMove === '(none)' || bestMove === 'none') return { ok: false, reason: 'no bestmove' };

  const evalsRaw = data?.evals || {};
  const entries = Object.entries(evalsRaw)
    .map(([move, cp]) => ({ move: String(move).trim(), cp: Number(cp) }))
    .filter((item) => item.move && Number.isFinite(item.cp));

  if (entries.length < 2) {
    return { ok: false, reason: 'multipv不足2条' };
  }

  const bestEntry =
    entries.find((item) => item.move === bestMove) ||
    entries.slice().sort((a, b) => b.cp - a.cp)[0];

  const secondEntry = entries
    .filter((item) => item.move !== bestEntry.move)
    .sort((a, b) => b.cp - a.cp)[0];

  if (!bestEntry || !secondEntry) {
    return { ok: false, reason: '无法识别前两候选着法' };
  }

  const cpGap = Math.abs(bestEntry.cp - secondEntry.cp);
  if (cpGap < CONFIG.MIN_CP_GAP) {
    return {
      ok: false,
      reason: `差距不足: ${bestEntry.move}(${bestEntry.cp}) vs ${secondEntry.move}(${secondEntry.cp}), gap=${cpGap}`,
    };
  }

  return { ok: true, bestMove, secondMove: secondEntry.move, cpGap };
}

async function ensurePuzzleTableSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chess_puzzles (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      fen VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at(created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chess_puzzles'`,
  );

  const columnSet = new Set(columns.map((col) => col.COLUMN_NAME));
  const legacyColumns = ['moves', 'best_move', 'cp_diff', 'difficulty'];

  for (const column of legacyColumns) {
    if (columnSet.has(column)) {
      await pool.query(`ALTER TABLE chess_puzzles DROP COLUMN \`${column}\``);
    }
  }
}

async function main() {
  const exePath = findExePath();
  if (!exePath) {
    throw new Error('未找到 Stockfish exe，请设置 STOCKFISH_EXE_PATH 或把 exe 放到项目根目录');
  }

  console.log('🚀 国际象棋题库生成器（本地 Stockfish exe）');
  console.log(`📊 目标: ${CONFIG.PUZZLE_COUNT} 题`);
  console.log(`🧠 引擎: ${exePath}`);
  console.log(`⚙️ 深度: ${CONFIG.DEPTH}`);
  console.log(`♟️ MultiPV: ${CONFIG.MULTIPV}`);
  console.log(`⏱️ 超时: ${CONFIG.TIMEOUT_MS}ms`);
  console.log(`📏 最小差距: ${CONFIG.MIN_CP_GAP}cp\n`);
  console.log(`♙ 白方棋子: ${PIECE_CONFIG.whitePieces.join('')}`);
  console.log(`♟ 黑方棋子: ${PIECE_CONFIG.blackPieces.join('')}`);
  console.log(`🧩 棋子参数: ${PIECE_CONFIG.source}\n`);

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qixun',
    connectionLimit: 2,
    charset: 'utf8mb4',
  });

  try {
    await ensurePuzzleTableSchema(pool);

    let generated = 0;
    let attempts = 0;

    while (generated < CONFIG.PUZZLE_COUNT && attempts < CONFIG.MAX_ATTEMPTS) {
      attempts++;
      const fen = generateRandomFen();

      const [exists] = await pool.query('SELECT id FROM chess_puzzles WHERE fen = ? LIMIT 1', [fen]);
      if (exists.length > 0) {
        process.stdout.write('.');
        continue;
      }

      console.log(`\n[${attempts}] 验证中: ${fen}`);
      const check = await validateFenByStockfish(fen);
      if (!check.ok) {
        console.log(`[${attempts}] 跳过: ${check.reason}`);
        process.stdout.write('.');
        continue;
      }

      await pool.query('INSERT INTO chess_puzzles (fen) VALUES (?)', [fen]);
      generated++;
      process.stdout.write('✓');
      console.log(` [${generated}/${CONFIG.PUZZLE_COUNT}] best=${check.bestMove}, second=${check.secondMove}, gap=${check.cpGap}`);
    }

    console.log(`\n✅ 完成：生成 ${generated} 题，尝试 ${attempts} 次`);
  } catch (err) {
    console.error('❌ 错误:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
