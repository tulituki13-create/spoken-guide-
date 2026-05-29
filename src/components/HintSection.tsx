import React, { useEffect, useState, useRef } from "react";
import { Lightbulb, RotateCw, Volume2, ArrowRight } from "lucide-react";
import { ChatMessage, MicState } from "../types";

interface HintSectionProps {
  history: ChatMessage[];
  micState: MicState;
  onSelectHint: (hintText: string) => void;
  selectedScenarioId?: string | null;
}

export const HintSection: React.FC<HintSectionProps> = ({
  history,
  micState,
  onSelectHint,
  selectedScenarioId,
}) => {
  const [hints, setHints] = useState<string[]>([
    "Tell me a funny story!",
    "What is your favorite hobby?",
    "Can you give me a friendly riddle?",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIdleTip, setShowIdleTip] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fetch new smart hints whenever conversation history updates
  useEffect(() => {
    // Only fetch hints when history is empty (starts) or when the last message is from the tutor
    const lastMsg = history[history.length - 1];
    if (history.length === 0 || (lastMsg && lastMsg.role === "assistant")) {
      // Automatic background cue transitions utilize zero-cost processing
      fetchSmartHints(false);
    }
  }, [history.length, selectedScenarioId]);

  // Handle 10-second idle detection timer
  useEffect(() => {
    // Reset timer whenever state changes or user works
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    setShowIdleTip(false);

    // Only set idle tip warning if the app is in 'ready' state (waiting for user to react)
    if (micState === "ready") {
      idleTimerRef.current = setTimeout(() => {
        setShowIdleTip(true);
      }, 10000); // 10 seconds
    }

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [micState, history]);

  const fetchSmartHints = async (forceGemini: boolean = false) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: history.map((h) => ({ role: h.role, text: h.text })),
          scenario: selectedScenarioId,
          forceGemini,
        }),
      });
      const data = await res.json();
      if (data.hints && Array.isArray(data.hints)) {
        setHints(data.hints);
      }
    } catch (e) {
      console.error("Error fetching smart hints:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 10 Seconds Idle Visual Tip Banner (with brand new floating animation from style guide) */}
      {showIdleTip && (
        <div className="bg-yellow-100/90 backdrop-blur-md rounded-2xl p-4 border border-yellow-200 shadow-md floating-hint transition-all flex items-start gap-3">
          <div className="p-2 bg-yellow-500 rounded-lg text-white font-extrabold select-none">
            💡
          </div>
          <div className="flex-grow">
            <span className="font-display font-extrabold text-sm text-yellow-800 block">
              Suggested reply:
            </span>
            <p className="text-xs text-yellow-900 mt-1 font-semibold leading-relaxed">
              "How about trying: <span className="italic font-bold font-mono">'{hints[0] || "Tell me a riddle!"}'</span>?"
            </p>
            <button
              onClick={() => onSelectHint(hints[0] || "Tell me a riddle!")}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-yellow-800 hover:text-yellow-950 font-bold transition group cursor-pointer"
            >
              Practice saying this <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      )}

      {/* Suggestion Card Row with glass-panel style */}
      <div className="glass-panel rounded-2xl p-5 border-white">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 text-blue-600">
            <Lightbulb className="w-4 h-4 text-yellow-500 animate-pulse" />
            <h4 className="font-display font-extrabold text-sm text-slate-800">
              Conversation Cues & Prompts
            </h4>
          </div>
          <button
            onClick={() => fetchSmartHints(true)}
            disabled={isLoading}
            className="p-1 px-3 rounded-full text-xxs font-mono font-bold text-blue-600 hover:bg-blue-100/50 border border-blue-200/40 disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Force refresh high-fidelity suggestions via Gemini AI"
          >
            <RotateCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            REFRESH CUES
          </button>
        </div>

        <p className="text-xs font-medium text-slate-500 mb-4 leading-relaxed">
          Not sure what to say with Buddy next? Say one of the options below out loud, or click it to automatically send:
        </p>

        <div className="flex flex-col gap-2.5">
          {hints.map((hint, idx) => (
            <button
              key={idx}
              onClick={() => onSelectHint(hint)}
              disabled={micState === "thinking" || micState === "listening"}
              className="flex items-center justify-between text-left p-3 rounded-xl bg-white/70 hover:bg-white border border-slate-200/50 hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50 shadow-xs hover:shadow-sm"
            >
              <span>"{hint}"</span>
              <span className="text-xxs px-2.5 py-1 bg-blue-50/80 rounded-full text-blue-600 font-bold font-mono group-hover:bg-blue-100 shrink-0">
                SAY THIS CUE
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
