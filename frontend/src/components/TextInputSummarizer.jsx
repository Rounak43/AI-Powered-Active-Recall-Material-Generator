import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import SummaryResult from './SummaryResult';
import { useAuth } from '../context/AuthContext';
import { saveSummary } from '../services/dataService';

const BACKEND_URL = 'http://127.0.0.1:5000';
const MIN_CHARS = 50;

const TextInputSummarizer = () => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const charCount = text.length;
  const isValid = charCount >= MIN_CHARS;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/summarize-text`,
        { text },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setResult(response.data);

      // Save to Firebase
      if (user?.uid) {
        try {
          await saveSummary(user.uid, {
            type: 'text',
            title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
            summary: response.data.summary,
            detailedSummary: response.data.detailedSummary,
            keyConcepts: response.data.keyConcepts || [],
            words: Math.round(text.length / 6),
          });
        } catch (saveErr) {
          console.error("Failed to save summary to history:", saveErr);
        }
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'An unexpected error occurred. Make sure the backend is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Textarea */}
      <div className="relative">
        <textarea
          id="text-summarize-input"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
            if (result) setResult(null);
          }}
          placeholder="Paste your article, essay, research paper, lecture notes, or any text here...&#10;&#10;Minimum 50 characters required."
          rows={10}
          className="w-full rounded-2xl border border-[rgba(108,71,255,0.3)] bg-black/40 px-4 py-4 text-sm font-body text-white placeholder:text-[#8b8fa8]/60 outline-none focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] transition-all resize-y"
        />
        {/* Character count */}
        <div
          className={`flex items-center justify-between mt-2 text-[11px] font-body ${
            charCount > 0 && !isValid
              ? 'text-[#FF47A3]'
              : charCount > 8000
              ? 'text-[#FF47A3]'
              : 'text-[#8b8fa8]'
          }`}
        >
          <span>
            {charCount > 0 && !isValid
              ? `${MIN_CHARS - charCount} more characters needed`
              : isValid
              ? '✓ Ready to summarize'
              : `Min ${MIN_CHARS} characters`}
          </span>
          <span>{charCount.toLocaleString()} / 10,000</span>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3 rounded-2xl border border-[#FF47A3]/40 bg-[#FF47A3]/10 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 text-[#FF47A3] mt-0.5 flex-shrink-0" />
            <p className="font-body text-sm text-[#FF47A3]">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          id="text-summarize-submit"
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6C47FF] via-[#FF47A3] to-[#00D4FF] px-4 py-3.5 text-sm font-body font-medium text-white shadow-[0_0_25px_rgba(108,71,255,0.6)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_45px_rgba(108,71,255,0.9)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#6C47FF]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050b18]"
        >
          {loading && (
            <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
          )}
          <span>{loading ? 'Processing...' : '✨ Summarize Text'}</span>
        </button>

        {(text || result) && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(108,71,255,0.3)] bg-black/40 px-4 py-2 text-sm font-body text-[#8b8fa8] hover:text-white hover:border-[#6C47FF]/80 cursor-pointer transition-all"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Progress bar while loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
              <div className="h-full w-1/3 bg-gradient-to-r from-[#6C47FF] via-[#00D4FF] to-[#FF47A3] animate-progress" />
            </div>
            <p className="text-center text-[11px] font-body text-[#8b8fa8]">
              Chunking and summarizing your text
              <span className="animate-ellipsis" />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && <SummaryResult data={result} />}
      </AnimatePresence>
    </div>
  );
};

export default TextInputSummarizer;
