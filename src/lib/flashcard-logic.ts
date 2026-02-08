import { Character } from './storage';

export interface StudySession {
  characters: Character[];
  currentIndex: number;
  totalCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export const flashcardLogic = {
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