import React, { useMemo } from 'react';
import { Concept, QuizAnswers } from '../types';
import { BookOpenIcon, DownloadIcon, TrophyIcon } from './icons';

interface ResultsOverviewProps {
  concepts: Concept[];
  answers: QuizAnswers;
  onReset: () => void;
}

const ResultsOverview: React.FC<ResultsOverviewProps> = ({ concepts, answers, onReset }) => {
  const { score, totalQuestions, percentage } = useMemo(() => {
    let correctAnswers = 0;
    let total = 0;

    concepts.forEach((concept, conceptIndex) => {
      concept.quiz.forEach((_, questionIndex) => {
        if (answers[conceptIndex] && answers[conceptIndex][questionIndex]?.isCorrect) {
          correctAnswers++;
        }
        total++;
      });
    });
    
    return {
      score: correctAnswers,
      totalQuestions: total,
      percentage: total > 0 ? Math.round((correctAnswers / total) * 100) : 0,
    };
  }, [concepts, answers]);

  const getFeedbackMessage = () => {
    if (percentage === 100) return "Perfect Score! You're a true master of this subject!";
    if (percentage >= 80) return "Excellent work! You have a strong grasp of the concepts.";
    if (percentage >= 60) return "Great effort! A little more review will make you an expert.";
    return "Good start! Keep practicing to strengthen your knowledge.";
  };

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const handleDownload = () => {
    const title = "LectureLab AI Summary";
    let content = `${title}\n=========================\n\n`;

    content += `FINAL SCORE: ${percentage}% (${score}/${totalQuestions} correct)\n\n`;

    concepts.forEach((concept, index) => {
        content += `----------\n`;
        content += `CHAPTER ${index + 1}: ${concept.title}\n`;
        content += `----------\n\n`;
        content += `SUMMARY:\n${concept.summary}\n\n`;
        
        content += `QUIZ QUESTIONS:\n`;
        concept.quiz.forEach(q => {
            content += `- ${q.question}\n  Answer: ${q.answer}\n`;
        });
        content += `\n`;

        content += `FLASHCARDS:\n`;
        concept.flashcards.forEach(fc => {
            content += `- Front: ${fc.front}\n  Back: ${fc.back}\n`;
        });
        content += `\n`;
        
        content += `PROBLEM-SOLVING CHALLENGE:\n`;
        content += `Scenario: ${concept.problem_solving_challenge.scenario}\n`;
        content += `Task: ${concept.problem_solving_challenge.task}\n\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecturelab-ai-summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative text-center bg-slate-900 rounded-2xl p-8 border border-slate-700/50 overflow-hidden animate-fade-in">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_45rem_at_50%_50%,_theme(colors.cyan.900),_transparent)] opacity-30"></div>
      <div className="flex justify-center mb-6">
        <TrophyIcon className="h-16 w-16 text-amber-400" />
      </div>
      <h2 className="text-4xl font-bold font-serif text-white mb-2">Module Complete!</h2>
      <p className="text-lg text-slate-300 mb-8">{getFeedbackMessage()}</p>

      <div className="bg-slate-900/50 p-6 rounded-xl mb-10 border border-slate-700">
        <p className="text-slate-400 text-lg">Your Score</p>
        <p className={`text-7xl font-bold my-2 ${getScoreColor()}`}>{percentage}%</p>
        <p className="text-slate-300 text-xl">
          You answered <span className="font-bold text-white">{score}</span> out of <span className="font-bold text-white">{totalQuestions}</span> questions correctly.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
            onClick={handleDownload}
            className="bg-slate-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-slate-600 transition-colors duration-200 shadow-lg flex items-center gap-2"
          >
          <DownloadIcon className="h-5 w-5" />
          Download Summary
        </button>
        <button
          onClick={onReset}
          className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 transition-colors duration-200 shadow-lg flex items-center gap-2"
        >
          <BookOpenIcon className="h-5 w-5" />
          Start a New Analysis
        </button>
      </div>
    </div>
  );
};

export default ResultsOverview;