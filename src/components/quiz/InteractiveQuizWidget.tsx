import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, X, ChevronDown, ChevronUp, ArrowRight, ArrowLeft, 
  RotateCcw, Sparkles, HelpCircle, CheckCircle2, XCircle, Award,
  Send, BookOpen, Info
} from 'lucide-react';
import { QuizPayload, QuizQuestion } from '../../types';
import { QuizDataService } from '../../services/quiz/quizDataService';

interface InteractiveQuizWidgetProps {
  quiz: QuizPayload;
  onClose?: () => void;
  onSelectTopic?: (topic: string) => void;
  onExplainResults?: (score: { correct: number; total: number; incorrectTopics: string[] }) => void;
  isCompact?: boolean;
}

interface UserAnswerState {
  selectedIndex: number;
  isCorrect: boolean;
  timeSpentMs?: number;
}

interface SubjectiveAnswerState {
  userAnswer: string;
  scorePercentage: number;
  status: 'correct' | 'partial' | 'incorrect';
  statusLabel: string;
  feedback: string;
  modelAnswer: string;
  isEvaluated: boolean;
}

export const InteractiveQuizWidget: React.FC<InteractiveQuizWidgetProps> = ({
  quiz,
  onClose,
  onSelectTopic,
  onExplainResults,
  isCompact = false
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [objectiveAnswers, setObjectiveAnswers] = useState<Record<number, UserAnswerState>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<number, SubjectiveAnswerState>>({});
  const [currentSubjectiveInput, setCurrentSubjectiveInput] = useState<string>('');
  const [isEvaluatingSubjective, setIsEvaluatingSubjective] = useState<boolean>(false);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);
  const [exploredOptions, setExploredOptions] = useState<Record<number, number[]>>({});

  const [isHintOpen, setIsHintOpen] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(quiz.isLoading ?? false);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);

  useEffect(() => {
    if (quiz.isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [quiz]);

  const questions: QuizQuestion[] = quiz.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  
  const isCurrentSubjective = 
    quiz.mode === 'subjective' || 
    currentQuestion?.type === 'subjective';

  const currentObjectiveAnswer = objectiveAnswers[currentQuestionIndex];
  const currentSubjectiveAnswer = subjectiveAnswers[currentQuestionIndex];
  const hasAnsweredCurrent = isCurrentSubjective
    ? Boolean(currentSubjectiveAnswer?.isEvaluated)
    : currentObjectiveAnswer !== undefined;

  // When question index changes, initialize subjective input from previous answer if exists
  useEffect(() => {
    if (currentSubjectiveAnswer) {
      setCurrentSubjectiveInput(currentSubjectiveAnswer.userAnswer);
    } else {
      setCurrentSubjectiveInput('');
    }
    setShowModelAnswer(false);
    setIsHintOpen(false);
  }, [currentQuestionIndex, currentSubjectiveAnswer]);

  // Objective Scoring
  const objectiveAnsweredCount = Object.keys(objectiveAnswers).length;
  const objectiveCorrectCount = Object.values(objectiveAnswers).filter(a => a.isCorrect).length;
  const objectiveScorePercentage = totalQuestions > 0 ? Math.round((objectiveCorrectCount / totalQuestions) * 100) : 0;

  // Subjective Scoring
  const subjectiveList = Object.values(subjectiveAnswers);
  const subjectiveAverageScore = subjectiveList.length > 0 
    ? Math.round(subjectiveList.reduce((acc, curr) => acc + curr.scorePercentage, 0) / subjectiveList.length)
    : 0;

  const scorePercentage = isCurrentSubjective ? subjectiveAverageScore : objectiveScorePercentage;

  // Handle Objective Option Selection or Post-Answer Option Exploration (Bug Fix 2)
  const handleOptionClick = (optionIndex: number) => {
    if (!currentQuestion) return;

    if (!hasAnsweredCurrent) {
      // 1. Initial answer submission: Locks the chosen option and calculates score
      const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
      setObjectiveAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          selectedIndex: optionIndex,
          isCorrect
        }
      }));
      return;
    }

    // 2. Post-answer curiosity exploration:
    // Allows tapping unselected options to reveal why that specific option is wrong or right.
    // CRITICAL: This NEVER changes the user's recorded answer or overall score!
    if (optionIndex !== currentObjectiveAnswer?.selectedIndex) {
      setExploredOptions(prev => {
        const currentList = prev[currentQuestionIndex] || [];
        const isAlreadyExplored = currentList.includes(optionIndex);
        return {
          ...prev,
          [currentQuestionIndex]: isAlreadyExplored
            ? currentList.filter(i => i !== optionIndex)
            : [...currentList, optionIndex]
        };
      });
    }
  };

  // Handle Subjective Answer Submission
  const handleSubmitSubjectiveAnswer = async () => {
    if (!currentSubjectiveInput.trim() || isEvaluatingSubjective || !currentQuestion) return;

    setIsEvaluatingSubjective(true);
    try {
      const evaluation = await QuizDataService.getInstance().evaluateSubjectiveAnswer(
        currentQuestion.question,
        currentSubjectiveInput.trim(),
        currentQuestion.modelAnswer || 'आदर्श उत्तर उपलब्ध नहीं है।',
        currentQuestion.keywords || []
      );

      setSubjectiveAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          userAnswer: currentSubjectiveInput.trim(),
          scorePercentage: evaluation.scorePercentage,
          status: evaluation.status,
          statusLabel: evaluation.statusLabel,
          feedback: evaluation.feedback,
          modelAnswer: evaluation.modelAnswer,
          isEvaluated: true
        }
      }));
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsEvaluatingSubjective(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsHintOpen(false);
    } else {
      setIsFinished(true);
      setIsReviewMode(false);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setIsHintOpen(false);
    }
  };

  const handleRestart = () => {
    setObjectiveAnswers({});
    setSubjectiveAnswers({});
    setCurrentSubjectiveInput('');
    setCurrentQuestionIndex(0);
    setIsFinished(false);
    setIsReviewMode(false);
    setIsHintOpen(false);
    setShowModelAnswer(false);
    setExploredOptions({});
  };

  // -------------------------------------------------------------
  // Glassmorphism Shell Styles (Matches Mayra's Frosted Glass Bubble)
  // -------------------------------------------------------------
  const glassContainerClasses = `relative w-full rounded-3xl backdrop-blur-2xl bg-white/[0.08] dark:bg-white/[0.05] border border-white/20 dark:border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] p-4 sm:p-6 overflow-hidden text-slate-100 ${
    isCompact ? 'max-w-md mx-auto my-2' : 'my-3'
  }`;

  // -------------------------------------------------------------
  // Render Loading Card
  // -------------------------------------------------------------
  if (isLoading || totalQuestions === 0) {
    return (
      <div className={glassContainerClasses}>
        {/* Specular Highlight */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.12] via-transparent to-transparent pointer-events-none" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quiz widget"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
            <Sparkles className="w-4 h-4 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-100 tracking-wide">
              Loading AI-generated quiz...
            </p>
            <p className="text-xs text-cyan-300/80 font-medium">
              {quiz.topic || 'General Knowledge'} {quiz.board ? `• ${quiz.board}` : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render Final Results / Summary Screen
  // -------------------------------------------------------------
  if (isFinished && !isReviewMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={glassContainerClasses}
      >
        {/* Specular Top Reflection */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.14] via-transparent to-transparent pointer-events-none" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quiz widget"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Results Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Quiz Complete!
              </h3>
              <p className="text-xs text-slate-300">
                {quiz.topic} {quiz.chapter ? `• ${quiz.chapter}` : ''}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setIsReviewMode(true);
              setCurrentQuestionIndex(0);
            }}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:underline inline-flex items-center gap-1 mt-2"
          >
            Review all answers <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Big Percentage & Score Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center bg-white/[0.04] backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-inner">
          <div className="text-center sm:text-left sm:col-span-1">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm">
              {scorePercentage}%
            </span>
            <p className="text-[11px] font-medium text-slate-300 mt-0.5">
              Overall Score
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:col-span-3">
            {isCurrentSubjective ? (
              <>
                <div className="bg-emerald-500/15 border border-emerald-400/30 rounded-xl p-2.5 text-center">
                  <span className="text-lg font-bold text-emerald-300 block">
                    {subjectiveList.filter(s => s.scorePercentage >= 75).length}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-200 block truncate">
                    High Score
                  </span>
                </div>
                <div className="bg-amber-500/15 border border-amber-400/30 rounded-xl p-2.5 text-center">
                  <span className="text-lg font-bold text-amber-300 block">
                    {subjectiveList.filter(s => s.scorePercentage >= 45 && s.scorePercentage < 75).length}
                  </span>
                  <span className="text-[10px] font-medium text-amber-200 block truncate">
                    Partial
                  </span>
                </div>
                <div className="bg-rose-500/15 border border-rose-400/30 rounded-xl p-2.5 text-center">
                  <span className="text-lg font-bold text-rose-300 block">
                    {subjectiveList.filter(s => s.scorePercentage < 45).length}
                  </span>
                  <span className="text-[10px] font-medium text-rose-200 block truncate">
                    Needs Work
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-emerald-500/15 border border-emerald-400/30 rounded-xl p-2.5 text-center">
                  <span className="text-lg font-bold text-emerald-300 block">
                    {objectiveCorrectCount}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-200 block">
                    Correct
                  </span>
                </div>
                <div className="bg-rose-500/15 border border-rose-400/30 rounded-xl p-2.5 text-center">
                  <span className="text-lg font-bold text-rose-300 block">
                    {objectiveAnsweredCount - objectiveCorrectCount}
                  </span>
                  <span className="text-[10px] font-medium text-rose-200 block">
                    Incorrect
                  </span>
                </div>
                <div className="bg-slate-500/15 border border-white/10 rounded-xl p-2.5 text-center">
                  <span className="text-lg font-bold text-slate-300 block">
                    {Math.max(0, totalQuestions - objectiveAnsweredCount)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-300 block">
                    Skipped
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          {onExplainResults && (
            <button
              type="button"
              onClick={() => onExplainResults({
                correct: isCurrentSubjective ? subjectiveList.filter(s => s.scorePercentage >= 75).length : objectiveCorrectCount,
                total: totalQuestions,
                incorrectTopics: quiz.growthAreas || [quiz.topic]
              })}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
            >
              Explain my results
            </button>
          )}

          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-cyan-900/40 transition-all inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Play Again
          </button>
        </div>

        {/* Suggested Topics List */}
        {quiz.suggestedTopics && quiz.suggestedTopics.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <p className="text-xs font-semibold text-slate-300 leading-relaxed">
              क्या आप किसी अन्य विषय का अभ्यास करना चाहते हैं?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quiz.suggestedTopics.map((top, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectTopic && onSelectTopic(top)}
                  className="text-left px-3 py-1.5 rounded-lg text-xs text-cyan-300 hover:bg-white/10 transition-colors font-medium flex items-center gap-1.5 group"
                >
                  <span className="text-slate-400 group-hover:text-cyan-300">↳</span>
                  <span className="truncate">{top}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // -------------------------------------------------------------
  // Render Active Question Card (Objective or Subjective)
  // -------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={glassContainerClasses}
    >
      {/* Specular Top Reflection */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.12] via-transparent to-transparent pointer-events-none" />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quiz widget"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header: Badges & Title */}
      <div className="pr-8 flex flex-wrap items-center gap-2">
        <span className="bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
          {quiz.mode === 'subjective' || currentQuestion?.type === 'subjective' ? 'Subjective (वर्णनात्मक)' : 'Objective (MCQ)'}
        </span>
        {quiz.board && (
          <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
            {quiz.board}
          </span>
        )}
        {quiz.chapter && (
          <span className="bg-purple-500/20 border border-purple-400/30 text-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-medium truncate max-w-[200px]">
            {quiz.chapter}
          </span>
        )}
      </div>

      <div className="mt-2 pr-8">
        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
          {quiz.title || `${quiz.topic} प्रश्नोत्तरी`}
        </h3>
      </div>

      {/* Progress Line & Question Counter */}
      <div className="mt-3 flex items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-[70%]">
          {questions.map((_, idx) => {
            const isCurrent = idx === currentQuestionIndex;
            
            if (isCurrentSubjective) {
              const subAns = subjectiveAnswers[idx];
              if (subAns) {
                return (
                  <span
                    key={idx}
                    title={`Question ${idx + 1}: ${subAns.scorePercentage}%`}
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                      subAns.scorePercentage >= 75
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                        : subAns.scorePercentage >= 45
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                        : 'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    ✓
                  </span>
                );
              }
            } else {
              const objAns = objectiveAnswers[idx];
              if (objAns) {
                return objAns.isCorrect ? (
                  <span
                    key={idx}
                    title={`Question ${idx + 1}: Correct`}
                    className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : (
                  <span
                    key={idx}
                    title={`Question ${idx + 1}: Incorrect`}
                    className="w-4 h-4 rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-300 flex items-center justify-center shrink-0"
                  >
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                );
              }
            }

            return (
              <span
                key={idx}
                className={`rounded-full transition-all shrink-0 ${
                  isCurrent
                    ? 'w-4 h-1.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                    : 'w-1.5 h-1.5 bg-white/20'
                }`}
              />
            );
          })}
        </div>

        <span className="text-xs font-semibold text-slate-300 font-mono shrink-0">
          {currentQuestionIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* Question Text */}
      <div className="mt-4">
        <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
          {currentQuestion?.question}
        </h4>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Subjective Mode Input & Evaluation Area */}
      {/* ------------------------------------------------------------- */}
      {isCurrentSubjective ? (
        <div className="mt-4 space-y-3">
          <div className="relative">
            <textarea
              value={currentSubjectiveInput}
              onChange={(e) => setCurrentSubjectiveInput(e.target.value)}
              disabled={hasAnsweredCurrent && !isReviewMode}
              placeholder="यहाँ अपना विस्तृत उत्तर लिखें (Type your answer here)..."
              rows={4}
              className="w-full p-3.5 rounded-2xl bg-white/[0.05] border border-white/15 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 backdrop-blur-md transition-all text-xs sm:text-sm leading-relaxed resize-y disabled:opacity-80"
            />
            <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
              {currentSubjectiveInput.length} अक्षर
            </div>
          </div>

          {/* Submit Answer Button */}
          {!hasAnsweredCurrent && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmitSubjectiveAnswer}
                disabled={!currentSubjectiveInput.trim() || isEvaluatingSubjective}
                className="px-5 py-2 rounded-full font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-1.5"
              >
                {isEvaluatingSubjective ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Evaluating with AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>उत्तर जमा करें (Submit Answer)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Subjective Evaluation Result Card */}
          {hasAnsweredCurrent && currentSubjectiveAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    currentSubjectiveAnswer.scorePercentage >= 75
                      ? 'bg-emerald-500/25 border border-emerald-400/40 text-emerald-300'
                      : currentSubjectiveAnswer.scorePercentage >= 45
                      ? 'bg-amber-500/25 border border-amber-400/40 text-amber-300'
                      : 'bg-rose-500/25 border border-rose-400/40 text-rose-300'
                  }`}>
                    {currentSubjectiveAnswer.statusLabel}
                  </span>
                  <span className="text-xs font-bold text-white">
                    Score: {currentSubjectiveAnswer.scorePercentage}%
                  </span>
                </div>
              </div>

              {/* Feedback */}
              <div className="text-xs text-slate-200 leading-relaxed">
                <span className="font-semibold text-cyan-300">शिक्षिका समीक्षा (Feedback): </span>
                {currentSubjectiveAnswer.feedback}
              </div>

              {/* Model Answer Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{showModelAnswer ? 'आदर्श उत्तर छुपाएं' : 'आदर्श उत्तर देखें (Model Answer)'}</span>
                  {showModelAnswer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {showModelAnswer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-3 rounded-xl bg-cyan-950/40 border border-cyan-400/20 text-xs text-cyan-100 leading-relaxed space-y-2">
                        <div className="font-semibold text-cyan-300">मानक आदर्श उत्तर:</div>
                        <p>{currentSubjectiveAnswer.modelAnswer}</p>
                        {currentQuestion.keywords && currentQuestion.keywords.length > 0 && (
                          <div className="pt-2 border-t border-cyan-400/10 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-cyan-400">महत्वपूर्ण बिंदु:</span>
                            {currentQuestion.keywords.map((kw, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-400/30 text-cyan-200">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* Objective (MCQ) Options Stack with Post-Answer Curiosity Exploration */
        /* ------------------------------------------------------------- */
        <div className="mt-4 space-y-2.5">
          {currentQuestion?.options?.map((option, optIdx) => {
            const isCorrectAnswer = optIdx === currentQuestion.correctAnswerIndex;
            const isSelected = currentObjectiveAnswer?.selectedIndex === optIdx;
            const isExplored = Boolean(
              hasAnsweredCurrent && 
              (exploredOptions[currentQuestionIndex] || []).includes(optIdx)
            );
            
            // Base style: Glass frosted card
            let cardStyle = 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-200 backdrop-blur-md cursor-pointer hover:border-white/20 active:scale-[0.99]';
            let showExplanation = false;
            let explanationText = option.explanation;
            let isExplanationCorrect = isCorrectAnswer;

            if (hasAnsweredCurrent) {
              if (isSelected) {
                if (isCorrectAnswer) {
                  // User chose CORRECT -> Highlight GREEN
                  cardStyle = 'bg-emerald-500/20 border-emerald-400/80 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40 cursor-default';
                  showExplanation = true;
                  isExplanationCorrect = true;
                } else {
                  // User chose INCORRECT -> Highlight ONLY THIS CARD RED!
                  cardStyle = 'bg-rose-500/20 border-rose-400/80 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.25)] ring-1 ring-rose-400/40 cursor-default';
                  showExplanation = true;
                  isExplanationCorrect = false;
                }
              } else if (isReviewMode) {
                // In review mode after completing quiz, reveal the correct answer
                if (isCorrectAnswer) {
                  cardStyle = 'bg-emerald-500/20 border-emerald-400/70 text-emerald-200 cursor-default';
                  showExplanation = true;
                  isExplanationCorrect = true;
                } else {
                  cardStyle = 'opacity-50 bg-white/[0.02] border-white/5 text-slate-400 cursor-default';
                }
              } else if (isExplored) {
                // User clicked an unselected option to EXPLORE why it is wrong/right!
                // Styled in clean frosted cyan accent without modifying the user's score or answer
                cardStyle = 'bg-cyan-950/30 border-cyan-400/60 text-slate-100 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30 cursor-pointer';
                showExplanation = true;
                isExplanationCorrect = isCorrectAnswer;
              } else {
                // Other options: interactive so user can tap them to learn why they are wrong/right
                cardStyle = 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-cyan-400/40 text-slate-300 cursor-pointer transition-all duration-150 group';
                showExplanation = false;
              }
            }

            return (
              <motion.div
                key={optIdx}
                onClick={() => handleOptionClick(optIdx)}
                whileTap={!hasAnsweredCurrent || (!isSelected && !isReviewMode) ? { scale: 0.99 } : undefined}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-start relative select-none ${cardStyle}`}
              >
                <div className="w-full flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold tracking-wide flex-1 leading-snug">
                    {option.text}
                  </span>

                  {/* Status Indicator / Radio Circle / Curiosity Badge */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {hasAnsweredCurrent ? (
                      isSelected ? (
                        isCorrectAnswer ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>चुना हुआ</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded-full border border-rose-400/30">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>चुना हुआ</span>
                          </div>
                        )
                      ) : isReviewMode && isCorrectAnswer ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-400/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>सही उत्तर</span>
                        </div>
                      ) : isExplored ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-900/40 px-2 py-0.5 rounded-full border border-cyan-400/40">
                          <ChevronUp className="w-3 h-3 text-cyan-300" />
                          <span>छुपाएं</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10.5px] font-medium text-slate-400 group-hover:text-cyan-300 transition-colors bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/10 group-hover:border-cyan-400/30">
                          <HelpCircle className="w-3 h-3 text-cyan-400/70 group-hover:text-cyan-300" />
                          <span>कारण जानें</span>
                        </div>
                      )
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/30" />
                    )}
                  </div>
                </div>

                {/* Option Explanation */}
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-2.5 pt-2 border-t ${
                      isSelected
                        ? isCorrectAnswer
                          ? 'border-emerald-400/20'
                          : 'border-rose-400/20'
                        : isReviewMode && isCorrectAnswer
                        ? 'border-emerald-400/20'
                        : 'border-cyan-400/20'
                    }`}
                  >
                    {/* Header Label */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold mb-0.5">
                      {isSelected ? (
                        isCorrectAnswer ? (
                          <span className="text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>आपका उत्तर — सही!</span>
                          </span>
                        ) : (
                          <span className="text-rose-300 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>आपका उत्तर — गलत:</span>
                          </span>
                        )
                      ) : isReviewMode && isCorrectAnswer ? (
                        <span className="text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>सही उत्तर का विश्लेषण:</span>
                        </span>
                      ) : (
                        <span className="text-cyan-300 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{isCorrectAnswer ? 'यह विकल्प सही क्यों है:' : 'यह विकल्प गलत क्यों है:'}</span>
                        </span>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed font-normal ${
                      isSelected
                        ? isCorrectAnswer
                          ? 'text-emerald-100/90'
                          : 'text-rose-100/90'
                        : isReviewMode && isCorrectAnswer
                        ? 'text-emerald-100/90'
                        : 'text-slate-200'
                    }`}>
                      {explanationText || (isCorrectAnswer 
                        ? 'यह इस प्रश्न का सटीक एवं सही उत्तर है।' 
                        : 'यह विकल्प इस प्रश्न के संदर्भ में असत्य/अनुपयुक्त है।')}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Educational Curiosity Guide Tip */}
          {hasAnsweredCurrent && !isReviewMode && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                सीखने के लिए: किसी भी अन्य विकल्प पर टैप करके जानिए कि वह क्यों गलत या सही है।
              </span>
            </div>
          )}
        </div>
      )}

      {/* Show Hint Accordion */}
      {currentQuestion?.hint && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsHintOpen(!isHintOpen)}
            className="text-xs font-semibold text-slate-300 hover:text-cyan-300 flex items-center gap-1 transition-colors py-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isHintOpen ? 'Hide hint' : 'Show hint'}</span>
            {isHintOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <AnimatePresence>
            {isHintOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 p-3 rounded-xl bg-cyan-950/30 border border-cyan-400/20 text-xs text-cyan-200 leading-relaxed">
                  <span className="font-semibold text-cyan-300">संकेत (Hint): </span>
                  {currentQuestion.hint}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Navigation (Back / Next) */}
      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
          className="px-3.5 py-1.5 rounded-full border border-white/15 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>

        <div className="flex items-center gap-2">
          {isReviewMode && (
            <button
              type="button"
              onClick={() => setIsFinished(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Exit Review
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all inline-flex items-center gap-1.5"
          >
            <span>
              {currentQuestionIndex === totalQuestions - 1 ? 'See Results' : 'Next'}
            </span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
