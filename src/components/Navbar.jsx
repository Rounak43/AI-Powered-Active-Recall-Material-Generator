import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const navLinks = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' }
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const isDashboard = ['/dashboard', '/profile', '/settings'].includes(
    location.pathname
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setAvatarOpen(false);
  }, [location.pathname]);

  const handleScrollLink = (href) => {
    if (!href.startsWith('#')) {
      navigate(href);
      return;
    }
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : 'SU';

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  const baseNavClasses =
    'fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300';

  return (
    <>
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          baseNavClasses,
          isDashboard || scrolled
            ? 'bg-surface/80 backdrop-blur-2xl border-b border-border/70 shadow-lg'
            : 'bg-transparent'
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary shadow-glow">
            <span className="font-display text-2xl text-white drop-shadow-lg">
              S
            </span>
            <div className="absolute inset-0 rounded-2xl bg-white/10 blur-md" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              SummarAI
            </span>
            <span className="text-xs font-body text-muted">
              Understand anything in seconds
            </span>
          </div>
        </Link>

        {/* Center links (landing only) */}
        {!isDashboard && (
          <div className="hidden md:flex items-center gap-8 font-body text-sm text-muted">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleScrollLink(link.href)}
                className="relative group outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <span className="transition-colors group-hover:text-white">
                  {link.label}
                </span>
                <span className="pointer-events-none absolute -bottom-1 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 md:gap-4">
          {!isDashboard && (
            <div className="hidden md:flex items-center gap-3">
              <NavLink
                to="/signin"
                className="px-4 py-2 rounded-full border border-border text-sm font-body text-muted hover:text-white hover:border-primary/70 bg-surface/50 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-glow cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-primary via-accent to-secondary text-sm font-body font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_50px_rgba(108,71,255,0.8)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Get Started
              </NavLink>
            </div>
          )}

          {isDashboard && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="hidden md:inline text-sm font-body text-muted hover:text-white underline-offset-4 hover:underline cursor-pointer"
              >
                Dashboard
              </button>
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-white hover:border-accent/80 transition-all duration-200 hover:-translate-y-[2px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgba(5,11,24,0.85)]" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setAvatarOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary via-accent to-secondary text-xs font-display font-bold text-white shadow-glow transition-all duration-200 hover:-translate-y-[2px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  aria-haspopup="menu"
                  aria-expanded={avatarOpen}
                >
                  {initials}
                </button>
                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-48 rounded-xl bg-surface/95 backdrop-blur-xl border border-border shadow-2xl py-2 z-50"
                    >
                      <div className="px-3 pb-2 border-b border-border/70 mb-1">
                        <p className="text-xs font-body text-muted">
                          Signed in as
                        </p>
                        <p className="text-sm font-body text-white truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAvatarOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full px-3 py-2 text-left text-sm font-body text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        👤 Profile
                      </button>
                      <button
                        onClick={() => {
                          setAvatarOpen(false);
                          navigate('/settings');
                        }}
                        className="w-full px-3 py-2 text-left text-sm font-body text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        ⚙️ Settings
                      </button>
                      <div className="my-1 border-t border-border/70" />
                      <button
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left text-sm font-body text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      >
                        🚪 Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Mobile hamburger */}
          {!isDashboard && (
            <button
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-white hover:border-primary/80 transition-all duration-200 hover:-translate-y-[2px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && !isDashboard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-y-0 right-0 z-30 w-72 max-w-[80%] bg-surface/95 backdrop-blur-2xl border-l border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
              <span className="font-display text-lg text-white">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-white hover:border-accent/80 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 px-5 py-4 space-y-2 font-body">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    setOpen(false);
                    handleScrollLink(link.href);
                  }}
                  className="w-full text-left text-sm text-muted hover:text-white py-2 border-b border-border/40 last:border-b-0 cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="px-5 pb-6 space-y-3">
              <NavLink
                to="/signin"
                className="block w-full text-center px-4 py-2.5 rounded-full border border-border text-sm font-body text-muted hover:text-white hover:border-primary/70 bg-surface/60 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-glow cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                className="block w-full text-center px-4 py-2.5 rounded-full bg-gradient-to-r from-primary via-accent to-secondary text-sm font-body font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_50px_rgba(108,71,255,0.8)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Get Started
              </NavLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

