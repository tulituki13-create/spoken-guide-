export type RoleType = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: RoleType;
  text: string;
  timestamp: Date;
  isHint?: boolean;
}

export type MicState = "ready" | "listening" | "speaking" | "thinking";

export interface VoiceOption {
  id: string;
  label: string;
  desc: string;
  enDesc: string;
  emoji: string;
  accent: string;
}

export const VOICES: VoiceOption[] = [
  { id: "Zephyr", label: "Zephyr (গভীর)", desc: "গভীর ও স্পষ্ট পুরুষ", enDesc: "Deep Narrator", emoji: "🎙️", accent: "Clear, Deep" },
  { id: "Puck", label: "Puck (সাধারণ)", desc: "বন্ধুত্বপূর্ণ ও প্রাণবন্ত পুরুষ", enDesc: "Friendly Male", emoji: "👨", accent: "Lively, Bright" },
  { id: "Kore", label: "Kore (শিশু)", desc: "কিউট ও হাসিখুশি শিশু", enDesc: "Child Voice Model", emoji: "👧", accent: "High-range, Cute" },
  { id: "Charon", label: "Charon (শান্ত)", desc: "শান্ত ও মার্জিত পুরুষ", enDesc: "Calm Masculine", emoji: "🧔", accent: "Soft, Gentle" },
  { id: "Fenrir", label: "Fenrir (গম্ভীর)", desc: "গম্ভীর ও বলিষ্ঠ পুরুষ", enDesc: "Deep/Bold Male", emoji: "🧔‍♂️", accent: "Rich, Low-range" },
  { id: "Aoede-slow", label: "Aoede (ধীরগতি)", desc: "ধীর গতির কথা বলা নারী", enDesc: "Slow Phase Speaking", emoji: "🐢", accent: "Slow, Clear" }
];

export interface Icebreaker {
  id: string;
  icon: string;
  title: string;
  subtext: string;
  topic: "casual" | "hobbies" | "surprise";
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  sessionsCount: number;
  speakingSeconds: number;
  lastFluencyScore: number;
  progressHistory: { date: string; score: number }[];
  activeStreak: number;
  joinedAt: string;
}

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  category?: string;
  description: string;
  context: string;
  vocabulary: string[];
  difficulty: string;
  pdfId?: string;
}

export interface TeacherMistake {
  original: string;
  correction: string;
  explanation: string;
}

export interface MistakeReview {
  feedback: string;
  fluencyScore: number;
  mistakes: TeacherMistake[];
  timestamp: string;
}
