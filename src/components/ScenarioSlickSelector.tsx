import React, { useState, useEffect, useContext } from "react";
import { Scenario, VOICES } from "../types";
import { BookOpen, HelpCircle, Star, PlayCircle, Layers, CheckCircle2, ChevronDown, Sparkles, FileText, Lock } from "lucide-react";
import { LiveSessionInteraction } from "./LiveSessionInteraction";
import { AuthContext } from "../AuthContext";

interface ScenarioSlickSelectorProps {
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string | null) => void;
  isLoading: boolean;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  // Live Session props
  selectedTutor: string;
  pdfStoreId: string | null;
  onTranscript: (text: string, isModel: boolean, isFinal: boolean) => void;
  onSessionEnd?: (durationSec: number) => void;
  isTimeExhausted?: boolean;
}

export const ScenarioSlickSelector: React.FC<ScenarioSlickSelectorProps> = ({
  selectedScenarioId,
  onSelectScenario,
  isLoading,
  selectedVoice,
  onSelectVoice,
  selectedTutor,
  pdfStoreId,
  onTranscript,
  onSessionEnd,
  isTimeExhausted,
}) => {
  const { user } = useContext(AuthContext);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((res) => res.json())
      .then((data) => {
        const combined = [...data];
        // Inject Surprise Me as a dynamic scenario card 
        combined.push({
          id: "surprise",
          name: "আমাকে চমকে দিন! (Surprise Me)",
          icon: "🎁",
          description: "টিউটর আপনাকে অবাক করে একটি চমকপ্রদ পরিস্থিতিতে নিয়ে যাবে। (Random Creative Roleplay)",
          context: "টিউটর আপনাকে অবাক করে একটি চমকপ্রদ পরিস্থিতিতে নিয়ে যাবে।",
          vocabulary: ["Spontaneous response (তাৎক্ষণিক উত্তর)", "Creative thinking (সৃজনশীল চিন্তা)"],
          difficulty: "মাঝারি"
        });
        setScenarios(combined);
      })
      .catch((err) => console.error("Failed to load scenarios:", err));
  }, []);

  let activeScenario = scenarios.find((s) => s.id === selectedScenarioId);
  if (!activeScenario && selectedScenarioId) {
    if (selectedScenarioId === "pdf") {
      activeScenario = {
        id: "pdf",
        name: "আপনার আপলোড করা PDF (My Document)",
        icon: "📄",
        description: "আপনার নিজের ফাইল থেকে প্রশ্নোত্তর অনুশীলন করুন। Interactive test and study of your document.",
        context: "আপনার আপলোড করা পিডিএফ বিষয়বস্তু বিশ্লেষণ করে উত্তর দেবে টিউটর।",
        vocabulary: ["Interactive learning (পরস্পর আলোচনা)", "Test knowledge (জ্ঞান যাচাই করা)", "Document study (নথি অনুশীলন)"],
        difficulty: "যেকোনো"
      };
    } else if (selectedScenarioId === "surprise") {
      activeScenario = {
        id: "surprise",
        name: "আমাকে চমকে দিন! (Surprise Me)",
        icon: "🎁",
        description: "টিউটর আপনাকে অবাক করে একটি চমকপ্রদ পরিস্থিতিতে নিয়ে যাবে। (Random Creative Roleplay)",
        context: "টিউটর আপনাকে অবাক করে একটি চমকপ্রদ পরিস্থিতিতে নিয়ে যাবে।",
        vocabulary: ["Spontaneous response (তাৎক্ষণিক উত্তর)", "Creative thinking (সৃজনশীল চিন্তা)"],
        difficulty: "মাঝারি"
      };
    }
  }

  const selectedVoiceObj = VOICES.find((v) => v.id === selectedVoice) || VOICES[0];

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40 p-4 rounded-3xl border border-white shadow-sm">
        <div className="flex-1">
          <h3 className="font-display font-extrabold text-base text-slate-800 flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-blue-500" />
            রোলপ্লে ও পরিস্থিতি (Role-play Topics)
          </h3>
          <p className="text-xs text-slate-500 font-medium">নির্দিষ্ট শব্দভান্ডার শিখতে পরিস্থিতি নির্বাচন করুন এবং এআই এর সাথে কথোপকথন শুরু করুন।</p>
        </div>

        {/* Compact Voice Selector Dropdown */}
        <div className="relative shrink-0 z-20">
          <button
            onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
            type="button"
            className="flex items-center gap-2 px-3.5 py-1.5 hover:bg-blue-100/80 bg-blue-50/80 border border-blue-200/50 rounded-2xl text-left cursor-pointer transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono mb-0.5">কণ্ঠস্বর (Voice)</span>
              <span className="text-xs font-bold text-blue-700 font-sans flex items-center gap-1">
                {selectedVoiceObj.emoji} {selectedVoiceObj.id}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          </button>

          {isVoiceDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100/90 py-2 z-50 flex flex-col gap-0.5">
              <div className="px-3 pb-1 border-b border-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                এআই কণ্ঠ নির্বাচন করুন (Select Voice)
              </div>
              {VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSelectVoice(v.id);
                      setIsVoiceDropdownOpen(false);
                    }}
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? "bg-blue-500 text-white font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{v.emoji}</span>
                      <div className="flex flex-col">
                        <span className={`font-bold leading-tight ${isSelected ? "text-white" : "text-slate-800"}`}>{v.id}</span>
                        <span className={`text-[9px] mt-0.5 leading-none ${isSelected ? "text-blue-100" : "text-slate-400 font-medium"}`}>{v.accent}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedScenarioId && (
          <button
            onClick={() => onSelectScenario(null)}
            className="text-xxs font-mono font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 px-3.5 rounded-full cursor-pointer transition-all self-start sm:self-auto"
          >
            ← ফিরে যান
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Grid: Scenarios Cards list */}
        <div className={`grid gap-4 ${selectedScenarioId ? "lg:col-span-6 grid-cols-1" : "lg:col-span-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
          {scenarios.map((scene) => {
            const isSelected = scene.id === selectedScenarioId;
            const isCardLocked = isTimeExhausted && !user;
            return (
              <div
                key={scene.id}
                onClick={() => {
                  if (isCardLocked) return;
                  onSelectScenario(scene.id);
                }}
                className={`p-5 rounded-2xl glass-panel text-left flex flex-col justify-between transition-all duration-300 relative border-2 ${
                  isCardLocked
                    ? "border-red-100 bg-slate-100/50 opacity-65 cursor-not-allowed"
                    : isSelected
                    ? "border-blue-500/80 bg-blue-50/20 scale-[0.98] shadow-inner cursor-pointer"
                    : "border-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4 flex-nowrap">
                    <span className="text-3xl select-none relative">
                      {scene.icon}
                      {scene.pdfId && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Practice Sheet Available (Premium)">
                           <FileText className="w-3 h-3 text-blue-500" />
                        </div>
                      )}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isCardLocked
                          ? "bg-slate-100 text-slate-400"
                          : scene.difficulty === "সহজ"
                          ? "bg-emerald-50 text-emerald-600"
                          : scene.difficulty === "মাঝারি"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isCardLocked ? "Locked" : scene.difficulty || "মাঝারি"}
                    </span>
                  </div>
                  <h4 className="font-display font-black text-slate-800 text-sm mb-1">{scene.name}</h4>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed lines-2 mb-4">{scene.description}</p>
                </div>

                {isCardLocked ? (
                  <div className="flex items-center text-xxs font-mono font-extrabold text-red-500 mt-2">
                    <span>লক করা (Locked)</span>
                    <Lock className="w-3.5 h-3.5 ml-1.5 shrink-0 text-red-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center text-xxs font-mono font-extrabold text-blue-500 mt-2">
                    <span>{isSelected ? "বর্তমানে চলছে" : "রোলপ্লে শুরু করুন"}</span>
                    <PlayCircle className="w-4 h-4 ml-1.5 shrink-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Grid: Vocabulary and Context Assistant (Opens when selected) */}
        {activeScenario && (
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Real-time Voice Session Controller */}
            <LiveSessionInteraction
              selectedTutor={selectedTutor}
              scenarioId={selectedScenarioId}
              pdfStoreId={pdfStoreId}
              selectedVoice={selectedVoice}
              onTranscript={onTranscript}
              onSessionEnd={onSessionEnd}
              isTimeExhausted={isTimeExhausted}
            />

            {/* Lesson Guide and Vocabulary list */}
            <div className="glass-panel rounded-2xl p-5 border-white flex-1 flex flex-col justify-between shadow-sm animate-pulse-once">
              <div>
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-display font-black text-sm text-slate-800 uppercase tracking-wider">
                    লিসন গাইড ও শব্দভান্ডার
                  </h4>
                </div>

                {/* Context Tip */}
                <div className="bg-white/60 rounded-xl p-3.5 border border-slate-100 mb-4 text-xs font-semibold text-slate-700 leading-normal">
                  <span className="font-mono text-xxxs text-amber-600 uppercase tracking-wider font-extrabold block mb-0.5">বিস্তারিত (Details):</span>
                  "{activeScenario.context}"
                </div>

                {activeScenario.pdfId && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Practice Sheet Attached</h5>
                      <p className="text-xxs text-slate-500 font-medium">For Premium members</p>
                    </div>
                  </div>
                )}

                {/* Suggested vocabulary */}
                <span className="text-xxs font-mono font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                  ব্যবহারিত কিছু শব্দভান্ডার:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {activeScenario.vocabulary.map((vocab, index) => {
                    const [term, explanation] = vocab.split(" (");
                    return (
                      <div key={index} className="bg-white/50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between text-left">
                        <span className="text-xxs font-bold text-blue-600 font-sans block">{term}</span>
                        {explanation && (
                          <span className="text-3xs font-medium text-slate-400 leading-tight block mt-1">
                            ({explanation}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/50 flex items-center justify-between text-xxs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> মডেল ডায়নামিক্যালি উত্তর দেবে।
                </span>
                <span className="font-mono font-black text-slate-500 uppercase">লোড সম্পন্ন</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
