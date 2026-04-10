import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';

const typewriterPhrases = [
  { text: 'Instant Summaries', color: 'text-primary' },
  { text: 'Smart Insights', color: 'text-secondary' },
  { text: 'Study Questions', color: 'text-accent' }
];


const featureCards = [
  {
    icon: '🧠',
    title: 'AI Summarization',
    description: 'Concise, accurate summaries preserving all key points.'
  },
  {
    icon: '🏷️',
    title: 'Topic Extraction',
    description: 'Automatically surface the most important concepts.'
  },
  {
    icon: '❓',
    title: 'Smart Questions',
    description: 'Generate quiz questions to test your understanding.'
  },
  {
    icon: '📄',
    title: 'PDF Support',
    description: 'Upload any text-based PDF document up to 25MB.'
  },
  {
    icon: '✍️',
    title: 'Text Input',
    description:
      'Paste articles, papers, or any text for instant analysis and insights.'
  },
  {
    icon: '🔒',
    title: '100% Private',
    description:
      'Documents are processed and never stored on our servers at rest.'
  }
];


const sectionMotion = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '-50px' }
};

const Landing = () => {
  const navigate = useNavigate();
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [scrollTopVisible, setScrollTopVisible] = useState(false);

  // Typewriter
  useEffect(() => {
    const fullText = typewriterPhrases[currentPhrase].text;
    const typingSpeed = isDeleting ? 40 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting && displayedText.length < fullText.length) {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      } else if (!isDeleting && displayedText.length === fullText.length) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && displayedText.length > 0) {
        setDisplayedText(fullText.slice(0, displayedText.length - 1));
      } else if (isDeleting && displayedText.length === 0) {
        setIsDeleting(false);
        setCurrentPhrase((prev) => (prev + 1) % typewriterPhrases.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentPhrase]);

  // Scroll to top visibility
  useEffect(() => {
    const onScroll = () => {
      setScrollTopVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  const currentColorClass = typewriterPhrases[currentPhrase].color;

  return (
    <div id="top" className="pt-24">
      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center px-6 md:px-10">
        <motion.div
          {...sectionMotion}
          transition={{ ...sectionMotion.transition, delay: 0.1 }}
          className="flex flex-col items-center text-center max-w-3xl gap-8"
        >

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="font-display text-[40px] md:text-[72px] leading-tight text-white">
              <span>Turn Any Document Into</span>
              <br />
              <span
                className={`relative inline-block ${currentColorClass} drop-shadow`}
              >
                {displayedText}
                <span className="inline-block w-[2px] h-[1.1em] bg-white ml-1 align-middle animate-cursor" />
              </span>
            </h1>
            <p className="font-body text-base md:text-lg text-muted max-w-xl mx-auto">
              Upload any PDF or paste text. Get AI-powered summaries, key topic
              extraction, and comprehension questions in seconds.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-primary via-secondary to-accent text-sm md:text-base font-body font-medium text-white shadow-glow transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_50px_rgba(108,71,255,0.9)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Get Started
            </button>
          </div>


          {/* Hero card */}
          <div className="relative mt-6 w-full max-w-xl">
            <div className="absolute -inset-8 bg-gradient-to-br from-primary/40 via-accent/30 to-secondary/30 blur-3xl opacity-70" />
            <GlassCard className="relative p-5 md:p-6 space-y-4 animate-float">
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-muted uppercase tracking-wide">
                  📝 Summary
                </span>
                <span className="text-[11px] font-body text-muted bg-black/30 border border-border/60 rounded-full px-2 py-0.5">
                  327 words • 4 min read
                </span>
              </div>
              <p className="text-sm font-body text-white/80 leading-relaxed">
                This paper introduces core concepts of supervised, unsupervised,
                and reinforcement learning, highlighting how modern neural
                architectures learn from data and feedback to power real-world
                AI systems.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Machine Learning', 'AI', 'Deep Learning'].map((tag, i) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-[11px] font-body text-white bg-gradient-to-r from-primary via-secondary to-accent/90"
                    style={{
                      backgroundImage:
                        i === 0
                          ? 'linear-gradient(135deg, #6C47FF, #00D4FF)'
                          : i === 1
                          ? 'linear-gradient(135deg, #00D4FF, #4ade80)'
                          : 'linear-gradient(135deg, #FF47A3, #6C47FF)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 border-t border-border/60 pt-3">
                <button className="flex w-full items-center justify-between text-sm font-body text-white/90 hover:text-primary transition-colors cursor-pointer">
                  <span>What is supervised learning?</span>
                  <span className="text-xs text-muted">▼</span>
                </button>
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </section>


      {/* Features */}
      <section
        {...sectionMotion}
        id="features"
        className="mx-auto max-w-6xl px-6 py-16 md:py-20 space-y-10"
      >
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-white">
            Everything You Need to Understand Any Document
          </h2>
          <p className="font-body text-sm md:text-base text-muted">
            Powered by advanced language models for deep document understanding.
          </p>
        </div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                delay: i * 0.05
              }}
              viewport={{ once: true, margin: '-50px' }}
            >
              <GlassCard className="h-full p-5 md:p-6 hover:-translate-y-1.5 hover:shadow-glow hover:border-primary/80 transition-all duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary mb-4 text-xl">
                  {card.icon}
                </div>
                <h3 className="font-display text-lg text-white mb-2">
                  {card.title}
                </h3>
                <p className="font-body text-sm text-muted">
                  {card.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        {...sectionMotion}
        id="how-it-works"
        className="mx-auto max-w-5xl px-6 py-16 md:py-20 space-y-10"
      >
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-white">
            Three Steps to Instant Understanding
          </h2>
        </div>
        <div className="relative flex flex-col md:flex-row items-stretch md:items-start gap-10 md:gap-6">
          {/* Dashed line */}
          <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-px border-t border-dashed border-muted/50">
            <div className="h-[2px] w-32 bg-gradient-to-r from-primary via-secondary to-accent animate-dash" />
          </div>
          {[
            {
              icon: '📤',
              title: 'Upload or Paste',
              description:
                'Drop your PDF or paste any text content to get started.'
            },
            {
              icon: '🤖',
              title: 'AI Analyzes',
              description:
                'Our AI engine processes and understands your document in-depth.'
            },
            {
              icon: '✅',
              title: 'Get Results',
              description:
                'Receive summary, topics, and questions instantly in one view.'
            }
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                delay: i * 0.1
              }}
              viewport={{ once: true, margin: '-50px' }}
              className="flex-1 flex flex-col items-center text-center gap-4"
            >
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg">
                  <div className="h-full w-full rounded-full border-2 border-transparent bg-gradient-to-br from-primary via-secondary to-accent p-[2px]">
                    <div className="h-full w-full rounded-full bg-bg flex items-center justify-center font-display text-2xl text-white">
                      {i + 1}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-2xl">
                  {step.icon}
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="font-display text-xl text-white">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-muted max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Scroll to top button */}
      {scrollTopVisible && (
        <motion.button
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25 }}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })
          }
          className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary via-secondary to-accent text-white shadow-glow hover:-translate-y-1 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label="Scroll to top"
        >
          ↑
        </motion.button>
      )}
    </div>
  );
};

export default Landing;

