import React, { useState, useEffect, useMemo, DragEvent } from 'react';
import { VisualTaskItem } from '../types';
import { generateImage } from '../services/geminiService';
import { SpeakerPlayIcon, SpeakerStopIcon, ImageIcon, CheckCircleIcon } from './icons';

interface PreQuestViewProps {
  summary: string;
  visualTask: VisualTaskItem[];
  onStartModule: () => void;
}

// Custom hook for shuffling an array
const useShuffledArray = <T,>(array: T[]) => {
  return useMemo(() => array.map(value => ({ value, sort: Math.random() }))
                           .sort((a, b) => a.sort - b.sort)
                           .map(({ value }) => value), [array]);
};

const PreQuestView: React.FC<PreQuestViewProps> = ({ summary, visualTask, onStartModule }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const shuffledImages = useShuffledArray(visualTask);

  useEffect(() => {
    // Stop speaking if component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      setImageUrls({});
      
      try {
        // Sequentially fetch images to avoid rate-limiting
        for (const item of visualTask) {
          const url = await generateImage(item.image_prompt);
          setImageUrls(prev => ({ ...prev, [item.image_prompt]: url }));
        }
      } catch (err) {
        console.error("Failed to generate images for visual task:", err);
        setError("Could not load the visual task images. You can still proceed.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, [visualTask]);

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(summary);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };
  
  const handleDragStart = (e: DragEvent<HTMLDivElement>, term: string) => {
    e.dataTransfer.setData('text/plain', term);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, imagePrompt: string) => {
    e.preventDefault();
    const droppedTerm = e.dataTransfer.getData('text/plain');
    const correctTerm = visualTask.find(item => item.image_prompt === imagePrompt)?.term;
    if (droppedTerm === correctTerm && !matchedPairs.includes(droppedTerm)) {
      setMatchedPairs(prev => [...prev, droppedTerm]);
    }
    setDropTarget(null);
  };
  
  const isTaskComplete = matchedPairs.length === visualTask.length;

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold font-serif text-cyan-300 mb-3">Before Your Module Begins...</h2>
        <p className="text-slate-300 text-lg">Listen to a quick summary and complete the visual check to make sure you're ready.</p>
      </div>

      {/* Audio Summary */}
      <section className="bg-slate-850 p-6 rounded-lg border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <button
          onClick={handleToggleSpeech}
          className="bg-indigo-600 text-white font-bold p-4 rounded-full hover:bg-indigo-500 transition-colors duration-200 shadow-lg flex-shrink-0"
          aria-label={isSpeaking ? "Stop explanation" : "Play explanation"}
        >
          {isSpeaking ? <SpeakerStopIcon className="h-8 w-8" /> : <SpeakerPlayIcon className="h-8 w-8" />}
        </button>
        <p className="text-slate-200 leading-relaxed">{summary}</p>
      </section>

      {/* Visual Task */}
      <section>
        <h3 className="text-2xl font-bold font-serif text-slate-100 mb-4">Visual Understanding Check</h3>
        <p className="text-slate-400 mb-6">Drag each term to its matching image.</p>
        
        {isLoading && visualTask.length > 0 && Object.keys(imageUrls).length < visualTask.length && !error && (
            <div className="text-center p-8 bg-slate-800 rounded-lg">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-slate-500 animate-pulse" />
                <p className="text-slate-400">Loading visual challenge ({Object.keys(imageUrls).length}/{visualTask.length})...</p>
            </div>
        )}
        
        {error && <p className="text-red-400 text-center">{error}</p>}
        
        {(!isLoading || Object.keys(imageUrls).length > 0) && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Terms */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-300">TERMS</h4>
                    {visualTask.map(item => {
                        const isMatched = matchedPairs.includes(item.term);
                        return (
                            <div 
                                key={item.term}
                                draggable={!isMatched}
                                onDragStart={(e) => handleDragStart(e, item.term)}
                                className={`p-4 rounded-lg transition-all duration-300 border flex items-center ${
                                    isMatched
                                    ? 'bg-green-500/20 text-slate-400 border-green-500/30 cursor-default'
                                    : 'bg-slate-700 border-slate-600 cursor-grab hover:bg-slate-600 active:cursor-grabbing'
                                }`}
                            >
                               {isMatched && <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0"/>}
                               <span>{item.term}</span>
                            </div>
                        )
                    })}
                </div>
                {/* Images */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-300">IMAGES</h4>
                    {shuffledImages.map(item => {
                        const isTargetMatched = visualTask.find(vt => vt.image_prompt === item.image_prompt && matchedPairs.includes(vt.term));
                        return (
                            <div 
                                key={item.image_prompt}
                                onDrop={(e) => handleDrop(e, item.image_prompt)}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={() => !isTargetMatched && setDropTarget(item.image_prompt)}
                                onDragLeave={() => setDropTarget(null)}
                                className={`aspect-video bg-slate-800 rounded-lg overflow-hidden relative flex items-center justify-center border-2 transition-all duration-300 ${
                                    isTargetMatched ? 'border-green-500/50 ring-2 ring-green-500/50' : 
                                    dropTarget === item.image_prompt ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                {imageUrls[item.image_prompt] ? 
                                    <img src={imageUrls[item.image_prompt]} alt={item.term} className="w-full h-full object-cover" /> :
                                    <div className="text-slate-400 p-2">Generating image...</div>
                                }
                                {isTargetMatched && (
                                    <div className="absolute inset-0 bg-green-900/70 flex items-center justify-center">
                                        <CheckCircleIcon className="h-16 w-16 text-green-400" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </section>

      {/* Start Button */}
      <div className="text-center pt-4">
        <button
          onClick={onStartModule}
          disabled={!isTaskComplete && !error}
          className="bg-cyan-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-cyan-500 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
        >
          {isTaskComplete || error ? "Begin Learning Module!" : "Complete the task to begin"}
        </button>
      </div>
    </div>
  );
};

export default PreQuestView;