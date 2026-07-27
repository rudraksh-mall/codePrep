import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as aiApi from '../api/ai.api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loader';
import TopicProgressBar from '../components/progress/TopicProgressBar';
import HeatmapCalendar from '../components/progress/HeatmapCalendar';
import PlatformConnector from '../components/ai/PlatformConnector';
import { useSummary, useByTopic, useByDifficulty, useOverTime } from '../hooks/useAnalytics';
import DailyProblemWidget from '../components/ai/DailyProblemWidget';
import {
  Lock, Brain, AlertTriangle, CheckCircle, Flame, Target, Map, Bot, BookOpen,
  FileText, Rocket, Search, Hand, RefreshCw,
} from 'lucide-react';

function loadCompletedWeeks(roadmapId, weeks) {
  const completed = {};
  if (!roadmapId || !weeks) return completed;
  weeks.forEach((w) => {
    const val = localStorage.getItem(`roadmap_${roadmapId}_week_${w.weekNumber}`);
    if (val === 'true') completed[w.weekNumber] = true;
  });
  return completed;
}

function KpiCard({ label, value, icon, subtitle }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{label}</p>
          <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
          {subtitle && (
            <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function ReadinessCard({ score, strengths, focusAreas, locked, totalSolved, neededForUnlock }) {
  if (locked) {
    const unlockProgress = Math.min(100, (totalSolved / 20) * 100);
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Lock className="h-7 w-7 shrink-0 text-surface-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-surface-500 dark:text-surface-400">Interview Readiness</p>
            <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">
              {totalSolved === 0 ? 'Start solving problems to unlock.' : 'Solve more problems to unlock.'}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-2xs text-primary-600 dark:text-primary-400 font-medium">
              <span>{totalSolved} / 20 solved</span>
              {neededForUnlock > 0 && (
                <>
                  <span className="text-surface-400 dark:text-surface-500">•</span>
                  <span>{neededForUnlock} more needed</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
          <div className="h-full rounded-full bg-surface-300 dark:bg-surface-600 transition-all duration-500" style={{ width: `${unlockProgress}%` }} />
        </div>
      </Card>
    );
  }

  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  const barColor = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Brain className="h-7 w-7 shrink-0 text-primary-500" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-surface-500 dark:text-surface-400">Interview Readiness</p>
          <p className={`text-xl font-bold ${color}`}>{score}<span className="text-sm font-normal text-surface-400">/100</span></p>
          {strengths.length > 0 && (
            <div className="mt-2">
              <p className="text-2xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">Strengths</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {strengths.map((s) => (
                  <span key={s.topic} className="inline-flex items-center gap-0.5 rounded-full bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 text-2xs font-medium text-green-700 dark:text-green-300">
                    ✓ {s.topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          {focusAreas.length > 0 && (
            <div className="mt-1.5">
              <p className="text-2xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">Focus Areas</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {focusAreas.map((f) => (
                  <span key={f.topic} className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-2xs font-medium text-amber-700 dark:text-amber-300">
                    ⚠ {f.topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </Card>
  );
}

function TopicFocusRow({ topic, solved, total }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  const needsFocus = total > 0 && (solved === 0 || pct < 30);

  return (
    <div className={`rounded-lg border px-3 py-2 ${needsFocus ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {needsFocus && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">{topic}</span>
        </div>
        <span className="text-2xs text-surface-500 dark:text-surface-400 shrink-0 ml-2">{solved}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${needsFocus ? 'bg-amber-500' : 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: topics = [], isLoading: topicsLoading } = useByTopic();
  const { data: difficultyData = [] } = useByDifficulty();
  const { data: heatmapData = [] } = useOverTime(365);
  const { data: roadmap } = useQuery({
    queryKey: ['roadmap'],
    queryFn: aiApi.getRoadmap,
    staleTime: 300000,
  });

  const completedWeeks = useMemo(() => roadmap ? loadCompletedWeeks(roadmap._id, roadmap.weeks) : {}, [roadmap]);
  const totalWeeks = roadmap?.weeks?.length || 0;
  const completedWeekCount = roadmap?.weeks?.filter((w) => completedWeeks[w.weekNumber]).length || 0;
  const roadmapProgressPct = totalWeeks > 0 ? Math.round((completedWeekCount / totalWeeks) * 100) : 0;
  const currentWeek = roadmap?.weeks?.find((w) => !completedWeeks[w.weekNumber]);

  const computed = useMemo(() => {
    const totalSolved = summary?.totalSolved ?? 0;
    const totalAttempted = summary?.totalAttempted ?? 0;
    const currentStreak = summary?.currentStreak ?? 0;
    const longestStreak = summary?.longestStreak ?? 0;
    const accuracy = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;
    const hasActivity = totalSolved > 0 || totalAttempted > 0;
    const userName = user?.name || 'Learner';
    const firstLetter = userName.charAt(0).toUpperCase();

    const difficultiesCovered = difficultyData.filter((d) => d.solved > 0).length;
    const topicsWithSolved = topics.filter((t) => t.solved > 0).length;
    const totalTopicCount = topics.length || 1;

    // Minimum activity threshold before readiness analysis is enabled
    const readinessThresholdBase = 20;
    const readinessThresholdAlternative = totalSolved >= 15 && topicsWithSolved >= 3;
    const readinessEnabled = totalSolved >= readinessThresholdBase || readinessThresholdAlternative;
    const neededForUnlock = Math.max(0, 20 - totalSolved);

    // Only compute readiness score and strengths/focus areas when threshold is met
    const scoreSolved = Math.min(totalSolved, 100) / 100 * 25;
    const scoreTopics = (topicsWithSolved / Math.max(totalTopicCount, 1)) * 30;
    const scoreDifficulty = (difficultiesCovered / 3) * 20;
    const scoreStreak = Math.min(currentStreak, 30) / 30 * 25;
    const readinessScore = readinessEnabled
      ? Math.round(Math.min(100, scoreSolved + scoreTopics + scoreDifficulty + scoreStreak))
      : null;

    const strengths = readinessEnabled
      ? topics.filter((t) => t.total > 0 && (t.solved / t.total) >= 0.5).slice(0, 3)
      : [];
    const focusAreas = readinessEnabled
      ? topics.filter((t) => t.total > 0 && (t.solved === 0 || (t.solved / t.total) < 0.3)).slice(0, 3)
      : [];

    const sortedByRatio = [...topics].sort((a, b) => {
      const aPct = a.total > 0 ? a.solved / a.total : 1;
      const bPct = b.total > 0 ? b.solved / b.total : 1;
      return aPct - bPct;
    });

    const unexploredTopics = topics.filter((t) => t.solved === 0).map((t) => t.topic);

    // Suggest an unexplored topic when below threshold, otherwise the lowest-ratio topic
    const suggestedTopic = readinessEnabled
      ? (sortedByRatio[0]?.topic || null)
      : (unexploredTopics[0] || null);

    let motivation = '';
    if (!hasActivity) {
      motivation = 'Start your learning journey today!';
    } else if (currentStreak >= 5) {
      motivation = `You're on a ${currentStreak}-day streak. Keep building consistency!`;
    } else if (totalSolved >= 100) {
      motivation = `Incredible! ${totalSolved} problems solved. You're on fire!`;
    } else if (totalSolved >= 50) {
      motivation = `Great progress! ${totalSolved} problems solved and counting.`;
    } else if (totalSolved >= 10) {
      motivation = `You've solved ${totalSolved} problems. Keep pushing forward!`;
    } else {
      motivation = 'Every problem solved is a step closer to your goal!';
    }

    return {
      totalSolved, totalAttempted, currentStreak, longestStreak, accuracy, hasActivity,
      userName, firstLetter, readinessEnabled, neededForUnlock, readinessScore,
      strengths, focusAreas, sortedByRatio, unexploredTopics, suggestedTopic, motivation,
    };
  }, [summary, topics, difficultyData, user]);

  if (summaryLoading) return <PageLoader />;

  const {
    totalSolved, totalAttempted, currentStreak, longestStreak, accuracy, hasActivity,
    userName, firstLetter, readinessEnabled, neededForUnlock, readinessScore,
    strengths, focusAreas, sortedByRatio, unexploredTopics, suggestedTopic, motivation,
  } = computed;

  return (
    <div className="space-y-6">
      <DailyProblemWidget />
      {/* Welcome Section */}
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-lg font-bold shrink-0">
            {firstLetter}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Welcome back, {userName}
              <Hand className="ml-1 h-6 w-6 inline text-amber-400" />
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{motivation}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {totalSolved > 0 && (
                <span className="inline-flex items-center gap-1 text-2xs text-surface-400 dark:text-surface-500">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  {totalSolved} solved
                </span>
              )}
              {currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-2xs text-surface-400 dark:text-surface-500">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  {currentStreak} day streak
                </span>
              )}
              {roadmap?.targetRole && (
                <span className="inline-flex items-center gap-1 text-2xs text-surface-400 dark:text-surface-500">
                  <Target className="h-3.5 w-3.5 text-primary-500" />
                  {roadmap.targetRole}
                </span>
              )}
              {roadmap && totalWeeks > 0 && (
                <span className="inline-flex items-center gap-1 text-2xs text-surface-400 dark:text-surface-500">
                  <Map className="h-3.5 w-3.5 text-primary-500" />
                  {roadmapProgressPct}% complete
                </span>
              )}
            </div>
          </div>
          {currentStreak > 0 && (
            <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5">
              <Flame className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{currentStreak} day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Solved" value={totalSolved} icon={<CheckCircle className="h-5 w-5 text-green-500" />} />
        <KpiCard label="Attempted" value={totalAttempted} icon={<RefreshCw className="h-5 w-5 text-blue-500" />} />
        <KpiCard label="Accuracy" value={hasActivity ? `${accuracy}%` : '—'} icon={<Target className="h-5 w-5 text-primary-500" />} subtitle={hasActivity ? `${totalSolved} / ${totalAttempted}` : undefined} />
        <KpiCard label="Current Streak" value={`${currentStreak}d`} icon={<Flame className="h-5 w-5 text-amber-500" />} subtitle={`Longest: ${longestStreak}d`} />
        <ReadinessCard
          score={readinessScore}
          strengths={strengths}
          focusAreas={focusAreas}
          locked={!readinessEnabled}
          totalSolved={totalSolved}
          neededForUnlock={neededForUnlock}
        />
      </div>

      {/* Main Content: 2/3 + 1/3 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Roadmap Widget */}
          {roadmap ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Roadmap</p>
                  <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100 mt-1 truncate">
                    {roadmap.targetRole}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-2xs text-surface-400 dark:text-surface-500">{roadmap.duration} days</span>
                    <span className="text-2xs text-surface-400 dark:text-surface-500">•</span>
                    <span className="text-2xs text-surface-400 dark:text-surface-500 capitalize">{roadmap.currentLevel}</span>
                    <span className="text-2xs text-surface-400 dark:text-surface-500">•</span>
                    <span className="text-2xs font-medium text-primary-600 dark:text-primary-400">{completedWeekCount} / {totalWeeks} weeks</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden max-w-xs">
                      <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${roadmapProgressPct}%` }} />
                    </div>
                    <span className="text-xs font-medium text-surface-600 dark:text-surface-400">{roadmapProgressPct}%</span>
                  </div>
                  {currentWeek && (
                    <div className="mt-3">
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        Current focus:{' '}
                        <span className="font-medium text-surface-700 dark:text-surface-300">
                          {currentWeek.topics?.[0] || currentWeek.theme}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                <Link to="/roadmap">
                  <Button size="sm">Continue Roadmap →</Button>
                </Link>
              </div>
              {roadmap.weakTopics?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                  <span className="text-2xs text-surface-400 font-medium mr-0.5 self-center">Focus areas:</span>
                  {roadmap.weakTopics.map((t) => (
                    <span key={t} className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-2xs font-medium text-amber-700 dark:text-amber-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 shrink-0">
                  <Map className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">No roadmap yet</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">Generate a personalized study plan to guide your learning.</p>
                  <Link to="/roadmap" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                    Generate your first roadmap →
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* AI Recommendations */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-primary-500" />
              <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">AI Recommendations</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestedTopic && (
                <Link
                  to={`/problems?topics=${encodeURIComponent(suggestedTopic)}`}
                  className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition"
                >
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    {readinessEnabled ? 'Suggested Topic' : 'Try This Topic'}
                  </p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mt-0.5">
                    {readinessEnabled
                      ? <>Focus on <span className="text-primary-600 dark:text-primary-400">{suggestedTopic}</span></>
                      : <><span className="text-primary-600 dark:text-primary-400">{suggestedTopic}</span> — get started</>
                    }
                  </p>
                  <p className="text-2xs text-surface-500 dark:text-surface-400 mt-1">Practice problems in this area →</p>
                </Link>
              )}
              {currentWeek && (
                <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3">
                  <p className="text-xs text-surface-400 dark:text-surface-500">Roadmap Task</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mt-0.5">
                    Week {currentWeek.weekNumber}: {currentWeek.theme}
                  </p>
                  <p className="text-2xs text-surface-500 dark:text-surface-400 mt-1">{currentWeek.topics?.join(', ')}</p>
                </div>
              )}
              {!suggestedTopic && !currentWeek && hasActivity && (
                <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 col-span-2">
                  <p className="text-sm text-surface-500 dark:text-surface-400">Keep solving problems across different topics to get personalized recommendations.</p>
                </div>
              )}
              {!hasActivity && (
                <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 col-span-2">
                  <p className="text-sm text-surface-500 dark:text-surface-400">Solve your first problem to unlock AI-powered recommendations.</p>
                  <Link to="/problems" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                    Browse Problems →
                  </Link>
                </div>
              )}
              {hasActivity && !readinessEnabled && suggestedTopic && (
                <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 col-span-2">
                  <p className="text-xs text-surface-400 dark:text-surface-500">Keep practicing to receive personalized AI insights.</p>
                  <p className="text-2xs text-surface-500 dark:text-surface-400 mt-0.5">
                    Readiness analysis unlocks after solving more problems ({totalSolved}/20).
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Continue Learning */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary-500" />
              <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Continue Learning</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestedTopic && (
                <Link
                  to={`/problems?topics=${encodeURIComponent(suggestedTopic)}`}
                  className="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary-100 dark:bg-primary-900/40 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-surface-900 dark:text-surface-100 truncate">
                      {readinessEnabled ? `Practice ${suggestedTopic}` : `Try ${suggestedTopic}`}
                    </p>
                    <p className="text-2xs text-surface-500 dark:text-surface-400">
                      {readinessEnabled ? 'Solve problems to strengthen this topic' : 'Start exploring this topic'}
                    </p>
                  </div>
                </Link>
              )}
              {roadmap ? (
                <Link
                  to="/roadmap"
                  className="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 shrink-0">
                    <Map className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-surface-900 dark:text-surface-100 truncate">
                      {currentWeek ? `Week ${currentWeek.weekNumber}: ${currentWeek.theme}` : 'Roadmap Complete!'}
                    </p>
                    <p className="text-2xs text-surface-500 dark:text-surface-400">
                      {currentWeek ? `${completedWeekCount}/${totalWeeks} weeks done` : 'Great job!'}
                    </p>
                  </div>
                </Link>
              ) : (
                <Link
                  to="/roadmap"
                  className="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-surface-100 dark:bg-surface-800 shrink-0">
                    <Map className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-surface-900 dark:text-surface-100">Create a Roadmap</p>
                    <p className="text-2xs text-surface-500 dark:text-surface-400">Get a personalized study plan</p>
                  </div>
                </Link>
              )}
              {!hasActivity && (
                <Link
                  to="/problems"
                  className="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/40 shrink-0">
                    <Rocket className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-surface-900 dark:text-surface-100">Start with Easy Problems</p>
                    <p className="text-2xs text-surface-500 dark:text-surface-400">Build confidence from the basics</p>
                  </div>
                </Link>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Focus Areas / Topics Not Yet Explored */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              {readinessEnabled ? <AlertTriangle className="h-5 w-5 text-amber-500" /> : <Search className="h-5 w-5 text-primary-500" />}
              <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                {readinessEnabled ? 'Focus Areas' : 'Topics Not Yet Explored'}
              </h2>
            </div>
            {!hasActivity ? (
              <div className="text-center py-6">
                <p className="text-sm text-surface-500 dark:text-surface-400">No problems solved yet.</p>
                <Link to="/problems" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                  Start with beginner-friendly problems →
                </Link>
              </div>
            ) : topicsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-1">
                    <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-16" />
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full" />
                  </div>
                ))}
              </div>
            ) : !readinessEnabled ? (
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
                  Explore these topics to strengthen your foundation.
                </p>
                {unexploredTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {unexploredTopics.slice(0, 8).map((topic) => (
                      <Link
                        key={topic}
                        to={`/problems?topics=${encodeURIComponent(topic)}`}
                        className="rounded-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1 text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 hover:border-primary-300 dark:hover:border-primary-700 transition"
                      >
                        {topic}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-3">
                    You have explored all available topics. Keep practicing!
                  </p>
                )}
              </div>
            ) : sortedByRatio.length === 0 ? (
              <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">
                No topic data available yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedByRatio.slice(0, 5).map((t) => (
                  <TopicFocusRow key={t.topic} topic={t.topic} solved={t.solved} total={t.total} />
                ))}
              </div>
            )}
          </Card>


        </div>
      </div>

      {/* Activity Heatmap */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">
          Activity
        </h2>
        <HeatmapCalendar data={heatmapData} days={365} />
      </Card>

      {/* Progress by Topic */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">
          Progress by Topic
        </h2>
        {!hasActivity ? (
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">
            Start solving problems to see your progress by topic.
          </p>
        ) : topicsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-20 mb-2" />
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-6">
            No progress yet. Start solving problems!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {topics.map((t) => (
              <TopicProgressBar
                key={t.topic}
                topic={t.topic}
                solved={t.solved}
                total={t.total}
              />
            ))}
          </div>
        )}
      </Card>

      <PlatformConnector />
    </div>
  );
}
