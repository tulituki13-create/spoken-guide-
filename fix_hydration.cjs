const fs = require('fs');
let b = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
const replacement = {"smsText": "[sms_message]"};
b = b.replace(/<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">[\s\S]*?<\/h5>\s*<div className="text-\[11px\] text-slate-400 mt-1 lines-spaced"><\/div>\s*<div className="space-y-3">/g, replacement);
fs.writeFileSync('src/components/AdminPanel.tsx', b);