import React, { useState, useRef, useCallback } from 'react';
import { fileToBase64, transcribeAudio } from '../services/geminiService';
import { IconMic, IconUpload, IconStop, IconFileText, IconCopy, IconDownload, IconVideo } from './ui/Icons';
import { ProcessingState } from '../types';

const AudioTranscriber: React.FC = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({ isProcessing: false, error: null });
  const [transcription, setTranscription] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        setMediaFile(file);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setProcessingState({ isProcessing: false, error: null });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setProcessingState({ isProcessing: false, error: "Could not access microphone. Please check permissions." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit: 50MB to ensure browser stability (Base64 overhead causes OOM on larger files)
      const LIMIT = 50 * 1024 * 1024;

      if (file.size > LIMIT) {
          setProcessingState({ isProcessing: false, error: "File is too large. Max size is 50MB to prevent browser memory crashes." });
          return;
      }

      setMediaFile(file);
      setProcessingState({ isProcessing: false, error: null });
      setTranscription("");
    }
  };

  // Main Action
  const handleTranscribe = async () => {
    if (!mediaFile) return;

    setProcessingState({ isProcessing: true, error: null });
    
    try {
      const base64Data = await fileToBase64(mediaFile);
      const result = await transcribeAudio({
        audioData: base64Data,
        mimeType: mediaFile.type,
        identifySpeakers: true, 
        language: 'Russian, English' 
      });
      setTranscription(result);
    } catch (err: any) {
      setProcessingState({ isProcessing: false, error: err.message });
    } finally {
      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const copyToClipboard = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription);
    }
  };

  const downloadText = () => {
    if (!transcription) return;
    const element = document.createElement("a");
    const file = new Blob([transcription], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "transcription.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isVideo = mediaFile?.type.startsWith('video/');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Media Transcription</h2>
        <p className="text-slate-500">Record audio or upload audio/video files to get instant text.</p>
        <p className="text-xs text-blue-500 font-semibold mt-1">Powered by gemini-2.5-flash</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
          
          {!mediaFile ? (
            <>
              {isRecording ? (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                     <IconMic className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-red-500 font-medium mb-6">Recording...</p>
                  <button 
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-medium transition flex items-center gap-2"
                  >
                    <IconStop className="w-4 h-4" /> Stop
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <button 
                    onClick={startRecording}
                    className="w-20 h-20 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center mb-4 transition group"
                  >
                    <IconMic className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  </button>
                  <p className="text-slate-600 font-medium mb-8">Click to Record Audio</p>
                  
                  <div className="w-full flex items-center gap-4 mb-8">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Or Upload File</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg p-6 w-full text-center transition group">
                    <input 
                      type="file" 
                      accept="audio/*,video/mp4,video/quicktime,video/webm,video/x-m4v" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                    <IconUpload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-500" />
                    <span className="text-sm text-slate-500 group-hover:text-blue-600">Drop audio or video file here</span>
                    <br/>
                    <span className="text-xs text-slate-400 mt-1">Audio/Video up to 50MB</span>
                  </label>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center relative">
              
              {/* File Info Header */}
              <div className="flex flex-col items-center mb-6">
                <div className={`w-16 h-16 ${isVideo ? 'bg-purple-100' : 'bg-green-100'} rounded-full flex items-center justify-center mb-4`}>
                  {isVideo ? (
                    <IconVideo className="w-8 h-8 text-purple-600" />
                  ) : (
                    <IconFileText className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <p className="font-medium text-slate-800 mb-1 truncate max-w-[250px]">{mediaFile.name}</p>
                <p className="text-xs text-slate-500">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => setMediaFile(null)}
                  disabled={processingState.isProcessing}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium disabled:opacity-50"
                >
                  Change File
                </button>
                
                <button 
                  onClick={handleTranscribe}
                  disabled={processingState.isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-600/20"
                >
                  {processingState.isProcessing ? 'Transcribing...' : 'Transcribe Media'}
                </button>
              </div>
              
              {processingState.isProcessing && (
                <p className="text-xs text-slate-400 mt-4 animate-pulse">Sending to Gemini AI...</p>
              )}
            </div>
          )}
        </div>

        {/* Output Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[300px] h-[500px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h3 className="font-semibold text-slate-700">Transcription Result</h3>
            <div className="flex gap-2">
              <button onClick={copyToClipboard} title="Copy" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition">
                <IconCopy className="w-4 h-4" />
              </button>
              <button onClick={downloadText} title="Download" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition">
                <IconDownload className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-4 border border-slate-100">
             {processingState.error ? (
               <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-100">
                 Error: {processingState.error}
               </div>
             ) : transcription ? (
               <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                 {transcription}
               </div>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                 {processingState.isProcessing ? (
                    <div className="flex flex-col items-center">
                       <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                       <span>Processing media with AI...</span>
                    </div>
                 ) : (
                   "Transcription will appear here..."
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioTranscriber;