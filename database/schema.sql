-- Smart Task Management System
-- MySQL database schema for beginner-friendly JDBC integration.

CREATE DATABASE IF NOT EXISTS task_manager;

USE task_manager;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  due_date DATE,
  CONSTRAINT fk_tasks_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

INSERT INTO users (name, email, password)
VALUES ('Admin User', 'admin@gmail.com', 'admin123')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- For existing databases created before user-specific tasks were added.
-- Run this only if your old tasks table does not already have user_id.
-- ALTER TABLE tasks ADD COLUMN user_id INT NOT NULL DEFAULT 1;
-- ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
