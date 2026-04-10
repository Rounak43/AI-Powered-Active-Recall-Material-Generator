import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Copy,
  Download,
  RefreshCcw,
  Save,
  ChevronRight,
  Trash2
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { analyzeContent } from '../services/analyzeService';
import { useAuth } from '../context/AuthContext';
import { saveSummary, getUserSummaries, deleteSummary } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchHistory = async (silent = false) => {
    if (!user?.uid) return;
    try {
      if (!silent) setHistoryLoading(true);
      const data = await getUserSummaries(user.uid);
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      showToast('Failed to refresh history');
    } finally {
      if (!silent) setHistoryLoading(false);
    }
  };

  // Handle cross-page navigation from Profile
  useEffect(() => {
    if (location.state?.activeSummary) {
      setResults(location.state.activeSummary);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setResults(null); // Clear active summary if not explicitly requested
    }
  }, [location.state, location.key]);

  // Fetch history on mount, uid change, OR location change (includes refreshes)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!user?.uid) return;
      try {
        setHistoryLoading(true);
        const data = await getUserSummaries(user.uid);
        if (isMounted) {
          setHistory(data);
          setHistoryLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch history:", error);
          setHistoryLoading(false);
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [user?.uid, location.key]);

  const handleActionToast = (message) => {
    showToast(message);
  };

  const handleDeleteClick = (e, item) => {
    e.stopPropagation();
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    
    try {
      await deleteSummary(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      if (results?.id === id) setResults(null);
      showToast('Analysis deleted successfully');
    } catch (error) {
      console.error("Delete failed:", error);
      showToast('Failed to delete analysis');
    } finally {
      setItemToDelete(null);
    }
  };

  if (historyLoading) {
    return (
      <div className="pt-32 flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="font-body text-sm text-muted">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 md:px-10 pb-16 max-w-6xl mx-auto min-h-[70vh]">
      {/* History content */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2 items-center text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Analysis History
          </h1>
          <p className="font-body text-sm text-muted">
            Revisit your past summaries and insights.
          </p>
        </div>

        {/* Selected History Detail View */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 mb-10"
            >
              <GlassCard className="p-6 md:p-8 relative overflow-hidden group">
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => setResults(null)}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-black/40 border border-border text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Save size={18} />
                      <span className="text-xs font-display font-medium uppercase tracking-wider">Saved Summary</span>
                    </div>
                    <h2 className="font-display text-2xl text-white">
                      {results.title || 'Untitled Analysis'}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg text-white">Summary</h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(results.summary);
                            handleActionToast('Summary copied!');
                          }}
                          className="text-xs font-body text-primary hover:text-secondary cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 md:p-5">
                        <p className="font-body text-sm md:text-base leading-relaxed text-white/90 whitespace-pre-wrap">
                          {results.summary}
                        </p>
                      </div>
                    </div>

                    {results.detailedSummary && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-lg text-white">Detailed Summary</h3>
                        </div>
                        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 md:p-5">
                          <p className="font-body text-sm md:text-base leading-relaxed text-white/80 whitespace-pre-wrap">
                            {results.detailedSummary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    
      {/* Recent history */}
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-white">
            📂 Analysis Library
          </h2>
          <button 
            onClick={() => fetchHistory(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border text-[11px] font-body text-muted hover:text-white hover:border-primary/80 transition-all cursor-pointer"
          >
            <RefreshCcw className={historyLoading ? "h-3 w-3 animate-spin" : "h-3 w-3"} />
            <span>Refresh</span>
          </button>
        </div>
        
        {history.length === 0 ? (
          <GlassCard className="py-12 flex flex-col items-center justify-center text-center opacity-60">
            <CloudUpload className="h-10 w-10 text-muted mb-3" />
            <p className="font-display text-lg text-white">No history yet</p>
            <p className="font-body text-sm text-muted">Generate your first summary to see it here.</p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {history.map((item) => {
              const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
              const timeStr = date.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
              });

              return (
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
                        {timeStr} • {item.words} words
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black/40 border border-border px-2 py-0.5 text-[11px] font-body text-muted">
                      Summary • Topics
                    </span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => handleDeleteClick(e, item)}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-black/40 border border-border text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete from history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setResults(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-body text-primary hover:text-secondary cursor-pointer transition-colors"
                      >
                        <span>Open</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Analysis?"
        description={`This will permanently remove "${itemToDelete?.title}" from your history. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};

export default Dashboard;
