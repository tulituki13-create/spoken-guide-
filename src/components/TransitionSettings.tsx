import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Layers, Box, MoveRight, RefreshCcw, ZoomIn, FoldHorizontal, ArrowDownCircle, MoveLeft, ScanFace, Feather, Wind, Cloud, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Transition presets
export const TRANSITION_PRESETS = {
  none: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  slideRight: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 },
    transition: { duration: 0.4, ease: "easeOut" }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 }
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
    transition: { duration: 0.4 }
  },
  flip: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 90 },
    transition: { type: 'spring', stiffness: 100, damping: 20 }
  },
  zoom: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.5 },
    transition: { duration: 0.4, ease: "easeInOut" }
  },
  rotate: {
    initial: { opacity: 0, rotate: -10, scale: 0.9 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 10, scale: 1.1 },
    transition: { duration: 0.4 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    transition: { duration: 0.3 }
  },
  slideDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 },
    transition: { duration: 0.3 }
  },
  fold: {
    initial: { opacity: 0, rotateX: -90, y: 50 },
    animate: { opacity: 1, rotateX: 0, y: 0 },
    exit: { opacity: 0, rotateX: 90, y: -50 },
    transition: { type: 'spring', stiffness: 120, damping: 20 }
  },
  gentleFloat: {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
  },
  softExpand: {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
    transition: { duration: 0.8, ease: "easeOut" }
  },
  calmBreeze: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 1, ease: "easeInOut" }
  },
  zenReveal: {
    initial: { opacity: 0, filter: 'blur(15px)', y: 5 },
    animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
    exit: { opacity: 0, filter: 'blur(15px)', y: -5 },
    transition: { duration: 1.2, ease: "easeOut" }
  },
  sandDune: {
    initial: { opacity: 0, y: 40, filter: 'blur(8px) sepia(20%)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px) sepia(0%)' },
    exit: { opacity: 0, y: -40, filter: 'blur(8px) sepia(20%)' },
    transition: { duration: 1.1, ease: [0.34, 1.15, 0.64, 1] }
  },
  desertWind: {
    initial: { opacity: 0, x: 60, skewX: -10, filter: 'blur(10px)' },
    animate: { opacity: 1, x: 0, skewX: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -60, skewX: 10, filter: 'blur(10px)' },
    transition: { duration: 1.2, ease: [0.25, 1, 0.5, 1] }
  },
  oceanWave: {
    initial: { opacity: 0, y: 20, scale: 0.97, rotate: -2 },
    animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
    exit: { opacity: 0, y: -20, scale: 0.97, rotate: 2 },
    transition: { duration: 1.0, ease: [0.4, 0, 0.2, 1] }
  },
  autumnLeaf: {
    initial: { opacity: 0, y: -50, rotate: 15 },
    animate: { opacity: 1, y: 0, rotate: 0 },
    exit: { opacity: 0, y: 50, rotate: -15 },
    transition: { duration: 1.1, type: "spring", stiffness: 60, damping: 15 }
  }
};

export type TransitionType = keyof typeof TRANSITION_PRESETS;

export const TransitionSettings = () => {
  const navigate = useNavigate();
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('slideUp');
  const [transitionSpeed, setTransitionSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [previewVisible, setPreviewVisible] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Quick toggle off and on when settings change to restart preview
    setPreviewVisible(false);
    const timeout = setTimeout(() => {
       setPreviewVisible(true);
       interval = setInterval(() => {
         setPreviewVisible(v => !v);
       }, 2000);
    }, 100);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [selectedTransition, transitionSpeed]);

  useEffect(() => {
    const saved = localStorage.getItem('app-transition-type') as TransitionType;
    if (saved && TRANSITION_PRESETS[saved]) {
      setSelectedTransition(saved);
    }
    const savedSpeed = localStorage.getItem('app-transition-speed') as 'fast' | 'normal' | 'slow';
    if (savedSpeed) {
      setTransitionSpeed(savedSpeed);
    }
  }, []);

  const handleSelect = (type: TransitionType) => {
    setSelectedTransition(type);
    localStorage.setItem('app-transition-type', type);
    // Dispatch a custom event so other components (like AppContent) can update
    window.dispatchEvent(new Event('app-transition-changed'));
  };

  const handleSpeedSelect = (speed: 'fast' | 'normal' | 'slow') => {
    setTransitionSpeed(speed);
    localStorage.setItem('app-transition-speed', speed);
    window.dispatchEvent(new Event('app-transition-changed'));
  };

  const presets = [
    { id: 'none', label: 'None', desc: 'Instant page load, no animation', icon: <Box className="w-5 h-5 text-slate-400" /> },
    { id: 'gentleFloat', label: 'Gentle Float', desc: 'A slow, calming upward drift', icon: <Feather className="w-5 h-5 text-sky-400" /> },
    { id: 'softExpand', label: 'Soft Expand', desc: 'Gentle fade in with blur and scale', icon: <Cloud className="w-5 h-5 text-indigo-300" /> },
    { id: 'calmBreeze', label: 'Calm Breeze', desc: 'Smooth horizontal glide', icon: <Wind className="w-5 h-5 text-cyan-300" /> },
    { id: 'zenReveal', label: 'Zen Reveal', desc: 'Serene, slow-paced cinematic blur', icon: <Droplets className="w-5 h-5 text-emerald-300" /> },
    { id: 'sandDune', label: 'Sand Dune', desc: 'Like shifting dunes with a warm sepia tint', icon: <Wind className="w-5 h-5 text-amber-500" /> },
    { id: 'desertWind', label: 'Desert Wind', desc: 'Horizontal sweeping wind effect', icon: <Cloud className="w-5 h-5 text-orange-400" /> },
    { id: 'oceanWave', label: 'Ocean Wave', desc: 'Soft floating wave physics', icon: <Droplets className="w-5 h-5 text-blue-500" /> },
    { id: 'autumnLeaf', label: 'Autumn Leaf', desc: 'Falling, gently rotating leaf', icon: <Feather className="w-5 h-5 text-rose-500" /> },
    { id: 'fade', label: 'Fade', desc: 'Smooth fade in and out', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { id: 'slideUp', label: 'Slide Up', desc: 'Pages slide up from the bottom', icon: <ArrowLeft className="w-5 h-5 text-blue-400 rotate-90" /> },
    { id: 'slideRight', label: 'Slide Right', desc: 'Pages slide in from the left', icon: <MoveRight className="w-5 h-5 text-emerald-400" /> },
    { id: 'slideLeft', label: 'Slide Left', desc: 'Pages slide in from the right', icon: <MoveLeft className="w-5 h-5 text-teal-400" /> },
    { id: 'slideDown', label: 'Slide Down', desc: 'Pages slide down from the top', icon: <ArrowDownCircle className="w-5 h-5 text-cyan-400" /> },
    { id: 'scale', label: 'Scale', desc: 'Slight zoom in on navigation', icon: <Sparkles className="w-5 h-5 text-amber-400" /> },
    { id: 'zoom', label: 'Zoom', desc: 'Dramatic zoom transition', icon: <ZoomIn className="w-5 h-5 text-red-400" /> },
    { id: 'blur', label: 'Blur', desc: 'Cinematic blur transition', icon: <ScanFace className="w-5 h-5 text-purple-400" /> },
    { id: 'flip', label: 'Flip', desc: '3D rotation flip', icon: <RefreshCcw className="w-5 h-5 text-orange-400" /> },
    { id: 'rotate', label: 'Rotate', desc: 'Spinning cinematic rotation', icon: <RefreshCcw className="w-5 h-5 text-pink-400" /> },
    { id: 'fold', label: 'Fold', desc: 'Origami fold transition', icon: <FoldHorizontal className="w-5 h-5 text-rose-400" /> },
  ] as const;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full flex-1 text-slate-900 dark:text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight">Animation & Transitions</h1>
          <p className="text-sm text-slate-500 font-medium">Customize how pages animate when navigating the app</p>
        </div>
      </div>

      {/* Demo Box */}
      <div className="w-full max-w-lg mx-auto bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 mb-8 shadow-inner overflow-hidden relative min-h-[200px] flex items-center justify-center">
        <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          Preview
          <div className="flex gap-1 h-3 items-center">
            <span className={`w-1.5 h-1.5 rounded-full ${previewVisible ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
            <span className={`w-1.5 h-1.5 rounded-full ${!previewVisible ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {previewVisible && (
            <motion.div
               key={selectedTransition}
               initial={TRANSITION_PRESETS[selectedTransition].initial}
               animate={TRANSITION_PRESETS[selectedTransition].animate}
               exit={TRANSITION_PRESETS[selectedTransition].exit}
               transition={{ 
                 ...(TRANSITION_PRESETS[selectedTransition].transition as any), 
                 duration: (TRANSITION_PRESETS[selectedTransition].transition as any).duration 
                    ? (TRANSITION_PRESETS[selectedTransition].transition as any).duration * (transitionSpeed === 'slow' ? 2 : transitionSpeed === 'fast' ? 0.5 : 1) 
                    : 0.8 
               } as any}
               className="w-full flex flex-col gap-3"
            >
              <div className="w-full h-8 bg-indigo-500/20 rounded-lg"></div>
              <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              <div className="w-1/2 h-6 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Speed Controls */}
      <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Animation Speed</h2>
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
           {(['fast', 'normal', 'slow'] as const).map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedSelect(speed)}
                className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                  transitionSpeed === speed 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {speed}
              </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelect(preset.id as TransitionType)}
            className={`text-left p-5 rounded-2xl border-2 transition-all group relative overflow-hidden ${
              selectedTransition === preset.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-white dark:bg-slate-950'
            }`}
          >
            <div className="flex items-start gap-4 z-10 relative">
              <div className={`p-3 rounded-xl flex items-center justify-center transition-colors ${
                selectedTransition === preset.id 
                  ? 'bg-indigo-100 dark:bg-indigo-500/20' 
                  : 'bg-slate-100 dark:bg-slate-900 group-hover:bg-slate-200 dark:group-hover:bg-slate-800'
              }`}>
                {preset.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-base mb-1 ${
                  selectedTransition === preset.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {preset.label}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {preset.desc}
                </p>
              </div>
            </div>
            
            {selectedTransition === preset.id && (
              <div className="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
