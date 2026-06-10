import React, { useState } from "react";
import { 
  Award, 
  Calendar, 
  Clock, 
  BarChart2, 
  Star, 
  CheckCircle, 
  Trash2, 
  Sparkle, 
  ChevronRight, 
  Activity, 
  BookOpen, 
  ThumbsUp, 
  Mic,
  Download
} from "lucide-react";

export interface PerformanceRecord {
  id: string;
  scenarioName: string;
  scenarioIcon: string;
  timestamp: string;
  duration: number;
  overallFeedback: string;
  spokenReview: string;
  practiceReview: string;
  learningPoints: string[];
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  pronunciationScore: number;
}

interface PerformanceHubProps {
  records: PerformanceRecord[];
  onClearRecords: () => void;
  isLoading: boolean;
}

export const PerformanceHub: React.FC<PerformanceHubProps> = ({ 
  records, 
  onClearRecords, 
  isLoading 
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Default select the latest record
  const activeRecord = records.find(r => r.id === selectedRecordId) || records[0];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  const getPercentageBarColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getAverageScore = (record: PerformanceRecord) => {
    return Math.round((record.fluencyScore + record.vocabularyScore + record.grammarScore + record.pronunciationScore) / 4);
  };

  const handleDownloadWeeklySummary = async () => {
    setIsGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      
      const now = new Date();
      // Filter recent 7 days
      const last7DaysRecords = records.filter(rec => {
        const datePart = rec.timestamp.split(" ")[0];
        const parts = datePart.split('/'); // dd/mm/yyyy
        let recDate;
        if (parts.length === 3) {
          // Attempt to parse manually to avoid format ambiguities
          recDate = new Date(+parts[2], +parts[1] - 1, +parts[0]);
        } else {
          recDate = new Date(datePart);
        }
        
        if (isNaN(recDate.getTime())) return true;
        
        const diffTime = Math.abs(now.getTime() - recDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays <= 7;
      });

      const summaryRecords = last7DaysRecords.length > 0 ? last7DaysRecords : records.slice(0, 7);

      const totalPracticeMins = Math.floor(summaryRecords.reduce((acc, r) => acc + r.duration, 0) / 60);
      const avgFluency = Math.round(summaryRecords.reduce((acc, r) => acc + r.fluencyScore, 0) / summaryRecords.length) || 0;
      const avgVocab = Math.round(summaryRecords.reduce((acc, r) => acc + r.vocabularyScore, 0) / summaryRecords.length) || 0;
      const avgGrammar = Math.round(summaryRecords.reduce((acc, r) => acc + r.grammarScore, 0) / summaryRecords.length) || 0;

      let allLearningPoints: string[] = [];
      summaryRecords.forEach(r => {
        if (r.learningPoints) {
          allLearningPoints = [...allLearningPoints, ...r.learningPoints];
        }
      });
      const topLearningPoints = allLearningPoints.slice(0, 10);
      
      const sortedByVocab = [...summaryRecords].sort((a,b) => b.vocabularyScore - a.vocabularyScore);
      const mostImprovedVocabScore = sortedByVocab[0]?.vocabularyScore || 0;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageEl = document.createElement('div');
      pageEl.style.width = '794px';
      pageEl.style.height = '1120px';
      pageEl.style.padding = '40px';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.backgroundColor = '#f8fafc';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.fontFamily = "'Inter', system-ui, sans-serif";
      pageEl.className = 'print-page pdf-force-light';

      pageEl.innerHTML = `
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); border-radius: 16px; padding: 28px; color: #ffffff; margin-bottom: 26px;">
          <h1 style="font-size: 26px; font-weight: 900; margin: 0 0 6px 0; color: #ffffff;">Weekly Performance Summary</h1>
          <p style="font-size: 13.5px; opacity: 0.95; margin: 0; color: #ffffff;">Your aggregated progress from the last 7 days of practice</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Total Practice Time</p>
            <p style="font-size: 32px; font-weight: 900; color: #4f46e5; margin: 8px 0;">${totalPracticeMins}<span style="font-size: 16px; color: #818cf8;"> mins</span></p>
            <span style="font-size: 11px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">Based on ${summaryRecords.length} Sessions</span>
          </div>
          <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase;">Average Fluency</p>
            <p style="font-size: 32px; font-weight: 900; color: #059669; margin: 8px 0;">${avgFluency}%</p>
            <span style="font-size: 11px; font-weight: 600; color: #047857; background: #d1fae5; padding: 4px 8px; border-radius: 6px; border: 1px solid #6ee7b7;">Consistently Progressing</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px;">
            <p style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Average Grammar</p>
            <p style="font-size: 26px; font-weight: 900; color: #ea580c; margin: 6px 0 0 0;">${avgGrammar}%</p>
          </div>
          <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px;">
            <p style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Most Improved Vocabulary Score</p>
            <p style="font-size: 26px; font-weight: 900; color: #7c3aed; margin: 6px 0 0 0;">${mostImprovedVocabScore}%</p>
          </div>
        </div>

        <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; flex-grow: 1;">
          <h3 style="font-size: 16px; font-weight: 900; color: #1e293b; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Top Learning Points & Feedback</h3>
          <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13.5px; line-height: 1.65; font-weight: 500;">
            ${topLearningPoints.map(point => `<li style="margin-bottom: 12px;"><strong>✦</strong> ${point}</li>`).join('')}
            ${topLearningPoints.length === 0 ? '<li style="color: #64748b; font-style: italic; list-style: none;">No learning points recorded yet.</li>' : ''}
          </ul>
        </div>

        <div style="margin-top: auto; padding-top: 18px; border-top: 2.5px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
           <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Spoken Guide AI</span>
           <span style="font-size: 11px; font-weight: 800; color: #64748b; background: #f1f5f9; padding: 3px 8px; border-radius: 6px;">Generated: ${now.toLocaleDateString()}</span>
        </div>
      `;

      document.body.appendChild(pageEl);

      await pdf.html(pageEl, {
        callback: function (doc) {
          doc.save('Weekly-Spoken-Performance.pdf');
          document.body.removeChild(pageEl);
          setIsGeneratingPdf(false);
        },
        x: 0,
        y: 0,
        width: 210, 
        windowWidth: 794
      });
    } catch (error) {
      console.error("PDF generation failed", error);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="w-full mt-8" id="performance-analysis-section">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
        <div>
          <span className="text-[10px] font-mono font-black text-blue-600 uppercase tracking-widest bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            📊 Student Fluency Scoreboard
          </span>
          <h2 className="font-display font-black text-2xl text-slate-800 flex items-center gap-2 mt-2">
            <Award className="w-6 h-6 text-yellow-500 animate-pulse" />
            আমার প্র্যাকটিস পারফরম্যান্স ও রিপোর্ট কার্ড (Performance Analytics)
          </h2>
          <p className="text-xs text-slate-500 font-medium">এআই টিউটরের সাথে আপনার কথোপকথনের পর এখানে বিস্তারিত ব্যাকরণ, উচ্চারণ এবং বাক্য গঠনের দক্ষতা বিশ্লেষণ দেখুন।</p>
        </div>

        {records.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0 font-sans">
            <button
              onClick={handleDownloadWeeklySummary}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 text-3xs font-mono font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-all cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-100"
            >
              <Download className="w-3.5 h-3.5" />
              {isGeneratingPdf ? 'Generating...' : 'সাপ্তাহিক রিপোর্ট (Weekly Summary)'}
            </button>
            {showConfirmClear ? (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl p-1 animate-fade-in shadow-sm">
                <span className="text-[10px] text-red-700 font-bold px-2">মুছে ফেলবেন?</span>
                <button
                  onClick={() => {
                    onClearRecords();
                    setShowConfirmClear(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  হ্যাঁ (Yes)
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  না (No)
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-1.5 text-3xs font-mono font-bold text-red-500 hover:text-red-700 transition-all cursor-pointer bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ইতিহাস মুছুন
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="glass-panel rounded-3xl p-10 border-white flex flex-col items-center justify-center text-center shadow-md animate-pulse">
          <div className="relative mb-4">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-slate-100 rounded-full animate-spin"></div>
            <Activity className="w-5 h-5 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-sm font-bold text-slate-700">কথোপকথন বিশ্লেষণ করা হচ্ছে...</span>
          <p className="text-xxs text-slate-400 mt-1 font-medium">AI Coach আপনার উচ্চারণ ও ব্যাকরণ মূল্যায়ন করছে, কিছু মুহূর্ত অপেক্ষা করুন। (Analyzing conversation content...)</p>
        </div>
      ) : records.length === 0 ? (
        /* NO RECORDS PLACEHOLDER CARD */
        <div className="glass-panel rounded-3xl p-8 border-white flex flex-col items-center justify-center text-center shadow-md bg-gradient-to-br from-white/80 via-blue-50/10 to-transparent">
          <div className="bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl p-4 mb-4 select-none animate-bounce" style={{ animationDuration: "3s" }}>
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="font-display font-black text-slate-800 text-sm mb-1">কোন প্র্যাকটিস সেশন বা রিপোর্ট কার্ড পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
            উপরে দেওয়া পরিস্থিতি (Roleplay Scenario) থেকে যেকোনো একটি টপিক ক্লিক করে এআই শিক্ষকের সাথে <b>স্পিকিং প্র্যাকটিস শুরু করুন!</b> সেশনটি শেষ হওয়ার সাথে সাথেই এখানে আপনার পারফরম্যান্সের বিস্তারিত রেটিং কার্ড দেখতে পাবেন।
          </p>
          <div className="flex gap-4 items-center">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> Fluency Tracking
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Grammar Analysis
            </span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-500" /> Key Learnings
            </span>
          </div>
        </div>
      ) : (
        /* DYNAMIC STRUCTURED PERFORMANCE LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT SECTION: Recent Activities list */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="text-xxs font-mono font-black text-slate-400 uppercase tracking-widest block px-1">
              সেশন ইতিহাস ({records.length} Practice Sessions)
            </span>
            
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
              {records.map((rec) => {
                const isActive = activeRecord && activeRecord.id === rec.id;
                const avgScore = getAverageScore(rec);
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecordId(rec.id)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative flex items-center justify-between gap-3 ${
                      isActive
                        ? "bg-blue-500 text-white border-blue-500/80 shadow-lg shadow-blue-100"
                        : "bg-white/60 hover:bg-white border-slate-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`text-2xl shrink-0 p-1.5 rounded-xl ${isActive ? "bg-white/10" : "bg-slate-50"}`}>
                        {rec.scenarioIcon}
                      </span>
                      <div className="overflow-hidden leading-tight">
                        <h4 className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-800"}`}>
                          {rec.scenarioName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 shrink-0 text-[10px]">
                          <span className={`flex items-center gap-0.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                            <Clock className="w-3 h-3 shrink-0" /> {Math.floor(rec.duration / 60)}মি {rec.duration % 60}সে
                          </span>
                          <span className={`flex items-center gap-0.5 ${isActive ? "text-blue-100" : "text-slate-400 font-semibold"}`}>
                            <Calendar className="w-3 h-3 shrink-0" /> {rec.timestamp.split(" - ")[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 leading-none">
                      <span className={`text-xs font-mono font-black ${isActive ? "text-amber-300" : "text-blue-600"}`}>
                        {avgScore}%
                      </span>
                      <span className={`text-[8px] uppercase tracking-wider font-bold mt-1 ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                        Score
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SECTION: Active Detailed Scorecard */}
          <div className="lg:col-span-8">
            <div className="glass-panel rounded-3xl p-6 border-white shadow-lg bg-white/70 h-full flex flex-col justify-between">
              {activeRecord && (
                <div className="flex flex-col gap-6">
                  {/* Active Header card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100/80 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 bg-blue-50 rounded-2xl border border-blue-100/50 block select-none">
                        {activeRecord.scenarioIcon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-black text-slate-800 text-base leading-tight">
                            {activeRecord.scenarioName}
                          </h3>
                          <span className="text-[10px] font-mono font-bold bg-blue-150 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                            ID: #{activeRecord.id.slice(-4)}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono font-semibold text-slate-400 mt-1">
                          সময়: {activeRecord.timestamp} | সেশন ব্যাপ্তি: {Math.floor(activeRecord.duration / 60)} মিনিট {activeRecord.duration % 60} সেকেন্ড
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/5 px-4 py-2.5 rounded-2xl border border-blue-100/40 text-center sm:text-right shrink-0">
                      <span className="text-[10px] font-mono font-black text-blue-650 uppercase tracking-widest block mb-0.5">গড় যোগ্যতা (Avg Score)</span>
                      <div className="flex items-center justify-center sm:justify-end gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-spin" style={{ animationDuration: "12s" }} />
                        <span className="text-lg font-mono font-black text-blue-700 leading-none">
                          {getAverageScore(activeRecord)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating progress sliders */}
                  <div>
                    <h4 className="text-xxs font-mono font-black text-slate-400 uppercase tracking-widest mb-3 px-0.5">
                      দক্ষতা স্কোরের বিবরণ (Skill Matrix)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fluency Slider */}
                      <div className="bg-white/50 border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                        <div className="flex items-center justify-between font-semibold mb-1 w-full text-xs">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                            সাবলীলতা (Fluency & Pace)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getScoreColor(activeRecord.fluencyScore)}`}>
                            {activeRecord.fluencyScore}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getPercentageBarColor(activeRecord.fluencyScore)}`}
                            style={{ width: `${activeRecord.fluencyScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Vocabulary Slider */}
                      <div className="bg-white/50 border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                        <div className="flex items-center justify-between font-semibold mb-1 w-full text-xs">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block animate-pulse"></span>
                            শব্দভান্ডার ব্যবহার (Vocabulary Level)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getScoreColor(activeRecord.vocabularyScore)}`}>
                            {activeRecord.vocabularyScore}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getPercentageBarColor(activeRecord.vocabularyScore)}`}
                            style={{ width: `${activeRecord.vocabularyScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Grammar Slider */}
                      <div className="bg-white/50 border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                        <div className="flex items-center justify-between font-semibold mb-1 w-full text-xs">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block animate-pulse"></span>
                            ব্যাকরণ ও গঠন (Grammar & Sentence structure)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getScoreColor(activeRecord.grammarScore)}`}>
                            {activeRecord.grammarScore}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getPercentageBarColor(activeRecord.grammarScore)}`}
                            style={{ width: `${activeRecord.grammarScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Pronunciation Slider */}
                      <div className="bg-white/50 border border-slate-100 rounded-2xl p-3.5 shadow-sm">
                        <div className="flex items-center justify-between font-semibold mb-1 w-full text-xs">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 inline-block animate-pulse"></span>
                            উচ্চারণ ও স্পষ্টতা (Pronunciation Clarity)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getScoreColor(activeRecord.pronunciationScore)}`}>
                            {activeRecord.pronunciationScore}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${getPercentageBarColor(activeRecord.pronunciationScore)}`}
                            style={{ width: `${activeRecord.pronunciationScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text feedbacks */}
                  <div className="flex flex-col gap-4">
                    {/* Overall review card */}
                    <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent rounded-2xl p-4 border border-blue-100/50 shadow-sm text-left">
                      <h4 className="text-xxs font-bold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>🌟 সামগ্রিক পর্যালোচনা (Overall Review)</span>
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                        {activeRecord.overallFeedback}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {/* Spoken reviewer paragraph */}
                      <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/50 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-blue-500" />
                            <span>🎙️ উচ্চারণ ও সাবলীলতা (Fluency & Clarity Tips)</span>
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {activeRecord.spokenReview}
                          </p>
                        </div>
                      </div>

                      {/* Practice reviewer paragraph */}
                      <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/50 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                            <span>📈 কথোপকথনের অনুশীলন (Practice & Engagement)</span>
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {activeRecord.practiceReview}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Learning points checklist cards */}
                    {activeRecord.learningPoints && activeRecord.learningPoints.length > 0 && (
                      <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100/40 text-left">
                        <h4 className="text-xxs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Sparkle className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span>💡 গুরুত্বপূর্ণ শিক্ষণীয় পয়েন্ট (Key Achievements & Tips)</span>
                        </h4>
                        <ul className="flex flex-col gap-2">
                          {activeRecord.learningPoints.map((point: string, idx: number) => (
                            <li key={idx} className="text-xs text-slate-700 font-semibold flex items-start gap-2">
                              <span className="text-amber-500 shrink-0 select-none mt-0.5">✦</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
