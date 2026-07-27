import Card from '../ui/Card';
import { Trophy, Target, Flame, BarChart3, TrendingUp, Star } from 'lucide-react';

function StatBox({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4">
      <div className="flex items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{label}</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function ConsistencyMetrics({ data }) {
  if (!data) return null;

  const items = [];

  items.push({
    label: 'Longest Streak',
    value: `${data.longestStreak} day${data.longestStreak !== 1 ? 's' : ''}`,
    icon: <Trophy className="h-6 w-6 text-amber-500" />,
  });

  if (data.longestDailyStreak > 0) {
    items.push({
      label: 'Longest Daily Streak',
      value: `${data.longestDailyStreak} day${data.longestDailyStreak !== 1 ? 's' : ''}`,
      icon: <Target className="h-6 w-6 text-primary-500" />,
    });
    items.push({
      label: 'Current Daily Streak',
      value: `${data.currentDailyStreak} day${data.currentDailyStreak !== 1 ? 's' : ''}`,
      icon: <Flame className="h-6 w-6 text-amber-500" />,
    });
  }

  if (data.averageSolvesPerDay > 0) {
    items.push({
      label: 'Avg Solves / Day',
      value: data.averageSolvesPerDay,
      icon: <BarChart3 className="h-6 w-6 text-blue-500" />,
    });
    items.push({
      label: 'Avg Solves / Week',
      value: data.averageSolvesPerWeek,
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
    });
  }

  if (data.bestSolvingDay) {
    items.push({
      label: 'Best Day',
      value: `${data.bestSolvingDay.count} on ${data.bestSolvingDay.date}`,
      icon: <Star className="h-6 w-6 text-yellow-500" />,
    });
  }

  if (data.bestSolvingWeek) {
    items.push({
      label: 'Best Week',
      value: `${data.bestSolvingWeek.count} (W${data.bestSolvingWeek.week} ${data.bestSolvingWeek.year})`,
      icon: <Flame className="h-6 w-6 text-amber-500" />,
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-surface-400">
        No consistency data yet
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <StatBox key={item.label} {...item} />
      ))}
    </div>
  );
}
