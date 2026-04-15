require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, initDb } = require('./db');
const {
  selectDailyPuzzles,
  getDailyPuzzles,
  checkPuzzleAnswer,
  scheduleDaily,
} = require('./puzzle-service');

const app = express();
const port = Number(process.env.PORT || 3002);

const corsOrigins = (process.env.CORS_ORIGIN || 'https://saiyuan.top')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const smsCodes = new Map();
const defaultChallengeProvider = {
  userId: 0,
  userName: '棋寻',
  icon: '',
  ups: 0,
  followers: 0,
  focus: 0,
  desc: null,
  rating: 1200,
  puzzleRating: 1200,
  province: null,
  organization: null,
  avatarFrame: null,
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  // 兼容 nginx 未去掉 /api 前缀的场景
  if (req.url === '/api') req.url = '/';
  else if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  next();
});
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(cookieParser(process.env.COOKIE_SECRET || 'qixun-secret'));

function ok(data = null) {
  return { success: true, data };
}

function fail(errorMessage, errorCode = 400) {
  return { success: false, errorCode, errorMessage, data: null };
}

function toUserProfile(row) {
  return {
    userId: row.id,
    userName: row.user_name,
    icon: row.icon || '',
    ups: 0,
    followers: 0,
    focus: 0,
    desc: row.desc || null,
    rating: row.rating ?? 1200,
    puzzleRating: row.puzzle_rating ?? 1200,
    province: row.province || null,
    organization: null,
    avatarFrame: null,
  };
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await pool.query(
    'INSERT INTO user_sessions(token, user_id, expires_at) VALUES (?, ?, ?)',
    [token, userId, expiresAt],
  );
  return { token, expiresAt };
}

async function getSessionUser(req) {
  const token = req.signedCookies.qixun_sid || req.cookies.qixun_sid;
  if (!token) return null;
  const [rows] = await pool.query(
    `SELECT u.* FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > NOW()
     LIMIT 1`,
    [token],
  );
  return rows[0] || null;
}

async function requireUser(req, res, next) {
  const user = await getSessionUser(req);
  if (!user) return res.json(fail('未登录', 401));
  req.user = user;
  return next();
}

function setAuthCookie(res, token) {
  res.cookie('qixun_sid', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: '/',
  });
}

function readParam(req, ...keys) {
  for (const key of keys) {
    const v = req.query?.[key] ?? req.body?.[key];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}

function getTodayChallengeId(type) {
  const day = new Date().toISOString().slice(0, 10);
  return `daily-${day}-${type}`;
}

function makeReadyGameInfo(type) {
  const challengeId = getTodayChallengeId(type);
  return {
    id: challengeId,
    status: 'ready',
    health: 10000,
    type: 'challenge',
    challengeId,
    player: {
      totalScore: 0,
      roundResults: [],
    },
    rounds: [],
    currentRound: null,
    roundNumber: 5,
    roundTimePeriod: null,
    roundTimeGuessPeriod: null,
    timerStartTime: null,
    startTimerPeriod: null,
    mapsName: type === 'world' ? '每日挑战-全球' : '每日挑战-中国',
    mapsId: null,
    teams: null,
    playerIds: null,
    requestUserId: null,
    host: defaultChallengeProvider,
  };
}

app.get('/health', (_req, res) => res.json(ok({ status: 'ok' })));

app.get('/v0/time/getTime', (_req, res) => res.json(ok(Date.now())));
app.get('/v0/qixun/UA/getTime', (_req, res) => res.json(ok(Date.now())));

app.post('/v0/phone/getCodeV3', (req, res) => {
  const phone = String(req.body.phone || '').trim();
  if (!phone) return res.json(fail('手机号不能为空'));
  smsCodes.set(phone, { code: '123456', expiresAt: Date.now() + 5 * 60 * 1000 });
  return res.json(ok(null));
});

app.post('/register', async (req, res) => {
  try {
    const userName = readParam(req, 'userName', 'username', 'user_name');
    const password = readParam(req, 'password', 'pwd');
    const phone = readParam(req, 'phone', 'mobile', 'phoneNumber');

    if (!userName || !password) return res.json(fail('参数不完整'));

    const hash = await bcrypt.hash(password, 10);
    const [exists] = await pool.query('SELECT id FROM users WHERE user_name = ? LIMIT 1', [userName]);
    if (exists.length > 0) return res.json(fail('用户名已存在'));

    const [ret] = await pool.query(
      'INSERT INTO users(user_name, phone, password_hash, rating, puzzle_rating) VALUES (?, ?, ?, ?, ?)',
      [userName, phone || null, hash, 1200, 1200],
    );

    const { token } = await createSession(ret.insertId);
    setAuthCookie(res, token);
    return res.json(ok(null));
  } catch (err) {
    return res.json(fail(`注册失败: ${err.message}`));
  }
});

app.all('/login', async (req, res) => {
  try {
    const userName = readParam(req, 'userName', 'username', 'user_name', 'phone');
    const password = readParam(req, 'password', 'pwd');
    if (!userName || !password) return res.json(fail('账号或密码不能为空'));

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE user_name = ? OR phone = ? LIMIT 1',
      [userName, userName],
    );
    const user = rows[0];
    if (!user) return res.json(fail('账号不存在'));

    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) return res.json(fail('密码错误'));

    const { token } = await createSession(user.id);
    setAuthCookie(res, token);
    return res.json(
      ok({
        name: 'qixun_sid',
        value: token,
        version: 0,
        comment: null,
        maxAge: 2592000,
      }),
    );
  } catch (err) {
    return res.json(fail(`登录失败: ${err.message}`));
  }
});

app.all('/logout', async (req, res) => {
  try {
    const token = req.signedCookies.qixun_sid || req.cookies.qixun_sid;
    if (token) await pool.query('DELETE FROM user_sessions WHERE token = ?', [token]);
    res.clearCookie('qixun_sid', { path: '/' });
    return res.json(ok(null));
  } catch (err) {
    return res.json(fail(`退出失败: ${err.message}`));
  }
});

app.get('/v0/qixun/user/getSelfProfile', requireUser, async (req, res) =>
  res.json(ok(toUserProfile(req.user))),
);
app.get('/v0/qixun/user/getSelf', requireUser, async (req, res) =>
  res.json(ok(toUserProfile(req.user))),
);
app.get('/v0/qixun/user/getProfile', async (req, res) => {
  const userId = Number(req.query.userId || 0);
  if (!userId) return res.json(fail('userId不能为空'));
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!rows[0]) return res.json(fail('用户不存在'));
  return res.json(ok(toUserProfile(rows[0])));
});

app.get('/v0/qixun/user/checkBind', requireUser, async (req, res) => {
  return res.json(
    ok({
      phone: !!req.user.phone,
      wechat: false,
      apple: false,
      phoneNumber: req.user.phone || null,
    }),
  );
});

app.get('/v0/qixun/activity/list', (_req, res) => {
  return res.json(
    ok({
      normalActivities: [
        { title: '每日挑战', link: '/daily-challenge' },
        { title: '匹配', link: '/match' },
      ],
      specialActivities: [],
    }),
  );
});

app.get('/v0/qixun/challenge/getDailyChallengeId', (req, res) => {
  const type = String(req.query.type || 'china');
  return res.json(ok(getTodayChallengeId(type)));
});

app.get('/v0/qixun/challenge/getDailyChallengeInfo', (req, res) => {
  const type = String(req.query.type || 'china');
  return res.json(
    ok({
      challengeId: getTodayChallengeId(type),
      provider: defaultChallengeProvider,
    }),
  );
});

app.get('/v0/qixun/challenge/rankTotal', (_req, res) => res.json(ok(0)));

app.get('/v0/qixun/challenge/getGameInfo', (req, res) => {
  const type = String(req.query.type || 'china');
  return res.json(ok(makeReadyGameInfo(type)));
});

app.get('/v0/qixun/challenge/getDailyChallengeRank', (_req, res) => {
  return res.json(
    ok({
      moreThan: null,
      percent: null,
      rank: null,
      total: null,
    }),
  );
});

app.get('/v0/qixun/message/check', (_req, res) => res.json(ok(0)));
app.get('/v0/qixun/vip/check', (_req, res) => res.json(ok(null)));
app.get('/v0/qixun/vip/checkIsVip', (_req, res) => res.json(ok(false)));

// ========== 国际象棋题库接口 ==========

/**
 * 获取今日国际象棋题目列表
 */
app.get('/v0/qixun/chess/puzzles/daily', async (req, res) => {
  try {
    const puzzles = await getDailyPuzzles();
    return res.json(
      ok({
        puzzles: puzzles.map((p) => ({
          id: p.id,
          fen: p.fen,
          moves: JSON.parse(p.moves),
        })),
        timePerPuzzle: 150, // 2:30秒
      })
    );
  } catch (err) {
    return res.json(fail(`获取题目失败: ${err.message}`));
  }
});

/**
 * 获取单个题目详情
 */
app.get('/v0/qixun/chess/puzzles/:puzzleId', async (req, res) => {
  try {
    const puzzleId = Number(req.params.puzzleId);
    const [rows] = await pool.query(
      'SELECT id, fen, best_move, cp_diff, moves, difficulty FROM chess_puzzles WHERE id = ?',
      [puzzleId]
    );

    if (rows.length === 0) {
      return res.json(fail('题目不存在'));
    }

    const p = rows[0];
    return res.json(
      ok({
        id: p.id,
        fen: p.fen,
        bestMove: p.best_move,
        cpDiff: p.cp_diff,
        moves: JSON.parse(p.moves),
        difficulty: p.difficulty,
      })
    );
  } catch (err) {
    return res.json(fail(`获取题目失败: ${err.message}`));
  }
});

/**
 * 提交答案并获得评分
 * POST { puzzleId, userMove, timeUsed }
 */
app.post('/v0/qixun/chess/puzzles/answer', async (req, res) => {
  try {
    const { puzzleId, userMove, timeUsed } = req.body;

    if (!puzzleId || !userMove) {
      return res.json(fail('参数不完整'));
    }

    const result = await checkPuzzleAnswer(
      puzzleId,
      userMove,
      timeUsed || 0
    );

    return res.json(
      ok({
        correct: result.correct,
        score: result.score,
        bestMove: result.bestMove,
        message: result.message,
      })
    );
  } catch (err) {
    return res.json(fail(`答题检查失败: ${err.message}`));
  }
});

async function start() {
  await initDb();
  
  // 清理过期会话
  setInterval(() => {
    pool.query('DELETE FROM user_sessions WHERE expires_at <= NOW()').catch(() => {});
  }, 10 * 60 * 1000).unref();

  // 启动每日题目选择定时任务
  try {
    scheduleDaily();
    console.log('已启动每日题目选择任务');
  } catch (err) {
    console.error('启动定时任务失败:', err);
  }

  app.listen(port, () => {
    console.log(`qixun-api listening on :${port}`);
  });
}

start().catch((err) => {
  console.error('failed to start api', err);
  process.exit(1);
});
