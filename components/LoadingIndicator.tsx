import React, { useState, useEffect } from 'react';
import { WandIcon } from './icons';

const messages = [
  "Transcribing your lecture...",
  "Identifying key concepts...",
  "Structuring learning chapters...",
  "Crafting interactive challenges...",
  "Designing completion badges...",
  "Almost there, your module is nearly ready!",
];

const LoadingIndicator: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-700">
      <div className="flex justify-center items-center mb-6">
        <WandIcon className="h-12 w-12 text-cyan-400 animate-pulse" />
      </div>
      <h2 className="text-3xl font-bold font-serif text-white mb-4">Generating Your Learning Module...</h2>
      <div className="h-8">
        <p className="text-slate-300 text-lg transition-opacity duration-500 animate-fade-in">
            {messages[messageIndex]}
        </p>
      </div>
    </div>
  );
};

export default LoadingIndicator;