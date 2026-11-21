import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { SessionSize } from '@/lib/flashcard-logic';

const PRESET_SIZES = [5, 10, 20];
const DEFAULT_SIZE = 10;

// Levels offered for a category with `total` characters: the presets smaller than
// the total, plus "All". E.g. total 12 → [5, 10, all]; total 30 → [5, 10, 20, all].
export function getSessionSizeLevels(total: number): SessionSize[] {
  return [...PRESET_SIZES.filter((size) => size < total), 'all'];
}

interface SessionSizeDialogProps {
  open: boolean;
  categoryLabel: string;
  total: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: (size: SessionSize) => void;
}

export default function SessionSizeDialog({
  open,
  categoryLabel,
  total,
  onOpenChange,
  onConfirm,
}: SessionSizeDialogProps) {
  const levels = useMemo(() => getSessionSizeLevels(total), [total]);
  const defaultIndex = Math.max(0, levels.indexOf(DEFAULT_SIZE));
  const [levelIndex, setLevelIndex] = useState(defaultIndex);

  // Reset to the default each time the dialog opens for a category.
  useEffect(() => {
    if (open) setLevelIndex(defaultIndex);
  }, [open, defaultIndex]);

  const selected = levels[Math.min(levelIndex, levels.length - 1)];
  const cardCount = selected === 'all' ? total : selected;
  const labelFor = (size: SessionSize) => (size === 'all' ? 'All' : String(size));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-lg px-4 py-6 sm:px-6">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">How many cards?</DialogTitle>
          <DialogDescription className="text-base">
            {categoryLabel} · {total} characters
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <div className="text-center">
            <div className="text-5xl font-bold text-indigo-600">{cardCount}</div>
            <div className="text-base text-gray-600">
              {selected === 'all' ? 'all cards' : 'cards'}
            </div>
          </div>

          <Slider
            className="py-3"
            min={0}
            max={levels.length - 1}
            step={1}
            value={[levelIndex]}
            onValueChange={([value]) => setLevelIndex(value)}
            aria-label="Number of cards"
          />

          {/* Tappable level labels, centered on each slider stop.
              The 10px inset matches half the slider thumb, which Radix keeps inside the track. */}
          <div className="relative -mt-4 mx-[10px] h-11">
            {levels.map((size, index) => (
              <button
                key={labelFor(size)}
                type="button"
                onClick={() => setLevelIndex(index)}
                style={{ left: `${levels.length > 1 ? (index / (levels.length - 1)) * 100 : 50}%` }}
                className={cn(
                  'absolute top-0 min-h-[44px] min-w-[44px] -translate-x-1/2 rounded-md text-base font-medium transition-colors',
                  index === levelIndex ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
                )}
              >
                {labelFor(size)}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button size="lg" className="min-h-[44px] w-full text-base" onClick={() => onConfirm(selected)}>
            Start · {cardCount} cards
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="min-h-[44px] w-full text-base"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
