import React, { useState } from "react";
import { Sparkles, Edit2, Check, UserCircle } from "lucide-react";

interface WelcomeHeaderProps {
  studentName: string;
  setStudentName: (name: string) => void;
  selectedTutor: string;
  setSelectedTutor: (tutor: string) => void;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  studentName,
  setStudentName,
  selectedTutor,
  setSelectedTutor,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(studentName);

  const handleSave = () => {
    if (tempName.trim()) {
      setStudentName(tempName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border-white shadow-sm transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100/80 flex items-center justify-center text-2xl shadow-xs shrink-0 select-none">
            👋
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-800 tracking-tight">
                স্বাগতম,{" "}
                {isEditing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="border-b-2 border-blue-500 focus:outline-none bg-transparent text-slate-800 font-bold px-1 py-0 w-32 md:w-44"
                      maxLength={15}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      autoFocus
                    />
                    <button
                      onClick={handleSave}
                      className="p-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {studentName}
                    </span>
                    <button
                      onClick={() => {
                        setTempName(studentName);
                        setIsEditing(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                      title="নাম পরিবর্তন করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                !
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
              "অনুশীলনের জন্য প্রস্তুত? নির্দ্বিধায় কথা বলুন, এখানে কোনো দ্বিধা নেই। মাইক্রোফোনে ট্যাপ করে শুরু করুন!"
            </p>
          </div>
        </div>

        {/* Tutor Selection Card + Online Status Glass Indicator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Static Design live status */}
          <div className="glass-panel px-4 py-2 rounded-full flex items-center justify-center gap-2 border-white shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xxs font-bold uppercase tracking-widest text-slate-500">
              {selectedTutor} অনলাইনে আছেন
            </span>
          </div>

          <div className="flex items-center gap-2.5 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-xs">
            <UserCircle className="w-4 h-4 text-blue-500" />
            <select
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-sans font-semibold focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="Buddy">Buddy (বন্ধুত্বপূর্ণ)</option>
              <option value="Sam">Sam (ধৈর্যশীল শিক্ষক)</option>
              <option value="Oliver">Oliver (শখের ভক্ত)</option>
              <option value="Bella">Bella (সৃজনশীল সঙ্গী)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
