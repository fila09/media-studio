import { GoogleGenAI } from "@google/genai";
import { AnalyzeVideoRequest, TranscribeRequest } from "../types";

// Initialize Gemini Client
// We assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes audio (or audio from video) using gemini-2.5-flash.
 * Includes instructions for speaker diarization and timestamps.
 */
export const transcribeAudio = async (request: TranscribeRequest): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash";
    const isVideo = request.mimeType.startsWith('video/');
    
    let systemInstruction = "You are a professional transcription assistant.";
    
    // Building a specific prompt for the task
    // If it's a video, we explicitly ask to transcribe the speech from the video.
    let prompt = `Please transcribe the ${isVideo ? 'speech from the following video' : 'following audio file'} verbatim. \n`;
    
    if (request.identifySpeakers) {
      prompt += "Identify different speakers (e.g., Speaker 1, Speaker 2) and attribute the text to them. ";
    }
    
    prompt += "\nProvide timecodes at the beginning of each segment or speaker change in the format [MM:SS].";
    
    if (request.language) {
      prompt += `\nThe media is primarily in ${request.language}.`;
    }

    prompt += "\nIf there are background noises or unclear sections, note them in italics like [inaudible].";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: request.mimeType,
              data: request.audioData, // This can contain video base64 data as well
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Lower temperature for more accurate transcription
      }
    });

    return response.text || "No transcription generated.";
  } catch (error: any) {
    console.error("Transcription Error:", error);
    throw new Error(error.message || "Failed to transcribe media.");
  }
};

/**
 * Analyzes video using gemini-3-pro-preview.
 */
export const analyzeVideo = async (request: AnalyzeVideoRequest): Promise<string> => {
  try {
    const modelId = "gemini-3-pro-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: request.mimeType,
              data: request.videoData,
            },
          },
          {
            text: request.prompt || "Analyze this media and provide a detailed summary.",
          },
        ],
      },
      config: {
        systemInstruction: "You are an expert media analyst (video and audio). Provide detailed, structured insights.",
      }
    });

    return response.text || "No analysis generated.";
  } catch (error: any) {
    console.error("Video Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze media.");
  }
};

/**
 * Helper to convert Blob/File to Base64 string (without the data URL prefix)
 * Optimized to reduce memory overhead by avoiding array allocation from split().
 */
export const fileToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part using substring which is more memory efficient than split
      const commaIndex = result.indexOf(',');
      const base64Data = result.substring(commaIndex + 1);
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};