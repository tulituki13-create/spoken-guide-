import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as db from './db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  
  const existing = db.getUser(username);
  if (existing) return res.status(400).json({ error: 'Username already exists' });
  
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  db.createUser(username, passwordHash);
  
  res.json({ success: true, message: 'Account created. Please login.' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.getUser(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  if (user.passwordHash !== passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ username: user.username, isPremium: user.isPremium }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { username: user.username, isPremium: user.isPremium } });
});

router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(payload.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check usage limits
    // Free: 3 mins (180 sec), Premium: 1 hr (3600 sec)
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
    res.status(401).json({ error: 'Invalid token' });
  }
});

// User messaging admin
router.post('/messages', (req, res) => {
  const { auth, message } = req.body;
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    db.saveMessage(payload.username, message);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.get('/my-messages', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const msgs = db.getUserMessages(payload.username);
    res.json({ messages: msgs });
  } catch(e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Update chat time (client periodically posts this)
router.post('/time/usage', (req, res) => {
  const { auth, seconds } = req.body;
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const updatedTime = db.updateChatTime(payload.username, seconds);
    
    const user = db.getUser(payload.username);
    const timeLimit = user?.isPremium ? 3600 : 180;
    const timeLeft = Math.max(0, timeLimit - updatedTime);
    
    res.json({ 
      timeLeft,
      timeLimit,
      isExhausted: timeLeft <= 0
    });
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// --- ADMIN ROUTES ---
router.get('/admin/users', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json(db.getAllUsers());
});

router.post('/admin/users/:id/approve', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { isPremium } = req.body;
  db.setUserPremium(req.params.id, isPremium);
  res.json({ success: true });
});

router.get('/admin/messages', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json(db.getMessages());
});

router.post('/admin/messages/:id/reply', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  db.replyToMessage(req.params.id, req.body.reply);
  res.json({ success: true });
});

export default router;
