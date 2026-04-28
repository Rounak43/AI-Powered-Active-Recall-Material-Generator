import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ToggleSwitch from '../components/ToggleSwitch';
import PillSelector from '../components/PillSelector';
import ProgressBar from '../components/ProgressBar';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastContext';
import { cn } from '../utils/cn';
import { Camera, Edit2, Trash2 } from 'lucide-react';
import { getUserSummaries, deleteSummary } from '../services/dataService';

const sectionMotion = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '-50px' }
};

const tabs = ['Overview', 'My Analyses', 'Achievements'];

const Profile = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [apps, setApps] = useState({ google: false, github: false, notion: false });

  const baseProfile = useMemo(
    () => ({
      fullName: user?.name || 'SummarAI User',
      email: user?.email || 'user@example.com',
      username: user?.email ? user.email.split('@')[0] : 'summarai-user',
      phone: '',
      location: '',
      bio: '',
      website: '',
      dob: ''
    }),
    [user]
  );

  const [profile, setProfile] = useState(baseProfile);
  const [edited, setEdited] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch real summaries
  useEffect(() => {
    const fetchSummaries = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const data = await getUserSummaries(user.uid);
        setSummaries(data);
      } catch (error) {
        console.error("Error fetching summaries in Profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, [user?.uid]);

  // Calculate real metrics
  const stats = useMemo(() => {
    const totalAnalyses = summaries.length;
    const totalWords = summaries.reduce((acc, curr) => acc + (curr.words || 0), 0);
    const totalQuestions = summaries.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0);
    
    // Simple streak logic: if there's activity today, show 1+, else 0
    let streak = 0;
    if (summaries.length > 0) {
      const latestDate = summaries[0].createdAt?.toDate ? summaries[0].createdAt.toDate() : new Date();
      const today = new Date();
      if (latestDate.toDateString() === today.toDateString()) {
        streak = 1; // Basic streak implementation
      }
    }

    return [
      {
        icon: '📄',
        value: totalAnalyses.toLocaleString(),
        label: 'Total Analyses',
        subtitle: 'All time'
      },
      {
        icon: '🔥',
        value: streak.toString(),
        label: 'Day Streak',
        subtitle: streak > 0 ? 'Keep it up!' : 'Start a streak!'
      },
      {
        icon: '📝',
        value: totalWords.toLocaleString(),
        label: 'Words Analyzed',
        subtitle: 'Total'
      },
      {
        icon: '❓',
        value: totalQuestions.toLocaleString(),
        label: 'Questions Generated',
        subtitle: 'All time'
      }
    ];
  }, [summaries]);

  const [showApiKey, setShowApiKey] = useState(false);

  const initials = useMemo(() => {
    const name = user?.name || 'SummarAI User';
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }, [user]);

  const handleAvatarClick = () => {
    showToast('Photo upload coming soon!');
  };

  const startEditField = (field) => {
    setEditingField(field);
    setFieldDraft(profile[field] || '');
  };

  const cancelEditField = () => {
    setEditingField(null);
    setFieldDraft('');
  };

  const saveEditField = () => {
    if (!editingField) return;

    // Validation for phone number
    if (editingField === 'phone') {
      const phoneRegex = /^\d{10}$/;
      if (fieldDraft && !phoneRegex.test(fieldDraft)) {
        showToast('Phone number must be exactly 10 digits.');
        return;
      }
    }

    setProfile((prev) => ({
      ...prev,
      [editingField]: fieldDraft
    }));
    setEdited(true);
    setEditingField(null);
    setFieldDraft('');
  };

  const handleSaveProfile = () => {
    showToast('Profile updated successfully ✓');
    setEdited(false);
  };

  const handleDeleteSummary = (item) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    
    try {
      await deleteSummary(id);
      setSummaries(prev => prev.filter(s => s.id !== id));
      showToast('Analysis deleted successfully');
    } catch (error) {
      console.error("Delete failed:", error);
      showToast('Failed to delete analysis');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleViewResult = (item) => {
    navigate('/dashboard', { state: { activeSummary: item } });
  };

  const renderField = (key, label, placeholder, isTextArea = false) => {
    const value = profile[key];
    const isEditing = editingField === key;
    const display =
      value && value.trim().length > 0 ? (
        value
      ) : (
        <span className="italic text-muted">{placeholder}</span>
      );

    return (
      <div
        key={key}
        className="flex flex-col gap-1 rounded-xl bg-black/30 border border-border/70 p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-body tracking-wide text-muted uppercase">
              {label}
            </div>
          </div>
          {!isEditing && key !== 'email' && (
            <button
              type="button"
              onClick={() => startEditField(key)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 border border-border text-muted hover:text-white hover:border-primary/80 cursor-pointer"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>
        <div className="mt-1">
          {isEditing ? (
            <div className="space-y-2">
              {isTextArea ? (
                <textarea
                  value={fieldDraft}
                  onChange={(e) => setFieldDraft(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-black/50 px-3 py-2 text-sm font-body text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              ) : (
                <input
                  value={fieldDraft}
                  onChange={(e) => setFieldDraft(e.target.value)}
                  className="w-full rounded-lg border border-border bg-black/50 px-3 py-2 text-sm font-body text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditField}
                  className="px-3 py-1.5 rounded-full glass border border-border text-[11px] font-body text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEditField}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary via-accent to-secondary text-[11px] font-body font-medium text-white shadow-glow hover:-translate-y-[1px] transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm font-body text-white/90">{display}</div>
          )}
        </div>
      </div>
    );
  };

  const [analysisSearch, setAnalysisSearch] = useState('');
  const [analysisFilter, setAnalysisFilter] = useState('All');
  const [analysisSort, setAnalysisSort] = useState('Newest');

  const filteredAnalyses = useMemo(() => {
    let list = summaries.filter((a) =>
      a.title.toLowerCase().includes(analysisSearch.toLowerCase())
    );

    if (analysisFilter === 'PDFs') {
      list = list.filter((a) => a.type === 'pdf');
    } else if (analysisFilter === 'Text') {
      list = list.filter((a) => a.type === 'text');
    }

    if (analysisSort === 'Longest') {
      list = [...list].sort((a, b) => (b.words || 0) - (a.words || 0));
    } else if (analysisSort === 'Shortest') {
      list = [...list].sort((a, b) => (a.words || 0) - (b.words || 0));
    }
    return list;
  }, [summaries, analysisSearch, analysisFilter, analysisSort]);

  // Calculate real achievements dynamically
  const achievements = useMemo(() => {
    const totalAnalyses = summaries.length;
    const totalWords = summaries.reduce((acc, curr) => acc + (curr.words || 0), 0);
    const totalQuestions = summaries.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0);
    const hasPdf = summaries.some(s => s.type === 'pdf');

    const possible = [
      {
        icon: '🚀',
        name: 'First Launch',
        desc: 'Completed your first analysis',
        unlocked: totalAnalyses >= 1
      },
      {
        icon: '📄',
        name: 'PDF Pioneer',
        desc: 'Uploaded your first PDF',
        unlocked: hasPdf
      },
      {
        icon: '🔥',
        name: 'Consistent Learner',
        desc: 'Completed 5 analyses',
        unlocked: totalAnalyses >= 5
      },
      {
        icon: '🧠',
        name: 'Deep Researcher',
        desc: 'Analyzed 10 documents',
        unlocked: totalAnalyses >= 10
      },
      {
        icon: '❓',
        name: 'Question Master',
        desc: 'Generated 20 questions',
        unlocked: totalQuestions >= 20
      },
      {
        icon: '✍️',
        name: 'Word Wizard',
        desc: 'Analyzed 1,000 words total',
        unlocked: totalWords >= 1000
      }
    ];

    return {
      unlocked: possible.filter(a => a.unlocked),
      locked: possible.filter(a => !a.unlocked),
      percent: Math.round((possible.filter(a => a.unlocked).length / possible.length) * 100)
    };
  }, [summaries]);

  const maskedKey = 'sk-sum-••••••••••••••••••••••••••3f9a';
  const fullKey = 'sk-sum-a8f3k2p9x1m4n7q0r5t6v2w8y3z1b4c';

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(fullKey);
    showToast('API key copied to clipboard');
  };

  const handleToggleApp = (key) => {
    setApps((prev) => {
      const next = !prev[key];
      showToast(
        `${key === 'google' ? 'Google' : key === 'github' ? 'GitHub' : 'Notion'} ${
          next ? 'connected' : 'disconnected'
        }`
      );
      return { ...prev, [key]: next };
    });
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const openConfirm = (action) => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (confirmAction === 'history') {
      showToast('History cleared');
    } else if (confirmAction === 'account') {
      showToast('Account deleted');
    }
    setConfirmOpen(false);
  };

  const renderOverview = () => (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-8"
    >
      <GlassCard className="p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg text-white">
            Personal Information
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderField('fullName', 'Full Name', 'Not set')}
          {renderField('email', 'Email Address', 'Not set')}
          {renderField('username', 'Username', '@username')}
          {renderField('phone', 'Phone Number', 'Not set')}
          {renderField('location', 'Location', 'Not set')}
          {renderField('website', 'Website', 'Not set')}
          {renderField('dob', 'Date of Birth', 'Not set')}
          {renderField('bio', 'Bio', 'Tell us about yourself...', true)}
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!edited}
            onClick={handleSaveProfile}
            className={cn(
              'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-5 py-2.5 text-sm font-body font-medium text-white shadow-glow hover:-translate-y-[2px] hover:shadow-[0_0_40px_rgba(108,71,255,0.85)] transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Save Changes
          </button>
        </div>
      </GlassCard>

      {summaries.length > 0 && (
        <>
          <div className="space-y-4">
            <h3 className="font-display text-base text-white">Usage Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <GlassCard
                  key={stat.label}
                  className="p-4 flex flex-col gap-2 hover:-translate-y-1 hover:shadow-glow hover:border-primary/80 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-sm">
                      {stat.icon}
                    </div>
                    <div className="font-display text-2xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-sm font-body text-white">{stat.label}</div>
                  <div className="text-[11px] font-body text-muted">
                    {stat.subtitle}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-white">
                Recent Activity
              </h3>
              <button 
                onClick={() => setActiveTab('My Analyses')}
                className="text-xs font-body text-muted hover:text-primary cursor-pointer"
              >
                View All
              </button>
            </div>
            <GlassCard className="divide-y divide-border/60">
              {summaries.slice(0, 5).map((item) => {
                const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
                const whenStr = date.toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-display text-white',
                          item.type === 'pdf'
                            ? 'bg-red-500/80'
                            : 'bg-blue-500/80'
                        )}
                      >
                        {item.type === 'pdf' ? 'PDF' : 'TXT'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-body text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] font-body text-muted">
                          {item.words} words • {item.questions?.length || 0} Questions
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[11px] font-body text-muted">
                        {whenStr}
                      </div>
                      <button 
                        onClick={() => handleViewResult(item)}
                        className="text-[11px] font-body text-muted hover:text-white cursor-pointer"
                      >
                        →
                      </button>
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          </div>
        </>
      )}
    </motion.div>
  );

  const renderAnalyses = () => (
    <motion.div
      key="analyses"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-4 md:p-5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1">
            <div className="relative">
              <input
                value={analysisSearch}
                onChange={(e) => setAnalysisSearch(e.target.value)}
                placeholder="Search analyses..."
                className="w-full rounded-full border border-border bg-black/40 pl-9 pr-3 py-2 text-sm font-body text-white placeholder:text-muted/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                🔍
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={analysisFilter}
              onChange={(e) => setAnalysisFilter(e.target.value)}
              className="rounded-full border border-border bg-black/40 px-3 py-2 text-xs font-body text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option>All</option>
              <option>PDFs</option>
              <option>Text</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <select
              value={analysisSort}
              onChange={(e) => setAnalysisSort(e.target.value)}
              className="rounded-full border border-border bg-black/40 px-3 py-2 text-xs font-body text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>Longest</option>
              <option>Shortest</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {filteredAnalyses.length === 0 ? (
        <GlassCard className="py-12 flex flex-col items-center gap-2">
          <div className="text-3xl">🔍</div>
          <div className="font-body text-sm text-white">
            No analyses found
          </div>
          <div className="font-body text-xs text-muted">
            Try a different search or filter
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnalyses.map((item) => (
            <GlassCard key={item.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={cn(
                    'h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-display text-white',
                    item.type === 'pdf'
                      ? 'bg-red-500/80'
                      : 'bg-blue-500/80'
                  )}
                >
                  {item.type === 'pdf' ? 'PDF' : 'TXT'}
                </div>
                <div className="text-[11px] font-body text-muted">
                  {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm font-display text-white truncate">
                {item.title}
              </div>
              <div className="flex flex-wrap gap-1">
                {item.topics?.map((t, idx) => (
                  <span
                    key={t}
                    className="rounded-full px-2 py-0.5 text-[10px] font-body text-white"
                    style={{
                      backgroundImage:
                        idx % 3 === 0
                          ? 'linear-gradient(135deg,#6C47FF,#00D4FF)'
                          : idx % 3 === 1
                          ? 'linear-gradient(135deg,#FF47A3,#6C47FF)'
                          : 'linear-gradient(135deg,#22c55e,#0ea5e9)'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-[11px] font-body text-muted">
                <span>📝 {item.words} words</span>
                <span>❓ {item.questions?.length || 0} questions</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button 
                  onClick={() => handleViewResult(item)}
                  className="px-3 py-1.5 rounded-full glass border border-border text-[11px] font-body text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                >
                  View Results
                </button>
                <button 
                  onClick={() => handleDeleteSummary(item)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-black/40 border border-border text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete analysis"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderAchievements = () => (
    <motion.div
      key="achievements"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-white">
              🏆 Your Achievements
            </h2>
            <p className="text-[11px] font-body text-muted">
              {achievements.unlocked.length} of {achievements.unlocked.length + achievements.locked.length} unlocked
            </p>
          </div>
          <div className="w-40">
            <ProgressBar value={achievements.percent} color="linear-gradient(90deg,#6C47FF,#00D4FF)" />
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.unlocked.map((a, idx) => (
          <GlassCard
            key={a.name}
            className="relative p-4 flex flex-col items-center text-center gap-2 border border-primary/60 overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 opacity-40" />
            <div className="relative text-3xl">{a.icon}</div>
            <div className="relative font-display text-sm text-white">
              {a.name}
            </div>
            <div className="relative text-[11px] font-body text-muted">
              {a.desc}
            </div>
            <div className="absolute -inset-[1px] rounded-[inherit] border border-transparent animate-dash" />
          </GlassCard>
        ))}
        {achievements.locked.map((a) => (
          <GlassCard
            key={a.name}
            className="relative p-4 flex flex-col items-center text-center gap-2 opacity-40"
          >
            <div className="relative text-3xl grayscale">{a.icon}</div>
            <div className="relative font-display text-sm text-white">
              {a.name}
            </div>
            <div className="relative text-[11px] font-body text-muted">
              {a.desc}
            </div>
            <div className="absolute bottom-2 right-2 text-xs">🔒</div>
            <span className="absolute top-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-body text-muted border border-border">
              Locked
            </span>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );

  const renderConnectedApps = () => (
    <motion.div
      key="apps"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-4 md:p-5 space-y-4">
        <div>
          <h2 className="font-display text-lg text-white">
            OAuth Connections
          </h2>
          <p className="text-[11px] font-body text-muted">
            Connect external services to SummarAI.
          </p>
        </div>
        <div className="space-y-3">
          {[
            {
              key: 'google',
              label: 'Google',
              letter: 'G',
              desc: 'Sign in and sync with Google'
            },
            {
              key: 'github',
              label: 'GitHub',
              letter: 'GH',
              desc: 'Access your repositories'
            },
            {
              key: 'notion',
              label: 'Notion',
              letter: 'N',
              desc: 'Export analyses to Notion'
            }
          ].map((app) => {
            const connected = apps[app.key];
            return (
              <GlassCard
                key={app.key}
                className="flex items-center justify-between gap-3 p-3 bg-black/40"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-xs font-display text-white">
                    {app.letter}
                  </div>
                  <div>
                    <div className="font-display text-sm text-white">
                      {app.label}
                    </div>
                    <div className="text-[11px] font-body text-muted">
                      {app.desc}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-body',
                      connected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-black/40 text-muted border border-border'
                    )}
                  >
                    {connected ? 'Connected' : 'Not Connected'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleApp(app.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[11px] font-body cursor-pointer',
                      connected
                        ? 'border border-red-500/60 text-red-400 hover:bg-red-500/10'
                        : 'border border-border text-muted hover:text-white hover:border-primary/80'
                    )}
                  >
                    {connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </GlassCard>

{/* 
      <GlassCard className="p-4 md:p-5 space-y-3">
        <div>
          <h2 className="font-display text-lg text-white">Your API Key</h2>
          <p className="text-[11px] font-body text-muted">
            Use this key to access SummarAI programmatically.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                value={showApiKey ? fullKey : maskedKey}
                readOnly
                className="w-full rounded-lg border border-border bg-black/40 px-3 pr-16 py-2 text-xs font-mono text-white outline-none"
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="text-[11px] font-body text-muted hover:text-white cursor-pointer"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="text-[11px] font-body text-muted hover:text-white cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => showToast('API key regeneration coming soon!')}
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1.5 text-[11px] font-body text-amber-300 hover:bg-amber-500/20 cursor-pointer"
            >
              <span>Regenerate</span>
            </button>
            <div className="text-[11px] font-body text-muted">
              ⚠️ Never share your API key. Treat it like a password.
            </div>
          </div>
        </div>
      </GlassCard>
      */}

      <GlassCard className="p-4 md:p-5 space-y-3 border border-red-500/40 bg-red-500/10">
        <h2 className="font-display text-base text-white">🗑️ Danger Zone</h2>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-body text-white">
                Clear All Analyses
              </div>
              <div className="text-[11px] font-body text-red-200/80">
                Permanently delete all your analysis history.
              </div>
            </div>
            <button
              type="button"
              onClick={() => openConfirm('history')}
              className="px-3 py-1.5 rounded-full border border-red-400/70 text-[11px] font-body text-red-200 hover:bg-red-500/20 cursor-pointer"
            >
              Clear History
            </button>
          </div>
          <div className="h-px bg-red-500/40" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-body text-red-300">
                Delete Account
              </div>
              <div className="text-[11px] font-body text-red-100/80">
                Permanently delete your account and all data. This action cannot
                be undone.
              </div>
            </div>
            <button
              type="button"
              onClick={() => openConfirm('account')}
              className="px-3 py-1.5 rounded-full bg-red-600 text-[11px] font-body text-white hover:bg-red-500 cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </div>
      </GlassCard>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Are you sure?"
        description={
          confirmAction === 'history'
            ? 'This will permanently clear all analysis history from your account.'
            : 'This will permanently delete your account and all associated data.'
        }
        confirmText={confirmAction === 'history' ? 'Clear History' : 'Delete'}
        requireTyping={confirmAction === 'account'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </motion.div>
  );

  const renderRightContent = () => {
    switch (activeTab) {
      case 'Overview':
        return renderOverview();
      case 'My Analyses':
        return renderAnalyses();
      case 'Achievements':
        return renderAchievements();
      default:
        return null;
    }
  };

  return (
    <div className="pt-24 px-6 md:px-8 pb-16 max-w-5xl mx-auto">
      <motion.div
        {...sectionMotion}
        className="flex flex-col md:grid md:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)] gap-6 md:gap-8"
      >
        {/* Left sidebar */}
        <div className="space-y-4">
          <GlassCard className="p-5 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-4xl font-display text-white shadow-glow overflow-hidden group cursor-pointer">
                <span>{initials}</span>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={20} className="text-white mb-1" />
                  <span className="text-[10px] font-body text-white">
                    Change
                  </span>
                </button>
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="font-display text-lg text-white">
                {profile.fullName}
              </div>
              <div className="text-xs font-body text-muted">{profile.email}</div>
              <div className="text-[11px] font-body text-muted">
                Member since March 2026
              </div>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent my-2" />
            <div className="grid grid-cols-2 gap-3 w-full text-center">
              {[
                { 
                  label: 'Analyses', 
                  value: summaries.length.toString() 
                },
                { 
                  label: 'Words Read', 
                  value: (() => {
                    const total = summaries.reduce((acc, curr) => acc + (curr.words || 0), 0);
                    return total >= 1000 ? (total / 1000).toFixed(1) + 'k' : total.toString();
                  })()
                }
              ].map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="font-display text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    {s.value}
                  </div>
                  <div className="text-[11px] font-body text-muted">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent my-2" />
            <div className="w-full space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-body cursor-pointer transition-all',
                    activeTab === tab
                      ? 'bg-primary/20 border-l-4 border-l-primary text-white'
                      : 'text-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  <span>
                    {tab === 'Overview'
                      ? '👤 Overview'
                      : tab === 'My Analyses'
                      ? '📊 My Analyses'
                      : '🏆 Achievements'}
                  </span>
                  {activeTab === tab && (
                    <span className="text-xs text-primary">●</span>
                  )}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {renderRightContent()}
          </motion.div>
        </div>
      </motion.div>
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

export default Profile;

