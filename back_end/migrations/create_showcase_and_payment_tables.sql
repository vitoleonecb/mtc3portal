-- ============================================================
-- Showcases, Tickets, Subscriptions & Stripe integration tables
-- ============================================================

-- 1. Showcases
CREATE TABLE IF NOT EXISTS showcases (
    showcase_id          INT AUTO_INCREMENT PRIMARY KEY,
    showcase_name        VARCHAR(120) NOT NULL,
    showcase_description TEXT,
    showcase_date        DATETIME,
    showcase_location    VARCHAR(255),
    showcase_status      ENUM('upcoming','completed') NOT NULL DEFAULT 'upcoming',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Link workshops → showcase (nullable FK, backward-compatible)
ALTER TABLE workshops
    ADD COLUMN showcase_id INT NULL AFTER workshop_public,
    ADD CONSTRAINT fk_workshops_showcase
        FOREIGN KEY (showcase_id) REFERENCES showcases(showcase_id)
        ON DELETE SET NULL;

-- 3. Showcase tickets
CREATE TABLE IF NOT EXISTS showcase_tickets (
    ticket_id               INT AUTO_INCREMENT PRIMARY KEY,
    showcase_id             INT NOT NULL,
    user_id                 INT NOT NULL,
    ticket_type             ENUM('membership','one_off') NOT NULL,
    ticket_status           ENUM('unconfirmed','confirmed','checked_in','cancelled') NOT NULL DEFAULT 'unconfirmed',
    stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
    price_paid              DECIMAL(8,2) DEFAULT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_showcase_user (showcase_id, user_id),
    FOREIGN KEY (showcase_id) REFERENCES showcases(showcase_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)     REFERENCES users(user_id)     ON DELETE CASCADE
);

-- 4. User subscriptions (local record synced with Stripe)
CREATE TABLE IF NOT EXISTS user_subscriptions (
    subscription_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id                 INT NOT NULL,
    stripe_customer_id      VARCHAR(255) DEFAULT NULL,
    stripe_subscription_id  VARCHAR(255) DEFAULT NULL,
    plan                    ENUM('member','performer','tech') NOT NULL DEFAULT 'member',
    status                  ENUM('active','past_due','cancelled','incomplete') NOT NULL DEFAULT 'incomplete',
    current_period_end      DATETIME DEFAULT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_subscription (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Add stripe_customer_id to users table
ALTER TABLE users
    ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL;
