import React, { useState } from 'react';
import { AppMode } from './types';
import AudioTranscriber from './components/AudioTranscriber';
import VideoAnalyzer from './components/VideoAnalyzer';
import FileConverter from './components/FileConverter';
import { IconMic, IconVideo, IconMusic } from './components/ui/Icons';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.AUDIO_TRANSCRIPTION);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                G
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">Gemini Media Studio</span>
            </div>
            <nav className="flex space-x-1 overflow-x-auto">
              <button
                onClick={() => setMode(AppMode.AUDIO_TRANSCRIPTION)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  mode === AppMode.AUDIO_TRANSCRIPTION
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <IconMic className="w-4 h-4" />
                Transcribe Media
              </button>
              <button
                onClick={() => setMode(AppMode.VIDEO_UNDERSTANDING)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  mode === AppMode.VIDEO_UNDERSTANDING
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <IconVideo className="w-4 h-4" />
                Video Understanding
              </button>
              <button
                onClick={() => setMode(AppMode.AUDIO_CONVERTER)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  mode === AppMode.AUDIO_CONVERTER
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <IconMusic className="w-4 h-4" />
                Video to Audio
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 min-h-[600px]">
          {mode === AppMode.AUDIO_TRANSCRIPTION && <AudioTranscriber />}
          {mode === AppMode.VIDEO_UNDERSTANDING && <VideoAnalyzer />}
          {mode === AppMode.AUDIO_CONVERTER && <FileConverter />}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
         <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
           <p>© 2024 Gemini Media Studio. Built with Google Gemini API.</p>
         </div>
      </footer>
    </div>
  );
}

export default App;