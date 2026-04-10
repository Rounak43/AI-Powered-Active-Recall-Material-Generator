import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Copy, CheckCircle, AlertTriangle, Shield, Users,
  ChevronRight, ChevronLeft, Eye, EyeOff, Trash2, RefreshCw,
  User, Building2, Mail, Phone, Globe, Zap, FileText,
  BarChart2, Lock, XCircle, Clock, Check, X
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { cn } from '../utils/cn';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Identity',    icon: User },
  { id: 2, label: 'Usage',       icon: Zap },
  { id: 3, label: 'Config',      icon: Shield },
  { id: 4, label: 'Review',      icon: CheckCircle },
];

const CLIENT_TYPES = ['Individual', 'Startup', 'Company', 'Student Project', 'Internal'];
const ACCESS_TYPES = ['Text Only', 'File Upload Only', 'Both'];
const EXPIRY_OPTIONS = ['30 days', '90 days', '1 year', 'No Expiry'];
const USAGE_OPTIONS = ['< 100', '100–500', '500–1000', '1000–5000', '5000+'];

const BACKEND = 'http://127.0.0.1:5000';
const LS_KEY = 'pdf2recall_api_clients';

// ─────────────────────────────────────────────
// Mock API layer (localStorage fallback)
// ─────────────────────────────────────────────
function generateMockKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 40; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return `pdf2recall_sk_${result}`;
}

const mockApi = {
  getClients() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  },
  saveClients(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  },
  register(payload) {
    const clients = mockApi.getClients();
    const apiKey = generateMockKey();
    const newClient = {
      id: Date.now(),
      client_name:            payload.client_name,
      company_name:           payload.company_name,
      email:                  payload.email,
      phone:                  payload.phone,
      client_type:            payload.client_type,
      use_case:               payload.use_case,
      expected_monthly_usage: payload.expected_monthly_usage,
      access_type:            payload.access_type,
      application_name:       payload.application_name,
      website_url:            payload.website_url,
      notes:                  payload.notes,
      ip_whitelist:           payload.ip_whitelist,
      expiry_preference:      payload.expiry_preference,
      api_key_prefix:         apiKey.substring(0, 22),
      status:                 'active',
      created_at:             new Date().toISOString(),
      usage_count:            0,
      last_used_at:           null,
    };
    clients.unshift(newClient);
    mockApi.saveClients(clients);
    return {
      message:      'API client registered successfully',
      clientId:     newClient.id,
      apiKey,
      apiKeyPrefix: newClient.api_key_prefix,
      status:       'active',
    };
  },
  revoke(id) {
    const clients = mockApi.getClients().map(c =>
      c.id === id ? { ...c, status: 'revoked' } : c
    );
    mockApi.saveClients(clients);
  },
  regenerate(id) {
    const apiKey = generateMockKey();
    const prefix = apiKey.substring(0, 22);
    const clients = mockApi.getClients().map(c =>
      c.id === id ? { ...c, status: 'active', api_key_prefix: prefix } : c
    );
    mockApi.saveClients(clients);
    return { clientId: id, apiKey, apiKeyPrefix: prefix, status: 'active' };
  },
};

async function apiCall(path, options = {}) {
  try {
    const res = await fetch(`${BACKEND}${path}`, { ...options, signal: AbortSignal.timeout(3000) });
    return { ok: res.ok, data: await res.json(), usedBackend: true };
  } catch {
    return { ok: false, usedBackend: false };
  }
}

const EMPTY_FORM = {
  fullName: '', companyName: '', email: '', phone: '',
  clientType: '', useCase: '', expectedUsage: '', accessType: '',
  appName: '', websiteUrl: '', notes: '', ipWhitelist: '',
  expiryPreference: 'No Expiry', agreed: false,
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status }) {
  const map = {
    active:  { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', label: 'Active' },
    revoked: { color: 'text-red-400 bg-red-400/10 border-red-400/30',             label: 'Revoked' },
    expired: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',       label: 'Expired' },
  };
  const s = map[status] || map.active;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-body', s.color)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-body text-muted">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] font-body text-muted/60">{hint}</p>}
    </div>
  );
}

function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-border bg-black/40 px-3.5 py-2.5 text-sm font-body text-white placeholder:text-muted/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all',
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-border bg-black/40 px-3.5 py-2.5 text-sm font-body text-white placeholder:text-muted/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none',
        className
      )}
      {...props}
    />
  );
}

function PillGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-body transition-all cursor-pointer',
            value === opt
              ? 'border-primary bg-primary/20 text-white shadow-[0_0_12px_rgba(108,71,255,0.4)]'
              : 'border-border text-muted hover:border-primary/60 hover:text-white'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 1 — Identity
// ─────────────────────────────────────────────
function StepIdentity({ form, set }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Full Name / Contact Person" required>
          <Input
            placeholder="e.g. Rahul Sharma"
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
          />
        </Field>
        <Field label="Company / Individual Name" required>
          <Input
            placeholder="e.g. Acme Corp or John Doe"
            value={form.companyName}
            onChange={e => set('companyName', e.target.value)}
          />
        </Field>
        <Field label="Email Address" required>
          <Input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
        </Field>
        <Field label="Phone Number" required>
          <Input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Client Type" required>
        <PillGroup options={CLIENT_TYPES} value={form.clientType} onChange={v => set('clientType', v)} />
      </Field>
      <Field label="Application Name" required hint="The name of your product or app that will use this API">
        <Input
          placeholder="e.g. StudyBuddy, Notion Extension…"
          value={form.appName}
          onChange={e => set('appName', e.target.value)}
        />
      </Field>
      <Field label="Website / Callback URL" hint="Your app's domain or landing page (optional)">
        <Input
          type="url"
          placeholder="https://yourapp.com"
          value={form.websiteUrl}
          onChange={e => set('websiteUrl', e.target.value)}
        />
      </Field>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 2 — Usage
// ─────────────────────────────────────────────
function StepUsage({ form, set }) {
  return (
    <div className="space-y-5">
      <Field label="Intended Use Case" required hint="Describe what you'll use the summarization API for">
        <Textarea
          rows={4}
          placeholder="e.g. We will use this to auto-summarize student notes uploaded as PDFs in our e-learning platform…"
          value={form.useCase}
          onChange={e => set('useCase', e.target.value)}
        />
      </Field>
      <Field label="Expected Monthly API Requests" required>
        <PillGroup options={USAGE_OPTIONS} value={form.expectedUsage} onChange={v => set('expectedUsage', v)} />
      </Field>
      <Field label="Preferred API Access Type" required hint="Which summarization endpoints will you use?">
        <PillGroup options={ACCESS_TYPES} value={form.accessType} onChange={v => set('accessType', v)} />
      </Field>
      <Field label="Notes / Additional Requirements" hint="Any special needs, custom rate limits, etc.">
        <Textarea
          rows={3}
          placeholder="Optional — anything else you'd like to mention."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </Field>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 3 — Config
// ─────────────────────────────────────────────
function StepConfig({ form, set }) {
  return (
    <div className="space-y-5">
      <Field label="Key Expiry Preference" required>
        <PillGroup options={EXPIRY_OPTIONS} value={form.expiryPreference} onChange={v => set('expiryPreference', v)} />
      </Field>
      <Field label="IP Whitelist" hint="Comma-separated IPs to allow (leave blank to allow all)">
        <Input
          placeholder="e.g. 203.0.113.1, 198.51.100.0/24"
          value={form.ipWhitelist}
          onChange={e => set('ipWhitelist', e.target.value)}
        />
      </Field>

      {/* Terms */}
      <div className="rounded-xl border border-border bg-black/30 p-4 space-y-3">
        <p className="text-xs font-body text-muted font-medium uppercase tracking-wider">API Usage Policy</p>
        <ul className="space-y-1.5 text-xs font-body text-muted/80 list-disc list-inside">
          <li>Fair usage limits apply — do not abuse the API endpoint</li>
          <li>API keys are non-transferable and must be kept confidential</li>
          <li>Summaries generated are for your use only — do not re-sell</li>
          <li>We reserve the right to revoke keys violating these terms</li>
          <li>Rate limiting may apply based on your usage tier</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={() => set('agreed', !form.agreed)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-body transition-all cursor-pointer',
          form.agreed
            ? 'border-primary bg-primary/10 text-white'
            : 'border-border text-muted hover:border-primary/50'
        )}
      >
        <span className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all',
          form.agreed ? 'border-primary bg-primary text-white' : 'border-border'
        )}>
          {form.agreed && <Check size={12} />}
        </span>
        I agree to the API usage policies and fair usage terms
        <span className="ml-auto text-accent text-xs">*</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 4 — Review
// ─────────────────────────────────────────────
function StepReview({ form }) {
  const rows = [
    { icon: User,       label: 'Full Name',      val: form.fullName },
    { icon: Building2,  label: 'Company',         val: form.companyName },
    { icon: Mail,       label: 'Email',           val: form.email },
    { icon: Phone,      label: 'Phone',           val: form.phone },
    { icon: Users,      label: 'Client Type',     val: form.clientType },
    { icon: FileText,   label: 'App Name',        val: form.appName },
    { icon: Globe,      label: 'Website',         val: form.websiteUrl || '—' },
    { icon: Zap,        label: 'Access Type',     val: form.accessType },
    { icon: BarChart2,  label: 'Monthly Usage',   val: form.expectedUsage },
    { icon: Clock,      label: 'Expiry',          val: form.expiryPreference },
    { icon: Shield,     label: 'IP Whitelist',    val: form.ipWhitelist || 'All IPs allowed' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs font-body text-muted">Review your details before generating the API key. You can go back to make changes.</p>
      <div className="divide-y divide-border/50">
        {rows.map(({ icon: Icon, label, val }) => (
          <div key={label} className="flex items-start gap-3 py-2.5">
            <Icon size={14} className="text-primary mt-0.5 flex-shrink-0" />
            <span className="text-xs font-body text-muted w-28 flex-shrink-0">{label}</span>
            <span className="text-xs font-body text-white break-all">{val}</span>
          </div>
        ))}
      </div>

      {/* Use-case */}
      <div className="rounded-xl bg-black/30 border border-border p-3 space-y-1">
        <p className="text-[11px] font-body text-muted">Use Case</p>
        <p className="text-xs font-body text-white/90">{form.useCase}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// API Key Display Modal
// ─────────────────────────────────────────────
function ApiKeyModal({ keyData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(keyData.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-lg"
      >
        <GlassCard className="p-6 space-y-5 border border-primary/40">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Key size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg text-white">API Key Generated!</h2>
              <p className="text-xs font-body text-muted">Client #{keyData.clientId} registered successfully</p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <p className="text-xs font-body text-amber-300 font-medium">Save this key now — it won't be shown again!</p>
              <p className="text-[11px] font-body text-amber-200/70">
                For security, the full API key is only displayed once. Copy and store it safely.
              </p>
            </div>
          </div>

          {/* Key Display */}
          <div className="space-y-2">
            <p className="text-xs font-body text-muted">Your API Key</p>
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-black/50 px-3 py-3">
              <code className="flex-1 text-xs font-mono text-primary break-all select-all">
                {visible ? keyData.apiKey : keyData.apiKey.replace(/(?<=.{20}).(?=.{8})/g, '•')}
              </code>
              <button
                type="button"
                onClick={() => setVisible(v => !v)}
                className="text-muted hover:text-white transition-colors ml-1 flex-shrink-0"
                title={visible ? 'Hide key' : 'Show key'}
              >
                {visible ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                onClick={copy}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-body transition-all flex-shrink-0',
                  copied
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30'
                )}
              >
                {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-black/30 border border-border p-3 space-y-1">
              <p className="text-[11px] font-body text-muted">Key Prefix</p>
              <p className="text-xs font-mono text-white">{keyData.apiKeyPrefix}</p>
            </div>
            <div className="rounded-xl bg-black/30 border border-border p-3 space-y-1">
              <p className="text-[11px] font-body text-muted">Status</p>
              <StatusBadge status="active" />
            </div>
          </div>

          {/* Usage Example */}
          <div className="space-y-1.5">
            <p className="text-xs font-body text-muted">Example Usage</p>
            <div className="rounded-xl bg-black/60 border border-border p-3 overflow-x-auto">
              <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre-wrap break-all">{`curl -X POST http://127.0.0.1:5000/api/summarize-text \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${keyData.apiKey}" \\
  -d '{"text":"Your text here..."}'`}</pre>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary py-2.5 text-sm font-body font-medium text-white shadow-glow hover:-translate-y-[2px] hover:shadow-[0_0_35px_rgba(108,71,255,0.8)] transition-all cursor-pointer"
          >
            I've Saved My Key — Close
          </button>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Client Table
// ─────────────────────────────────────────────
function ClientTable({ clients, onRevoke, onRegenerate, loading }) {
  const [revokeId, setRevokeId] = useState(null);
  const [regenResult, setRegenResult] = useState(null);

  const confirmRevoke = async (id) => {
    await onRevoke(id);
    setRevokeId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs font-body text-muted">Loading clients…</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="h-14 w-14 rounded-2xl bg-black/40 border border-border flex items-center justify-center">
          <Users size={24} className="text-muted" />
        </div>
        <p className="font-body text-sm text-white">No API clients registered yet</p>
        <p className="text-xs font-body text-muted">Register your first client above to get started.</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {regenResult && (
          <ApiKeyModal keyData={regenResult} onClose={() => setRegenResult(null)} />
        )}
        {revokeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <GlassCard className="p-6 space-y-4 border border-red-500/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <XCircle size={18} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-base text-white">Revoke API Key?</h3>
                    <p className="text-xs font-body text-muted">This cannot be undone.</p>
                  </div>
                </div>
                <p className="text-xs font-body text-muted">
                  The client will immediately lose API access. You can regenerate a new key later.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRevokeId(null)}
                    className="flex-1 rounded-full border border-border py-2 text-sm font-body text-muted hover:text-white hover:border-primary/60 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmRevoke(revokeId)}
                    className="flex-1 rounded-full bg-red-600 py-2 text-sm font-body text-white hover:bg-red-500 transition-all cursor-pointer"
                  >
                    Revoke Key
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[700px] text-xs font-body">
          <thead>
            <tr className="border-b border-border/50">
              {['Client', 'Email', 'Access Type', 'Key Prefix', 'Usage', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="text-left py-3 px-3 text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {clients.map((c, i) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-3">
                  <div>
                    <p className="text-white font-medium">{c.client_name}</p>
                    <p className="text-muted text-[11px]">{c.company_name}</p>
                  </div>
                </td>
                <td className="py-3 px-3 text-muted">{c.email}</td>
                <td className="py-3 px-3">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">{c.access_type || '—'}</span>
                </td>
                <td className="py-3 px-3">
                  <code className="text-primary text-[11px]">{c.api_key_prefix}…</code>
                </td>
                <td className="py-3 px-3 text-muted">{c.usage_count ?? 0} req</td>
                <td className="py-3 px-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="py-3 px-3 text-muted">{formatDate(c.created_at)}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => setRevokeId(c.id)}
                        title="Revoke key"
                        className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 size={11} /> Revoke
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await onRegenerate(c.id);
                          if (res) setRegenResult(res);
                        }}
                        title="Regenerate key"
                        className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        <RefreshCw size={11} /> Regenerate
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Validate steps
// ─────────────────────────────────────────────
function validateStep(step, form) {
  const errs = {};
  if (step === 1) {
    if (!form.fullName.trim())    errs.fullName    = 'Required';
    if (!form.companyName.trim()) errs.companyName = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                  errs.email       = 'Valid email required';
    if (!form.phone.trim())       errs.phone       = 'Required';
    if (!form.clientType)         errs.clientType  = 'Required';
    if (!form.appName.trim())     errs.appName     = 'Required';
  }
  if (step === 2) {
    if (!form.useCase.trim())       errs.useCase      = 'Required';
    if (!form.expectedUsage)        errs.expectedUsage = 'Required';
    if (!form.accessType)           errs.accessType    = 'Required';
  }
  if (step === 3) {
    if (!form.agreed)               errs.agreed = 'You must agree to the terms';
  }
  return errs;
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
const ApiAdmin = () => {
  const [activeView, setActiveView] = useState('register'); // 'register' | 'clients'
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [newKey, setNewKey] = useState(null);

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState('');

  const set = useCallback((field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }, []);

  // ── Fetch clients ──
  const fetchClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError('');
    try {
      const { ok, data, usedBackend } = await apiCall('/api/clients');
      if (usedBackend && ok) {
        setClients(data.clients || []);
      } else {
        // Fall back to localStorage mock
        setClients(mockApi.getClients());
      }
    } catch {
      setClients(mockApi.getClients());
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'clients') fetchClients();
  };

  // ── Navigation ──
  const next = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => Math.min(s + 1, 4));
  };

  const prev = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 1));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        client_name:             form.fullName,
        company_name:            form.companyName,
        email:                   form.email,
        phone:                   form.phone,
        client_type:             form.clientType,
        use_case:                form.useCase,
        expected_monthly_usage:  form.expectedUsage,
        access_type:             form.accessType,
        application_name:        form.appName,
        website_url:             form.websiteUrl,
        notes:                   form.notes,
        ip_whitelist:            form.ipWhitelist,
        expiry_preference:       form.expiryPreference,
      };

      const { ok, data, usedBackend } = await apiCall('/api/clients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let result;
      if (usedBackend && ok) {
        result = data;
      } else {
        // Use mock layer
        result = mockApi.register(payload);
      }

      setNewKey(result);
      setForm(EMPTY_FORM);
      setStep(1);
    } catch (e) {
      setSubmitError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Revoke / Regenerate ──
  const handleRevoke = async (id) => {
    const { ok, usedBackend } = await apiCall(`/api/clients/revoke/${id}`, { method: 'POST' });
    if (!usedBackend || !ok) mockApi.revoke(id);
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: 'revoked' } : c));
  };

  const handleRegenerate = async (id) => {
    const { ok, data, usedBackend } = await apiCall(`/api/clients/regenerate/${id}`, { method: 'POST' });
    let result;
    if (usedBackend && ok) {
      result = data;
    } else {
      result = mockApi.regenerate(id);
    }
    setClients(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'active', api_key_prefix: result.apiKeyPrefix } : c
    ));
    return result;
  };

  const stepComp = [null, StepIdentity, StepUsage, StepConfig, StepReview][step];

  return (
    <div className="pt-24 pb-20 px-6 md:px-10 max-w-5xl mx-auto">
      {/* API Key modal */}
      <AnimatePresence>
        {newKey && <ApiKeyModal keyData={newKey} onClose={() => { setNewKey(null); handleViewChange('clients'); }} />}
      </AnimatePresence>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 space-y-3"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-body text-primary">
          <Key size={12} />
          API Client Management
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-white">
          Developer{' '}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            API Access
          </span>
        </h1>
        <p className="font-body text-sm text-muted max-w-lg mx-auto">
          Register external clients, issue secure API keys, and manage access to the PDF2Recall summarization APIs.
        </p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { icon: Users,  label: 'Total Clients',     val: clients.length || '—' },
          { icon: Check,  label: 'Active Keys',       val: clients.filter(c => c.status === 'active').length  || (clients.length ? 0 : '—') },
          { icon: Lock,   label: 'Revoked',           val: clients.filter(c => c.status === 'revoked').length || (clients.length ? 0 : '—') },
          { icon: Zap,    label: 'Total API Calls',   val: clients.reduce((a, c) => a + (c.usage_count || 0), 0) || '—' },
        ].map(({ icon: Icon, label, val }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-primary" />
            </div>
            <div>
              <p className="font-display text-xl text-white">{val}</p>
              <p className="text-[11px] font-body text-muted">{label}</p>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { id: 'register', label: '+ Register Client', icon: Key },
          { id: 'clients',  label: 'All Clients',       icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleViewChange(id)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-body transition-all cursor-pointer border',
              activeView === id
                ? 'bg-gradient-to-r from-primary/20 to-accent/20 border-primary/40 text-white shadow-[0_0_15px_rgba(108,71,255,0.3)]'
                : 'border-border text-muted hover:text-white hover:border-primary/40'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── REGISTER VIEW ── */}
      <AnimatePresence mode="wait">
        {activeView === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 md:p-8">
              {/* Step indicators */}
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-4 left-0 right-0 h-[2px] bg-border -z-0" />
                <div
                  className="absolute top-4 left-0 h-[2px] bg-gradient-to-r from-primary to-accent -z-0 transition-all duration-500"
                  style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
                {STEPS.map(s => {
                  const Icon = s.icon;
                  const done = step > s.id;
                  const active = step === s.id;
                  return (
                    <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
                      <div className={cn(
                        'h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                        done ? 'bg-primary border-primary' : active ? 'bg-primary/20 border-primary' : 'bg-bg border-border'
                      )}>
                        {done ? <Check size={14} className="text-white" /> : <Icon size={14} className={active ? 'text-primary' : 'text-muted'} />}
                      </div>
                      <span className={cn('text-[11px] font-body', active ? 'text-white' : 'text-muted')}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {stepComp && React.createElement(stepComp, { form, set })}
                </motion.div>
              </AnimatePresence>

              {/* Validation errors summary */}
              {Object.keys(errors).length > 0 && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <p className="text-xs font-body text-red-400">Please fill in all required fields before continuing.</p>
                </div>
              )}

              {/* Submit error */}
              {submitError && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <XCircle size={14} className="text-red-400 mt-0.5" />
                  <p className="text-xs font-body text-red-400">{submitError}</p>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-border/50">
                <button
                  type="button"
                  onClick={prev}
                  disabled={step === 1}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-body text-muted hover:text-white hover:border-primary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={15} /> Back
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-5 py-2.5 text-sm font-body font-medium text-white shadow-glow hover:-translate-y-[2px] hover:shadow-[0_0_35px_rgba(108,71,255,0.8)] transition-all cursor-pointer"
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-6 py-2.5 text-sm font-body font-medium text-white shadow-glow hover:-translate-y-[2px] hover:shadow-[0_0_35px_rgba(108,71,255,0.8)] disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <><span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin" /> Generating…</>
                    ) : (
                      <><Key size={15} /> Generate API Key</>
                    )}
                  </button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ── CLIENTS VIEW ── */}
        {activeView === 'clients' && (
          <motion.div
            key="clients"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-xl text-white">Registered Clients</h2>
                  <p className="text-xs font-body text-muted mt-0.5">Full API keys are never exposed here.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchClients}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-body text-muted hover:text-white hover:border-primary/60 transition-all cursor-pointer"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>

              {clientsError && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5" />
                  <p className="text-xs font-body text-amber-300">{clientsError}</p>
                </div>
              )}

              <ClientTable
                clients={clients}
                onRevoke={handleRevoke}
                onRegenerate={handleRegenerate}
                loading={clientsLoading}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Curl Reference */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={15} className="text-primary" />
            <h3 className="font-display text-base text-white">Quick Integration Reference</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: 'Summarize Text',
                code: `curl -X POST http://127.0.0.1:5000/api/summarize-text \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"text":"Your text here..."}'`,
              },
              {
                label: 'Summarize File',
                code: `curl -X POST http://127.0.0.1:5000/api/summarize \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "file=@/path/to/document.pdf"`,
              },
            ].map(({ label, code }) => (
              <div key={label} className="space-y-2">
                <p className="text-xs font-body text-muted">{label}</p>
                <div className="rounded-xl bg-black/60 border border-border p-3 overflow-x-auto">
                  <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre">{code}</pre>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ApiAdmin;
