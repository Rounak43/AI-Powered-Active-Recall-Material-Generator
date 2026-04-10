import React from 'react';
import { Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const linkClass =
    'text-sm text-muted hover:text-white transition-colors cursor-pointer';

  return (
    <footer className="mt-20 border-t border-border/70 bg-black/20">
      <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary shadow-glow">
              <span className="font-display text-xl text-white">S</span>
            </div>
            <span className="font-display text-lg font-bold text-white">
              SummarAI
            </span>
          </div>
          <p className="text-sm text-muted max-w-xs">
            Understand any document in seconds with AI-powered summaries, key
            topics, and study questions.
          </p>
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full glass text-muted hover:text-white hover:shadow-glow transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full glass text-muted hover:text-white hover:shadow-glow transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              aria-label="GitHub"
            >
              <Github size={18} />
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full glass text-muted hover:text-white hover:shadow-glow transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-sm text-white uppercase tracking-wide">
            Product
          </h3>
          <nav className="flex flex-col gap-2">
            <span className={linkClass}>Features</span>
            <span className={linkClass}>How It Works</span>
            <span className={linkClass}>Changelog</span>
          </nav>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-sm text-white uppercase tracking-wide">
            Company
          </h3>
          <nav className="flex flex-col gap-2">
            <span className={linkClass}>Blog</span>
            <span className={linkClass}>Careers</span>
            <span className={linkClass}>Press</span>
          </nav>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-sm text-white uppercase tracking-wide">
            Legal
          </h3>
          <nav className="flex flex-col gap-2">
            <span className={linkClass}>Privacy Policy</span>
            <span className={linkClass}>Terms of Service</span>
            <span className={linkClass}>Cookie Policy</span>
          </nav>
        </div>
      </div>

    </footer>
  );
};

export default Footer;

