const fs = require('fs'); 
let db = fs.readFileSync('backend/db.ts', 'utf8'); 
db += `

try { 
  db.exec("CREATE TABLE IF NOT EXISTS admin_settings(key TEXT PRIMARY KEY, value TEXT);"); 
} catch(e) {}

export function getAdminSetting(key: string, defaultValue: string = '') { 
  try { 
    const row = db.prepare('SELECT value FROM admin_settings WHERE key = ?').get(key) as any; 
    return row ? row.value : defaultValue; 
  } catch(e) { return defaultValue; } 
}

export function setAdminSetting(key: string, value: string) { 
  try { 
    db.prepare('INSERT INTO admin_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value); 
  } catch(e) {} 
}
`; 
fs.writeFileSync('backend/db.ts', db);
