import { supabase } from './supabase';

export interface Character {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  category: string;
  score: number;
  attempts: number;
  correctCount: number;
  lastReviewed: Date;
  createdAt: Date;
}

// Progress of a study session as stored in public.study_sessions
export interface StudySessionProgress {
  cardsAnswered: number;
  correctCount: number;
  completed: boolean;
}

// Fields the user types when adding or editing a character
export type CharacterInput = Pick<Character, 'chinese' | 'pinyin' | 'english' | 'category'>;

// Database row interface matching the Supabase table structure
interface CharacterRow {
  id: string;
  user_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  category: string;
  score: number;
  attempts: number;
  correct_count: number;
  last_reviewed: string;
  created_at: string;
}

// Interface for database updates
interface CharacterUpdate {
  chinese?: string;
  pinyin?: string;
  english?: string;
  category?: string;
  score?: number;
  attempts?: number;
  correct_count?: number;
  last_reviewed?: string;
}

export const storage = {
  // Get all characters
  async getCharacters(): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching characters:', error);
      return [];
    }

    return (data as CharacterRow[]).map(this.mapRowToCharacter);
  },

  // Add a new character
  async addCharacter(character: CharacterInput): Promise<Character | null> {
    // Get current user (must be authenticated)
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('User must be authenticated to add characters');
      return null;
    }

    const newCharacter = {
      user_id: user.id, // Inject user_id for RLS
      chinese: character.chinese,
      pinyin: character.pinyin,
      english: character.english,
      category: character.category,
      score: 0,
      attempts: 0,
      correct_count: 0,
      last_reviewed: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('characters')
      .insert(newCharacter)
      .select()
      .single();

    if (error) {
      console.error('Error adding character:', error);
      return null;
    }

    return this.mapRowToCharacter(data as CharacterRow);
  },

  // Update a character
  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    const dbUpdates: CharacterUpdate = {};
    
    if (updates.chinese !== undefined) dbUpdates.chinese = updates.chinese;
    if (updates.pinyin !== undefined) dbUpdates.pinyin = updates.pinyin;
    if (updates.english !== undefined) dbUpdates.english = updates.english;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.score !== undefined) dbUpdates.score = updates.score;
    if (updates.attempts !== undefined) dbUpdates.attempts = updates.attempts;
    if (updates.correctCount !== undefined) dbUpdates.correct_count = updates.correctCount;
    if (updates.lastReviewed !== undefined) dbUpdates.last_reviewed = updates.lastReviewed.toISOString();

    const { error } = await supabase
      .from('characters')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating character:', error);
    }
  },

  // Delete a character
  async deleteCharacter(id: string): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting character:', error);
    }
  },

  // Get the candidate characters for a study session (all of the category, or all characters).
  // Prioritization and the session size are applied by flashcardLogic.selectStudyCards.
  async getStudySession(category?: string): Promise<Character[]> {
    let query = supabase
      .from('characters')
      .select('*');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching study session:', error);
      return [];
    }

    return (data as CharacterRow[]).map(this.mapRowToCharacter);
  },

  // Record answer for a character
  async recordAnswer(id: string, isCorrect: boolean): Promise<void> {
    // First get the current character data
    const { data: currentData, error: fetchError } = await supabase
      .from('characters')
      .select('score, attempts, correct_count')
      .eq('id', id)
      .single();

    if (fetchError || !currentData) {
      console.error('Error fetching character for update:', fetchError);
      return;
    }

    const updates = {
      attempts: currentData.attempts + 1,
      correct_count: isCorrect ? currentData.correct_count + 1 : currentData.correct_count,
      score: isCorrect ? currentData.score + 1 : Math.max(0, currentData.score - 1),
      last_reviewed: new Date().toISOString()
    };

    const { error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error recording answer:', error);
    }
  },

  // --- Study sessions (table public.study_sessions) ---

  // Create the session record (called on the first answer). Returns its id, or null on failure
  // (e.g. migration not applied yet) — studying keeps working, the session just isn't counted.
  async createStudySession(record: StudySessionProgress & { category: string; cardsPlanned: number }): Promise<number | null> {
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        category: record.category === 'all' ? null : record.category,
        cards_planned: record.cardsPlanned,
        cards_answered: record.cardsAnswered,
        correct_count: record.correctCount,
        completed: record.completed,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating study session:', error);
      return null;
    }
    return (data as { id: number }).id;
  },

  async updateStudySession(id: number, progress: StudySessionProgress): Promise<void> {
    const { error } = await supabase
      .from('study_sessions')
      .update({
        cards_answered: progress.cardsAnswered,
        correct_count: progress.correctCount,
        completed: progress.completed,
        last_answer_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating study session:', error);
    }
  },

  // Start time of every session (newest first) — enough for streaks and weekly counts.
  async getStudySessionDates(): Promise<Date[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('started_at')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching study sessions:', error);
      return [];
    }
    return (data as { started_at: string }[]).map((row) => new Date(row.started_at));
  },

  // Get all unique categories
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('category');

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    const categories = [...new Set((data as { category: string }[]).map(item => item.category))];
    return categories.sort();
  },

  // Initialize with sample data if empty
  async initializeSampleData(): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('No authenticated user, skipping sample data');
      return;
    }

    // Check if user already has characters
    const characters = await this.getCharacters();
    if (characters.length > 0) {
      return; // User already has data
    }

    const sampleCharacters = [
      { chinese: '你好', pinyin: 'nǐ hǎo', english: 'hello', category: 'Expressions' },
      { chinese: '谢谢', pinyin: 'xiè xiè', english: 'thank you', category: 'Expressions' },
      { chinese: '水', pinyin: 'shuǐ', english: 'water', category: 'Nature' },
      { chinese: '火', pinyin: 'huǒ', english: 'fire', category: 'Nature' },
      { chinese: '一', pinyin: 'yī', english: 'one', category: 'Numbers' },
      { chinese: '二', pinyin: 'èr', english: 'two', category: 'Numbers' },
      { chinese: '三', pinyin: 'sān', english: 'three', category: 'Numbers' }
    ];

    for (const char of sampleCharacters) {
      await this.addCharacter(char);
    }
  },

  // Helper to map DB row to Character interface
  mapRowToCharacter(row: CharacterRow): Character {
    return {
      id: row.id,
      chinese: row.chinese,
      pinyin: row.pinyin,
      english: row.english,
      category: row.category,
      score: row.score,
      attempts: row.attempts,
      correctCount: row.correct_count,
      lastReviewed: new Date(row.last_reviewed),
      createdAt: new Date(row.created_at)
    };
  }
};