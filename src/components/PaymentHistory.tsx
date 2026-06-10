import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { Copy, RefreshCcw, ShoppingBag, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PaymentHistory: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else {
      fetchMyRequests();
    }
  }, [user, navigate]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/payments/my-requests', {
        headers: { 'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}` }
      });
      if (res.ok) setMyRequests(await res.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full px-2">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">My Purchases</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">View pending and active premium plans</p>
            </div>
          </div>
          <button 
            onClick={fetchMyRequests} 
            className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-xl transition-colors"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map((req) => (
              <div key={req.id} className="flex flex-col md:flex-row items-center justify-between p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 shadow-sm gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40'}`}>
                    {req.status === 'approved' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{req.plan} Subscription</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">TrxID: </span>
                      <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-medium tracking-wide">
                        {req.transactionId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 border-t border-slate-100 dark:border-slate-700/50 md:border-t-0 pt-3 md:pt-0">
                  <div className="flex flex-col text-left md:text-right">
                    {req.amount > 0 && <span className="text-base font-black text-slate-700 dark:text-slate-200">৳{req.amount}</span>}
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/50' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200/50'}`}>
                    {req.status === 'approved' ? 'Active' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            ))}
            
            {myRequests.length === 0 && (
              <div className="text-center flex flex-col items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <ShoppingBag className="w-12 h-12 text-slate-300 mb-4 opacity-50" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">No purchases yet</h3>
                <p className="text-sm text-slate-500">When you buy a premium plan, the status will appear here.</p>
                <button onClick={() => navigate('/buy-premium')} className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-transform active:scale-95">Browse Plans</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
