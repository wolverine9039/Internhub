-- =========================================================
-- InternHub - Final DB Schema v2 (Improved) (MySQL 8.0.16+)
-- =========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE SCHEMA IF NOT EXISTS internhub_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE internhub_db;

-- Optional rerunnable cleanup (safe order)
DROP TABLE IF EXISTS cohort_trainers;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS cohorts;

-- ======================
-- 1) COHORTS
-- ======================
CREATE TABLE cohorts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status ENUM('planned','active','completed') NOT NULL DEFAULT 'planned',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_cohort_dates CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB;

-- ======================
-- 2) USERS
-- ======================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','trainer','intern') NOT NULL,
    cohort_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_cohort
      FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_cohort ON users(cohort_id);
CREATE INDEX idx_users_active ON users(is_active);

-- ======================
-- 3) COHORT_TRAINERS (many-to-many)
-- ======================
CREATE TABLE cohort_trainers (
    cohort_id INT NOT NULL,
    trainer_id INT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cohort_id, trainer_id),
    CONSTRAINT fk_ct_cohort
      FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ct_trainer
      FOREIGN KEY (trainer_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ======================
-- 4) PROJECTS
-- ======================
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    cohort_id INT NOT NULL,
    trainer_id INT NULL,
    status ENUM('planning','active','on_hold','completed') NOT NULL DEFAULT 'planning',
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_cohort
      FOREIGN KEY (cohort_id) REFERENCES cohorts(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_projects_trainer
      FOREIGN KEY (trainer_id) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_project_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT uq_project_per_cohort UNIQUE (cohort_id, title)
) ENGINE=InnoDB;

CREATE INDEX idx_projects_cohort ON projects(cohort_id);
CREATE INDEX idx_projects_trainer ON projects(trainer_id);
CREATE INDEX idx_projects_status ON projects(status);

-- ======================
-- 5) TASKS
-- ======================
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    assigned_to INT NOT NULL,         -- must be an intern
    created_by INT NULL,              -- admin/trainer who created task
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    due_date DATE NULL,
    priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
    status ENUM('pending','in_progress','submitted','completed','overdue') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_project
      FOREIGN KEY (project_id) REFERENCES projects(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_assigned
      FOREIGN KEY (assigned_to) REFERENCES users(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tasks_creator
      FOREIGN KEY (created_by) REFERENCES users(id)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_user ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ======================
-- 6) SUBMISSIONS
-- ======================
-- Supports resubmissions with attempt_no history
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    intern_id INT NOT NULL,           -- must be an intern
    attempt_no INT NOT NULL DEFAULT 1,
    github_url VARCHAR(500) NULL,
    demo_url VARCHAR(500) NULL,
    file_url VARCHAR(500) NULL,
    notes TEXT NULL,
    status ENUM('submitted','resubmitted','reviewed','revision_requested') NOT NULL DEFAULT 'submitted',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_submission_attempt UNIQUE (task_id, intern_id, attempt_no),
    CONSTRAINT fk_submission_task
      FOREIGN KEY (task_id) REFERENCES tasks(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_submission_intern
      FOREIGN KEY (intern_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_submission_task ON submissions(task_id);
CREATE INDEX idx_submission_user ON submissions(intern_id);
CREATE INDEX idx_submission_status ON submissions(status);
CREATE INDEX idx_submission_submitted_at ON submissions(submitted_at);

-- ======================
-- 7) EVALUATIONS
-- ======================
CREATE TABLE evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL UNIQUE,
    trainer_id INT NOT NULL,          -- must be a trainer
    code_quality TINYINT NULL,
    functionality TINYINT NULL,
    documentation TINYINT NULL,
    timeliness TINYINT NULL,
    score TINYINT NOT NULL,
    feedback TEXT NULL,
    strengths TEXT NULL,
    improvements TEXT NULL,
    evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_submission
      FOREIGN KEY (submission_id) REFERENCES submissions(id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_eval_trainer
      FOREIGN KEY (trainer_id) REFERENCES users(id)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_score CHECK (score BETWEEN 0 AND 100),
    CONSTRAINT chk_code_quality CHECK (code_quality IS NULL OR code_quality BETWEEN 1 AND 10),
    CONSTRAINT chk_functionality CHECK (functionality IS NULL OR functionality BETWEEN 1 AND 10),
    CONSTRAINT chk_documentation CHECK (documentation IS NULL OR documentation BETWEEN 1 AND 10),
    CONSTRAINT chk_timeliness CHECK (timeliness IS NULL OR timeliness BETWEEN 1 AND 10)
) ENGINE=InnoDB;

CREATE INDEX idx_eval_submission ON evaluations(submission_id);
CREATE INDEX idx_eval_trainer ON evaluations(trainer_id);
CREATE INDEX idx_eval_evaluated_at ON evaluations(evaluated_at);

-- ======================
-- Role & ownership integrity triggers
-- ======================

-- Drop existing triggers for rerunability
DROP TRIGGER IF EXISTS trg_projects_trainer_role_bi;
DROP TRIGGER IF EXISTS trg_projects_trainer_role_bu;
DROP TRIGGER IF EXISTS trg_tasks_role_bi;
DROP TRIGGER IF EXISTS trg_tasks_role_bu;
DROP TRIGGER IF EXISTS trg_submissions_integrity_bi;
DROP TRIGGER IF EXISTS trg_submissions_integrity_bu;
DROP TRIGGER IF EXISTS trg_evaluations_trainer_role_bi;
DROP TRIGGER IF EXISTS trg_evaluations_trainer_role_bu;
DROP TRIGGER IF EXISTS trg_cohort_trainers_role_bi;

DELIMITER $$

-- Cohort_trainers: trainer_id must be role='trainer'
CREATE TRIGGER trg_cohort_trainers_role_bi
BEFORE INSERT ON cohort_trainers
FOR EACH ROW
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.trainer_id) <> 'trainer' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trainer_id must reference a trainer user';
  END IF;
END$$

-- Projects: trainer_id must be role='trainer'
CREATE TRIGGER trg_projects_trainer_role_bi
BEFORE INSERT ON projects
FOR EACH ROW
BEGIN
  IF NEW.trainer_id IS NOT NULL AND
     (SELECT role FROM users WHERE id = NEW.trainer_id) <> 'trainer' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trainer_id must reference a trainer user';
  END IF;
END$$

CREATE TRIGGER trg_projects_trainer_role_bu
BEFORE UPDATE ON projects
FOR EACH ROW
BEGIN
  IF NEW.trainer_id IS NOT NULL AND
     (SELECT role FROM users WHERE id = NEW.trainer_id) <> 'trainer' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trainer_id must reference a trainer user';
  END IF;
END$$

-- Tasks: assigned_to must be intern; created_by must be admin/trainer when present
CREATE TRIGGER trg_tasks_role_bi
BEFORE INSERT ON tasks
FOR EACH ROW
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.assigned_to) <> 'intern' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'assigned_to must reference an intern user';
  END IF;

  IF NEW.created_by IS NOT NULL AND
     (SELECT role FROM users WHERE id = NEW.created_by) NOT IN ('admin','trainer') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'created_by must reference admin or trainer';
  END IF;
END$$

CREATE TRIGGER trg_tasks_role_bu
BEFORE UPDATE ON tasks
FOR EACH ROW
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.assigned_to) <> 'intern' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'assigned_to must reference an intern user';
  END IF;

  IF NEW.created_by IS NOT NULL AND
     (SELECT role FROM users WHERE id = NEW.created_by) NOT IN ('admin','trainer') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'created_by must reference admin or trainer';
  END IF;
END$$

-- Submissions: intern_id must be intern and must match task owner
CREATE TRIGGER trg_submissions_integrity_bi
BEFORE INSERT ON submissions
FOR EACH ROW
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.intern_id) <> 'intern' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'intern_id must reference an intern user';
  END IF;

  IF (SELECT assigned_to FROM tasks WHERE id = NEW.task_id) <> NEW.intern_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submission intern must match task assignee';
  END IF;
END$$

CREATE TRIGGER trg_submissions_integrity_bu
BEFORE UPDATE ON submissions
FOR EACH ROW
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.intern_id) <> 'intern' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'intern_id must reference an intern user';
  END IF;

  IF (SELECT assigned_to FROM tasks WHERE id = NEW.task_id) <> NEW.intern_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Submission intern must match task assignee';
  END IF;
END$$

-- Evaluations: trainer_id must be trainer
CREATE TRIGGER trg_evaluations_trainer_role_bi
BEFORE INSERT ON evaluations
FOR EACH ROW
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.trainer_id) <> 'trainer' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trainer_id must reference a trainer user';
  END IF;
END$$

CREATE TRIGGER trg_evaluations_trainer_role_bu
BEFORE UPDATE ON evaluations
FOR EACH ROW
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.trainer_id) <> 'trainer' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'trainer_id must reference a trainer user';
  END IF;
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;