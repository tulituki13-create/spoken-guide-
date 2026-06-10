import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, Check, Sparkles, ArrowLeft, Award } from "lucide-react";
import { GRAMMAR_TOPICS } from "../lib/grammarTopics";
import { AILessonModal } from "./AILessonModal";

export const AITutorPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'Grammar' | 'Learner Focus'>('Grammar');

  // Categories depend on the active section
  const categories = Array.from(new Set(GRAMMAR_TOPICS.filter(t => t.section === activeSection).map(t => t.category)));
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [grammarScores, setGrammarScores] = useState<{[key: string]: {score: number, feedback: string}}>({});
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<string | null>(null);

  useEffect(() => {
    // Wait until user is verified to fetch scores
    if (user) {
      fetchGrammarScores();
    }
  }, [user?.token]);

  // When active section changes or component loads, reset active category to the first one available
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const fetchGrammarScores = async () => {
    try {
      const res = await fetch('/api/ai/teacher/scores', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const scoreMap: {[key: string]: {score: number, feedback: string}} = {};
        (data.scores || []).forEach((row: any) => {
          scoreMap[row.topic] = { score: row.score, feedback: row.feedback };
        });
        setGrammarScores(scoreMap);
      }
    } catch (e) {}
  };

  const handleSelectTopic = async (topic: string) => {
    setSelectedTopicForModal(topic);
  };

  return (
    <div className="h-full w-full flex flex-col text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden overflow-y-auto z-10 relative">
      
      {/* Header */}
      <div className="w-full glass-panel border-b border-emerald-500/10 px-4 md:px-6 py-4 flex flex-row items-center justify-between shrink-0 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/" className="p-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer flex items-center justify-center" title="Return Home">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] md:text-[10px] uppercase tracking-widest font-black px-1.5 md:px-2 py-0.5 md:py-1 rounded border border-emerald-500/20">AI Tutor</span>
              <span className="text-[10px] md:text-xs">✨</span>
            </div>
            <h1 className="text-base md:text-xl font-black font-display text-slate-900 dark:text-white mt-1">
              Personalized Grammar Coach
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-wider font-mono">Your Integrity Rating</span>
            <span className="text-xs md:text-sm font-bold text-emerald-500 flex items-center gap-1.5 mt-0.5 justify-end">
              🛡️ {user ? `${user.account_health}% Safe` : "Guest"}
            </span>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-500/15 p-1.5 md:p-2 px-3 md:px-4 rounded-xl flex items-center gap-2">
            <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
            <div className="flex flex-col text-left leading-none">
              <span className="text-[8px] md:text-[9px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Level Rank</span>
              <span className="text-[11px] md:text-xs font-extrabold text-emerald-600 dark:text-emerald-300 mt-0.5">{user ? "Sigma Scholar" : "Learner"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {/* Modals */}
        {selectedTopicForModal && (
          <AILessonModal 
            topic={selectedTopicForModal}
            section={activeSection}
            onClose={() => setSelectedTopicForModal(null)}
          />
        )}

        {/* Section Switcher */}
        <div className="flex justify-center mb-8 relative z-10 w-full px-4 sm:px-0">
          <div className="flex items-center w-full sm:w-auto gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800 p-1 md:p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             {['Grammar', 'Learner Focus'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section as any)}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                    activeSection === section
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {section === 'Learner Focus' ? 'Learner Perspective' : 'Grammar Basics'}
                </button>
              ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 md:p-6 glass-panel rounded-3xl flex flex-col gap-5 shadow-lg mb-6 border-slate-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full text-left">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white font-display">
                  {activeSection === 'Learner Focus' ? 'Learner Perspective Curriculum' : 'Grammar Curriculum'}
                </h3>
                <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 max-w-md">
                  Click on any topic category below, then select a specific unit to launch an interactive session.
                </p>
              </div>
            </div>
          </div>
          
          <div className="w-full">
            <div className="flex w-full overflow-x-auto pb-2 snap-x custom-scrollbar gap-2 sm:gap-3 text-xs font-black px-1">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`snap-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl cursor-pointer transition-all duration-300 whitespace-nowrap border shrink-0 ${activeCategory === cat ? 'bg-emerald-500 text-white shadow-md border-emerald-500 sm:scale-105 transform' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {GRAMMAR_TOPICS.filter(t => t.category === activeCategory).map((top, idx) => {
            const finished = grammarScores[top.name];
            return (
              <div 
                key={top.name}
                onClick={() => handleSelectTopic(top.name)}
                className={`p-4 md:p-5 rounded-3xl cursor-pointer transition-all duration-300 text-left relative overflow-hidden group 
                  border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-emerald-500/30
                `}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-xs md:text-sm border ${
                    finished 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 group-hover:border-emerald-500/30 group-hover:text-emerald-500'
                  }`}>
                    {finished ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : (idx + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className={`font-black text-xs md:text-sm leading-snug tracking-tight transition whitespace-normal break-words text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400`}>
                        {top.name}
                      </p>
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{top.translatedName}</p>
                    
                    {finished ? (
                      <div className="mt-3 flex items-center gap-1.5 text-[9px] md:text-[10px] font-mono px-2 py-1 w-max rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
                        <span>Score: {String(finished.score).split('/')[0]}/100</span>
                      </div>
                    ) : (
                      <div className="mt-2.5 md:mt-3 flex items-center gap-1.5 text-[10px] md:text-xs font-black text-emerald-500 group-hover:animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" /> Interactive Dialogue Session
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
