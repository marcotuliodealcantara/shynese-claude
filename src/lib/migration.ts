import { supabase } from './supabase';

/**
 * Migrates characters without user_id to the current user.
 * Should be called after first successful signup.
 *
 * @returns Number of characters migrated
 */
export async function migrateOrphanedCharacters(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No authenticated user');
  }

  // Call the Supabase function to migrate orphaned characters
  const { data, error } = await supabase.rpc('migrate_orphaned_characters', {
    target_user_id: user.id
  });

  if (error) {
    throw error;
  }

  return data || 0;
}
