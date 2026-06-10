const fs = require('fs');

const code = fs.readFileSync('./src/components/CourseRoom.tsx', 'utf8');

const s1Match = code.match(/\{\/\* Personalized Test Results & Learning Details \*\/\}[\s\S]*?(?=\s*\{\/\* Sub-topics list \(Main Practice Gateway\) \*\/})/);
const s2Match = code.match(/\{\/\* Sub-topics list \(Main Practice Gateway\) \*\/\}[\s\S]*?(?=\s*<\/div>\s*\)\s*:\s*\(\s*\/\* Step 2: Mode choosing stage)/);

if (s1Match && s2Match) {
  const s1 = s1Match[0];
  const s2 = s2Match[0];
  
  const modifiedCode = code.replace(s1, '___PLACEHOLDER___').replace(s2, s1).replace('___PLACEHOLDER___', s2);
  fs.writeFileSync('./src/components/CourseRoom.tsx', modifiedCode);
  console.log('Swapped successfully');
} else {
  console.log('Could not find matches', { s1Found: !!s1Match, s2Found: !!s2Match });
}
