-- ============================================
-- InternHub — FRESH Seed Data (Drop & Recreate)
-- ============================================
-- Run this AFTER running internhub_schema_02.sql
-- All passwords are real bcrypt hashes that work for login.
--   Admin password:  admin123
--   Everyone else:   intern123
-- ============================================

USE internhub_db;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE evaluations;
TRUNCATE TABLE submissions;
TRUNCATE TABLE tasks;
TRUNCATE TABLE projects;
TRUNCATE TABLE cohort_trainers;
TRUNCATE TABLE users;
TRUNCATE TABLE cohorts;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================
-- 1. COHORTS
-- ============================================
INSERT INTO cohorts (id, name, description, start_date, end_date, status) VALUES
(1, 'Cohort 2026 - Batch A', 'Full-stack web development cohort — React, Node.js, MySQL.', '2026-01-15', '2026-06-30', 'active'),
(2, 'Cohort 2026 - Batch B', 'AI/ML and data engineering cohort — Python, TensorFlow, FastAPI.', '2026-03-01', '2026-08-31', 'active'),
(3, 'Cohort 2025 - Batch C', 'Completed DevOps cohort — Docker, Jenkins, AWS.', '2025-06-01', '2025-12-15', 'completed');


-- ============================================
-- 2. USERS (10 users: 1 admin + 2 trainers + 7 interns)
-- ============================================
-- Admin password: admin123
-- Everyone else:  intern123
INSERT INTO users (id, name, email, password_hash, role, cohort_id, is_active) VALUES
(1,  'Mayank Bisht',    'admin@internhub.com',           '$2b$10$VsaMW91K7Mnm/PQu8ZeUpuCOrNA.q9T0fLmNT/R/8QwVapxIMp73i', 'admin',   NULL, 1),
(2,  'Rahul Sharma',    'rahul.trainer@internhub.com',   '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'trainer', NULL, 1),
(3,  'Priya Verma',     'priya.trainer@internhub.com',   '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'trainer', NULL, 1),
(4,  'Aarav Patel',     'aarav@example.com',             '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'intern',  1, 1),
(5,  'Diya Gupta',      'diya@example.com',              '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'intern',  1, 1),
(6,  'Arjun Singh',     'arjun@example.com',             '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'intern',  1, 1),
(7,  'Ananya Reddy',    'ananya@example.com',            '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'intern',  2, 1),
(8,  'Rohan Mehta',     'rohan@example.com',             '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'intern',  2, 1),
(9,  'Sneha Iyer',      'sneha@example.com',             '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'intern',  2, 1),
(10, 'Kavya Nair',      'kavya@example.com',             '$2b$10$rIY5RHwwycLjaB/yVgETtOtqgDV7z7XdsEvJF/V/d1ygAOlyalWSu', 'intern',  3, 1);


-- ============================================
-- 3. COHORT_TRAINERS
-- ============================================
INSERT INTO cohort_trainers (cohort_id, trainer_id) VALUES
(1, 2),
(2, 3),
(3, 2),
(3, 3);


-- ============================================
-- 4. PROJECTS
-- ============================================
INSERT INTO projects (id, title, description, cohort_id, trainer_id, status, start_date, end_date) VALUES
(1, 'InternHub Platform',      'Full-stack intern management app with React + Node.js + MySQL.',          1, 2, 'active',    '2026-01-20', '2026-05-30'),
(2, 'AI Recipe Generator',     'NLP-powered recipe recommendation system with Python and TensorFlow.',   2, 3, 'active',    '2026-03-10', '2026-07-31'),
(3, 'DevOps Pipeline',         'CI/CD pipeline with Jenkins, Docker, and AWS deployment.',                3, 2, 'completed', '2025-06-15', '2025-11-30'),
(4, 'E-Commerce Dashboard',    'Admin dashboard for an e-commerce platform with analytics.',              1, 2, 'planning',  '2026-06-01', '2026-06-30');


-- ============================================
-- 5. TASKS
-- ============================================
-- Cohort A / InternHub Platform (project 1)
INSERT INTO tasks (id, project_id, assigned_to, created_by, title, description, due_date, priority, status) VALUES
(1,  1, 4, 2, 'UI Components',       'Build reusable React components for the design system.',              '2026-03-15', 'high',   'completed'),
(2,  1, 4, 2, 'Unit Test Suite',     'Write Jest tests for all React components with 80%+ coverage.',       '2026-04-05', 'high',   'submitted'),
(3,  1, 5, 2, 'API Integration',     'Connect frontend to all backend REST endpoints.',                     '2026-03-20', 'high',   'completed'),
(4,  1, 5, 2, 'Performance Audit',   'Run Lighthouse and fix all performance issues.',                      '2026-04-15', 'medium', 'in_progress'),
(5,  1, 6, 2, 'Database Schema',     'Design and implement the normalized MySQL schema.',                   '2026-03-10', 'high',   'completed'),
(6,  1, 6, 2, 'Auth Service',        'Implement JWT authentication with role-based access control.',        '2026-03-25', 'high',   'submitted'),
-- Cohort B / AI Recipe Generator (project 2)
(7,  2, 7, 3, 'Data Preprocessing',  'Clean and normalize the recipe dataset (50k+ entries).',              '2026-04-20', 'high',   'completed'),
(8,  2, 7, 3, 'Model Training',      'Train the recommendation model using collaborative filtering.',      '2026-05-10', 'high',   'submitted'),
(9,  2, 8, 3, 'API Gateway',         'Build FastAPI endpoints for recipe search and recommendations.',      '2026-04-25', 'high',   'completed'),
(10, 2, 8, 3, 'Model Deployment',    'Deploy the trained model to AWS SageMaker.',                          '2026-05-20', 'high',   'in_progress'),
(11, 2, 9, 3, 'UI Prototypes',       'Design Figma prototypes for the recipe app UI.',                      '2026-04-15', 'medium', 'completed'),
(12, 2, 9, 3, 'Frontend Integration','Connect React frontend to the recommendation API.',                   '2026-05-25', 'high',   'pending'),
-- Cohort C / DevOps (project 3) — completed
(13, 3, 10, 2, 'Docker Setup',       'Create Dockerfiles and docker-compose for all microservices.',        '2025-08-15', 'high',   'completed'),
(14, 3, 10, 2, 'Jenkins Pipeline',   'Configure multi-stage Jenkins pipeline with automated testing.',      '2025-09-15', 'high',   'completed'),
-- Additional pending tasks
(15, 1, 4, 2, 'Responsive Design',   'Make all pages fully responsive for mobile and tablet viewports.',    '2026-04-25', 'medium', 'pending'),
(16, 2, 7, 3, 'Feature Engineering', 'Extract ingredient embeddings using Word2Vec.',                       '2026-05-30', 'high',   'pending');


-- ============================================
-- 6. SUBMISSIONS
-- ============================================
INSERT INTO submissions (id, task_id, intern_id, attempt_no, github_url, demo_url, notes, status, submitted_at) VALUES
-- Aarav
(1,  1, 4, 1, 'https://github.com/aarav/internhub-ui',         'https://internhub-ui.vercel.app',      'All 18 components built with Storybook documentation.',                    'reviewed',  '2026-03-14 10:00:00'),
(2,  2, 4, 1, 'https://github.com/aarav/internhub-tests',      NULL,                                    'Jest test suite with 84% coverage across all components.',                 'submitted', '2026-04-04 14:30:00'),
-- Diya
(3,  3, 5, 1, 'https://github.com/diya/internhub-api-client',  'https://internhub-staging.netlify.app', 'Connected all 24 API endpoints with Axios interceptors and error handling.','reviewed',  '2026-03-19 16:00:00'),
-- Arjun
(4,  5, 6, 1, 'https://github.com/arjun/internhub-schema',     NULL,                                    'Normalized schema with 7 tables, triggers, and indexes.',                  'reviewed',  '2026-03-09 11:00:00'),
(5,  6, 6, 1, 'https://github.com/arjun/internhub-auth',       NULL,                                    'JWT auth with refresh tokens and RBAC middleware.',                        'submitted', '2026-03-24 09:30:00'),
-- Ananya
(6,  7, 7, 1, 'https://github.com/ananya/recipe-data-pipeline', NULL,                                   'Cleaned 52,341 recipes. Removed duplicates, normalized ingredients.',      'reviewed',  '2026-04-18 12:00:00'),
(7,  8, 7, 1, 'https://github.com/ananya/recipe-model',        NULL,                                    'Collaborative filtering model with 0.82 precision score.',                 'submitted', '2026-05-08 15:00:00'),
-- Rohan
(8,  9, 8, 1, 'https://github.com/rohan/recipe-api',           'https://recipe-api.herokuapp.com',      'FastAPI with 8 endpoints, full CRUD, search, pagination. 95% test coverage.','reviewed', '2026-04-23 10:00:00'),
-- Sneha
(9,  11, 9, 1, 'https://github.com/sneha/recipe-ui-designs',   'https://figma.com/sneha-recipe-app',    'Designed 12 screens including home, search, detail, favorites, profile.',   'reviewed',  '2026-04-14 13:00:00'),
-- Kavya
(10, 13, 10, 1, 'https://github.com/kavya/devops-docker',      NULL,                                    'Dockerfiles for 4 microservices. Multi-stage builds. Avg image size 120MB.','reviewed',  '2025-08-14 09:00:00'),
(11, 14, 10, 1, 'https://github.com/kavya/devops-jenkins',     NULL,                                    'Jenkins pipeline with build, test, deploy stages. Slack notifications.',    'reviewed',  '2025-09-14 11:30:00');


-- ============================================
-- 7. EVALUATIONS
-- ============================================
INSERT INTO evaluations (id, submission_id, trainer_id, code_quality, functionality, documentation, timeliness, score, feedback, strengths, improvements, evaluated_at) VALUES
-- Aarav's UI Components
(1, 1, 2, 9, 8, 9, 10, 88, 'Excellent component library. Well-structured with Storybook docs and TypeScript typing.', 'Reusable patterns, consistent styling, great TypeScript interfaces.', 'Add accessibility (a11y) testing. Consider memoization for heavy components.', '2026-03-16 09:00:00'),
-- Diya's API Integration
(2, 3, 2, 8, 9, 7, 9, 84, 'Solid API integration. Axios interceptors and error handling are well implemented.', 'Clean service layer, proper error boundaries, retry logic on failures.', 'Add request caching. Document the API service architecture patterns.', '2026-03-21 14:00:00'),
-- Arjun's Database Schema
(3, 4, 2, 9, 9, 8, 10, 92, 'Outstanding schema design. Perfect normalization with comprehensive triggers and indexes.', 'Well-thought-out relationships, role-enforcement triggers, proper indexing.', 'Add migration scripts. Consider audit trail columns for compliance.', '2026-03-11 10:00:00'),
-- Ananya's Data Preprocessing
(4, 6, 3, 8, 8, 7, 9, 82, 'Good data pipeline. Dataset is well cleaned with proper normalization steps.', 'Systematic cleaning approach, good handling of missing values, clear logs.', 'Add data validation tests. Document the transformation pipeline steps.', '2026-04-20 11:00:00'),
-- Rohan's API Gateway
(5, 8, 3, 10, 9, 9, 9, 95, 'Outstanding API. Production-ready with comprehensive tests and documentation.', 'RESTful design, proper error handling, input validation, rate limiting.', 'Consider GraphQL for complex queries. Add API versioning strategy.', '2026-04-25 10:00:00'),
-- Sneha's UI Prototypes
(6, 9, 3, 8, 8, 9, 10, 87, 'Beautiful and intuitive designs. Strong UX patterns and accessibility awareness.', 'Consistent design system, organized component library, mobile-first approach.', 'Add dark mode variant. Include micro-interaction specs and design tokens.', '2026-04-16 13:00:00'),
-- Kavya's Docker Setup
(7, 10, 2, 9, 9, 8, 9, 90, 'Excellent Docker configuration. Multi-stage builds keep images lean and secure.', 'Clean Dockerfiles, proper layer caching, good security practices.', 'Add health checks. Consider using Docker Compose profiles for environments.', '2025-08-16 10:00:00'),
-- Kavya's Jenkins Pipeline
(8, 11, 2, 8, 9, 7, 8, 80, 'Good CI/CD pipeline. All stages work correctly with proper Slack notifications.', 'Clean pipeline stages, good test integration, notification on failures.', 'Add parallel test execution. Consider Blue Ocean UI for better visibility.', '2025-09-16 14:00:00');


-- ============================================
-- VERIFICATION QUERIES
-- ============================================
SELECT 'cohorts' AS tbl, COUNT(*) AS cnt FROM cohorts
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'cohort_trainers', COUNT(*) FROM cohort_trainers
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'evaluations', COUNT(*) FROM evaluations;
