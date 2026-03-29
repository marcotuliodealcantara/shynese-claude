import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Settings,
  RotateCcw,
  Trophy,
  Loader2,
  MessageCircle,
  Trees,
  Hash,
  Utensils,
  Home,
  Briefcase,
  Users,
  Heart,
  Calendar,
  MapPin,
  BookMarked,
  Smile,
  Type,
  Lightbulb,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FlashCard from '@/components/FlashCard';
import { storage, Character } from '@/lib/storage';
import { flashcardLogic, StudySession } from '@/lib/flashcard-logic';

// Helper function to get icon for category
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();

  // Icon mappings with colors
  const iconMap: Record<string, { Icon: any; color: string }> = {
    // Greetings & Communication
    greetings: { Icon: MessageCircle, color: 'text-pink-600' },
    greet: { Icon: Smile, color: 'text-pink-600' },
    communication: { Icon: MessageCircle, color: 'text-blue-500' },

    // Nature
    nature: { Icon: Trees, color: 'text-green-600' },
    animals: { Icon: Trees, color: 'text-green-700' },
    plants: { Icon: Trees, color: 'text-emerald-600' },

    // Numbers & Math
    numbers: { Icon: Hash, color: 'text-purple-600' },
    math: { Icon: Hash, color: 'text-purple-700' },
    counting: { Icon: Hash, color: 'text-purple-500' },

    // Food & Dining
    food: { Icon: Utensils, color: 'text-orange-600' },
    dining: { Icon: Utensils, color: 'text-orange-700' },
    restaurant: { Icon: Utensils, color: 'text-orange-500' },

    // Family & People
    family: { Icon: Users, color: 'text-red-600' },
    people: { Icon: Users, color: 'text-red-500' },
    relations: { Icon: Heart, color: 'text-red-600' },

    // Places & Travel
    places: { Icon: MapPin, color: 'text-blue-600' },
    travel: { Icon: Globe, color: 'text-cyan-600' },
    locations: { Icon: MapPin, color: 'text-blue-700' },

    // Home & Daily Life
    home: { Icon: Home, color: 'text-yellow-700' },
    house: { Icon: Home, color: 'text-yellow-600' },
    daily: { Icon: Calendar, color: 'text-teal-600' },

    // Work & Business
    work: { Icon: Briefcase, color: 'text-gray-700' },
    business: { Icon: Briefcase, color: 'text-gray-600' },
    office: { Icon: Briefcase, color: 'text-slate-700' },

    // Learning & Education
    learning: { Icon: BookMarked, color: 'text-indigo-600' },
    education: { Icon: BookMarked, color: 'text-indigo-700' },
    school: { Icon: BookMarked, color: 'text-indigo-500' },

    // Language & Writing
    words: { Icon: Type, color: 'text-violet-600' },
    writing: { Icon: Type, color: 'text-violet-700' },
    language: { Icon: Type, color: 'text-violet-500' },

    // General
    general: { Icon: Lightbulb, color: 'text-amber-600' },
    misc: { Icon: Lightbulb, color: 'text-amber-500' },
  };

  // Try to find a matching icon
  for (const [key, value] of Object.entries(iconMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  // Default icon if no match
  return { Icon: BookMarked, color: 'text-indigo-600' };
};

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

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    const studyCharacters = await storage.getStudySession(category);
    if (studyCharacters.length > 0) {
      const newSession = flashcardLogic.createSession(studyCharacters);
      setSession(newSession);
      setShowResults(false);
    }
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Master Chinese characters with smart spaced repetition
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* All Categories card */}
              <Button
                variant="outline"
                className="h-auto p-6 flex flex-col items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"
                onClick={() => handleCategoryClick('all')}
              >
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div className="text-lg font-semibold">All Categories</div>
                <Badge variant="secondary">{characters.length} characters</Badge>
              </Button>

              {/* Individual category cards */}
              {categories.map((category) => {
                const { Icon, color } = getCategoryIcon(category);
                return (
                  <Button
                    key={category}
                    variant="outline"
                    className="h-auto p-6 flex flex-col items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <Icon className={`w-8 h-8 ${color}`} />
                    <div className="text-lg font-semibold">{category}</div>
                    <Badge variant="secondary">{characterCounts[category]} characters</Badge>
                  </Button>
                );
              })}
            </div>

            {/* Manage Characters button */}
            <div className="text-center">
              <Link to="/manage">
                <Button variant="outline" size="lg">
                  <Settings className="mr-2" size={20} />
                  Manage Characters
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}