const fs = require('fs');
let code = fs.readFileSync('src/components/MyCreditCosts.tsx', 'utf8');
code = code.replace(/Bearer \$\{user\.token \? String\(user\.token\)\.trim\(\) : ''\}/g, "Bearer ${user.token ? String(user.token).replace(/[^\\x20-\\x7E]/g, '').trim() : ''}");
fs.writeFileSync('src/components/MyCreditCosts.tsx', code);
