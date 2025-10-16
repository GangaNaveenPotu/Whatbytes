-- Add is_available column to doctors table if it doesn't exist
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
