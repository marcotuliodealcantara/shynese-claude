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
}

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
  async addCharacter(character: Omit<Character, 'id' | 'score' | 'attempts' | 'correctCount' | 'lastReviewed'>): Promise<Character | null> {
    const newCharacter = {
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

  // Get characters for study session
  async getStudySession(category?: string): Promise<Character[]> {
    // Start building the query
    let query = supabase
      .from('characters')
      .select('*')
      // Primary sort: Score ascending (0 first). This prioritizes unlearned or hard items.
      .order('score', { ascending: true })
      // Secondary sort: Attempts descending. 
      // Among items with the same score (e.g., 0), this prioritizes ones we've tried and failed 
      // over ones we haven't seen yet.
      .order('attempts', { ascending: false });

    // Apply category filter if specific category is chosen
    if (category && category !== 'all') {
      query = query.eq('category', category);
    } else {
      // If "All Categories" (or undefined), limit to 10 items
      query = query.limit(10);
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
    const characters = await this.getCharacters();
    if (characters.length === 0) {
      const sampleCharacters = [
        { chinese: '你好', pinyin: 'nǐ hǎo', english: 'hello', category: 'Greetings' },
        { chinese: '谢谢', pinyin: 'xiè xiè', english: 'thank you', category: 'Greetings' },
        { chinese: '水', pinyin: 'shuǐ', english: 'water', category: 'Nature' },
        { chinese: '火', pinyin: 'huǒ', english: 'fire', category: 'Nature' },
        { chinese: '一', pinyin: 'yī', english: 'one', category: 'Numbers' },
        { chinese: '二', pinyin: 'èr', english: 'two', category: 'Numbers' },
        { chinese: '三', pinyin: 'sān', english: 'three', category: 'Numbers' }
      ];
      
      for (const char of sampleCharacters) {
        await this.addCharacter(char);
      }
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
      lastReviewed: new Date(row.last_reviewed)
    };
  }
};