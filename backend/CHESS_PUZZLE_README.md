# 国际象棋题库系统使用说明

## 📋 系统概述

完整的国际象棋在线题库系统，包含：
- 自动题库生成（使用 Stockfish 引擎）
- 每日0点自动选题（随机5题）
- 答题评分（基于估值差和思考时间）
- RESTful API 接口

## 🔧 系统要求

### 服务器依赖
```bash
# Ubuntu/Debian
sudo apt-get install stockfish

# macOS
brew install stockfish

# CentOS
sudo yum install stockfish
```

### Node.js 依赖 (已在 package.json 中包含)
```json
{
  "mysql2": "^3.x",
  "express": "^4.x",
  "cors": "^2.x"
}
```

## 📂 文件结构

```
backend/
├── src/
│   ├── db.js                    # 数据库连接和初始化
│   ├── index.js                 # 主服务器（含 API 路由）
│   └── puzzle-service.js        # 题库业务逻辑
└── scripts/
    └── generate-chess-puzzles.js # 题库生成脚本
```

## 🚀 快速开始

### 1. 初始化数据库

后端启动时会自动创建数据库表：
```sql
CREATE TABLE chess_puzzles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  fen VARCHAR(255) NOT NULL UNIQUE,           -- 棋局FEN码
  best_move VARCHAR(10) NOT NULL,             -- 最优走法
  cp_diff INT NOT NULL,                       -- 估值差（厘帕）
  moves JSON NOT NULL,                        -- 所有走法: [{move, cp}, ...]
  difficulty INT DEFAULT 1,                   -- 难度 1-5
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_chess_puzzles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  puzzle_id BIGINT NOT NULL,
  date DATE NOT NULL UNIQUE,                  -- 题目日期
  puzzle_ids JSON NOT NULL,                   -- 今日5题 ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (puzzle_id) REFERENCES chess_puzzles(id)
);
```

### 2. 生成题库

使用脚本生成初始的 N 个题目：

```bash
cd backend

# 生成 100 个题目
DB_HOST=127.0.0.1 DB_USER=qixun DB_PASSWORD='xswbddyJTNz8TyWi' \
DB_NAME=qixun node scripts/generate-chess-puzzles.js --count 100

# 生成 50 个题目（默认）
DB_HOST=127.0.0.1 DB_USER=qixun DB_PASSWORD='xswbddyJTNz8TyWi' \
DB_NAME=qixun node scripts/generate-chess-puzzles.js
```

**脚本工作原理：**
1. 从开局库中随机选择起始位置
2. 用 Stockfish (深度 15) 评估
3. 筛选满足条件的题目：
   - 最优走法与次优走法差距 ≥ 150cp
4. 存储到数据库

**输出示例：**
```
🚀 国际象棋题库生成器
📊 配置: 生成 100 个题目
⚙️  Stockfish 深度: 15, 最小差距: 150cp

✓✓✓✓✓✓✓✓✓✓ [10/100]
✓✓✓✓✓✓✓✓✓✓ [20/100]
...
✅ 完成! 生成了 100 个题目 (尝试 250 次)
```

### 3. 启动后端服务

```bash
cd backend

# 设置环境变量后启动
DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=qixun DB_PASSWORD='xswbddyJTNz8TyWi' \
DB_NAME=qixun PORT=3003 CORS_ORIGIN='https://saiyuan.top' \
COOKIE_SECRET='qixun-secret' pm2 start src/index.js --name qixun-api
```

服务启动时会：
1. 初始化数据库表
2. 启动每日定时任务（0点执行选题）
3. 推送一条每日题目

## 📡 API 接口

### 获取今日题目列表

```http
GET /v0/qixun/chess/puzzles/daily
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "puzzles": [
      {
        "id": 1,
        "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        "bestMove": "e7e5",
        "cpDiff": 180,
        "moves": [
          { "move": "e7e5", "cp": 25 },
          { "move": "d7d5", "cp": -155 },
          ...
        ],
        "difficulty": 2
      },
      ...
    ],
    "timePerPuzzle": 150  // 每题2:30秒
  }
}
```

### 获取单个题目详情

```http
GET /v0/qixun/chess/puzzles/:puzzleId
```

**示例：**
```
GET /v0/qixun/chess/puzzles/1
```

**响应：** 与上面 puzzles 数组中单个题目的结构相同

### 提交答案

```http
POST /v0/qixun/chess/puzzles/answer
Content-Type: application/json

{
  "puzzleId": 1,
  "userMove": "e7e5",
  "timeUsed": 45
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "correct": true,
    "score": 4545,
    "bestMove": "e7e5",
    "message": "正确！获得 4545 分"
  }
}
```

## 📊 评分算法

### 基础分
$$\text{baseScore} = 5000 \times e^{-\frac{\text{cpDiff}}{200}}$$

**例子：**
- cpDiff = 150cp → baseScore ≈ 3814
- cpDiff = 300cp → baseScore ≈ 2906
- cpDiff = 500cp → baseScore ≈ 1652

### 时间系数
- 最大思考时间：150 秒（2:30）
- 超时则得 0 分
- 时间系数：$1 - \frac{\text{timeUsed}}{150} \times 0.5$
  - 0 秒完成：系数 1.0（满分）
  - 75 秒完成：系数 0.75（75% 分）
  - 150 秒完成：系数 0.5（50% 分）

### 最终得分
$$\text{finalScore} = \text{baseScore} \times \text{timeCoefficient}$$

## 🎮 前端集成示例

### React 组件示例

```tsx
import { useEffect, useState } from 'react';
import { getDailyPuzzles, submitPuzzleAnswer } from '@/services/api';

export default function ChessPuzzle() {
  const [puzzles, setPuzzles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(150);

  useEffect(() => {
    // 获取今日题目
    getDailyPuzzles().then(res => {
      setPuzzles(res.data.puzzles);
    });
  }, []);

  const handleMove = async (move) => {
    const result = await submitPuzzleAnswer({
      puzzleId: puzzles[currentIndex].id,
      userMove: move,
      timeUsed: 150 - timeLeft,
    });

    if (result.correct) {
      setScore(score + result.score);
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(150);
    }
  };

  return (
    <div className="chess-puzzle">
      <div className="puzzle-board">
        {/* 棋盘展示 */}
      </div>
      <div className="info">
        <p>难度: {puzzles[currentIndex]?.difficulty}/5</p>
        <p>时间: {timeLeft}s</p>
        <p>得分: {score}</p>
      </div>
    </div>
  );
}
```

## ⚙️ 配置调整

编辑 `backend/scripts/generate-chess-puzzles.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  PUZZLE_COUNT: 50,         // 生成题目数
  MIN_DEPTH: 15,            // Stockfish 搜索深度（越深越准）
  MIN_CP_DIFF: 150,         // 最小估值差（越大越难）
};
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| PUZZLE_COUNT | 50 | 生成多少个题目 |
| MIN_DEPTH | 15 | Stockfish 分析深度，15-18 推荐 |
| MIN_CP_DIFF | 150 | 最优与次优走法的最小差距（厘帕） |

## 🔍 故障排除

### Stockfish 无法找到

**错误信息：** `Stockfish 调用失败: spawn stockfish ENOENT`

**解决：**
```bash
# 确认已安装
which stockfish

# 如未安装
sudo apt-get install stockfish  # Linux
brew install stockfish          # macOS
```

### 题库不足 5 个

**错误信息：** `题库不足5题，无法选题`

**解决：**
```bash
# 生成更多题目
DB_HOST=... node scripts/generate-chess-puzzles.js --count 200
```

### 每日选题未自动执行

**检查：**
```bash
# 查看 PM2 日志
pm2 logs qixun-api

# 应该看到：
# 已启动每日题目选择任务
```

## 📈 性能优化

### 1. Stockfish 深度与速度

| 深度 | 时间 | 质量 |
|------|------|------|
| 12   | ~5秒 | ⭐⭐⭐ |
| 15   | ~30秒| ⭐⭐⭐⭐ |
| 18   | ~2分 | ⭐⭐⭐⭐⭐ |

**建议：** 生成初期用深度 15，之后维护用 12

### 2. 数据库索引

系统已创建的索引：
- `idx_difficulty` - 按难度查询
- `idx_created_at` - 按时间查询
- `idx_date` - 按日期查询（daily_chess_puzzles）

### 3. 批量导入优化

```bash
# 使用 LOAD DATA INFILE（如有大量题目）
# 比单条 INSERT 快 10 倍
mysql> LOAD DATA LOCAL INFILE '/path/to/puzzles.csv' 
       INTO TABLE chess_puzzles 
       FIELDS TERMINATED BY ','
       LINES TERMINATED BY '\\n';
```

## 📝 题目质量检查

定期运行质量检查脚本：

```sql
-- 检查最优解唯一性（2个最优走法）
SELECT id, fen, best_move FROM chess_puzzles 
WHERE (
  SELECT COUNT(DISTINCT JSON_EXTRACT(moves, '$[*].move')) 
  FROM chess_puzzles c2 WHERE c2.id = chess_puzzles.id 
  AND JSON_EXTRACT(moves, '$[0].cp') = JSON_EXTRACT(c2.moves, '$[0].cp')
) > 1;

-- 检查难度分布
SELECT difficulty, COUNT(*) as count FROM chess_puzzles 
GROUP BY difficulty;
```

## 🔗 相关链接

- [Stockfish 官方](https://stockfishchess.org/)
- [UCI Protocol 文档](https://en.wikipedia.org/wiki/Universal_Chess_Interface)
- [国际象棋术语](https://www.chess.com/terms/chess-notation)

## 📄 License

See main project LICENSE
