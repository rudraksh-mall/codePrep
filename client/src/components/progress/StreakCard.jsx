import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDailyProblem } from '../../hooks/useDailyProblem';
import { useProgress } from '../../hooks/useProgress';
import { Target } from 'lucide-react';

export default function StreakCard({ dailyCurrent, dailyLongest }) {
  const { data: dailyProblem, isLoading: dailyLoading } = useDailyProblem();
  const { data: progressData } = useProgress();

  const isSolved = useMemo(() => {
    if (!dailyProblem?.problemSlug || !progressData) return false;
    return progressData.some(
      (p) => p.problemId?.slug === dailyProblem.problemSlug && p.status === 'solved'
    );
  }, [dailyProblem, progressData]);

  return (
    <div className="rounded-xl border bg-white dark:bg-surface-900 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Target className="h-8 w-8 text-primary-500" />
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400">Daily Problem Streak</p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            {dailyCurrent}
            <span className="text-sm font-normal text-surface-400 ml-1">days</span>
          </p>
          <p className="text-xs text-surface-400 mt-1">
            Longest: {dailyLongest} day{dailyLongest !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-surface-200 dark:border-surface-700">
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
          Today's Goal
        </p>
        {dailyLoading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-4 w-4 rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
          </div>
        ) : dailyProblem ? (
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center h-4 w-4 rounded border text-xs transition ${
                isSolved
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-surface-300 dark:border-surface-600'
              }`}
            >
              {isSolved && '✓'}
            </span>
            <Link
              to={`/problems/${dailyProblem.problemSlug}`}
              className="text-sm font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 transition truncate"
            >
              {dailyProblem.problemTitle}
            </Link>
          </div>
        ) : (
          <p className="text-xs text-surface-400 dark:text-surface-500">No daily problem set</p>
        )}
      </div>
    </div>
  );
}
