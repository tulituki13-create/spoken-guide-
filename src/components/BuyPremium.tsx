import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../AuthContext";
import { Copy, Check, CreditCard, UploadCloud, RefreshCcw, Camera, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const BuyPremium: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>("Premium");
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [profitMargin, setProfitMargin] = useState(20);
  const fetchSettings = async () => { try { const res = await fetch('/api/auth/settings'); if (res.ok) { const data = await res.json(); setProfitMargin(Number(data.profitMargin)||20); } } catch(e) {} };
  useEffect(() => { fetchSettings(); }, []);
  const [isAiFilled, setIsAiFilled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dbPaymentMethods, setDbPaymentMethods] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plans, setPlans] = useState<any[]>([
    { id: 'premium', name: 'Premium Plan', price: 500, timeLimitSeconds: 3600, pdfUploadAllowed: 1, whatsappAllowed: 1, scenarioPdfAllowed: 1, customFeatures: '["60 minutes speaking time limit", "Direct PDF Handout Uploads", "Private WhatsApp Group Access", "Full tutor feedback loop"]' }
  ]);

  useEffect(() => {
    if (user) {
      fetchMyRequests();
    }
    fetchPlans();
    fetchDbPaymentMethods();
  }, [user]);

  const fetchDbPaymentMethods = async () => {
    try {
      const res = await fetch('/api/auth/payment-methods');
      if (res.ok) setDbPaymentMethods(await res.json());
    } catch (e) {}
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/auth/plans');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      }
    } catch (e) {}
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch('/api/auth/payments/my-requests', {
        headers: { 'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}` }
      });
      if (res.ok) setMyRequests(await res.json());
    } catch (e) {}
  };

  const handleCopyId = (id: string, num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      setStatus({ type: 'error', msg: 'Please login first.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      setScreenshotUrl(base64Str);
      setLoading(true);
      setStatus({ type: 'info', msg: 'Analyzing screenshot via AI...' });
      
      try {
        const res = await fetch('/api/auth/payments/scan', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Str })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.transactionId) {
            setTransactionId(data.transactionId);
            setIsAiFilled(true);
          }
          if (data.amount) setAmount(data.amount);
          setStatus({ type: 'success', msg: 'AI correctly detected the details! Please verify and submit.' });
        } else {
          setStatus({ type: 'error', msg: 'AI could not read the image. Please enter manually.' });
        }
      } catch(e) {
        setStatus({ type: 'error', msg: 'Failed to scan image.' });
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setStatus({ type: 'error', msg: 'Please login first.' });
      return;
    }
    if (selectedPlan === 'Custom' && Number(amount) <= 0) {
      setStatus({ type: 'error', msg: 'Please enter a valid Custom Amount in Taka.' });
      return;
    }
    if (!transactionId.trim()) {
      setStatus({ type: 'error', msg: 'Transaction ID is required.' });
      return;
    }
    
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/auth/payments/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: selectedPlan, transactionId, amount: Number(amount), screenshotUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setTransactionId("");
        setAmount("");
        setScreenshotUrl("");
        setIsAiFilled(false);
        navigate('/my-purchases');
      } else {
        setStatus({ type: 'error', msg: data.error || data.message || 'Error submitting payment.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: 'Something went wrong.' });
    }
    setLoading(false);
  };

  const tokensPerTaka = Math.floor(1000000 / ((2.0 * 120) * (1 + profitMargin / 100)));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full px-2">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 font-display">Upgrade to Premium</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Unlock endless AI conversations and advanced performance metrics!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="flex flex-col gap-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
              <h3 className="font-bold text-base mb-3 text-slate-800 dark:text-slate-100">1. Select Plan</h3>
              <div className="flex flex-col gap-3">
                {plans.filter(p => p.id !== 'free').map((p) => {
                  let featureArr = [];
                  try { featureArr = p.customFeatures ? (typeof p.customFeatures === 'string' ? JSON.parse(p.customFeatures) : p.customFeatures) : []; } catch (e) { featureArr = []; }
                  if (!Array.isArray(featureArr)) featureArr = [];

                  const isSelected = selectedPlan === 'Premium' || selectedPlan === p.name || selectedPlan === p.id;
                  return (
                    <div key={p.id} className={`flex flex-col gap-2 p-3 border rounded-xl transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-700/60'}`}>
                      <label className={`flex items-center justify-between ${isAiFilled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="plan" disabled={isAiFilled} value={p.id === 'premium' ? 'Premium' : p.name} checked={isSelected} onChange={() => {
                            setSelectedPlan(p.id === 'premium' ? 'Premium' : p.name);
                            setAmount(p.price);
                            setCustomAmount("");
                          }} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-indigo-200">{p.name}</p>
                            <p className="text-xs text-slate-500 dark:text-indigo-400/80">
                              Time limit: {p.timeLimitSeconds / 60} mins
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-base text-indigo-700 dark:text-indigo-300">৳{p.price}</span>
                      </label>
                      {featureArr.length > 0 && (
                        <div className="pl-7 mt-1 space-y-1 border-t border-indigo-100/30 pt-1.5">
                          {featureArr.map((feat: string, featIdx: number) => (
                            <div key={featIdx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 tracking-tight">
                              <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* --- SEPARATOR OR DYNAMIC PACKAGE --- */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-3">
                  <div className={`flex flex-col gap-2 p-3 border rounded-xl transition-all ${selectedPlan === 'Custom' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700/60'}`}>
                    <label className="flex items-center justify-between cursor-pointer mb-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="plan" 
                          checked={selectedPlan === 'Custom'} 
                          onChange={() => {
                            setSelectedPlan('Custom');
                            setAmount(customAmount || 0);
                          }} 
                          className="w-4 h-4 text-amber-500 focus:ring-amber-500" 
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-amber-200">৳ Custom Credit Plan</p>
                          <p className="text-xs text-slate-500 dark:text-amber-400/80">Specify custom credits & minutes</p>
                        </div>
                      </div>
                      <span className="font-bold text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-md uppercase tracking-wider">Flexi-Charge</span>
                    </label>

                    <div className="space-y-3 pl-7">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 dark:text-slate-500">৳</span>
                        <input 
                          type="number"
                          placeholder="Enter amount (e.g. 150)"
                          value={customAmount}
                          onChange={(e) => {
                            const v = e.target.value === "" ? "" : Math.max(1, Number(e.target.value));
                            setCustomAmount(v);
                            setAmount(v);
                            setSelectedPlan('Custom');
                          }}
                          className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 font-mono text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-colors"
                        />
                      </div>

                      <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl text-slate-700 dark:text-slate-300 text-xs flex flex-col gap-2 border border-slate-200/50 dark:border-amber-500/10">
                        <div className="flex justify-between items-center text-[11.5px]">
                          <span className="font-medium text-slate-600 dark:text-slate-400">Coins Granted:</span>
                          <strong className="text-amber-600 dark:text-amber-400 font-mono font-black">🪙 {customAmount ? ((Number(customAmount) || 0) * tokensPerTaka).toLocaleString() : 0}</strong>
                        </div>
                        <div className="flex justify-between items-center text-[11.5px]">
                          <span className="font-medium text-slate-600 dark:text-slate-400">Est. Speaking Time:</span> 
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black">⌛ {customAmount ? Math.floor(((Number(customAmount) || 0) * tokensPerTaka) / 15000) : 0} mins</strong>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700/50 my-1 pt-2 text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed font-medium">
                          💡 1 Taka = ~{tokensPerTaka.toLocaleString()} Coins.<br/>
                          One minute of AI audio consumes ~15,000 coins. Tens of thousands of coins in your balance is normal.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
              <h3 className="font-bold text-base mb-2 text-slate-800 dark:text-slate-100">2. Send Payment</h3>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 mb-3">Copy a number below and send the exact amount.</p>
              
              <div className="space-y-2.5">
                {dbPaymentMethods.length === 0 ? (
                  <p className="text-xs text-slate-500">No payment methods listed.</p>
                ) : (
                  dbPaymentMethods.map((pm) => (
                    <div key={pm.id} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 justify-between">
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{pm.name}</span>
                          <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded font-medium">{pm.type}</span>
                        </div>
                        <p className="font-mono font-bold text-sm tracking-wider text-slate-800 dark:text-white mt-0.5 truncate">{pm.number}</p>
                      </div>
                      <button 
                        onClick={() => handleCopyId(pm.id, pm.number)}
                        className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-colors shrink-0 border border-indigo-100/50 dark:border-indigo-800/30"
                      >
                        {copiedId === pm.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === pm.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 flex flex-col justify-center">
            <h3 className="font-bold text-base mb-3 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              3. Submit Transaction
            </h3>
            
            <div className="flex gap-3 mb-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || !user}
                className="flex items-center gap-2 flex-1 justify-center bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 disabled:opacity-50 text-indigo-700 dark:text-indigo-300 font-bold py-2.5 px-3 rounded-xl transition-colors shrink-0 text-xs shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                Upload Screenshot (Auto Fill)
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction ID (TrxID) *</label>
                  <input 
                    type="text" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 9JA2XXXXXX"
                    required
                    readOnly={isAiFilled}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm outline-none text-slate-800 dark:text-white ${isAiFilled ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount Sent (৳)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="e.g. 500"
                    readOnly={isAiFilled}
                    className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm outline-none text-slate-800 dark:text-white ${isAiFilled ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {status && (
                <div className={`p-3 rounded-xl text-xs font-medium leading-relaxed ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : status.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {status.msg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !user}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 mt-2 rounded-xl transition-colors text-sm shadow-md"
              >
                {loading ? 'Processing...' : 'Submit Payment Details'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
