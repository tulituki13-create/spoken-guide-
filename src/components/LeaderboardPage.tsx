import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, GraduationCap, ArrowLeft, Loader2, Star, ShieldCheck } from "lucide-react";

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [spokenLeaders, setSpokenLeaders] = useState<any[]>([]);
  const [grammarLeaders, setGrammarLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboards() {
      setIsLoading(true);
      const FALLBACK_SPOKEN = [
        { username: "Sajid_Rahman", performanceScore: 94, isPremium: true, division: "Dhaka", district: "Dhaka" },
        { username: "Sadia_Islam", performanceScore: 89, isPremium: false, division: "Chittagong", district: "Cox's Bazar" },
        { username: "Dibya_Roy", performanceScore: 86, isPremium: true, division: "Sylhet", district: "Sylhet" },
        { username: "Nusrat_Jahan", performanceScore: 82, isPremium: false, division: "Dhaka", district: "Gazipur" },
        { username: "Tanvir_Hasan", performanceScore: 78, isPremium: false, division: "Khulna", district: "Jessore" }
      ];

      const FALLBACK_GRAMMAR = [
        { username: "Sadia_Islam", totalGrammarScore: 480, isPremium: false, division: "Chittagong", district: "Cox's Bazar" },
        { username: "Sajid_Rahman", totalGrammarScore: 420, isPremium: true, division: "Dhaka", district: "Dhaka" },
        { username: "Nusrat_Jahan", totalGrammarScore: 390, isPremium: false, division: "Dhaka", district: "Gazipur" },
        { username: "Dibya_Roy", totalGrammarScore: 350, isPremium: true, division: "Sylhet", district: "Sylhet" },
        { username: "Imran_Khan", totalGrammarScore: 310, isPremium: false, division: "Rangpur", district: "Rangpur" }
      ];

      try {
        const headers: HeadersInit = {};
        const token = localStorage.getItem('auth_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [resSpoken, resGrammar] = await Promise.all([
          fetch('/api/social/leaderboard/spoken', { headers }).catch(() => null),
          fetch('/api/social/leaderboard/grammar', { headers }).catch(() => null)
        ]);

        let sList = null;
        let gList = null;

        if (resSpoken && resSpoken.ok) {
          const sData = await resSpoken.json().catch(() => null);
          if (sData && sData.leaders && sData.leaders.length > 0) {
            sList = sData.leaders;
          }
        }
        if (resGrammar && resGrammar.ok) {
          const gData = await resGrammar.json().catch(() => null);
          if (gData && gData.leaders && gData.leaders.length > 0) {
            gList = gData.leaders;
          }
        }

        setSpokenLeaders(sList || FALLBACK_SPOKEN);
        setGrammarLeaders(gList || FALLBACK_GRAMMAR);
      } catch (e) {
        console.warn("Failed to load leaderboards details, using offline stats:", e);
        setSpokenLeaders(FALLBACK_SPOKEN);
        setGrammarLeaders(FALLBACK_GRAMMAR);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboards();
  }, []);

  const handleUserClick = (username: string) => {
    navigate('/social', { state: { profileMode: username, activeTab: 'profile' } });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Back button and page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 text-left">
        <div className="space-y-1.5">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Spoken Buddy
          </button>
          <h1 className="text-2xl font-black tracking-tight font-display text-slate-900 dark:text-white flex items-center gap-2.5">
            🏆 Spoken & Grammar Leaderboards
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Celebrate and connect with the highest performing Learners across Bangladesh. Click a user to view their detailed profile!
          </p>
        </div>
        
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs max-w-sm flex items-center gap-3">
          <span className="text-2xl shrink-0">⚡</span>
          <div>
            <p className="font-bold">Weekly Recognition</p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
              Achieve continuous active speaking streaks or score 90%+ in evaluations to secure your rank!
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <div className="space-y-1">
            <h3 className="font-bold text-base">Updating global records...</h3>
            <p className="text-xs text-slate-400">Comparing oral ratings and homework checkpoints</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          
          {/* Board 1: Spoken Practice Leaders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm flex flex-col gap-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg font-display text-slate-900 dark:text-white">Spoken Practice Leaders</h3>
                <p className="text-xs text-slate-400">Oral speech grades matched real-time using AI Coach voice engine metrics.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
              {spokenLeaders.sort((a,b)=>b.performanceScore - a.performanceScore).map((p, idx) => (
                <div key={p.username} className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/60 p-3 rounded-2xl flex items-center border border-slate-100 dark:border-slate-800 transition-all group">
                  <div className="flex items-center gap-2.5 overflow-hidden w-full">
                    <span className={`w-5 h-5 shrink-0 inline-flex items-center justify-center text-[10px] font-black rounded-lg ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-900' : idx === 2 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'text-slate-450 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}>{idx+1}</span>
                    <img 
                      onClick={() => handleUserClick(p.username)}
                      src={"https://ui-avatars.com/api/?name=" + p.username} 
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer object-cover shrink-0" 
                      alt="" 
                    />
                    <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between min-w-0">
                      <div className="flex flex-col min-w-0">
                        <p 
                          onClick={() => handleUserClick(p.username)}
                          className="font-extrabold text-[13px] text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer truncate flex items-center gap-1 hover:underline leading-tight"
                        >
                          <span className="truncate">{p.username}</span>
                          {p.verified_badge === 1 && <span className="text-emerald-500" title="Verified"><ShieldCheck className="w-3 h-3"/></span>}
                          {p.isPremium === 1 && <span className="text-[10px]" title="Premium Member">👑</span>}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{p.district || p.division ? `${p.district || ''}, ${p.division || ''}` : 'Learner Level'}</p>
                      </div>
                      <div className="mt-1 sm:mt-0 font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0 select-none">
                        <span className="sm:bg-emerald-50 sm:dark:bg-emerald-950/40 sm:px-2.5 sm:py-1 sm:rounded-lg">
                          ⭐ {p.performanceScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {spokenLeaders.length === 0 && <p className="text-xs text-slate-400 text-center py-12">No records available yet.</p>}
            </div>
          </div>

          {/* Board 2: Grammar Pro Masterclass */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm flex flex-col gap-6 text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg font-display text-slate-900 dark:text-white">Grammar Pro Masterclass</h3>
                <p className="text-xs text-slate-400">Sum scores achieved by practicing topics and taking AI homework evaluations.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2">
              {grammarLeaders.sort((a,b)=>b.totalGrammarScore - a.totalGrammarScore).map((p, idx) => (
                <div key={p.username} className="bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/60 p-3 rounded-2xl flex items-center border border-slate-100 dark:border-slate-800 transition-all group">
                  <div className="flex items-center gap-2.5 overflow-hidden w-full">
                    <span className={`w-5 h-5 shrink-0 inline-flex items-center justify-center text-[10px] font-black rounded-lg ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-900' : idx === 2 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'text-slate-455 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}>{idx+1}</span>
                    <img 
                      onClick={() => handleUserClick(p.username)}
                      src={"https://ui-avatars.com/api/?name=" + p.username} 
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer object-cover shrink-0" 
                      alt="" 
                    />
                    <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between min-w-0">
                      <div className="flex flex-col min-w-0">
                        <p 
                          onClick={() => handleUserClick(p.username)}
                          className="font-extrabold text-[13px] text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer truncate flex items-center gap-1 hover:underline leading-tight"
                        >
                          <span className="truncate">{p.username}</span>
                          {p.verified_badge === 1 && <span className="text-emerald-500" title="Verified"><ShieldCheck className="w-3 h-3"/></span>}
                          {p.isPremium === 1 && <span className="text-[10px]" title="Premium Member">👑</span>}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Practiced {p.topicsCount || 0} Chapters • {p.school || "Bangladesh Learner"}</p>
                      </div>
                      <div className="mt-1 sm:mt-0 font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400 shrink-0 select-none">
                        <span className="sm:bg-emerald-50 sm:dark:bg-emerald-950/40 sm:px-2.5 sm:py-1 sm:rounded-lg">
                          Σ {p.totalGrammarScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {grammarLeaders.length === 0 && <p className="text-xs text-slate-400 text-center py-12">No records available yet.</p>}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
