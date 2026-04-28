import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, HelpCircle } from 'lucide-react';
import GlassCard from './GlassCard';

const Flashcard = ({ question, answer, index }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative h-64 w-full perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative"
      >
        {/* Front */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <GlassCard className="w-full h-full flex flex-col items-center justify-center p-6 text-center border-[#6C47FF]/30 bg-gradient-to-br from-[#6C47FF]/5 to-transparent">
            <span className="absolute top-4 left-4 text-[10px] font-display text-[#6C47FF] uppercase tracking-widest">Question {index + 1}</span>
            <HelpCircle className="h-8 w-8 text-[#6C47FF] mb-4 opacity-50" />
            <p className="font-display text-lg text-white leading-relaxed">
              {question}
            </p>
            <span className="absolute bottom-4 text-[10px] text-muted font-body italic">Click to reveal answer</span>
          </GlassCard>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <GlassCard className="w-full h-full flex flex-col items-center justify-center p-6 text-center border-[#00D4FF]/30 bg-gradient-to-br from-[#00D4FF]/5 to-transparent">
            <span className="absolute top-4 left-4 text-[10px] font-display text-[#00D4FF] uppercase tracking-widest">Answer</span>
            <p className="font-body text-base text-white/90 leading-relaxed">
              {answer}
            </p>
            <span className="absolute bottom-4 text-[10px] text-muted font-body italic">Click to flip back</span>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
};

const FlashcardSection = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'grid'

  if (!flashcards || flashcards.length === 0) return null;

  const nextCard = () => setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  const prevCard = () => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎴</span>
          <h2 className="font-display text-xl text-white">Active Recall Flashcards</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
            className="text-xs font-body text-muted hover:text-white transition-colors bg-white/5 px-3 py-1 rounded-full border border-white/10"
          >
            {viewMode === 'single' ? 'View Grid' : 'View Slider'}
          </button>
        </div>
      </div>

      {viewMode === 'single' ? (
        <div className="relative max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Flashcard 
                question={flashcards[currentIndex].question}
                answer={flashcards[currentIndex].answer}
                index={currentIndex}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-6 mt-6">
            <button 
              onClick={prevCard}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-[#6C47FF]/20 hover:border-[#6C47FF]/50 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-display text-sm text-white">
              {currentIndex + 1} <span className="text-muted">/</span> {flashcards.length}
            </span>
            <button 
              onClick={nextCard}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-[#6C47FF]/20 hover:border-[#6C47FF]/50 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashcards.map((card, idx) => (
            <Flashcard 
              key={idx}
              question={card.question}
              answer={card.answer}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardSection;
