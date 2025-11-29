import React, { useState } from 'react';
import { extractAudioFromVideo } from '../services/audioConverter';
import { IconUpload, IconVideo, IconDownload, IconMusic } from './ui/Icons';
import { ProcessingState } from '../types';

const FileConverter: React.FC = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ isProcessing: false, error: null });
  const [conversionProgress, setConversionProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit to 1GB for conversion (higher than transcription, but still limited by browser memory)
      const LIMIT = 1024 * 1024 * 1024; // 1GB

      if (file.size > LIMIT) {
         setProcessingState({ isProcessing: false, error: "File too large. Max size for conversion is 1GB." });
         return;
      }
      setVideoFile(file);
      setConvertedFile(null);
      setProcessingState({ isProcessing: false, error: null });
      setConversionProgress(0);
    }
  };

  const handleConvert = async () => {
    if (!videoFile) return;

    setProcessingState({ isProcessing: true, error: null });
    setConversionProgress(0);

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const mp3File = await extractAudioFromVideo(videoFile, (progress) => {
        setConversionProgress(Math.round(progress * 100));
      });
      
      setConvertedFile(mp3File);
      setConversionProgress(100);
    } catch (err: any) {
      console.error(err);
      setProcessingState({ 
        isProcessing: false, 
        error: "Conversion failed. The video might be too long or the format unsupported by your browser." 
      });
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const downloadMp3 = () => {
    if (!convertedFile) return;
    const url = URL.createObjectURL(convertedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Video to Audio Converter</h2>
        <p className="text-slate-500">Extract audio track from large video files to reduce file size for transcription.</p>
        <p className="text-xs text-orange-500 font-semibold mt-1">Client-side processing (Privacy focused)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
             {!videoFile ? (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 hover:bg-orange-50 rounded-lg transition border-2 border-dashed border-slate-200 hover:border-orange-300 group">
                    <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                    <IconVideo className="w-12 h-12 text-slate-300 mb-3 group-hover:text-orange-400 transition" />
                    <span className="text-slate-600 font-medium group-hover:text-orange-600">Select Video File</span>
                    <span className="text-xs text-slate-400 mt-1">MP4, MOV, WebM (Max 1GB)</span>
                </label>
             ) : (
                 <div className="w-full flex flex-col items-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <IconVideo className="w-10 h-10 text-orange-600" />
                    </div>
                    <p className="font-medium text-slate-800 mb-1 truncate max-w-[250px]">{videoFile.name}</p>
                    <p className="text-xs text-slate-500 mb-8">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    <div className="flex gap-3">
                         <button 
                            onClick={() => { setVideoFile(null); setConvertedFile(null); }}
                            disabled={processingState.isProcessing}
                            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2"
                        >
                            Change File
                        </button>
                        <button 
                            onClick={handleConvert}
                            disabled={processingState.isProcessing}
                            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition shadow-lg shadow-orange-500/20"
                        >
                            {processingState.isProcessing ? 'Converting...' : 'Convert to MP3'}
                        </button>
                    </div>
                 </div>
             )}
        </div>

        {/* Output Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
            {processingState.error ? (
               <div className="text-center p-4">
                   <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                       <span className="text-2xl">⚠️</span>
                   </div>
                   <h3 className="text-red-600 font-medium mb-2">Conversion Error</h3>
                   <p className="text-sm text-slate-500">{processingState.error}</p>
               </div>
            ) : processingState.isProcessing ? (
                <div className="w-full max-w-xs text-center">
                    <div className="mb-4 flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <span>Converting Video</span>
                        <span>{conversionProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                            style={{ width: `${conversionProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 italic">Decoding audio track and encoding to MP3...</p>
                </div>
            ) : convertedFile ? (
                <div className="text-center animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconMusic className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Conversion Complete!</h3>
                    <p className="text-slate-500 text-sm mb-6">{convertedFile.name}</p>
                    <p className="text-slate-400 text-xs mb-6">Original: {(videoFile!.size / 1024 / 1024).toFixed(2)} MB → MP3: {(convertedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    <button 
                        onClick={downloadMp3}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-green-600/20 flex items-center gap-2 mx-auto"
                    >
                        <IconDownload className="w-5 h-5" /> Download MP3
                    </button>
                    <p className="text-xs text-slate-400 mt-4 max-w-xs mx-auto">
                        Download this file and upload it in the "Transcribe Media" tab.
                    </p>
                </div>
            ) : (
                <div className="text-center text-slate-400">
                    <IconMusic className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">MP3 output will appear here.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default FileConverter;