import React from 'react';
import { QuizQuestion } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface QuizItemProps {
  question: QuizQuestion;
  conceptIndex: number;
  questionIndex: number;
  onAnswerSubmit: (conceptIndex: number, questionIndex: number, selected: string, isCorrect: boolean) => void;
  answerData?: { selected: string; isCorrect: boolean };
}

const QuizItem: React.FC<QuizItemProps> = ({ question, conceptIndex, questionIndex, onAnswerSubmit, answerData }) => {
  const isAnswered = !!answerData;
  const selectedOption = answerData?.selected || null;

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    const isCorrect = option === question.answer;
    onAnswerSubmit(conceptIndex, questionIndex, option, isCorrect);
  };
  
  const getOptionClasses = (option: string) => {
    if (!isAnswered) {
      return 'bg-slate-700 hover:bg-slate-600 hover:border-cyan-500';
    }
    if (option === question.answer) {
      return 'bg-green-500/30 text-green-300 border-green-500';
    }
    if (option === selectedOption) {
      return 'bg-red-500/30 text-red-300 border-red-500';
    }
    return 'bg-slate-700 opacity-60';
  };

  const handleRevealShortAnswer = () => {
    if (isAnswered) return;
    // For short answer, we can consider revealing it as a "correct" action for tracking, or handle separately.
    // For simplicity, we'll log it without a specific "correct" status.
    onAnswerSubmit(conceptIndex, questionIndex, question.answer, true); // Assume revealing is like getting it right for progress
  };


  return (
    <div className="bg-slate-850/50 p-5 rounded-lg border border-slate-700">
      <p className="font-semibold text-slate-200 mb-4">{question.question}</p>
      
      {question.options && question.options.length > 0 ? (
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelectOption(option)}
              disabled={isAnswered}
              className={`w-full text-left p-3 rounded-md transition-all duration-200 border ${isAnswered ? '' : 'disabled:cursor-default'} ${getOptionClasses(option)}`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        // Short answer display
        <div className="mt-2">
             <button
              onClick={handleRevealShortAnswer}
              disabled={isAnswered}
              className="bg-slate-700 hover:bg-slate-600 text-sm py-1 px-3 rounded-md mb-2 disabled:opacity-50"
            >
              {isAnswered ? 'Answer Revealed' : 'Reveal Answer'}
            </button>
        </div>
      )}
      
      {isAnswered && (
        <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 animate-fade-in ${answerData?.isCorrect || (question.options.length === 0) ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
          {question.options.length > 0 ? (
              answerData?.isCorrect ? 
              <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5"/> : 
              <XCircleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5"/>
          ) : (
              <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5"/>
          )}
          <div>
            <p className="font-bold">
                {question.options.length === 0 ? `Answer: ${question.answer}` : `Correct Answer: ${question.answer}`}
            </p>
            <p className="text-sm opacity-90">{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizItem;