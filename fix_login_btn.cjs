const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

code = code.replace(`className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl opacity-0 pointer-events-none absolute">লগইন করুন</button>`, 
`onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl outline-none shadow-md">উপরে গিয়ে লগইন মেনুতে চাপ দিন</button>`);

fs.writeFileSync('src/components/SocialHub.tsx', code);
