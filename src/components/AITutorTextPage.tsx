import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, User, Loader2, Award, Volume2, VolumeX, AlertCircle, Type, Settings, Mic, MicOff } from "lucide-react";
import Markdown from "react-markdown";
import { AuthContext } from "../AuthContext";
import { getInitialPromptForTopic } from "../lib/grammarTopics";

export const AITutorTextPage: React.FC = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const anonChatTime = parseInt(localStorage.getItem('anon_chat_time') || '0', 10);
  const isTimeExhausted = !!(user 
    ? (user.timeLeft === 0 || (user.credits !== undefined && user.credits <= 0)) 
    : (5000 - anonChatTime <= 0)
  );

  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState<boolean>(() => localStorage.getItem("tutor_auto_read") !== "false");
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const spokenMessagesRef = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);
  const submitRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getFontSizeClass = (sz: 'sm' | 'base' | 'lg' | 'xl') => {
    switch (sz) {
      case 'sm': return 'text-xs md:text-xs leading-normal [&_p]:text-xs [&_li]:text-xs [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs';
      case 'base': return 'text-sm md:text-sm leading-relaxed [&_p]:text-sm [&_li]:text-sm [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm';
      case 'lg': return 'text-base md:text-base leading-relaxed [&_p]:text-base [&_li]:text-base [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-base';
      case 'xl': return 'text-lg md:text-lg leading-relaxed [&_p]:text-lg [&_li]:text-lg [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-lg';
      default: return 'text-sm md:text-sm leading-relaxed';
    }
  };

  const cleanMarkdownForSpeak = (text: string) => {
    return text
      .replace(/[*_#`~>\[\]\(\)-]/g, " ") // replace markdown styling with space
      .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // link labels only
      .replace(/\s+/g, " ") // normalize whitespace
      .trim();
  };

  const speakMessage = (text: string, id: string) => {
    if (!window.speechSynthesis) return;

    if (currentlySpeakingId === id) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("speechSynthesis.cancel failed:", e);
    }

    const cleanedText = cleanMarkdownForSpeak(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
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
      utterance.lang = "en-US";
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.02;

    utterance.onstart = () => {
      setCurrentlySpeakingId(id);
    };

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = (evt) => {
      if (evt.error !== "interrupted") {
        setCurrentlySpeakingId(null);
      }
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak on newly added AI model replies
  useEffect(() => {
    if (messages.length > 0 && autoRead) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model' && !spokenMessagesRef.current.has(lastMsg.id)) {
        spokenMessagesRef.current.add(lastMsg.id);
        speakMessage(lastMsg.text, lastMsg.id);
      }
    }
  }, [messages, autoRead]);

  // Cleanup speech synthesis on navigate away / unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    // If messages are empty, we inject our initial context prompt as a hidden system message?
    // /api/ai/teacher expects standard gemini history format: {role, parts: [{text}]}
    // But since `AITutorTextPage` starts the chat, we can just send the context as the first user message silently
    // and show the bot's response or pre-fill a bot message.
    const startInitialChat = async () => {
      const savedGuide = topicId ? localStorage.getItem(`lesson_guide_context_${decodeURIComponent(topicId)}`) : null;
      const topicContext = topicId ? getInitialPromptForTopic(topicId, savedGuide) : "";
      const initialSystemPrompt = `SYSTEM: Welcome the user excitedly to their grammar text class on ${topicId || "Grammar"}. 
Context guidelines: ${topicContext}
Start by greeting the user and ask them a gentle practice question about this topic to begin. Reply concisely.`;

      // Simulating a system prompt sent via user role (since /api/ai/teacher does zero-shot history passing)
      const chatHistory = [{ role: 'user', parts: [{ text: initialSystemPrompt }] }];
      
      setIsLoading(true);
      try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (user?.token) headers['Authorization'] = `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`;
        
        const res = await fetch('/api/ai/teacher', {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: chatHistory })
        });
        if (res.ok) {
          const data = await res.json();
          setMessages([
            { role: 'model', id: 'm0', text: data.reply }
          ]);
        }
      } catch (e) {
        // Suppress to avoid false positive interceptions
      } finally {
        setIsLoading(false);
      }
    };

    if (messages.length === 0) {
      startInitialChat();
    }
  }, [topicId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    submitRef.current = submitMessageText;
  });

  const submitMessageText = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (isTimeExhausted) {
      setMessages(prev => [...prev, 
        { role: 'user', id: Date.now().toString(), text: textToSend },
        { 
          role: 'model', 
          id: (Date.now() + 1).toString(), 
          text: "⚠️ আপনার ক্রেডিট ব্যালেন্স শেষ হয়ে গেছে। এআই শিক্ষক এখন নিষ্ক্রিয় রয়েছে। অনুগ্রহ করে চালিয়ে যাওয়ার জন্য ক্রেডিট অর্জন বা ক্রয় করুন!\n\n(Your credit balance has expired. The AI Tutor is currently disabled. Please obtain or purchase credits to continue!)" 
        }
      ]);
      return;
    }

    // Add user msg to UI locally
    const newUserMsg = { role: 'user', id: Date.now().toString(), text: textToSend };
    const newUIList = [...messages, newUserMsg];
    setMessages(newUIList);
    setIsLoading(true);

    // Format for Gemini API 
    const topicContext = topicId ? getInitialPromptForTopic(topicId) : "";
    const initialSystemPrompt = `SYSTEM: Welcome the user excitedly to their grammar text class on ${topicId || "Grammar"}. Context guidelines: ${topicContext}`;
    
    const apiHistory = [
      { role: 'user', parts: [{ text: initialSystemPrompt }] }
    ];
    
    newUIList.forEach(m => {
      apiHistory.push({
        role: m.role,
        parts: [{ text: m.text }]
      });
    });

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (user?.token) headers['Authorization'] = `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`;

      const res = await fetch('/api/ai/teacher', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: apiHistory })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'model', id: Date.now().toString(), text: data.reply }]);
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, { role: 'model', id: Date.now().toString(), text: errData.error || "⚠️ Network or server error. Please try again later." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', id: Date.now().toString(), text: "⚠️ Server connectivity issue. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    await submitMessageText(userText);
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };
      
      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          if (submitRef.current) {
            submitRef.current(transcript);
          }
        }
      };
      
      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'no-speech') {
          setVoiceError("কোনো কথা শোনা যায়নি (No speech detected)");
        } else if (event.error === 'not-allowed') {
          setVoiceError("মাইক্রোফোন পারমিশন দিন (Microphone access denied)");
        } else {
          setVoiceError(`Error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    if (voiceError) {
      const timer = setTimeout(() => setVoiceError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [voiceError]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট করে না। অনুগ্রহ করে গুগল ক্রোম ব্যবহার করুন। (Speech recognition not supported in this browser. Please use Google Chrome!)");
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = speechLang;
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleEndSession = () => {
    // Save to session storage for the scoreboard to evaluate
    const formattedLogs = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text || "" }]
    }));
    sessionStorage.setItem("lastAITutorLogs", JSON.stringify(formattedLogs));
    sessionStorage.setItem("lastAITutorTopic", topicId || "Grammar");
    sessionStorage.setItem("lastAITutorDuration", "120"); // placeholder duration

    // Navigate to scoreboard
    navigate('/ai-tutor-scoreboard');
  };

  return (
    <div className="h-[100dvh] w-full bg-[#070b14] text-slate-150 flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="w-full bg-[#111936] border-b border-amber-500/20 px-4 py-3.5 flex flex-row items-center justify-between gap-3 shrink-0 shadow-xl sticky top-0 z-20">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <button 
            onClick={() => navigate('/ai-tutor')} 
            className="p-2 sm:p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all cursor-pointer text-slate-300 shrink-0 select-none shadow-md"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Slidable container wrapper with left & right fading gradient indicators for the Topic Title */}
          <div className="flex-1 relative overflow-hidden max-w-[140px] xs:max-w-[200px] sm:max-w-xs md:max-w-md">
            {/* Left indicator gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#111936] to-transparent z-10 pointer-events-none" />

            <div 
              className="w-full flex items-center gap-2 overflow-x-auto py-0.5 px-3 scrollbar-none touch-pan-x"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Topic Title with Badge */}
              <div className="flex flex-col shrink-0 min-w-max">
                <div className="flex items-center gap-1.5 leading-none">
                   <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded">Text Mode</span>
                </div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-100 mt-1 capitalize">
                  {topicId?.replace(/-/g, ' ')}
                </h1>
              </div>
            </div>

            {/* Right indicator gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#111936] to-transparent z-10 pointer-events-none" />
          </div>
        </div>

        {/* Settings Gear Dropdown Option */}
        <div className="relative shrink-0 z-30">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shadow-md flex items-center justify-center ${
              showSettings 
                ? 'bg-amber-500 border-amber-400 text-[#070b14] scale-105 rotate-45' 
                : 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 text-slate-200 hover:text-amber-400'
            }`}
            title="Lesson Options & Settings"
          >
            <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Settings Dropdown Popover */}
          {showSettings && (
             <>
               {/* Click-away overlay */}
               <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setShowSettings(false)} />
               
               <div className="absolute right-0 mt-2.5 w-60 sm:w-64 bg-[#0a0f21] border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[10px] sm:text-xs font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-amber-500" /> Lesson Options
                    </span>
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="text-slate-400 hover:text-white text-[11px] font-bold"
                    >
                      Close (বন্ধ)
                    </button>
                  </div>

                  {/* Option 1: Custom Text Size Option */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-amber-400" /> Text Size (লেখা সাইজ):
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 mt-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
                      {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setFontSize(sz)}
                          className={`py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                            fontSize === sz
                              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                              : 'hover:bg-[#111936] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sz === 'sm' ? 'S' : sz === 'base' ? 'M' : sz === 'lg' ? 'L' : 'XL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 2: Auto-Read Messages Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] sm:text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Auto-Read Messages:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = !autoRead;
                          setAutoRead(newValue);
                          localStorage.setItem("tutor_auto_read", String(newValue));
                          if (!newValue && window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                            setCurrentlySpeakingId(null);
                          }
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-250 cursor-pointer relative ${
                          autoRead ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                        title="Toggle Auto Read Messages (অটো রিড চালু/বন্ধ করুন)"
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-250 ${
                            autoRead ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Live Voice Lessons Mode */}
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      navigate(`/ai-tutor-live/${topicId}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700/50 transition text-xs font-bold text-amber-400 cursor-pointer shadow"
                  >
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <span>Switch to Voice Mode</span>
                    </span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.5 rounded uppercase font-bold">Go Live</span>
                  </button>

                  {/* Option 3: End and view scores */}
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      handleEndSession();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#4f46e5]/90 hover:bg-[#4f46e5] rounded-xl transition text-xs font-extrabold text-white cursor-pointer shadow-md"
                  >
                    <Award className="w-4 h-4 text-white" />
                    <span>End & View Lesson Scores</span>
                  </button>
               </div>
             </>
          )}
        </div>
      </div>

      {isTimeExhausted && (
        <div className="w-full bg-[#3b0d11]/85 border-y border-red-500/30 py-3 px-4 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 backdrop-blur shadow-lg z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/10 text-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-bold text-white leading-normal">
                ⚠️ আপনার ক্রেডিট ব্যালেন্স শেষ হয়ে গেছে। ক্লাসরুম জেমিনি এআই নিষ্ক্রিয় রয়েছে!
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold mt-0.5">
                অনুগ্রহ করে ড্যাশবোর্ড থেকে ক্রেডিট টিকিট বা প্রিমিয়াম সাবস্ক্রিপশন ক্রয় করুন। (Credit expired! Please buy credits to continue.)
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/buy-premium')}
            className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-red-500 to-amber-500 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer text-[10px] md:text-xs font-black uppercase tracking-wider text-white rounded-xl flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buy Credits • ক্রেডিট কিনুন</span>
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 pb-4">
           {messages.length === 0 && isLoading && (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
               <Loader2 className="w-6 h-6 animate-spin mb-3 text-amber-500" />
               <p className="text-xs font-medium">Initializing text class lesson...</p>
             </div>
           )}

           {messages.map((msg) => (
             <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`flex gap-1.5 max-w-[94%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800 border border-amber-500/20 shadow-md'}`}>
                   {msg.role === 'user' ? <User className="w-2.5 h-2.5 text-white" /> : <span className="text-[8px]">👑</span>}
                 </div>
                 <div className={`p-2.5 md:p-3 rounded-2xl relative ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#16224f]/60 border border-slate-800 text-slate-200 rounded-tl-sm'} group/bubble`}>
                   {msg.role === 'model' && (
                     <button
                       type="button"
                       onClick={() => speakMessage(msg.text, msg.id)}
                       className={`absolute right-2 top-2 p-1 rounded-lg border transition-all duration-200 cursor-pointer ${
                         currentlySpeakingId === msg.id
                           ? 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse scale-105 z-10'
                           : 'bg-slate-900/80 hover:bg-[#1f2d5a] border-slate-700/60 text-slate-400 hover:text-amber-400 md:opacity-0 md:group-hover/bubble:opacity-100 z-10'
                       }`}
                       title={currentlySpeakingId === msg.id ? "Stop reading aloud (পড়া বন্ধ করুন)" : "Read message aloud (পড়ে শুনুন)"}
                     >
                       {currentlySpeakingId === msg.id ? (
                         <VolumeX className="w-3.5 h-3.5" />
                       ) : (
                         <Volume2 className="w-3.5 h-3.5" />
                       )}
                     </button>
                   )}
                   <div className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-400 w-full prose-code:text-amber-300 ${getFontSizeClass(fontSize)} ${msg.role === 'model' ? 'pr-6' : ''}`}>
                     <Markdown>{msg.text}</Markdown>
                   </div>
                 </div>
               </div>
             </div>
           ))}
           
           {isLoading && messages.length > 0 && (
             <div className="flex w-full justify-start">
               <div className="flex gap-1.5 max-w-[94%] sm:max-w-[85%] flex-row">
                 <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-slate-800 border border-amber-500/20 shadow-md">
                   <span className="text-[8px]">👑</span>
                 </div>
                 <div className="p-2.5 md:p-3 rounded-2xl bg-[#16224f]/60 border border-slate-800 text-slate-200 rounded-tl-sm flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                   <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                   <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                 </div>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full bg-[#111936] border-t border-slate-800 p-4 shrink-0">
        {voiceError && (
          <div className="max-w-3xl mx-auto mb-2 text-center text-xs font-semibold text-red-400 animate-bounce">
            ⚠️ {voiceError}
          </div>
        )}
        {isListening && (
          <div className="max-w-3xl mx-auto mb-2 flex items-center justify-center gap-2 text-xs font-semibold text-amber-400 animate-pulse bg-slate-900/80 py-1.5 px-3 rounded-full border border-red-500/30 w-fit">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            <span>Listening in {speechLang === 'bn-BD' ? 'Bengali (বাংলা)' : 'English (ইংরেজি)'}... Please speak now! (এখন কথা বলুন...)</span>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="w-full max-w-3xl mx-auto relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={isListening ? "Listening..." : "Type your response or speak with the microphone button..."}
            className="w-full bg-[#0a0f21] border border-slate-700/50 rounded-2xl py-3.5 pl-5 pr-44 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium disabled:opacity-50"
            autoFocus
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
             {/* Speech language selector toggle */}
             <button
               type="button"
               disabled={isLoading}
               onClick={() => setSpeechLang(prev => prev === 'bn-BD' ? 'en-US' : 'bn-BD')}
               className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-[10px] font-black text-amber-400 cursor-pointer select-none transition-colors duration-200 flex items-center gap-1 shrink-0"
               title="Toggle Voice Input Language (ভাষা পরিবর্তন)"
             >
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               {speechLang === 'bn-BD' ? 'BN (বাংলা)' : 'EN (English)'}
             </button>

             {/* Microphone voice button */}
             <button
               type="button"
               onClick={startListening}
               disabled={isLoading}
               className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                 isListening 
                   ? 'bg-red-500 hover:bg-red-600 outline-none ring-2 ring-red-400 text-white animate-pulse border-red-500' 
                   : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-amber-400'
               }`}
               title={isListening ? "Listening... Click to stop (কথা বলুন)" : "Voice Response (কথা বলে উত্তর দিন)"}
             >
               <Mic className="w-4 h-4" />
             </button>

             {/* Send button */}
             <button
               type="submit"
               disabled={!inputValue.trim() || isLoading}
               className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer shrink-0"
               title="Send message (পাঠান)"
             >
               <Send className="w-4 h-4 ml-0.5" />
             </button>
          </div>
        </form>
      </div>

    </div>
  );
};
