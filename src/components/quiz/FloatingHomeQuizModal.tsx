import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizPayload } from '../../types';
import { InteractiveQuizWidget } from './InteractiveQuizWidget';

interface FloatingHomeQuizModalProps {
  quiz: QuizPayload | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic?: (topic: string) => void;
  onExplainResults?: (score: { correct: number; total: number; incorrectTopics: string[] }) => void;
}

export const FloatingHomeQuizModal: React.FC<FloatingHomeQuizModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onSelectTopic,
  onExplainResults
}) => {
  if (!isOpen || !quiz) return null;

  return (
    <AnimatePresence>
      <div 
        id="floating-home-quiz-container"
        className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-sm pointer-events-auto"
      >
        {/* Subtle Backdrop tap dismiss */}
        <div 
          className="absolute inset-0 -z-10" 
          onClick={onClose} 
          aria-hidden="true" 
        />

        {/* Compact Square/Box Card ("chaukor dabba varg") */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="w-full max-w-sm max-h-[85vh] overflow-y-auto scrollbar-none rounded-3xl shadow-2xl"
        >
          <InteractiveQuizWidget
            quiz={quiz}
            onClose={onClose}
            onSelectTopic={onSelectTopic}
            onExplainResults={onExplainResults}
            isCompact={true}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
