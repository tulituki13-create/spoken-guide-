import React, { useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { LiveSessionInteraction } from "./LiveSessionInteraction";
import { ArrowLeft, Ear, User } from "lucide-react";

export const AILiveTutorPage: React.FC = () => {
  const { topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { pdfId } = location.state || {};

  const [speakSlowly, setSpeakSlowly] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const liveLogsRef = useRef<any[]>([]);

  const handleTranscript = (text: string, isModel: boolean, isFinal: boolean) => {
    if (isFinal) {
      const newPart = { role: isModel ? "model" : "user", parts: [{ text }] };
      liveLogsRef.current = [...liveLogsRef.current, newPart];
      setLiveLogs((prev) => [...prev, newPart]);
    }
  };

  const handleSessionEnd = (durationSec: number, userAudio?: string) => {
    const topic = topicId || "Unknown Topic";
    sessionStorage.setItem("lastAITutorLogs", JSON.stringify(liveLogsRef.current));
    sessionStorage.setItem("lastAITutorTopic", topic);
    sessionStorage.setItem("lastAITutorDuration", durationSec.toString());

    navigate(`/ai-tutor-scoreboard`);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#050811] text-slate-100 flex flex-col z-[200] overflow-hidden">
      {/* Absolute top bar with back navigation and settings */}
      <div className="w-full relative z-10 flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 pb-2 shrink-0 gap-3 md:gap-0 border-b border-white/5 bg-[#050811]/60">
        
        {/* Navigation & Options Header row on mobile */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <button
            onClick={() => navigate('/ai-tutor')}
            className="p-2 sm:p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl transition-all flex items-center gap-2 group shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold hidden sm:block text-slate-300">Exit Live Class</span>
          </button>

          {/* Options: visible on mobile top-right bar and fully interactive */}
          <div className="flex items-center gap-2 md:hidden">
            <label className="flex items-center gap-1.5 cursor-pointer p-2 rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-700 transition">
              <Ear className={`w-3.5 h-3.5 ${speakSlowly ? "text-amber-400" : "text-slate-400"}`} />
              <span className="text-[11px] font-bold text-slate-300">Slow Speak</span>
              <input
                type="checkbox"
                className="hidden"
                checked={speakSlowly}
                onChange={(e) => setSpeakSlowly(e.target.checked)}
              />
            </label>

            <div className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-700 transition">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-300 outline-none cursor-pointer"
              >
                <option value="Zephyr" className="bg-[#050811]">Zephyr</option>
                <option value="Aoede" className="bg-[#050811]">Aoede</option>
                <option value="Puck" className="bg-[#050811]">Puck</option>
                <option value="Charon" className="bg-[#050811]">Charon</option>
                <option value="Fenrir" className="bg-[#050811]">Fenrir</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center/Below: Active Topic section (Gets full width on mobile so long text does not affect layout) */}
        <div className="w-full md:flex-1 md:flex md:justify-center text-center md:px-4">
          <div className="bg-slate-800/20 md:bg-transparent px-3 py-1.5 md:p-0 rounded-2xl border border-slate-800/50 md:border-none inline-block md:block mx-auto">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/70 block">
              Active Topic
            </span>
            <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 truncate mt-0.5 max-w-[280px] sm:max-w-xs md:max-w-md capitalize">
              {topicId?.replace(/-/g, ' ')}
            </h2>
          </div>
        </div>

        {/* Desktop-only options block */}
        <div className="hidden md:flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-700 transition">
            <Ear className={`w-4 h-4 ${speakSlowly ? "text-amber-400" : "text-slate-400"}`} />
            <span className="text-xs font-bold text-slate-300">Slow Speak</span>
            <input
              type="checkbox"
              className="hidden"
              checked={speakSlowly}
              onChange={(e) => setSpeakSlowly(e.target.checked)}
            />
          </label>

          <div className="relative group">
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-700 transition">
              <User className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-300 outline-none cursor-pointer appearance-none pr-2"
              >
                <option value="Zephyr" className="bg-[#050811]">Zephyr</option>
                <option value="Aoede" className="bg-[#050811]">Aoede</option>
                <option value="Puck" className="bg-[#050811]">Puck</option>
                <option value="Charon" className="bg-[#050811]">Charon</option>
                <option value="Fenrir" className="bg-[#050811]">Fenrir</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center overflow-y-auto px-4 custom-scrollbar">
        <LiveSessionInteraction
          selectedTutor="Imperial Grammar Coach"
          scenarioId={topicId || null}
          pdfStoreId={pdfId}
          speakSlowly={speakSlowly}
          selectedVoice={selectedVoice}
          onTranscript={handleTranscript}
          onSessionEnd={handleSessionEnd}
          isMinimal={true}
        />
      </div>
    </div>
  );
};
