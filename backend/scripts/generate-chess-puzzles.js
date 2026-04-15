#!/usr/bin/env node

/**
 * 国际象棋题库生成脚本
 * 使用 Stockfish 引擎从随机棋局中生成有效题目
 * 
 * 运行方式:
 *   node backend/scripts/generate-chess-puzzles.js --count 100
 */

const Stockfish = require('../engine/stockfish-18.js');
const { Pool } = require('mysql2/promise');

// 配置
const CONFIG = {
  PUZZLE_COUNT: parseInt(process.argv[3] || 50),
  MIN_DEPTH: 15, // 深度调整为15
  MIN_CP_DIFF: 120,
};

// 子力值
const PIECE_VALUES = {
  p: 1, P: 1,
  n: 3, N: 3,
  b: 3, B: 3,
  r: 5, R: 5,
  q: 9, Q: 9,
};

/**
 * 计算子力差距
 */
function calculateMaterialDiff(fen) {
  const board = fen.split(' ')[0];
  let white = 0, black = 0;
  
  for (const char of board) {
    const val = PIECE_VALUES[char];
    if (!val) continue;
    if (/[A-Z]/.test(char)) white += val;
    else black += val;
  }
  
  return Math.abs(white - black);
}

/**
 * 根据子力差距计算接受概率
 * 差距越小，被接受的概率越大
 * @param {number} materialDiff - 子力差距
 * @returns {number} 0-1 之间的概率
 */
function getMaterialProbability(materialDiff) {
  // 使用指数衰减函数：e^(-materialDiff/5)
  // 这样 diff=0 时 prob=1.0, diff=5 时 prob≈0.37, diff=10 时 prob≈0.14
  return Math.exp(-materialDiff / 5);
}

/**
 * 生成完全随机的 FEN（随机放置棋子）
 */
function generateRandomFen() {
  // 初始化空棋盘
  let board = Array(8).fill(null).map(() => Array(8).fill('.'));

  // 白方棋子
  const whitePieces = ['K', 'Q', 'R', 'R', 'B', 'B', 'N', 'N', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'];
  // 黑方棋子
  const blackPieces = ['k', 'q', 'r', 'r', 'b', 'b', 'n', 'n', 'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'];

  // 随机放置白方棋子
  for (const piece of whitePieces) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
      const r = Math.floor(Math.random() * 8);
      const c = Math.floor(Math.random() * 8);
      
      // 兵不能在第1和第8行
      if ((piece === 'P' || piece === 'p') && (r === 0 || r === 7)) {
        attempts++;
        continue;
      }
      
      if (board[r][c] === '.') {
        board[r][c] = piece;
        placed = true;
      }
      attempts++;
    }
  }

  // 随机放置黑方棋子
  for (const piece of blackPieces) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
      const r = Math.floor(Math.random() * 8);
      const c = Math.floor(Math.random() * 8);
      
      // 兵不能在第1和第8行
      if ((piece === 'P' || piece === 'p') && (r === 0 || r === 7)) {
        attempts++;
        continue;
      }
      
      if (board[r][c] === '.') {
        board[r][c] = piece;
        placed = true;
      }
      attempts++;
    }
  }

  // FEN 棋盘部分
  let fen = '';
  for (let r = 0; r < 8; r++) {
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === '.') {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        fen += piece;
      }
    }
    if (empty > 0) fen += empty;
    if (r < 7) fen += '/';
  }

  // 其他 FEN 部分
  const side = 'w';
  const castling = '-'; // 随机放置，不允许易位
  const enpassant = '-';
  const halfmove = 0;
  const fullmove = Math.max(1, Math.floor(Math.random() * 100));

  return `${fen} ${side} ${castling} ${enpassant} ${halfmove} ${fullmove}`;
}

/**
 * 使用本地 Stockfish-18 分析位置
 */
async function analyzeWithStockfish(engine, fen) {
  return new Promise((resolve) => {
    const moves = [];
    let completed = false;
    
    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        engine.onmessage = null;
        resolve({ moves: [] });
      }
    }, 15000); // 15秒超时

    engine.onmessage = (msg) => {
      if (completed) return;

      // 解析 info 行
      if (msg.includes('info') && msg.includes('cp') && msg.includes('pv')) {
        const depthMatch = msg.match(/depth\s+(\d+)/);
        const pvMatch = msg.match(/pv\s+(\S+)/);
        const cpMatch = msg.match(/cp\s+(-?\d+)/);

        if (depthMatch && pvMatch && cpMatch && parseInt(depthMatch[1]) >= CONFIG.MIN_DEPTH) {
          const move = pvMatch[1];
          const cp = parseInt(cpMatch[1]);

          const existing = moves.find(m => m.move === move);
          if (existing) {
            if (Math.abs(cp) > Math.abs(existing.cp)) {
              existing.cp = cp;
            }
          } else {
            moves.push({ move, cp });
          }
        }
      }

      if (msg.includes('bestmove')) {
        clearTimeout(timeout);
        completed = true;
        engine.onmessage = null;
        resolve({ moves });
      }
    };

    // 发送到 Stockfish
    engine.postMessage(`setoption name MultiPV value 99`);
    engine.postMessage(`position fen ${fen}`);
    engine.postMessage(`go depth ${CONFIG.MIN_DEPTH}`);
  });
}

/**
 * 检查题目有效性
 */
function isValidPuzzle(moves, materialDiff) {
  if (moves.length < 2) return false;

  // 根据子力差距计算接受概率
  const probability = getMaterialProbability(materialDiff);
  return Math.random() < probability;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 国际象棋题库生成器');
  console.log(`📊 目标: 生成 ${CONFIG.PUZZLE_COUNT} 个题目`);
  console.log(`⚙️  配置: 深度=${CONFIG.MIN_DEPTH}, 最小差距=${CONFIG.MIN_CP_DIFF}cp\n`);

  // 初始化 Stockfish
  console.log('⏳ 启动 Stockfish...');
  const engine = await Stockfish();
  console.log('✓ Stockfish 已启动\n');

  // 数据库连接
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qixun',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  });

  try {
    // 初始化表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chess_puzzles (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        fen VARCHAR(255) NOT NULL UNIQUE,
        moves JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at(created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✓ 数据库表初始化完成\n');

    let generated = 0;
    let attempts = 0;
    const maxAttempts = CONFIG.PUZZLE_COUNT * 15;

    while (generated < CONFIG.PUZZLE_COUNT && attempts < maxAttempts) {
      attempts++;

      // 生成随机 FEN
      const fen = generateRandomFen();
      const materialDiff = calculateMaterialDiff(fen);

      // 检查重复
      try {
        const [existing] = await pool.query(
          'SELECT id FROM chess_puzzles WHERE fen = ? LIMIT 1',
          [fen]
        );
        if (existing.length > 0) {
          process.stdout.write('.');
          continue;
        }
      } catch (e) {
        continue;
      }

      // 分析
      const { moves } = await analyzeWithStockfish(engine, fen);

      if (!isValidPuzzle(moves, materialDiff)) {
        process.stdout.write('.');
        continue;
      }

      // 保存
      try {
        await pool.query(
          `INSERT INTO chess_puzzles (fen, moves)
           VALUES (?, ?)`,
          [fen, JSON.stringify(moves)]
        );

        generated++;
        process.stdout.write('✓');
        if (generated % 10 === 0) {
          console.log(` [${generated}/${CONFIG.PUZZLE_COUNT}]`);
        }
      } catch (e) {
        process.stdout.write('.');
      }
    }

    console.log(`\n\n✅ 完成! 生成了 ${generated} 个题目 (尝试 ${attempts} 次)`);
  } catch (err) {
    console.error('❌ 错误:', err);
  } finally {
    await pool.end();
    if (engine.terminate) engine.terminate();
    process.exit(0);
  }
}

main();
