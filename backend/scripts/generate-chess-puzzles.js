#!/usr/bin/env node

/**
 * 国际象棋题目生成脚本（Stockfish API 版）
 *
 * 只存题目 FEN，不存走法和估值。
 *
 * 用法:
 *   node backend/scripts/generate-chess-puzzles.js --count 100
 *
 * 环境变量:
 *   DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
 *   STOCKFISH_API_URL (默认: https://chess-api.com/v1)
 */

const mysql = require('mysql2/promise');

const hasFlag = (flag) => process.argv.includes(flag);
const getArg = (name, fallback) => {
  const idx = process.argv.findIndex((x) => x === name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
};

const CONFIG = {
  PUZZLE_COUNT: parseInt(getArg('--count', '50'), 10),
  MAX_ATTEMPTS: parseInt(getArg('--max-attempts', '1000'), 10),
  DEPTH: parseInt(process.env.SF_DEPTH || getArg('--depth', '15'), 10),
  API_URL: process.env.STOCKFISH_API_URL || getArg('--api-url', 'https://chess-api.com/v1'),
  ENGINE_LOG: hasFlag('--engine-log') || hasFlag('-v'),
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomFen() {
  const board = Array(8).fill(null).map(() => Array(8).fill('.'));

  const whitePieces = ['K', 'Q', 'R', 'R', 'B', 'B', 'N', 'N', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'];
  const blackPieces = ['k', 'q', 'r', 'r', 'b', 'b', 'n', 'n', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'];

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

  whitePieces.forEach(placePiece);
  blackPieces.forEach(placePiece);

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

  const side = Math.random() < 0.5 ? 'w' : 'b';
  return `${fenBoard} ${side} - - 0 ${randomInt(1, 120)}`;
}

async function validateFenByStockfishApi(fen) {
  const payload = { fen, depth: CONFIG.DEPTH };
  let res = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  let text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = null;
  }

  // 部分网关对 POST JSON 兼容差，自动回退 GET
  if ((!res.ok || (data && data.success === false)) && String(data?.error || '').includes('Missing parameter')) {
    const url = `${CONFIG.API_URL}?fen=${encodeURIComponent(fen)}&depth=${CONFIG.DEPTH}`;
    res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = null;
    }
  }

  if (CONFIG.ENGINE_LOG) {
    console.log('[stockfishapi]', data || text.slice(0, 200));
  }

  // 兼容常见返回格式
  const raw =
    (data &&
      (data.bestmove ||
        data.bestMove ||
        data.move ||
        (data.from && data.to ? `${data.from}${data.to}${data.promotion || ''}` : '') ||
        data.data?.bestmove ||
        data.data?.bestMove ||
        data.data?.move ||
        data.continuation)) ||
    '';
  const bestMove = String(raw).trim();

  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
  if (!bestMove || bestMove === '(none)' || bestMove === 'none') return { ok: false, reason: 'no bestmove' };
  return { ok: true, bestMove };
}

async function main() {
  console.log('🚀 国际象棋题库生成器（Stockfish API）');
  console.log(`📊 目标: ${CONFIG.PUZZLE_COUNT} 题`);
  console.log(`🔗 API: ${CONFIG.API_URL}`);
  console.log(`⚙️ 深度: ${CONFIG.DEPTH}\n`);

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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chess_puzzles (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        fen VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at(created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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
      const check = await validateFenByStockfishApi(fen);
      if (!check.ok) {
        console.log(`[${attempts}] 跳过: ${check.reason}`);
        process.stdout.write('.');
        continue;
      }

      await pool.query('INSERT INTO chess_puzzles (fen) VALUES (?)', [fen]);
      generated++;
      process.stdout.write('✓');
      console.log(` [${generated}/${CONFIG.PUZZLE_COUNT}]`);
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
