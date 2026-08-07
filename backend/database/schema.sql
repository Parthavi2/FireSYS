-- ============================================================
-- FireSYS — Normalized Schema
-- ============================================================
-- This is the target schema for the Auth + RBAC + full-CRUD phase.
-- It supersedes the minimal 4-table bootstrap used in Step 1.
--
-- NOTE ON dispatch: this table intentionally uses the simpler,
-- pre-normalization design (status as VARCHAR, no dispatched_by,
-- no completed_at, no firefighter crew-tracking table). The fully
-- normalized version (`dispatches` + `dispatch_firefighters`) was
-- designed but never wired into the app, so it was removed from
-- this schema to keep the file matching what's actually running.
-- If crew-tracking or stricter status validation is needed later,
-- reintroduce `dispatch_firefighters` and convert `status` to an
-- ENUM at that point.
-- ============================================================

CREATE DATABASE IF NOT EXISTS fire_dispatch;
USE fire_dispatch;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS maintenance;
DROP TABLE IF EXISTS dispatch;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS trucks;
DROP TABLE IF EXISTS firefighters;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- roles — Admin / Dispatcher / Firefighter
-- ---------------------------------------------------------
CREATE TABLE roles (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- ---------------------------------------------------------
-- stations — physical fire stations; trucks and firefighters
-- are attached to one
-- ---------------------------------------------------------
CREATE TABLE stations (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  address    VARCHAR(255),
  phone      VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- users — every person who can log in (admins, dispatchers,
-- and firefighters all authenticate through this table)
-- ---------------------------------------------------------
CREATE TABLE users (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(150) NOT NULL,
  email               VARCHAR(150) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  role_id             INT NOT NULL,
  station_id          INT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token_hash    VARCHAR(255),
  reset_token_expires TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
  INDEX idx_users_role (role_id),
  INDEX idx_users_station (station_id)
);

-- ---------------------------------------------------------
-- firefighters — operational profile for users with the
-- Firefighter role (rank, on-duty status, etc.)
-- ---------------------------------------------------------
CREATE TABLE firefighters (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL UNIQUE,
  station_id INT,
  rank_title VARCHAR(50),
  status     ENUM('Available','Busy','Standby','Off Duty') NOT NULL DEFAULT 'Available',
  phone      VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
  INDEX idx_firefighters_status (status)
);

-- ---------------------------------------------------------
-- trucks
-- ---------------------------------------------------------
CREATE TABLE trucks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(50) NOT NULL UNIQUE,   -- e.g. TRK-001
  station_id INT,
  type       VARCHAR(100),
  status     ENUM('Available','Busy','Maintenance') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
  INDEX idx_trucks_status (status)
);

-- ---------------------------------------------------------
-- incidents
-- ---------------------------------------------------------
CREATE TABLE incidents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  location    VARCHAR(255) NOT NULL,
  type        VARCHAR(100) NOT NULL,
  severity    ENUM('Low','Medium','High','Critical') NOT NULL,
  status      ENUM('Active','In Progress','Resolved') NOT NULL DEFAULT 'Active',
  station_id  INT,
  reported_by INT,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_incidents_status (status),
  INDEX idx_incidents_severity (severity),
  INDEX idx_incidents_created_at (created_at)
);

-- ---------------------------------------------------------
-- dispatch — one truck assignment per row. No crew-tracking
-- table; which firefighters rode on a given dispatch is not
-- currently modeled (see note at top of file).
-- ---------------------------------------------------------
CREATE TABLE dispatch (
  id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT NOT NULL,
  truck_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  INDEX idx_dispatch_incident (incident_id),
  INDEX idx_dispatch_truck (truck_id)
);

-- ---------------------------------------------------------
-- maintenance — service history per truck
-- ---------------------------------------------------------
CREATE TABLE maintenance (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  truck_id        INT NOT NULL,
  description     VARCHAR(255) NOT NULL,
  scheduled_date  DATE,
  completed_date  DATE NULL,
  status          ENUM('Scheduled','In Progress','Completed') NOT NULL DEFAULT 'Scheduled',
  cost            DECIMAL(10,2),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE,
  INDEX idx_maintenance_status (status)
);

-- ---------------------------------------------------------
-- activity_logs — audit trail for the dashboard's "Recent
-- Activity" feed and general accountability
-- ---------------------------------------------------------
CREATE TABLE activity_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INT,
  details     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_logs_user (user_id),
  INDEX idx_activity_logs_created_at (created_at)
);
