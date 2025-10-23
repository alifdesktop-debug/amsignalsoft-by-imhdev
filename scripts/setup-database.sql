-- STC Trading Signal Software - MySQL Database Schema
-- Database: webforge_mysig
-- User: webforge_mysig

-- Create Activation Keys Table
CREATE TABLE IF NOT EXISTS activation_keys (
  id VARCHAR(36) PRIMARY KEY,
  key_code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('one-time', 'unlimited') NOT NULL,
  expires_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  telegram VARCHAR(255) UNIQUE NOT NULL,
  activation_key VARCHAR(50) NOT NULL,
  activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activation_key) REFERENCES activation_keys(key_code)
);

-- Create Signal History Table
CREATE TABLE IF NOT EXISTS signal_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  pair VARCHAR(50) NOT NULL,
  signal_type ENUM('live', 'future') NOT NULL,
  entry_time DATETIME NOT NULL,
  duration INT NOT NULL,
  mtg_target DECIMAL(10, 5) NOT NULL,
  confidence INT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Future Signals Table (for storing 7 signals in a batch)
CREATE TABLE IF NOT EXISTS future_signals (
  id VARCHAR(36) PRIMARY KEY,
  batch_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  pair VARCHAR(50) NOT NULL,
  signal_number INT NOT NULL,
  entry_time DATETIME NOT NULL,
  duration INT NOT NULL,
  mtg_target DECIMAL(10, 5) NOT NULL,
  confidence INT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Market Cooldown Table (tracks when next signal can be generated per market)
CREATE TABLE IF NOT EXISTS market_cooldowns (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  pair VARCHAR(50) NOT NULL,
  cooldown_until DATETIME NOT NULL,
  signal_type ENUM('live', 'future') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_pair (user_id, pair)
);

-- Create Key Usage Table (tracks which users have used which keys)
CREATE TABLE IF NOT EXISTS key_usage (
  id VARCHAR(36) PRIMARY KEY,
  key_code VARCHAR(50) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (key_code) REFERENCES activation_keys(key_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Indexes for better query performance
CREATE INDEX idx_users_telegram ON users(telegram);
CREATE INDEX idx_users_activation_key ON users(activation_key);
CREATE INDEX idx_users_is_banned ON users(is_banned);
CREATE INDEX idx_signal_history_user ON signal_history(user_id);
CREATE INDEX idx_signal_history_pair ON signal_history(pair);
CREATE INDEX idx_future_signals_batch ON future_signals(batch_id);
CREATE INDEX idx_market_cooldowns_user_pair ON market_cooldowns(user_id, pair);
CREATE INDEX idx_activation_keys_code ON activation_keys(key_code);
