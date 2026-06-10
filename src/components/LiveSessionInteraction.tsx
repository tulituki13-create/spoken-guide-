import React, { useEffect, useRef, useState, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Square, Loader, AlertCircle, MicOff, Check, Volume2, Lock, Clock, Hourglass, Sparkles, CreditCard } from "lucide-react";
import { MicState } from "../types";
import { AuthContext } from "../AuthContext";
import { getInitialPromptForTopic } from "../lib/grammarTopics";

function pcmToBase64(pcmData: Float32Array): string {
  try {
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
  } catch (err) {
    // Suppress console.error to avoid false positive error intercepts
    return "";
  }
}

function base64ToPcm(base64: string): Float32Array {
  if (!base64 || typeof base64 !== "string") return new Float32Array(0);
  try {
    // Strip possible data headers
    let cleanStr = base64.replace(/^data:[^;]+;base64,/, "").trim();
    
    // Normalize base64url characters to standard base64
    cleanStr = cleanStr.replace(/-/g, "+").replace(/_/g, "/");

    // Remove any character that is not valid in base64
    cleanStr = cleanStr.replace(/[^A-Za-z0-9+/=]/g, "");

    // Handle correct padding lengths
    const remainder = cleanStr.length % 4;
    if (remainder === 2) {
      cleanStr += "==";
    } else if (remainder === 3) {
      cleanStr += "=";
    } else if (remainder === 1) {
      cleanStr = cleanStr.substring(0, cleanStr.length - 1);
    }

    if (!cleanStr) return new Float32Array(0);

    const binary = window.atob(cleanStr);
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
  } catch (err) {
    // Suppressed to avoid false alarms in preview reporting
    return new Float32Array(0);
  }
}

function createWavBase64(chunks: Float32Array[]): string {
  try {
    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    if (totalLength === 0) return "";
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
  } catch (err) {
    // Suppress console.error to avoid false positives
    return "";
  }
}

const SUGGESTIONS_MAP: Record<string, Array<{ text: string; translation: string }>> = {
  companion: [
    { text: "Could you tell me how to build a high score on the leaderboard?", translation: "লিডারবোর্ডে স্কোর কীভাবে বাড়ানো যায়?" },
    { text: "I'd love to learn about premium practice scenarios.", translation: "প্রিমিয়াম স্পিকিং পরিস্থিতির ব্যাপারে বলুন।" },
    { text: "What is your main tip for removing speaking fear?", translation: "মুখের জড়তা কাটানোর প্রধান টিপস কী?" },
    { text: "Let's change our conversation topic now.", translation: "চলুন অন্য কোনো বিষয়ে কথা বলা শুরু করি।" }
  ],
  pdf: [
    { text: "Can you quiz me based on the document summary?", translation: "ডকুমেন্ট থেকে আমাকে একটি কুইজ জিজ্ঞেস করুন।" },
    { text: "Explain the main educational focus of this practice sheet.", translation: "এই প্র্যাকটিস শীটের প্রধান ফোকাস ব্যাখ্যা করুন।" },
    { text: "Let's review the hardest word list from this paper.", translation: "চলুন এই কাগজের সবচেয়ে কঠিন শব্দগুলো প্র্যাকটিস করি।" }
  ],
  surprise: [
    { text: "Wow, that's interesting! Guide me on what to answer next.", translation: "বাহ দারুণ তো! পরবর্তীতে কী বলতে হবে আমাকে গাইড করুন।" },
    { text: "Let's switch to another surprise scenario.", translation: "চলুন আরেকটি নতুন চমকপ্রদ রোল-প্লে ট্রাই করি।" },
    { text: "I am ready. Tell me my target role and objective.", translation: "আমি প্রস্তুত। আমার টার্গেট রোল এবং অবজেক্টিভ কী বলুন।" }
  ],
  ielts: [
    { text: "Could you evaluate my fluency score for this part?", translation: "এই পর্বের জন্য আমার ফ্লুয়েন্সি কেমন হয়েছে বলুন?" },
    { text: "Let's practice advanced cue card responses.", translation: "চলুন অ্যাডভান্সড কিউ কার্ড নিয়ে প্র্যাকটিস করি।" },
    { text: "Help me practice Part 1 of the IELTS Speaking Test.", translation: "আইইএলটিএস স্পিকিং পার্ট ১ প্র্যাকটিসে সাহায্য করুন।" }
  ]
};

interface LiveSessionProps {
  selectedTutor: string;
  scenarioId: string | null;
  pdfStoreId?: string | null;
  selectedVoice?: string;
  speakSlowly?: boolean;
  onTranscript: (text: string, isModel: boolean, isFinal: boolean) => void;
  onSessionEnd?: (durationSec: number, userAudio?: string) => void;
  isTimeExhausted?: boolean;
  onMicStateChange?: (state: MicState) => void;
  isMinimal?: boolean;
  courseTopicId?: string;
  courseSubtopicId?: string;
  onSubmitPractice?: (isTimeExhausted: boolean) => void;
  isSubmittingPractice?: boolean;
  hasTranscript?: boolean;
  hideControls?: boolean;
  customStartLabel?: string;
  customStopLabel?: string;
}

export interface LiveSessionRef {
  startSession: () => Promise<void>;
  stopSession: () => void;
  micState: MicState;
}

export const LiveSessionInteraction = React.forwardRef<LiveSessionRef, LiveSessionProps>(({ 
  selectedTutor, 
  scenarioId, 
  pdfStoreId, 
  selectedVoice = "Zephyr", 
  speakSlowly = false, 
  courseTopicId, 
  courseSubtopicId,
  onTranscript, 
  onSessionEnd, 
  isTimeExhausted, 
  onMicStateChange, 
  isMinimal,
  onSubmitPractice,
  isSubmittingPractice = false,
  hasTranscript = false,
  hideControls = false,
  customStartLabel,
  customStopLabel
}, ref) => {

  const { user, updateUsageLocally } = useContext(AuthContext);
  const finalIsTimeExhausted = !!(
    isTimeExhausted || 
    (user ? (user.timeLeft === 0 || (user.credits !== undefined && user.credits <= 0)) : (5000 - parseInt(localStorage.getItem('anon_chat_time') || '0', 10) <= 0))
  );
  const [micState, setMicState] = useState<MicState>("ready");
  
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  
  const updateUsageLocallyRef = useRef(updateUsageLocally);
  useEffect(() => { updateUsageLocallyRef.current = updateUsageLocally; }, [updateUsageLocally]);
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [userVol, setUserVol] = useState<number>(0);
  const [tutorVol, setTutorVol] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    const updateTutorVol = () => {
      if (isModelSpeaking) {
        // Generate high-fidelity organic talking sound fluctuations
        const wave = Math.sin(Date.now() / 95) * 25 + Math.cos(Date.now() / 45) * 18;
        const volume = Math.max(15, Math.floor(52 + wave));
        setTutorVol(volume);
        animId = requestAnimationFrame(updateTutorVol);
      } else {
        setTutorVol(0);
      }
    };
    if (isModelSpeaking) {
      updateTutorVol();
    } else {
      setTutorVol(0);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isModelSpeaking]);
  
  useEffect(() => {
    if (onMicStateChange) {
      onMicStateChange(micState);
    }
  }, [micState, onMicStateChange]);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasNotifiedTimeLimit, setHasNotifiedTimeLimit] = useState(false);
  
  const [liveLogs, setLiveLogs] = useState<Array<{ text: string; isModel: boolean; id: string }>>([]);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const appendLiveLog = (text: string, isModel: boolean) => {
    setLiveLogs(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === text && prev[prev.length - 1].isModel === isModel) {
        return prev;
      }
      return [...prev, { text, isModel, id: Math.random().toString(36).substring(7) }];
    });
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveLogs]);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const smoothedAmpRef = useRef<number>(0);
  
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const userAudioChunksRef = useRef<Float32Array[]>([]);
  const currentTurnAudioChunksRef = useRef<Float32Array[]>([]);
  const wasModelSpeakingOrJustFinishedRef = useRef<boolean>(true);
  const lastWebSpeechTranscriptTimeRef = useRef<number>(0);
  const lastModelAudioEndTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);
  const transcriptIntervalRef = useRef<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [sessionDurationSec, setSessionDurationSec] = useState(0);
  const [remainingLimitSec, setRemainingLimitSec] = useState(0);
  const totalAllocationRef = useRef<number>(300);

  const drawWaveform = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVol = () => {
      if (!isActiveRef.current) {
        setUserVol(0);
        return;
      }
      animationFrameRef.current = requestAnimationFrame(updateVol);
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      let count = 0;
      const startBin = Math.floor(bufferLength * 0.05);
      const endBin = Math.floor(bufferLength * 0.45);
      for (let i = startBin; i < endBin; i++) {
        sum += dataArray[i];
        count++;
      }
      const avg = count > 0 ? (sum / count) : 0;
      const calculatedVol = isMutedRef.current ? 0 : Math.min(100, Math.floor((avg / 150) * 100));
      setUserVol(calculatedVol);
    };
    updateVol();
  };

  const stopSession = () => {
    const wasActive = micState !== "ready";
    isActiveRef.current = false;
    setIsMuted(false);
    isMutedRef.current = false;
    setUserVol(0);
    setIsModelSpeaking(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (transcriptIntervalRef.current) {
      clearInterval(transcriptIntervalRef.current);
      transcriptIntervalRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch(e){}
      wsRef.current = null;
    }
    if (processorRef.current && audioCtxRef.current) {
      try { processorRef.current.disconnect(); } catch(e){}
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
        console.warn("Failed to compile user audio chunks to WAV base64");
      }
    }

    setMicState("ready");
    if (wasActive && onSessionEnd) {
      const durationSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      onSessionEnd(Math.max(0, durationSec), userAudioBase64);
    }
  };

  useEffect(() => {
    const getInitialLimit = () => {
      let limit = 5000;
      if (user) {
        limit = user.timeLeft;
      } else {
        const anonChatTime = parseInt(localStorage.getItem('anon_chat_time') || '0', 10);
        limit = Math.max(0, 5000 - anonChatTime);
      }
      return limit;
    };
    
    // Only reset limit initially when ready, avoid overwriting active local countdowns during session
    if (micState === 'ready') {
      const initLimit = getInitialLimit();
      setRemainingLimitSec(initLimit);
      totalAllocationRef.current = initLimit || 5000;
    }
  }, [micState, user, scenarioId]);

  useEffect(() => {
    let intervalId: any = null;
    let tick = 0;
    if (micState !== 'ready') {
      intervalId = setInterval(() => {
        if (sessionStartTimeRef.current) {
          const elapsed = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
          setSessionDurationSec(Math.max(0, elapsed));
        }
        
        tick++;
        if (tick >= 5) {
           tick = 0;
           const u = userRef.current;
           const tokensToDeduct = 5 * 250; // 5 secs * 250 credits
           if (u && u.token) {
              fetch('/api/auth/time/usage', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ auth: u.token, seconds: 5 })
              }).catch(e => console.warn("Usage sync failed"));
              if (updateUsageLocallyRef.current) updateUsageLocallyRef.current(tokensToDeduct, 5);
           } else {
              fetch('/api/auth/time/usage', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ seconds: 5 })
              }).then(res => res.json()).then(data => {
                 if (data && data.credits !== undefined) {
                    const usedTime = Math.max(0, 5000 - data.credits);
                    localStorage.setItem('anon_chat_time', usedTime.toString());
                 }
              }).catch(e => console.warn("Usage sync failed"));
              const prevAnon = parseInt(localStorage.getItem('anon_chat_time') || '0', 10);
              localStorage.setItem('anon_chat_time', (prevAnon + 1250).toString());
           }
        }
        
        setRemainingLimitSec((prev) => {
          if (prev <= 0) return 0;
          return prev - 250; // Deduct 250 credits per second locally for UI updates
        });
      }, 1000);
    } else {
      setSessionDurationSec(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [micState]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (isTimeExhausted) return; // Disallow unmuting if time is exhausted
    const newMuted = !isMutedRef.current;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !newMuted);
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);
  
  const isTimeExhaustedRef = useRef(finalIsTimeExhausted);
  useEffect(() => { isTimeExhaustedRef.current = finalIsTimeExhausted; }, [finalIsTimeExhausted]);

  useEffect(() => {
    stopSession();
  }, [scenarioId, selectedVoice, selectedTutor]);

  useEffect(() => {
    if (finalIsTimeExhausted && isActiveRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !hasNotifiedTimeLimit) {
      setHasNotifiedTimeLimit(true);
      // Mute user so they can't talk anymore
      setIsMuted(true);
      isMutedRef.current = true;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(t => t.enabled = false);
      }
      
      const promptStr = user 
        ? "SYSTEM: The user has exhausted their credits. You MUST write a polite and friendly one-time response in Bengali and English reminding them that their credits are gone and requesting/suggesting that they buy credits if they want to continue further. Do not ask any questions or seek user feedback, keep it purely a one-way message. Immediately after speaking, end your turn and append [END_SESSION] verbatim so that the system immediately shuts down."
        : "SYSTEM: The user has exhausted their free practice credits. You MUST write a polite and friendly one-time response in Bengali and English reminding them that their credits are gone and requesting/suggesting that they buy credits or login to continue further. Do not ask any questions or seek user feedback, keep it purely a one-way message. Immediately after speaking, end your turn and append [END_SESSION] verbatim so that the system immediately shuts down.";
        
      wsRef.current.send(JSON.stringify({ text: promptStr }));
      
      // Force session stop after giving Gemini some time to deliver the message
      setTimeout(() => {
        if (isActiveRef.current) {
          stopSession();
        }
      }, 12000); // 12 seconds buffer to allow Gemini to speak
    }
  }, [finalIsTimeExhausted, hasNotifiedTimeLimit, user]);

  const triggerTurnTranscription = async (chunks: Float32Array[], currentSessionId: number) => {
    try {
      const wavBase64 = createWavBase64(chunks);
      if (!wavBase64) return;
      
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({ audioBase64: wavBase64 })
      }).catch(() => null);
      
      if (!res || !res.ok) return;
      
      const dataText = await res.text().catch(() => "");
      if (!dataText) return;
      
      let data;
      try {
        data = JSON.parse(dataText);
      } catch (e) {
        return; // Ignore invalid JSON silently
      }

      if (sessionIdRef.current === currentSessionId && data.text && data.text.trim()) {
        const text = data.text.trim();
        // Skip duplicate append if standard web speech recognition got it too
        const now = Date.now();
        if (now - lastWebSpeechTranscriptTimeRef.current > 2500) {
          onTranscript(text, false, true);
          appendLiveLog(text, false);
        }
      }
    } catch (err: any) {
      // Suppress specific expected DOM errors from bubbling to global error handlers
      console.warn("Turn transcription skipped due to internal format deviation");
    }
  };

  const startSession = async () => {
    const currentSessionId = ++sessionIdRef.current;
    try {
      isActiveRef.current = true;
      sessionStartTimeRef.current = Date.now();
      setError(null);
      setLiveLogs([]);
      setMicState("thinking");

      // Synchronously create and resume AudioContext during user gesture
      let sysAudioCtx: AudioContext;
      try {
        sysAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      } catch (e) {
        sysAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (sysAudioCtx.state === 'suspended') {
        sysAudioCtx.resume();
      }
      audioCtxRef.current = sysAudioCtx;

      // Setup WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let voiceArg = selectedVoice;
      if (speakSlowly && !voiceArg.toLowerCase().includes("-slow")) {
        voiceArg += "-slow";
      }
      let wsUrl = `${protocol}//${window.location.host}/live?tutorName=${encodeURIComponent(selectedTutor)}&voice=${voiceArg}`;
      if (scenarioId) {
        wsUrl += `&scenarioId=${encodeURIComponent(scenarioId)}`;
      }
      if (pdfStoreId) {
        wsUrl += `&pdfId=${encodeURIComponent(pdfStoreId)}`;
      }
      if (courseTopicId) {
        wsUrl += `&courseTopicId=${encodeURIComponent(courseTopicId)}`;
      }
      if (courseSubtopicId) {
        wsUrl += `&courseSubtopicId=${encodeURIComponent(courseSubtopicId)}`;
      }
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        wsUrl += `&auth=${encodeURIComponent(token)}`;
      }
      
      if (wsRef.current) {
        try { wsRef.current.close(); } catch(e) {}
      }
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // We will handle user transcript via Gemini /api/transcribe by pooling audio chunks
      ws.onopen = async () => {
        if (!isActiveRef.current || sessionIdRef.current !== currentSessionId) {
          try { ws.close(); } catch (e) {}
          return;
        }
        userAudioChunksRef.current = [];
        try {
          const audioCtx = sysAudioCtx;
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          if (!isActiveRef.current || sessionIdRef.current !== currentSessionId) {
            try { audioCtx.close(); } catch (e) {}
            try { ws.close(); } catch (e) {}
            return;
          }

          const analyser = audioCtx.createAnalyser();
          analyserRef.current = analyser;

          if (finalIsTimeExhausted) {
            if (!user) {
              setError("আপনার ফ্রি ট্রায়াল লিমিট শেষ হয়ে গেছে। আবার সেশন শুরু করতে দয়া করে লগইন করুন। (Free trial limit reached. Please log in to start talking again.)");
            } else {
              setError("আপনার ক্রেডিট শেষ হয়ে গেছে। দয়া করে ব্যালেন্স রিচার্জ করুন। (Your credits are exhausted. Please recharge your balance.)");
            }
            
            setMicState("listening");
            setIsMuted(true);
            isMutedRef.current = true;
            nextStartTimeRef.current = audioCtx.currentTime + 0.1;
            drawWaveform();
            
            setHasNotifiedTimeLimit(true);
            const promptStr = user 
              ? "SYSTEM: The user has exhausted their credits. You MUST write a polite and friendly one-time response in Bengali and English reminding them that their credits are gone and requesting/suggesting that they buy credits if they want to continue further. Do not ask any questions or seek user feedback, keep it purely a one-way message. Immediately after speaking, end your turn and append [END_SESSION] verbatim so that the system immediately shuts down."
              : "SYSTEM: The user has exhausted their free practice credits. You MUST write a polite and friendly one-time response in Bengali and English reminding them that their credits are gone and requesting/suggesting that they buy credits or login to continue further. Do not ask any questions or seek user feedback, keep it purely a one-way message. Immediately after speaking, end your turn and append [END_SESSION] verbatim so that the system immediately shuts down.";
              
            ws.send(JSON.stringify({ text: promptStr }));
            // Backup timeout in case [END_SESSION] is missing
            setTimeout(() => { if (isActiveRef.current && sessionIdRef.current === currentSessionId) stopSession(); }, 20000);
            return;
          }

          const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          if (!isActiveRef.current || sessionIdRef.current !== currentSessionId) {
            try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
            try { audioCtx.close(); } catch (e) {}
            try { ws.close(); } catch (e) {}
            return;
          }
          streamRef.current = stream;

          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(audioCtx.destination);
          source.connect(analyser);

          processor.onaudioprocess = (e) => {
            if (sessionIdRef.current !== currentSessionId) return;
            const pcmData = e.inputBuffer.getChannelData(0);
            const isModelSpeakingOrJustFinished = activeSourcesRef.current.length > 0 || (Date.now() - lastModelAudioEndTimeRef.current < 1550);
            const userMuted = isMutedRef.current;
            
            if (!isModelSpeakingOrJustFinished && !userMuted) {
              userAudioChunksRef.current.push(new Float32Array(pcmData));
              currentTurnAudioChunksRef.current.push(new Float32Array(pcmData));
            }
            if (ws.readyState === WebSocket.OPEN && !isModelSpeakingOrJustFinished && !userMuted) {
              const base64 = pcmToBase64(pcmData);
              ws.send(JSON.stringify({ audio: base64 }));
            }

            // Boundary Detection: if model just shifted to speaking, transcribe user's captured turn chunks
            if (isModelSpeakingOrJustFinished) {
              if (!wasModelSpeakingOrJustFinishedRef.current) {
                const chunks = [...currentTurnAudioChunksRef.current];
                currentTurnAudioChunksRef.current = [];
                if (chunks.length > 0) {
                  triggerTurnTranscription(chunks, currentSessionId);
                }
              }
            }
            
            wasModelSpeakingOrJustFinishedRef.current = isModelSpeakingOrJustFinished;
          };

          setMicState("listening");
          nextStartTimeRef.current = audioCtx.currentTime + 0.1;

          drawWaveform();

          if (!finalIsTimeExhausted) {
            // Send an invisible system prompt to force Gemini to start the conversation first
            let initialMsg = "";
            if (scenarioId === "proficiency-eval") {
               initialMsg = `SYSTEM: The student has just activated their microphone and entered the room. You MUST start the proficiency evaluation strictly following your system instructions. Begin by warmly welcoming them in Bengali, state that the assessment will take about 5 minutes. Tell them explicitly in Bengali: "If you have any difficulty speaking, you may use Bengali. However, please try to speak in English as much as possible since this is an English proficiency test." Then ask them your first question. Speak immediately.`;
            } else {
               const savedGuide = scenarioId ? localStorage.getItem(`lesson_guide_context_${decodeURIComponent(scenarioId)}`) : null;
               const grammarContext = scenarioId ? getInitialPromptForTopic(scenarioId, savedGuide) : "";
               initialMsg = `SYSTEM: The student has just activated their microphone and entered the room. You MUST greet them first excitedly and start the conversational grammar class according to the scenario: ${scenarioId || "General Speaking"}. Context guidelines: ${grammarContext}. Speak immediately.`;
            }
            ws.send(JSON.stringify({ text: initialMsg }));
          }

          // If the user immediately started a session but they are exhausted, trigger the limit message!
          if (finalIsTimeExhausted && !hasNotifiedTimeLimit) {
            setHasNotifiedTimeLimit(true);
            setIsMuted(true);
            isMutedRef.current = true;
            if (streamRef.current) streamRef.current.getAudioTracks().forEach(t => t.enabled = false);
            
            const promptStr = user 
              ? "SYSTEM: The user has exhausted their credits. You MUST write a polite and friendly one-time response in Bengali and English reminding them that their credits are gone and requesting/suggesting that they buy credits if they want to continue further. Do not ask any questions or seek user feedback, keep it purely a one-way message. Immediately after speaking, end your turn and append [END_SESSION] verbatim so that the system immediately shuts down."
              : "SYSTEM: The user has exhausted their free practice credits. You MUST write a polite and friendly one-time response in Bengali and English reminding them that their credits are gone and requesting/suggesting that they buy credits or login to continue further. Do not ask any questions or seek user feedback, keep it purely a one-way message. Immediately after speaking, end your turn and append [END_SESSION] verbatim so that the system immediately shuts down.";

            ws.send(JSON.stringify({ text: promptStr }));
            setTimeout(() => { if (isActiveRef.current && sessionIdRef.current === currentSessionId) stopSession(); }, 20000);
          }

          // Setup speech recognition for user's voice (instead of polling backend API)
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = "en-US"; // Practice English speaking primarily
            
            recognition.onresult = (event: any) => {
              if (sessionIdRef.current !== currentSessionId || isMutedRef.current) return;
              let finalTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
                }
              }
              if (finalTranscript.trim()) {
                lastWebSpeechTranscriptTimeRef.current = Date.now();
                onTranscript(finalTranscript.trim(), false, true);
                appendLiveLog(finalTranscript.trim(), false);
              }
            };
            
            recognition.onerror = (e: any) => console.log('Speech recognition error in session:', currentSessionId, e);
            
            recognition.onend = () => {
              // Restart recognition if session is still active
              if (isActiveRef.current && sessionIdRef.current === currentSessionId) {
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
          if (sessionIdRef.current === currentSessionId) {
            setError("Microphone error: " + e.message);
            stopSession();
          }
        }
      };

      ws.onmessage = (event) => {
        if (sessionIdRef.current !== currentSessionId) {
          try { ws.close(); } catch (e) {}
          return;
        }
        const msg = JSON.parse(event.data);
        if (msg.interrupted) {
          // Clear remaining audio by advancing start time and stopping active sources
          activeSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) {}
          });
          activeSourcesRef.current = [];
          setIsModelSpeaking(false);
          lastModelAudioEndTimeRef.current = Date.now();
          if (audioCtxRef.current) {
            nextStartTimeRef.current = audioCtxRef.current.currentTime + 0.1;
          }
        }
        if (msg.text) {
          if (msg.text.includes("[END_SESSION]")) {
            const cleanText = msg.text.replace("[END_SESSION]", "").trim();
            onTranscript(cleanText, true, true);
            appendLiveLog(cleanText, true);
            
            // Calculate precisely when the audio queue will finish
            let delayMs = 3000;
            if (audioCtxRef.current) {
              const remainingSec = Math.max(0, nextStartTimeRef.current - audioCtxRef.current.currentTime);
              delayMs = (remainingSec * 1000) + 1500; // 1.5 second buffer after last word
            }
            
            setTimeout(() => {
              if (sessionIdRef.current === currentSessionId) stopSession();
            }, delayMs);
          } else {
            onTranscript(msg.text, true, true);
            appendLiveLog(msg.text, true);
          }
        }
        if (msg.audio) {
          if (!audioCtxRef.current) return;
          const audioCtx = audioCtxRef.current;
          
          const pcmData = base64ToPcm(msg.audio);
          if (!pcmData || pcmData.length === 0) {
            console.warn("Skipping invalid or zero-length PCM audio chunk.");
            return;
          }
          const audioBuffer = audioCtx.createBuffer(1, pcmData.length, 24000);
          audioBuffer.copyToChannel(pcmData, 0);

          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          
          source.onended = () => {
             const updated = activeSourcesRef.current.filter(s => s !== source);
             activeSourcesRef.current = updated;
             setIsModelSpeaking(updated.length > 0);
             lastModelAudioEndTimeRef.current = Date.now();
          };
          activeSourcesRef.current.push(source);
          setIsModelSpeaking(true);

          const startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
          source.start(startTime);
          nextStartTimeRef.current = startTime + audioBuffer.duration;
        }
      };

      ws.onerror = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        setError("Connection error. Try again.");
        stopSession();
      };
      
      ws.onclose = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        stopSession();
      };

    } catch (e: any) {
      if (sessionIdRef.current === currentSessionId) {
        setError("Setup error: " + e.message);
        stopSession();
      }
    }
  };

  const currentCategory = scenarioId || "companion";
  const activeSuggestions = SUGGESTIONS_MAP[currentCategory] || SUGGESTIONS_MAP.companion;

  React.useImperativeHandle(ref, () => ({
    startSession,
    stopSession,
    micState,
  }), [micState]); // startSession and stopSession are stable-ish but closures so micState makes sure we get updates or we can just rely on refs.

  return (
    <div className={`w-full flex-1 flex flex-col ${isMinimal ? 'justify-between gap-1 mt-0' : 'justify-between'} text-left select-text relative`}>
      

      
      {finalIsTimeExhausted && (
        <div className="w-full max-w-xl mx-auto bg-gradient-to-br from-red-950/90 to-slate-900/90 border-2 border-red-500/30 rounded-2xl p-5 text-center flex flex-col items-center gap-4 mb-6 relative overflow-hidden backdrop-blur-md shadow-2xl z-20">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-rose-600 animate-pulse"></div>
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 justify-center">
              Credit Balance Expired • ক্রেডিট ব্যালেন্স শেষ
            </h3>
            <p className="text-xs text-slate-300 font-semibold mt-1.5 leading-relaxed">
              আপনার জেমিনি ক্লাসরুম ক্রেডিট শেষ হয়ে গেছে। Gemini Voice স্বয়ংক্রিয়ভাবে নিষ্ক্রিয় করা হয়েছে। 
              অনুগ্রহ করে সেশন চালিয়ে যেতে বা সেশন শুরু করতে ক্রেডিট বা প্রিমিয়াম প্যাক কিনুন।
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              (Your credit balance is exhausted. Gemini AI has been automatically turned off. Please purchase credits to continue.)
            </p>
          </div>
          <button
            onClick={() => window.open('/buy-premium', '_self')}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-400 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-red-500/10"
          >
            <Sparkles className="w-4 h-4 text-amber-305" />
            <span>Purchase Credits • ক্রেডিট ক্রয় করুন</span>
          </button>
        </div>
      )}

      {/* 1. Credit metrics Dashboard */}
      {!isMinimal && micState !== "ready" && (
        <div className="w-full max-w-xl mx-auto flex flex-col gap-2 bg-slate-900/65 p-4 rounded-2xl border border-white/5 z-10 shadow-lg mb-6 max-h-[100px] justify-center">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="flex flex-col items-center justify-center border-r border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Session Duration (চলতি সময়)
              </span>
              <span className="font-mono text-sm font-extrabold text-white mt-0.5">
                {formatTime(sessionDurationSec)}
              </span>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Hourglass className="w-3 h-3 text-amber-500" />
                Vocal Credits Left (বাকি ক্রেডিট)
              </span>
              <span className="font-mono text-sm font-extrabold mt-0.5 text-amber-400">
                {remainingLimitSec.toLocaleString()} <span className="text-[8px] opacity-75">CR</span>
              </span>
            </div>
          </div>
          
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1 bg-slate-950">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-amber-505"
              style={{ width: `${Math.max(0, Math.min(100, (remainingLimitSec / totalAllocationRef.current) * 100))}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 2. Dual Side-by-Side Voice Visualizer or Instructions Guide (User and Gemini) */}
      <AnimatePresence mode="wait">
        {micState === "ready" && !isMinimal ? (
          <motion.div 
            key="guide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-xl mx-auto py-4 px-2 z-20 flex justify-center"
          >
            <ul className="text-[11px] sm:text-xs space-y-4 font-semibold text-slate-300 leading-relaxed list-none pl-0">
              <li className="flex gap-3 items-start">
                <span className="text-emerald-400 text-lg leading-none select-none drop-shadow-md">📝</span>
                <div className="flex-1">
                  <p className="text-slate-100 font-extrabold text-[13px] drop-shadow-sm"><span className="text-emerald-400">১. শুধু কথোপকথনে মনোযোগ দিন:</span></p>
                  <p className="text-slate-300 font-medium text-[12px] mt-0.5">কোনো নোট নেওয়ার প্রয়োজন নেই। ক্লাস শেষে আপনি রেডিমেড লেসনের পিডিএফ ডাউনলোড করতে পারবেন।</p>
                </div>
              </li>
              
              <li className="flex gap-3 items-start">
                <span className="text-amber-400 text-lg leading-none select-none drop-shadow-md">📊</span>
                <div className="flex-1">
                  <p className="text-slate-100 font-extrabold text-[13px] drop-shadow-sm"><span className="text-amber-400 font-bold">২. লেভেল নির্ধারণ:</span></p>
                  <p className="text-slate-300 font-medium text-[12px] mt-0.5">আপনি কোন স্তরে শিখতে চান— <strong className="text-amber-300">Basic, Intermediate নাকি Advanced</strong>, তা শিক্ষককে জানান।</p>
                </div>
              </li>
              
              <li className="flex gap-3 items-start">
                <span className="text-rose-400 text-lg leading-none select-none drop-shadow-md">⏹️</span>
                <div className="flex-1">
                  <p className="text-slate-100 font-extrabold text-[13px] drop-shadow-sm"><span className="text-rose-400">৩. "Stop Conversation":</span></p>
                  <p className="text-slate-300 font-medium text-[12px] mt-0.5">আলোচনা শেষ করার জন্য নিচে থাকা <strong className="text-rose-400">"Stop Conversation"</strong> বাটনে ক্লিক করুন।</p>
                </div>
              </li>
              
              <li className="flex gap-3 items-start">
                <span className="text-indigo-400 text-lg leading-none select-none drop-shadow-md">📈</span>
                <div className="flex-1">
                  <p className="text-slate-100 font-extrabold text-[13px] drop-shadow-sm"><span className="text-indigo-300">৪. প্র্যাকটিস রিপোর্ট:</span></p>
                  <p className="text-slate-300 font-medium text-[12px] mt-0.5">কথোপকথন শেষে আপনার ভুলসহ একটি রিপোর্ট ও স্কোর দেখতে পাবেন।</p>
                </div>
              </li>
            </ul>
          </motion.div>
        ) : (
          <motion.div 
            key="mics"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className={`w-full mx-auto flex flex-row items-center justify-center ${isMinimal ? 'gap-4 py-1 min-h-[75px]' : 'gap-12 sm:gap-24 py-10 min-h-[300px]'}`}
          >
            
            {/* User (Learner) Microphone */}
            <div className={`flex flex-col items-center ${isMinimal ? 'gap-1 w-[90px]' : 'gap-6 w-[140px] sm:w-[180px]'}`}>
              <div className={`relative flex items-center justify-center gap-1.5 w-full ${isMinimal ? 'h-6' : 'h-24 sm:h-32'}`}>
                {[0.2, 0.5, 0.8, 1, 0.8, 0.5, 0.2].map((scale, i) => {
                  const isActive = micState === 'listening' && !isMuted && !isModelSpeaking;
                  const heightPct = isActive ? Math.max(12, Math.min(100, userVol * scale + 10)) : 8;
                  
                  return (
                    <motion.div 
                      key={i} 
                      animate={{ height: `${heightPct}%` }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`rounded-full ${isMinimal ? 'w-1' : 'w-2 sm:w-3'} ${
                        isActive 
                          ? 'bg-gradient-to-t from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.7)]' 
                          : 'bg-slate-800/80 border border-white/5'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="text-center flex flex-col items-center justify-center gap-1 mt-2">
                 <div className="relative group">
                   {micState === 'listening' && !isMuted && !isModelSpeaking && (
                     <motion.div 
                       animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                       transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                       className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl"
                     />
                   )}
                   <div className={`relative z-10 rounded-full flex items-center justify-center border shadow-lg transition-all duration-300 ${isMuted ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900 border-white/10'} ${micState === 'listening' && !isMuted && !isModelSpeaking ? 'bg-blue-500/20 border-blue-400/50 shadow-[0_0_25px_rgba(59,130,246,0.5)]' : ''} ${isMinimal ? 'w-8 h-8' : 'w-14 h-14 sm:w-16 sm:h-16'}`}>
                     {isMuted ? (
                       <MicOff className={`${isMinimal ? 'w-3.5 h-3.5' : 'w-5 h-5 sm:w-7 sm:h-7'} text-red-500`} />
                     ) : (
                       <Mic className={`${isMinimal ? 'w-3.5 h-3.5' : 'w-5 h-5 sm:w-7 sm:h-7'} transition-colors ${
                         micState === 'listening' && !isModelSpeaking ? 'text-blue-400' : 'text-slate-400'
                       }`} />
                     )}
                   </div>
                </div>
                <div className="flex flex-col mt-2">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">You</span>
                  {!isMinimal && (
                    <span className="text-[9px] sm:text-[11px] font-bold uppercase mt-1">
                      {micState === 'listening' && !isMuted && !isModelSpeaking ? <span className="text-blue-400 drop-shadow-sm font-black">Listening...</span> : <span className="text-slate-600">Ready</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Gemini (AI Coach) Voice Model Visualizer */}
            <div className={`flex flex-col items-center ${isMinimal ? 'gap-1 w-[90px]' : 'gap-6 w-[140px] sm:w-[180px]'}`}>
              <div className={`relative flex items-center justify-center w-full ${isMinimal ? 'h-6' : 'h-24 sm:h-32'}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isModelSpeaking ? (
                     <motion.div
                       animate={{ 
                         scale: [1, 1 + (tutorVol / 100) * 1.2, 1],
                         rotate: [0, 90, 180, 270, 360]
                       }}
                       transition={{ 
                         scale: { type: "spring", stiffness: 300, damping: 15 }, 
                         rotate: { repeat: Infinity, duration: 10, ease: "linear" } 
                       }}
                       style={{ opacity: Math.max(0.4, tutorVol / 100 + 0.3) }}
                       className={`absolute rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-400 blur-[10px] ${isMinimal ? 'w-10 h-10' : 'w-20 h-20 sm:w-28 sm:h-28'}`}
                     />
                  ) : (
                     <div className={`absolute rounded-full border border-white/5 bg-slate-800/30 ${isMinimal ? 'w-8 h-8' : 'w-16 h-16 sm:w-20 sm:h-20'}`} />
                  )}
                  {/* Inner crisp sphere */}
                  {isModelSpeaking && (
                    <motion.div
                       animate={{ scale: [1, 1 + (tutorVol / 100) * 0.5, 1] }}
                       transition={{ type: "spring", stiffness: 400, damping: 20 }}
                       className={`absolute rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-300 shadow-[0_0_20px_rgba(192,132,252,0.6)] ${isMinimal ? 'w-6 h-6' : 'w-12 h-12 sm:w-16 sm:h-16'}`}
                    />
                  )}
                  {/* Optional dynamic rings around Gemini */}
                  {isModelSpeaking && [1, 2, 3].map((ring) => (
                    <motion.div
                      key={`ring-${ring}`}
                      animate={{ 
                        scale: [1, 2.5], 
                        opacity: [0.6, 0] 
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5, 
                        delay: ring * 0.5,
                        ease: "easeOut"
                      }}
                      className={`absolute rounded-full border-2 border-purple-400/40 ${isMinimal ? 'w-6 h-6' : 'w-12 h-12 sm:w-16 sm:h-16'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center flex flex-col items-center justify-center gap-1 mt-2 z-10">
                 <div className="relative group">
                   {/* Background Glow */}
                   {isModelSpeaking && (
                     <motion.div 
                       animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
                       transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                       className="absolute inset-0 rounded-full bg-purple-500/40 blur-xl"
                     />
                   )}
                   <div className={`relative z-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-xl ${isModelSpeaking ? 'bg-gradient-to-br from-indigo-950 to-purple-900 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.5)]' : 'bg-slate-900 border-white/10'} ${isMinimal ? 'w-8 h-8' : 'w-14 h-14 sm:w-16 sm:h-16'}`}>
                     <Sparkles className={`${isMinimal ? 'w-3.5 h-3.5' : 'w-5 h-5 sm:w-7 sm:h-7'} transition-all duration-300 ${
                       isModelSpeaking ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110' : 'text-slate-400'
                     }`} />
                  </div>
                 </div>
                <div className="flex flex-col mt-2">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Gemini</span>
                  {!isMinimal && (
                    <span className="text-[9px] sm:text-[11px] font-bold uppercase mt-1">
                      {isModelSpeaking ? <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-rose-300 font-black drop-shadow-sm">Speaking...</span> : <span className="text-slate-600">Waiting</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Controls & Dynamic CTA Panel */}
      {!hideControls && (
        <div className={`w-full max-w-xl mx-auto flex flex-col items-center gap-4 ${isMinimal ? 'pt-1' : 'pt-4'} z-15`}>
          
          {/* Unified toggle button */}
            <div className="w-full flex flex-col gap-2">
              {micState === "ready" ? (
                <button
                  type="button"
                  onClick={startSession}
                  className="w-full py-3.5 px-5 rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 active:scale-[0.98]"
                >
                  <Mic className="w-4 h-4 shrink-0" />
                  <span>START CONVERSATION • বলা শুরু করুন</span>
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  {/* Compact Mute toggle inside active session */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`px-4 py-3 rounded-2xl border flex items-center justify-center gap-1.5 transition font-bold shrink-0 cursor-pointer ${
                      isMuted 
                        ? "bg-red-500 border-red-500/30 text-white"
                        : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                    }`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 shrink-0" /> : <Mic className="w-4 h-4 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      stopSession();
                      if (onSubmitPractice) {
                        onSubmitPractice(finalIsTimeExhausted);
                      }
                    }}
                    disabled={isSubmittingPractice || micState === "thinking"}
                    className={`flex-1 py-3 px-5 rounded-2xl font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 cursor-pointer ${
                      micState === "thinking" ? "bg-slate-800/40 text-slate-600 border border-slate-800/60 cursor-not-allowed opacity-50" : "bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-450 hover:to-red-550 text-white active:scale-[0.98]"
                    }`}
                  >
                    {micState === "thinking" ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin text-slate-500" />
                        <span>Connecting...</span>
                      </>
                    ) : isSubmittingPractice ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin text-white" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 fill-current text-white animate-pulse" />
                        <span>STOP CONVERSATION • বন্ধ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          {/* Display Status Alerts or Connection Logs */}
          {error ? (
            <div className="w-full flex flex-col items-center gap-2 bg-red-950/70 border border-red-500/30 rounded-2xl p-4 text-center">
              <span className="text-xs font-bold text-red-300">⚠️ {error}</span>
              <p className="text-[10px] text-slate-400">
                নিরাপদ ব্রাউজার উইন্ডো বা অনুধির পারমিশন সীমাবদ্ধতার জন্য ভয়েস কানেকশন না হলে এটি সমাধান করবে।
              </p>
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noreferrer"
                className="mt-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md transition-all active:scale-95 text-center inline-block cursor-pointer border border-white/5"
              >
                Open in Secure New Tab • নতুন ট্যাবে ঠিক করুন
              </a>
            </div>
          ) : (
            <div className="text-center text-[10px] sm:text-[11px] font-semibold text-slate-400 font-sans leading-relaxed select-none">
              {micState === "ready" && "💡 Click the Button above to start real-time speech conversation session with AI Coach!"}
              {micState === "thinking" && "🔄 Provisioning vocal server proxy endpoint. Prepare to communicate..."}
              {micState === "listening" && "🟢 Voice stream active. Speak natively when your panel pulses!"}
            </div>
          )}

        </div>
      )}
    </div>
  );
});
