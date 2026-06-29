-- Add email verification. New signups start unverified and must confirm via an
-- emailed link before they can log in (see backend/routes/auth.js).
--
-- Existing accounts predate this feature, so mark them verified to avoid locking
-- anyone out. New rows default to false.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET email_verified = true WHERE email_verified = false;
