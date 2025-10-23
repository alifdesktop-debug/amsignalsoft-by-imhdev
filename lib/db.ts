import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "webforge_mysig",
  password: process.env.DB_PASSWORD || "Imhdev@#1200!-",
  database: process.env.DB_NAME || "webforge_mysig",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function query(sql: string, values?: any[]) {
  const connection = await pool.getConnection()
  try {
    const [results] = await connection.execute(sql, values)
    return results
  } finally {
    connection.release()
  }
}

export async function getConnection() {
  return await pool.getConnection()
}

export async function checkMarketCooldown(userId: string, pair: string): Promise<Date | null> {
  const results = await query(
    `SELECT cooldown_until FROM market_cooldowns 
     WHERE user_id = ? AND pair = ? AND cooldown_until > NOW()`,
    [userId, pair],
  )

  if (Array.isArray(results) && results.length > 0) {
    return (results[0] as any).cooldown_until
  }
  return null
}

export async function setMarketCooldown(
  userId: string,
  pair: string,
  cooldownUntil: Date,
  signalType: string,
): Promise<void> {
  await query(
    `INSERT INTO market_cooldowns (id, user_id, pair, cooldown_until, signal_type) 
     VALUES (?, ?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE cooldown_until = VALUES(cooldown_until), signal_type = VALUES(signal_type)`,
    [Math.random().toString(36).substring(7), userId, pair, cooldownUntil, signalType],
  )
}
