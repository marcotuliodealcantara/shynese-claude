-- Supabase Migration: Enable Row Level Security for Multi-User Support
-- Execute this in the Supabase SQL Editor

-- Step 1: Enable RLS on characters table
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Step 2: Verify user_id column exists (should already be in schema)
-- If not present, uncomment and run:
-- ALTER TABLE characters ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Step 3: Create RLS Policies

-- Policy: Users can only view their own characters
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own characters
CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own characters
CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own characters
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);

-- Step 4: Create migration function for orphaned characters
-- This function assigns characters without user_id to a target user
CREATE OR REPLACE FUNCTION migrate_orphaned_characters(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE characters
  SET user_id = target_user_id
  WHERE user_id IS NULL;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification queries (run after migration):
-- SELECT COUNT(*) FROM characters WHERE user_id IS NULL; -- Should be 0
-- SELECT COUNT(*) FROM characters GROUP BY user_id; -- View distribution
