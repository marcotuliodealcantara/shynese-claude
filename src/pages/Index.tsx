import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Settings, RotateCcw, Trophy, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import FlashCard from '@/components/FlashCard';
import CategoryMosaic from '@/components/CategoryMosaic';
import SessionSizeDialog, { getSessionSizeLevels } from '@/components/SessionSizeDialog';
import { storage, Character } from '@/lib/storage';
import { flashcardLogic, StudySession, SessionSize } from '@/lib/flashcard-logic';

export default function Index() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [session, setSession] = useState<StudySession | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Category waiting for the user to pick a session size (dialog open while set)
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  // Size of the current session, reused by "Study Again"
  const [sessionSize, setSessionSize] = useState<SessionSize>('all');

  useEffect(() => {
    const init = async () => {
      try {
        await storage.initializeSampleData();
        await loadCharacters();
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const loadCharacters = async () => {
    const allCharacters = await storage.getCharacters();
    setCharacters(allCharacters);
  };

  const startStudySession = async (category: string, size: SessionSize) => {
    setSelectedCategory(category);
    setSessionSize(size);
    const candidates = await storage.getStudySession(category);
    const studyCharacters = flashcardLogic.selectStudyCards(candidates, size);
    if (studyCharacters.length > 0) {
      const newSession = flashcardLogic.createSession(studyCharacters);
      setSession(newSession);
      setShowResults(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    const total = category === 'all' ? characters.length : characterCounts[category] ?? 0;
    // With 5 characters or fewer there is nothing to choose: study them all right away.
    if (getSessionSizeLevels(total).length === 1) {
      startStudySession(category, 'all');
      return;
    }
    setPendingCategory(category);
  };

  const handleSessionSizeConfirm = (size: SessionSize) => {
    if (!pendingCategory) return;
    const category = pendingCategory;
    setPendingCategory(null);
    startStudySession(category, size);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!session) return;

    const currentCharacter = flashcardLogic.getCurrentCharacter(session);
    if (currentCharacter) {
      // Record the answer in storage
      await storage.recordAnswer(currentCharacter.id, isCorrect);
      
      // Update session
      const updatedSession = flashcardLogic.recordAnswerAndNext(session, isCorrect);
      setSession(updatedSession);

      // Check if session is complete
      if (flashcardLogic.isSessionComplete(updatedSession)) {
        setShowResults(true);
        await loadCharacters(); // Refresh character data
      }
    }
  };

  const resetSession = () => {
    setSession(null);
    setShowResults(false);
  };

  // Derive categories from loaded characters
  const characterCounts = useMemo(
    () =>
      characters.reduce((acc, char) => {
        acc[char.category] = (acc[char.category] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [characters]
  );

  const currentCharacter = session ? flashcardLogic.getCurrentCharacter(session) : null;
  const stats = session ? flashcardLogic.getStats(session) : null;
  const progress = session ? flashcardLogic.getProgress(session) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showResults && session) {
    const finalStats = flashcardLogic.getStats(session);
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Session Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {finalStats.correct}
                  </div>
                  <div className="text-sm text-green-700">Correct</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {finalStats.incorrect}
                  </div>
                  <div className="text-sm text-red-700">Incorrect</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {finalStats.accuracy}%
                </div>
                <div className="text-sm text-blue-700">Accuracy</div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => startStudySession(selectedCategory, sessionSize)} size="lg">
                  Study Again
                </Button>
                <Button variant="outline" onClick={resetSession} size="lg">
                  <RotateCcw className="mr-2" size={20} />
                  Back to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (session && currentCharacter) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Progress header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Card {stats?.completed || 0} of {stats?.total || 0}
              </span>
              <Badge variant="outline">
                {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
              </Badge>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Current stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <CardContent className="p-3">
                <div className="text-lg font-bold text-green-600">{stats?.correct || 0}</div>
                <div className="text-xs text-green-700">Correct</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-3">
                <div className="text-lg font-bold text-red-600">{stats?.incorrect || 0}</div>
                <div className="text-xs text-red-700">Incorrect</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-3">
                <div className="text-lg font-bold text-blue-600">{stats?.remaining || 0}</div>
                <div className="text-xs text-blue-700">Remaining</div>
              </CardContent>
            </Card>
          </div>

          {/* Flashcard */}
          <FlashCard
            character={currentCharacter}
            onAnswer={handleAnswer}
            showAnswer={true}
          />

          {/* Back button */}
          <div className="text-center mt-6">
            <Button variant="outline" onClick={resetSession}>
              <RotateCcw className="mr-2" size={16} />
              End Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-base leading-relaxed text-gray-600">
            Build your Chinese vocabulary, one word at a time
          </p>
        </div>

        {/* Category cards */}
        {characters.length === 0 ? (
          <Card className="mb-6 text-center">
            <CardContent className="py-12">
              <p className="text-gray-600 mb-4">No characters available to study.</p>
              <Link to="/manage">
                <Button>
                  <Settings className="mr-2" size={20} />
                  Add Characters
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <CategoryMosaic counts={characterCounts} totalCount={characters.length} onSelect={handleCategoryClick} />
        )}
      </div>

      <SessionSizeDialog
        open={pendingCategory !== null}
        categoryLabel={pendingCategory === 'all' ? 'All Categories' : pendingCategory ?? ''}
        total={
          pendingCategory === 'all'
            ? characters.length
            : pendingCategory
              ? characterCounts[pendingCategory] ?? 0
              : 0
        }
        onOpenChange={(open) => {
          if (!open) setPendingCategory(null);
        }}
        onConfirm={handleSessionSizeConfirm}
      />
    </div>
  );
}