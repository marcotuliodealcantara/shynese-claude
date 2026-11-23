// Loaded lazily (React.lazy in HomeStats): it pulls in Recharts, which is ~110 KB gzipped,
// so keeping it in its own chunk keeps the app's main bundle small.
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { GrowthPoint } from '@/lib/stats';

const chartConfig = {
  total: { label: 'Words', color: '#4f46e5' }, // indigo-600 (validated: contrast & lightness)
} satisfies ChartConfig;

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function VocabularyGrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="vocab-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-total)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-total)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-gray-200" />
        <XAxis dataKey="date" hide />
        <ChartTooltip
          cursor={{ stroke: '#9ca3af', strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) => longDate(String(payload?.[0]?.payload?.date ?? ''))}
            />
          }
        />
        <Area
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          strokeWidth={2}
          fill="url(#vocab-fill)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
