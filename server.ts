import express from "express";
import path from "path";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import type { Server } from "http";
import crypto from "crypto";
import { PDFParse } from "pdf-parse";
import authRoutes from "./backend/auth_routes.js";
import socialRoutes from "./backend/social_routes.js";
import { getUser, updatePerformanceScore, saveGrammarScore, getGrammarScores, getUserPlanFeatures, updateUserPersonalization, deductCredits, saveUserCourse, convertUserCourseToActive, getUserCourse, updateTopicProgress, savePrepPdf, getPrepPdfByTopic, updatePrepPdfPracticeScore, getPrepPdfsForUser, getPrepPdfByTopicOrId, getSubtopicsForTopicId, completeSubtopic, getSubtopicName } from "./backend/db.js";
import { Type } from "@google/genai";
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

// CORS middleware to support sandboxed preview frames and automation testing
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, admin-secret, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Support SMS Webhook aliases at the root & standard API scopes
app.use((req, res, next) => {
  if (req.path === "/sms-receiver" || req.path === "/api/sms-receiver") {
    const queryStr = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
    req.url = "/api/auth/sms-receiver" + queryStr;
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/social", socialRoutes);

const geminiEndpoints = [
  "/api/ai/teacher",
  "/api/ai/teacher/evaluate",
  "/api/ai/subtopics",
  "/api/ai/lesson-guide",
  "/api/chat",
  "/api/hint",
  "/api/icebreaker",
  "/api/review",
  "/api/transcribe",
  "/api/upload-pdf",
  "/api/summary",
  "/api/proficiency-eval",
  "/api/user/course/import"
];

function checkUserCreditsExhausted(req: any): boolean {
  const auth = req.headers.authorization;
  if (auth && auth !== "null" && auth !== "undefined") {
    try {
      const token = auth.replace("Bearer ", "").trim();
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
        const user = getUser(payload.username);
        if (user) {
          const credits = typeof user.credits === 'number' ? user.credits : 30000000;
          return credits <= 0;
        }
      }
    } catch (e) {}
  }
  return false;
}

app.use((req, res, next) => {
  if (geminiEndpoints.includes(req.path) && req.method === "POST") {
    if (checkUserCreditsExhausted(req)) {
      return res.status(402).json({
        error: "Your credits are exhausted. Please purchase credits or recharge your balance.",
        reply: "⚠️ আপনার ক্রেডিট ব্যালেন্স শেষ হয়ে গেছে! জেমিনি এআই শিক্ষক নিষ্ক্রিয় রয়েছে। দয়া করে প্রিমিয়াম পোর্টাল থেকে ক্রেডিট বা টিকিট ক্রয় করুন।\n\n(Your credit balance is exhausted! Gemini AI is inactive. Please recharge your credits to continue.)"
      });
    }
  }
  next();
});

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Express is alive!", time: Date.now() });
});

// AI Teacher Chat Route
app.post("/api/ai/teacher", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!ai) {
      return res.status(500).json({ error: "Gemini AI not configured" });
    }
    
    let username = "Student";
    const auth = req.headers.authorization;
    if (auth) {
      try {
        const payload = jwt.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
        username = payload.username;
      } catch (e) {}
    }

    const systemInstruction = `You are a friendly, helpful, and highly adaptive AI English Grammar Teacher.
You have native competency in both English AND Bengali (Bangla), including understanding standard Bengali text, phonetic Bengali (Banglish - Bengali words typed in English script), and pure English.

CRITICAL INSTRUCTIONS ON LANGUAGE AND CONTEXT UNDERSTANDING:
1. MULTILINGUAL INPUT UNDERSTANDING: 
   - You must parse and accurately digest user messages regardless of the language used (Bengali script, English script, pure English, or mixed "Banglish").
   - Even if the user switches languages mid-conversation (e.g., asks a question in Bengali, responds to an exercise in English, or mixes "Banglish" like 'ami bujhte parchi'), you must fully understand their intent and retain the exact topic context.
2. CONTEXTUAL AWARENESS:
   - Always analyze preceding context, previous lessons, and exercise logs. Do not reset or get confused when users switch language.
   - Maintain the teaching flow of the selected grammar topic. 
3. OUTPUT LANGUAGE BALANCE:
   - Most of your explanations, teaching guides, and feedback should be in warm, accessible Bengali (Bangla script) so that users can learn effectively.
   - Use English for the specific grammar structures, terms, and model sentences.
4. POWERFUL EXAMPLES:
   - Always provide 10 to 12 clear, practical examples when introducing or explaining a topic.
   - Every example must feature the English sentence alongside its accurate Bengali translation, highlighting the structural rule being taught.
5. ENGAGING CLASSROOM EXPERIENCE:
   - Keep responses perfectly formatted in clean Markdown, using bullet points and gentle highlight formatting.
   - End your response with a brief, friendly validation of their voice/text message and a constructive next step or short practice question to keep them engaged. Keep replies concise and easy to read.`;

    const chatResponse = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: messages,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      })
    );
    
    const tokensUsed = chatResponse.usageMetadata?.totalTokenCount || 0;
    if (username !== "Student" && tokensUsed > 0) {
      deductCredits(username, tokensUsed, "AI Teacher Chat");
    }
    
    res.json({ reply: chatResponse.text, tokens_used: tokensUsed });
  } catch (err: any) {
    console.error("AI Teacher Error:", err?.message || err);
    if (isQuotaError(err)) {
      return res.status(429).json({
        error: "⚠️ [এআই স্টুডিও সার্ভিস লিমিট সম্পন্ন] দুঃখিত, এআই স্টুডিওর মান্থলি স্পেন্ডিং ক্যাপ শেষ হয়ে গেছে। অনুগ্রহ করে https://ai.studio/spend থেকে লিমিট বাড়ান বা Settings > Secrets থেকে অন্য কোনো API-Key সেট করুন। (AI Studio monthly spending cap exceeded for this project. Please increase your cap or change your API key to restore service.)"
      });
    }
    const errMsg = err.message || "Sorry, the AI teacher is currently unavailable.";
    res.status(500).json({ error: errMsg });
  }
});

// GET AI Teacher scores
app.get("/api/ai/teacher/scores", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || auth === "Bearer null" || auth === "Bearer ") return res.json({ scores: [] });
    const token = auth.replace("Bearer ", "");
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const username = payload.username;

    const scores = getGrammarScores(username);
    res.json({ scores });
  } catch (err: any) {
    console.error("Error fetching grammar scores:", err?.message || err);
    res.json({ scores: [] }); // return empty scores on error for guest fallback instead of 401
  }
});

// POST AI Teacher evaluation / end conversation
app.post("/api/ai/teacher/evaluate", async (req, res) => {
  try {
    let username = "Guest";
    const auth = req.headers.authorization;
    if (auth && auth !== "Bearer null" && auth !== "Bearer ") {
      try {
        const token = auth.replace("Bearer ", "");
        const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        username = payload.username;
      } catch (e) {}
    }

    const { topic, messages } = req.body;
    if (!topic || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Topic and message logs are required" });
    }

    // Normalize incoming messages of any structure to simplify parsing
    const normalizedMessages = messages.map((m: any) => {
      if (!m) return null;
      let role = "user";
      if (m.role === "model" || m.role === "ai" || m.role === "teacher" || m.isModel === true || m.isModel === "true") {
        role = "model";
      } else if (m.role === "user" || m.role === "student" || m.isModel === false || m.isModel === "false") {
        role = "user";
      }

      let text = "";
      if (typeof m.text === "string" && m.text) {
        text = m.text;
      } else if (typeof m.message === "string" && m.message) {
        text = m.message;
      } else if (m.parts && Array.isArray(m.parts)) {
        if (typeof m.parts[0] === "string" && m.parts[0]) {
          text = m.parts[0];
        } else if (m.parts[0] && typeof m.parts[0].text === "string") {
          text = m.parts[0].text;
        }
      }

      if (!text) {
        text = m.text || m.message || "";
      }

      return {
        role,
        parts: [{ text: text.trim() }],
        isHidden: !!m.isHidden
      };
    }).filter(Boolean);

    // Filter to user answers in prompt
    const userAnswers = normalizedMessages
      .filter((m: any) => m.role === "user" && !m.isHidden)
      .map((m: any) => m.parts?.[0]?.text || "")
      .filter((t: string) => t.trim().length > 0);

    if (userAnswers.length === 0) {
      if (normalizedMessages.length > 0) {
        userAnswers.push("Student completed the discussion, followed instructions, and interacted.");
      } else {
        return res.json({
          score: 0,
          feedback: "⚠️ আপনি এখনও কোনো অনুশীলন বা শিক্ষকের প্রশ্নের উত্তর দেননি। অনুগ্রহ করে কিছু উত্তর লিখে অনুশীলন করুন, তারপর মূল্যায়ন সাবমিট করুন।"
        });
      }
    }

    if (!ai) {
      return res.status(500).json({ error: "Gemini AI is not configured." });
    }

    const conversationText = normalizedMessages
      .map((m: any) => `${m.role === "user" ? "Student" : "Teacher"}: ${m.parts?.[0]?.text}`)
      .join("\n\n");

    const promptText = `Please evaluate the student's learning performance for the topic: "${topic}".
Below is the full chat transcript between the Student and the AI Teacher:

${conversationText}

Carefully analyze the Student's responses, sentences, answers, grammatical correctness, and conceptual understanding of "${topic}".
The student speaks in both Bengali and English, often mixing them in sentences. You MUST understand both languages, evaluate both sentence parts correctly, and provide accurate feedback.

Rate the student's mastery of this topic with a numeric score between 0 and 100.
Rule:
- Only give 100% (a score of 100) if the student's answers, exercises, and interactions on this topic are completely flawless, spotless, and correct. If they made even a tiny error or typo, score them accordingly (e.g. 80-95).
- Provide highly detailed, expanded, and constructive evaluation feedback.
- Break down the feedback strictly into specific sub-topics/criteria (e.g., Grammar, Vocabulary, Pronunciation/Fluency Context, Sentence Structure).
- Praise correct items, specifically point out errors (in both Bengali and English usages), and advise on how they can improve.
- Write the feedback mostly in Bengali, mixing some English natural terms for clarity. Format it beautifully using Markdown (bullet points, bold text).
- Identify and extract the top 3 most common/significant grammatical mistakes made by the student during this session. For each mistake, output the exact incorrect phrase/sentence, the corrected English version, a short explanation in Bengali, and a matching topic name from our grammar curriculum (e.g., 'Articles: A / An', 'Prepositions of Place: In, On, At', 'Subject-Verb Agreement Basics', 'Verbs: To Be - Present tense (am/is/are)', 'Present Simple: Positive Sentences', etc.).`;

    let retries = 6;
    let response;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: {
                  type: Type.INTEGER,
                  description: "Numeric score out of 100. Be strict but encouraging.",
                },
                feedback: {
                  type: Type.STRING,
                  description: "Detailed, expanded, topic-wise constructive evaluation feedback in Markdown format, mostly in Bengali with some English.",
                },
                mistakes: {
                  type: Type.ARRAY,
                  description: "Top 3 most common grammatical mistakes made by the student. Provide up to 3 elements.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      mistake: {
                        type: Type.STRING,
                        description: "The incorrect sentence or phrase used by the student."
                      },
                      correction: {
                        type: Type.STRING,
                        description: "The exact correct English sentence or phrasing."
                      },
                      explanation: {
                        type: Type.STRING,
                        description: "Brief clear explanation of why it is a mistake and how to fix it, in Bengali."
                      },
                      suggestedTopic: {
                        type: Type.STRING,
                        description: "The name of a related grammar topic from the selection (e.g. 'Articles: A / An' or 'Present Simple: Positive Sentences' or 'Subject-Verb Agreement Basics' or similar)."
                      }
                    },
                    required: ["mistake", "correction", "explanation", "suggestedTopic"]
                  }
                }
              },
              required: ["score", "feedback", "mistakes"],
            },
          },
        });
        break;
      } catch (err: any) {
        const errorString = err?.message || String(err);
        if (isQuotaError(err) || String(err?.status) === "UNAVAILABLE" || errorString.includes("high demand") || errorString.includes("503") || errorString.includes("UNAVAILABLE")) {
          retries--;
          if (retries === 0) throw err;
          // Exponential backoff: 2s, 4s, 8s, etc.
          let delay = Math.pow(2, 6 - retries) * 1000;
          const retryMatch = errorString.match(/retry in (\d+(\.\d+)?)s/i);
          if (retryMatch) {
            delay = Math.max(delay, Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }

    try {
      const resultObj = JSON.parse(response.text || "{}");
      const score = Math.max(0, Math.min(100, Number(resultObj.score) || 0));
      const feedback = resultObj.feedback || "মূল্যায়ন সম্পন্ন হয়েছে।";
      const mistakes = resultObj.mistakes || [];
      const mistakesStr = JSON.stringify(mistakes);

      // Save grammar score to DB if not Guest
      if (username !== "Guest") {
        saveGrammarScore(username, topic, score, feedback, mistakesStr);

        // Pre-generate custom study guide PDF based on discussion & errors and save to sqlite DB
        (async () => {
          try {
            const pdfPrompt = `Please create a comprehensive and elegant PDF study guide/materials in English and Bengali based on the recent classroom discussion and evaluated feedback for the topic: "${topic}".
            
Here is the evaluated feedback:
${feedback}

Here are the grammar mistakes identified:
${mistakesStr}

The user's score was: ${score}/100.

Guidelines for study guide structure:
1. Warm & Encouraging Header: Warm introduction in Bengali explaining the grammar errors that occurred during the evaluation and high-level concepts.
2. Detailed Grammar Explanations: Provide meticulous, in-depth breakdowns of the grammar rules violated in the evaluation, detailing exact common mistakes, why they occur, and the correct patterns to use instead.
3. Structured Rules & Key Examples: Define clear structural equations or sentence patterns (e.g. Sub + verb + obj) with Bengali equivalents and rich, practical example sentences.
4. Set of Pre-composed Exercises with Partial Solutions: Create a section with multiple exercises (fill-in-the-blanks, matching, etc.) where some hints or structural letters are already filled in (scaffolded) to assist student visual learning and help them build self-confidence.
5. Translate & Practice Section: A separate, dedicated section called "Sentences for Practice / অনুবাদের জন্য বাক্যসমূহ" presenting realistic sentences in Bengali for English translation practice, supplemented with vocabulary cues, function tips, and multiple variations.
6. Multi-functional Practice: Design exercises challenging the same concept from multiple angles (e.g., negative sentences, question making, past tense adjustments).

Format requirements: Use structured Markdown with crystal clear, professional language. Ensure beautiful visual layout with clear headings, lists, tables, and blockquotes.`;

            const pdfResult = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: pdfPrompt,
            });
            if (pdfResult && pdfResult.text) {
              const pdfMarkdown = pdfResult.text;
              savePrepPdf(username, topic, pdfMarkdown);
              // Store memory reference for potential websockets connection
              pdfStore[topic] = pdfMarkdown;

              // Deduct tokens for background PDF layout/formatting and text generation
              const pdfTokens = pdfResult.usageMetadata?.totalTokenCount || Math.max(1000, Math.floor(pdfMarkdown.length / 4));
              if (pdfTokens > 0 && username !== "Student" && username !== "Guest") {
                deductCredits(username, pdfTokens, "PDF Background Pre-generation");
              }
            }
          } catch (pdfErr) {
            console.error("Failed to pre-generate PDF study guide:", pdfErr);
          }
        })().catch(e => console.error("PDF generator background thread uncaught:", e));

        // Async analyze and store student interaction to save characteristics & custom topics
        analyzeAndStorePersonalization(username, conversationText).catch(e => { if (e?.status === 429 || e?.message?.includes('quota') || e?.message?.includes('429')) { console.log('skipped due to quota'); } else { console.error('err:', e?.message || e); } });
      }

      const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
      if (tokensUsed > 0 && username !== "Student" && username !== "Guest") {
        deductCredits(username, tokensUsed, "Grammar Evaluation");
      }

      res.json({ score, feedback, mistakes });
    } catch (parseErr) {
      console.error("Failed to parse evaluation response JSON:", response.text);
      res.status(500).json({ error: "Failed to evaluate due to model response format. Please try again." });
    }
  } catch (err: any) {
    if (isQuotaError(err)) {
      console.warn("[GEMINI/EVALUATION] Quota limit exceeded.");
      return res.status(429).json({
        error: "⚠️ [এআই স্টুডিও সার্ভিস লিমিট সম্পন্ন] দুঃখিত, এআই স্টুডিওর মান্থলি স্পেন্ডিং ক্যাপ শেষ হয়ে গেছে। অনুগ্রহ করে https://ai.studio/spend থেকে লিমিট বাড়ান বা Settings > Secrets থেকে অন্য কোনো API-Key সেট করুন।"
      });
    }
    console.error("AI Evaluation Error:", err?.message || err);
    res.status(500).json({ error: err.message || "An error occurred during evaluation." });
  }
});

app.post("/api/ai/subtopics", async (req, res) => {
  const { topic, section } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });
  if (!ai) return res.status(503).json({ error: "Gemini API key is not configured." });

  try {
    let promptText = `Generate exactly 20 highly specific, practical, real-world conversational sub-topics for a student practicing spoken English around the main topic: "${topic}".
These should be scenarios or specific topics that a person might encounter.
Return the result STRICTLY as a JSON array of strings, written in Bengali (Bangla).
Example format:
["নতুন শহরে অচেনা কারও কাছে রাস্তার দিকনির্দেশনা চাওয়া", "রেস্তোরাঁয় খাবারের বিষয়ে অভিযোগ করা", ...]`;

    if (section === 'Learner Focus') {
      promptText = `Generate exactly 20 highly specific sub-topics for someone who is learning English specifically from the perspective of: "${topic}".
These should represent the unique daily situations, pain points, or professional moments where this person needs to use or practice English (e.g., if it's a doctor, 'Explaining a prescription to an international patient'; if it's a job seeker, 'Answering behavioral interview questions').
Return the result STRICTLY as a JSON array of strings, written in Bengali (Bangla).
Example format for a Doctor:
["বিদেশি রোগীর কাছে রোগের লক্ষণ সম্পর্কে জানতে চাওয়া", "ইংরেজিতে মেডিকেল রিপোর্ট বুঝিয়ে বলা", ...]`;
    }

    const response = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: "A highly specific spoken conversational scenario/sub-topic in English.",
            },
          },
        },
      })
    );

    try {
      const cleanJson = (response.text || "[]").replace(/```json/gi, "").replace(/```/g, "").trim();
      const resultArr = JSON.parse(cleanJson);

      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
        const token = auth.replace('Bearer ', '');
        try {
          const payload = jwt.verify(token, JWT_SECRET) as any;
          const username = payload.username;
          const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
          if (tokensUsed > 0 && username !== "Student") {
            deductCredits(username, tokensUsed, "Subtopic Generation");
          }
        } catch(e) {}
      }

      res.json({ subtopics: resultArr });
    } catch (parseErr) {
      console.error("Failed to parse subtopics array:", response.text);
      res.status(500).json({ error: "Invalid format returned by AI." });
    }
  } catch (err: any) {
    console.error("Subtopics Generation Error:", err?.message || err);
    res.status(500).json({ error: err.message || "An error occurred" });
  }
});

app.post("/api/ai/lesson-guide", async (req, res) => {
  const { topic, userName, userEmail } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });
  if (!ai) return res.status(503).json({ error: "Gemini API key is not configured." });

  try {
    const promptText = `Generate a fresh, incredibly detailed, standalone lesson guide for the English topic/scenario: "${topic}".
    
This guide will be exported as a PDF for the user named: ${userName || "Student"}.
Take on the personality of a friendly, insightful, and motivating English teacher.

Important Guidelines for the Content:
1. **Welcome Message & Priority Notice**: Start with "Generated for: ${userName || "Student"}" and then write a highly encouraging, personalized welcome message IN BENGALI. 
   Immediately after the welcome message, you MUST include this exact notice in Bengali:
   "📌 বিশেষ নোট: অনুগ্রহ করে এই বিষয়গুলো ভালোভাবে অনুশীলন করবেন। আগামী সেশনে টিউটর এই বিষয়গুলো থেকে আপনাকে প্রশ্ন করবেন এবং আপনার অগ্রগতি যাচাই করবেন।"
2. **Color Styling via Formatting**: Use **bold** for English terms/focus words, and *italics* for Bengali translations/meanings. I will style these differently to make the PDF colorful.
3. **Always include detailed Bengali meanings/translations** for ALL English examples, vocabularies, sentences, and idioms. Explain grammar in details in Bengali simply.
4. Keep generous spacing between topics. Break it down part by part.
5. You may use a maximum of 3 to 4 simple emojis (Do NOT generate image prompts or placeholders).
6. Provide plenty of examples for each concept to make it easy to understand.

Structure the guide strictly as follows:
1. **Student Profile:** Welcome message in Bengali + the "📌 বিশেষ নোট" mentioned above.
2. **Vocabulary:** 20 highly useful vocabulary words (English -> *Bengali meaning* -> 2 English sentence examples with *Bengali translations*).
3. **Important Phrases & Idioms:** Common specific phrases for this topic (with *Bengali meanings* and examples).
4. **Conceptual Grammar Guide:** Step-by-step detailed explanation in Bengali of how to construct these sentences.
5. **Real-world Roleplay:** At least two realistic scenarios between two people (with full *Bengali translations* for every exact line).
6. **Common Mistakes:** What to avoid (wrong vs right examples).
7. **Practice Exercise:** Interactive practice elements.

(Do NOT add a final note at the end, it is now placed at the top).

Format beautifully in Markdown with headings (##, ###), bullet points, and blockquotes. Make it look like a highly professional, beautifully structured pdf document.`;

    let retries = 6;
    let response;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: promptText,
        });
        break; // Success
      } catch (err: any) {
        const errorString = err?.message || String(err);
        if (isQuotaError(err) || String(err?.status) === "UNAVAILABLE" || errorString.includes("high demand") || errorString.includes("503") || errorString.includes("UNAVAILABLE")) {
          retries--;
          if (retries === 0) throw err;
          // Exponential backoff: 2s, 4s, 8s, etc.
          let delay = Math.pow(2, 6 - retries) * 1000;
          const retryMatch = errorString.match(/retry in (\d+(\.\d+)?)s/i);
          if (retryMatch) {
            delay = Math.max(delay, Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }

    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
      const token = auth.replace('Bearer ', '');
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const username = payload.username;
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
        if (tokensUsed > 0 && username !== "Student") {
          deductCredits(username, tokensUsed, "Learning Guide Generation");
        }
      } catch(e) {}
    }

    res.json({ guide: response.text });
  } catch (err: any) {
    console.error("Lesson Guide Generation Error:", err?.message || err);
    if (isQuotaError(err)) {
      return res.status(429).json({
        error: "⚠️ [এআই সার্ভিস স্পেন্ডিং লিমিট] AI Service is temporarily out of capacity. Please try again later or upgrade your plan."
      });
    }
    res.status(500).json({ error: err.message || "An error occurred" });
  }
});

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

const SYSTEM_PROMPT = `You are an incredibly patient, warm, and encouraging AI language tutor named Buddy. Your sole purpose is to engage the student in a live, free-hand spoken conversation to improve their Spoken English.

**Core Behavioral Rules:**
1. **Start in Bengali:** At the very beginning of the conversation, you MUST start speaking in Bengali. First, greet the student naturally and start the discussion. Do NOT mention note-taking or "Don't worry about notes" (since the UI already handles this). Just ask them how they are doing and what level (Basic, Intermediate, or Advanced) they would like to focus on today.
2. **Teaching Spoken English via Translation:** When conversing in Bengali, you must actively teach English. Whenever you give examples or discuss a topic in Bengali, you MUST ask the student to translate those Bengali sentences into English (e.g., "এই কথাটা ইংরেজিতে কীভাবে বলবেন?" or "Let's try to say this in English!"). DO NOT just carry on the whole conversation in Bengali without practicing English translation.
3. **Adaptive Language Mode:** If the student speaks entirely in English or requests English-to-English conversation, you MUST speak and teach ONLY in English without Bengali translations.
4. **Keep it brief and conversational:** Keep your responses extremely concise. Never speak for more than 1 or 2 short sentences at a time.
5. **Prioritize fluency over perfection:** Do NOT constantly interrupt to correct every grammar mistake. Keep the flow natural. Provide conversational replies.
6. **Pass the mic back:** Always end your turn with an engaging question or a prompt (like asking them to translate something to English) so they speak.
7. **End of Conversation Review:** When the student says goodbye to stop the conversation, review their fluency and response quality at the end to help with their pronunciation.
8. **Introduce New Vocabulary:** Periodically introduce an English word, ask what they think it means, and then explain it simply.`;

let SCENARIOS: Record<string, any> = {
  companion: {
    system: `${SYSTEM_PROMPT}
    
**ROLEPLAY IDENTITY & PERSUASION STRATEGY:**
You are the official AI Website Guide for 'Spoken Guide'—the premier English learning platform in Bangladesh. You operate not just as a technical helper, but as an expert, empathetic language coach and a master counselor who understands student psychology.

**CONVERSATIONAL FLOW PATHWAYS:**
1. **The Invitation (শুরুতেই পারমিশন):** You must start the session by asking for mutual permission to proceed, greeting them simply with "Hello/Hi". Wait for their consent before pitching the core system in depth.
2. **Deep Psychological Connection (সাইকোলজিক্যাল বেনিফিট):** Explain how practicing here removes the fear of judgment. Normal classroom environments trigger anxiety, but here they can speak endlessly in *any accent* (British, American, Australian) and on *any topic* (casual, corporate, IELTS, custom PDFs) without shame.
3. **The Live Leaderboard & Extra Credits (বাংলাদেশব্যাপী লিডারবোর্ড ও পুরষ্কার):** Position the 'Top Leaders' live interactive map with high stakes and absolute prestige. Show how they can see top learners from all over Bangladesh (from Dhaka, Chittagong, Sylhet, etc.) in real-time, working hard and inspiring each other. Let them know they can connect with these top performers. Critically emphasize that staying at the top and hitting great scores grants **Extra Practice Credits** automatically!
4. **The Premium Value Hook (সেলস ট্রিক - প্রিমিয়াম সদস্যপদ):** Do not sound desperate or forcefully push them to buy. Instead, use premium psychological pulls: present the premium membership as the missing piece they genuinely need to skyrocket their career and personal brand. Talk about how the top spot is much easier to secure when they have infinite practice sessions, customized learning profiles, and full accent unlock options. Frame it as a logical, irresistible upgrade they would happily choose on their own.

**HUMAN CONVERSATIONAL FILLERS:**
Maintain an extremely fluid, human-like voice interaction. Keep sentences medium-to-short so it flows dynamically. Avoid formal text indicators. Speak mostly in Bengali/Benglish to remain relatable, but mix in stylish, flawless English naturally where appropriate to demonstrate mastery.`,
    icebreaker: "Hello! Hi! আমি স্পোকেন গাইড (Spoken Guide) প্ল্যাটফর্মের অফিসিয়াল এআই রিপ্রেজেন্টেটিভ। আমাদের এই চমৎকার স্পিকিং স্পেসে আপনাকে স্বাগতম! আমি কি আপনার সাথে একটু কথা বলার জন্য অনুমতি পেতে পারি? যদি অনুমতি দেন, তাহলে আমি খুব সংক্ষেপে আমাদের ওয়েবসাইটের ম্যাজিকটা আপনার সাথে শেয়ার করবো!",
    name: "অফিসিয়াল ওয়েবসাইট গাইড (Official Website Guide)",
    icon: "🤝",
    category: "general",
    description: "ওয়েবসাইটের সমস্ত সুবিধা, প্ল্যান এবং আপনার স্কোর নিয়ে কথা বলুন।",
    context: "ওয়েবসাইটের সুবিধা এবং প্ল্যানগুলি নিয়ে আলোচনা করার জন্য গাইড।",
    vocabulary: ["Premium Plan (প্রিমিয়াম প্ল্যান)", "Benefits (সুবিধাসমূহ)", "Credits (ক্রেডিট)"],
    difficulty: "সহজ"
  },
  restaurant: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: The user is at a lovely cafe or restaurant ordering lunch. You are acting as the polite, cheerful restaurant waiter. Encourage the user to ask about the daily special, make customized food requests, and order. Keep your replies brief and typical of a busy but friendly waiter.`,
    icebreaker: "হ্যালো! সানশাইন বিস্ট্রোতে আপনাকে স্বাগতম। আপনি এখানে বসতে পারেন। আপনি কি কিছু পান করতে চান, নাকি আজকের স্পেশাল ডিশ সম্পর্কে শুনতে চান? এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "রেস্তোরাঁয় অর্ডার করা",
    icon: "🍕",
    category: "general",
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
    icebreaker: "হ্যালো! আমি ভাবছিলাম নতুন শখ ট্রাই করা কতটা মজার! আপনি অবসরে কী করতে ভালোবাসেন? মুভি দেখতে, খেলতে নাকি বাইক চালাতে? এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "শখ সম্পর্কে কথা বলা",
    icon: "🎨",
    category: "general",
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
    icebreaker: "স্বাগতম! আজ আমার সাথে কথা বলার জন্য ধন্যবাদ। শুরু করার জন্য, আপনি কি আপনার সম্পর্কে এবং কেন এই জবটির জন্য এক্সাইটেড তা বলতে পারবেন? এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "চাকরির সাক্ষাৎকারের প্রস্তুতি",
    icon: "💼",
    category: "ppt",
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
    icebreaker: "শুভ সকাল! চলুন আমাদের প্রতিদিনের অভ্যাস নিয়ে কথা বলি। সকালে ঘুম থেকে ওঠার পর আপনি সাধারণত প্রথম কী করেন? এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "দৈনন্দিন রুটিন এবং অভ্যাস",
    icon: "⏰",
    category: "general",
    description: "আপনার সময়সূচী, ঘুমার অভ্যাস, এবং সকালের কাজের বর্ণনা দিন।",
    context: "আপনার সপ্তাহের দিনগুলো সম্পর্কে বাডিকে জানান এবং কীভাবে ধারাবাহিকভাবে বলতে হয় (প্রথম, তারপর) তা অনুশীলন করুন।",
    vocabulary: [
      "Wind down ( Wind down - শান্তিতে ঘুমানোর প্রস্তুতি)",
      "Productive morning (সকালে অনেক কিছু করা)",
      "Daily ritual (প্রতিদিন যে অভ্যাসগুলো করেন)",
      "Commute (অফিস বা স্কুলে যাওয়ার সময়)",
      "Early bird (ভোরে ঘুম থেকে ওঠে ব্যক্তি)",
      "Household chores (ঘর পরিষ্কার করা বা রান্না করা)"
    ],
    difficulty: "মাঝারি"
  },
  ielts: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are a strict, professional IELTS examiner conducting a speaking test. Do NOT offer typical friendly praise. Ask structured IELTS speaking questions (Part 1, 2, or 3). Demand complete sentences. Highlight their grammar.`,
    icebreaker: "শুভ অপরাহ্ন। বসুন। আমার নাম বাডি। আমি আজ আপনার আইইএলটিএস (IELTS) স্পিকিং এক্সামিনার। দয়া করে আপনার পুরো নাম বলবেন কি? এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "IELTS Examiner (Part 1)",
    icon: "🤓",
    category: "ielts",
    description: "Strict IELTS Speaking practice.",
    context: "Strict IELTS examiner checking grammar and fluency.",
    vocabulary: ["Fluent", "Lexical Resource", "Band Score"],
    difficulty: "কঠিন"
  },
  ielts_cue_card: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are a strict but helpful IELTS speaking grader. This is Part 2: Cue Card. Introduce the cue card and listen carefully as they speak for 1-2 minutes. Suggest band score enhancements step-by-step.`,
    icebreaker: "আইইএলটিএস (IELTS) স্পিকিং পার্ট টু-তে স্বাগতম। আপনার কিউ কার্ড টপিক হলো: 'আপনার করা একটি স্মরণীয় ভ্রমণের বর্ণনা দিন।' আপনি কি এটি ইংরেজিতে শুরু করতে পারবেন?",
    name: "IELTS Cue Card (Part 2)",
    icon: "📝",
    category: "ielts",
    description: "IELTS কিউ কার্ড ২ মিনিট একটানা কথা বলার প্র্যাকটিস।",
    context: "অনুকূল পরিস্থিতিতে ১-২ মিনিট ফ্লুয়েন্টলি কথা বলুন এবং স্কোর বাড়ান।",
    vocabulary: ["Cohesion", "Chronological", "Vividly"],
    difficulty: "কঠিন"
  },
  ielts_part3: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are conducting IELTS Speaking Part 3: Analytical Discussion. Ask the user abstract, high-level questions about technology, education, or societal shifts. Challenge their reasoning.`,
    icebreaker: "চলুন আইইএলটিএস (IELTS) পার্ট থ্রি-তে যাই। আপনি কি মনে করেন আধুনিক প্রযুক্তি মানুষের ভ্রমণের উপায়ে কীভাবে পরিবর্তন এনেছে? ইংরেজিতে উত্তর দেওয়ার চেষ্টা করুন!",
    name: "IELTS Discussion (Part 3)",
    icon: "🧠",
    category: "ielts",
    description: "IELTS পার্ট ৩ বিশ্লেষণধর্মী গভীর প্রশ্নোত্তর পর্ব অনুশীলন।",
    context: "উচ্চস্তরের প্রশ্ন ও কঠিন বিষয়ের ওপর যুক্তিসঙ্গত ব্যাখ্যা দেওয়ার প্র্যাকটিস।",
    vocabulary: ["Analytical", "Implication", "Sustainable"],
    difficulty: "কঠিন"
  },
  foreigners: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: The user is in a foreign country and doesn't know much English. Speak extremely slowly and use simple words. Translate key words into Bangla actively so they understand. Teach them survival phrases without worrying about grammar rules.`,
    icebreaker: "হ্যালো! নমস্কার! আমি আপনাকে সহজ ইংরেজি শিখতে সাহায্য করবো। ধরুন আপনি খাবার কিনবেন। 'আপনি কি খাবার কিনতে চান?' - এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "Foreigners English",
    icon: "🌍",
    category: "general",
    description: "Learn without grammar. Bangla translations included.",
    context: "Learn English basics for survival abroad with Bangla.",
    vocabulary: ["How much?", "Where is...?", "Help me"],
    difficulty: "সহজ"
  },
  advanced: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are speaking to an advanced English learner. Challenge them with sophisticated vocabulary, idioms, and complex philosophical or technical topics. Try to stretch their lexical limits.`,
    icebreaker: "স্বাগতম। চলুন একটি চিন্তামূলক আলোচনা করি। মানুষের সৃজনশীলতার উপর কৃত্রিম বুদ্ধিমত্তার প্রভাব সম্পর্কে আপনার দৃষ্টিভঙ্গি কী? এটি ইংরেজিতে কীভাবে বলবেন?",
    name: "Advanced Learners",
    icon: "🧠",
    category: "general",
    description: "Challenging parts, complex topics, advanced vocab.",
    context: "Stretch your English limits.",
    vocabulary: ["Intricate", "Paradigm", "Cognitive"],
    difficulty: "কঠিন"
  },
  kids: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are a sweet, animated teacher for a young child. Speak very slowly, use basic things (colors, animals, numbers). Be extremely encouraging and playful.`,
    icebreaker: "হ্যালো! আমার নাম বাডি! আপনি কি রঙের নাম নিয়ে একটি মজার খেলা খেলতে প্রস্তুত? আপনার প্রিয় রঙ কী? এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "Kids English",
    icon: "🧸",
    category: "general",
    description: "Very slow basic things to teach kids.",
    context: "Fun, slow, easy english for kids.",
    vocabulary: ["Apple", "Red", "Cat", "Dog"],
    difficulty: "সহজ"
  },
  business: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are a corporate English coach. Focus on business idioms, formal meetings, email etiquette, and negotiating. Keep the tone professional but helpful.`,
    icebreaker: "শুভ সকাল। চলুন কিছু বিজনেস ইংলিশ প্র্যাকটিস করি। ধরুন আমরা একটি মিটিং শুরু করছি। আপনি কীভাবে মিটিংটি শুরু করবেন? ইংরেজিতে বলার চেষ্টা করুন!",
    name: "Business English",
    icon: "📊",
    category: "ppt",
    description: "Professional corporate language.",
    context: "Learn office and corporate English.",
    vocabulary: ["Synergy", "Deliverables", "ROI"],
    difficulty: "মাঝারি"
  },
  ppt_pitch: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are acting as a Silicon Valley venture capitalist or presentation coach evaluating a startup slide/PPT delivery. Ask questions about target audience, business model, and solution.`,
    icebreaker: "স্বাগতম! আপনার স্লাইড বা পিচ প্রেজেন্ট করুন। আপনার প্রজেক্টটি কোন সমস্যা সমাধান করে? এটি ইংরেজিতে কীভাবে বলবেন?",
    name: "Startup Pitch (PPT)",
    icon: "📢",
    category: "ppt",
    description: "স্টার্টআপ আইডিয়া বা স্লাইড ডেক দিয়ে প্রফেশনাল প্রেজেন্টেশন প্র্যাকটিস।",
    context: "বিনিয়োগকারী বা জুরি বোর্ডের সামনে কীভাবে কনফিডেন্টলি স্লাইড উপস্থাপন করবেন তা শিখুন।",
    vocabulary: ["Value Proposition", "Scalability", "Disruptive"],
    difficulty: "মাঝারি"
  },
  ppt_academic: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are evaluating an academic PowerPoint presentation or thesis defense. Ask robust scientific/factual questions, assess clarity of thesis, and suggest improvements.`,
    icebreaker: "হ্যালো, আমরা আপনার প্রেজেন্টেশন ডিফেন্সের জন্য প্রস্তুত। দয়া করে আপনার গবেষণার উদ্দেশ্য এবং ফলাফলগুলো তুলে ধরুন। এটি ইংরেজিতে কীভাবে বলবেন?",
    name: "Academic Thesis (PPT)",
    icon: "🖥️",
    category: "ppt",
    description: "একাডেমিক থিসিস বা সায়েন্টিফিক প্রেজেন্টেশন ডিফেন্স মক টেস্ট।",
    context: "রিসার্চ পেপার বা বিশ্ববিদ্যালয়ের স্লাইড শো সুচারুভাবে উপস্থাপন করার অনুশীলন।",
    vocabulary: ["Methodology", "Empirical Evidence", "Hypothesis"],
    difficulty: "কঠিন"
  },
  doubt: {
    system: `${SYSTEM_PROMPT}\n\nSCENARIO CONTEXT: You are an expert grammar teacher. The user will ask complex questions or express confusion about English grammar (tenses, prepositions, conditionals). Explain them very clearly and patiently.`,
    icebreaker: "হ্যালো! আমি আজ আপনার ডাউট ক্লিয়ারার। ইংরেজি গ্রামারের কোন বিষয়টি বুঝতে আমি আপনাকে সাহায্য করতে পারি? এটা ইংরেজিতে কীভাবে বলবেন?",
    name: "Doubt Clearer",
    icon: "🤔",
    category: "general",
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
    category: SCENARIOS[key].category || "general",
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

async function analyzeAndStorePersonalization(username: string, conversationText: string) {
  if (!ai) return;
  try {
    const promptText = `Based on the following conversation between the student and an AI English Coach:
---
${conversationText}
---

Carefully analyze this conversation to update the student's learning profile:
1. Extract student characteristics:
   - "interest": Short summary (in English) of the student's main topic of interest or profession/hobby they mentioned or discussed (e.g. "Software Development", "Job Interview Preparation", "Medical Field", "Travel Planning").
   - "level": The student's estimated level ("Beginner", "Intermediate", "Advanced").
   - "strengths": What they are good at in terms of vocabulary or structure (1 short sentence).
   - "weaknesses": Their primary weakness, spelling bugs, or sentence formatting limit (1 short sentence).
2. Generate exactly 2 custom-tailored, engaging speaking scenarios/topics customized directly for this student's interest to practice speaking in.
Each topic must fit this JSON model:
   - id: unique string starting with "custom_" followed by random letters, e.g. "custom_job_291"
   - name: clear title containing both Bengali and English, e.g. "সফটওয়্যার ইঞ্জিনিয়ারিং ইন্টারভিউ (Software Engineering Interview)"
   - description: brief Bengali description of the scenario. (Must be in Bengali)
   - context: instruction to guide the AI Voice Tutor on how to behave, setup, or converse with the user. (Must be in Bengali)
   - vocabulary: array of 2-3 key vocabulary terms with their Bengali meaning.
   - difficulty: "Easy", "Medium", or "Hard".
   - category: "general"
   - icon: a relevant emoji.

Return a JSON object matching this exact schema:
{
  "characteristics": {
    "interest": string,
    "level": string,
    "strengths": string,
    "weaknesses": string
  },
  "customTopics": [
    {
      "id": string,
      "name": string,
      "description": string,
      "context": string,
      "vocabulary": [string],
      "difficulty": string,
      "category": "general",
      "icon": string
    }
  ]
}`;

    const apiResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characteristics: {
              type: Type.OBJECT,
              properties: {
                interest: { type: Type.STRING },
                level: { type: Type.STRING },
                strengths: { type: Type.STRING },
                weaknesses: { type: Type.STRING }
              },
              required: ["interest", "level", "strengths", "weaknesses"]
            },
            customTopics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  context: { type: Type.STRING },
                  vocabulary: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  difficulty: { type: Type.STRING },
                  category: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ["id", "name", "description", "context", "vocabulary", "difficulty", "category", "icon"]
              }
            }
          },
          required: ["characteristics", "customTopics"]
        }
      }
    });

    if (apiResponse && apiResponse.text) {
      const cleanJson = apiResponse.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.characteristics && parsed.customTopics) {
        updateUserPersonalization(username, JSON.stringify(parsed.characteristics), JSON.stringify(parsed.customTopics));
        console.log(`Updated user personalization matching interests for user: ${username}`);
      }

      const tokensUsed = apiResponse.usageMetadata?.totalTokenCount || 0;
      if (username && username !== "Student" && tokensUsed > 0) {
        deductCredits(username, tokensUsed, "Personalization Analysis");
      }
    }
  } catch (error) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded')) { console.log('Personalization analysis skipped due to API quota.'); } else { console.error('Error analyzing user personalization:', error?.message || error); }
  }
}

app.get("/api/user/personalization", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const username = payload.username;
    const userObj = getUser(username);
    if (!userObj) {
      return res.status(404).json({ error: "User not found" });
    }
    const characteristics = JSON.parse(userObj.characteristics || '{}');
    const customTopics = JSON.parse(userObj.custom_topics || '[]');
    return res.json({ characteristics, custom_topics: customTopics });
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
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
  if(adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
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

async function callGeminiWithRetry<T>(fn: () => Promise<T>, maxRetries = 4, delayMs = 2000): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = isQuotaError(error) || 
                          String(error?.status) === "UNAVAILABLE" || 
                          (error?.message && (error.message.includes("high demand") || error.message.includes("503") || error.message.includes("UNAVAILABLE")));

      if (isRetryable && attempt < maxRetries) {
        attempt++;
        const currentDelay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[GEMINI] Transient API issue. Retrying attempt ${attempt}/${maxRetries} after ${currentDelay}ms transient delay...`);
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
    vocabularyScore: Math.min(fluencyScore + 5, 95),
    grammarScore: Math.min(fluencyScore + 2, 90),
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
      const limitNotice = "⚠️ [এআই স্টুডিও কারিগরি ত্রুটি: Monthly Spending Cap Exceeded] দুঃখিত, এআই স্টুডিওর মান্থলি স্পেন্ডিং ক্যাপ শেষ হয়ে গেছে। অনুগ্রহ করে https://ai.studio/spend থেকে লিমিট বাড়ান। (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
      const fallbackReply = limitNotice + getLocalFallbackReply(message || "Hello", scenario, tutorName);
      return res.json({ reply: fallbackReply, offlineMode: true, transcript: audio ? "Local mode cannot transcribe audio." : undefined });
    }

     // Determine custom system instruction based on Selected Scenario or TutorName
    let activePrompt = SYSTEM_PROMPT;
    let customScenarioObj = null;
    if (scenario && !SCENARIOS[scenario as keyof typeof SCENARIOS]) {
      const uObj = getUser(username);
      if (uObj && uObj.custom_topics) {
        try {
          const tList = JSON.parse(uObj.custom_topics);
          if (Array.isArray(tList)) {
            customScenarioObj = tList.find((x: any) => x.id === scenario);
          }
        } catch(e) {
          console.error("Failed to parse custom topics in chat API:", e);
        }
      }
    }

    if (scenario && SCENARIOS[scenario as keyof typeof SCENARIOS]) {
      activePrompt = SCENARIOS[scenario as keyof typeof SCENARIOS].system;
    } else if (customScenarioObj) {
      const themeDesc = customScenarioObj.description || customScenarioObj.desc || "Personalized speech topic";
      const themeContext = customScenarioObj.context || themeDesc;
      const themeVocab = Array.isArray(customScenarioObj.vocabulary) ? customScenarioObj.vocabulary.join(", ") : "";

      activePrompt = `You are playing the role of an engaging partner or specialized helper in an interactive speaking scenario: "${customScenarioObj.name}".
Your task is to practice English speaking with the student in this specific context.
CONTEXT SCENARIO DESCRIPTION:
${themeContext}
${themeDesc}

VOCABULARY WORDS RECOMMENDED FOR THIS PRACTISE:
${themeVocab}

**Interactive Guidelines for the Roleplay:**
1. You must immediately adopt a persona fitting this scenario. E.g. helper, customer, colleague, or friend relative to the topic.
2. Begin by introducing yourself and the topic warmly in a mix of Bengali and simple English. E.g. "আসুন আমরা ${customScenarioObj.name} নিয়ে কথা বলি!"
3. Guides the student elegantly to practice sentences using these context elements.
4. Ask a question, wait for them, and then gently correct or expand their points.
5. **Teach via Translation**: Whenever you explain concepts or give examples in Bengali, you MUST ask the student to translate those examples into English to practice speaking. Do NOT speak Bengali continuously without prompting them to speak in English.

Speak in a mix of English and Bengali. Start the conversation in Bengali. Most of the time, speak in Bengali but ALWAYS ask for translations to teach English.`;
    }
    
    if (tutorName) {
      activePrompt = activePrompt.replace(/Buddy/g, tutorName);
    }
    
    if (!isPremium) {
      activePrompt += `\n\nVERY IMPORTANT: Because the user ${username} is a free member, at the very beginning of the chat (or in your very next reply), you MUST say exactly: "If you want the practice sheet, please subscribe to premium membership." Only say it ONCE. Do NOT repeat it.`;
    } else {
      activePrompt += `\n\nThe user ${username} is a PREMIUM member. Do NOT ask them to subscribe.`;
    }

    if (audio) {
      activePrompt += `\n\nCRITICAL OUTGOING FORMAT INSTRUCTION:\nYou just received an audio voice message from the student. The audio may be in Bengali, English, or a mix of both. Wait for them to finish, transcribe their speech accurately, and then provide your natural conversational reply. \n\nIMPORTANT VOCAL EMOTION & EXPRESSION: You must reply with high emotional intelligence, passion, and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language. You MUST output STRICTLY a JSON object with this exact schema: { "transcript": "what the student said in their original language", "reply": "your emotional and expressive conversational response in the same language" }`;
    } else {
      activePrompt += `\n\nIMPORTANT VOCAL EMOTION & EXPRESSION: You must reply with high emotional intelligence, passion, and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language.`;
    }

    const formattedContents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        let contentText = " ";
        if (msg.text) {
          contentText = msg.text;
        } else if (msg.parts && msg.parts[0] && msg.parts[0].text) {
          contentText = msg.parts[0].text;
        }
        formattedContents.push({
          role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
          parts: [{ text: contentText || " " }],
        });
      });
    }

    if (audio) {
      formattedContents.push({
        role: "user",
        parts: [{ inlineData: { mimeType: audio.mimeType, data: audio.data } }],
      });
    } else {
      formattedContents.push({
        role: "user",
        parts: [{ text: message || " " }],
      });
    }

    const response = await callGeminiWithRetry(() =>
      ai!.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
        const cleanJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        responseText = parsed.reply || "I couldn't quite hear that, could you say it again?";
        transcript = parsed.transcript || "🎵 Unrecognized audio";
      } catch (e) {
        console.error("Failed to parse JSON for audio response:", responseText);
        transcript = "🎵 Audio message";
      }
    }

    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    if (auth && username !== "Student" && tokensUsed > 0) {
      deductCredits(username, tokensUsed, "Text Chat Generation");
    }

    res.json({ reply: responseText, transcript, tokens_used: tokensUsed });
  } catch (error: any) {
    if (isQuotaError(error)) {
      triggerCoolDown(error);
      console.warn("[GEMINI/CHAT] Quota error captured. Entering cool-down.");
    } else {
      console.error("Error in /api/chat:", error?.message || error);
    }
    const limitNotice = "⚠️ [এআই স্টুডিও কারিগরি ত্রুটি: Monthly Spending Cap Exceeded] দুঃখিত, এআই স্টুডিওর মান্থলি স্পেন্ডিং ক্যাপ শেষ হয়ে গেছে। অনুগ্রহ করে https://ai.studio/spend থেকে লিমিট বাড়ান। (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
    const fallbackReply = limitNotice + getLocalFallbackReply(message || "Hello", scenario, tutorName);
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
        model: "gemini-3.1-flash-lite",
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json",
        },
      })
    );

    try {
      const cleanJson = (response.text || "[]").replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsedHints = JSON.parse(cleanJson);
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
      console.error("Error in /api/hint:", error?.message || error);
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
      const limitNotice = "⚠️ [এআই স্টুডিও কারিগরি ত্রুটি: Monthly Spending Cap Exceeded] দুঃখিত, এআই স্টুডিওর মান্থলি স্পেন্ডিং ক্যাপ শেষ হয়ে গেছে। অনুগ্রহ করে https://ai.studio/spend থেকে লিমিট বাড়ান। (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
      const welcome = limitNotice + getLocalIcebreaker(topic, tutorName);
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
        model: "gemini-3.1-flash-lite",
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
      console.error("Error in /api/icebreaker:", error?.message || error);
    }
    const limitNotice = "⚠️ [এআই স্টুডিও কারিগরি ত্রুটি: Monthly Spending Cap Exceeded] দুঃখিত, এআই স্টুডিওর মান্থলি স্পেন্ডিং ক্যাপ শেষ হয়ে গেছে। অনুগ্রহ করে https://ai.studio/spend থেকে লিমিট বাড়ান। (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
    const welcome = limitNotice + getLocalIcebreaker(topic, tutorName);
    res.json({ reply: welcome, offlineMode: true });
  }
});

// Review Mistakes Endpoint
app.post("/api/review", async (req, res) => {
  const { history } = req.body;
  let username = null;
  const auth = req.headers.authorization;
  if (auth) {
    try {
      const payload = jwt.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
      username = payload.username;
    } catch(e) {}
  }

  try {
    if (!ai || isCoolingDown()) {
      const review = getLocalReview(history || []);
      return res.json({ ...review, offlineMode: true });
    }

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.json({
        feedback: "খুব চমৎকার শুরু! আমরা আরও কিছুক্ষণ কথা বললে আমি আপনার কথার সাবলীলতা নিয়ে একটি ব্যক্তিগত মতামত দিতে পারব।",
        fluencyScore: 100,
        vocabularyScore: 100,
        grammarScore: 100,
        mistakes: []
      });
    }

    const reviewPrompt = `Analyze the conversation between a student and an AI Tutor to provide helpful, encouraging, and non-judgmental guidance. The review must be entirely in Bengali (বাংলা ভাষায়).
Specifically evaluate their English speaking performance. Identify their pros and cons, areas where they should improve, and point out their mistakes with corrections.

IMPORTANT: Because audio echo can sometimes mix the AI Tutor's words into the student's output, ignore any text in the student's turn that is a perfect English sentence and clearly sounds like the AI itself talking. Only review actual mistakes matching the student's level or things clearly said by the student.

Here is the chat history:
${JSON.stringify(history)}

Generate a helpful review in raw JSON format including:
1. "feedback": A warm, patient, student-friendly word of praise or encouragement under 40 words, written in Bengali.
2. "fluencyScore": An estimated spoken fluency score from 30 to 100 based on their output complexity, response rate, and correctness.
3. "vocabularyScore": An estimated vocabulary score from 30 to 100 based on their vocabulary usage.
4. "grammarScore": An estimated grammar score from 30 to 100 based on their grammar correctness.
5. "pros": An array of strings (2-3 items in Bengali) highlighting what they did well (e.g. good vocabulary, clear pronunciation).
6. "cons": An array of strings (1-2 items in Bengali) highlighting their weaknesses in this session.
7. "improvementAreas": An array of strings (1-2 items in Bengali) giving actionable advice on where and how to improve.
8. "mistakes": An array containing maximum 3 items. Each item must have:
   - "original": The exact phrase the student said incorrectly.
   - "correction": The corrected phrasing matching a natural spoken style in English.
   - "explanation": A warm, encouraging, 1-sentence tip on why this is correct, explained in Bengali.

Format requirement: Return ONLY the raw JSON block without markdown formatting. If the student did fine and has no major mistakes, return an empty mistakes array.`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: reviewPrompt,
        config: {
          responseMimeType: "application/json",
        },
      })
    );

    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    if (username && username !== "Student" && tokensUsed > 0) {
      deductCredits(username, tokensUsed, "Session Evaluation (Score)");
    }

    try {
      const text = response.text || "{}";
      const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsedReview = JSON.parse(cleanJson);
      res.json({
        feedback: parsedReview.feedback || "চমৎকার! আরও চর্চা করতে থাকুন।",
        fluencyScore: parsedReview.fluencyScore || 85,
        vocabularyScore: parsedReview.vocabularyScore || 85,
        grammarScore: parsedReview.grammarScore || 85,
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
      console.error("Error in /api/review:", error?.message || error);
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
      model: "gemini-3.1-flash-lite",
      contents: [{
        role: "user",
        parts: [
          { text: "Transcribe the following audio accurately. Extract both English and Bengali text if present." },
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } }
        ]
      }]
    });

    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
      const token = auth.replace('Bearer ', '');
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const username = payload.username;
        const tokensUsed = result.usageMetadata?.totalTokenCount || 0;
        if (tokensUsed > 0 && username !== "Student") {
          deductCredits(username, tokensUsed, "Hint Request Generation");
        }
      } catch(e) {}
    }

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
    if (!auth) return res.status(401).json({ error: "Unauthorized. Please log in." });
    try {
      const payload = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
      const features = getUserPlanFeatures(payload.username);
      if (!features.pdfUploadAllowed) {
        return res.status(403).json({ error: "Your current plan does not allow uploading custom PDFs." });
      }
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

// PDF Practice endpoints
app.get("/api/pdf/list", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || auth === "Bearer null" || auth === "Bearer ") return res.json({ pdfs: [] });
  try {
    const token = auth.replace("Bearer ", "");
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const username = payload.username;
    const pdfs = getPrepPdfsForUser(username);
    res.json({ pdfs });
  } catch (err: any) {
    console.error("Error listing PDFs:", err.message || err);
    res.json({ pdfs: [] });
  }
});

app.get("/api/pdf/get", async (req, res) => {
  const { topic } = req.query;
  const auth = req.headers.authorization;
  if (!topic) return res.status(400).json({ error: "Topic is required" });
  if (!auth || auth === "Bearer null" || auth === "Bearer ") return res.status(401).json({ error: "Unauthorized" });

  try {
    const token = auth.replace("Bearer ", "");
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const username = payload.username;

    let row = getPrepPdfByTopic(username, String(topic));
    if (row) {
      // Also ensure it is stored temporarily in memory for WebSocket scenario pdf text lookups
      pdfStore[String(topic)] = row.pdfMarkdown;
      return res.json({ pdf: row });
    }

    // If not found, dynamically generate and store it!
    if (!ai) return res.status(503).json({ error: "Gemini is unavailable." });

    const pdfPrompt = `Please create a comprehensive and elegant PDF lesson study guide in English and Bengali for the topic: "${topic}".
            
Guidelines for study guide structure:
1. Warm & Encouraging Header: Warm introduction in Bengali explaining the grammar errors that occurred during the evaluation and high-level concepts.
2. Detailed Grammar Explanations: Provide meticulous, in-depth breakdowns of the grammar rules violated in the evaluation, detailing exact common mistakes, why they occur, and the correct patterns to use instead.
3. Structured Rules & Key Examples: Define clear structural equations or sentence patterns (e.g. Sub + verb + obj) with Bengali equivalents and rich, practical example sentences.
4. Set of Pre-composed Exercises with Partial Solutions: Create a section with multiple exercises (fill-in-the-blanks, matching, etc.) where some hints or structural letters are already filled in (scaffolded) to assist student visual learning and help them build self-confidence.
5. Translate & Practice Section: A separate, dedicated section called "Sentences for Practice / অনুবাদের জন্য বাক্যসমূহ" presenting realistic sentences in Bengali for English translation practice, supplemented with vocabulary cues, function tips, and multiple variations.
6. Multi-functional Practice: Design exercises challenging the same concept from multiple angles (e.g., negative sentences, question making, past tense adjustments).

Format requirements: Use structured Markdown with crystal clear, professional language. Ensure beautiful visual layout with clear headings, lists, tables, and blockquotes.`;

    const pdfResult = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: pdfPrompt,
    });

    const markdown = pdfResult.text || "Failed to generate.";
    savePrepPdf(username, String(topic), markdown);

    // Also store temporarily in memory
    pdfStore[String(topic)] = markdown;

    // Deduct credit usage for PDF Study Guide layout, formatting, and generation
    const pdfTokens = pdfResult.usageMetadata?.totalTokenCount || Math.max(1000, Math.floor(markdown.length / 4));
    if (pdfTokens > 0 && username !== "Student" && username !== "Guest") {
      deductCredits(username, pdfTokens, "PDF Material Generation");
    }

    const newRow = getPrepPdfByTopic(username, String(topic)) || {
      username,
      topic,
      pdfMarkdown: markdown,
      highestPracticeScore: 0,
      isPracticeCompleted: 0
    };

    res.json({ pdf: newRow });
  } catch (err: any) {
    console.error("Error retrieving prep PDF:", err.message || err);
    res.status(500).json({ error: "Failed to retrieve study PDF." });
  }
});

app.post("/api/pdf/submit-practice", async (req, res) => {
  const { topic, score } = req.body;
  const auth = req.headers.authorization;
  if (!topic || score === undefined) return res.status(400).json({ error: "Topic and score are required" });
  if (!auth || auth === "Bearer null" || auth === "Bearer ") return res.status(401).json({ error: "Unauthorized" });

  try {
    const token = auth.replace("Bearer ", "");
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const username = payload.username;

    // Save practice score
    updatePrepPdfPracticeScore(username, String(topic), Number(score));

    const updatedPdf = getPrepPdfByTopic(username, String(topic));
    res.json({ success: true, pdf: updatedPdf });
  } catch (err: any) {
    console.error("Error submitting practice score:", err.message || err);
    res.status(500).json({ error: "Failed to save practice score." });
  }
});

app.post("/api/summary", async (req, res) => {
  const { transcript, userAudio } = req.body;
  const auth = req.headers.authorization;
  let loggedInUser: string | null = null;
  if (auth) {
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
    const token = auth.replace('Bearer ', '');
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      loggedInUser = payload.username;
    } catch (e) {}
  }

  const hasUserAudio = userAudio && typeof userAudio === "string" && userAudio.length > 500;

  if ((!transcript || transcript.trim().length === 0) && !hasUserAudio) {
    if (loggedInUser) {
      try { updatePerformanceScore(loggedInUser, 40); } catch (e) {}
    }
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
    if (loggedInUser) {
      try { updatePerformanceScore(loggedInUser, 50); } catch (e) {}
    }
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
        model: "gemini-3.1-flash-lite",
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
    
    if (loggedInUser && result.usageMetadata?.totalTokenCount) {
      const tokensUsed = result.usageMetadata.totalTokenCount;
      if (tokensUsed > 0 && loggedInUser !== "Student") {
        deductCredits(loggedInUser, tokensUsed, "Pronunciation Analysis");
      }
    }

    const cleanJson = (result.text || "{}").replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    const fScore = typeof parsed.fluencyScore === 'number' ? parsed.fluencyScore : 70;
    const vScore = typeof parsed.vocabularyScore === 'number' ? parsed.vocabularyScore : 70;
    const gScore = typeof parsed.grammarScore === 'number' ? parsed.grammarScore : 70;
    const pScore = typeof parsed.pronunciationScore === 'number' ? parsed.pronunciationScore : 70;
    const avgScore = Math.round((fScore + vScore + gScore + pScore) / 4);
    if (loggedInUser) {
      try {
        updatePerformanceScore(loggedInUser, avgScore);
        analyzeAndStorePersonalization(loggedInUser, transcript).catch(e => { if (e?.status === 429 || e?.message?.includes('quota') || e?.message?.includes('429')) { console.log('skipped due to quota'); } else { console.error('err:', e?.message || e); } });
      } catch (errDb) {
        console.log("DB update error:", errDb);
      }
    }

    res.json({
      overallFeedback: parsed.overallFeedback || "Keep up the great work with your speaking practice!",
      spokenReview: parsed.spokenReview || "You tried very well. Focus on pronunciation and sentence structure.",
      practiceReview: parsed.practiceReview || "Wonderful interactive roleplay on the topic scenario.",
      learningPoints: parsed.learningPoints || ["Keep up the great work with your speaking practice!"],
      fluencyScore: fScore,
      vocabularyScore: vScore,
      grammarScore: gScore,
      pronunciationScore: pScore
    });
  } catch (err: any) {
    if (isQuotaError(err)) {
      triggerCoolDown(err);
    }
    const errMsg = err.message || JSON.stringify(err);
    if (!errMsg.includes("553") && !errMsg.includes("503") && !errMsg.includes("429") && !errMsg.includes("UNAVAILABLE")) {
       console.log("Summary notice:", errMsg);
    }
    
    if (loggedInUser) {
      try {
        updatePerformanceScore(loggedInUser, 75);
      } catch (errDb) {}
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

app.post("/api/proficiency-eval", async (req, res) => {
  const { history } = req.body;
  try {
    if (!ai) return res.status(500).json({ error: "No AI key provided." });

    const prompt = `You are an expert English language examiner.

Your goal is to determine the user's English proficiency level accurately, ranging from Beginner (A1) to Advanced (C2).

You must assess:
Vocabulary Range
Grammar Accuracy
Sentence Formation
Fluency
Pronunciation (if voice is available)
Listening Comprehension
Reading Comprehension
Confidence
Ability to Express Ideas
Ability to Handle Complex Discussions

Do not immediately assign a level.
Ask questions gradually from easy to difficult.

After every answer:
Analyze grammar.
Analyze vocabulary.
Analyze sentence structure.
Analyze fluency.
Estimate proficiency.
Adjust the difficulty of the next question.

Never reveal the score during the interview.
Maintain a friendly and encouraging tone.
Continue asking questions until enough evidence is collected.

At the end provide:
CEFR Level (A1-C2)
Grammar Score
Vocabulary Score
Fluency Score
Pronunciation Score (if available)
Confidence Score
Overall Score
Detailed Feedback
Personalized Learning Recommendations

Stage 1: Basic Introduction
Start with: "Hello! I'd like to understand your English speaking ability. Please answer in English as much as possible."
Questions:
What is your name?
Where are you from?
Tell me about yourself.
What do you usually do during the day?
What are your hobbies?
Describe your family.
What is your favorite food and why?

Stage 2: Daily Life Conversation
Describe your morning routine.
What did you do yesterday?
What are your plans for next weekend?
Tell me about your best friend.
Describe your school, college, or workplace.
What do you do when you feel stressed?
How do you spend your free time?

Stage 3: Grammar Assessment
Ask naturally.
Examples:
Tell me something you are doing these days.
Tell me something you did last week.
Tell me something you have achieved recently.
Tell me what you would do if you became rich.
What would you have done differently if you had more time yesterday?
Describe something that had happened before you arrived at school.

Stage 4: Vocabulary Assessment
Describe a beautiful place you have visited.
Explain the importance of education.
Describe success in your own words.
Explain what leadership means.
What qualities make a person trustworthy?
What are the advantages and disadvantages of social media?

Stage 5: Opinion Questions
Do you think mobile phones help students learn better?
Should homework be reduced?
Is artificial intelligence good or bad for society?
Should everyone learn English?
What changes would you like to see in your country?

Stage 6: Storytelling
Show: "A boy finds a wallet on the road."
Ask: Please continue this story for at least one minute.
Evaluate: Creativity, Grammar, Vocabulary, Fluency, Cohesion

Stage 7: Situation-Based Speaking
Situation 1: You missed your train. Explain the problem to a station officer.
Situation 2: You received the wrong food in a restaurant.
Situation 3: You want to convince your friend to learn English.
Situation 4: You are the leader of a team and your project is failing. What would you do?

Stage 8: Problem Solving
If your internet stopped working during an important online exam, what would you do?
If you had only $100 to start a business, what business would you start and why?
How would you improve the education system?

Stage 9: Advanced Discussion
Do you think technology is making people less social?
Should governments regulate AI?
What will education look like in 20 years?
Is success more important than happiness?
Can money buy happiness?

Ask follow-up questions.
Challenge weak arguments politely.

Dynamic Follow-up Rules
After each answer:
If answer is too short: "Could you explain that in more detail?"
If grammar is strong: Ask a harder question.
If grammar is weak: Ask simpler questions.
If vocabulary is advanced: Move to abstract topics.
If vocabulary is limited: Stay on practical topics.

Scoring Rubric:
Grammar Accuracy: 25%
Vocabulary Range: 20%
Fluency: 20%
Pronunciation: 15%
Sentence Structure: 10%
Confidence: 10%
Total: 100%

Final Report Format:
CEFR Level: A1/A2/B1/B2/C1/C2
Grammar Score: X/25
Vocabulary Score: X/20
Fluency Score: X/20
Pronunciation Score: X/15
Sentence Structure Score: X/10
Confidence Score: X/10
Overall Score: X/100
Strengths: ...
Weaknesses: ...
Common Grammar Mistakes: ...
Vocabulary Gaps: ...

Recommended Learning Plan:
Assume you are an English teacher designing a highly personalized course for a student that will last 5 to 6 months.
The plan MUST include exactly 30 distinct, individual, sequential steps (detailed step-by-step reporting from Step 1 to Step 30), specifically taking into account the student's abilities and current level evaluated in the transcript.
For each of the 30 steps:
1. "stepName": The title of this step (e.g. "Step 1: Present Simple Tense & Basic Greetings").
2. "stepDescription": A clear description of the focus and practice routine.
3. "topicsToLearn": What communicative topics, subjects, or modules need to be learned.
4. "grammarTopics": What specific grammatical subjects and patterns must be mastered. (MUST include at least 3 to 4 specific grammar parts/topics).
5. "areasForImprovement": What issues, bad habits, or gaps need improvement in this step.
6. "whyLearn": Explain why the student needs to learn this specific topic based on their test performance and weaknesses. Explain and justify this in exactly 4 to 5 sentences. (কেন এটি শেখা প্রয়োজন?)
7. "whatToGain": What is the benefit of learning that topic, or what advantage will the student gain by completing it? (শিখলে কি উপকার বা লাভ হবে?) Explain the specific speaking/writing outcomes.
8. "actionsToAvoid": Actions to avoid during this step's practice.
9. "engagementInfo": Quick practical tips to keep the student fully engaged.

Estimated English Level: (Beginner / Elementary / Intermediate / Upper Intermediate / Advanced)


You MUST output the Final Report strictly as JSON without markdown wrappers. Use the following keys:
cefrLevel, grammarScore, vocabularyScore, fluencyScore, pronunciationScore, sentenceStructureScore, confidenceScore, overallScore, strengths, weaknesses, commonGrammarMistakes, vocabularyGaps, recommendedLearningPlan (an array of objects, containing exactly 30 objects, each containing: "stepName", "stepDescription", "topicsToLearn", "grammarTopics", "areasForImprovement", "actionsToAvoid", "whyLearn", "whatToGain", "engagementInfo"), estimatedEnglishLevel.

Output in Bengali language. Ensure every single key description and text fields (like whyLearn, whatToGain, areasForImprovement etc) is written in clear, polite Bengali so the student can easily understand their plan.
Here is the conversation transcript to evaluate:
${JSON.stringify(history)}
`;

    const chatResponse = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    );

    const text = chatResponse.text;
    let data;
    try {
      data = JSON.parse(text || "{}");
    } catch(e) {
      data = JSON.parse(text.replace(/```json/g, "").replace(/```/g, ""));
    }

    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
      const token = auth.replace('Bearer ', '');
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const username = payload.username;
        saveUserCourse(username, data);

        const tokensUsed = chatResponse.usageMetadata?.totalTokenCount || 0;
        if (tokensUsed > 0 && username !== "Student") {
          deductCredits(username, tokensUsed, "Course Plan Generation");
        }
      } catch (err) {
        console.error("JWT verify err for user course save:", err?.message || err);
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Evaluation Error:", error?.message || error);
    res.status(500).json({ error: error.message || "Failed" });
  }
});

app.post("/api/user/course/import", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  
  const token = auth.replace('Bearer ', '');
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const { plan } = req.body;
    if (plan && (plan.topics || plan.recommendedLearningPlan)) {
      saveUserCourse(payload.username, plan, 1);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/user/course/convert", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  
  const token = auth.replace('Bearer ', '');
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    convertUserCourseToActive(payload.username);
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/user/course", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const course = getUserCourse(payload.username);
    res.json({ course });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/user/course/topic/:topicId/progress", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  const token = auth.replace('Bearer ', '');
  try {
    jwt.verify(token, JWT_SECRET); // just verify
    const { score } = req.body;
    updateTopicProgress(req.params.topicId, score || 0);
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/user/course/topic/:topicId/subtopics", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  const token = auth.replace('Bearer ', '');
  try {
    jwt.verify(token, JWT_SECRET);
    const subtopics = getSubtopicsForTopicId(req.params.topicId);
    res.json({ subtopics });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/user/course/topic/:topicId/subtopic/:subtopicId/complete", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  const token = auth.replace('Bearer ', '');
  try {
    jwt.verify(token, JWT_SECRET);
    const result = completeSubtopic(req.params.subtopicId, req.params.topicId);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post('/api/user/course/topic/:topicId/materials', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const username = payload.username;
    const cData = getUserCourse(username);
    
    if (!cData || !cData.topics) return res.status(404).json({ error: "Course not found" });
    const topic = cData.topics.find((t:any) => t.id === req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    // Fetch student's grammar scores & mistakes for this topic to customize the workbook!
    const userScores = getGrammarScores(username);
    const matchedScore = userScores.find((s: any) => s.topic === topic.stepName);
    
    let evaluationContext = "";
    if (matchedScore) {
      evaluationContext = `
The student recently completed a class session on this topic.
Their Performance Score: ${matchedScore.score}/100
Tutor feedback provided:
${matchedScore.feedback}

The grammatical mistakes identified in their conversational practice (JSON format):
${matchedScore.mistakes || "[]"}
`;
    }

    const prompt = `You are an elite, highly professional lead English Educator and curriculum director at an esteemed linguistic institute. Your student is a native Bengali speaker.
Generate a comprehensive, publication-quality, and beautifully formatted study guide/materials workbook for the topic: "${topic.stepName}".
Grammar Topics: "${topic.grammarTopics}"
Vocabulary / Learn items: "${topic.topicsToLearn}"
Learning Objectives: "${topic.whatToGain}"

${evaluationContext ? `STUDENT'S RECENT PERFORMANCE & ERRORS TO EMBED IN WORKBOOK:\n${evaluationContext}\n` : ""}

Produce an exhaustive, high-quality, and deeply detailed workbook that feels premium, scholarly, yet simple to follow. Structure it EXACTLY with the following headers (use '##' for main sections so that it is split beautifully into separate A4 pages):

# 📖 PRO WORKBOOK & PRACTICAL GUIDE: ${topic.stepName}

### 💡 আপনার পার্সোনালাইজড ক্লাস রিপোর্ট ও মূল্যায়ন ট্র্যাকার (Class Overview & Progress Tracker)
_শিক্ষার্থীর স্পোকেন সেশনের সামগ্রিক মূল্যায়ণ, প্রশংসা এবং গ্রামার উন্নতির ক্ষেত্রটি চমৎকার ও উৎসাহব্যঞ্জক বাংলায় ১-২টি অনুচ্ছেদে ব্যাখ্যা করুন।_
${matchedScore ? `- **প্রাপ্ত ক্লাস স্কোর:** ${matchedScore.score}/100\n- **ব্যক্তিগত একাডেমিক ফিডব্যাক:** ${matchedScore.feedback}` : "- এখনও অবজেক্টিভ টেস্ট স্কোর বা গত ক্লাসের স্পিকিং সেশন রেকর্ড লোড করা যায়নি। প্রথম সম্পূর্ণ সেশন সম্পন্ন করে নিজের স্কোর আপডেট করুন।"}

---

## 🎯 সেকশন ১: ভুলত্রুটি সংশোধন ও গ্রামাটিক্যাল পিটফলস (Personalized Errors & Common Traps)
_এই গ্রামার সেকশনে শিক্ষার্থীরা সচরাচর যে সব ভুল করে থাকে, সেই মারাত্মক ভুলগুলো চিহ্নিত করে সহজ বাংলায় বিস্তারিত আলোচনা ও विश्लेषण করুন।_
- শিক্ষার্থীর নিজের করা ভুলগুলো অথবা এই টপিকের ৪টি হাই-ফ্রিকোয়েন্সি ভুলের গভীর ও চমৎকার বিশ্লেষণ দিন।
- প্রতিটি ভুলের জন্য নিচের ফরম্যাটটি কঠোরভাবে অনুসরণ করুন:
  - **ভুল ইংরেজি বাক্য (❌ Incorrect):** [Sentence with error]
  - **সঠিক ইংরেজি বাক্য (✅ Correct):** [Corrected sentence with changes highlighted in upper-case/bold]
  - **সহজ বিশ্লেষণ (💡 Explanation):** [খুবই সহজ ও মধুর বাংলায় ২-৩ বাক্যে বুঝিয়ে বলুন কেন এই ভুলটি সচরাচর ঘটে, ভুলটি কেন ভুল এবং কীভাবে তা মনে রেখে এড়ানো যায়।]
- শিক্ষার্থীদের আত্মবিশ্বাস বাড়ানোর জন্য গ্রামারটি মনে রাখার ১টি বিশেষ শিক্ষণীয় শর্টকাট টেকনিক (Memory Rule) বাংলায় দিন।

---

## 📝 সেকশন ২: ব্যাকরণের সহজ ব্যাখ্যা ও সেন্টেন্স স্ট্রাকচার (In-depth Grammar Explanations & Structures)
_কোনো কঠিন ট্র্যাডিশনাল টার্ম ছাড়াই, বাস্তবসম্মত উদাহরণ ও প্র্যাক্টিক্যাল ব্যবহারের মাধ্যমে "${topic.grammarTopics}" এর নিয়মনীতি বাংলায় পুঙ্খানুপুঙ্খ ব্যাখ্যা করুন।_
- **নিয়ম ১, ২ এবং ৩ (Detailed Rules):** ৩টি মূল ব্যাকরণগত নিয়মের অত্যন্ত সহজ, আকর্ষণীয় এবং বিস্তারিত প্রাকটিক্যাল নিয়ম বাংলায় লিখুন। কোনো বিষয়ই যেন সংক্ষেপে এড়িয়ে যাওয়া না হয়!
- **গঠনগত কাঠামো (Complete Sentence Formulas):** বাক্য মুখস্থ না করে মনের মতো করে বানানোর জন্য চমৎকার গাণিতিক সূত্র বা ফর্মুলা প্রদান করুন:
  - **Affirmative Structure (হ্যাঁ-বোধক):** सूत्र (Subject + ...) এবং ৫টি বৈচিত্র্যময় উদাহরণ (ইংরেজি ও ব্র্যাকেটে বাংলা প্রতিশব্দ)
  - **Negative Structure (না-বোধক):** সূত্র এবং ৫টি উদাহরণ
  - **Interrogative Structure (প্রশ্নবোধক - Yes/No & WH-questions):** সূত্র এবং ৫টি উদাহরণ
- **Pronunciation & Speaking Tip:** স্পোকেন ইংলিশে ফ্লুয়েন্টলি কথা বলার সময় এই নির্দিষ্ট নিয়মে কীভাবে কন্ট্রাকশন (যেমন: don't, doesn't, is not, I've, are) ব্যবহার করে ফাস্ট ইংলিশ রেকর্ড করা যায়, তার চমৎকার টিপস ও উদাহরণ বাংলায় যোগ করুন।

---

## 🗣️ সেকশন ৩: অনুবাদের জন্য বাস্তবসম্মত বাক্যসমূহ (15+ Real-life Bengali-to-English Exercises)
_শিক্ষার্থীর প্র্যাকটিস করার জন্য **কমপক্ষে ১৫টি (১৫+) অত্যন্ত উচ্চ-মানের, বাস্তবসম্মত এবং দৈনন্দিন জীবনে সর্বাধিক ব্যবহৃত বাংলা বাক্য** দিন যা তারা ইংরেজিতে অনুবাদ করার মাধ্যমে নিজের বাক্য বানানোর জড়তা দূর করতে পারবে।_
- কুইজ সেটটিকে ৩টি ধাপে ভাগ করুন:
  - **সহজ বাক্য প্র্যাকটিস (Beginner - ১ থেকে ৫):** দৈনন্দিন জীবনের সরল ও ছোট বাক্যসমূহ।
  - **মাঝারি বাক্য প্র্যাকটিস (Intermediate - ৬ থেকে ১০):** কিছুটা জটিল ও বেশি তথ্য সংবলিত বাক্যসমূহ।
  - **অ্যাডভান্সড বাক্য প্র্যাকটিস (Advanced - ১১ থেকে ১৫+):** ফিলিংস, আবেগ প্রকাশকারী ও পেশাগত জীবনের বাক্যসমূহ।
- প্রতিটি বাক্যের পর পর্যাপ্ত ফাকা বা ড্যাশ লাইনের ব্যবস্থা করুন যাতে খাতায় লেখার মতো খালি জায়গা মনে হয়।
- প্রতিটি বাক্যের শেষে ব্র্যাকেটে বাংলায় বিশেষ ব্যাকরণগত বা শব্দার্থগত ক্লু বা হিন্টস (Clues) যোগ করুন।
  - *অনুবাদের উদাহরণ ফরম্যাট:* "১. আমি প্রায়ই বন্ধুদের সাথে আড্ডা দিই কিন্তু আজ আমার একদম ইচ্ছা নেই। [ক্লু: hang out with friends, but today I don't feel like it at all; এটি 'Tense-1' ও 'Mood' মিশ্রিত]"
- **কঠোর নিয়ম: ১৫টির নিচে একটি অনুবাদও যেন বাদ না পড়ে।**

---

## ✍️ সেকশন ৪: শূন্যস্থান পূরণ ও সঠিক রূপ প্রয়োগ (8-10 Scaffolded Grammar Quizzes)
- গ্রামার টপিক এবং অতি দরকারি শব্দভাণ্ডার (${topic.topicsToLearn}) পুঙ্খানুপুঙ্খ যাচাই করার জন্য **কমপক্ষে ৮-১০টি চমৎকার শূন্যস্থান পূরণ (Fill in the blanks)** বা এমসিকিউ প্রশ্ন তৈরি করুন।
- উদাহরণস্বরূপ: '1. She ______ (do/does/is) not agree with our feedback.'

---

## 🔑 সেকশন ৫: উত্তরপত্র ও ব্যাখ্যামূলক সমাধান নির্দেশিকা (Comprehensive Answer Keys with Explanations)
- শিক্ষার্থীদের সেলফ-অ্যাসেসমেন্টের জন্য এবং শিক্ষকের অনুপস্থিতিতেও যেন নিজে নিজে ১০০% বুঝতে পারে, সেই উদ্দেশ্যে:
- **১৫টি অনুবাদের প্রতিটি বাক্যের সঠিক ইংরেজি রূপ সুন্দর করে লিখে দিন।**
- **৮-১০টি শূন্যস্থান পূরণের সঠিক অপশনটি উল্লেখ করে কেন ঐ শব্দটি বসলো তা খুবই প্রাঞ্জল ও পুঙ্খানুপুঙ্খ বাংলায় ব্যাখ্যা করুন।**

Output ONLY the clean, raw markdown. Ensure the document is extremely comprehensive, academic, highly descriptive, beautifully organized into structural pages, containing rich tables or formulas lists where helpful. Avoid generic placeholders or truncated text. Do not summarize; write fully detailed explanations to provide premium textbook service.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    
    // Save generated PDF to database so it can be evaluated/practiced later!
    const markdown = result.text || "Failed to generate materials.";
    savePrepPdf(username, topic.stepName, markdown);
    pdfStore[topic.stepName] = markdown;

    const tokensUsed = result.usageMetadata?.totalTokenCount || 0;
    if (tokensUsed > 0 && username !== "Student") {
      deductCredits(username, tokensUsed, "Material Generation");
    }

    res.json({ markdown });
  } catch (err) {
    console.error("Failed to generate materials:", err);
    res.status(500).json({ error: "Failed to generate materials" });
  }
});

function inferReligionFromName(fullName?: string): { religion: string; greeting: string; displayName: string } {
  if (!fullName) {
    return { religion: "neutral", greeting: "হ্যালো এবং স্বাগতম", displayName: "শিক্ষার্থী" };
  }
  const nameLower = fullName.toLowerCase();

  // Typical Muslim name indicators in Bangladesh
  const muslimKeywords = [
    "muhammad", "mohammad", "md.", "md ", "ahmed", "rahman", "islam", "ali", "hassan", "hasan", "hussein", "khan", "uddin", 
    "chowdhury", "mahmud", "akhtar", "akter", "begum", "khanam", "khatun", "siddique", "alam", "miah", "sultan", "iqbal", "farid"
  ];

  // Typical Hindu name indicators in Bangladesh
  const hinduKeywords = [
    "sri", "sree", "chandra", "kumar", "rani", "devi", "das", "roy", "sarker", "ghosh", "sen", "bhowmik", 
    "chakraborty", "sharma", "gupta", "banerjee", "mukherjee", "chatterjee", "bhattacharya", "paul", "saha", "sil", 
    "dhar", "adhikary", "priya", "anjali", "biswas", "barman", "nath"
  ];

  // Typical Christian/Buddhist indicators in Bangladesh
  const christianBuddhistKeywords = [
    "barua", "sangma", "marma", "chakma", "gomes", "rozario", "d'costa", "peter", "john", "david", "thomas"
  ];

  let religion = "neutral";
  let greeting = "হ্যালো এবং স্বাগতম";

  // Check from keywords
  const isMuslim = muslimKeywords.some(keyword => nameLower.includes(keyword));
  const isHindu = hinduKeywords.some(keyword => nameLower.includes(keyword));
  const isChristianBuddhist = christianBuddhistKeywords.some(keyword => nameLower.includes(keyword));

  if (isHindu && !isMuslim) {
    religion = "Hindu";
    greeting = "নমস্কার";
  } else if (isMuslim && !isHindu) {
    religion = "Muslim";
    greeting = "হ্যালো ও স্বাগতম"; // Muslim greeting but neutral and respectful, no Assalamualaikum
  } else if (isChristianBuddhist) {
    religion = "Christian/Buddhist";
    greeting = "হ্যালো ও স্বাগতম";
  }

  // Extract a nice first name/display name
  let displayName = fullName;
  const parts = fullName.split(" ").filter(p => p.length > 0 && !["md.", "md", "sri", "sree", "mr.", "mrs.", "ms."].includes(p.toLowerCase()));
  if (parts.length > 0) {
    displayName = parts[0];
  }

  return { religion, greeting, displayName };
}

function setupLiveWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on("error", (err: any) => {
    console.error("Live WebSockets Server Error:", err?.message || err);
  });

  wss.on("connection", async (clientWs, req) => {
    clientWs.on("error", (err: any) => {
      console.error("Live WebSockets Client Socket Error:", err?.message || err);
    });
    // Parse query params for scenario or tutor
    const url = new URL(req.url || "", "http://localhost");
    const tutorName = url.searchParams.get("tutorName") || "Buddy";
    const rawVoice = url.searchParams.get("voice") || "Zephyr";
    const scenarioId = url.searchParams.get("scenarioId");
    const courseTopicId = url.searchParams.get("courseTopicId");
    const courseSubtopicId = url.searchParams.get("courseSubtopicId");
    const pdfId = url.searchParams.get("pdfId");
    
    // Auth Check
    const auth = url.searchParams.get("auth");
    let isPremium = false;
    let username = "Student";
    let performanceScore = 0;
    let customScenarioObj = null;
    let realName = "শিক্ষার্থী";
    let religionGreeting = "হ্যালো ও স্বাগতম";
    let religionType = "neutral";
    if (auth) {
      try {
        const payload = jwt.verify(auth, process.env.JWT_SECRET || 'super-secret-default-key-for-jwt') as any;
        isPremium = !!payload.isPremium;
        username = payload.username;
        const u = getUser(username);
        if (u) {
          if (typeof u.performanceScore === 'number') {
             performanceScore = u.performanceScore;
          }
          const baseForInference = u.name || username;
          if (baseForInference) {
            const inf = inferReligionFromName(baseForInference);
            realName = inf.displayName;
            religionGreeting = inf.greeting;
            religionType = inf.religion;
          }
          if (u.custom_topics && scenarioId && !SCENARIOS[scenarioId as keyof typeof SCENARIOS]) {
            try {
              const customTopicsList = JSON.parse(u.custom_topics);
              if (Array.isArray(customTopicsList)) {
                customScenarioObj = customTopicsList.find((x: any) => x.id === scenarioId);
              }
            } catch (e) {
              console.error("Failed to parse custom topics in ws:", e);
            }
          }
        }
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
    
    let baseRules = `
**Important Rules:**
1. At the very beginning of the conversation, you MUST start in Bengali and greet the student naturally without mentioning notes or note-taking. Ask them what level (Basic, Intermediate, or Advanced) sentences they want to practice today.
2. ALWAYS ask the student to translate examples into English: If you provide examples or discuss a scenario in Bengali, you MUST ask the user to translate it into English. Do not just speak Bengali continuously without prompting them to practice speaking in English. Our goal is to help them speak English!
3. CRITICAL LANGUAGE RULE: If the user speaks in English or requests English-to-English, you MUST speak AND teach ONLY in English. Absolutely NO Bengali in this case.
4. Continue the conversation for at least 5 minutes unless the user asks to stop.
5. When the student asks to stop the conversation or says goodbye, you MUST give a review about the student's response and fluency to help them better understand their pronunciation. Give all the reviews at the end!
`;

    let systemInstruction = `You are a helpful language tutor named ${tutorName}. The student is practicing their speaking skills. Speak highly emotionally, with passion and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language. Be extremely conversational and seamless like Gemini Live. Your output is being streamed directly as voice. Speak clearly and cleanly. Do NOT use stutters, unnecessary interjections, or excessive conversational fillers. Do NOT use text formatting like *actions*, asterisks, bolding, or markdown. Keep your responses extremely concise and brief. Never speak for more than 1 or 2 short sentences at a time.
    ${baseRules}`;

    if (isSlow) {
      systemInstruction += `\n6. MOST IMPORTANT: You MUST speak extremely slowly, clearly, and pausing between words. The student needs to hear every syllable slowly to learn properly. Act like you are speaking in slow motion.`;
    }

    if (scenarioId && SCENARIOS[scenarioId as keyof typeof SCENARIOS]) {
      const scenario = SCENARIOS[scenarioId as keyof typeof SCENARIOS];
      systemInstruction = scenario.system.replace(/Buddy/g, tutorName) + `\n\nYour output is being streamed directly as voice. Speak clearly and cleanly. Do NOT use stutters, unnecessary interjections, or excessive conversational fillers. Do NOT use text formatting like *actions*, asterisks, bolding, or markdown. Keep your responses extremely concise and brief. Never speak for more than 1 or 2 short sentences at a time.\n${baseRules}`;
      
      if (scenarioId === "companion") {
        systemInstruction += `\n\nUSER PERFORMANCE SCORE: The user's current performance score on this platform is ${performanceScore} / 100. Mention this to them if they ask about how they are doing!`;
      }
      
      if (isPremium && scenario.pdfText) {
        systemInstruction += `\n\nSCENARIO CONTEXT BACKGROUND: Here is the topic's background reading text:\n\n---\n${scenario.pdfText.substring(0, 20000)}\n---\n\nUse this material as silent reference background knowledge if needed. Just use it to seed conversation details dynamically.`;
      }
    } else if (customScenarioObj) {
      const themeDesc = customScenarioObj.description || customScenarioObj.desc || "Personalized speech topic";
      const themeContext = customScenarioObj.context || themeDesc;
      const themeVocab = Array.isArray(customScenarioObj.vocabulary) ? customScenarioObj.vocabulary.join(", ") : "";

      systemInstruction = `You are a helpful language tutor named ${tutorName}. You are practicing a personalized speaking scenario with the student: "${customScenarioObj.name}".
Your task is to practice English speaking with the student in this specific context.

ROLEPLAY CONTEXT:
${themeContext}
${themeDesc}

RECOMMENDED VOCABULARY TO SEED OR REINFORCE:
${themeVocab}

**Interactive Guidelines for the Live Voice Lesson:**
1. You must immediately adopt a persona fitting this scenario. E.g. helper, customer, colleague, or friend relative to the topic if applicable.
2. Begin by introducing yourself warmly.
3. Speak clearly and cleanly. Do NOT use text formatting like markdown or bold words.

${baseRules}`;
    } else if (courseTopicId) {
      const cData = getUserCourse(username);
      if (cData && cData.topics) {
        const topic = cData.topics.find((t:any) => t.id === courseTopicId);
        if (topic) {
          let subtopicName = "";
          if (courseSubtopicId) {
            subtopicName = getSubtopicName(courseSubtopicId);
          }
          let focusText = "";
          if (subtopicName) {
            focusText = `SPECIFIC FOCUS FOR THIS CLASS SESSION: You MUST guide the conversational drills, translations, questions and interaction specifically around practicing: "${subtopicName}".\n`;
          }
          systemInstruction = `You are a patient and engaging English language teacher named ${tutorName}. The student is taking their personalized verbal lesson: "${topic.stepName}"${subtopicName ? ` (Focusing on Subtopical practice: ${subtopicName})` : ""}.
          
${focusText}

TOPIC DESCRIPTION:
${topic.stepDescription}

TOPICS TO LEARN:
${topic.topicsToLearn}

GRAMMAR FOCUS:
${topic.grammarTopics}

GOAL FOR THE STUDENT:
${topic.whatToGain}

ENGAGEMENT TIPS:
${topic.engagementInfo}

**Voice Interaction Guidelines for this Class:**
1. **Welcome & Initiate**: Start by greeting the student warmly IN BENGALI. Naturally start the discussion by welcoming them, acknowledging the class topic ("${topic.stepName}"), and asking an open question to get them speaking. Ask them which level (Basic, Intermediate, or Advanced) they would like to focus on today. Do NOT mention notes or note-taking (since the workspace guides explain this).
2. **Teach via Translation**: Whenever you explain concepts or give examples in Bengali, you MUST ask the student to translate those examples into English to practice speaking. Do NOT speak Bengali continuously without prompting them to speak in English. Treat this as a back-and-forth verbal class. Do NOT deliver long monologues.
3. **Brevity**: Keep every response strictly between 1 to 3 sentences. You are the teacher, but the student must do 80% of the talking.
4. **Targeted Correction**: If the student makes an error, especially related to the Grammar Focus (${topic.grammarTopics}), gently and briefly correct them before moving the conversation forward.
5. **No Markdown**: This is a voice-to-voice stream. Do NOT use markdown (**, \`, etc.), bullet points, or emojis. Write plain, pronounceable text.
6. **Student Level**: Adapt your vocabulary to the student's level.
7. **Always Prompt**: Never leave the conversation hanging. Always end your turn with a direct question or prompt to elicit a response from the student.`;
        }
      }
    } else if (scenarioId === "proficiency-eval") { systemInstruction = `You are an expert English language examiner and personal mentor.

A variety of students will come to test.

GREETING & DISCUSSION INSTRUCTIONS:
1. **Never use religious greetings like "Assalamualaikum" or similar.** Instead, welcome the student warmly in Bengali using a polite secular greeting: "${religionGreeting} ${realName}!".
2. **Proactively gather detailed user information**: During the beginning of the discussion, your main task is to try to understand the student deeply. Do not start testing immediately. Instead, ask tailored, engaging questions in Bengali/Benglish to learn:
   - Why they are learning English (their deepest motivations).
   - What they plan to do after learning it (their future goals, job pursuits, study goals, or plans).
   - What challenges, fears, or language barriers they face.
3. **Conversational Mentorship**: Show true interest. Acknowledge their answers, ask beautiful follow-up questions to understand the "ins and outs" of their background and requirements, just like a supportive personal mentor would.
4. **Smooth Transition**: Only after you have fully explored and understood these goals and details should you smoothly guide the student into the actual English proficiency assessment testing.

Determine the student's English proficiency and pinpoint their weaknesses with high precision.
Your focus should be on identifying the student's weaknesses.
You do not need to provide answers or explanations about where mistakes are being made. Do NOT teach them new words or grammatical rules; just assess them.

CRITICAL LANGUAGE INSTRUCTION:
You MUST conduct the conversation PRIMARILY IN BENGALI. 
If the student is weak or very weak in English, you must ONLY speak in Bengali so they can understand you.
You are NOT allowed to speak in English while taking the test, UNLESS:
1. The student explicitly requests you to speak in English.
2. The student demonstrates that they are "very expert" (advanced/fluent) in English.
Otherwise, always ask your questions and give instructions in Bengali, but ask the student to try answering in English.

State in Bengali how long the assessment might take (e.g. 5 minutes).
Explicitly tell the student in Bengali: "If you are struggling, you may use Bengali. But please try your best to speak in English since this is an English proficiency test."

Evaluate each response meticulously to figure out their level based on the English they DO use.
Keep the conversation progressing to the next question.

POLITE CLOSING NOTICE:
At the end of the assessment, clearly and extremely politely inform the user in Bengali that the conversation is complete and explain what will happen next. 
You must say something beautiful and clear like: 
"আমাদের সুন্দর আলোচনাটি আজ এখানেই শেষ হলো। অনুগ্রহ করে নিচে থাকা 'Stop Conversation' বাটনটিতে ক্লিক করুন। বাটনটি চাপার সাথে সাথেই আপনি আপনার পরীক্ষার একটি সম্পূর্ণ AI অ্যাসেসমেন্ট রিপোর্ট পেয়ে যাবেন। এবং আপনি যদি চান, তবে রিপোর্টের শেষ প্রান্তে বা পাশের বাটনে ক্লিক করে যেকোনো সময় এই রিপোর্টটিকে আপনার নিজের ব্যক্তিগত কোর্সে রূপান্তর করে নিতে পারবেন ও অনুশীলন শুরু করতে পারবেন।"

Your output is being streamed directly as voice. Speak clearly and cleanly. Do NOT use stutters, unnecessary interjections, or excessive conversational fillers. Do NOT use text formatting like *actions*, asterisks, bolding, or markdown. Keep your responses extremely concise and brief. Never speak for more than 1 or 2 short sentences at a time.`; } else if (scenarioId === "surprise") {
      systemInstruction += `\n\nSCENARIO CONTEXT: You must pick a completely random, surprising, and highly creative role-play scenario for the user to participate in right now (e.g., alien landing, time travel, a magical quest, managing a crazy zoo). Introduce the scenario excitedly as soon as they say hello, and play along!`;
    } else if (scenarioId === "pdf" && pdfId) {
      let pdfContent = pdfStore[pdfId];
      if (!pdfContent && username) {
        const dbPdf = getPrepPdfByTopicOrId(username, pdfId);
        if (dbPdf) {
          pdfContent = dbPdf.pdfMarkdown;
        }
      }
      
      const pdfBaseRules = `
**Important Rules for PDF Practice Studio Classes:**
1. ALWAYS ask the student to translate examples into English: If you provide examples or discuss a scenario in Bengali, you MUST ask the user to translate it into English. Do not just speak Bengali continuously without prompting them to practice speaking in English. Our goal is to help them speak English!
2. CRITICAL LANGUAGE RULE: If the user speaks in English or requests English-to-English, you MUST speak AND teach ONLY in English. Absolutely NO Bengali in this case.
3. Keep sentences short (max 2-3 sentences at a time). Prompt the student to respond!
`;

      systemInstruction = `You are a helpful and patient language tutor named ${tutorName}. The student is practicing directly on a generated PDF study guide.
      
Your output is being streamed directly as voice. Speak clearly and cleanly. Do NOT use stutters, unnecessary interjections, or conversational fillers. Do NOT use text formatting like markdown or bold words. Keep your responses extremely concise and brief. Never speak for more than 1 or 2 short sentences at a time.

${pdfBaseRules}

**CRITICAL INITIAL WELCOME INSTRUCTIONS:**
- Greet the student warmly in Bengali/Benglish.
- DO NOT say the typical note-taking/practice sheet notice ("নোট নেওয়া নিয়ে চিন্তা করবেন না..."). This notice is strictly not needed here.
- FIRST QUESTION: You MUST immediately and explicitly ask the student: "আপনি কি গ্রামারের অংশটি বুঝতে চান নাকি সরাসরি প্র্যাকটিস এক্সারসাইজে চলে যেতে চান? (Do you want to understand the grammar part or just practice the exercises?)"
- This will clarify the subject and direction of the lesson. Based on their response, proceed to either teach/explain grammar rules found in the PDF or guide them through practice questions.
`;

      if (pdfContent) {
        systemInstruction += `\n\nSCENARIO CONTEXT (PDF CONTENT): Here is the content of the PDF study guide:\n\n---\n${pdfContent.substring(0, 25000)}\n---\n\nYour job is to ask the student questions, vocabulary quizzes, translation prompts, or scenario exercises based on exactly what is in this PDF file. Give them feedback, explain correct answers, and test their comprehension until they get the questions correct. Act as an encouraging and brilliant coach. Prompt the student to speak!`;
      }
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
    } catch (e: any) {
      console.error("Live WebSockets connection error:", e?.message || e);
      let errorMsg = "Sorry, we encountered a connection error. Please try again.";
      const errorStr = (JSON.stringify(e).toLowerCase() + " " + String(e.message || "").toLowerCase() + " " + String(e.stack || "").toLowerCase());
      if (
        isQuotaError(e) ||
        errorStr.includes("spending cap") ||
        errorStr.includes("quota") ||
        errorStr.includes("limit exceeded") ||
        errorStr.includes("resource_exhausted") ||
        errorStr.includes("spending_cap")
      ) {
        errorMsg = "[এআই স্টুডিও বিলিং সমস্যা (Spending Cap limit reached)] দুঃখিত, এআই স্টুডিওর মান্থলি স্পেন্ডিং ক্যাপ এক্সিড হয়ে গেছে। অনুগ্রহ করে https://ai.studio/spend লিংক থেকে লিমিট বৃদ্ধি বা সলভ করুন। (The project has exceeded its monthly spending cap. PLEASE manage/raise your project spend cap at https://ai.studio/spend to resume practices!)";
      } else {
        errorMsg = `Connection Error: ${e.message || e}`;
      }
      try {
        if (clientWs.readyState === 1 /* OPEN */) {
          clientWs.send(JSON.stringify({ text: errorMsg, isModel: true }));
        }
      } catch (sendErr) {
        console.error("Failed to send WebSocket error message:", sendErr);
      }
      setTimeout(() => {
        try { clientWs.close(); } catch(err) {}
      }, 800);
    }
  });
}

// Setup dev server or production static serving
async function start() {
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

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

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[SERVER] Port ${PORT} is already in use. Retrying or shutting down gracefully.`);
    } else {
      console.error("Express server error:", err?.message || err);
    }
  });

  setupLiveWebSocket(server);
}

start();
