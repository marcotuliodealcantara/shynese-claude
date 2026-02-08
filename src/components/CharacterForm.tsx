import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Character } from '@/lib/storage';

interface CharacterFormProps {
  character?: Character;
  onSave: (character: Omit<Character, 'id' | 'score' | 'attempts' | 'correctCount' | 'lastReviewed'>) => void;
  onCancel: () => void;
}

export default function CharacterForm({ character, onSave, onCancel }: CharacterFormProps) {
  const [formData, setFormData] = useState({
    chinese: character?.chinese || '',
    pinyin: character?.pinyin || '',
    english: character?.english || '',
    category: character?.category || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.chinese.trim()) {
      newErrors.chinese = 'Chinese character is required';
    }

    if (!formData.pinyin.trim()) {
      newErrors.pinyin = 'Pinyin is required';
    }

    if (!formData.english.trim()) {
      newErrors.english = 'English translation is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        chinese: formData.chinese.trim(),
        pinyin: formData.pinyin.trim(),
        english: formData.english.trim(),
        category: formData.category.trim()
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{character ? 'Edit Character' : 'Add New Character'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chinese">Chinese Character</Label>
            <Input
              id="chinese"
              value={formData.chinese}
              onChange={(e) => handleInputChange('chinese', e.target.value)}
              placeholder="你好"
              className={errors.chinese ? 'border-red-500' : ''}
            />
            {errors.chinese && (
              <p className="text-sm text-red-500">{errors.chinese}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pinyin">Pinyin</Label>
            <Input
              id="pinyin"
              value={formData.pinyin}
              onChange={(e) => handleInputChange('pinyin', e.target.value)}
              placeholder="nǐ hǎo"
              className={errors.pinyin ? 'border-red-500' : ''}
            />
            {errors.pinyin && (
              <p className="text-sm text-red-500">{errors.pinyin}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="english">English Translation</Label>
            <Input
              id="english"
              value={formData.english}
              onChange={(e) => handleInputChange('english', e.target.value)}
              placeholder="hello"
              className={errors.english ? 'border-red-500' : ''}
            />
            {errors.english && (
              <p className="text-sm text-red-500">{errors.english}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="Greetings"
              className={errors.category ? 'border-red-500' : ''}
            />
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {character ? 'Update' : 'Add'} Character
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}