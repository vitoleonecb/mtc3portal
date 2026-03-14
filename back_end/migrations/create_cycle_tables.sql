-- Cycle configuration per workshop
CREATE TABLE IF NOT EXISTS cycle_configs (
    cycle_config_id  INT AUTO_INCREMENT PRIMARY KEY,
    workshop_id      INT NULL,
    preset           ENUM('quick_test','extended_test','normal') NOT NULL DEFAULT 'normal',
    start_day        TINYINT NOT NULL DEFAULT 3 COMMENT '0=Sun..6=Sat',
    start_hour       TINYINT NOT NULL DEFAULT 7 COMMENT '0-23, hour of day',
    open_to_processing_hours   DECIMAL(8,2) NOT NULL DEFAULT 72   COMMENT 'hours from open to processing',
    processing_to_completed_hours DECIMAL(8,2) NOT NULL DEFAULT 42 COMMENT 'hours from processing to completed',
    auto_repeat      BOOLEAN NOT NULL DEFAULT FALSE,
    active           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES workshops(workshop_id) ON DELETE CASCADE
);

-- Track individual BullMQ jobs so they can be cancelled or audited
CREATE TABLE IF NOT EXISTS cycle_jobs (
    cycle_job_id     INT AUTO_INCREMENT PRIMARY KEY,
    workshop_id      INT NOT NULL,
    module_id        INT NOT NULL,
    bullmq_job_id    VARCHAR(255) NOT NULL,
    job_name         VARCHAR(50) NOT NULL COMMENT 'openModule / processModule / completeModule',
    scheduled_for    DATETIME NOT NULL,
    status           ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES workshops(workshop_id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES workshop_modules(workshop_module_id) ON DELETE CASCADE
);
