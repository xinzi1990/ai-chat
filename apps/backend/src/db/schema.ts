export const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS revoked_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    jti VARCHAR(64) NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_revoked_tokens_jti (jti),
    KEY idx_revoked_tokens_user_id (user_id),
    KEY idx_revoked_tokens_expires_at (expires_at),
    CONSTRAINT fk_revoked_tokens_user_id
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(120) NOT NULL,
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    last_message_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_chat_sessions_user_id_updated_at (user_id, updated_at),
    KEY idx_chat_sessions_user_id_last_message_at (user_id, last_message_at),
    CONSTRAINT fk_chat_sessions_user_id
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content MEDIUMTEXT NOT NULL,
    status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
    sequence_no INT UNSIGNED NOT NULL,
    model VARCHAR(64) NULL,
    prompt_tokens INT UNSIGNED NULL,
    completion_tokens INT UNSIGNED NULL,
    error_message VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_chat_messages_session_sequence (session_id, sequence_no),
    KEY idx_chat_messages_session_id_created_at (session_id, created_at),
    KEY idx_chat_messages_user_id_created_at (user_id, created_at),
    CONSTRAINT fk_chat_messages_session_id
      FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
      ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_user_id
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];
