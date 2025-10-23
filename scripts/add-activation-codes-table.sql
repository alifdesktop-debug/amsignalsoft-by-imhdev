-- Create activation codes table for database storage
CREATE TABLE IF NOT EXISTS activation_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  unique_code VARCHAR(20) UNIQUE NOT NULL,
  activation_key VARCHAR(50) NOT NULL,
  telegram_username VARCHAR(100) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_unique_code (unique_code),
  INDEX idx_telegram (telegram_username)
);
