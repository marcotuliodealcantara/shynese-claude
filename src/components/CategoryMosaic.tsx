import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryImage } from '@/lib/category-images';
import { assignTileSizes, buildMosaicColumns, type CategoryTile, type TileSize } from '@/lib/category-mosaic';

// Arbitrary values on purpose: the @tailwindcss/aspect-ratio plugin in tailwind.config.ts
// replaces named utilities like `aspect-square` (they generate nothing).
const ASPECT_CLASS: Record<TileSize, string> = {
  tall: 'aspect-[3/4]',
  square: 'aspect-[1/1]',
  short: 'aspect-[4/3]',
};

interface CategoryMosaicProps {
  counts: Record<string, number>;
  totalCount: number;
  onSelect: (category: string) => void;
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-sm font-semibold leading-none text-white backdrop-blur-sm">
      {count}
    </span>
  );
}

function MosaicTile({ tile, onSelect }: { tile: CategoryTile; onSelect: (category: string) => void }) {
  const image = getCategoryImage(tile.category);

  return (
    <button
      type="button"
      onClick={() => onSelect(tile.category)}
      className="group flex w-full flex-col gap-1.5 text-left focus-visible:outline-none"
      aria-label={`${tile.category}, ${tile.count} characters`}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm',
          'transition-transform duration-150 group-active:scale-[0.97] group-focus-visible:ring-2 group-focus-visible:ring-indigo-500 group-focus-visible:ring-offset-2',
          ASPECT_CLASS[tile.size]
        )}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 md:group-hover:scale-105"
          />
        ) : (
          // No image for this category yet: gradient with the first letter
          <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white/80">
            {tile.category.charAt(0)}
          </span>
        )}
        <CountBadge count={tile.count} />
      </div>
      <span className="truncate px-1 text-base font-semibold leading-snug text-gray-900">{tile.category}</span>
    </button>
  );
}

export default function CategoryMosaic({ counts, totalCount, onSelect }: CategoryMosaicProps) {
  const columns = useMemo(() => buildMosaicColumns(assignTileSizes(counts)), [counts]);

  return (
    <div className="flex flex-col gap-4">
      {/* All Categories: full-width banner on top */}
      <button
        type="button"
        onClick={() => onSelect('all')}
        className="group flex min-h-[88px] w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-left text-white shadow-sm transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <BookOpen className="h-6 w-6" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-lg font-semibold leading-tight">All Categories</span>
          <span className="text-base text-white/80">{totalCount} characters</span>
        </span>
      </button>

      {/* Two-column mosaic */}
      <div className="grid grid-cols-2 items-start gap-3 sm:gap-4">
        {columns.map((column, index) => (
          <div key={index} className="flex min-w-0 flex-col gap-4">
            {column.map((tile) => (
              <MosaicTile key={tile.category} tile={tile} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
