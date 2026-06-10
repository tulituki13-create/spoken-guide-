import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { PREDEFINED_SUBTOPICS } from '../lib/subtopics';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  topic: string;
  section: 'Grammar' | 'Learner Focus';
  onClose: () => void;
}

export const AILessonModal: React.FC<Props> = ({ topic, section, onClose }) => {
  const navigate = useNavigate();
  const [subtopics, setSubtopics] = useState<string[]>([]);


  useEffect(() => {
    if (section === 'Learner Focus') {
      const baseTopicName = topic.split(' - ')[0].trim();
      if (PREDEFINED_SUBTOPICS[topic]) {
          setSubtopics(PREDEFINED_SUBTOPICS[topic]);
      } else if (PREDEFINED_SUBTOPICS[baseTopicName]) {
          setSubtopics(PREDEFINED_SUBTOPICS[baseTopicName]);
      } else {
          setSubtopics([
             "দৈনন্দিন ব্যবহার",
             "কর্মক্ষেত্রে",
             "চেনা-পরিচিতিদের সাথে",
             "ভুল থেকে শেখা",
             "নতুন শব্দ শেখা"
          ]);
      }
    }
  }, [topic, section]);

  const handleSelect = (selectedTopic: string) => {
    // If it's a grammar topic, it just passes `topic`. 
    // If it's learner focus, it passes `topic - selectedTopic`
    const finalTopic = section === 'Learner Focus' ? `${topic} - ${selectedTopic}` : topic;
    
    return (
      <div className="flex flex-col gap-3 mt-4">
        <button 
          onClick={() => navigate(`/ai-tutor-text/${encodeURIComponent(finalTopic)}`)}
          className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 group"
        >
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-2">
                <span className="leading-tight">Text Message Mode</span>
                <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-pulse">Credit Saving • সাশ্রয়ী</span>
              </div>
              <span className="text-[10px] font-medium text-indigo-200">Chat and get instant feedback • কম ক্রেডিট ব্যবহৃত হয়</span>
            </div>
        </button>
        
        <button 
          onClick={() => navigate(`/ai-tutor-live/${encodeURIComponent(finalTopic)}`)}
          className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-450 hover:to-yellow-500 text-slate-900 rounded-2xl font-black transition-all shadow-lg active:scale-95 group"
        >
            <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col items-start text-left">
              <span className="leading-tight">Live Voice Call Mode</span>
              <span className="text-[10px] font-extrabold text-amber-900/80">Speak naturally with AI Coach</span>
            </div>
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 w-full max-h-[90vh] overflow-y-auto relative shadow-2xl ${section === 'Learner Focus' ? 'max-w-2xl' : 'max-w-sm'}`}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            <X className="w-4 h-4" />
          </button>

        
        <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{topic}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {section === 'Learner Focus' 
            ? 'Select a daily life context from your perspective:'
            : 'How would you like to practice this grammar topic?'}
        </p>

        {section === 'Grammar' ? (
          handleSelect(topic)
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subtopics.map((sub, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-500/50 transition-colors group shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">{sub}</h4>
                  <div className="flex items-center gap-2 mt-auto">
                    <button 
                      onClick={() => navigate(`/ai-tutor-text/${encodeURIComponent(topic + " - " + sub)}`)}
                      className="flex-1 py-2 px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                      title="Text Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Text
                    </button>
                    <button 
                      onClick={() => navigate(`/ai-tutor-live/${encodeURIComponent(topic + " - " + sub)}`)}
                      className="flex-1 py-2 px-3 bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 border border-teal-200 dark:border-teal-500/30 text-teal-700 dark:text-teal-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                      title="Live Voice Call"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Voice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
