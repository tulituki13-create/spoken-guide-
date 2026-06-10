// Relaxing UI Synthesizer Sound Engine

let audioCtx: AudioContext | null = null;
let isAudioInitialized = false;

export const initAudioCtx = () => {
  if (typeof window !== 'undefined' && !audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
};

export const playWaterDrop = (volumeScale = 1) => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1 * volumeScale, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001 * volumeScale, t + 0.3);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(t);
  osc.stop(t + 0.3);
};

export const playAirSwoosh = (volumeScale = 1) => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  
  // Create noise buffer
  const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 seconds of noise
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // white noise
  }
  
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, t);
  filter.frequency.linearRampToValueAtTime(800, t + 0.2);
  filter.frequency.linearRampToValueAtTime(400, t + 0.5);
  filter.Q.value = 1.0;
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.05 * volumeScale, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001 * volumeScale, t + 0.5);
  
  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noiseSource.start(t);
};

export const playBirdChirp = (volumeScale = 1) => {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, t);
  osc.frequency.exponentialRampToValueAtTime(3000, t + 0.1);
  osc.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.03 * volumeScale, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001 * volumeScale, t + 0.2);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(t);
  osc.stop(t + 0.2);
};
