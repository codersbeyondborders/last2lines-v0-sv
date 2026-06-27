CREATE TABLE IF NOT EXISTS contact_submissions (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type           TEXT NOT NULL CHECK (type IN ('campaign_request','feedback','concern','general')),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  subject        TEXT,
  message        TEXT NOT NULL,
  campaign_name  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
