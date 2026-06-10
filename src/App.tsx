import React, { useState, useEffect, useRef, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { LiveSessionInteraction } from "./components/LiveSessionInteraction";
import { ScenarioSlickSelector } from "./components/ScenarioSlickSelector";
import { LimitExhaustedView } from "./components/LimitExhaustedView";
import { AdminPanel } from "./components/AdminPanel";
import { PerformanceHub, PerformanceRecord } from "./components/PerformanceHub";
import { PremiumPortal } from "./components/PremiumPortal";
import { SocialHub } from "./components/SocialHub";
import { AITutorPage } from "./components/AITutorPage";
import { CompetitionHub } from "./components/CompetitionHub";
import { SidebarLeaderboard } from "./components/SidebarLeaderboard";
import { LeaderboardPage } from "./components/LeaderboardPage";
import { AILiveTutorPage } from "./components/AILiveTutorPage";
import { AITutorScoreboardPage } from "./components/AITutorScoreboardPage";
import { AITutorTextPage } from "./components/AITutorTextPage";
import { LessonGuidePrintView } from "./components/LessonGuidePrintView";
import { HomePage } from "./components/HomePage";
import { ProficiencyTest } from "./components/ProficiencyTest";
import { LearningPlanPortal } from "./components/LearningPlanPortal";
import { MyCourse } from "./components/MyCourse";
import { CourseRoom } from "./components/CourseRoom";
import { ThemeCustomizer } from "./components/ThemeCustomizer";
import { TransitionSettings, TRANSITION_PRESETS, TransitionType } from "./components/TransitionSettings";
import { motion, AnimatePresence } from 'motion/react';
import { MicState } from "./types";
import { AuthContext } from "./AuthContext";
import { AuthModal } from "./components/AuthModal";
import { BuyPremium } from "./components/BuyPremium";
import { CreditPricingCalculator } from "./components/CreditPricingCalculator";
import { PaymentHistory } from "./components/PaymentHistory";
import { MyCreditCosts } from "./components/MyCreditCosts";
import { MessageSquare, AlertCircle, Lock, X, Home, LayoutDashboard, Map, MapPin, Menu, Sun, Moon, User, CreditCard, Trophy, Award, ShoppingBag, GraduationCap, Zap, BookOpen, BarChart2, Sliders, Sparkles, Layers, ChevronDown } from "lucide-react";

function Navigation({ onAuthClick, onLogout, user, anonTimeLeft }: any) {
  const isDarkMode = true;
  const location = useLocation();
  const activeTimeLeft = user ? user.timeLeft : anonTimeLeft;
  const minutesLeft = Math.floor(activeTimeLeft / 60);
  const secondsLeft = activeTimeLeft % 60;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on location changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Main Bar (Universal Container, handles desktop layout and base outer frame) */}
      <nav className="glass-panel sticky top-0 z-[45] px-4 md:px-8 py-4 border-b border-white/10 shadow-sm flex items-center justify-between transition-all">
        
        {/* Brand and Desktop Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <span className="font-display font-extrabold text-[13px] sm:text-base md:text-lg bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white px-2.5 sm:px-4 py-1.5 rounded-lg shadow-sm transition-colors tracking-tight">
              Spoken Guide
            </span>
          </Link>
          
          {/* Desktop Only Navigation */}
          <div className="hidden md:flex items-center gap-1.5">
             <Link to="/" className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all duration-200 flex items-center gap-2 ${location.pathname === '/' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
               <Home className="w-3.5 h-3.5"/> Home
             </Link>
             <Link to="/ai-tutor" className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all duration-200 flex items-center gap-2 ${location.pathname === '/ai-tutor' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
               <GraduationCap className="w-3.5 h-3.5"/> AI Tutor
             </Link>
             <Link to="/my-course" className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all duration-200 flex items-center gap-2 ${location.pathname === '/my-course' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
               <BookOpen className="w-3.5 h-3.5"/> My Course
              </Link>
              <Link to="/learning-plan" className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all duration-200 flex items-center gap-2 ${location.pathname === '/learning-plan' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
                <Map className="w-3.5 h-3.5"/> My Course Plan
             </Link>
             <Link to="/social" className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all duration-200 flex items-center gap-2 ${location.pathname === '/social' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
               <MessageSquare className="w-3.5 h-3.5"/> Community
             </Link>

             {/* More Dropdown */}
             <div className="relative group">
               <button className="px-3 py-1.5 font-bold text-xs rounded-xl transition-all duration-200 flex items-center gap-1 text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 outline-none">
                 More <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform"/>
               </button>
               <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 min-w-[180px] flex flex-col gap-1">
                   <Link to="/leaderboards" className={`px-3 py-2 font-bold text-xs rounded-lg transition-all duration-200 flex items-center gap-2 ${location.pathname === '/leaderboards' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
                     <Trophy className="w-3.5 h-3.5"/> Leaderboards
                   </Link>
                   <Link to="/competitions" className={`px-3 py-2 font-bold text-xs rounded-lg transition-all duration-200 flex items-center gap-2 ${location.pathname === '/competitions' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
                     <Trophy className="w-3.5 h-3.5"/> Competitions
                   </Link>
                   <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-1"></div>
                   <Link to="/customize" className={`px-3 py-2 font-bold text-xs rounded-lg transition-all duration-200 flex items-center gap-2 ${location.pathname === '/customize' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'}`}>
                     <Sliders className="w-3.5 h-3.5 text-indigo-500"/> Wave Settings
                   </Link>
                   <Link to="/buy-premium" className={`px-3 py-2 font-bold text-xs rounded-lg transition-all duration-200 flex items-center gap-2 ${location.pathname === '/buy-premium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'text-amber-600 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-900/20'}`}>
                     <CreditCard className="w-3.5 h-3.5"/> Get Premium
                   </Link>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Global Controls & Mobile Trigger */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Time Limit Pill - Visible everywhere */}
          <Link to="/credit-costs" title="View Credit Costs" className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition hover:opacity-80 active:scale-95 ${activeTimeLeft === 0 ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0"></span>
            Credits: {activeTimeLeft}
          </Link>

          {/* Desktop Right Settings Toolbar */}
          <div className="hidden md:flex items-center gap-3">
            
            {!user ? (
              <button onClick={onAuthClick} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all">
                Login / Signup
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden lg:inline">
                  Hi, {user.username || "Learner"}
                </span>
                <button onClick={onLogout} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer transition">
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Hamburger Mobile Menu Trigger */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex md:hidden p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 text-slate-600 dark:text-slate-300"
            aria-label="Open menu options"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Floating Responsive Mobile Sidebar & Overlay Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] md:hidden flex justify-end">
            {/* Semi-transparent Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" 
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar Panel Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-[#111827] text-slate-800 dark:text-slate-100 p-6 flex flex-col justify-between shadow-2xl z-20 overflow-y-auto"
            >
              <div>
                {/* Header inside Panel */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                    SG
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-emerald-600 dark:text-emerald-400 tracking-tight">Spoken Guide</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Your Personal AI Voice Coach</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-full text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Learning Level / Account Status Banner */}
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 text-white font-extrabold rounded-full flex items-center justify-center text-sm shadow-inner">
                      {(user.username || "L").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.username || "Profile User"}</h4>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{user.isPremium ? "🏆 Premium Buddy" : "⭐ Free Account"}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Anonymous Practice</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Login to access top leaders, save performance score histories, and unlock specialized practice tools!
                    </p>
                    <button 
                      onClick={() => { setIsSidebarOpen(false); onAuthClick(); }}
                      className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Login or Register
                    </button>
                  </div>
                )}
              </div>

              {/* Nav Options Group */}
              <div className="space-y-1">
                <span className="block text-[10px] font-black tracking-wider uppercase text-slate-400 mb-2 px-3">
                  Core Navigations
                </span>
                
                <Link 
                  to="/" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <Home className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Home</p>
                  </div>
                </Link>

                <Link 
                  to="/ai-tutor" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/ai-tutor' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">AI Grammar Tutor</p>
                  </div>
                </Link>

                <Link 
                  to="/leaderboards" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/leaderboards' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <Trophy className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Leaderboards</p>
                  </div>
                </Link>

                <Link 
                  to="/my-course" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/my-course' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">My Course</p>
                  </div>
                </Link>

                <Link 
                  to="/learning-plan" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/learning-plan' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Map className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">My Course Plan</p>
                  </div>
                </Link>

                <Link 
                  to="/social" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/social' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 hover:rotate-6 transition-transform" />
                  <div>
                    <p className="font-bold">Community</p>
                  </div>
                </Link>

                <Link 
                  to="/performance-hub" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/performance-hub' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <BarChart2 className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Performance Hub</p>
                  </div>
                </Link>

                <Link 
                  to="/ai-tutor-scoreboard" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/ai-tutor-scoreboard' ? 'bg-indigo-100/85 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-500/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Award className="w-4 h-4 shrink-0 text-indigo-500" />
                  <div>
                    <p className="font-bold">Scores & Records</p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">View tutor feedback</p>
                  </div>
                </Link>

                <Link 
                  to="/competitions" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/competitions' ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <Award className="w-4 h-4 shrink-0 text-indigo-500" />
                  <div>
                    <p className="font-bold">Competitions</p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">School, district & class level</p>
                  </div>
                </Link>

                <Link 
                  to="/buy-premium" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/buy-premium' ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
                  <div>
                    <p className="font-bold text-amber-600 dark:text-amber-400 font-display">Buy Premium</p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Upgrade for unlimited access</p>
                  </div>
                </Link>

                <Link 
                  to="/transition-settings" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/transition-settings' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Layers className="w-4 h-4 shrink-0 text-indigo-400" />
                  <div>
                    <p className="font-bold">Transitions</p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Page Navigation Styles</p>
                  </div>
                </Link>

                <Link 
                  to="/customize" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/customize' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Sliders className="w-4 h-4 shrink-0 text-indigo-500" />
                  <div>
                    <p className="font-bold">Wave Settings</p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">কালার ও শান্ত জলতরঙ্গ কাস্টমাইজ করুন</p>
                  </div>
                </Link>

                <Link 
                  to="/my-purchases" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150 ${location.pathname === '/my-purchases' ? 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">My Purchases</p>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Track active plans & limits</p>
                  </div>
                </Link>
              </div>

              {/* Live Double Leaderboards Nested inside Sidebar */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850/60">
                <SidebarLeaderboard />
              </div>

              {/* Removed Extra Preference Controls */}
              <div className="mt-8 border-t border-slate-150 dark:border-slate-800 pt-6 space-y-3 hidden">
              </div>
            </div>

            {/* Bottom Actions inside Panel Drawer */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
              {user ? (
                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 text-center text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer"
                >
                  Sign Out Account
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onAuthClick();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Join Spoken Guide Free
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </>
  );
}

import { TouchEffect } from './components/TouchEffect';
import { CustomScrollbar } from './components/CustomScrollbar';

function AppContent() {
  const { user, login, logout, updateUsageLocally } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const [layoutPath, setLayoutPath] = useState(location.pathname);
  const [pendingScroll, setPendingScroll] = useState(false);

  useEffect(() => {
    // When navigating to a new path (PUSH or REPLACE, not POP 'history back')
    if (navigationType !== 'POP') {
      setPendingScroll(true);
    }
  }, [location.pathname, navigationType]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  const [selectedScenarioId, handleSelectScenario] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");
  const [selectedTutor, setSelectedTutor] = useState("Guide");
  const [speakSlowly, setSpeakSlowly] = useState(false);
  
  const isDarkMode = true;

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const [micState, setMicState] = useState<MicState>("ready");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [appTransition, setAppTransition] = useState<TransitionType>('slideUp');
  const [appTransitionSpeed, setAppTransitionSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');

  useEffect(() => {
    const checkTransition = () => {
      const saved = localStorage.getItem('app-transition-type') as TransitionType;
      if (saved && TRANSITION_PRESETS[saved]) setAppTransition(saved);
      
      const savedSpeed = localStorage.getItem('app-transition-speed') as 'fast' | 'normal' | 'slow';
      if (savedSpeed) setAppTransitionSpeed(savedSpeed);
    };
    checkTransition();
    window.addEventListener('app-transition-changed', checkTransition);
    return () => window.removeEventListener('app-transition-changed', checkTransition);
  }, []);

  const lastTimeUpdateObj = useRef<{ time: number }>({ time: Date.now() });
  const fullTranscriptRef = useRef<string>("");

  const [anonymousChatTime, setAnonymousChatTime] = useState(0);
  const [scenarios, setScenarios] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/scenarios')
      .then(async res => {
        if (!res.ok) {
          throw new Error('API failed with ' + res.status);
        }
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error('Failed to parse JSON: ' + text);
        }
      })
      .then(data => setScenarios(data))
      .catch(e => console.error("Failed to load scenarios in App root", e));
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('anon_reset_date');
    if (storedDate !== today) {
      localStorage.setItem('anon_reset_date', today);
      localStorage.setItem('anon_chat_time', '0');
      setAnonymousChatTime(0);
    } else {
      setAnonymousChatTime(parseInt(localStorage.getItem('anon_chat_time') || '0', 10));
    }

    const syncIpCredits = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/auth/credits/status', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.credits !== undefined) {
            if (!userRef.current) {
              const usedTime = Math.max(0, 5000 - data.credits);
              setAnonymousChatTime(usedTime);
              localStorage.setItem('anon_chat_time', usedTime.toString());
            }
          }
        }
      } catch (e) {
        console.error("Failed to sync IP credits", e);
      }
    };
    
    syncIpCredits();
  }, [user?.username]);

  const micStateRef = useRef(micState);
  useEffect(() => { micStateRef.current = micState; }, [micState]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const updateUsageLocallyRef = useRef(updateUsageLocally);
  useEffect(() => { updateUsageLocallyRef.current = updateUsageLocally; }, [updateUsageLocally]);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      if (micStateRef.current !== "ready") {
        tick++;
        if (tick >= 5) {
          tick = 0;
          const u = userRef.current;
          if (u && u.token) {
            const tokensToDeduct = 5 * 250; // 5 seconds * 250 credits/sec
            fetch('/api/auth/time/usage', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ auth: u.token, seconds: 5 })
            }).catch(e => console.error("Usage sync failed", e));
            updateUsageLocallyRef.current(tokensToDeduct, 5);
          } else {
             fetch('/api/auth/time/usage', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ seconds: 5 })
             })
             .then(async res => {
               if (!res.ok) {
                 const text = await res.text();
                 throw new Error(`Server returned status ${res.status}: ${text}`);
               }
               return res.json();
             })
             .then(data => {
               if (data && data.credits !== undefined) {
                 const usedTime = Math.max(0, 5000 - data.credits);
                 setAnonymousChatTime(usedTime);
                 localStorage.setItem('anon_chat_time', usedTime.toString());
               }
             })
             .catch(e => console.error("Anonymous usage sync failed", e));

             setAnonymousChatTime((prev) => {
               const next = prev + 1250; // 1250 credits per 5 secs
               localStorage.setItem('anon_chat_time', next.toString());
               return next;
             });
          }
        }
      } else {
        tick = 0;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const isTimeExhausted = user ? user.timeLeft === 0 : (5000 - anonymousChatTime <= 0);
  
  useEffect(() => {
      if (isTimeExhausted) {
          if (micState !== 'ready') {
              setStatusMessage("Your usage limit has been exhausted. Please recharge or upgrade.");
          }
      }
  }, [isTimeExhausted, micState]);

  const [historySummaries, setHistorySummaries] = useState<PerformanceRecord[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    const loadSummaries = async () => {
      if (user && user.token) {
        setIsSummaryLoading(true);
        try {
          const res = await fetch('/api/auth/history', {
            headers: { 'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}` }
          });
          const data = await res.json();
          if (res.ok) setHistorySummaries(data);
        } catch(e) {}
        setIsSummaryLoading(false);
      } else {
        try {
          const saved = localStorage.getItem('anon_history_summaries');
          if (saved) setHistorySummaries(JSON.parse(saved));
        } catch {}
      }
    };
    loadSummaries();
  }, [user?.username, user?.token]);

  const handleLiveTranscript = (text: string, isModel: boolean, isFinal: boolean) => {
    if (isFinal && text.trim()) {
      const prefix = isModel ? "Robot: " : "Me: ";
      fullTranscriptRef.current += prefix + text + "\n";
    }
  };

  const handleSessionEnd = async (durationSec: number, userAudioBase64?: string) => {
    if (!userAudioBase64 && fullTranscriptRef.current.trim() === "") {
        return;
    }

    setIsSummaryLoading(true);
    setStatusMessage("Please wait to see your performance. Generating your detailed fluency score and pronunciation scorecard...");
    
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && user.token ? { 'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}` } : {})
        },
        body: JSON.stringify({ 
          transcript: fullTranscriptRef.current,
          userAudio: userAudioBase64 
        })
      });
      const data = await res.json();
      
      const currentScenario = scenarios.find(s => s.id === selectedScenarioId);
      const sName = currentScenario ? (currentScenario.name || currentScenario.id) : "Website Guide Session";
      const sIcon = currentScenario ? (currentScenario.icon || "🤝") : "🤝";

      const newRecord: PerformanceRecord = {
        id: crypto.randomUUID(),
        scenarioName: sName,
        scenarioIcon: sIcon,
        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: durationSec,
        overallFeedback: data.overallFeedback || "Session complete.",
        spokenReview: data.spokenReview || "",
        practiceReview: data.practiceReview || "",
        learningPoints: data.learningPoints || [],
        fluencyScore: typeof data.fluencyScore === 'number' ? data.fluencyScore : 70,
        vocabularyScore: typeof data.vocabularyScore === 'number' ? data.vocabularyScore : 70,
        grammarScore: typeof data.grammarScore === 'number' ? data.grammarScore : 70,
        pronunciationScore: typeof data.pronunciationScore === 'number' ? data.pronunciationScore : 70
      };

      if (!user) {
        setHistorySummaries(prev => {
          const updated = [newRecord, ...prev];
          localStorage.setItem('anon_history_summaries', JSON.stringify(updated.slice(0, 10)));
          return updated;
        });
      } else {
        try {
          await fetch('/api/auth/history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`
            },
            body: JSON.stringify({ record: newRecord })
          });

          const hRes = await fetch('/api/auth/history', {
            headers: { 'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}` }
          });
          const hData = await hRes.json();
          if (hRes.ok) {
            setHistorySummaries(hData);
          }
        } catch(e) { console.error(e) }
      }
      fullTranscriptRef.current = ""; // Reset
      handleSelectScenario(null);
      setStatusMessage(`Score Card Saved! Fluency Score: ${Math.round(newRecord.fluencyScore)}`);
    } catch(e: any) {
      console.error(e);
      setStatusMessage("Failed to generate feedback.");
    } finally {
      setIsSummaryLoading(false);
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  const handleClearRecords = async () => {
    setHistorySummaries([]);
    localStorage.removeItem('anon_history_summaries');
    if (user && user.token) {
      try {
        await fetch('/api/auth/history', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}` }
        });
      } catch (e) {
        console.error("Failed to clear database history:", e);
      }
    }
  };

  const getLayoutClass = () => {
    let base = `min-h-[100dvh] overflow-x-hidden p-0 flex flex-col justify-between relative transition-all duration-300 theme-sky`;
    if (isDarkMode) base += " dark bg-[#0a0f24] text-slate-100";
    else base += " bg-[#F0F9FF] text-slate-800";
    return base;
  };

  const isFullscreenLayout = layoutPath.startsWith('/community') || layoutPath.startsWith('/social') || layoutPath.startsWith('/ai-tutor') || layoutPath.startsWith('/course-room') || layoutPath.startsWith('/learning-plan') || layoutPath.startsWith('/my-course') || layoutPath.startsWith('/proficiency-test');
  const hideHeaderFooter = isFullscreenLayout;

  return (
    <div className={getLayoutClass()} id="app-root">
      <CustomScrollbar />
      <TouchEffect />
      {!hideHeaderFooter && (
        <Navigation 
          onAuthClick={() => setIsAuthModalOpen(true)} onLogout={logout} 
          user={user} anonTimeLeft={Math.max(0, 5000 - anonymousChatTime)} 
        />
      )}

      <div className={`flex-1 w-full max-w-full flex flex-col mx-auto relative z-10`}>
        {isSummaryLoading && (
          <div className="fixed inset-0 bg-[#0d121f]/75 backdrop-blur-md z-[150] flex flex-col items-center justify-center p-4">
            <div className="bg-[#111936] border border-amber-500/25 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-2xl animate-spin">⏳</span>
              </div>
              <h3 className="text-lg font-black text-amber-400 font-display">Evaluating Practice</h3>
              <p className="text-xs text-slate-350 leading-relaxed font-sans">
                {statusMessage || "Please wait to see your performance."}
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#e0a92e] h-full w-2/3 animate-pulse"></div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">AI Coach Academic Assessment Panel Connection</span>
            </div>
          </div>
        )}

        {!isSummaryLoading && statusMessage && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-3.5 text-xs">
            <AlertCircle className="w-4 h-4 text-emerald-550 shrink-0" />
            <p className="font-medium">{statusMessage}</p>
            <button className="ml-auto font-black text-xs" onClick={() => setStatusMessage(null)}>×</button>
          </div>
        )}

        <AnimatePresence 
          mode="wait"
          onExitComplete={() => {
            setLayoutPath(location.pathname);
            if (pendingScroll) {
              window.scrollTo({ top: 0, behavior: 'instant' });
              const rootEl = document.getElementById('app-root');
              if (rootEl) {
                rootEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }
              setPendingScroll(false);
            }
          }}
        >
          <motion.div
            key={location.pathname}
            initial={TRANSITION_PRESETS[appTransition].initial}
            animate={TRANSITION_PRESETS[appTransition].animate}
            exit={TRANSITION_PRESETS[appTransition].exit}
            transition={{
              ...(TRANSITION_PRESETS[appTransition].transition as any),
              duration: (TRANSITION_PRESETS[appTransition].transition as any).duration 
                ? (TRANSITION_PRESETS[appTransition].transition as any).duration * (appTransitionSpeed === 'slow' ? 2 : appTransitionSpeed === 'fast' ? 0.5 : 1)
                : undefined
            } as any}
            className={`flex-1 flex flex-col w-full relative z-10`}
          >
            <Routes location={location} key={location.pathname}>
              <Route path="/admin" element={<AdminPanel onClose={() => window.history.back()} />} />
              <Route path="/" element={<HomePage />} />
              
              <Route path="/leaderboards" element={<LeaderboardPage />} />
              <Route path="/buy-premium" element={
                <div className="flex flex-col gap-6">
                  <BuyPremium />
                </div>
              } />
              <Route path="/transition-settings" element={<TransitionSettings />} />
              <Route path="/credit-costs" element={<MyCreditCosts />} />
              <Route path="/my-purchases" element={<PaymentHistory />} />
              <Route path="/social" element={<SocialHub />} />
              <Route path="/community/feed" element={<SocialHub />} />
              <Route path="/community/requests" element={<SocialHub />} />
              <Route path="/community/messages" element={<SocialHub />} />
              <Route path="/community/anonymous" element={<SocialHub />} />
              <Route path="/ai-tutor" element={<AITutorPage />} />
              <Route path="/ai-tutor-live/:topicId" element={<AILiveTutorPage />} />
              <Route path="/ai-tutor-text/:topicId" element={<AITutorTextPage />} />
              <Route path="/ai-tutor-scoreboard" element={<AITutorScoreboardPage />} />
              <Route path="/print-lesson/:topicId" element={<LessonGuidePrintView />} />
              <Route path="/competitions" element={<CompetitionHub />} />
              <Route path="/proficiency-test" element={<ProficiencyTest />} />
              <Route path="/performance-hub" element={
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 lg:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-indigo-500/5 mt-6 relative overflow-hidden flex-1">
                  <PerformanceHub 
                    records={historySummaries}
                    onClearRecords={handleClearRecords}
                    isLoading={false}
                  />
                </div>
              } />
              <Route path="/learning-plan" element={<LearningPlanPortal />} />
              <Route path="/my-course" element={<MyCourse />} />
              <Route path="/course-room" element={<CourseRoom />} />
              <Route path="/customize" element={<ThemeCustomizer />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      {!hideHeaderFooter && (
        <footer className="w-full text-center mt-auto pt-6 border-t border-slate-200/40 text-xs text-slate-400 font-medium z-10 relative flex justify-center flex-col items-center gap-2">
          <p>© 2026 Spoken Guide.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsAdminPanelOpen(true)} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
              <Lock className="w-3 h-3" /> Admin Access
            </button>
            <button onClick={() => setIsContactModalOpen(true)} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
              <MessageSquare className="w-3 h-3" /> Contact Admin
            </button>
          </div>
        </footer>
      )}

      {isAdminPanelOpen && <AdminPanel onClose={() => setIsAdminPanelOpen(false)} />}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={login} />}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setIsContactModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-bold mb-4">Message Admin</h2>
            <textarea id="admin-message-input" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 h-32 mb-4" placeholder="Your message..." />
            <button onClick={() => { setIsContactModalOpen(false); }} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Send Message</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MainApp() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default MainApp;
