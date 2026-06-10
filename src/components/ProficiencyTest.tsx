import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Loader2, AlertTriangle, Mic, Square } from 'lucide-react';
import { LiveSessionInteraction, LiveSessionRef } from './LiveSessionInteraction';
import { AuthContext } from '../AuthContext';
import { AuthModal } from './AuthModal';

export const ProficiencyTest = () => {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const messagesRef = useRef<{role: 'ai' | 'user', text: string}[]>([]);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const isTimeExhausted = user ? (user.timeLeft === 0 || (user.credits !== undefined && user.credits <= 0)) : false;

  const liveSessionRef = useRef<LiveSessionRef>(null);

  const handleTranscript = (text: string, isModel: boolean, final: boolean) => {
    if (final && text.trim()) {
      const isDuplicate = messagesRef.current.length > 0 && 
                          messagesRef.current[messagesRef.current.length - 1].role === (isModel ? 'ai' : 'user') && 
                          messagesRef.current[messagesRef.current.length - 1].text === text;
      if (!isDuplicate) {
        messagesRef.current = [...messagesRef.current, { role: isModel ? 'ai' : 'user', text }];
      }
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch("/api/proficiency-eval", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ history: messagesRef.current })
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

  const handleStartTest = async () => {
    setIsTestStarted(true);
    // Give state a moment to render the LiveSessionInteraction component
    setTimeout(() => {
      if (liveSessionRef.current) {
        liveSessionRef.current.startSession();
      }
    }, 100);
  };

  const handleStopTest = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stopSession();
    }
    handleSessionEnd();
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-[#0a0f24] font-sans relative overflow-hidden text-slate-900 dark:text-white">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full bg-[#0a0f24]/80 backdrop-blur-2xl border-b border-white/5 p-4 sticky top-0 z-40 shrink-0">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-indigo-100 hover:bg-white/10 font-bold text-sm transition-all shadow-sm border border-white/10">
            <ArrowLeft className="w-4 h-4"/> ফিরে যান
          </button>
          <div className="flex items-center gap-2 font-black tracking-tight text-indigo-400">
            <Sparkles className="w-5 h-5 text-amber-400" /> ভয়েস দক্ষতা যাচাই
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 flex flex-col items-center justify-center relative z-10">
        
        {/* We always render the text headers unless it's analyzing */}
        {!isAnalyzing && (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500 w-full">
            
            <div className={`transition-all duration-700 ease-in-out flex flex-col items-center ${isTestStarted ? 'scale-90 opacity-0 h-0 overflow-hidden mb-0' : 'scale-100 opacity-100 h-auto mb-8'}`}>
              <div className="w-24 h-24 bg-[#111936] shadow-xl shadow-indigo-500/10 border border-indigo-500/20 rounded-[2rem] flex items-center justify-center mb-8 relative group">
                <div className="absolute inset-0 bg-indigo-400/20 rounded-[2rem] blur-xl group-hover:bg-indigo-400/30 transition-all"></div>
                <Mic className="w-10 h-10 text-indigo-400 relative z-10" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-white" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>ভয়েস ইংরেজি অ্যাসেসমেন্ট</h2>
              {!user ? (
                <p className="text-base text-slate-300 font-medium leading-relaxed max-w-md">ভয়েস অ্যাসেসমেন্ট করতে এবং আপনার ব্যক্তিগতকৃত ইংরেজি কোর্স রুটিন তৈরি করতে অনুগ্রহ করে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন বা একটি নতুন অ্যাকাউন্ট তৈরি করুন।</p>
              ) : isTimeExhausted ? (
                <p className="text-base text-amber-400 font-medium leading-relaxed max-w-md">আপনার অ্যাকাউন্টে পর্যাপ্ত ক্রেডিট নেই। ভয়েস অ্যাসেসমেন্ট সম্পন্ন করতে দয়া করে আপনার ব্যালেন্স রিচার্জ করুন।</p>
              ) : (
                <p className="text-base text-slate-300 font-medium leading-relaxed max-w-md">আমাদের এআই-এর সাথে 3-4 মিনিটের একটি ছোট লাইভ কনভারসেশন করুন। স্বাভাবিকভাবে কথা বলুন, যাতে এটি আপনার কথা বলার ধরণ বুঝতে পারে, এবং আমরা আপনার জন্য একটি ব্যক্তিগতকৃত ইংরেজি কোর্স রুটিন তৈরি করব।</p>
              )}
            </div>

            {/* This is where the Mics appear when started */}
            <div className={`w-full transition-all duration-700 ease-in-out ${isTestStarted ? 'opacity-100 h-auto scale-100 mb-8' : 'opacity-0 h-0 scale-95 overflow-hidden mb-0'}`}>
              <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>অ্যাসেসমেন্ট চলছে...</h2>
              <p className="text-sm text-slate-400 mb-6 font-medium">আপনার এআই গাইডের সাথে ইংরেজিতে কথা বলুন।</p>
              
              {isTestStarted && (
                <div className="w-full bg-[#111936]/50 backdrop-blur-xl rounded-[2.5rem] border border-indigo-500/20 shadow-2xl relative z-10 pt-4 pb-2 px-4 shadow-indigo-500/10">
                  <LiveSessionInteraction
                    ref={liveSessionRef}
                    selectedTutor="Assessor"
                    scenarioId="proficiency-eval"
                    selectedVoice="Aoede"
                    speakSlowly={false}
                    onTranscript={handleTranscript}
                    onSessionEnd={handleSessionEnd}
                    isMinimal={true}
                    hideControls={true}
                  />
                </div>
              )}
            </div>

            {/* The single smart button */}
            {!isTestStarted ? (
               !user ? (
                 <button 
                   onClick={() => setShowAuthModal(true)}
                   className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] border border-indigo-400/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   লগইন করুন
                 </button>
               ) : isTimeExhausted ? (
                 <button 
                   onClick={() => navigate('/buy-premium')}
                   className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(217,119,6,0.3)] hover:shadow-[0_0_40px_rgba(217,119,6,0.5)] border border-amber-400/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   ক্রেডিট রিচার্জ করুন
                 </button>
               ) : (
                 <button 
                   onClick={handleStartTest}
                   className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] border border-indigo-400/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   <Mic className="w-6 h-6" /> ভয়েস টেস্ট শুরু করুন
                 </button>
               )
            ) : (
              <button 
                onClick={handleStopTest}
                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-450 hover:to-red-500 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:shadow-[0_0_40px_rgba(225,29,72,0.5)] border border-rose-400/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 animate-in slide-in-from-bottom-4 duration-500"
              >
                <Square className="w-5 h-5 fill-current" /> Stop Test & Get Result
              </button>
            )}

          </div>
        )}

        {isAnalyzing && (
           <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto animate-in fade-in duration-500">
             <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
               <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-2 border-4 border-cyan-500/20 rounded-full"></div>
               <div className="absolute inset-2 border-4 border-cyan-400 border-b-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
               <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
             </div>
             <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার দক্ষতা বিশ্লেষণ করা হচ্ছে...</h2>
             <p className="text-lg text-slate-400 font-medium max-w-sm leading-relaxed">
               আপনার কথা বলার ধরণ, গ্রামার এবং ভোকাবুলারি বিশ্লেষণ করে একটি কাস্টম রুটিন তৈরি করা হচ্ছে। দয়া করে অপেক্ষা করুন।
             </p>
           </div>
        )}

        {errorStatus && (
           <div className="bg-red-900/20 text-red-400 p-6 rounded-2xl text-md font-bold flex items-center justify-center gap-3 border border-red-900/50 shadow-lg mt-6 w-full">
             <AlertTriangle className="w-6 h-6" /> {errorStatus}
           </div>
        )}
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLoginSuccess={login} />}
    </div>
  );
}
