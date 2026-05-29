import React, { useState, useEffect, useRef } from "react";
import { WelcomeHeader } from "./components/WelcomeHeader";
import { LiveSessionInteraction } from "./components/LiveSessionInteraction";
import { ScenarioSlickSelector } from "./components/ScenarioSlickSelector";
import { AdminPanel } from "./components/AdminPanel";
import { MicState } from "./types";
import { MessageSquare, Sparkles, AlertCircle, Sparkle, UploadCloud, Loader, Lock, X } from "lucide-react";

export default function App() {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pdfStoreId, setPdfStoreId] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("Guest");

  // --- Scenarios & Tutor State ---
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState("Buddy");
  const [micState, setMicState] = useState<MicState>("ready");
  const [currentInterimTranscript, setCurrentInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fullTranscriptRef = useRef<string>("");
  const [sessionSummary, setSessionSummary] = useState<{ duration: number, learningPoint: string, isLoading: boolean } | null>(null);

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

  const handleSessionEnd = async (durationSec: number) => {
    if (durationSec === 0 || fullTranscriptRef.current.trim().length === 0) {
      fullTranscriptRef.current = ""; // reset for next time
      return;
    }

    setSessionSummary({ duration: durationSec, learningPoint: "", isLoading: true });

    try {
       const res = await fetch("/api/summary", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ transcript: fullTranscriptRef.current })
       });
       const data = await res.json();
       
       setSessionSummary(prev => prev ? { ...prev, learningPoint: data.summary || "Keep up the good practice!", isLoading: false } : null);
    } catch(e) {
       setSessionSummary(prev => prev ? { ...prev, learningPoint: "Keep up the good practice! (Unable to fetch custom summary)", isLoading: false } : null);
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
        />

        {/* Information feedback notices */}
        {statusMessage && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="font-medium">{statusMessage}</p>
          </div>
        )}

        {/* Bento-style conversation scenarios panel selector */}
        <ScenarioSlickSelector
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={handleSelectScenario}
          isLoading={micState === "thinking" || micState === "listening"}
        />

        <div className="w-full flex justify-center gap-4 mb-4">
          <button
            onClick={() => handleSelectScenario("surprise")}
            className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-orange-200 hover:scale-105 transition-all text-sm uppercase tracking-wider"
          >
            <Sparkle className="w-5 h-5" />
            আমাকে চমকে দিন! (Surprise Me)
          </button>
        </div>

        {/* Main Workspaces Grid: Integrated Chat and Voice Room */}
        <div className="w-full max-w-2xl mx-auto">
          
          <div className="glass-panel rounded-3xl p-5 flex flex-col border-white shadow-xl shadow-blue-100/50">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/40 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                <h3 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Live Voice Interaction
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500 font-medium bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: "8s" }} />
                    {selectedScenarioId ? (selectedScenarioId === "surprise" ? "Surprise Topic Active" : `Scenario: ${selectedScenarioId.toUpperCase()}`) : "Free Fluency Practice"}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Interaction Area - Mic */}
            <div className="shrink-0 w-full mb-4">
              <LiveSessionInteraction
                selectedTutor={selectedTutor}
                scenarioId={selectedScenarioId}
                pdfStoreId={pdfStoreId}
                onTranscript={onLiveTranscript}
                onSessionEnd={handleSessionEnd}
              />
            </div>
          </div>
        </div>

      </div>

      {sessionSummary && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative transform transition-all">
            <button onClick={() => setSessionSummary(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                🌟
              </div>
            </div>
            <h2 className="text-xl font-bold font-display text-center text-slate-800 mb-1">Session complete!</h2>
            <p className="text-center text-slate-500 font-medium text-sm mb-6">You practiced for {Math.floor(sessionSummary.duration / 60)} minutes and {sessionSummary.duration % 60} seconds.</p>
            
            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Key Learning Point
              </h3>
              {sessionSummary.isLoading ? (
                <div className="flex flex-col items-center justify-center py-4 text-slate-400 gap-2">
                  <Loader className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-xs">Analyzing your conversation...</span>
                </div>
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {sessionSummary.learningPoint}
                </p>
              )}
            </div>
            
            <button onClick={() => setSessionSummary(null)} className="mt-6 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors">
              Continue Practicing
            </button>
          </div>
        </div>
      )}

      {/* Humble Footer containing info credits as specified by aesthetic discipline */}
      <footer className="w-full text-center mt-12 pt-6 border-t border-slate-200/40 text-xs text-slate-400 font-medium z-10 relative flex justify-center flex-col items-center gap-2">
        <p>© 2026 বাডি - ইংরেজি ভয়েস টিউটর। শিক্ষার্থীদের আত্মবিশ্বাসী সাবলীল ইংরেজি গড়তে সাহায্য করে।</p>
        <button 
          onClick={() => setIsAdminPanelOpen(true)}
          className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity"
        >
          <Lock className="w-3 h-3" />
          Admin Access
        </button>
      </footer>

      {isAdminPanelOpen && (
        <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />
      )}
    </div>
  );
}
