import { storage, type StudySessionProgress } from './storage';

export interface SessionTracker {
  // Record progress after an answer. The first call creates the study_sessions row
  // (a session only counts once a card was answered); later calls update it, in order.
  record(progress: StudySessionProgress): void;
  // Resolves once every pending write has finished (call before reloading stats).
  flush(): Promise<void>;
}

export function createSessionTracker(category: string, cardsPlanned: number): SessionTracker {
  // Writes are chained so updates never overtake the insert or each other.
  let chain: Promise<number | null> | null = null;

  return {
    record(progress) {
      chain = chain
        ? chain.then(async (id) => {
            if (id !== null) await storage.updateStudySession(id, progress);
            return id;
          })
        : storage.createStudySession({ ...progress, category, cardsPlanned });
    },
    async flush() {
      await chain;
    },
  };
}
