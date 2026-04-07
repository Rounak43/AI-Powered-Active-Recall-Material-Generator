import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ToggleSwitch from '../components/ToggleSwitch';
import PillSelector from '../components/PillSelector';
import ProgressBar from '../components/ProgressBar';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastContext';
import GlassCard from '../components/GlassCard';
import { cn } from '../utils/cn';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const sectionMotion = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '-50px' }
};

const settingsTabs = [
  'Appearance',
  'Notifications',
  'Privacy & Security',
  'AI Preferences',
  'Danger Zone'
];

const Settings = () => {
  const { showToast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('Appearance');

  const [reduceMotion, setReduceMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [showWordCount, setShowWordCount] = useState(true);

  const [emailToggles, setEmailToggles] = useState({
    analysisComplete: true,
    weeklySummary: true,
    productUpdates: false,
    tips: false
  });

  const [inAppToggles, setInAppToggles] = useState({
    analysisComplete: true,
    achievement: true,
    announcements: true
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: ''
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    next: false,
    confirm: false
  });

  const passwordStrength = useMemo(() => {
    const v = passwordForm.next;
    let score = 0;
    if (v.length > 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#f97373', '#fb923c', '#facc15', '#4ade80'];
    return {
      score,
      label: score ? labels[score - 1] : 'Too short',
      color: score ? colors[score - 1] : '#64748b'
    };
  }, [passwordForm.next]);

  const [aiDefaults, setAiDefaults] = useState({
    summary: true,
    topics: true,
    questions: true
  });

  const [questionDifficulty, setQuestionDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [summaryLength, setSummaryLength] = useState('Medium');
  const [language, setLanguage] = useState('English');
  const [focusModes, setFocusModes] = useState({
    academic: false,
    technical: false,
    casual: true
  });

  const [themeAccent, setThemeAccent] = useState('#6C47FF');
  const [colorTheme, setColorTheme] = useState('Dark');
  const [fontSize, setFontSize] = useState('Medium');

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
      logout();
      navigate('/');
      showToast('Account deleted');
    }
    setConfirmOpen(false);
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    if (value !== 'English') {
      showToast('Multilingual support coming soon!');
    }
  };

  const handleThemeClick = (theme) => {
    setColorTheme(theme);
    if (theme === 'Dark') {
      showToast('Dark theme applied ✓');
    } else if (theme === 'Light') {
      showToast('Light theme applied ✓');
    } else {
      showToast('Auto theme applied ✓');
    }
  };

  const handleAccentClick = (color) => {
    setThemeAccent(color);
  };

  const handleSaveNotifications = () => {
    showToast('Preferences saved ✓');
  };

  const handleUpdatePassword = () => {
    if (
      passwordForm.current &&
      passwordForm.next &&
      passwordForm.confirm &&
      passwordForm.next === passwordForm.confirm
    ) {
      showToast('Password updated ✓');
      setPasswordForm({ current: '', next: '', confirm: '' });
    }
  };

  const handleSaveAiPrefs = () => {
    showToast('AI preferences saved ✓');
  };

  const handleUpgradePro = () => {
    showToast('Billing page coming soon!');
  };

  const handleRequestDownload = () => {
    showToast("We'll email you a download link shortly!");
  };

  // Apply appearance selections to global CSS variables / classes
  useEffect(() => {
    const root = document.documentElement;
    // Accent color
    root.style.setProperty('--accent', themeAccent);
  }, [themeAccent]);

  useEffect(() => {
    const root = document.documentElement;
    const size =
      fontSize === 'Small' ? '13px' : fontSize === 'Large' ? '16px' : '14px';
    root.style.setProperty('--font-base', size);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('compact', compactMode);
  }, [compactMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorTheme === 'Dark') {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      root.style.setProperty('--bg', '#050B18');
      root.style.setProperty('--text', '#F0F0FF');
      root.style.setProperty('--surface', 'rgba(255,255,255,0.05)');
    } else if (colorTheme === 'Light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      root.style.setProperty('--bg', '#F3F4F6');
      root.style.setProperty('--text', '#020617');
      root.style.setProperty('--surface', 'rgba(15,23,42,0.04)');
    } else {
      const prefersDark = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('theme-dark');
        root.classList.remove('theme-light');
        root.style.setProperty('--bg', '#050B18');
        root.style.setProperty('--text', '#F0F0FF');
        root.style.setProperty('--surface', 'rgba(255,255,255,0.05)');
      } else {
        root.classList.add('theme-light');
        root.classList.remove('theme-dark');
        root.style.setProperty('--bg', '#F3F4F6');
        root.style.setProperty('--text', '#020617');
        root.style.setProperty('--surface', 'rgba(15,23,42,0.04)');
      }
    }
  }, [colorTheme]);

  const renderAppearance = () => (
    <motion.div
      key="appearance"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-5 space-y-4">
        <div>
          <h2 className="font-display text-lg text-white">🎨 Appearance</h2>
          <p className="text-[11px] font-body text-muted">
            Customize how SummarAI looks.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-body text-muted">Color Theme</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'Dark', desc: 'Deep navy, best for focus', badge: '' },
              { name: 'Light', desc: 'Bright and clean', badge: 'Coming Soon' },
              { name: 'Auto', desc: 'Match system setting', badge: 'Coming Soon' }
            ].map((t) => {
              const selected = colorTheme === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleThemeClick(t.name)}
                  className={cn(
                    'relative text-left rounded-xl border px-3 py-3 bg-black/40 cursor-pointer flex flex-col gap-1',
                    selected
                      ? 'border-primary/80 shadow-glow'
                      : 'border-border hover:border-primary/60'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display text-sm text-white">
                      {t.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={cn(
                          'h-3 w-8 rounded-full overflow-hidden border border-border',
                          t.name === 'Dark'
                            ? 'bg-gradient-to-r from-slate-900 to-slate-700'
                            : t.name === 'Light'
                            ? 'bg-gradient-to-r from-slate-100 to-slate-300'
                            : 'bg-gradient-to-r from-slate-900 to-slate-100'
                        )}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-body text-muted">
                    {t.desc}
                  </div>
                  {t.badge && (
                    <span className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-black/40 border border-border text-[10px] font-body text-muted">
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-body text-muted">Accent Color</div>
          <div className="flex flex-wrap gap-2">
            {['#6C47FF', '#00D4FF', '#FF47A3', '#10B981', '#F59E0B', '#EF4444'].map(
              (c) => {
                const selected = themeAccent === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleAccentClick(c)}
                    className="relative h-7 w-7 rounded-full border border-border cursor-pointer flex items-center justify-center"
                  >
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                    {selected && (
                      <span className="absolute inset-0 rounded-full border-2 border-white/90" />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-body text-muted">
            Interface Font Size
          </div>
          <PillSelector
            options={['Small', 'Medium', 'Large']}
            active={fontSize}
            onChange={setFontSize}
          />
        </div>

        <div className="space-y-2 pt-2">
          <ToggleSwitch
            checked={reduceMotion}
            onChange={setReduceMotion}
            label="Reduce Motion"
            subtitle="Disable animations for accessibility"
          />
          <ToggleSwitch
            checked={compactMode}
            onChange={setCompactMode}
            label="Compact Mode"
            subtitle="Show more content with reduced spacing"
          />
          <ToggleSwitch
            checked={showWordCount}
            onChange={setShowWordCount}
            label="Show Word Count"
            subtitle="Display word count on all analysis results"
          />
        </div>
      </GlassCard>
    </motion.div>
  );

  const renderNotifications = () => (
    <motion.div
      key="notifications"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-5 space-y-4">
        <div>
          <h2 className="font-display text-lg text-white">🔔 Notifications</h2>
          <p className="text-[11px] font-body text-muted">
            Choose what updates you want to receive.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-body text-muted">Email Notifications</div>
          <div className="space-y-2">
            <ToggleSwitch
              checked={emailToggles.analysisComplete}
              onChange={(v) =>
                setEmailToggles((p) => ({ ...p, analysisComplete: v }))
              }
              label="Analysis Complete"
              subtitle="Get notified when your analysis finishes"
            />
            <ToggleSwitch
              checked={emailToggles.weeklySummary}
              onChange={(v) =>
                setEmailToggles((p) => ({ ...p, weeklySummary: v }))
              }
              label="Weekly Summary"
              subtitle="Receive a weekly digest of your activity"
            />
            <ToggleSwitch
              checked={emailToggles.productUpdates}
              onChange={(v) =>
                setEmailToggles((p) => ({ ...p, productUpdates: v }))
              }
              label="Product Updates"
              subtitle="News about new features and improvements"
            />
            <ToggleSwitch
              checked={emailToggles.tips}
              onChange={(v) => setEmailToggles((p) => ({ ...p, tips: v }))}
              label="Tips & Tutorials"
              subtitle="Learn how to get more from SummarAI"
            />
            <ToggleSwitch
              checked={emailToggles.billing}
              onChange={(v) =>
                setEmailToggles((p) => ({ ...p, billing: v }))
              }
              label="Billing Alerts"
              subtitle="Important updates about your subscription"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="text-xs font-body text-muted">
            In-App Notifications
          </div>
          <div className="space-y-2">
            <ToggleSwitch
              checked={inAppToggles.analysisComplete}
              onChange={(v) =>
                setInAppToggles((p) => ({ ...p, analysisComplete: v }))
              }
              label="Analysis Complete"
              subtitle="Show a notification when analysis finishes"
            />
            <ToggleSwitch
              checked={inAppToggles.achievement}
              onChange={(v) =>
                setInAppToggles((p) => ({ ...p, achievement: v }))
              }
              label="Achievement Unlocked"
              subtitle="Celebrate your milestones with badges"
            />
            <ToggleSwitch
              checked={inAppToggles.announcements}
              onChange={(v) =>
                setInAppToggles((p) => ({ ...p, announcements: v }))
              }
              label="System Announcements"
              subtitle="Important announcements and updates"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveNotifications}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-5 py-2.5 text-sm font-body font-medium text-white shadow-glow hover:-translate-y-[2px] hover:shadow-[0_0_40px_rgba(108,71,255,0.85)] transition-all cursor-pointer"
          >
            Save Notification Preferences
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );

  const renderPrivacy = () => (
    <motion.div
      key="privacy"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-5 space-y-5">
        <div>
          <h2 className="font-display text-lg text-white">
            🔒 Privacy & Security
          </h2>
        </div>

        {/* Password */}
        <div className="space-y-3">
          <div className="text-sm font-body text-white">Password</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['current', 'next', 'confirm'].map((field) => (
              <div key={field} className="space-y-1">
                <div className="text-[11px] font-body text-muted">
                  {field === 'current'
                    ? 'Current Password'
                    : field === 'next'
                    ? 'New Password'
                    : 'Confirm New Password'}
                </div>
                <div className="relative">
                  <input
                    type={showPasswordFields[field] ? 'text' : 'password'}
                    value={passwordForm[field]}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-black/40 px-3 pr-8 py-2 text-sm font-body text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordFields((p) => ({
                        ...p,
                        [field]: !p[field]
                      }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-white cursor-pointer"
                  >
                    {showPasswordFields[field] ? (
                      <EyeOff size={14} />
                    ) : (
                      <Eye size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full bg-black/50 overflow-hidden"
                >
                  <div
                    className="h-full w-full transition-colors"
                    style={{
                      backgroundColor:
                        passwordStrength.score > i
                          ? passwordStrength.color
                          : 'transparent'
                    }}
                  />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-body text-muted min-w-[70px] text-right">
              {passwordStrength.label}
            </span>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleUpdatePassword}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-5 py-2.5 text-sm font-body font-medium text-white shadow-glow hover:-translate-y-[2px] hover:shadow-[0_0_40px_rgba(108,71,255,0.85)] transition-all cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* 2FA */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-display text-white">
              🛡️ Two-Factor Authentication
            </div>
            <div className="text-[11px] font-body text-muted">
              Add an extra layer of security to your account.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-black/40 border border-border text-[10px] font-body text-muted">
              Not Enabled
            </span>
            <button
              type="button"
              onClick={() => showToast('2FA setup coming soon!')}
              className="px-3 py-1.5 rounded-full border border-primary/70 text-[11px] font-body text-primary hover:bg-primary/20 cursor-pointer"
            >
              Enable 2FA
            </button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Active sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-body text-white">Active Sessions</div>
            <button
              type="button"
              onClick={() => showToast('Signed out from other sessions')}
              className="text-[11px] font-body text-muted hover:text-primary cursor-pointer"
            >
              Sign out all
            </button>
          </div>
          <div className="space-y-2 text-sm font-body">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 py-2 border-b border-border/60">
              <div>
                <div className="text-white">💻 Chrome on Windows</div>
                <div className="text-[11px] text-muted">Bengaluru, India</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
                  Current session
                </span>
                <span className="text-[11px] text-muted">Last active: now</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 py-2">
              <div>
                <div className="text-white">📱 Safari on iPhone</div>
                <div className="text-[11px] text-muted">Mumbai, India</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted">
                  Last active: 2 days ago
                </span>
                <button
                  type="button"
                  onClick={() => showToast('Session signed out')}
                  className="px-3 py-1.5 rounded-full border border-red-400/70 text-[11px] text-red-300 hover:bg-red-500/10 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Data & privacy */}
        <div className="space-y-3">
          <div className="text-sm font-body text-white">Data & Privacy</div>
          <div className="space-y-2">
            <ToggleSwitch
              checked
              onChange={() =>
                showToast('Analytics preference update coming soon!')
              }
              label="Analytics & Usage Data"
              subtitle="Help improve SummarAI by sharing anonymous usage data"
            />
            <ToggleSwitch
              checked
              onChange={() =>
                showToast('Personalization preference update coming soon!')
              }
              label="Personalized Experience"
              subtitle="Allow AI to learn from your usage patterns"
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div>
              <div className="text-sm font-body text-white">
                Download My Data
              </div>
              <div className="text-[11px] font-body text-muted">
                Export all your analyses and account data as a ZIP file.
              </div>
            </div>
            <button
              type="button"
              onClick={handleRequestDownload}
              className="px-4 py-2 rounded-full border border-secondary/70 text-[11px] font-body text-secondary hover:bg-secondary/10 cursor-pointer"
            >
              Request Download
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  const renderAiPrefs = () => (
    <motion.div
      key="ai"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-5 space-y-4">
        <div>
          <h2 className="font-display text-lg text-white">🤖 AI Preferences</h2>
          <p className="text-[11px] font-body text-muted">
            Customize how the AI analyzes your documents.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-body text-muted">
            Default Analysis Options
          </div>
          <div className="space-y-2">
            <ToggleSwitch
              checked={aiDefaults.summary}
              onChange={(v) =>
                setAiDefaults((p) => ({ ...p, summary: v }))
              }
              label="Auto-generate Summary"
              subtitle="Create a summary for each analysis by default"
            />
            <ToggleSwitch
              checked={aiDefaults.topics}
              onChange={(v) =>
                setAiDefaults((p) => ({ ...p, topics: v }))
              }
              label="Auto-extract Topics"
              subtitle="Identify key topics automatically"
            />
            <ToggleSwitch
              checked={aiDefaults.questions}
              onChange={(v) =>
                setAiDefaults((p) => ({ ...p, questions: v }))
              }
              label="Auto-generate Questions"
              subtitle="Generate study questions automatically"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-body text-muted">
              Default Difficulty
            </div>
            <PillSelector
              options={['Easy', 'Medium', 'Hard']}
              active={questionDifficulty}
              onChange={setQuestionDifficulty}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-body text-muted">
              <span>Default Number of Questions</span>
              <span className="text-white text-[11px]">
                {questionCount} questions
              </span>
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

        <div className="space-y-2">
          <div className="text-xs font-body text-muted">
            Preferred Summary Length
          </div>
          <PillSelector
            options={[
              { value: 'Short', label: 'Short (1 paragraph)' },
              { value: 'Medium', label: 'Medium (2-3 paragraphs)' },
              { value: 'Detailed', label: 'Detailed (4+ paragraphs)' }
            ]}
            active={summaryLength}
            onChange={setSummaryLength}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-body text-muted">
              Analysis Language
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-black/40 px-3 py-2 text-xs font-body text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Tamil</option>
              <option>Telugu</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-body text-muted">Focus Mode</div>
            <div className="space-y-1">
              <ToggleSwitch
                checked={focusModes.academic}
                onChange={(v) =>
                  setFocusModes((p) => ({ ...p, academic: v }))
                }
                label="Academic Mode"
                subtitle="Optimize analysis for research papers and academic texts"
              />
              <ToggleSwitch
                checked={focusModes.technical}
                onChange={(v) =>
                  setFocusModes((p) => ({ ...p, technical: v }))
                }
                label="Technical Mode"
                subtitle="Better analysis for code documentation and technical specs"
              />
              <ToggleSwitch
                checked={focusModes.casual}
                onChange={(v) =>
                  setFocusModes((p) => ({ ...p, casual: v }))
                }
                label="Casual Mode"
                subtitle="Relaxed analysis style for articles and blog posts"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAiPrefs}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-5 py-2.5 text-sm font-body font-medium text-white shadow-glow hover:-translate-y-[2px] hover:shadow-[0_0_40px_rgba(108,71,255,0.85)] transition-all cursor-pointer"
          >
            Save AI Preferences
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );

  const renderDanger = () => (
    <motion.div
      key="danger"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <GlassCard className="p-5 space-y-4 border border-red-500/50 bg-red-500/10">
        <div>
          <h2 className="font-display text-lg text-white">🗑️ Danger Zone</h2>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-body text-white">
                Clear All Analyses
              </div>
              <div className="text-[11px] font-body text-red-100/80">
                Permanently delete all your analysis history.
              </div>
            </div>
            <button
              type="button"
              onClick={() => openConfirm('history')}
              className="px-4 py-2 rounded-full border border-red-400/70 text-[11px] font-body text-red-200 hover:bg-red-500/20 cursor-pointer"
            >
              Clear History
            </button>
          </div>
          <div className="h-px bg-red-500/50" />
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
              className="px-4 py-2 rounded-full bg-red-600 text-[11px] font-body text-white hover:bg-red-500 cursor-pointer"
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

  const renderRight = () => {
    switch (activeTab) {
      case 'Appearance':
        return renderAppearance();
      case 'Notifications':
        return renderNotifications();
      case 'Privacy & Security':
        return renderPrivacy();
      case 'AI Preferences':
        return renderAiPrefs();
      case 'Danger Zone':
        return renderDanger();
      default:
        return null;
    }
  };

  return (
    <div className="pt-24 px-6 md:px-8 pb-16 max-w-5xl mx-auto">
      <motion.div
        {...sectionMotion}
        className="flex flex-col md:grid md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] gap-6 md:gap-8"
      >
        {/* Sidebar */}
        <div className="space-y-4">
          <GlassCard className="p-5 space-y-3">
            <div>
              <h1 className="font-display text-xl text-white">Settings</h1>
              <p className="text-[11px] font-body text-muted">
                Manage your preferences
              </p>
            </div>
            <div className="space-y-1">
              {settingsTabs.map((tab) => (
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
                    {tab === 'Appearance'
                      ? '🎨 Appearance'
                      : tab === 'Notifications'
                      ? '🔔 Notifications'
                      : tab === 'Privacy & Security'
                      ? '🔒 Privacy & Security'
                      : tab === 'AI Preferences'
                      ? '🤖 AI Preferences'
                      : '🗑️ Danger Zone'}
                  </span>
                  {activeTab === tab && (
                    <span className="text-xs text-primary">●</span>
                  )}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {renderRight()}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;

