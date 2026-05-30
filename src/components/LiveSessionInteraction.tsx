import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader, AlertCircle, MicOff, Check, Volume2 } from "lucide-react";
import { MicState } from "../types";

function pcmToBase64(pcmData: Float32Array): string {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, s, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToPcm(base64: string): Float32Array {
  const binary = window.atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new DataView(buffer);
  for (let i = 0; i < binary.length; i++) {
    view.setUint8(i, binary.charCodeAt(i));
  }
  const int16Array = new Int16Array(buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768;
  }
  return float32Array;
}

function createWavBase64(chunks: Float32Array[]): string {
  const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
  const combined = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  const pcm16 = new Int16Array(totalLength);
  for (let i = 0; i < totalLength; i++) {
    let s = Math.max(-1, Math.min(1, combined[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const wavBuffer = new ArrayBuffer(44 + pcm16.byteLength);
  const view = new DataView(wavBuffer);
  view.setUint32(0, 1380533830, false);
  view.setUint32(4, 36 + pcm16.byteLength, true);
  view.setUint32(8, 1463899717, false);
  view.setUint32(12, 1718449184, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 16000 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 1684108385, false);
  view.setUint32(40, pcm16.byteLength, true);
  new Int16Array(wavBuffer, 44).set(pcm16);
  let binary = '';
  const bytes = new Uint8Array(wavBuffer);
  for (let i = 0; i < bytes.length; i += 8192) {
     binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 8192)));
  }
  return window.btoa(binary);
}

interface LiveSessionProps {
  selectedTutor: string;
  scenarioId: string | null;
  pdfStoreId?: string | null;
  selectedVoice?: string;
  onTranscript: (text: string, isModel: boolean, isFinal: boolean) => void;
  onSessionEnd?: (durationSec: number, userAudio?: string) => void;
  isTimeExhausted?: boolean;
}

export const LiveSessionInteraction: React.FC<LiveSessionProps> = ({ selectedTutor, scenarioId, pdfStoreId, selectedVoice = "Zephyr", onTranscript, onSessionEnd, isTimeExhausted }) => {
  const [micState, setMicState] = useState<MicState>("ready");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasNotifiedTimeLimit, setHasNotifiedTimeLimit] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const userAudioChunksRef = useRef<Float32Array[]>([]);
  const lastModelAudioEndTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);
  const transcriptIntervalRef = useRef<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    analyser.fftSize = 512; // Gives a smoother curve
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isActiveRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyser.getByteTimeDomainData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.stroke();
    };
    
    draw();
  };

  const stopSession = () => {
    const wasActive = micState !== "ready";
    isActiveRef.current = false;
    setIsMuted(false);
    isMutedRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (transcriptIntervalRef.current) {
      clearInterval(transcriptIntervalRef.current);
      transcriptIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current && audioCtxRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    let userAudioBase64 = "";
    if (userAudioChunksRef.current.length > 0) {
      try {
        userAudioBase64 = createWavBase64(userAudioChunksRef.current);
      } catch (err) {
        console.error("Failed to compile user audio chunks to WAV base64:", err);
      }
    }

    setMicState("ready");
    if (wasActive && onSessionEnd) {
      const durationSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      onSessionEnd(Math.max(0, durationSec), userAudioBase64);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMutedRef.current;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !newMuted);
    }
  };

  useEffect(() => {
    if (scenarioId) {
      const timer = setTimeout(() => {
        startSession();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopSession();
      };
    } else {
      stopSession();
    }
  }, [scenarioId, selectedVoice, selectedTutor]);

  useEffect(() => {
    if (isTimeExhausted && isActiveRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !hasNotifiedTimeLimit) {
      setHasNotifiedTimeLimit(true);
      // Mute user so they can't talk anymore
      setIsMuted(true);
      isMutedRef.current = true;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(t => t.enabled = false);
      }
      
      // Tell Gemini they are out of time
      wsRef.current.send(JSON.stringify({ text: "SYSTEM ERROR: The user has exhausted their free usage limit. You MUST immediately say to them: 'Your free daily 3-minute practice time has expired. Please log in or subscribe to Premium to continue our conversation. Goodbye for now!' or a nice equivalent. Say this immediately, and then firmly end your turn so the system can close." }));
      
      // Force session stop after giving Gemini some time to deliver the message
      setTimeout(() => {
        if (isActiveRef.current) {
          stopSession();
        }
      }, 12000); // 12 seconds buffer to allow Gemini to speak
    }
  }, [isTimeExhausted, hasNotifiedTimeLimit]);

  const startSession = async () => {
    try {
      isActiveRef.current = true;
      sessionStartTimeRef.current = Date.now();
      setError(null);
      setMicState("thinking");

      // Setup WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let wsUrl = `${protocol}//${window.location.host}/live?tutorName=${encodeURIComponent(selectedTutor)}&voice=${selectedVoice}`;
      if (scenarioId) {
        wsUrl += `&scenarioId=${encodeURIComponent(scenarioId)}`;
      }
      if (pdfStoreId) {
        wsUrl += `&pdfId=${encodeURIComponent(pdfStoreId)}`;
      }
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        wsUrl += `&auth=${encodeURIComponent(token)}`;
      }
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // We will handle user transcript via Gemini /api/transcribe by pooling audio chunks
      ws.onopen = async () => {
        userAudioChunksRef.current = [];
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          audioCtxRef.current = audioCtx;

          const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          streamRef.current = stream;

          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          const analyser = audioCtx.createAnalyser();
          analyserRef.current = analyser;

          source.connect(processor);
          processor.connect(audioCtx.destination);
          source.connect(analyser);

          processor.onaudioprocess = (e) => {
            const pcmData = e.inputBuffer.getChannelData(0);
            const isModelSpeakingOrJustFinished = activeSourcesRef.current.length > 0 || (Date.now() - lastModelAudioEndTimeRef.current < 1500);
            const userMuted = isMutedRef.current;
            
            if (!isModelSpeakingOrJustFinished && !userMuted) {
              userAudioChunksRef.current.push(new Float32Array(pcmData));
            }
            if (ws.readyState === WebSocket.OPEN && !isModelSpeakingOrJustFinished && !userMuted) {
              const base64 = pcmToBase64(pcmData);
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };

          setMicState("listening");
          nextStartTimeRef.current = audioCtx.currentTime + 0.1;

          drawWaveform();

          // If the user immediately started a session but they are exhausted, trigger the limit message!
          if (isTimeExhausted && !hasNotifiedTimeLimit) {
            setHasNotifiedTimeLimit(true);
            setIsMuted(true);
            isMutedRef.current = true;
            if (streamRef.current) streamRef.current.getAudioTracks().forEach(t => t.enabled = false);
            ws.send(JSON.stringify({ text: "SYSTEM ERROR: The user has exhausted their free usage limit right now. You MUST immediately say to them: 'Your free daily 3-minute practice time has expired, or you have no more free tries left! Please log in or subscribe to Premium to continue our conversation. Goodbye for now!' or a nice equivalent. Say this immediately, and then firmly end your turn so the system can close." }));
            setTimeout(() => { if (isActiveRef.current) stopSession(); }, 12000);
          }

          // Setup speech recognition for user's voice (instead of polling backend API)
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = "en-US"; // Practice English speaking primarily
            
            recognition.onresult = (event: any) => {
              if (isMutedRef.current) return;
              let finalTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                }
              }
              if (finalTranscript.trim()) {
                onTranscript(finalTranscript.trim(), false, true);
              }
            };
            
            recognition.onerror = (e: any) => console.log('Speech recognition error', e);
            
            recognition.onend = () => {
              // Restart recognition if session is still active
              if (isActiveRef.current) {
                try { recognition.start(); } catch(e) {}
              }
            };
            
            recognitionRef.current = recognition;
            try {
              recognition.start();
            } catch (err) {
              console.log("Recognition start error", err);
            }
          }

        } catch (e: any) {
          setError("Microphone error: " + e.message);
          stopSession();
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.interrupted) {
          // Clear remaining audio by advancing start time and stopping active sources
          activeSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) {}
          });
          activeSourcesRef.current = [];
          lastModelAudioEndTimeRef.current = Date.now();
          if (audioCtxRef.current) {
            nextStartTimeRef.current = audioCtxRef.current.currentTime + 0.1;
          }
        }
        if (msg.text) {
          onTranscript(msg.text, true, true);
        }
        if (msg.audio) {
          if (!audioCtxRef.current) return;
          const audioCtx = audioCtxRef.current;
          
          const pcmData = base64ToPcm(msg.audio);
          const audioBuffer = audioCtx.createBuffer(1, pcmData.length, 24000);
          audioBuffer.copyToChannel(pcmData, 0);

          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          
          source.onended = () => {
             activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
             lastModelAudioEndTimeRef.current = Date.now();
          };
          activeSourcesRef.current.push(source);

          const startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
          source.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
        }
      };

      ws.onerror = () => {
        setError("Connection error. Try again.");
        stopSession();
      };
      
      ws.onclose = () => {
        stopSession();
      };

    } catch (e: any) {
      setError("Setup error: " + e.message);
      stopSession();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border-white flex flex-col gap-4 relative overflow-hidden min-h-[180px]">
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 opacity-60"></div>

      {/* Top Meta info */}
      <div className="w-full flex justify-between items-center z-10-compact">
        <span className="text-xxs font-mono font-bold text-slate-400 tracking-wider">
          ক্লাসরুম // রিয়েল-টাইম লাইভ
        </span>
        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold bg-blue-50/75 px-3 py-1 rounded-full select-none shadow-sm">
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          লাইভ ভয়েস (Voice Active)
        </div>
      </div>

      {/* 2. Audio visualizer and main interaction mic button */}
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[130px] group z-10 w-full">
        <canvas 
          ref={canvasRef} 
          width={280} 
          height={60} 
          className={`absolute pointer-events-none transition-opacity duration-300 ${micState === 'listening' ? 'opacity-100' : 'opacity-0'} z-0`}
        />
        
        <div className="flex items-center justify-center w-full gap-6 z-10 relative">
          {micState === "listening" && (
            <button
              onClick={toggleMute}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 shadow-md border ${
                isMuted ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <div className="relative flex items-center justify-center">
            {micState === "listening" && (
              <>
                <div className="absolute w-28 h-28 bg-blue-400 opacity-20 rounded-full animate-ping"></div>
                <div className="absolute w-32 h-32 bg-blue-300 opacity-10 rounded-full animate-pulse delay-75"></div>
              </>
            )}
            {micState === "thinking" && (
              <div className="absolute w-24 h-24 border-4 border-t-blue-500 border-slate-100 rounded-full animate-spin"></div>
            )}

            <button
              onClick={micState === "ready" ? startSession : stopSession}
              disabled={micState === "thinking"}
              className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 z-10 
                ${micState === 'listening' ? 'bg-red-500 hover:bg-red-600 scale-105 shadow-red-200 shadow-xl' : ''}
                ${micState === 'ready' ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105 hover:shadow-blue-200 shadow-xl' : ''}
                ${micState === 'thinking' ? 'bg-slate-300 cursor-wait' : 'cursor-pointer'}
              `}
            >
              {micState === "ready" && <Mic className="w-8 h-8 text-white" />}
              {micState === "listening" && <Square className="w-6 h-6 text-white rounded-sm" />}
              {micState === "thinking" && <Loader className="w-8 h-8 text-white animate-spin" />}
            </button>
          </div>

          {micState === "listening" && (
            <div className="w-12 h-12 invisible"></div>
          )}
        </div>
      </div>

      <div className="text-center z-10 w-full min-h-[40px] flex flex-col justify-center pb-2">
        {micState === "ready" && (
          <p className="text-sm font-semibold text-slate-500">
            টপিক নির্বাচন করুন - লাইভ সেশন স্বয়ংক্রিয়ভাবে শুরু হবে! (Choose a topic to start live talking immediately)
          </p>
        )}
        {micState === "thinking" && (
          <p className="text-sm font-bold text-blue-600 animate-pulse">
            লাইভ সেশন কানেক্ট হচ্ছে... (Connecting to Gemini Live...)
          </p>
        )}
        {micState === "listening" && (
          <p className="text-sm font-semibold text-red-600 animate-pulse">
            লাইভ স্ট্রিম চলছে। স্বাভাবিকভাবে ইংরেজি বলুন! (Live Voice Active. Speak in English!)
          </p>
        )}
      </div>

      {error && (
        <div className="w-full flex flex-col items-center bg-red-50 border border-red-100 rounded-xl p-3 z-10">
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold text-center leading-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
};
