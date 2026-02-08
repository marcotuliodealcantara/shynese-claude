import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  characterCounts?: Record<string, number>;
  showTags?: boolean;
}

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  characterCounts = {},
  showTags = true
}: CategoryFilterProps) {
  const totalCount = Object.values(characterCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center justify-between w-full">
                <span>All Categories</span>
                <Badge variant="secondary" className="ml-2">
                  {totalCount}
                </Badge>
              </div>
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                <div className="flex items-center justify-between w-full">
                  <span>{category}</span>
                  <Badge variant="secondary" className="ml-2">
                    {characterCounts[category] || 0}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category chips for quick selection */}
      {showTags && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => onCategoryChange('all')}
          >
            All ({totalCount})
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/80"
              onClick={() => onCategoryChange(category)}
            >
              {category} ({characterCounts[category] || 0})
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}