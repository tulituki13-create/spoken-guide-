import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, Volume2, Loader, AlertCircle, HelpCircle } from "lucide-react";
import { MicState, ChatMessage } from "../types";

interface LiveMicInteractionProps {
  studentName: string;
  selectedTutor: string;
  micState: MicState;
  setMicState: React.Dispatch<React.SetStateAction<MicState>>;
  onUserMessage: (payload: { text?: string; audio?: { mimeType: string, data: string } }) => Promise<string | null>;
  currentInterimTranscript: string;
  setCurrentInterimTranscript: (text: string) => void;
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
}

const LiveMicInteraction: React.FC<LiveMicInteractionProps> = ({
  studentName,
  selectedTutor,
  micState,
  setMicState,
  onUserMessage,
  currentInterimTranscript,
  setCurrentInterimTranscript,
  isMuted,
  setIsMuted,
}) => {
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cancelRequestedRef = useRef(false);
  const abortUploadRef = useRef(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const isProcessingRef = useRef(false);

  const startRecording = async () => {
    try {
      abortUploadRef.current = false;
      setRecognitionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      let chosenMimeType = mediaRecorder.mimeType || "audio/webm";
      chosenMimeType = chosenMimeType.split(';')[0];

      // Setup VAD (Voice Activity Detection)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphoneSource = audioContext.createMediaStreamSource(stream);
      microphoneSource.connect(analyser);
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      let hasSpoken = false;
      let reqFrame: number;

      const monitorAudio = () => {
        if (mediaRecorder.state !== "recording") return;

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (average > 15) { 
          hasSpoken = true;
          silenceStart = Date.now();
        } else {
          if (hasSpoken && Date.now() - silenceStart > 1500) { // 1.5 seconds silence after speech
            stopRecording();
            return;
          } else if (!hasSpoken && Date.now() - silenceStart > 5000) { // 5 secs absolute silence
             stopRecording();
             return;
          }
        }
        reqFrame = requestAnimationFrame(monitorAudio);
      };
      monitorAudio();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        cancelAnimationFrame(reqFrame);
        try { audioContext.close(); } catch(e){}
        
        if (isProcessingRef.current) return;
        
        if (abortUploadRef.current) {
          abortUploadRef.current = false;
          setMicState("ready");
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        isProcessingRef.current = true;
        setMicState("thinking");

        const audioBlob = new Blob(audioChunksRef.current, { type: chosenMimeType });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64String = base64data.split(',')[1];
          try {
            const responseText = await onUserMessage({
              audio: { mimeType: chosenMimeType, data: base64String }
            });
            if (responseText) {
              speakResponse(responseText);
            } else {
              setMicState("ready");
            }
          } catch (e) {
            console.error(e);
            setMicState("ready");
          } finally {
            isProcessingRef.current = false;
          }
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setMicState("listening");
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
         setRecognitionError("Microphone access denied. Please allow mic permissions in your browser.");
      } else {
         setRecognitionError(`Microphone access error: ${err instanceof Error ? err.message : String(err)}`);
      }
      setMicState("ready");
      // setSupported(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Convert AI reply to Voice Speech
  const speakResponse = (text: string) => {
    if (isMuted) {
      setMicState("ready");
      return;
    }

    if (window.speechSynthesis.speaking) {
      cancelRequestedRef.current = true;
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const isBengali = /[\u0980-\u09FF]/.test(text);

    const voices = window.speechSynthesis.getVoices();
    let preferredVoice;
    
    if (isBengali) {
      preferredVoice = voices.find((v) => v.lang.startsWith("bn")) || voices.find((v) => v.lang.startsWith("hi"));
      utterance.lang = "bn-IN";
    } else {
      preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en-") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel"))
      ) || voices.find((v) => v.lang.startsWith("en-"));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95; 
    utterance.pitch = 1.05; 

    cancelRequestedRef.current = false;
    utterance.onstart = () => setMicState("speaking");
    utterance.onend = () => {
      if (currentUtteranceRef.current !== utterance) return;
      setMicState((prev) => (prev === 'speaking' ? 'ready' : prev));
      if (!isMuted && !cancelRequestedRef.current) {
        setTimeout(() => {
          startRecording();
        }, 400);
      }
    };
    utterance.onerror = (e) => {
      if (currentUtteranceRef.current !== utterance) return;
      if (e.error !== "canceled") {
        console.error("Speech Synthesis error:", e);
      }
      setMicState((prev) => (prev === 'speaking' ? 'ready' : prev));
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (window.speechSynthesis.speaking) {
      cancelRequestedRef.current = true;
      window.speechSynthesis.cancel();
    }

    if (micState === "listening") {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="bg-[#0b1021]/90 backdrop-blur-md rounded-[2rem] p-8 border border-cyan-500/30 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.1)]">
      
      {/* Wave Accent background */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 opacity-80"></div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Voice characters/Mute Selector */}
      <div className="w-full flex justify-between items-center mb-10 z-10">
        <span className="text-xs font-mono font-black tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
          STATUS: {micState.toUpperCase()}
        </span>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              cancelRequestedRef.current = true;
              abortUploadRef.current = true;
              window.speechSynthesis.cancel();
              stopRecording();
              setMicState("ready");
            }}
            className="px-4 py-2 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase transition flex items-center gap-2 border cursor-pointer bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:border-red-400"
          >
            <Square className="w-3 h-3 fill-current" />
            ABORT
          </button>
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (nextMuted) {
                cancelRequestedRef.current = true;
                window.speechSynthesis.cancel();
                if (micState === "speaking") setMicState("ready");
              }
            }}
            className={`px-4 py-2 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase transition flex items-center gap-2 border cursor-pointer ${
              isMuted
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
            }`}
          >
            {isMuted ? <MicOff className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {isMuted ? "MUTED" : "LINK ACTIVE"}
          </button>
        </div>
      </div>

      {/* Primary Interaction Ring & Button */}
      <div className="relative flex items-center justify-center mt-2 mb-8 group z-10">
        {/* Animated Rings based on Mic State */}
        {micState === "listening" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Futuristic Outer dashed rotating ring */}
            <div className="absolute w-32 h-32 border border-dashed border-blue-400/30 rounded-full animate-[spin_15s_linear_infinite]"></div>
            
            {/* Futuristic Inner dashed rotating ring (reverse) */}
            <div className="absolute w-28 h-28 border border-dashed border-cyan-400/40 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
            
            {/* Dual glowing halo backdrops */}
            <div className="absolute w-24 h-24 bg-gradient-to-tr from-blue-500/20 via-cyan-400/20 to-indigo-500/25 rounded-full blur-md animate-[pulse_1.8s_ease-in-out_infinite]"></div>
            <div className="absolute w-36 h-36 bg-blue-500/5 rounded-full blur-2xl animate-pulse"></div>

            {/* Animated propagation rings (Ripples) */}
            <div className="absolute w-28 h-28 border border-blue-400/40 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
            <div className="absolute w-36 h-36 border border-cyan-400/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.6s]"></div>
            
            {/* Soundwave notch line effect overlays */}
            <div className="absolute w-32 h-32 border-2 border-y-transparent border-x-blue-500/20 rounded-full animate-[spin_6s_ease-in-out_infinite]"></div>
          </div>
        )}
        {micState === "thinking" && (
          <div className="absolute w-28 h-28 border-4 border-t-blue-500 border-slate-150 rounded-full animate-spin shadow-blue-50/50 shadow-inner"></div>
        )}
        {micState === "speaking" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-30 h-30 border border-dashed border-emerald-400/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute w-26 h-26 border border-dashed border-teal-400/40 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
            <div className="absolute w-24 h-24 bg-gradient-to-tr from-emerald-500/15 via-teal-400/20 to-green-500/10 rounded-full blur-md animate-[pulse_2s_ease-in-out_infinite]"></div>
            <div className="absolute w-28 h-28 border border-emerald-400/30 rounded-full animate-ping"></div>
          </div>
        )}

        <button
          onClick={toggleListening}
          disabled={micState === "thinking"}
          className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-lg transition-all duration-300 z-10 
            ${micState === 'listening' ? 'bg-red-500 hover:bg-red-600 scale-105 shadow-red-200 shadow-xl' : ''}
            ${micState === 'speaking' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 shadow-xl' : ''}
            ${micState === 'ready' ? 'bg-blue-500 hover:bg-blue-600 hover:scale-105 hover:shadow-blue-200 shadow-xl' : ''}
            ${micState === 'thinking' ? 'bg-slate-300 cursor-wait' : 'cursor-pointer'}
          `}
        >
          {micState === "ready" && <Mic className="w-10 h-10 text-white" />}
          {micState === "listening" && <Square className="w-8 h-8 text-white rounded-sm" />}
          {micState === "speaking" && <Volume2 className="w-10 h-10 text-white" />}
          {micState === "thinking" && <Loader className="w-10 h-10 text-white animate-spin" />}
        </button>
      </div>

      <div className="text-center z-10 w-full min-h-[40px] flex flex-col justify-center">
        {micState === "ready" && (
          <p className="text-sm font-semibold text-slate-600 pb-1">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 mr-2">Tap</span> 
            to talk to {selectedTutor || "Buddy"}
          </p>
        )}
        {micState === "listening" && (
          <p className="text-sm font-semibold text-red-600 flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Listening... Tap square to stop
          </p>
        )}
        {micState === "thinking" && <p className="text-sm font-semibold text-slate-500">Thinking...</p>}
        {micState === "speaking" && <p className="text-sm font-semibold text-emerald-600">{selectedTutor || "Buddy"} is speaking...</p>}
      </div>

      {recognitionError && (
        <div className="mt-6 flex flex-col items-center bg-red-50 border border-red-100 rounded-xl p-3 w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold text-center leading-sm mb-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {recognitionError}
          </div>
        </div>
      )}

      {/* Voice mode fallback hint */}
      {!supported && (
        <div className="w-full mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Microphone Mode Unsupported:</span> Your browser does not fully support live speech. Please use Chrome or Edge for the best voice experience.
          </div>
        </div>
      )}
    </div>
  );
};

export { LiveMicInteraction };
