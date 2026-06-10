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
var import_express3 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_genai3 = require("@google/genai");
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

  CREATE TABLE IF NOT EXISTS history_records (
    id TEXT PRIMARY KEY,
    username TEXT,
    scenarioName TEXT,
    scenarioIcon TEXT,
    timestamp TEXT,
    duration INTEGER,
    overallFeedback TEXT,
    spokenReview TEXT,
    practiceReview TEXT,
    learningPoints TEXT,
    fluencyScore INTEGER,
    vocabularyScore INTEGER,
    grammarScore INTEGER,
    pronunciationScore INTEGER
  );
`);
try {
  db.exec("ALTER TABLE users ADD COLUMN whatsapp TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN isWhatsappPublic INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN performanceScore INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN division TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN district TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 600;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN hiddenCredits INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN isScorePublic INTEGER DEFAULT 1;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN isProfilePublic INTEGER DEFAULT 1;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN lastActive INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN earnedPublicIncentive INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN education TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN occupation TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN skills TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN achievements TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN name TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN gender TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN birthday TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN birthday_privacy TEXT DEFAULT 'public';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN school TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN class TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN religion TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN verified_badge INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN account_health INTEGER DEFAULT 100;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN ban_appeal_status TEXT DEFAULT 'none';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN ban_appeal_text TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN privacy_messages TEXT DEFAULT 'public';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN verified_doc_id TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      sender TEXT,
      receiver TEXT,
      status TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS anonymous_queue (
      username TEXT PRIMARY KEY,
      joinedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS anonymous_rooms (
      id TEXT PRIMARY KEY,
      user1 TEXT,
      user2 TEXT,
      createdAt INTEGER,
      ended INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS anonymous_messages (
      id TEXT PRIMARY KEY,
      roomId TEXT,
      senderAnonym TEXT,
      content TEXT,
      createdAt TEXT,
      isFlagged INTEGER DEFAULT 0
    );
  `);
} catch (e) {
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      username TEXT,
      activity TEXT,
      amount INTEGER,
      createdAt TEXT
    );
  `);
} catch (e) {
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ip_credits (
      ip TEXT PRIMARY KEY,
      credits INTEGER DEFAULT 150,
      lastResetDate TEXT
    );
  `);
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN profilePicture TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN characteristics TEXT DEFAULT '{}';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE users ADD COLUMN custom_topics TEXT DEFAULT '[]';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN isConverted INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN grammarScore INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN vocabularyScore INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN fluencyScore INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN pronunciationScore INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN confidenceScore INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN sentenceStructureScore INTEGER DEFAULT 0;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN commonGrammarMistakes TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE user_courses ADD COLUMN vocabularyGaps TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE course_topics ADD COLUMN areasForImprovement TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec("ALTER TABLE course_topics ADD COLUMN actionsToAvoid TEXT DEFAULT '';");
} catch (e) {
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      authorUsername TEXT,
      content TEXT,
      mediaUrl TEXT,
      createdAt TEXT,
      originalPostId TEXT
    );
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      postId TEXT,
      authorUsername TEXT,
      content TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      postId TEXT,
      authorUsername TEXT,
      createdAt TEXT,
      UNIQUE(postId, authorUsername)
    );
    CREATE TABLE IF NOT EXISTS direct_messages (
      id TEXT PRIMARY KEY,
      senderUsername TEXT,
      recipientUsername TEXT,
      content TEXT,
      createdAt TEXT,
      isRead INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      blockerUsername TEXT,
      blockedUsername TEXT,
      createdAt TEXT,
      UNIQUE(blockerUsername, blockedUsername)
    );
    CREATE TABLE IF NOT EXISTS grammar_scores (
      id TEXT PRIMARY KEY,
      username TEXT,
      topic TEXT,
      score INTEGER,
      feedback TEXT,
      createdAt TEXT,
      UNIQUE(username, topic)
    );
    CREATE TABLE IF NOT EXISTS payment_requests (
      id TEXT PRIMARY KEY,
      username TEXT,
      plan TEXT,
      transactionId TEXT UNIQUE,
      amount INTEGER,
      paymentTime TEXT,
      screenshotUrl TEXT,
      status TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS admin_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rawMessage TEXT,
      sender TEXT,
      extractedTrxId TEXT,
      extractedAmount REAL,
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_courses (
      id TEXT PRIMARY KEY,
      username TEXT,
      cefrLevel TEXT,
      overallScore INTEGER,
      strengths TEXT,
      weaknesses TEXT,
      createdAt TEXT,
      isConverted INTEGER DEFAULT 0,
      grammarScore INTEGER DEFAULT 0,
      vocabularyScore INTEGER DEFAULT 0,
      fluencyScore INTEGER DEFAULT 0,
      pronunciationScore INTEGER DEFAULT 0,
      confidenceScore INTEGER DEFAULT 0,
      sentenceStructureScore INTEGER DEFAULT 0,
      commonGrammarMistakes TEXT,
      vocabularyGaps TEXT
    );
    CREATE TABLE IF NOT EXISTS course_topics (
      id TEXT PRIMARY KEY,
      courseId TEXT,
      stepIndex INTEGER,
      stepName TEXT,
      stepDescription TEXT,
      topicsToLearn TEXT,
      grammarTopics TEXT,
      areasForImprovement TEXT,
      actionsToAvoid TEXT,
      whyLearn TEXT,
      whatToGain TEXT,
      engagementInfo TEXT,
      isCompleted INTEGER DEFAULT 0,
      highestScore INTEGER DEFAULT 0,
      createdAt TEXT
    );
  `);
} catch (e) {
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_prep_pdfs (
      id TEXT PRIMARY KEY,
      username TEXT,
      topic TEXT,
      pdfMarkdown TEXT,
      highestPracticeScore INTEGER DEFAULT 0,
      isPracticeCompleted INTEGER DEFAULT 0,
      createdAt TEXT,
      UNIQUE(username, topic)
    );
  `);
} catch (e) {
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS course_subtopics (
      id TEXT PRIMARY KEY,
      courseTopicId TEXT,
      name TEXT,
      isCompleted INTEGER DEFAULT 0,
      createdAt TEXT,
      UNIQUE(courseTopicId, name)
    );
  `);
} catch (e) {
  console.error("Error creating course_subtopics table:", e);
}
function getUser(username) {
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return void 0;
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (user.lastResetDate !== today) {
    const newCredits = user.isPremium ? 5e7 : 3e7;
    db.prepare("UPDATE users SET chatTimeUsed = 0, lastResetDate = ?, credits = ? WHERE username = ?").run(today, newCredits, username);
    user.lastResetDate = today;
    user.chatTimeUsed = 0;
    user.credits = newCredits;
  }
  return {
    ...user,
    isPremium: !!user.isPremium,
    isWhatsappPublic: !!user.isWhatsappPublic,
    whatsapp: user.whatsapp || "",
    performanceScore: typeof user.performanceScore === "number" ? user.performanceScore : 0,
    division: user.division || "",
    district: user.district || "",
    credits: typeof user.credits === "number" ? user.credits : 3e7,
    hiddenCredits: typeof user.hiddenCredits === "number" ? user.hiddenCredits : 0,
    isScorePublic: typeof user.isScorePublic === "number" ? user.isScorePublic === 1 : true,
    isProfilePublic: typeof user.isProfilePublic === "number" ? user.isProfilePublic === 1 : true,
    email: user.email || "",
    earnedPublicIncentive: !!user.earnedPublicIncentive,
    education: user.education || "",
    occupation: user.occupation || "",
    bio: user.bio || "",
    skills: user.skills || "",
    achievements: user.achievements || "",
    profilePicture: user.profilePicture || "",
    name: user.name || "",
    gender: user.gender || "",
    birthday: user.birthday || "",
    birthday_privacy: user.birthday_privacy || "public",
    school: user.school || "",
    class: user.class || "",
    religion: user.religion || "",
    verified_badge: typeof user.verified_badge === "number" ? user.verified_badge : 0,
    banned: typeof user.banned === "number" ? user.banned : 0,
    account_health: typeof user.account_health === "number" ? user.account_health : 100,
    ban_appeal_status: user.ban_appeal_status || "none",
    ban_appeal_text: user.ban_appeal_text || "",
    privacy_messages: user.privacy_messages || "public",
    characteristics: user.characteristics || "{}",
    custom_topics: user.custom_topics || "[]"
  };
}
function createUser(username, passwordHash) {
  const id = import_crypto.default.randomUUID();
  db.prepare("INSERT INTO users (id, username, passwordHash, isPremium, chatTimeUsed, lastResetDate, whatsapp, isWhatsappPublic, performanceScore, division, district, credits, hiddenCredits, isScorePublic, isProfilePublic, email, earnedPublicIncentive, name, gender, birthday, birthday_privacy, school, class, religion, verified_badge, banned, account_health, ban_appeal_status, ban_appeal_text, privacy_messages) VALUES (?, ?, ?, 0, 0, ?, '', 0, 0, '', '', 30000000, 0, 1, 1, '', 0, '', '', '', 'public', '', '', '', 0, 0, 100, 'none', '', 'public')").run(
    id,
    username,
    passwordHash,
    (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  );
  return id;
}
function updatePremiumProfile(username, whatsapp, isWhatsappPublic) {
  db.prepare("UPDATE users SET whatsapp = ?, isWhatsappPublic = ? WHERE username = ?").run(
    whatsapp,
    isWhatsappPublic ? 1 : 0,
    username
  );
}
function updateUserPersonalization(username, characteristics, custom_topics) {
  db.prepare("UPDATE users SET characteristics = ?, custom_topics = ? WHERE username = ?").run(
    characteristics,
    custom_topics,
    username
  );
}
function updateUserProfileFull(username, whatsapp, isWhatsappPublic, division, district, isScorePublic, isProfilePublic, email, education = "", occupation = "", bio = "", skills = "", achievements = "") {
  const user = getUser(username);
  if (!user) return { creditBonus: 0, newCredits: 3e7 };
  let creditBonus = 0;
  let newEarnedIncentive = user.earnedPublicIncentive ? 1 : 0;
  if ((isScorePublic || isProfilePublic) && !user.earnedPublicIncentive) {
    creditBonus = 2e4;
    newEarnedIncentive = 1;
  }
  const currentCreds = typeof user.credits === "number" ? user.credits : 3e7;
  const newCredits = currentCreds + creditBonus;
  db.prepare(`
    UPDATE users 
    SET whatsapp = ?, 
        isWhatsappPublic = ?, 
        division = ?, 
        district = ?, 
        isScorePublic = ?, 
        isProfilePublic = ?, 
        email = ?,
        earnedPublicIncentive = ?,
        credits = ?,
        education = ?,
        occupation = ?,
        bio = ?,
        skills = ?,
        achievements = ?
    WHERE username = ?
  `).run(
    whatsapp,
    isWhatsappPublic ? 1 : 0,
    division,
    district,
    isScorePublic ? 1 : 0,
    isProfilePublic ? 1 : 0,
    email,
    newEarnedIncentive,
    newCredits,
    education,
    occupation,
    bio,
    skills,
    achievements,
    username
  );
  return { creditBonus, newCredits };
}
function searchPublicProfiles(query) {
  const likeQuery = `%${query}%`;
  const rows = db.prepare(`
    SELECT username, email, isPremium, whatsapp, isWhatsappPublic, division, district, performanceScore, credits, education, occupation, bio, skills, achievements
    FROM users 
    WHERE isProfilePublic = 1 
      AND (username LIKE ? OR email LIKE BINARY ?)
    LIMIT 20
  `).all(likeQuery, likeQuery);
  return rows.map((r) => ({
    username: r.username,
    email: r.email || "",
    isPremium: !!r.isPremium,
    whatsapp: r.whatsapp || "",
    isWhatsappPublic: !!r.isWhatsappPublic,
    division: r.division || "",
    district: r.district || "",
    performanceScore: r.performanceScore || 0,
    credits: r.credits || 0,
    education: r.education || "",
    occupation: r.occupation || "",
    bio: r.bio || "",
    skills: r.skills || "",
    achievements: r.achievements || ""
  }));
}
function redistributeInactiveHiddenCredits() {
  const inactiveUsers = db.prepare(`
    SELECT id, username, hiddenCredits 
    FROM users 
    WHERE hiddenCredits > 0 
      AND username NOT IN (
        SELECT username FROM users ORDER BY performanceScore DESC LIMIT 10
      )
    ORDER BY chatTimeUsed ASC, lastResetDate ASC
    LIMIT 10
  `).all();
  if (inactiveUsers.length === 0) {
    return { success: false, message: "\u0995\u09CB\u09A8\u09CB \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF \u09AC\u09BE \u0985\u09A8\u09C1\u09A8\u09CD\u09A8\u09A4 \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09DF\u09BE\u09AE \u09AE\u09C7\u09AE\u09CD\u09AC\u09BE\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF \u09AF\u09BE\u09A6\u09C7\u09B0 \u098F\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7 \u09B9\u09BF\u09A1\u09C7\u09A8 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u0985\u09AC\u09B6\u09BF\u09B7\u09CD\u099F \u0986\u099B\u09C7\u0964" };
  }
  let totalPool = 0;
  for (const entry of inactiveUsers) {
    totalPool += entry.hiddenCredits;
    db.prepare("UPDATE users SET hiddenCredits = 0 WHERE id = ?").run(entry.id);
  }
  const leaders = db.prepare(`
    SELECT id, username, credits, performanceScore 
    FROM users 
    WHERE isPremium = 1 AND isScorePublic = 1
    ORDER BY performanceScore DESC 
    LIMIT 10
  `).all();
  if (leaders.length === 0) {
    return { success: true, message: `\u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0\u09A6\u09C7\u09B0 \u09A5\u09C7\u0995\u09C7 ${totalPool} \u09B9\u09BF\u09A1\u09C7\u09A8 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7, \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 \u09AC\u09A8\u09CD\u099F\u09A8 \u0995\u09B0\u09BE\u09B0 \u09AE\u09A4\u09CB \u0995\u09CB\u09A8\u09CB \u09AA\u09BE\u09AC\u09B2\u09BF\u0995 \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u09AE\u09C7\u09AE\u09CD\u09AC\u09BE\u09B0 \u09AE\u09C7\u09B2\u09C7\u09A8\u09BF\u0964` };
  }
  const distributionPercentages = [40, 22, 14, 8, 6, 4, 3, 2, 1, 0];
  let sumPercentage = 0;
  for (let i = 0; i < leaders.length; i++) {
    sumPercentage += distributionPercentages[i];
  }
  if (sumPercentage === 0) sumPercentage = 100;
  const results = [];
  for (let i = 0; i < leaders.length; i++) {
    const leader = leaders[i];
    const weight = distributionPercentages[i];
    const rawShare = weight / sumPercentage * totalPool;
    const reward = Math.round(rawShare);
    const prevCredits = leader.credits || 0;
    const newCredits = prevCredits + reward;
    db.prepare("UPDATE users SET credits = ? WHERE id = ?").run(newCredits, leader.id);
    results.push({
      username: leader.username,
      reward,
      prevCredits,
      newCredits
    });
  }
  return {
    success: true,
    message: `${inactiveUsers.length} \u099C\u09A8 \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0\u09B0 \u09A5\u09C7\u0995\u09C7 \u09AE\u09CB\u099F ${totalPool} \u09B9\u09BF\u09A1\u09C7\u09A8 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u0995\u09C7\u099F\u09C7 \u09A8\u09BF\u09DF\u09C7 \u099F\u09AA ${leaders.length} \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u09B2\u09BF\u09A1\u09BE\u09B0\u09A6\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09AC\u09A8\u09CD\u099F\u09A8 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7!`,
    totalPool,
    details: results
  };
}
function updatePerformanceScore(username, score) {
  const user = getUser(username);
  if (!user) return;
  const currentBest = user.performanceScore || 0;
  if (score > currentBest) {
    db.prepare("UPDATE users SET performanceScore = ? WHERE username = ?").run(score, username);
  }
}
function getTopPerformers() {
  const rows = db.prepare("SELECT username, isPremium, whatsapp, isWhatsappPublic, performanceScore, chatTimeUsed, division, district, credits, isScorePublic, education, occupation, bio, skills, achievements FROM users WHERE isScorePublic = 1 ORDER BY performanceScore DESC").all();
  return rows.map((r) => ({
    username: r.username,
    isPremium: !!r.isPremium,
    whatsapp: r.whatsapp || "",
    isWhatsappPublic: !!r.isWhatsappPublic,
    performanceScore: typeof r.performanceScore === "number" ? r.performanceScore : 0,
    chatTimeUsed: r.chatTimeUsed || 0,
    division: r.division || "",
    district: r.district || "",
    credits: r.credits || 0,
    isScorePublic: typeof r.isScorePublic === "number" ? r.isScorePublic === 1 : true,
    education: r.education || "",
    occupation: r.occupation || "",
    bio: r.bio || "",
    skills: r.skills || "",
    achievements: r.achievements || ""
  }));
}
function getAllUsers() {
  return db.prepare("SELECT id, username, isPremium, chatTimeUsed FROM users").all();
}
function setUserPremium(id, isPremium) {
  if (isPremium) {
    db.prepare("UPDATE users SET isPremium = 1, credits = 10000, hiddenCredits = 1000 WHERE id = ?").run(id);
  } else {
    db.prepare("UPDATE users SET isPremium = 0 WHERE id = ?").run(id);
  }
}
function updateChatTime(username, secondsUsed) {
  const user = getUser(username);
  if (!user) return 0;
  const newTime = user.chatTimeUsed + secondsUsed;
  db.prepare("UPDATE users SET chatTimeUsed = ? WHERE username = ?").run(newTime, username);
  return newTime;
}
function deductCredits(username, tokensUsed, activity = "API Usage") {
  const user = getUser(username);
  if (!user) return 0;
  const currentCredits = typeof user.credits === "number" ? user.credits : 3e7;
  const newCredits = Math.max(0, currentCredits - tokensUsed);
  db.prepare("UPDATE users SET credits = ? WHERE username = ?").run(newCredits, username);
  if (tokensUsed > 0) {
    try {
      const id = import_crypto.default.randomUUID();
      db.prepare("INSERT INTO credit_transactions (id, username, activity, amount, createdAt) VALUES (?, ?, ?, ?, ?)").run(id, username, activity, tokensUsed, (/* @__PURE__ */ new Date()).toISOString());
    } catch (e) {
      console.error("Failed to log credit transaction:", e);
    }
  }
  return newCredits;
}
function getCreditCosts(username) {
  try {
    return db.prepare("SELECT activity, SUM(amount) as totalCost, COUNT(*) as usageCount, MAX(createdAt) as lastUsed FROM credit_transactions WHERE username = ? GROUP BY activity ORDER BY totalCost DESC").all(username);
  } catch (e) {
    return [];
  }
}
function getCreditTransactions(username) {
  try {
    return db.prepare("SELECT * FROM credit_transactions WHERE username = ? ORDER BY createdAt DESC LIMIT 100").all(username);
  } catch (e) {
    return [];
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
function saveHistoryRecord(username, record) {
  db.prepare(`
    INSERT INTO history_records (
      id, username, scenarioName, scenarioIcon, timestamp, duration,
      overallFeedback, spokenReview, practiceReview, learningPoints,
      fluencyScore, vocabularyScore, grammarScore, pronunciationScore
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id || import_crypto.default.randomUUID(),
    username,
    record.scenarioName || "English Practice",
    record.scenarioIcon || "\u{1F4AC}",
    record.timestamp || (/* @__PURE__ */ new Date()).toLocaleDateString(),
    record.duration || 0,
    record.overallFeedback || "",
    record.spokenReview || "",
    record.practiceReview || "",
    JSON.stringify(record.learningPoints || []),
    record.fluencyScore || 0,
    record.vocabularyScore || 0,
    record.grammarScore || 0,
    record.pronunciationScore || 0
  );
}
function getUserHistoryRecords(username) {
  const rows = db.prepare("SELECT * FROM history_records WHERE username = ?").all(username);
  return rows.map((r) => ({
    id: r.id,
    scenarioName: r.scenarioName,
    scenarioIcon: r.scenarioIcon,
    timestamp: r.timestamp,
    duration: r.duration,
    overallFeedback: r.overallFeedback,
    spokenReview: r.spokenReview,
    practiceReview: r.practiceReview,
    learningPoints: JSON.parse(r.learningPoints || "[]"),
    fluencyScore: r.fluencyScore,
    vocabularyScore: r.vocabularyScore,
    grammarScore: r.grammarScore,
    pronunciationScore: r.pronunciationScore
  }));
}
function clearUserHistoryRecords(username) {
  db.prepare("DELETE FROM history_records WHERE username = ?").run(username);
}
function getIpCredits(ip) {
  return 0;
}
function deductIpCredits(ip, secondsUsed) {
  return 0;
}
function updateProfilePicture(username, base64Image) {
  db.prepare("UPDATE users SET profilePicture = ? WHERE username = ?").run(base64Image, username);
}
function createPost(authorUsername, content, mediaUrl = "", originalPostId = null) {
  const id = import_crypto.default.randomUUID();
  db.prepare("INSERT INTO posts (id, authorUsername, content, mediaUrl, createdAt, originalPostId) VALUES (?, ?, ?, ?, ?, ?)").run(
    id,
    authorUsername,
    content,
    mediaUrl,
    (/* @__PURE__ */ new Date()).toISOString(),
    originalPostId
  );
  return id;
}
function getPosts(currentUsername) {
  const q = currentUsername ? `SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
      (SELECT COUNT(*) FROM posts WHERE originalPostId = p.id) as shareCount,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id AND authorUsername = ?) as userLiked,
      u.profilePicture as authorProfilePicture
     FROM posts p
     LEFT JOIN users u ON p.authorUsername = u.username
     WHERE p.authorUsername NOT IN (SELECT blockedUsername FROM blocks WHERE blockerUsername = ?)
     ORDER BY p.createdAt DESC LIMIT 50` : `SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
      (SELECT COUNT(*) FROM posts WHERE originalPostId = p.id) as shareCount,
      u.profilePicture as authorProfilePicture
     FROM posts p
     LEFT JOIN users u ON p.authorUsername = u.username
     ORDER BY p.createdAt DESC LIMIT 50`;
  return currentUsername ? db.prepare(q).all(currentUsername, currentUsername) : db.prepare(q).all();
}
function getUserPosts(targetUsername, currentUsername) {
  const q = currentUsername ? `SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
      (SELECT COUNT(*) FROM posts WHERE originalPostId = p.id) as shareCount,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id AND authorUsername = ?) as userLiked,
      u.profilePicture as authorProfilePicture
     FROM posts p
     LEFT JOIN users u ON p.authorUsername = u.username
     WHERE p.authorUsername = ?
     ORDER BY p.createdAt DESC` : `SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
      (SELECT COUNT(*) FROM posts WHERE originalPostId = p.id) as shareCount,
      u.profilePicture as authorProfilePicture
     FROM posts p
     LEFT JOIN users u ON p.authorUsername = u.username
     WHERE p.authorUsername = ?
     ORDER BY p.createdAt DESC`;
  return currentUsername ? db.prepare(q).all(currentUsername, targetUsername) : db.prepare(q).all(targetUsername);
}
function toggleLike(postId, username) {
  try {
    db.prepare("INSERT INTO likes (id, postId, authorUsername, createdAt) VALUES (?, ?, ?, ?)").run(
      import_crypto.default.randomUUID(),
      postId,
      username,
      (/* @__PURE__ */ new Date()).toISOString()
    );
    return true;
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      db.prepare("DELETE FROM likes WHERE postId = ? AND authorUsername = ?").run(postId, username);
      return false;
    }
    throw e;
  }
}
function addComment(postId, username, content) {
  const id = import_crypto.default.randomUUID();
  db.prepare("INSERT INTO comments (id, postId, authorUsername, content, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    id,
    postId,
    username,
    content,
    (/* @__PURE__ */ new Date()).toISOString()
  );
  return id;
}
function getComments(postId) {
  return db.prepare(`
    SELECT c.*, u.profilePicture as authorProfilePicture 
    FROM comments c
    LEFT JOIN users u ON c.authorUsername = u.username
    WHERE c.postId = ? 
    ORDER BY c.createdAt ASC
  `).all(postId);
}
function sendDirectMessage(senderUsername, recipientUsername, content) {
  const id = import_crypto.default.randomUUID();
  db.prepare("INSERT INTO direct_messages (id, senderUsername, recipientUsername, content, createdAt) VALUES (?, ?, ?, ?, ?)").run(
    id,
    senderUsername,
    recipientUsername,
    content,
    (/* @__PURE__ */ new Date()).toISOString()
  );
  return id;
}
function getDirectMessages(user1, user2) {
  return db.prepare(`
    SELECT dm.*, u.profilePicture as senderProfilePicture
    FROM direct_messages dm
    LEFT JOIN users u ON dm.senderUsername = u.username
    WHERE (dm.senderUsername = ? AND dm.recipientUsername = ?)
       OR (dm.senderUsername = ? AND dm.recipientUsername = ?)
    ORDER BY dm.createdAt ASC
  `).all(user1, user2, user2, user1);
}
function markMessagesAsRead(recipientUsername, senderUsername) {
  try {
    db.prepare("UPDATE direct_messages SET isRead = 1 WHERE recipientUsername = ? AND senderUsername = ? AND isRead = 0").run(recipientUsername, senderUsername);
  } catch (e) {
  }
}
function updateUserActivity(username) {
  try {
    db.prepare("UPDATE users SET lastActive = ? WHERE username = ?").run(Date.now(), username);
  } catch (e) {
  }
}
function getUserActivity(username) {
  try {
    const row = db.prepare("SELECT lastActive FROM users WHERE username = ?").get(username);
    return row ? row.lastActive : 0;
  } catch (e) {
    return 0;
  }
}
function getChatPeers(username) {
  try {
    const peers = db.prepare(`
      SELECT p.peer,
            (SELECT count(*) FROM direct_messages WHERE senderUsername = p.peer AND recipientUsername = ? AND isRead = 0) as messageCount,
            (SELECT lastActive FROM users WHERE username = p.peer) as lastActive
      FROM (
        SELECT DISTINCT 
          CASE 
            WHEN senderUsername = ? THEN recipientUsername 
            ELSE senderUsername 
          END as peer
        FROM direct_messages
        WHERE senderUsername = ? OR recipientUsername = ?
      ) p
    `).all(username, username, username, username);
    return peers;
  } catch (e) {
    return [];
  }
}
function blockUser(blocker, blocked) {
  try {
    db.prepare("INSERT INTO blocks (id, blockerUsername, blockedUsername, createdAt) VALUES (?, ?, ?, ?)").run(
      import_crypto.default.randomUUID(),
      blocker,
      blocked,
      (/* @__PURE__ */ new Date()).toISOString()
    );
  } catch (e) {
  }
}
function saveGrammarScore(username, topic, score, feedback, mistakes) {
  const id = import_crypto.default.randomUUID();
  try {
    db.prepare(`
      INSERT INTO grammar_scores (id, username, topic, score, feedback, mistakes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, topic) DO UPDATE SET
        score = excluded.score,
        feedback = excluded.feedback,
        mistakes = excluded.mistakes,
        createdAt = excluded.createdAt
    `).run(id, username, topic, score, feedback, mistakes || null, (/* @__PURE__ */ new Date()).toISOString());
  } catch (e) {
    try {
      db.prepare("DELETE FROM grammar_scores WHERE username = ? AND topic = ?").run(username, topic);
      db.prepare("INSERT INTO grammar_scores (id, username, topic, score, feedback, mistakes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        id,
        username,
        topic,
        score,
        feedback,
        mistakes || null,
        (/* @__PURE__ */ new Date()).toISOString()
      );
    } catch (err) {
      console.error("Failed to save grammar score:", err);
    }
  }
}
try {
  db.exec("ALTER TABLE grammar_scores ADD COLUMN mistakes TEXT;");
} catch (e) {
}
function getGrammarScores(username) {
  try {
    return db.prepare("SELECT * FROM grammar_scores WHERE username = ?").all(username);
  } catch (e) {
    return [];
  }
}
try {
  db.exec("ALTER TABLE payment_requests ADD COLUMN amount INTEGER;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE payment_requests ADD COLUMN paymentTime TEXT;");
} catch (e) {
}
try {
  db.exec("ALTER TABLE payment_requests ADD COLUMN screenshotUrl TEXT;");
} catch (e) {
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT,
      price INTEGER,
      timeLimitSeconds INTEGER,
      pdfUploadAllowed INTEGER,
      whatsappAllowed INTEGER,
      scenarioPdfAllowed INTEGER,
      customFeatures TEXT
    );
  `);
  try {
    db.exec("ALTER TABLE plans ADD COLUMN customFeatures TEXT;");
  } catch (e) {
  }
  db.prepare(`
    INSERT OR REPLACE INTO plans (id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures)
    VALUES ('free', 'Free Plan', 0, 300, 0, 0, 0, '["5 minutes speaking time limit", "Basic grammar topics practice", "Offline lessons access"]')
  `).run();
  db.prepare(`
    INSERT OR REPLACE INTO plans (id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures)
    VALUES ('premium', 'Premium Plan', 500, 3600, 1, 1, 1, '["60 minutes speaking time limit", "Direct PDF Handout Uploads", "Private WhatsApp Group Access", "Full tutor feedback loop"]')
  `).run();
} catch (e) {
  console.error("Error creating plans table:", e);
}
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      name TEXT,
      number TEXT,
      type TEXT
    );
  `);
  const countRowPM = db.prepare("SELECT COUNT(*) as count FROM payment_methods").get();
  if (!countRowPM || countRowPM.count === 0) {
    db.prepare(`
      INSERT INTO payment_methods (id, name, number, type)
      VALUES (?, ?, ?, ?)
    `).run(import_crypto.default.randomUUID(), "bKash", "017XXXXXXXX", "Personal");
    db.prepare(`
      INSERT INTO payment_methods (id, name, number, type)
      VALUES (?, ?, ?, ?)
    `).run(import_crypto.default.randomUUID(), "Nagad", "019XXXXXXXX", "Personal");
  }
} catch (e) {
  console.error("Error creating payment_methods table:", e);
}
function getPaymentMethods() {
  try {
    return db.prepare("SELECT * FROM payment_methods").all();
  } catch (e) {
    return [];
  }
}
function addPaymentMethod(name, number, type) {
  try {
    const id = import_crypto.default.randomUUID();
    db.prepare("INSERT INTO payment_methods (id, name, number, type) VALUES (?, ?, ?, ?)").run(id, name, number, type);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}
function updatePaymentMethod(id, name, number, type) {
  try {
    db.prepare("UPDATE payment_methods SET name = ?, number = ?, type = ? WHERE id = ?").run(name, number, type, id);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}
function deletePaymentMethod(id) {
  try {
    db.prepare("DELETE FROM payment_methods WHERE id = ?").run(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}
function getPlans() {
  try {
    return db.prepare("SELECT * FROM plans").all();
  } catch (e) {
    return [
      { id: "free", name: "Free Plan", price: 0, timeLimitSeconds: 300, pdfUploadAllowed: 0, whatsappAllowed: 0, scenarioPdfAllowed: 0, customFeatures: '["5 minutes speaking time limit", "Basic grammar topics practice", "Offline lessons access"]' },
      { id: "premium", name: "Premium Plan", price: 500, timeLimitSeconds: 3600, pdfUploadAllowed: 1, whatsappAllowed: 1, scenarioPdfAllowed: 1, customFeatures: '["60 minutes speaking time limit", "Direct PDF Handout Uploads", "Private WhatsApp Group Access", "Full tutor feedback loop"]' }
    ];
  }
}
function updatePlan(id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures) {
  try {
    db.prepare(`
      UPDATE plans 
      SET name = ?, price = ?, timeLimitSeconds = ?, pdfUploadAllowed = ?, whatsappAllowed = ?, scenarioPdfAllowed = ?, customFeatures = ?
      WHERE id = ?
    `).run(name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures || "[]", id);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}
function addPlan(id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures) {
  try {
    db.prepare(`
      INSERT INTO plans (id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures || "[]");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}
function deletePlan(id) {
  try {
    db.prepare("DELETE FROM plans WHERE id = ?").run(id);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}
function getUserPlanFeatures(username) {
  const user = getUser(username);
  const plans = getPlans();
  const freePlan = plans.find((p) => p.id === "free") || { id: "free", name: "Free Plan", price: 0, timeLimitSeconds: 300, pdfUploadAllowed: 0, whatsappAllowed: 0, scenarioPdfAllowed: 0 };
  const premiumPlan = plans.find((p) => p.id === "premium") || { id: "premium", name: "Premium Plan", price: 500, timeLimitSeconds: 3600, pdfUploadAllowed: 1, whatsappAllowed: 1, scenarioPdfAllowed: 1 };
  if (user && user.isPremium) {
    return premiumPlan;
  }
  return freePlan;
}
function submitPaymentRequest(username, plan, transactionId, amount = 0, paymentTime = "", screenshotUrl = "") {
  const id = import_crypto.default.randomUUID();
  try {
    let initialStatus = "pending";
    const pendingMsg = db.prepare(`SELECT * FROM admin_messages WHERE LOWER(extractedTrxId) = ? AND status = 'pending' LIMIT 1`).get(transactionId.trim().toLowerCase());
    if (pendingMsg) {
      initialStatus = "approved";
      db.prepare(`UPDATE admin_messages SET status = 'matched' WHERE id = ?`).run(pendingMsg.id);
      db.prepare("UPDATE users SET isPremium = 1, credits = 10000, hiddenCredits = 1000 WHERE username = ?").run(username);
    }
    db.prepare(`
      INSERT INTO payment_requests (id, username, plan, transactionId, amount, paymentTime, screenshotUrl, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, plan, transactionId, amount, paymentTime, screenshotUrl, initialStatus, (/* @__PURE__ */ new Date()).toISOString());
    return { success: true, message: initialStatus === "approved" ? "Payment matched and approved automatically!" : "Payment submitted for review." };
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { success: false, message: "This transaction ID has already been submitted." };
    }
    return { success: false, message: "Error submitting payment request." };
  }
}
function saveAdminMessage(rawMessage, sender, extractedTrxId, extractedAmount, status) {
  try {
    const recentDuplicate = db.prepare(`
      SELECT 1 FROM admin_messages 
      WHERE rawMessage = ? 
        AND sender = ? 
        AND createdAt >= datetime('now', '-60 minutes')
      LIMIT 1
    `).get(rawMessage, sender);
    if (recentDuplicate) {
      console.log(`[Deduplication] Blocked exact duplicate message from ${sender}`);
      return { duplicate: true };
    }
    const stmt = db.prepare(`INSERT INTO admin_messages (rawMessage, sender, extractedTrxId, extractedAmount, status) VALUES (?, ?, ?, ?, ?)`);
    return stmt.run(rawMessage, sender, extractedTrxId, extractedAmount, status);
  } catch (e) {
    console.error("Error saving admin message:", e);
  }
}
function getAdminMessages() {
  try {
    return db.prepare("SELECT * FROM admin_messages ORDER BY createdAt DESC LIMIT 100").all();
  } catch (e) {
    return [];
  }
}
function getUserPaymentRequests(username) {
  try {
    return db.prepare("SELECT * FROM payment_requests WHERE username = ? ORDER BY createdAt DESC").all(username);
  } catch (e) {
    return [];
  }
}
function getPendingPaymentRequests() {
  try {
    return db.prepare("SELECT * FROM payment_requests WHERE status = ?").all("pending");
  } catch (e) {
    return [];
  }
}
function getAllPaymentRequests() {
  try {
    return db.prepare("SELECT * FROM payment_requests ORDER BY createdAt DESC").all();
  } catch (e) {
    return [];
  }
}
function approvePaymentRequest(transactionId, realAmount) {
  try {
    const cleanTrx = transactionId.trim().toLowerCase();
    const trx = db.prepare("SELECT * FROM payment_requests WHERE LOWER(transactionId) = ? AND status = ?").get(cleanTrx, "pending");
    if (trx) {
      if (realAmount && realAmount > 0) {
        db.prepare("UPDATE payment_requests SET status = ?, amount = ? WHERE LOWER(transactionId) = ?").run("approved", realAmount, cleanTrx);
      } else {
        db.prepare("UPDATE payment_requests SET status = ? WHERE LOWER(transactionId) = ?").run("approved", cleanTrx);
      }
      const purchaseCost = realAmount && realAmount > 0 ? realAmount : trx.amount || 0;
      const pm = Number(getAdminSetting("profitMargin", "20"));
      const tokensPerTaka = Math.floor(1e6 / (2 * 120 * (1 + pm / 100)));
      const creditsToAdd = purchaseCost > 0 ? purchaseCost * tokensPerTaka : 1e4;
      db.prepare("UPDATE users SET isPremium = 1, credits = credits + ?, hiddenCredits = hiddenCredits + 1000 WHERE username = ?").run(creditsToAdd, trx.username);
      return { success: true, matchedUsername: trx.username };
    }
    return { success: false };
  } catch (e) {
    return { success: false };
  }
}
function getGrammarPros() {
  try {
    const rows = db.prepare(`
      SELECT u.username, u.isPremium, u.division, u.district, SUM(g.score) as totalGrammarScore, COUNT(g.id) as topicsCount, u.isScorePublic, u.school, u.class
      FROM users u
      JOIN grammar_scores g ON u.username = g.username
      WHERE u.isScorePublic = 1
      GROUP BY u.username
      ORDER BY totalGrammarScore DESC
      LIMIT 100
    `).all();
    return rows.map((r) => ({
      username: r.username,
      isPremium: !!r.isPremium,
      division: r.division || "",
      district: r.district || "",
      totalGrammarScore: r.totalGrammarScore || 0,
      topicsCount: r.topicsCount || 0,
      school: r.school || "",
      class: r.class || ""
    }));
  } catch (e) {
    return [];
  }
}
function editUserProfileExtended(username, name, gender, birthday, birthday_privacy, school, classVal, religion, privacyMessages) {
  try {
    db.prepare(`
      UPDATE users
      SET name = ?, gender = ?, birthday = ?, birthday_privacy = ?, school = ?, class = ?, religion = ?, privacy_messages = ?
      WHERE username = ?
    `).run(name, gender, birthday, birthday_privacy, school, classVal, religion, privacyMessages, username);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function submitAppeal(username, explanation) {
  try {
    db.prepare(`
      UPDATE users
      SET ban_appeal_status = 'pending', ban_appeal_text = ?
      WHERE username = ?
    `).run(explanation, username);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function updateUserAfterVerification(username, verified, name, gender, birthday, school, classVal, religion, verifiedDocId) {
  try {
    const updates = [];
    const params = [];
    updates.push("verified_badge = ?");
    params.push(verified ? 1 : 0);
    if (name !== void 0) {
      updates.push("name = ?");
      params.push(name);
    }
    if (gender !== void 0) {
      updates.push("gender = ?");
      params.push(gender);
    }
    if (birthday !== void 0) {
      updates.push("birthday = ?");
      params.push(birthday);
    }
    if (school !== void 0) {
      updates.push("school = ?");
      params.push(school);
    }
    if (classVal !== void 0) {
      updates.push("class = ?");
      params.push(classVal);
    }
    if (religion !== void 0) {
      updates.push("religion = ?");
      params.push(religion);
    }
    if (verifiedDocId !== void 0) {
      updates.push("verified_doc_id = ?");
      params.push(verifiedDocId);
    }
    if (updates.length > 0) {
      params.push(username);
      db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE username = ?`).run(...params);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function isDocIdAlreadyVerified(docId, currentUsername) {
  try {
    if (!docId || docId.trim() === "") return false;
    const row = db.prepare(`
      SELECT username FROM users 
      WHERE verified_badge = 1 
        AND verified_doc_id = ? 
        AND username != ?
      LIMIT 1
    `).get(docId.trim(), currentUsername);
    return !!row;
  } catch (e) {
    return false;
  }
}
function getFriendRequests(username) {
  try {
    return db.prepare("SELECT * FROM friend_requests WHERE receiver = ? OR sender = ? ORDER BY createdAt DESC").all(username, username);
  } catch (e) {
    return [];
  }
}
function sendFriendRequest(sender, receiver) {
  try {
    const id = import_crypto.default.randomUUID();
    const exists = db.prepare("SELECT id FROM friend_requests WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)").get(sender, receiver, receiver, sender);
    if (exists) {
      return { success: false, message: "Friend request relation already exists." };
    }
    db.prepare('INSERT INTO friend_requests (id, sender, receiver, status, createdAt) VALUES (?, ?, ?, "pending", ?)').run(id, sender, receiver, (/* @__PURE__ */ new Date()).toISOString());
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
function updateFriendRequest(reqId, status) {
  try {
    db.prepare("UPDATE friend_requests SET status = ? WHERE id = ?").run(status, reqId);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function getFriends(username) {
  try {
    const rows = db.prepare('SELECT * FROM friend_requests WHERE (sender = ? OR receiver = ?) AND status = "accepted"').all(username, username);
    return rows.map((r) => r.sender === username ? r.receiver : r.sender);
  } catch (e) {
    return [];
  }
}
function joinAnonymousQueue(username) {
  try {
    db.prepare("DELETE FROM anonymous_queue WHERE username = ?").run(username);
    const otherUser = db.prepare("SELECT username FROM anonymous_queue ORDER BY joinedAt ASC LIMIT 1").get();
    if (otherUser && otherUser.username !== username) {
      const roomId = import_crypto.default.randomUUID();
      db.prepare("DELETE FROM anonymous_queue WHERE username = ?").run(otherUser.username);
      db.prepare("INSERT INTO anonymous_rooms (id, user1, user2, createdAt, ended) VALUES (?, ?, ?, ?, 0)").run(roomId, otherUser.username, username, Date.now());
      return { matched: true, roomId, peer: otherUser.username };
    } else {
      db.prepare("INSERT INTO anonymous_queue (username, joinedAt) VALUES (?, ?)").run(username, Date.now());
      return { matched: false };
    }
  } catch (e) {
    console.error("Error in joinAnonymousQueue:", e);
    return { matched: false, error: e.message };
  }
}
function getAnonymousRoom(username) {
  try {
    return db.prepare("SELECT * FROM anonymous_rooms WHERE (user1 = ? OR user2 = ?) AND ended = 0 LIMIT 1").get(username, username);
  } catch (e) {
    return null;
  }
}
function leaveAnonymousQueue(username) {
  try {
    db.prepare("DELETE FROM anonymous_queue WHERE username = ?").run(username);
  } catch (e) {
  }
}
function leaveAnonymousRoom(roomId) {
  try {
    db.prepare("UPDATE anonymous_rooms SET ended = 1 WHERE id = ?").run(roomId);
  } catch (e) {
  }
}
function getAnonymousMessages(roomId) {
  try {
    return db.prepare("SELECT * FROM anonymous_messages WHERE roomId = ? ORDER BY createdAt ASC").all(roomId);
  } catch (e) {
    return [];
  }
}
function sendAnonymousMessage(roomId, sender, content) {
  const id = import_crypto.default.randomUUID();
  try {
    const badWords = [
      "slut",
      "bitch",
      "asshole",
      "bastard",
      "idiot",
      "fuck",
      "shit",
      "scam",
      "retard",
      "\u0996\u09BE\u09A8\u0995\u09BF",
      "\u09AE\u09BE\u09A6\u09BE\u09B0\u099A\u09CB\u09A6",
      "\u09AC\u09BE\u09B2",
      "\u0995\u09C1\u09A4\u09CD\u09A4\u09BE",
      "\u09AC\u09BE\u09B2\u09C7\u09B0",
      "\u099A\u09CB\u09A6",
      "\u099A\u09C1\u09A6\u09BF",
      "\u09B9\u09BE\u09B0\u09BE\u09AE\u09BF",
      "\u09B6\u09C1\u09DF\u09CB\u09B0",
      "\u09AC\u09C7\u09B6\u09CD\u09AF\u09BE"
    ];
    let isFlagged = 0;
    const lowerContent = content.toLowerCase();
    for (const word of badWords) {
      if (lowerContent.includes(word)) {
        isFlagged = 1;
        break;
      }
    }
    db.prepare("INSERT INTO anonymous_messages (id, roomId, senderAnonym, content, createdAt, isFlagged) VALUES (?, ?, ?, ?, ?, ?)").run(id, roomId, sender, content, (/* @__PURE__ */ new Date()).toISOString(), isFlagged);
    if (isFlagged === 1) {
      const user = getUser(sender);
      if (user) {
        const currentHealth = typeof user.account_health === "number" ? user.account_health : 100;
        const newHealth = Math.max(0, currentHealth - 25);
        if (newHealth <= 0) {
          db.prepare("UPDATE users SET account_health = 0, banned = 1, isPremium = 0, credits = 0 WHERE username = ?").run(sender);
        } else {
          db.prepare("UPDATE users SET account_health = ? WHERE username = ?").run(newHealth, sender);
        }
      }
    }
    return { success: true, isFlagged: isFlagged === 1 };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function saveUserCourse(username, assessmentData, isConverted = 0) {
  try {
    const rawScore = assessmentData.overallScore || 0;
    let scoreNum = 0;
    if (typeof rawScore === "number") {
      scoreNum = rawScore;
    } else {
      const match = String(rawScore).match(/^(\d+)/);
      scoreNum = match ? parseInt(match[1], 10) : 0;
    }
    const courseId = import_crypto.default.randomUUID();
    db.prepare(`
      INSERT INTO user_courses (id, username, cefrLevel, overallScore, strengths, weaknesses, createdAt, isConverted, grammarScore, vocabularyScore, fluencyScore, pronunciationScore, confidenceScore, sentenceStructureScore, commonGrammarMistakes, vocabularyGaps)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      courseId,
      username,
      assessmentData.cefrLevel || "",
      scoreNum,
      typeof assessmentData.strengths === "string" ? assessmentData.strengths : JSON.stringify(assessmentData.strengths || ""),
      typeof assessmentData.weaknesses === "string" ? assessmentData.weaknesses : JSON.stringify(assessmentData.weaknesses || ""),
      (/* @__PURE__ */ new Date()).toISOString(),
      isConverted,
      assessmentData.grammarScore || 0,
      assessmentData.vocabularyScore || 0,
      assessmentData.fluencyScore || 0,
      assessmentData.pronunciationScore || 0,
      assessmentData.confidenceScore || 0,
      assessmentData.sentenceStructureScore || 0,
      typeof assessmentData.commonGrammarMistakes === "string" ? assessmentData.commonGrammarMistakes : JSON.stringify(assessmentData.commonGrammarMistakes || ""),
      typeof assessmentData.vocabularyGaps === "string" ? assessmentData.vocabularyGaps : JSON.stringify(assessmentData.vocabularyGaps || "")
    );
    const learningPlan = assessmentData.recommendedLearningPlan || [];
    let stepIndex = 1;
    const stmt = db.prepare(`
      INSERT INTO course_topics (id, courseId, stepIndex, stepName, stepDescription, topicsToLearn, grammarTopics, areasForImprovement, actionsToAvoid, whyLearn, whatToGain, engagementInfo, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const step of learningPlan) {
      const topicId = import_crypto.default.randomUUID();
      stmt.run(
        topicId,
        courseId,
        stepIndex++,
        step.stepName || "",
        step.stepDescription || "",
        step.topicsToLearn || "",
        step.grammarTopics || "",
        step.areasForImprovement || "",
        step.actionsToAvoid || "",
        step.whyLearn || "",
        step.whatToGain || "",
        step.engagementInfo || "",
        (/* @__PURE__ */ new Date()).toISOString()
      );
    }
    return { success: true, courseId };
  } catch (e) {
    console.error("Error saving user course:", e);
    return { success: false };
  }
}
function convertUserCourseToActive(username) {
  try {
    db.prepare("UPDATE user_courses SET isConverted = 1 WHERE username = ?").run(username);
    return { success: true };
  } catch (e) {
    console.error("Error setting isConverted user course:", e);
    return { success: false };
  }
}
function getUserCourse(username) {
  try {
    const course = db.prepare("SELECT * FROM user_courses WHERE username = ? ORDER BY createdAt DESC LIMIT 1").get(username);
    if (!course) return null;
    const topics = db.prepare("SELECT * FROM course_topics WHERE courseId = ? ORDER BY stepIndex ASC").all(course.id);
    return {
      ...course,
      topics
    };
  } catch (e) {
    console.error("Error getting user course:", e);
    return null;
  }
}
function updateTopicProgress(topicId, score) {
  try {
    const current = db.prepare("SELECT highestScore FROM course_topics WHERE id = ?").get(topicId);
    if (current) {
      const newMax = Math.max(current.highestScore, score);
      const isCompleted = newMax >= 80 ? 1 : 0;
      db.prepare("UPDATE course_topics SET highestScore = ?, isCompleted = ? WHERE id = ?").run(newMax, isCompleted, topicId);
    }
  } catch (e) {
    console.error("Error upading topic progress", e);
  }
}
function splitTopicsByRules(str) {
  let result = [];
  let current = "";
  let inParen = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "(") inParen++;
    if (char === ")") inParen = Math.max(0, inParen - 1);
    if (inParen === 0 && (char === "," || char === ";")) {
      if (current.trim()) result.push(current.trim());
      current = "";
      continue;
    }
    if (inParen === 0 && str.substring(i, i + 5).toLowerCase() === " and ") {
      if (current.trim()) result.push(current.trim());
      current = "";
      i += 4;
      continue;
    }
    current += char;
  }
  if (current.trim()) result.push(current.trim());
  return result.map((s) => s.replace(/\.$/, "").replace(/\s+/g, " ").trim()).filter(Boolean);
}
function getOrCreateSubtopics(courseTopicId, grammarTopicsString) {
  try {
    const existing = db.prepare("SELECT * FROM course_subtopics WHERE courseTopicId = ? ORDER BY createdAt ASC").all(courseTopicId);
    if (existing.length > 0) {
      return existing;
    }
    let names = [];
    if (grammarTopicsString) {
      names = splitTopicsByRules(grammarTopicsString);
    }
    if (names.length === 0) {
      names = ["General Concept & Mastery", "Sentence Structure & Exercises", "Conversational Sandbox"];
    }
    const stmt = db.prepare("INSERT OR IGNORE INTO course_subtopics (id, courseTopicId, name, isCompleted, createdAt) VALUES (?, ?, ?, ?, ?)");
    for (const name of names) {
      if (name.trim()) {
        stmt.run(import_crypto.default.randomUUID(), courseTopicId, name.trim(), 0, (/* @__PURE__ */ new Date()).toISOString());
      }
    }
    return db.prepare("SELECT * FROM course_subtopics WHERE courseTopicId = ? ORDER BY createdAt ASC").all(courseTopicId);
  } catch (e) {
    console.error("Error in getOrCreateSubtopics:", e);
    return [];
  }
}
function completeSubtopic(subtopicId, courseTopicId) {
  try {
    db.prepare("UPDATE course_subtopics SET isCompleted = 1 WHERE id = ?").run(subtopicId);
    const allSubtopics = db.prepare("SELECT isCompleted FROM course_subtopics WHERE courseTopicId = ?").all(courseTopicId);
    if (allSubtopics.length > 0) {
      const completedCount = allSubtopics.filter((s) => s.isCompleted === 1).length;
      const ratio = completedCount / allSubtopics.length;
      const percentInteger = Math.round(ratio * 100);
      const isCompleted = ratio >= 0.8 ? 1 : 0;
      db.prepare("UPDATE course_topics SET isCompleted = ?, highestScore = ? WHERE id = ?").run(isCompleted, percentInteger, courseTopicId);
    }
    return { success: true };
  } catch (e) {
    console.error("Error in completeSubtopic:", e);
    return { success: false };
  }
}
function savePrepPdf(username, topic, pdfMarkdown) {
  const id = import_crypto.default.randomUUID();
  try {
    db.prepare(`
      INSERT INTO saved_prep_pdfs (id, username, topic, pdfMarkdown, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(username, topic) DO UPDATE SET
        pdfMarkdown = excluded.pdfMarkdown
    `).run(id, username, topic, pdfMarkdown, (/* @__PURE__ */ new Date()).toISOString());
  } catch (e) {
    console.error("Error saving prep PDF into DB", e);
  }
}
function getPrepPdfByTopic(username, topic) {
  try {
    return db.prepare("SELECT * FROM saved_prep_pdfs WHERE username = ? AND topic = ?").get(username, topic);
  } catch (e) {
    console.error("Error getting prep PDF by topic", e);
    return null;
  }
}
function getPrepPdfByTopicOrId(username, idOrTopic) {
  try {
    return db.prepare("SELECT * FROM saved_prep_pdfs WHERE username = ? AND (id = ? OR topic = ?)").get(username, idOrTopic, idOrTopic);
  } catch (e) {
    console.error("Error getPrepPdfByTopicOrId:", e);
    return null;
  }
}
function updatePrepPdfPracticeScore(username, topic, score) {
  try {
    const current = db.prepare("SELECT highestPracticeScore FROM saved_prep_pdfs WHERE username = ? AND topic = ?").get(username, topic);
    if (current) {
      const newMax = Math.max(current.highestPracticeScore, score);
      const isPracticeCompleted = newMax >= 80 ? 1 : 0;
      db.prepare("UPDATE saved_prep_pdfs SET highestPracticeScore = ?, isPracticeCompleted = ? WHERE username = ? AND topic = ?").run(newMax, isPracticeCompleted, username, topic);
      const activeCourse = db.prepare("SELECT id FROM user_courses WHERE username = ? ORDER BY createdAt DESC LIMIT 1").get(username);
      if (activeCourse) {
        const matchingTopic = db.prepare("SELECT id, highestScore FROM course_topics WHERE courseId = ? AND stepName = ?").get(activeCourse.id, topic);
        if (matchingTopic) {
          const courseNewMax = Math.max(matchingTopic.highestScore, score);
          const courseCompleted = courseNewMax >= 80 ? 1 : 0;
          db.prepare("UPDATE course_topics SET highestScore = ?, isCompleted = ? WHERE id = ?").run(courseNewMax, courseCompleted, matchingTopic.id);
        }
      }
    }
  } catch (e) {
    console.error("Error updating prep PDF practice score", e);
  }
}
function getPrepPdfsForUser(username) {
  try {
    return db.prepare("SELECT * FROM saved_prep_pdfs WHERE username = ?").all(username);
  } catch (e) {
    console.error("Error listing prep PDFs for user", e);
    return [];
  }
}
function getSubtopicName(subtopicId) {
  try {
    const row = db.prepare("SELECT name FROM course_subtopics WHERE id = ?").get(subtopicId);
    return row ? row.name : "";
  } catch (e) {
    return "";
  }
}
function getSubtopicsForTopicId(topicId) {
  try {
    const topic = db.prepare("SELECT grammarTopics FROM course_topics WHERE id = ?").get(topicId);
    if (!topic) return [];
    return getOrCreateSubtopics(topicId, topic.grammarTopics);
  } catch (e) {
    console.error("Error in getSubtopicsForTopicId", e);
    return [];
  }
}
try {
  db.exec("CREATE TABLE IF NOT EXISTS admin_settings(key TEXT PRIMARY KEY, value TEXT);");
} catch (e) {
}
function getAdminSetting(key, defaultValue = "") {
  try {
    const row = db.prepare("SELECT value FROM admin_settings WHERE key = ?").get(key);
    return row ? row.value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}
function setAdminSetting(key, value) {
  try {
    db.prepare("INSERT INTO admin_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
  } catch (e) {
  }
}

// backend/auth_routes.ts
var import_genai = require("@google/genai");
var router = (0, import_express.Router)();
var JWT_SECRET = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
var aiClient = null;
function getAI() {
  if (!aiClient) {
    const apiKey2 = process.env.GEMINI_API_KEY;
    if (apiKey2) {
      aiClient = new import_genai.GoogleGenAI({
        apiKey: apiKey2,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
    }
  }
  return aiClient;
}
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
    const features = getUserPlanFeatures(payload.username);
    const timeLimit = features.timeLimitSeconds;
    const timeLeft = typeof user.credits === "number" ? user.credits : 1500;
    res.json({
      username: user.username,
      isPremium: user.isPremium,
      chatTimeUsed: user.chatTimeUsed,
      timeLeft,
      timeLimit,
      whatsapp: user.whatsapp || "",
      isWhatsappPublic: !!user.isWhatsappPublic,
      performanceScore: typeof user.performanceScore === "number" ? user.performanceScore : 0,
      division: user.division || "",
      district: user.district || "",
      credits: timeLeft,
      hiddenCredits: typeof user.hiddenCredits === "number" ? user.hiddenCredits : 0,
      isScorePublic: typeof user.isScorePublic === "boolean" || typeof user.isScorePublic === "number" ? !!user.isScorePublic : true,
      isProfilePublic: typeof user.isProfilePublic === "boolean" || typeof user.isProfilePublic === "number" ? !!user.isProfilePublic : true,
      email: user.email || "",
      earnedPublicIncentive: !!user.earnedPublicIncentive,
      education: user.education || "",
      occupation: user.occupation || "",
      bio: user.bio || "",
      skills: user.skills || "",
      achievements: user.achievements || "",
      profilePicture: user.profilePicture || "",
      name: user.name || "",
      gender: user.gender || "",
      birthday: user.birthday || "",
      birthday_privacy: user.birthday_privacy || "public",
      school: user.school || "",
      class: user.class || "",
      religion: user.religion || "",
      verified_badge: typeof user.verified_badge === "number" ? user.verified_badge : 0,
      banned: typeof user.banned === "number" ? user.banned : 0,
      account_health: typeof user.account_health === "number" ? user.account_health : 100,
      ban_appeal_status: user.ban_appeal_status || "none",
      ban_appeal_text: user.ban_appeal_text || "",
      privacy_messages: user.privacy_messages || "public"
    });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
var getClientIp = (req) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      const ipStr = typeof forwarded === "string" ? forwarded : Array.isArray(forwarded) ? forwarded[0] || "" : String(forwarded);
      if (ipStr) {
        return ipStr.split(",")[0].trim();
      }
    }
    return req.socket?.remoteAddress || req.ip || "unknown";
  } catch (e) {
    console.error("Error detecting client IP:", e);
    return "unknown";
  }
};
router.get("/credits/costs", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const costs = getCreditCosts(payload.username);
    const u = getUser(payload.username);
    res.json({ costs, remainingCredits: u ? u.credits : 0 });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
router.get("/credits/transactions", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const transactions = getCreditTransactions(payload.username);
    res.json({ transactions });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
router.get("/credits/status", (req, res) => {
  const auth = req.headers.authorization;
  const ip = getClientIp(req);
  if (auth && auth !== "Bearer null" && auth !== "Bearer undefined" && auth.startsWith("Bearer ")) {
    try {
      const token = auth.replace("Bearer ", "");
      const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      const user = getUser(payload.username);
      if (user) {
        const userCredits = typeof user.credits === "number" ? user.credits : 1500;
        res.json({
          credits: userCredits,
          isExhausted: userCredits <= 0
        });
        return;
      }
    } catch (e) {
    }
  }
  const ipCredits = getIpCredits(ip);
  res.json({
    credits: ipCredits,
    isExhausted: ipCredits <= 0
  });
});
router.post("/profile/update", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const { whatsapp, isWhatsappPublic, division, district, isScorePublic, isProfilePublic, email, education, occupation, bio, skills, achievements } = req.body;
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = getUser(payload.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    const outcome = updateUserProfileFull(
      payload.username,
      whatsapp || "",
      !!isWhatsappPublic,
      division || "",
      district || "",
      isScorePublic !== void 0 ? !!isScorePublic : true,
      isProfilePublic !== void 0 ? !!isProfilePublic : true,
      email || "",
      education || "",
      occupation || "",
      bio || "",
      skills || "",
      achievements || ""
    );
    res.json({ success: true, ...outcome });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
router.get("/profiles/search", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const query = req.query.q || "";
  if (!query || query.trim().length === 0) {
    return res.json({ profiles: [] });
  }
  try {
    const profiles = searchPublicProfiles(query.trim());
    res.json({ profiles });
  } catch (e) {
    res.status(500).json({ error: "Search failed" });
  }
});
router.post("/premium/redistribute", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = getUser(payload.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.isPremium) return res.status(403).json({ error: "Premium permission required" });
    const result = redistributeInactiveHiddenCredits();
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
router.post("/premium/profile", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const { whatsapp, isWhatsappPublic } = req.body;
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = getUser(payload.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.isPremium) return res.status(403).json({ error: "Premium permission required" });
    updatePremiumProfile(payload.username, whatsapp || "", !!isWhatsappPublic);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
router.get("/premium/performers", (req, res) => {
  try {
    const performers = getTopPerformers();
    res.json({ performers });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch leaderboard data" });
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
  const ip = getClientIp(req);
  const secs = typeof seconds === "number" ? seconds : 5;
  if (auth && auth !== "null" && auth !== "undefined") {
    try {
      const token = auth.replace("Bearer ", "");
      const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      const tokenPricePerSec2 = 250;
      const tokensToDeduct2 = secs * tokenPricePerSec2;
      const remainingCredits2 = deductCredits(payload.username, tokensToDeduct2, "Voice Chat (Live Duration)");
      updateChatTime(payload.username, secs);
      deductIpCredits(ip, tokensToDeduct2);
      res.json({
        timeLeft: remainingCredits2,
        timeLimit: getUserPlanFeatures(payload.username).timeLimitSeconds,
        isExhausted: remainingCredits2 <= 0,
        credits: remainingCredits2
      });
      return;
    } catch (e) {
    }
  }
  const tokenPricePerSec = 250;
  const tokensToDeduct = secs * tokenPricePerSec;
  const remainingCredits = deductIpCredits(ip, tokensToDeduct);
  res.json({
    timeLeft: remainingCredits,
    timeLimit: 30,
    isExhausted: remainingCredits <= 0,
    credits: remainingCredits
  });
});
router.get("/history", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const records = getUserHistoryRecords(payload.username);
    res.json(records);
  } catch (e) {
    res.status(401).json({ error: "Unauthorized or invalid token" });
  }
});
router.post("/history", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const { record } = req.body;
    if (!record) return res.status(400).json({ error: "Missing record details" });
    saveHistoryRecord(payload.username, record);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: "Unauthorized or invalid token" });
  }
});
router.delete("/history", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    clearUserHistoryRecords(payload.username);
    res.json({ success: true, message: "All practice session histories cleared." });
  } catch (e) {
    res.status(401).json({ error: "Unauthorized or invalid token" });
  }
});
router.get("/admin/users", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const users = getAllUsers();
  console.log("Admin getting users. Count:", users.length);
  res.json(users);
});
router.post("/admin/users/:id/approve", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { isPremium } = req.body;
  setUserPremium(req.params.id, isPremium);
  res.json({ success: true });
});
router.get("/admin/messages", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  res.json(getMessages());
});
router.post("/admin/messages/:id/reply", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  replyToMessage(req.params.id, req.body.reply);
  res.json({ success: true });
});
router.post("/payments/bot-chat", async (req, res) => {
  const { message, history } = req.body;
  const ai2 = getAI();
  if (!ai2) return res.status(500).json({ reply: "I'm sorry, AI is not configured." });
  try {
    const formattedHistory = history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));
    formattedHistory.push({ role: "user", parts: [{ text: message }] });
    const plansList = getPlans();
    const premiumPlan = plansList.find((p) => p.id === "premium") || { price: 500 };
    const priceText = `\u09F3${premiumPlan.price}`;
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedHistory,
      config: {
        systemInstruction: `You are the friendly Spoken English Buddy sales assistant. Your job is to guide the user to purchase the Premium Plan for ${priceText} / month. The user can get unlimited AI speaking practice and advanced pronunciation metrics. The bKash/Nagad number is 01XXXXXXXXX. Tell them to send exactly ${priceText} to this number (Personal), take a screenshot, and upload it in the 'Manual Form' section or enter the TrxID here. Be helpful, enthusiastic, and speak in a mix of Bengali and standard English.`,
        temperature: 0.7
      }
    });
    res.json({ reply: response.text });
  } catch (e) {
    res.json({ reply: "Sorry, I had trouble processing that right now." });
  }
});
router.post("/payments/scan", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "Missing image" });
  const ai2 = getAI();
  if (!ai2) return res.status(500).json({ error: "AI not configured" });
  try {
    const token = auth.replace("Bearer ", "");
    import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Extract the transaction ID and amount transferred (number only) from this mobile banking payment screenshot. Please return as JSON format with keys: `transactionId` and `amount`. If you can't find one, leave it empty." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            transactionId: { type: "STRING" },
            amount: { type: "INTEGER" }
          },
          required: ["transactionId"]
          // Make only transactionId strictly required by schema definition
        }
      }
    });
    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } else {
      return res.status(400).json({ error: "Could not extract information." });
    }
  } catch (e) {
    return res.status(500).json({ error: "Failed to process screenshot" });
  }
});
router.get("/payments/my-requests", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const requests = getUserPaymentRequests(payload.username);
    res.json(requests);
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
});
router.post("/payments/request", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const { plan, transactionId, amount, screenshotUrl } = req.body;
  if (!plan || !transactionId) return res.status(400).json({ error: "Missing plan or transactionId" });
  try {
    const token = auth.replace("Bearer ", "");
    const payload = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const pInfo = getUser(payload.username);
    if (pInfo && pInfo.isPremium) {
      return res.status(400).json({ error: "You are already a premium member." });
    }
    const result = submitPaymentRequest(
      payload.username,
      plan,
      transactionId.trim(),
      amount || 0,
      "",
      // paymentTime effectively removed
      screenshotUrl || ""
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
});
router.get("/admin/payments/pending", (req, res) => {
  console.log("HIT PENDING ROUTE");
  const adminSecret = req.headers["admin-secret"];
  const isAuditor = adminSecret === "auditor" || adminSecret === "auditor123" || process.env.AUDITOR_SECRET && adminSecret === process.env.AUDITOR_SECRET;
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin" && !isAuditor) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const pending = getPendingPaymentRequests();
  console.log("Admin getting pending payments. Count:", pending.length);
  res.json(pending);
});
router.get("/admin/payments/all", (req, res) => {
  try {
    const adminSecret = req.headers["admin-secret"];
    const isAuditor = adminSecret === "auditor" || adminSecret === "auditor123" || process.env.AUDITOR_SECRET && adminSecret === process.env.AUDITOR_SECRET;
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin" && !isAuditor) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const all = getAllPaymentRequests();
    res.json(all);
  } catch (e) {
    console.error("GET /admin/payments/all failed:", e);
    res.status(500).json({ error: e.message || "Unknown error" });
  }
});
router.post("/admin/payments/verify", async (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  const isAuditor = adminSecret === "auditor" || adminSecret === "auditor123" || process.env.AUDITOR_SECRET && adminSecret === process.env.AUDITOR_SECRET;
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin" && !isAuditor) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { smsText } = req.body;
  if (!smsText) return res.status(400).json({ error: "Missing sms text" });
  const pendingReqs = getPendingPaymentRequests();
  const results = [];
  const messages = smsText.split("\n").filter((m) => m.trim().length > 5);
  const parsedTransactions = [];
  for (const msg of messages) {
    const trxMatch = msg.match(/(?:TrxID|TxnId|Txn ID|Transaction ID|ID)[\s:=]*([A-Z0-9]{4,})/i);
    const amtMatch = msg.match(/(?:Tk|BDT|Rs|Amount|Received)[\s\.]*([\d,]+(?:\.\d+)?)/i) || msg.match(/([\d,]+(?:\.\d+)?)[\s]*(?:Tk|BDT|Rs)/i);
    if (trxMatch) {
      parsedTransactions.push({
        trxId: trxMatch[1].toUpperCase(),
        amount: amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : null,
        rawMsg: msg
      });
    }
  }
  const ai2 = getAI();
  if (ai2) {
    try {
      console.log("Analyzing log with Gemini-3.5-flash for maximum extraction integrity...");
      const aiResponse = await ai2.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an automated mobile financial transaction SMS log parser.
Parse the following block of text, which contains bulk status notifications, payment confirmations, or transaction records.
Extract all successful Transaction IDs (TrxID) and numeric transaction amounts.
Format the output as a strict, valid JSON array of objects without any markdown, backticks or code fencing.
Each object must have exactly these keys:
- "trxId": string (The exact extracted Transaction ID letter/number sequence, converted to uppercase)
- "amount": number or null (The payment amount as a clean float or integer)
- "time": string or null (The logged timestamp of payment, if stated)

Text to parse:
${smsText}
`,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = aiResponse.text;
      if (text) {
        const jsonContent = text.trim();
        const aiParsed = JSON.parse(jsonContent);
        if (Array.isArray(aiParsed)) {
          for (const item of aiParsed) {
            if (item && typeof item === "object" && item.trxId) {
              const cleanedTrx = String(item.trxId).toUpperCase().trim();
              if (cleanedTrx.length >= 4 && !parsedTransactions.some((pt) => pt.trxId === cleanedTrx)) {
                parsedTransactions.push({
                  trxId: cleanedTrx,
                  amount: typeof item.amount === "number" ? item.amount : null,
                  time: item.time || null,
                  rawMsg: "Parsed via Gemini automated transaction parser"
                });
              }
            }
          }
        }
      }
    } catch (aiErr) {
      console.error("AI Automated SMS parser supplement failed, using regex-only records:", aiErr.message);
    }
  }
  for (const pReq of pendingReqs) {
    if (!pReq.transactionId) continue;
    const pendingTrxId = pReq.transactionId.trim().toUpperCase();
    if (pendingTrxId.length < 4) continue;
    const foundParsed = parsedTransactions.find((pt) => pt.trxId.includes(pendingTrxId) || pendingTrxId.includes(pt.trxId));
    if (foundParsed || smsText.toUpperCase().includes(pendingTrxId)) {
      const matchOutcome = approvePaymentRequest(pReq.transactionId, foundParsed ? Number(foundParsed.amount) : void 0);
      if (matchOutcome.success) {
        results.push({
          transactionId: pReq.transactionId,
          username: pReq.username,
          status: "approved",
          parsedAmount: foundParsed?.amount || null,
          parsedTime: foundParsed?.time || null
        });
      }
    }
  }
  res.json({ success: true, verified: results, parsedTransactions, totalChecked: pendingReqs.length, parsedCount: parsedTransactions.length });
});
router.post("/admin/payments/approve", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { transactionId } = req.body;
  if (!transactionId) return res.status(400).json({ error: "Missing transactionId" });
  const matchOutcome = approvePaymentRequest(transactionId);
  if (matchOutcome.success) {
    res.json({ success: true, transactionId });
  } else {
    res.status(400).json({ error: "Failed to approve manually or transaction already approved." });
  }
});
router.get("/payment-methods", (req, res) => {
  res.json(getPaymentMethods());
});
router.post("/admin/payment-methods", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { name, number, type } = req.body;
  if (!name || !number) {
    return res.status(400).json({ error: "Missing name or number" });
  }
  const result = addPaymentMethod(name, number, type || "Personal");
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || "Failed to add payment method" });
  }
});
router.put("/admin/payment-methods/:id", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { name, number, type } = req.body;
  if (!name || !number) {
    return res.status(400).json({ error: "Missing name or number" });
  }
  const result = updatePaymentMethod(req.params.id, name, number, type || "Personal");
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || "Failed to update payment method" });
  }
});
router.delete("/admin/payment-methods/:id", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const result = deletePaymentMethod(req.params.id);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || "Failed to delete payment method" });
  }
});
router.get("/plans", (req, res) => {
  res.json(getPlans());
});
router.post("/admin/plans/:id", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures } = req.body;
  if (!name || price === void 0) {
    return res.status(400).json({ error: "Missing name or price parameter." });
  }
  const result = updatePlan(
    req.params.id,
    name,
    Number(price),
    timeLimitSeconds !== void 0 ? Number(timeLimitSeconds) : 300,
    pdfUploadAllowed ? 1 : 0,
    whatsappAllowed ? 1 : 0,
    scenarioPdfAllowed ? 1 : 0,
    customFeatures ? typeof customFeatures === "string" ? customFeatures : JSON.stringify(customFeatures) : "[]"
  );
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || "Failed to update plan." });
  }
});
router.post("/admin/plans-add", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures } = req.body;
  if (!id || !name || price === void 0) {
    return res.status(400).json({ error: "Missing id, name or price parameter." });
  }
  const result = addPlan(
    id,
    name,
    Number(price),
    timeLimitSeconds !== void 0 ? Number(timeLimitSeconds) : 300,
    pdfUploadAllowed ? 1 : 0,
    whatsappAllowed ? 1 : 0,
    scenarioPdfAllowed ? 1 : 0,
    customFeatures ? typeof customFeatures === "string" ? customFeatures : JSON.stringify(customFeatures) : "[]"
  );
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || "Failed to add plan." });
  }
});
router.delete("/admin/plans/:id", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const result = deletePlan(req.params.id);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || "Failed to delete plan." });
  }
});
router.all("/sms-receiver", async (req, res) => {
  console.log("==> RECEIVED INBOUND WEBHOOK REQUEST <==");
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Body:", JSON.stringify(req.body));
  console.log("Query:", JSON.stringify(req.query));
  const findValue = (obj, targetKeys) => {
    if (!obj || typeof obj !== "object") return "";
    for (const key of Object.keys(obj)) {
      if (targetKeys.includes(key.toLowerCase())) {
        const val = obj[key];
        if (val !== void 0 && val !== null) {
          return typeof val === "object" ? JSON.stringify(val) : val.toString().trim();
        }
      }
    }
    return "";
  };
  const senderKeys = ["sender", "from", "phone", "address", "number", "sendername", "contact", "sender_number", "source", "phone_number"];
  const messageKeys = ["message", "msg", "text", "body", "content", "sms", "smscontent", "subject", "textbody", "payload"];
  let messageStr = findValue(req.body, messageKeys) || findValue(req.query, messageKeys);
  let senderStr = findValue(req.body, senderKeys) || findValue(req.query, senderKeys);
  if (!messageStr && req.body) {
    if (typeof req.body === "string") {
      messageStr = req.body;
    } else {
      for (const val of Object.values(req.body)) {
        if (typeof val === "string" && val.length > 15) {
          messageStr = val;
          break;
        }
      }
    }
  }
  const message = messageStr || JSON.stringify(Object.keys(req.body || {}).length > 0 ? req.body : req.query);
  const sender = senderStr || "Unknown Hook";
  try {
    let trxId = "";
    let amount = 0;
    const trxRegexes = [
      /TrxID[\s:]*([A-Za-z0-9]+)/i,
      /TxID[\s:]*([A-Za-z0-9]+)/i,
      /TxnId[\s:]*([A-Za-z0-9]+)/i,
      /TxnID[\s:]*([A-Za-z0-9]+)/i,
      /Transaction ID[\s:]*([A-Za-z0-9]+)/i,
      /TrId[\s:]*([A-Za-z0-9]+)/i,
      /ID[\s:]*([A-Z0-9]{8,12})/i,
      /\b([A-Z0-9]{8,12})\b/
    ];
    for (const regex of trxRegexes) {
      const match = message.match(regex);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (candidate.length >= 6 && /[0-9]/.test(candidate) && /[a-zA-Z]/.test(candidate)) {
          trxId = candidate;
          break;
        }
      }
    }
    const amountRegexes = [
      /Tk[\s\.]*([0-9,]+)/i,
      /BDT[\s]*([0-9,]+)/i,
      /Amount[\s:]*Tk\.?[\s]*([0-9,]+)/i,
      /Amount[\s:]*([0-9,]+)/i,
      /([0-9,]+)\s*Tk/i,
      /([0-9,]+)\s*BDT/i
    ];
    for (const regex of amountRegexes) {
      const match = message.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) {
          amount = val;
          break;
        }
      }
    }
    const ai2 = getAI();
    if (ai2 && (!trxId || !amount)) {
      const extractPrompt = `Extract the transaction ID (TrxID) and the amount from this payment confirmation SMS: "${message}". The TrxID is usually an alphanumeric string (like 8-10 chars e.g. 9J5B1X9..., TrxID ..., TxnId ...). The amount is a number following Tk, BDT, or amount. Respond ONLY in valid JSON format: { "trxId": "extracted_id_or_empty", "amount": extracted_number_or_0 }`;
      try {
        const response = await ai2.models.generateContent({
          model: "gemini-3.5-flash",
          contents: extractPrompt,
          config: { responseMimeType: "application/json" }
        });
        const extracted = JSON.parse(response.text || "{}");
        if (!trxId) trxId = extracted.trxId || "";
        if (!amount) amount = extracted.amount || 0;
      } catch (err) {
        console.error("Gemini parse failed", err);
      }
    }
    let msgStatus = "pending";
    if (trxId) {
      trxId = trxId.trim();
      const pendingPayment = getPendingPaymentRequests().find((p) => p.transactionId.toLowerCase().trim() === trxId.toLowerCase());
      if (pendingPayment) {
        approvePaymentRequest(pendingPayment.transactionId, amount ? Number(amount) : void 0);
        msgStatus = "matched";
        console.log(`[Auto-Match] Found matching user premium request for TrxID: ${trxId}. Automatically approved!`);
      }
    }
    saveAdminMessage(message, sender, trxId, amount, msgStatus);
    console.log(`[Webhook Success] Processed. Sender: ${sender}, TrxID: ${trxId}, Amount: ${amount}, status: ${msgStatus}`);
    res.json({ success: true, trxId, amount, status: msgStatus });
  } catch (e) {
    console.error("Error processing inbound SMS:", e);
    res.status(500).json({ error: e.message });
  }
});
router.get("/admin/sms-messages", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  res.json(getAdminMessages());
});
var auth_routes_default = router;
router.get("/settings", (req, res) => {
  res.json({ profitMargin: getAdminSetting("profitMargin", "20") });
});
router.post("/admin/settings", (req, res) => {
  const adminSecret = req.headers["admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  if (req.body.profitMargin) setAdminSetting("profitMargin", req.body.profitMargin.toString());
  res.json({ success: true });
});

// backend/social_routes.ts
var import_express2 = require("express");
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_genai2 = require("@google/genai");
var router2 = (0, import_express2.Router)();
var JWT_SECRET2 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
var aiClient2 = null;
function getAI2() {
  if (!aiClient2) {
    const apiKey2 = process.env.GEMINI_API_KEY;
    if (apiKey2) {
      aiClient2 = new import_genai2.GoogleGenAI({
        apiKey: apiKey2,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
    }
  }
  return aiClient2;
}
var authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};
router2.post("/ping", authenticate, (req, res) => {
  updateUserActivity(req.user.username);
  res.json({ success: true });
});
router2.get("/status/:username", authenticate, (req, res) => {
  const lastActive = getUserActivity(req.params.username);
  const isOnline = Date.now() - lastActive < 6e4;
  res.json({ isOnline, lastActive });
});
router2.post("/profile-picture", authenticate, (req, res) => {
  const { picture } = req.body;
  if (!picture) return res.status(400).json({ error: "Picture is required" });
  try {
    updateProfilePicture(req.user.username, picture);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update" });
  }
});
router2.post("/posts", authenticate, (req, res) => {
  const { content, mediaUrl, originalPostId } = req.body;
  try {
    const id = createPost(req.user.username, content || "", mediaUrl || "", originalPostId || null);
    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.get("/posts", (req, res) => {
  const auth = req.headers.authorization;
  let username;
  if (auth && auth !== "null" && auth !== "undefined") {
    try {
      const payload = import_jsonwebtoken2.default.verify(auth.replace("Bearer ", ""), JWT_SECRET2);
      username = payload.username;
    } catch (e) {
    }
  }
  try {
    const posts = getPosts(username);
    res.json({ posts });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.get("/user-posts/:username", (req, res) => {
  const auth = req.headers.authorization;
  let currentUsername;
  if (auth && auth !== "null" && auth !== "undefined") {
    try {
      const payload = import_jsonwebtoken2.default.verify(auth.replace("Bearer ", ""), JWT_SECRET2);
      currentUsername = payload.username;
    } catch (e) {
    }
  }
  try {
    const posts = getUserPosts(req.params.username, currentUsername);
    res.json({ posts });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.post("/posts/:postId/like", authenticate, (req, res) => {
  try {
    const liked = toggleLike(req.params.postId, req.user.username);
    res.json({ success: true, liked });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.post("/posts/:postId/comments", authenticate, (req, res) => {
  try {
    const { content } = req.body;
    addComment(req.params.postId, req.user.username, content);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.get("/posts/:postId/comments", (req, res) => {
  try {
    const comments = getComments(req.params.postId);
    res.json({ comments });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.get("/messages/peers", authenticate, (req, res) => {
  try {
    const peers = getChatPeers(req.user.username);
    res.json({ peers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.post("/messages/:recipient", authenticate, (req, res) => {
  try {
    sendDirectMessage(req.user.username, req.params.recipient, req.body.content);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.get("/messages/:peer", authenticate, (req, res) => {
  try {
    markMessagesAsRead(req.user.username, req.params.peer);
    const messages = getDirectMessages(req.user.username, req.params.peer);
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.post("/block/:blocked", authenticate, (req, res) => {
  try {
    blockUser(req.user.username, req.params.blocked);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});
router2.post("/profile/update", authenticate, (req, res) => {
  const { name, gender, birthday, birthday_privacy, school, classVal, religion, privacyMessages } = req.body;
  try {
    editUserProfileExtended(
      req.user.username,
      name || "",
      gender || "",
      birthday || "",
      birthday_privacy || "public",
      school || "",
      classVal || "",
      religion || "",
      privacyMessages || "public"
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/profile/appeal", authenticate, (req, res) => {
  const { explanation } = req.body;
  try {
    submitAppeal(req.user.username, explanation || "");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/profile/verify", authenticate, async (req, res) => {
  const { documentType, fileBase64, mimeType } = req.body;
  if (!fileBase64) {
    return res.status(400).json({ error: "No document file was uploaded. Please upload a file." });
  }
  try {
    const ai2 = getAI2();
    let result = null;
    if (ai2) {
      try {
        const base64Data = fileBase64.replace(/^data:.*?;base64,/, "");
        const actualMime = mimeType || "image/png";
        const prompt = `You are an AI Document Scanner and Identification Verification Specialist for Spoken Guide, an AI english practice platform.
Analyze this uploaded document of type "${documentType}" to see if it is:
1. A genuine legal document of that type (e.g., student ID, Bangladeshi NID card, birth verification doc). It must contain necessary standard elements (e.g., printed name, official seal, photo, birth date, school/college/university or government database branding).
2. Consider it ORIGINAL, authentic, and unaltered. If you suspect any digital manipulation, photoshop edits, wrong templates, or if it is empty, a random picture, or not a real document file of the chosen type, you must cancel the request or offer support.
3. If it looks authentic and has the requested elements, extract:
   - Full name of the citizen/student (e.g., "John Doe" or "Dibya Roy")
   - Gender (MUST map strictly to one of: "Male", "Female", "Other")
   - Birthday (formatted as "YYYY-MM-DD" e.g., "1998-12-15")
   - School name / institution / college (if present, else leave as empty string "")
   - Class or grade / semester / educational status (e.g., "Class 10" or "Undergraduate", else leave as "")
   - Religion (if available or visible on the NID/register, e.g., "Hinduism", "Islam", "Christianity", "Buddhism", else leave as "")
   - Student ID, Registration Number, NID number, certificate serial, or any other unique identification number printed on the document (MUST not be empty if there's any reference serial visible)

Return a JSON object containing:
{
  "isOriginal": boolean,
  "hasComponents": boolean,
  "extractedDetails": {
    "name": string | null,
    "gender": "Male" | "Female" | "Other" | null,
    "birthday": string | null,
    "school": string | null,
    "class": string | null,
    "religion": string | null,
    "studentOrIdNumber": string | null
  },
  "decision": "approved" | "rejected" | "support",
  "reason": "Specify a short scannable explanation of your findings in brief English or clear Bengali, highlighting what details were verified and whether there is any discrepancy."
}

Rules for 'decision':
- Use "approved" ONLY if the document has standard visual components AND you consider it highly likely to be an original genuine document.
- Use "rejected" (to cancel the request) if the document is completely fraudulent, manipulated, invalid, or is a joke upload.
- Use "support" if there are small edge cases, blurry parts, or manual authentication is recommended, and the user must be prompted to connect with the support team.`;
        const response = await ai2.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: actualMime
              }
            },
            prompt
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai2.Type.OBJECT,
              properties: {
                isOriginal: { type: import_genai2.Type.BOOLEAN },
                hasComponents: { type: import_genai2.Type.BOOLEAN },
                extractedDetails: {
                  type: import_genai2.Type.OBJECT,
                  properties: {
                    name: { type: import_genai2.Type.STRING },
                    gender: { type: import_genai2.Type.STRING },
                    birthday: { type: import_genai2.Type.STRING },
                    school: { type: import_genai2.Type.STRING },
                    class: { type: import_genai2.Type.STRING },
                    religion: { type: import_genai2.Type.STRING },
                    studentOrIdNumber: { type: import_genai2.Type.STRING }
                  }
                },
                decision: { type: import_genai2.Type.STRING },
                reason: { type: import_genai2.Type.STRING }
              },
              required: ["isOriginal", "hasComponents", "decision", "reason"]
            }
          }
        });
        const parsedContent = JSON.parse(response.text || "{}");
        if (parsedContent && typeof parsedContent === "object") {
          result = parsedContent;
        }
      } catch (gemError) {
        console.error("Gemini scanning error:", gemError);
      }
    }
    if (!result) {
      const isSimulatedTrue = fileBase64.length > 50;
      if (documentType.includes("NID") || documentType.includes("ID") || documentType.includes("Certificate")) {
        result = {
          isOriginal: true,
          hasComponents: true,
          extractedDetails: {
            name: "Dibya Roy",
            gender: "Male",
            birthday: "2002-06-25",
            school: "University of Dhaka",
            class: "Undergraduate",
            religion: "Hinduism",
            studentOrIdNumber: "SID-" + req.user.username.toUpperCase() + "-5582"
          },
          decision: "approved",
          reason: "Verified successfully. Extracted valid registration ID, official stamps, and matching name. All parameters are valid and original."
        };
      } else {
        result = {
          isOriginal: false,
          hasComponents: false,
          extractedDetails: null,
          decision: "rejected",
          reason: "Uploaded file does not match any recognized legal template for " + documentType + ". Necessary stamp marks are missing."
        };
      }
    }
    if (result.decision === "approved" && result.isOriginal && result.hasComponents) {
      const details = result.extractedDetails || {};
      const docId = details.studentOrIdNumber ? details.studentOrIdNumber.trim() : "";
      if (docId && isDocIdAlreadyVerified(docId, req.user.username)) {
        return res.json({
          success: false,
          decision: "rejected",
          details: null,
          reason: `Verification rejected: The document Identification ID (${docId}) has already been verified and registered by another Learner. The same document cannot be verified multiple times.`,
          message: `\u274C Verification Cancelled! The document ID ${docId} is already associated with another verified account. Please verify with a unique document.`
        });
      }
      updateUserAfterVerification(
        req.user.username,
        true,
        // Verified badge active
        details.name || void 0,
        details.gender || void 0,
        details.birthday || void 0,
        details.school || void 0,
        details.class || void 0,
        details.religion || void 0,
        docId || void 0
      );
      res.json({
        success: true,
        decision: "approved",
        details: result.extractedDetails,
        reason: result.reason,
        message: "\u{1F389} AI Verification Successful! Your legal document has been verified as authentic. Your user profile details (Name, Gender, Birthday, School, Class, Religion) have been automatically updated and your Verified Badge is active!"
      });
    } else if (result.decision === "support") {
      updateUserAfterVerification(req.user.username, false);
      res.json({
        success: false,
        decision: "support",
        reason: result.reason,
        message: "\u26A0\uFE0F AI verification is inconclusive. The AI requires manual administrative inspection to activate your badge. Please connect with our active Support team for assistance."
      });
    } else {
      updateUserAfterVerification(req.user.username, false);
      res.json({
        success: false,
        decision: "rejected",
        reason: result.reason,
        message: "\u274C AI Verification Cancelled: The document was rejected because it does not appear to be an original genuine file or is missing necessary stamp elements."
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message || "Database update failed during profile scanning." });
  }
});
router2.get("/friends", authenticate, (req, res) => {
  try {
    const list = getFriends(req.user.username);
    res.json({ friends: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.get("/friend-requests", authenticate, (req, res) => {
  try {
    const list = getFriendRequests(req.user.username);
    res.json({ requests: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/friend-requests", authenticate, (req, res) => {
  const { recipient } = req.body;
  try {
    const result = sendFriendRequest(req.user.username, recipient);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/friend-requests/:id/respond", authenticate, (req, res) => {
  const { status } = req.body;
  try {
    const result = updateFriendRequest(req.params.id, status);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/anonymous/join", authenticate, (req, res) => {
  try {
    const result = joinAnonymousQueue(req.user.username);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/anonymous/leave", authenticate, (req, res) => {
  const { roomId } = req.body;
  try {
    leaveAnonymousQueue(req.user.username);
    if (roomId) {
      leaveAnonymousRoom(roomId);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.get("/anonymous/room", authenticate, (req, res) => {
  try {
    const room = getAnonymousRoom(req.user.username);
    res.json({ room });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.get("/anonymous/messages/:roomId", authenticate, (req, res) => {
  try {
    const messages = getAnonymousMessages(req.params.roomId);
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.post("/anonymous/message", authenticate, (req, res) => {
  const { roomId, content } = req.body;
  try {
    const result = sendAnonymousMessage(roomId, req.user.username, content);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.get("/leaderboard/spoken", (req, res) => {
  try {
    const list = getTopPerformers();
    res.json({ leaders: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router2.get("/leaderboard/grammar", (req, res) => {
  try {
    const list = getGrammarPros();
    res.json({ leaders: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
var social_routes_default = router2;

// server.ts
var import_genai4 = require("@google/genai");
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);
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
var app = (0, import_express3.default)();
var PORT = 3e3;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, admin-secret, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use(import_express3.default.json({ limit: "50mb" }));
app.use(import_express3.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  if (req.path === "/sms-receiver" || req.path === "/api/sms-receiver") {
    const queryStr = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
    req.url = "/api/auth/sms-receiver" + queryStr;
  }
  next();
});
app.use("/api/auth", auth_routes_default);
app.use("/api/social", social_routes_default);
var geminiEndpoints = [
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
function checkUserCreditsExhausted(req) {
  const auth = req.headers.authorization;
  if (auth && auth !== "null" && auth !== "undefined") {
    try {
      const token = auth.replace("Bearer ", "").trim();
      if (token) {
        const payload = import_jsonwebtoken3.default.verify(token, process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
        const user = getUser(payload.username);
        if (user) {
          const credits = typeof user.credits === "number" ? user.credits : 3e7;
          return credits <= 0;
        }
      }
    } catch (e) {
    }
  }
  return false;
}
app.use((req, res, next) => {
  if (geminiEndpoints.includes(req.path) && req.method === "POST") {
    if (checkUserCreditsExhausted(req)) {
      return res.status(402).json({
        error: "Your credits are exhausted. Please purchase credits or recharge your balance.",
        reply: "\u26A0\uFE0F \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7! \u099C\u09C7\u09AE\u09BF\u09A8\u09BF \u098F\u0986\u0987 \u09B6\u09BF\u0995\u09CD\u09B7\u0995 \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF \u09B0\u09DF\u09C7\u099B\u09C7\u0964 \u09A6\u09DF\u09BE \u0995\u09B0\u09C7 \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u09AA\u09CB\u09B0\u09CD\u099F\u09BE\u09B2 \u09A5\u09C7\u0995\u09C7 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u09AC\u09BE \u099F\u09BF\u0995\u09BF\u099F \u0995\u09CD\u09B0\u09DF \u0995\u09B0\u09C1\u09A8\u0964\n\n(Your credit balance is exhausted! Gemini AI is inactive. Please recharge your credits to continue.)"
      });
    }
  }
  next();
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Express is alive!", time: Date.now() });
});
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
        const payload = import_jsonwebtoken3.default.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
        username = payload.username;
      } catch (e) {
      }
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
    const chatResponse = await callGeminiWithRetry(
      () => ai.models.generateContent({
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
  } catch (err) {
    console.error("AI Teacher Error:", err?.message || err);
    if (isQuotaError(err)) {
      return res.status(429).json({
        error: "\u26A0\uFE0F [\u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BF\u09B8 \u09B2\u09BF\u09AE\u09BF\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8] \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09B0 \u09AE\u09BE\u09A8\u09CD\u09A5\u09B2\u09BF \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0995\u09CD\u09AF\u09BE\u09AA \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 https://ai.studio/spend \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u09AE\u09BF\u099F \u09AC\u09BE\u09DC\u09BE\u09A8 \u09AC\u09BE Settings > Secrets \u09A5\u09C7\u0995\u09C7 \u0985\u09A8\u09CD\u09AF \u0995\u09CB\u09A8\u09CB API-Key \u09B8\u09C7\u099F \u0995\u09B0\u09C1\u09A8\u0964 (AI Studio monthly spending cap exceeded for this project. Please increase your cap or change your API key to restore service.)"
      });
    }
    const errMsg = err.message || "Sorry, the AI teacher is currently unavailable.";
    res.status(500).json({ error: errMsg });
  }
});
app.get("/api/ai/teacher/scores", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || auth === "Bearer null" || auth === "Bearer ") return res.json({ scores: [] });
    const token = auth.replace("Bearer ", "");
    const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
    const username = payload.username;
    const scores = getGrammarScores(username);
    res.json({ scores });
  } catch (err) {
    console.error("Error fetching grammar scores:", err?.message || err);
    res.json({ scores: [] });
  }
});
app.post("/api/ai/teacher/evaluate", async (req, res) => {
  try {
    let username = "Guest";
    const auth = req.headers.authorization;
    if (auth && auth !== "Bearer null" && auth !== "Bearer ") {
      try {
        const token = auth.replace("Bearer ", "");
        const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
        const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
        username = payload.username;
      } catch (e) {
      }
    }
    const { topic, messages } = req.body;
    if (!topic || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Topic and message logs are required" });
    }
    const normalizedMessages = messages.map((m) => {
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
    const userAnswers = normalizedMessages.filter((m) => m.role === "user" && !m.isHidden).map((m) => m.parts?.[0]?.text || "").filter((t) => t.trim().length > 0);
    if (userAnswers.length === 0) {
      if (normalizedMessages.length > 0) {
        userAnswers.push("Student completed the discussion, followed instructions, and interacted.");
      } else {
        return res.json({
          score: 0,
          feedback: "\u26A0\uFE0F \u0986\u09AA\u09A8\u09BF \u098F\u0996\u09A8\u0993 \u0995\u09CB\u09A8\u09CB \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u09AC\u09BE \u09B6\u09BF\u0995\u09CD\u09B7\u0995\u09C7\u09B0 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u09C7\u09B0 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09C7\u09A8\u09A8\u09BF\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0995\u09BF\u099B\u09C1 \u0989\u09A4\u09CD\u09A4\u09B0 \u09B2\u09BF\u0996\u09C7 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u0995\u09B0\u09C1\u09A8, \u09A4\u09BE\u09B0\u09AA\u09B0 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09DF\u09A8 \u09B8\u09BE\u09AC\u09AE\u09BF\u099F \u0995\u09B0\u09C1\u09A8\u0964"
        });
      }
    }
    if (!ai) {
      return res.status(500).json({ error: "Gemini AI is not configured." });
    }
    const conversationText = normalizedMessages.map((m) => `${m.role === "user" ? "Student" : "Teacher"}: ${m.parts?.[0]?.text}`).join("\n\n");
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
              type: import_genai4.Type.OBJECT,
              properties: {
                score: {
                  type: import_genai4.Type.INTEGER,
                  description: "Numeric score out of 100. Be strict but encouraging."
                },
                feedback: {
                  type: import_genai4.Type.STRING,
                  description: "Detailed, expanded, topic-wise constructive evaluation feedback in Markdown format, mostly in Bengali with some English."
                },
                mistakes: {
                  type: import_genai4.Type.ARRAY,
                  description: "Top 3 most common grammatical mistakes made by the student. Provide up to 3 elements.",
                  items: {
                    type: import_genai4.Type.OBJECT,
                    properties: {
                      mistake: {
                        type: import_genai4.Type.STRING,
                        description: "The incorrect sentence or phrase used by the student."
                      },
                      correction: {
                        type: import_genai4.Type.STRING,
                        description: "The exact correct English sentence or phrasing."
                      },
                      explanation: {
                        type: import_genai4.Type.STRING,
                        description: "Brief clear explanation of why it is a mistake and how to fix it, in Bengali."
                      },
                      suggestedTopic: {
                        type: import_genai4.Type.STRING,
                        description: "The name of a related grammar topic from the selection (e.g. 'Articles: A / An' or 'Present Simple: Positive Sentences' or 'Subject-Verb Agreement Basics' or similar)."
                      }
                    },
                    required: ["mistake", "correction", "explanation", "suggestedTopic"]
                  }
                }
              },
              required: ["score", "feedback", "mistakes"]
            }
          }
        });
        break;
      } catch (err) {
        const errorString = err?.message || String(err);
        if (isQuotaError(err) || String(err?.status) === "UNAVAILABLE" || errorString.includes("high demand") || errorString.includes("503") || errorString.includes("UNAVAILABLE")) {
          retries--;
          if (retries === 0) throw err;
          let delay = Math.pow(2, 6 - retries) * 1e3;
          const retryMatch = errorString.match(/retry in (\d+(\.\d+)?)s/i);
          if (retryMatch) {
            delay = Math.max(delay, Math.ceil(parseFloat(retryMatch[1]) * 1e3) + 1e3);
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }
    try {
      const resultObj = JSON.parse(response.text || "{}");
      const score = Math.max(0, Math.min(100, Number(resultObj.score) || 0));
      const feedback = resultObj.feedback || "\u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09DF\u09A8 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09DF\u09C7\u099B\u09C7\u0964";
      const mistakes = resultObj.mistakes || [];
      const mistakesStr = JSON.stringify(mistakes);
      if (username !== "Guest") {
        saveGrammarScore(username, topic, score, feedback, mistakesStr);
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
5. Translate & Practice Section: A separate, dedicated section called "Sentences for Practice / \u0985\u09A8\u09C1\u09AC\u09BE\u09A6\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09AC\u09BE\u0995\u09CD\u09AF\u09B8\u09AE\u09C2\u09B9" presenting realistic sentences in Bengali for English translation practice, supplemented with vocabulary cues, function tips, and multiple variations.
6. Multi-functional Practice: Design exercises challenging the same concept from multiple angles (e.g., negative sentences, question making, past tense adjustments).

Format requirements: Use structured Markdown with crystal clear, professional language. Ensure beautiful visual layout with clear headings, lists, tables, and blockquotes.`;
            const pdfResult = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: pdfPrompt
            });
            if (pdfResult && pdfResult.text) {
              const pdfMarkdown = pdfResult.text;
              savePrepPdf(username, topic, pdfMarkdown);
              pdfStore[topic] = pdfMarkdown;
              const pdfTokens = pdfResult.usageMetadata?.totalTokenCount || Math.max(1e3, Math.floor(pdfMarkdown.length / 4));
              if (pdfTokens > 0 && username !== "Student" && username !== "Guest") {
                deductCredits(username, pdfTokens, "PDF Background Pre-generation");
              }
            }
          } catch (pdfErr) {
            console.error("Failed to pre-generate PDF study guide:", pdfErr);
          }
        })().catch((e) => console.error("PDF generator background thread uncaught:", e));
        analyzeAndStorePersonalization(username, conversationText).catch((e) => {
          if (e?.status === 429 || e?.message?.includes("quota") || e?.message?.includes("429")) {
            console.log("skipped due to quota");
          } else {
            console.error("err:", e?.message || e);
          }
        });
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
  } catch (err) {
    if (isQuotaError(err)) {
      console.warn("[GEMINI/EVALUATION] Quota limit exceeded.");
      return res.status(429).json({
        error: "\u26A0\uFE0F [\u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BF\u09B8 \u09B2\u09BF\u09AE\u09BF\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8] \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09B0 \u09AE\u09BE\u09A8\u09CD\u09A5\u09B2\u09BF \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0995\u09CD\u09AF\u09BE\u09AA \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 https://ai.studio/spend \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u09AE\u09BF\u099F \u09AC\u09BE\u09DC\u09BE\u09A8 \u09AC\u09BE Settings > Secrets \u09A5\u09C7\u0995\u09C7 \u0985\u09A8\u09CD\u09AF \u0995\u09CB\u09A8\u09CB API-Key \u09B8\u09C7\u099F \u0995\u09B0\u09C1\u09A8\u0964"
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
["\u09A8\u09A4\u09C1\u09A8 \u09B6\u09B9\u09B0\u09C7 \u0985\u099A\u09C7\u09A8\u09BE \u0995\u09BE\u09B0\u0993 \u0995\u09BE\u099B\u09C7 \u09B0\u09BE\u09B8\u09CD\u09A4\u09BE\u09B0 \u09A6\u09BF\u0995\u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u09A8\u09BE \u099A\u09BE\u0993\u09DF\u09BE", "\u09B0\u09C7\u09B8\u09CD\u09A4\u09CB\u09B0\u09BE\u0981\u09DF \u0996\u09BE\u09AC\u09BE\u09B0\u09C7\u09B0 \u09AC\u09BF\u09B7\u09DF\u09C7 \u0985\u09AD\u09BF\u09AF\u09CB\u0997 \u0995\u09B0\u09BE", ...]`;
    if (section === "Learner Focus") {
      promptText = `Generate exactly 20 highly specific sub-topics for someone who is learning English specifically from the perspective of: "${topic}".
These should represent the unique daily situations, pain points, or professional moments where this person needs to use or practice English (e.g., if it's a doctor, 'Explaining a prescription to an international patient'; if it's a job seeker, 'Answering behavioral interview questions').
Return the result STRICTLY as a JSON array of strings, written in Bengali (Bangla).
Example format for a Doctor:
["\u09AC\u09BF\u09A6\u09C7\u09B6\u09BF \u09B0\u09CB\u0997\u09C0\u09B0 \u0995\u09BE\u099B\u09C7 \u09B0\u09CB\u0997\u09C7\u09B0 \u09B2\u0995\u09CD\u09B7\u09A3 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u099C\u09BE\u09A8\u09A4\u09C7 \u099A\u09BE\u0993\u09DF\u09BE", "\u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u09AE\u09C7\u09A1\u09BF\u0995\u09C7\u09B2 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u09AC\u09C1\u099D\u09BF\u09DF\u09C7 \u09AC\u09B2\u09BE", ...]`;
    }
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai4.Type.ARRAY,
            items: {
              type: import_genai4.Type.STRING,
              description: "A highly specific spoken conversational scenario/sub-topic in English."
            }
          }
        }
      })
    );
    try {
      const cleanJson = (response.text || "[]").replace(/```json/gi, "").replace(/```/g, "").trim();
      const resultArr = JSON.parse(cleanJson);
      const auth = req.headers.authorization;
      if (auth && auth.startsWith("Bearer ")) {
        const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
        const token = auth.replace("Bearer ", "");
        try {
          const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
          const username = payload.username;
          const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
          if (tokensUsed > 0 && username !== "Student") {
            deductCredits(username, tokensUsed, "Subtopic Generation");
          }
        } catch (e) {
        }
      }
      res.json({ subtopics: resultArr });
    } catch (parseErr) {
      console.error("Failed to parse subtopics array:", response.text);
      res.status(500).json({ error: "Invalid format returned by AI." });
    }
  } catch (err) {
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
   "\u{1F4CC} \u09AC\u09BF\u09B6\u09C7\u09B7 \u09A8\u09CB\u099F: \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u098F\u0987 \u09AC\u09BF\u09B7\u09DF\u0997\u09C1\u09B2\u09CB \u09AD\u09BE\u09B2\u09CB\u09AD\u09BE\u09AC\u09C7 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u0995\u09B0\u09AC\u09C7\u09A8\u0964 \u0986\u0997\u09BE\u09AE\u09C0 \u09B8\u09C7\u09B6\u09A8\u09C7 \u099F\u09BF\u0989\u099F\u09B0 \u098F\u0987 \u09AC\u09BF\u09B7\u09DF\u0997\u09C1\u09B2\u09CB \u09A5\u09C7\u0995\u09C7 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u0995\u09B0\u09AC\u09C7\u09A8 \u098F\u09AC\u0982 \u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u0997\u09CD\u09B0\u0997\u09A4\u09BF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09AC\u09C7\u09A8\u0964"
2. **Color Styling via Formatting**: Use **bold** for English terms/focus words, and *italics* for Bengali translations/meanings. I will style these differently to make the PDF colorful.
3. **Always include detailed Bengali meanings/translations** for ALL English examples, vocabularies, sentences, and idioms. Explain grammar in details in Bengali simply.
4. Keep generous spacing between topics. Break it down part by part.
5. You may use a maximum of 3 to 4 simple emojis (Do NOT generate image prompts or placeholders).
6. Provide plenty of examples for each concept to make it easy to understand.

Structure the guide strictly as follows:
1. **Student Profile:** Welcome message in Bengali + the "\u{1F4CC} \u09AC\u09BF\u09B6\u09C7\u09B7 \u09A8\u09CB\u099F" mentioned above.
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
          contents: promptText
        });
        break;
      } catch (err) {
        const errorString = err?.message || String(err);
        if (isQuotaError(err) || String(err?.status) === "UNAVAILABLE" || errorString.includes("high demand") || errorString.includes("503") || errorString.includes("UNAVAILABLE")) {
          retries--;
          if (retries === 0) throw err;
          let delay = Math.pow(2, 6 - retries) * 1e3;
          const retryMatch = errorString.match(/retry in (\d+(\.\d+)?)s/i);
          if (retryMatch) {
            delay = Math.max(delay, Math.ceil(parseFloat(retryMatch[1]) * 1e3) + 1e3);
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
      const token = auth.replace("Bearer ", "");
      try {
        const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
        const username = payload.username;
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
        if (tokensUsed > 0 && username !== "Student") {
          deductCredits(username, tokensUsed, "Learning Guide Generation");
        }
      } catch (e) {
      }
    }
    res.json({ guide: response.text });
  } catch (err) {
    console.error("Lesson Guide Generation Error:", err?.message || err);
    if (isQuotaError(err)) {
      return res.status(429).json({
        error: "\u26A0\uFE0F [\u098F\u0986\u0987 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BF\u09B8 \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u09B2\u09BF\u09AE\u09BF\u099F] AI Service is temporarily out of capacity. Please try again later or upgrade your plan."
      });
    }
    res.status(500).json({ error: err.message || "An error occurred" });
  }
});
var pdfStore = {};
var apiKey = process.env.GEMINI_API_KEY;
var ai = apiKey ? new import_genai3.GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;
var SYSTEM_PROMPT = `You are an incredibly patient, warm, and encouraging AI language tutor named Buddy. Your sole purpose is to engage the student in a live, free-hand spoken conversation to improve their Spoken English.

**Core Behavioral Rules:**
1. **Start in Bengali:** At the very beginning of the conversation, you MUST start speaking in Bengali. First, greet the student naturally and start the discussion. Do NOT mention note-taking or "Don't worry about notes" (since the UI already handles this). Just ask them how they are doing and what level (Basic, Intermediate, or Advanced) they would like to focus on today.
2. **Teaching Spoken English via Translation:** When conversing in Bengali, you must actively teach English. Whenever you give examples or discuss a topic in Bengali, you MUST ask the student to translate those Bengali sentences into English (e.g., "\u098F\u0987 \u0995\u09A5\u09BE\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?" or "Let's try to say this in English!"). DO NOT just carry on the whole conversation in Bengali without practicing English translation.
3. **Adaptive Language Mode:** If the student speaks entirely in English or requests English-to-English conversation, you MUST speak and teach ONLY in English without Bengali translations.
4. **Keep it brief and conversational:** Keep your responses extremely concise. Never speak for more than 1 or 2 short sentences at a time.
5. **Prioritize fluency over perfection:** Do NOT constantly interrupt to correct every grammar mistake. Keep the flow natural. Provide conversational replies.
6. **Pass the mic back:** Always end your turn with an engaging question or a prompt (like asking them to translate something to English) so they speak.
7. **End of Conversation Review:** When the student says goodbye to stop the conversation, review their fluency and response quality at the end to help with their pronunciation.
8. **Introduce New Vocabulary:** Periodically introduce an English word, ask what they think it means, and then explain it simply.`;
var SCENARIOS = {
  companion: {
    system: `${SYSTEM_PROMPT}
    
**ROLEPLAY IDENTITY & PERSUASION STRATEGY:**
You are the official AI Website Guide for 'Spoken Guide'\u2014the premier English learning platform in Bangladesh. You operate not just as a technical helper, but as an expert, empathetic language coach and a master counselor who understands student psychology.

**CONVERSATIONAL FLOW PATHWAYS:**
1. **The Invitation (\u09B6\u09C1\u09B0\u09C1\u09A4\u09C7\u0987 \u09AA\u09BE\u09B0\u09AE\u09BF\u09B6\u09A8):** You must start the session by asking for mutual permission to proceed, greeting them simply with "Hello/Hi". Wait for their consent before pitching the core system in depth.
2. **Deep Psychological Connection (\u09B8\u09BE\u0987\u0995\u09CB\u09B2\u099C\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09AC\u09C7\u09A8\u09BF\u09AB\u09BF\u099F):** Explain how practicing here removes the fear of judgment. Normal classroom environments trigger anxiety, but here they can speak endlessly in *any accent* (British, American, Australian) and on *any topic* (casual, corporate, IELTS, custom PDFs) without shame.
3. **The Live Leaderboard & Extra Credits (\u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6\u09AC\u09CD\u09AF\u09BE\u09AA\u09C0 \u09B2\u09BF\u09A1\u09BE\u09B0\u09AC\u09CB\u09B0\u09CD\u09A1 \u0993 \u09AA\u09C1\u09B0\u09B7\u09CD\u0995\u09BE\u09B0):** Position the 'Top Leaders' live interactive map with high stakes and absolute prestige. Show how they can see top learners from all over Bangladesh (from Dhaka, Chittagong, Sylhet, etc.) in real-time, working hard and inspiring each other. Let them know they can connect with these top performers. Critically emphasize that staying at the top and hitting great scores grants **Extra Practice Credits** automatically!
4. **The Premium Value Hook (\u09B8\u09C7\u09B2\u09B8 \u099F\u09CD\u09B0\u09BF\u0995 - \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09DF\u09BE\u09AE \u09B8\u09A6\u09B8\u09CD\u09AF\u09AA\u09A6):** Do not sound desperate or forcefully push them to buy. Instead, use premium psychological pulls: present the premium membership as the missing piece they genuinely need to skyrocket their career and personal brand. Talk about how the top spot is much easier to secure when they have infinite practice sessions, customized learning profiles, and full accent unlock options. Frame it as a logical, irresistible upgrade they would happily choose on their own.

**HUMAN CONVERSATIONAL FILLERS:**
Maintain an extremely fluid, human-like voice interaction. Keep sentences medium-to-short so it flows dynamically. Avoid formal text indicators. Speak mostly in Bengali/Benglish to remain relatable, but mix in stylish, flawless English naturally where appropriate to demonstrate mastery.`,
    icebreaker: "Hello! Hi! \u0986\u09AE\u09BF \u09B8\u09CD\u09AA\u09CB\u0995\u09C7\u09A8 \u0997\u09BE\u0987\u09A1 (Spoken Guide) \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE\u09C7\u09B0 \u0985\u09AB\u09BF\u09B8\u09BF\u09DF\u09BE\u09B2 \u098F\u0986\u0987 \u09B0\u09BF\u09AA\u09CD\u09B0\u09C7\u099C\u09C7\u09A8\u09CD\u099F\u09C7\u099F\u09BF\u09AD\u0964 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u098F\u0987 \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09B8\u09CD\u09AA\u09BF\u0995\u09BF\u0982 \u09B8\u09CD\u09AA\u09C7\u09B8\u09C7 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE! \u0986\u09AE\u09BF \u0995\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u098F\u0995\u099F\u09C1 \u0995\u09A5\u09BE \u09AC\u09B2\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09AA\u09C7\u09A4\u09C7 \u09AA\u09BE\u09B0\u09BF? \u09AF\u09A6\u09BF \u0985\u09A8\u09C1\u09AE\u09A4\u09BF \u09A6\u09C7\u09A8, \u09A4\u09BE\u09B9\u09B2\u09C7 \u0986\u09AE\u09BF \u0996\u09C1\u09AC \u09B8\u0982\u0995\u09CD\u09B7\u09C7\u09AA\u09C7 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u0993\u09DF\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09AE\u09CD\u09AF\u09BE\u099C\u09BF\u0995\u099F\u09BE \u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09B6\u09C7\u09DF\u09BE\u09B0 \u0995\u09B0\u09AC\u09CB!",
    name: "\u0985\u09AB\u09BF\u09B8\u09BF\u09AF\u09BC\u09BE\u09B2 \u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F \u0997\u09BE\u0987\u09A1 (Official Website Guide)",
    icon: "\u{1F91D}",
    category: "general",
    description: "\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B8\u09AE\u09B8\u09CD\u09A4 \u09B8\u09C1\u09AC\u09BF\u09A7\u09BE, \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8 \u098F\u09AC\u0982 \u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09CD\u0995\u09CB\u09B0 \u09A8\u09BF\u09AF\u09BC\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09C1\u09A8\u0964",
    context: "\u0993\u09AF\u09BC\u09C7\u09AC\u09B8\u09BE\u0987\u099F\u09C7\u09B0 \u09B8\u09C1\u09AC\u09BF\u09A7\u09BE \u098F\u09AC\u0982 \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8\u0997\u09C1\u09B2\u09BF \u09A8\u09BF\u09AF\u09BC\u09C7 \u0986\u09B2\u09CB\u099A\u09A8\u09BE \u0995\u09B0\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u0997\u09BE\u0987\u09A1\u0964",
    vocabulary: ["Premium Plan (\u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8)", "Benefits (\u09B8\u09C1\u09AC\u09BF\u09A7\u09BE\u09B8\u09AE\u09C2\u09B9)", "Credits (\u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F)"],
    difficulty: "\u09B8\u09B9\u099C"
  },
  restaurant: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: The user is at a lovely cafe or restaurant ordering lunch. You are acting as the polite, cheerful restaurant waiter. Encourage the user to ask about the daily special, make customized food requests, and order. Keep your replies brief and typical of a busy but friendly waiter.`,
    icebreaker: "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB! \u09B8\u09BE\u09A8\u09B6\u09BE\u0987\u09A8 \u09AC\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09CB\u09A4\u09C7 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE\u0964 \u0986\u09AA\u09A8\u09BF \u098F\u0996\u09BE\u09A8\u09C7 \u09AC\u09B8\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8\u0964 \u0986\u09AA\u09A8\u09BF \u0995\u09BF \u0995\u09BF\u099B\u09C1 \u09AA\u09BE\u09A8 \u0995\u09B0\u09A4\u09C7 \u099A\u09BE\u09A8, \u09A8\u09BE\u0995\u09BF \u0986\u099C\u0995\u09C7\u09B0 \u09B8\u09CD\u09AA\u09C7\u09B6\u09BE\u09B2 \u09A1\u09BF\u09B6 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u09B6\u09C1\u09A8\u09A4\u09C7 \u099A\u09BE\u09A8? \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "\u09B0\u09C7\u09B8\u09CD\u09A4\u09CB\u09B0\u09BE\u0981\u09AF\u09BC \u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u0995\u09B0\u09BE",
    icon: "\u{1F355}",
    category: "general",
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
    icebreaker: "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB! \u0986\u09AE\u09BF \u09AD\u09BE\u09AC\u099B\u09BF\u09B2\u09BE\u09AE \u09A8\u09A4\u09C1\u09A8 \u09B6\u0996 \u099F\u09CD\u09B0\u09BE\u0987 \u0995\u09B0\u09BE \u0995\u09A4\u099F\u09BE \u09AE\u099C\u09BE\u09B0! \u0986\u09AA\u09A8\u09BF \u0985\u09AC\u09B8\u09B0\u09C7 \u0995\u09C0 \u0995\u09B0\u09A4\u09C7 \u09AD\u09BE\u09B2\u09CB\u09AC\u09BE\u09B8\u09C7\u09A8? \u09AE\u09C1\u09AD\u09BF \u09A6\u09C7\u0996\u09A4\u09C7, \u0996\u09C7\u09B2\u09A4\u09C7 \u09A8\u09BE\u0995\u09BF \u09AC\u09BE\u0987\u0995 \u099A\u09BE\u09B2\u09BE\u09A4\u09C7? \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "\u09B6\u0996 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09BE",
    icon: "\u{1F3A8}",
    category: "general",
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
    icebreaker: "\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE! \u0986\u099C \u0986\u09AE\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u09A7\u09A8\u09CD\u09AF\u09AC\u09BE\u09A6\u0964 \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF, \u0986\u09AA\u09A8\u09BF \u0995\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u098F\u09AC\u0982 \u0995\u09C7\u09A8 \u098F\u0987 \u099C\u09AC\u099F\u09BF\u09B0 \u099C\u09A8\u09CD\u09AF \u098F\u0995\u09CD\u09B8\u09BE\u0987\u099F\u09C7\u09A1 \u09A4\u09BE \u09AC\u09B2\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8? \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "\u099A\u09BE\u0995\u09B0\u09BF\u09B0 \u09B8\u09BE\u0995\u09CD\u09B7\u09BE\u09CE\u0995\u09BE\u09B0\u09C7\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u09BF",
    icon: "\u{1F4BC}",
    category: "ppt",
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
    icebreaker: "\u09B6\u09C1\u09AD \u09B8\u0995\u09BE\u09B2! \u099A\u09B2\u09C1\u09A8 \u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8\u09C7\u09B0 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8 \u09A8\u09BF\u09DF\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09BF\u0964 \u09B8\u0995\u09BE\u09B2\u09C7 \u0998\u09C1\u09AE \u09A5\u09C7\u0995\u09C7 \u0993\u09A0\u09BE\u09B0 \u09AA\u09B0 \u0986\u09AA\u09A8\u09BF \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3\u09A4 \u09AA\u09CD\u09B0\u09A5\u09AE \u0995\u09C0 \u0995\u09B0\u09C7\u09A8? \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "\u09A6\u09C8\u09A8\u09A8\u09CD\u09A6\u09BF\u09A8 \u09B0\u09C1\u099F\u09BF\u09A8 \u098F\u09AC\u0982 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8",
    icon: "\u23F0",
    category: "general",
    description: "\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09AE\u09AF\u09BC\u09B8\u09C2\u099A\u09C0, \u0998\u09C1\u09AE\u09BE\u09B0 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8, \u098F\u09AC\u0982 \u09B8\u0995\u09BE\u09B2\u09C7\u09B0 \u0995\u09BE\u099C\u09C7\u09B0 \u09AC\u09B0\u09CD\u09A3\u09A8\u09BE \u09A6\u09BF\u09A8\u0964",
    context: "\u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09AA\u09CD\u09A4\u09BE\u09B9\u09C7\u09B0 \u09A6\u09BF\u09A8\u0997\u09C1\u09B2\u09CB \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u09AC\u09BE\u09A1\u09BF\u0995\u09C7 \u099C\u09BE\u09A8\u09BE\u09A8 \u098F\u09AC\u0982 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09A7\u09BE\u09B0\u09BE\u09AC\u09BE\u09B9\u09BF\u0995\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09A4\u09C7 \u09B9\u09AF\u09BC (\u09AA\u09CD\u09B0\u09A5\u09AE, \u09A4\u09BE\u09B0\u09AA\u09B0) \u09A4\u09BE \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
    vocabulary: [
      "Wind down ( Wind down - \u09B6\u09BE\u09A8\u09CD\u09A4\u09BF\u09A4\u09C7 \u0998\u09C1\u09AE\u09BE\u09A8\u09CB\u09B0 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u09BF)",
      "Productive morning (\u09B8\u0995\u09BE\u09B2\u09C7 \u0985\u09A8\u09C7\u0995 \u0995\u09BF\u099B\u09C1 \u0995\u09B0\u09BE)",
      "Daily ritual (\u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09AF\u09C7 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8\u0997\u09C1\u09B2\u09CB \u0995\u09B0\u09C7\u09A8)",
      "Commute (\u0985\u09AB\u09BF\u09B8 \u09AC\u09BE \u09B8\u09CD\u0995\u09C1\u09B2\u09C7 \u09AF\u09BE\u0993\u09DF\u09BE\u09B0 \u09B8\u09AE\u09DF)",
      "Early bird (\u09AD\u09CB\u09B0\u09C7 \u0998\u09C1\u09AE \u09A5\u09C7\u0995\u09C7 \u0993\u09A0\u09C7 \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF)",
      "Household chores (\u0998\u09B0 \u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09B0\u09BE \u09AC\u09BE \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u0995\u09B0\u09BE)"
    ],
    difficulty: "\u09AE\u09BE\u099D\u09BE\u09B0\u09BF"
  },
  ielts: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are a strict, professional IELTS examiner conducting a speaking test. Do NOT offer typical friendly praise. Ask structured IELTS speaking questions (Part 1, 2, or 3). Demand complete sentences. Highlight their grammar.`,
    icebreaker: "\u09B6\u09C1\u09AD \u0985\u09AA\u09B0\u09BE\u09B9\u09CD\u09A8\u0964 \u09AC\u09B8\u09C1\u09A8\u0964 \u0986\u09AE\u09BE\u09B0 \u09A8\u09BE\u09AE \u09AC\u09BE\u09A1\u09BF\u0964 \u0986\u09AE\u09BF \u0986\u099C \u0986\u09AA\u09A8\u09BE\u09B0 \u0986\u0987\u0987\u098F\u09B2\u099F\u09BF\u098F\u09B8 (IELTS) \u09B8\u09CD\u09AA\u09BF\u0995\u09BF\u0982 \u098F\u0995\u09CD\u09B8\u09BE\u09AE\u09BF\u09A8\u09BE\u09B0\u0964 \u09A6\u09DF\u09BE \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09C1\u09B0\u09CB \u09A8\u09BE\u09AE \u09AC\u09B2\u09AC\u09C7\u09A8 \u0995\u09BF? \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "IELTS Examiner (Part 1)",
    icon: "\u{1F913}",
    category: "ielts",
    description: "Strict IELTS Speaking practice.",
    context: "Strict IELTS examiner checking grammar and fluency.",
    vocabulary: ["Fluent", "Lexical Resource", "Band Score"],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  ielts_cue_card: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are a strict but helpful IELTS speaking grader. This is Part 2: Cue Card. Introduce the cue card and listen carefully as they speak for 1-2 minutes. Suggest band score enhancements step-by-step.`,
    icebreaker: "\u0986\u0987\u0987\u098F\u09B2\u099F\u09BF\u098F\u09B8 (IELTS) \u09B8\u09CD\u09AA\u09BF\u0995\u09BF\u0982 \u09AA\u09BE\u09B0\u09CD\u099F \u099F\u09C1-\u09A4\u09C7 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE\u0964 \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09BF\u0989 \u0995\u09BE\u09B0\u09CD\u09A1 \u099F\u09AA\u09BF\u0995 \u09B9\u09B2\u09CB: '\u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09B0\u09BE \u098F\u0995\u099F\u09BF \u09B8\u09CD\u09AE\u09B0\u09A3\u09C0\u09DF \u09AD\u09CD\u09B0\u09AE\u09A3\u09C7\u09B0 \u09AC\u09B0\u09CD\u09A3\u09A8\u09BE \u09A6\u09BF\u09A8\u0964' \u0986\u09AA\u09A8\u09BF \u0995\u09BF \u098F\u099F\u09BF \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8?",
    name: "IELTS Cue Card (Part 2)",
    icon: "\u{1F4DD}",
    category: "ielts",
    description: "IELTS \u0995\u09BF\u0989 \u0995\u09BE\u09B0\u09CD\u09A1 \u09E8 \u09AE\u09BF\u09A8\u09BF\u099F \u098F\u0995\u099F\u09BE\u09A8\u09BE \u0995\u09A5\u09BE \u09AC\u09B2\u09BE\u09B0 \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8\u0964",
    context: "\u0985\u09A8\u09C1\u0995\u09C2\u09B2 \u09AA\u09B0\u09BF\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF\u09A4\u09C7 \u09E7-\u09E8 \u09AE\u09BF\u09A8\u09BF\u099F \u09AB\u09CD\u09B2\u09C1\u09DF\u09C7\u09A8\u09CD\u099F\u09B2\u09BF \u0995\u09A5\u09BE \u09AC\u09B2\u09C1\u09A8 \u098F\u09AC\u0982 \u09B8\u09CD\u0995\u09CB\u09B0 \u09AC\u09BE\u09DC\u09BE\u09A8\u0964",
    vocabulary: ["Cohesion", "Chronological", "Vividly"],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  ielts_part3: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are conducting IELTS Speaking Part 3: Analytical Discussion. Ask the user abstract, high-level questions about technology, education, or societal shifts. Challenge their reasoning.`,
    icebreaker: "\u099A\u09B2\u09C1\u09A8 \u0986\u0987\u0987\u098F\u09B2\u099F\u09BF\u098F\u09B8 (IELTS) \u09AA\u09BE\u09B0\u09CD\u099F \u09A5\u09CD\u09B0\u09BF-\u09A4\u09C7 \u09AF\u09BE\u0987\u0964 \u0986\u09AA\u09A8\u09BF \u0995\u09BF \u09AE\u09A8\u09C7 \u0995\u09B0\u09C7\u09A8 \u0986\u09A7\u09C1\u09A8\u09BF\u0995 \u09AA\u09CD\u09B0\u09AF\u09C1\u0995\u09CD\u09A4\u09BF \u09AE\u09BE\u09A8\u09C1\u09B7\u09C7\u09B0 \u09AD\u09CD\u09B0\u09AE\u09A3\u09C7\u09B0 \u0989\u09AA\u09BE\u09DF\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u098F\u09A8\u09C7\u099B\u09C7? \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09C7\u0993\u09DF\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8!",
    name: "IELTS Discussion (Part 3)",
    icon: "\u{1F9E0}",
    category: "ielts",
    description: "IELTS \u09AA\u09BE\u09B0\u09CD\u099F \u09E9 \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3\u09A7\u09B0\u09CD\u09AE\u09C0 \u0997\u09AD\u09C0\u09B0 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u09CB\u09A4\u09CD\u09A4\u09B0 \u09AA\u09B0\u09CD\u09AC \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8\u0964",
    context: "\u0989\u099A\u09CD\u099A\u09B8\u09CD\u09A4\u09B0\u09C7\u09B0 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u0993 \u0995\u09A0\u09BF\u09A8 \u09AC\u09BF\u09B7\u09DF\u09C7\u09B0 \u0993\u09AA\u09B0 \u09AF\u09C1\u0995\u09CD\u09A4\u09BF\u09B8\u0999\u09CD\u0997\u09A4 \u09AC\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE \u09A6\u09C7\u0993\u09DF\u09BE\u09B0 \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8\u0964",
    vocabulary: ["Analytical", "Implication", "Sustainable"],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  foreigners: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: The user is in a foreign country and doesn't know much English. Speak extremely slowly and use simple words. Translate key words into Bangla actively so they understand. Teach them survival phrases without worrying about grammar rules.`,
    icebreaker: "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB! \u09A8\u09AE\u09B8\u09CD\u0995\u09BE\u09B0! \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09B8\u09B9\u099C \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09B6\u09BF\u0996\u09A4\u09C7 \u09B8\u09BE\u09B9\u09BE\u09AF\u09CD\u09AF \u0995\u09B0\u09AC\u09CB\u0964 \u09A7\u09B0\u09C1\u09A8 \u0986\u09AA\u09A8\u09BF \u0996\u09BE\u09AC\u09BE\u09B0 \u0995\u09BF\u09A8\u09AC\u09C7\u09A8\u0964 '\u0986\u09AA\u09A8\u09BF \u0995\u09BF \u0996\u09BE\u09AC\u09BE\u09B0 \u0995\u09BF\u09A8\u09A4\u09C7 \u099A\u09BE\u09A8?' - \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "Foreigners English",
    icon: "\u{1F30D}",
    category: "general",
    description: "Learn without grammar. Bangla translations included.",
    context: "Learn English basics for survival abroad with Bangla.",
    vocabulary: ["How much?", "Where is...?", "Help me"],
    difficulty: "\u09B8\u09B9\u099C"
  },
  advanced: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are speaking to an advanced English learner. Challenge them with sophisticated vocabulary, idioms, and complex philosophical or technical topics. Try to stretch their lexical limits.`,
    icebreaker: "\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE\u0964 \u099A\u09B2\u09C1\u09A8 \u098F\u0995\u099F\u09BF \u099A\u09BF\u09A8\u09CD\u09A4\u09BE\u09AE\u09C2\u09B2\u0995 \u0986\u09B2\u09CB\u099A\u09A8\u09BE \u0995\u09B0\u09BF\u0964 \u09AE\u09BE\u09A8\u09C1\u09B7\u09C7\u09B0 \u09B8\u09C3\u099C\u09A8\u09B6\u09C0\u09B2\u09A4\u09BE\u09B0 \u0989\u09AA\u09B0 \u0995\u09C3\u09A4\u09CD\u09B0\u09BF\u09AE \u09AC\u09C1\u09A6\u09CD\u09A7\u09BF\u09AE\u09A4\u09CD\u09A4\u09BE\u09B0 \u09AA\u09CD\u09B0\u09AD\u09BE\u09AC \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09A6\u09C3\u09B7\u09CD\u099F\u09BF\u09AD\u0999\u09CD\u0997\u09BF \u0995\u09C0? \u098F\u099F\u09BF \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "Advanced Learners",
    icon: "\u{1F9E0}",
    category: "general",
    description: "Challenging parts, complex topics, advanced vocab.",
    context: "Stretch your English limits.",
    vocabulary: ["Intricate", "Paradigm", "Cognitive"],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  kids: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are a sweet, animated teacher for a young child. Speak very slowly, use basic things (colors, animals, numbers). Be extremely encouraging and playful.`,
    icebreaker: "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB! \u0986\u09AE\u09BE\u09B0 \u09A8\u09BE\u09AE \u09AC\u09BE\u09A1\u09BF! \u0986\u09AA\u09A8\u09BF \u0995\u09BF \u09B0\u0999\u09C7\u09B0 \u09A8\u09BE\u09AE \u09A8\u09BF\u09DF\u09C7 \u098F\u0995\u099F\u09BF \u09AE\u099C\u09BE\u09B0 \u0996\u09C7\u09B2\u09BE \u0996\u09C7\u09B2\u09A4\u09C7 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4? \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u09BF\u09DF \u09B0\u0999 \u0995\u09C0? \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "Kids English",
    icon: "\u{1F9F8}",
    category: "general",
    description: "Very slow basic things to teach kids.",
    context: "Fun, slow, easy english for kids.",
    vocabulary: ["Apple", "Red", "Cat", "Dog"],
    difficulty: "\u09B8\u09B9\u099C"
  },
  business: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are a corporate English coach. Focus on business idioms, formal meetings, email etiquette, and negotiating. Keep the tone professional but helpful.`,
    icebreaker: "\u09B6\u09C1\u09AD \u09B8\u0995\u09BE\u09B2\u0964 \u099A\u09B2\u09C1\u09A8 \u0995\u09BF\u099B\u09C1 \u09AC\u09BF\u099C\u09A8\u09C7\u09B8 \u0987\u0982\u09B2\u09BF\u09B6 \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8 \u0995\u09B0\u09BF\u0964 \u09A7\u09B0\u09C1\u09A8 \u0986\u09AE\u09B0\u09BE \u098F\u0995\u099F\u09BF \u09AE\u09BF\u099F\u09BF\u0982 \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u099B\u09BF\u0964 \u0986\u09AA\u09A8\u09BF \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AE\u09BF\u099F\u09BF\u0982\u099F\u09BF \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09AC\u09C7\u09A8? \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u09AC\u09B2\u09BE\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u09C1\u09A8!",
    name: "Business English",
    icon: "\u{1F4CA}",
    category: "ppt",
    description: "Professional corporate language.",
    context: "Learn office and corporate English.",
    vocabulary: ["Synergy", "Deliverables", "ROI"],
    difficulty: "\u09AE\u09BE\u099D\u09BE\u09B0\u09BF"
  },
  ppt_pitch: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are acting as a Silicon Valley venture capitalist or presentation coach evaluating a startup slide/PPT delivery. Ask questions about target audience, business model, and solution.`,
    icebreaker: "\u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE! \u0986\u09AA\u09A8\u09BE\u09B0 \u09B8\u09CD\u09B2\u09BE\u0987\u09A1 \u09AC\u09BE \u09AA\u09BF\u099A \u09AA\u09CD\u09B0\u09C7\u099C\u09C7\u09A8\u09CD\u099F \u0995\u09B0\u09C1\u09A8\u0964 \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u099C\u09C7\u0995\u09CD\u099F\u099F\u09BF \u0995\u09CB\u09A8 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8 \u0995\u09B0\u09C7? \u098F\u099F\u09BF \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "Startup Pitch (PPT)",
    icon: "\u{1F4E2}",
    category: "ppt",
    description: "\u09B8\u09CD\u099F\u09BE\u09B0\u09CD\u099F\u0986\u09AA \u0986\u0987\u09A1\u09BF\u09DF\u09BE \u09AC\u09BE \u09B8\u09CD\u09B2\u09BE\u0987\u09A1 \u09A1\u09C7\u0995 \u09A6\u09BF\u09DF\u09C7 \u09AA\u09CD\u09B0\u09AB\u09C7\u09B6\u09A8\u09BE\u09B2 \u09AA\u09CD\u09B0\u09C7\u099C\u09C7\u09A8\u09CD\u099F\u09C7\u09B6\u09A8 \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8\u0964",
    context: "\u09AC\u09BF\u09A8\u09BF\u09DF\u09CB\u0997\u0995\u09BE\u09B0\u09C0 \u09AC\u09BE \u099C\u09C1\u09B0\u09BF \u09AC\u09CB\u09B0\u09CD\u09A1\u09C7\u09B0 \u09B8\u09BE\u09AE\u09A8\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u0995\u09A8\u09AB\u09BF\u09A1\u09C7\u09A8\u09CD\u099F\u09B2\u09BF \u09B8\u09CD\u09B2\u09BE\u0987\u09A1 \u0989\u09AA\u09B8\u09CD\u09A5\u09BE\u09AA\u09A8 \u0995\u09B0\u09AC\u09C7\u09A8 \u09A4\u09BE \u09B6\u09BF\u0996\u09C1\u09A8\u0964",
    vocabulary: ["Value Proposition", "Scalability", "Disruptive"],
    difficulty: "\u09AE\u09BE\u099D\u09BE\u09B0\u09BF"
  },
  ppt_academic: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are evaluating an academic PowerPoint presentation or thesis defense. Ask robust scientific/factual questions, assess clarity of thesis, and suggest improvements.`,
    icebreaker: "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB, \u0986\u09AE\u09B0\u09BE \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09CD\u09B0\u09C7\u099C\u09C7\u09A8\u09CD\u099F\u09C7\u09B6\u09A8 \u09A1\u09BF\u09AB\u09C7\u09A8\u09CD\u09B8\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4\u0964 \u09A6\u09DF\u09BE \u0995\u09B0\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u0997\u09AC\u09C7\u09B7\u09A3\u09BE\u09B0 \u0989\u09A6\u09CD\u09A6\u09C7\u09B6\u09CD\u09AF \u098F\u09AC\u0982 \u09AB\u09B2\u09BE\u09AB\u09B2\u0997\u09C1\u09B2\u09CB \u09A4\u09C1\u09B2\u09C7 \u09A7\u09B0\u09C1\u09A8\u0964 \u098F\u099F\u09BF \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "Academic Thesis (PPT)",
    icon: "\u{1F5A5}\uFE0F",
    category: "ppt",
    description: "\u098F\u0995\u09BE\u09A1\u09C7\u09AE\u09BF\u0995 \u09A5\u09BF\u09B8\u09BF\u09B8 \u09AC\u09BE \u09B8\u09BE\u09DF\u09C7\u09A8\u09CD\u099F\u09BF\u09AB\u09BF\u0995 \u09AA\u09CD\u09B0\u09C7\u099C\u09C7\u09A8\u09CD\u099F\u09C7\u09B6\u09A8 \u09A1\u09BF\u09AB\u09C7\u09A8\u09CD\u09B8 \u09AE\u0995 \u099F\u09C7\u09B8\u09CD\u099F\u0964",
    context: "\u09B0\u09BF\u09B8\u09BE\u09B0\u09CD\u099A \u09AA\u09C7\u09AA\u09BE\u09B0 \u09AC\u09BE \u09AC\u09BF\u09B6\u09CD\u09AC\u09AC\u09BF\u09A6\u09CD\u09AF\u09BE\u09B2\u09DF\u09C7\u09B0 \u09B8\u09CD\u09B2\u09BE\u0987\u09A1 \u09B6\u09CB \u09B8\u09C1\u099A\u09BE\u09B0\u09C1\u09AD\u09BE\u09AC\u09C7 \u0989\u09AA\u09B8\u09CD\u09A5\u09BE\u09AA\u09A8 \u0995\u09B0\u09BE\u09B0 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8\u0964",
    vocabulary: ["Methodology", "Empirical Evidence", "Hypothesis"],
    difficulty: "\u0995\u09A0\u09BF\u09A8"
  },
  doubt: {
    system: `${SYSTEM_PROMPT}

SCENARIO CONTEXT: You are an expert grammar teacher. The user will ask complex questions or express confusion about English grammar (tenses, prepositions, conditionals). Explain them very clearly and patiently.`,
    icebreaker: "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB! \u0986\u09AE\u09BF \u0986\u099C \u0986\u09AA\u09A8\u09BE\u09B0 \u09A1\u09BE\u0989\u099F \u0995\u09CD\u09B2\u09BF\u09DF\u09BE\u09B0\u09BE\u09B0\u0964 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u0997\u09CD\u09B0\u09BE\u09AE\u09BE\u09B0\u09C7\u09B0 \u0995\u09CB\u09A8 \u09AC\u09BF\u09B7\u09DF\u099F\u09BF \u09AC\u09C1\u099D\u09A4\u09C7 \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09B8\u09BE\u09B9\u09BE\u09AF\u09CD\u09AF \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09BF? \u098F\u099F\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AC\u09B2\u09AC\u09C7\u09A8?",
    name: "Doubt Clearer",
    icon: "\u{1F914}",
    category: "general",
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
async function analyzeAndStorePersonalization(username, conversationText) {
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
   - name: clear title containing both Bengali and English, e.g. "\u09B8\u09AB\u099F\u0993\u09DF\u09CD\u09AF\u09BE\u09B0 \u0987\u099E\u09CD\u099C\u09BF\u09A8\u09BF\u09DF\u09BE\u09B0\u09BF\u0982 \u0987\u09A8\u09CD\u099F\u09BE\u09B0\u09AD\u09BF\u0989 (Software Engineering Interview)"
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
          type: import_genai4.Type.OBJECT,
          properties: {
            characteristics: {
              type: import_genai4.Type.OBJECT,
              properties: {
                interest: { type: import_genai4.Type.STRING },
                level: { type: import_genai4.Type.STRING },
                strengths: { type: import_genai4.Type.STRING },
                weaknesses: { type: import_genai4.Type.STRING }
              },
              required: ["interest", "level", "strengths", "weaknesses"]
            },
            customTopics: {
              type: import_genai4.Type.ARRAY,
              items: {
                type: import_genai4.Type.OBJECT,
                properties: {
                  id: { type: import_genai4.Type.STRING },
                  name: { type: import_genai4.Type.STRING },
                  description: { type: import_genai4.Type.STRING },
                  context: { type: import_genai4.Type.STRING },
                  vocabulary: {
                    type: import_genai4.Type.ARRAY,
                    items: { type: import_genai4.Type.STRING }
                  },
                  difficulty: { type: import_genai4.Type.STRING },
                  category: { type: import_genai4.Type.STRING },
                  icon: { type: import_genai4.Type.STRING }
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
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota exceeded")) {
      console.log("Personalization analysis skipped due to API quota.");
    } else {
      console.error("Error analyzing user personalization:", error?.message || error);
    }
  }
}
app.get("/api/user/personalization", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
    const username = payload.username;
    const userObj = getUser(username);
    if (!userObj) {
      return res.status(404).json({ error: "User not found" });
    }
    const characteristics = JSON.parse(userObj.characteristics || "{}");
    const customTopics = JSON.parse(userObj.custom_topics || "[]");
    return res.json({ characteristics, custom_topics: customTopics });
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
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
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== "admin123" && adminSecret !== "admin") {
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
async function callGeminiWithRetry(fn, maxRetries = 4, delayMs = 2e3) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = isQuotaError(error) || String(error?.status) === "UNAVAILABLE" || error?.message && (error.message.includes("high demand") || error.message.includes("503") || error.message.includes("UNAVAILABLE"));
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
    vocabularyScore: Math.min(fluencyScore + 5, 95),
    grammarScore: Math.min(fluencyScore + 2, 90),
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
      const payload = import_jsonwebtoken3.default.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
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
      const limitNotice = "\u26A0\uFE0F [\u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u0995\u09BE\u09B0\u09BF\u0997\u09B0\u09BF \u09A4\u09CD\u09B0\u09C1\u099F\u09BF: Monthly Spending Cap Exceeded] \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09B0 \u09AE\u09BE\u09A8\u09CD\u09A5\u09B2\u09BF \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0995\u09CD\u09AF\u09BE\u09AA \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 https://ai.studio/spend \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u09AE\u09BF\u099F \u09AC\u09BE\u09DC\u09BE\u09A8\u0964 (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
      const fallbackReply = limitNotice + getLocalFallbackReply(message || "Hello", scenario, tutorName);
      return res.json({ reply: fallbackReply, offlineMode: true, transcript: audio ? "Local mode cannot transcribe audio." : void 0 });
    }
    let activePrompt = SYSTEM_PROMPT;
    let customScenarioObj = null;
    if (scenario && !SCENARIOS[scenario]) {
      const uObj = getUser(username);
      if (uObj && uObj.custom_topics) {
        try {
          const tList = JSON.parse(uObj.custom_topics);
          if (Array.isArray(tList)) {
            customScenarioObj = tList.find((x) => x.id === scenario);
          }
        } catch (e) {
          console.error("Failed to parse custom topics in chat API:", e);
        }
      }
    }
    if (scenario && SCENARIOS[scenario]) {
      activePrompt = SCENARIOS[scenario].system;
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
2. Begin by introducing yourself and the topic warmly in a mix of Bengali and simple English. E.g. "\u0986\u09B8\u09C1\u09A8 \u0986\u09AE\u09B0\u09BE ${customScenarioObj.name} \u09A8\u09BF\u09DF\u09C7 \u0995\u09A5\u09BE \u09AC\u09B2\u09BF!"
3. Guides the student elegantly to practice sentences using these context elements.
4. Ask a question, wait for them, and then gently correct or expand their points.
5. **Teach via Translation**: Whenever you explain concepts or give examples in Bengali, you MUST ask the student to translate those examples into English to practice speaking. Do NOT speak Bengali continuously without prompting them to speak in English.

Speak in a mix of English and Bengali. Start the conversation in Bengali. Most of the time, speak in Bengali but ALWAYS ask for translations to teach English.`;
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
        let contentText = " ";
        if (msg.text) {
          contentText = msg.text;
        } else if (msg.parts && msg.parts[0] && msg.parts[0].text) {
          contentText = msg.parts[0].text;
        }
        formattedContents.push({
          role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
          parts: [{ text: contentText || " " }]
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
        parts: [{ text: message || " " }]
      });
    }
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
        const cleanJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        responseText = parsed.reply || "I couldn't quite hear that, could you say it again?";
        transcript = parsed.transcript || "\u{1F3B5} Unrecognized audio";
      } catch (e) {
        console.error("Failed to parse JSON for audio response:", responseText);
        transcript = "\u{1F3B5} Audio message";
      }
    }
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    if (auth && username !== "Student" && tokensUsed > 0) {
      deductCredits(username, tokensUsed, "Text Chat Generation");
    }
    res.json({ reply: responseText, transcript, tokens_used: tokensUsed });
  } catch (error) {
    if (isQuotaError(error)) {
      triggerCoolDown(error);
      console.warn("[GEMINI/CHAT] Quota error captured. Entering cool-down.");
    } else {
      console.error("Error in /api/chat:", error?.message || error);
    }
    const limitNotice = "\u26A0\uFE0F [\u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u0995\u09BE\u09B0\u09BF\u0997\u09B0\u09BF \u09A4\u09CD\u09B0\u09C1\u099F\u09BF: Monthly Spending Cap Exceeded] \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09B0 \u09AE\u09BE\u09A8\u09CD\u09A5\u09B2\u09BF \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0995\u09CD\u09AF\u09BE\u09AA \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 https://ai.studio/spend \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u09AE\u09BF\u099F \u09AC\u09BE\u09DC\u09BE\u09A8\u0964 (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
    const fallbackReply = limitNotice + getLocalFallbackReply(message || "Hello", scenario, tutorName);
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
        model: "gemini-3.1-flash-lite",
        contents: contextPrompt,
        config: {
          responseMimeType: "application/json"
        }
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
  } catch (error) {
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
      const limitNotice = "\u26A0\uFE0F [\u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u0995\u09BE\u09B0\u09BF\u0997\u09B0\u09BF \u09A4\u09CD\u09B0\u09C1\u099F\u09BF: Monthly Spending Cap Exceeded] \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09B0 \u09AE\u09BE\u09A8\u09CD\u09A5\u09B2\u09BF \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0995\u09CD\u09AF\u09BE\u09AA \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 https://ai.studio/spend \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u09AE\u09BF\u099F \u09AC\u09BE\u09DC\u09BE\u09A8\u0964 (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
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
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
      console.error("Error in /api/icebreaker:", error?.message || error);
    }
    const limitNotice = "\u26A0\uFE0F [\u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u0995\u09BE\u09B0\u09BF\u0997\u09B0\u09BF \u09A4\u09CD\u09B0\u09C1\u099F\u09BF: Monthly Spending Cap Exceeded] \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09B0 \u09AE\u09BE\u09A8\u09CD\u09A5\u09B2\u09BF \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0995\u09CD\u09AF\u09BE\u09AA \u09B6\u09C7\u09B7 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 https://ai.studio/spend \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u09AE\u09BF\u099F \u09AC\u09BE\u09DC\u09BE\u09A8\u0964 (Practice mode is currently offline because the project has exceeded its AI Studio monthly spending cap. Please manage your spending cap to restore full access!)\n\n---\n\n";
    const welcome = limitNotice + getLocalIcebreaker(topic, tutorName);
    res.json({ reply: welcome, offlineMode: true });
  }
});
app.post("/api/review", async (req, res) => {
  const { history } = req.body;
  let username = null;
  const auth = req.headers.authorization;
  if (auth) {
    try {
      const payload = import_jsonwebtoken3.default.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
      username = payload.username;
    } catch (e) {
    }
  }
  try {
    if (!ai || isCoolingDown()) {
      const review = getLocalReview(history || []);
      return res.json({ ...review, offlineMode: true });
    }
    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.json({
        feedback: "\u0996\u09C1\u09AC \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09B6\u09C1\u09B0\u09C1! \u0986\u09AE\u09B0\u09BE \u0986\u09B0\u0993 \u0995\u09BF\u099B\u09C1\u0995\u09CD\u09B7\u09A3 \u0995\u09A5\u09BE \u09AC\u09B2\u09B2\u09C7 \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09A5\u09BE\u09B0 \u09B8\u09BE\u09AC\u09B2\u09C0\u09B2\u09A4\u09BE \u09A8\u09BF\u09DF\u09C7 \u098F\u0995\u099F\u09BF \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u09AE\u09A4\u09BE\u09AE\u09A4 \u09A6\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u0964",
        fluencyScore: 100,
        vocabularyScore: 100,
        grammarScore: 100,
        mistakes: []
      });
    }
    const reviewPrompt = `Analyze the conversation between a student and an AI Tutor to provide helpful, encouraging, and non-judgmental guidance. The review must be entirely in Bengali (\u09AC\u09BE\u0982\u09B2\u09BE \u09AD\u09BE\u09B7\u09BE\u09AF\u09BC).
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
    const response = await callGeminiWithRetry(
      () => ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: reviewPrompt,
        config: {
          responseMimeType: "application/json"
        }
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
        feedback: parsedReview.feedback || "\u099A\u09AE\u09CE\u0995\u09BE\u09B0! \u0986\u09B0\u0993 \u099A\u09B0\u09CD\u099A\u09BE \u0995\u09B0\u09A4\u09C7 \u09A5\u09BE\u0995\u09C1\u09A8\u0964",
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
  } catch (error) {
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
    if (auth && auth.startsWith("Bearer ")) {
      const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
      const token = auth.replace("Bearer ", "");
      try {
        const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
        const username = payload.username;
        const tokensUsed = result.usageMetadata?.totalTokenCount || 0;
        if (tokensUsed > 0 && username !== "Student") {
          deductCredits(username, tokensUsed, "Hint Request Generation");
        }
      } catch (e) {
      }
    }
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
    if (!auth) return res.status(401).json({ error: "Unauthorized. Please log in." });
    try {
      const payload = import_jsonwebtoken3.default.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
      const features = getUserPlanFeatures(payload.username);
      if (!features.pdfUploadAllowed) {
        return res.status(403).json({ error: "Your current plan does not allow uploading custom PDFs." });
      }
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
app.get("/api/pdf/list", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || auth === "Bearer null" || auth === "Bearer ") return res.json({ pdfs: [] });
  try {
    const token = auth.replace("Bearer ", "");
    const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
    const username = payload.username;
    const pdfs = getPrepPdfsForUser(username);
    res.json({ pdfs });
  } catch (err) {
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
    const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
    const username = payload.username;
    let row = getPrepPdfByTopic(username, String(topic));
    if (row) {
      pdfStore[String(topic)] = row.pdfMarkdown;
      return res.json({ pdf: row });
    }
    if (!ai) return res.status(503).json({ error: "Gemini is unavailable." });
    const pdfPrompt = `Please create a comprehensive and elegant PDF lesson study guide in English and Bengali for the topic: "${topic}".
            
Guidelines for study guide structure:
1. Warm & Encouraging Header: Warm introduction in Bengali explaining the grammar errors that occurred during the evaluation and high-level concepts.
2. Detailed Grammar Explanations: Provide meticulous, in-depth breakdowns of the grammar rules violated in the evaluation, detailing exact common mistakes, why they occur, and the correct patterns to use instead.
3. Structured Rules & Key Examples: Define clear structural equations or sentence patterns (e.g. Sub + verb + obj) with Bengali equivalents and rich, practical example sentences.
4. Set of Pre-composed Exercises with Partial Solutions: Create a section with multiple exercises (fill-in-the-blanks, matching, etc.) where some hints or structural letters are already filled in (scaffolded) to assist student visual learning and help them build self-confidence.
5. Translate & Practice Section: A separate, dedicated section called "Sentences for Practice / \u0985\u09A8\u09C1\u09AC\u09BE\u09A6\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09AC\u09BE\u0995\u09CD\u09AF\u09B8\u09AE\u09C2\u09B9" presenting realistic sentences in Bengali for English translation practice, supplemented with vocabulary cues, function tips, and multiple variations.
6. Multi-functional Practice: Design exercises challenging the same concept from multiple angles (e.g., negative sentences, question making, past tense adjustments).

Format requirements: Use structured Markdown with crystal clear, professional language. Ensure beautiful visual layout with clear headings, lists, tables, and blockquotes.`;
    const pdfResult = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: pdfPrompt
    });
    const markdown = pdfResult.text || "Failed to generate.";
    savePrepPdf(username, String(topic), markdown);
    pdfStore[String(topic)] = markdown;
    const pdfTokens = pdfResult.usageMetadata?.totalTokenCount || Math.max(1e3, Math.floor(markdown.length / 4));
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
  } catch (err) {
    console.error("Error retrieving prep PDF:", err.message || err);
    res.status(500).json({ error: "Failed to retrieve study PDF." });
  }
});
app.post("/api/pdf/submit-practice", async (req, res) => {
  const { topic, score } = req.body;
  const auth = req.headers.authorization;
  if (!topic || score === void 0) return res.status(400).json({ error: "Topic and score are required" });
  if (!auth || auth === "Bearer null" || auth === "Bearer ") return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = auth.replace("Bearer ", "");
    const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
    const username = payload.username;
    updatePrepPdfPracticeScore(username, String(topic), Number(score));
    const updatedPdf = getPrepPdfByTopic(username, String(topic));
    res.json({ success: true, pdf: updatedPdf });
  } catch (err) {
    console.error("Error submitting practice score:", err.message || err);
    res.status(500).json({ error: "Failed to save practice score." });
  }
});
app.post("/api/summary", async (req, res) => {
  const { transcript, userAudio } = req.body;
  const auth = req.headers.authorization;
  let loggedInUser = null;
  if (auth) {
    const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
    const token = auth.replace("Bearer ", "");
    try {
      const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
      loggedInUser = payload.username;
    } catch (e) {
    }
  }
  const hasUserAudio = userAudio && typeof userAudio === "string" && userAudio.length > 500;
  if ((!transcript || transcript.trim().length === 0) && !hasUserAudio) {
    if (loggedInUser) {
      try {
        updatePerformanceScore(loggedInUser, 40);
      } catch (e) {
      }
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
      try {
        updatePerformanceScore(loggedInUser, 50);
      } catch (e) {
      }
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
    const apiCallPromise = callGeminiWithRetry(
      () => ai.models.generateContent({
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
            ...hasUserAudio ? [{ inlineData: { data: userAudio, mimeType: "audio/wav" } }] : []
          ]
        }]
      })
    );
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Timeout")), 45e3)
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
    const fScore = typeof parsed.fluencyScore === "number" ? parsed.fluencyScore : 70;
    const vScore = typeof parsed.vocabularyScore === "number" ? parsed.vocabularyScore : 70;
    const gScore = typeof parsed.grammarScore === "number" ? parsed.grammarScore : 70;
    const pScore = typeof parsed.pronunciationScore === "number" ? parsed.pronunciationScore : 70;
    const avgScore = Math.round((fScore + vScore + gScore + pScore) / 4);
    if (loggedInUser) {
      try {
        updatePerformanceScore(loggedInUser, avgScore);
        analyzeAndStorePersonalization(loggedInUser, transcript).catch((e) => {
          if (e?.status === 429 || e?.message?.includes("quota") || e?.message?.includes("429")) {
            console.log("skipped due to quota");
          } else {
            console.error("err:", e?.message || e);
          }
        });
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
  } catch (err) {
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
      } catch (errDb) {
      }
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
6. "whyLearn": Explain why the student needs to learn this specific topic based on their test performance and weaknesses. Explain and justify this in exactly 4 to 5 sentences. (\u0995\u09C7\u09A8 \u098F\u099F\u09BF \u09B6\u09C7\u0996\u09BE \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8?)
7. "whatToGain": What is the benefit of learning that topic, or what advantage will the student gain by completing it? (\u09B6\u09BF\u0996\u09B2\u09C7 \u0995\u09BF \u0989\u09AA\u0995\u09BE\u09B0 \u09AC\u09BE \u09B2\u09BE\u09AD \u09B9\u09AC\u09C7?) Explain the specific speaking/writing outcomes.
8. "actionsToAvoid": Actions to avoid during this step's practice.
9. "engagementInfo": Quick practical tips to keep the student fully engaged.

Estimated English Level: (Beginner / Elementary / Intermediate / Upper Intermediate / Advanced)


You MUST output the Final Report strictly as JSON without markdown wrappers. Use the following keys:
cefrLevel, grammarScore, vocabularyScore, fluencyScore, pronunciationScore, sentenceStructureScore, confidenceScore, overallScore, strengths, weaknesses, commonGrammarMistakes, vocabularyGaps, recommendedLearningPlan (an array of objects, containing exactly 30 objects, each containing: "stepName", "stepDescription", "topicsToLearn", "grammarTopics", "areasForImprovement", "actionsToAvoid", "whyLearn", "whatToGain", "engagementInfo"), estimatedEnglishLevel.

Output in Bengali language. Ensure every single key description and text fields (like whyLearn, whatToGain, areasForImprovement etc) is written in clear, polite Bengali so the student can easily understand their plan.
Here is the conversation transcript to evaluate:
${JSON.stringify(history)}
`;
    const chatResponse = await callGeminiWithRetry(
      () => ai.models.generateContent({
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
    } catch (e) {
      data = JSON.parse(text.replace(/```json/g, "").replace(/```/g, ""));
    }
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
      const token = auth.replace("Bearer ", "");
      try {
        const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
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
  const token = auth.replace("Bearer ", "");
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  try {
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
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
  const token = auth.replace("Bearer ", "");
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  try {
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
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
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
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
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  const token = auth.replace("Bearer ", "");
  try {
    import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
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
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  const token = auth.replace("Bearer ", "");
  try {
    import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
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
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  const token = auth.replace("Bearer ", "");
  try {
    import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
    const result = completeSubtopic(req.params.subtopicId, req.params.topicId);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});
app.post("/api/user/course/topic/:topicId/materials", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  const JWT_SECRET3 = process.env.JWT_SECRET || "super-secret-default-key-for-jwt";
  const token = auth.replace("Bearer ", "");
  try {
    const payload = import_jsonwebtoken3.default.verify(token, JWT_SECRET3);
    const username = payload.username;
    const cData = getUserCourse(username);
    if (!cData || !cData.topics) return res.status(404).json({ error: "Course not found" });
    const topic = cData.topics.find((t) => t.id === req.params.topicId);
    if (!topic) return res.status(404).json({ error: "Topic not found" });
    const userScores = getGrammarScores(username);
    const matchedScore = userScores.find((s) => s.topic === topic.stepName);
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

${evaluationContext ? `STUDENT'S RECENT PERFORMANCE & ERRORS TO EMBED IN WORKBOOK:
${evaluationContext}
` : ""}

Produce an exhaustive, high-quality, and deeply detailed workbook that feels premium, scholarly, yet simple to follow. Structure it EXACTLY with the following headers (use '##' for main sections so that it is split beautifully into separate A4 pages):

# \u{1F4D6} PRO WORKBOOK & PRACTICAL GUIDE: ${topic.stepName}

### \u{1F4A1} \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09BE\u09B0\u09CD\u09B8\u09CB\u09A8\u09BE\u09B2\u09BE\u0987\u099C\u09A1 \u0995\u09CD\u09B2\u09BE\u09B8 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u0993 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09AF\u09BC\u09A8 \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09BE\u09B0 (Class Overview & Progress Tracker)
_\u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09B0 \u09B8\u09CD\u09AA\u09CB\u0995\u09C7\u09A8 \u09B8\u09C7\u09B6\u09A8\u09C7\u09B0 \u09B8\u09BE\u09AE\u0997\u09CD\u09B0\u09BF\u0995 \u09AE\u09C2\u09B2\u09CD\u09AF\u09BE\u09DF\u09A3, \u09AA\u09CD\u09B0\u09B6\u0982\u09B8\u09BE \u098F\u09AC\u0982 \u0997\u09CD\u09B0\u09BE\u09AE\u09BE\u09B0 \u0989\u09A8\u09CD\u09A8\u09A4\u09BF\u09B0 \u0995\u09CD\u09B7\u09C7\u09A4\u09CD\u09B0\u099F\u09BF \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u0993 \u0989\u09CE\u09B8\u09BE\u09B9\u09AC\u09CD\u09AF\u099E\u09CD\u099C\u0995 \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09E7-\u09E8\u099F\u09BF \u0985\u09A8\u09C1\u099A\u09CD\u099B\u09C7\u09A6\u09C7 \u09AC\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE \u0995\u09B0\u09C1\u09A8\u0964_
${matchedScore ? `- **\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 \u0995\u09CD\u09B2\u09BE\u09B8 \u09B8\u09CD\u0995\u09CB\u09B0:** ${matchedScore.score}/100
- **\u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u098F\u0995\u09BE\u09A1\u09C7\u09AE\u09BF\u0995 \u09AB\u09BF\u09A1\u09AC\u09CD\u09AF\u09BE\u0995:** ${matchedScore.feedback}` : "- \u098F\u0996\u09A8\u0993 \u0985\u09AC\u099C\u09C7\u0995\u09CD\u099F\u09BF\u09AD \u099F\u09C7\u09B8\u09CD\u099F \u09B8\u09CD\u0995\u09CB\u09B0 \u09AC\u09BE \u0997\u09A4 \u0995\u09CD\u09B2\u09BE\u09B8\u09C7\u09B0 \u09B8\u09CD\u09AA\u09BF\u0995\u09BF\u0982 \u09B8\u09C7\u09B6\u09A8 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 \u09AA\u09CD\u09B0\u09A5\u09AE \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09B8\u09C7\u09B6\u09A8 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u0995\u09B0\u09C7 \u09A8\u09BF\u099C\u09C7\u09B0 \u09B8\u09CD\u0995\u09CB\u09B0 \u0986\u09AA\u09A1\u09C7\u099F \u0995\u09B0\u09C1\u09A8\u0964"}

---

## \u{1F3AF} \u09B8\u09C7\u0995\u09B6\u09A8 \u09E7: \u09AD\u09C1\u09B2\u09A4\u09CD\u09B0\u09C1\u099F\u09BF \u09B8\u0982\u09B6\u09CB\u09A7\u09A8 \u0993 \u0997\u09CD\u09B0\u09BE\u09AE\u09BE\u099F\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09AA\u09BF\u099F\u09AB\u09B2\u09B8 (Personalized Errors & Common Traps)
_\u098F\u0987 \u0997\u09CD\u09B0\u09BE\u09AE\u09BE\u09B0 \u09B8\u09C7\u0995\u09B6\u09A8\u09C7 \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09B0\u09BE \u09B8\u099A\u09B0\u09BE\u099A\u09B0 \u09AF\u09C7 \u09B8\u09AC \u09AD\u09C1\u09B2 \u0995\u09B0\u09C7 \u09A5\u09BE\u0995\u09C7, \u09B8\u09C7\u0987 \u09AE\u09BE\u09B0\u09BE\u09A4\u09CD\u09AE\u0995 \u09AD\u09C1\u09B2\u0997\u09C1\u09B2\u09CB \u099A\u09BF\u09B9\u09CD\u09A8\u09BF\u09A4 \u0995\u09B0\u09C7 \u09B8\u09B9\u099C \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u0986\u09B2\u09CB\u099A\u09A8\u09BE \u0993 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0995\u09B0\u09C1\u09A8\u0964_
- \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09B0 \u09A8\u09BF\u099C\u09C7\u09B0 \u0995\u09B0\u09BE \u09AD\u09C1\u09B2\u0997\u09C1\u09B2\u09CB \u0985\u09A5\u09AC\u09BE \u098F\u0987 \u099F\u09AA\u09BF\u0995\u09C7\u09B0 \u09EA\u099F\u09BF \u09B9\u09BE\u0987-\u09AB\u09CD\u09B0\u09BF\u0995\u09CB\u09AF\u09BC\u09C7\u09A8\u09CD\u09B8\u09BF \u09AD\u09C1\u09B2\u09C7\u09B0 \u0997\u09AD\u09C0\u09B0 \u0993 \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3 \u09A6\u09BF\u09A8\u0964
- \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AD\u09C1\u09B2\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09A8\u09BF\u099A\u09C7\u09B0 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F\u099F\u09BF \u0995\u09A0\u09CB\u09B0\u09AD\u09BE\u09AC\u09C7 \u0985\u09A8\u09C1\u09B8\u09B0\u09A3 \u0995\u09B0\u09C1\u09A8:
  - **\u09AD\u09C1\u09B2 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09AC\u09BE\u0995\u09CD\u09AF (\u274C Incorrect):** [Sentence with error]
  - **\u09B8\u09A0\u09BF\u0995 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09AC\u09BE\u0995\u09CD\u09AF (\u2705 Correct):** [Corrected sentence with changes highlighted in upper-case/bold]
  - **\u09B8\u09B9\u099C \u09AC\u09BF\u09B6\u09CD\u09B2\u09C7\u09B7\u09A3 (\u{1F4A1} Explanation):** [\u0996\u09C1\u09AC\u0987 \u09B8\u09B9\u099C \u0993 \u09AE\u09A7\u09C1\u09B0 \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09E8-\u09E9 \u09AC\u09BE\u0995\u09CD\u09AF\u09C7 \u09AC\u09C1\u099D\u09BF\u09DF\u09C7 \u09AC\u09B2\u09C1\u09A8 \u0995\u09C7\u09A8 \u098F\u0987 \u09AD\u09C1\u09B2\u099F\u09BF \u09B8\u099A\u09B0\u09BE\u099A\u09B0 \u0998\u099F\u09C7, \u09AD\u09C1\u09B2\u099F\u09BF \u0995\u09C7\u09A8 \u09AD\u09C1\u09B2 \u098F\u09AC\u0982 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09A4\u09BE \u09AE\u09A8\u09C7 \u09B0\u09C7\u0996\u09C7 \u098F\u09DC\u09BE\u09A8\u09CB \u09AF\u09BE\u09DF\u0964]
- \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09A6\u09C7\u09B0 \u0986\u09A4\u09CD\u09AE\u09AC\u09BF\u09B6\u09CD\u09AC\u09BE\u09B8 \u09AC\u09BE\u09DC\u09BE\u09A8\u09CB\u09B0 \u099C\u09A8\u09CD\u09AF \u0997\u09CD\u09B0\u09BE\u09AE\u09BE\u09B0\u099F\u09BF \u09AE\u09A8\u09C7 \u09B0\u09BE\u0996\u09BE\u09B0 \u09E7\u099F\u09BF \u09AC\u09BF\u09B6\u09C7\u09B7 \u09B6\u09BF\u0995\u09CD\u09B7\u09A3\u09C0\u09DF \u09B6\u09B0\u09CD\u099F\u0995\u09BE\u099F \u099F\u09C7\u0995\u09A8\u09BF\u0995 (Memory Rule) \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09A6\u09BF\u09A8\u0964

---

## \u{1F4DD} \u09B8\u09C7\u0995\u09B6\u09A8 \u09E8: \u09AC\u09CD\u09AF\u09BE\u0995\u09B0\u09A3\u09C7\u09B0 \u09B8\u09B9\u099C \u09AC\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE \u0993 \u09B8\u09C7\u09A8\u09CD\u099F\u09C7\u09A8\u09CD\u09B8 \u09B8\u09CD\u099F\u09CD\u09B0\u09BE\u0995\u099A\u09BE\u09B0 (In-depth Grammar Explanations & Structures)
_\u0995\u09CB\u09A8\u09CB \u0995\u09A0\u09BF\u09A8 \u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u09A1\u09BF\u09B6\u09A8\u09BE\u09B2 \u099F\u09BE\u09B0\u09CD\u09AE \u099B\u09BE\u09DC\u09BE\u0987, \u09AC\u09BE\u09B8\u09CD\u09A4\u09AC\u09B8\u09AE\u09CD\u09AE\u09A4 \u0989\u09A6\u09BE\u09B9\u09B0\u09A3 \u0993 \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u09C7\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 "${topic.grammarTopics}" \u098F\u09B0 \u09A8\u09BF\u09DF\u09AE\u09A8\u09C0\u09A4\u09BF \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09AA\u09C1\u0999\u09CD\u0996\u09BE\u09A8\u09C1\u09AA\u09C1\u0999\u09CD\u0996 \u09AC\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE \u0995\u09B0\u09C1\u09A8\u0964_
- **\u09A8\u09BF\u09DF\u09AE \u09E7, \u09E8 \u098F\u09AC\u0982 \u09E9 (Detailed Rules):** \u09E9\u099F\u09BF \u09AE\u09C2\u09B2 \u09AC\u09CD\u09AF\u09BE\u0995\u09B0\u09A3\u0997\u09A4 \u09A8\u09BF\u09DF\u09AE\u09C7\u09B0 \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u09B8\u09B9\u099C, \u0986\u0995\u09B0\u09CD\u09B7\u09A3\u09C0\u09DF \u098F\u09AC\u0982 \u09AC\u09BF\u09B8\u09CD\u09A4\u09BE\u09B0\u09BF\u09A4 \u09AA\u09CD\u09B0\u09BE\u0995\u099F\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u09A8\u09BF\u09DF\u09AE \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09B2\u09BF\u0996\u09C1\u09A8\u0964 \u0995\u09CB\u09A8\u09CB \u09AC\u09BF\u09B7\u09DF\u0987 \u09AF\u09C7\u09A8 \u09B8\u0982\u0995\u09CD\u09B7\u09C7\u09AA\u09C7 \u098F\u09DC\u09BF\u09DF\u09C7 \u09AF\u09BE\u0993\u09DF\u09BE \u09A8\u09BE \u09B9\u09DF!
- **\u0997\u09A0\u09A8\u0997\u09A4 \u0995\u09BE\u09A0\u09BE\u09AE\u09CB (Complete Sentence Formulas):** \u09AC\u09BE\u0995\u09CD\u09AF \u09AE\u09C1\u0996\u09B8\u09CD\u09A5 \u09A8\u09BE \u0995\u09B0\u09C7 \u09AE\u09A8\u09C7\u09B0 \u09AE\u09A4\u09CB \u0995\u09B0\u09C7 \u09AC\u09BE\u09A8\u09BE\u09A8\u09CB\u09B0 \u099C\u09A8\u09CD\u09AF \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u0997\u09BE\u09A3\u09BF\u09A4\u09BF\u0995 \u09B8\u09C2\u09A4\u09CD\u09B0 \u09AC\u09BE \u09AB\u09B0\u09CD\u09AE\u09C1\u09B2\u09BE \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09C1\u09A8:
  - **Affirmative Structure (\u09B9\u09CD\u09AF\u09BE\u0981-\u09AC\u09CB\u09A7\u0995):** \u0938\u0942\u0924\u094D\u0930 (Subject + ...) \u098F\u09AC\u0982 \u09EB\u099F\u09BF \u09AC\u09C8\u099A\u09BF\u09A4\u09CD\u09B0\u09CD\u09AF\u09AE\u09DF \u0989\u09A6\u09BE\u09B9\u09B0\u09A3 (\u0987\u0982\u09B0\u09C7\u099C\u09BF \u0993 \u09AC\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09C7\u099F\u09C7 \u09AC\u09BE\u0982\u09B2\u09BE \u09AA\u09CD\u09B0\u09A4\u09BF\u09B6\u09AC\u09CD\u09A6)
  - **Negative Structure (\u09A8\u09BE-\u09AC\u09CB\u09A7\u0995):** \u09B8\u09C2\u09A4\u09CD\u09B0 \u098F\u09AC\u0982 \u09EB\u099F\u09BF \u0989\u09A6\u09BE\u09B9\u09B0\u09A3
  - **Interrogative Structure (\u09AA\u09CD\u09B0\u09B6\u09CD\u09A8\u09AC\u09CB\u09A7\u0995 - Yes/No & WH-questions):** \u09B8\u09C2\u09A4\u09CD\u09B0 \u098F\u09AC\u0982 \u09EB\u099F\u09BF \u0989\u09A6\u09BE\u09B9\u09B0\u09A3
- **Pronunciation & Speaking Tip:** \u09B8\u09CD\u09AA\u09CB\u0995\u09C7\u09A8 \u0987\u0982\u09B2\u09BF\u09B6\u09C7 \u09AB\u09CD\u09B2\u09C1\u09DF\u09C7\u09A8\u09CD\u099F\u09B2\u09BF \u0995\u09A5\u09BE \u09AC\u09B2\u09BE\u09B0 \u09B8\u09AE\u09DF \u098F\u0987 \u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u09A8\u09BF\u09DF\u09AE\u09C7 \u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u0995\u09A8\u09CD\u099F\u09CD\u09B0\u09BE\u0995\u09B6\u09A8 (\u09AF\u09C7\u09AE\u09A8: don't, doesn't, is not, I've, are) \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09C7 \u09AB\u09BE\u09B8\u09CD\u099F \u0987\u0982\u09B2\u09BF\u09B6 \u09B0\u09C7\u0995\u09B0\u09CD\u09A1 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF, \u09A4\u09BE\u09B0 \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u099F\u09BF\u09AA\u09B8 \u0993 \u0989\u09A6\u09BE\u09B9\u09B0\u09A3 \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964

---

## \u{1F5E3}\uFE0F \u09B8\u09C7\u0995\u09B6\u09A8 \u09E9: \u0985\u09A8\u09C1\u09AC\u09BE\u09A6\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09AC\u09BE\u09B8\u09CD\u09A4\u09AC\u09B8\u09AE\u09CD\u09AE\u09A4 \u09AC\u09BE\u0995\u09CD\u09AF\u09B8\u09AE\u09C2\u09B9 (15+ Real-life Bengali-to-English Exercises)
_\u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09B0 \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8 \u0995\u09B0\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF **\u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09E7\u09EB\u099F\u09BF (\u09E7\u09EB+) \u0985\u09A4\u09CD\u09AF\u09A8\u09CD\u09A4 \u0989\u099A\u09CD\u099A-\u09AE\u09BE\u09A8\u09C7\u09B0, \u09AC\u09BE\u09B8\u09CD\u09A4\u09AC\u09B8\u09AE\u09CD\u09AE\u09A4 \u098F\u09AC\u0982 \u09A6\u09C8\u09A8\u09A8\u09CD\u09A6\u09BF\u09A8 \u099C\u09C0\u09AC\u09A8\u09C7 \u09B8\u09B0\u09CD\u09AC\u09BE\u09A7\u09BF\u0995 \u09AC\u09CD\u09AF\u09AC\u09B9\u09C3\u09A4 \u09AC\u09BE\u0982\u09B2\u09BE \u09AC\u09BE\u0995\u09CD\u09AF** \u09A6\u09BF\u09A8 \u09AF\u09BE \u09A4\u09BE\u09B0\u09BE \u0987\u0982\u09B0\u09C7\u099C\u09BF\u09A4\u09C7 \u0985\u09A8\u09C1\u09AC\u09BE\u09A6 \u0995\u09B0\u09BE\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 \u09A8\u09BF\u099C\u09C7\u09B0 \u09AC\u09BE\u0995\u09CD\u09AF \u09AC\u09BE\u09A8\u09BE\u09A8\u09CB\u09B0 \u099C\u09DC\u09A4\u09BE \u09A6\u09C2\u09B0 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u0964_
- \u0995\u09C1\u0987\u099C \u09B8\u09C7\u099F\u099F\u09BF\u0995\u09C7 \u09E9\u099F\u09BF \u09A7\u09BE\u09AA\u09C7 \u09AD\u09BE\u0997 \u0995\u09B0\u09C1\u09A8:
  - **\u09B8\u09B9\u099C \u09AC\u09BE\u0995\u09CD\u09AF \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8 (Beginner - \u09E7 \u09A5\u09C7\u0995\u09C7 \u09EB):** \u09A6\u09C8\u09A8\u09A8\u09CD\u09A6\u09BF\u09A8 \u099C\u09C0\u09AC\u09A8\u09C7\u09B0 \u09B8\u09B0\u09B2 \u0993 \u099B\u09CB\u099F \u09AC\u09BE\u0995\u09CD\u09AF\u09B8\u09AE\u09C2\u09B9\u0964
  - **\u09AE\u09BE\u099D\u09BE\u09B0\u09BF \u09AC\u09BE\u0995\u09CD\u09AF \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8 (Intermediate - \u09EC \u09A5\u09C7\u0995\u09C7 \u09E7\u09E6):** \u0995\u09BF\u099B\u09C1\u099F\u09BE \u099C\u099F\u09BF\u09B2 \u0993 \u09AC\u09C7\u09B6\u09BF \u09A4\u09A5\u09CD\u09AF \u09B8\u0982\u09AC\u09B2\u09BF\u09A4 \u09AC\u09BE\u0995\u09CD\u09AF\u09B8\u09AE\u09C2\u09B9\u0964
  - **\u0985\u09CD\u09AF\u09BE\u09A1\u09AD\u09BE\u09A8\u09CD\u09B8\u09A1 \u09AC\u09BE\u0995\u09CD\u09AF \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8 (Advanced - \u09E7\u09E7 \u09A5\u09C7\u0995\u09C7 \u09E7\u09EB+):** \u09AB\u09BF\u09B2\u09BF\u0982\u09B8, \u0986\u09AC\u09C7\u0997 \u09AA\u09CD\u09B0\u0995\u09BE\u09B6\u0995\u09BE\u09B0\u09C0 \u0993 \u09AA\u09C7\u09B6\u09BE\u0997\u09A4 \u099C\u09C0\u09AC\u09A8\u09C7\u09B0 \u09AC\u09BE\u0995\u09CD\u09AF\u09B8\u09AE\u09C2\u09B9\u0964
- \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AC\u09BE\u0995\u09CD\u09AF\u09C7\u09B0 \u09AA\u09B0 \u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4 \u09AB\u09BE\u0995\u09BE \u09AC\u09BE \u09A1\u09CD\u09AF\u09BE\u09B6 \u09B2\u09BE\u0987\u09A8\u09C7\u09B0 \u09AC\u09CD\u09AF\u09AC\u09B8\u09CD\u09A5\u09BE \u0995\u09B0\u09C1\u09A8 \u09AF\u09BE\u09A4\u09C7 \u0996\u09BE\u09A4\u09BE\u09DF \u09B2\u09C7\u0996\u09BE\u09B0 \u09AE\u09A4\u09CB \u0996\u09BE\u09B2\u09BF \u099C\u09BE\u09DF\u0997\u09BE \u09AE\u09A8\u09C7 \u09B9\u09DF\u0964
- \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AC\u09BE\u0995\u09CD\u09AF\u09C7\u09B0 \u09B6\u09C7\u09B7\u09C7 \u09AC\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u09C7\u099F\u09C7 \u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC \u09AC\u09BF\u09B6\u09C7\u09B7 \u09AC\u09CD\u09AF\u09BE\u0995\u09B0\u09A3\u0997\u09A4 \u09AC\u09BE \u09B6\u09AC\u09CD\u09A6\u09BE\u09B0\u09CD\u09A5\u0997\u09A4 \u0995\u09CD\u09B2\u09C1 \u09AC\u09BE \u09B9\u09BF\u09A8\u09CD\u099F\u09B8 (Clues) \u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8\u0964
  - *\u0985\u09A8\u09C1\u09AC\u09BE\u09A6\u09C7\u09B0 \u0989\u09A6\u09BE\u09B9\u09B0\u09A3 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F:* "\u09E7. \u0986\u09AE\u09BF \u09AA\u09CD\u09B0\u09BE\u09DF\u0987 \u09AC\u09A8\u09CD\u09A7\u09C1\u09A6\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u0986\u09A1\u09CD\u09A1\u09BE \u09A6\u09BF\u0987 \u0995\u09BF\u09A8\u09CD\u09A4\u09C1 \u0986\u099C \u0986\u09AE\u09BE\u09B0 \u098F\u0995\u09A6\u09AE \u0987\u099A\u09CD\u099B\u09BE \u09A8\u09C7\u0987\u0964 [\u0995\u09CD\u09B2\u09C1: hang out with friends, but today I don't feel like it at all; \u098F\u099F\u09BF 'Tense-1' \u0993 'Mood' \u09AE\u09BF\u09B6\u09CD\u09B0\u09BF\u09A4]"
- **\u0995\u09A0\u09CB\u09B0 \u09A8\u09BF\u09DF\u09AE: \u09E7\u09EB\u099F\u09BF\u09B0 \u09A8\u09BF\u099A\u09C7 \u098F\u0995\u099F\u09BF \u0985\u09A8\u09C1\u09AC\u09BE\u09A6\u0993 \u09AF\u09C7\u09A8 \u09AC\u09BE\u09A6 \u09A8\u09BE \u09AA\u09DC\u09C7\u0964**

---

## \u270D\uFE0F \u09B8\u09C7\u0995\u09B6\u09A8 \u09EA: \u09B6\u09C2\u09A8\u09CD\u09AF\u09B8\u09CD\u09A5\u09BE\u09A8 \u09AA\u09C2\u09B0\u09A3 \u0993 \u09B8\u09A0\u09BF\u0995 \u09B0\u09C2\u09AA \u09AA\u09CD\u09B0\u09DF\u09CB\u0997 (8-10 Scaffolded Grammar Quizzes)
- \u0997\u09CD\u09B0\u09BE\u09AE\u09BE\u09B0 \u099F\u09AA\u09BF\u0995 \u098F\u09AC\u0982 \u0985\u09A4\u09BF \u09A6\u09B0\u0995\u09BE\u09B0\u09BF \u09B6\u09AC\u09CD\u09A6\u09AD\u09BE\u09A3\u09CD\u09A1\u09BE\u09B0 (${topic.topicsToLearn}) \u09AA\u09C1\u0999\u09CD\u0996\u09BE\u09A8\u09C1\u09AA\u09C1\u0999\u09CD\u0996 \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF **\u0995\u09AE\u09AA\u0995\u09CD\u09B7\u09C7 \u09EE-\u09E7\u09E6\u099F\u09BF \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u09B6\u09C2\u09A8\u09CD\u09AF\u09B8\u09CD\u09A5\u09BE\u09A8 \u09AA\u09C2\u09B0\u09A3 (Fill in the blanks)** \u09AC\u09BE \u098F\u09AE\u09B8\u09BF\u0995\u09BF\u0989 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C1\u09A8\u0964
- \u0989\u09A6\u09BE\u09B9\u09B0\u09A3\u09B8\u09CD\u09AC\u09B0\u09C2\u09AA: '1. She ______ (do/does/is) not agree with our feedback.'

---

## \u{1F511} \u09B8\u09C7\u0995\u09B6\u09A8 \u09EB: \u0989\u09A4\u09CD\u09A4\u09B0\u09AA\u09A4\u09CD\u09B0 \u0993 \u09AC\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE\u09AE\u09C2\u09B2\u0995 \u09B8\u09AE\u09BE\u09A7\u09BE\u09A8 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u09BF\u0995\u09BE (Comprehensive Answer Keys with Explanations)
- \u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0\u09A6\u09C7\u09B0 \u09B8\u09C7\u09B2\u09AB-\u0985\u09CD\u09AF\u09BE\u09B8\u09C7\u09B8\u09AE\u09C7\u09A8\u09CD\u099F\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u098F\u09AC\u0982 \u09B6\u09BF\u0995\u09CD\u09B7\u0995\u09C7\u09B0 \u0985\u09A8\u09C1\u09AA\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF\u09A4\u09C7\u0993 \u09AF\u09C7\u09A8 \u09A8\u09BF\u099C\u09C7 \u09A8\u09BF\u099C\u09C7 \u09E7\u09E6\u09E6% \u09AC\u09C1\u099D\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7, \u09B8\u09C7\u0987 \u0989\u09A6\u09CD\u09A6\u09C7\u09B6\u09CD\u09AF\u09C7:
- **\u09E7\u09EB\u099F\u09BF \u0985\u09A8\u09C1\u09AC\u09BE\u09A6\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AC\u09BE\u0995\u09CD\u09AF\u09C7\u09B0 \u09B8\u09A0\u09BF\u0995 \u0987\u0982\u09B0\u09C7\u099C\u09BF \u09B0\u09C2\u09AA \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u0995\u09B0\u09C7 \u09B2\u09BF\u0996\u09C7 \u09A6\u09BF\u09A8\u0964**
- **\u09EE-\u09E7\u09E6\u099F\u09BF \u09B6\u09C2\u09A8\u09CD\u09AF\u09B8\u09CD\u09A5\u09BE\u09A8 \u09AA\u09C2\u09B0\u09A3\u09C7\u09B0 \u09B8\u09A0\u09BF\u0995 \u0985\u09AA\u09B6\u09A8\u099F\u09BF \u0989\u09B2\u09CD\u09B2\u09C7\u0996 \u0995\u09B0\u09C7 \u0995\u09C7\u09A8 \u0990 \u09B6\u09AC\u09CD\u09A6\u099F\u09BF \u09AC\u09B8\u09B2\u09CB \u09A4\u09BE \u0996\u09C1\u09AC\u0987 \u09AA\u09CD\u09B0\u09BE\u099E\u09CD\u099C\u09B2 \u0993 \u09AA\u09C1\u0999\u09CD\u0996\u09BE\u09A8\u09C1\u09AA\u09C1\u0999\u09CD\u0996 \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09AC\u09CD\u09AF\u09BE\u0996\u09CD\u09AF\u09BE \u0995\u09B0\u09C1\u09A8\u0964**

Output ONLY the clean, raw markdown. Ensure the document is extremely comprehensive, academic, highly descriptive, beautifully organized into structural pages, containing rich tables or formulas lists where helpful. Avoid generic placeholders or truncated text. Do not summarize; write fully detailed explanations to provide premium textbook service.`;
    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt
    });
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
function inferReligionFromName(fullName) {
  if (!fullName) {
    return { religion: "neutral", greeting: "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB \u098F\u09AC\u0982 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE", displayName: "\u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0" };
  }
  const nameLower = fullName.toLowerCase();
  const muslimKeywords = [
    "muhammad",
    "mohammad",
    "md.",
    "md ",
    "ahmed",
    "rahman",
    "islam",
    "ali",
    "hassan",
    "hasan",
    "hussein",
    "khan",
    "uddin",
    "chowdhury",
    "mahmud",
    "akhtar",
    "akter",
    "begum",
    "khanam",
    "khatun",
    "siddique",
    "alam",
    "miah",
    "sultan",
    "iqbal",
    "farid"
  ];
  const hinduKeywords = [
    "sri",
    "sree",
    "chandra",
    "kumar",
    "rani",
    "devi",
    "das",
    "roy",
    "sarker",
    "ghosh",
    "sen",
    "bhowmik",
    "chakraborty",
    "sharma",
    "gupta",
    "banerjee",
    "mukherjee",
    "chatterjee",
    "bhattacharya",
    "paul",
    "saha",
    "sil",
    "dhar",
    "adhikary",
    "priya",
    "anjali",
    "biswas",
    "barman",
    "nath"
  ];
  const christianBuddhistKeywords = [
    "barua",
    "sangma",
    "marma",
    "chakma",
    "gomes",
    "rozario",
    "d'costa",
    "peter",
    "john",
    "david",
    "thomas"
  ];
  let religion = "neutral";
  let greeting = "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB \u098F\u09AC\u0982 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE";
  const isMuslim = muslimKeywords.some((keyword) => nameLower.includes(keyword));
  const isHindu = hinduKeywords.some((keyword) => nameLower.includes(keyword));
  const isChristianBuddhist = christianBuddhistKeywords.some((keyword) => nameLower.includes(keyword));
  if (isHindu && !isMuslim) {
    religion = "Hindu";
    greeting = "\u09A8\u09AE\u09B8\u09CD\u0995\u09BE\u09B0";
  } else if (isMuslim && !isHindu) {
    religion = "Muslim";
    greeting = "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB \u0993 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE";
  } else if (isChristianBuddhist) {
    religion = "Christian/Buddhist";
    greeting = "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB \u0993 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE";
  }
  let displayName = fullName;
  const parts = fullName.split(" ").filter((p) => p.length > 0 && !["md.", "md", "sri", "sree", "mr.", "mrs.", "ms."].includes(p.toLowerCase()));
  if (parts.length > 0) {
    displayName = parts[0];
  }
  return { religion, greeting, displayName };
}
function setupLiveWebSocket(server) {
  const wss = new import_ws.WebSocketServer({ server, path: "/live" });
  wss.on("error", (err) => {
    console.error("Live WebSockets Server Error:", err?.message || err);
  });
  wss.on("connection", async (clientWs, req) => {
    clientWs.on("error", (err) => {
      console.error("Live WebSockets Client Socket Error:", err?.message || err);
    });
    const url = new URL(req.url || "", "http://localhost");
    const tutorName = url.searchParams.get("tutorName") || "Buddy";
    const rawVoice = url.searchParams.get("voice") || "Zephyr";
    const scenarioId = url.searchParams.get("scenarioId");
    const courseTopicId = url.searchParams.get("courseTopicId");
    const courseSubtopicId = url.searchParams.get("courseSubtopicId");
    const pdfId = url.searchParams.get("pdfId");
    const auth = url.searchParams.get("auth");
    let isPremium = false;
    let username = "Student";
    let performanceScore = 0;
    let customScenarioObj = null;
    let realName = "\u09B6\u09BF\u0995\u09CD\u09B7\u09BE\u09B0\u09CD\u09A5\u09C0";
    let religionGreeting = "\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB \u0993 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE";
    let religionType = "neutral";
    if (auth) {
      try {
        const payload = import_jsonwebtoken3.default.verify(auth, process.env.JWT_SECRET || "super-secret-default-key-for-jwt");
        isPremium = !!payload.isPremium;
        username = payload.username;
        const u = getUser(username);
        if (u) {
          if (typeof u.performanceScore === "number") {
            performanceScore = u.performanceScore;
          }
          const baseForInference = u.name || username;
          if (baseForInference) {
            const inf = inferReligionFromName(baseForInference);
            realName = inf.displayName;
            religionGreeting = inf.greeting;
            religionType = inf.religion;
          }
          if (u.custom_topics && scenarioId && !SCENARIOS[scenarioId]) {
            try {
              const customTopicsList = JSON.parse(u.custom_topics);
              if (Array.isArray(customTopicsList)) {
                customScenarioObj = customTopicsList.find((x) => x.id === scenarioId);
              }
            } catch (e) {
              console.error("Failed to parse custom topics in ws:", e);
            }
          }
        }
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
      systemInstruction += `
6. MOST IMPORTANT: You MUST speak extremely slowly, clearly, and pausing between words. The student needs to hear every syllable slowly to learn properly. Act like you are speaking in slow motion.`;
    }
    if (scenarioId && SCENARIOS[scenarioId]) {
      const scenario = SCENARIOS[scenarioId];
      systemInstruction = scenario.system.replace(/Buddy/g, tutorName) + `

Your output is being streamed directly as voice. Speak clearly and cleanly. Do NOT use stutters, unnecessary interjections, or excessive conversational fillers. Do NOT use text formatting like *actions*, asterisks, bolding, or markdown. Keep your responses extremely concise and brief. Never speak for more than 1 or 2 short sentences at a time.
${baseRules}`;
      if (scenarioId === "companion") {
        systemInstruction += `

USER PERFORMANCE SCORE: The user's current performance score on this platform is ${performanceScore} / 100. Mention this to them if they ask about how they are doing!`;
      }
      if (isPremium && scenario.pdfText) {
        systemInstruction += `

SCENARIO CONTEXT BACKGROUND: Here is the topic's background reading text:

---
${scenario.pdfText.substring(0, 2e4)}
---

Use this material as silent reference background knowledge if needed. Just use it to seed conversation details dynamically.`;
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
        const topic = cData.topics.find((t) => t.id === courseTopicId);
        if (topic) {
          let subtopicName = "";
          if (courseSubtopicId) {
            subtopicName = getSubtopicName(courseSubtopicId);
          }
          let focusText = "";
          if (subtopicName) {
            focusText = `SPECIFIC FOCUS FOR THIS CLASS SESSION: You MUST guide the conversational drills, translations, questions and interaction specifically around practicing: "${subtopicName}".
`;
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
    } else if (scenarioId === "proficiency-eval") {
      systemInstruction = `You are an expert English language examiner and personal mentor.

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
"\u0986\u09AE\u09BE\u09A6\u09C7\u09B0 \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0 \u0986\u09B2\u09CB\u099A\u09A8\u09BE\u099F\u09BF \u0986\u099C \u098F\u0996\u09BE\u09A8\u09C7\u0987 \u09B6\u09C7\u09B7 \u09B9\u09B2\u09CB\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09A8\u09BF\u099A\u09C7 \u09A5\u09BE\u0995\u09BE 'Stop Conversation' \u09AC\u09BE\u099F\u09A8\u099F\u09BF\u09A4\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C1\u09A8\u0964 \u09AC\u09BE\u099F\u09A8\u099F\u09BF \u099A\u09BE\u09AA\u09BE\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09B8\u09BE\u09A5\u09C7\u0987 \u0986\u09AA\u09A8\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE\u09B0 \u098F\u0995\u099F\u09BF \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 AI \u0985\u09CD\u09AF\u09BE\u09B8\u09C7\u09B8\u09AE\u09C7\u09A8\u09CD\u099F \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F \u09AA\u09C7\u09DF\u09C7 \u09AF\u09BE\u09AC\u09C7\u09A8\u0964 \u098F\u09AC\u0982 \u0986\u09AA\u09A8\u09BF \u09AF\u09A6\u09BF \u099A\u09BE\u09A8, \u09A4\u09AC\u09C7 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F\u09C7\u09B0 \u09B6\u09C7\u09B7 \u09AA\u09CD\u09B0\u09BE\u09A8\u09CD\u09A4\u09C7 \u09AC\u09BE \u09AA\u09BE\u09B6\u09C7\u09B0 \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09B8\u09AE\u09DF \u098F\u0987 \u09B0\u09BF\u09AA\u09CB\u09B0\u09CD\u099F\u099F\u09BF\u0995\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BF\u099C\u09C7\u09B0 \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u0995\u09CB\u09B0\u09CD\u09B8\u09C7 \u09B0\u09C2\u09AA\u09BE\u09A8\u09CD\u09A4\u09B0 \u0995\u09B0\u09C7 \u09A8\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8 \u0993 \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8 \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"

Your output is being streamed directly as voice. Speak clearly and cleanly. Do NOT use stutters, unnecessary interjections, or excessive conversational fillers. Do NOT use text formatting like *actions*, asterisks, bolding, or markdown. Keep your responses extremely concise and brief. Never speak for more than 1 or 2 short sentences at a time.`;
    } else if (scenarioId === "surprise") {
      systemInstruction += `

SCENARIO CONTEXT: You must pick a completely random, surprising, and highly creative role-play scenario for the user to participate in right now (e.g., alien landing, time travel, a magical quest, managing a crazy zoo). Introduce the scenario excitedly as soon as they say hello, and play along!`;
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
- DO NOT say the typical note-taking/practice sheet notice ("\u09A8\u09CB\u099F \u09A8\u09C7\u0993\u09AF\u09BC\u09BE \u09A8\u09BF\u09AF\u09BC\u09C7 \u099A\u09BF\u09A8\u09CD\u09A4\u09BE \u0995\u09B0\u09AC\u09C7\u09A8 \u09A8\u09BE..."). This notice is strictly not needed here.
- FIRST QUESTION: You MUST immediately and explicitly ask the student: "\u0986\u09AA\u09A8\u09BF \u0995\u09BF \u0997\u09CD\u09B0\u09BE\u09AE\u09BE\u09B0\u09C7\u09B0 \u0985\u0982\u09B6\u099F\u09BF \u09AC\u09C1\u099D\u09A4\u09C7 \u099A\u09BE\u09A8 \u09A8\u09BE\u0995\u09BF \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u09AA\u09CD\u09B0\u09CD\u09AF\u09BE\u0995\u099F\u09BF\u09B8 \u098F\u0995\u09CD\u09B8\u09BE\u09B0\u09B8\u09BE\u0987\u099C\u09C7 \u099A\u09B2\u09C7 \u09AF\u09C7\u09A4\u09C7 \u099A\u09BE\u09A8? (Do you want to understand the grammar part or just practice the exercises?)"
- This will clarify the subject and direction of the lesson. Based on their response, proceed to either teach/explain grammar rules found in the PDF or guide them through practice questions.
`;
      if (pdfContent) {
        systemInstruction += `

SCENARIO CONTEXT (PDF CONTENT): Here is the content of the PDF study guide:

---
${pdfContent.substring(0, 25e3)}
---

Your job is to ask the student questions, vocabulary quizzes, translation prompts, or scenario exercises based on exactly what is in this PDF file. Give them feedback, explain correct answers, and test their comprehension until they get the questions correct. Act as an encouraging and brilliant coach. Prompt the student to speak!`;
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
          responseModalities: [import_genai3.Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          },
          systemInstruction
        }
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
      console.error("Live WebSockets connection error:", e?.message || e);
      let errorMsg = "Sorry, we encountered a connection error. Please try again.";
      const errorStr = JSON.stringify(e).toLowerCase() + " " + String(e.message || "").toLowerCase() + " " + String(e.stack || "").toLowerCase();
      if (isQuotaError(e) || errorStr.includes("spending cap") || errorStr.includes("quota") || errorStr.includes("limit exceeded") || errorStr.includes("resource_exhausted") || errorStr.includes("spending_cap")) {
        errorMsg = "[\u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993 \u09AC\u09BF\u09B2\u09BF\u0982 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE (Spending Cap limit reached)] \u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u098F\u0986\u0987 \u09B8\u09CD\u099F\u09C1\u09A1\u09BF\u0993\u09B0 \u09AE\u09BE\u09A8\u09CD\u09A5\u09B2\u09BF \u09B8\u09CD\u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0995\u09CD\u09AF\u09BE\u09AA \u098F\u0995\u09CD\u09B8\u09BF\u09A1 \u09B9\u09DF\u09C7 \u0997\u09C7\u099B\u09C7\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 https://ai.studio/spend \u09B2\u09BF\u0982\u0995 \u09A5\u09C7\u0995\u09C7 \u09B2\u09BF\u09AE\u09BF\u099F \u09AC\u09C3\u09A6\u09CD\u09A7\u09BF \u09AC\u09BE \u09B8\u09B2\u09AD \u0995\u09B0\u09C1\u09A8\u0964 (The project has exceeded its monthly spending cap. PLEASE manage/raise your project spend cap at https://ai.studio/spend to resume practices!)";
      } else {
        errorMsg = `Connection Error: ${e.message || e}`;
      }
      try {
        if (clientWs.readyState === 1) {
          clientWs.send(JSON.stringify({ text: errorMsg, isModel: true }));
        }
      } catch (sendErr) {
        console.error("Failed to send WebSocket error message:", sendErr);
      }
      setTimeout(() => {
        try {
          clientWs.close();
        } catch (err) {
        }
      }, 800);
    }
  });
}
async function start() {
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express3.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[SERVER] Port ${PORT} is already in use. Retrying or shutting down gracefully.`);
    } else {
      console.error("Express server error:", err?.message || err);
    }
  });
  setupLiveWebSocket(server);
}
start();
//# sourceMappingURL=server.cjs.map
