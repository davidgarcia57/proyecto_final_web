-- ═══════════════════════════════════════════════════════════════════════════
--  Forge & Pixel — Script de base de datos
--  Motor: MySQL 8+
--  Ejecutar: mysql -u root -p < database.sql
-- ═══════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS forge_pixel
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE forge_pixel;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: usuarios
--  Artistas y compradores del marketplace. Rol distingue cada tipo.
--  Las contraseñas se guardan como hash bcrypt (10 rounds).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  rol        ENUM('artista','comprador','admin') NOT NULL DEFAULT 'comprador',
  bio        TEXT         DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: servicios
--  Oferta principal del marketplace: trabajos de pixel art en venta.
--  Tabla principal para las operaciones CRUD del proyecto.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicios (
  id          INT            AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(150)   NOT NULL,
  descripcion TEXT           NOT NULL,
  precio      DECIMAL(10,2)  NOT NULL,
  estilo      VARCHAR(60)    NOT NULL DEFAULT 'Pixel Art',
  artista_id  INT            NOT NULL,
  imagen_url  VARCHAR(500)   DEFAULT NULL,
  estado      ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_serv_artista FOREIGN KEY (artista_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: pedidos
--  Transacciones generadas cuando un comprador contrata un servicio.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id           INT            AUTO_INCREMENT PRIMARY KEY,
  servicio_id  INT            NOT NULL,
  comprador_id INT            NOT NULL,
  estado       ENUM('pendiente','en_proceso','completado','cancelado')
               NOT NULL DEFAULT 'pendiente',
  monto        DECIMAL(10,2)  NOT NULL,
  notas        TEXT           DEFAULT NULL,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ped_servicio  FOREIGN KEY (servicio_id)
    REFERENCES servicios(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ped_comprador FOREIGN KEY (comprador_id)
    REFERENCES usuarios(id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  TABLA: noticias
--  Blog de actualizaciones del juego Vallecardo.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS noticias (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(200) NOT NULL,
  contenido   TEXT         NOT NULL,
  imagen_url  VARCHAR(500) DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
--  DATOS INICIALES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO noticias (titulo, contenido) VALUES
  (
    'Vallecardo v0.3 — Sistema de combate renovado',
    'Se ha rediseñado por completo el sistema de combate. Las nuevas mecánicas de esquiva y contraataque añaden profundidad estratégica. Los sprites de los personajes principales recibieron animaciones actualizadas con transiciones más fluidas entre estados.'
  ),
  (
    'Nuevo mapa: Las Ruinas del Valle',
    'El primer área explorable del mundo de Vallecardo ya está disponible. Descubre los secretos de una civilización perdida entre pixel arts detallados, trampas ambientales y enemigos exclusivos de la zona.'
  ),
  (
    'Convocatoria abierta para artistas',
    'Forge & Pixel busca colaboradores para expandir el catálogo visual de Vallecardo. Si trabajas con pixel art y te interesa contribuir al proyecto, regístrate como artista en la plataforma y contáctanos.'
  )
ON DUPLICATE KEY UPDATE titulo = titulo;

-- ─────────────────────────────────────────────────────────────────────────────
--  USUARIO DE PRUEBA
--  Email:      admin@forgepixel.com
--  Contraseña: admin123
--  Regenerar hash: node -e "require('bcrypt').hash('admin123',10).then(console.log)"
-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT INTO usuarios (nombre, email, password, rol) VALUES
--   ('Administrador', 'admin@forgepixel.com', '<hash_bcrypt_aqui>', 'admin');
