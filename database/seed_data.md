# InternHub Test Data (10 Persons)

This file contains random test data to seed your `internhub_db` database. 

> [!IMPORTANT]
> Make sure to run the `internhub_schema_02.sql` file first to create the tables.

---

## SQL Seed Script

```sql
USE internhub_db;

-- 1) COHORTS
INSERT INTO cohorts (name, description, start_date, end_date, status) VALUES
('Cohort 2026 - Batch A', 'Spring internship program focus on Web Dev', '2026-03-01', '2026-08-31', 'active'),
('Cohort 2026 - Batch B', 'Summer internship program focus on AI/ML', '2026-06-01', '2026-11-30', 'planned');

-- 2) USERS (1 Admin, 2 Trainers, 7 Interns)
-- Note: password_hash uses placeholders. Replace with real hashes if using for login.
INSERT INTO users (name, email, password_hash, role, cohort_id) VALUES
('System Admin', 'admin@internhub.com', 'hashed_pw_admin', 'admin', NULL),
('John Trainer', 'john.trainer@internhub.com', 'hashed_pw_trainer', 'trainer', NULL),
('Sarah Trainer', 'sarah.trainer@internhub.com', 'hashed_pw_trainer', 'trainer', NULL),
('Alice Intern', 'alice@example.com', 'hashed_pw_intern', 'intern', 1),
('Bob Intern', 'bob@example.com', 'hashed_pw_intern', 'intern', 1),
('Charlie Intern', 'charlie@example.com', 'hashed_pw_intern', 'intern', 1),
('David Intern', 'david@example.com', 'hashed_pw_intern', 'intern', 1),
('Eva Intern', 'eva@example.com', 'hashed_pw_intern', 'intern', 2),
('Frank Intern', 'frank@example.com', 'hashed_pw_intern', 'intern', 2),
('Grace Intern', 'grace@example.com', 'hashed_pw_intern', 'intern', 2);

-- 3) COHORT_TRAINERS
INSERT INTO cohort_trainers (cohort_id, trainer_id) VALUES
(1, 2), -- John manages Batch A
(2, 3); -- Sarah manages Batch B

-- 4) PROJECTS
INSERT INTO projects (title, description, cohort_id, trainer_id, status) VALUES
('InternHub Platform', 'Internal tool for managing internships', 1, 2, 'active'),
('AI Recipe Generator', 'Mobile app for personalized recipes', 2, 3, 'planning');

-- 5) TASKS (2 per intern)
INSERT INTO tasks (project_id, assigned_to, created_by, title, description, due_date, priority, status) VALUES
(1, 4, 1, 'UI Components', 'Build reusable UI buttons and inputs', '2026-03-15', 'high', 'in_progress'),
(1, 4, 2, 'API Integration', 'Connect frontend to login API', '2026-03-20', 'medium', 'pending'),
(1, 5, 2, 'Database Schema', 'Optimize SQL queries and indexes', '2026-03-12', 'high', 'submitted'),
(1, 5, 1, 'README Docs', 'Write setup guide for new devs', '2026-03-18', 'low', 'pending'),
(1, 6, 2, 'Auth Service', 'Implement JWT authentication', '2026-03-15', 'high', 'in_progress'),
(1, 6, 1, 'Error Handling', 'Global error boundary and toast notifications', '2026-03-20', 'medium', 'pending'),
(1, 7, 2, 'Dashboard View', 'Stats view for admins', '2026-03-15', 'medium', 'in_progress'),
(1, 7, 1, 'Testing', 'Write unit tests for core logic', '2026-03-22', 'low', 'pending'),
(2, 8, 3, 'Model Training', 'Train the base recipe model', '2026-06-15', 'high', 'pending'),
(2, 8, 1, 'Data Collection', 'Scrape recipe sites for training data', '2026-06-20', 'medium', 'pending'),
(2, 9, 3, 'Mobile Setup', 'Initialize React Native project', '2026-06-12', 'high', 'pending'),
(2, 9, 1, 'App Icons', 'Design assets for the mobile app', '2026-06-18', 'low', 'pending'),
(2, 10, 3, 'User Profiles', 'Design the user settings page', '2026-06-15', 'medium', 'pending'),
(2, 10, 1, 'Color Palette', 'Define brand colors and styles', '2026-06-20', 'low', 'pending');

-- 6) SUBMISSIONS (Sample data for task 3)
INSERT INTO submissions (task_id, intern_id, attempt_no, github_url, notes, status) VALUES
(3, 5, 1, 'https://github.com/bob/internhub-db', 'Optimized the primary keys and added missing indexes.', 'submitted');

-- 7) EVALUATIONS (Sample data for the above submission)
INSERT INTO evaluations (submission_id, trainer_id, code_quality, functionality, documentation, timeliness, score, feedback) VALUES
(1, 2, 9, 10, 8, 10, 95, 'Excellent work on the indexing strategy. Really improved query performance.');

```
