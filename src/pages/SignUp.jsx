import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';

const sectionMotion = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '-50px' }
};

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Full name is required.';
    if (!form.email.includes('@') || !form.email.includes('.')) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (form.confirm !== form.password) {
      nextErrors.confirm = 'Passwords must match.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const strength = useMemo(() => {
    const value = form.password;
    let score = 0;
    if (value.length > 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#f97373', '#fb923c', '#facc15', '#4ade80'];
    return {
      score,
      label: score ? labels[score - 1] : 'Too short',
      color: score ? colors[score - 1] : '#64748b'
    };
  }, [form.password]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      login(form.name.trim(), form.email.trim());
      navigate('/dashboard');
    }, 800);
  };

  const renderField = (id, label, type, value, onChange, error, extra) => (
    <div className="space-y-1">
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="peer w-full rounded-xl border border-border bg-black/40 px-3 pt-5 pb-2 text-sm font-body text-white placeholder-transparent outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          placeholder={label}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-3 top-3 text-xs font-body text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted/70 peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-primary"
        >
          {label}
        </label>
        {extra}
      </div>
      {error && (
        <p className="text-xs font-body text-accent mt-0.5">{error}</p>
      )}
    </div>
  );

  return (
    <div className="pt-24 min-h-screen flex items-stretch">
      {/* Left panel */}
      <section
        {...sectionMotion}
        className="hidden md:flex w-2/5 flex-col justify-center px-10 lg:px-16 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary shadow-glow">
            <span className="font-display text-2xl text-white">S</span>
          </div>
          <span className="font-display text-2xl text-white">SummarAI</span>
        </div>
        <p className="font-body text-lg text-muted max-w-md">
          Understand anything in seconds.
        </p>
        <div className="space-y-2 font-body text-sm text-muted">
          <div className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-primary" />
            <span>Free forever — no credit card required</span>
          </div>
          <div className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-primary" />
            <span>Analyzes PDFs and text instantly</span>
          </div>
          <div className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-primary" />
            <span>Trusted by 10,000+ researchers</span>
          </div>
        </div>
        <div className="max-w-sm mt-6">
          <GlassCard className="relative p-5 animate-float">
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/40 via-accent/30 to-secondary/30 blur-3xl opacity-60" />
            <div className="relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-muted uppercase">
                  Summary
                </span>
                <span className="text-[11px] font-body text-muted bg-black/40 border border-border rounded-full px-2 py-0.5">
                  Research paper • 5 min
                </span>
              </div>
              <p className="text-sm font-body text-white/85">
                SummarAI condenses dense academic writing into clear,
                exam-ready notes, saving you hours per week.
              </p>
              <div className="flex gap-2 flex-wrap">
                {['Machine Learning', 'AI', 'Deep Learning'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-3 py-1 text-[11px] font-body text-white"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Right form panel */}
      <section className="flex-1 flex items-center justify-center px-6 md:px-10 py-10">
        <motion.div
          {...sectionMotion}
          className="w-full max-w-md"
        >
          <GlassCard className="p-6 md:p-7">
            <div className="space-y-1 mb-6">
              <h1 className="font-display text-2xl md:text-3xl text-white">
                Create your account
              </h1>
              <p className="font-body text-sm text-muted">
                Start for free. No credit card required.
              </p>
            </div>

            <div className="space-y-4">
              {renderField(
                'name',
                'Full Name',
                'text',
                form.name,
                (v) => handleChange('name', v),
                errors.name
              )}
              {renderField(
                'email',
                'Email Address',
                'email',
                form.email,
                (v) => handleChange('email', v),
                errors.email
              )}
              {renderField(
                'password',
                'Password',
                showPassword ? 'text' : 'password',
                form.password,
                (v) => handleChange('password', v),
                errors.password,
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-3.5 flex h-6 w-6 items-center justify-center text-muted hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}

              {/* Strength bar */}
              <div className="flex items-center gap-3">
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
                            strength.score > i ? strength.color : 'transparent'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-body text-muted min-w-[70px] text-right">
                  {strength.label}
                </span>
              </div>

              {renderField(
                'confirm',
                'Confirm Password',
                showConfirm ? 'text' : 'password',
                form.confirm,
                (v) => handleChange('confirm', v),
                errors.confirm,
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-3.5 flex h-6 w-6 items-center justify-center text-muted hover:text-white cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-4 py-3 text-sm font-body font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_45px_rgba(108,71,255,0.9)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                {submitting && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                )}
                <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[11px] font-body text-muted uppercase tracking-wide">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <button
                type="button"
                onClick={() => {
                  login('Google User', 'google@example.com');
                  navigate('/dashboard');
                }}
                className="w-full flex items-center justify-center gap-3 rounded-full glass border border-border px-4 py-2.5 text-sm font-body text-muted hover:text-white hover:border-primary/80 hover:shadow-glow transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <span className="h-5 w-5 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-xs font-bold text-[#4285F4]">G</span>
                </span>
                <span>Sign up with Google</span>
              </button>
            </div>

            <div className="mt-6 text-center text-xs font-body text-muted">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="text-primary hover:text-secondary transition-colors underline-offset-2 hover:underline cursor-pointer"
              >
                Sign In →
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  );
};

export default SignUp;

