-- Add featured column to campaigns table
ALTER TABLE campaigns ADD COLUMN featured BOOLEAN DEFAULT false NOT NULL;
