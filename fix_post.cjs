const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

// The new post box condition:
const newPostBoxOld = `{activeTab === 'feed' && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border-2 border-slate-100 dark:border-slate-800/80 w-full hover:shadow-lg hover:border-emerald-500/20 transition-all duration-300">`;

const newPostBoxNew = `{activeTab === 'feed' && user && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border-2 border-slate-100 dark:border-slate-800/80 w-full hover:shadow-lg hover:border-emerald-500/20 transition-all duration-300">`;

// Add prompt to log in for posting:
const loginPromptForFeed = `{activeTab === 'feed' && !user && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center w-full">
                 <p className="text-slate-600 dark:text-slate-400 font-bold mb-4">অংশগ্রহণ করতে স্পোকেন গাইডে লগইন করুন</p>
              </div>
            )}`;

code = code.replace(newPostBoxOld, loginPromptForFeed + '\n            ' + newPostBoxNew);

fs.writeFileSync('src/components/SocialHub.tsx', code);
