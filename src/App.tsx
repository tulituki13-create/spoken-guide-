import React, { useState, useEffect, useRef, useContext } from "react";
import { WelcomeHeader } from "./components/WelcomeHeader";
import { LiveSessionInteraction } from "./components/LiveSessionInteraction";
import { ScenarioSlickSelector } from "./components/ScenarioSlickSelector";
import { AdminPanel } from "./components/AdminPanel";
import { PerformanceHub, PerformanceRecord } from "./components/PerformanceHub";
import { MicState } from "./types";
import { AuthContext } from "./AuthContext";
import { AuthModal } from "./components/AuthModal";
import { MessageSquare, Sparkles, AlertCircle, Sparkle, UploadCloud, Loader, Lock, X } from "lucide-react";

export default function App() {
  const { user, login, logout, updateUsageLocally } = useContext(AuthContext);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pdfStoreId, setPdfStoreId] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("Guest");

  // --- Scenarios & Tutor State ---
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState("Buddy");
  const [selectedVoice, setSelectedVoice] = useState<string>("Zephyr");
  const [micState, setMicState] = useState<MicState>("ready");
  const [currentInterimTranscript, setCurrentInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fullTranscriptRef = useRef<string>("");
  
  // Usage tracking interval for Live Voice sessions (WebSocket doesn't auto-track properly over HTTP, so we'll do it manually)
  const lastTimeUpdateObj = useRef<{ time: number }>({ time: Date.now() });

  const [anonymousChatTime, setAnonymousChatTime] = useState(0);
  const [anonymousTries, setAnonymousTries] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('anon_reset_date');
    if (storedDate !== today) {
      localStorage.setItem('anon_reset_date', today);
      localStorage.setItem('anon_chat_time', '0');
      localStorage.setItem('anon_tries', '0');
      setAnonymousChatTime(0);
      setAnonymousTries(0);
    } else {
      setAnonymousChatTime(parseInt(localStorage.getItem('anon_chat_time') || '0', 10));
      setAnonymousTries(parseInt(localStorage.getItem('anon_tries') || '0', 10));
    }
  }, []);

  // Sync time to server periodically when on
  useEffect(() => {
    let interval: any;
    if (micState === "listening" || micState === "thinking") {
      lastTimeUpdateObj.current.time = Date.now();
      interval = setInterval(() => {
        const now = Date.now();
        const seconds = Math.floor((now - lastTimeUpdateObj.current.time) / 1000);
        if (seconds >= 5) {
           lastTimeUpdateObj.current.time = now;
           if (user && user.token) {
             fetch('/api/auth/time/usage', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ auth: user.token, seconds })
             });
             updateUsageLocally(seconds);
           } else {
             setAnonymousChatTime((prev) => {
               const next = prev + seconds;
               localStorage.setItem('anon_chat_time', next.toString());
               return next;
             });
           }
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [micState, user, updateUsageLocally]);
  
  // Prevent usage if time exhausted or tries exhausted
  const isTimeExhausted = user ? user.timeLeft === 0 : (180 - anonymousChatTime <= 0 || anonymousTries >= 3);
  
  useEffect(() => {
      if (isTimeExhausted) {
          if (micState !== 'ready') {
              setStatusMessage("Your daily limit has been exhausted. Please wait until tomorrow or upgrade to premium.");
          }
      }
  }, [isTimeExhausted, micState]);
  
  // Performance Hub & persistent summaries list state
  const [historySummaries, setHistorySummaries] = useState<PerformanceRecord[]>(() => {
    try {
      const stored = localStorage.getItem("buddy_performance_records");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Sync performance logs to localStorage instantly
  useEffect(() => {
    try {
      localStorage.setItem("buddy_performance_records", JSON.stringify(historySummaries));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [historySummaries]);

  const handleClearRecords = () => {
    setHistorySummaries([]);
    try {
      localStorage.removeItem("buddy_performance_records");
    } catch (e) {}
  };

  const onLiveTranscript = (text: string, isModel: boolean, isFinal: boolean) => {
    if (isFinal) {
      fullTranscriptRef.current += `\n${isModel ? "Tutor" : "Student"}: ${text}`;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setStatusMessage("দয়া করে শুধুমাত্র PDF ফাইল আপলোড করুন। (Please upload PDF files only.)");
      return;
    }

    setIsUploading(true);
    setStatusMessage("ফাইল আপলোড হচ্ছে... (Uploading file...)");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = (reader.result as string).replace(/^data:application\/pdf;base64,/, "");

      try {
        const res = await fetch("/api/upload-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64: base64String }),
        });

        if (!res.ok) throw new Error("Upload failed.");
        const data = await res.json();
        
        setPdfStoreId(data.pdfId);
        setSelectedScenarioId("pdf"); // custom scenario id
        setStatusMessage(`PDF আপলোড সফল হয়েছে! (PDF Upload successful!) — মাইক অন করে কথা বলা শুরু করুন!`);
      } catch (e: any) {
        setStatusMessage("ত্রুটি: PDF আপলোড ব্যর্থ হয়েছে। (Error uploading PDF)");
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setStatusMessage("ত্রুটি: ফাইল পড়া ব্যর্থ হয়েছে। (Error reading file)");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  // Switch / Launch specific structured scenarios
  const handleSelectScenario = async (scenarioId: string | null) => {
    setSelectedScenarioId(scenarioId);
    if (scenarioId === "surprise") {
      setStatusMessage("বিকল্প নির্বাচন করা হয়েছে: আমাকে চমকে দিন! (Surprise Me!) — মাইক অন করে কথা বলা শুরু করুন!");
    } else if (scenarioId) {
      setStatusMessage(`বিকল্প নির্বাচন করা হয়েছে: ${scenarioId.toUpperCase()} — মাইক অন করে ভূমিকা পালন (Role-play) শুরু করুন!`);
    } else {
      setStatusMessage(null);
    }
  };

  const handleSessionEnd = async (durationSec: number, userAudioBase64?: string) => {
    if (!user) {
      setAnonymousTries(prev => {
        const next = prev + 1;
        localStorage.setItem('anon_tries', next.toString());
        return next;
      });
    }

    if (durationSec === 0) {
      fullTranscriptRef.current = ""; // reset for next time
      return;
    }

    const transcriptTxt = fullTranscriptRef.current.trim();
    setIsSummaryLoading(true);

    try {
       const res = await fetch("/api/summary", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           transcript: transcriptTxt,
           userAudio: userAudioBase64 
         })
       });
       const data = await res.json();
       setIsSummaryLoading(false);
        
        // Match name and icon for the record
       let scenarioName = "ফ্রি ইংলিশ প্র্যাকটিস (Free Talking)";
       let scenarioIcon = "🗣️";

       if (selectedScenarioId === "surprise") {
         scenarioName = "আমাকে চমকে দিন! (Surprise Me)";
         scenarioIcon = "🎁";
       } else if (selectedScenarioId === "pdf") {
         scenarioName = "আপনার PDF বিশ্লেষণ (Document Study)";
         scenarioIcon = "📄";
       } else if (selectedScenarioId) {
         // Try to find the name of the topic
         scenarioName = `টপিক: ${selectedScenarioId.toUpperCase()}`;
         if (selectedScenarioId === "shopping") {
           scenarioIcon = "🛒";
           scenarioName = "দোকানে কেনাকাটা (Shopping Roleplay)";
         } else if (selectedScenarioId === "restaurant") {
           scenarioIcon = "🍔";
           scenarioName = "রেস্টুরেন্টে খাবার অর্ডার (Restaurant Order)";
         } else if (selectedScenarioId === "airport") {
           scenarioIcon = "✈️";
           scenarioName = "এয়ারপোর্টে ইমিগ্রেশন (Airport Check)";
         } else if (selectedScenarioId === "interview") {
           scenarioIcon = "💼";
           scenarioName = "চাকরির ইন্টারভিউ (Job Interview)";
         }
       }

       const record: PerformanceRecord = {
         id: Date.now().toString(),
         scenarioName,
         scenarioIcon,
         timestamp: new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("bn-BD"),
         duration: durationSec,
         overallFeedback: data.overallFeedback || "Keep up the great work with your speaking practice!",
         spokenReview: data.spokenReview || "Focus on building clear sentence structures and pausing less.",
         practiceReview: data.practiceReview || "Excellent scenario interaction and flow with the AI tutor.",
         learningPoints: data.learningPoints || ["Keep up the great work with your speaking practice!"],
         fluencyScore: typeof data.fluencyScore === 'number' ? data.fluencyScore : 75,
         vocabularyScore: typeof data.vocabularyScore === 'number' ? data.vocabularyScore : 70,
         grammarScore: typeof data.grammarScore === 'number' ? data.grammarScore : 75,
         pronunciationScore: typeof data.pronunciationScore === 'number' ? data.pronunciationScore : 80,
       };

       setHistorySummaries(prev => [record, ...prev]);
    } catch(e) {
        // Graceful fallback logging
        let scenarioName = "ফ্রি ইংলিশ প্র্যাকটিস (Free Talking)";
        let scenarioIcon = "🗣️";

        if (selectedScenarioId === "surprise") {
          scenarioName = "আমাকে চমকে দিন! (Surprise Me)";
          scenarioIcon = "🎁";
        } else if (selectedScenarioId === "pdf") {
          scenarioName = "আপনার PDF বিশ্লেষণ (Document Study)";
          scenarioIcon = "📄";
        }

        const record: PerformanceRecord = {
          id: Date.now().toString(),
          scenarioName,
          scenarioIcon,
          timestamp: new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("bn-BD"),
          duration: durationSec,
          overallFeedback: "Keep up the great work with your speaking practice!",
          spokenReview: "You sound friendly and natural. Keep talking to gain more fluency!",
          practiceReview: "Great effort mimicking realistic conversations and responding promptly.",
          learningPoints: [
            "Try saying longer phrases without stopping.",
            "Review grammar cues after completing speaking exercises."
          ],
          fluencyScore: 75,
          vocabularyScore: 70,
          grammarScore: 75,
          pronunciationScore: 80,
        };

        setHistorySummaries(prev => [record, ...prev]);
        setIsSummaryLoading(false);
        return;
        
        // Suppress unused lines below:
        /*
        const dummy = {
         ...prev,
         overallFeedback: "Keep up the great work with your speaking practice!",
         spokenReview: "You sound friendly and natural. Keep talking to gain more fluency!",
         practiceReview: "Great effort mimicking realistic conversations and responding promptly.",
         learningPoints: [
           "Try saying longer phrases without stopping.",
           "Review grammar cues after completing speaking exercises."
         ],
         isLoading: false
       } : null);
       */
    }

    fullTranscriptRef.current = ""; // reset for next time
  };

  const handleUpdateStudentName = (newName: string) => {
    setStudentName(newName);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-slate-800 p-4 md:p-8 flex flex-col justify-between relative overflow-x-hidden" id="app-root">
      
      {/* Background Animated Ping Concentrics from Artistic Flair theme */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-15 pointer-events-none z-0">
        <div className="w-[600px] h-[600px] rounded-full border border-blue-300 animate-ping absolute" style={{ animationDuration: "6s" }}></div>
        <div className="w-[400px] h-[400px] rounded-full border border-blue-400 animate-ping absolute" style={{ animationDuration: "9s" }}></div>
        <div className="w-[250px] h-[250px] rounded-full border border-blue-400 animate-ping absolute" style={{ animationDuration: "12s" }}></div>
      </div>

      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* Welcome Header Component */}
        <WelcomeHeader
          studentName={studentName}
          setStudentName={handleUpdateStudentName}
          selectedTutor={selectedTutor}
          setSelectedTutor={setSelectedTutor}
          user={user}
          anonTimeLeft={Math.max(0, 180 - anonymousChatTime)}
          onAuthClick={() => setIsAuthModalOpen(true)}
          onLogout={logout}
        />

        {/* Information feedback notices */}
        {statusMessage && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="font-medium">{statusMessage}</p>
          </div>
        )}

        {isTimeExhausted && (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 text-red-700 rounded-2xl border border-red-200 mb-4 z-20">
            <Lock className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-xl font-bold mb-2">Limit Reached</h2>
            <p>You have used up your free allowance (time or session tries).</p>
            {!user ? (
              <p className="font-medium mt-2">Login or Register to get more time, or subscribe to Premium to get 1 hour of chat every day!</p>
            ) : (
              <p className="font-medium mt-2">Subscribe to Premium to get 1 hour of chat every day!</p>
            )}
          </div>
        )}

        <div className={isTimeExhausted ? 'opacity-80 transition-opacity' : ''}>
          <div className="flex items-center gap-4 bg-white/40 p-4 rounded-3xl border border-white shadow-sm w-full mb-4">
             <div className="flex bg-blue-100 p-3 rounded-xl text-blue-600">
               <UploadCloud className="w-6 h-6" />
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-slate-800">Study PDF Document</h3>
               <p className="text-xs text-slate-500 font-medium">Have Buddy teach you from a custom PDF document. Premium only.</p>
             </div>
             <div className="relative">
               {isUploading && <Loader className="w-5 h-5 text-blue-600 animate-spin absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />}
               <input
                 type="file"
                 accept=".pdf"
                 onChange={handleFileUpload}
                 disabled={!user?.isPremium || isUploading || isTimeExhausted}
                 className={`text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold ${
                   !user?.isPremium ? 'file:bg-slate-200 file:text-slate-400 opacity-50 cursor-not-allowed' : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer'
                 }`}
                 title={!user?.isPremium ? "Premium feature" : "Upload Document"}
               />
             </div>
          </div>
        
          <ScenarioSlickSelector
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={handleSelectScenario}
            isLoading={micState === "thinking" || micState === "listening"}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            selectedTutor={selectedTutor}
            pdfStoreId={pdfStoreId}
            onTranscript={onLiveTranscript}
            onSessionEnd={handleSessionEnd}
            isTimeExhausted={isTimeExhausted}
          />
        </div>

        {/* Persistent Conversation Review & Practice Summary Panel */}
        <PerformanceHub
          records={historySummaries}
          onClearRecords={handleClearRecords}
          isLoading={isSummaryLoading}
        />

      </div>

      {/* Humble Footer containing info credits as specified by aesthetic discipline */}
      <footer className="w-full text-center mt-12 pt-6 border-t border-slate-200/40 text-xs text-slate-400 font-medium z-10 relative flex justify-center flex-col items-center gap-2">
        <p>© 2026 বাডি - ইংরেজি ভয়েস টিউটর। শিক্ষার্থীদের আত্মবিশ্বাসী সাবলীল ইংরেজি গড়তে সাহায্য করে।</p>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAdminPanelOpen(true)}
            className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Lock className="w-3 h-3" />
            Admin Access
          </button>
          <button 
            onClick={() => setIsContactModalOpen(true)}
            className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <MessageSquare className="w-3 h-3" />
            Contact Admin
          </button>
        </div>
      </footer>

      {isAdminPanelOpen && (
        <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
      )}

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={login} />
      )}

      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsContactModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Message Admin</h2>
            <p className="text-xs text-slate-500 mb-4">Request password recovery or premium access.</p>
            <textarea
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-32 mb-4"
              placeholder="Your message..."
              id="admin-message-input"
            />
            <button 
              onClick={async () => {
                 const msg = (document.getElementById('admin-message-input') as HTMLTextAreaElement).value;
                 if (!msg) return;
                 if (!user) return alert("Please login first to send a message.");
                 await fetch('/api/auth/messages', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ auth: user.token, message: msg })
                 });
                 alert("Message sent!");
                 setIsContactModalOpen(false);
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Send Message
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
