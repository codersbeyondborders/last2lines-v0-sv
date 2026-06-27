-- Migration: add partners column to campaigns
-- Partners is a free-text array of partner names/organisations.
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS partners TEXT[] NOT NULL DEFAULT '{}';
