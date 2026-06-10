import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, MessageSquare, Trophy, Zap, ArrowRight, Play, Sparkles, BookOpen, Star, Activity, Headset, Heart, GraduationCap, Target, Plus, RotateCcw, CheckCircle2, Sliders } from 'lucide-react';

function DailyGoalTracker() {
  const [goal, setGoal] = useState(() => parseInt(localStorage.getItem('dailyGoalMinutes') || '15'));
  const [progress, setProgress] = useState(() => parseInt(localStorage.getItem('dailyProgressMinutes') || '0'));
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('dailyGoalDate');
    if (storedDate !== today) {
      setProgress(0);
      localStorage.setItem('dailyGoalDate', today);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyGoalMinutes', goal.toString());
  }, [goal]);

  useEffect(() => {
    localStorage.setItem('dailyProgressMinutes', progress.toString());
  }, [progress]);

  const addProgress = (mins: number) => {
    setProgress(p => Math.min(goal, p + mins));
  };

  const progressPercent = Math.min(100, Math.round((progress / goal) * 100)) || 0;
  const isGoalMet = progress >= goal;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 lg:p-8 border-2 border-slate-100 dark:border-slate-700/50 shadow-xl shadow-indigo-500/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 justify-between w-full max-w-5xl mx-auto mt-6 mb-8">
      {/* Decorative background */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center gap-6 z-10 w-full md:w-auto">
        <div className="relative flex shrink-0 items-center justify-center w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-900 shadow-inner">
          <svg className="w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" fill="none" />
            <circle 
              cx="50" cy="50" r="40" 
              className={`transition-all duration-1000 ease-out ${isGoalMet ? 'stroke-emerald-500' : 'stroke-indigo-500'}`} 
              strokeWidth="8" 
              fill="none" 
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
             {isGoalMet ? (
               <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-in zoom-in" />
             ) : (
               <>
                 <span className="text-xl font-black text-slate-800 dark:text-white" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{progressPercent}%</span>
               </>
             )}
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
             <Target className="w-5 h-5 text-indigo-500" />
             <h3 className="text-xl font-black text-slate-800 dark:text-white" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>ডেইলি গোল ট্র্যাকার</h3>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            আজকের স্পিকিং প্র্যাকটিস: <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress}</span> / {goal} মিনিট
          </p>
          
          {isEditingGoal ? (
             <div className="flex items-center gap-2">
               <input 
                 type="number" 
                 value={goal}
                 onChange={(e) => setGoal(Math.max(1, parseInt(e.target.value) || 15))}
                 className="w-20 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:border-indigo-500 font-bold"
                 min="1"
                 max="120"
               />
               <button onClick={() => setIsEditingGoal(false)} className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600">Save</button>
             </div>
          ) : (
             <button onClick={() => setIsEditingGoal(true)} className="text-[11px] font-bold text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 uppercase tracking-wide transition-colors">
               Change Goal
             </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 z-10 w-full md:w-auto">
         <button 
           onClick={() => addProgress(5)}
           disabled={isGoalMet}
           className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 active:scale-95 transition-all outline-none rounded-xl font-bold text-sm disabled:opacity-50 disabled:pointer-events-none"
         >
           <Plus className="w-4 h-4" /> 5 Min
         </button>
         <button 
           onClick={() => addProgress(10)}
           disabled={isGoalMet}
           className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 active:scale-95 transition-all outline-none rounded-xl font-bold text-sm disabled:opacity-50 disabled:pointer-events-none"
         >
           <Plus className="w-4 h-4" /> 10 Min
         </button>
         <button 
           onClick={() => setProgress(0)}
           className="flex-none p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all outline-none rounded-xl font-bold"
           title="Reset Progress"
         >
           <RotateCcw className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
}

export const HomePage = () => {
  const navigate = useNavigate();

  return (
      <div className="flex flex-col gap-16 md:gap-24 py-8 pb-20 animate-in fade-in duration-1000" style={{ fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" }}>
        
        {/* Main Hero Section */}
        <div className="text-center max-w-5xl mx-auto px-4 mt-8 md:mt-16">
          <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs md:text-sm tracking-wide mb-8">
             <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500/50" />
             অবশেষে ইংরেজি শেখার সঠিক ও নির্ভরযোগ্য জায়গা
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tight text-slate-900 dark:text-white leading-[1.2]" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            ইংরেজিতে কথা বলার <span className="text-emerald-600 dark:text-emerald-400 relative">ভয় আর নয়।</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-3xl mx-auto mb-12">
            মুখস্থ করার দিন শেষ। কৃত্রিম বুদ্ধিমত্তার সাথে সরাসরি কথা বলে, ভুল শুধরে নিয়ে নিজের আত্মবিশ্বাস বাড়িয়ে তোলো। <span className="text-slate-800 dark:text-slate-200 mt-2 block">Finally, a place of hope and learning for everyone.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
             <button onClick={() => navigate('/ai-tutor')} className="w-full sm:w-auto px-8 py-5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 active:scale-[0.98] transition-all text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl">
               <Zap className="w-6 h-6 fill-current text-amber-400" />
               এখুনি শুরু করো
             </button>
             <button onClick={() => navigate('/social')} className="w-full sm:w-auto px-8 py-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all text-slate-800 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-3 border-2 border-slate-200 dark:border-slate-700 shadow-sm text-lg">
               <MessageSquare className="w-5 h-5 text-indigo-500" />
               কমিউনিটি এক্সপ্লোর করো
             </button>
          </div>
        </div>
        
        {/* Diagnostic Test Banner */}
        <div className="px-4 max-w-5xl mx-auto w-full mt-4 md:mt-8">
          <div className="bg-[#0f172a] dark:bg-[#0b0f19] rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden border border-slate-800/80 group">
            {/* Elegant glass blur styling */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 transition-transform duration-1000 group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 dark:bg-violet-900/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3"></div>
            <div className="absolute -inset-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-[2.5rem] opacity-20 pointer-events-none"></div>
            
            <div className="flex-1 text-center md:text-left z-10 relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-lg text-xs font-bold mb-5 text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-400" /> AI Evaluation
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-50 tracking-tight leading-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার ইংরেজি লেভেল কেমন?</h2>
              <p className="text-slate-300 font-medium text-base md:text-lg max-w-xl leading-relaxed">
                আমাদের AI-কে আপনার বর্তমান অবস্থা বুঝতে সাহায্য করুন। একটি ছোট্ট ইন্টারভিউয়ের মাধ্যমে আমরা আপনার জন্য একটি পার্সোনালাইজড কোর্স রুটিন তৈরি করে দেব, সম্পূর্ণ বিনামূল্যে।
              </p>
            </div>
            
            <button onClick={() => navigate('/proficiency-test')} className="w-full md:w-auto px-8 py-5 bg-white/10 hover:bg-white/15 active:bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all rounded-2xl font-black text-lg shadow-xl text-slate-50 flex items-center justify-center gap-3 whitespace-nowrap shrink-0 z-10 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2.5s_infinite]"></div>
               <Mic className="w-5 h-5 text-indigo-400"/> টেস্ট শুরু করুন
            </button>
          </div>
        </div>

        {/* Core Features Grid */}
        <div className="px-4 md:px-8 max-w-7xl mx-auto w-full">
           <div className="mb-12 text-center">
             <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>যেভাবে আমরা শিখবো</h2>
             <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">খুব সহজেই সহজতম উপায়ে ফ্লুয়েন্সি অর্জন করো।</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <FeatureCard 
                icon={<GraduationCap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
                bgClass="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                title="এআই টিউটর"
                titleEn="AI Grammar Help"
                description="গ্রামার বুঝতে অসুবিধা? বাংলায় প্রশ্ন করো আমাদের AI-কে।"
                link="/ai-tutor"
             />
             <FeatureCard 
                icon={<Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
                bgClass="bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                title="মক টেস্ট ও লিডারবোর্ড"
                titleEn="Global Mock Tests"
                description="সবার চেয়ে নিজেকে এগিয়ে রাখতে প্রতিদিন টেস্ট দিয়ে লিডারবোর্ডে জায়গা করে নাও।"
                link="/leaderboards"
             />
             <FeatureCard 
                icon={<MessageSquare className="w-8 h-8 text-pink-600 dark:text-pink-400" />}
                bgClass="bg-pink-50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20"
                title="হেল্পফুল কমিউনিটি"
                titleEn="Active Student Community"
                description="যে কোনো প্রশ্ন বা কনফিউশন আমাদের হাজারো শিক্ষার্থীর মাঝে শেয়ার করো।"
                link="/social"
             />
             <FeatureCard 
                icon={<Sliders className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
                bgClass="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20"
                title="ইন্টারেক্টিভ ঢেউ"
                titleEn="Waves & Themes"
                description="স্ক্রিন স্ক্রোল ও টাচ ডাইনামিক শান্ত জলতরঙ্গ আপনার পছন্দমত সুন্দর করে সাজান।"
                link="/customize"
             />
          </div>
        </div>
        
        {/* Massive Call to Action */}
        <div className="px-4 max-w-5xl mx-auto w-full">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl border border-slate-700/50">
            {/* Subtle overlay shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>পড়া শেষ, এবার বলার পালা।</h2>
              <p className="text-slate-300 font-medium text-lg mb-10 max-w-lg mx-auto">
                হাজারো শিক্ষার্থীর সাথে যোগ দিয়ে নিজের ইংরেজি শেখার জার্নি আজকেই শুরু করো। সম্পূর্ণ বিনা মূল্যে সুযোগটি গ্রহণ করো।
              </p>
              <button onClick={() => navigate('/ai-tutor')} className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-slate-900 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 mx-auto">
                 শুরু করুন <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
  );
};

function FeatureCard({ icon, bgClass, title, titleEn, description, link }: any) {
  const navigate = useNavigate();
  return (
    <div 
     onClick={() => navigate(link)}
     className="group cursor-pointer bg-white dark:bg-slate-800/40 rounded-3xl p-8 border-2 border-slate-100 dark:border-slate-700/50 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start gap-5"
    >
       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm ${bgClass}`}>
         {icon}
       </div>
       <div className="mt-2 w-full">
         <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>{title}</h3>
         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
           {titleEn}
         </p>
         <p className="text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
           {description}
         </p>
       </div>
       <div className="mt-auto pt-4 flex items-center justify-between w-full font-bold text-emerald-600 dark:text-emerald-400 text-sm opacity-80 group-hover:opacity-100 transition-opacity">
         <span>Explore</span>
         <ArrowRight className="w-5 h-5 bg-emerald-50 dark:bg-emerald-500/20 p-1 rounded-full group-hover:translate-x-1 transition-transform" />
       </div>
    </div>
  );
}
