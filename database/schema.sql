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
  title VARCHAR(150) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL,
  due_date DATE
);

INSERT INTO users (name, email, password)
VALUES ('Admin User', 'admin@gmail.com', 'admin123')
ON DUPLICATE KEY UPDATE name = VALUES(name);
