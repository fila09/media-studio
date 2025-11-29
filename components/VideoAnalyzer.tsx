import React, { useState } from 'react';
import { fileToBase64, analyzeVideo } from '../services/geminiService';
import { IconUpload, IconVideo, IconCopy, IconMusic } from './ui/Icons';
import { ProcessingState } from '../types';

const VideoAnalyzer: React.FC = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ isProcessing: false, error: null });
  const [analysis, setAnalysis] = useState<string>("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  // Language state for the prompt
  const [promptLanguage, setPromptLanguage] = useState<'en' | 'ru'>('ru');
  
  const getDefaultPrompt = (lang: 'en' | 'ru', isAudio: boolean) => {
    const typeEn = isAudio ? "audio" : "video";
    const typeRu = isAudio ? "аудио" : "видео";
    
    if (lang === 'ru') {
      return `Проанализируй это ${typeRu}. Составь подробное краткое содержание, выдели ключевых спикеров и перечисли основные темы. Ответ дай на русском языке.`;
    }
    return `Summarize this ${typeEn}, identify the key speakers, and provide a list of main topics discussed.`;
  };

  const [prompt, setPrompt] = useState<string>(getDefaultPrompt('ru', false));

  const handleLanguageChange = (lang: 'en' | 'ru') => {
    setPromptLanguage(lang);
    const isAudio = mediaFile?.type.startsWith('audio/') ?? false;
    setPrompt(getDefaultPrompt(lang, isAudio));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic size check for client-side base64 limitations (Max 50MB to avoid OOM)
      if (file.size > 50 * 1024 * 1024) {
         setProcessingState({ isProcessing: false, error: "File too large. Max size is 50MB to prevent browser crashes." });
         return;
      }
      setMediaFile(file);
      setProcessingState({ isProcessing: false, error: null });
      setAnalysis("");
      
      // Update prompt based on file type
      const isAudio = file.type.startsWith('audio/');
      setPrompt(getDefaultPrompt(promptLanguage, isAudio));
    }
  };

  const handleAnalyze = async () => {
    if (!mediaFile) return;

    setProcessingState({ isProcessing: true, error: null });
    
    try {
      const base64Data = await fileToBase64(mediaFile);
      const result = await analyzeVideo({
        videoData: base64Data,
        mimeType: mediaFile.type,
        prompt: prompt
      });
      setAnalysis(result);
    } catch (err: any) {
      setProcessingState({ isProcessing: false, error: err.message });
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const isAudio = mediaFile?.type.startsWith('audio/');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Media Understanding</h2>
        <p className="text-slate-500">Upload a video or audio file to get detailed analysis, summaries, and insights.</p>
        <p className="text-xs text-purple-500 font-semibold mt-1">Powered by gemini-3-pro-preview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Section */}
        <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[200px] flex flex-col items-center justify-center">
                 {!mediaFile ? (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 hover:bg-purple-50 rounded-lg transition border-2 border-dashed border-slate-200 hover:border-purple-300 group">
                        <input type="file" accept="video/*,audio/mp3,audio/mpeg,audio/wav,audio/aac" onChange={handleFileUpload} className="hidden" />
                        <div className="flex gap-2 mb-3">
                           <IconVideo className="w-10 h-10 text-purple-200 group-hover:text-purple-300 transition" />
                           <IconMusic className="w-10 h-10 text-purple-200 group-hover:text-purple-300 transition" />
                        </div>
                        <span className="text-slate-600 font-medium">Upload Video or Audio</span>
                        <span className="text-xs text-slate-400 mt-1">MP4, MP3, WAV, MOV (Max 50MB)</span>
                    </label>
                 ) : (
                     <div className="w-full flex flex-col items-center">
                        <div className={`w-16 h-16 ${isAudio ? 'bg-purple-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mb-4`}>
                            {isAudio ? (
                                <IconMusic className="w-8 h-8 text-purple-600" />
                            ) : (
                                <IconVideo className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                        <p className="font-medium text-slate-800 mb-1 truncate max-w-[250px]">{mediaFile.name}</p>
                        <p className="text-xs text-slate-500 mb-6">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button 
                            onClick={() => setMediaFile(null)}
                            className="text-sm text-red-500 hover:text-red-700 font-medium"
                        >
                            Remove
                        </button>
                     </div>
                 )}
            </div>

            {/* Prompt Config */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-700">Analysis Prompt</label>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button 
                            onClick={() => handleLanguageChange('en')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition ${promptLanguage === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => handleLanguageChange('ru')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition ${promptLanguage === 'ru' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Русский
                        </button>
                    </div>
                </div>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    rows={4}
                    placeholder={promptLanguage === 'ru' ? "Спросите Gemini о файле..." : "Ask Gemini something about the file..."}
                />
                <button 
                  onClick={handleAnalyze}
                  disabled={!mediaFile || processingState.isProcessing}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition shadow-lg shadow-purple-600/20"
                >
                  {processingState.isProcessing ? (promptLanguage === 'ru' ? 'Анализ...' : 'Analyzing...') : (promptLanguage === 'ru' ? 'Начать анализ' : 'Start Analysis')}
                </button>
            </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                <h3 className="font-semibold text-slate-700">{promptLanguage === 'ru' ? 'Результат анализа' : 'Analysis Results'}</h3>
                <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(analysis)} title="Copy" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition">
                        <IconCopy className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-4 border border-slate-100">
             {processingState.error ? (
               <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-100">
                 Error: {processingState.error}
               </div>
             ) : analysis ? (
               <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                 {analysis}
               </div>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                 {processingState.isProcessing ? (
                    <div className="flex flex-col items-center">
                       <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3"></div>
                       <span>{promptLanguage === 'ru' ? 'Смотрю и думаю...' : 'Thinking...'}</span>
                    </div>
                 ) : (
                   promptLanguage === 'ru' ? 'Результаты появятся здесь...' : 'Insights will appear here...'
                 )}
               </div>
             )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default VideoAnalyzer;