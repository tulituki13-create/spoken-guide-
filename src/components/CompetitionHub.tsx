import React, { useState } from "react";
import { Trophy, Users, School, MapPin, Map, GraduationCap, ArrowRight, ShieldCheck, Flame } from "lucide-react";

export const CompetitionHub = () => {
  const [activeLevel, setActiveLevel] = useState<'school' | 'district' | 'division' | 'class'>('school');

  // Realistic competition leaderboards data mock
  const schoolRanking = [
    { rank: 1, name: "Notre Dame College", division: "Dhaka", participants: 412, avgScore: 88.5 },
    { rank: 2, name: "Milestone College", division: "Dhaka", participants: 350, avgScore: 86.2 },
    { rank: 3, name: "Dhaka College", division: "Dhaka", participants: 290, avgScore: 84.9 },
    { rank: 4, name: "Rajshahi College", division: "Rajshahi", participants: 210, avgScore: 82.4 },
    { rank: 5, name: "Chittagong Collegiate School", division: "Chattogram", participants: 185, avgScore: 81.3 },
    { rank: 6, name: "Sylhet Cadet College", division: "Sylhet", participants: 120, avgScore: 79.8 },
  ];

  const districtRanking = [
    { rank: 1, name: "Dhaka District", division: "Dhaka", activeUsers: 2470, avgScore: 83.4 },
    { rank: 2, name: "Chattogram District", division: "Chattogram", activeUsers: 1980, avgScore: 81.1 },
    { rank: 3, name: "Sylhet District", division: "Sylhet", activeUsers: 1100, avgScore: 79.9 },
    { rank: 4, name: "Rajshahi District", division: "Rajshahi", activeUsers: 950, avgScore: 78.5 },
    { rank: 5, name: "Khulna District", division: "Khulna", activeUsers: 840, avgScore: 76.2 },
  ];

  const divisionRanking = [
    { rank: 1, name: "Dhaka Division", activeSchools: 64, activeUsers: 8900, avgScore: 82.7 },
    { rank: 2, name: "Chattogram Division", activeSchools: 42, activeUsers: 6400, avgScore: 80.5 },
    { rank: 3, name: "Sylhet Division", activeSchools: 21, activeUsers: 3100, avgScore: 78.9 },
    { rank: 4, name: "Rajshahi Division", activeSchools: 28, activeUsers: 4200, avgScore: 77.2 },
    { rank: 5, name: "Khulna Division", activeSchools: 25, activeUsers: 3300, avgScore: 75.8 },
  ];

  const classRanking = [
    { rank: 1, name: "HSC 1st Year (Class 11)", level: "College", participants: 1950, avgScore: 81.4 },
    { rank: 2, name: "HSC 2nd Year (Class 12)", level: "College", participants: 2200, avgScore: 80.3 },
    { rank: 3, name: "SSC Candidates (Class 10)", level: "School", participants: 1600, avgScore: 77.8 },
    { rank: 4, name: "Class 9", level: "School", participants: 1250, avgScore: 74.2 },
    { rank: 5, name: "University Undergrad", level: "Tertiary", participants: 1400, avgScore: 84.1 },
  ];

  return (
    <div id="competition-full-window" className="min-h-full flex-1 bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-8 flex flex-col gap-8 w-full max-w-7xl mx-auto rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/50 my-4">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-500/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-12 -translate-y-12 animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/14 rounded-full text-xs font-mono tracking-wider font-extrabold text-amber-300 uppercase mb-4 shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-current animate-bounce" /> Live Academic Tournament
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight leading-none">
              বাংলাদেশ স্পোকেন ও গ্রামার একাডেমিক কাপ ২০২৬
            </h1>
            <p className="text-slate-200 text-sm mt-3 leading-relaxed">
              আপনার স্কুল, জেলা কিংবা ক্লাসের গৌরব বৃদ্ধিতে সক্রিয় চ্যাটিং ও অনুশীলন পারফরম্যান্স দিয়ে পয়েন্ট অর্জন করুন। প্রতি সপ্তাহে মেধার ভিত্তিতে চ্যাম্পিয়ন প্রতিষ্ঠান ও শিক্ষার্থীদের বিশেষ সম্মাননা প্রদান করা হয়।
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 min-w-[200px]">
            <Trophy className="w-10 h-10 text-amber-300 animate-pulse mb-2" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-200">মোট বিজয়ী তহবিল</span>
            <span className="text-2xl font-black text-amber-300 mt-1">৳ ১০,০০০+ স্কলারশিপ</span>
          </div>
        </div>
      </div>

      {/* Level Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-100 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800">
        <button 
          onClick={() => setActiveLevel('school')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${activeLevel === 'school' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/30'}`}
        >
          <School className="w-4 h-4" /> স্কুল টু স্কুল
        </button>
        <button 
          onClick={() => setActiveLevel('district')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${activeLevel === 'district' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/30'}`}
        >
          <MapPin className="w-4 h-4" /> জেলা ভিত্তিক
        </button>
        <button 
          onClick={() => setActiveLevel('division')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${activeLevel === 'division' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/30'}`}
        >
          <Map className="w-4 h-4" /> বিভাগীয় প্রতিযোগিতা
        </button>
        <button 
          onClick={() => setActiveLevel('class')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${activeLevel === 'class' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-blue-500/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/30'}`}
        >
          <GraduationCap className="w-4 h-4" /> ক্লাস ভিত্তিক র্যাংক
        </button>
      </div>

      {/* Leaderboard Table Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2 font-display">
              {activeLevel === 'school' && "স্কুল ও কলেজ লাইভ র‍্যাঙ্কিং (Top Schools & Colleges)"}
              {activeLevel === 'district' && "জেলা ভিত্তিক শ্রেষ্ঠত্ব লড়াই (District-wise Standings)"}
              {activeLevel === 'division' && "বিভাগীয় পয়েন্ট তালিকা (Divisional Point Tables)"}
              {activeLevel === 'class' && "শ্রেণী ভিত্তিক সক্রিয় শিক্ষার্থীদের স্কোরোর্ড (Class Study Rankings)"}
            </h2>
            <p className="text-slate-400 text-xs mt-1">রিয়েল-টাইমে স্কোর আপডেট করা হচ্ছে। সকল শিক্ষার্থীর সামষ্টিক ফলাফলের গড়ের ভিত্তিতে র‍্যাঙ্ক নির্ধারিত হয়েছে।</p>
          </div>
        </div>

        {/* School Competitions Selection */}
        {activeLevel === 'school' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 text-xs font-bold uppercase">
                  <th className="py-4 px-4 text-center">স্থান (Rank)</th>
                  <th className="py-4 px-4">শিক্ষা প্রতিষ্ঠানের নাম (Institution Name)</th>
                  <th className="py-4 px-4">বিভাগ (Division)</th>
                  <th className="py-4 px-4 text-center">সক্রিয় প্রতিযোগী (Students)</th>
                  <th className="py-4 px-4 text-right">গড় স্পোকেন পয়েন্ট (Avg Score)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm font-semibold">
                {schoolRanking.map((sch, idx) => (
                  <tr key={sch.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {sch.rank}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <School className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{sch.name}</span>
                    </td>
                    <td className="py-4 px-4 font-normal text-slate-500 dark:text-slate-400">{sch.division}</td>
                    <td className="py-4 px-4 text-center text-indigo-600 dark:text-indigo-400 font-mono">{sch.participants}</td>
                    <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">{sch.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* District Competitions Selection */}
        {activeLevel === 'district' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 text-xs font-bold uppercase">
                  <th className="py-4 px-4 text-center">স্থান (Rank)</th>
                  <th className="py-4 px-4">জেলার নাম</th>
                  <th className="py-4 px-4">মূল বিভাগ</th>
                  <th className="py-4 px-4 text-center">সক্রিয় শিক্ষার্থীর সংখ্যা</th>
                  <th className="py-4 px-4 text-right">গড় স্পোকেন স্কোর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm font-semibold">
                {districtRanking.map((dist, idx) => (
                  <tr key={dist.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {dist.rank}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{dist.name}</span>
                    </td>
                    <td className="py-4 px-4 font-normal text-slate-500 dark:text-slate-400">{dist.division}</td>
                    <td className="py-4 px-4 text-center text-indigo-600 dark:text-indigo-400 font-mono">{dist.activeUsers}</td>
                    <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">{dist.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Division Competitions Selection */}
        {activeLevel === 'division' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 text-xs font-bold uppercase">
                  <th className="py-4 px-4 text-center">স্থান (Rank)</th>
                  <th className="py-4 px-4">বিভাগের নাম</th>
                  <th className="py-4 px-4 text-center">মোট নিবন্ধিত বিদ্যাপীঠ</th>
                  <th className="py-4 px-4 text-center">সক্রিয় শিক্ষার্থীর সংখ্যা</th>
                  <th className="py-4 px-4 text-right">গড় স্পোকেন স্কোর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm font-semibold">
                {divisionRanking.map((div, idx) => (
                  <tr key={div.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {div.rank}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <Map className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{div.name}</span>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-500 dark:text-slate-400 font-mono">{div.activeSchools}</td>
                    <td className="py-4 px-4 text-center text-indigo-600 dark:text-indigo-400 font-mono">{div.activeUsers}</td>
                    <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">{div.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Class Competitions Selection */}
        {activeLevel === 'class' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 text-xs font-bold uppercase">
                  <th className="py-4 px-4 text-center">স্থান (Rank)</th>
                  <th className="py-4 px-4">শ্রেণীর স্তর (Class level)</th>
                  <th className="py-4 px-4">ধাপ (Level)</th>
                  <th className="py-4 px-4 text-center">সক্রিয় শিক্ষার্থীর সংখ্যা</th>
                  <th className="py-4 px-4 text-right">গড় স্পোকেন স্কোর</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm font-semibold">
                {classRanking.map((cl, idx) => (
                  <tr key={cl.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {cl.rank}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{cl.name}</span>
                    </td>
                    <td className="py-4 px-4 font-normal text-slate-500 dark:text-slate-400">{cl.level}</td>
                    <td className="py-4 px-4 text-center text-indigo-600 dark:text-indigo-400 font-mono">{cl.participants}</td>
                    <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold font-mono">{cl.avgScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration CTA card */}
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> আপনার প্রতিষ্ঠান কি নিবন্ধিত নয়?
          </h3>
          <p className="text-slate-400 text-xs mt-1">আমাদের AI স্ক্যানার ও যাচাইকারী ব্যবস্থার মাধ্যমে স্কুল বা কলেজ নিবন্ধন করুন ও পয়েন্ট ট্র্যাকিং সক্রিয় করুন।</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold cursor-pointer transition-all shrink-0">
          প্রতিষ্ঠান সংযুক্ত করুন <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
