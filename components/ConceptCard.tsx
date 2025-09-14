import React, { useState, useEffect } from 'react';
import { Concept, QuizAnswers } from '../types';
import { generateImage, evaluateSolution } from '../services/geminiService';
import QuizItem from './QuizItem';
import Flashcard from './Flashcard';
import { BadgeIcon, BookIcon, CardIcon, ImageIcon, NarrationIcon, PaperAirplaneIcon, PuzzleIcon, QuillIcon, QuizIcon, SpeakerPlayIcon, SpeakerStopIcon } from './icons';

interface ConceptCardProps {
  concept: Concept;
  conceptIndex: number;
  onAnswerSubmit: (conceptIndex: number, questionIndex: number, selected: string, isCorrect: boolean) => void;
  answers: QuizAnswers;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept, conceptIndex, onAnswerSubmit, answers }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [solution, setSolution] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const [isSceneSpeaking, setIsSceneSpeaking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
        if (!concept.image_prompt) return;
        
        setIsImageLoading(true);
        setImageError(null);
        setImageUrl(null);

        try {
            const url = await generateImage(concept.image_prompt);
            if (isMounted) {
                setImageUrl(url);
            }
        } catch (err) {
            if (isMounted) {
                setImageError('Could not generate illustration for this concept.');
            }
            console.error(err);
        } finally {
            if (isMounted) {
                setIsImageLoading(false);
            }
        }
    };

    generate();

    // Cleanup for speech synthesis and image generation
    return () => {
        isMounted = false;
        window.speechSynthesis.cancel();
    };
  }, [concept.image_prompt]);

  // Effect to manage speech synthesis when concept changes
  useEffect(() => {
    // Stop any previously playing speech when the concept changes
    window.speechSynthesis.cancel();
    setIsSceneSpeaking(false);
  }, [concept]);


  const handleSolutionSubmit = async () => {
    if (!solution.trim()) return;

    setIsEvaluating(true);
    setFeedback(null);
    setEvaluationError(null);

    try {
        const result = await evaluateSolution(concept.title, concept.problem_solving_challenge, solution);
        setFeedback(result);
    } catch (err) {
        setEvaluationError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsEvaluating(false);
    }
  };

  const handleToggleSceneSpeech = () => {
    if (isSceneSpeaking) {
      window.speechSynthesis.cancel();
      setIsSceneSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(concept.story_scene);
      utterance.onend = () => setIsSceneSpeaking(false);
      utterance.onerror = () => setIsSceneSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSceneSpeaking(true);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
      <header className="p-6 bg-slate-850 border-b border-slate-700/50">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300">
          Chapter {conceptIndex + 1}: {concept.title}
        </h3>
      </header>

      <div className="p-6 space-y-8">
        {/* Summary */}
        <section>
          <h4 className="flex items-center gap-3 text-xl font-bold text-slate-200 mb-3 border-b border-slate-700 pb-3">
            <BookIcon className="h-6 w-6 text-cyan-400" />
            <span>Key Summary</span>
          </h4>
          <p className="text-slate-300 leading-relaxed">{concept.summary}</p>
        </section>

        {/* Story Scene & Illustration */}
        <section className="bg-slate-850/50 p-5 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
                <h4 className="flex items-center gap-3 text-xl font-bold text-slate-200">
                    <QuillIcon className="h-6 w-6 text-cyan-400" />
                    <span>Story Scene</span>
                </h4>
                <button
                    onClick={handleToggleSceneSpeech}
                    className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    aria-label={isSceneSpeaking ? "Stop reading scene" : "Read scene aloud"}
                >
                    {isSceneSpeaking ? <SpeakerStopIcon className="h-5 w-5" /> : <SpeakerPlayIcon className="h-5 w-5" />}
                </button>
            </div>
            <p className="text-slate-300 italic mb-4">{concept.story_scene}</p>
            
            <div className="mt-4 aspect-video bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700">
              {isImageLoading && (
                <div className="text-center text-slate-400">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 animate-pulse" />
                  <p>Generating illustration...</p>
                </div>
              )}
              {imageError && <p className="text-red-400">{imageError}</p>}
              {imageUrl && <img src={imageUrl} alt={concept.title} className="w-full h-full object-cover" />}
            </div>

            <div className="flex items-start gap-3 text-sm text-cyan-300 bg-cyan-900/40 p-3 rounded-md mt-4 border border-cyan-800">
                <ImageIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p><span className="font-bold">Image Prompt:</span> {concept.image_prompt}</p>
            </div>
             <div className="flex items-start gap-3 text-sm text-slate-400 mt-3 p-3">
                <NarrationIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p><span className="font-bold">Narration:</span> {concept.narration}</p>
            </div>
        </section>

        {/* Quiz */}
        <section>
          <h4 className="flex items-center gap-3 text-xl font-bold text-slate-200 mb-4 border-b border-slate-700 pb-3">
            <QuizIcon className="h-6 w-6 text-cyan-400" />
            <span>Knowledge Check</span>
          </h4>
          <div className="space-y-4">
            {concept.quiz.map((q, i) => (
              <QuizItem 
                key={i} 
                question={q}
                conceptIndex={conceptIndex}
                questionIndex={i}
                onAnswerSubmit={onAnswerSubmit}
                answerData={answers?.[conceptIndex]?.[i]}
              />
            ))}
          </div>
        </section>

        {/* Flashcards */}
        <section>
          <h4 className="flex items-center gap-3 text-xl font-bold text-slate-200 mb-4 border-b border-slate-700 pb-3">
            <CardIcon className="h-6 w-6 text-cyan-400" />
            <span>Flashcards</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {concept.flashcards.map((fc, i) => <Flashcard key={i} front={fc.front} back={fc.back} />)}
          </div>
        </section>
        
        {/* Problem Solving */}
        <section>
            <h4 className="flex items-center gap-3 text-xl font-bold text-slate-200 mb-4 border-b border-slate-700 pb-3">
                <PuzzleIcon className="h-6 w-6 text-cyan-400" />
                <span>Problem-Solving Challenge</span>
            </h4>
            <div className="bg-slate-850/50 p-5 rounded-lg border border-slate-700">
                <p className="font-semibold text-slate-300 mb-2">Scenario:</p>
                <p className="text-slate-400 mb-4">{concept.problem_solving_challenge.scenario}</p>
                <p className="font-semibold text-slate-300 mb-2">Your Task:</p>
                <p className="text-slate-400 mb-4">{concept.problem_solving_challenge.task}</p>
                
                <div className="mt-6">
                    {feedback ? (
                         <div className="space-y-4 animate-fade-in">
                             <div>
                                 <p className="font-semibold text-slate-300 mb-2">Your Solution:</p>
                                 <p className="text-slate-400 bg-slate-800 p-3 rounded-md whitespace-pre-wrap border border-slate-700">{solution}</p>
                             </div>
                             <div>
                                 <p className="font-semibold text-green-300 mb-2">AI Feedback:</p>
                                 <p className="text-green-200 bg-green-900/50 p-3 rounded-md whitespace-pre-wrap border border-green-700/50">{feedback}</p>
                             </div>
                         </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea
                                value={solution}
                                onChange={(e) => setSolution(e.target.value)}
                                placeholder="Type your solution here..."
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 transition-all"
                                disabled={isEvaluating}
                            />
                            <button
                                onClick={handleSolutionSubmit}
                                disabled={isEvaluating || !solution.trim()}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                {isEvaluating ? 'Evaluating...' : 'Submit for Feedback'}
                                {!isEvaluating && <PaperAirplaneIcon className="h-5 w-5" />}
                            </button>
                            {evaluationError && <p className="text-red-400 text-sm mt-2">{evaluationError}</p>}
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* Badge */}
        <section className="bg-amber-500/10 p-5 rounded-lg border border-amber-500/30 flex items-center gap-5">
            <BadgeIcon className="h-12 w-12 text-amber-400 flex-shrink-0"/>
            <div>
                 <h4 className="text-lg font-bold text-amber-300">{concept.badge.name}</h4>
                 <p className="text-amber-200/80">{concept.badge.description}</p>
            </div>
        </section>
      </div>
    </div>
  );
};

export default ConceptCard;