const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

// remove early return
const earlyReturn = `  if (!user && activeTab !== 'feed') {
    return (
      <div className="flex justify-center p-12 text-slate-800 dark:text-slate-100 flex-col items-center gap-4 h-full min-h-[500px]">
         <Heart className="w-12 h-12 text-emerald-500 opacity-50" />
         <p className="text-xl font-bold">Please log in to use this feature.</p>
      </div>
    );
  }`;

code = code.replace(earlyReturn, `// Auth checks handled inside the body for smooth nav experience`);

// Inside the Main Container, right before /* --- FRIEND REQUESTS LIST PANEL --- */
const mainContainerSplit = `        {/* Main Container */}
        <div className="w-full flex-1 flex flex-col gap-4 min-h-[500px]">`;

const mainContainerReplace = `        {/* Main Container */}
        <div className="w-full flex-1 flex flex-col gap-4 min-h-[500px]">
          {!user && activeTab !== 'feed' ? (
            <div className="flex justify-center p-12 text-slate-800 dark:text-slate-100 flex-col items-center justify-center gap-4 h-full min-h-[500px]">
               <Heart className="w-12 h-12 text-emerald-500/30" />
               <p className="text-xl font-bold font-bengali">এই ফিচারটি ব্যবহার করতে স্পোকেন গাইডে লগইন করুন</p>
               <button onClick={() => navigate('/login')} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all">লগইন করুন</button>
            </div>
          ) : (
            <>`;

const endingSplit = `        </div>
      </div>
    </div>
  );
};`;
const endingReplace = `          </>
          )}
        </div>
      </div>
    </div>
  );
};`;

code = code.replace(mainContainerSplit, mainContainerReplace);
code = code.replace(endingSplit, endingReplace);

// We should replace navigate('/login') with onAuthClick but handleAuth is not passed to SocialHub. Let's just do window.location.hash etc or nothing, just prompt. Actually, there's no /login route, the auth modal is opened onAuthClick. So we could just tell them to use the top-right button.
code = code.replace(`onClick={() => navigate('/login')} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all">লগইন করুন</button>`, 
`className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl opacity-0 pointer-events-none absolute">লগইন করুন</button>`);

// One more issue! If `!user` is true, what does `user.banned` do? It will crash if it's evaluated early.
// Oh `user?.banned` was already sed replaced but we couldn't run sed! So `user.banned` is still there.
// We need to replace user.banned with user?.banned! 
code = code.replace(`if (user.banned === 1) {`, `if (currentUser.banned === 1) {`);

fs.writeFileSync('src/components/SocialHub.tsx', code);
