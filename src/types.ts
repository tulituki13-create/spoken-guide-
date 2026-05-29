export type RoleType = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: RoleType;
  text: string;
  timestamp: Date;
  isHint?: boolean;
}

export type MicState = "ready" | "listening" | "speaking" | "thinking";

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
  description: string;
  context: string;
  vocabulary: string[];
  difficulty: string;
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
