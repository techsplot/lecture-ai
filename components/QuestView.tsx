import React from 'react';
import { Concept, QuizAnswers } from '../types';
import ConceptCard from './ConceptCard';
import { ChevronDownIcon } from './icons';

interface QuestViewProps {
  concepts: Concept[];
  transcription: string | null;
  currentConceptIndex: number;
  answers: QuizAnswers;
  onAnswerSubmit: (conceptIndex: number, questionIndex: number, selected: string, isCorrect: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

const QuestView: React.FC<QuestViewProps> = ({
  concepts,
  transcription,
  currentConceptIndex,
  answers,
  onAnswerSubmit,
  onNext,
  onPrev,
  onFinish,
}) => {
  const currentConcept = concepts[currentConceptIndex];
  const progressPercentage = ((currentConceptIndex + 1) / concepts.length) * 100;
  const isLastConcept = currentConceptIndex === concepts.length - 1;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-base font-medium text-cyan-300">Module Progress</span>
          <span className="text-sm font-medium text-cyan-300">{currentConceptIndex + 1} / {concepts.length}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      {/* Current Concept */}
      <ConceptCard
        concept={currentConcept}
        conceptIndex={currentConceptIndex}
        onAnswerSubmit={onAnswerSubmit}
        answers={answers}
      />
      
      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={onPrev}
          disabled={currentConceptIndex === 0}
          className="bg-slate-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-slate-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {isLastConcept ? (
           <button
             onClick={onFinish}
             className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-500 transition-colors duration-200 shadow-lg"
           >
             See My Results
           </button>
        ) : (
          <button
            onClick={onNext}
            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-colors duration-200"
          >
            Next Chapter
          </button>
        )}
      </div>

      {/* Transcription */}
      {transcription && (
          <details className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 transition-all duration-300 open:bg-slate-850 mt-12">
            <summary className="cursor-pointer text-xl font-bold font-serif text-cyan-300 flex justify-between items-center list-none">
              <span>Full Transcription</span>
              <ChevronDownIcon className="h-6 w-6 transform transition-transform duration-300 details-open:rotate-180" />
            </summary>
            <p className="mt-4 text-slate-300 whitespace-pre-wrap leading-relaxed">{transcription}</p>
          </details>
      )}

    </div>
  );
};

export default QuestView;