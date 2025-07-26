/*
  # Create shared summaries table

  1. New Tables
    - `shared_summaries`
      - `id` (text, primary key) - Share ID for the URL
      - `data` (jsonb) - The page state data
      - `expires_at` (timestamptz) - When this share expires
      - `created_at` (timestamptz) - When this share was created

  2. Security
    - Enable RLS on `shared_summaries` table
    - Add policy for anonymous users to insert and read data
*/

CREATE TABLE IF NOT EXISTS shared_summaries (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shared_summaries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert new shares
CREATE POLICY "Anyone can insert shares"
  ON shared_summaries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to read shares that haven't expired
CREATE POLICY "Anyone can read unexpired shares"
  ON shared_summaries
  FOR SELECT
  TO anon
  USING (expires_at > now());

-- Set up automatic cleanup of expired shares
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-shares',
  '0 * * * *', -- Run every hour
  $$
    DELETE FROM shared_summaries WHERE expires_at <= now();
  $$
);