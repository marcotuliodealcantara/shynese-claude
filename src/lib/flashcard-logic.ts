import { Character } from './storage';

export interface StudySession {
  characters: Character[];
  currentIndex: number;
  totalCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export type SessionSize = number | 'all';

// Fisher–Yates shuffle (returns a new array)
function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Cards answered within this window get a reduced chance, so consecutive rounds don't repeat them.
const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const COOLDOWN_FACTOR = 0.15;

// Chance weight of a card: weaker cards (score close to the category's lowest) weigh more,
// recently reviewed cards weigh less. 1 point above the lowest = 1/4, 3 points = 1/16, 10 points = 1/121.
function cardWeight(character: Character, minScore: number, now: number): number {
  const scoreWeight = 1 / (1 + character.score - minScore) ** 2;
  const reviewedRecently = now - character.lastReviewed.getTime() < COOLDOWN_MS;
  return reviewedRecently ? scoreWeight * COOLDOWN_FACTOR : scoreWeight;
}

export const flashcardLogic = {
  // Pick the cards for a study session with a weighted random draw (no repeats):
  // - lower score → higher chance, so weaker characters are prioritized without
  //   monopolizing every session;
  // - characters answered in the last 6 hours get 15% of their chance, so new rounds
  //   bring different characters.
  // The picked cards are shuffled so the deck isn't ordered by weight.
  selectStudyCards(
    characters: Character[],
    size: SessionSize,
    random: () => number = Math.random,
    now: number = Date.now()
  ): Character[] {
    if (size === 'all' || size >= characters.length) return shuffle(characters, random);

    const minScore = Math.min(...characters.map((c) => c.score));
    // Efraimidis–Spirakis: key = u^(1/weight); the `size` largest keys form a weighted sample.
    const picked = characters
      .map((character) => ({ character, key: random() ** (1 / cardWeight(character, minScore, now)) }))
      .sort((a, b) => b.key - a.key)
      .slice(0, size)
      .map(({ character }) => character);
    return shuffle(picked, random);
  },

  // Create a new study session
  createSession(characters: Character[]): StudySession {
    return {
      characters: [...characters], // Create a copy
      currentIndex: 0,
      totalCards: characters.length,
      correctAnswers: 0,
      incorrectAnswers: 0
    };
  },

  // Get current character in session
  getCurrentCharacter(session: StudySession): Character | null {
    if (session.currentIndex >= session.characters.length) {
      return null;
    }
    return session.characters[session.currentIndex];
  },

  // Move to next character
  nextCharacter(session: StudySession): StudySession {
    return {
      ...session,
      currentIndex: session.currentIndex + 1
    };
  },

  // Record answer and move to next
  recordAnswerAndNext(session: StudySession, isCorrect: boolean): StudySession {
    const newSession = {
      ...session,
      currentIndex: session.currentIndex + 1,
      correctAnswers: isCorrect ? session.correctAnswers + 1 : session.correctAnswers,
      incorrectAnswers: isCorrect ? session.incorrectAnswers : session.incorrectAnswers + 1
    };

    return newSession;
  },

  // Check if session is complete
  isSessionComplete(session: StudySession): boolean {
    return session.currentIndex >= session.characters.length;
  },

  // Get session progress percentage
  getProgress(session: StudySession): number {
    if (session.totalCards === 0) return 0;
    return Math.round((session.currentIndex / session.totalCards) * 100);
  },

  // Get session statistics
  getStats(session: StudySession) {
    const accuracy = session.totalCards > 0 
      ? Math.round((session.correctAnswers / (session.correctAnswers + session.incorrectAnswers)) * 100) 
      : 0;

    return {
      total: session.totalCards,
      completed: session.currentIndex,
      correct: session.correctAnswers,
      incorrect: session.incorrectAnswers,
      accuracy: isNaN(accuracy) ? 0 : accuracy,
      remaining: session.totalCards - session.currentIndex
    };
  }
};