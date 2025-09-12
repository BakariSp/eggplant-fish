-- Modify avatar_url from text to jsonb array to store multiple photos
-- This replaces the previous profile_photos field approach

-- First, let's backup existing avatar_url data
-- Create a temporary column to store the backup
ALTER TABLE pets ADD COLUMN avatar_url_backup text;

-- Copy existing avatar_url to backup
UPDATE pets SET avatar_url_backup = avatar_url WHERE avatar_url IS NOT NULL;

-- Drop the old avatar_url column
ALTER TABLE pets DROP COLUMN IF EXISTS avatar_url;

-- Add new avatar_url as jsonb array
ALTER TABLE pets ADD COLUMN avatar_url jsonb[] DEFAULT '{}';

-- Migrate existing data: convert single URLs to arrays
UPDATE pets 
SET avatar_url = CASE 
  WHEN avatar_url_backup IS NOT NULL AND avatar_url_backup != '' 
  THEN jsonb_build_array(avatar_url_backup)
  ELSE '{}'::jsonb[]
END;

-- Add comment to document the field
COMMENT ON COLUMN pets.avatar_url IS 'Array of photo URLs for pet profile photos. First photo is typically the main avatar.';

-- Create index for better performance when querying avatar photos
CREATE INDEX IF NOT EXISTS idx_pets_avatar_url ON pets USING GIN (avatar_url);

-- Drop the backup column
ALTER TABLE pets DROP COLUMN avatar_url_backup;

-- Drop the profile_photos column if it exists (from previous migration)
ALTER TABLE pets DROP COLUMN IF EXISTS profile_photos;
