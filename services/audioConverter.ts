
/**
 * Service to extract audio from video and encode to MP3 client-side.
 * Uses Web Audio API for decoding and lamejs for encoding.
 */

export const extractAudioFromVideo = async (
  videoFile: File, 
  onProgress?: (progress: number) => void
): Promise<File> => {
  // Check if lamejs is loaded
  if (typeof (window as any).lamejs === 'undefined') {
    throw new Error("Audio encoder library (lamejs) not loaded.");
  }

  // 1. Read the file into an ArrayBuffer
  const arrayBuffer = await videoFile.arrayBuffer();

  // 2. Decode the audio data using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // 3. Resample/Mixdown configuration
  // We use 16kHz Mono which is optimal for Speech-to-Text APIs (saves space and bandwidth)
  const TARGET_SAMPLE_RATE = 16000; 
  const CHANNELS = 1;

  // 4. Render the audio to the target format
  const offlineCtx = new OfflineAudioContext(CHANNELS, audioBuffer.duration * TARGET_SAMPLE_RATE, TARGET_SAMPLE_RATE);
  
  // Create a buffer source from the decoded data
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();

  // Render
  const resampledBuffer = await offlineCtx.startRendering();

  // 5. Encode to MP3 using lamejs
  // 64kbps is sufficient for high quality speech recognition
  const mp3encoder = new (window as any).lamejs.Mp3Encoder(CHANNELS, TARGET_SAMPLE_RATE, 64);
  const samples = resampledBuffer.getChannelData(0);
  
  // Convert Float32 samples to Int16 for the encoder
  const sampleBlockSize = 1152; // Must be a multiple of 576
  const mp3Data: Int8Array[] = [];
  
  const int16Samples = new Int16Array(samples.length);
  for(let i = 0; i < samples.length; i++) {
     // Clamp and scale to 16-bit integer range
     let s = Math.max(-1, Math.min(1, samples[i]));
     int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  let remaining = int16Samples.length;
  let offset = 0;
  
  // Process in chunks
  while (remaining >= sampleBlockSize) {
      const chunk = int16Samples.subarray(offset, offset + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
      }
      remaining -= sampleBlockSize;
      offset += sampleBlockSize;
      
      // Update progress roughly every 100 blocks
      if (onProgress && offset % (sampleBlockSize * 100) === 0) {
          onProgress(offset / int16Samples.length);
      }
  }
  
  // Flush the encoder
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
  }
  
  // 6. Create the MP3 File
  const blob = new Blob(mp3Data, { type: 'audio/mp3' });
  const newFileName = videoFile.name.replace(/\.[^/.]+$/, "") + ".mp3";
  
  return new File([blob], newFileName, { type: 'audio/mp3' });
};
