-- Crear y seleccionar la base de datos
CREATE DATABASE IF NOT EXISTS escuela;
USE escuela;

-- Tabla de usuarios (para autenticación)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  grupo VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Tabla de materias ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materias (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Tabla de calificaciones ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calificaciones (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  alumno_id  INT            NOT NULL,
  materia_id INT            NOT NULL,
  calificacion DECIMAL(4,1) NOT NULL,
  periodo    VARCHAR(20)    NOT NULL DEFAULT '2025-1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id)  REFERENCES alumnos(id)  ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);

-- ── Materias de ejemplo ─────────────────────────────────────────────────────
INSERT INTO materias (nombre) VALUES
  ('Matemáticas'), ('Español'), ('Ciencias Naturales'),
  ('Historia'), ('Inglés'), ('Educación Física'), ('Geografía'), ('Arte')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ── Usuario de prueba: admin@escuela.com / admin123 ─────────────────────────
