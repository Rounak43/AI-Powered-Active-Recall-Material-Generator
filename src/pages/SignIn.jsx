import React, { useState } from 'react';
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

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      const name = email.split('@')[0] || 'User';
      login(name, email.trim());
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
      {/* Left panel (same visuals as signup) */}
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
            <span>Save your analyses and revisit them anytime.</span>
          </div>
          <div className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-primary" />
            <span>Switch seamlessly between devices.</span>
          </div>
          <div className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 text-primary" />
            <span>Stay in sync with your research workflow.</span>
          </div>
        </div>
      </section>

      {/* Right form */}
      <section className="flex-1 flex items-center justify-center px-6 md:px-10 py-10">
        <motion.div
          {...sectionMotion}
          className="w-full max-w-md"
        >
          <GlassCard className="p-6 md:p-7">
            <div className="space-y-1 mb-6">
              <h1 className="font-display text-2xl md:text-3xl text-white">
                Welcome back
              </h1>
              <p className="font-body text-sm text-muted">
                Sign in to continue to SummarAI.
              </p>
            </div>

            <div className="space-y-4">
              {renderField(
                'signin-email',
                'Email Address',
                'email',
                email,
                setEmail,
                errors.email
              )}

              {renderField(
                'signin-password',
                'Password',
                showPassword ? 'text' : 'password',
                password,
                setPassword,
                errors.password,
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-3.5 flex h-6 w-6 items-center justify-center text-muted hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}

              <div className="flex items-center justify-between text-xs font-body text-muted">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span
                    className={`flex h-4 w-7 items-center rounded-full border border-border px-0.5 transition-all ${
                      remember ? 'bg-primary/80 border-primary' : 'bg-black/40'
                    }`}
                  >
                    <span
                      className={`h-3 w-3 rounded-full bg-white transition-transform ${
                        remember ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </span>
                  <span>Remember me</span>
                </button>
                <button
                  type="button"
                  className="text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-4 py-3 text-sm font-body font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_45px_rgba(108,71,255,0.9)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/80 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                {submitting && (
                  <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                )}
                <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
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
                <span>Sign in with Google</span>
              </button>
            </div>

            <div className="mt-6 text-center text-xs font-body text-muted">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-primary hover:text-secondary transition-colors underline-offset-2 hover:underline cursor-pointer"
              >
                Sign Up →
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  );
};

export default SignIn;

