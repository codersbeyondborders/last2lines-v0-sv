-- Email integration (Resend): optional email verification + auto-email on publish.
-- Adds per-campaign toggles and per-contribution verification tracking.

-- ----------------------------------------------------------------------------
-- campaigns: two new admin-controlled toggles
-- ----------------------------------------------------------------------------
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS auto_email_on_publish BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- contributions: verification + publish-email tracking
-- ----------------------------------------------------------------------------

-- Allow a new 'unverified' status (held until the author confirms their email).
ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_status_check;
ALTER TABLE contributions
  ADD CONSTRAINT contributions_status_check
  CHECK (status IN ('unverified','pending','approved','rejected'));

ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

-- Opaque token emailed to the author for confirming their submission.
ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS verification_token TEXT;

ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;

-- Guards against sending the "your couplet is live" email more than once.
ALTER TABLE contributions
  ADD COLUMN IF NOT EXISTS publish_email_sent_at TIMESTAMPTZ;

-- Fast lookup when an author clicks their verification link.
CREATE INDEX IF NOT EXISTS idx_contributions_verification_token
  ON contributions(verification_token)
  WHERE verification_token IS NOT NULL;
