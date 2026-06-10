import React, { useEffect, useState } from "react";
import { Lock, Sparkles, TrendingUp, Clock, Star, Users, CheckCircle2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LimitExhaustedViewProps {
  user: any;
  onLogin: () => void;
}

interface Performer {
  username: string;
  performanceScore: number;
  chatTimeUsed: number;
}

export const LimitExhaustedView: React.FC<LimitExhaustedViewProps> = ({ user, onLogin }) => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/premium/performers')
      .then(res => res.json())
      .then(data => {
        if (data && data.performers) {
          setPerformers(data.performers.slice(0, 5));
        }
      })
      .catch(err => console.error("Could not fetch top performers", err));
  }, []);

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
  };

  return (
    <div className="w-full flex justify-center py-10 px-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 flex flex-col items-center justify-center text-center border-b border-slate-200 dark:border-slate-800">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4 shadow-sm">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400">
            {user ? "Today's Limit Exceeded" : "Free Trial Limit Reached"}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto text-lg mb-6">
            {user ? "Your daily practice limit for today is over. Please wait until tomorrow, or grab a premium plan for unlimited access to climb the leaderboard." : "Your free trial session is complete. Sign in to get 5 minutes free every day, or upgrade to a premium plan!"}
          </p>

          {!user && (
            <button
              onClick={onLogin}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              Sign In to Continue
            </button>
          )}
        </div>

        {/* Ticker Section */}
        {performers.length > 0 && (
          <div className="bg-amber-100/50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-900/40 relative overflow-hidden flex items-center py-3">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10"></div>
            
            <div className="flex animate-ticker whitespace-nowrap gap-12 text-sm font-semibold text-amber-800 dark:text-amber-500 min-w-max">
              {performers.map((p, idx) => (
                <span key={idx} className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {p.username} achieved {p.performanceScore} pts!
                </span>
              ))}
              {performers.map((p, idx) => (
                <span key={`clone-${idx}`} className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {p.username} achieved {p.performanceScore} pts!
                </span>
              ))}
              {performers.map((p, idx) => (
                <span key={`clone2-${idx}`} className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {p.username} achieved {p.performanceScore} pts!
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Top Leaders Section */}
        {performers.length > 0 && (
          <div className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Top Performers Right Now</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performers.slice(0, 3).map((p, idx) => (
                <div 
                  key={idx} 
                  onClick={() => navigate('/social', { state: { profileMode: p.username } })}
                  className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl mb-3 shadow-inner border border-blue-200 dark:border-blue-800/50">
                    {idx + 1}
                  </div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 hover:underline">{p.username}</h4>
                  <div className="flex gap-4 mt-2 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {p.performanceScore} pts</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTime(p.chatTimeUsed)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Plans Section */}
        <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Upgrade to Premium</h3>
            <p className="text-slate-500">Unleash your full potential without any boundaries</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Standard Plan */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors shadow-sm relative">
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Pass Card</h4>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-500 mb-4">৳50<span className="text-sm font-medium text-slate-400"> / 100 mins</span></p>
              <ul className="space-y-3 mb-6">
                {[
                  "100 minutes of practice",
                  "Access to standard scenarios",
                  "Performance tracking"
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-lg transition-colors">
                Buy Minutes
              </button>
            </div>
            
            {/* Premium Lifetime */}
            <div className="bg-gradient-to-b from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl shadow-blue-500/20 relative overflow-hidden border border-blue-500 text-white transform hover:scale-[1.02] transition-transform">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Most Popular</div>
              <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Lifetime VIP</h4>
              <p className="text-4xl font-extrabold mb-4 flex items-baseline">৳500<span className="text-sm font-medium text-blue-200 ml-1"> / one-time</span></p>
              <ul className="space-y-3 mb-6">
                {[
                  "Unlimited speaking time",
                  "Exclusive scenarios & tutors",
                  "Full leaderboard access",
                  "Priority server resources"
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-extrabold rounded-lg transition-colors shadow-lg shadow-yellow-400/20">
                Unlock Lifetime
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
