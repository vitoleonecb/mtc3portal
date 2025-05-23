SELECT *
FROM information_schema.TABLES
WHERE engine = 'InnoDB' AND create_time > '2024-09-28 14:34:20' 
ORDER BY create_time;

-- use sys;
SELECT * FROM users;

-- TABLES
-- 
-- users
-- workshops
-- workshop_modules
-- workshop_rsvps
-- workshop_prompts
-- workshop_responses
-- prompt_templates
-- productions
-- production_modules
-- production_tickets
-- production_prompts
-- production_responses
-- user_notifications

-- CREATE TABLE STATEMENTS

CREATE TABLE `workshops` (
  `workshop_id` int NOT NULL AUTO_INCREMENT,
  `workshop_name` varchar(255) NOT NULL,
  `workshop_description` varchar(255) NOT NULL,
  `workshop_created` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  `workshop_date` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  `workshop_location` varchar(255) NOT NULL,
  PRIMARY KEY (`workshop_id`)
);

CREATE TABLE `workshop_modules` (
  `workshop_module_id` int NOT NULL AUTO_INCREMENT,
  `workshop_id` int NOT NULL,
  `workshop_progress` int NOT NULL,
  `workshop_module_name` varchar(255) NOT NULL,
  `workshop_module_status` enum('pending','open','completed') NOT NULL DEFAULT 'pending',
  `workshop_module_created` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  PRIMARY KEY (`workshop_module_id`)
);

CREATE TABLE `workshop_rsvps` (
  `user_id` int NOT NULL,
  `workshop_id` int NOT NULL,
  `workshop_rsvp_created` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  PRIMARY KEY (`user_id`,`workshop_id`),
  KEY `workshop_rsvps_workshops` (`workshop_id`),
  CONSTRAINT `workshop_rsvps_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `workshop_rsvps_workshops` FOREIGN KEY (`workshop_id`) REFERENCES `workshops` (`workshop_id`)
);

CREATE TABLE `workshop_prompts` (
  `workshop_prompt_id` int NOT NULL AUTO_INCREMENT,
  `workshop_module_id` int NOT NULL,
  `prompt_template_id` int NOT NULL,
  `workshop_prompt_instruction` varchar(255) NOT NULL,
  `workshop_prompt_reference` text,
  PRIMARY KEY (`workshop_prompt_id`),
  KEY `workshop_prompts_workshop_modules` (`workshop_module_id`),
  KEY `fk_workshop_prompts_prompt_templates` (`prompt_template_id`),
  CONSTRAINT `fk_workshop_prompts_prompt_templates` FOREIGN KEY (`prompt_template_id`) REFERENCES `prompt_templates` (`prompt_template_id`) ON UPDATE CASCADE,
  CONSTRAINT `workshop_prompts_workshop_modules` FOREIGN KEY (`workshop_module_id`) REFERENCES `workshop_modules` (`workshop_module_id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `prompt_templates` (
  `prompt_template_id` int NOT NULL AUTO_INCREMENT,
  `prompt_template_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`prompt_template_id`),
  UNIQUE KEY `prompt_template_name` (`prompt_template_name`)
);

CREATE TABLE `productions` (
  `production_id` int NOT NULL AUTO_INCREMENT,
  `production_name` varchar(255) NOT NULL,
  `production_description` varchar(255) NOT NULL,
  `production_showtimes` json NOT NULL,
  PRIMARY KEY (`production_id`)
);

CREATE TABLE `production_modules` (
  `production_module_id` int NOT NULL AUTO_INCREMENT,
  `production_id` int NOT NULL,
  `production_module_progress` int NOT NULL DEFAULT '0',
  `production_module_name` varchar(255) NOT NULL,
  `production_module_status` enum('pending','open','processing','completed') NOT NULL DEFAULT 'pending',
  `production_module_created` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  PRIMARY KEY (`production_module_id`),
  KEY `fk_production_modules_productions` (`production_id`),
  CONSTRAINT `fk_production_modules_productions` FOREIGN KEY (`production_id`) REFERENCES `productions` (`production_id`)
);

CREATE TABLE `production_prompts` (
  `production_prompt_id` int NOT NULL AUTO_INCREMENT,
  `prompt_template_id` int NOT NULL,
  `production_module_id` int NOT NULL,
  `production_prompt_instruction` varchar(255) NOT NULL,
  `production_prompt_reference` text,
  PRIMARY KEY (`production_prompt_id`),
  KEY `fk_production_prompts_production_modules` (`production_module_id`),
  KEY `fk_production_prompt_prompt_template_id` (`prompt_template_id`),
  CONSTRAINT `fk_production_prompt_prompt_template_id` FOREIGN KEY (`prompt_template_id`) REFERENCES `prompt_templates` (`prompt_template_id`),
  CONSTRAINT `fk_production_prompts_production_modules` FOREIGN KEY (`production_module_id`) REFERENCES `production_modules` (`production_module_id`)
);

CREATE TABLE `workshop_responses` (
  `workshop_response_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `workshop_prompt_id` int NOT NULL,
  `workshop_response_content` json NOT NULL,
  `workshop_response_created` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  PRIMARY KEY (`workshop_response_id`),
  KEY `fk_workshop_responses_users` (`user_id`),
  KEY `fk_workshop_responses_workshop_prompts` (`workshop_prompt_id`),
  CONSTRAINT `fk_workshop_responses_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_workshop_responses_workshop_prompts` FOREIGN KEY (`workshop_prompt_id`) REFERENCES `workshop_prompts` (`workshop_prompt_id`) ON UPDATE CASCADE
);

CREATE TABLE `production_responses` (
  `production_response_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `production_prompt_id` int NOT NULL,
  `production_response_content` json NOT NULL,
  `production_response_created` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  PRIMARY KEY (`production_response_id`),
  KEY `fk_production_responses_user` (`user_id`),
  KEY `fk_production_responses_production_prompts` (`production_prompt_id`),
  CONSTRAINT `fk_production_responses_production_prompts` FOREIGN KEY (`production_prompt_id`) REFERENCES `production_prompts` (`production_prompt_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_production_responses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE
);

CREATE TABLE `user_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `email_workshop_new` tinyint(1) DEFAULT '0',
  `email_workshop_rsvp_confirmation` tinyint(1) DEFAULT '0',
  `email_workshop_reminder` tinyint(1) DEFAULT '0',
  `email_production_new` tinyint(1) DEFAULT '0',
  `email_production_ticket_avail` tinyint(1) DEFAULT '0',
  `email_production_ticket_confirmation` tinyint(1) DEFAULT '0',
  `email_production_performance_reminder` tinyint(1) DEFAULT '0',
  `text_production_performance_reminder` tinyint(1) DEFAULT '0',
  `text_production_ticket_confirmation` tinyint(1) DEFAULT '0',
  `text_production_ticket_avail` tinyint(1) DEFAULT '0',
  `text_production_new` tinyint(1) DEFAULT '0',
  `text_workshop_reminder` tinyint(1) DEFAULT '0',
  `text_workshop_rsvp_confirmation` tinyint(1) DEFAULT '0',
  `text_workshop_new` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`notification_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_user_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `production_tickets` (
  `production_ticket_id` int NOT NULL AUTO_INCREMENT,
  `production_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`production_ticket_id`),
  KEY `fk_production_tickets_productions` (`production_id`),
  CONSTRAINT `fk_production_tickets_productions` FOREIGN KEY (`production_id`) REFERENCES `productions` (`production_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_production_tickets_users` FOREIGN KEY (`production_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(40) NOT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `user_password` char(60) NOT NULL,
  `user_type` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_date` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  `last_active` timestamp(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2),
  `user_phone` char(10) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
);


ALTER TABLE production_responses
ADD COLUMN production_response_created TIMESTAMP(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2);

SELECT * FROM workshop_responses;

-- DESCRIBE STATEMENTS

DESCRIBE users;

DESCRIBE workshop_rsvps;

DESCRIBE workshops;

DESCRIBE workshop_modules;

DESCRIBE productions;

DESCRIBE production_modules;


-- SELECT STATEMENTS

SELECT *
FROM users;

SELECT *
FROM productions;

SELECT *
FROM workshop_rsvps;

SELECT * 
FROM workshops;


-- ALTER TABLE STATEMENTS

ALTER TABLE users
CHANGE hashed_password password
VARCHAR(255);

ALTER TABLE workshop_modules
CHANGE workshops_id workshops_id
INT NOT NULL;

ALTER TABLE workshops
CHANGE created created
TIMESTAMP NOT NULL;

ALTER TABLE users
CHANGE last_active last_active
TIMESTAMP(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2);

ALTER TABLE workshop_modules
ADD CONSTRAINT fk_workshops_id
FOREIGN KEY (workshops_id)
REFERENCES workshops(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- TCL STATEMENTS

COMMIT;

ROLLBACK;

-- INSERT STATEMENTS / TEST DATA

DESCRIBE users;

TRUNCATE TABLE users;

SELECT * FROM users;

ALTER TABLE users
ADD COLUMN user_phone CHAR(10);

ALTER TABLE users
DROP COLUMN user_phone;

SELECT * FROM workshops;

CREATE VIEW silent_climbing_attenance AS
SELECT first_name as 'Going To Silent Climbing'
FROM workshops w
JOIN workshop_rsvps wr
ON (w.workshop_id = wr.workshop_id)
JOIN users u
ON (wr.user_id = u.user_id)
WHERE w.workshop_id = 2;

SELECT * FROM silent_climbing_attenance;

SELECT first_name as 'Going To Silent Climbing'
FROM workshops w
JOIN workshop_rsvps wr
ON (w.workshop_id = wr.workshop_id)
JOIN users u
ON (wr.user_id = u.user_id)
WHERE w.workshop_id = 2;

SELECT COUNT(*)
FROM users
WHERE username LIKE 'vito%';


ALTER TABLE users
CHANGE email email
varchar(255) UNIQUE NOT NULL;

DESCRIBE users;

INSERT INTO users (username, email, first_name, last_name, user_password, user_phone) VALUES ('vitoleonecb', 'charles@freshnco.com', 'Charles', 'Shwoony', '000000000000000000000000000000000000000000000000000000000000','5133744014');
INSERT INTO users (username, email, first_name, last_name, user_password, user_phone) VALUES ('dashsnow', 'dishlish@gmail.com', 'Shi', 'Fon', '000000000000000000000000000000000000000000000000000000000000','8921542380');
INSERT INTO users (username, email, first_name, last_name, user_password, user_phone) VALUES ('cowtoed', 'lesliefarmer@yahoo.com', 'Deera', 'Leslie', '000000000000000000000000000000000000000000000000000000000000','6465189562');
INSERT INTO users (username, email, first_name, last_name, user_password, user_phone) VALUES ('generalcreative', 'snowydarts@cencapsulated.com', 'Adam', 'Kilien', '000000000000000000000000000000000000000000000000000000000000','699551235');
INSERT INTO users (username, email, first_name, last_name, user_password, user_phone) VALUES ('loosegardens', 'vinemanager@lowes.com', 'Sarah', 'Banks', '000000000000000000000000000000000000000000000000000000000000','8956235890');



ALTER TABLE workshops
CHANGE workshop_created workshop_created
TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DESCRIBE workshops;

SELECT * FROM workshops;

DELETE FROM workshops
WHERE workshop_id = 9;

DROP TABLE workshops;

DELETE FROM workshops;

DROP TABLE workshops;

INSERT INTO workshops (workshop_name, workshop_description, workshop_date, workshop_location) VALUES ('Silent Climbing','A light introduction to swoosh and hack movements','2025-01-17 19:23:25.40','Bogoda\'s Studio');
INSERT INTO workshops (workshop_name, workshop_description, workshop_date, workshop_location) VALUES ('Loud Climbing','A deeper introduction to dynamic movement','2025-01-26 19:23:25.40','Bogoda\'s Studio');
INSERT INTO workshops (workshop_name, workshop_description, workshop_date, workshop_location) VALUES ('Slow Climbing','Feelings tied to breath sequences and ground standing','2025-02-06 19:23:25.40','Traps Place on 40th');
INSERT INTO workshops (workshop_name, workshop_description, workshop_date, workshop_location) VALUES ('Fast Climbing','Applying dynamics to first monologue','2025-02-14 23:25:40','Toads Green Rock');
INSERT INTO workshops (workshop_name, workshop_description, workshop_date, workshop_location) VALUES ('Pointing Out Character Body Language','Shaping the body in sitting, standing and walking positions','2025-02-14 23:25:40','Toads Green Rock');
INSERT INTO workshops (workshop_name, workshop_description, workshop_date, workshop_location) VALUES ('Fast Climbing','Applying dynamics to first monologue','2025-02-14 23:25:40','Toads Green Rock');

SELECT * FROM workshop_modules;

DESCRIBE workshop_modules;

ALTER TABLE workshop_modules
CHANGE workshop_status workshop_module_status
ENUM('pending','open','completed') NOT NULL DEFAULT 'pending';

ALTER TABLE workshop_modules
CHANGE workshop_module_created workshop_module_created
TIMESTAMP(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2);

SELECT *
FROM workshop_modules;

SELECT *
FROM workshops;

INSERT INTO workshop_modules (workshop_id, workshop_progress, workshop_module_name) VALUES (2, 1, 'Hack Movements');
INSERT INTO workshop_modules (workshop_id, workshop_progress, workshop_module_name) VALUES (2, 1, 'Swoosh Movements');

SELECT *
FROM workshops w JOIN workshop_modules wm
ON w.workshop_id = wm.workshop_id;

SELECT * FROM workshop_rsvps;

INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (2,2);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (2,7);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (2,4);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (2,3);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (2,1);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (3,2);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (3,7);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (3,4);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (3,3);
INSERT INTO workshop_rsvps (workshop_id, user_id) VALUES (3,1);

SELECT * FROM workshop_rsvps
ORDER BY workshop_rsvp_created;

DELETE FROM workshop_rsvps
WHERE workshop_rsvp_id = 1;

DESCRIBE workshop_rsvps;

DROP TABLE workshop_rsvps;

DESCRIBE prompt_templates;

ALTER TABLE prompt_templates
CHANGE name prompt_template_name
VARCHAR(255);

SELECT * FROM prompts;

SELECT * FROM prompt_templates;

SELECT * FROM workshop_modules;

INSERT INTO prompt_templates (prompt_template_name) VALUES ('Multiple Choice');
INSERT INTO prompt_templates (prompt_template_name) VALUES ('Check List Options');
INSERT INTO prompt_templates (prompt_template_name) VALUES ('Free Response Long');
INSERT INTO prompt_templates (prompt_template_name) VALUES ('Free Response Short');
INSERT INTO prompt_templates (prompt_template_name) VALUES ('Drag and Drop');

DESCRIBE prompt_templates;
DESCRIBE workshop_responses;
DESCRIBE workshop_prompts;

DELETE FROM prompt_templates
WHERE prompt_template_id = 2;

ALTER TABLE prompt_templates
ADD CONSTRAINT UNIQUE (prompt_template_name);

SELECT * FROM workshop_modules;
SELECT * FROM prompt_templates;
SELECT * FROM workshop_responses;
SELECT * FROM workshop_prompts;

INSERT INTO workshop_prompts (workshop_module_id, prompt_template_id, workshop_prompt_instruction) VALUES (2,3,'Choose which character trait feels most like a swoosh');
INSERT INTO workshop_prompts (workshop_module_id, prompt_template_id, workshop_prompt_instruction) VALUES (1,6,'Drag and drop each character into the area related to their level of hackiness.');

ALTER TABLE workshop_responses
CHANGE workshop_prompt_id workshop_prompt_id
INT NOT NULL;

SELECT * FROM workshop_responses;

INSERT INTO workshop_responses (user_id, workshop_prompt_id, workshop_response_content) VALUES (7, 1, '{"response1" : "shrewdness"}');

SELECT * FROM productions;

SELECT * FROM users;

INSERT INTO productions (production_name, production_description, production_showtimes) VALUES ('Skulls From Molds','A series of skits loosely tied by experimental exercises. A mouth full with a slight error.','{"showtime1": "2025-07-17 19:00:00.00", "showtime2": "2025-07-18 19:00:00.00", "showtime3": "2025-07-19 19:00:00.00"}');

SELECT * FROM productions;

DESCRIBE productions;
DESCRIBE production_modules;

ALTER TABLE production_modules
CHANGE production_module_created production_module_created
TIMESTAMP(2) NOT NULL DEFAULT CURRENT_TIMESTAMP(2);

INSERT INTO production_modules (production_id, production_module_name) VALUES (1, 'Writing');
INSERT INTO production_modules (production_id, production_module_name) VALUES (1, 'Lights');
INSERT INTO production_modules (production_id, production_module_name) VALUES (1, 'Set');
INSERT INTO production_modules (production_id, production_module_name) VALUES (1, 'Costume');
INSERT INTO production_modules (production_id, production_module_name) VALUES (1, 'Sound');

DROP TABLE productions;

SELECT * 
FROM production_modules pm
JOIN productions p
ON pm.production_id = p.production_id;

ALTER TABLE production_prompts
CHANGE production_reference production_prompt_reference
TEXT;

ALTER TABLE production_prompts
CHANGE production_instruction production_prompt_instruction
varchar(255) NOT NULL;

DESCRIBE workshop_prompts;
DESCRIBE production_prompts;

SELECT * FROM production_modules;
SELECT * FROM prompt_templates;
SELECT * FROM production_prompts;

INSERT INTO production_prompts (production_module_id, prompt_template_id, production_prompt_instruction) VALUES (2,1,'Choose which angle to use with the flood light');
INSERT INTO production_prompts (production_module_id, prompt_template_id, production_prompt_instruction) VALUES (1,6,'Drag and drop the character Justin will run into in the beginning, middle and end?');

SELECT * FROM users;

INSERT INTO production_responses (user_id, production_prompt_id, production_response_content) VALUES (4,2,'{"chosenOption": "45 degrees"}');
INSERT INTO production_responses (user_id, production_prompt_id, production_response_content) VALUES (4,1,'{"jimmyPosition": [13,5], "johnnyPosition": [23, 54], "timPosition": [1, 5]}');

DESCRIBE production_responses;




SELECT * FROM production_responses;

DELIMITER $$

CREATE PROCEDURE email_check(
    IN input_user_name VARCHAR(40),
    IN input_email VARCHAR(255),
    IN input_first_name VARCHAR(255),
    IN input_last_name VARCHAR (255),
    IN input_user_password CHAR(60),
    IN user_phone CHAR(10),
    OUT message VARCHAR(255)
)

BEGIN

	DECLARE email_count INT;
    
    SELECT COUNT(*) INTO email_count
    FROM users
    WHERE email = input_email;
    
	IF email_count > 0 THEN
		SET message = 'Email Already Exists';
    ELSE
		INSERT INTO users (username, email, first_name, last_name, user_password, user_phone) 
        VALUES (input_user_name, input_email, input_first_name, input_last_name, input_user_password, user_phone);
        SET message = 'User successfully added';
    END IF;

END$$

DELIMITER ;

SET @msg = '';

CALL email_check('tyler_climbs','rockandpowder@gradientgyms.com','Tyler','Glunnet','000000000000000000000000000000000000000000000000000000000000','2658945260', @msg);
CALL email_check('sequencearbiter','Josie12@yahoo.com','Josie','Forester','000000000000000000000000000000000000000000000000000000000000','5869521245', @msg);
CALL email_check('sequencearbiter','Josie12@yahoo.com','Josie','Forester','000000000000000000000000000000000000000000000000000000000000','5869521245', @msg);

SELECT @msg;

SELECT *
FROM users;

COMMIT;

DELIMITER $$


CREATE PROCEDURE export_create_table()
BEGIN

DECLARE done INT DEFAULT FALSE;
DECLARE tbl_name VARCHAR(255);
DECLARE cur CURSOR FOR
	SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE engine = 'InnoDB' AND create_time > '2024-09-28 14:34:20' 
    ORDER BY create_time;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

OPEN cur;

read_loop: LOOP

	FETCH cur INTO tbl_name;
	IF done THEN
		LEAVE read_loop;
	END IF;
    SET @stmt = CONCAT('SHOW CREATE TABLE ',tbl_name,';');
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur;
    
END$$

DELIMITER ;

CALL export_create_table;
 
 DELIMITER ;
  
 


