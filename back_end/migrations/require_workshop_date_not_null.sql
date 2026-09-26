-- Require every workshop to have a real date.
--
-- This migration intentionally does not backfill placeholder dates. If it
-- fails on the guard insert below, manually correct the listed undated
-- workshops before rerunning it.

SELECT workshop_id, workshop_name
FROM workshops
WHERE workshop_date IS NULL
   OR CAST(workshop_date AS CHAR) IN ('0000-00-00', '0000-00-00 00:00:00');

CREATE TEMPORARY TABLE migration_guard_workshop_dates (
    undated_count INT NOT NULL,
    CHECK (undated_count = 0)
);

INSERT INTO migration_guard_workshop_dates (undated_count)
SELECT COUNT(*)
FROM workshops
WHERE workshop_date IS NULL
   OR CAST(workshop_date AS CHAR) IN ('0000-00-00', '0000-00-00 00:00:00');

ALTER TABLE workshops
    MODIFY COLUMN workshop_date DATETIME NOT NULL;

ALTER TABLE workshops
    ADD CONSTRAINT chk_workshops_workshop_date_real
    CHECK (workshop_date >= '1000-01-01 00:00:00');

DROP TEMPORARY TABLE migration_guard_workshop_dates;
