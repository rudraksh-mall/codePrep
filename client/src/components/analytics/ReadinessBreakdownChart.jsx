import Card from '../ui/Card';
import { Brain } from 'lucide-react';

function CategoryCard({ category, solved, total, mastery }) {
  const color = mastery >= 70 ? 'text-green-500' : mastery >= 40 ? 'text-amber-500' : 'text-red-500';
  const barColor = mastery >= 70 ? 'bg-green-500' : mastery >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{category}</span>
        <span className={`text-lg font-bold ${color}`}>{mastery}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${mastery}%` }}
        />
      </div>
      <p className="text-xs text-surface-400 dark:text-surface-500">{solved} / {total} problems</p>
    </div>
  );
}

export default function ReadinessBreakdownChart({ data = [] }) {
  const hasData = data.some((d) => d.solved > 0);

  if (!hasData) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-primary-500" />
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Interview Readiness</h2>
        </div>
        <div className="flex items-center justify-center py-8 text-sm text-surface-400">
          Not enough data yet.
        </div>
      </Card>
    );
  }

  const categoriesWithData = data.filter((d) => d.total > 0);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary-500" />
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Interview Readiness</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {categoriesWithData.map((cat) => (
          <CategoryCard key={cat.category} {...cat} />
        ))}
      </div>
    </Card>
  );
}
