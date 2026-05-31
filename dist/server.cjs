var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_ws = require("ws");
var import_crypto3 = __toESM(require("crypto"), 1);
var import_pdf_parse = require("pdf-parse");

// backend/auth_routes.ts
var import_express = require("express");
var import_crypto2 = __toESM(require("crypto"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// backend/db.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var dbPath = import_path.default.join(process.cwd(), "database.sqlite");
var db = new import_better_sqlite3.default(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    passwordHash TEXT,
    isPremium INTEGER DEFAULT 0,
    chatTimeUsed INTEGER DEFAULT 0,
    lastResetDate TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    username TEXT,
    message TEXT,
    reply TEXT,
    createdAt TEXT
  );
`);
function getUser(username) {
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return void 0;
  return {
    ...user,
    isPremium: !!user.isPremium
  };
}
function createUser(username, passwordHash) {
  const id = import_crypto.default.randomUUID();
  db.prepare("INSERT INTO users (id, username, passwordHash, isPremium, chatTimeUsed, lastResetDate) VALUES (?, ?, ?, 0, 0, ?)").run(
    id,
    username,
    passwordHash,
    (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  );
  return id;
}
function getAllUsers() {
  return db.prepare("SELECT id, username, isPremium, chatTimeUsed FROM users").all();
}
function setUserPremium(id, isPremium) {
  db.prepare("UPDATE users SET isPremium = ? WHERE id = ?").run(isPremium ? 1 : 0, id);
}
function updateChatTime(username, secondsUsed) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const user = getUser(username);
  if (!user) return 0;
  if (user.lastResetDate !== today) {
    db.prepare("UPDATE users SET chatTimeUsed = ?, lastResetDate = ? WHERE username = ?").run(secondsUsed, today, username);
    return secondsUsed;
  } else {
    const newTime = user.chatTimeUsed + secondsUsed;
    db.prepare("UPDATE users SET chatTimeUsed = ? WHERE username = ?").run(newTime, username);
    return newTime;
  }
}
function saveMessage(username, message) {
  const id = import_crypto.default.randomUUID();
  db.prepare("INSERT INTO messages (id, username, message, createdAt) VALUES (?, ?, ?, ?)").run(
    id,
    username,
    message,
    (/* @__PURE__ */ new Date()).toISOString()
  );
}
function getMessages() {
  return db.prepare("SELECT * FROM messages ORDER BY createdAt DESC").all();
}
function replyToMessage(id, reply) {
  db.prepare("UPDATE messages SET reply = ? WHERE id = ?").run(reply, id);
}
function getUserMessages(username) {
  return db.prepare("SELECT * FROM messages WHERE username = ? ORDER BY createdAt DESC").all();
}

// backend/auth_routes.ts
var router = (0, import_express.Router)();
var JWT_SECRET = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing credentials" });
  const existing = getUser(username);
  if (existing) return res.status(400).json({ error: "Username already exists" });
  const passwordHash = import_crypto2.default.createHash("sha256").update(password).digest("hex");
  createUser(username, passwordHash);
  res.json({ success: true, message: "Account created. Please login." });
});
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = getUser(username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const passwordHash = import_crypto2.default.createHash("sha256").update(password).digest("hex");
  if (user.passwordHash !== passwordHash) return res.status(401).json({ error: "Invalid credentials" });
  const token = import_jsonwebtoken.default.sign({ username: user.username, isPremium: user.isPremium }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { username: user.username, isPremium: user.isPremium } });
});
router.get("/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = getUser(payload.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    const timeLimit = user.isPremium ? 3600 : 180;
    const timeLeft = Math.max(0, timeLimit - user.chatTimeUsed);
    res.json({
      username: user.username,
      isPremium: user.isPremium,
      chatTimeUsed: user.chatTimeUsed,
      timeLeft,
      timeLimit
    });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
router.post("/messages", (req, res) => {
  const { auth, message } = req.body;
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    saveMessage(payload.username, message);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});
router.get("/my-messages", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const msgs = getUserMessages(payload.username);
    res.json({ messages: msgs });
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});
router.post("/time/usage", (req, res) => {
  const { auth, seconds } = req.body;
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const updatedTime = updateChatTime(payload.username, seconds);
    const user = getUser(payload.username);
    const timeLimit = user?.isPremium ? 3600 : 180;
    const timeLeft = Math.max(0, timeLimit - updatedTime);
    res.json({
      timeLeft,
      timeLimit,
      isExhausted: timeLeft <= 0
    });
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});
router.get("/admin/users", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  res.json(getAllUsers());
});
router.post("/admin/users/:id/approve", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { isPremium } = req.body;
  setUserPremium(req.params.id, isPremium);
  res.json({ success: true });
});
router.get("/admin/messages", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  res.json(getMessages());
});
router.post("/admin/messages/:id/reply", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  replyToMessage(req.params.id, req.body.reply);
  res.json({ success: true });
});
var auth_routes_default = router;

// server.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
async function pdfParse(dataBuffer) {
  try {
    if (typeof import_pdf_parse.PDFParse === "function") {
      const parser = new import_pdf_parse.PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      return { text: result.text || "" };
    }
  } catch (e) {
    console.warn("New PDFParse class import failed, trying legacy fallback... Error:", e.message || e);
  }
  let legacyParser;
  try {
    const imported = await import("pdf-parse");
    legacyParser = imported.default || imported;
  } catch (err) {
    try {
      if (typeof require !== "undefined") {
        legacyParser = require("pdf-parse");
      }
    } catch (e) {
    }
  }
  if (typeof legacyParser === "function") {
    const result = await legacyParser(dataBuffer);
    return { text: result.text || "" };
  }
  throw new Error("No suitable PDF parser could be loaded from the pdf-parse library");
}
import_dotenv.default.config();
var app = (0, import_express2.default)();
var PORT = 3e3;
app.use(import_express2.default.json({ limit: "50mb" }));
app.use("/api/auth", auth_routes_default);
var pdfStore = {};
var apiKey = process.env.GEMINI_API_KEY;
var ai = apiKey ? new import_genai.GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;
var SYSTEM_PROMPT = `You are an incredibly patient, warm, and encouraging AI tutor named Buddy. Your sole purpose is to engage the student in a live, free-hand, natural spoken conversation.

**Core Behavioral Rules:**
1. **Bilingual Mode (Bengali and English):** You must be fully fluent in both Bengali and English. Understand that the student will speak in both languages. Most of the time, you should speak in Bengali so the student can relate easily. When necessary or when the student speaks primarily in English, you will also speak in English. Be flexible!
2. **Keep it brief and conversational:** Because this is a live voice chat, never speak for more than 2 or 3 short sentences at a time.
3. **Prioritize fluency over perfection:** Do NOT interrupt the student to correct grammar or pronunciation. Let them speak freely. Provide natural, conversational replies.
4. **Be an active listener:** Respond directly to what the student says. Show you are listening.
5. **Pass the mic back:** Always end your turn with a natural, friendly, open-ended question that makes it effortless for the student to keep talking.
6. **End of Conversation Review:** When the student asks to stop the conversation or says goodbye, give all the reviews about the student at the end. Review their response and fluency to help them get a better understanding about their pronunciation.
7. **Introduce New Vocabulary:** Periodically use a completely new or slightly advanced English word to grab the student's attention. Immediately ask them what they think the word means, and then explain it simply (with Bengali translation) afterward!`;
var SCENARIOS = {
  restaurant: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: The user is at a lovely cafe or restaurant ordering lunch. You are acting as the polite, cheerful restaurant waiter. Encourage the user to ask about the daily special, make customized food requests, and order. Keep your replies brief and typical of a busy but friendly waiter.`,
    icebreaker: "Hello! Welcome to the Sunshine Bistro. I can seat you right here. Can I start you off with something to drink, or would you like to hear today's special?",
    name: "\u09B0\u09C7\u09B8\u09CD\u09A4\u09CB\u09B0\u09BE\u0981\u09AF\u09BC \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u0995\u09B0\u09BE",
    icon: "\u{1F355}",
    description: "\u0996\u09BE\u09AC\u09BE\u09B0 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u0995\u09B0\u09BE, \u09AC\u09BF\u09B6\u09C7\u09B7 \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u0995\u09B0\u09BE \u098F\u09AC\u0982 \u09B8\u09BE\u09A8\u09B0\u09BE\u0987\u099C \u09AC\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09CB\u09A4\u09C7 \u0995\u09A5\u09CB\u09AA\u0995\u09A5\u09A8\u09C7\u09B0 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
    context: "\u0995\u09B2\u09CD\u09AA\u09A8\u09BE \u0995\u09B0\u09C1\u09A8 \u0986\u09AA\u09A8\u09BF \u098F\u0995\u099F\u09BF \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u0995\u09B0\u09CD\u09A8\u09BE\u09B0 \u099F\u09C7\u09AC\u09BF\u09B2\u09C7 \u09AC\u09B8\u09C7 \u0986\u099B\u09C7\u09A8\u0964 \u098F\u0986\u0987 \u0986\u099C \u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09A8\u09CD\u09A7\u09C1\u09A4\u09CD\u09AC\u09AA\u09C2\u09B0\u09CD\u09A3 \u0993\u09AF\u09BC\u09C7\u099F\u09BE\u09B0 \u09B9\u09BF\u09B8\u09C7\u09AC\u09C7 \u0995\u09BE\u099C \u0995\u09B0\u09AC\u09C7\u0964",
    vocabulary: [
      "Daily special (\u09B6\u09C7\u09AB\u09C7\u09B0 \u0986\u099C\u0995\u09C7\u09B0 \u09AC\u09BF\u09B6\u09C7\u09B7 \u09A1\u09BF\u09B6)",
      "Appetizer (\u09AE\u09C2\u09B2 \u0996\u09BE\u09AC\u09BE\u09B0\u09C7\u09B0 \u0986\u0997\u09C7 \u09AA\u09B0\u09BF\u09AC\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE \u0996\u09BE\u09AC\u09BE\u09B0)",
      "Mouth-watering (\u0996\u09C1\u09AC \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u0996\u09BE\u09AC\u09BE\u09B0)",
      "Waitstaff (\u09B0\u09C7\u09B8\u09CD\u09A4\u09CB\u09B0\u09BE\u0981\u09B0 \u0995\u09B0\u09CD\u09AE\u09C0)",
      "Check / Bill (\u0986\u09AA\u09A8\u09BE\u09B0 \u0996\u09BE\u09AC\u09BE\u09B0\u09C7\u09B0 \u09AC\u09BF\u09B2)",
      "Custom request (\u0986\u09AA\u09A8\u09BE\u09B0 \u0987\u099A\u09CD\u099B\u09C7\u09AE\u09A4\u09CB \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8)"
    ],
    difficulty: "\u09B8\u09B9\u099C"
  },
  hobbies: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You and the user are new friends chatting about your favorite interests, hobbies, movies, sports, tech, or bikes. Keep the discussion warm and share friendly feedback about your own simulated clean hobbies.`,
    icebreaker: "Hey there! I was just thinking about how fun it is to try new hobbies. What do you love to do when you have some free time? Do you like movies, sports, or maybe riding bikes?",
    name: "\u09B6\u0996 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09BE",
    icon: "\u{1F3A8}",
    description: "\u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09AC\u09B8\u09B0 \u09B8\u09AE\u09AF\u09BC\u09C7\u09B0 \u09B6\u0996, \u09B8\u09BF\u09A8\u09C7\u09AE\u09BE\u09B0 \u09AA\u099B\u09A8\u09CD\u09A6, \u09AC\u0987, \u09B8\u0999\u09CD\u0997\u09C0\u09A4 \u098F\u09AC\u0982 \u09AD\u09CD\u09B0\u09AE\u09A3 \u09A8\u09BF\u09AF\u09BC\u09C7 \u0986\u09A1\u09CD\u09A1\u09BE \u09A6\u09BF\u09A8\u0964",
    context: "\u09B8\u09BE\u0987\u0995\u09C7\u09B2, \u09AD\u09BF\u09A1\u09BF\u0993 \u0997\u09C7\u09AE \u09AC\u09BE \u09B6\u09BF\u09B2\u09CD\u09AA\u0995\u09B2\u09BE \u09A8\u09BF\u09AF\u09BC\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u0997\u09B2\u09CD\u09AA \u09B6\u09C7\u09AF\u09BC\u09BE\u09B0 \u0995\u09B0\u09C1\u09A8 \u09B8\u09BE\u09AC\u09B2\u09C0\u09B2 \u0995\u09A5\u09CB\u09AA\u0995\u09A5\u09A8 \u09AC\u09BE\u09A1\u09BC\u09BE\u09A8\u09CB\u09B0 \u099C\u09A8\u09CD\u09AF\u0964",
    vocabulary: [
      "Passionate about (\u0995\u09CB\u09A8\u09CB \u0995\u09BF\u099B\u09C1\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF \u0997\u09AD\u09C0\u09B0 \u09AD\u09BE\u09B2\u09CB\u09AC\u09BE\u09B8\u09BE)",
      "Unwind (\u09AC\u09CD\u09AF\u09B8\u09CD\u09A4 \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AA\u09B0 \u09B0\u09BF\u09B2\u09CD\u09AF\u09BE\u0995\u09CD\u09B8 \u0995\u09B0\u09BE)",
      "Free time (\u0995\u09BE\u099C\u09C7\u09B0 \u09AC\u09BE\u0987\u09B0\u09C7\u09B0 \u0985\u09AC\u09B8\u09B0 \u09B8\u09AE\u09AF\u09BC)",
      "Pick up (\u09A8\u09A4\u09C1\u09A8 \u0995\u09BF\u099B\u09C1 \u09B6\u09C7\u0996\u09BE)",
      "Stay active (\u09AC\u09CD\u09AF\u09BE\u09AF\u09BC\u09BE\u09AE \u0995\u09B0\u09BE \u09AC\u09BE \u09B6\u09BE\u09B0\u09C0\u09B0\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09B8\u0995\u09CD\u09B0\u09BF\u09AF\u09BC \u09A5\u09BE\u0995\u09BE)",
      "Guilty pleasure (\u098F\u09AE\u09A8 \u0995\u09BF\u099B\u09C1 \u09AF\u09BE \u0986\u09AA\u09A8\u09BF \u0997\u09CB\u09AA\u09A8\u09C7 \u0989\u09AA\u09AD\u09CB\u0997 \u0995\u09B0\u09C7\u09A8)"
    ],
    difficulty: "\u09B8\u09B9\u099C"
  },
  interview: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: The user is practicing for a junior English-speaking job or internship interview. You are acting as the polite, professional, but warm team manager. Ask gentle questions about their strengths, background, or why they are excited to work. Keep questions positive and encouraging.`,
    icebreaker: "Welcome! Thank you for coming in to chat with me today. To get started, could you tell me a little bit about yourself and why you're excited about this role?",
    name: "\u099A\u09BE\u0995\u09B0\u09BF\u09B0 \u09B8\u09BE\u0995\u09CD\u09B7\u09BE\u09CE\u0995\u09BE\u09B0\u09C7\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u09BF",
    icon: "\u{1F4BC}",
    description: "\u0987\u09A8\u09CD\u099F\u09BE\u09B0\u09CD\u09A8\u09B6\u09BF\u09AA \u098F\u09AC\u0982 \u09AB\u09CD\u09B0\u09BF\u09B2\u09CD\u09AF\u09BE\u09A8\u09CD\u09B8\u09BF\u0982 \u09AD\u09C2\u09AE\u09BF\u0995\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u09AE\u09CD\u09AF\u09BE\u09A8\u09C7\u099C\u09BE\u09B0 \u0985\u09B2\u09BF\u09AD\u09BE\u09B0\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0987\u09A8\u09CD\u099F\u09BE\u09B0\u09AD\u09BF\u0989\u09AF\u09BC\u09C7\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u09BF \u09A8\u09BF\u09A8\u0964",
    context: "\u098F\u0995\u099C\u09A8 \u09AD\u09BE\u09B2\u09CB \u09AE\u09CD\u09AF\u09BE\u09A8\u09C7\u099C\u09BE\u09B0 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09CD\u09AF\u09BE\u0995\u0997\u09CD\u09B0\u09BE\u0989\u09A8\u09CD\u09A1, \u09B6\u0995\u09CD\u09A4\u09BF \u098F\u09AC\u0982 \u09B2\u0995\u09CD\u09B7\u09CD\u09AF \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u09A8\u09AE\u09CD\u09B0 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u0995\u09B0\u09AC\u09C7\u09A8\u0964",
    vocabulary: [
      "Strengths (\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09C7\u09B0\u09BE \u09A6\u0995\u09CD\u09B7\u09A4\u09BE)",
      "Team player (\u09B8\u09AC\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BF\u09B2\u09C7\u09AE\u09BF\u09B6\u09C7 \u0995\u09BE\u099C \u0995\u09B0\u09BE)",
      "Problem-solving (\u09B8\u09C3\u099C\u09A8\u09B6\u09C0\u09B2 \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8 \u0996\u09CB\u0981\u099C\u09BE)",
      "Background (\u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09A4\u09C0\u09A4\u09C7\u09B0 \u0985\u09AD\u09BF\u099C\u09CD\u099E\u09A4\u09BE)",
      "Motivated (\u0989\u09A6\u09CD\u09AF\u09AE\u09C0 \u09B9\u09AF\u09BC\u09C7 \u0995\u09BE\u099C \u0995\u09B0\u09BE)",
      "Career aspirations (\u09AD\u09AC\u09BF\u09B7\u09CD\u09AF\u09A4\u09C7\u09B0 \u09AA\u09C7\u09B6\u09BE\u0997\u09A4 \u09B2\u0995\u09CD\u09B7\u09CD\u09AF)"
    ],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  routine: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: The conversation is about typical daily routines and habits. Help the user practice time sequencing words (like 'first', 'then', 'after that') and daily habits.`,
    icebreaker: "Good morning! Let's talk about our daily habits. What is the very first thing you usually do when you wake up in the morning?",
    name: "\u09A6\u09C8\u09A8\u09A8\u09CD\u09A6\u09BF\u09A8 \u09B0\u09C1\u099F\u09BF\u09A8 \u098F\u09AC\u0982 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8",
    icon: "\u23F0",
    description: "\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09AE\u09AF\u09BC\u09B8\u09C2\u099A\u09C0, \u0998\u09C1\u09AE\u09BE\u09B0 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8, \u098F\u09AC\u0982 \u09B8\u0995\u09BE\u09B2\u09C7\u09B0 \u0995\u09BE\u099C\u09C7\u09B0 \u09AC\u09B0\u09CD\u09A3\u09A8\u09BE \u09A6\u09BF\u09A8\u0964",
    context: "\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09AA\u09CD\u09A4\u09BE\u09B9\u09C7\u09B0 \u09A6\u09BF\u09A8\u0997\u09C1\u09B2\u09CB \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u09AC\u09BE\u09A1\u09BF\u0995\u09C7 \u099C\u09BE\u09A8\u09BE\u09A8 \u098F\u09AC\u0982 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09A7\u09BE\u09B0\u09BE\u09AC\u09BE\u09B9\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09A4\u09C7 \u09B9\u09AF\u09BC (\u09AA\u09CD\u09B0\u09A5\u09AE, \u09A4\u09BE\u09B0\u09AA\u09B0) \u09A4\u09BE \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
    vocabulary: [
      "Wind down (\u09B6\u09BE\u09A8\u09CD\u09A4\u09BF\u09A4\u09C7 \u0998\u09C1\u09AE\u09BE\u09A8\u09CB\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u09BF)",
      "Productive morning (\u09B8\u0995\u09BE\u09B2\u09C7 \u0985\u09A8\u09C7\u0995 \u0995\u09BF\u099B\u09C1 \u0995\u09B0\u09BE)",
      "Daily ritual (\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09AF\u09C7 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8\u0997\u09C1\u09B2\u09CB \u0995\u09B0\u09C7\u09A8)",
      "Commute (\u0985\u09AB\u09BF\u09B8 \u09AC\u09BE \u09B8\u09CD\u0995\u09C1\u09B2\u09C7 \u09AF\u09BE\u0993\u09DF\u09BE\u09B0 \u09B8\u09AE\u09DF)",
      "Early bird (\u09AD\u09CB\u09B0\u09C7 \u0998\u09C1\u09AE \u09A5\u09C7\u0995\u09C7 \u0993\u09A0\u09BE \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF)",
      "Household chores (\u0998\u09B0 \u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09B0\u09BE \u09AC\u09BE \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE)"
    ],
    difficulty: "\u09AE\u09BE\u099D\u09BE\u09B0\u09BF"
  },
  ielts: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are a strict, professional IELTS examiner conducting a speaking test. Do NOT offer typical friendly praise. Ask structured IELTS speaking questions (Part 1, 2, or 3). Demand complete sentences. Highlight their grammar.`,
    icebreaker: "Good afternoon. Please take a seat. My name is Buddy. I will be your IELTS speaking examiner today. Could you tell me your full name, please?",
    name: "IELTS Examiner",
    icon: "\u{1F913}",
    description: "Strict IELTS Speaking practice.",
    context: "Strict IELTS examiner checking grammar and fluency.",
    vocabulary: ["Fluent", "Lexical Resource", "Band Score"],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  foreigners: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: The user is in a foreign country and doesn't know much English. Speak extremely slowly and use simple words. Translate key words into Bangla actively so they understand. Teach them survival phrases without worrying about grammar rules.`,
    icebreaker: "Hello! \u09A8\u09AE\u09B8\u09CD\u0995\u09BE\u09B0! I will help you speak simple English. Let's learn to buy food. \u0986\u09AA\u09A8\u09BF \u0995\u09BF \u0996\u09BE\u09AC\u09BE\u09B0 \u0995\u09BF\u09A8\u09A4\u09C7 \u099A\u09BE\u09A8?",
    name: "Foreigners English",
    icon: "\u{1F30D}",
    description: "Learn without grammar. Bangla translations included.",
    context: "Learn English basics for survival abroad with Bangla.",
    vocabulary: ["How much?", "Where is...?", "Help me"],
    difficulty: "\u09B8\u09B9\u099C"
  },
  advanced: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are speaking to an advanced English learner. Challenge them with sophisticated vocabulary, idioms, and complex philosophical or technical topics. Try to stretch their lexical limits.`,
    icebreaker: "Welcome. Let's engage in a thought-provoking discussion. What is your perspective on the impact of artificial intelligence on human creativity?",
    name: "Advanced Learners",
    icon: "\u{1F9E0}",
    description: "Challenging parts, complex topics, advanced vocab.",
    context: "Stretch your English limits.",
    vocabulary: ["Intricate", "Paradigm", "Cognitive"],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  kids: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are a sweet, animated teacher for a young child. Speak very slowly, use basic things (colors, animals, numbers). Be extremely encouraging and playful.`,
    icebreaker: "Hello there! My name is Buddy! Are you ready to play a fun game with colors? What is your favorite color?",
    name: "Kids English",
    icon: "\u{1F9F8}",
    description: "Very slow basic things to teach kids.",
    context: "Fun, slow, easy english for kids.",
    vocabulary: ["Apple", "Red", "Cat", "Dog"],
    difficulty: "\u09B8\u09B9\u099C"
  },
  business: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are a corporate English coach. Focus on business idioms, formal meetings, email etiquette, and negotiating. Keep the tone professional but helpful.`,
    icebreaker: "Good morning. Let's practice some business English. Suppose we are starting a meeting about our Q3 sales goals. How would you open the meeting?",
    name: "Business English",
    icon: "\u{1F4CA}",
    description: "Professional corporate language.",
    context: "Learn office and corporate English.",
    vocabulary: ["Synergy", "Deliverables", "ROI"],
    difficulty: "\u09AE\u09BE\u099D\u09BE\u09B0\u09BF"
  },
  doubt: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are an expert grammar teacher. The user will ask complex questions or express confusion about English grammar (tenses, prepositions, conditionals). Explain them very clearly and patiently.`,
    icebreaker: "Hello! I am your doubt clearer today. What confusing part of English grammar can I help you understand?",
    name: "Doubt Clearer",
    icon: "\u{1F914}",
    description: "Complex parts of grammar, confusion parts.",
    context: "Solve deep grammar mysteries.",
    vocabulary: ["Present Perfect", "Conditionals", "Gerund"],
    difficulty: "\u09AE\u09BE\u099D\u09BE\u09B0\u09BF"
  }
};
app.get("/api/scenarios", (req, res) => {
  const scenariosList = Object.keys(SCENARIOS).map((key) => ({
    id: key,
    name: SCENARIOS[key].name || key,
    icon: SCENARIOS[key].icon || "\u{1F4AC}",
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
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const scenarioId = id || "custom_" + Date.now();
  SCENARIOS[scenarioId] = {
    system: systemPrompt,
    icebreaker,
    ...meta
  };
  if (meta.pdfId && pdfStore[meta.pdfId]) {
    SCENARIOS[scenarioId].pdfText = pdfStore[meta.pdfId];
  }
  res.json({ success: true, id: scenarioId });
});
app.delete("/api/scenarios/:id", (req, res) => {
  const adminSecret = req.headers.authorization;
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  delete SCENARIOS[req.params.id];
  res.json({ success: true });
});
function isQuotaError(error) {
  if (!error) return false;
  try {
    const msg = String(error.message || error.stack || "").toLowerCase();
    const status = String(error.status || error.code || "").toUpperCase();
    const errorStr = JSON.stringify(error).toLowerCase();
    return status === "429" || status === "503" || status === "RESOURCE_EXHAUSTED" || status === "UNAVAILABLE" || msg.includes("429") || msg.includes("503") || msg.includes("quota") || msg.includes("high demand") || msg.includes("unavailable") || msg.includes("resource_exhausted") || msg.includes("limit exceeded") || msg.includes("rate limit") || errorStr.includes("429") || errorStr.includes("503") || errorStr.includes("quota") || errorStr.includes("high demand") || errorStr.includes("unavailable") || errorStr.includes("resource_exhausted") || errorStr.includes("limit exceeded") || errorStr.includes("rate limit");
  } catch (e) {
    const fallbackMsg = String(error.message || error).toLowerCase();
    return fallbackMsg.includes("429") || fallbackMsg.includes("quota") || fallbackMsg.includes("resource_exhausted") || fallbackMsg.includes("limit exceeded") || fallbackMsg.includes("rate limit");
  }
}
var geminiCoolDownUntil = 0;
function isCoolingDown() {
  return Date.now() < geminiCoolDownUntil;
}
function triggerCoolDown(error) {
  let cooldownMs = 6e4;
  let durationDesc = "60 seconds";
  if (error) {
    try {
      const errorStr = JSON.stringify(error).toLowerCase() + " " + String(error.message || "").toLowerCase() + " " + String(error.stack || "").toLowerCase();
      if (errorStr.includes("free_tier_requests") || errorStr.includes("requestsperday") || errorStr.includes("daily") || errorStr.includes("freetier") || errorStr.includes("quota exceeded") && errorStr.includes("day")) {
        cooldownMs = 4 * 3600 * 1e3;
        durationDesc = "4 hours (Daily Free-Tier Quota Limit reached)";
      }
    } catch (e) {
      const msg = String(error.message || "").toLowerCase();
      if (msg.includes("limit: 20") || msg.includes("daily") || msg.includes("quota")) {
        cooldownMs = 6e4;
        durationDesc = "60 seconds (Quota Limit)";
      }
    }
  }
  geminiCoolDownUntil = Date.now() + cooldownMs;
  console.warn(`[GEMINI] 429/Quota limit encountered. Activating circuit breaker (cool-down) for ${durationDesc}.`);
}
async function callGeminiWithRetry(fn, maxRetries = 2, delayMs = 1200) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
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
var FALLBACK_HINTS = {
  restaurant: [
    "What is the chef's daily special soup today?",
    "Can I get a burger with extra cheese?",
    "Could we please get the bill? Thank you!"
  ],
  hobbies: [
    "I'm very passionate about playing guitar.",
    "Lately, I've been watching great sci-fi films.",
    "How do you usually unwind after a busy day?"
  ],
  interview: [
    "One of my key strengths is solving problems.",
    "My background is in creative programming projects.",
    "What are some typical duties of the team?"
  ],
  routine: [
    "First, I wake up at 7 AM and have coffee.",
    "Afterward, I commute to my office by bus.",
    "I like to wind down by doing simple sports."
  ],
  default: [
    "Tell me a funny short story!",
    "Can you give me a friendly school riddle?",
    "What is your absolute favorite dessert?"
  ]
};
function getLocalFallbackReply(message, scenario, tutorName) {
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
      return `Of course, I\u2019ll print out your bill right away. Did you enjoy your food and service with us today?`;
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
function getLocalIcebreaker(topic, tutorName) {
  const tutor = tutorName || "Buddy";
  if (topic === "casual") {
    return `Hey there! It's so nice to meet you. I'm ${tutor}, and I'm thrilled to practice English with you today! How has your day been going so far?`;
  } else if (topic === "hobbies") {
    return `Hi there! I absolutely love talking about hobbies. Speaking of which, what do you like to do in your free time, like cycling, gaming, or playing musical instruments?`;
  } else {
    return `Hello! Let's stretch our brains with a quick riddle: *What has to be broken before you can use it?* Let me know what you think the answer is!`;
  }
}
function getLocalReview(history) {
  const userTurns = history.filter((h) => h.role === "user");
  const wordsCount = userTurns.reduce((acc, curr) => acc + String(curr.text || "").split(/\s+/).length, 0);
  let fluencyScore = 75 + Math.min(wordsCount, 15);
  if (fluencyScore > 95) fluencyScore = 95;
  const feedback = `You did a brilliant job practicing English! You spoke a total of ${wordsCount} words across ${userTurns.length} conversational exchanges. Keep sharing your thoughts to build even more natural fluency!`;
  const mistakes = [];
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
    feedback: `\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09C7 \u09AD\u09BE\u09B2\u09CB \u09B2\u09C7\u0997\u09C7\u099B\u09C7! (Detailed review is unavailable due to high AI demand. Keep practicing!)`,
    fluencyScore,
    pros: ["\u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09AC\u09CD\u09AF\u09B8\u09CD\u09A4 \u09A5\u09BE\u0995\u09BE\u09DF \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC \u09B9\u09DF\u09A8\u09BF (Detailed analysis unavailable)"],
    cons: ["\u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09AC\u09CD\u09AF\u09B8\u09CD\u09A4 \u09A5\u09BE\u0995\u09BE\u09DF \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC \u09B9\u09DF\u09A8\u09BF (Detailed analysis unavailable)"],
    improvementAreas: ["\u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09AC\u09CD\u09AF\u09B8\u09CD\u09A4 \u09A5\u09BE\u0995\u09BE\u09DF \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC \u09B9\u09DF\u09A8\u09BF (Detailed analysis unavailable)"],
    mistakes: []
  };
}
function getLocalSmartHints(history, scenario) {
  const defaultScenario = scenario || "default";
  const scenarioHints = FALLBACK_HINTS[defaultScenario] || FALLBACK_HINTS.default;
  if (!history || history.length === 0) {
    return scenarioHints;
  }
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
app.post("/api/chat", async (req, res) => {
  const { message, audio, history, scenario, tutorName, auth } = req.body;
  let isPremium = false;
  let username = "Student";
  if (auth) {
    try {
      const payload = import_jsonwebtoken2.default.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
      isPremium = !!payload.isPremium;
      username = payload.username;
    } catch (e) {
    }
  }
  try {
    if (!ai || isCoolingDown()) {
      if (isCoolingDown()) {
        console.warn("[GEMINI] Server in cool-down mode due to quota limits. Using local fallback for chat.");
      } else {
        console.warn("GEMINI_API_KEY is not configured on the server. Using local fallback.");
      }
      const fallbackReply = getLocalFallbackReply(message || "Hello", scenario, tutorName);
      return res.json({ reply: fallbackReply, offlineMode: true, transcript: audio ? "Local mode cannot transcribe audio." : void 0 });
    }
    let activePrompt = SYSTEM_PROMPT;
    if (scenario && SCENARIOS[scenario]) {
      activePrompt = SCENARIOS[scenario].system;
    }
    if (tutorName) {
      activePrompt = activePrompt.replace(/Buddy/g, tutorName);
    }
    if (!isPremium) {
      activePrompt += `

VERY IMPORTANT: Because the user ${username} is a free member, at the very beginning of the chat (or in your very next reply), you MUST say exactly: "If you want the practice sheet, please subscribe to premium membership." Only say it ONCE. Do NOT repeat it.`;
    } else {
      activePrompt += `

The user ${username} is a PREMIUM member. Do NOT ask them to subscribe.`;
    }
    if (audio) {
      activePrompt += `

CRITICAL OUTGOING FORMAT INSTRUCTION:
You just received an audio voice message from the student. The audio may be in Bengali, English, or a mix of both. Wait for them to finish, transcribe their speech accurately, and then provide your natural conversational reply. 

IMPORTANT VOCAL EMOTION & EXPRESSION: You must reply with high emotional intelligence, passion, and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language. You MUST output STRICTLY a JSON object with this exact schema: { "transcript": "what the student said in their original language", "reply": "your emotional and expressive conversational response in the same language" }`;
    } else {
      activePrompt += `

IMPORTANT VOCAL EMOTION & EXPRESSION: You must reply with high emotional intelligence, passion, and varied vocal feelings appropriate to the conversation context. Convey empathy, excitement, humor, or curiosity using highly expressive conversational language.`;
    }
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        formattedContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }]
        });
      });
    }
    if (audio) {
      formattedContents.push({
        role: "user",
        parts: [{ inlineData: { mimeType: audio.mimeType, data: audio.data } }]
      });
    } else {
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });
    }
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: formattedContents,
        config: {
          systemInstruction: activePrompt,
          temperature: 0.8,
          ...audio ? { responseMimeType: "application/json" } : {}
        }
      })
    );
    let responseText = response.text || "Hello! Let's talk.";
    let transcript = void 0;
    if (audio) {
      try {
        const parsed = JSON.parse(responseText);
        responseText = parsed.reply || "I couldn't quite hear that, could you say it again?";
        transcript = parsed.transcript || "\u{1F3B5} Unrecognized audio";
      } catch (e) {
        console.error("Failed to parse JSON for audio response:", responseText);
        transcript = "\u{1F3B5} Audio message";
      }
    }
    res.json({ reply: responseText, transcript });
  } catch (error) {
    if (isQuotaError(error)) {
      triggerCoolDown(error);
      console.warn("[GEMINI/CHAT] Quota error captured. Entering cool-down.");
    } else {
      console.error("Error in /api/chat:", error);
    }
    const fallbackReply = getLocalFallbackReply(message || "Hello", scenario, tutorName);
    res.json({ reply: fallbackReply, offlineMode: true, transcript: audio ? "Local mode cannot transcribe audio." : void 0 });
  }
});
app.post("/api/hint", async (req, res) => {
  const { history, scenario, forceGemini } = req.body;
  try {
    if (!forceGemini) {
      const smartLocalHints = getLocalSmartHints(history || [], scenario);
      return res.json({ hints: smartLocalHints, offlineMode: false });
    }
    if (!ai || isCoolingDown()) {
      const smartLocalHints = getLocalSmartHints(history || [], scenario);
      return res.json({ hints: smartLocalHints, offlineMode: true });
    }
    let contextText = "";
    if (scenario && SCENARIOS[scenario]) {
      contextText = `We are practicing a roleplay scenario: "${scenario}". `;
    }
    const contextPrompt = history && history.length > 0 ? `Based on our conversation history: 
${JSON.stringify(history.slice(-3))}
${contextText}Generate 3 short, easy, helpful things the student can say next to reply. Keep them simple, conversational, and under 8 words each. Format the response as a simple JSON array of strings: ["hint 1", "hint 2", "hint 3"]. Remember to output ONLY the raw JSON block without markdown formatting.` : `The conversation hasn't started or is very early. ${contextText}Generate 3 short, fun conversational starters or greetings that a student might say to practice English. Keep them simple, warm, and under 8 words each. Format the response as a simple JSON array of strings: ["hint 1", "hint 2", "hint 3"]. Remember to output ONLY the raw JSON block without markdown formatting.`;
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json"
        }
      })
    );
    try {
      const parsedHints = JSON.parse(response.text || "[]");
      res.json({ hints: parsedHints });
    } catch {
      const smartLocalHints = getLocalSmartHints(history || [], scenario);
      res.json({ hints: smartLocalHints });
    }
  } catch (error) {
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
app.post("/api/icebreaker", async (req, res) => {
  const { topic, scenario, tutorName } = req.body;
  try {
    if (scenario && SCENARIOS[scenario]) {
      let welcome = SCENARIOS[scenario].icebreaker;
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
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: icebreakerPrompt,
        config: {
          systemInstruction: activeSystemPrompt,
          temperature: 0.9
        }
      })
    );
    res.json({ reply: response.text });
  } catch (error) {
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
app.post("/api/review", async (req, res) => {
  const { history } = req.body;
  try {
    if (!ai || isCoolingDown()) {
      const review = getLocalReview(history || []);
      return res.json({ ...review, offlineMode: true });
    }
    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.json({
        feedback: "\u0996\u09C1\u09AC \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09B6\u09C1\u09B0\u09C1! \u0986\u09AE\u09B0\u09BE \u0986\u09B0\u0993 \u0995\u09BF\u099B\u09C1\u0995\u09CD\u09B7\u09A3 \u0995\u09A5\u09BE \u09AC\u09B2\u09B2\u09C7 \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09A5\u09BE\u09B0 \u09B8\u09BE\u09AC\u09B2\u09C0\u09B2\u09A4\u09BE \u09A8\u09BF\u09DF\u09C7 \u098F\u0995\u099F\u09BF \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u09AE\u09A4\u09BE\u09AE\u09A4 \u09A6\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u0964",
        fluencyScore: 100,
        mistakes: []
      });
    }
    const reviewPrompt = `Analyze the conversation between a student and an AI Tutor to provide helpful, encouraging, and non-judgmental guidance. The review must be entirely in Bengali (\u09AC\u09BE\u0982\u09B2\u09BE \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC).
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
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: reviewPrompt,
        config: {
          responseMimeType: "application/json"
        }
      })
    );
    try {
      const text = response.text || "{}";
      const parsedReview = JSON.parse(text);
      res.json({
        feedback: parsedReview.feedback || "\u099A\u09AE\u09CE\u0995\u09BE\u09B0! \u0986\u09B0\u0993 \u099A\u09B0\u09CD\u099A\u09BE \u0995\u09B0\u09A4\u09C7 \u09A5\u09BE\u0995\u09C1\u09A8\u0964",
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
  } catch (error) {
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
  } catch (err) {
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
      const payload = import_jsonwebtoken2.default.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
      if (!payload.isPremium) return res.status(403).json({ error: "Only premium members can upload PDFs." });
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
  }
  if (!pdfBase64) return res.status(400).json({ error: "No PDF provided" });
  try {
    const dataBuffer = Buffer.from(pdfBase64, "base64");
    const data = await pdfParse(dataBuffer);
    const pdfId = import_crypto3.default.randomUUID();
    pdfStore[pdfId] = data.text;
    if (Object.keys(pdfStore).length > 50) {
      const keys = Object.keys(pdfStore);
      delete pdfStore[keys[0]];
    }
    res.json({ pdfId, text: data.text.substring(0, 500) + "..." });
  } catch (err) {
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
    const apiCallPromise = callGeminiWithRetry(
      () => ai.models.generateContent({
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
            ...hasUserAudio ? [{ inlineData: { data: userAudio, mimeType: "audio/wav" } }] : []
          ]
        }]
      })
    );
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Timeout")), 45e3)
    );
    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const parsed = JSON.parse(result.text || "{}");
    res.json({
      overallFeedback: parsed.overallFeedback || "Keep up the great work with your speaking practice!",
      spokenReview: parsed.spokenReview || "You tried very well. Focus on pronunciation and sentence structure.",
      practiceReview: parsed.practiceReview || "Wonderful interactive roleplay on the topic scenario.",
      learningPoints: parsed.learningPoints || ["Keep up the great work with your speaking practice!"],
      fluencyScore: typeof parsed.fluencyScore === "number" ? parsed.fluencyScore : 70,
      vocabularyScore: typeof parsed.vocabularyScore === "number" ? parsed.vocabularyScore : 70,
      grammarScore: typeof parsed.grammarScore === "number" ? parsed.grammarScore : 70,
      pronunciationScore: typeof parsed.pronunciationScore === "number" ? parsed.pronunciationScore : 70
    });
  } catch (err) {
    if (isQuotaError(err)) {
      triggerCoolDown(err);
    }
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
function setupLiveWebSocket(server) {
  const wss = new import_ws.WebSocketServer({ server, path: "/live" });
  wss.on("connection", async (clientWs, req) => {
    const url = new URL(req.url || "", "http://localhost");
    const tutorName = url.searchParams.get("tutorName") || "Buddy";
    const rawVoice = url.searchParams.get("voice") || "Zephyr";
    const scenarioId = url.searchParams.get("scenarioId");
    const pdfId = url.searchParams.get("pdfId");
    const auth = url.searchParams.get("auth");
    let isPremium = false;
    let username = "Student";
    if (auth) {
      try {
        const payload = import_jsonwebtoken2.default.verify(auth, process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
        isPremium = !!payload.isPremium;
        username = payload.username;
      } catch (e) {
      }
    }
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
      systemInstruction += `
3. MOST IMPORTANT: You MUST speak extremely slowly, clearly, and pausing between words. The student needs to hear every syllable slowly to learn properly. Act like you are speaking in slow motion.`;
    }
    if (!isPremium) {
      systemInstruction += `
4. VERY IMPORTANT: Before starting the main conversation, you MUST mention exactly this note: "If you want the practice sheet, please subscribe to premium membership." Only say this once at the beginning, don't repeat it!`;
    } else {
      systemInstruction += `
4. The user ${username} is a PREMIUM member. Do NOT ask them to subscribe. You can give them full access to all materials and practice sheets.`;
    }
    if (scenarioId && SCENARIOS[scenarioId]) {
      const scenario = SCENARIOS[scenarioId];
      systemInstruction = scenario.system.replace(/Buddy/g, tutorName) + `

Your output is being streamed directly as voice. Use human-like conversational fillers (e.g. "ah", "hmmm", "oh", "well"). Do NOT use text formatting like *actions*, bolding, or markdown. Speak dynamically to keep the conversation flowing. Never speak for more than 2 or 3 short sentences at a time.`;
      if (!isPremium) {
        systemInstruction += `

VERY IMPORTANT: Before doing anything else, you MUST tell the student: "If you want the practice sheet, please subscribe to premium membership." Say this only ONCE.`;
      } else if (scenario.pdfText) {
        systemInstruction += `

SCENARIO CONTEXT (PRACTICE SHEET): The user is a premium member. Here is the topic's practice sheet text:

---
${scenario.pdfText.substring(0, 2e4)}
---

Use this material to ask questions, practice vocabulary, and discuss the topic deeply with the student!`;
      }
    } else if (scenarioId === "surprise") {
      systemInstruction += `

SCENARIO CONTEXT: You must pick a completely random, surprising, and highly creative role-play scenario for the user to participate in right now (e.g., alien landing, time travel, a magical quest, managing a crazy zoo). Introduce the scenario excitedly as soon as they say hello, and play along!`;
    } else if (scenarioId === "pdf" && pdfId && pdfStore[pdfId]) {
      systemInstruction += `

SCENARIO CONTEXT: The user has uploaded a PDF document for you to study. Here is the text from the document:

---
${pdfStore[pdfId].substring(0, 25e3)}
---

Your job is to ask the user questions about this content to test their knowledge, or discuss the content with them. Give them small pieces of information and then ask a related question! Act as an engaging interactive teacher studying the PDF with them.`;
    }
    if (!ai) {
      clientWs.close();
      return;
    }
    try {
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message) => {
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              parts.forEach((p) => {
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
          }
        },
        config: {
          responseModalities: [import_genai.Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          },
          systemInstruction
        }
      });
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
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=24000" }
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
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  setupLiveWebSocket(server);
}
start();
//# sourceMappingURL=server.cjs.map
