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
`);

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  isPremium: boolean;
  chatTimeUsed: number;
  lastResetDate: string;
}

export function getUser(username: string): User | undefined {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) return undefined;
  return {
    ...user,
    isPremium: !!user.isPremium
  };
}

export function createUser(username: string, passwordHash: string) {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO users (id, username, passwordHash, isPremium, chatTimeUsed, lastResetDate) VALUES (?, ?, ?, 0, 0, ?)').run(
    id, username, passwordHash, new Date().toISOString().split('T')[0]
  );
  return id;
}

export function getAllUsers() {
  return db.prepare('SELECT id, username, isPremium, chatTimeUsed FROM users').all();
}

export function setUserPremium(id: string, isPremium: boolean) {
  db.prepare('UPDATE users SET isPremium = ? WHERE id = ?').run(isPremium ? 1 : 0, id);
}

export function updateChatTime(username: string, secondsUsed: number) {
  const today = new Date().toISOString().split('T')[0];
  const user = getUser(username);
  if (!user) return 0;

  if (user.lastResetDate !== today) {
    db.prepare('UPDATE users SET chatTimeUsed = ?, lastResetDate = ? WHERE username = ?').run(secondsUsed, today, username);
    return secondsUsed;
  } else {
    const newTime = user.chatTimeUsed + secondsUsed;
    db.prepare('UPDATE users SET chatTimeUsed = ? WHERE username = ?').run(newTime, username);
    return newTime;
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

export default db;
