import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GlassCard from './GlassCard';

const ConfirmModal = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  requireTyping = false,
  onConfirm,
  onCancel
}) => {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setInput('');
    }
  }, [isOpen]);

  const canConfirm = !requireTyping || input === 'DELETE';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm px-4"
          >
            <GlassCard className="p-5">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="text-4xl">⚠️</div>
                <h2 className="font-display text-xl text-white">{title}</h2>
                <p className="text-sm font-body text-muted">{description}</p>
                {requireTyping && (
                  <div className="w-full mt-2 space-y-1">
                    <p className="text-[11px] font-body text-muted">
                      Type DELETE to confirm:
                    </p>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full rounded-lg border border-border bg-black/40 px-3 py-2 text-sm font-body text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
                <div className="mt-4 flex w-full items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-full glass border border-border text-xs font-body text-muted hover:text-white hover:border-primary/80 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canConfirm}
                    onClick={onConfirm}
                    className="px-4 py-2 rounded-full bg-red-600 text-xs font-body font-medium text-white shadow-lg hover:-translate-y-[1px] hover:shadow-red-500/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;

