import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Copy,
  Download,
  RefreshCcw,
  Save,
  ChevronRight
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { analyzeContent } from '../services/analyzeService';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('pdf');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [generateSummary, setGenerateSummary] = useState(true);
  const [generateTopics, setGenerateTopics] = useState(true);
  const [generateQuestions, setGenerateQuestions] = useState(true);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [openQuestions, setOpenQuestions] = useState({});
  const [toast, setToast] = useState(null);

  const [history] = useState([
    {
      id: 1,
      type: 'pdf',
      title: 'Introduction to Machine Learning.pdf',
      time: '2 hours ago',
      words: '3,240'
    },
    {
      id: 2,
      type: 'text',
      title: 'React Best Practices Article',
      time: 'Yesterday',
      words: '1,180'
    },
    {
      id: 3,
      type: 'pdf',
      title: 'Research Paper: NLP Advances.pdf',
      time: '3 days ago',
      words: '5,670'
    }
  ]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const charCount = textInput.length;

  const canAnalyze = useMemo(() => {
    if (activeTab === 'pdf') return !!file;
    return textInput.trim().length > 0;
  }, [activeTab, file, textInput]);

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f);
  };

  const startAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setResults(null);
    try {
      const data = await analyzeContent(
        activeTab === 'pdf' ? file?.name : textInput
      );
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = async () => {
    if (!results?.summary) return;
    await navigator.clipboard.writeText(results.summary);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  };

  const handleActionToast = (message) => {
    setToast({ message });
  };

  const resetAll = () => {
    setFile(null);
    setTextInput('');
    setResults(null);
    setOpenQuestions({});
  };

  return (
    <div className="pt-24 px-6 md:px-10 pb-16 max-w-6xl mx-auto">
      {/* Welcome banner */}
      <AnimatePresence>
        {welcomeVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mb-6"
          >
            <GlassCard className="flex items-start justify-between gap-4 p-4 border-l-4 border-l-primary bg-black/40">
              <div className="space-y-1">
                <div className="font-body text-sm text-white">
                  👋 Welcome back,{' '}
                  <span className="font-semibold">
                    {user?.name || 'Explorer'}
                  </span>
                  ! What would you like to analyze today?
                </div>
                <p className="text-xs font-body text-muted">
                  Upload a PDF or paste text below to get AI-powered summaries,
                  topics, and questions.
                </p>
              </div>
              <button
                onClick={() => setWelcomeVisible(false)}
                className="ml-2 text-muted hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <GlassCard className="p-5 md:p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-3 border-b border-border/70 pb-3 mb-4">
          {[
            { id: 'pdf', label: '📄 Upload PDF' },
            { id: 'text', label: '✍️ Paste Text' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-1.5 text-sm font-body cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-muted hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {activeTab === 'pdf' ? (
            <div>
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const droppedFile = e.dataTransfer.files?.[0];
                    handleFile(droppedFile);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all cursor-pointer ${
                    dragging
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-border bg-black/40'
                  }`}
                >
                  <CloudUpload className="h-10 w-10 text-muted mb-1" />
                  <p className="font-body text-sm text-white">
                    Drag &amp; drop your PDF here
                  </p>
                  <p className="font-body text-xs text-muted">or</p>
                  <label className="mt-1 inline-flex items-center justify-center rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-body text-muted hover:text-white hover:border-primary/80 hover:shadow-glow transition-all cursor-pointer">
                    Browse Files
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </label>
                  <p className="mt-2 text-[11px] font-body text-muted">
                    PDF files only • Max 25MB
                  </p>
                  <div className="absolute inset-0 rounded-2xl border border-dashed border-transparent pointer-events-none animate-dash-border" />
                </div>
              ) : (
                <GlassCard className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-xs font-display text-white">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-body text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] font-body text-muted">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-xs font-body text-muted hover:text-accent cursor-pointer"
                  >
                    ✕ Remove
                  </button>
                </GlassCard>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your article, essay, research paper, or any text here..."
                className="w-full min-h-[220px] rounded-2xl border border-border bg-black/40 px-3.5 py-3 text-sm font-body text-white placeholder:text-muted/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
              />
              <div
                className={`mt-1 text-right text-[11px] font-body ${
                  charCount > 8000 ? 'text-accent' : 'text-muted'
                }`}
              >
                {charCount} / 10,000 characters
              </div>
            </div>
          )}

          {/* Analysis options */}
          <div>
            <button
              onClick={() => setOptionsOpen((o) => !o)}
              className="flex w-full items-center justify-between text-xs font-body text-muted hover:text-white cursor-pointer"
            >
              <span>⚙️ Analysis Options</span>
              {optionsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <AnimatePresence>
              {optionsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  {[
                    {
                      label: 'Generate Summary',
                      checked: generateSummary,
                      onChange: setGenerateSummary
                    },
                    {
                      label: 'Extract Key Topics',
                      checked: generateTopics,
                      onChange: setGenerateTopics
                    },
                    {
                      label: 'Generate Questions',
                      checked: generateQuestions,
                      onChange: setGenerateQuestions
                    }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => opt.onChange(!opt.checked)}
                      className="flex w-full items-center justify-between rounded-xl bg-black/40 px-3 py-2 text-xs font-body text-muted hover:text-white hover:bg-white/[0.04] cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`flex h-4 w-7 items-center rounded-full border border-border px-0.5 transition-all ${
                          opt.checked
                            ? 'bg-primary/80 border-primary'
                            : 'bg-black/40'
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full bg-white transition-transform ${
                            opt.checked ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </span>
                    </button>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-body text-muted">
                        Question Difficulty
                      </label>
                      <div className="relative">
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-border bg-black/50 px-3 py-2 text-xs font-body text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-muted" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-body text-muted">
                        <span>Number of Questions</span>
                        <span className="text-white">{questionCount}</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={10}
                        step={1}
                        value={questionCount}
                        onChange={(e) =>
                          setQuestionCount(parseInt(e.target.value, 10))
                        }
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analyze button */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={startAnalyze}
              disabled={!canAnalyze || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-4 py-3 text-sm font-body font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_45px_rgba(108,71,255,0.9)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {loading && (
                <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
              )}
              <span>
                {loading ? 'Analyzing your document...' : '✨ Analyze Now'}
              </span>
            </button>

            {loading && (
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                  <div className="h-full w-1/3 bg-gradient-to-r from-primary via-secondary to-accent animate-progress" />
                </div>
                <div className="flex justify-center gap-1 text-[11px] font-body text-muted">
                  <span>Extracting text</span>
                  <span className="animate-ellipsis" />
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mt-8 space-y-6"
          >
            {/* Summary */}
            {generateSummary && (
              <GlassCard className="p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    <h2 className="font-display text-lg text-white">
                      Summary
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-body text-muted">
                    <span className="rounded-full bg-black/40 border border-border px-2 py-0.5">
                      ~{Math.round(results.summary.split(' ').length)} words
                    </span>
                    <button
                      onClick={handleCopySummary}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-black/40 px-2 py-1 text-[11px] text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{summaryCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p className="font-body text-sm md:text-[15px] leading-relaxed text-white/90">
                  {results.summary}
                </p>
              </GlassCard>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Topics */}
              {generateTopics && (
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <h2 className="font-display text-lg text-white">
                        Key Topics
                      </h2>
                    </div>
                    <span className="rounded-full bg-black/40 border border-border px-2 py-0.5 text-[11px] font-body text-muted">
                      {results.topics.length} topics
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.topics.map((topic, index) => {
                      const gradients = [
                        'linear-gradient(135deg,#6C47FF,#00D4FF)',
                        'linear-gradient(135deg,#00D4FF,#4ade80)',
                        'linear-gradient(135deg,#FF47A3,#6C47FF)',
                        'linear-gradient(135deg,#fb923c,#f97373)',
                        'linear-gradient(135deg,#22c55e,#0ea5e9)'
                      ];
                      const bg = gradients[index % gradients.length];
                      return (
                        <motion.span
                          key={topic}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05
                          }}
                          className="rounded-full px-3 py-1 text-xs font-body text-white cursor-default"
                          style={{ backgroundImage: bg }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {topic}
                        </motion.span>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

              {/* Questions */}
              {generateQuestions && (
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">❓</span>
                      <h2 className="font-display text-lg text-white">
                        Study Questions
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-body text-muted">
                      <span>{results.questions.length} questions</span>
                      <button
                        type="button"
                        onClick={() => setQuizMode((q) => !q)}
                        className="flex items-center gap-1 rounded-full bg-black/40 border border-border px-2 py-1 cursor-pointer"
                      >
                        <span
                          className={`flex h-3.5 w-6 items-center rounded-full border border-border px-0.5 transition-all ${
                            quizMode
                              ? 'bg-primary/80 border-primary'
                              : 'bg-black/40'
                          }`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full bg-white transition-transform ${
                              quizMode ? 'translate-x-2.5' : 'translate-x-0'
                            }`}
                          />
                        </span>
                        <span>Quiz Mode</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {results.questions.map((q, index) => {
                      const open = !!openQuestions[index];
                      return (
                        <div key={q.question} className="rounded-xl bg-black/40">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenQuestions((prev) => ({
                                ...prev,
                                [index]: !open
                              }))
                            }
                            className="flex w-full items-center justify-between px-3 py-2 text-xs font-body text-white/90 cursor-pointer"
                          >
                            <span className="text-left">{q.question}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                open ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          <AnimatePresence>
                            {open && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                  duration: 0.2,
                                  ease: 'easeInOut'
                                }}
                                className="px-3 pb-3 text-[11px] font-body text-muted"
                              >
                                {quizMode ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenQuestions((prev) => ({
                                        ...prev,
                                        [`reveal-${index}`]:
                                          !prev[`reveal-${index}`]
                                      }))
                                    }
                                    className="text-primary hover:text-secondary underline underline-offset-2 cursor-pointer"
                                  >
                                    {openQuestions[`reveal-${index}`]
                                      ? 'Hide Answer'
                                      : 'Reveal Answer'}
                                  </button>
                                ) : (
                                  <p>{q.answer}</p>
                                )}
                                {quizMode &&
                                  openQuestions[`reveal-${index}`] && (
                                    <p className="mt-1 text-muted">{q.answer}</p>
                                  )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleActionToast('Coming soon! 🚀')}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-black/40 px-3 py-1.5 text-xs font-body text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy All</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleActionToast('Coming soon! 🚀')}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-black/40 px-3 py-1.5 text-xs font-body text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-black/40 px-3 py-1.5 text-xs font-body text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  <span>Analyze Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleActionToast('Coming soon! 🚀')}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-black/40 px-3 py-1.5 text-xs font-body text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent history */}
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-white">
            📂 Recent Analyses
          </h2>
          <button className="text-xs font-body text-muted hover:text-primary cursor-pointer">
            View All
          </button>
        </div>
        {history.length === 0 ? (
          <GlassCard className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="text-3xl">📭</div>
            <div className="font-body text-sm text-white">
              No analyses yet
            </div>
            <div className="font-body text-xs text-muted">
              Upload your first document above to get started.
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {history.map((item) => (
              <GlassCard
                key={item.id}
                className="p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-display text-white ${
                      item.type === 'pdf'
                        ? 'bg-gradient-to-br from-primary via-secondary to-accent'
                        : 'bg-gradient-to-br from-secondary via-primary to-accent'
                    }`}
                  >
                    {item.type === 'pdf' ? 'PDF' : 'TXT'}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-body text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] font-body text-muted">
                      {item.time} • {item.words} words
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-black/40 border border-border px-2 py-0.5 text-[11px] font-body text-muted">
                    Summary • Topics • Questions
                  </span>
                  <button className="inline-flex items-center gap-1 text-[11px] font-body text-muted hover:text-white cursor-pointer">
                    <span>View</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-6 right-6 z-40"
          >
            <GlassCard className="px-4 py-2.5 flex items-center gap-2">
              <span>✨</span>
              <span className="text-xs font-body text-white">
                {toast.message}
              </span>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

