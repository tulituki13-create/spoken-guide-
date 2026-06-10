const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

// replace "if (!user) {" with our custom logic
const oldIfUser = `  if (!user) {
    return (
      <div className="flex justify-center p-12 text-slate-800 dark:text-slate-100">
        <p className="text-xl font-bold">Please log in to participate in the Social Hub.</p>
      </div>
    );
  }`;

const newIfUser = `  if (!user && activeTab !== 'feed') {
    return (
      <div className="flex justify-center p-12 text-slate-800 dark:text-slate-100 flex-col items-center gap-4 h-full min-h-[500px]">
         <Heart className="w-12 h-12 text-emerald-500 opacity-50" />
         <p className="text-xl font-bold">Please log in to use this feature.</p>
      </div>
    );
  }
  
  const currentUser = user || { username: 'guest', profilePicture: '', name: 'Guest User' };
`;

code = code.replace(oldIfUser, newIfUser);

// Now change `user` usages in the render block to use currentUser or user? where appropriate.
// Since we have currentUser, let's just replace `user.` with `currentUser.` in the returned JSX.
// We can find where the JSX starts:
const jsxStart = code.indexOf(`return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto overflow-x-hidden"`);

let topPart = code.substring(0, jsxStart);
let bottomPart = code.substring(jsxStart);

bottomPart = bottomPart.replace(/user\./g, 'currentUser.');
// Also targetProfile === user.username -> targetProfile === currentUser.username

// One more place: {user ? ( ... ) : ... } might be fine, but we need to check if there are any specific conditions
bottomPart = bottomPart.replace(/\{\!user \?/g, '{!currentUser.username ?'); // wait, user is an object.
// let's just let currentUser handle everything. 

fs.writeFileSync('src/components/SocialHub.tsx', topPart + bottomPart);
