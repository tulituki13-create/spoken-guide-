import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { ArrowLeft, Coins, TrendingDown, Clock, Activity, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MyCreditCosts() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [costs, setCosts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingCredits, setRemainingCredits] = useState(-1);

  useEffect(() => {
    if (user && user.token) {
      Promise.all([
        fetch('/api/auth/credits/costs', {
          headers: { 'Authorization': `Bearer ${String(user.token).replace(/[^\x20-\x7E]/g, '').trim()}` }
        }).then(res => res.ok ? res.json() : Promise.resolve({})),
        fetch('/api/auth/credits/transactions', {
          headers: { 'Authorization': `Bearer ${String(user.token).replace(/[^\x20-\x7E]/g, '').trim()}` }
        }).then(res => res.ok ? res.json() : Promise.resolve({}))
      ]).then(([costsData, txData]) => {
        if (costsData && costsData.costs) {
          const mappedCosts = costsData.costs.map((c: any) => {
            if (c.activity === "Voice Chat (Live Duration)") {
              const seconds = Math.round((c.totalCost || 0) / 250);
              const durationStr = seconds >= 60 ? `${Math.floor(seconds/60)}m ${seconds%60}s` : `${seconds}s`;
              return {
                 ...c,
                 activity: "Voice Conversation",
                 usageCountDisplay: `Total Duration: ${durationStr}`
              };
            }
            return {
               ...c,
               usageCountDisplay: `${c.usageCount || 0} transactions`
            };
          });
          setCosts(mappedCosts);
          if (costsData.remainingCredits !== undefined) setRemainingCredits(costsData.remainingCredits);
        }
        if (txData && txData.transactions) {
          const grouped: any[] = [];
          const txs = txData.transactions;
          for (let i = 0; i < txs.length; i++) {
            const t = txs[i];
            if (t.activity === "Voice Chat (Live Duration)") {
               let sumAmount = Number(t.amount) || 0;
               let j = i + 1;
               while (j < txs.length && txs[j].activity === "Voice Chat (Live Duration)") {
                   const timeI = new Date(txs[j-1].createdAt).getTime();
                   const timeJ = new Date(txs[j].createdAt).getTime();
                   if (timeI - timeJ < 180000) {
                      sumAmount += Number(txs[j].amount) || 0;
                      j++;
                   } else {
                      break;
                   }
               }
               const seconds = Math.round(sumAmount / 250);
               const durationStr = seconds >= 60 ? `${Math.floor(seconds/60)}m ${seconds%60}s` : `${seconds}s`;
               grouped.push({
                 ...t,
                 activity: `Voice Conversation (${durationStr})`,
                 amount: sumAmount
               });
               i = j - 1;
            } else {
               grouped.push(t);
            }
          }
          setTransactions(grouped);
        }
      }).catch(err => console.error("Error loading credit costs:", err))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.token]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Coins className="w-12 h-12 mb-4 opacity-50 text-indigo-400" />
        <p className="font-medium text-lg text-slate-400">Please log in to view your credit spending.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-4 lg:p-8 flex flex-col gap-8 relative z-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={() => navigate('/')} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all">
          <ArrowLeft className="w-4 h-4"/> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
           <div className="bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 p-3 rounded-2xl border border-indigo-500/20">
             <Coins className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display">Credit Spending</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Track your platform usage costs</p>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8">
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 lg:p-8 text-white shadow-lg flex flex-col justify-center">
                 <p className="text-indigo-100 font-medium text-sm mb-1 uppercase tracking-wider">Current Balance</p>
                 <div className="flex items-end justify-between mt-2"><h2 className="text-4xl lg:text-5xl font-black font-display font-mono">{remainingCredits >= 0 ? remainingCredits.toLocaleString() : '...'}</h2><button onClick={() => navigate('/buy-premium')} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors drop-shadow-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button></div>
             </div>
             <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-sm flex flex-col justify-center">
                 <p className="text-slate-500 font-medium text-sm mb-1 uppercase tracking-wider">Total Lifetime Spent</p>
                 <h2 className="text-4xl lg:text-5xl font-black font-display text-slate-800 dark:text-slate-100 font-mono">{costs.reduce((s, c) => s + (Number(c.totalCost) || 0), 0).toLocaleString()}</h2>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 flex flex-col gap-6">
            <h3 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white font-display">
               <TrendingDown className="w-5 h-5 text-indigo-500" /> Spending Overview
            </h3>
            
            {costs.length === 0 ? (
              <p className="text-slate-500 italic py-8 text-center text-sm font-medium">No spending history recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {costs.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-500/20 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="bg-indigo-100 dark:bg-indigo-500/10 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 border border-transparent dark:border-indigo-500/20">
                         <Activity className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.activity}</p>
                         <p className="text-xs text-slate-500 font-medium">{c.usageCountDisplay || `${c.usageCount} transactions`}</p>
                       </div>
                     </div>
                     <span className="font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">-{c.totalCost}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 lg:p-8 flex flex-col gap-6">
            <h3 className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white font-display">
               <Clock className="w-5 h-5 text-purple-500" /> Recent Transactions
            </h3>
            
            {transactions.length === 0 ? (
              <p className="text-slate-500 italic py-8 text-center text-sm font-medium">No recent transactions.</p>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {transactions.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition-colors">
                     <div>
                       <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.activity}</p>
                       <p className="text-[11px] text-slate-400 font-mono mt-0.5">{new Date(t.createdAt).toLocaleString()}</p>
                     </div>
                     <span className="font-bold text-red-500 dark:text-red-400 text-sm tracking-tight">-{t.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        </div>
      )}
    </div>
  );
}
