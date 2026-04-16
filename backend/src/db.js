const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qixun',
  connectionLimit: 10,
  charset: 'utf8mb4',
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_name VARCHAR(64) NOT NULL UNIQUE,
      phone VARCHAR(32) NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      icon VARCHAR(255) NOT NULL DEFAULT '',
      \`desc\` VARCHAR(255) NULL,
      province VARCHAR(32) NULL,
      rating INT NOT NULL DEFAULT 1200,
      puzzle_rating INT NOT NULL DEFAULT 1200,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      token VARCHAR(128) PRIMARY KEY,
      user_id BIGINT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id(user_id),
      INDEX idx_expires_at(expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

}

module.exports = { pool, initDb };
