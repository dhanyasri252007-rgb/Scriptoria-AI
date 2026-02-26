
import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, AlertCircle, Compass, ScrollText, Languages } from 'lucide-react';
import Uploader from './components/Uploader';
import ResultView from './components/ResultView';
import { ManuscriptFile, AppMode } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<ManuscriptFile | null>(null);
  const [mode, setMode] = useState<AppMode>(AppMode.FULL);
  const [history, setHistory] = useState<ManuscriptFile[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 850) setMode(AppMode.EXTENSION);
      else setMode(AppMode.FULL);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const newFile: ManuscriptFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        preview: base64,
        base64: base64,
        mimeType: file.type,
        timestamp: Date.now(),
        status: 'processing'
      };

      setCurrentFile(newFile);

      try {
        const result = await geminiService.processManuscript(base64, file.type);
        const updatedFile: ManuscriptFile = { ...newFile, status: 'completed', result };
        setCurrentFile(updatedFile);
        setHistory(prev => [updatedFile, ...prev]);
      } catch (error) {
        console.error(error);
        setCurrentFile(prev => prev ? {
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : "Failed to process the uploaded image."
        } : null);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setCurrentFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen transition-all duration-700">
      {/* Decorative Top Bar */}
      <div className="h-2 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 border-b border-black/10"></div>

      {/* Main Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-5">
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-amber-900 rounded-sm flex items-center justify-center text-amber-100 shadow-xl border-2 border-amber-800 relative flex-shrink-0">
            <ScrollText className="w-5 h-5 sm:w-9 sm:h-9" />
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-amber-200/50"></div>
          </div>
          <div>
            <h1 className="ancient-title text-3xl sm:text-5xl lg:text-6xl text-stone-800 leading-none tracking-tight">SCRIPTORIA-AI</h1>
            <p className="manuscript-font text-xs sm:text-sm text-stone-500 italic mt-1 sm:mt-2 font-bold uppercase tracking-[0.2em]">Manuscript Modernizer</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Digital Scribe</span>
            <span className="ancient-title text-2xl text-amber-900/60 leading-none">ARCHIVE</span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-amber-900/20 flex items-center justify-center text-amber-900/60 shadow-inner">
            <Languages className="w-6 h-6" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {!currentFile ? (
          <div className="space-y-10 sm:space-y-16 py-6 sm:py-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="ancient-title text-2xl sm:text-4xl text-stone-800">Ancient Texts, Modern Words</h2>
              <div className="h-px w-32 bg-amber-900/30 mx-auto"></div>
            </div>

            <Uploader onUpload={handleUpload} />

            {history.length > 0 && mode === AppMode.FULL && (
              <div className="space-y-8 pt-6 sm:pt-12">
                <h3 className="ancient-title text-2xl sm:text-3xl text-stone-500 border-b border-stone-200 inline-block pr-8 sm:pr-16 pb-2">Recent Archives</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-8">
                  {history.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentFile(item)}
                      className="group relative aspect-[3/4] parchment rounded-sm overflow-hidden border-2 border-stone-400 hover:border-amber-900 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-2"
                    >
                      <img src={item.preview} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity grayscale-[0.2] sepia-[0.3]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent flex items-end p-2 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="manuscript-font text-[10px] text-amber-50 font-bold uppercase tracking-wider truncate">{item.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12 py-4 sm:py-8">
            {/* Status Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={reset}
                className="group flex items-center text-xs font-bold uppercase tracking-[0.2em] text-amber-900 hover:text-amber-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-700" /> Start New
              </button>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full shadow-inner ${currentFile.status === 'completed' ? 'bg-green-600' :
                    currentFile.status === 'processing' ? 'bg-amber-600 animate-pulse' : 'bg-red-600'
                  }`}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  {currentFile.status}
                </span>
              </div>
            </div>

            {/* Processing */}
            {currentFile.status === 'processing' && (
              <div className="flex flex-col items-center justify-center py-20 sm:py-40 space-y-8 sm:space-y-10 parchment border-2 border-stone-800/20 rounded-sm corner-decoration">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 border-8 border-t-amber-900 border-r-transparent border-b-amber-900/20 border-l-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Compass className="w-8 h-8 sm:w-12 sm:h-12 text-amber-900/30 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3 sm:space-y-4 px-4">
                  <h3 className="ancient-title text-3xl sm:text-4xl text-stone-800">Deciphering...</h3>
                  <p className="manuscript-font italic text-stone-500 text-base sm:text-xl max-w-md">Our algorithm is currently tracing the ancient strokes of the provided script.</p>
                </div>
              </div>
            )}

            {/* Error */}
            {currentFile.status === 'error' && (
              <div className="p-8 sm:p-20 parchment border-2 border-red-900/30 text-center space-y-6 sm:space-y-8 rounded-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-900/10 text-red-900 rounded-full flex items-center justify-center mx-auto border-2 border-red-900/20 shadow-xl">
                  <AlertCircle className="w-9 h-9 sm:w-12 sm:h-12" />
                </div>
                <div className="space-y-3">
                  <h3 className="ancient-title text-3xl sm:text-4xl text-red-900">Analysis Error</h3>
                  <p className="manuscript-font text-red-800 italic text-base sm:text-xl">{currentFile.error}</p>
                </div>
                <button
                  onClick={reset}
                  className="bg-amber-900 text-amber-50 px-8 sm:px-10 py-3 rounded-sm ancient-title text-xl sm:text-2xl hover:bg-amber-800 shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  Go Back
                </button>
              </div>
            )}

            {/* Results */}
            {currentFile.status === 'completed' && currentFile.result && (
              <ResultView
                result={currentFile.result}
                imagePreview={currentFile.preview}
                mimeType={currentFile.mimeType}
                onSearchAnother={reset}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
