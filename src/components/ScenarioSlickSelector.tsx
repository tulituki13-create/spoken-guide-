import React, { useState, useEffect } from "react";
import { Scenario } from "../types";
import { BookOpen, HelpCircle, Star, PlayCircle, Layers, CheckCircle2 } from "lucide-react";

interface ScenarioSlickSelectorProps {
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string | null) => void;
  isLoading: boolean;
}

export const ScenarioSlickSelector: React.FC<ScenarioSlickSelectorProps> = ({
  selectedScenarioId,
  onSelectScenario,
  isLoading,
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((res) => res.json())
      .then((data) => setScenarios(data))
      .catch((err) => console.error("Failed to load scenarios:", err));
  }, []);

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            রোলপ্লে ও পরিস্থিতি
          </h3>
          <p className="text-xs text-slate-400 font-medium">নির্দিষ্ট শব্দভান্ডার শিখতে একটি পরিস্থিতি নির্বাচন করুন।</p>
        </div>
        {selectedScenarioId && (
          <button
            onClick={() => onSelectScenario(null)}
            className="text-xxs font-mono font-bold text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 px-3.5 rounded-full cursor-pointer transition-all"
          >
            ← চ্যাটে ফিরে যান
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Grid: Scenarios Cards list */}
        <div className={`grid gap-4 ${selectedScenarioId ? "lg:col-span-6 grid-cols-1" : "lg:col-span-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
          {scenarios.map((scene) => {
            const isSelected = scene.id === selectedScenarioId;
            return (
              <div
                key={scene.id}
                onClick={() => onSelectScenario(scene.id)}
                className={`p-5 rounded-2xl glass-panel text-left flex flex-col justify-between cursor-pointer transition-all duration-300 relative border-2 ${
                  isSelected
                    ? "border-blue-500/80 bg-blue-50/20 scale-[0.98] shadow-inner"
                    : "border-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4 flex-nowrap">
                    <span className="text-3xl select-none">{scene.icon}</span>
                    <span
                      className={`text-[9px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full ${
                        scene.difficulty === "সহজ"
                          ? "bg-emerald-50 text-emerald-600"
                          : scene.difficulty === "মাঝারি"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {scene.difficulty || "মাঝারি"}
                    </span>
                  </div>
                  <h4 className="font-display font-black text-slate-800 text-sm mb-1">{scene.name}</h4>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed lines-2 mb-4">{scene.description}</p>
                </div>

                <div className="flex items-center text-xxs font-mono font-extrabold text-blue-500 mt-2">
                  <span>{isSelected ? "বর্তমানে চলছে" : "রোলপ্লে শুরু করুন"}</span>
                  <PlayCircle className="w-4 h-4 ml-1.5 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Grid: Vocabulary and Context Assistant (Opens when selected) */}
        {activeScenario && (
          <div className="lg:col-span-6 flex flex-col">
            <div className="glass-panel rounded-2xl p-5 border-white h-full flex flex-col justify-between shadow-sm animate-pulse-once">
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
                  <span className="font-mono text-xxs text-amber-600 uppercase tracking-wider font-extrabold block mb-0.5">বিস্তারিত:</span>
                  "{activeScenario.context}"
                </div>

                {/* Suggested vocabulary */}
                <span className="text-xxs font-mono font-black text-slate-400 uppercase tracking-widest block mb-2">
                  ব্যবহারিত কিছু শব্দভান্ডার:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {activeScenario.vocabulary.map((vocab, index) => {
                    const [term, explanation] = vocab.split(" (");
                    return (
                      <div key={index} className="bg-white/50 border border-slate-100 p-2.5 rounded-xl flex flex-col justify-between">
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

              <div className="mt-5 pt-3 border-t border-white/50 flex items-center justify-between text-xxs text-slate-400">
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
