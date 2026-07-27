import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDailyProblem } from '../../hooks/useDailyProblem';
import { useProgress } from '../../hooks/useProgress';
import Card from '../ui/Card';
import Button from '../ui/Button';
import DifficultyBadge from '../problems/DifficultyBadge';
import { CheckCircle, Calendar, Lightbulb } from 'lucide-react';

function todayString() {
  const d = new Date();
  return d.toLocaleDateString('en-CA');
}

function formatDate() {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function DailyProblemWidget() {
  const today = todayString();

  const skipped = useMemo(() => sessionStorage.getItem('skippedDaily') === today, [today]);
  if (skipped) return null;

  return <DailyProblemWidgetInner today={today} />;
}

function DailyProblemWidgetInner({ today }) {
  const { data: problem, isLoading, isError, refetch } = useDailyProblem();
  const { data: progressData } = useProgress();

  const isSolved = useMemo(() => {
    if (!problem || !progressData) return false;
    return progressData.some(
      (p) => p.problemId?.slug === problem.problemSlug && p.status === 'solved'
    );
  }, [problem, progressData]);

  if (isError) {
    return (
      <Card className="p-5 mx-auto max-w-[700px]">
        <div className="text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Couldn't load today's problem. Try refreshing.
          </p>
          <Button size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading || !problem) {
    return (
      <Card className="p-5 mx-auto max-w-[700px]">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-32" />
            <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-20" />
          </div>
          <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-3/4" />
          <div className="flex gap-2">
            <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-16" />
            <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-20" />
          </div>
          <div className="h-12 bg-surface-200 dark:bg-surface-700 rounded" />
          <div className="flex gap-2">
            <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-24" />
            <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-20" />
          </div>
        </div>
        <p className="text-xs text-surface-400 dark:text-surface-500 text-center mt-3">
          Picking your problem for today...
        </p>
      </Card>
    );
  }

  const { problemTitle, problemSlug, difficulty, topics, sourceUrl, weakestTopic, reason } = problem;

  if (isSolved) {
    return (
      <Card className="p-5 mx-auto max-w-[700px] border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-6 w-6 shrink-0 mt-0.5 text-green-500" />
          <div>
            <Link
              to={`/problems/${problemSlug}`}
              className="text-lg font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              {problemTitle}
            </Link>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              You solved this one! Great work today.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 mx-auto max-w-[700px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-500" />
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">
              Problem of the day
            </span>
          </div>
          <span className="text-xs text-surface-400 dark:text-surface-500">{formatDate()}</span>
        </div>

        <Link
          to={`/problems/${problemSlug}`}
          className="block text-lg font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600 dark:hover:text-primary-400 transition"
        >
          {problemTitle}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={difficulty} />
          {topics?.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-100 dark:bg-surface-800 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
            >
              {t}
            </span>
          ))}
        </div>

        {reason && (
          <div className="rounded-lg bg-surface-100 dark:bg-surface-800 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
                {reason}
              </p>
            </div>
          </div>
        )}

        {weakestTopic && (
          <p className="text-xs text-surface-400 dark:text-surface-500">
            Focusing on <span className="font-medium text-surface-600 dark:text-surface-300">{weakestTopic}</span> — your solve rate here is below average.
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Link to={`/problems/${problemSlug}`}>
            <Button size="sm">Solve now</Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              sessionStorage.setItem('skippedDaily', today);
              window.location.reload();
            }}
          >
            Skip today
          </Button>
        </div>
      </div>
    </Card>
  );
}
