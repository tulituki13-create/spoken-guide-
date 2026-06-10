const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

const oldEffect = `  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchFriends();
      fetchFriendRequests();
      fetchPeers();
      fetchLeaderboards();
      fetchGrammarScores();
    }
  }, [user?.username]);`;

const newEffect = `  useEffect(() => {
    // Always fetch public content
    fetchPosts();
    fetchLeaderboards();
    
    if (user) {
      fetchFriends();
      fetchFriendRequests();
      fetchPeers();
      fetchGrammarScores();
    }
  }, [user?.username]);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/SocialHub.tsx', code);
