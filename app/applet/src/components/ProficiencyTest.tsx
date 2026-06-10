import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Loader2, AlertTriangle, Mic } from 'lucide-react';
import { LiveSessionInteraction } from './LiveSessionInteraction';
import { AuthContext } from '../AuthContext';
import { AuthModal } from './AuthModal';

export const ProficiencyTest = () => {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isTimeExhausted = user ? (user.timeLeft === 0 || (user.credits !== undefined && user.credits <= 0)) : false;

  const handleTranscript = (text: string, isModel: boolean, final: boolean) => {
    if (final && text.trim()) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === (isModel ? 'ai' : 'user') && lastMsg.text === text) {
           return prev; // Prevents duplicates if any
        }
        return [...prev, { role: isModel ? 'ai' : 'user', text }];
      });
    }
  };

  const handleSessionEnd = async () => {
    // Generate roadmap
    setIsAnalyzing(true);
    setIsTestStarted(false);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("/api/proficiency-eval", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ history: messages })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      navigate('/learning-plan', { state: { plan: data } });
    } catch (err: any) {
      console.error(err);
      setErrorStatus("Failed to analyze. " + err.message);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans relative">
      <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-40 shrink-0">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-bold text-sm transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4"/> ফিরে যান
          </button>
          <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" /> ভয়েস দক্ষতা যাচাই
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6 overflow-y-auto flex flex-col gap-6">
        {!isTestStarted && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
             <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
              <Mic className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4 dark:text-white">ভয়েস ইংরেজি অ্যাসেসমেন্ট</h2>
            {!user ? (
               <>
                 <p className="text-slate-500 mb-8 font-medium">ভয়েস অ্যাসেসমেন্ট করতে এবং আপনার ব্যক্তিগতকৃত ইংরেজি কোর্স রুটিন তৈরি করতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন বা একটি নতুন অ্যাকাউন্ট তৈরি করুন।</p>
                 <button 
                   onClick={() => setShowAuthModal(true)}
                   className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                 >
                   লগইন করুন
                 </button>
               </>
            ) : isTimeExhausted ? (
               <>
                 <p className="text-amber-600 mb-8 font-medium">আপনার অ্যাকাউন্টে পর্যাপ্ত ক্রেডিট নেই। ভয়েস অ্যাসেসমেন্ট সম্পন্ন করতে দয়া করে আপনার ব্যালেন্স রিচার্জ করুন।</p>
                 <button 
                   onClick={() => navigate('/buy-premium')}
                   className="px-8 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-lg shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                 >
                   ক্রেডিট রিচার্জ করুন
                 </button>
               </>
            ) : (
               <>
                  <p className="text-slate-500 mb-8 font-medium">আমাদের এআই-এর সাথে 3-4 মিনিটের একটি ছোট লাইভ কনভারসেশন করুন। স্বাভাবিকভাবে কথা বলুন, যাতে এটি আপনার কথা বলার ধরণ বুঝতে পারে, এবং আমরা আপনার জন্য একটি ব্যক্তিগতকৃত ইংরেজি কোর্স রুটিন তৈরি করব।</p>
                  <button 
                    onClick={() => setIsTestStarted(true)}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    ভয়েস টেস্ট শুরু করুন
                  </button>
               </>
            )}
          </div>
        )}
        
        {isTestStarted && (
          <div className="flex-1 flex flex-col">
            <div className="shrink-0 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 mb-6">
              <LiveSessionInteraction
                selectedTutor="Assessor"
                scenarioId="proficiency-eval"
                selectedVoice="Aoede"
                speakSlowly={false}
                onTranscript={handleTranscript}
                onSessionEnd={() => {}}
                isMinimal={false}
              />
              <div className="mt-8 flex justify-center text-center flex-col items-center gap-3">
                <p className="text-xs text-slate-500 max-w-md font-medium">"Start Conversation"-এ ক্লিক করে শুরু করুন। কয়েক মিনিট কথা বলার পর, নিচের "টেস্ট শেষ করুন" বোতামে ক্লিক করুন।</p>
                <button onClick={handleSessionEnd} className="px-6 py-2 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors">
                  টেস্ট শেষ করুন এবং রুটিন তৈরি করুন
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
               {messages.length > 0 && (
                 <div className="text-xs uppercase font-bold text-slate-400 mb-4 text-center tracking-widest">
                   লাইভ ট্রান্সক্রিপ্ট
                 </div>
               )}
               {messages.map((msg, idx) => (
                 <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`p-4 rounded-2xl shadow-sm max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-sm'}`}>
                     {msg.text}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {isAnalyzing && (
           <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-full mb-6">
               <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
             </div>
             <h2 className="text-2xl font-black dark:text-white mb-2">আপনার দক্ষতা বিশ্লেষণ করা হচ্ছে...</h2>
             <p className="text-slate-500 font-medium max-w-sm">আপনার কথা বলার ধরণ, গ্রামার এবং ভোকাবুলারি বিশ্লেষণ করে একটি কাস্টম রুটিন তৈরি করা হচ্ছে।</p>
           </div>
        )}

        {errorStatus && (
           <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/50">
             <AlertTriangle className="w-5 h-5" /> {errorStatus}
           </div>
        )}
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={login} />}
    </div>
  );
}
