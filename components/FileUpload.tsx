import React, { useState, useCallback, DragEvent } from 'react';
import { UploadIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import { YouTubeVideo } from '../types';
import { searchYouTube } from '../services/geminiService';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onVideoSelect: (video: YouTubeVideo) => void;
}

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onVideoSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YouTubeVideo[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showAllResults, setShowAllResults] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    setError(null);
    if (files && files.length > 0) {
      const file = files[0];

      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        setError('Please upload a valid audio or video file.');
        return;
      }
      
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Please select a file smaller than ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }

      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [handleFileChange]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);
    setSearchError(null);
    setShowAllResults(false);
    
    try {
        const results = await searchYouTube(searchQuery);
        setSearchResults(results);
    } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Could not fetch video results.');
    } finally {
        setIsSearching(false);
    }
  };

  const handleSelectVideo = (video: YouTubeVideo) => {
    onVideoSelect(video);
  };

  const TabButton = ({ isActive, onClick, children }: { isActive: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`relative px-6 py-4 text-lg font-bold transition-colors duration-200 focus:outline-none ${
        isActive
          ? 'text-cyan-400'
          : 'text-slate-400 hover:text-white'
      }`}
    >
      {children}
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-400 rounded-full"></div>}
    </button>
  );

  return (
    <div className={`w-full max-w-3xl mx-auto bg-slate-900/70 border border-slate-700/50 rounded-2xl shadow-2xl backdrop-blur-sm`}>
      <div className="flex justify-center border-b border-slate-700/50">
        <TabButton isActive={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>
          Upload File
        </TabButton>
        <TabButton isActive={activeTab === 'search'} onClick={() => setActiveTab('search')}>
          Search Lecture
        </TabButton>
      </div>

      <div className="p-8">
        {activeTab === 'upload' && (
           <div 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative p-10 text-center border-2 border-dashed rounded-xl transition-all duration-300 ${
              isDragging ? 'border-cyan-400 bg-cyan-900/20' : 'border-slate-700'
            } ${error ? 'border-red-500' : ''}`}
          >
            <div className="flex justify-center mb-6">
              <div className="bg-slate-800 p-4 rounded-full border border-slate-700">
                <UploadIcon className="h-10 w-10 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload Your Lecture</h2>
            <p className="text-slate-400 mb-6">Drag & drop an audio or video file, or click to select.</p>
            <input
              id="file-upload"
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 transition-colors duration-200 shadow-lg"
            >
              Choose File
            </label>
            {error && (
                <p className="mt-4 text-red-400 font-medium">{error}</p>
            )}
          </div>
        )}
        
        {activeTab === 'search' && (
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Find a Lecture</h2>
            <p className="text-slate-400 mb-6">Search for a topic on YouTube to begin your analysis.</p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., 'History of the Roman Empire'"
                className="flex-grow bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-cyan-600 text-white font-bold p-3 rounded-lg hover:bg-cyan-500 transition-colors duration-200 shadow-lg flex items-center justify-center disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {isSearching ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <SearchIcon className="h-6 w-6" />}
              </button>
            </form>

            <div className="mt-8 min-h-[100px]">
              {isSearching && <p className="text-slate-300">Searching YouTube...</p>}
              {searchResults && (
                <>
                  <div className="space-y-4 text-left animate-fade-in">
                    {(showAllResults ? searchResults : searchResults.slice(0, 4)).map(video => (
                      <div key={video.videoId} className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-4 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all duration-200">
                        <img src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-32 h-20 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <h4 className="font-bold text-slate-100 truncate">{video.title}</h4>
                          <p className="text-sm text-slate-400">{video.channelName}</p>
                        </div>
                        <button 
                          onClick={() => handleSelectVideo(video)}
                          className="bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors duration-200 flex-shrink-0"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                  {searchResults.length > 4 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowAllResults(prev => !prev)}
                            className="bg-slate-700 text-slate-200 font-bold py-2 px-6 rounded-lg hover:bg-slate-600 transition-colors duration-200 flex items-center gap-2 mx-auto"
                        >
                            {showAllResults ? (
                                <>
                                    <ChevronUpIcon className="h-5 w-5" /> Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDownIcon className="h-5 w-5" /> Show More
                                </>
                            )}
                        </button>
                    </div>
                  )}
                </>
              )}
              {searchError && (
                <p className="mt-4 text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700 font-medium">{searchError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;