import React, { useState, useRef, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Loader2, AlertTriangle, PlayCircle, MessageSquare, Mic, Send, FileText, Download, User, Volume2, VolumeX, AlertCircle, Type, Settings, MicOff, Award, Play, CheckCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LiveSessionInteraction } from './LiveSessionInteraction';
import { AuthContext } from '../AuthContext';

export const CourseRoom = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const topic = state?.topic;

  const anonChatTime = parseInt(localStorage.getItem('anon_chat_time') || '0', 10);
  const isTimeExhausted = !!(user 
    ? (user.timeLeft === 0 || (user.credits !== undefined && user.credits <= 0)) 
    : (5000 - anonChatTime <= 0)
  );

  const [messages, setMessages] = useState<{role: 'ai' | 'user' | 'model', text: string, id?: string}[]>([]);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'voice'|'text'>('voice');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [materialsMarkdown, setMaterialsMarkdown] = useState<string | null>(null);
  const [isGeneratingMaterials, setIsGeneratingMaterials] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Subtopics Management
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState<any | null>(null);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [classStep, setClassStep] = useState<'subtopics' | 'mode'>('subtopics');

  useEffect(() => {
    if (topic?.id) {
      const fetchSubtopics = async () => {
        setLoadingSubtopics(true);
        try {
          const token = localStorage.getItem('auth_token');
          const res = await fetch(`/api/user/course/topic/${topic.id}/subtopics`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          });
          const data = await res.json();
          if (data.subtopics) {
            setSubtopics(data.subtopics);
            // Default select first incomplete subtopic or the first item
            const firstUncompleted = data.subtopics.find((s: any) => s.isCompleted === 0 || s.isCompleted === false);
            setSelectedSubtopic(firstUncompleted || data.subtopics[0]);
          }
        } catch (e) {
          console.error("Error fetching subtopics in CourseRoom:", e);
        } finally {
          setLoadingSubtopics(false);
        }
      };
      fetchSubtopics();
    }
  }, [topic]);

  // Text Mode specific state
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Text Mode & Audio Speech state copied from AI Tutor
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [autoRead, setAutoRead] = useState<boolean>(() => localStorage.getItem("tutor_auto_read") !== "false");
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const spokenMessagesRef = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<any>(null);
  const submitRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  if (!topic) {
    return <div className="p-8 text-center">Topic not found.</div>;
  }

  // Speak synthesiser helper functions
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

  // Auto-speak newly added AI model replies
  useEffect(() => {
    if (messages.length > 0 && autoRead) {
      const lastMsg = messages[messages.length - 1];
      if ((lastMsg.role === 'model' || lastMsg.role === 'ai') && lastMsg.id) {
        if (!spokenMessagesRef.current.has(lastMsg.id)) {
          spokenMessagesRef.current.add(lastMsg.id);
          speakMessage(lastMsg.text, lastMsg.id);
        }
      }
    }
  }, [messages, autoRead]);

  // Clean-up speech synthesis on unmount / navigation
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech recognition setup
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
      alert("আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট করে না। অনুগ্রহ করে গুগল ক্রোম ব্যবহার করুন।");
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

  const startTextMode = async () => {
    setIsTestStarted(true);
    setIsSending(true);
    const subtopicPromptPart = selectedSubtopic 
      ? `focused specifically on the subtopic concept: "${selectedSubtopic.name}" of "${topic.grammarTopics}"`
      : `focused on ${topic.grammarTopics}`;

    const initialPrompt = `SYSTEM: Welcome the user to their personalized class topic: "${topic.stepName}" ${selectedSubtopic ? `(focused especially on: ${selectedSubtopic.name})` : ""}. 
Topic details: Focus on ${subtopicPromptPart}. The overall goal is ${topic.whatToGain}.
Greet the user friendly using a helpful Benglish/Bengali introductory tone and ask them an opening question regarding the specific subtopic to start this practice class. Keep it extremely concise (1-2 sentences).`;

    const chatHistory = [{ role: 'user', parts: [{ text: initialPrompt }] }];
    
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
          { role: 'model', text: data.reply, id: 'm0' }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendText = async (textToSend?: string) => {
    const textValue = textToSend || inputText;
    if (!textValue.trim() || isSending) return;
    
    if (isTimeExhausted) {
      setMessages(prev => [...prev, 
        { role: 'user', text: textValue, id: Date.now().toString() },
        { 
          role: 'model', 
          id: (Date.now() + 1).toString(), 
          text: "⚠️ আপনার ক্রেডিট ব্যালেন্স শেষ হয়ে গেছে। ক্লাসরুম জেমিনি এআই নিষ্ক্রিয় রয়েছে! অনুগ্রহ করে চালিয়ে যাওয়ার জন্য ক্রেডিট অর্জন বা ক্রয় করুন!\n\n(Your credit balance has expired. The AI Class Tutor is currently disabled. Please obtain or purchase credits to continue!)" 
        }
      ]);
      return;
    }

    const userText = textValue;
    if (!textToSend) {
      setInputText("");
    }
    
    setMessages(prev => [...prev, { role: 'user', text: userText, id: Date.now().toString() }]);
    setIsSending(true);

    const apiHistory = [
      { role: 'user', parts: [{ text: `SYSTEM: Class topic: "${topic.stepName}". Focus on ${topic.grammarTopics}.` }] }
    ];
    messages.forEach(m => {
      apiHistory.push({ role: m.role as any, parts: [{ text: m.text }] });
    });
    apiHistory.push({ role: 'user', parts: [{ text: userText }] });

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
        setMessages(prev => [...prev, { role: 'model', text: data.reply, id: (Date.now() + 1).toString() }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    submitRef.current = handleSendText;
  });

  const handleTranscript = (text: string, isModel: boolean, final: boolean) => {
    if (final && text.trim()) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === (isModel ? 'ai' : 'user') && lastMsg.text === text) {
           return prev;
        }
        return [...prev, { role: isModel ? 'ai' : 'user', text, id: Date.now().toString() }];
      });
    }
  };

  const handleClassEnd = async (isExhausted: boolean = false) => {
    setIsTestStarted(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (isExhausted) {
      return; // Do not generate assessment report
    }
    
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ history: messages })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // The overall score determines topic progress unlock instead of just fluency
      const combinedScore = Math.round(((data.fluencyScore || 0) + (data.vocabularyScore || 0) + (data.grammarScore || 80)) / 3);

      // If a subtopic was selected, mark it as completed!
      if (selectedSubtopic) {
        try {
          await fetch(`/api/user/course/topic/${topic.id}/subtopic/${selectedSubtopic.id}/complete`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": token ? `Bearer ${token}` : ""
            }
          });
        } catch (subErr) {
          console.error("Failed to mark subtopic complete:", subErr);
        }
      }

      try {
        await fetch(`/api/user/course/topic/${topic.id}/progress`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
          },
          body: JSON.stringify({ score: combinedScore })
        });
      } catch (pErr) {
        console.error("Failed to save progress:", pErr);
      }

      setReport({ ...data, combinedScore });
    } catch (err: any) {
      console.error(err);
      setErrorStatus("Failed to grade interaction. " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateClassPDF = async (text: string) => {
    setIsDownloadingPdf(true);
    try {
      const printContainer = document.createElement('div');
      printContainer.id = 'temp-pdf-render-container';
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '-9999px';
      printContainer.style.width = '794px';
      printContainer.style.zIndex = '-9999';
      document.body.appendChild(printContainer);

      // Create high-specificity light mode style rules inside the PDF render container.
      // This guarantees colors are correct and crisp, even if the main page is in dark mode.
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        #temp-pdf-render-container {
          background-color: #ffffff !important;
          color: #1e293b !important;
        }
        #temp-pdf-render-container * {
          background-color: transparent;
          color: inherit;
        }
        #temp-pdf-render-container .print-page-portal,
        #temp-pdf-render-container .print-page-portal h1,
        #temp-pdf-render-container .print-page-portal h2,
        #temp-pdf-render-container .print-page-portal h3,
        #temp-pdf-render-container .print-page-portal p,
        #temp-pdf-render-container .print-page-portal div {
          background-color: #ffffff !important;
        }
        #temp-pdf-render-container [style*="linear-gradient"] {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important;
        }
        #temp-pdf-render-container [style*="background-color: rgb(254, 242, 242)"],
        #temp-pdf-render-container [style*="#fef2f2"] {
          background-color: #fef2f2 !important;
        }
        #temp-pdf-render-container [style*="background-color: rgb(240, 253, 244)"],
        #temp-pdf-render-container [style*="#f0fdf4"] {
          background-color: #f0fdf4 !important;
        }
        #temp-pdf-render-container [style*="background-color: rgb(254, 252, 232)"],
        #temp-pdf-render-container [style*="#fefce8"] {
          background-color: #fefce8 !important;
        }
        #temp-pdf-render-container .dark {
          color: #1e293b !important;
        }
      `;
      printContainer.appendChild(styleEl);

      // Convert Markdown to fully-styled structural HTML blocks with increased font size
      const lines = text.split('\n');
      const htmlBlocks: string[] = [];

      for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        // Headers mapping
        if (trimmed.startsWith('# ')) {
          htmlBlocks.push(`<h1 style="color: #0f172a !important; font-size: 28px !important; font-weight: 900 !important; margin-bottom: 24px !important; margin-top: 14px !important; line-height: 1.35 !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;">${trimmed.substring(2)}</h1>`);
          continue;
        }
        if (trimmed.startsWith('## ')) {
          htmlBlocks.push(`<h2 style="color: #1e1b4b !important; font-size: 23px !important; font-weight: 950 !important; margin-top: 30px !important; margin-bottom: 18px !important; border-bottom: 2.5px solid #cbd5e1 !important; padding-bottom: 10px !important; display: flex !important; align-items: center !important; gap: 8px !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;">${trimmed.substring(3)}</h2>`);
          continue;
        }
        if (trimmed.startsWith('### ')) {
          htmlBlocks.push(`<h3 style="color: #312e81 !important; font-size: 20px !important; font-weight: 800 !important; margin-top: 24px !important; margin-bottom: 14px !important; border-left: 4.5px solid #4338ca !important; padding-left: 12px !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;">${trimmed.substring(4)}</h3>`);
          continue;
        }

        // Horizontal dividers
        if (trimmed === '---') {
          htmlBlocks.push(`<hr style="border: 0 !important; border-top: 2.5px solid #cbd5e1 !important; margin: 20px 0 !important;" />`);
          continue;
        }

        // List item detection
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const isNum = /^\d+\.\s+/.test(trimmed);

        if (isBullet || isNum) {
          const content = isBullet ? trimmed.replace(/^[-*]\s+/, '') : trimmed.replace(/^\d+\.\s+/, '');
          
          let isSpecialBox = false;
          let boxHtml = "";

          // Format premium error analysis boxes elegantly with bulletproof colors and larger readable fonts
          if (content.includes("ভুল ইংরেজি বাক্য") || content.includes("❌ Incorrect")) {
            const cleanText = content.replace(/\*\*ভুল ইংরেজি বাক্য\s*\(❌\s*Incorrect\):\*\*\s*/gi, "").replace(/^\s*-\s*/, "");
            boxHtml = `<div style="background-color: #fef2f2 !important; border: 1.5px solid #fee2e2 !important; border-left: 5.5px solid #ef4444 !important; border-radius: 10px !important; padding: 16px 20px !important; margin: 14px 0 !important; font-size: 18px !important; color: #991b1b !important; line-height: 1.6 !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;"><strong style="font-weight: 900 !important; color: #b91c1c !important;">ভুল ইংরেজি বাক্য (Incorrect):</strong> <span style="font-family: monospace !important; font-weight: 600 !important; font-size: 16px !important; background: rgba(239, 68, 68, 0.04) !important; padding: 3px 6px !important; border-radius: 4px !important; border: 1px solid rgba(239, 68, 68, 0.1) !important;">${cleanText}</span></div>`;
            isSpecialBox = true;
          } else if (content.includes("সঠিক ইংরেজি বাক্য") || content.includes("✅ Correct")) {
            const cleanText = content.replace(/\*\*সঠিক ইংরেজি বাক্য\s*\(✅\s*Correct\):\*\*\s*/gi, "").replace(/^\s*-\s*/, "");
            boxHtml = `<div style="background-color: #f0fdf4 !important; border: 1.5px solid #dcfce7 !important; border-left: 5.5px solid #22c55e !important; border-radius: 10px !important; padding: 16px 20px !important; margin: 14px 0 !important; font-size: 18px !important; color: #166534 !important; line-height: 1.6 !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;"><strong style="font-weight: 900 !important; color: #15803d !important;">সঠিক ইংরেজি বাক্য (Correct):</strong> <span style="font-family: monospace !important; font-weight: 700 !important; font-size: 16px !important; background: rgba(34, 197, 94, 0.04) !important; padding: 3px 6px !important; border-radius: 4px !important; color: #115e59 !important; border: 1px solid rgba(34, 197, 94, 0.1) !important;">${cleanText}</span></div>`;
            isSpecialBox = true;
          } else if (content.includes("সহজ বিশ্লেষণ") || content.includes("💡 Explanation")) {
            const cleanText = content.replace(/\*\*(?:সহজ বিশ্লেষণ|সহজ विश्लेषण)\s*\(💡\s*Explanation\):\*\*\s*/gi, "").replace(/^\s*-\s*/, "");
            boxHtml = `<div style="background-color: #fefce8 !important; border: 1.5px solid #fef9c3 !important; border-left: 5.5px solid #eab308 !important; border-radius: 10px !important; padding: 16px 20px !important; margin: 14px 0 !important; font-size: 17.5px !important; color: #713f12 !important; line-height: 1.7 !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;"><strong style="font-weight: 900 !important; color: #a16207 !important;">💡 সহজ বিশ্লেষণ (Explanation):</strong> ${cleanText}</div>`;
            isSpecialBox = true;
          }

          if (isSpecialBox) {
            htmlBlocks.push(boxHtml);
            continue;
          }

          if (isNum) {
            const numMatch = trimmed.match(/^(\d+)\.\s+/);
            const numPrefix = numMatch ? numMatch[1] : "1";
            htmlBlocks.push(`<div style="display: flex !important; align-items: flex-start !important; gap: 10px !important; margin-bottom: 12px !important; font-size: 18px !important; line-height: 1.65 !important; color: #1e293b !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;"><span style="color: #4338ca !important; font-weight: bold !important; font-size: 18px !important; line-height: 1.65 !important; min-width: 24px !important; text-align: right !important; user-select: none !important;">${numPrefix}.</span><div style="flex: 1 !important;">${content}</div></div>`);
          } else {
            htmlBlocks.push(`<div style="display: flex !important; align-items: flex-start !important; gap: 10px !important; margin-bottom: 12px !important; font-size: 18px !important; line-height: 1.65 !important; color: #1e293b !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;"><span style="color: #4338ca !important; font-weight: 900 !important; font-size: 20px !important; line-height: 1 !important; user-select: none !important;">•</span><div style="flex: 1 !important;">${content}</div></div>`);
          }
          continue;
        }

        // Quotes mapping
        if (trimmed.startsWith('> ')) {
          htmlBlocks.push(`<blockquote style="border-left: 4.5px solid #94a3b8 !important; padding-left: 18px !important; color: #475569 !important; font-style: italic !important; margin: 18px 0 !important; font-size: 18px !important; line-height: 1.65 !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;">${trimmed.substring(2)}</blockquote>`);
          continue;
        }

        // General structural paragraph
        htmlBlocks.push(`<p style="margin-bottom: 16px !important; font-size: 18px !important; line-height: 1.7 !important; color: #1e293b !important; text-align: left !important; font-family: system-ui, -apple-system, sans-serif !important;">${trimmed}</p>`);
      }

      // Convert inline markdown styles
      let joinedHtml = htmlBlocks.join('\n')
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #0f172a !important; font-weight: 800 !important;">$1</strong>')
        .replace(/_(.+?)_/g, '<em style="color: #475569 !important; font-style: italic !important;">$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #0f172a !important; padding: 2px 6px !important; border-radius: 6px !important; font-size: 15.5px !important; font-family: \'JetBrains Mono\', SFMono-Regular, Consolas, monospace !important; font-weight: 600 !important;">$1</code>')
        .replace(/❌/g, '<span style="color: #dc2626 !important; font-weight: 900 !important; margin-right: 4px !important;">❌</span>')
        .replace(/✅/g, '<span style="color: #16a34a !important; font-weight: 900 !important; margin-right: 4px !important;">✅</span>')
        .replace(/💡/g, '<span style="color: #ca8a04 !important; font-weight: 900 !important; margin-right: 4px !important;">💡</span>');

      const virtualDiv = document.createElement('div');
      virtualDiv.innerHTML = joinedHtml;

      const pageHeight = 1120;
      const pageWidth = 794;
      const padding = 48;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages: HTMLDivElement[] = [];
      let pageIndex = 1;

      // Clean page initializer
      const createNewPageElement = () => {
        const pageEl = document.createElement('div');
        pageEl.style.cssText = `
          width: ${pageWidth}px !important;
          height: ${pageHeight}px !important;
          padding: ${padding}px !important;
          box-sizing: border-box !important;
          background-color: #ffffff !important;
          color: #1e293b !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          font-family: system-ui, -apple-system, sans-serif !important;
        `;
        pageEl.className = 'print-page-portal pdf-force-light';

        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          min-height: 0 !important;
          overflow: hidden !important;
          background-color: transparent !important;
          color: #1e293b !important;
        `;

        // Academic Header Layout with slightly increased font sizes
        let headerHtml = '';
        if (pageIndex === 1) {
          headerHtml = `
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important; border-radius: 16px !important; padding: 24px !important; color: #ffffff !important; margin-bottom: 24px !important; border: 1.5px solid #4338ca !important; text-align: left !important; box-shadow: 0 4px 12px rgba(30, 27, 75, 0.15) !important;">
              <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 8px !important;">
                <span style="font-size: 13px !important; font-weight: 900 !important; letter-spacing: 0.12em !important; text-transform: uppercase !important; color: #ffeb3b !important; background: rgba(255, 255, 255, 0.15) !important; padding: 5px 10px !important; border-radius: 6px !important;">Spoken Guide Pro Handout</span>
                <span style="background-color: transparent !important; font-size: 13px !important; font-weight: bold !important; color: #cbd5e1 !important;">${new Date().toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})}</span>
              </div>
              <h1 style="background-color: transparent !important; font-size: 24px !important; font-weight: 950 !important; margin: 0 !important; color: #ffffff !important; line-height: 1.3 !important;">${topic?.stepName || "Spoken English Practice Class Workbook"}</h1>
              <p style="background-color: transparent !important; font-size: 15px !important; margin: 8px 0 0 0 !important; color: #e0e7ff !important; font-weight: 500 !important; line-height: 1.4 !important;">আপনার লাইভ ক্লাসের ব্যক্তিগত রিভিশন শিট ও প্র্যাকটিস হ্যান্ডআউট</p>
            </div>
          `;
        } else {
          headerHtml = `
            <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; border-bottom: 2px solid #cbd5e1 !important; padding-bottom: 10px !important; margin-bottom: 24px !important;">
              <span style="font-size: 13.5px !important; font-weight: 800 !important; color: #4338ca !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;">${topic?.stepName || "Spoken English Practice Workbook"}</span>
              <span style="font-size: 13px !important; font-weight: 700 !important; color: #64748b !important; background: #f1f5f9 !important; padding: 3px 8px !important; border-radius: 4px !important;">Page ${pageIndex}</span>
            </div>
          `;
        }
        contentDiv.innerHTML = headerHtml;
        pageEl.appendChild(contentDiv);

        // Required link footer design at the end of every page with slightly larger readable font
        const footerEl = document.createElement('div');
        footerEl.style.cssText = `
          border-top: 2px dashed #cbd5e1 !important;
          padding-top: 14px !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          color: #475569 !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          background: #ffffff !important;
        `;
        footerEl.innerHTML = `
          <span>Spoken guide homework series - <a href="https://spokenguide.com" target="_blank" style="color: #4338ca !important; text-decoration: none !important; font-weight: 800 !important; border-bottom: 1.5px solid #4338ca !important;">https://spokenguide.com</a></span>
          <span style="font-size: 13px !important; font-weight: bold !important; background: #e2e8f0 !important; color: #334155 !important; padding: 3px 8px !important; border-radius: 9999px !important;">Page ${pageIndex}</span>
        `;
        pageEl.appendChild(footerEl);

        printContainer.appendChild(pageEl);
        return { pageEl, contentDiv, footerEl };
      };

      let current = createNewPageElement();
      let contentBody = document.createElement('div');
      contentBody.style.cssText = `
        display: flex !important;
        flex-direction: column !important;
        background-color: transparent !important;
        color: #1e293b !important;
      `;
      current.contentDiv.appendChild(contentBody);

      const elementsArray = Array.from(virtualDiv.children);

      for (let i = 0; i < elementsArray.length; i++) {
        const elementCloned = elementsArray[i].cloneNode(true) as HTMLElement;
        contentBody.appendChild(elementCloned);

        // Measure content overflows dynamically!
        // We measure the scrollHeight of current.contentDiv, which includes BOTH the academic header
        // and all appended content elements. If this total height exceeds 1000px, we roll the overhanging
        // block over to a clean next page to prevent any crops or hidden text.
        if (current.contentDiv.scrollHeight > 1000 && contentBody.children.length > 1) {
          elementCloned.remove();
          pages.push(current.pageEl);

          // Spawn new page
          pageIndex++;
          current = createNewPageElement();
          contentBody = document.createElement('div');
          contentBody.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            background-color: transparent !important;
            color: #1e293b !important;
          `;
          current.contentDiv.appendChild(contentBody);

          // Append element to new container
          const freshClone = elementsArray[i].cloneNode(true) as HTMLElement;
          contentBody.appendChild(freshClone);
        }
      }

      pages.push(current.pageEl);

      // Render each page to jsPDF
      for (let k = 0; k < pages.length; k++) {
        const pEl = pages[k];
        
        // Dynamically correct page counts in the footers
        const divsInside = pEl.querySelectorAll('div');
        divsInside.forEach(d => {
          if (d.style.borderTop === '2px dashed rgb(203, 213, 225)' || d.style.borderTop === '2px dashed #cbd5e1') {
            const numSpan = d.querySelectorAll('span')[1];
            if (numSpan) {
              numSpan.textContent = `Page ${k + 1} of ${pages.length}`;
            }
          }
        });

        const canvas = await html2canvas(pEl, {
          scale: 2.5, // Crisp 2.5x upscaling
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        if (k > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pEl.remove();
      }

      pdf.save(`Workbook_${topic?.stepName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error in PDF creation:', err);
      alert('Workbook PDF তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsDownloadingPdf(false);
      const container = document.getElementById('temp-pdf-render-container');
      if (container) {
        container.remove();
      }
    }
  };

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-slate-50 dark:bg-[#070b14] font-sans relative overflow-hidden">
      {/* Top Classroom Bar - Dynamic and interactive */}
      <div className="w-full bg-white/95 dark:bg-[#0d1430]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/85 p-3 sm:p-4 sticky top-0 z-40 shrink-0 shadow-sm transition-all">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button 
            onClick={() => {
              if (isTestStarted) {
                setShowLeaveConfirm(true);
              } else if (classStep === 'mode') {
                setClassStep('subtopics');
              } else {
                navigate('/my-course');
              }
            }} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-all shadow-sm border border-slate-200/40 dark:border-slate-700/40"
          >
            <ArrowLeft className="w-3.5 h-3.5"/> Back
          </button>
          
          <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm text-indigo-655 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> 
            <span className="truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
              Topic: {topic.stepName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isTestStarted && interactionMode === 'text' && (
              <div className="relative z-30 mr-1.5">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-md flex items-center justify-center ${
                    showSettings 
                      ? 'bg-amber-500 border-amber-400 text-[#070b14] scale-105 rotate-45' 
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-amber-550'
                  }`}
                  title="Lesson Options & Settings"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Settings Dropdown Popover */}
                {showSettings && (
                   <>
                     {/* Click-away overlay */}
                     <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" onClick={() => setShowSettings(false)} />
                     
                     <div className="absolute right-0 mt-2.5 w-60 sm:w-64 bg-[#0a0f21] border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in flex flex-col gap-4 text-left">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-[10px] sm:text-xs font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5 text-amber-500" /> Lesson Options
                          </span>
                          <button 
                            onClick={() => setShowSettings(false)}
                            className="text-slate-455 hover:text-white text-[11px] font-bold"
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
                              title="Toggle Auto Read Messages"
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-250 ${
                                  autoRead ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Option 3: End and view scores */}
                        <button
                          onClick={() => {
                            setShowSettings(false);
                            handleClassEnd();
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#4f46e5]/90 hover:bg-[#4f46e5] rounded-xl transition text-xs font-extrabold text-white cursor-pointer shadow-md"
                        >
                          <Award className="w-3.5 h-3.5 text-white" />
                          <span>End & View Lesson Scores</span>
                        </button>
                     </div>
                   </>
                )}
              </div>
            )}

            {isTestStarted ? (
              <div className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-650 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/25 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span>Active</span>
              </div>
            ) : (
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest hidden sm:inline">Online Class</span>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 min-h-0 w-full flex flex-col ${isTestStarted ? 'overflow-hidden' : 'max-w-4xl mx-auto p-4 md:p-6 overflow-y-auto gap-6'}`}>
        {!isTestStarted && !isAnalyzing && !report && (
          <div className="w-full max-w-3xl mx-auto py-4 animate-fade-in animate-duration-300">
            {classStep === 'subtopics' ? (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-950 rounded-full mb-3 text-indigo-750 dark:text-indigo-400 text-[11px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    Personalized Lesson
                  </div>
                  <h2 className="text-xl md:text-2xl font-black mb-1.5 dark:text-white leading-tight">Topic: {topic.stepName}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-455 mb-4 max-w-2xl font-normal leading-relaxed">{topic.stepDescription}</p>
                </div>

                {/* Sub-topics list (Main Practice Gateway) */}
                <div className="bg-white dark:bg-[#0c1125] p-5 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        <Award className="w-4 h-4 text-indigo-500" />
                        ধাপের সাব-টপিকসমূহ (Select Sub-topic Practice)
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">কোন সাব-টপিকটি আজ অনুশীলন করতে চান? নিচের তালিকা থেকে একটি সিলেক্ট করুন:</p>
                    </div>
                    {subtopics.length > 0 && (
                      <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 border border-indigo-200/50 px-2 py-1 rounded-lg self-start md:self-auto uppercase">
                        {subtopics.filter((s:any) => s.isCompleted).length} / {subtopics.length} Completed
                      </span>
                    )}
                  </div>

                  {loadingSubtopics ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span className="text-xs text-slate-400 animate-pulse">লোড করা হচ্ছে ইংরেজি সাব-টপিকসমূহ...</span>
                    </div>
                  ) : subtopics.length === 0 ? (
                    <div className="text-xs text-slate-450 dark:text-slate-500 italic py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                      কোনো কাস্টম সাব-টপিক পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {(() => {
                        const firstUncompletedIdx = subtopics.findIndex(s => !(s.isCompleted === 1 || s.isCompleted === true));
                        const currentSubtopic = firstUncompletedIdx !== -1 ? subtopics[firstUncompletedIdx] : null;
                        const otherSubtopics = subtopics.filter((_, idx) => idx !== firstUncompletedIdx);

                        return (
                          <>
                            {currentSubtopic && (
                              <div className="mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Next up (শুরু করার জন্য প্রস্তুত)</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubtopic(currentSubtopic);
                                    setClassStep('mode');
                                  }}
                                  className="group flex flex-col justify-between p-5 rounded-3xl text-left bg-white dark:bg-slate-900 border-2 border-indigo-400 dark:border-indigo-500/80 ring-2 ring-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-pointer transition-all duration-150 w-full relative z-10"
                                >
                                  <span className="absolute inset-0 rounded-3xl border-2 border-indigo-400 dark:border-indigo-500 animate-ping opacity-20"></span>
                                  <div className="flex items-start justify-between gap-3 w-full relative z-20">
                                    <div className="flex items-start gap-3">
                                      <span className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                                        {firstUncompletedIdx + 1}
                                      </span>
                                      <div>
                                        <span className="text-sm md:text-base font-black leading-snug text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                          {currentSubtopic.name}
                                        </span>
                                        <span className="text-[11px] text-indigo-500 dark:text-indigo-400 block mt-1 font-bold">ক্লিক করুন এই সাব-টপিকটি শুরু করতে</span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] bg-indigo-50 dark:bg-slate-900 font-black border border-indigo-200 dark:border-indigo-800 uppercase tracking-widest text-[#4f46e5] dark:text-indigo-400 px-2 py-1 rounded-lg shrink-0 select-none group-hover:bg-indigo-500 group-hover:text-white group-hover:border-transparent transition-all">
                                      Start Now
                                    </span>
                                  </div>
                                </button>
                              </div>
                            )}

                            {otherSubtopics.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Other Subtopics ({otherSubtopics.length})</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {otherSubtopics.map(s => {
                                    const originalIdx = subtopics.indexOf(s);
                                    const isCompleted = s.isCompleted === 1 || s.isCompleted === true;
                                    return (
                                      <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedSubtopic(s);
                                          setClassStep('mode');
                                        }}
                                        className={`group flex flex-col justify-between p-4 rounded-2xl border text-left cursor-pointer shadow-xs transition-all duration-150 ${
                                          isCompleted 
                                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:border-slate-700 opacity-80' 
                                            : 'bg-white hover:bg-slate-50 dark:bg-slate-950/30 dark:hover:bg-indigo-950/10 border-slate-200/60 hover:border-indigo-500 dark:border-slate-800/80 dark:hover:border-indigo-500/80'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2.5 w-full">
                                          <div className="flex items-start gap-2.5">
                                            <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                              {originalIdx + 1}
                                            </span>
                                            <div>
                                              <span className="text-xs font-bold leading-snug text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                                                {s.name}
                                              </span>
                                              <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                                                {isCompleted ? 'পুনরায় অনুশীলন করুন' : 'শিখতে ক্লিক করুন'}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {isCompleted ? (
                                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[9px] uppercase font-black px-1.5 py-0.5 rounded-lg shrink-0 select-none scale-90">
                                              ✓ Completed
                                            </span>
                                          ) : (
                                            <span className="text-[9px] bg-slate-50 dark:bg-slate-900 font-bold border border-slate-200 dark:border-slate-800 uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-lg shrink-0 select-none scale-90">
                                              Locked
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Personalized Test Results & Learning Details */}
                <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                    আপনার টেস্ট অনুযায়ী শেখার বিষয়বস্তু (Target Concepts Based on Your Test)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mb-4">
                    আপনার প্রাথমিক এসেসমেন্ট টেস্টের দক্ষতার উপর ভিত্তি করে নিচের আলোচনার বিষয়সমূহ এবং প্রতিটি ধারণার সূক্ষ্ম ব্যাকরণ প্রস্তুত করা হয়েছে।
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/50 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest block mb-1">Items to Study (শেখার বিষয়বস্তু)</span>
                        <p className="text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-200">{topic.topicsToLearn || "N/A"}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/50 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest block mb-1">In-depth Grammar Focus (সূক্ষ্ম ব্যাকরণ ফোকাস)</span>
                        <p className="text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-200">{topic.grammarTopics || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="p-3 bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-black block">What to Gain</span>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{topic.whatToGain || "N/A"}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-black block">Why It Matters</span>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{topic.whyLearn || "N/A"}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase font-black block">Educator Tip</span>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{topic.engagementInfo || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2: Mode choosing stage directly focused after clicking a subtopic */
              <div className="space-y-6 animate-fade-in">
                {/* Back Link Option */}
                <button 
                  onClick={() => setClassStep('subtopics')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 font-extrabold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-600 cursor-pointer shadow-xs transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> 
                  <span>সাব-টপিকসমূহ তালিকায় ফিরে যান (Change Sub-topic)</span>
                </button>

                {/* Selected Subtopic Heading */}
                <div className="bg-indigo-50/40 dark:bg-indigo-950/15 p-5 border border-indigo-100 dark:border-indigo-950/80 rounded-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block mb-1">অনুশীলনের জন্য নির্বাচিত সাব-টপিক</span>
                  <h3 className="text-base sm:text-lg font-black dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500 shrink-0" />
                    {selectedSubtopic?.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    এই নির্বাচিত ব্যাকরণ/সাব-টপিক চর্চার জন্য নিচের যেকোনো একটি প্রফেশনাল মাধ্যম নির্বাচন করুন এবং ক্লাস শুরু করুন।
                  </p>
                </div>

                {/* Elegant unified widget with tabs */}
                <div className="mt-6 border border-slate-250 dark:border-slate-800/70 bg-white dark:bg-[#0c1125] rounded-3xl p-5 sm:p-6 flex flex-col shadow-xs hover:shadow-md transition-all">
                  
                  {/* Tabs header */}
                  <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl mb-6 relative overflow-visible border border-slate-200 dark:border-white/5 ring-4 ring-indigo-500/10 dark:ring-indigo-500/10">
                    <button
                      onClick={() => setInteractionMode('voice')}
                      className={`group relative flex-1 py-3 px-4 rounded-xl text-[13px] font-black transition-all duration-300 flex justify-center items-center gap-2 hover:scale-[1.03] active:scale-95 ${interactionMode === 'voice' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-[0_4px_15px_-3px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:animate-none'}`}
                    >
                      {interactionMode === 'voice' && <span className="absolute inset-0 rounded-xl border-2 border-indigo-400 dark:border-indigo-500 animate-ping opacity-20"></span>}
                      <Mic className={`w-4 h-4 transition-transform duration-300 ${interactionMode !== 'voice' ? 'group-hover:scale-125 group-hover:-rotate-6' : ''}`}/> 
                      Voice Mode
                    </button>
                    <button
                      onClick={() => setInteractionMode('text')}
                      className={`group relative flex-1 py-3 px-4 rounded-xl text-[13px] font-black transition-all duration-300 flex justify-center items-center gap-2 hover:scale-[1.03] active:scale-95 ${interactionMode === 'text' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:animate-none'}`}
                    >
                      {interactionMode === 'text' && <span className="absolute inset-0 rounded-xl border-2 border-emerald-400 dark:border-emerald-500 animate-ping opacity-20"></span>}
                      <MessageSquare className={`w-4 h-4 transition-transform duration-300 ${interactionMode !== 'text' ? 'group-hover:scale-125 group-hover:rotate-6' : ''}`}/> 
                      Text Mode
                    </button>
                  </div>

                  {/* Mode Details content */}
                  <div className="flex-1">
                    {interactionMode === 'voice' ? (
                      <div className="animate-fade-in">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                          <Mic className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black dark:text-white uppercase tracking-wider mb-2">🎤 Spoken Voice Mode (ভয়েস মোড)</h4>
                        <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                          সরাসরি এআই কোচের সাথে কথা বলুন। বাস্তব কথোপকথনের মাধ্যমে মুখের জড়তা দূর করার এবং জড়তাহীন ইংরেজি বাক্য আদানপ্রদান চর্চা করার সেরা উপায়।
                        </p>
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          <span className="text-[9px] uppercase font-extrabold text-slate-400 block mb-1.5">উইজেট ফিচারসমূহ:</span>
                          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc leading-normal font-semibold">
                            <li>মাইক্রোফোন দিয়ে এআই শিক্ষকের সাথে লাইভ ভয়েস ট্র্যাকিং।</li>
                            <li>কোচের নিখুঁত ও চমৎকার ব্রিটিশ/আমেরিকান অ্যাকসেন্ট।</li>
                            <li>ভয়েস মোড ব্যবহারের জন্য স্ট্যান্ডার্ড ক্রেডিট প্রয়োজন হয়।</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-fade-in">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>💬 Simple Text Mode (টেক্সট মোড)</span>
                          <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-lg uppercase tracking-wider font-extrabold scale-95 leading-none">FREE • সাশ্রয়ী</span>
                        </h4>
                        <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                          মেসেজ বা চ্যাটের মাধ্যমে এআই শিক্ষকের সাথে ইংরেজি প্র্যাকটিস চালান। এটি টাইপিং এবং লিখিত গ্রামার ভুল সংশোধন করার জন্য অত্যন্ত উপযোগী।
                        </p>
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          <span className="text-[9px] uppercase font-extrabold text-slate-400 block mb-1.5">উইজেট ফিচারসমূহ:</span>
                          <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc leading-normal font-semibold">
                            <li>মেসেজ করে কথোপকথন এবং ভুল সংশোধনের সহজ গাইডেন্স।</li>
                            <li>কম খরচের জন্য এই মোডটি অত্যন্ত ক্রেডিট সাশ্রয়ী ফীচার।</li>
                            <li>যেকোনো কম গতির ইন্টানেটেও অত্যন্ত স্বতঃস্ফূর্ত ও চমৎকার চ্যাটিং।</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                       if (interactionMode === 'voice') {
                         setIsTestStarted(true);
                       } else {
                         startTextMode();
                       }
                    }}
                    className={`group relative mt-6 w-full py-4 text-white rounded-xl font-black text-[13px] shadow-lg transition-all duration-300 text-center flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer overflow-hidden ${
                      interactionMode === 'voice' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-white dark:ring-offset-[#0c1125]' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-white dark:ring-offset-[#0c1125]'
                    }`}
                  >
                    <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                    <span className="absolute inset-0 w-full h-full -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
                    <PlayCircle className="w-5 h-5 group-hover:animate-pulse" /> 
                    {interactionMode === 'voice' ? 'Spoken Class শুরু করুন (Start Voice Class)' : 'Chatted Class শুরু করুন (Start Text Class)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Fullscreen Voice Mode Classroom */}
        {isTestStarted && interactionMode === 'voice' && (
          <div className="flex-1 min-h-0 flex flex-col h-full w-full bg-[#0a0f24] overflow-y-auto custom-scrollbar animate-fade-in text-slate-100 items-center">
            <div className="w-full max-w-md p-4 sm:p-6 flex flex-col items-center my-auto py-8">
              <div className="bg-[#111936] p-6 sm:p-8 rounded-[2rem] border border-indigo-500/10 shadow-2xl shadow-indigo-900/20 relative z-10 w-full text-center">
                <span className="px-3 py-1.5 text-[10px] uppercase font-black tracking-widest bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  🎙️ VOICE CHANNEL ACTIVE
                </span>
                
                <div className="my-6">
                  <LiveSessionInteraction
                    selectedTutor="Assessor"
                    scenarioId={null}
                    courseTopicId={topic.id}
                    courseSubtopicId={selectedSubtopic?.id}
                    selectedVoice="Aoede"
                    speakSlowly={false}
                    onTranscript={handleTranscript}
                    onSessionEnd={() => {}}
                    onSubmitPractice={handleClassEnd}
                    isMinimal={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Text Mode Classroom */}
        {isTestStarted && interactionMode === 'text' && (
          <div className="flex-1 min-h-0 flex flex-col h-full w-full bg-[#070b14] overflow-hidden animate-fade-in text-slate-100">
            {/* Embedded Instruction Banner for helpful context */}
            <div className="bg-[#111936] px-4 py-2 text-[11px] border-b border-indigo-950/40 text-indigo-300 font-bold flex justify-between items-center shrink-0">
              <span className="flex items-center gap-1.5 flex-row">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Text Interactive Room (কম ক্রেডিট ব্যবহৃত হচ্ছে)</span>
              </span>
              <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">
                Credit Saving
              </span>
            </div>

            {/* If time/credits are exhausted banner */}
            {isTimeExhausted && (
              <div className="w-full bg-[#3b0d11]/85 border-b border-red-500/30 py-3 px-4 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 backdrop-blur shadow-lg z-10 animate-fade-in">
                <div className="flex items-center gap-3 text-left flex-row">
                  <div className="p-2 rounded-full bg-red-500/10 text-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-white leading-normal">
                      ⚠️ আপনার ক্রেডিট ব্যালেন্স শেষ হয়ে গেছে। ক্লাসরুম জেমینی এআই নিষ্ক্রিয় রয়েছে!
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold mt-0.5">
                      অনুগ্রহ করে ড্যাশবোর্ড থেকে ক্রেডিট টিকিট বা প্রিমিয়াম সাবস্ক্রিপশন ক্রয় করুন। (Credit expired! Buy credits to continue.)
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

            {/* Immersive chat list pane that spans the full height with custom font size */}
            <div className="flex-1 overflow-y-auto p-4 md:px-6 space-y-3 max-w-3xl mx-auto w-full custom-scrollbar pb-24">
               {messages.map((msg, idx) => {
                 const isUser = msg.role === 'user';
                 const msgId = msg.id || `msg-${idx}`;
                 return (
                   <div key={msgId} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                     <div className={`flex gap-1.5 max-w-[94%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                       <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-slate-800 border border-amber-500/20 shadow-md'}`}>
                         {isUser ? <User className="w-2.5 h-2.5 text-white" /> : <span className="text-[8px]">👑</span>}
                       </div>
                       <div className={`p-2.5 md:p-3 rounded-2xl relative ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#16224f]/60 border border-slate-850 text-slate-200 rounded-tl-none'} group/bubble`}>
                         {!isUser && (
                           <button
                             type="button"
                             onClick={() => speakMessage(msg.text, msgId)}
                             className={`absolute right-2 top-2 p-1 rounded-lg border transition-all duration-200 cursor-pointer ${
                               currentlySpeakingId === msgId
                                 ? 'bg-amber-500 border-amber-400 text-slate-950 animate-pulse scale-105 z-10'
                                 : 'bg-slate-900/80 hover:bg-[#1f2d5a] border-slate-700/60 text-slate-400 hover:text-amber-400 md:opacity-0 md:group-hover/bubble:opacity-100 z-10'
                             }`}
                           >
                             {currentlySpeakingId === msgId ? (
                               <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                             ) : (
                               <Volume2 className="w-3.5 h-3.5" />
                             )}
                           </button>
                         )}
                         <div className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-450 w-full prose-code:text-amber-300 chat-classroom-markdown ${getFontSizeClass(fontSize)} ${!isUser ? 'pr-6' : ''}`}>
                           <Markdown>{msg.text}</Markdown>
                         </div>
                       </div>
                     </div>
                   </div>
                 );
               })}
               
               {isSending && (
                 <div className="flex w-full justify-start">
                   <div className="flex gap-1.5 max-w-[94%] sm:max-w-[85%] flex-row">
                     <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 bg-slate-800 border border-amber-550/20 shadow-md">
                       <span className="text-[8px]">👑</span>
                     </div>
                     <div className="p-2.5 md:p-3 rounded-2xl bg-[#16224f]/60 border border-slate-850 text-slate-200 rounded-tl-none flex items-center gap-1.5 flex-row">
                       <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                     </div>
                   </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>
            
            {/* Compact Bottom Input Bar positioned beautifully at the bottom of the fullscreen room */}
            <div className="bg-[#111936]/95 backdrop-blur-md border-t border-indigo-950/50 p-3 sm:p-4 shrink-0 z-10">
              {voiceError && (
                <div className="max-w-3xl mx-auto mb-2 text-center text-xs font-semibold text-red-400 animate-bounce">
                  ⚠️ {voiceError}
                </div>
              )}
              {isListening && (
                <div className="max-w-3xl mx-auto mb-2 flex items-center justify-center gap-2 text-xs font-semibold text-amber-400 animate-pulse bg-slate-900/80 py-1.5 px-3 rounded-full border border-red-500/30 w-fit flex-row">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  <span>Listening {speechLang === 'bn-BD' ? '(বাংলা)' : '(English)'}... Speak now!</span>
                </div>
              )}

              <div className="max-w-3xl mx-auto w-full flex items-center gap-2 relative flex-row">
                <button 
                  onClick={() => handleClassEnd()} 
                  className="px-3 py-2 bg-red-650 hover:bg-red-700 text-white text-[10px] sm:text-xs font-black rounded-xl transition-all shadow-md shrink-0 uppercase tracking-wider h-11"
                >
                  End Class
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    value={inputText}
                    disabled={isSending}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendText()}
                    placeholder={isListening ? "Listening..." : "এআই কোচকে উত্তর দিন বা প্রশ্ন করুন..."}
                    className="w-full bg-[#070b14] border-none rounded-xl pl-3 pr-28 py-3 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 h-11"
                  />
                  
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 flex-row">
                     {/* Speech Lang toggle */}
                     <button
                       type="button"
                       disabled={isSending}
                       onClick={() => setSpeechLang(prev => prev === 'bn-BD' ? 'en-US' : 'bn-BD')}
                       className="h-8 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-[9px] font-black text-amber-400 cursor-pointer select-none transition-colors flex items-center gap-0.5 shrink-0"
                       title="Change Language"
                     >
                       {speechLang === 'bn-BD' ? 'BN' : 'EN'}
                     </button>

                     {/* Microphone Mic button */}
                     <button
                       type="button"
                       onClick={startListening}
                       disabled={isSending}
                       className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-650 outline-none ring-1 ring-red-400 text-white animate-pulse border-red-500' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-amber-400'}`}
                       title={isListening ? 'Listening...' : 'Speak response'}
                     >
                       <Mic className="w-3.5 h-3.5" />
                     </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleSendText()}
                  disabled={!inputText.trim() || isSending}
                  className="p-2.5 bg-indigo-600 disabled:opacity-40 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer shrink-0 h-11 w-11 flex items-center justify-center"
                >
                  <Send className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>
        )}

        {isAnalyzing && (
           <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-full mb-6">
               <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
             </div>
             <h2 className="text-2xl font-black dark:text-white mb-2">Grading your class...</h2>
             <p className="text-slate-500 font-medium max-w-sm">Assessing your improvement on {topic.stepName}...</p>
           </div>
        )}

        {report && (
          <div className="bg-[#111936] p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-indigo-500/10 w-full max-w-2xl mx-auto my-8">
            <h3 className="text-2xl sm:text-3xl font-black mb-4 text-white">Class Results</h3>
            <p className="text-slate-300 font-medium mb-8 leading-relaxed">{report.overallFeedback}</p>
            
            {report.combinedScore >= 80 ? (
              <div className="p-4 mb-8 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-2xl flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" /> Topic Unlocked!
              </div>
            ) : (
              <div className="p-4 mb-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-2xl flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Study more to reach 80% to unlock next topic
              </div>
            )}

            <div className="mb-8 flex flex-col gap-3">
              <button 
                onClick={async () => {
                  if (materialsMarkdown) {
                    await generateClassPDF(materialsMarkdown);
                    return;
                  }
                  
                  setIsGeneratingMaterials(true);
                  const token = localStorage.getItem('auth_token');
                  try {
                    const res = await fetch(`/api/user/course/topic/${topic.id}/materials`, {
                      method: 'POST',
                      headers: { Authorization: token ? `Bearer ${token}` : '' }
                    });
                    const data = await res.json();
                    if (data.markdown) {
                      setMaterialsMarkdown(data.markdown);
                      // Instantly trigger download once generated successfully!
                      await generateClassPDF(data.markdown);
                    }
                  } catch(e) {}
                  setIsGeneratingMaterials(false);
                }}
                disabled={isGeneratingMaterials || isDownloadingPdf}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 px-4 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.7)] hover:shadow-[0_0_40px_rgba(6,182,212,0.9)] border border-cyan-400/60 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:shadow-none cursor-pointer text-sm tracking-wide relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-full h-full bg-white opacity-20 blur-xl group-hover:scale-150 transition-transform duration-700 animate-pulse"></div>
                <div className="relative z-10 flex items-center justify-center gap-2.5">
                  {isGeneratingMaterials ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Personalized Workbook তৈরি হচ্ছে (Generating Lesson Materials)...</span>
                    </>
                  ) : isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                      <span className="text-amber-100 font-bold animate-pulse">হাই-কোয়ালিটি PDF কম্পাইল হচ্ছে ও ডাউনলোড হচ্ছে...</span>
                    </>
                  ) : materialsMarkdown ? (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download Class Workbook (PDF/হ্যান্ডআউট ডাউনলোড করুন)</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span className="animate-pulse">Personalized PDF Handout & Exercises তৈরি করুন</span>
                    </>
                  )}
                </div>
              </button>

              {materialsMarkdown && (
                <button
                  onClick={() => {
                    navigate('/ai-tutor-live/pdf', { state: { pdfId: topic.stepName, contextTitle: topic.stepName } });
                  }}
                  className="w-full bg-[#1e295d] hover:bg-[#2a3675] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg border border-indigo-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm tracking-wide"
                >
                  <Play className="w-5 h-5" />
                  <span>Start AI Class on this Workbook (বুক পিডিএফ এ ক্লাস করুন)</span>
                </button>
              )}
            </div>
            
            {materialsMarkdown && (
               <div className="mb-8 p-6 bg-[#0a0f24] border border-indigo-500/10 rounded-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                 <h4 className="font-black text-lg mb-4 text-white flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /> Class Materials</h4>
                 <div className="prose prose-sm prose-invert max-w-none prose-h1:text-xl prose-h2:text-lg prose-indigo custom-scrollbar max-h-96 overflow-y-auto">
                    <Markdown>{materialsMarkdown}</Markdown>
                 </div>
               </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-center items-center text-center">
                <div className="text-[10px] sm:text-xs text-indigo-300 font-black tracking-widest uppercase mb-1">Learning Growth</div>
                <div className="text-3xl font-black text-white">{report.combinedScore}%</div>
              </div>
              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-center items-center text-center">
                <div className="text-[10px] sm:text-xs text-indigo-300 font-black tracking-widest uppercase mb-1">Fluency Mark</div>
                <div className="text-3xl font-black text-white">{report.fluencyScore}%</div>
              </div>
              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-center items-center text-center">
                <div className="text-[10px] sm:text-xs text-indigo-300 font-black tracking-widest uppercase mb-1">Vocabulary</div>
                <div className="text-3xl font-black text-white">{report.vocabularyScore}%</div>
              </div>
              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-center items-center text-center">
                <div className="text-[10px] sm:text-xs text-indigo-300 font-black tracking-widest uppercase mb-1">Grammar</div>
                <div className="text-3xl font-black text-white">{report.grammarScore}%</div>
              </div>
            </div>
            <button onClick={() => navigate("/my-course")} className="w-full bg-[#1e295d] hover:bg-[#2a3675] text-white font-black py-4 px-4 rounded-xl shadow-lg border border-indigo-500/20 transition-all text-sm tracking-wide mt-8">Return to Course Outline</button>
          </div>
        )}

        {errorStatus && (
           <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/50">
             <AlertTriangle className="w-5 h-5" /> {errorStatus}
           </div>
        )}
      </div>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Leave Practice Room?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              If you leave now, your current progress won't be saved unless you get graded by the AI.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowLeaveConfirm(false);
                  setIsTestStarted(false);
                }}
                className="w-full py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Yes, Leave Practice
              </button>
              <button 
                onClick={() => setShowLeaveConfirm(false)}
                className="w-full py-3.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel & Continue 
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
