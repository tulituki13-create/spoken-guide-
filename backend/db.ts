import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

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

// Programmatic schema adaptation for premium features
try {
  db.exec("ALTER TABLE users ADD COLUMN whatsapp TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN isWhatsappPublic INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN performanceScore INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN division TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN district TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 600;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN hiddenCredits INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN isScorePublic INTEGER DEFAULT 1;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN isProfilePublic INTEGER DEFAULT 1;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN lastActive INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN earnedPublicIncentive INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN education TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN occupation TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN skills TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN achievements TEXT DEFAULT '';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN name TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN gender TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN birthday TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN birthday_privacy TEXT DEFAULT 'public';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN school TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN class TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN religion TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN verified_badge INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN account_health INTEGER DEFAULT 100;");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN ban_appeal_status TEXT DEFAULT 'none';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN ban_appeal_text TEXT DEFAULT '';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN privacy_messages TEXT DEFAULT 'public';");
} catch (e) {}
try {
  db.exec("ALTER TABLE users ADD COLUMN verified_doc_id TEXT DEFAULT '';");
} catch (e) {}

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
} catch (e) {}

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
} catch (e) {}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ip_credits (
      ip TEXT PRIMARY KEY,
      credits INTEGER DEFAULT 150,
      lastResetDate TEXT
    );
  `);
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN profilePicture TEXT DEFAULT '';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN characteristics TEXT DEFAULT '{}';");
} catch (e) {}

try {
  db.exec("ALTER TABLE users ADD COLUMN custom_topics TEXT DEFAULT '[]';");
} catch (e) {}

try {
  db.exec("ALTER TABLE user_courses ADD COLUMN isConverted INTEGER DEFAULT 0;");
} catch (e) {}

try { db.exec("ALTER TABLE user_courses ADD COLUMN grammarScore INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE user_courses ADD COLUMN vocabularyScore INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE user_courses ADD COLUMN fluencyScore INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE user_courses ADD COLUMN pronunciationScore INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE user_courses ADD COLUMN confidenceScore INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE user_courses ADD COLUMN sentenceStructureScore INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE user_courses ADD COLUMN commonGrammarMistakes TEXT DEFAULT '';"); } catch (e) {}
try { db.exec("ALTER TABLE user_courses ADD COLUMN vocabularyGaps TEXT DEFAULT '';"); } catch (e) {}

try { db.exec("ALTER TABLE course_topics ADD COLUMN areasForImprovement TEXT DEFAULT '';"); } catch (e) {}
try { db.exec("ALTER TABLE course_topics ADD COLUMN actionsToAvoid TEXT DEFAULT '';"); } catch (e) {}

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
} catch (e) {}

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
} catch (e) {}

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

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  isPremium: boolean;
  chatTimeUsed: number;
  lastResetDate: string;
  whatsapp?: string;
  isWhatsappPublic?: boolean;
  performanceScore?: number;
  division?: string;
  district?: string;
  credits?: number;
  hiddenCredits?: number;
  isScorePublic?: boolean;
  isProfilePublic?: boolean;
  email?: string;
  earnedPublicIncentive?: boolean;
  education?: string;
  occupation?: string;
  bio?: string;
  skills?: string;
  achievements?: string;
  profilePicture?: string;
  
  name?: string;
  gender?: string;
  birthday?: string;
  birthday_privacy?: string;
  school?: string;
  class?: string;
  religion?: string;
  verified_badge?: number;
  banned?: number;
  account_health?: number;
  ban_appeal_status?: string;
  ban_appeal_text?: string;
  privacy_messages?: string;
  characteristics?: string;
  custom_topics?: string;
}

export function getUser(username: string): User | undefined {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) return undefined;
  
  const today = new Date().toISOString().split('T')[0];
  if (user.lastResetDate !== today) {
    const newCredits = user.isPremium ? 50000000 : 30000000;
    db.prepare('UPDATE users SET chatTimeUsed = 0, lastResetDate = ?, credits = ? WHERE username = ?').run(today, newCredits, username);
    user.lastResetDate = today;
    user.chatTimeUsed = 0;
    user.credits = newCredits;
  }
  
  return {
    ...user,
    isPremium: !!user.isPremium,
    isWhatsappPublic: !!user.isWhatsappPublic,
    whatsapp: user.whatsapp || '',
    performanceScore: typeof user.performanceScore === 'number' ? user.performanceScore : 0,
    division: user.division || '',
    district: user.district || '',
    credits: typeof user.credits === 'number' ? user.credits : 30000000,
    hiddenCredits: typeof user.hiddenCredits === 'number' ? user.hiddenCredits : 0,
    isScorePublic: typeof user.isScorePublic === 'number' ? user.isScorePublic === 1 : true,
    isProfilePublic: typeof user.isProfilePublic === 'number' ? user.isProfilePublic === 1 : true,
    email: user.email || '',
    earnedPublicIncentive: !!user.earnedPublicIncentive,
    education: user.education || '',
    occupation: user.occupation || '',
    bio: user.bio || '',
    skills: user.skills || '',
    achievements: user.achievements || '',
    profilePicture: user.profilePicture || '',
    
    name: user.name || '',
    gender: user.gender || '',
    birthday: user.birthday || '',
    birthday_privacy: user.birthday_privacy || 'public',
    school: user.school || '',
    class: user.class || '',
    religion: user.religion || '',
    verified_badge: typeof user.verified_badge === 'number' ? user.verified_badge : 0,
    banned: typeof user.banned === 'number' ? user.banned : 0,
    account_health: typeof user.account_health === 'number' ? user.account_health : 100,
    ban_appeal_status: user.ban_appeal_status || 'none',
    ban_appeal_text: user.ban_appeal_text || '',
    privacy_messages: user.privacy_messages || 'public',
    characteristics: user.characteristics || '{}',
    custom_topics: user.custom_topics || '[]'
  };
}

export function createUser(username: string, passwordHash: string) {
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO users (id, username, passwordHash, isPremium, chatTimeUsed, lastResetDate, whatsapp, isWhatsappPublic, performanceScore, division, district, credits, hiddenCredits, isScorePublic, isProfilePublic, email, earnedPublicIncentive, name, gender, birthday, birthday_privacy, school, class, religion, verified_badge, banned, account_health, ban_appeal_status, ban_appeal_text, privacy_messages) VALUES (?, ?, ?, 0, 0, ?, '', 0, 0, '', '', 30000000, 0, 1, 1, '', 0, '', '', '', 'public', '', '', '', 0, 0, 100, 'none', '', 'public')").run(
    id, username, passwordHash, new Date().toISOString().split('T')[0]
  );
  return id;
}

export function updatePremiumProfile(username: string, whatsapp: string, isWhatsappPublic: boolean) {
  db.prepare('UPDATE users SET whatsapp = ?, isWhatsappPublic = ? WHERE username = ?').run(
    whatsapp, isWhatsappPublic ? 1 : 0, username
  );
}

export function updateUserPersonalization(username: string, characteristics: string, custom_topics: string) {
  db.prepare('UPDATE users SET characteristics = ?, custom_topics = ? WHERE username = ?').run(
    characteristics, custom_topics, username
  );
}

export function updateUserProfileFull(
  username: string, 
  whatsapp: string, 
  isWhatsappPublic: boolean,
  division: string,
  district: string,
  isScorePublic: boolean,
  isProfilePublic: boolean,
  email: string,
  education: string = '',
  occupation: string = '',
  bio: string = '',
  skills: string = '',
  achievements: string = ''
) {
  const user = getUser(username);
  if (!user) return { creditBonus: 0, newCredits: 30000000 };

  let creditBonus = 0;
  let newEarnedIncentive = user.earnedPublicIncentive ? 1 : 0;

  // Toggle to public triggers 1000 credits bonus! 1 time limit
  if ((isScorePublic || isProfilePublic) && !user.earnedPublicIncentive) {
    creditBonus = 20000;
    newEarnedIncentive = 1;
  }

  const currentCreds = typeof user.credits === 'number' ? user.credits : 30000000;
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

export function searchPublicProfiles(query: string) {
  const likeQuery = `%${query}%`;
  const rows = db.prepare(`
    SELECT username, email, isPremium, whatsapp, isWhatsappPublic, division, district, performanceScore, credits, education, occupation, bio, skills, achievements
    FROM users 
    WHERE isProfilePublic = 1 
      AND (username LIKE ? OR email LIKE BINARY ?)
    LIMIT 20
  `).all(likeQuery, likeQuery) as any[];

  return rows.map(r => ({
    username: r.username,
    email: r.email || '',
    isPremium: !!r.isPremium,
    whatsapp: r.whatsapp || '',
    isWhatsappPublic: !!r.isWhatsappPublic,
    division: r.division || '',
    district: r.district || '',
    performanceScore: r.performanceScore || 0,
    credits: r.credits || 0,
    education: r.education || '',
    occupation: r.occupation || '',
    bio: r.bio || '',
    skills: r.skills || '',
    achievements: r.achievements || ''
  }));
}

export function redistributeInactiveHiddenCredits() {
  // Find at most 10 users with hiddenCredits > 0 who are considered inactive 
  // (We'll draft from users who have chatTimeUsed === 0 or lowest usage and have hiddenCredits > 0)
  const inactiveUsers = db.prepare(`
    SELECT id, username, hiddenCredits 
    FROM users 
    WHERE hiddenCredits > 0 
      AND username NOT IN (
        SELECT username FROM users ORDER BY performanceScore DESC LIMIT 10
      )
    ORDER BY chatTimeUsed ASC, lastResetDate ASC
    LIMIT 10
  `).all() as { id: string; username: string; hiddenCredits: number }[];

  if (inactiveUsers.length === 0) {
    return { success: false, message: "কোনো নিষ্ক্রিয় বা অনুন্নত প্রিমিয়াম মেম্বার পাওয়া যায়নি যাদের একাউন্টে হিডেন ক্রেডিট অবশিষ্ট আছে।" };
  }

  let totalPool = 0;
  for (const entry of inactiveUsers) {
    totalPool += entry.hiddenCredits;
    db.prepare('UPDATE users SET hiddenCredits = 0 WHERE id = ?').run(entry.id);
  }

  // Get top 10 public premium leaders who have isScorePublic = 1
  const leaders = db.prepare(`
    SELECT id, username, credits, performanceScore 
    FROM users 
    WHERE isPremium = 1 AND isScorePublic = 1
    ORDER BY performanceScore DESC 
    LIMIT 10
  `).all() as { id: string; username: string; credits: number; performanceScore: number }[];

  if (leaders.length === 0) {
    // Return them back to pool if no Premium leaderboard users exist
    return { success: true, message: `নিষ্ক্রিয় ব্যবহারকারীদের থেকে ${totalPool} হিডেন ক্রেডিট উত্তোলন করা হয়েছে, কিন্তু বন্টন করার মতো কোনো পাবলিক প্রিমিয়াম মেম্বার মেলেনি।` };
  }

  // Gradual weights distribution from Rank 1 to Rank 10
  const distributionPercentages = [40, 22, 14, 8, 6, 4, 3, 2, 1, 0]; // adds up to 100%
  let sumPercentage = 0;
  for (let i = 0; i < leaders.length; i++) {
    sumPercentage += distributionPercentages[i];
  }
  if (sumPercentage === 0) sumPercentage = 100;

  const results: { username: string; reward: number; prevCredits: number; newCredits: number }[] = [];

  for (let i = 0; i < leaders.length; i++) {
    const leader = leaders[i];
    const weight = distributionPercentages[i];
    const rawShare = (weight / sumPercentage) * totalPool;
    const reward = Math.round(rawShare);

    const prevCredits = leader.credits || 0;
    const newCredits = prevCredits + reward;

    db.prepare('UPDATE users SET credits = ? WHERE id = ?').run(newCredits, leader.id);

    results.push({
      username: leader.username,
      reward,
      prevCredits,
      newCredits
    });
  }

  return {
    success: true,
    message: `${inactiveUsers.length} জন নিষ্ক্রিয় ব্যবহারকারীর থেকে মোট ${totalPool} হিডেন ক্রেডিট কেটে নিয়ে টপ ${leaders.length} প্রিমিয়াম লিডারদের মধ্যে সফলভাবে বন্টন করা হয়েছে!`,
    totalPool,
    details: results
  };
}

export function updatePerformanceScore(username: string, score: number) {
  const user = getUser(username);
  if (!user) return;
  const currentBest = user.performanceScore || 0;
  if (score > currentBest) {
    db.prepare('UPDATE users SET performanceScore = ? WHERE username = ?').run(score, username);
  }
}

export function getTopPerformers() {
  const rows = db.prepare('SELECT username, isPremium, whatsapp, isWhatsappPublic, performanceScore, chatTimeUsed, division, district, credits, isScorePublic, education, occupation, bio, skills, achievements FROM users WHERE isScorePublic = 1 ORDER BY performanceScore DESC').all() as any[];
  return rows.map(r => ({
    username: r.username,
    isPremium: !!r.isPremium,
    whatsapp: r.whatsapp || '',
    isWhatsappPublic: !!r.isWhatsappPublic,
    performanceScore: typeof r.performanceScore === 'number' ? r.performanceScore : 0,
    chatTimeUsed: r.chatTimeUsed || 0,
    division: r.division || '',
    district: r.district || '',
    credits: r.credits || 0,
    isScorePublic: typeof r.isScorePublic === 'number' ? r.isScorePublic === 1 : true,
    education: r.education || '',
    occupation: r.occupation || '',
    bio: r.bio || '',
    skills: r.skills || '',
    achievements: r.achievements || ''
  }));
}

export function getAllUsers() {
  return db.prepare('SELECT id, username, isPremium, chatTimeUsed FROM users').all();
}

export function setUserPremium(id: string, isPremium: boolean) {
  if (isPremium) {
    db.prepare('UPDATE users SET isPremium = 1, credits = 10000, hiddenCredits = 1000 WHERE id = ?').run(id);
  } else {
    db.prepare('UPDATE users SET isPremium = 0 WHERE id = ?').run(id);
  }
}

export function updateChatTime(username: string, secondsUsed: number) {
  const user = getUser(username);
  if (!user) return 0;

  const newTime = user.chatTimeUsed + secondsUsed;
  db.prepare('UPDATE users SET chatTimeUsed = ? WHERE username = ?').run(newTime, username);
  return newTime;
}

export function deductCredits(username: string, tokensUsed: number, activity: string = "API Usage"): number {
  const user = getUser(username);
  if (!user) return 0;
  
  const currentCredits = typeof user.credits === 'number' ? user.credits : 30000000;
  const newCredits = Math.max(0, currentCredits - tokensUsed);
  
  db.prepare('UPDATE users SET credits = ? WHERE username = ?').run(newCredits, username);
  
  if (tokensUsed > 0) {
    try {
      const id = crypto.randomUUID();
      db.prepare('INSERT INTO credit_transactions (id, username, activity, amount, createdAt) VALUES (?, ?, ?, ?, ?)').run(id, username, activity, tokensUsed, new Date().toISOString());
    } catch (e) {
      console.error("Failed to log credit transaction:", e);
    }
  }

  return newCredits;
}

export function getCreditCosts(username: string) {
  try {
    return db.prepare('SELECT activity, SUM(amount) as totalCost, COUNT(*) as usageCount, MAX(createdAt) as lastUsed FROM credit_transactions WHERE username = ? GROUP BY activity ORDER BY totalCost DESC').all(username);
  } catch (e) {
    return [];
  }
}

export function getCreditTransactions(username: string) {
  try {
    return db.prepare('SELECT * FROM credit_transactions WHERE username = ? ORDER BY createdAt DESC LIMIT 100').all(username);
  } catch (e) {
    return [];
  }
}

export function saveMessage(username: string, message: string) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO messages (id, username, message, createdAt) VALUES (?, ?, ?, ?)').run(
    id, username, message, new Date().toISOString()
  );
}

export function getMessages() {
  return db.prepare('SELECT * FROM messages ORDER BY createdAt DESC').all();
}

export function replyToMessage(id: string, reply: string) {
  db.prepare('UPDATE messages SET reply = ? WHERE id = ?').run(reply, id);
}

export function getUserMessages(username: string) {
  return db.prepare('SELECT * FROM messages WHERE username = ? ORDER BY createdAt DESC').all();
}

export function saveHistoryRecord(username: string, record: any) {
  db.prepare(`
    INSERT INTO history_records (
      id, username, scenarioName, scenarioIcon, timestamp, duration,
      overallFeedback, spokenReview, practiceReview, learningPoints,
      fluencyScore, vocabularyScore, grammarScore, pronunciationScore
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id || crypto.randomUUID(),
    username,
    record.scenarioName || 'English Practice',
    record.scenarioIcon || '💬',
    record.timestamp || new Date().toLocaleDateString(),
    record.duration || 0,
    record.overallFeedback || '',
    record.spokenReview || '',
    record.practiceReview || '',
    JSON.stringify(record.learningPoints || []),
    record.fluencyScore || 0,
    record.vocabularyScore || 0,
    record.grammarScore || 0,
    record.pronunciationScore || 0
  );
}

export function getUserHistoryRecords(username: string) {
  const rows = db.prepare('SELECT * FROM history_records WHERE username = ?').all(username) as any[];
  return rows.map(r => ({
    id: r.id,
    scenarioName: r.scenarioName,
    scenarioIcon: r.scenarioIcon,
    timestamp: r.timestamp,
    duration: r.duration,
    overallFeedback: r.overallFeedback,
    spokenReview: r.spokenReview,
    practiceReview: r.practiceReview,
    learningPoints: JSON.parse(r.learningPoints || '[]'),
    fluencyScore: r.fluencyScore,
    vocabularyScore: r.vocabularyScore,
    grammarScore: r.grammarScore,
    pronunciationScore: r.pronunciationScore
  }));
}

export function clearUserHistoryRecords(username: string) {
  db.prepare('DELETE FROM history_records WHERE username = ?').run(username);
}

export function getIpCredits(ip: string): number {
  return 0; // Anonymous users will not receive any credit.
}

export function deductIpCredits(ip: string, secondsUsed: number): number {
  return 0;
}

// --- SOCIAL NETWORK FUNCTIONS ---

export function updateProfilePicture(username: string, base64Image: string) {
  db.prepare('UPDATE users SET profilePicture = ? WHERE username = ?').run(base64Image, username);
}

export function createPost(authorUsername: string, content: string, mediaUrl: string = '', originalPostId: string | null = null) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO posts (id, authorUsername, content, mediaUrl, createdAt, originalPostId) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, authorUsername, content, mediaUrl, new Date().toISOString(), originalPostId
  );
  return id;
}

export function getPosts(currentUsername?: string) {
  // Try to get all posts except from blocked users
  const q = currentUsername ? 
    `SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
      (SELECT COUNT(*) FROM posts WHERE originalPostId = p.id) as shareCount,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id AND authorUsername = ?) as userLiked,
      u.profilePicture as authorProfilePicture
     FROM posts p
     LEFT JOIN users u ON p.authorUsername = u.username
     WHERE p.authorUsername NOT IN (SELECT blockedUsername FROM blocks WHERE blockerUsername = ?)
     ORDER BY p.createdAt DESC LIMIT 50` :
    `SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
      (SELECT COUNT(*) FROM posts WHERE originalPostId = p.id) as shareCount,
      u.profilePicture as authorProfilePicture
     FROM posts p
     LEFT JOIN users u ON p.authorUsername = u.username
     ORDER BY p.createdAt DESC LIMIT 50`;
     
  return currentUsername ? db.prepare(q).all(currentUsername, currentUsername) : db.prepare(q).all();
}

export function getUserPosts(targetUsername: string, currentUsername?: string) {
  const q = currentUsername ? 
    `SELECT p.*,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id) as likeCount,
      (SELECT COUNT(*) FROM comments WHERE postId = p.id) as commentCount,
      (SELECT COUNT(*) FROM posts WHERE originalPostId = p.id) as shareCount,
      (SELECT COUNT(*) FROM likes WHERE postId = p.id AND authorUsername = ?) as userLiked,
      u.profilePicture as authorProfilePicture
     FROM posts p
     LEFT JOIN users u ON p.authorUsername = u.username
     WHERE p.authorUsername = ?
     ORDER BY p.createdAt DESC` :
    `SELECT p.*,
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

export function toggleLike(postId: string, username: string) {
  try {
    db.prepare('INSERT INTO likes (id, postId, authorUsername, createdAt) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(), postId, username, new Date().toISOString()
    );
    return true; // liked
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare('DELETE FROM likes WHERE postId = ? AND authorUsername = ?').run(postId, username);
      return false; // unliked
    }
    throw e;
  }
}

export function addComment(postId: string, username: string, content: string) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO comments (id, postId, authorUsername, content, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    id, postId, username, content, new Date().toISOString()
  );
  return id;
}

export function getComments(postId: string) {
  return db.prepare(`
    SELECT c.*, u.profilePicture as authorProfilePicture 
    FROM comments c
    LEFT JOIN users u ON c.authorUsername = u.username
    WHERE c.postId = ? 
    ORDER BY c.createdAt ASC
  `).all(postId);
}

export function sendDirectMessage(senderUsername: string, recipientUsername: string, content: string) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO direct_messages (id, senderUsername, recipientUsername, content, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    id, senderUsername, recipientUsername, content, new Date().toISOString()
  );
  return id;
}

export function getDirectMessages(user1: string, user2: string) {
  return db.prepare(`
    SELECT dm.*, u.profilePicture as senderProfilePicture
    FROM direct_messages dm
    LEFT JOIN users u ON dm.senderUsername = u.username
    WHERE (dm.senderUsername = ? AND dm.recipientUsername = ?)
       OR (dm.senderUsername = ? AND dm.recipientUsername = ?)
    ORDER BY dm.createdAt ASC
  `).all(user1, user2, user2, user1);
}

export function markMessagesAsRead(recipientUsername: string, senderUsername: string) {
  try {
    db.prepare('UPDATE direct_messages SET isRead = 1 WHERE recipientUsername = ? AND senderUsername = ? AND isRead = 0').run(recipientUsername, senderUsername);
  } catch(e) {}
}

export function updateUserActivity(username: string) {
  try {
    db.prepare('UPDATE users SET lastActive = ? WHERE username = ?').run(Date.now(), username);
  } catch(e) {}
}

export function getUserActivity(username: string) {
  try {
    const row: any = db.prepare('SELECT lastActive FROM users WHERE username = ?').get(username);
    return row ? row.lastActive : 0;
  } catch(e) {
    return 0;
  }
}

export function getChatPeers(username: string) {
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
  } catch(e) {
    return [];
  }
}

export function blockUser(blocker: string, blocked: string) {
  try {
    db.prepare('INSERT INTO blocks (id, blockerUsername, blockedUsername, createdAt) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(), blocker, blocked, new Date().toISOString()
    );
  } catch(e) {}
}

export function saveGrammarScore(username: string, topic: string, score: number, feedback: string, mistakes?: string) {
  const id = crypto.randomUUID();
  try {
    db.prepare(`
      INSERT INTO grammar_scores (id, username, topic, score, feedback, mistakes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, topic) DO UPDATE SET
        score = excluded.score,
        feedback = excluded.feedback,
        mistakes = excluded.mistakes,
        createdAt = excluded.createdAt
    `).run(id, username, topic, score, feedback, mistakes || null, new Date().toISOString());
  } catch (e) {
    try {
      db.prepare('DELETE FROM grammar_scores WHERE username = ? AND topic = ?').run(username, topic);
      db.prepare('INSERT INTO grammar_scores (id, username, topic, score, feedback, mistakes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        id, username, topic, score, feedback, mistakes || null, new Date().toISOString()
      );
    } catch (err) {
      console.error("Failed to save grammar score:", err);
    }
  }
}

try {
  db.exec("ALTER TABLE grammar_scores ADD COLUMN mistakes TEXT;");
} catch (e) {}

export function getGrammarScores(username: string) {
  try {
    return db.prepare('SELECT * FROM grammar_scores WHERE username = ?').all(username) as any[];
  } catch (e) {
    return [];
  }
}

try { db.exec("ALTER TABLE payment_requests ADD COLUMN amount INTEGER;"); } catch (e) {}
try { db.exec("ALTER TABLE payment_requests ADD COLUMN paymentTime TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE payment_requests ADD COLUMN screenshotUrl TEXT;"); } catch (e) {}

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
  } catch (e) {}

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
  const countRowPM = db.prepare("SELECT COUNT(*) as count FROM payment_methods").get() as any;
  if (!countRowPM || countRowPM.count === 0) {
    db.prepare(`
      INSERT INTO payment_methods (id, name, number, type)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), 'bKash', '017XXXXXXXX', 'Personal');
    db.prepare(`
      INSERT INTO payment_methods (id, name, number, type)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), 'Nagad', '019XXXXXXXX', 'Personal');
  }
} catch (e) {
  console.error("Error creating payment_methods table:", e);
}

export function getPaymentMethods() {
  try {
    return db.prepare('SELECT * FROM payment_methods').all() as any[];
  } catch (e) {
    return [];
  }
}

export function addPaymentMethod(name: string, number: string, type: string) {
  try {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO payment_methods (id, name, number, type) VALUES (?, ?, ?, ?)').run(id, name, number, type);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

export function updatePaymentMethod(id: string, name: string, number: string, type: string) {
  try {
    db.prepare('UPDATE payment_methods SET name = ?, number = ?, type = ? WHERE id = ?').run(name, number, type, id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

export function deletePaymentMethod(id: string) {
  try {
    db.prepare('DELETE FROM payment_methods WHERE id = ?').run(id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

export function getPlans() {
  try {
    return db.prepare('SELECT * FROM plans').all() as any[];
  } catch (e) {
    return [
      { id: 'free', name: 'Free Plan', price: 0, timeLimitSeconds: 300, pdfUploadAllowed: 0, whatsappAllowed: 0, scenarioPdfAllowed: 0, customFeatures: '["5 minutes speaking time limit", "Basic grammar topics practice", "Offline lessons access"]' },
      { id: 'premium', name: 'Premium Plan', price: 500, timeLimitSeconds: 3600, pdfUploadAllowed: 1, whatsappAllowed: 1, scenarioPdfAllowed: 1, customFeatures: '["60 minutes speaking time limit", "Direct PDF Handout Uploads", "Private WhatsApp Group Access", "Full tutor feedback loop"]' }
    ];
  }
}

export function updatePlan(id: string, name: string, price: number, timeLimitSeconds: number, pdfUploadAllowed: number, whatsappAllowed: number, scenarioPdfAllowed: number, customFeatures?: string) {
  try {
    db.prepare(`
      UPDATE plans 
      SET name = ?, price = ?, timeLimitSeconds = ?, pdfUploadAllowed = ?, whatsappAllowed = ?, scenarioPdfAllowed = ?, customFeatures = ?
      WHERE id = ?
    `).run(name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures || '[]', id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

export function addPlan(id: string, name: string, price: number, timeLimitSeconds: number, pdfUploadAllowed: number, whatsappAllowed: number, scenarioPdfAllowed: number, customFeatures?: string) {
  try {
    db.prepare(`
      INSERT INTO plans (id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures || '[]');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

export function deletePlan(id: string) {
  try {
    db.prepare('DELETE FROM plans WHERE id = ?').run(id);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || String(e) };
  }
}

export function getUserPlanFeatures(username: string) {
  const user = getUser(username);
  const plans = getPlans();
  const freePlan = plans.find(p => p.id === 'free') || { id: 'free', name: 'Free Plan', price: 0, timeLimitSeconds: 300, pdfUploadAllowed: 0, whatsappAllowed: 0, scenarioPdfAllowed: 0 };
  const premiumPlan = plans.find(p => p.id === 'premium') || { id: 'premium', name: 'Premium Plan', price: 500, timeLimitSeconds: 3600, pdfUploadAllowed: 1, whatsappAllowed: 1, scenarioPdfAllowed: 1 };
  
  if (user && user.isPremium) {
    return premiumPlan;
  }
  return freePlan;
}

// --- PAYMENTS & TRANSACTIONS ---

export function submitPaymentRequest(username: string, plan: string, transactionId: string, amount: number = 0, paymentTime: string = '', screenshotUrl: string = '') {
  const id = crypto.randomUUID();
  try {
    let initialStatus = 'pending';
    
    // Check if an SMS already arrived with this Transaction ID
    const pendingMsg = db.prepare(`SELECT * FROM admin_messages WHERE LOWER(extractedTrxId) = ? AND status = 'pending' LIMIT 1`).get(transactionId.trim().toLowerCase()) as any;
    
    if (pendingMsg) {
      initialStatus = 'approved';
      db.prepare(`UPDATE admin_messages SET status = 'matched' WHERE id = ?`).run(pendingMsg.id);
      db.prepare('UPDATE users SET isPremium = 1, credits = 10000, hiddenCredits = 1000 WHERE username = ?').run(username);
    }

    db.prepare(`
      INSERT INTO payment_requests (id, username, plan, transactionId, amount, paymentTime, screenshotUrl, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, plan, transactionId, amount, paymentTime, screenshotUrl, initialStatus, new Date().toISOString());
    return { success: true, message: initialStatus === 'approved' ? 'Payment matched and approved automatically!' : 'Payment submitted for review.' };
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'This transaction ID has already been submitted.' };
    }
    return { success: false, message: 'Error submitting payment request.' };
  }
}

export function saveAdminMessage(rawMessage: string, sender: string, extractedTrxId: string, extractedAmount: number, status: string) {
  try {
    // Prevent duplicate messages by checking for exact matches in the last 60 minutes
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
  } catch(e) {
    console.error("Error saving admin message:", e);
  }
}

export function getAdminMessages() {
  try {
    return db.prepare('SELECT * FROM admin_messages ORDER BY createdAt DESC LIMIT 100').all() as any[];
  } catch (e) {
    return [];
  }
}

export function getUserPaymentRequests(username: string) {
  try {
    return db.prepare('SELECT * FROM payment_requests WHERE username = ? ORDER BY createdAt DESC').all(username) as any[];
  } catch (e) {
    return [];
  }
}

export function getPendingPaymentRequests() {
  try {
    return db.prepare('SELECT * FROM payment_requests WHERE status = ?').all('pending') as any[];
  } catch (e) {
    return [];
  }
}

export function getAllPaymentRequests() {
  try {
    return db.prepare('SELECT * FROM payment_requests ORDER BY createdAt DESC').all() as any[];
  } catch (e) {
    return [];
  }
}

export function approvePaymentRequest(transactionId: string, realAmount?: number) {
  try {
    const cleanTrx = transactionId.trim().toLowerCase();
    const trx = db.prepare('SELECT * FROM payment_requests WHERE LOWER(transactionId) = ? AND status = ?').get(cleanTrx, 'pending') as any;
    if (trx) {
      if (realAmount && realAmount > 0) {
        db.prepare('UPDATE payment_requests SET status = ?, amount = ? WHERE LOWER(transactionId) = ?').run('approved', realAmount, cleanTrx);
      } else {
        db.prepare('UPDATE payment_requests SET status = ? WHERE LOWER(transactionId) = ?').run('approved', cleanTrx);
      }
      
      const purchaseCost = realAmount && realAmount > 0 ? realAmount : (trx.amount || 0);
      const pm = Number(getAdminSetting('profitMargin', '20')); const tokensPerTaka = Math.floor(1000000 / ((2.0 * 120) * (1 + pm / 100))); const creditsToAdd = purchaseCost > 0 ? purchaseCost * tokensPerTaka : 10000;
      
      // Upgrade user
      db.prepare('UPDATE users SET isPremium = 1, credits = credits + ?, hiddenCredits = hiddenCredits + 1000 WHERE username = ?').run(creditsToAdd, trx.username);
      return { success: true, matchedUsername: trx.username };
    }
    return { success: false };
  } catch (e) {
    return { success: false };
  }
}

export function getGrammarPros() {
  try {
    const rows = db.prepare(`
      SELECT u.username, u.isPremium, u.division, u.district, SUM(g.score) as totalGrammarScore, COUNT(g.id) as topicsCount, u.isScorePublic, u.school, u.class
      FROM users u
      JOIN grammar_scores g ON u.username = g.username
      WHERE u.isScorePublic = 1
      GROUP BY u.username
      ORDER BY totalGrammarScore DESC
      LIMIT 100
    `).all() as any[];
    return rows.map(r => ({
      username: r.username,
      isPremium: !!r.isPremium,
      division: r.division || '',
      district: r.district || '',
      totalGrammarScore: r.totalGrammarScore || 0,
      topicsCount: r.topicsCount || 0,
      school: r.school || '',
      class: r.class || ''
    }));
  } catch (e) {
    return [];
  }
}

export function editUserProfileExtended(
  username: string,
  name: string,
  gender: string,
  birthday: string,
  birthday_privacy: string,
  school: string,
  classVal: string,
  religion: string,
  privacyMessages: string
) {
  try {
    db.prepare(`
      UPDATE users
      SET name = ?, gender = ?, birthday = ?, birthday_privacy = ?, school = ?, class = ?, religion = ?, privacy_messages = ?
      WHERE username = ?
    `).run(name, gender, birthday, birthday_privacy, school, classVal, religion, privacyMessages, username);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function submitAppeal(username: string, explanation: string) {
  try {
    db.prepare(`
      UPDATE users
      SET ban_appeal_status = 'pending', ban_appeal_text = ?
      WHERE username = ?
    `).run(explanation, username);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function updateUserAfterVerification(
  username: string,
  verified: boolean,
  name?: string,
  gender?: string,
  birthday?: string,
  school?: string,
  classVal?: string,
  religion?: string,
  verifiedDocId?: string
) {
  try {
    const updates: string[] = [];
    const params: any[] = [];

    updates.push("verified_badge = ?");
    params.push(verified ? 1 : 0);

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (gender !== undefined) {
      updates.push("gender = ?");
      params.push(gender);
    }
    if (birthday !== undefined) {
      updates.push("birthday = ?");
      params.push(birthday);
    }
    if (school !== undefined) {
      updates.push("school = ?");
      params.push(school);
    }
    if (classVal !== undefined) {
      updates.push("class = ?");
      params.push(classVal);
    }
    if (religion !== undefined) {
      updates.push("religion = ?");
      params.push(religion);
    }
    if (verifiedDocId !== undefined) {
      updates.push("verified_doc_id = ?");
      params.push(verifiedDocId);
    }

    if (updates.length > 0) {
      params.push(username);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params);
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function verifyUserWithDocument(username: string, documentType: string) {
  try {
    db.prepare("UPDATE users SET verified_badge = 1 WHERE username = ?").run(username);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function isDocIdAlreadyVerified(docId: string, currentUsername: string): boolean {
  try {
    if (!docId || docId.trim() === '') return false;
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

export function getFriendRequests(username: string) {
  try {
    return db.prepare('SELECT * FROM friend_requests WHERE receiver = ? OR sender = ? ORDER BY createdAt DESC').all(username, username) as any[];
  } catch (e) {
    return [];
  }
}

export function sendFriendRequest(sender: string, receiver: string) {
  try {
    const id = crypto.randomUUID();
    const exists = db.prepare('SELECT id FROM friend_requests WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)').get(sender, receiver, receiver, sender) as any;
    if (exists) {
      return { success: false, message: 'Friend request relation already exists.' };
    }
    db.prepare('INSERT INTO friend_requests (id, sender, receiver, status, createdAt) VALUES (?, ?, ?, "pending", ?)')
      .run(id, sender, receiver, new Date().toISOString());
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export function updateFriendRequest(reqId: string, status: string) {
  try {
    db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run(status, reqId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function getFriends(username: string) {
  try {
    const rows = db.prepare('SELECT * FROM friend_requests WHERE (sender = ? OR receiver = ?) AND status = "accepted"').all(username, username) as any[];
    return rows.map(r => r.sender === username ? r.receiver : r.sender);
  } catch (e) {
    return [];
  }
}

// --- ANONYMOUS MATCHMAKER ---
export function joinAnonymousQueue(username: string) {
  try {
    db.prepare('DELETE FROM anonymous_queue WHERE username = ?').run(username);
    
    // Find if there is another user in the queue
    const otherUser = db.prepare('SELECT username FROM anonymous_queue ORDER BY joinedAt ASC LIMIT 1').get() as any;
    if (otherUser && otherUser.username !== username) {
      const roomId = crypto.randomUUID();
      db.prepare('DELETE FROM anonymous_queue WHERE username = ?').run(otherUser.username);
      db.prepare('INSERT INTO anonymous_rooms (id, user1, user2, createdAt, ended) VALUES (?, ?, ?, ?, 0)')
        .run(roomId, otherUser.username, username, Date.now());
      return { matched: true, roomId, peer: otherUser.username };
    } else {
      db.prepare('INSERT INTO anonymous_queue (username, joinedAt) VALUES (?, ?)').run(username, Date.now());
      return { matched: false };
    }
  } catch (e: any) {
    console.error("Error in joinAnonymousQueue:", e);
    return { matched: false, error: e.message };
  }
}

export function getAnonymousRoom(username: string) {
  try {
    return db.prepare('SELECT * FROM anonymous_rooms WHERE (user1 = ? OR user2 = ?) AND ended = 0 LIMIT 1').get(username, username) as any;
  } catch (e) {
    return null;
  }
}

export function leaveAnonymousQueue(username: string) {
  try {
    db.prepare('DELETE FROM anonymous_queue WHERE username = ?').run(username);
  } catch (e) {}
}

export function leaveAnonymousRoom(roomId: string) {
  try {
    db.prepare('UPDATE anonymous_rooms SET ended = 1 WHERE id = ?').run(roomId);
  } catch (e) {}
}

export function getAnonymousMessages(roomId: string) {
  try {
    return db.prepare('SELECT * FROM anonymous_messages WHERE roomId = ? ORDER BY createdAt ASC').all(roomId) as any[];
  } catch (e) {
    return [];
  }
}

export function sendAnonymousMessage(roomId: string, sender: string, content: string) {
  const id = crypto.randomUUID();
  try {
    const badWords = [
      'slut', 'bitch', 'asshole', 'bastard', 'idiot', 'fuck', 'shit', 'scam', 'retard',
      'খানকি', 'মাদারচোদ', 'বাল', 'কুত্তা', 'বালের', 'চোদ', 'চুদি', 'হারামি', 'শুয়োর', 'বেশ্যা'
    ];
    let isFlagged = 0;
    const lowerContent = content.toLowerCase();
    for (const word of badWords) {
      if (lowerContent.includes(word)) {
        isFlagged = 1;
        break;
      }
    }

    db.prepare('INSERT INTO anonymous_messages (id, roomId, senderAnonym, content, createdAt, isFlagged) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, roomId, sender, content, new Date().toISOString(), isFlagged);

    if (isFlagged === 1) {
      const user = getUser(sender);
      if (user) {
        const currentHealth = typeof user.account_health === 'number' ? user.account_health : 100;
        const newHealth = Math.max(0, currentHealth - 25);
        if (newHealth <= 0) {
          db.prepare('UPDATE users SET account_health = 0, banned = 1, isPremium = 0, credits = 0 WHERE username = ?').run(sender);
        } else {
          db.prepare('UPDATE users SET account_health = ? WHERE username = ?').run(newHealth, sender);
        }
      }
    }
    return { success: true, isFlagged: isFlagged === 1 };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function approveAppeal(username: string) {
  try {
    db.prepare('UPDATE users SET banned = 0, account_health = 100, ban_appeal_status = "none", ban_appeal_text = "" WHERE username = ?').run(username);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function rejectAppeal(username: string) {
  try {
    db.prepare('UPDATE users SET ban_appeal_status = "rejected" WHERE username = ?').run(username);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function getAppeals() {
  try {
    return db.prepare('SELECT username, ban_appeal_text, account_health, isPremium FROM users WHERE ban_appeal_status = "pending"').all() as any[];
  } catch (e) {
    return [];
  }
}

export function setVerifiedBadge(username: string, hasBadge: number) {
  try {
    db.prepare('UPDATE users SET verified_badge = ? WHERE username = ?').run(hasBadge, username);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function setAccountBannedState(username: string, isBanned: number) {
  try {
    db.prepare('UPDATE users SET banned = ? WHERE username = ?').run(isBanned, username);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function setAccountHealthVal(username: string, health: number) {
  try {
    db.prepare('UPDATE users SET account_health = ? WHERE username = ?').run(health, username);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function saveUserCourse(username: string, assessmentData: any, isConverted: number = 0) {
  try {
    const rawScore = assessmentData.overallScore || 0;
    let scoreNum = 0;
    if (typeof rawScore === 'number') {
      scoreNum = rawScore;
    } else {
      const match = String(rawScore).match(/^(\d+)/);
      scoreNum = match ? parseInt(match[1], 10) : 0;
    }

    const courseId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO user_courses (id, username, cefrLevel, overallScore, strengths, weaknesses, createdAt, isConverted, grammarScore, vocabularyScore, fluencyScore, pronunciationScore, confidenceScore, sentenceStructureScore, commonGrammarMistakes, vocabularyGaps)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      courseId,
      username,
      assessmentData.cefrLevel || '',
      scoreNum,
      typeof assessmentData.strengths === 'string' ? assessmentData.strengths : JSON.stringify(assessmentData.strengths || ''),
      typeof assessmentData.weaknesses === 'string' ? assessmentData.weaknesses : JSON.stringify(assessmentData.weaknesses || ''),
      new Date().toISOString(),
      isConverted,
      assessmentData.grammarScore || 0,
      assessmentData.vocabularyScore || 0,
      assessmentData.fluencyScore || 0,
      assessmentData.pronunciationScore || 0,
      assessmentData.confidenceScore || 0,
      assessmentData.sentenceStructureScore || 0,
      typeof assessmentData.commonGrammarMistakes === 'string' ? assessmentData.commonGrammarMistakes : JSON.stringify(assessmentData.commonGrammarMistakes || ''),
      typeof assessmentData.vocabularyGaps === 'string' ? assessmentData.vocabularyGaps : JSON.stringify(assessmentData.vocabularyGaps || '')
    );

    const learningPlan = assessmentData.recommendedLearningPlan || [];
    let stepIndex = 1;
    const stmt = db.prepare(`
      INSERT INTO course_topics (id, courseId, stepIndex, stepName, stepDescription, topicsToLearn, grammarTopics, areasForImprovement, actionsToAvoid, whyLearn, whatToGain, engagementInfo, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const step of learningPlan) {
      const topicId = crypto.randomUUID();
      stmt.run(
        topicId,
        courseId,
        stepIndex++,
        step.stepName || '',
        step.stepDescription || '',
        step.topicsToLearn || '',
        step.grammarTopics || '',
        step.areasForImprovement || '',
        step.actionsToAvoid || '',
        step.whyLearn || '',
        step.whatToGain || '',
        step.engagementInfo || '',
        new Date().toISOString()
      );
    }
    return { success: true, courseId };
  } catch (e) {
    console.error("Error saving user course:", e);
    return { success: false };
  }
}

export function convertUserCourseToActive(username: string) {
  try {
    db.prepare('UPDATE user_courses SET isConverted = 1 WHERE username = ?').run(username);
    return { success: true };
  } catch (e) {
    console.error("Error setting isConverted user course:", e);
    return { success: false };
  }
}

export function getUserCourse(username: string) {
  try {
    const course = db.prepare('SELECT * FROM user_courses WHERE username = ? ORDER BY createdAt DESC LIMIT 1').get(username) as any;
    if (!course) return null;

    const topics = db.prepare('SELECT * FROM course_topics WHERE courseId = ? ORDER BY stepIndex ASC').all(course.id) as any[];
    return {
      ...course,
      topics
    };
  } catch (e) {
    console.error("Error getting user course:", e);
    return null;
  }
}

export function updateTopicProgress(topicId: string, score: number) {
  try {
    const current = db.prepare('SELECT highestScore FROM course_topics WHERE id = ?').get(topicId) as any;
    if (current) {
      const newMax = Math.max(current.highestScore, score);
      const isCompleted = newMax >= 80 ? 1 : 0;
      db.prepare('UPDATE course_topics SET highestScore = ?, isCompleted = ? WHERE id = ?').run(newMax, isCompleted, topicId);
    }
  } catch (e) {
    console.error("Error upading topic progress", e);
  }
}

function splitTopicsByRules(str: string): string[] {
  let result: string[] = [];
  let current = '';
  let inParen = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') inParen++;
    if (char === ')') inParen = Math.max(0, inParen - 1);

    if (inParen === 0 && (char === ',' || char === ';')) {
      if (current.trim()) result.push(current.trim());
      current = '';
      continue;
    }

    if (inParen === 0 && str.substring(i, i + 5).toLowerCase() === ' and ') {
      if (current.trim()) result.push(current.trim());
      current = '';
      i += 4;
      continue;
    }

    current += char;
  }
  if (current.trim()) result.push(current.trim());

  return result.map(s => s.replace(/\.$/, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export function getOrCreateSubtopics(courseTopicId: string, grammarTopicsString: string) {
  try {
    const existing = db.prepare('SELECT * FROM course_subtopics WHERE courseTopicId = ? ORDER BY createdAt ASC').all(courseTopicId) as any[];
    if (existing.length > 0) {
      return existing;
    }

    let names: string[] = [];
    if (grammarTopicsString) {
      names = splitTopicsByRules(grammarTopicsString);
    }

    if (names.length === 0) {
      names = ["General Concept & Mastery", "Sentence Structure & Exercises", "Conversational Sandbox"];
    }

    const stmt = db.prepare('INSERT OR IGNORE INTO course_subtopics (id, courseTopicId, name, isCompleted, createdAt) VALUES (?, ?, ?, ?, ?)');
    for (const name of names) {
      if (name.trim()) {
        stmt.run(crypto.randomUUID(), courseTopicId, name.trim(), 0, new Date().toISOString());
      }
    }

    return db.prepare('SELECT * FROM course_subtopics WHERE courseTopicId = ? ORDER BY createdAt ASC').all(courseTopicId);
  } catch (e) {
    console.error("Error in getOrCreateSubtopics:", e);
    return [];
  }
}

export function completeSubtopic(subtopicId: string, courseTopicId: string) {
  try {
    // Mark subtopic as completed
    db.prepare('UPDATE course_subtopics SET isCompleted = 1 WHERE id = ?').run(subtopicId);

    // Fetch all subtopics for this topic to re-evaluate progress
    const allSubtopics = db.prepare('SELECT isCompleted FROM course_subtopics WHERE courseTopicId = ?').all(courseTopicId) as any[];
    if (allSubtopics.length > 0) {
      const completedCount = allSubtopics.filter(s => s.isCompleted === 1).length;
      const ratio = completedCount / allSubtopics.length;
      const percentInteger = Math.round(ratio * 100);

      // Save a highestScore indicating how many subtopics are completed
      // If 80% or more subtopics completed, unlock main topic
      const isCompleted = ratio >= 0.8 ? 1 : 0;
      db.prepare('UPDATE course_topics SET isCompleted = ?, highestScore = ? WHERE id = ?').run(isCompleted, percentInteger, courseTopicId);
    }
    return { success: true };
  } catch (e) {
    console.error("Error in completeSubtopic:", e);
    return { success: false };
  }
}

export function savePrepPdf(username: string, topic: string, pdfMarkdown: string) {
  const id = crypto.randomUUID();
  try {
    db.prepare(`
      INSERT INTO saved_prep_pdfs (id, username, topic, pdfMarkdown, createdAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(username, topic) DO UPDATE SET
        pdfMarkdown = excluded.pdfMarkdown
    `).run(id, username, topic, pdfMarkdown, new Date().toISOString());
  } catch (e) {
    console.error("Error saving prep PDF into DB", e);
  }
}

export function getPrepPdfByTopic(username: string, topic: string) {
  try {
    return db.prepare('SELECT * FROM saved_prep_pdfs WHERE username = ? AND topic = ?').get(username, topic) as any;
  } catch (e) {
    console.error("Error getting prep PDF by topic", e);
    return null;
  }
}

export function getPrepPdfByTopicOrId(username: string, idOrTopic: string) {
  try {
    return db.prepare('SELECT * FROM saved_prep_pdfs WHERE username = ? AND (id = ? OR topic = ?)').get(username, idOrTopic, idOrTopic) as any;
  } catch (e) {
    console.error("Error getPrepPdfByTopicOrId:", e);
    return null;
  }
}

export function updatePrepPdfPracticeScore(username: string, topic: string, score: number) {
  try {
    const current = db.prepare('SELECT highestPracticeScore FROM saved_prep_pdfs WHERE username = ? AND topic = ?').get(username, topic) as any;
    if (current) {
      const newMax = Math.max(current.highestPracticeScore, score);
      const isPracticeCompleted = newMax >= 80 ? 1 : 0;
      db.prepare('UPDATE saved_prep_pdfs SET highestPracticeScore = ?, isPracticeCompleted = ? WHERE username = ? AND topic = ?')
        .run(newMax, isPracticeCompleted, username, topic);
      
      // Keep course topic table updated if stepName matches 'topic'
      const activeCourse = db.prepare('SELECT id FROM user_courses WHERE username = ? ORDER BY createdAt DESC LIMIT 1').get(username) as any;
      if (activeCourse) {
        const matchingTopic = db.prepare('SELECT id, highestScore FROM course_topics WHERE courseId = ? AND stepName = ?').get(activeCourse.id, topic) as any;
        if (matchingTopic) {
          const courseNewMax = Math.max(matchingTopic.highestScore, score);
          const courseCompleted = courseNewMax >= 80 ? 1 : 0;
          db.prepare('UPDATE course_topics SET highestScore = ?, isCompleted = ? WHERE id = ?').run(courseNewMax, courseCompleted, matchingTopic.id);
        }
      }
    }
  } catch (e) {
    console.error("Error updating prep PDF practice score", e);
  }
}

export function getPrepPdfsForUser(username: string) {
  try {
    return db.prepare('SELECT * FROM saved_prep_pdfs WHERE username = ?').all(username) as any[];
  } catch (e) {
    console.error("Error listing prep PDFs for user", e);
    return [];
  }
}


export function getSubtopicName(subtopicId: string): string {
  try {
    const row = db.prepare('SELECT name FROM course_subtopics WHERE id = ?').get(subtopicId) as any;
    return row ? row.name : "";
  } catch (e) {
    return "";
  }
}

export function getSubtopicsForTopicId(topicId: string) {
  try {
    const topic = db.prepare('SELECT grammarTopics FROM course_topics WHERE id = ?').get(topicId) as any;
    if (!topic) return [];
    return getOrCreateSubtopics(topicId, topic.grammarTopics);
  } catch (e) {
    console.error("Error in getSubtopicsForTopicId", e);
    return [];
  }
}

export function getBannedUsers() {
  try {
    return db.prepare('SELECT username, account_health, isPremium, ban_appeal_status, ban_appeal_text FROM users WHERE banned = 1').all() as any[];
  } catch (e) {
    return [];
  }
}

export { db };
export default db;


try { db.exec('CREATE TABLE IF NOT EXISTS admin_settings(key TEXT PRIMARY KEY, value TEXT);'); } catch(e) {}

export function getAdminSetting(key: string, defaultValue: string = '') { try { const row = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get(key) as any; return row ? row.value : defaultValue; } catch(e) { return defaultValue; } }

export function setAdminSetting(key: string, value: string) { try { db.prepare('INSERT INTO admin_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value); } catch(e) {} }
