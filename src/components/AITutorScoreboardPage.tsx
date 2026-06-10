import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { 
  Award, ArrowLeft, Loader, CheckCircle2, Trophy, Clock, Target, Calendar, 
  FileText, Share2, Copy, Check, X, AlertTriangle, Lightbulb, ArrowRight,
  BookOpen, MessageSquare, Play, Sparkles, RefreshCw, Star, ShieldCheck, CheckSquare
} from "lucide-react";
import Markdown from "react-markdown";
import { GRAMMAR_TOPICS } from "../lib/grammarTopics";
import { AILessonModal } from "./AILessonModal";
import { LiveSessionInteraction } from "./LiveSessionInteraction";

export const AITutorScoreboardPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [scores, setScores] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalTopic, setEvalTopic] = useState<string | null>(null);
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<string | null>(null);

  // Practice Room Toggles & States
  const [activeTab, setActiveTab] = useState<'timeline' | 'history'>('timeline');
  const [activePracticeTopic, setActivePracticeTopic] = useState<string | null>(null);
  const [practicePdfContent, setPracticePdfContent] = useState<string>("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [practiceTranscript, setPracticeTranscript] = useState<any[]>([]);
  const [practiceResult, setPracticeResult] = useState<any | null>(null);
  const [isSubmittingPractice, setIsSubmittingPractice] = useState(false);
  const [showPdfReaderOnly, setShowPdfReaderOnly] = useState<string | null>(null);
  const [showPracticeInstructions, setShowPracticeInstructions] = useState(false);

  const handlePracticeTranscript = (text: string, isModel: boolean, final: boolean) => {
    if (final && text.trim()) {
      setPracticeTranscript(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === (isModel ? 'ai' : 'user') && lastMsg.text === text) {
           return prev;
        }
        return [...prev, { role: isModel ? 'ai' : 'user', text }];
      });
    }
  };

  // States for Sharing
  const [sharingScore, setSharingScore] = useState<any | null>(null);
  const [shareText, setShareText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePostToSocialHub = async () => {
    if (!user) {
      setPostError("Please log in to share to the Social Hub community feed.");
      return;
    }
    
    setIsPosting(true);
    setPostError(null);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          content: shareText
        })
      });
      
      if (res.ok) {
        setPostSuccess(true);
        setTimeout(() => {
          setPostSuccess(false);
          setSharingScore(null);
          navigate('/social');
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setPostError(data.error || "Failed to post to Social Hub.");
      }
    } catch (error) {
      console.error("Failed to post:", error);
      setPostError("An error occurred while posting.");
    } finally {
      setIsPosting(false);
    }
  };

  const fetchPdfs = async () => {
    try {
      const res = await fetch('/api/pdf/list', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPdfs(data.pdfs || []);
      }
    } catch (e) {
      console.error("Error fetching PDFs:", e);
    }
  };

  const fetchScores = async (guestEvalData?: any, topicStr?: string | null) => {
    try {
      const res = await fetch('/api/ai/teacher/scores', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        let scoresList = data.scores || [];
        
        if (guestEvalData) {
          const normalizedTopic = topicStr ? topicStr.replace(/[-_]/g, ' ').toLowerCase() : "";
          const alreadyInList = scoresList.some((s: any) => {
            const sTopicNormalized = (s.topic || "").replace(/[-_]/g, ' ').toLowerCase();
            return sTopicNormalized === normalizedTopic && s.score === guestEvalData.score;
          });
          
          if (!alreadyInList) {
            scoresList = [{
              topic: topicStr || "Recent Session",
              score: guestEvalData.score,
              feedback: guestEvalData.feedback,
              mistakes: guestEvalData.mistakes || [],
              createdAt: new Date().toISOString()
            }, ...scoresList];
          }
        }
        
        setScores(scoresList);
      }
    } catch (e) {}
  };

  const handlePendingEvaluation = async () => {
    try {
      const logsStr = sessionStorage.getItem("lastAITutorLogs");
      const topicStr = sessionStorage.getItem("lastAITutorTopic");
      
      if (logsStr && topicStr) {
        const logs = JSON.parse(logsStr);
        if (logs.length > 0) {
          setIsEvaluating(true);
          setEvalTopic(topicStr);
          
          const res = await fetch('/api/ai/teacher/evaluate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
              topic: topicStr,
              messages: logs
            })
          });
          if (res.ok) {
            const data = await res.json();
            return data;
          }
        }
      }
    } catch (e) {
      // Suppress internally
    } finally {
      sessionStorage.removeItem("lastAITutorLogs");
      sessionStorage.removeItem("lastAITutorTopic");
      sessionStorage.removeItem("lastAITutorDuration");
      setIsEvaluating(false);
      setEvalTopic(null);
    }
    return null;
  };

  useEffect(() => {
    const initData = async () => {
      const topic = sessionStorage.getItem("lastAITutorTopic");
      const evalData = await handlePendingEvaluation();
      await fetchScores(evalData, topic);
      await fetchPdfs();
    };
    initData();
  }, [user?.username]);

  // Initiate PDF Practice
  const handleStartPractice = async (topicName: string) => {
    setActivePracticeTopic(topicName);
    setPracticeResult(null);
    setPracticeTranscript([]);
    setIsLoadingPdf(true);
    setPracticePdfContent("");
    
    try {
      const res = await fetch(`/api/pdf/get?topic=${encodeURIComponent(topicName)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pdf) {
          setPracticePdfContent(data.pdf.pdfMarkdown);
        }
      }
    } catch (e) {
      console.error("Error fetching or pre-generating PDF:", e);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Submit and grade the PDF practice session
  const handleSubmitPracticeSession = async (isExhausted: boolean = false) => {
    if (isExhausted) {
      // Just close out the practice immediately without evaluating
      setActivePracticeTopic(null);
      setPracticeTranscript([]);
      return;
    }
    if (practiceTranscript.length === 0) {
      alert("Please say something or type to practice with your tutor first!");
      return;
    }
    
    setIsSubmittingPractice(true);
    try {
      const evalRes = await fetch('/api/ai/teacher/evaluate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          topic: activePracticeTopic,
          messages: practiceTranscript
        })
      });
      
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        
        // Save score as PDF Practice Score
        const submitRes = await fetch('/api/pdf/submit-practice', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            topic: activePracticeTopic,
            score: evalData.score
          })
        });
        
        if (submitRes.ok) {
          setPracticeResult({
            score: evalData.score,
            feedback: evalData.feedback,
            mistakes: evalData.mistakes || []
          });
          
          // Refresh list of scores & pdf practice records
          await fetchScores();
          await fetchPdfs();
        }
      }
    } catch (e) {
      console.error("Error evaluating practice session:", e);
    } finally {
      setIsSubmittingPractice(false);
    }
  };

  const handleGeneratePdfOnDemand = async (topicName: string) => {
    try {
      setIsLoadingPdf(true);
      const res = await fetch(`/api/pdf/get?topic=${encodeURIComponent(topicName)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        await fetchPdfs();
      }
    } catch (e) {
      console.error("Error generating pdf on demand:", e);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleShowPdfReader = async (topicName: string) => {
    setShowPdfReaderOnly(topicName);
    setIsLoadingPdf(true);
    setPracticePdfContent("");
    try {
      const res = await fetch(`/api/pdf/get?topic=${encodeURIComponent(topicName)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pdf) {
          setPracticePdfContent(data.pdf.pdfMarkdown);
        }
      }
    } catch (e) {
      console.error("Error loading PDF guide:", e);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Resolve timeline sequential guides: "What comes after this"
  const chronologicalScores = [...scores].sort((a, b) => {
    const timeA = a.timestamp ? Number(a.timestamp) : new Date(a.created_at || a.createdAt || 0).getTime();
    const timeB = b.timestamp ? Number(b.timestamp) : new Date(b.created_at || b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  let isPrevCompleted = true;
  const sequencedTopics = chronologicalScores.map((s, idx) => {
    const matchingPdf = pdfs.find(p => p.topic === s.topic);
    const highestPracticeScore = matchingPdf ? Math.max(matchingPdf.highestPracticeScore || 0, 0) : 0;
    const isCompleted = highestPracticeScore >= 80;
    
    // Unlocked rule: First item is always unlocked. The rest is unlocked if previous completed PDF score >= 80%
    const isUnlocked = isPrevCompleted;
    isPrevCompleted = isCompleted;

    return {
      ...s,
      matchingPdf,
      highestPracticeScore,
      isCompleted,
      isUnlocked,
      sequenceIndex: idx + 1
    };
  });

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-905 dark:text-slate-100 font-sans">
      
      {/* Header */}
      <div className="w-full bg-white dark:bg-[#111936] border-b border-slate-200 dark:border-emerald-500/20 px-4 md:px-6 py-4 flex flex-row items-center justify-between shrink-0 shadow-sm dark:shadow-xl sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ai-tutor')} className="p-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
          <div>
            <h1 className="text-base md:text-xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400">
              Grammar Practice Scoreboard
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Auto-generated custom guides & sequential training</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{user.username}</span>
            </div>
          )}
          <Link to="/ai-tutor" className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition">
             Practice New Topics
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="w-full bg-slate-100/60 dark:bg-[#0c1226] border-b border-slate-200 dark:border-slate-800/50 p-2 flex shrink-0 justify-center gap-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-650 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sequential Practice Guides</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-650 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/5'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>General Class History</span>
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 mb-16">
        
        {isEvaluating && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-500/30 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-center animate-pulse">
            <Loader className="w-8 h-8 text-emerald-500 dark:text-emerald-400 animate-spin mb-3" />
            <h3 className="text-sm font-bold text-emerald-800 dark:text-white mb-1">Evaluating recent session...</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-300">Evaluating your performance for "{evalTopic}". Please wait.</p>
          </div>
        )}

        {/* 1. TIMELINE / SEQUENTIAL SECTION */}
        {activeTab === 'timeline' && (
          <div className="flex flex-col gap-6 pb-12">
            
            {/* Timeline Info Banner */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/5 to-transparent border border-emerald-500/25 rounded-2xl p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">১-বাই-১ ক্রমানুসারী গাইড (Continuous 1-by-1 Guidance)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  আপনার ক্লাসের আলোচনার ভিত্তিতে প্রতিটি টপিকে একটি করে <strong>custom PDF Practice Guide</strong> তৈরি করা হয়েছে। 
                  পিডিএফ প্র্যাকটিস-এ <strong>৮০% বা তার বেশি</strong> মার্কস স্কোর করলে পরবর্তী টপিকটি স্বয়ংক্রিয়ভাবে আনলক হবে। ৮০% না হওয়া পর্যন্ত ক্রমাগত প্র্যাকটিস করার সুযোগ পাবেন!
                </p>
              </div>
            </div>

            {sequencedTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">No Sequential Guides Available</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                  প্রথমে AI Tutor-এর সাথে মেইন ক্লাস সম্পন্ন করুন। তাহলে সেটির উপর ভিত্তি করে প্র্যাকটিস গাইড তৈরি হবে।
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 md:pl-8 flex flex-col gap-8">
                {sequencedTopics.map((s, idx) => {
                  const unlocked = s.isUnlocked;
                  const completed = s.isCompleted;

                  return (
                    <div key={idx} className={`relative ${!unlocked ? 'opacity-50' : ''}`}>
                      
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[35px] md:-left-[43px] top-1.5 w-6 h-6 md:w-8 md:h-8 rounded-full border-4 flex items-center justify-center ${
                        completed 
                          ? 'bg-emerald-500 text-white border-emerald-100 dark:border-emerald-950/50' 
                          : unlocked 
                            ? 'bg-amber-500 text-white border-amber-100 dark:border-amber-950/50 animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-800 border-slate-100 dark:border-slate-900 text-slate-400'
                      }`}>
                        {completed ? (
                          <Check className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3]" />
                        ) : (
                          <span className="text-[10px] md:text-xs font-black">{s.sequenceIndex}</span>
                        )}
                      </div>

                      {/* Topic Card */}
                      <div className={`bg-white dark:bg-[#111936]/50 border rounded-3xl p-5 shadow-sm transition-all ${
                        completed 
                          ? 'border-emerald-500/20 dark:border-emerald-500/10' 
                          : unlocked 
                            ? 'border-amber-500/30 dark:border-emerald-500/35 bg-gradient-to-b from-white to-amber-500/[0.01]' 
                            : 'border-slate-200 dark:border-slate-850'
                      }`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                completed 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-400'
                                  : unlocked 
                                    ? 'bg-amber-150 text-amber-800 dark:bg-amber-950/35 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-550 dark:bg-slate-900 dark:text-slate-500'
                              }`}>
                                {completed ? 'Mastered (৮০%+ সম্পন্ন)' : unlocked ? 'Active Practice' : 'Locked (লকড)'}
                              </span>
                              <span className="text-[10px] text-slate-400">Class Score: {String(s.score).split('/')[0]}/100</span>
                            </div>

                            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mt-2">{s.topic}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {completed 
                                ? `অভিনন্দন! আপনি প্র্যাকটিসে সর্বোচ্চ ${s.highestPracticeScore}% স্কোর পেয়েছেন।`
                                : unlocked 
                                  ? `এই পিডিএফ ফাইলের প্র্যাকটিসে ৮০% বেশি স্কোর তুলুন। বর্তমান সেরা স্কোর: ${s.highestPracticeScore}%`
                                  : 'পূর্ববর্তী পিডিএফ প্র্যাকটিসে ৮০% স্কোর পেয়ে ক্লাসটি আনলক করুন।'
                              }
                            </p>
                          </div>

                          {/* Interactive Choices for Unlocked PDF Practice */}
                          <div className="flex items-center gap-2 self-start md:self-center">
                            {unlocked ? (
                              <>
                                <button
                                  onClick={() => handleShowPdfReader(s.topic)}
                                  className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-150 dark:bg-indigo-550/10 dark:hover:bg-indigo-550/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-550/20 text-xs font-black flex items-center gap-1.5 transition-all"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>Read Guide</span>
                                </button>

                                <button
                                  onClick={() => handleStartPractice(s.topic)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all animate-bounce"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Practice on PDF</span>
                                </button>
                              </>
                            ) : (
                              <div className="text-xs text-slate-400 dark:text-slate-550 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Complete previous to start</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Embed brief score logs */}
                        {s.highestPracticeScore > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
                            <span className="text-slate-400">PDF Practice History:</span>
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-md ${s.highestPracticeScore >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'}`}>
                                Best Track: {s.highestPracticeScore}%
                              </span>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* 2. GENERAL CLASS HISTORY SECTION */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-4 pb-12">
            {scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">No Records Yet</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">Practice grammar topics to build your scoreboard.</p>
              </div>
            ) : (
              scores.map((s, idx) => {
                const pdfRecord = pdfs.find(p => p.topic === s.topic);
                const hasPdf = !!pdfRecord;

                return (
                  <div key={idx} className="bg-white dark:bg-[#16224f]/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 rounded-3xl p-5 md:p-6 transition-colors shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#0d1326] border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-600 dark:text-emerald-500 shrink-0 shadow-inner">
                          <span className="text-xs font-black leading-none">{s.score}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-slate-500 mt-1">Score</span>
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100">{s.topic}</h3>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {s.timestamp ? new Date(s.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : s.created_at ? new Date(s.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {hasPdf ? (
                          <>
                            <button
                              onClick={() => handleShowPdfReader(s.topic)}
                              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 transition-all font-bold flex items-center gap-1.5 text-xs"
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>Show Guide</span>
                            </button>
                            <button
                              onClick={() => handleStartPractice(s.topic)}
                              className="p-2 rounded-xl bg-emerald-55 border border-emerald-100 dark:border-emerald-950 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 transition-all font-bold flex items-center gap-1.5 text-xs"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Practice PDF</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGeneratePdfOnDemand(s.topic)}
                            disabled={isLoadingPdf}
                            className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 transition-all font-bold flex items-center gap-1 text-xs"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPdf ? 'animate-spin' : ''}`} />
                            <span>Create Study PDF</span>
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSharingScore(s);
                            setShareText(`🎉 I scored ${String(s.score).split('/')[0]}/100 practicing "${s.topic}" on Imperial English Coach! 🏆🗣️\n\nReally happy with my progress in learning grammar! Let's practice English together with AI! 🇧🇩✨\n\n#ImperialEnglishCoach #EnglishLearning #SocialHub`);
                            setPostError(null);
                            setPostSuccess(false);
                          }}
                          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 text-amber-700 dark:text-amber-450 border border-amber-200 dark:border-amber-500/30 transition-all font-bold flex items-center gap-1.5 text-xs"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#0c1222]/80 border border-slate-200 dark:border-white/5 rounded-2xl p-4 mt-2">
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5"><Target className="w-3 h-3 text-emerald-500" /> Assessment Feedback</h4>
                      <div className="prose prose-emerald dark:prose-invert max-w-none text-xs md:text-sm prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-emerald-900 dark:prose-headings:text-emerald-100">
                        <Markdown>{s.feedback || "Good job! Keep practicing."}</Markdown>
                      </div>
                    </div>

                    {/* Top 3 Common Mistakes Section */}
                    {(() => {
                      let parsedMistakes: any[] = [];
                      if (s.mistakes) {
                        try {
                          parsedMistakes = typeof s.mistakes === 'string' ? JSON.parse(s.mistakes) : s.mistakes;
                        } catch (err) {
                          console.error("Failed to parse mistakes:", err);
                        }
                      }

                      if (!Array.isArray(parsedMistakes) || parsedMistakes.length === 0) return null;

                      return (
                        <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-500/10 rounded-2xl p-4 mt-3">
                          <h4 className="text-[10px] uppercase tracking-widest font-black text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Grammatical Mistakes & Corrections
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {parsedMistakes.slice(0, 3).map((item: any, mIdx: number) => (
                              <div key={mIdx} className="bg-white/80 dark:bg-slate-900/60 border border-rose-500/10 dark:border-rose-500/5 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                                <div>
                                  <div className="mb-2">
                                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Mistake</span>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 line-through mt-1 italic">
                                      "{item.mistake}"
                                    </p>
                                  </div>
                                  <div className="mb-2">
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Correct</span>
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                      "{item.correction}"
                                    </p>
                                  </div>
                                  {item.explanation && (
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-[#070b14]/50 p-2 rounded-lg border border-slate-100 dark:border-white/5 mb-3 flex items-start gap-1">
                                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                      <span>{item.explanation}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* 3. COHESIVE SPLITSCREEN PDF READER & VOICE TUTOR ROOM */}
      {activePracticeTopic && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col z-50 animate-in fade-in duration-200">
          
          {/* Practice Room Header */}
          <div className="w-full bg-slate-900 border-b border-white/10 px-4 py-2.5 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <h2 className="text-xs md:text-sm font-black text-white">
                  PDF Practice Studio
                </h2>
                <p className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 border-t sm:border-t-0 sm:border-l border-slate-700/80 sm:pt-0 sm:pl-3">
                  Topic: {activePracticeTopic}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setActivePracticeTopic(null)}
              className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Column: Comprehensive PDF Markdown Reader */}
            <div className="flex-1 md:flex-[1.4] border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col bg-slate-900/50 overflow-hidden">
              <div className="flex items-center gap-2 mb-2.5 shrink-0">
                <FileText className="text-emerald-400 w-3.5 h-3.5 shrink-0" />
                <h3 className="text-xs font-extrabold text-slate-400">
                  পিডিএফ রিডার
                </h3>
              </div>

              {isLoadingPdf ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Loader className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
                  <p className="text-[11px]">Preparing PDF study guide...</p>
                </div>
              ) : (
                <div className="flex-1 prose prose-p:leading-relaxed prose-invert text-slate-200 text-xs bg-slate-950/40 p-3 rounded-xl border border-white/5 overflow-y-auto font-sans leading-relaxed selection:bg-emerald-500/30 animate-in fade-in duration-200">
                  <Markdown>{practicePdfContent || "# No guide custom content loaded yet."}</Markdown>
                </div>
              )}
            </div>

            {/* Right Column: Dynamic Live Voice/Text Tutoring Coach */}
            <div className="flex-1 md:flex-[0.9] p-4 flex flex-col bg-slate-950 overflow-hidden">
              
              {!practiceResult ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden justify-between">
                  {/* Compact Header for Buddy with Guidelines Toggle */}
                  <div className="flex items-center justify-between gap-2 mb-2 bg-slate-900/60 p-2 rounded-xl border border-white/5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="text-emerald-400 w-3.5 h-3.5 shrink-0" />
                      <h3 className="text-[11px] font-black text-slate-300">
                        AI Buddy Practice Coach (ক্লাস প্র্যাকটিস)
                      </h3>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setShowPracticeInstructions(prev => !prev)}
                      className="text-[9px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-md hover:bg-emerald-500/15 transition cursor-pointer"
                    >
                      {showPracticeInstructions ? "Hide • বন্ধ করুন" : "💡 Guide • নির্দেশিকা"}
                    </button>
                  </div>

                  {/* Wrapper layer for Live Buddy with collapsible Guidelines Overlay on top */}
                  <div className="flex-1 min-h-0 bg-slate-900/30 rounded-xl border border-white/5 relative p-2.5 flex flex-col overflow-hidden">
                    {showPracticeInstructions && (
                      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-30 p-4 flex flex-col justify-between rounded-xl animate-in fade-in zoom-in-95 duration-100 border border-emerald-500/20 shadow-2xl">
                        <div className="flex-1 overflow-y-auto pr-1">
                          <h4 className="text-xs font-black text-emerald-400 mb-2 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            কি কি করতে হবে? (Class Practice Instructions)
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-medium">
                            ১. AI Buddy আপনার পিডিএফ গাইড থেকে একের পর এক প্রশ্ন ও উত্তরের কুইজ ধরবে।
                            <br /><br />
                            ২. উত্তর দিতে সরাসরি মাইক্রোফোন অন করুন ও মুখে ইংলিশে বলুন, অথবা নিচে চ্যাট করুন।
                            <br /><br />
                            ৩. প্র্যাকটিস শেষ হলে জেমিনির জন্য স্টপ কনভারসেশন ও কুইজ স্কোর সাবমিট করুন।
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPracticeInstructions(false)}
                          className="mt-3 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wide rounded-lg transition"
                        >
                          Got It • বুঝতে পেরেছি
                        </button>
                      </div>
                    )}

                    <LiveSessionInteraction
                      selectedTutor="Buddy"
                      scenarioId="pdf"
                      pdfStoreId={activePracticeTopic}
                      selectedVoice="Zephyr"
                      speakSlowly={false}
                      isMinimal={true}
                      onTranscript={handlePracticeTranscript}
                      onSubmitPractice={handleSubmitPracticeSession}
                      isSubmittingPractice={isSubmittingPractice}
                      hasTranscript={practiceTranscript.length > 0}
                    />
                  </div>

                  {/* Submission Control is fully integrated in LiveSessionInteraction, just cancel practice link */}
                  <div className="mt-2.5 pt-1.5 text-center shrink-0">
                    <button
                      onClick={() => setActivePracticeTopic(null)}
                      className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 transition"
                    >
                      Cancel Practice
                    </button>
                  </div>
                </div>
              ) : (
                /* PDF Practice Assessment Outcome Screen */
                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto py-4 overflow-y-auto">
                  
                  {/* Confetti icon or target score evaluation feedback */}
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${practiceResult.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                      <Trophy className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-black text-white mt-3">
                      {practiceResult.score >= 80 ? '✨ Topic Mastered! (টপিক সম্পন্ন)' : 'Keep Practicing! (আবার চেষ্টা করুন)'}
                    </h3>
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mt-1">
                      Score: {practiceResult.score}%
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Target to achieve completed status: 80%</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-left">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-1">Practice Coach Evaluation Note</h4>
                    <div className="text-xs leading-relaxed text-slate-200 pr-2">
                      <Markdown>{practiceResult.feedback || "Good job! Keep learning!"}</Markdown>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="flex flex-col gap-2">
                    {practiceResult.score < 80 ? (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-[11px] font-semibold flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>আপনাকে এই পিডিএফ ফাইলে পুনরায় প্র্যাকটিস শেষ করতে হবে যতক্ষণ না অব্দি আপনার স্কোর ৮০% প্লাস স্পর্শ করবে।</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-semibold flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>অসাধারণ! আপনি এই পিডিএফ সফলভাবে আয়ত্ত করেছেন এবং পরবর্তী টপিকটি আনলক হয়ে গিয়েছে!</span>
                      </div>
                    )}

                    <div className="flex flex-row gap-2 mt-2">
                      <button
                        onClick={() => {
                          setPracticeResult(null);
                          setPracticeTranscript([]);
                        }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition"
                      >
                        Try Practice Again
                      </button>

                      <button
                        onClick={() => setActivePracticeTopic(null)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
                      >
                        Close & Refresh Room
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* Show PDF Reader Only Modal */}
      {showPdfReaderOnly && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#111936] border border-white/10 rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col text-white overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-white">Custom Study Guide (পিডিএফ গাইড)</h3>
                  <p className="text-[10px] text-slate-400 capitalize">{showPdfReaderOnly}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPdfReaderOnly(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {isLoadingPdf ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Loader className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-xs text-slate-450 mt-2">Loading study materials...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-emerald text-slate-200 text-xs md:text-sm leading-relaxed max-w-none">
                  <Markdown>{practicePdfContent || "# No content preloaded."}</Markdown>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-slate-950/40 text-right">
              <button
                onClick={() => {
                  setShowPdfReaderOnly(null);
                  handleStartPractice(showPdfReaderOnly);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition-all"
              >
                Start practicing with Coach now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingScore && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#111936] border border-slate-200 dark:border-emerald-500/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSharingScore(null)} 
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Share Session Summary</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate a post snippet for the Social Hub</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pre-formatted Post Snippet</label>
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                rows={5}
                className="w-full text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#0c1222]/80 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs leading-relaxed outline-none focus:border-amber-500/30 dark:focus:border-amber-500/30 transition resize-none font-sans"
              />
            </div>

            {postError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-500/10">
                {postError}
              </div>
            )}

            {postSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/10">
                🎉 Successfully posted to Social Hub! Redirecting...
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyText}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePostToSocialHub}
                disabled={isPosting || postSuccess}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
              >
                {isPosting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Post to Social Hub</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal Overlay for related study/practice */}
      {selectedTopicForModal && (() => {
        const sect = GRAMMAR_TOPICS.find(t => t.name === selectedTopicForModal)?.section;
        const modalSection = sect === 'Learner Focus' ? 'Learner Focus' : 'Grammar';
        return (
          <AILessonModal 
            topic={selectedTopicForModal}
            section={modalSection}
            onClose={() => setSelectedTopicForModal(null)}
          />
        );
      })()}
    </div>
  );
};
