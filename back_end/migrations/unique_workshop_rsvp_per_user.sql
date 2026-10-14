-- Inspect and resolve any existing duplicate (workshop_id, user_id) pairs first:
-- SELECT workshop_id, user_id, COUNT(*) FROM workshop_rsvps
-- GROUP BY workshop_id, user_id HAVING COUNT(*) > 1;
ALTER TABLE workshop_rsvps
  ADD UNIQUE KEY uq_workshop_rsvp_user (workshop_id, user_id);
