import React, { useState } from "react";
import { Sparkles, Edit2, Check, UserCircle, Clock, ShieldCheck, UserPlus, Sun, Moon } from "lucide-react";
import { User } from "../AuthContext";

interface WelcomeHeaderProps {
  studentName: string;
  setStudentName: (name: string) => void;
  selectedTutor: string;
  setSelectedTutor: (tutor: string) => void;
  user: User | null;
  anonTimeLeft: number;
  onAuthClick: () => void;
  onLogout: () => void;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  studentName,
  setStudentName,
  selectedTutor,
  setSelectedTutor,
  user,
  anonTimeLeft,
  onAuthClick,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(studentName);

  const handleSave = () => {
    if (tempName.trim()) {
      setStudentName(tempName.trim());
    }
    setIsEditing(false);
  };

  const displayName = user ? user.username : studentName;
  
  const activeTimeLeft = user ? user.timeLeft : anonTimeLeft;
  const minutesLeft = Math.floor(activeTimeLeft / 60);
  const secondsLeft = activeTimeLeft % 60;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-t-none md:rounded-3xl p-4 md:p-6 border-b md:border-b-0 border-x-0 md:border-x md:border-y border-slate-200/50 dark:border-slate-800/50 md:shadow-md transition-all duration-300 w-full mb-0 md:mb-6 z-40 sticky top-0 mx-auto md:max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
        <div className="flex items-start md:items-center gap-3 md:gap-4 w-full">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-xl md:text-2xl shadow-inner border border-indigo-200/30 dark:border-indigo-700/30 shrink-0 select-none">
            👋
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <h1 className="font-display font-black text-xl md:text-2xl lg:text-3xl text-slate-800 dark:text-slate-100 tracking-tight truncate flex items-center flex-wrap">
                  স্বাগতম,{" "}
                  {isEditing && !user ? (
                    <span className="inline-flex items-center gap-1.5 ml-1">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="border-b-2 border-indigo-500 focus:outline-none bg-transparent text-slate-800 dark:text-slate-100 font-bold px-1 py-0 w-24 md:w-44 text-lg md:text-2xl"
                        maxLength={15}
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        className="p-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 ml-1 truncate">
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent truncate font-black">
                        {displayName}
                      </span>
                      {!user && (
                        <button
                          onClick={() => {
                            setTempName(displayName);
                            setIsEditing(true);
                          }}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer shrink-0"
                          title="নাম পরিবর্তন করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      )}
                    </span>
                  )}
                  !
                </h1>
                {user?.isPremium && (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900/50 border border-amber-300/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-bold rounded-lg ml-1 shadow-sm">
                    <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5" /> Premium
                  </span>
                )}
              </div>
              
              {/* Desktop Toggles */}
              <div className="hidden md:flex items-center gap-2">

                  {!user ? (
                    <button onClick={onAuthClick} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-md whitespace-nowrap active:scale-95">
                      <UserPlus className="w-4 h-4" /> Login
                    </button>
                  ) : (
                    <button onClick={onLogout} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
                      Logout
                    </button>
                  )}
              </div>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm mt-1 leading-relaxed flex flex-wrap items-center gap-2 md:gap-3">
              "অনুশীলনের জন্য প্রস্তুত? নির্দ্বিধায় কথা বলুন!"
              <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold shadow-sm ${activeTimeLeft === 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'}`}>
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> 
                {minutesLeft}m {secondsLeft}s
              </span>
            </p>
          </div>
        </div>

        {/* Action Panel - Mobile Toggles & Selectors */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0">
          <div className="flex md:hidden items-center gap-2">
            {!user ? (
              <button onClick={onAuthClick} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-sm">
                Login
              </button>
            ) : (
              <button onClick={onLogout} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold">
                Logout
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto md:ml-0">
            <div className="hidden sm:flex bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full items-center justify-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {selectedTutor} Live
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 hover:border-indigo-300 transition-colors">
              <UserCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <select
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="bg-transparent border-none text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer text-xs pr-2"
              >
                <option value="Buddy" className="dark:bg-slate-800">Buddy</option>
                <option value="Sam" className="dark:bg-slate-800">Sam</option>
                <option value="Oliver" className="dark:bg-slate-800">Oliver</option>
                <option value="Bella" className="dark:bg-slate-800">Bella</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
