import { lazy, Suspense, useMemo } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Character } from '@/lib/storage';
import {
  buildVocabularyGrowth,
  computeStreaks,
  countReviewedLast7Days,
  countSessionsLast7Days,
  hasRecentNewWords,
} from '@/lib/stats';

// Recharts lives in its own chunk, fetched only when the chart renders.
const VocabularyGrowthChart = lazy(() => import('./VocabularyGrowthChart'));

interface HomeStatsProps {
  characters: Character[];
  sessionDates: Date[];
}

// One row of 3 on every screen, thin vertical lines between the stats.
// Labels are 14px (below the mobile-first 16px minimum) so each stays on one line on phones (user request).

interface StatProps {
  value: number;
  label: string;
  hint: string;
  icon?: React.ReactNode;
  className?: string;
}

function Stat({ value, label, hint, icon, className }: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col items-center gap-0.5 px-1 py-3 text-center sm:py-4', className)}>
      <div className="flex items-center gap-0.5 text-2xl font-bold leading-tight text-gray-900 tabular-nums sm:text-3xl">
        {icon}
        {value}
      </div>
      <div className="w-full truncate whitespace-nowrap text-sm font-medium text-gray-700 sm:text-base">{label}</div>
      <div className="w-full truncate whitespace-nowrap text-sm text-gray-500 sm:text-base">{hint}</div>
    </div>
  );
}

export default function HomeStats({ characters, sessionDates }: HomeStatsProps) {
  const streaks = useMemo(() => computeStreaks(sessionDates), [sessionDates]);
  const sessions7d = useMemo(() => countSessionsLast7Days(sessionDates), [sessionDates]);
  const reviewed7d = useMemo(() => countReviewedLast7Days(characters), [characters]);
  // Hide the growth chart when no word was added in the last 30 days (it would be a flat line)
  const growth = useMemo(
    () => (hasRecentNewWords(characters, 30) ? buildVocabularyGrowth(characters) : []),
    [characters]
  );

  const stats: StatProps[] = [
    {
      value: streaks.current,
      label: 'Day streak',
      hint: `Best: ${streaks.longest}`,
      icon: streaks.current > 0 ? <Flame className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6" aria-hidden /> : undefined,
    },
    { value: sessions7d, label: 'Sessions', hint: 'last 7 days' },
    { value: reviewed7d, label: 'Reviewed', hint: 'last 7 days' },
  ];

  return (
    <section className="flex flex-col gap-4" aria-label="Your progress">
      <div className="grid grid-cols-3 divide-x divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {stats.map((stat) => (
          <Stat key={stat.label} {...stat} />
        ))}
      </div>

      {growth.length > 1 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-2 pb-3 pt-4">
          <h2 className="px-2 text-base font-semibold text-gray-900">Vocabulary growth</h2>
          <div className="mt-2" role="img" aria-label={`Vocabulary growth chart: ${characters.length} words`}>
            {/* Placeholder keeps the card height stable while the chart chunk loads */}
            <Suspense fallback={<div className="h-40 w-full animate-pulse rounded-lg bg-gray-100" />}>
              <VocabularyGrowthChart data={growth} />
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
}
