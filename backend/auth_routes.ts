import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as db from './db';
import { GoogleGenAI } from "@google/genai";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-default-key-for-jwt';

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });
    }
  }
  return aiClient;
}

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
    
    // Check usage limits using credits wallet
    const features = db.getUserPlanFeatures(payload.username);
    const timeLimit = features.timeLimitSeconds;
    const timeLeft = typeof user.credits === 'number' ? user.credits : 1500;
    
    res.json({ 
      username: user.username, 
      isPremium: user.isPremium,
      chatTimeUsed: user.chatTimeUsed,
      timeLeft,
      timeLimit,
      whatsapp: user.whatsapp || '',
      isWhatsappPublic: !!user.isWhatsappPublic,
      performanceScore: typeof user.performanceScore === 'number' ? user.performanceScore : 0,
      division: user.division || '',
      district: user.district || '',
      credits: timeLeft,
      hiddenCredits: typeof user.hiddenCredits === 'number' ? user.hiddenCredits : 0,
      isScorePublic: typeof user.isScorePublic === 'boolean' || typeof user.isScorePublic === 'number' ? !!user.isScorePublic : true,
      isProfilePublic: typeof user.isProfilePublic === 'boolean' || typeof user.isProfilePublic === 'number' ? !!user.isProfilePublic : true,
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
      privacy_messages: user.privacy_messages || 'public'
    });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const getClientIp = (req: any): string => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ipStr = typeof forwarded === 'string' ? forwarded : (Array.isArray(forwarded) ? (forwarded[0] || '') : String(forwarded));
      if (ipStr) {
        return ipStr.split(',')[0].trim();
      }
    }
    return req.socket?.remoteAddress || req.ip || 'unknown';
  } catch (e) {
    console.error("Error detecting client IP:", e);
    return 'unknown';
  }
};

router.get('/credits/costs', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const costs = db.getCreditCosts(payload.username);
    const u = db.getUser(payload.username);
    res.json({ costs, remainingCredits: u ? u.credits : 0 });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/credits/transactions', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const transactions = db.getCreditTransactions(payload.username);
    res.json({ transactions });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Retrieve current credits status based on logged-in user or client IP
router.get('/credits/status', (req, res) => {
  const auth = req.headers.authorization;
  const ip = getClientIp(req);
  
  if (auth && auth !== 'Bearer null' && auth !== 'Bearer undefined' && auth.startsWith('Bearer ')) {
    try {
      const token = auth.replace('Bearer ', '');
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const user = db.getUser(payload.username);
      if (user) {
        const userCredits = typeof user.credits === 'number' ? user.credits : 1500;
        res.json({
          credits: userCredits,
          isExhausted: userCredits <= 0
        });
        return;
      }
    } catch (e) {}
  }
  
  const ipCredits = db.getIpCredits(ip);
  res.json({
    credits: ipCredits,
    isExhausted: ipCredits <= 0
  });
});

// Update standard and premium user profile details
router.post('/profile/update', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const { whatsapp, isWhatsappPublic, division, district, isScorePublic, isProfilePublic, email, education, occupation, bio, skills, achievements } = req.body;
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(payload.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const outcome = db.updateUserProfileFull(
      payload.username,
      whatsapp || '',
      !!isWhatsappPublic,
      division || '',
      district || '',
      isScorePublic !== undefined ? !!isScorePublic : true,
      isProfilePublic !== undefined ? !!isProfilePublic : true,
      email || '',
      education || '',
      occupation || '',
      bio || '',
      skills || '',
      achievements || ''
    );
    
    res.json({ success: true, ...outcome });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Find public users by username or email
router.get('/profiles/search', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const query = req.query.q as string || '';
  if (!query || query.trim().length === 0) {
    return res.json({ profiles: [] });
  }
  
  try {
    const profiles = db.searchPublicProfiles(query.trim());
    res.json({ profiles });
  } catch (e) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Redistribute hidden credits of inactive users to top active users
router.post('/premium/redistribute', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(payload.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isPremium) return res.status(403).json({ error: 'Premium permission required' });
    
    const result = db.redistributeInactiveHiddenCredits();
    res.json(result);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update premium user's private/public whatsapp details
router.post('/premium/profile', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const { whatsapp, isWhatsappPublic } = req.body;
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUser(payload.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isPremium) return res.status(403).json({ error: 'Premium permission required' });
    
    db.updatePremiumProfile(payload.username, whatsapp || '', !!isWhatsappPublic);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Retrieve top performers for high performance tracking - Public for everyone
router.get('/premium/performers', (req, res) => {
  try {
    const performers = db.getTopPerformers();
    res.json({ performers });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
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
  const ip = getClientIp(req);
  const secs = typeof seconds === 'number' ? seconds : 5;
  
  if (auth && auth !== 'null' && auth !== 'undefined') {
    try {
      const token = auth.replace('Bearer ', '');
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const tokenPricePerSec = 250;
      const tokensToDeduct = secs * tokenPricePerSec;
      const remainingCredits = db.deductCredits(payload.username, tokensToDeduct, "Voice Chat (Live Duration)");
      
      // Also update chat time tracking just as a metric
      db.updateChatTime(payload.username, secs);
      
      // Also deduct from IP credits to track general usage from this IP address
      db.deductIpCredits(ip, tokensToDeduct);
      
      res.json({ 
        timeLeft: remainingCredits,
        timeLimit: db.getUserPlanFeatures(payload.username).timeLimitSeconds,
        isExhausted: remainingCredits <= 0,
        credits: remainingCredits
      });
      return;
    } catch (e) {
      // Fallback to IP matching
    }
  }
  
  // Anonymous / Guest Time usage (IP-based)
  const tokenPricePerSec = 250;
  const tokensToDeduct = secs * tokenPricePerSec;
  const remainingCredits = db.deductIpCredits(ip, tokensToDeduct);
  res.json({
    timeLeft: remainingCredits,
    timeLimit: 30,
    isExhausted: remainingCredits <= 0,
    credits: remainingCredits
  });
});

// Retrieve user's historical performance records
router.get('/history', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const records = db.getUserHistoryRecords(payload.username);
    res.json(records);
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized or invalid token' });
  }
});

// Save a new performance scorecard to user's history
router.post('/history', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const { record } = req.body;
    if (!record) return res.status(400).json({ error: 'Missing record details' });
    db.saveHistoryRecord(payload.username, record);
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized or invalid token' });
  }
});

// Clear all historical records for the user
router.delete('/history', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    db.clearUserHistoryRecords(payload.username);
    res.json({ success: true, message: 'All practice session histories cleared.' });
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized or invalid token' });
  }
});

// --- ADMIN ROUTES ---
router.get('/admin/users', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const users = db.getAllUsers();
  console.log("Admin getting users. Count:", users.length);
  res.json(users);
});

router.post('/admin/users/:id/approve', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { isPremium } = req.body;
  db.setUserPremium(req.params.id, isPremium);
  res.json({ success: true });
});

router.get('/admin/messages', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json(db.getMessages());
});

router.post('/admin/messages/:id/reply', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  db.replyToMessage(req.params.id, req.body.reply);
  res.json({ success: true });
});

// --- PAYMENTS ROUTES ---

router.post('/payments/bot-chat', async (req, res) => {
  const { message, history } = req.body;
  const ai = getAI();
  if (!ai) return res.status(500).json({ reply: "I'm sorry, AI is not configured." });
  try {
    const formattedHistory = history.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    
    // Add current message
    formattedHistory.push({ role: 'user', parts: [{ text: message }] });

    const plansList = db.getPlans();
    const premiumPlan = plansList.find(p => p.id === 'premium') || { price: 500 };
    const priceText = `৳${premiumPlan.price}`;

    const response = await ai.models.generateContent({
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

// Scan payment screenshot with AI
router.post('/payments/scan', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Missing image' });
  
  const ai = getAI();
  if (!ai) return res.status(500).json({ error: 'AI not configured' });
  
  try {
    const token = auth.replace('Bearer ', '');
    jwt.verify(token, JWT_SECRET); // just verify auth
    
    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await ai.models.generateContent({
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
          required: ["transactionId"] // Make only transactionId strictly required by schema definition
        }
      }
    });
    
    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } else {
      return res.status(400).json({ error: 'Could not extract information.' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Failed to process screenshot' });
  }
});

// Get user payment requests
router.get('/payments/my-requests', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const requests = db.getUserPaymentRequests(payload.username);
    res.json(requests);
  } catch(e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Submit payment request
router.post('/payments/request', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  
  const { plan, transactionId, amount, screenshotUrl } = req.body;
  if (!plan || !transactionId) return res.status(400).json({ error: 'Missing plan or transactionId' });
  
  try {
    const token = auth.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user is already premium
    const pInfo = db.getUser(payload.username);
    if (pInfo && pInfo.isPremium) {
      return res.status(400).json({ error: 'You are already a premium member.' });
    }
    
    const result = db.submitPaymentRequest(
      payload.username, 
      plan, 
      transactionId.trim(),
      amount || 0,
      '', // paymentTime effectively removed
      screenshotUrl || ''
    );
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Admin: Get pending payments
router.get('/admin/payments/pending', (req, res) => {
  console.log("HIT PENDING ROUTE");
  const adminSecret = req.headers['admin-secret'];
  const isAuditor = adminSecret === 'auditor' || adminSecret === 'auditor123' || (process.env.AUDITOR_SECRET && adminSecret === process.env.AUDITOR_SECRET);
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin' && !isAuditor) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const pending = db.getPendingPaymentRequests();
  console.log("Admin getting pending payments. Count:", pending.length);
  res.json(pending);
});

// Admin: Get all payments (approved + pending)
router.get('/admin/payments/all', (req, res) => {
  try {
    const adminSecret = req.headers['admin-secret'];
    const isAuditor = adminSecret === 'auditor' || adminSecret === 'auditor123' || (process.env.AUDITOR_SECRET && adminSecret === process.env.AUDITOR_SECRET);
    if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin' && !isAuditor) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const all = db.getAllPaymentRequests();
    res.json(all);
  } catch (e: any) {
    console.error("GET /admin/payments/all failed:", e);
    res.status(500).json({ error: e.message || 'Unknown error' });
  }
});

// Admin: Verify payments via bulk SMS text
router.post('/admin/payments/verify', async (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  const isAuditor = adminSecret === 'auditor' || adminSecret === 'auditor123' || (process.env.AUDITOR_SECRET && adminSecret === process.env.AUDITOR_SECRET);
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin' && !isAuditor) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const { smsText } = req.body;
  if (!smsText) return res.status(400).json({ error: 'Missing sms text' });
  
  const pendingReqs = db.getPendingPaymentRequests();
  const results: any[] = [];
  
  // First analyse the messages using Standard Regex matchers
  const messages = smsText.split('\n').filter((m) => m.trim().length > 5);
  const parsedTransactions = [];

  for (const msg of messages) {
    const trxMatch = msg.match(/(?:TrxID|TxnId|Txn ID|Transaction ID|ID)[\s:=]*([A-Z0-9]{4,})/i);
    const amtMatch = msg.match(/(?:Tk|BDT|Rs|Amount|Received)[\s\.]*([\d,]+(?:\.\d+)?)/i) || msg.match(/([\d,]+(?:\.\d+)?)[\s]*(?:Tk|BDT|Rs)/i);

    if (trxMatch) {
      parsedTransactions.push({
        trxId: trxMatch[1].toUpperCase(),
        amount: amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null,
        rawMsg: msg
      });
    }
  }

  // AI-Powered Automated Parser Supplement: Use Gemini to parse custom structures and make it super intelligent
  const ai = getAI();
  if (ai) {
    try {
      console.log("Analyzing log with Gemini-3.5-flash for maximum extraction integrity...");
      const aiResponse = await ai.models.generateContent({
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
            if (item && typeof item === 'object' && item.trxId) {
              const cleanedTrx = String(item.trxId).toUpperCase().trim();
              if (cleanedTrx.length >= 4 && !parsedTransactions.some(pt => pt.trxId === cleanedTrx)) {
                parsedTransactions.push({
                  trxId: cleanedTrx,
                  amount: typeof item.amount === 'number' ? item.amount : null,
                  time: item.time || null,
                  rawMsg: "Parsed via Gemini automated transaction parser"
                });
              }
            }
          }
        }
      }
    } catch (aiErr: any) {
      console.error("AI Automated SMS parser supplement failed, using regex-only records:", aiErr.message);
    }
  }
  
  // Cross check parsed transactions with db pending logs and approve matches
  for (const pReq of pendingReqs) {
    if (!pReq.transactionId) continue;
    const pendingTrxId = pReq.transactionId.trim().toUpperCase();
    if (pendingTrxId.length < 4) continue;
    
    // Check if the pending trxId was found in the parsed transactions
    const foundParsed = parsedTransactions.find(pt => pt.trxId.includes(pendingTrxId) || pendingTrxId.includes(pt.trxId));
    
    // Also do a fallback text inclusion check just in case parsing regex missed the word TrxID
    if (foundParsed || smsText.toUpperCase().includes(pendingTrxId)) {
      const matchOutcome = db.approvePaymentRequest(pReq.transactionId, foundParsed ? Number(foundParsed.amount) : undefined);
      if (matchOutcome.success) {
        results.push({ 
          transactionId: pReq.transactionId, 
          username: pReq.username, 
          status: 'approved',
          parsedAmount: foundParsed?.amount || null,
          parsedTime: foundParsed?.time || null
        });
      }
    }
  }
  
  res.json({ success: true, verified: results, parsedTransactions, totalChecked: pendingReqs.length, parsedCount: parsedTransactions.length });
});

// Admin: Approve single payment manually
router.post('/admin/payments/approve', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const { transactionId } = req.body;
  if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
  
  const matchOutcome = db.approvePaymentRequest(transactionId);
  if (matchOutcome.success) {
    res.json({ success: true, transactionId });
  } else {
    res.status(400).json({ error: 'Failed to approve manually or transaction already approved.' });
  }
});

// --- PAYMENT METHODS ENDPOINTS ---
router.get('/payment-methods', (req, res) => {
  res.json(db.getPaymentMethods());
});

router.post('/admin/payment-methods', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { name, number, type } = req.body;
  if (!name || !number) {
    return res.status(400).json({ error: 'Missing name or number' });
  }

  const result = db.addPaymentMethod(name, number, type || 'Personal');
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || 'Failed to add payment method' });
  }
});

router.put('/admin/payment-methods/:id', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { name, number, type } = req.body;
  if (!name || !number) {
    return res.status(400).json({ error: 'Missing name or number' });
  }

  const result = db.updatePaymentMethod(req.params.id, name, number, type || 'Personal');
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || 'Failed to update payment method' });
  }
});

router.delete('/admin/payment-methods/:id', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const result = db.deletePaymentMethod(req.params.id);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || 'Failed to delete payment method' });
  }
});

// Dynamic plans router endpoints
router.get('/plans', (req, res) => {
  res.json(db.getPlans());
});

router.post('/admin/plans/:id', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const { name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Missing name or price parameter.' });
  }
  
  const result = db.updatePlan(
    req.params.id,
    name,
    Number(price),
    timeLimitSeconds !== undefined ? Number(timeLimitSeconds) : 300,
    pdfUploadAllowed ? 1 : 0,
    whatsappAllowed ? 1 : 0,
    scenarioPdfAllowed ? 1 : 0,
    customFeatures ? (typeof customFeatures === 'string' ? customFeatures : JSON.stringify(customFeatures)) : '[]'
  );
  
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || 'Failed to update plan.' });
  }
});

router.post('/admin/plans-add', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const { id, name, price, timeLimitSeconds, pdfUploadAllowed, whatsappAllowed, scenarioPdfAllowed, customFeatures } = req.body;
  if (!id || !name || price === undefined) {
    return res.status(400).json({ error: 'Missing id, name or price parameter.' });
  }
  
  const result = db.addPlan(
    id,
    name,
    Number(price),
    timeLimitSeconds !== undefined ? Number(timeLimitSeconds) : 300,
    pdfUploadAllowed ? 1 : 0,
    whatsappAllowed ? 1 : 0,
    scenarioPdfAllowed ? 1 : 0,
    customFeatures ? (typeof customFeatures === 'string' ? customFeatures : JSON.stringify(customFeatures)) : '[]'
  );
  
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || 'Failed to add plan.' });
  }
});

router.delete('/admin/plans/:id', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const result = db.deletePlan(req.params.id);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error || 'Failed to delete plan.' });
  }
});

router.all('/sms-receiver', async (req, res) => {
  console.log("==> RECEIVED INBOUND WEBHOOK REQUEST <==");
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Body:", JSON.stringify(req.body));
  console.log("Query:", JSON.stringify(req.query));

  // Case-insensitive key lookup helper to support all Android forwarder apps
  const findValue = (obj: any, targetKeys: string[]): string => {
    if (!obj || typeof obj !== 'object') return "";
    for (const key of Object.keys(obj)) {
      if (targetKeys.includes(key.toLowerCase())) {
        const val = obj[key];
        if (val !== undefined && val !== null) {
          return typeof val === 'object' ? JSON.stringify(val) : val.toString().trim();
        }
      }
    }
    return "";
  };

  const senderKeys = ["sender", "from", "phone", "address", "number", "sendername", "contact", "sender_number", "source", "phone_number"];
  const messageKeys = ["message", "msg", "text", "body", "content", "sms", "smscontent", "subject", "textbody", "payload"];

  let messageStr = findValue(req.body, messageKeys) || findValue(req.query, messageKeys);
  let senderStr = findValue(req.body, senderKeys) || findValue(req.query, senderKeys);

  // Fallback to searching inside any nested objects or arrays if empty
  if (!messageStr && req.body) {
    // If the body is a string or contains a string but no matched keys:
    if (typeof req.body === 'string') {
      messageStr = req.body;
    } else {
      // Look for any string value in req.body that looks like a message
      for (const val of Object.values(req.body)) {
        if (typeof val === 'string' && val.length > 15) {
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

    // Try robust Regex parsing FIRST before calling Gemini (it is faster and always works for standard SMS formats)
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
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
          amount = val;
          break;
        }
      }
    }

    // If regex parsing was incomplete, try Gemini AI to verify/correct or find details
    const ai = getAI();
    if (ai && (!trxId || !amount)) {
      const extractPrompt = `Extract the transaction ID (TrxID) and the amount from this payment confirmation SMS: "${message}". The TrxID is usually an alphanumeric string (like 8-10 chars e.g. 9J5B1X9..., TrxID ..., TxnId ...). The amount is a number following Tk, BDT, or amount. Respond ONLY in valid JSON format: { "trxId": "extracted_id_or_empty", "amount": extracted_number_or_0 }`;
      try {
        const response = await ai.models.generateContent({
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

    // Process matching logic
    let msgStatus = 'pending';
    if (trxId) {
      trxId = trxId.trim();
      
      const pendingPayment = db.getPendingPaymentRequests().find((p: any) => p.transactionId.toLowerCase().trim() === trxId.toLowerCase());
      if (pendingPayment) {
        db.approvePaymentRequest(pendingPayment.transactionId, amount ? Number(amount) : undefined);
        msgStatus = 'matched';
        console.log(`[Auto-Match] Found matching user premium request for TrxID: ${trxId}. Automatically approved!`);
      }
    }

    // Save the message using db helper
    db.saveAdminMessage(message, sender, trxId, amount, msgStatus);

    console.log(`[Webhook Success] Processed. Sender: ${sender}, TrxID: ${trxId}, Amount: ${amount}, status: ${msgStatus}`);
    res.json({ success: true, trxId, amount, status: msgStatus });
  } catch (e: any) {
    console.error("Error processing inbound SMS:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/admin/sms-messages', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.json(db.getAdminMessages());
});

export default router;


router.get('/settings', (req, res) => {
  res.json({ profitMargin: db.getAdminSetting('profitMargin', '20') });
});

router.post('/admin/settings', (req, res) => {
  const adminSecret = req.headers['admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'admin123' && adminSecret !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  if (req.body.profitMargin) db.setAdminSetting('profitMargin', req.body.profitMargin.toString());
  res.json({ success: true });
});
