import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as aiApi from '../api/ai.api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Spinner } from '../components/ui/Loader';
import { useStartInterview, useAnswerInterview, useEndInterview } from '../hooks/useInterview';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechToText } from '../hooks/useSpeechToText';
import {
  CheckCircle, Bot, User, Mic, VolumeX, Volume2, RefreshCw, Square, Circle, AlertTriangle,
} from 'lucide-react';

const INTERVIEW_TYPES = [
  { value: 'DSA', label: 'DSA', desc: 'Data structures, algorithms & complexity' },
  { value: 'Resume-Based', label: 'Resume-Based', desc: 'Based on your skills and experience', needsResume: true },
  { value: 'Behavioral', label: 'Behavioral', desc: 'Soft skills, teamwork & leadership' },
  { value: 'Mixed', label: 'Mixed', desc: 'Combination of all question types' },
];

const DURATIONS = [
  { value: 15, label: '15 Minutes', desc: '~3 questions' },
  { value: 30, label: '30 Minutes', desc: '~5 questions' },
  { value: 45, label: '45 Minutes', desc: '~7 questions' },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';
  return <span className={`text-lg font-bold ${color}`}>{score}<span className="text-sm font-normal text-surface-400">/100</span></span>;
}

function SetupScreen({ onStart }) {
  const [type, setType] = useState('DSA');
  const [duration, setDuration] = useState(15);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: resumeData } = useQuery({
    queryKey: ['mock-resume-latest'],
    queryFn: aiApi.getLatestMockResume,
    staleTime: 60000,
  });

  const hasResume = !!resumeData?.resumeId;
  const resumeFileName = resumeData?.fileName;
  const selectedType = INTERVIEW_TYPES.find((t) => t.value === type);
  const resumeDisabled = selectedType?.needsResume && !hasResume;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    try {
      await aiApi.uploadMockResume(file, (pct) => setUploadProgress(pct));
      queryClient.invalidateQueries({ queryKey: ['mock-resume-latest'] });
    } catch {
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Mock Interview</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Practice technical interviews with an AI interviewer. Speak naturally using your voice.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">Interview Type</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTERVIEW_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`rounded-lg border p-4 text-left transition ${
                type === t.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600'
              }`}
            >
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{t.label}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{t.desc}</p>
              {t.needsResume && (
                <p className="text-2xs text-amber-500 mt-1">Upload a resume below</p>
              )}
            </button>
          ))}
        </div>

        {(type === 'Resume-Based' || type === 'Mixed') && (
          <div className="mt-4">
            {!uploading && (
              <div className="rounded-lg border-2 border-dashed border-surface-300 dark:border-surface-600 p-4 text-center">
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">
                  {hasResume ? 'Upload a new resume or keep the current one' : 'Upload your resume to enable Resume-Based interviews'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload">
                  <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.293 1.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 4.414V13a1 1 0 11-2 0V4.414L6.707 6.707a1 1 0 01-1.414-1.414l4-4z" />
                      <path d="M3 14a1 1 0 011 1v2a1 1 0 001 1h10a1 1 0 001-1v-2a1 1 0 112 0v2a3 3 0 01-3 3H5a3 3 0 01-3-3v-2a1 1 0 011-1z" />
                    </svg>
                    {hasResume ? 'Upload New Resume' : 'Upload PDF Resume'}
                  </span>
                </label>
                {uploadError && (
                  <p className="text-xs text-red-500 mt-2">{uploadError}</p>
                )}
              </div>
            )}

            {uploading && (
              <div>
                <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-2">
                  <Spinner size="sm" />
                  Uploading{uploadProgress > 0 ? ` — ${uploadProgress}%` : '...'}
                </div>
                <div className="h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {hasResume && !uploading && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300 truncate flex-1">
                  Current resume: {resumeFileName || 'Uploaded'}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">Duration</h2>
        <div className="flex gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`flex-1 rounded-lg border p-4 text-center transition ${
                duration === d.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600'
              }`}
            >
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{d.label}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="text-center">
        <Button onClick={() => onStart(type, duration)} disabled={resumeDisabled} className="px-8">
          Start Interview
        </Button>
        {resumeDisabled && (
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
            Upload your resume above to use Resume-Based interviews.
          </p>
        )}
      </div>
    </div>
  );
}

function ChatMessage({ role, message }) {
  const isAi = role === 'interviewer';
  return (
    <div className={`flex gap-3 ${isAi ? '' : 'flex-row-reverse'}`}>
      <div className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 text-sm ${
        isAi
          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
          : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
      }`}>
        {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] ${isAi ? '' : 'text-right'}`}>
        <p className={`text-xs font-medium mb-0.5 ${
          isAi ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 dark:text-surface-400'
        }`}>
          {isAi ? 'Interviewer' : 'You'}
        </p>
        <div className={`rounded-xl px-4 py-2.5 text-sm ${
          isAi
            ? 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200'
            : 'bg-primary-500 text-white'
        }`}>
          {message}
        </div>
      </div>
    </div>
  );
}

function InterviewScreen({ conversation, onSendAnswer, loading, timerSeconds, muted, onToggleMute, onReplay, isSpeaking, onStopSpeaking, hasMoreQuestions, onEndInterview, ending }) {
  const {
    isListening, transcript, interimTranscript, supported: sttSupported,
    startListening, stopListening, getTranscript,
  } = useSpeechToText();

  const [hasSpoken, setHasSpoken] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
      const finalAnswer = getTranscript();
      if (finalAnswer && !loading) {
        setHasSpoken(true);
        onSendAnswer(finalAnswer);
      }
    } else {
      startListening();
    }
  }, [isListening, stopListening, getTranscript, startListening, loading, onSendAnswer]);

  const timerColor = timerSeconds <= 60 ? 'text-red-500' : timerSeconds <= 180 ? 'text-amber-500' : 'text-surface-400';

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary-500" />
          <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">Live Interview</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Voice Controls */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg text-sm transition ${
              muted ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
            title={muted ? 'Unmute interviewer' : 'Mute interviewer'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {conversation.length > 0 && (
            <button
              onClick={() => onReplay(conversation[conversation.length - 1]?.message)}
              className="p-2 rounded-lg text-sm text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition"
              title="Replay last question"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="p-2 rounded-lg text-sm text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition"
              title="Stop speaking"
            >
              <Square className="h-4 w-4" />
            </button>
          )}
          <p className={`text-sm font-mono font-bold ${timerColor}`}>{formatTime(timerSeconds)}</p>
          <button
            onClick={onEndInterview}
            disabled={ending}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition disabled:opacity-50"
          >
            {ending ? 'Ending...' : 'End Interview'}
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {conversation.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} message={msg.message} />
        ))}

        {/* Live Transcript (while speaking) */}
        {isListening && (transcript || interimTranscript) && (
          <div className="flex gap-3 flex-row-reverse">
            <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0 text-sm bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
              <User className="h-4 w-4" />
            </div>
            <div className="max-w-[80%] text-right">
              <p className="text-xs font-medium mb-0.5 text-surface-500 dark:text-surface-400">
                You <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </p>
              <div className="rounded-xl px-4 py-2.5 text-sm bg-primary-500 text-white">
                {transcript}
                {interimTranscript && (
                  <span className="opacity-60">{interimTranscript}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0 text-sm bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-surface-500 dark:text-surface-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Mic Button Footer */}
      <div className="shrink-0 mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        {!sttSupported && (
          <p className="text-xs text-amber-500 text-center mb-2">
            Speech recognition is not supported in this browser. Type your answers instead.
          </p>
        )}
        <div className="flex items-center justify-center gap-4">
          {!isListening && !loading && (
            <button
              onClick={handleMicClick}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-surface-200 dark:bg-surface-700 px-6 py-3 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-600 transition disabled:opacity-50"
            >
              <Mic className="h-5 w-5" />
              Click to Speak
            </button>
          )}
          {isListening && (
            <button
              onClick={handleMicClick}
              className="flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/40 px-6 py-3 text-sm font-medium text-red-600 dark:text-red-400 animate-pulse"
            >
              <Circle className="h-5 w-5 text-red-500" fill="currentColor" />
              Stop Recording
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <Spinner size="sm" />
              Processing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryScreen({ report, session, onSave, saving, questions, conversation }) {
  const metrics = [
    { label: 'Overall', value: report.overallScore, key: 'overallScore' },
    { label: 'Technical', value: report.technicalAccuracy, key: 'technicalAccuracy' },
    { label: 'Communication', value: report.communication, key: 'communication' },
    { label: 'Problem Solving', value: report.problemSolving, key: 'problemSolving' },
    { label: 'Confidence', value: report.confidence, key: 'confidence' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Interview Complete</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {session.interviewType} · {session.duration} minutes
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Performance Summary</h2>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {metrics.map((m) => (
            <div key={m.key} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 text-center">
              <p className="text-2xs text-surface-500 dark:text-surface-400 mb-1">{m.label}</p>
              <ScoreBadge score={m.value} />
            </div>
          ))}
        </div>

        {report.strengths?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Strengths</p>
            <div className="flex flex-wrap gap-2">
              {report.strengths.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {report.improvements?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Areas to Improve</p>
            <div className="flex flex-wrap gap-2">
              {report.improvements.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  ⚠ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {report.recommendedTopics?.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Recommended Topics</p>
            <div className="flex flex-wrap gap-2">
              {report.recommendedTopics.map((t, i) => (
                <span key={i} className="rounded-full border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1 text-xs font-medium text-surface-600 dark:text-surface-400">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {questions?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">Question Transcript</p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">Q{i + 1}: {q.topic || 'General'}</p>
                    {q.score != null && (
                      <span className={`text-xs font-bold ${q.score >= 70 ? 'text-green-500' : q.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {q.score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">{q.question}</p>
                  {q.answer && (
                    <>
                      <p className="text-2xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-0.5">Your answer:</p>
                      <p className="text-xs text-surface-700 dark:text-surface-300">{q.answer}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-center gap-3">
        <Button onClick={onSave} disabled={saving} className="px-8">
          {saving ? (
            <span className="flex items-center gap-2"><Spinner size="sm" /> Saving...</span>
          ) : (
            'Finish'
          )}
        </Button>
      </div>
    </div>
  );
}

function HistoryScreen({ onBack, onSelectSession }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['interview-history'],
    queryFn: aiApi.getInterviewHistory,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">Past Interviews</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && (!history || history.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-sm text-surface-500 dark:text-surface-400">No interviews completed yet.</p>
          <Button onClick={onBack} className="mt-4">Start Your First Interview</Button>
        </Card>
      )}

      {!isLoading && history?.length > 0 && (
        <div className="space-y-3">
          {history.map((h) => (
            <button
              key={h.sessionId}
              onClick={() => onSelectSession(h.sessionId)}
              className="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 text-left hover:border-surface-300 dark:hover:border-surface-600 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{h.interviewType}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                    {h.duration} min · {new Date(h.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {h.overallScore != null && <ScoreBadge score={h.overallScore} />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryDetailScreen({ sessionId, onBack }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ['interview-session', sessionId],
    queryFn: () => aiApi.getInterviewSession(sessionId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto text-center py-10">
        <p className="text-sm text-surface-500 dark:text-surface-400">Session not found.</p>
        <Button onClick={onBack} className="mt-4">Back</Button>
      </div>
    );
  }

  const report = session.finalReport || {};
  const metrics = [
    { label: 'Overall', value: report.overallScore, key: 'overallScore' },
    { label: 'Technical', value: report.technicalAccuracy, key: 'technicalAccuracy' },
    { label: 'Communication', value: report.communication, key: 'communication' },
    { label: 'Problem Solving', value: report.problemSolving, key: 'problemSolving' },
    { label: 'Confidence', value: report.confidence, key: 'confidence' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 transition">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">Interview Details</h1>
      </div>

      <div className="text-center">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {session.interviewType} · {session.duration} minutes · {new Date(session.createdAt).toLocaleDateString()}
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Performance Summary</h2>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {metrics.map((m) => {
            if (m.value == null) return null;
            return (
              <div key={m.key} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3 text-center">
                <p className="text-2xs text-surface-500 dark:text-surface-400 mb-1">{m.label}</p>
                <ScoreBadge score={m.value} />
              </div>
            );
          })}
        </div>

        {report.strengths?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Strengths</p>
            <div className="flex flex-wrap gap-2">
              {report.strengths.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {report.improvements?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">Areas to Improve</p>
            <div className="flex flex-wrap gap-2">
              {report.improvements.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  ⚠ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {session.questions?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">Question Transcript</p>
            <div className="space-y-3">
              {session.questions.map((q, i) => (
                <div key={i} className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">Q{i + 1}: {q.topic || 'General'}</p>
                    {q.score != null && (
                      <span className={`text-xs font-bold ${q.score >= 70 ? 'text-green-500' : q.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {q.score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">{q.question}</p>
                  {q.answer && (
                    <>
                      <p className="text-2xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-0.5">Your answer:</p>
                      <p className="text-xs text-surface-700 dark:text-surface-300">{q.answer}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-center">
        <Button onClick={onBack} variant="secondary" className="px-8">Back to History</Button>
      </div>
    </div>
  );
}

export default function MockInterviewPage() {
  const [screen, setScreen] = useState('setup');
  const [session, setSession] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [report, setReport] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [hasStartedAnswering, setHasStartedAnswering] = useState(false);
  const lastSpokenRef = useRef('');
  const timerRef = useRef(null);

  const { speak, stop, replay, toggleMute, isSpeaking, isMuted } = useTextToSpeech();

  const startMutation = useStartInterview();
  const answerMutation = useAnswerInterview();
  const endMutation = useEndInterview();

  // Auto-speak new interviewer messages
  useEffect(() => {
    if (conversation.length === 0) return;
    const last = conversation[conversation.length - 1];
    if (last.role === 'interviewer' && last.message !== lastSpokenRef.current) {
      lastSpokenRef.current = last.message;
      speak(last.message);
    }
  }, [conversation, speak]);

  // Timer
  useEffect(() => {
    if (screen !== 'interview') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  const handleStart = async (type, duration) => {
    setStartLoading(true);
    try {
      const result = await startMutation.mutateAsync({ type, duration });
      setSession({
        ...result,
        interviewType: type,
        duration,
      });
      setConversation([{ role: 'interviewer', message: result.message }]);
      setHasMoreQuestions(true);
      setTimeLeft(duration * 60);
      setHasStartedAnswering(false);
      setScreen('interview');
    } catch {
      // error handled by axios interceptor
    } finally {
      setStartLoading(false);
    }
  };

  const handleSendAnswer = useCallback(async (answer) => {
    if (!session || submitLoading) return;
    setSubmitLoading(true);
    setHasStartedAnswering(true);

    try {
      // Optimistically add user message
      setConversation((prev) => [...prev, { role: 'candidate', message: answer }]);

      const result = await answerMutation.mutateAsync({
        sessionId: session.sessionId,
        answer,
      });

      if (result.nextMessage) {
        setConversation((prev) => [
          ...prev,
          { role: 'interviewer', message: result.nextMessage.message },
        ]);
        setHasMoreQuestions(!result.isComplete);
      }

      if (result.isComplete) {
        setHasMoreQuestions(false);
        // Auto-end interview
        const endResult = await endMutation.mutateAsync({
          sessionId: session.sessionId,
        });
        setReport(endResult.finalReport);
        setSessionQuestions(endResult.questions || []);
        setScreen('summary');
        stop();
      }
    } catch {
      // error handled by axios interceptor
    } finally {
      setSubmitLoading(false);
    }
  }, [session, submitLoading, answerMutation, endMutation, stop]);

  const handleSave = () => {
    setSaveLoading(true);
    setTimeout(() => {
      setSaveLoading(false);
      setScreen('setup');
      setSession(null);
      setConversation([]);
      setReport(null);
      setSessionQuestions([]);
      setTimeLeft(0);
      lastSpokenRef.current = '';
      stop();
    }, 500);
  };

  const handleReplay = (text) => {
    replay(text);
  };

  const handleEndInterview = useCallback(async () => {
    if (!session || ending) return;
    setEnding(true);
    stop();
    try {
      const endResult = await endMutation.mutateAsync({
        sessionId: session.sessionId,
      });
      setReport(endResult.finalReport);
      setSessionQuestions(endResult.questions || []);
      setScreen('summary');
      clearInterval(timerRef.current);
    } catch {
      // error handled by axios interceptor
    } finally {
      setEnding(false);
    }
  }, [session, ending, endMutation, stop]);

  if (startLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-surface-500 dark:text-surface-400">Preparing your interview...</p>
        </div>
      </div>
    );
  }

  const showTabs = screen === 'setup' || screen === 'history' || screen === 'history-detail';

  return (
    <div className="space-y-6">
      {showTabs && (
        <div className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 p-1 max-w-xs mx-auto">
          <button
            onClick={() => setScreen('setup')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              screen === 'setup'
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            New Interview
          </button>
          <button
            onClick={() => setScreen('history')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              screen === 'history' || screen === 'history-detail'
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
          >
            History
          </button>
        </div>
      )}

      {screen === 'setup' && <SetupScreen onStart={handleStart} />}
      {screen === 'interview' && (
        <InterviewScreen
          conversation={conversation}
          onSendAnswer={handleSendAnswer}
          loading={submitLoading}
          timerSeconds={timeLeft}
          muted={isMuted}
          onToggleMute={toggleMute}
          onReplay={handleReplay}
          isSpeaking={isSpeaking}
          onStopSpeaking={stop}
          hasMoreQuestions={hasMoreQuestions}
          onEndInterview={handleEndInterview}
          ending={ending}
        />
      )}
      {screen === 'summary' && report && session && (
        <SummaryScreen report={report} session={session} onSave={handleSave} saving={saveLoading} questions={sessionQuestions} conversation={conversation} />
      )}
      {screen === 'history' && (
        <HistoryScreen
          onBack={() => setScreen('setup')}
          onSelectSession={(id) => { setScreen('history-detail'); setSelectedHistoryId(id); }}
        />
      )}
      {screen === 'history-detail' && (
        <HistoryDetailScreen
          sessionId={selectedHistoryId}
          onBack={() => setScreen('history')}
        />
      )}
    </div>
  );
}
