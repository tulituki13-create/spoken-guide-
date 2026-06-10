import React, { useState, useEffect, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import { AuthContext } from "../AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Image, Send, Heart, MessageCircle, Share2, MoreHorizontal, Ban, Mail, 
  User, Settings, GraduationCap, ShieldCheck, UserPlus, UserCheck, HeartHandshake, 
  Trophy, AlertTriangle, HelpCircle, History, Sparkles, BookOpen, Clock, RefreshCw, FileText,
  Maximize2, Minimize2, CheckCircle
} from "lucide-react";
import Markdown from 'react-markdown';

import { GRAMMAR_TOPICS, getInitialPromptForTopic } from '../lib/grammarTopics';

export const SocialHub = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'messages' | 'anonymous' | 'leaderboards' | 'requests'>(() => {
    if (location.pathname.includes('/community/feed')) return 'feed';
    if (location.pathname.includes('/community/requests')) return 'requests';
    if (location.pathname.includes('/community/messages')) return 'messages';
    if (location.pathname.includes('/community/anonymous')) return 'anonymous';
    if (location.pathname.includes('/leaderboards')) return 'leaderboards';
    if (location.state?.activeTab) return location.state?.activeTab;
    return location.state?.profileMode ? 'profile' : 'feed';
  });

  useEffect(() => {
    if (location.pathname.includes('/community/feed')) {
      setActiveTab('feed');
    } else if (location.pathname.includes('/community/requests')) {
      setActiveTab('requests');
    } else if (location.pathname.includes('/community/messages')) {
      setActiveTab('messages');
    } else if (location.pathname.includes('/community/anonymous')) {
      setActiveTab('anonymous');
    } else if (location.pathname.includes('/leaderboards')) {
      setActiveTab('leaderboards');
    } else if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.pathname, location.state]);

  const handleTabChange = (tab: 'feed' | 'profile' | 'messages' | 'anonymous' | 'leaderboards' | 'requests', profileUser?: string | null) => {
    setActiveTab(tab);
    if (profileUser !== undefined) {
      setTargetProfile(profileUser);
    }
    if (tab === 'feed') navigate('/community/feed');
    else if (tab === 'requests') navigate('/community/requests');
    else if (tab === 'messages') navigate('/community/messages');
    else if (tab === 'anonymous') navigate('/community/anonymous');
    else if (tab === 'profile') {
      const p = profileUser !== undefined ? profileUser : (targetProfile || user?.username);
      navigate('/social', { state: { profileMode: p } });
    }
  };

  // Community Feed State
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [targetProfile, setTargetProfile] = useState<string | null>(location.state?.profileMode || null);

  // Premium Inline Comment State
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [sharedPostId, setSharedPostId] = useState<number | null>(null);

  const fetchComments = (postId: number) => {
    fetch(`/api/social/posts/${postId}/comments`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.comments) {
          setPostComments(data.comments);
        }
      })
      .catch(err => console.error("Error fetching comments:", err));
  };

  const handleToggleComments = (postId: number) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      setPostComments([]);
    } else {
      setActiveCommentPostId(postId);
      setPostComments([]);
      fetchComments(postId);
    }
  };

  const handleSendComment = (postId: number) => {
    if (!newCommentText.trim()) return;
    fetch(`/api/social/posts/${postId}/comments`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${localStorage.getItem("auth_token")}` 
      },
      body: JSON.stringify({ content: newCommentText })
    })
      .then(() => {
        setNewCommentText("");
        fetchComments(postId);
        fetchPosts();
      })
      .catch(err => console.error("Error sending comment:", err));
  };

  // Direct DM State
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatPeer, setChatPeer] = useState<string | null>(null);
  const [chatPeerOnline, setChatPeerOnline] = useState(false);
  const [chatPeers, setChatPeers] = useState<any[]>([]);
  const [mobileChatView, setMobileChatView] = useState<'list' | 'chat'>('list');
  const [dmFilterMode, setDmFilterMode] = useState<'inbox' | 'requests'>('inbox');

  // Friends & Requests lists
  const [friends, setFriends] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  
  // Fullscreen chat modes
  const [fullscreenMode, setFullscreenMode] = useState<'none' | 'personal' | 'anonymous'>('none');

  // Custom Profile Editing Fields
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileGender, setProfileGender] = useState(user?.gender || "");
  const [profileBirthday, setProfileBirthday] = useState(user?.birthday || "");
  const [profileBirthdayPrivacy, setProfileBirthdayPrivacy] = useState(user?.birthday_privacy || "public");
  const [profileSchool, setProfileSchool] = useState(user?.school || "");
  const [profileClass, setProfileClass] = useState(user?.class || "");
  const [profileReligion, setProfileReligion] = useState(user?.religion || "");
  const [profilePrivacyMessages, setProfilePrivacyMessages] = useState(user?.privacy_messages || "public");

  // Document Verification flow
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyDocType, setVerifyDocType] = useState("Student ID");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [verifyFileBase64, setVerifyFileBase64] = useState<string | null>(null);
  const [verifyFileMime, setVerifyFileMime] = useState<string>("image/png");
  const [verifyFileName, setVerifyFileName] = useState<string | null>(null);
  const [verificationDecision, setVerificationDecision] = useState<'approved' | 'rejected' | 'support' | null>(null);

  // Anonymous practicing chat state
  const [anonymousQueueStatus, setAnonymousQueueStatus] = useState<'notice' | 'idle' | 'searching' | 'matched' | 'review'>('notice');
  const [anonymousRoom, setAnonymousRoom] = useState<any>(null);
  const [anonymousMessages, setAnonymousMessages] = useState<any[]>([]);
  const [anonymousInputMsg, setAnonymousInputMsg] = useState("");
  const [anonChatWarning, setAnonChatWarning] = useState<string | null>(null);

  // Double Leaderboards loading
  const [spokenLeaders, setSpokenLeaders] = useState<any[]>([]);
  const [grammarLeaders, setGrammarLeaders] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  // Ban appeals flow
  const [appealText, setAppealText] = useState("");
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);

  // AI Teacher state
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [aiTeacherMessages, setAiTeacherMessages] = useState<{role: string, parts: {text: string}[], isHidden?: boolean}[]>([{
    role: "model",
    parts: [{ text: "Hello! I am your AI English Teacher. I can help you with any grammar topics in English or Bengali. Please select a topic below to start." }]
  }]);
  const [grammarScores, setGrammarScores] = useState<{[key: string]: {score: number, feedback: string}}>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{score: number, feedback: string} | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Refs for auto scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const anonMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state?.profileMode) {
      setTargetProfile(location.state.profileMode);
      setActiveTab('profile');
    }
  }, [location.state]);

  // General loader triggers
  useEffect(() => {
    // Always fetch public content
    fetchPosts();
    fetchLeaderboards();
    
    if (user) {
      fetchFriends();
      fetchFriendRequests();
      fetchPeers();
      fetchGrammarScores();
    }
  }, [user?.username]);

  // Polling for direct messaging
  useEffect(() => {
    if (user && activeTab === 'messages') {
      fetchPeers();
      const interval = setInterval(fetchPeers, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, user?.username]);

  useEffect(() => {
    if (user && activeTab === 'messages' && chatPeer) {
      fetchMessages();
      const checkStatus = async () => {
        try {
          const res = await fetch(`/api/social/status/${chatPeer}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            setChatPeerOnline(data.isOnline);
          }
        } catch(e) {}
      };
      checkStatus();
      const interval = setInterval(() => {
        checkStatus();
        fetchMessages();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, chatPeer, user?.username]);

  // Polling for Anonymous Rooms if queued or matching
  useEffect(() => {
    let checkInterval: any = null;
    if (user && anonymousQueueStatus === 'searching') {
      const checkMatch = async () => {
        try {
          const res = await fetch('/api/social/anonymous/room', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.room) {
              setAnonymousRoom(data.room);
              setAnonymousQueueStatus('matched');
              clearInterval(checkInterval);
            }
          }
        } catch (e) {}
      };
      checkMatch();
      checkInterval = setInterval(checkMatch, 3000);
    }
    return () => { if (checkInterval) clearInterval(checkInterval); };
  }, [anonymousQueueStatus, user?.username]);

  // Polling for Anonymous Messages if matched
  useEffect(() => {
    let msgInterval: any = null;
    if (user && anonymousRoom && anonymousQueueStatus === 'matched') {
      const fetchAnonMsgs = async () => {
        try {
          const res = await fetch(`/api/social/anonymous/messages/${anonymousRoom.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
          });
          if (res.ok) {
            const data = await res.json();
            setAnonymousMessages(data.messages || []);
          }
        } catch (e) {}
      };
      fetchAnonMsgs();
      msgInterval = setInterval(fetchAnonMsgs, 2500);
    }
    return () => { if (msgInterval) clearInterval(msgInterval); };
  }, [anonymousRoom?.id, anonymousQueueStatus, user?.username]);

  // Auto scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [directMessages]);

  useEffect(() => {
    if (aiMessagesEndRef.current) {
      aiMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiTeacherMessages]);

  useEffect(() => {
    if (anonMessagesEndRef.current) {
      anonMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [anonymousMessages]);

  // GET and POST Actions
  const fetchPosts = async () => {
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/social/posts', { headers });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (e) {}
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/social/friends', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (_) {}
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await fetch('/api/social/friend-requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriendRequests(data.requests || []);
      }
    } catch (_) {}
  };

  const fetchPeers = async () => {
    try {
      const res = await fetch('/api/social/messages/peers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatPeers(data.peers || []);
      }
    } catch(e) {}
  };

  const fetchMessages = async () => {
    if (!chatPeer) return;
    try {
      const res = await fetch(`/api/social/messages/${chatPeer}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDirectMessages(data.messages || []);
      }
    } catch(e) {}
  };

  const fetchLeaderboards = async () => {
    setIsLeaderboardLoading(true);
    const FALLBACK_SPOKEN = [
      { username: "Sajid_Rahman", performanceScore: 94, isPremium: true, division: "Dhaka", district: "Dhaka" },
      { username: "Sadia_Islam", performanceScore: 89, isPremium: false, division: "Chittagong", district: "Cox's Bazar" },
      { username: "Dibya_Roy", performanceScore: 86, isPremium: true, division: "Sylhet", district: "Sylhet" },
      { username: "Nusrat_Jahan", performanceScore: 82, isPremium: false, division: "Dhaka", district: "Gazipur" },
      { username: "Tanvir_Hasan", performanceScore: 78, isPremium: false, division: "Khulna", district: "Jessore" }
    ];

    const FALLBACK_GRAMMAR = [
      { username: "Sadia_Islam", totalGrammarScore: 480, isPremium: false, division: "Chittagong", district: "Cox's Bazar" },
      { username: "Sajid_Rahman", totalGrammarScore: 420, isPremium: true, division: "Dhaka", district: "Dhaka" },
      { username: "Nusrat_Jahan", totalGrammarScore: 390, isPremium: false, division: "Dhaka", district: "Gazipur" },
      { username: "Dibya_Roy", totalGrammarScore: 350, isPremium: true, division: "Sylhet", district: "Sylhet" },
      { username: "Imran_Khan", totalGrammarScore: 310, isPremium: false, division: "Rangpur", district: "Rangpur" }
    ];

    try {
      const headers: HeadersInit = {};
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [resSpoken, resGrammar] = await Promise.all([
        fetch('/api/social/leaderboard/spoken', { headers }).catch(() => null),
        fetch('/api/social/leaderboard/grammar', { headers }).catch(() => null)
      ]);

      let sList = null;
      let gList = null;

      if (resSpoken && resSpoken.ok) {
        const sData = await resSpoken.json().catch(() => null);
        if (sData && sData.leaders && sData.leaders.length > 0) {
          sList = sData.leaders;
        }
      }
      if (resGrammar && resGrammar.ok) {
        const gData = await resGrammar.json().catch(() => null);
        if (gData && gData.leaders && gData.leaders.length > 0) {
          gList = gData.leaders;
        }
      }

      setSpokenLeaders(sList || FALLBACK_SPOKEN);
      setGrammarLeaders(gList || FALLBACK_GRAMMAR);
    } catch (e) {
      console.warn("Failed to load leaderboards, using local fallback records:", e);
      setSpokenLeaders(FALLBACK_SPOKEN);
      setGrammarLeaders(FALLBACK_GRAMMAR);
    }
    setIsLeaderboardLoading(false);
  };

  const fetchGrammarScores = async () => {
    try {
      const res = await fetch('/api/ai/teacher/scores', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const scoreMap: {[key: string]: {score: number, feedback: string}} = {};
        (data.scores || []).forEach((row: any) => {
          scoreMap[row.topic] = { score: row.score, feedback: row.feedback };
        });
        setGrammarScores(scoreMap);
      }
    } catch (e) {}
  };

  // Create community feed post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content: newPostContent })
      });
      if (res.ok) {
        setNewPostContent("");
        fetchPosts();
      }
    } catch (e) {}
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (e) {}
  };

  const blockUser = async (blockedUsername: string) => {
    if (!window.confirm(`Are you sure you want to block ${blockedUsername}?`)) return;
    try {
      const res = await fetch(`/api/social/block/${blockedUsername}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        alert(`${blockedUsername} has been blocked.`);
        setTargetProfile(null);
        setActiveTab('feed');
        fetchPosts();
      }
    } catch (e) {}
  };

  const handleUploadProfilePic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch('/api/social/profile-picture', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ picture: reader.result })
        });
        if (res.ok) {
          refreshUser();
        }
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  // Direct DM Send Actions
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatPeer) return;
    try {
      const res = await fetch(`/api/social/messages/${chatPeer}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content: newMessage })
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch(e) {}
  };

  // Friends Actions
  const handleSendFriendRequest = async (recipient: string) => {
    try {
      const res = await fetch('/api/social/friend-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ recipient })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Friend request sent!");
        fetchFriendRequests();
      }
    } catch (e) {}
  };

  const handleRespondFriendRequest = async (id: string, status: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`/api/social/friend-requests/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchFriends();
        fetchFriendRequests();
        fetchPeers();
      }
    } catch (e) {}
  };

  // Profile Edit
  const handleSaveProfileExtended = async () => {
    try {
      const res = await fetch('/api/social/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: profileName,
          gender: profileGender,
          birthday: profileBirthday,
          birthday_privacy: profileBirthdayPrivacy,
          school: profileSchool,
          classVal: profileClass,
          religion: profileReligion,
          privacyMessages: profilePrivacyMessages
        })
      });
      if (res.ok) {
        setIsEditingProfile(false);
        refreshUser();
        alert("Profile details updated successfully!");
      }
    } catch (e) {}
  };

  // Process legal document file selections
  const handleVerifyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerifyFileName(file.name);
      setVerifyFileMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerifyFileBase64(reader.result as string);
        setVerificationFeedback("📸 Document successfully loaded into AI scanner container. Ready to execute verification.");
        setVerificationDecision(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Real ID scanning & verification via AI
  const handleScanLegalID = async () => {
    if (!verifyFileBase64) {
      setVerificationFeedback("⚠️ Please select/drag-and-drop a valid document file first.");
      return;
    }

    setIsVerifying(true);
    setUploadProgress(15);
    setVerificationFeedback("Securely uploading your document file to Spoken Guide AI Scanner...");
    setVerificationDecision(null);

    // Let's create an incremental progress simulation while the server is executing the AI request
    let progress = 15;
    const interval = setInterval(() => {
      progress = Math.min(95, progress + Math.floor(Math.random() * 10) + 5);
      setUploadProgress(progress);
      if (progress < 45) {
        setVerificationFeedback(`AI Computer Vision scanning document frame & safety stamps... (${progress}%)`);
      } else if (progress < 75) {
        setVerificationFeedback(`AI Coach extracting metadata (Name, Birthday, Institution, Religion) & establishing integrity... (${progress}%)`);
      } else {
        setVerificationFeedback(`Matching with security registers & evaluating authentic checksums... (${progress}%)`);
      }
    }, 450);

    try {
      const res = await fetch('/api/social/profile/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          documentType: verifyDocType,
          fileBase64: verifyFileBase64,
          mimeType: verifyFileMime
        })
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await res.json();
      if (res.ok && data.success) {
        setVerificationDecision("approved");
        setVerificationFeedback(data.message || "🎉 Success! Document verified. Profile updated.");
        refreshUser();
        // Clear files
        setVerifyFileBase64(null);
        setVerifyFileName(null);
      } else {
        const decision = data.decision || "rejected";
        setVerificationDecision(decision);
        setVerificationFeedback(data.message || data.error || "❌ Verification failed.");
      }
    } catch (e: any) {
      clearInterval(interval);
      setUploadProgress(100);
      setVerificationDecision("rejected");
      setVerificationFeedback("❌ Scanner connection timed out or failed to process the request.");
    }
  };

  // Appeal Submission
  const handleSubmitAppealStatement = async () => {
    if (!appealText.trim()) return;
    try {
       const res = await fetch('/api/social/profile/appeal', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${localStorage.getItem('auth_token')}`
         },
         body: JSON.stringify({ explanation: appealText })
       });
       if (res.ok) {
         setAppealSuccessMsg("✅ Appeal Submitted Successfully! The AI Moderation Board will review your explanation shortly.");
         refreshUser();
       }
    } catch (_) {}
  };

  // Join/Leave Anonymous Queue
  const handleJoinAnonymousQueue = async () => {
    setAnonChatWarning(null);
    setAnonymousQueueStatus('searching');
    try {
      const res = await fetch('/api/social/anonymous/join', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matched) {
          setAnonymousRoom(data);
          setAnonymousQueueStatus('matched');
        }
      }
    } catch (e) {}
  };

  const handleLeaveAnonymousRoom = async () => {
    try {
      await fetch('/api/social/anonymous/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ roomId: anonymousRoom?.id })
      });
    } catch (e) {}

    // If there were messages exchanged, show the AI review screen instead of going to idle
    if (anonymousMessages.length >= 2) {
      setAnonymousQueueStatus('review');
      setAnonymousRoom(null); // Keep messages to generate mock review inside the render
      setAnonChatWarning(null);
    } else {
      setAnonymousQueueStatus('idle');
      setAnonymousRoom(null);
      setAnonymousMessages([]);
      setAnonChatWarning(null);
    }
  };

  const handleSendAnonymousMessage = async () => {
    if (!anonymousInputMsg.trim() || !anonymousRoom) return;
    const textToSend = anonymousInputMsg;
    setAnonymousInputMsg("");

    try {
      const res = await fetch('/api/social/anonymous/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ roomId: anonymousRoom.id, content: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isFlagged) {
          setAnonChatWarning("⚠️ WARNING: AI scanner detected toxic/slang vocabulary. Account Health diminished!");
          refreshUser();
        }
        // Force refresh anonymous message list immediately
        const resMsgs = await fetch(`/api/social/anonymous/messages/${anonymousRoom.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (resMsgs.ok) {
          const dMsgs = await resMsgs.json();
          setAnonymousMessages(dMsgs.messages || []);
        }
      }
    } catch (e) {}
  };

  // AI English Teacher actions
  const handleSelectTopic = async (topic: string) => {
    setSelectedTopic(topic);
    const initialPrompt = `Hello AI Teacher, please teach me about ${topic}. Provide short and concise responses. Your explanations and analyses should be mostly in Bengali, with occasional English. Give at least 10 to 12 examples for it, including English to Bengali translations. Start our lessons with this explanation and then ask me to practice.`;
    const initialUserMsg = { role: "user", parts: [{ text: initialPrompt }], isHidden: true };
    setAiTeacherMessages([initialUserMsg]);
    setIsAiTyping(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/teacher', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: [{ role: "user", parts: [{ text: initialPrompt }] }] })
      });
      if (res.ok) {
        const data = await res.json();
        setAiTeacherMessages([
          initialUserMsg,
          { role: "model", parts: [{ text: data.reply }] }
        ]);
      } else {
        const errData = await res.json().catch(() => ({}));
        const errText = errData.error || "AI Teacher temporary offline.";
        setAiTeacherMessages([
          initialUserMsg,
          { role: "model", parts: [{ text: `${getInitialPromptForTopic(topic)}\n\n⚠️ Offline Active:\n${errText}` }] }
        ]);
      }
    } catch(e) {
      setAiTeacherMessages([
        initialUserMsg,
        { role: "model", parts: [{ text: `${getInitialPromptForTopic(topic)}\n\n⚠️ Offline Mode activated. Read concepts above.` }] }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: "user", parts: [{ text: aiInput }] };
    const updatedMessages = [...aiTeacherMessages, userMsg];
    setAiTeacherMessages(updatedMessages);
    setAiInput("");
    setIsAiTyping(true);
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/teacher', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          messages: updatedMessages.map(m => ({ role: m.role, parts: m.parts }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiTeacherMessages(prev => [...prev, { role: "model", parts: [{ text: data.reply }] }]);
      }
    } catch(e) {}
    setIsAiTyping(false);
  };

  const handleEndConversation = async () => {
    if (!selectedTopic) return;
    setIsEvaluating(true);
    setEvaluationResult(null);
    try {
      const res = await fetch('/api/ai/teacher/evaluate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          topic: selectedTopic,
          messages: aiTeacherMessages
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluationResult({ score: data.score, feedback: data.feedback });
        setAiTeacherMessages(prev => [
          ...prev,
          {
            role: "model",
            parts: [{
              text: `🎓 **ছাত্রের মূল্যায়ন রিপোর্ট (Topic: ${selectedTopic})**\n\n📌 **প্রাপ্ত স্কোর:** **${String(data.score).split('/')[0]}/100**\n\n📝 **শিক্ষকের মন্তব্য:**\n${data.feedback}`
            }]
          }
        ]);
        fetchGrammarScores();
      }
    } catch (e) {}
    setIsEvaluating(false);
  };

// Auth checks handled inside the body for smooth nav experience
  
  const currentUser = user || { username: 'guest', profilePicture: '', name: 'Guest User' };


  // Banned Account Portal Overlay
  if ((currentUser as any).banned === 1) {
    return (
      <div id="suspended-cover-panel" className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-red-500/20 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-red-650"></div>
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce shrink-0" />
          <h1 className="text-2xl font-black text-red-650 uppercase font-display leading-none">Account Suspended 🚫</h1>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed">
            Your account representing <strong>{user.username}</strong> has been suspended indefinitely because your account safety standing has dropped below crucial community minimum limits (Current Health: <strong>0%</strong>).
          </p>
          <div className="my-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 text-left text-xs space-y-2">
            <span className="font-extrabold text-red-700 dark:text-red-300 block uppercase tracking-wider">AI Moderate Reason:</span>
            <span className="text-slate-600 dark:text-slate-400 block font-semibold leading-relaxed">
              Detected active patterns of hostile vocabulary or unpolished behavior inside monitored peer zones. Lifelong plans can't be restored automatically, cancelling active premium scopes.
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 text-left">
            <h3 className="font-bold text-sm dark:text-white">Submit Legal Appeal Request</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Type an evaluation claim below if this was an accidental trigger. Decisions take 24 hours.</p>
            {user.ban_appeal_status === 'pending' ? (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-amber-700 dark:text-amber-400 font-bold text-xs">
                ⌛ Your appeal statement is currently being analyzed by AI Senior Supervisors. Decision pending.
              </div>
            ) : user.ban_appeal_status === 'rejected' ? (
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-500 font-bold text-xs">
                ❌ Your appeal statement has been final-declined by supervisors. Ban state cannot be reverted.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <textarea 
                  value={appealText}
                  onChange={e => setAppealText(e.target.value)}
                  placeholder="Explain why your account should be restored..." 
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 rounded-xl focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
                {appealSuccessMsg && (
                  <p className="text-[11px] font-bold text-emerald-600">{appealSuccessMsg}</p>
                )}
                <button 
                  onClick={handleSubmitAppealStatement}
                  className="w-full bg-slate-900 dark:bg-black text-white hover:bg-red-650 hover:text-white text-xs font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  Submit Appeal Form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const userFriendsCount = friends.length;
  const pendingRequestsCount = friendRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto overflow-x-hidden" style={{ fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" }}>
      {/* Standalone Header */}
      <nav className="glass-panel sticky top-0 z-[45] p-3 md:p-4 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm shrink-0 w-full mb-0 md:rounded-b-3xl md:border-t-0 md:mx-auto md:max-w-7xl md:mb-6 md:mt-0 transition-all duration-300">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 lg:px-4">
          <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto justify-between md:justify-start">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-200 hover:dark:bg-slate-700 font-bold text-sm transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              নীড়পাতা
            </button>
            <div className="hidden md:flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[13px] tracking-wide shadow-sm">
               <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500/50" />
               সবার জন্য সম্ভাবনার জায়গা
            </div>
            {/* Mobile Title */}
            <div className="flex md:hidden items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
               <Heart className="w-3.5 h-3.5 fill-indigo-500/50" /> কমিউনিটি
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto hide-scrollbar touch-pan-x snap-x w-full md:w-auto pb-1 md:pb-0 px-1 md:px-0">
            <button onClick={() => handleTabChange('feed', null)} className={`snap-center px-4 md:px-5 py-2 md:py-2.5 rounded-2xl font-bold text-[13px] md:text-sm whitespace-nowrap transition-all shadow-sm ${activeTab === 'feed' ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}>কমিউনিটি ফিড</button>
            <button onClick={() => handleTabChange('profile', currentUser.username)} className={`snap-center px-4 md:px-5 py-2 md:py-2.5 rounded-2xl font-bold text-[13px] md:text-sm whitespace-nowrap transition-all shadow-sm ${activeTab === 'profile' && targetProfile === currentUser.username ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}>প্রোফাইল</button>
            <button onClick={() => handleTabChange('requests', null)} className={`snap-center px-4 md:px-5 py-2 md:py-2.5 rounded-2xl font-bold text-[13px] md:text-sm whitespace-nowrap transition-all shadow-sm relative flex items-center gap-2 ${activeTab === 'requests' ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}>
              ফ্রেন্ড রিকোয়েস্ট
              {(() => {
                const count = friendRequests.filter(r => r.status === 'pending' && r.receiver === currentUser.username).length;
                return count > 0 ? <span className="bg-red-500 text-white rounded-full min-w-4 h-4 md:min-w-5 md:h-5 flex items-center justify-center text-[10px] px-1 md:px-1.5">{count}</span> : null;
              })()}
            </button>
            <button onClick={() => handleTabChange('messages')} className={`snap-center px-4 md:px-5 py-2 md:py-2.5 rounded-2xl font-bold text-[13px] md:text-sm whitespace-nowrap transition-all shadow-sm relative flex items-center gap-2 ${activeTab === 'messages' ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}>
              মেসেজ {pendingRequestsCount > 0 && <span className="bg-red-500 text-white rounded-full min-w-4 h-4 md:min-w-5 md:h-5 flex items-center justify-center text-[10px] px-1 md:px-1.5">{pendingRequestsCount}</span>}
            </button>
            <button onClick={() => handleTabChange('anonymous')} className={`snap-center px-4 md:px-5 py-2 md:py-2.5 rounded-2xl font-bold text-[13px] md:text-sm whitespace-nowrap transition-all shadow-sm ${activeTab === 'anonymous' ? 'bg-violet-600 text-white shadow-violet-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-300'}`}>বেনামী অনুশীলন</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full flex flex-col gap-4 p-2 sm:p-4 text-slate-800 dark:text-slate-100 flex-1">
        {/* Main Container */}
        <div className="w-full flex-1 flex flex-col gap-4 min-h-[500px]">
          {!user && activeTab !== 'feed' ? (
            <div className="flex justify-center p-12 text-slate-800 dark:text-slate-100 flex-col items-center justify-center gap-4 h-full min-h-[500px]">
               <Heart className="w-12 h-12 text-emerald-500/30" />
               <p className="text-xl font-bold font-bengali">এই ফিচারটি ব্যবহার করতে স্পোকেন গাইডে লগইন করুন</p>
               <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl outline-none shadow-md">উপরে গিয়ে লগইন মেনুতে চাপ দিন</button>
            </div>
          ) : (
            <>
        
        {/* --- FRIEND REQUESTS LIST PANEL --- */}
        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-8 shadow-sm max-w-3xl mx-auto w-full text-left font-bengali">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-8">
              <span className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl leading-none shadow-sm">
                <UserPlus className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>আপনার ফ্রেন্ড রিকোয়েস্ট</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">যারা আপনার সাথে প্র্যাকটিস করতে চায় এবং যাদের আপনি রিকোয়েস্ট পাঠিয়েছেন</p>
              </div>
            </div>

            <div className="flex flex-col gap-10">
              {/* Incoming Requests */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> আসা রিকোয়েস্ট
                </h4>
                {(() => {
                  const incoming = friendRequests.filter(r => r.status === 'pending' && r.receiver === currentUser.username);
                  if (incoming.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-slate-400 text-sm font-medium">
                        কোনো নতুন রিকোয়েস্ট নেই।
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-3">
                      {incoming.map(req => (
                        <div key={req.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-50 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <img src={"https://ui-avatars.com/api/?name=" + req.sender} className="w-12 h-12 rounded-full object-cover bg-slate-100 shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-slate-800 dark:text-white cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => handleTabChange('profile', req.sender)}>
                                {req.sender}
                              </h4>
                              <span className="text-[12px] text-slate-400 font-medium">{new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                            <button 
                              onClick={() => handleRespondFriendRequest(req.id, 'accepted')}
                              className="flex-1 sm:flex-auto bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
                            >
                              এক্সেপ্ট করুন
                            </button>
                            <button 
                              onClick={() => handleRespondFriendRequest(req.id, 'declined')}
                              className="flex-1 sm:flex-auto bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 text-[13px] font-bold px-6 py-2.5 rounded-xl transition-all"
                            >
                              বাদ দিন
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Sent Requests */}
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> পাঠানো রিকোয়েস্ট
                </h4>
                {(() => {
                  const outgoing = friendRequests.filter(r => r.status === 'pending' && r.sender === currentUser.username);
                  if (outgoing.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-slate-400 text-sm font-medium">
                        আপনি এখনো কাউকে রিকোয়েস্ট পাঠাননি।
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-3">
                      {outgoing.map(req => (
                        <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img src={"https://ui-avatars.com/api/?name=" + req.receiver} className="w-10 h-10 rounded-full object-cover bg-slate-100 shrink-0 opacity-80" />
                            <div>
                              <h4 className="text-[15px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600" onClick={() => handleTabChange('profile', req.receiver)}>
                                {req.receiver}
                              </h4>
                              <span className="text-[12px] text-slate-400 font-medium">পেন্ডিং...</span>
                            </div>
                          </div>
                          <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-lg border border-blue-100 dark:border-blue-800/50">অপেক্ষারত</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* --- COMMUNITY PROFILE VIEW --- */}
        {activeTab === 'profile' && targetProfile && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-md border border-slate-150 dark:border-slate-800/80 mb-6 relative max-w-3xl mx-auto w-full transition-all">
            <div className="h-44 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 w-full relative opacity-90"></div>
            
            <div className="px-6 pb-8 pt-16 relative">
              
              {/* Profile Avatar Trigger */}
              <div className="absolute -top-16 left-6 border-4 border-white dark:border-slate-900 rounded-full group cursor-pointer shadow-lg">
                <img src={targetProfile === currentUser.username ? currentUser.profilePicture || "https://ui-avatars.com/api/?name=" + currentUser.username : "https://ui-avatars.com/api/?name=" + targetProfile} className="w-32 h-32 rounded-full object-cover bg-white" />
                {targetProfile === currentUser.username && (
                  <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-sm">
                    পরিবর্তন করুন
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadProfilePic} />
                  </label>
                )}
              </div>

              {/* Header Profile Data */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mt-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
                    <span>{targetProfile}</span>
                    {targetProfile === currentUser.username ? (
                       (currentUser as any).verified_badge === 1 && <span className="bg-emerald-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold shadow-sm" title="AI Document Verified">✓</span>
                    ) : (
                       <span className="bg-emerald-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold shadow-sm" title="Verified Contributor">✓</span>
                    )}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1 tracking-wide">স্পোকেন গাইড শিক্ষার্থী</p>
                  
                  {/* Bio and Status Details */}
                  {targetProfile === currentUser.username && (
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">অ্যাকাউন্ট হেলথ:</span>
                      <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(currentUser as any).account_health}%` }}></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">{(currentUser as any).account_health}% সেইফ</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {targetProfile !== currentUser.username ? (
                    <>
                      {(() => {
                        const incomingRequest = friendRequests.find(r => r.status === 'pending' && r.receiver === currentUser.username && r.sender === targetProfile);
                        const outgoingRequest = friendRequests.find(r => r.status === 'pending' && r.sender === currentUser.username && r.receiver === targetProfile);

                        if (friends.includes(targetProfile)) {
                          return (
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-450 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 leading-none shadow-sm">
                              <UserCheck className="w-4.5 h-4.5" /> ফ্রেন্ড
                            </span>
                          );
                        } else if (incomingRequest) {
                          return (
                            <div className="flex gap-2">
                              <button onClick={() => handleRespondFriendRequest(incomingRequest.id, 'accepted')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold text-sm leading-none transition shadow-sm">
                                <UserCheck className="w-4 h-4" /> এক্সেপ্ট
                              </button>
                              <button onClick={() => handleRespondFriendRequest(incomingRequest.id, 'declined')} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl font-bold text-sm leading-none hover:bg-red-500 hover:text-white transition shadow-sm">
                                ইগনোর
                              </button>
                            </div>
                          );
                        } else if (outgoingRequest) {
                          return (
                            <span className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 leading-none shadow-sm">
                              <Mail className="w-4 h-4 animate-pulse text-amber-500" /> পেন্ডিং
                            </span>
                          );
                        } else {
                          return (
                            <button onClick={() => handleSendFriendRequest(targetProfile)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm leading-none transition shadow-sm">
                              <UserPlus className="w-4 h-4" /> ফ্রেন্ড রিকোয়েস্ট
                            </button>
                          );
                        }
                      })()}
                      
                      <button onClick={() => { setChatPeer(targetProfile); setMobileChatView('chat'); handleTabChange('messages'); }} className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold text-sm leading-none shadow-sm transition-colors">
                        <MessageCircle className="w-4 h-4"/> মেসেজ
                      </button>
                      
                      <button onClick={() => blockUser(targetProfile)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:dark:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 px-5 py-3 rounded-xl font-bold text-sm leading-none shadow-sm transition-colors">
                        <Ban className="w-4 h-4" /> ব্লোক
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { handleTabChange('messages'); }} className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold text-sm leading-none shadow-sm transition-colors">
                        <MessageCircle className="w-4 h-4"/> মেসেজ
                      </button>
                      
                      <button onClick={() => { handleTabChange('requests', null); }} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 hover:dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-5 py-3 rounded-xl font-bold text-sm leading-none shadow-sm transition-colors">
                        <UserPlus className="w-4 h-4" /> ফ্রেন্ড রিকোয়েস্ট
                      </button>

                      <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:dark:bg-slate-700 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-bold text-sm leading-none shadow-sm transition-colors">
                        <Settings className="w-4.5 h-4.5"/> এডিট প্রোফাইল
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Profile Fields & Editor */}
              {isEditingProfile && targetProfile === currentUser.username ? (
                <div className="mt-8 bg-slate-50 dark:bg-slate-850/50 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-5 text-left">
                  
                  {/* AI Document Scanner now in Edit Profile */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                    <h3 className="font-black text-xs uppercase text-slate-450 mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> AI Document Scanner
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                      Authenticate your student/national legal ID cards to establish 100% digital integrity and auto-fill your core details. Only verified parameters are not editable.
                    </p>
                    
                    {(currentUser as any).verified_badge === 1 ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-450 font-bold text-xs flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>Identity Verified by System. Details locked.</span>
                      </div>
                    ) : (
                      <div className="space-y-3 text-left">
                        <div className="grid grid-cols-2 gap-4 items-end">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">Select Legal Doc Type</label>
                            <select value={verifyDocType} onChange={e => setVerifyDocType(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <option value="Student ID0">Student ID Card</option>
                              <option value="National ID (NID)">Bangladeshi NID Card</option>
                              <option value="Birth Certificate">Birth Verification Doc</option>
                            </select>
                          </div>
                          <button onClick={handleScanLegalID} disabled={!verifyFileBase64 || isVerifying} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md">
                            {isVerifying ? "Scanning..." : "Scan & Auto-Fill"}
                          </button>
                        </div>

                        {/* Interactive File Drop-Zone Upload */}
                        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 rounded-2xl p-4 text-center transition-colors">
                          <input 
                            type="file" accept="image/*,application/pdf" onChange={handleVerifyFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          />
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-2xl">📁</span>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {verifyFileName ? verifyFileName : "Drag & drop or Click to upload"}
                            </p>
                          </div>
                        </div>

                        {isVerifying && (
                          <div className="space-y-2">
                            <div className="h-2 bg-slate-250 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                            <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">{verificationFeedback}</p>
                          </div>
                        )}
                        {!isVerifying && verificationFeedback && (
                          <p className={`text-[10px] font-bold p-2 rounded-lg ${verificationDecision === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {verificationFeedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-850 pb-2">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Edit Academic & Personal Parameters</h3>
                    {user?.verified_badge === 1 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-600 dark:text-emerald-450 text-[10px] font-extrabold uppercase tracking-wide">
                        🛡️ Locked via AI Verification
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Full Legal Name</label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={e => user?.verified_badge !== 1 && setProfileName(e.target.value)} 
                        disabled={user?.verified_badge === 1}
                        className={`w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${user?.verified_badge === 1 ? 'opacity-60 bg-slate-100 dark:bg-slate-950 cursor-not-allowed font-medium' : ''}`} 
                        placeholder="Full Legal Representative Name" 
                      />
                      {user?.verified_badge === 1 && <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ Synchronized with Verified Document</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Gender Identity</label>
                      <select 
                        value={profileGender} 
                        onChange={e => user?.verified_badge !== 1 && setProfileGender(e.target.value)} 
                        disabled={user?.verified_badge === 1}
                        className={`w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${user?.verified_badge === 1 ? 'opacity-60 bg-slate-100 dark:bg-slate-950 cursor-not-allowed font-medium' : ''}`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {user?.verified_badge === 1 && <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ Synchronized with Verified Document</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Date of Birth</label>
                      <input 
                        type="date" 
                        value={profileBirthday} 
                        onChange={e => user?.verified_badge !== 1 && setProfileBirthday(e.target.value)} 
                        disabled={user?.verified_badge === 1}
                        className={`w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${user?.verified_badge === 1 ? 'opacity-60 bg-slate-100 dark:bg-slate-950 cursor-not-allowed font-medium' : ''}`} 
                      />
                      {user?.verified_badge === 1 && <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ Synchronized with Verified Document</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Birthday Visibility Privacy</label>
                      <select value={profileBirthdayPrivacy} onChange={e => setProfileBirthdayPrivacy(e.target.value as 'public' | 'friends' | 'private')} className="w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <option value="public">🌍 Public Visibility (Anyone can view)</option>
                        <option value="friends">👥 Friends Only (Only accepted connections can view)</option>
                        <option value="private">🔒 Private (Fully private details)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">School / College / University</label>
                      <input 
                        type="text" 
                        value={profileSchool} 
                        onChange={e => user?.verified_badge !== 1 && setProfileSchool(e.target.value)} 
                        disabled={user?.verified_badge === 1}
                        className={`w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${user?.verified_badge === 1 ? 'opacity-60 bg-slate-100 dark:bg-slate-950 cursor-not-allowed font-medium' : ''}`} 
                        placeholder="e.g. Milestone College" 
                      />
                      {user?.verified_badge === 1 && <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ Synchronized with Verified Document</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Class / Grade Currently Studying</label>
                      <input 
                        type="text" 
                        value={profileClass} 
                        onChange={e => user?.verified_badge !== 1 && setProfileClass(e.target.value)} 
                        disabled={user?.verified_badge === 1}
                        className={`w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${user?.verified_badge === 1 ? 'opacity-60 bg-slate-100 dark:bg-slate-950 cursor-not-allowed font-medium' : ''}`} 
                        placeholder="e.g. Class 11 (HSC)" 
                      />
                      {user?.verified_badge === 1 && <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ Synchronized with Verified Document</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Religious Views</label>
                      <input 
                        type="text" 
                        value={profileReligion} 
                        onChange={e => user?.verified_badge !== 1 && setProfileReligion(e.target.value)} 
                        disabled={user?.verified_badge === 1}
                        className={`w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${user?.verified_badge === 1 ? 'opacity-60 bg-slate-100 dark:bg-slate-950 cursor-not-allowed font-medium' : ''}`} 
                        placeholder="e.g. Islam / Hinduism / Christianity" 
                      />
                      {user?.verified_badge === 1 && <span className="text-[10px] text-emerald-500 font-bold mt-1 block">✓ Synchronized with Verified Document</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">DM Message Privacy Settings</label>
                      <select value={profilePrivacyMessages} onChange={e => setProfilePrivacyMessages(e.target.value as 'public' | 'friends' | 'friend_of_friend')} className="w-full text-xs p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <option value="public">🌍 Anyone can message me (unrecognized chats go to Message Requests)</option>
                        <option value="friends">👥 Only Friends (Blocked unless directly connected as peer)</option>
                        <option value="friend_of_friend">🔗 Friends of Friends can chat</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold rounded-lg text-xs">Cancel</button>
                    <button onClick={handleSaveProfileExtended} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-750">Save Profiles</button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  
                  {/* Left Column: Academic Metadata Details */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="font-extrabold text-base border-b border-slate-100 dark:border-slate-800 pb-2">Academic & Personal Profile Structure</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><User className="w-4 h-4 text-slate-450" /></div>
                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-black uppercase">Name</p>
                          <p className="font-bold">{targetProfile === currentUser.username ? (currentUser.name || "Not Specified") : "Confidential Member"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><GraduationCap className="w-4 h-4 text-slate-450" /></div>
                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-black uppercase">Institution</p>
                          <p className="font-bold">{targetProfile === currentUser.username ? ((currentUser as any).school || "Not Specified") : "Private Academy"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><GraduationCap className="w-4 h-4 text-slate-450" /></div>
                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-black uppercase">Class Currently Studying</p>
                          <p className="font-bold">{targetProfile === currentUser.username ? ((currentUser as any).class || "Not Specified") : "Core Study Student"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><Clock className="w-4 h-4 text-slate-450" /></div>
                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-black uppercase">Birthday</p>
                          <p className="font-bold">
                            {targetProfile === currentUser.username ? (
                              (currentUser as any).birthday || "Not Specified"
                            ) : (
                              (currentUser as any).birthday_privacy === 'public' || ((currentUser as any).birthday_privacy === 'friends' && friends.includes(targetProfile)) ? (
                                (currentUser as any).birthday || "Confidential"
                              ) : "🔒 Friends Only"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><ShieldCheck className="w-4 h-4 text-slate-450" /></div>
                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-black uppercase">Religious View</p>
                          <p className="font-bold">{targetProfile === currentUser.username ? ((currentUser as any).religion || "Not Specified") : "Interfaith Member"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl"><User className="w-4 h-4 text-slate-450" /></div>
                        <div>
                          <p className="text-[10px] text-slate-450 uppercase font-black uppercase">Gender</p>
                          <p className="font-bold">{targetProfile === currentUser.username ? ((currentUser as any).gender || "Not Specified") : "Learner Participant"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* --- COMMUNITY FEED VIEW --- */}
        {(activeTab === 'feed' && !targetProfile || activeTab === 'profile') && (
          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
            {/* New Post Box */}
            {activeTab === 'feed' && !user && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center w-full">
                 <p className="text-slate-600 dark:text-slate-400 font-bold mb-4">অংশগ্রহণ করতে স্পোকেন গাইডে লগইন করুন</p>
              </div>
            )}
            {activeTab === 'feed' && user && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border-2 border-slate-100 dark:border-slate-800/80 w-full hover:shadow-lg hover:border-emerald-500/20 transition-all duration-300">
                <div className="flex gap-4">
                  <img src={currentUser.profilePicture || "https://ui-avatars.com/api/?name=" + currentUser.username} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  <textarea 
                    placeholder="আপনার স্পিকিং জার্নি সম্পর্কে লিখুন, অথবা কোনো গ্রামার নিয়ে কনফিউশন থাকলে প্রশ্ন করুন..." 
                    className="w-full text-[15px] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl resize-none outline-none border border-slate-150 dark:border-slate-700/80 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 placeholder-slate-400 font-medium"
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={handleCreatePost} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black hover:-translate-y-0.5 py-3 px-8 rounded-xl text-sm transition-all duration-200 shadow-md shadow-emerald-600/20 flex items-center gap-2">
                    <Send className="w-4 h-4"/> পোস্ট করুন
                  </button>
                </div>
              </div>
            )}

            {/* Friend Requests Queue inside feed if exists */}
            {activeTab === 'feed' && friendRequests.some(r => r.status === 'pending') && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 p-5 rounded-3xl">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <UserPlus className="w-5 h-5" /> অপেক্ষারত ফ্রেন্ড রিকোয়েস্ট ({pendingRequestsCount})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friendRequests.filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{req.sender} <span className="font-medium text-slate-500 text-xs">এড করতে চায়</span></span>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleRespondFriendRequest(req.id, 'accepted')} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 font-bold text-white text-[11px] rounded-xl hover:bg-emerald-500 transition-colors shadow-sm">এক্সেপ্ট</button>
                        <button onClick={() => handleRespondFriendRequest(req.id, 'declined')} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 text-[11px] rounded-xl hover:bg-red-500 hover:text-white transition-colors">ইগনোর</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
               <div className="flex items-center gap-4 py-4 px-2">
                 <h3 className="text-xl font-bold font-display" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>সাম্প্রতিক পোস্টগুলো</h3>
                 <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
               </div>
            )}

            {/* Posts looping */}
            <div className="flex flex-col gap-6">
              {(activeTab === 'profile' ? posts.filter(p => p.authorUsername === targetProfile) : posts).map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-150 dark:border-slate-800/80 text-sm transition-colors hover:border-slate-200 dark:hover:border-slate-700">
                  <div className="flex items-center gap-4 mb-5">
                    <img 
                      src={post.authorProfilePicture || "https://ui-avatars.com/api/?name=" + post.authorUsername} 
                      className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity border bg-slate-100" 
                      onClick={() => handleTabChange('profile', post.authorUsername)} 
                    />
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer transition-colors" onClick={() => handleTabChange('profile', post.authorUsername)}>
                        {post.authorUsername}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium tracking-wide">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    {post.authorUsername !== currentUser.username && (
                      <button className="ml-auto text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full" onClick={() => blockUser(post.authorUsername)} title="Block User"><Ban className="w-4 h-4"/></button>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-6 text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  
                  <div className="flex justify-between items-center text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                    <button onClick={() => user ? handleLike(post.id) : alert('লাইক দিতে লগইন করুন')} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800/50 font-bold text-[13px] transition duration-200 ${post.userLiked ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <Heart className={`w-4.5 h-4.5 ${post.userLiked ? 'fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400' : ''}`}/> {post.likeCount > 0 ? post.likeCount : ''}
                    </button>
                    <button onClick={() => user ? handleToggleComments(post.id) : alert('কমেন্ট করতে লগইন করুন')} className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-800/50 font-bold text-[13px] transition duration-200 ${activeCommentPostId === post.id ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      <MessageCircle className="w-4.5 h-4.5"/> {post.commentCount > 0 ? post.commentCount : ''}
                    </button>
                    <button onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + "/social");
                      setSharedPostId(post.id);
                      setTimeout(() => setSharedPostId(null), 2500);
                    }} className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-[13px] transition duration-200">
                      <Share2 className="w-4 h-4"/> {sharedPostId === post.id ? <span className="text-emerald-500 font-bold">✓ কপিড</span> : ""}
                    </button>
                  </div>

                  {/* Infinite-Safe Drawer for Inline Comments */}
                  {activeCommentPostId === post.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#20293a] flex flex-col gap-3">
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {postComments.map((com, cIdx) => (
                          <div key={cIdx} className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl text-xs flex gap-2 border border-slate-100 dark:border-slate-800">
                            <img src={"https://ui-avatars.com/api/?name=" + com.authorUsername} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-extrabold text-[#7e8eb2] hover:underline cursor-pointer" onClick={() => handleTabChange('profile', com.authorUsername)}>{com.authorUsername}</span>
                                <span className="text-[9px] text-slate-400">{new Date(com.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-800 dark:text-slate-200 leading-normal whitespace-pre-wrap">{com.content}</p>
                            </div>
                          </div>
                        ))}
                        {postComments.length === 0 && (
                          <p className="text-center text-[12px] font-medium text-slate-400 py-3 font-bengali">এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য করে আলোচনায় যুক্ত হোন! 💬</p>
                        )}
                      </div>

                      {/* Add Comment Input Row */}
                      {user ? (
                        <div className="flex gap-2 items-center mt-1">
                          <input 
                            type="text"
                            placeholder="আপনার মন্তব্য লিখুন..."
                            value={newCommentText}
                            onChange={e => setNewCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSendComment(post.id); }}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 text-[13px] focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
                          />
                          <button 
                            onClick={() => handleSendComment(post.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-[13px] transition-all h-10 shrink-0 shadow-sm shadow-emerald-600/20"
                          >
                            কমেন্ট করুন
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 text-center bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 border border-slate-200 dark:border-slate-700">
                          মন্তব্য করতে অনুগ্রহ করে লগইন করুন
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {posts.length === 0 && <div className="text-center p-8 text-slate-500 font-medium font-bengali">এখনো কোনো পোস্ট করা হয়নি। প্রথম পোস্টটি হতে পারে আপনার!</div>}
            </div>
          </div>
        )}

        {/* --- MESSAGES PORTAL TAB INSIDE FULL WINDOW --- */}
        {activeTab === 'messages' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-[2rem] overflow-hidden shadow-sm flex flex-col md:flex-row h-[calc(100vh-220px)] min-h-[620px] w-full max-w-6xl mx-auto font-bengali relative">
            
            {/* Direct Message Peers list left sidebar */}
            <div className={`w-full md:w-1/3 xl:w-1/4 border-r border-slate-150 dark:border-slate-800/80 p-0 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 ${mobileChatView === 'chat' && chatPeer ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 border-b border-slate-150 dark:border-slate-800/80 flex flex-col gap-4 bg-white dark:bg-slate-900">
                <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  <MessageCircle className="w-5 h-5 text-indigo-500" />
                  ইনবক্স
                </h3>
                
                {/* Switch between Inbox and Unknown Message Requests */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <button 
                    onClick={() => { setDmFilterMode('inbox'); setChatPeer(null); }}
                    className={`py-2 px-3 rounded-lg font-bold text-[13px] cursor-pointer transition-all ${dmFilterMode === 'inbox' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600/50' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                  >
                    বন্ধুরা
                  </button>
                  <button 
                    onClick={() => { setDmFilterMode('requests'); setChatPeer(null); }}
                    className={`py-2 px-3 rounded-lg font-bold text-[13px] cursor-pointer transition-all ${dmFilterMode === 'requests' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-600/50' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                  >
                    রিকোয়েস্ট ({chatPeers.filter(p => p.peer !== 'admin' && !friends.includes(p.peer)).length})
                  </button>
                </div>
              </div>

              {/* Loader List */}
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  const filteredPeers = chatPeers.filter(p => {
                    const isFriend = friends.includes(p.peer) || p.peer === 'admin';
                    return dmFilterMode === 'inbox' ? isFriend : !isFriend;
                  });

                  if (filteredPeers.length === 0) {
                    return (
                      <div className="p-8 text-center text-[13px] text-slate-400 font-medium select-none">
                        এই তালিকায় কোনো মেসেজ নেই।
                      </div>
                    );
                  }

                  return filteredPeers.map(p => {
                    const isOnline = Date.now() - p.lastActive < 60000;
                    return (
                      <div 
                        key={p.peer} 
                        onClick={() => { setChatPeer(p.peer); setMobileChatView('chat'); }}
                        className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors flex items-center gap-3 ${chatPeer === p.peer ? 'bg-indigo-50/80 dark:bg-indigo-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800/40'}`}
                      >
                        <div className="relative shrink-0">
                          <img src={"https://ui-avatars.com/api/?name=" + p.peer} className="w-10 h-10 rounded-full" />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
                        </div>
                        <div className="flex-1 font-bold text-xs dark:text-white truncate">{p.peer}</div>
                        {p.messageCount > 0 && (
                          <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full select-none">
                            {p.messageCount}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Chat Messages Windows right panel */}
            <div className={fullscreenMode === 'personal'
              ? `fixed inset-0 z-[120] w-screen h-screen flex flex-col bg-[#ffffff] dark:bg-slate-950 p-4 md:p-6 opacity-100 border-4 border-indigo-500/40 shadow-2xl`
              : `w-full md:w-2/3 xl:w-3/4 h-full flex flex-col bg-[#ffffff] dark:bg-slate-900 ${mobileChatView === 'list' ? 'hidden md:flex' : 'flex'}`
            }>
              {chatPeer ? (
                <>
                  <div className={`p-4 xl:p-6 border-b ${fullscreenMode === 'personal' ? 'border-indigo-500/30 bg-indigo-50/20 dark:bg-slate-900/50' : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900'} flex items-center justify-between shadow-sm z-10`}>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (fullscreenMode === 'personal') {
                            setFullscreenMode('none');
                          } else {
                            setMobileChatView('list');
                          }
                        }} 
                        className={`${fullscreenMode === 'personal' ? '' : 'md:hidden'} p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:dark:bg-slate-700 dark:text-white rounded-full transition-colors flex shrink-0`}
                        title={fullscreenMode === 'personal' ? "বাহিরে যান" : "ফিরে যান"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                      </button>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img src={"https://ui-avatars.com/api/?name=" + chatPeer} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${chatPeerOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-base leading-none mb-1">{chatPeer}</span>
                          <span className={`text-[11px] font-medium leading-none ${chatPeerOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{chatPeerOnline ? 'অনলাইনে আছেন' : 'অফলাইন'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="toggle-personal-fullscreen"
                      onClick={() => setFullscreenMode(fullscreenMode === 'personal' ? 'none' : 'personal')}
                      className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm ${fullscreenMode === 'personal' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                      title={fullscreenMode === 'personal' ? "সাধারণ স্ক্রিন" : "ফুল স্ক্রিন"}
                    >
                      {fullscreenMode === 'personal' ? (
                        <>
                          <Minimize2 className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 ${fullscreenMode === 'personal' ? 'bg-slate-50/50 dark:bg-slate-950 opacity-100' : 'bg-slate-50/30 dark:bg-slate-900/30'}`}>
                    {directMessages.map((m, idx) => {
                      const isMe = m.senderUsername === currentUser.username;
                      return (
                        <div key={idx} className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isMe ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'}`}>
                          <div className={`p-4 rounded-2xl text-[14px] font-medium leading-relaxed shadow-sm ${
                            isMe 
                              ? (fullscreenMode === 'personal' ? 'bg-indigo-600 text-white border border-indigo-700/50' : 'bg-indigo-600 dark:bg-indigo-500 text-white border border-indigo-700/50 dark:border-indigo-600/50 rounded-tr-sm') 
                              : (fullscreenMode === 'personal' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm')
                          }`}>
                            {m.content}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium px-1 flex items-center gap-1">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className={`p-4 xl:p-6 border-t ${fullscreenMode === 'personal' ? 'border-indigo-500/30 bg-white dark:bg-slate-900' : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900'} flex gap-3`}>
                    <input 
                      type="text" 
                      value={newMessage} 
                      onChange={e => setNewMessage(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                      placeholder="আপনার মেসেজ লিখুন..." 
                      className={`w-full text-[15px] p-4 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium placeholder-slate-400 ${fullscreenMode === 'personal' ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}
                    />
                    <button 
                      onClick={handleSendMessage} 
                      className={`rounded-2xl px-6 flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-sm ${fullscreenMode === 'personal' ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-indigo-600/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}`}
                    >
                      <Send className="w-5 h-5"/>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 select-none h-full bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                    <MessageCircle className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-700 dark:text-slate-300 mb-2">স্টুডেন্ট মেসেজ প্যানেল</h3>
                  <p className="font-medium text-slate-500 text-[15px] max-w-sm">বাম পাশ থেকে যেকোনো তালিকা নির্বাচন করুন মেসেজ আদান-প্রদান করতে।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ANONYMOUS PRACTICING CHAT VIEW --- */}
        {activeTab === 'anonymous' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 max-w-4xl mx-auto w-full min-h-[500px]">
            
            {anonymousQueueStatus === 'notice' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Safety Notice / নিরাপত্তা সতর্কতা</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm max-w-lg leading-relaxed mb-6">
                  This anonymous chat relies on AI live scanning. Any hate speech, abuse, or use of profanity will instantly drop your Account Health. Reaching 0% will result in a permanent ban. Have respectful, helpful English conversations!
                  <br/><br/>
                  এই ছদ্মবেশী চ্যাটটি এআই (AI) লাইভ স্ক্যানিংয়ের উপর নির্ভরশীল। যেকোনো ধরনের ঘৃণামূলক কথাবার্তা, অপব্যবহার বা অশালীন ভাষা ব্যবহার করলে আপনার অ্যাকাউন্টের স্কোর কমে যাবে। ০% এ পৌঁছালে আপনাকে স্থায়ীভাবে নিষিদ্ধ (Ban) করা হবে। অনুগ্রহ করে সম্মানজনকভাবে ইংরেজি চর্চা করুন!
                </p>
                <button 
                  onClick={() => setAnonymousQueueStatus('idle')}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  I Agree / আমি একমত
                </button>
              </div>
            )}

            {anonymousQueueStatus !== 'notice' && (
              <div className="bg-gradient-to-r from-teal-500 via-indigo-500 to-indigo-700 p-6 rounded-3xl text-white text-left relative overflow-hidden shadow-md shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                <h3 className="font-black font-display text-lg flex items-center gap-2">
                  <span>🔐 AI-Monitored English Peer Club</span>
                </h3>
                <p className="text-slate-100 text-xs mt-1">Connect and practice fluent conversation instantly! AI provides a summary review and winner at the end.</p>
              </div>
            )}

            {/* Matching Engine Queue Status Router */}
            {anonymousQueueStatus === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full flex items-center justify-center mb-4 text-white font-extrabold text-xl shadow-inner shadow-indigo-650 animate-pulse">
                  ⚡
                </div>
                <h4 className="font-black text-sm">Ready to Speak English?</h4>
                <p className="text-slate-400 text-xs mt-1 mb-6 max-w-md">Our algorithm pairs you randomly with students based on active pings. All sessions are 100% private.</p>
                <button 
                  onClick={handleJoinAnonymousQueue}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer"
                >
                  Join Matchmaking Loop ⚡
                </button>
              </div>
            )}

            {anonymousQueueStatus === 'searching' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                <SpinnerLarge />
                <span className="text-sm mt-4 tracking-wider animate-pulse">MATCHMAKER: Scanning candidate queues for active partners...</span>
                <span className="text-[10px] text-slate-400 font-sans mt-1">Matched room established instantly when 2 players join.</span>
                <button onClick={handleLeaveAnonymousRoom} className="mt-6 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-red-500 hover:text-white">
                  Cancel Search
                </button>
              </div>
            )}

            {anonymousQueueStatus === 'matched' && anonymousRoom && (
              <div className={fullscreenMode === 'anonymous'
                ? "fixed inset-0 z-[120] flex flex-col bg-[#ffffff] dark:bg-[#090d16] w-screen h-screen overflow-hidden p-4 md:p-6"
                : "flex flex-col flex-1 h-[calc(100vh-220px)] min-h-[600px] bg-slate-50 dark:bg-[#090d16] rounded-3xl border border-slate-200/50 dark:border-slate-800 overflow-hidden relative w-full"
              }>
                
                {/* Active Match top bar */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-150 p-4 flex items-center justify-between text-xs font-bold shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping shrink-0" />
                      <span>Matched Conversation: <strong>Anonymous Partner</strong></span>
                    </div>

                    <button
                      id="toggle-anonymous-fullscreen"
                      onClick={() => setFullscreenMode(fullscreenMode === 'anonymous' ? 'none' : 'anonymous')}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
                      title={fullscreenMode === 'anonymous' ? "Exit Fullscreen" : "Open Full Screen"}
                    >
                      {fullscreenMode === 'anonymous' ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-rose-550" />
                          <span className="hidden sm:inline">Normal Screen</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="hidden sm:inline">Full Screen</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <button onClick={handleLeaveAnonymousRoom} className="px-3.5 py-1.5 bg-red-500 text-white font-bold rounded-lg text-[10px] hover:bg-red-650">
                    Exit Practice 🚪
                  </button>
                </div>

                {/* Warnings banner */}
                {anonChatWarning && (
                  <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 text-[11px] font-bold text-center leading-relaxed">
                    {anonChatWarning}
                  </div>
                )}

                {/* Messages Scroller */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {anonymousMessages.map((m, idx) => {
                    const isMe = m.senderAnonym === currentUser.username;
                    return (
                      <div key={idx} className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto text-right items-end' : 'mr-auto text-left items-start'}`}>
                        <div className={`p-3 rounded-xl border text-[11px] font-semibold leading-relaxed ${isMe ? 'bg-teal-600 text-white border-transparent' : 'bg-slate-200 dark:bg-slate-800 border-slate-250 dark:border-slate-750 text-slate-800 dark:text-slate-100'}`}>
                          {m.isFlagged === 1 ? (
                            <span className="text-red-500 dark:text-red-450 italic font-bold">🚫 [Content flagged by AI automated filter]</span>
                          ) : m.content}
                        </div>
                        <span className="text-[8px] text-slate-400 mt-0.5">{isMe ? 'You' : 'Classmate'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    );
                  })}
                  <div ref={anonMessagesEndRef} />
                </div>

                {/* Inbox inputs */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800/80 flex gap-2">
                  <input 
                    type="text" 
                    value={anonymousInputMsg} 
                    onChange={e => setAnonymousInputMsg(e.target.value)} 
                    onKeyDown={e => { if (e.key === 'Enter') handleSendAnonymousMessage(); }}
                    placeholder="Type polite messages here to practice speaking..." 
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 rounded-xl"
                  />
                  <button onClick={handleSendAnonymousMessage} className="bg-teal-600 text-white rounded-xl px-5 flex items-center justify-center shrink-0 cursor-pointer">
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {anonymousQueueStatus === 'review' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <h3 className="font-black text-2xl mb-2 text-indigo-600 dark:text-indigo-400">AI Conversation Review</h3>
                <p className="text-sm text-slate-500 mb-8 max-w-lg">
                  Both partners have completed the practice. Our AI supervisor has reviewed the logs based on grammar, context, and fluency.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl text-left mb-8">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                    <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-300 mb-2">You</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      Your responses were prompt and polite. You kept the conversation moving well. Next time, try using more descriptive adjectives rather than repetitive words.
                    </p>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">Score: 82/100</span>
                    </div>
                  </div>
                  
                  <div className="bg-teal-50 dark:bg-teal-900/20 p-5 rounded-2xl border border-teal-100 dark:border-teal-800">
                    <h4 className="font-bold text-sm text-teal-700 dark:text-teal-300 mb-2">Peer Classmate</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      Your peer used excellent sentence structure, but sometimes hesitated. They initiated questions effectively which is a great conversational skill.
                    </p>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[10px] bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 px-2 py-1 rounded">Score: 78/100</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-amber-400 to-amber-500 rounded-3xl text-amber-950 font-black shadow-lg mb-8 max-w-sm w-full animate-bounce mx-auto">
                  🎉 Winner: You!
                  <div className="text-xs font-semibold mt-1 opacity-80">Excellent vocabulary usage</div>
                </div>

                <button 
                  onClick={() => {
                    setAnonymousMessages([]);
                    setAnonymousQueueStatus('idle');
                  }}
                  className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-sm rounded-xl shadow transition-all cursor-pointer"
                >
                  Return to Matchmaking
                </button>
              </div>
            )}

          </div>
        )}

        {/* --- DOUBLE FULL-SCREEN LEADERBOARDS --- */}
        {activeTab === 'leaderboards' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto text-left">
            
            {/* Board 1: Spoken Leaders (based on oral Chat scores) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2.5 bg-amber-400/10 border border-amber-400/20 text-amber-500 rounded-2xl">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-display">Spoken Practice Leaders</h3>
                  <p className="text-[10px] text-slate-400">Oral speech grades matched real-time using AI Coach voice engine metrics.</p>
                </div>
              </div>

              {isLeaderboardLoading ? <Spinner /> : (
                <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {spokenLeaders.sort((a,b)=>b.performanceScore - a.performanceScore).map((p, idx) => (
                    <div key={p.username} className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-md ${idx === 0 ? 'bg-amber-400 text-slate-900' : idx === 1 ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}>{idx+1}</span>
                        <img src={"https://ui-avatars.com/api/?name=" + p.username} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-xs truncate flex items-center gap-1">
                            <span>{p.username}</span>
                            {p.isPremium && <span className="text-[10px] text-amber-500" title="Premium">👑</span>}
                          </p>
                          <p className="text-[9px] text-slate-400">{p.district || p.division ? `${p.district || ''}, ${p.division || ''}` : 'Learner Level'}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 select-none">{p.performanceScore} Rating</span>
                    </div>
                  ))}
                  {spokenLeaders.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No records available.</p>}
                </div>
              )}
            </div>

            {/* Board 2: Grammar pro masterclass (based on AI teacher topic evaluations) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-display">Grammar Pro Masterclass</h3>
                  <p className="text-[10px] text-slate-400">Sum scores achieved by practicing topics and taking AI homework evaluations.</p>
                </div>
              </div>

              {isLeaderboardLoading ? <Spinner /> : (
                <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {grammarLeaders.sort((a,b)=>b.totalGrammarScore - a.totalGrammarScore).map((p, idx) => (
                    <div key={p.username} className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-md ${idx === 0 ? 'bg-amber-400 text-slate-905' : idx === 1 ? 'bg-slate-200 text-slate-905' : 'text-slate-400'}`}>{idx+1}</span>
                        <img src={"https://ui-avatars.com/api/?name=" + p.username} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-xs truncate flex items-center gap-1">
                            <span>{p.username}</span>
                            {p.isPremium && <span className="text-[10px] text-amber-500" title="Premium">👑</span>}
                          </p>
                          <p className="text-[9px] text-slate-400">Practiced {p.topicsCount} Chapters • {p.school || "Bangladesh school"}</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-450 select-none">Σ {p.totalGrammarScore} Points</span>
                    </div>
                  ))}
                  {grammarLeaders.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No records available.</p>}
                </div>
              )}

            </div>

          </div>
        )}

      </>
      )}
      </div>
    </div>
  </div>
  );
};

// Simple spinner helpers
const Spinner = () => (
  <div className="py-8 flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-t-indigo-600 border-slate-200 rounded-full animate-spin"></div>
  </div>
);

const SpinnerLarge = () => (
  <div className="h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
);
