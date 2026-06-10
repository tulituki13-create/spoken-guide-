const fs = require('fs');
let b = fs.readFileSync('src/components/MyCreditCosts.tsx', 'utf8');

b = b.replace(
  'usageCountDisplay: `${c.usageCountDisplay || `${c.usageCountDisplay || }`}`',
  'usageCountDisplay: `${c.usageCount || 0} transactions`'
);

fs.writeFileSync('src/components/MyCreditCosts.tsx', b);
