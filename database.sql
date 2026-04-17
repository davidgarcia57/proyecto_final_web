-- ═══════════════════════════════════════════════════════════════════════════
--  EduGest — Script de base de datos
--  Motor: MySQL 8+
--  Ejecutar: mysql -u root -p < database.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS escuela
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE escuela;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: usuarios
--  Almacena las cuentas de administrador del sistema.
--  Las contraseñas se guardan como hash bcrypt (10 rounds).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,          -- hash bcrypt
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: alumnos
--  Registro principal de alumnos inscritos.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alumnos (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  grupo      VARCHAR(50)  NOT NULL,
  email      VARCHAR(100) DEFAULT NULL,
  telefono   VARCHAR(20)  DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: materias
--  Catálogo de materias disponibles en el sistema.
--  Administrable desde la vista /materias.html (CRUD completo).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materias (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: calificaciones
--  Notas de cada alumno por materia y periodo.
--  Restricción: un alumno no puede tener dos calificaciones
--  para la misma materia en el mismo periodo.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calificaciones (
  id           INT            AUTO_INCREMENT PRIMARY KEY,
  alumno_id    INT            NOT NULL,
  materia_id   INT            NOT NULL,
  calificacion DECIMAL(4,1)   NOT NULL CHECK (calificacion >= 0 AND calificacion <= 10),
  periodo      VARCHAR(20)    NOT NULL DEFAULT '2025-1',
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_alumno_materia_periodo (alumno_id, materia_id, periodo),

  CONSTRAINT fk_cal_alumno  FOREIGN KEY (alumno_id)  REFERENCES alumnos(id)  ON DELETE CASCADE,
  CONSTRAINT fk_cal_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  DATOS INICIALES — Materias de ejemplo
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO materias (nombre) VALUES
  ('Arte'),
  ('Ciencias Naturales'),
  ('Educación Física'),
  ('Español'),
  ('Geografía'),
  ('Historia'),
  ('Inglés'),
  ('Matemáticas')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ─────────────────────────────────────────────────────────────────────────────
--  USUARIO DE PRUEBA
--  Email:      admin@escuela.com
--  Contraseña: admin123
--  Nota: el hash es generado por bcrypt con 10 rounds.
--        Regenerar con: node -e "require('bcrypt').hash('admin123',10).then(console.log)"
-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT INTO usuarios (nombre, email, password) VALUES
--   ('Administrador', 'admin@escuela.com', '<hash_bcrypt_aqui>');
