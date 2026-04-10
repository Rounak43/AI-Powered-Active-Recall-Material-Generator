import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlignLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import FileUpload from '../components/FileUpload';
import TextInputSummarizer from '../components/TextInputSummarizer';

const TABS = [
  { id: 'file', label: '📄 Upload File', icon: <Upload className="h-4 w-4" /> },
  { id: 'text', label: '✍️ Paste Text', icon: <AlignLeft className="h-4 w-4" /> }
];

const Summarize = () => {
  const [activeTab, setActiveTab] = useState('file');

  return (
    <div className="pt-24 px-6 md:px-10 pb-20 max-w-4xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center mb-10"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,71,255,0.4)] bg-[#6C47FF]/10 px-4 py-1.5 text-xs font-body text-[#6C47FF] mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
          PDF2Recall — Active Recall Generator
        </div>

        <h1 className="font-display text-3xl md:text-5xl text-white leading-tight mb-4">
          AI{' '}
          <span className="bg-gradient-to-r from-[#6C47FF] via-[#00D4FF] to-[#FF47A3] bg-clip-text text-transparent">
            Summarizer
          </span>
        </h1>
        <p className="font-body text-sm md:text-base text-[#8b8fa8] max-w-xl mx-auto">
          Upload a <strong className="text-white">PDF</strong> or{' '}
          <strong className="text-white">DOCX</strong> file, or paste any text to instantly
          generate a clean, structured summary with key concepts.
        </p>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        <GlassCard className="p-5 md:p-8">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-[rgba(108,71,255,0.2)] pb-4 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#6C47FF]/70 ${
                  activeTab === tab.id
                    ? 'text-white bg-[#6C47FF]/20 border border-[#6C47FF]/30'
                    : 'text-[#8b8fa8] hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="summarize-tab-bg"
                    className="absolute inset-0 rounded-full bg-[#6C47FF]/10 border border-[#6C47FF]/30 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'file' ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTab === 'file' ? <FileUpload /> : <TextInputSummarizer />}
          </motion.div>
        </GlassCard>
      </motion.div>

      {/* Feature hints */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { emoji: '⚡', title: 'Instant Summaries', desc: 'Get concise summaries in seconds powered by your backend AI' },
          { emoji: '🏷️', title: 'Key Concepts', desc: 'Automatically extract the most important concepts from your content' },
          { emoji: '📊', title: 'Smart Chunking', desc: 'Large documents are intelligently chunked for thorough analysis' }
        ].map((item, i) => (
          <GlassCard
            key={item.title}
            className="p-4 flex items-start gap-3"
          >
            <span className="text-2xl">{item.emoji}</span>
            <div>
              <p className="font-body text-sm font-medium text-white mb-1">{item.title}</p>
              <p className="font-body text-xs text-[#8b8fa8] leading-relaxed">{item.desc}</p>
            </div>
          </GlassCard>
        ))}
      </motion.div>
    </div>
  );
};

export default Summarize;
