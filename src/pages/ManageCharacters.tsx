import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import CharacterForm from '@/components/CharacterForm';
import CategoryFilter from '@/components/CategoryFilter';
import { storage, Character } from '@/lib/storage';

export default function ManageCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    filterCharacters();
  }, [characters, selectedCategory, searchTerm]);

  const loadCharacters = async () => {
    setIsLoading(true);
    try {
      const allCharacters = await storage.getCharacters();
      setCharacters(allCharacters);
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCharacters = () => {
    let filtered = characters;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(char => char.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(char =>
        char.chinese.toLowerCase().includes(term) ||
        char.pinyin.toLowerCase().includes(term) ||
        char.english.toLowerCase().includes(term) ||
        char.category.toLowerCase().includes(term)
      );
    }

    setFilteredCharacters(filtered);
  };

  const handleSaveCharacter = async (characterData: Omit<Character, 'id' | 'score' | 'attempts' | 'correctCount' | 'lastReviewed'>) => {
    try {
      if (editingCharacter) {
        await storage.updateCharacter(editingCharacter.id, characterData);
      } else {
        await storage.addCharacter(characterData);
      }
      
      await loadCharacters();
      setShowForm(false);
      setEditingCharacter(null);
    } catch (error) {
      console.error('Failed to save character:', error);
    }
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowForm(true);
  };

  const handleDeleteCharacter = async (id: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
      try {
        await storage.deleteCharacter(id);
        await loadCharacters();
      } catch (error) {
        console.error('Failed to delete character:', error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCharacter(null);
  };

  // Derive categories from loaded characters
  const categories = [...new Set(characters.map(char => char.category))].sort();
  
  const characterCounts = categories.reduce((acc, category) => {
    acc[category] = characters.filter(char => char.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  if (showForm) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link to="/">
              <Button variant="outline" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
          </div>
          
          <CharacterForm
            character={editingCharacter || undefined}
            onSave={handleSaveCharacter}
            onCancel={handleCancelForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/">
              <Button variant="outline" size="icon">
                <ArrowLeft size={20} />
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Manage Characters
          </h1>
          <Button onClick={() => setShowForm(true)} size="icon">
            <Plus size={20} />
          </Button>
        </div>

        {/* Filters and search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search characters, pinyin, english, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              characterCounts={characterCounts}
            />
          </CardContent>
        </Card>

        {/* Results summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredCharacters.length} of {characters.length} characters
        </div>

        {/* Characters grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredCharacters.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {characters.length === 0 ? 'No characters found. Add your first character!' : 'No characters match your search criteria.'}
              </div>
              {characters.length === 0 && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2" size={16} />
                  Add First Character
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.map((character) => (
              <Card key={character.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold mb-2">{character.chinese}</div>
                    <div className="text-lg text-blue-600 mb-1">{character.pinyin}</div>
                    <div className="text-gray-700 mb-2">{character.english}</div>
                    <Badge variant="outline">{character.category}</Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <Badge variant={character.score > 5 ? 'default' : character.score > 0 ? 'secondary' : 'outline'}>
                        {character.score}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Attempts:</span>
                      <span>{character.attempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correct:</span>
                      <span>{character.correctCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span>
                        {character.attempts > 0 
                          ? `${Math.round((character.correctCount / character.attempts) * 100)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCharacter(character)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2" size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCharacter(character.id)}
                      className="!bg-transparent !hover:bg-transparent border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}