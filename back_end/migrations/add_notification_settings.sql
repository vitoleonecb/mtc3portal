-- ============================================================
-- Notification settings & email verification
-- ============================================================

-- 1. Granular notification preferences (JSON)
ALTER TABLE users
  ADD COLUMN notification_settings JSON NOT NULL DEFAULT (JSON_OBJECT(
    'channel', 'both',
    'module_open', CAST(TRUE AS JSON),
    'last_day_reminder', CAST(TRUE AS JSON),
    'materials_ready', CAST(TRUE AS JSON),
    'workshop_rsvp', CAST(TRUE AS JSON),
    'showcase_announcements', CAST(TRUE AS JSON),
    'showcase_ticket', CAST(TRUE AS JSON)
  ));

-- 2. Email verification flag
ALTER TABLE users
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Monthly showcase notification tracking
CREATE TABLE IF NOT EXISTS monthly_showcase_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year_month CHAR(7) NOT NULL UNIQUE,       -- e.g. '2026-03'
  status ENUM('pending','sent') NOT NULL DEFAULT 'pending',
  showcase_id INT DEFAULT NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
