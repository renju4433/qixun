const { pool } = require('../src/db');

function normalizePuzzleIds(value) {
  if (Array.isArray(value)) {
    return value.map((id) => Number(id)).filter((id) => Number.isFinite(id));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id));
      }
    } catch (_) {
      return [];
    }
  }

  return [];
}

/**
 * 每日0点执行：从题库随机选5题
 */
async function selectDailyPuzzles() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 检查今天是否已选过
  const [existing] = await pool.query(
    'SELECT id FROM daily_chess_puzzles WHERE date = ?',
    [today]
  );
  
  if (existing.length > 0) {
    console.log(`今天(${today})已选过题目`);
    return;
  }

  // 从题库随机选5题
  const [puzzles] = await pool.query(`
    SELECT id FROM chess_puzzles 
    ORDER BY RAND() 
    LIMIT 5
  `);

  if (puzzles.length < 5) {
    console.error('题库不足5题，无法选题');
    return;
  }

  const puzzleIds = puzzles.map(p => p.id);
  
  // 存储今日题目
  await pool.query(
    `INSERT INTO daily_chess_puzzles (date, puzzle_ids) 
     VALUES (?, ?)`,
    [today, JSON.stringify(puzzleIds)]
  );

  console.log(`✓ 今日(${today})已选题目: ${puzzleIds.join(', ')}`);
  return puzzleIds;
}

/**
 * 获取某日的题目（默认今天）
 */
async function getDailyPuzzles(date = null) {
  date = date || new Date().toISOString().split('T')[0];
  
  const [rows] = await pool.query(
    'SELECT puzzle_ids FROM daily_chess_puzzles WHERE date = ?',
    [date]
  );

  if (rows.length === 0) {
    console.warn(`没有找到 ${date} 的题目`);
    return [];
  }

  const puzzleIds = normalizePuzzleIds(rows[0].puzzle_ids);
  if (puzzleIds.length === 0) {
    console.warn(`${date} 的题目 ID 数据无效`);
    return [];
  }
  
  // 获取完整题目信息
  const [puzzles] = await pool.query(`
    SELECT id, fen 
    FROM chess_puzzles 
    WHERE id IN (${puzzleIds.join(',')})
  `);

  const puzzleMap = new Map(puzzles.map((p) => [p.id, p]));
  return puzzleIds.map((id) => puzzleMap.get(id)).filter(Boolean);
}

async function getDailyPuzzleIds(date = null) {
  date = date || new Date().toISOString().split('T')[0];

  const [rows] = await pool.query(
    'SELECT puzzle_ids FROM daily_chess_puzzles WHERE date = ?',
    [date]
  );

  if (rows.length === 0) {
    return [];
  }

  return normalizePuzzleIds(rows[0].puzzle_ids);
}

/**
 * 计算答题得分
 * @param {number} cpDiff - 最优步与次优步的估值差
 * @param {number} timeUsed - 使用的思考时间（秒）
 * @param {number} maxTime - 最大思考时间（秒），默认150秒(2:30)
 * @returns {number} 得分
 */
function calculatePuzzleScore() {
  return 0;
}

/**
 * 检查用户的答题
 * @param {string} userMove - 用户走的步数（如 'e2e4'）
 * @param {number} puzzleId - 题目ID
 * @param {number} timeUsed - 使用的思考时间
 */
async function checkPuzzleAnswer(puzzleId, userMove, timeUsed = 0) {
  const [rows] = await pool.query(
    'SELECT id, fen FROM chess_puzzles WHERE id = ?',
    [puzzleId]
  );

  if (rows.length === 0) {
    return { correct: false, score: 0, message: '题目不存在' };
  }

  return {
    correct: false,
    score: 0,
    bestMove: null,
    cpDiff: null,
    message: '当前题库仅存题目(FEN)，未启用答案判定',
  };
}

/**
 * 设置定时任务，每日0点执行
 */
function scheduleDaily() {
  function scheduleNextRun() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    console.log(`下次选题时间: ${tomorrow.toLocaleString()}, 等待 ${Math.round(msUntilMidnight / 1000 / 60)} 分钟`);
    
    setTimeout(async () => {
      try {
        await selectDailyPuzzles();
      } catch (err) {
        console.error('定时任务执行失败:', err);
      }
      scheduleNextRun();
    }, msUntilMidnight);
  }

  // 立即执行一次
  selectDailyPuzzles().catch(console.error);
  
  // 然后每天执行
  scheduleNextRun();
}

module.exports = {
  selectDailyPuzzles,
  getDailyPuzzles,
  getDailyPuzzleIds,
  calculatePuzzleScore,
  checkPuzzleAnswer,
  scheduleDaily,
};
