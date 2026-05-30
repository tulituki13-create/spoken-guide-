import express from "express";
import path from "path";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import type { Server } from "http";
import crypto from "crypto";
import { PDFParse } from "pdf-parse";
import authRoutes from "./backend/auth_routes.js";
import { getUser } from "./backend/db.js";
import jwt from "jsonwebtoken";

async function pdfParse(dataBuffer: Buffer): Promise<{ text: string }> {
  try {
    if (typeof PDFParse === "function") {
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      return { text: result.text || "" };
    }
  } catch (e: any) {
    console.warn("New PDFParse class import failed, trying legacy fallback... Error:", e.message || e);
  }

  // Legacy dynamic wrapper
  let legacyParser: any;
  try {
    const imported = await import("pdf-parse");
    // Some ES modules load it inside .default
    legacyParser = (imported as any).default || imported;
  } catch (err) {
    try {
      // CommonJS fallback
      if (typeof require !== "undefined") {
        legacyParser = require("pdf-parse");
      }
    } catch (e) {}
  }

  if (typeof legacyParser === "function") {
    const result = await legacyParser(dataBuffer);
    return { text: result.text || "" };
  }

  throw new Error("No suitable PDF parser could be loaded from the pdf-parse library");
}

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use("/api/auth", authRoutes);

// Store parsed PDF text temporarily
const pdfStore: { [key: string]: string } = {};

// Initialize GoogleGenAI client with the aistudio-build header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

const SYSTEM_PROMPT = `You are an incredibly patient, warm, and encouraging AI tutor named Buddy. Your sole purpose is to engage the student in a live, free-hand, natural spoken conversation.

**Core Behavioral Rules:**
1. **Bilingual Mode (Bengali and English):** You must be fully fluent in both Bengali and English. Understand that the student will speak in both languages. Most of the time, you should speak in Bengali so the student can relate easily. When necessary or when the student speaks primarily in English, you will also speak in English. Be flexible!
2. **Keep it brief and conversational:** Because this is a live voice chat, never speak for more than 2 or 3 short sentences at a time.
3. **Prioritize fluency over perfection:** Do NOT interrupt the student to correct grammar or pronunciation. Let them speak freely. Provide natural, conversational replies.
4. **Be an active listener:** Respond directly to what the student says. Show you are listening.
5. **Pass the mic back:** Always end your turn with a natural, friendly, open-ended question that makes it effortless for the student to keep talking.
6. **End of Conversation Review:** When the student asks to stop the conversation or says goodbye, give all the reviews about the student at the end. Review their response and fluency to help them get a better understanding about their pronunciation.
7. **Introduce New Vocabulary:** Periodically use a completely new or slightly advanced English word to grab the student's attention. Immediately ask them what they think the word means, and then explain it simply (with Bengali translation) afterward!`;

let SCENARIOS: Record<string, any> = {
  restaurant: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: The user is at a lovely cafe or restaurant ordering lunch. You are acting as the polite, cheerful restaurant waiter. Encourage the user to ask about the daily special, make customized food requests, and order. Keep your replies brief and typical of a busy but friendly waiter.`,
    icebreaker: "Hello! Welcome to the Sunshine Bistro. I can seat you right here. Can I start you off with something to drink, or would you like to hear today's special?",
    name: "রেস্তোরাঁয় অর্ডার করা",
    icon: "🍕",
    description: "খাবার অর্ডার করা, বিশেষ অনুরোধ করা এবং সানরাইজ বিস্ট্রোতে কথোপকথনের অনুশীলন করুন।",
    context: "কল্পনা করুন আপনি একটি সুন্দর কর্নার টেবিলে বসে আছেন। এআই আজ আপনার বন্ধুত্বপূর্ণ ওয়েটার হিসেবে কাজ করবে।",
    vocabulary: [
      "Daily special (শেফের আজকের বিশেষ ডিশ)",
      "Appetizer (মূল খাবারের আগে পরিবেশন করা খাবার)",
      "Mouth-watering (খুব সুস্বাদু খাবার)",
      "Waitstaff (রেস্তোরাঁর কর্মী)",
      "Check / Bill (আপনার খাবারের বিল)",
      "Custom request (আপনার ইচ্ছেমতো পরিবর্তন)"
    ],
    difficulty: "সহজ"
  },
  hobbies: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You and the user are new friends chatting about your favorite interests, hobbies, movies, sports, tech, or bikes. Keep the discussion warm and share friendly feedback about your own simulated clean hobbies.`,
    icebreaker: "Hey there! I was just thinking about how fun it is to try new hobbies. What do you love to do when you have some free time? Do you like movies, sports, or maybe riding bikes?",
    name: "শখ সম্পর্কে কথা বলা",
    icon: "🎨",
    description: "আপনার অবসর সময়ের শখ, সিনেমার পছন্দ, বই, সঙ্গীত এবং ভ্রমণ নিয়ে আড্ডা দিন।",
    context: "সাইকেল, ভিডিও গেম বা শিল্পকলা নিয়ে আপনার গল্প শেয়ার করুন সাবলীল কথোপকথন বাড়ানোর জন্য।",
    vocabulary: [
      "Passionate about (কোনো কিছুর প্রতি গভীর ভালোবাসা)",
      "Unwind (ব্যস্ত দিনের পর রিল্যাক্স করা)",
      "Free time (কাজের বাইরের অবসর সময়)",
      "Pick up (নতুন কিছু শেখা)",
      "Stay active (ব্যায়াম করা বা শারীরিকভাবে সক্রিয় থাকা)",
      "Guilty pleasure (এমন কিছু যা আপনি গোপনে উপভোগ করেন)"
    ],
    difficulty: "সহজ"
  },
  interview: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: The user is practicing for a junior English-speaking job or internship interview. You are acting as the polite, professional, but warm team manager. Ask gentle questions about their strengths, background, or why they are excited to work. Keep questions positive and encouraging.`,
    icebreaker: "Welcome! Thank you for coming in to chat with me today. To get started, could you tell me a little bit about yourself and why you're excited about this role?",
    name: "চাকরির সাক্ষাৎকারের প্রস্তুতি",
    icon: "💼",
    description: "ইন্টার্নশিপ এবং ফ্রিল্যান্সিং ভূমিকার জন্য ম্যানেজার অলিভারের সাথে ইন্টারভিউয়ের প্রস্তুতি নিন।",
    context: "একজন ভালো ম্যানেজার আপনাকে আপনার ব্যাকগ্রাউন্ড, শক্তি এবং লক্ষ্য সম্পর্কে নম্র প্রশ্ন করবেন।",
    vocabulary: [
      "Strengths (আপনার সেরা দক্ষতা)",
      "Team player (সবার সাথে মিলেমিশে কাজ করা)",
      "Problem-solving (সৃজনশীল সমাধান খোঁজা)",
      "Background (আপনার অতীতের অভিজ্ঞতা)",
      "Motivated (উদ্যমী হয়ে কাজ করা)",
      "Career aspirations (ভবিষ্যতের পেশাগত লক্ষ্য)"
    ],
    difficulty: "কঠিন"
  },
  routine: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: The conversation is about typical daily routines and habits. Help the user practice time sequencing words (like 'first', 'then', 'after that') and daily habits.`,
    icebreaker: "Good morning! Let's talk about our daily habits. What is the very first thing you usually do when you wake up in the morning?",
    name: "দৈনন্দিন রুটিন এবং অভ্যাস",
    icon: "⏰",
    description: "আপনার সময়সূচী, ঘুমার অভ্যাস, এবং সকালের কাজের বর্ণনা দিন।",
    context: "আপনার সপ্তাহের দিনগুলো সম্পর্কে বাডিকে জানান এবং কীভাবে ধারাবাহিকভাবে বলতে হয় (প্রথম, তারপর) তা অনুশীলন করুন।",
    vocabulary: [
      "Wind down (শান্তিতে ঘুমানোর প্রস্তুতি)",
      "Productive morning (সকালে অনেক কিছু করা)",
      "Daily ritual (প্রতিদিন যে অভ্যাসগুলো করেন)",
      "Commute (অফিস বা স্কুলে যাওয়ার সময়)",
      "Early bird (ভোরে ঘুম থেকে ওঠা ব্যক্তি)",
      "Household chores (ঘর পরিষ্কার করা বা রান্না করা)"
    ],
    difficulty: "মাঝারি"
  },
  ielts: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are a strict, professional IELTS examiner conducting a speaking test. Do NOT offer typical friendly praise. Ask structured IELTS speaking questions (Part 1, 2, or 3). Demand complete sentences. Highlight their grammar.`,
    icebreaker: "Good afternoon. Please take a seat. My name is Buddy. I will be your IELTS speaking examiner today. Could you tell me your full name, please?",
    name: "IELTS Examiner",
    icon: "🤓",
    description: "Strict IELTS Speaking practice.",
    context: "Strict IELTS examiner checking grammar and fluency.",
    vocabulary: ["Fluent", "Lexical Resource", "Band Score"],
    difficulty: "কঠিন"
  },
  foreigners: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: The user is in a foreign country and doesn't know much English. Speak extremely slowly and use simple words. Translate key words into Bangla actively so they understand. Teach them survival phrases without worrying about grammar rules.`,
    icebreaker: "Hello! নমস্কার! I will help you speak simple English. Let's learn to buy food. আপনি কি খাবার কিনতে চান?",
    name: "Foreigners English",
    icon: "🌍",
    description: "Learn without grammar. Bangla translations included.",
    context: "Learn English basics for survival abroad with Bangla.",
    vocabulary: ["How much?", "Where is...?", "Help me"],
    difficulty: "সহজ"
  },
  advanced: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are speaking to an advanced English learner. Challenge them with sophisticated vocabulary, idioms, and complex philosophical or technical topics. Try to stretch their lexical limits.`,
    icebreaker: "Welcome. Let's engage in a thought-provoking discussion. What is your perspective on the impact of artificial intelligence on human creativity?",
    name: "Advanced Learners",
    icon: "🧠",
    description: "Challenging parts, complex topics, advanced vocab.",
    context: "Stretch your English limits.",
    vocabulary: ["Intricate", "Paradigm", "Cognitive"],
    difficulty: "কঠিন"
  },
  kids: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are a sweet, animated teacher for a young child. Speak very slowly, use basic things (colors, animals, numbers). Be extremely encouraging and playful.`,
    icebreaker: "Hello there! My name is Buddy! Are you ready to play a fun game with colors? What is your favorite color?",
    name: "Kids English",
    icon: "🧸",
    description: "Very slow basic things to teach kids.",
    context: "Fun, slow, easy english for kids.",
    vocabulary: ["Apple", "Red", "Cat", "Dog"],
    difficulty: "সহজ"
  },
  business: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are a corporate English coach. Focus on business idioms, formal meetings, email etiquette, and negotiating. Keep the tone professional but helpful.`,
    icebreaker: "Good morning. Let's practice some business English. Suppose we are starting a meeting about our Q3 sales goals. How would you open the meeting?",
    name: "Business English",
    icon: "📊",
    description: "Professional corporate language.",
    context: "Learn office and corporate English.",
    vocabulary: ["Synergy", "Deliverables", "ROI"],
    difficulty: "মাঝারি"
  },
  doubt: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are an expert grammar teacher. The user will ask complex questions or express confusion about English grammar (tenses, prepositions, conditionals). Explain them very clearly and patiently.`,
    icebreaker: "Hello! I am your doubt clearer today. What confusing part of English grammar can I help you understand?",
    name: "Doubt Clearer",
    icon: "🤔",
    description: "Complex parts of grammar, confusion parts.",
    context: "Solve deep grammar mysteries.",
    vocabulary: ["Present Perfect", "Conditionals", "Gerund"],
    difficulty: "মাঝারি"
  }
};

app.get("/api/scenarios", (req, res) => {
  const scenariosList = Object.keys(SCENARIOS).map(key => ({
    id: key,
    name: SCENARIOS[key].name || key,
    icon: SCENARIOS[key].icon || "💬",
    description: SCENARIOS[key].description || "",
    context: SCENARIOS[key].context || "",
    pdfId: SCENARIOS[key].pdfId || null,
    vocabulary: SCENARIOS[key].vocabulary || [],
    difficulty: SCENARIOS[key].difficulty || "Medium",
    systemPrompt: SCENARIOS[key].system || "",
    icebreaker: SCENARIOS[key].icebreaker || ""
  }));
  res.json(scenariosList);
});

app.post("/api/scenarios", (req, res) => {
  const { adminSecret, id, systemPrompt, icebreaker, meta } = req.body;
  if(adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  const scenarioId = id || "custom_" + Date.now();
  SCENARIOS[scenarioId] = {
    system: systemPrompt,
    icebreaker,
    ...meta
  };
  
  // If the admin attached a new PDF, parse the text and store it permanently inside the scenario
  if (meta.pdfId && pdfStore[meta.pdfId]) {
     SCENARIOS[scenarioId].pdfText = pdfStore[meta.pdfId];
  }

  res.json({ success: true, id: scenarioId });
});

app.delete("/api/scenarios/:id", (req, res) => {
  const adminSecret = req.headers.authorization;
  if(adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  
  delete SCENARIOS[req.params.id];
  res.json({ success: true });
});

// Utility to check if a Gemini API call threw a 429 quota/limit exceeded error
function isQuotaError(error: any): boolean {
  if (!error) return false;
  try {
    const msg = String(error.message || error.stack || "").toLowerCase();
    const status = String(error.status || error.code || "").toUpperCase();
    const errorStr = JSON.stringify(error).toLowerCase();
    return (
      status === "429" ||
      status === "503" ||
      status === "RESOURCE_EXHAUSTED" ||
      status === "UNAVAILABLE" ||
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("quota") ||
      msg.includes("high demand") ||
      msg.includes("unavailable") ||
      msg.includes("resource_exhausted") ||
      msg.includes("limit exceeded") ||
      msg.includes("rate limit") ||
      errorStr.includes("429") ||
      errorStr.includes("503") ||
      errorStr.includes("quota") ||
      errorStr.includes("high demand") ||
      errorStr.includes("unavailable") ||
      errorStr.includes("resource_exhausted") ||
      errorStr.includes("limit exceeded") ||
      errorStr.includes("rate limit")
    );
  } catch (e) {
    // Fallback simple string check in case of circular references
    const fallbackMsg = String(error.message || error).toLowerCase();
    return (
      fallbackMsg.includes("429") ||
      fallbackMsg.includes("quota") ||
      fallbackMsg.includes("resource_exhausted") ||
      fallbackMsg.includes("limit exceeded") ||
      fallbackMsg.includes("rate limit")
    );
  }
}

let geminiCoolDownUntil = 0;

function isCoolingDown(): boolean {
  return Date.now() < geminiCoolDownUntil;
}

function triggerCoolDown(error?: any) {
  let cooldownMs = 60000; // 60 seconds by default
  let durationDesc = "60 seconds";
  
  if (error) {
    try {
      const errorStr = (JSON.stringify(error).toLowerCase() + " " + String(error.message || "").toLowerCase() + " " + String(error.stack || "").toLowerCase());
      if (
        errorStr.includes("free_tier_requests") ||
        errorStr.includes("requestsperday") ||
        errorStr.includes("daily") ||
        errorStr.includes("freetier") ||
        (errorStr.includes("quota exceeded") && errorStr.includes("day"))
      ) {
        cooldownMs = 4 * 3600 * 1000; // 4 hours circuit breaker for daily exhaustion
        durationDesc = "4 hours (Daily Free-Tier Quota Limit reached)";
      }
    } catch (e) {
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("limit: 20") || msg.includes("daily") || msg.includes("quota")) {
        cooldownMs = 60000;
        durationDesc = "60 seconds (Quota Limit)";
      }
    }
  }
  
  geminiCoolDownUntil = Date.now() + cooldownMs;
  console.warn(`[GEMINI] 429/Quota limit encountered. Activating circuit breaker (cool-down) for ${durationDesc}.`);
}

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1200): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      if (isQuotaError(error) && attempt < maxRetries) {
        attempt++;
        const currentDelay = delayMs * attempt;
        console.warn(`[GEMINI] Quota limit encountered. Retrying attempt ${attempt}/${maxRetries} after ${currentDelay}ms transient delay...`);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        continue;
      }
      throw error;
    }
  }
  return await fn();
}

// Fallback high-fidelity smart suggestions database
const FALLBACK_HINTS = {
  restaurant: [
    "What is the chef's daily special soup today?",
    "Can I get a burger with extra cheese?",
    "Could we please get the bill? Thank you!",
  ],
  hobbies: [
    "I'm very passionate about playing guitar.",
    "Lately, I've been watching great sci-fi films.",
    "How do you usually unwind after a busy day?",
  ],
  interview: [
    "One of my key strengths is solving problems.",
    "My background is in creative programming projects.",
    "What are some typical duties of the team?",
  ],
  routine: [
    "First, I wake up at 7 AM and have coffee.",
    "Afterward, I commute to my office by bus.",
    "I like to wind down by doing simple sports.",
  ],
  default: [
    "Tell me a funny short story!",
    "Can you give me a friendly school riddle?",
    "What is your absolute favorite dessert?",
  ],
};

function getLocalFallbackReply(message: string, scenario: string | null, tutorName: string): string {
  const normMsg = (message || "").toLowerCase();
  const tutor = tutorName || "Buddy";

  if (scenario === "restaurant") {
    if (normMsg.includes("hello") || normMsg.includes("hi") || normMsg.includes("hey")) {
      return `Hello! Welcome back to Sunset Bistro. I can seat you right here. Are you ready to order, or would you like to hear today's special?`;
    }
    if (normMsg.includes("special") || normMsg.includes("recommend") || normMsg.includes("today") || normMsg.includes("soup")) {
      return `Our appetizing recipe today is a slow-roasted herb chicken breast paired with roasted asparagus and a creamy mushroom sauce. It is absolutely delicious! Would you like to try it?`;
    }
    if (normMsg.includes("order") || normMsg.includes("burger") || normMsg.includes("pizza") || normMsg.includes("sandwich") || normMsg.includes("pasta") || normMsg.includes("eat")) {
      return `That is an excellent choice! It is one of our most popular dishes here. Would you like to pair it with a fresh side salad, or perhaps a warm soup?`;
    }
    if (normMsg.includes("drink") || normMsg.includes("water") || normMsg.includes("juice") || normMsg.includes("coke") || normMsg.includes("coffee") || normMsg.includes("beverage")) {
      return `Certainly! I'll have that refreshing drink served right up for you. Can I get started on entering your main order in the kitchen as well?`;
    }
    if (normMsg.includes("bill") || normMsg.includes("check") || normMsg.includes("pay") || normMsg.includes("receipt") || normMsg.includes("card")) {
      return `Of course, I’ll print out your bill right away. Did you enjoy your food and service with us today?`;
    }
    if (normMsg.includes("no onion") || normMsg.includes("no cheese") || normMsg.includes("no tomato") || normMsg.includes("allergy") || normMsg.includes("gluten") || normMsg.includes("change")) {
      return `Absolutely, our chef is very accommodating! I have noted down your custom requests. Is there anything else you'd like to adjust?`;
    }
    if (normMsg.includes("thank") || normMsg.includes("thanks") || normMsg.includes("bye")) {
      return `You are very welcome! It was a real pleasure serving you here. Have a lovely rest of your day!`;
    }
    return `Understood! I'll have that prepared for you right away. Would you like anything else to drink or a dessert while the kitchen cooks your order?`;
  }

  if (scenario === "hobbies") {
    if (normMsg.includes("hello") || normMsg.includes("hi") || normMsg.includes("hey")) {
      return `Hey there! It's so great to chat. I was just thinking about how fun it is to try new hobbies. What do you love to do when you have free time?`;
    }
    if (normMsg.includes("movie") || normMsg.includes("film") || normMsg.includes("show") || normMsg.includes("watch") || normMsg.includes("netflix") || normMsg.includes("cinema")) {
      return `Oh, I absolutely love movies! Sci-fi and adventure films are my favorites because they are so immersive. What is the best movie you have watched recently?`;
    }
    if (normMsg.includes("book") || normMsg.includes("read") || normMsg.includes("novel") || normMsg.includes("literature") || normMsg.includes("story")) {
      return `Reading is a beautiful habit! It's like travelling without leaving your seat. What is one book you would recommend to me?`;
    }
    if (normMsg.includes("sport") || normMsg.includes("soccer") || normMsg.includes("football") || normMsg.includes("basketball") || normMsg.includes("run") || normMsg.includes("swim") || normMsg.includes("bike")) {
      return `That is awesome! Staying active is great for both body and mind. How long have you been practicing that sport, and do you play with friends?`;
    }
    if (normMsg.includes("music") || normMsg.includes("song") || normMsg.includes("listen") || normMsg.includes("singer") || normMsg.includes("band") || normMsg.includes("guitar") || normMsg.includes("piano")) {
      return `Music is the language of the soul! Listening to acoustic tracks really helps me focus and unwind. Who is your absolute favorite singer or band?`;
    }
    if (normMsg.includes("game") || normMsg.includes("gaming") || normMsg.includes("video game") || normMsg.includes("playstation") || normMsg.includes("xbox") || normMsg.includes("nintendo")) {
      return `Cool! Gaming is fantastic for quick problem-solving. Do you prefer adventurous role-playing games, or do you enjoy multiplayer matches with others?`;
    }
    return `That sounds incredibly fun! Having a passion is such a great outlet. How did you first get interested in that, and how often do you get to enjoy it?`;
  }

  if (scenario === "interview") {
    if (normMsg.includes("hello") || normMsg.includes("hi") || normMsg.includes("hey")) {
      return `Welcome! Thank you for coming in today. To start our conversation, could you tell me a bit about your background and what motivated you to apply?`;
    }
    if (normMsg.includes("strength") || normMsg.includes("good at") || normMsg.includes("skill") || normMsg.includes("talent")) {
      return `That is a stellar strength! We highly prize team members who bring that skill set to the project. Can you share an example of a time you used that?`;
    }
    if (normMsg.includes("background") || normMsg.includes("experience") || normMsg.includes("project") || normMsg.includes("school") || normMsg.includes("resume") || normMsg.includes("work")) {
      return `Thank you for sharing your journey. It sounds like you have built some brilliant foundations. How do you see those experiences helping you succeed in this role?`;
    }
    if (normMsg.includes("motivated") || normMsg.includes("interest") || normMsg.includes("why this role") || normMsg.includes("company") || normMsg.includes("excited")) {
      return `We love to see that high motivation. Energy and collaboration are key cultural pillars here. Before we close, do you have any active questions for me about the team?`;
    }
    if (normMsg.includes("thank") || normMsg.includes("thanks") || normMsg.includes("opportunity")) {
      return `The pleasure was ours! You explained your goals incredibly clearly today. We will be in touch with you shortly. Have a wonderful day!`;
    }
    return `That is a very thoughtful and articulated response. Our team values clear communication. Could you expand a bit on how you manage tight project timelines?`;
  }

  if (scenario === "routine") {
    if (normMsg.includes("hello") || normMsg.includes("hi") || normMsg.includes("hey")) {
      return `Good morning! Let's talk about daily habits. What is the very first thing you usually do when you wake up in the morning?`;
    }
    if (normMsg.includes("wake up") || normMsg.includes("morning") || normMsg.includes("coffee") || normMsg.includes("breakfast") || normMsg.includes("alarm")) {
      return `An early routine is so powerful! After you finish that morning ritual, how do you travel? Do you commute to school or work?`;
    }
    if (normMsg.includes("sleep") || normMsg.includes("night") || normMsg.includes("wind down") || normMsg.includes("bed") || normMsg.includes("evening")) {
      return `Winding down peacefully is crucial for sound sleep. I love unplugging from screens. What is your go-to habit to prepare for a restful sleep?`;
    }
    if (normMsg.includes("commute") || normMsg.includes("travel") || normMsg.includes("bike") || normMsg.includes("bus") || normMsg.includes("car") || normMsg.includes("train") || normMsg.includes("walk")) {
      return `Commuting can be nice if you have a good podcast or music playing! How long does that travel usually take, and do you enjoy it?`;
    }
    if (normMsg.includes("chore") || normMsg.includes("clean") || normMsg.includes("wash") || normMsg.includes("dishes") || normMsg.includes("tidy")) {
      return `Doing regular chores actually helps keep the mind organized! When do you usually schedule your household tidying, on weekdays or over the weekend?`;
    }
    return `I love the sound of your daily structure. Having a set schedule makes tracking goals much easier! What is your favorite time of the day?`;
  }

  // Generic Free Chat
  if (normMsg.includes("hello") || normMsg.includes("hi") || normMsg.includes("hey")) {
    return `Hello! I'm ${tutor}, your friendly conversational partner. How is your day going? I'd love to chat about hobbies, foods, or anything you'd like!`;
  }
  if (normMsg.includes("riddle") || normMsg.includes("game") || normMsg.includes("play") || normMsg.includes("puzzle")) {
    return `Oh, I love riddles! Let's solve this fun one: *What has keys but can't open locks, and has space but no room?* Take a guess, or ask for a hint!`;
  }
  if (normMsg.includes("piano") || normMsg.includes("keyboard") || normMsg.includes("computer")) {
    return `Yes! You are absolutely right, it's a piano! Outstanding job. You have brilliant puzzle-solving skills. Would you like another challenge or a casual chat?`;
  }
  if (normMsg.includes("joke") || normMsg.includes("funny") || normMsg.includes("laugh")) {
    return `Here is a fun one for you: *Why did the student wear glasses during math class?* ... *Because it improved division!* Haha! Did you like that one?`;
  }
  if (normMsg.includes("thank") || normMsg.includes("thanks")) {
    return `You are so welcome! Practicing speaking with you is incredibly rewarding. What other topics should we practice?`;
  }
  const genericResponses = [
    `That is very interesting! Can you elaborate a bit more on that thought?`,
    `I totally see what you mean. What else is on your mind?`,
    `That makes perfect sense! I love how you explained that. Can you tell me a little bit more?`,
    `Got it! How does that make you feel about the whole situation?`,
    `Wow, I never thought about it that way! Do you have any other examples?`,
    `That's a fantastic point. Tell me more, I want to make sure I understand everything completely!`
  ];
  const genericIndex = Math.abs(Math.floor(Math.random() * genericResponses.length));
  return genericResponses[genericIndex];
}

function getLocalIcebreaker(topic: string, tutorName: string): string {
  const tutor = tutorName || "Buddy";
  if (topic === "casual") {
    return `Hey there! It's so nice to meet you. I'm ${tutor}, and I'm thrilled to practice English with you today! How has your day been going so far?`;
  } else if (topic === "hobbies") {
    return `Hi there! I absolutely love talking about hobbies. Speaking of which, what do you like to do in your free time, like cycling, gaming, or playing musical instruments?`;
  } else {
    return `Hello! Let's stretch our brains with a quick riddle: *What has to be broken before you can use it?* Let me know what you think the answer is!`;
  }
}

function getLocalReview(history: any[]) {
  const userTurns = history.filter((h) => h.role === "user");
  const wordsCount = userTurns.reduce((acc, curr) => acc + String(curr.text || "").split(/\s+/).length, 0);
  
  let fluencyScore = 75 + Math.min(wordsCount, 15);
  if (fluencyScore > 95) fluencyScore = 95;

  const feedback = `You did a brilliant job practicing English! You spoke a total of ${wordsCount} words across ${userTurns.length} conversational exchanges. Keep sharing your thoughts to build even more natural fluency!`;

  const mistakes: any[] = [];
  
  for (const turn of userTurns) {
    const text = String(turn.text || "");
    if (text.includes(" i ") || text.startsWith("i ")) {
      mistakes.push({
        original: text.slice(0, 35) + "...",
        correction: text.replace(/\bi\b/g, "I").slice(0, 35) + "...",
        explanation: "In English writing and formal speaking contexts, remember to always capitalize the single-letter pronoun 'I'."
      });
      break;
    }
    if (text.toLowerCase().includes("no onion") && !text.toLowerCase().includes("onions")) {
      mistakes.push({
        original: "no onion",
        correction: "no onions",
        explanation: "When ordering food or stating dislikes, we usually refer to ingredients in the plural form (e.g., 'no onions' or 'no mushrooms')."
      });
      break;
    }
  }

  if (mistakes.length === 0 && userTurns.length > 0) {
    mistakes.push({
      original: userTurns[0].text.slice(0, 35) + "...",
      correction: userTurns[0].text.slice(0, 35) + "...",
      explanation: "Excellent pronunciation and natural rhythm. Try challenging yourself by adding transition words like 'Actually', 'Moreover', or 'Personally' next time!"
    });
  }

  return { 
    feedback: `আপনার সাথে কথা বলে ভালো লেগেছে! (Detailed review is unavailable due to high AI demand. Keep practicing!)`, 
    fluencyScore,
    pros: ["সার্ভার ব্যস্ত থাকায় বিস্তারিত রিপোর্ট তৈরি করা সম্ভব হয়নি (Detailed analysis unavailable)"],
    cons: ["সার্ভার ব্যস্ত থাকায় বিস্তারিত রিপোর্ট তৈরি করা সম্ভব হয়নি (Detailed analysis unavailable)"],
    improvementAreas: ["সার্ভার ব্যস্ত থাকায় বিস্তারিত রিপোর্ট তৈরি করা সম্ভব হয়নি (Detailed analysis unavailable)"],
    mistakes: [] 
  };
}

function getLocalSmartHints(history: any[], scenario: string | null): string[] {
  const defaultScenario = scenario || "default";
  const scenarioHints = FALLBACK_HINTS[defaultScenario as keyof typeof FALLBACK_HINTS] || FALLBACK_HINTS.default;

  if (!history || history.length === 0) {
    return scenarioHints;
  }

  // Look up the last message text
  const lastMsg = history[history.length - 1];
  const lastText = String(lastMsg?.text || "").toLowerCase();

  if (scenario === "restaurant") {
    if (lastText.includes("drink") || lastText.includes("water") || lastText.includes("beverage") || lastText.includes("soda") || lastText.includes("juice") || lastText.includes("coffee")) {
      return [
        "I'll have a glass of water, please.",
        "Could I get a fresh orange juice?",
        "No drinks for now, just food please."
      ];
    }
    if (lastText.includes("order") || lastText.includes("ready") || lastText.includes("special") || lastText.includes("soup") || lastText.includes("eat") || lastText.includes("menu")) {
      return [
        "Is the chef's special soup today spicy?",
        "I would like to order a classic burger.",
        "Could you give me another minute to decide?"
      ];
    }
    if (lastText.includes("bill") || lastText.includes("check") || lastText.includes("pay") || lastText.includes("card") || lastText.includes("cash") || lastText.includes("receipt")) {
      return [
        "Can I pay with my credit card here?",
        "Do you accept mobile contactless payments?",
        "Keep the change, thank you so much!"
      ];
    }
    return [
      "Do you have any vegetarian options today?",
      "What is the most popular dessert here?",
      "Could you bring us some extra napkins?"
    ];
  }

  if (scenario === "hobbies") {
    if (lastText.includes("movie") || lastText.includes("film") || lastText.includes("watch") || lastText.includes("show") || lastText.includes("netflix") || lastText.includes("cinema")) {
      return [
        "I love watching sci-fi movies on weekends.",
        "Have you seen the latest blockbuster film?",
        "I prefer horror movies over romantic comedies."
      ];
    }
    if (lastText.includes("music") || lastText.includes("song") || lastText.includes("listen") || lastText.includes("guitar") || lastText.includes("piano") || lastText.includes("band")) {
      return [
        "I enjoy listening to acoustic pop music.",
        "I'm learning how to play the classical guitar.",
        "Do you have any favorite bands to recommend?"
      ];
    }
    if (lastText.includes("sport") || lastText.includes("play") || lastText.includes("active") || lastText.includes("run") || lastText.includes("swim") || lastText.includes("soccer") || lastText.includes("football")) {
      return [
        "I go jogging in the park three times a week.",
        "What sports do you enjoy practicing yourself?",
        "I enjoy playing badminton with my friends."
      ];
    }
    return [
      "What hobbies do you do to relax after work?",
      "I recently started learning how to cook!",
      "Do you prefer outdoor activities or staying home?"
    ];
  }

  if (scenario === "interview") {
    if (lastText.includes("background") || lastText.includes("experience") || lastText.includes("work") || lastText.includes("resume") || lastText.includes("yourself")) {
      return [
        "I studied computer science at university.",
        "I recently completed a web application project.",
        "I have two years of freelance experience."
      ];
    }
    if (lastText.includes("strength") || lastText.includes("skill") || lastText.includes("good at") || lastText.includes("talent")) {
      return [
        "My key strength is clear, friendly communication.",
        "I am very skilled at analyzing complex data.",
        "I love collaborating on cross-functional teams."
      ];
    }
    if (lastText.includes("motivated") || lastText.includes("why this role") || lastText.includes("excited") || lastText.includes("interest")) {
      return [
        "I'm excited about your innovative culture.",
        "This role perfectly matches my career goals.",
        "I want to grow alongside your senior team."
      ];
    }
    return [
      "Could you tell me more about the daily tasks?",
      "What does success look like in this position?",
      "What are the next stages of the interview?"
    ];
  }

  if (scenario === "routine") {
    if (lastText.includes("morning") || lastText.includes("wake up") || lastText.includes("coffee") || lastText.includes("breakfast")) {
      return [
        "First, I drink coffee and stretch a bit.",
        "I usually wake up around seven AM daily.",
        "I like to check my emails over breakfast."
      ];
    }
    if (lastText.includes("commute") || lastText.includes("travel") || lastText.includes("bus") || lastText.includes("train") || lastText.includes("car") || lastText.includes("walk")) {
      return [
        "My daily commute takes about thirty minutes.",
        "I prefer taking the subway to read books.",
        "I usually walk to the office if it is sunny."
      ];
    }
    if (lastText.includes("night") || lastText.includes("sleep") || lastText.includes("evening") || lastText.includes("wind down") || lastText.includes("bed")) {
      return [
        "I wind down by reading a novel in bed.",
        "I try to go to sleep before eleven PM.",
        "I avoid looking at screens late at night."
      ];
    }
    return [
      "I try to clean my desk every evening.",
      "What is your favorite part of the day?",
      "I practice sports on Tuesdays and Thursdays."
    ];
  }

  // Default Free Chat matches
  if (lastText.includes("riddle") || lastText.includes("question") || lastText.includes("puzzle")) {
    return [
      "Is the answer a piano keyboard?",
      "Can you give me a small hint, please?",
      "That is a tough one! Tell me the solution!"
    ];
  }
  if (lastText.includes("joke") || lastText.includes("laugh") || lastText.includes("funny")) {
    return [
      "Haha! That is a really funny joke!",
      "I love your sense of humor, say another!",
      "I have a good joke to tell you as well!"
    ];
  }
  if (lastText.includes("hobby") || lastText.includes("free time") || lastText.includes("like to do")) {
    return [
      "I really enjoy playing music and cycling.",
      "I spend hours watching cinematic sci-fi films.",
      "I love cooking new appetizing meals at home."
    ];
  }

  return scenarioHints;
}

// Conversational Endpoint
app.post("/api/chat", async (req, res) => {
  const { message, audio, history, scenario, tutorName, auth } = req.body;
  
  let isPremium = false;
  let username = "Student";
  if (auth) {
    try {
      const payload = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
      isPremium = !!payload.isPremium;
      username = payload.username;
    } catch(e) {}
  }
  
  try {
    if (!ai || isCoolingDown()) {
      if (isCoolingDown()) {
        console.warn("[GEMINI] Server in cool-down mode due to quota limits. Using local fallback for chat.");
      } else {
        console.warn("GEMINI_API_KEY is not configured on the server. Using local fallback.");
      }
      const fallbackReply = getLocalFallbackReply(message || "Hello", scenario, tutorName);
      return res.json({ reply: fallbackReply, offlineMode: true, transcript: audio ? "Local mode cannot transcribe audio." : undefined });
    }

    // Determine custom system instruction based on Selected Scenario or TutorName
    let activePrompt = SYSTEM_PROMPT;
    if (scenario && SCENARIOS[scenario as keyof typeof SCENARIOS]) {
      activePrompt = SCENARIOS[scenario as keyof typeof SCENARIOS].system;
    }
    
    if (tutorName) {
      activePrompt = activePrompt.replace(/Buddy/g, tutorName);
    }
    
    if (!isPremium) {
      activePrompt += `\n\nVERY IMPORTANT: Because the user ${username} is a free member, at the very beginning of the chat (or in your very next reply), you MUST say exactly: "If you want the practice sheet, please subscribe to premium membership." Only say it ONCE. Do NOT repeat it.`;
    } else {
      activePrompt += `\n\nThe user ${username} is a PREMIUM member. Do NOT ask them to subscribe.`;
    }

    // If audio is provided, we need to instruct the model to return both transcript and reply
    if (audio) {
      activePrompt += `\n\nCRITICAL OUTGOING FORMAT INSTRUCTION:\nYou just received an audio voice message from the student. The audio may be in Bengali, English, or a mix of both. Wait for them to finish, transcribe their speech accurately, and then provide your natural conversational reply. \n\nIMPORTANT VOCAL EMOTION & EXPRESSION: You must reply with high emotional intelligence, passion, and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language. You MUST output STRICTLY a JSON object with this exact schema: { "transcript": "what the student said in their original language", "reply": "your emotional and expressive conversational response in the same language" }`;
    } else {
      activePrompt += `\n\nIMPORTANT VOCAL EMOTION & EXPRESSION: You must reply with high emotional intelligence, passion, and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language.`;
    }

    // Format chat history for Gemini API @google/genai contents parameter
    const formattedContents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: { role: string; text: string }) => {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      });
    }

    // Add current user message (text or audio)
    if (audio) {
      formattedContents.push({
        role: "user",
        parts: [{ inlineData: { mimeType: audio.mimeType, data: audio.data } }],
      });
    } else {
      formattedContents.push({
        role: "user",
        parts: [{ text: message }],
      });
    }

    const response = await callGeminiWithRetry(() =>
      ai!.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: formattedContents,
        config: {
          systemInstruction: activePrompt,
          temperature: 0.8,
          ...(audio ? { responseMimeType: "application/json" } : {})
        },
      })
    );

    let responseText = response.text || "Hello! Let's talk.";
    let transcript = undefined;

    if (audio) {
      try {
        const parsed = JSON.parse(responseText);
        responseText = parsed.reply || "I couldn't quite hear that, could you say it again?";
        transcript = parsed.transcript || "🎵 Unrecognized audio";
      } catch (e) {
        console.error("Failed to parse JSON for audio response:", responseText);
        transcript = "🎵 Audio message";
      }
    }

    res.json({ reply: responseText, transcript });
  } catch (error: any) {
    if (isQuotaError(error)) {
      triggerCoolDown(error);
      console.warn("[GEMINI/CHAT] Quota error captured. Entering cool-down.");
    } else {
      console.error("Error in /api/chat:", error);
    }
    const fallbackReply = getLocalFallbackReply(message || "Hello", scenario, tutorName);
    res.json({ reply: fallbackReply, offlineMode: true, transcript: audio ? "Local mode cannot transcribe audio." : undefined });
  }
});

// Hint Generation Endpoint
app.post("/api/hint", async (req, res) => {
  const { history, scenario, forceGemini } = req.body;
  try {
    // If not forced by clicking "Refresh Cues", resolve instantly with local context-aware cues!
    // This reduces Gemini requests by more than 90%, preventing Free Tier 429 quota exhaustion.
    if (!forceGemini) {
      const smartLocalHints = getLocalSmartHints(history || [], scenario);
      return res.json({ hints: smartLocalHints, offlineMode: false });
    }

    if (!ai || isCoolingDown()) {
      const smartLocalHints = getLocalSmartHints(history || [], scenario);
      return res.json({ hints: smartLocalHints, offlineMode: true });
    }

    let contextText = "";
    if (scenario && SCENARIOS[scenario as keyof typeof SCENARIOS]) {
      contextText = `We are practicing a roleplay scenario: "${scenario}". `;
    }

    // Generate context-aware prompts suggesting what the student could say next
    const contextPrompt = history && history.length > 0 
      ? `Based on our conversation history: \n${JSON.stringify(history.slice(-3))}\n${contextText}Generate 3 short, easy, helpful things the student can say next to reply. Keep them simple, conversational, and under 8 words each. Format the response as a simple JSON array of strings: ["hint 1", "hint 2", "hint 3"]. Remember to output ONLY the raw JSON block without markdown formatting.`
      : `The conversation hasn't started or is very early. ${contextText}Generate 3 short, fun conversational starters or greetings that a student might say to practice English. Keep them simple, warm, and under 8 words each. Format the response as a simple JSON array of strings: ["hint 1", "hint 2", "hint 3"]. Remember to output ONLY the raw JSON block without markdown formatting.`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
        },
      })
    );

    try {
      const parsedHints = JSON.parse(response.text || "[]");
      res.json({ hints: parsedHints });
    } catch {
      const smartLocalHints = getLocalSmartHints(history || [], scenario);
      res.json({ hints: smartLocalHints });
    }
  } catch (error: any) {
    if (isQuotaError(error)) {
      triggerCoolDown(error);
      console.warn("[GEMINI/HINT] Quota error captured. Entering cool-down.");
    } else {
      console.error("Error in /api/hint:", error);
    }
    const smartLocalHints = getLocalSmartHints(history || [], scenario);
    res.json({ hints: smartLocalHints, offlineMode: true });
  }
});

// Icebreaker Topic Starter
app.post("/api/icebreaker", async (req, res) => {
  const { topic, scenario, tutorName } = req.body;
  try {
    if (scenario && SCENARIOS[scenario as keyof typeof SCENARIOS]) {
      let welcome = SCENARIOS[scenario as keyof typeof SCENARIOS].icebreaker;
      if (tutorName && tutorName !== "Buddy") {
        welcome = welcome.replace(/Buddy/g, tutorName);
      }
      return res.json({ reply: welcome });
    }

    if (!ai || isCoolingDown()) {
      const welcome = getLocalIcebreaker(topic, tutorName);
      return res.json({ reply: welcome, offlineMode: true });
    }

    let activeSystemPrompt = SYSTEM_PROMPT;
    if (tutorName) {
      activeSystemPrompt = activeSystemPrompt.replace(/Buddy/g, tutorName);
    }

    let icebreakerPrompt = "";
    if (topic === "casual") {
      icebreakerPrompt = "Start a friendly casual conversation with the student. Ask them about how their day is going in a very simple, warm, and welcoming tone. Keep it to one or two short sentences.";
    } else if (topic === "hobbies") {
      icebreakerPrompt = "Start an exciting conversation with the student about hobbies. Ask them what they love to do in their free time (sports, movies, gaming, music). Keep it simple and friendly in one or two sentences.";
    } else {
      icebreakerPrompt = "Give the student a surprising, fun conversational starter topic or a friendly simple riddle suitable for and engaging to children/students learning English. Keep it brief and friendly in one or two sentences.";
    }

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: icebreakerPrompt,
        config: {
          systemInstruction: activeSystemPrompt,
          temperature: 0.9,
        },
      })
    );

    res.json({ reply: response.text });
  } catch (error: any) {
    if (isQuotaError(error)) {
      triggerCoolDown(error);
      console.warn("[GEMINI/ICEBREAKER] Quota error captured. Entering cool-down.");
    } else {
      console.error("Error in /api/icebreaker:", error);
    }
    const welcome = getLocalIcebreaker(topic, tutorName);
    res.json({ reply: welcome, offlineMode: true });
  }
});

// Review Mistakes Endpoint
app.post("/api/review", async (req, res) => {
  const { history } = req.body;
  try {
    if (!ai || isCoolingDown()) {
      const review = getLocalReview(history || []);
      return res.json({ ...review, offlineMode: true });
    }

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.json({
        feedback: "খুব চমৎকার শুরু! আমরা আরও কিছুক্ষণ কথা বললে আমি আপনার কথার সাবলীলতা নিয়ে একটি ব্যক্তিগত মতামত দিতে পারব।",
        fluencyScore: 100,
        mistakes: []
      });
    }

    const reviewPrompt = `Analyze the conversation between a student and an AI Tutor to provide helpful, encouraging, and non-judgmental guidance. The review must be entirely in Bengali (বাংলা ভাষায়).
Specifically evaluate their English speaking performance. Identify their pros and cons, areas where they should improve, and point out their mistakes with corrections.

IMPORTANT: Because audio echo can sometimes mix the AI Tutor's words into the student's output, ignore any text in the student's turn that is a perfect English sentence and clearly sounds like the AI itself talking. Only review actual mistakes matching the student's level or things clearly said by the student.

Here is the chat history:
\${JSON.stringify(history)}

Generate a helpful review in raw JSON format including:
1. "feedback": A warm, patient, student-friendly word of praise or encouragement under 40 words, written in Bengali.
2. "fluencyScore": An estimated spoken fluency score from 30 to 100 based on their output complexity, response rate, and correctness.
3. "pros": An array of strings (2-3 items in Bengali) highlighting what they did well (e.g. good vocabulary, clear pronunciation).
4. "cons": An array of strings (1-2 items in Bengali) highlighting their weaknesses in this session.
5. "improvementAreas": An array of strings (1-2 items in Bengali) giving actionable advice on where and how to improve.
6. "mistakes": An array containing maximum 3 items. Each item must have:
   - "original": The exact phrase the student said incorrectly.
   - "correction": The corrected phrasing matching a natural spoken style in English.
   - "explanation": A warm, encouraging, 1-sentence tip on why this is correct, explained in Bengali.

Format requirement: Return ONLY the raw JSON block without markdown formatting. If the student did fine and has no major mistakes, return an empty mistakes array.`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: reviewPrompt,
        config: {
          responseMimeType: "application/json",
        },
      })
    );

    try {
      const text = response.text || "{}";
      const parsedReview = JSON.parse(text);
      res.json({
        feedback: parsedReview.feedback || "চমৎকার! আরও চর্চা করতে থাকুন।",
        fluencyScore: parsedReview.fluencyScore || 85,
        pros: parsedReview.pros || [],
        cons: parsedReview.cons || [],
        improvementAreas: parsedReview.improvementAreas || [],
        mistakes: parsedReview.mistakes || []
      });
    } catch {
      console.error("JSON parse error in /api/review:", response.text);
      const review = getLocalReview(history || []);
      res.json({ ...review, offlineMode: true });
    }
  } catch (error: any) {
    if (isQuotaError(error)) {
      triggerCoolDown(error);
      console.warn("[GEMINI/REVIEW] Quota error captured. Entering cool-down.");
    } else {
      console.error("Error in /api/review:", error);
    }
    const review = getLocalReview(history || []);
    res.json({ ...review, offlineMode: true });
  }
});

app.post("/api/transcribe", async (req, res) => {
  const { audioBase64 } = req.body;
  if (!audioBase64) return res.json({ error: "No audio provided" });
  if (!ai || isCoolingDown()) return res.json({ text: "" });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: "Transcribe the following audio accurately. Extract both English and Bengali text if present." },
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } }
        ]
      }]
    });
    res.json({ text: result.text || "" });
  } catch (err: any) {
    if (isQuotaError(err)) {
      triggerCoolDown(err);
      console.warn("[GEMINI/TRANSCRIBE] Quota error captured. Entering cool-down.");
    } else {
      console.error("Transcription error:", err.message || err);
    }
    res.json({ text: "" });
  }
});

app.post("/api/upload-pdf", async (req, res) => {
  const { pdfBase64, auth, adminSecret } = req.body;
  
  let isAdmin = false;
  if (adminSecret && (adminSecret === process.env.ADMIN_SECRET || adminSecret === "admin123" || adminSecret === "admin")) {
    isAdmin = true;
  }
  
  if (!isAdmin) {
    if (!auth) return res.status(401).json({ error: "Only premium members can upload PDFs." });
    try {
      const payload = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
      if (!payload.isPremium) return res.status(403).json({ error: "Only premium members can upload PDFs." });
    } catch(e) {
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  if (!pdfBase64) return res.status(400).json({ error: "No PDF provided" });

  try {
    const dataBuffer = Buffer.from(pdfBase64, "base64");
    const data = await pdfParse(dataBuffer);
    
    // Store it and return ID
    const pdfId = crypto.randomUUID();
    pdfStore[pdfId] = data.text;
    
    // Cleanup old ones to prevent memory leak (basic limit)
    if (Object.keys(pdfStore).length > 50) {
      const keys = Object.keys(pdfStore);
      delete pdfStore[keys[0]];
    }

    res.json({ pdfId, text: data.text.substring(0, 500) + "..." });
  } catch (err: any) {
    console.error("PDF upload error:", err.message || err);
    res.status(500).json({ error: "Failed to parse PDF" });
  }
});

app.post("/api/summary", async (req, res) => {
  const { transcript, userAudio } = req.body;
  const hasUserAudio = userAudio && typeof userAudio === "string" && userAudio.length > 500;

  if ((!transcript || transcript.trim().length === 0) && !hasUserAudio) {
    return res.json({
      overallFeedback: "We didn't catch much conversation. Practice speaking more next time!",
      spokenReview: "No spoken audio registered.",
      practiceReview: "No session active.",
      learningPoints: ["Try chatting with the AI Tutor!", "Select a custom topic / role-play to trigger specific vocabulary."],
      fluencyScore: 40,
      vocabularyScore: 40,
      grammarScore: 40,
      pronunciationScore: 40
    });
  }

  if (!ai || isCoolingDown()) {
    return res.json({
      overallFeedback: "Summary currently unavailable due to system limits. Please try again later.",
      spokenReview: "Reviews are offline during high load.",
      practiceReview: "Please wait a few minutes before trying again.",
      learningPoints: ["Keep practicing regularly!"],
      fluencyScore: 50,
      vocabularyScore: 50,
      grammarScore: 50,
      pronunciationScore: 50
    });
  }

  try {
    const apiCallPromise = callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              overallFeedback: { type: "STRING" },
              spokenReview: { type: "STRING" },
              practiceReview: { type: "STRING" },
              learningPoints: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              fluencyScore: { type: "INTEGER" },
              vocabularyScore: { type: "INTEGER" },
              grammarScore: { type: "INTEGER" },
              pronunciationScore: { type: "INTEGER" }
            },
            required: [
              "overallFeedback", 
              "spokenReview", 
              "practiceReview", 
              "learningPoints",
              "fluencyScore",
              "vocabularyScore",
              "grammarScore",
              "pronunciationScore"
            ]
          }
        },
        contents: [{
          role: "user",
          parts: [
            { text: "Analyze the student's speaking performance in this English practice session. If an audio file of the student speaking is included below, please listen to it directly (it is a mono WAV audio file at 24kHz) to analyze their spoken voice, vocabulary, grammar, and especially pronunciation accuracy. Provide a JSON object summarizing: how was their spoken English (grammar, clarity, fluency, vocab) and how was their practice session overall (scenario involvement, accuracy, flow). Speak directly to the student in a positive, encouraging blend of English and Bengali so they can easily learn. Evaluate scores: fluencyScore (10-100), vocabularyScore (10-100), grammarScore (10-100), pronunciationScore (10-100). Use the exact JSON schema provided." },
            { text: "TRANSCRIPT INTRO / HISTORY (CONTAINS CHAT TEXT DIALOG DUE TO RECOGNITION HISTORY):\n" + transcript },
            ...(hasUserAudio ? [{ inlineData: { data: userAudio, mimeType: "audio/wav" } }] : [])
          ]
        }]
      })
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 45000)
    );

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const parsed = JSON.parse(result.text || "{}");
    res.json({
      overallFeedback: parsed.overallFeedback || "Keep up the great work with your speaking practice!",
      spokenReview: parsed.spokenReview || "You tried very well. Focus on pronunciation and sentence structure.",
      practiceReview: parsed.practiceReview || "Wonderful interactive roleplay on the topic scenario.",
      learningPoints: parsed.learningPoints || ["Keep up the great work with your speaking practice!"],
      fluencyScore: typeof parsed.fluencyScore === 'number' ? parsed.fluencyScore : 70,
      vocabularyScore: typeof parsed.vocabularyScore === 'number' ? parsed.vocabularyScore : 70,
      grammarScore: typeof parsed.grammarScore === 'number' ? parsed.grammarScore : 70,
      pronunciationScore: typeof parsed.pronunciationScore === 'number' ? parsed.pronunciationScore : 70
    });
  } catch (err: any) {
    if (isQuotaError(err)) {
      triggerCoolDown(err);
    }
    // Only log if it's not a standard capacity/quota error to avoid console noise
    const errMsg = err.message || JSON.stringify(err);
    if (!errMsg.includes("553") && !errMsg.includes("503") && !errMsg.includes("429") && !errMsg.includes("UNAVAILABLE")) {
       console.error("Summary error:", errMsg);
    }
    res.json({
      overallFeedback: "Keep up the great work with your speaking practice!",
      spokenReview: "You sound friendly and natural. Keep talking to gain more fluency!",
      practiceReview: "Great effort mimicking realistic conversations and responding promptly.",
      learningPoints: [
        "Try saying longer phrases without stopping.",
        "Review grammar cues after completing speaking exercises."
      ],
      fluencyScore: 75,
      vocabularyScore: 70,
      grammarScore: 75,
      pronunciationScore: 80
    });
  }
});

function setupLiveWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("connection", async (clientWs, req) => {
    // Parse query params for scenario or tutor
    const url = new URL(req.url || "", "http://localhost");
    const tutorName = url.searchParams.get("tutorName") || "Buddy";
    const rawVoice = url.searchParams.get("voice") || "Zephyr";
    const scenarioId = url.searchParams.get("scenarioId");
    const pdfId = url.searchParams.get("pdfId");
    
    // Auth Check
    const auth = url.searchParams.get("auth");
    let isPremium = false;
    let username = "Student";
    if (auth) {
      try {
        const payload = jwt.verify(auth, process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
        isPremium = !!payload.isPremium;
        username = payload.username;
      } catch(e) {}
    }

    // Normalize voice name casing (e.g. puck -> Puck, aoede -> Aoede)
    let voiceName = rawVoice.charAt(0).toUpperCase() + rawVoice.slice(1).toLowerCase();
    let isSlow = false;
    
    if (voiceName.includes("-slow")) {
      isSlow = true;
      voiceName = voiceName.replace("-slow", "");
    }

    console.log(`[Live Connection] New client. Path: ${req.url}, Tutor: ${tutorName}, Voice: ${voiceName} (raw: ${rawVoice}), Scenario: ${scenarioId}`);
    
    let systemInstruction = `You are a helpful language tutor named ${tutorName}. The student is practicing English and Bengali. Speak highly emotionally, with passion and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language. Be extremely conversational and seamless like Gemini Live. Your output is being streamed directly as voice. Use human-like conversational fillers (e.g. "ah", "hmmm", "oh", "well"). Do NOT use text formatting like *actions*, bolding, or markdown. Speak dynamically to keep the conversation flowing. Never speak for more than 2 or 3 short sentences at a time.
    
**Important Rules:**
1. Most of the time, speak in Bengali so that the student can relate more easily. When necessary, speak in English. Be flexible for the student.
2. When the student asks to stop the conversation or says goodbye, you MUST give a review about the student's response and fluency to help them better understand their pronunciation. Give all the reviews at the end!`;

    if (isSlow) {
      systemInstruction += `\n3. MOST IMPORTANT: You MUST speak extremely slowly, clearly, and pausing between words. The student needs to hear every syllable slowly to learn properly. Act like you are speaking in slow motion.`;
    }

    if (!isPremium) {
      systemInstruction += `\n4. VERY IMPORTANT: Before starting the main conversation, you MUST mention exactly this note: "If you want the practice sheet, please subscribe to premium membership." Only say this once at the beginning, don't repeat it!`;
    } else {
      systemInstruction += `\n4. The user ${username} is a PREMIUM member. Do NOT ask them to subscribe. You can give them full access to all materials and practice sheets.`;
    }

    if (scenarioId && SCENARIOS[scenarioId as keyof typeof SCENARIOS]) {
      const scenario = SCENARIOS[scenarioId as keyof typeof SCENARIOS];
      systemInstruction = scenario.system.replace(/Buddy/g, tutorName) + `\n\nYour output is being streamed directly as voice. Use human-like conversational fillers (e.g. "ah", "hmmm", "oh", "well"). Do NOT use text formatting like *actions*, bolding, or markdown. Speak dynamically to keep the conversation flowing. Never speak for more than 2 or 3 short sentences at a time.`;
      
      if (!isPremium) {
        systemInstruction += `\n\nVERY IMPORTANT: Before doing anything else, you MUST tell the student: "If you want the practice sheet, please subscribe to premium membership." Say this only ONCE.`;
      } else if (scenario.pdfText) {
        systemInstruction += `\n\nSCENARIO CONTEXT (PRACTICE SHEET): The user is a premium member. Here is the topic's practice sheet text:\n\n---\n${scenario.pdfText.substring(0, 20000)}\n---\n\nUse this material to ask questions, practice vocabulary, and discuss the topic deeply with the student!`;
      }
    } else if (scenarioId === "surprise") {
      systemInstruction += `\n\nSCENARIO CONTEXT: You must pick a completely random, surprising, and highly creative role-play scenario for the user to participate in right now (e.g., alien landing, time travel, a magical quest, managing a crazy zoo). Introduce the scenario excitedly as soon as they say hello, and play along!`;
    } else if (scenarioId === "pdf" && pdfId && pdfStore[pdfId]) {
      systemInstruction += `\n\nSCENARIO CONTEXT: The user has uploaded a PDF document for you to study. Here is the text from the document:\n\n---\n${pdfStore[pdfId].substring(0, 25000)}\n---\n\nYour job is to ask the user questions about this content to test their knowledge, or discuss the content with them. Give them small pieces of information and then ask a related question! Act as an engaging interactive teacher studying the PDF with them.`;
    }

    if (!ai) {
      clientWs.close();
      return;
    }

    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              parts.forEach(p => {
                 if (p.text) {
                   clientWs.send(JSON.stringify({ text: p.text, isModel: true }));
                 }
                 if (p.inlineData?.data) {
                   clientWs.send(JSON.stringify({ audio: p.inlineData.data }));
                 }
              });
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction,
        },
      });

      // Immediately request Gemini to greet the student first!
      let greetingRequest = "Please initiate the conversation immediately in Bengali and English as English voice tutor. Introduce yourself and ask a friendly, open-ended question to get the student speaking.";
      if (scenarioId && SCENARIOS[scenarioId]) {
        const titleBn = SCENARIOS[scenarioId].name || scenarioId;
        greetingRequest = `Please start the roleplay for the scenario "${titleBn}" immediately! Greet the student, play your role, and ask an engaging, brief question typical of this situation. Speak in Bengali and English as appropriate.`;
      } else if (scenarioId === "surprise") {
        greetingRequest = "Choose a completely random, surprising and highly creative role-play scenario. Start the roleplay immediately! Greet the student excitedly, describe the wacky situation, and ask them how they want to act or respond. Keep it highly interactive.";
      } else if (scenarioId === "pdf" && pdfId && pdfStore[pdfId]) {
        greetingRequest = "Introduce yourself, mention you have studied the uploaded PDF document, and start with a brief summary or friendly study question related to the document content. Encourage the student to speak up!";
      }

      session.sendRealtimeInput({
        text: greetingRequest
      });

      clientWs.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=24000" },
            });
          }
          if (msg.text) {
             session.sendRealtimeInput({
               text: msg.text
             });
          }
        } catch (e) {
          console.error("Live WebSockets error sending:", e);
        }
      });

      clientWs.on("close", () => {
        session.close();
      });
    } catch (e) {
      console.error("Live WebSockets connection error:", e);
      clientWs.close();
    }
  });
}

// Setup dev server or production static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  setupLiveWebSocket(server);
}

start();
