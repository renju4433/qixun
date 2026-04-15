const { pool } = require('../src/db');

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
  const [result] = await pool.query(
    `INSERT INTO daily_chess_puzzles (puzzle_id, date, puzzle_ids) 
     VALUES (?, ?, ?)`,
    [puzzleIds[0], today, JSON.stringify(puzzleIds)]
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

  const puzzleIds = JSON.parse(rows[0].puzzle_ids);
  
  // 获取完整题目信息
  const [puzzles] = await pool.query(`
    SELECT id, fen, moves 
    FROM chess_puzzles 
    WHERE id IN (${puzzleIds.join(',')})
  `);

  return puzzles;
}

/**
 * 计算答题得分
 * @param {number} cpDiff - 最优步与次优步的估值差
 * @param {number} timeUsed - 使用的思考时间（秒）
 * @param {number} maxTime - 最大思考时间（秒），默认150秒(2:30)
 * @returns {number} 得分
 */
function calculatePuzzleScore(cpDiff, timeUsed = 0, maxTime = 150) {
  // 基础分：5000 * e^(-cpDiff/200)
  const baseScore = 5000 * Math.exp(-cpDiff / 200);
  
  // 如果超时则得0分
  if (timeUsed > maxTime) {
    return 0;
  }
  
  // 时间越短，得分越高（奖励快速正确）
  // 时间系数：1.0 - 0.5 = 0.5 (最少0.5倍，最多1.0倍)
  const timeCoefficient = 1 - (timeUsed / maxTime) * 0.5;
  
  return Math.round(baseScore * timeCoefficient);
}

/**
 * 检查用户的答题
 * @param {string} userMove - 用户走的步数（如 'e2e4'）
 * @param {number} puzzleId - 题目ID
 * @param {number} timeUsed - 使用的思考时间
 */
async function checkPuzzleAnswer(puzzleId, userMove, timeUsed = 0) {
  const [rows] = await pool.query(`
    SELECT id, moves FROM chess_puzzles WHERE id = ?
  `, [puzzleId]);

  if (rows.length === 0) {
    return { correct: false, score: 0, message: '题目不存在' };
  }

  const puzzle = rows[0];
  const moves = JSON.parse(puzzle.moves);
  
  // 找到最优走法（评分最高的）
  const sorted = [...moves].sort((a, b) => b.cp - a.cp);
  const bestMove = sorted[0].move;
  const cpDiff = Math.abs(sorted[0].cp - sorted[1].cp);

  const isCorrect = userMove.toLowerCase() === bestMove.toLowerCase();
  const score = isCorrect ? calculatePuzzleScore(cpDiff, timeUsed) : 0;

  return {
    correct: isCorrect,
    score,
    bestMove,
    cpDiff,
    message: isCorrect 
      ? `正确！获得 ${score} 分` 
      : `错误！正确走法是 ${bestMove}`
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
  calculatePuzzleScore,
  checkPuzzleAnswer,
  scheduleDaily,
};
