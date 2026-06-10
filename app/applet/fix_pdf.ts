const fs = require('fs');

let code = fs.readFileSync('./src/components/CourseRoom.tsx', 'utf8');

// Fix pagination logic
code = code.replace(
  /if \(current\.contentDiv\.scrollHeight > 910 && contentBody\.children\.length > 1\) {/g,
  'if (current.contentDiv.scrollHeight > current.contentDiv.clientHeight && contentBody.children.length > 1) {'
);

// Fix color correction inside PDF
code = code.replace(
  '<span style="font-size: 13px !important; font-weight: 900 !important; letter-spacing: 0.12em !important; text-transform: uppercase !important; color: #ffeb3b !important; background: rgba(255, 255, 255, 0.15) !important; padding: 5px 10px !important; border-radius: 6px !important;">',
  '<span style="font-size: 13px !important; font-weight: 900 !important; letter-spacing: 0.12em !important; text-transform: uppercase !important; color: #ffeb3b !important; background: rgba(255, 255, 255, 0.15) !important; padding: 5px 10px !important; border-radius: 6px !important;">'
); // wait, let's just do a regex replace for the header block to add background-color: transparent

const headerRegex = /<div style="background: linear-gradient([\s\S]*?)<\/div>\s*<\/div>/g;
// Actually, it's easier to just use string replace.
code = code.replace(
  `color: #ffffff !important; line-height: 1.3 !important;">\${topic?.stepName`, 
  `background-color: transparent !important; color: #ffffff !important; line-height: 1.3 !important;">\${topic?.stepName`
);

code = code.replace(
  `color: #e0e7ff !important; font-weight: 500 !important; line-height: 1.4 !important;">আপনার`,
  `background-color: transparent !important; color: #e0e7ff !important; font-weight: 500 !important; line-height: 1.4 !important;">আপনার`
);

// span 1
code = code.replace(
  `<span style="font-size: 13px !important; font-weight: 900 !important; letter-spacing: 0.12em !important; text-transform: uppercase`,
  `<span style="background-color: transparent !important; font-size: 13px !important; font-weight: 900 !important; letter-spacing: 0.12em !important; text-transform: uppercase`
);

// span 2
code = code.replace(
  `span style="font-size: 13px !important; font-weight: bold !important; color: #cbd5e1 !important;">\${new Date`,
  `span style="background-color: transparent !important; font-size: 13px !important; font-weight: bold !important; color: #cbd5e1 !important;">\${new Date`
);

// We should also remove background-color: #ffffff !important from contentDiv and instead put it ONLY on pageEl ?
// Wait, pageEl has background-color: #ffffff !important. 
// If contentDiv has background-color: transparent !important, html2canvas won't paint white backgrounds behind the text!
code = code.replace(
  `background-color: #ffffff !important;\n          color: #1e293b !important;\n        \`;\n\n        // Academic Header Layout`,
  `background-color: transparent !important;\n          color: #1e293b !important;\n        \`;\n\n        // Academic Header Layout`
);

fs.writeFileSync('./src/components/CourseRoom.tsx', code);
console.log('Fixed pagination logic and header background colors.');
