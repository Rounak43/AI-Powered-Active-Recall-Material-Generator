import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, AlertCircle, RefreshCcw, FileText } from 'lucide-react';
import GlassCard from './GlassCard';
import SummaryResult from './SummaryResult';
import { useAuth } from '../context/AuthContext';
import { saveSummary } from '../services/dataService';
import { analyzeFull } from '../services/analyzeService';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const FileUpload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const isValid = (f) => {
    if (!f) return false;
    const ext = f.name.split('.').pop().toLowerCase();
    return ext === 'pdf' || ext === 'docx';
  };

  const handleFile = (f) => {
    if (!isValid(f)) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeFull(file, {
        mode: 'medium',
        flashcardCount: 10,
        quizCount: 5
      });

      setResult(data);

      // Save to Firebase
      if (user?.uid) {
        try {
          await saveSummary(user.uid, {
            type: 'pdf',
            title: file.name,
            summary: data.summary,
            detailedSummary: data.detailedSummary,
            keyConcepts: data.keyConcepts || data.keywords || [],
            flashcards: data.flashcards || [],
            quizQuestions: data.quizQuestions || [],
            words: data.summary_word_count || (data.summary ? data.summary.split(' ').length : 0),
          });
        } catch (saveErr) {
          console.error("Failed to save summary to history:", saveErr);
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
          file
            ? 'border-[#6C47FF]/60 bg-[#6C47FF]/[0.06] cursor-default'
            : dragging
            ? 'border-[#6C47FF] bg-[#6C47FF]/10 scale-[1.01] cursor-copy'
            : 'border-[rgba(108,71,255,0.3)] bg-black/40 hover:border-[#6C47FF]/60 hover:bg-[#6C47FF]/[0.04] cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={dragging ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ${
              file 
                ? 'bg-gradient-to-br from-[#00D4FF] to-[#6C47FF] shadow-[0_0_25px_rgba(0,212,255,0.4)]' 
                : 'bg-gradient-to-br from-[#6C47FF] via-[#00D4FF] to-[#FF47A3] shadow-[0_0_25px_rgba(108,71,255,0.4)]'
            }`}
          >
            {file ? (
              <FileText className="h-8 w-8 text-white" />
            ) : (
              <CloudUpload className="h-8 w-8 text-white" />
            )}
          </motion.div>

          {file ? (
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="font-body text-sm font-medium text-white max-w-[250px] truncate">
                {file.name}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-[#8b8fa8] uppercase tracking-wider">
                  {file.name.split('.').pop()}
                </span>
                <span className="text-[10px] text-[#8b8fa8]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-body text-[#FF47A3] hover:text-[#ff6eb3] transition-colors bg-[#FF47A3]/10 px-3 py-1 rounded-full border border-[#FF47A3]/20"
              >
                <RefreshCcw className="h-3 w-3" />
                Remove
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="font-body text-sm text-white font-medium">
                  Drag & drop your file here
                </p>
                <p className="font-body text-xs text-[#8b8fa8] mt-1">
                  or click to browse
                </p>
              </div>
              <span className="rounded-full border border-[rgba(108,71,255,0.3)] bg-black/40 px-4 py-1.5 text-xs font-body text-[#8b8fa8]">
                PDF &amp; DOCX supported • Max 25 MB
              </span>
            </>
          )}
        </div>

        {/* Animated dashed border overlay */}
        <div className="absolute inset-0 rounded-2xl border border-dashed border-transparent pointer-events-none animate-dash-border" />
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

      {/* Submit button */}
      <button
        type="button"
        id="file-upload-submit"
        onClick={handleSubmit}
        disabled={!file || loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6C47FF] via-[#FF47A3] to-[#00D4FF] px-4 py-3.5 text-sm font-body font-medium text-white shadow-[0_0_25px_rgba(108,71,255,0.6)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_45px_rgba(108,71,255,0.9)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#6C47FF]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050b18]"
      >
        {loading && (
          <span className="h-4 w-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
        )}
        <span>
          {loading ? 'Processing...' : '🚀 Upload & Summarize'}
        </span>
      </button>

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
              Extracting and summarizing your document
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

export default FileUpload;
