import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useProblem from '../hooks/useProblem';
import DifficultyBadge from '../components/problems/DifficultyBadge';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Loader';
import { useToast } from '../components/ui/Toast';
import HintPanel from '../components/ai/HintPanel';
import * as noteApi from '../api/note.api';
import * as progressApi from '../api/progress.api';

function ExampleCard({ example, index }) {
  return (
    <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-4 space-y-2">
      <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase">Example {index + 1}</p>
      <div>
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Input:</p>
        <pre className="rounded bg-surface-200 dark:bg-surface-700 px-3 py-2 text-sm font-mono text-surface-900 dark:text-surface-100 overflow-x-auto">{example.input}</pre>
      </div>
      <div>
        <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Output:</p>
        <pre className="rounded bg-surface-200 dark:bg-surface-700 px-3 py-2 text-sm font-mono text-surface-900 dark:text-surface-100 overflow-x-auto">{example.output}</pre>
      </div>
      {example.explanation && (
        <div>
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Explanation:</p>
          <p className="text-sm text-surface-700 dark:text-surface-300">{example.explanation}</p>
        </div>
      )}
    </div>
  );
}

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const { data: problem, isLoading } = useProblem(slug);
  const queryClient = useQueryClient();
  const showToast = useToast();

  const [progress, setProgress] = useState(null);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [hintsUsed, setHintsUsed] = useState(0);
  const debounceRef = useRef(null);
  const pageEntryTime = useRef(Date.now());

  const problemId = problem?._id;

  const { data: savedProgress } = useQuery({
    queryKey: ['progress', problemId],
    queryFn: () => progressApi.getProgressForProblem(problemId),
    enabled: Boolean(problemId),
    staleTime: 300000,
  });

  useEffect(() => {
    if (savedProgress) setProgress(savedProgress.status);
  }, [savedProgress]);

  const progressMutation = useMutation({
    mutationFn: (status) => {
      const timeSpentMinutes = Math.round((Date.now() - pageEntryTime.current) / 60000);
      return progressApi.upsertProgress(problemId, status, { hintsUsed, timeSpentMinutes });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['progress', problemId] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      if (data?.isDailyComplete) {
        showToast({ type: 'success', title: 'Daily problem complete!', message: 'Streak maintained' });
      }
    },
  });

  const { data: noteData } = useQuery({
    queryKey: ['note', problemId],
    queryFn: () => noteApi.getNote(problemId),
    enabled: Boolean(problemId),
    staleTime: 300000,
  });

  useEffect(() => {
    if (!problemId) return;
    setNotes(noteData?.content || '');
    setSaveStatus('idle');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [problemId, noteData]);

  const saveMutation = useMutation({
    mutationFn: () => noteApi.upsertNote(problemId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', problemId] });
      setSaveStatus('saved');
    },
    onError: () => setSaveStatus('error'),
  });

  const handleBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate();
    }, 1000);
  }, [problemId, notes, saveMutation]);

  const handleFocus = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (isLoading) return <PageLoader />;
  if (!problem) return null;

  const examples = problem.examples || [];
  const constraints = problem.constraints || '';

  return (
    <div className="min-h-[calc(100vh-10rem)]">
      <Link
        to="/problems"
        className="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
        Back to problems
      </Link>

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-3">{problem.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.topics?.map((topic) => (
              <span key={topic} className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/40 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                {topic}
              </span>
            ))}
          </div>
          {problem.companies?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">Companies:</span>
              {problem.companies.map((c) => (
                <span key={c} className="inline-flex items-center rounded-md bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.description}
          </ReactMarkdown>
        </div>

        {examples.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Examples</h2>
            {examples.map((ex, i) => (
              <ExampleCard key={i} example={ex} index={i} />
            ))}
          </div>
        )}

        {constraints && (
          <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">Constraints</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {constraints}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">Progress</h3>
          <div className="flex gap-2">
            <Button
              variant={progress === 'solved' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                const next = progress === 'solved' ? 'unsolved' : 'solved';
                setProgress(next);
                progressMutation.mutate(next);
              }}
            >
              Solved
            </Button>
            <Button
              variant={progress === 'attempted' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                const next = progress === 'attempted' ? 'unsolved' : 'attempted';
                setProgress(next);
                progressMutation.mutate(next);
              }}
            >
              Attempted
            </Button>
          </div>
          {problem.sourceUrl && (
            <button
              onClick={() => {
                window.open(problem.sourceUrl, '_blank', 'noopener');
                if (progress !== 'solved') {
                  setProgress('attempted');
                  progressMutation.mutate('attempted');
                }
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Solve on {problem.sourceLabel || "Platform"}
            </button>
          )}
        </div>

        <HintPanel problemTitle={problem.title} problemDescription={problem.description} onHintUsed={() => setHintsUsed((c) => c + 1)} />

        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Notes</h3>
            <span className={`text-xs transition-opacity ${
              saveStatus === 'saved'
                ? 'text-green-500'
                : saveStatus === 'saving'
                  ? 'text-yellow-500'
                  : saveStatus === 'error'
                    ? 'text-red-500'
                    : 'opacity-0'
            }`}>
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'error' && 'Save failed'}
            </span>
          </div>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder="Write your notes here..."
            className="block w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
