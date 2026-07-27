import Card from '../ui/Card';
import { Clock } from 'lucide-react';

function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return `${hours}h ${remaining}m`;
}

export default function TimeInvestmentCard({ data }) {
  if (!data) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary-500" />
          <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Time Investment</h2>
        </div>
        <div className="flex items-center justify-center py-8 text-sm text-surface-400">
          Not enough data yet.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary-500" />
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Time Investment</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3">
          <p className="text-xs text-surface-500 dark:text-surface-400">Total Coding Time</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{formatMinutes(data.totalMinutes)}</p>
        </div>
        <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3">
          <p className="text-xs text-surface-500 dark:text-surface-400">Avg Session</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{formatMinutes(data.averageSessionMinutes)}</p>
        </div>
        <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3">
          <p className="text-xs text-surface-500 dark:text-surface-400">Longest Session</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{formatMinutes(data.longestSessionMinutes)}</p>
        </div>
        <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3">
          <p className="text-xs text-surface-500 dark:text-surface-400">Total Sessions</p>
          <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{data.sessionCount}</p>
        </div>
      </div>

      {data.byTopic?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2 uppercase tracking-wider">
            Time by Topic
          </p>
          <div className="space-y-1.5">
            {data.byTopic.slice(0, 8).map((t) => (
              <div key={t.topic} className="flex items-center justify-between text-sm">
                <span className="text-surface-700 dark:text-surface-300">{t.topic}</span>
                <span className="text-surface-500 dark:text-surface-400">{formatMinutes(t.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
