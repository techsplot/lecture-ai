import React, { useState, useEffect, useMemo } from 'react';
import { SelectedMedia, YouTubeVideo, ModuleData, QuizAnswers } from '../types';
import { ModuleStep } from '../App';
import { transcribeFile, getYouTubeTranscript, summarizeAndUnderstand, generateArticleIdeas, writeArticle } from '../services/geminiService';
import { DocumentTextIcon, LightbulbIcon, PlayCircleIcon, ReplayIcon, WandIcon, BriefcaseIcon, CoffeeIcon, AcademicCapIcon, DocumentDuplicateIcon, CheckIcon, ArrowUpRightIcon, ArrowLeftIcon } from './icons';
import LoadingIndicator from './LoadingIndicator';
import PreQuestView from './PreQuestView';
import QuestView from './QuestView';
import ResultsOverview from './ResultsOverview';


interface AnalysisViewProps {
  media: SelectedMedia;
  // Module State & Data
  moduleStep: ModuleStep;
  moduleData: ModuleData | null;
  transcription: string | null;
  currentConceptIndex: number;
  quizAnswers: QuizAnswers;
  // Module Actions
  onStartModuleCreation: (transcription: string) => void;
  onStartModule: () => void;
  onAnswerSubmit: (conceptIndex: number, questionIndex: number, selected: string, isCorrect: boolean) => void;
  onNextConcept: () => void;
  onPrevConcept: () => void;
  onFinishModule: () => void;
  onResetModule: () => void;
  onResetApp: () => void;
}

const isYouTubeVideo = (media: SelectedMedia): media is YouTubeVideo => {
  return 'videoId' in media;
};

const parseSummary = (text: string | null) => {
    if (!text) return { quickSummary: [], keyConcepts: [] };

    const keyConceptsHeaderRegex = /\n\s*(?:key concepts|key takeaways|main points):?\s*\n/i;
    const summaryParts = text.split(keyConceptsHeaderRegex);

    let quickSummaryText = summaryParts[0] || '';
    const keyConceptsText = summaryParts[1] || '';
    
    quickSummaryText = quickSummaryText.replace(/^(quick summary|concise summary|summary):?\s*/i, '').trim();

    const quickSummary = quickSummaryText
        .split('\n')
        .map(line => line.trim())
        .map(line => line.replace(/^[\*\-]\s*/, '')) // remove leading bullets
        .filter(Boolean); // remove empty lines

    const keyConcepts = keyConceptsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('*') || line.startsWith('-'))
      .map(line => line.substring(1).trim());

    return { quickSummary, keyConcepts };
};


const AnalysisView: React.FC<AnalysisViewProps> = (props) => {
  const { media, moduleStep, moduleData, onStartModuleCreation, onResetModule, onResetApp } = props;

  // State for the AI Analysis Hub (Right Column)
  const [localTranscription, setLocalTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [articleIdeas, setArticleIdeas] = useState<string[] | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideaCategory, setIdeaCategory] = useState<string | null>(null);
  const [selectedArticleIdea, setSelectedArticleIdea] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [isWritingArticle, setIsWritingArticle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const mediaUrl = useMemo(() => {
    if (isYouTubeVideo(media)) {
      return `https://www.youtube.com/embed/${media.videoId}`;
    }
    return URL.createObjectURL(media);
  }, [media]);

  const { quickSummary, keyConcepts } = useMemo(() => parseSummary(summary), [summary]);

  useEffect(() => {
    const processMedia = async () => {
      setIsTranscribing(true);
      setError(null);
      setLocalTranscription(null);
      try {
        let transcriptText = '';
        if (isYouTubeVideo(media)) {
          transcriptText = await getYouTubeTranscript(media);
        } else {
          transcriptText = await transcribeFile(media);
        }
        setLocalTranscription(transcriptText);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.');
      } finally {
        setIsTranscribing(false);
      }
    };
    processMedia();

    return () => {
        if (!isYouTubeVideo(media) && mediaUrl) {
            URL.revokeObjectURL(mediaUrl);
        }
    }
  }, [media]);

  const handleSummarize = async () => {
    if (!localTranscription) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeAndUnderstand(localTranscription);
      setSummary(result);
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };
  
  const handleGenerateIdeas = async (category: string) => {
    if (!summary) return;
    setIsGeneratingIdeas(true);
    setIdeaCategory(category);
    setArticleIdeas(null);
    try {
      const ideas = await generateArticleIdeas(summary, category);
      setArticleIdeas(ideas);
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to generate ideas.');
    } finally {
      setIsGeneratingIdeas(false);
      setIdeaCategory(null);
    }
  };

  const handleWriteArticle = async (idea: string) => {
    if (!localTranscription) return;
    setSelectedArticleIdea(idea);
    setIsWritingArticle(true);
    setArticleContent(null);
    try {
        const content = await writeArticle(idea, localTranscription);
        setArticleContent(content);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to write article.');
    } finally {
        setIsWritingArticle(false);
    }
  };

  const handleCopyArticle = () => {
    if (articleContent) {
      const div = document.createElement('div');
      div.innerHTML = articleContent;
      const textToCopy = div.textContent || div.innerText || "";
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      });
    }
  };

  const handleExportToDocs = () => {
      if (articleContent) {
          const title = selectedArticleIdea || "Generated Article";
          const plainText = articleContent.replace(/<[^>]+>/g, '\n').replace(/\n\n+/g, '\n\n').trim();
          const url = `https://docs.google.com/document/create?title=${encodeURIComponent(title)}&body=${encodeURIComponent(plainText)}`;
          window.open(url, '_blank');
      }
  };

  const renderModuleContent = () => {
    switch(moduleStep) {
        case 'generating':
            return <div className="mt-8"><LoadingIndicator /></div>;
        case 'pre-module':
            return moduleData && <div className="mt-8"><PreQuestView summary={moduleData.simple_summary} visualTask={moduleData.visual_task} onStartModule={props.onStartModule} /></div>;
        case 'learning':
            return moduleData && <div className="mt-8"><QuestView concepts={moduleData.concepts} transcription={props.transcription} currentConceptIndex={props.currentConceptIndex} answers={props.quizAnswers} onAnswerSubmit={props.onAnswerSubmit} onNext={props.onNextConcept} onPrev={props.onPrevConcept} onFinish={props.onFinishModule} /></div>;
        case 'results':
            return moduleData && <div className="mt-8"><ResultsOverview concepts={moduleData.concepts} answers={props.quizAnswers} onReset={onResetApp} /></div>;
        case null:
        default:
            return null;
    }
  }


  return (
    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-2xl backdrop-blur-sm p-4 sm:p-6 grid lg:grid-cols-5 gap-6">
      {/* Left Column: The "Stage" */}
      <div className="lg:col-span-3 bg-slate-850/50 p-6 rounded-lg border border-slate-700">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-serif text-cyan-300">Media Source</h2>
                {moduleStep ? (
                    <div className="flex items-center gap-4">
                        <button onClick={onResetModule} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <ReplayIcon className="h-4 w-4" />
                            Reset Module
                        </button>
                        <button onClick={onResetApp} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                            <ArrowLeftIcon className="h-4 w-4" />
                            Start New
                        </button>
                    </div>
                ) : (
                     <button onClick={onResetApp} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to Upload
                    </button>
                )}
            </div>
            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                {isYouTubeVideo(media) ? (
                <iframe src={mediaUrl} title={media.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                ) : (
                media.type.startsWith('audio/') ? (
                    <audio controls src={mediaUrl} className="w-full h-full p-4"></audio>
                ) : (
                    <video controls src={mediaUrl} className="w-full h-full"></video>
                )
                )}
            </div>
            {!moduleStep && (
                <button onClick={() => onStartModuleCreation(localTranscription!)} disabled={!localTranscription || moduleStep !== null} className="w-full flex items-center justify-center gap-3 bg-cyan-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-cyan-500 transition-all duration-200 shadow-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed text-lg">
                    <PlayCircleIcon className="h-7 w-7"/>
                    <span>Create Learning Module</span>
                </button>
            )}
        </div>
        {renderModuleContent()}
      </div>

      {/* Right Column: AI Analysis "Workbench" */}
      <div className="lg:col-span-2 bg-slate-850/50 p-6 rounded-lg border border-slate-700 space-y-6 h-full">
        <h2 className="text-2xl font-bold font-serif text-indigo-300">AI Analysis Hub</h2>
        
        {isTranscribing && <div className="text-center text-slate-300 p-4"><WandIcon className="h-8 w-8 mx-auto animate-pulse mb-2" />Processing Media...</div>}
        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}

        {localTranscription && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
                <button onClick={handleSummarize} disabled={isSummarizing} className="flex items-center justify-center gap-3 w-full text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500">
                    {isSummarizing ? <><WandIcon className="h-5 w-5 animate-pulse" /><span>Summarizing...</span></> : <><DocumentTextIcon className="h-5 w-5"/><span>Summarize & Understand</span></>}
                </button>
                {summary && (
                    <div className="p-4 bg-slate-900/50 rounded-md border border-slate-700 space-y-4 text-sm max-h-64 overflow-y-auto">
                        {quickSummary.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-200 mb-2">Quick Summary</h4>
                                <ul className="space-y-2">
                                    {quickSummary.map((point, index) => (
                                        <li key={index} className="flex items-start gap-3 text-slate-300 leading-relaxed">
                                            <DocumentTextIcon className="h-4 w-4 text-cyan-400 mt-1 flex-shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {keyConcepts.length > 0 && (
                            <div>
                                <h4 className="font-bold text-slate-200 mb-3 pt-3 border-t border-slate-700">Key Concepts</h4>
                                <ul className="space-y-2">
                                    {keyConcepts.map((concept, index) => (
                                        <li key={index} className="flex items-start gap-3 text-slate-300">
                                            <LightbulbIcon className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span>{concept}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {summary && (
              <div className="space-y-3">
                  <p className="font-bold text-slate-300">Generate Article Ideas:</p>
                  <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleGenerateIdeas('Professional')} disabled={isGeneratingIdeas} className="flex flex-col items-center gap-2 p-3 text-xs text-center text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-sky-600 hover:bg-sky-500 border border-sky-500 hover:scale-105">
                         <BriefcaseIcon className="h-5 w-5"/> Professional
                      </button>
                       <button onClick={() => handleGenerateIdeas('Casual Blog')} disabled={isGeneratingIdeas} className="flex flex-col items-center gap-2 p-3 text-xs text-center text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-teal-600 hover:bg-teal-500 border border-teal-500 hover:scale-105">
                         <CoffeeIcon className="h-5 w-5"/> Casual Blog
                      </button>
                       <button onClick={() => handleGenerateIdeas('Educational')} disabled={isGeneratingIdeas} className="flex flex-col items-center gap-2 p-3 text-xs text-center text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-500 border border-amber-500 hover:scale-105">
                         <AcademicCapIcon className="h-5 w-5"/> Educational
                      </button>
                  </div>
                  {isGeneratingIdeas && <p className="text-sm text-slate-400 text-center animate-pulse">Generating {ideaCategory} ideas...</p>}
                  {articleIdeas && (
                      <div className="space-y-2">
                          {articleIdeas.map((idea, i) => (
                              <button key={i} onClick={() => handleWriteArticle(idea)} disabled={isWritingArticle} className="w-full text-left p-3 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 text-sm">
                                  {selectedArticleIdea === idea && isWritingArticle ? `Writing...` : `Write: "${idea}"`}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
            )}

            {articleContent && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-slate-200">Generated Article</h3>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCopyArticle}
                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                {isCopied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <DocumentDuplicateIcon className="h-4 w-4" />}
                                {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={handleExportToDocs}
                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowUpRightIcon className="h-4 w-4" />
                                Export
                            </button>
                        </div>
                    </div>
                    <div 
                        className="prose prose-invert prose-sm p-4 bg-slate-900/50 rounded-md text-slate-300 whitespace-pre-wrap border border-slate-700 max-h-96 overflow-y-auto" 
                        dangerouslySetInnerHTML={{ __html: articleContent }}
                    />
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;