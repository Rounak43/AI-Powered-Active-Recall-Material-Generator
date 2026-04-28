import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Trophy, ArrowRight, RefreshCcw } from 'lucide-react';
import GlassCard from './GlassCard';

const QuizSection = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!questions || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];

  const handleOptionClick = (key) => {
    if (isAnswered) return;
    setSelectedOption(key);
    setIsAnswered(true);
    if (key === currentQuestion.correct_answer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <GlassCard className="p-8 text-center border-[#6C47FF]/40 bg-[#6C47FF]/5">
        <Trophy className="h-16 w-16 text-[#FF47A3] mx-auto mb-4" />
        <h2 className="font-display text-2xl text-white mb-2">Quiz Completed!</h2>
        <p className="font-body text-[#8b8fa8] mb-6">
          You scored <span className="text-white font-bold">{score}</span> out of <span className="text-white font-bold">{questions.length}</span> ({percentage}%)
        </p>
        
        <div className="w-full bg-black/40 rounded-full h-3 mb-8 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className="h-full bg-gradient-to-r from-[#6C47FF] to-[#00D4FF]"
          />
        </div>

        <button
          onClick={resetQuiz}
          className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-6 py-3 text-sm font-display text-white hover:bg-white/10 transition-all"
        >
          <RefreshCcw className="h-4 w-4" />
          Retake Quiz
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h2 className="font-display text-xl text-white">Smart MCQ Quiz</h2>
        </div>
        <span className="font-display text-sm text-muted">
          Question <span className="text-white">{currentIndex + 1}</span> of {questions.length}
        </span>
      </div>

      <GlassCard className="p-6 md:p-8 border-[#6C47FF]/20">
        <h3 className="font-display text-lg md:text-xl text-white mb-8 leading-tight">
          {currentQuestion.question}
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            const isSelected = selectedOption === key;
            const isCorrect = key === currentQuestion.correct_answer;
            
            let colorClass = "border-white/10 bg-white/5 text-[#8b8fa8] hover:border-[#6C47FF]/40 hover:bg-[#6C47FF]/5";
            if (isAnswered) {
              if (isCorrect) colorClass = "border-green-500/50 bg-green-500/10 text-green-400";
              else if (isSelected) colorClass = "border-red-500/50 bg-red-500/10 text-red-400";
              else colorClass = "border-white/5 bg-white/[0.02] text-white/30";
            } else if (isSelected) {
              colorClass = "border-[#6C47FF] bg-[#6C47FF]/20 text-white";
            }

            return (
              <button
                key={key}
                onClick={() => handleOptionClick(key)}
                disabled={isAnswered}
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${colorClass}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center font-display text-sm border border-white/10">
                    {key}
                  </span>
                  <span className="font-body text-sm md:text-base">{value}</span>
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <p className="text-xs font-display text-[#6C47FF] uppercase tracking-wider mb-2">Explanation</p>
              <p className="text-sm font-body text-[#8b8fa8] leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6C47FF] to-[#00D4FF] px-6 py-3 text-sm font-display text-white shadow-lg shadow-[#6C47FF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {currentIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default QuizSection;
