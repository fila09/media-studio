export enum AppMode {
  AUDIO_TRANSCRIPTION = 'AUDIO_TRANSCRIPTION',
  VIDEO_UNDERSTANDING = 'VIDEO_UNDERSTANDING',
  AUDIO_CONVERTER = 'AUDIO_CONVERTER',
}

export interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
  progress?: string;
}

export interface TranscribeRequest {
  audioData: string; // Base64
  mimeType: string;
  language?: string;
  identifySpeakers?: boolean;
}

export interface AnalyzeVideoRequest {
  videoData: string; // Base64
  mimeType: string;
  prompt: string;
}

export interface TranscriptionResult {
  text: string;
  detectedLanguage?: string;
}

export interface AnalysisResult {
  text: string;
}