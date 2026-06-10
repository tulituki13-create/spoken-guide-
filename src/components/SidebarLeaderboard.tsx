import React, { useState, useEffect } from "react";
import { Trophy, Award, Star, Loader2 } from "lucide-react";

export function SidebarLeaderboard() {
  const [activeTab, setActiveTab] = useState<'spoken' | 'grammar'>('spoken');
  const [spokenLeaders, setSpokenLeaders] = useState<any[]>([]);
  const [grammarLeaders, setGrammarLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      const FALLBACK_SPOKEN = [
        { username: "Sajid_Rahman", performanceScore: 94, isPremium: true },
        { username: "Sadia_Islam", performanceScore: 89, isPremium: false },
        { username: "Dibya_Roy", performanceScore: 86, isPremium: true },
        { username: "Nusrat_Jahan", performanceScore: 82, isPremium: false },
        { username: "Tanvir_Hasan", performanceScore: 78, isPremium: false }
      ];

      const FALLBACK_GRAMMAR = [
        { username: "Sadia_Islam", totalGrammarScore: 480, isPremium: false },
        { username: "Sajid_Rahman", totalGrammarScore: 420, isPremium: true },
        { username: "Nusrat_Jahan", totalGrammarScore: 390, isPremium: false },
        { username: "Dibya_Roy", totalGrammarScore: 350, isPremium: true },
        { username: "Imran_Khan", totalGrammarScore: 310, isPremium: false }
      ];

      try {
        setIsLoading(true);
        const headers: HeadersInit = {};
        const token = localStorage.getItem('auth_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [spokenRes, grammarRes] = await Promise.all([
          fetch('/api/social/leaderboard/spoken', { headers }).catch(() => null),
          fetch('/api/social/leaderboard/grammar', { headers }).catch(() => null)
        ]);
        
        let sList = null;
        let gList = null;

        if (spokenRes && spokenRes.ok) {
          const data = await spokenRes.json().catch(() => null);
          if (data && data.leaders && data.leaders.length > 0) {
            sList = data.leaders;
          }
        }

        if (grammarRes && grammarRes.ok) {
          const data = await grammarRes.json().catch(() => null);
          if (data && data.leaders && data.leaders.length > 0) {
            gList = data.leaders;
          }
        }

        setSpokenLeaders(sList || FALLBACK_SPOKEN);
        setGrammarLeaders(gList || FALLBACK_GRAMMAR);
      } catch (e) {
        console.warn("Failed to load live sidebar leaders, using offline stats:", e);
        setSpokenLeaders(FALLBACK_SPOKEN);
        setGrammarLeaders(FALLBACK_GRAMMAR);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  return (
    <div className="w-full bg-white dark:bg-[#1f2937] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-sm p-4 flex flex-col gap-3 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
        <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-extrabold text-xs font-display text-slate-900 dark:text-white uppercase tracking-wider">
            Top Leaders Board
          </h4>
          <p className="text-[9px] text-slate-500 dark:text-slate-400">Oral Speech & Grammar pros leaderboard</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/85 rounded-xl">
        <button
          onClick={() => setActiveTab('spoken')}
          className={`py-1.5 px-2 text-[10px] font-black rounded-lg transition-all ${
            activeTab === 'spoken'
              ? 'bg-white text-blue-700 shadow-xs dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          🎙️ Spoken Practice
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={`py-1.5 px-2 text-[10px] font-black rounded-lg transition-all ${
            activeTab === 'grammar'
              ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          📝 Grammar Pro
        </button>
      </div>

      {/* Content Scroller */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Syncing leader records...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-0.5">
          {activeTab === 'spoken' ? (
            <>
              {spokenLeaders.slice(0, 5).map((p, idx) => (
                <div key={p.username} className="flex items-center justify-between p-2 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`w-4 h-4 shrink-0 inline-flex items-center justify-center text-[10px] font-black rounded ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}>
                      {idx+1}
                    </span>
                    <img src={`https://ui-avatars.com/api/?name=${p.username}&background=random`} className="w-6 h-6 rounded-full shrink-0" alt="" />
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate pr-1">
                      {p.username}
                      {p.isPremium && <span className="ml-1 text-[10px]" title="Premium">👑</span>}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                    {p.performanceScore} Rating
                  </span>
                </div>
              ))}
              {spokenLeaders.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4">No active oral speak scores found.</p>
              )}
            </>
          ) : (
            <>
              {grammarLeaders.slice(0, 5).map((p, idx) => (
                <div key={p.username} className="flex items-center justify-between p-2 bg-slate-50/80 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`w-4 h-4 shrink-0 inline-flex items-center justify-center text-[10px] font-black rounded ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}>
                      {idx+1}
                    </span>
                    <img src={`https://ui-avatars.com/api/?name=${p.username}&background=random`} className="w-6 h-6 rounded-full shrink-0" alt="" />
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate pr-1">
                      {p.username}
                      {p.isPremium && <span className="ml-1 text-[10px]" title="Premium">👑</span>}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                    Σ {p.totalGrammarScore} Pts
                  </span>
                </div>
              ))}
              {grammarLeaders.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-4">No evaluation points loaded yet.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
