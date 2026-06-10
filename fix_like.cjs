const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

// For Like functionality
code = code.replace(`onClick={() => handleLike(post.id)}`, `onClick={() => user ? handleLike(post.id) : alert('লাইক দিতে লগইন করুন')}`);

// For Comment toggle
code = code.replace(`onClick={() => handleToggleComments(post.id)}`, `onClick={() => user ? handleToggleComments(post.id) : alert('কমেন্ট করতে লগইন করুন')}`);

fs.writeFileSync('src/components/SocialHub.tsx', code);
