import React, { useState } from 'react';
import { FlipIcon } from './icons';

interface FlashcardProps {
  front: string;
  back: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ front, back }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Tailwind CSS requires some specific classes for 3D transforms
  const containerClasses = "group h-48 [perspective:1000px]";
  const flipperClasses = `relative h-full w-full rounded-lg shadow-md [transform-style:preserve-3d] transition-transform duration-700 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`;
  const sideClasses = "absolute h-full w-full rounded-lg p-4 flex flex-col justify-center items-center text-center cursor-pointer [backface-visibility:hidden]";
  const frontClasses = "bg-slate-700 border border-slate-600";
  const backClasses = "bg-indigo-800 border border-indigo-600 [transform:rotateY(180deg)]";

  return (
    <div className={containerClasses} onClick={() => setIsFlipped(!isFlipped)}>
      <div className={flipperClasses}>
        {/* Front Side */}
        <div className={`${sideClasses} ${frontClasses}`}>
          <p className="text-lg text-slate-100">{front}</p>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-slate-400 text-xs">
            <span>Flip</span>
            <FlipIcon className="h-4 w-4" />
          </div>
        </div>
        {/* Back Side */}
        <div className={`${sideClasses} ${backClasses}`}>
          <p className="text-slate-100">{back}</p>
           <div className="absolute bottom-3 right-3 flex items-center gap-1 text-slate-400 text-xs">
            <span>Flip</span>
            <FlipIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;