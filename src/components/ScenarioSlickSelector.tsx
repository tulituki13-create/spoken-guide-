import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Scenario, VOICES } from "../types";
import { Sparkles, Activity } from "lucide-react";
import { AuthContext } from "../AuthContext";

interface ScenarioSlickSelectorProps {
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string | null) => void;
  isLoading: boolean;
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  selectedTutor: string;
  pdfStoreId: string | null;
  onTranscript: (text: string, isModel: boolean, isFinal: boolean) => void;
  onSessionEnd?: (durationSec: number) => void;
  isTimeExhausted?: boolean;
  speakSlowly: boolean;
  setSpeakSlowly: (val: boolean) => void;
  onMicStateChange?: (state: any) => void;
}

export const ScenarioSlickSelector: React.FC<ScenarioSlickSelectorProps> = ({
  selectedScenarioId,
  onSelectScenario,
  isTimeExhausted
}) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [customTopics, setCustomTopics] = useState<Scenario[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch("/api/user/personalization", {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.custom_topics && data.custom_topics.length > 0) {
          setCustomTopics(data.custom_topics);
        } else {
          setCustomTopics([]);
        }
      })
      .catch(() => setCustomTopics([]));
    }
  }, [user?.username, selectedScenarioId]);

  return (
    <div className="w-full">
      <div className="bg-[#0b1021]/80 backdrop-blur-md border border-cyan-500/20 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-sm font-black uppercase text-cyan-400 tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Dynamic AI Modules
            </h4>
            <p className="text-xs text-slate-400 mt-2 font-mono">Select a simulation to initiate voice telemetry</p>
          </div>
          <Activity className="w-8 h-8 text-cyan-500/30 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
          {[{ id: "companion", name: "Neural Free Chat", desc: "Unstructured conversational flow", icon: "🌌" }, ...customTopics].slice(0, 6).map(scene => {
            const isActive = selectedScenarioId === scene.id;
            return (
              <div
                key={scene.id}
                onClick={() => {
                  if (isTimeExhausted && !user) return;
                  navigate(`/ai-tutor-live/${encodeURIComponent(scene.id)}`);
                }}
                className={`p-5 rounded-2xl cursor-pointer text-left transition-all duration-300 relative group overflow-hidden border ${
                  isActive 
                    ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-500/30 scale-[1.02] shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                    : 'border-indigo-500/20 bg-[#11192e] hover:bg-[#1a2542] hover:border-cyan-500/40'
                }`}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start">
                  <span className="text-3xl drop-shadow-md">{scene.icon || "🧬"}</span>
                  <span className="text-[9px] font-bold px-2 py-1 rounded bg-[#0b1021] text-cyan-400 font-mono uppercase tracking-widest border border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">Launch</span>
                </div>
                <div className="mt-4">
                  <p className={`font-black text-sm tracking-wide ${isActive ? 'text-cyan-300' : 'text-slate-100'} font-display`}>
                    {scene.name}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2 font-mono">
                    {(scene as any).description || (scene as any).desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
