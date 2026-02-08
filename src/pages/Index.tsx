import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Settings, RotateCcw, Trophy, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import FlashCard from '@/components/FlashCard';
import CategoryFilter from '@/components/CategoryFilter';
import { storage, Character } from '@/lib/storage';
import { flashcardLogic, StudySession } from '@/lib/flashcard-logic';

export default function Index() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [session, setSession] = useState<StudySession | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const startStudySession = async () => {
    const studyCharacters = await storage.getStudySession(selectedCategory);
    if (studyCharacters.length > 0) {
      const newSession = flashcardLogic.createSession(studyCharacters);
      setSession(newSession);
      setShowResults(false);
    }
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
  const categories = [...new Set(characters.map(char => char.category))].sort();
  
  const characterCounts = categories.reduce((acc, category) => {
    acc[category] = characters.filter(char => char.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  const currentCharacter = session ? flashcardLogic.getCurrentCharacter(session) : null;
  const stats = session ? flashcardLogic.getStats(session) : null;
  const progress = session ? flashcardLogic.getProgress(session) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showResults && session) {
    const finalStats = flashcardLogic.getStats(session);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
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
                <Button onClick={startStudySession} size="lg">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Shineeze Character Flashcards
          </h1>
          <p className="text-gray-600">
            Master Chinese characters with smart spaced repetition
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{characters.length}</div>
              <div className="text-sm text-gray-600">Total Characters</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">
                {characters.filter(c => c.score > 0).length}
              </div>
              <div className="text-sm text-gray-600">Characters Practiced</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
        </div>

        {/* Category selection and study controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start Study Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              characterCounts={characterCounts}
              showTags={false}
            />
            
            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                onClick={startStudySession} 
                size="lg" 
                className="w-full md:flex-1"
                disabled={characters.length === 0}
              >
                <BookOpen className="mr-2" size={20} />
                Start Study Session
              </Button>
              <Link to="/manage" className="w-full md:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  <Settings className="mr-2" size={20} />
                  Manage Characters
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick preview of characters */}
        {characters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Characters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {characters.slice(0, 8).map((character) => (
                  <div
                    key={character.id}
                    className="text-center p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl font-bold mb-1">{character.chinese}</div>
                    <div className="text-sm text-blue-600 mb-1">{character.pinyin}</div>
                    <div className="text-xs text-gray-600">{character.english}</div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Score: {character.score}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}