import React, { useState, useCallback } from 'react';
import { ModuleData, QuizAnswers, YouTubeVideo, SelectedMedia } from './types';
import { generateModuleData } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import { LogoIcon, UploadIcon, WandIcon, BookOpenIcon } from './components/icons';

export type View = 'idle' | 'dashboard' | 'error';
export type ModuleStep = null | 'generating' | 'pre-module' | 'learning' | 'results';


const App: React.FC = () => {
  const [view, setView] = useState<View>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Media and Analysis State
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  
  // Module State
  const [moduleStep, setModuleStep] = useState<ModuleStep>(null);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});

  const resetState = useCallback(() => {
    setView('idle');
    setError(null);
    setSelectedMedia(null);
    setModuleStep(null);
    setModuleData(null);
    setTranscription(null);
    setCurrentConceptIndex(0);
    setQuizAnswers({});
  }, []);

  const resetModule = useCallback(() => {
    setModuleStep(null);
    setModuleData(null);
    setCurrentConceptIndex(0);
    setQuizAnswers({});
  }, []);

  const startGeneration = useCallback(async (text: string) => {
    setModuleStep('generating');
    setError(null);
    setModuleData(null);
    setQuizAnswers({});
    setCurrentConceptIndex(0);
    setTranscription(text);

    try {
      const data = await generateModuleData(text);
      if (data.concepts.length === 0) {
        throw new Error("The AI failed to identify any learning concepts. Please try a different source.");
      }
      setModuleData(data);
      setModuleStep('pre-module');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setView('error'); // Keep error as a top-level view
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedMedia(file);
    setView('dashboard');
    setError(null);
  }, []);

  const handleVideoSelect = useCallback((video: YouTubeVideo) => {
    setSelectedMedia(video);
    setView('dashboard');
    setError(null);
  }, []);

  const handleStartModule = () => {
    setModuleStep('learning');
  };

  const handleAnswerSubmit = (conceptIndex: number, questionIndex: number, selected: string, isCorrect: boolean) => {
    setQuizAnswers(prev => ({
      ...prev,
      [conceptIndex]: {
        ...prev[conceptIndex],
        [questionIndex]: { selected, isCorrect }
      }
    }));
  };

  const handleNextConcept = () => {
    if (moduleData && currentConceptIndex < moduleData.concepts.length - 1) {
      setCurrentConceptIndex(prev => prev + 1);
    }
  };

  const handlePrevConcept = () => {
    if (currentConceptIndex > 0) {
      setCurrentConceptIndex(prev => prev - 1);
    }
  };
  
  const handleFinishModule = () => {
    setModuleStep('results');
  };

  const renderContent = () => {
    switch (view) {
      case 'idle':
        return (
          <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold font-serif text-cyan-300 mb-3">How It Works in 3 Simple Steps</h2>
                <p className="text-slate-400 max-w-2xl mx-auto mb-10">
                    From any lecture to a personalized learning experience and powerful content creation tools.
                </p>
                <div className="grid sm:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="bg-slate-800 p-4 rounded-full border border-slate-700 mb-4">
                            <UploadIcon className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">1. Provide a Lecture</h3>
                        <p className="text-slate-400">Upload an audio/video file or search for any topic on YouTube.</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="bg-slate-800 p-4 rounded-full border border-slate-700 mb-4">
                            <WandIcon className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">2. AI Works Its Magic</h3>
                        <p className="text-slate-400">Our AI transcribes the content and builds an interactive module with quizzes, story scenes, and challenges.</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="bg-slate-800 p-4 rounded-full border border-slate-700 mb-4">
                            <BookOpenIcon className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">3. Learn and Create</h3>
                        <p className="text-slate-400">Dive into your personalized course, test your knowledge, and even generate articles from what you've learned.</p>
                    </div>
                </div>
            </div>
            <FileUpload onFileSelect={handleFileSelect} onVideoSelect={handleVideoSelect} />
          </div>
        );
      case 'dashboard':
        return selectedMedia && (
            <AnalysisView
                media={selectedMedia}
                moduleStep={moduleStep}
                moduleData={moduleData}
                transcription={transcription}
                currentConceptIndex={currentConceptIndex}
                quizAnswers={quizAnswers}
                onStartModuleCreation={startGeneration}
                onStartModule={handleStartModule}
                onAnswerSubmit={handleAnswerSubmit}
                onNextConcept={handleNextConcept}
                onPrevConcept={handlePrevConcept}
                onFinishModule={handleFinishModule}
                onResetModule={resetModule}
                onResetApp={resetState}
            />
        );
      case 'error':
        return (
          <div className="text-center bg-red-900/50 border border-red-700 p-8 rounded-2xl max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold font-serif text-red-300 mb-3">An Error Occurred</h2>
            <p className="text-red-300/90 mb-8">{error}</p>
            <button
              onClick={resetState}
              className="bg-cyan-500 text-slate-900 font-bold py-3 px-8 rounded-lg hover:bg-cyan-400 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 antialiased">
      <header className="w-full max-w-7xl text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-2">
          <LogoIcon className="h-12 w-12 text-cyan-400" />
          <h1 className="text-4xl sm:text-6xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-300 tracking-wide animate-text-focus-in">
            LectureLab AI
          </h1>
        </div>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Go beyond listening. Upload any lecture to generate interactive study materials, deep-dive summaries, and high-quality articles in minutes.
        </p>
      </header>

      <main className="w-full max-w-7xl flex-grow">
        {renderContent()}
      </main>
      
      <footer className="w-full max-w-7xl text-center mt-16 text-slate-500 text-sm">
        <p>Powered by Gemini. Start your analysis.</p>
      </footer>
    </div>
  );
};

export default App;