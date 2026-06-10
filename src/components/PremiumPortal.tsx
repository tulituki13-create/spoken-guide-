import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Award, 
  Lock, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Phone, 
  MessageSquare, 
  User, 
  Settings, 
  Trophy, 
  ChevronRight, 
  Crown,
  Heart,
  Loader,
  Search,
  MapPin,
  Map,
  Coins,
  Send,
  Zap,
  HelpCircle,
  RefreshCw,
  Gift,
  Locate,
  GraduationCap,
  Briefcase,
  Info,
  X
} from "lucide-react";

interface Performer {
  username: string;
  isPremium: boolean;
  whatsapp: string;
  isWhatsappPublic: boolean;
  performanceScore: number;
  chatTimeUsed: number;
  division: string;
  district: string;
  credits: number;
  isScorePublic: boolean;
  education?: string;
  occupation?: string;
  bio?: string;
  skills?: string;
  achievements?: string;
}

interface DiscoveredProfile {
  username: string;
  email: string;
  isPremium: boolean;
  whatsapp: string;
  isWhatsappPublic: boolean;
  division: string;
  district: string;
  performanceScore: number;
  credits: number;
  education?: string;
  occupation?: string;
  bio?: string;
  skills?: string;
  achievements?: string;
}

// Bangladeshi Divisions and Districts
const BANGLADESH_LOCATIONS: Record<string, string[]> = {
  Dhaka: [
    "Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur", 
    "Manikganj", "Munshiganj", "Narsingdi", "Madaripur", 
    "Shariatpur", "Gopalganj", "Rajbari", "Kishoreganj"
  ],
  Chattogram: [
    "Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Brahmanbaria", 
    "Rangamati", "Bandarban", "Khagrachhari", "Noakhali", "Lakshmipur", "Chandpur"
  ],
  Rajshahi: [
    "Rajshahi", "Bogura", "Naogaon", "Natore", "Joypurhat", "Chapainawabganj", "Pabna", "Sirajganj"
  ],
  Khulna: [
    "Khulna", "Jashore", "Satkhira", "Bagerhat", "Kushtia", "Meherpur", "Chuadanga", "Jhenaidah", "Magura", "Narail"
  ],
  Barishal: [
    "Barishal", "Bhola", "Patuakhali", "Pirojpur", "Jhalokati", "Barguna"
  ],
  Sylhet: [
    "Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"
  ],
  Rangpur: [
    "Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"
  ],
  Mymensingh: [
    "Mymensingh", "Jamalpur", "Netrokona", "Sherpur"
  ]
};

// SVG positions for division maps with friendly geometric curvatures
const DIVISION_MAP_PATHS = [
  { id: "Rangpur", name: "রংপুর (Rangpur)", d: "M 90,10 L 140,15 L 145,55 L 100,75 L 65,55 Z", cx: 105, cy: 35, color: "fill-amber-500/20 hover:fill-amber-500/40" },
  { id: "Rajshahi", name: "রাজশাহী (Rajshahi)", d: "M 35,70 L 65,55 L 100,75 L 110,120 L 65,135 L 35,115 Z", cx: 70, cy: 95, color: "fill-emerald-500/20 hover:fill-emerald-500/40" },
  { id: "Mymensingh", name: "ময়মনসিংহ (Mymensingh)", d: "M 140,15 L 195,20 L 200,75 L 150,85 L 145,55 Z", cx: 170, cy: 45, color: "fill-purple-500/20 hover:fill-purple-500/40" },
  { id: "Sylhet", name: "সিলেট (Sylhet)", d: "M 195,20 L 265,25 L 280,95 L 210,100 L 200,75 Z", cx: 235, cy: 60, color: "fill-pink-500/20 hover:fill-pink-500/40" },
  { id: "Dhaka", name: "ঢাকা (Dhaka)", d: "M 100,75 L 150,85 L 210,100 L 200,165 L 140,180 L 110,120 Z", cx: 152, cy: 125, color: "fill-blue-500/20 hover:fill-blue-500/40" },
  { id: "Khulna", name: "খুলনা (Khulna)", d: "M 45,140 L 110,120 L 135,185 L 115,255 L 55,240 Z", cx: 85, cy: 190, color: "fill-rose-500/20 hover:fill-rose-500/40" },
  { id: "Barishal", name: "বরিশাল (Barishal)", d: "M 135,185 L 185,180 L 195,250 L 145,255 L 115,255 Z", cx: 155, cy: 220, color: "fill-cyan-500/20 hover:fill-cyan-500/40" },
  { id: "Chattogram", name: "চট্টগ্রাম (Chattogram)", d: "M 200,165 L 210,100 L 275,120 L 290,195 L 270,240 L 295,295 L 255,295 L 235,235 L 200,215 Z", cx: 245, cy: 200, color: "fill-teal-500/20 hover:fill-teal-500/40" }
];

export const PremiumPortal: React.FC<{ activeTab?: 'location' | 'automap' }> = ({ activeTab = 'location' }) => {
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // State for settings form
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || "");
  const [isWhatsappPublic, setIsWhatsappPublic] = useState(user?.isWhatsappPublic ?? false);
  const [division, setDivision] = useState(user?.division || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [isScorePublic, setIsScorePublic] = useState(user?.isScorePublic ?? true);
  const [isProfilePublic, setIsProfilePublic] = useState(user?.isProfilePublic ?? true);
  const [email, setEmail] = useState(user?.email || "");
  
  // NEW profile custom fields requested by user
  const [education, setEducation] = useState(user?.education || "");
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(user?.skills || "");
  const [achievements, setAchievements] = useState(user?.achievements || "");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Active Map interactions & persistent filters representation
  const [hoveredDivision, setHoveredDivision] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [filterDivision, setFilterDivision] = useState<string>("");
  const [filterDistrict, setFilterDistrict] = useState<string>("");

  // Detailed modal state for user profile view
  const [selectedDetailUser, setSelectedDetailUser] = useState<any | null>(null);

  // State for performers leaderboard
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // State for active buddy discovery search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscoveredProfile[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // State for Inactivity Redistribution trigger
  const [isRedistributing, setIsRedistributing] = useState(false);
  const [redistributeNotice, setRedistributeNotice] = useState<string | null>(null);
  const [redistributionLogs, setRedistributionLogs] = useState<{ username: string; reward: number; newCredits: number }[]>([]);

  // Pre-load from user object when it changes
  useEffect(() => {
    if (user) {
      setWhatsapp(user.whatsapp || "");
      setIsWhatsappPublic(user.isWhatsappPublic ?? false);
      setDivision(user.division || "");
      setDistrict(user.district || "");
      setIsScorePublic(user.isScorePublic ?? true);
      setIsProfilePublic(user.isProfilePublic ?? true);
      setEmail(user.email || "");
      setEducation(user.education || "");
      setOccupation(user.occupation || "");
      setBio(user.bio || "");
      setSkills(user.skills || "");
      setAchievements(user.achievements || "");
    }
  }, [user?.username]);

  // Fetch performers list
  const fetchPerformers = async () => {
    setIsLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const headers: Record<string, string> = {};
      if (user && user.token) {
        headers["Authorization"] = `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`;
      }
      const res = await fetch("/api/auth/premium/performers", {
        headers
      });
      if (!res.ok) {
        throw new Error("Failed to load top performers. Please try again.");
      }
      const data = await res.json();
      setPerformers(data.performers || []);
    } catch (err: any) {
      setLeaderboardError(err.message || "An error occurred while loading leaderboard.");
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformers();
  }, [user?.username]);

  // Handle saving user profile modifications
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(null);

    try {
      const res = await fetch("/api/auth/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`
        },
        body: JSON.stringify({
          whatsapp: whatsapp.trim(),
          isWhatsappPublic,
          division,
          district,
          isScorePublic,
          isProfilePublic,
          email: email.trim(),
          education: education.trim(),
          occupation: occupation.trim(),
          bio: bio.trim(),
          skills: skills.trim(),
          achievements: achievements.trim()
        })
      });

      if (!res.ok) throw new Error("প্রোফাইল সেটিংস আপডেট করা যায়নি।");
      
      const data = await res.json();
      
      if (data.creditBonus > 0) {
        setSaveSuccess(`আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে! পাবলিক রেট অপশন চালু করায় আপনি উপহারস্বরূপ +${data.creditBonus} ক্রেডিট পেয়েছেন! ✨`);
      } else {
        setSaveSuccess("আপনার প্রোফাইল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      }

      await refreshUser();
      await fetchPerformers();

      setTimeout(() => {
        setSaveSuccess(null);
      }, 7000);
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  // Automated browser GeoLocation detection
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("দুঃখিত, আপনার ব্রাউজারটি Geolocation সমর্থন করে না।");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setDivision("Dhaka");
        setDistrict("Dhaka");
        alert("আপনার জিপিএস কোঅর্ডিনেট সফলভাবে শনাক্ত করা হয়েছে! ডিভিশন ও ডিস্ট্রিক্ট আপনার জন্য ঢাকা জোন স্বয়ংক্রিয়ভাবে নির্ধারণ করা হয়েছে, আপনি চাইলে ম্যানুয়ালি পরিবর্তন করতে পারেন।");
      },
      (error) => {
        alert("লোকেশন অ্যাক্সেস করা সম্ভব হয়নি। অনুগ্রহ করে ম্যানুয়ালি নিজের বিভাগ এবং জেলা সিলেক্ট করুন।");
      }
    );
  };

  // Triggers Buddy search on public index
  const handleSearchBuddies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/auth/profiles/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: {
          "Authorization": `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`
        }
      });
      if (!res.ok) throw new Error("অনুসন্ধান করা সফল হয়নি।");
      const data = await res.json();
      setSearchResults(data.profiles || []);
    } catch (err: any) {
      setSearchError(err.message || "An error occurred during search.");
    } finally {
      setIsSearching(false);
    }
  };

  // Triggers redistribution of inactive premium hidden credits
  const handleRedistributeHiddenCredits = async () => {
    if (!user || !user.isPremium) return;
    setIsRedistributing(true);
    setRedistributeNotice(null);
    setRedistributionLogs([]);

    try {
      const res = await fetch("/api/auth/premium/redistribute", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${String(user?.token || '').replace(/[^\x20-\x7E]/g, '').trim()}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to trigger redistribution.");
      
      setRedistributeNotice(data.message);
      if (data.details) {
        setRedistributionLogs(data.details);
      }
      await refreshUser();
      await fetchPerformers();
    } catch (err: any) {
      alert(err.message || "Error running redistribution engine.");
    } finally {
      setIsRedistributing(false);
    }
  };

  const getCleanWhatsappLink = (number: string, recipientName: string, myScore: number) => {
    const cleanNumber = number.replace(/[^0-9]/g, "");
    const textMessage = encodeURIComponent(
      `Hello ${recipientName}! I am also a student on Spoken English Buddy. I noticed your performance rating of ${myScore}% on the leaderboard. Let's practice speaking English together! 🤝`
    );
    return `https://wa.me/${cleanNumber}?text=${textMessage}`;
  };

  // Active map filtering values (merges cursor hovering and hardclicked filters)
  const activeDivision = hoveredDivision || filterDivision;
  const activeDistrict = hoveredDistrict || filterDistrict;

  // Filter performers based on interactive values "responsively" (per user spec)
  const filteredPerformers = performers.filter(p => {
    if (activeDivision && p.division !== activeDivision) return false;
    if (activeDistrict && p.district !== activeDistrict) return false;
    return true;
  });

  return (
    <div className="w-full mt-4 flex flex-col gap-6 animate-fade-in" id="premium-ultimate-portal">
      
      {/* ⚠️ SYSTEM WIDE CREDITS DISPLAY & SUMMARY */}
      <div className="bg-slate-950 border border-indigo-500/20 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 text-left relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center text-amber-300 border border-amber-400/30 shrink-0">
            <Coins className="w-6 h-6 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5 font-display">
              <span>ব্যবহারকারীর ক্রেডিট ওয়ালেট (Credit Wallet)</span>
              {user?.isPremium ? (
                <span className="text-[8px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">Premium Elite</span>
              ) : user ? (
                <span className="text-[8px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase">Standard User</span>
              ) : (
                <span className="text-[8px] font-bold bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full uppercase">Guest Mode</span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">সব ইউজার ফ্রিতে সাইনআপ করলেই ৫০০ ক্রেডিট পাবেন। পাবলিক প্রোফাইল প্রকাশ করার মাধ্যমে আরও ১০০০ ক্রেডিট গিফট লাভ করা যাবে!</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl shrink-0">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">AVAILABLE BALANCE:</span>
          <span className="text-xl font-mono font-black text-amber-300 flex items-center gap-1">
            {user && typeof user.credits === "number" ? user.credits.toLocaleString() : "500"} 
            <span className="text-xxs text-slate-400 font-bold uppercase font-sans">Credits</span>
          </span>
        </div>
      </div>

      {/* CORE PORTAL COMPONENT CANVAS */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative border border-white/5 overflow-hidden">
        
        {/* GOLD ACCENTS */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl"></div>

        {/* SECTION HEADER */}
        <div className="border-b border-indigo-500/20 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 border border-amber-300 rounded-2xl text-slate-950 shadow-lg shadow-amber-400/20 shrink-0">
              {activeTab === 'automap' ? <Map className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-black text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded uppercase tracking-widest">
                  {activeTab === 'automap' ? 'Map-Linked Leaderboards' : 'Personal Profiles'}
                </span>
                <span className="text-[8px] font-mono font-black text-slate-950 bg-amber-300 px-2 py-0.5 rounded uppercase tracking-widest">
                  {activeTab === 'automap' ? 'Interactive Map Live' : 'Profile Settings'}
                </span>
              </div>
              <h2 className="font-display font-black text-xl md:text-2xl mt-1 text-slate-100 uppercase tracking-tight">
                {activeTab === 'automap' ? 'ইন্টারেক্টিভ লিডারবোর্ড (Top Leaders)' : 'কাস্টম প্রোফাইল (My Profile)'}
              </h2>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {activeTab === 'automap' ? 'মানচিত্রের যেকোনো বিভাগ বা জেলার উপর কার্সার নাড়লে বা ক্লিক করলে সাথে সাথে সেই এলাকার টপ পারফর্মারদের তালিকা দেখতে পাবেন।' : 'আপনার শিক্ষাগত ব্যাকগ্রাউন্ড, বর্তমান কাজ, এবং লোকেশন কাস্টমাইজ করুন।'}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 gap-8 items-start">
          
          {/* COLUMN 1: INTERACTIVE USER SETTINGS & CUSTOMIZABLE PROFILE SETUP (5 Cols) */}
          {activeTab === 'location' && (
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
            
            {/* PROFILE & VISIBILITY SETUP FORM */}
            <div className="bg-slate-950/70 border border-white/5 hover:border-white/10 transition-colors p-5 rounded-2xl text-left flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-200">নিজের মনমতো প্রোফাইল ও লোকেশন কাস্টমাইজেশন</h3>
                </div>
                {(!user || !user.earnedPublicIncentive) && (
                  <span className="text-[8px] font-bold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2.5 py-1 rounded-lg animate-pulse flex items-center gap-1 shrink-0">
                    <Gift className="w-3 h-3" />
                    <span>+১০০০ বোনাস!</span>
                  </span>
                )}
              </div>

              {!user ? (
                <div className="py-4 text-center flex flex-col gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">নিজের কাস্টম প্রোফাইল তৈরি করুন</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      আপনার শিক্ষাগত ব্যাকগ্রাউন্ড, বর্তমান কাজ, বায়ো লিখুন এবং স্বয়ংক্রিয় বাংলাদেশি মানচিত্রে নিজের অঞ্চলের র‍্যাঙ্কিং দেখতে ওপে ফ্রিতে সাইনআপ বা লগইন সম্পন্ন করুন!
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded-xl text-xs transition-colors"
                  >
                    শুরু করতে ওপরে লগইন বা সাইনআপ করুন
                  </button>
                </div>
              ) : (
                <>
                  {saveSuccess && (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-[10px] text-emerald-300 leading-normal font-sans">
                      {saveSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-4.5">
                    
                    {/* EMAIL */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-slate-300">
                        আপনার ইমেইল (Email Address - Public Finder)
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                    </div>

                    {/* TWO-COLUMN PROFILE INPUTS for Education and Occupation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* EDUCATION */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                          <span>আজকে কি পড়াশোনা বা ব্যাকগ্রাউন্ড?</span>
                        </label>
                        <input
                          type="text"
                          value={education}
                          onChange={(e) => setEducation(e.target.value)}
                          placeholder="যেমন: BSc in English, HSC 2026, ইত্যাদি"
                          className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-650 focus:outline-none"
                        />
                      </div>

                      {/* CURRENT OCCUPATION/WHAT THEY RE DOING */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                          <span>বর্তমানে কি করছেন? (Occupation)</span>
                        </label>
                        <input
                          type="text"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          placeholder="যেমন: IELTS ক্যান্ডিডেট, সফটওয়্যার ইঞ্জিনিয়ার"
                          className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-650 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* BIO - BRIEF INTRO */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-slate-300">
                        স্বল্প পরিচিতি / বায়ো (About Myself)
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="নিজের স্পিকিং লক্ষ্য ও রুচি সম্পর্কে ৩-৪ টি চমৎকার বাক্য লিখুন যাতে অন্যরা সহজে আপনাকে কো-লার্নিং ফ্রেন্ড হিসেবে বেছে নেয়..."
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-600 focus:outline-none h-16 resize-none font-sans"
                      />
                    </div>

                    {/* SPECIAL ADDITIONAL PATH DETAILS: TARGET SKILLS AND PERSONAL MILESTONES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* SKILLS */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-slate-300">
                          ইংরেজি দক্ষতা / লক্ষ্য (English Focus)
                        </label>
                        <input
                          type="text"
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="যেমন: IELTS Speaking Band 7.5 plus, Fluency"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* ACHIEVEMENTS */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-slate-300">
                          অর্জন ও পারফরম্যান্স মাইলস্টোন (Achievements)
                        </label>
                        <input
                          type="text"
                          value={achievements}
                          onChange={(e) => setAchievements(e.target.value)}
                          placeholder="যেমন: Spoke for 50 mins, Complete 10 Mock"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* WHATSAPP */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                        <Phone className="w-3 text-emerald-450" />
                        <span>WhatsApp নম্বর (Direct Contact API: +88017XXXXXXXX)</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={18}
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+8801712345678"
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white placeholder-slate-650 focus:outline-none font-mono"
                      />
                    </div>

                    {/* LOCATION SELECTORS */}
                    <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>বাংলাদেশি ম্যাপ বিভাগ নির্বাচন</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoDetectLocation}
                          className="text-[9px] font-mono text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                        >
                          <Locate className="w-3 h-3" />
                          <span>GPS ট্র্যাকিং অটো</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">বিভাগ (Division)</span>
                          <select
                            required
                            value={division}
                            onChange={(e) => {
                              setDivision(e.target.value);
                              setDistrict(""); // reset district
                            }}
                            className="bg-slate-950 border border-white/10 text-xs rounded-lg px-2 py-1.5 focus:outline-none text-white cursor-pointer"
                          >
                            <option value="">সিলেক্ট করুন</option>
                            {Object.keys(BANGLADESH_LOCATIONS).map(div => (
                              <option key={div} value={div}>{div}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">জেলা (District)</span>
                          <select
                            required
                            disabled={!division}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="bg-slate-950 border border-white/10 text-xs rounded-lg px-2 py-1.5 focus:outline-none text-white cursor-pointer disabled:opacity-40"
                          >
                            <option value="">সিলেক্ট করুন</option>
                            {division && BANGLADESH_LOCATIONS[division]?.map(dist => (
                              <option key={dist} value={dist}>{dist}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* PRIVACY TOGGLES BLOCK */}
                    <div className="bg-slate-950 border border-white/5 p-3 rounded-xl flex flex-col gap-3">
                      <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest font-display">প্রাইভেসি ও ডিসপ্লে কন্ট্রোল সেটিংস</h4>

                      <div className="flex flex-col gap-2.5 text-[11px]">
                        {/* LEADERBOARD TOGGLE */}
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-amber-400 cursor-pointer"
                            checked={isScorePublic}
                            onChange={(e) => setIsScorePublic(e.target.checked)}
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold text-slate-200">লিডারবোর্ডে স্কোর লাইভ রাখুন (Public rating)</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">সবাই আপনার AI Coach স্পিকিং পারফরম্যান্স রেটিং এবং বিভাগ দেখতে পারবে।</p>
                          </div>
                        </label>

                        <div className="border-t border-white/5 my-0.5"></div>

                        {/* SEARCH DISCOVERY TOGGLE */}
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-amber-400 cursor-pointer"
                            checked={isProfilePublic}
                            onChange={(e) => setIsProfilePublic(e.target.checked)}
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold text-slate-200">সার্চ ডিরেক্টরিতে প্রোফাইল প্রকাশ করুন (Find Buddies)</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">অন্যান্য সতীর্থরা আপনার শিক্ষাগত যোগ্যতা, বর্তমান কাজ এবং কাস্টম অর্জন দেখে আপনাকে নির্বাচন করতে পারবে।</p>
                          </div>
                        </label>

                        <div className="border-t border-white/5 my-0.5"></div>

                        {/* WHATSAPP VISIBILITY TOGGLE */}
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-amber-400 cursor-pointer"
                            checked={isWhatsappPublic}
                            onChange={(e) => setIsWhatsappPublic(e.target.checked)}
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-bold text-slate-200">হোয়াটসঅ্যাপ নম্বর সবার সাথে শেয়ার করুন</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">সবুজ হোয়াটসঅ্যাপ ডিরেক্টরি বাটনটি উন্মুক্ত থাকবে সরাসরি অন্য বন্ধুদের মেসেজ দেওয়ার জন্য।</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* SAVE ACTION BUTTON */}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>সংরক্ষণ করা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-slate-950 font-black" />
                          <span>প্রোফাইল সেটিংস ও বায়ো আপডেট করুন</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* DIRECT BUDDIES DISCOVERY SEARCH BOX */}
            <div className="bg-slate-950/70 border border-white/5 transition-colors p-5 rounded-2xl text-left flex flex-col gap-3.5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200">বডি ডিসকভারি সার্চ (Find English Buddies)</h3>
              </div>
              <p className="text-[10px] text-slate-400">খুঁজে বার করুন অন্যান্য সতীর্থ ইংরেজি অনুরাগী বন্ধুদের তাদের ইউজারনেম বা নির্দিষ্ট ইমেইল দিয়ে সার্চ করে!</p>
              
              {!user ? (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                  <Lock className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[10px] text-slate-400 block leading-normal font-sans">
                    সতীর্থদের প্রোফাইল অনুসন্ধান করতে ও হোয়াটসঅ্যাপ ডিরেক্টরি অ্যাক্সেস করতে অনুগ্রহ করে ওপরে লগইন বা সাইনআপ সম্পন্ন করুন।
                  </span>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSearchBuddies} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ইউজারনেম বা ইমেইল টাইপ করুন..."
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-amber-400 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-3 bg-indigo-500 hover:bg-indigo-600 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer text-slate-100"
                    >
                      {isSearching ? <Loader className="w-3.5 h-3.5 animate-spin" /> : "সার্চ"}
                    </button>
                  </form>

                  {searchError && (
                    <span className="text-[10px] text-red-400 block">{searchError}</span>
                  )}

                  {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {searchResults.map(profile => (
                        <div 
                          key={profile.username} 
                          onClick={() => navigate('/social', { state: { profileMode: profile.username } })}
                          className="bg-indigo-950/50 border border-white/5 hover:border-indigo-400/30 p-2.5 rounded-xl flex items-center justify-between gap-1.5 cursor-pointer hover:bg-indigo-950 transition-colors"
                        >
                          <div className="text-left overflow-hidden min-w-0">
                            <h4 className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                              <span>{profile.username}</span>
                              {profile.isPremium && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                            </h4>
                            <p className="text-[9px] text-indigo-200/80 truncate">
                              {profile.occupation || profile.education || "Student Member"}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8px] bg-slate-900 border border-white/5 text-amber-300 font-bold px-1.5 py-0.5 rounded-md">View Profile</span>
                            {profile.isWhatsappPublic && profile.whatsapp && (
                              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950">
                                <Phone className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.trim().length > 0 && !isSearching && (
                    <span className="text-[10px] text-slate-500 block">কোনো পাবলিক বন্ধু পাওয়া যায়নি এই কীওয়ার্ডে।</span>
                  )}
                </>
              )}
            </div>
          </div>
          )}

          {activeTab === 'automap' && (
            <div className="flex flex-col gap-8 w-full">
              
              {/* 🏆 ALL-OVER BANGLADESH NATIONWIDE LEADERS LIST PANEL */}
              <div className="bg-slate-950/85 border border-amber-500/20 p-6 rounded-3xl text-left flex flex-col gap-5 relative overflow-hidden shadow-xl">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-500/10 pb-4 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-400/10 border border-amber-400/30 rounded-2xl text-amber-300">
                      <Trophy className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-100 flex items-center gap-2 font-display uppercase tracking-tight">
                        <span>সর্বোপরি বাংলাদেশ চ্যাট লিডারবোর্ড (Top Spoken Leaders - All over Bangladesh)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">সব বিভাগে গড় স্পিকিং ও চ্যাটিং পারফরম্যান্সে শ্রেষ্ঠত্ব অর্জনকারী সেরা শিক্ষার্থীরা</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchPerformers}
                    className="text-[10px] font-mono text-indigo-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all self-start sm:self-auto shrink-0 select-none"
                  >
                    সর্বশেষ রিফ্রেশ করুন
                  </button>
                </div>

              {isLeaderboardLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-center select-none">
                  <div className="w-8 h-8 border-2 border-t-amber-400 border-white/10 rounded-full animate-spin mb-3"></div>
                  <span className="text-xs text-amber-200/80 font-mono">লাইভ স্কোর সার্ভার থেকে সংগ্রহ করা হচ্ছে...</span>
                </div>
              )}

              {leaderboardError && !isLeaderboardLoading && (
                <div className="bg-red-500/10 border border-red-500/25 text-red-300 rounded-xl p-4 text-xs text-center">
                  {leaderboardError}
                </div>
              )}

              {!isLeaderboardLoading && !leaderboardError && performers.length === 0 && (
                <div className="py-12 text-center flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-slate-900/10">
                  <Trophy className="w-8 h-8 text-slate-650 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">কোনো শিক্ষার্থীর এন্ট্রি রেকর্ড পাওয়া যায়নি।</p>
                </div>
              )}

              {!isLeaderboardLoading && !leaderboardError && performers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {[...performers]
                    .sort((a, b) => b.performanceScore - a.performanceScore)
                    .slice(0, 10)
                    .map((performer, idx) => {
                      const isTop3 = idx < 3;
                      const rankStyles = [
                        "bg-gradient-to-r from-amber-500/15 to-amber-300/5 border-amber-400/40 text-amber-300",
                        "bg-gradient-to-r from-slate-300/15 to-slate-400/5 border-slate-300/30 text-slate-300",
                        "bg-gradient-to-r from-amber-700/15 to-amber-850/5 border-amber-800/25 text-amber-600"
                      ];
                      
                      const itemBg = isTop3 
                        ? rankStyles[idx] 
                        : "bg-slate-900/50 border-white/5 text-slate-400";

                      const badgeBg = idx === 0 
                        ? "bg-amber-400 text-slate-950 font-black scale-110" 
                        : idx === 1 
                        ? "bg-slate-300 text-slate-950 font-black" 
                        : idx === 2 
                        ? "bg-amber-600 text-white font-black" 
                        : "bg-slate-800 border border-white/5 text-slate-300";

                      return (
                        <div 
                          key={performer.username}
                          onClick={() => navigate('/social', { state: { profileMode: performer.username } })}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:bg-white/10 cursor-pointer ${itemBg}`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 ${badgeBg}`}>
                              {idx + 1}
                            </div>
                            
                            <div className="relative">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-slate-300 uppercase">
                                  {performer.username.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              {performer.isPremium && (
                                <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-0.5 border border-slate-900">
                                  <Crown className="w-1.5 h-1.5 text-slate-950 fill-amber-400" />
                                </div>
                              )}
                            </div>

                            <div className="text-left overflow-hidden">
                              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 truncate">
                                <span>{performer.username}</span>
                                {user && performer.username === user.username && (
                                  <span className="text-[7px] font-mono font-black bg-blue-500 text-white px-1.5 py-0.2 rounded-full uppercase">You</span>
                                )}
                              </h4>
                              <div className="flex items-center gap-1 text-[8.5px] text-slate-400 mt-0.5 font-medium truncate">
                                <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                <span>{performer.district || performer.division || "বাংলাদেশ"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[7px] font-mono uppercase text-slate-500 block">Rating</span>
                              <span className="text-xs font-mono font-black text-amber-300">{performer.performanceScore}%</span>
                            </div>
                            <span className="text-[8px] tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold px-2 py-0.8 rounded-lg">View</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* 🏢 DIVISION-WISE LEADERBOARDS & INTERACTIVE METRICS HUB */}
            <div className="bg-slate-950/75 border border-indigo-500/20 p-6 rounded-3xl text-left flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-500/10 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-2xl">
                    <Map className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-100 flex items-center gap-2 font-display uppercase tracking-tight">
                      <span>বিভাগ ভিত্তিক চ্যাট চয়েজ ও উন্নয়ন মেট্রিক্স (Division Performance Metrics)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">বাংলাদেশের ৮টি বিভাগে আমাদের লার্নিং সদস্যদের চ্যাট সক্রিয়তা ও গড় স্কোর ট্র্যাক করুন</p>
                  </div>
                </div>
                {filterDivision && (
                  <button 
                    onClick={() => {
                      setFilterDivision("");
                      setFilterDistrict("");
                    }}
                    className="text-[9px] px-2.5 py-1.5 bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 rounded-lg font-bold font-mono uppercase tracking-wider"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* 📊 INTERACTIVE METRICS DASHBOARD GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const items = Object.keys(BANGLADESH_LOCATIONS).map((divKey) => {
                    const listForDiv = performers.filter(p => p.division === divKey);
                    const usersCount = listForDiv.length;
                    const avgScore = usersCount > 0 
                      ? Math.round(listForDiv.reduce((acc, p) => acc + (p.performanceScore || 0), 0) / usersCount) 
                      : 0;
                    return { divKey, usersCount, avgScore };
                  });

                  return items.map(({ divKey, usersCount, avgScore }) => {
                    const isSelected = filterDivision === divKey;
                    
                    return (
                      <button
                        key={divKey}
                        onClick={() => {
                          if (filterDivision === divKey) {
                            setFilterDivision("");
                            setFilterDistrict("");
                          } else {
                            setFilterDivision(divKey);
                            setFilterDistrict("");
                          }
                        }}
                        className={`p-3.5 rounded-2xl text-left border flex flex-col justify-between transition-all group overflow-hidden relative select-none cursor-pointer ${
                          isSelected 
                            ? "bg-gradient-to-b from-indigo-950 to-indigo-900 border-amber-400 ring-1 ring-amber-400/50 shadow-md shadow-indigo-500/10" 
                            : "bg-slate-900 border-white/5 hover:border-indigo-500/40 hover:bg-slate-850"
                        }`}
                      >
                        {isSelected && <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400/10 rounded-full blur-xl"></div>}
                        
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[11px] font-bold ${isSelected ? "text-amber-300" : "text-slate-200 group-hover:text-indigo-300"} transition-colors`}>
                              {divKey}
                            </span>
                            <span className="text-[7px] bg-slate-950 font-mono text-slate-400 border border-white/5 px-1 py-0.2 rounded font-black">
                              {usersCount} Active
                            </span>
                          </div>
                          
                          <div className="mt-2.5 flex items-baseline gap-1">
                            <span className="text-sm font-mono font-black text-slate-100">{avgScore}%</span>
                            <span className="text-[7.5px] uppercase font-bold tracking-wider text-slate-500">Avg Score</span>
                          </div>
                        </div>

                        {/* Custom progressive visual indicators */}
                        <div className="mt-3 w-full bg-slate-950/85 rounded-full h-1 relative overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSelected ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-gradient-to-r from-indigo-500 to-blue-400'
                            }`}
                            style={{ width: `${Math.max(avgScore, 5)}%` }}
                          />
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Selected location context / filters panel */}
              {filterDivision && (
                <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-left select-none">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>বিভাগ: {filterDivision} (Selected Division)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      এই বিভাগে চ্যাটিং করা {filteredPerformers.length} জন সক্রিয় স্পিকিং শিক্ষার্থী পাওয়া গেছে।
                    </p>
                  </div>

                  {/* Refine by District selectors */}
                  <div className="flex flex-wrap gap-1.5 self-start">
                    <button
                      onClick={() => setFilterDistrict("")}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                        !filterDistrict 
                          ? "bg-amber-400 text-slate-950" 
                          : "bg-slate-950 border border-white/10 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      All Districts (সব জেলা)
                    </button>
                    {(BANGLADESH_LOCATIONS[filterDivision] || []).map((dist) => {
                      const isSelected = filterDistrict === dist;
                      const hasDistLeaders = performers.some(p => p.district === dist);
                      return (
                        <button
                          key={dist}
                          onClick={() => setFilterDistrict(isSelected ? "" : dist)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all ${
                            isSelected
                              ? "bg-indigo-500 text-white font-bold"
                              : hasDistLeaders
                              ? "bg-indigo-950/50 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-900"
                              : "bg-slate-950 border border-white/5 text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          {dist}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Leaderboards for Selected Division / All Division lists below */}
              <div className="mt-1 flex flex-col gap-3.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono block">
                  {filterDivision 
                    ? `🏆 ${filterDivision} বিভাগে সেরা শিক্ষার্থীরা (Division Top Performers Rankings):`
                    : `👋 সকল বিভাগে সেরা শিক্ষার্থীরা (Full Members Rankings List):`
                  }
                </span>

                {filteredPerformers.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-slate-900/10">
                    <Trophy className="w-8 h-8 text-slate-750 mb-2" />
                    <p className="text-xs text-slate-400 font-bold">এই এলাকায় কোনো শিক্ষার্থীর এন্ট্রি রেকর্ড পাওয়া যায়নি।</p>
                    <p className="text-[9px] text-slate-500 mt-1">প্রোফাইল সেটিংস এ নিজের জেলা বা বিভাগ আপডেট করার সাথে সাথে প্রথম এন্ট্রি হয়ে র‍্যাঙ্কিং-এ স্কোর দেখা যাবে!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {filteredPerformers.map((performer, idx) => {
                      return (
                        <div 
                          key={performer.username}
                          onClick={() => navigate('/social', { state: { profileMode: performer.username } })}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/5 bg-slate-900/40 hover:bg-white/5 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold bg-slate-950 text-slate-400 border border-white/5 shrink-0">
                              {idx + 1}
                            </div>

                            <div className="relative">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-slate-300">
                                  {performer.username.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              {performer.isPremium && (
                                <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-0.5 border border-slate-900">
                                  <Crown className="w-1.5 h-1.5 text-slate-950 fill-amber-400" />
                                </div>
                              )}
                            </div>

                            <div className="text-left overflow-hidden">
                              <h4 className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5 font-sans">
                                <span>{performer.username}</span>
                                {user && performer.username === user.username && (
                                  <span className="text-[7px] font-black bg-blue-500 text-white px-1.5 py-0.2 rounded-full uppercase font-mono">You</span>
                                )}
                              </h4>
                              
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[8px] text-amber-300 bg-amber-400/10 border border-amber-400/10 px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0 font-medium">
                                  <MapPin className="w-2.5 h-2.5 text-amber-500" />
                                  <span>{performer.district || performer.division}</span>
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">
                                  সময়: {Math.round(performer.chatTimeUsed / 60)} মি.
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                            <div className="text-left sm:text-right">
                              <span className="text-[7.5px] font-mono text-slate-500 block">Rating</span>
                              <span className="text-xs font-mono font-black text-amber-300">{performer.performanceScore}%</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="px-2 py-0.8 bg-white/5 hover:bg-white/10 text-[8px] text-slate-300 font-bold rounded-lg border border-white/5 uppercase select-none">
                                View Profile
                              </span>
                              
                              {performer.isWhatsappPublic && performer.whatsapp ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(getCleanWhatsappLink(performer.whatsapp, performer.username, performer.performanceScore), "_blank");
                                  }}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 font-bold text-xxs text-slate-950 rounded-xl flex items-center gap-0.5 shadow cursor-pointer transition-all"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>WA</span>
                                </button>
                              ) : (
                                <span className="p-1 px-1.5 bg-slate-950 border border-white/5 text-[8.5px] text-slate-600 rounded-xl flex items-center gap-0.5 select-none font-medium">
                                  <EyeOff className="w-2.5 h-2.5" />
                                  <span>Private</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* PREMIUM MEMBERS EXCLUSIVE REDISTRIBUTER */}
            {user?.isPremium && (
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border border-amber-400/20 p-5 rounded-2xl text-left flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 text-amber-400/20 pointer-events-none">
                  <Crown className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 z-10 font-display">
                  <Zap className="w-4.5 h-4.5 text-amber-400" />
                  <h3 className="text-xs font-black text-slate-205 uppercase tracking-tight">
                    নিষ্ক্রিয় হিডেন ক্রেডিট দাবীদার (Active Performer Bonus Engine)
                  </h3>
                </div>
                
                <p className="text-[10px] text-slate-300 leading-normal z-10 font-sans">
                  প্রতিটি নতুন প্রিমিয়াম ব্যবহারকারী ১০,০০০ প্রমিত ক্রেডিট ও ১,০০০ গোপন (সবাই দেখতে পারে না এমন) ক্রেডিট পান। যারা সিস্টেমটি ব্যবহার করছেন না বা অলস পড়ে আছেন, তাদের অ্যাকাউন্ট থেকে ১,০০০ হিডেন ক্রেডিট উঠিয়ে এনে শীর্ষ ১০ জন অ্যাক্টিভ শিক্ষার্থীদের মাঝে পারফরম্যান্স অনুযায়ী ডিস্ট্রিবিউট করা হয়!
                </p>

                <button
                  onClick={handleRedistributeHiddenCredits}
                  disabled={isRedistributing}
                  className="w-full py-2 bg-slate-950 border border-amber-400/40 hover:border-amber-400 hover:bg-amber-400/10 text-amber-300 text-xxs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 z-10 flex items-center justify-center gap-1.5"
                >
                  {isRedistributing ? (
                     <>
                       <Loader className="w-3 animate-spin" />
                       <span>পড়ুন ও দাবি হচ্ছে...</span>
                     </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "15s" }} />
                      <span>ফ্রি ক্রেডিট দাবি করুন (Take Hidden Inactive Credits)</span>
                    </>
                  )}
                </button>

                {redistributeNotice && (
                  <div className="bg-amber-400/10 border border-amber-400/20 text-amber-200 p-3 rounded-lg text-[9px] leading-relaxed z-10">
                    👍 {redistributeNotice}
                  </div>
                )}

                {redistributionLogs.length > 0 && (
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-white/5 max-h-[140px] overflow-y-auto flex flex-col gap-1.5 z-10">
                    <span className="text-[8px] font-black text-slate-400 tracking-wider block uppercase border-b border-white/5 pb-1 font-mono">বন্টন লগ (Distribution Records)</span>
                    {redistributionLogs.map((log, i) => (
                      <div key={log.username} className="flex justify-between items-center text-[9px] font-mono select-none">
                        <span className="text-slate-300 font-bold">{i+1}. {log.username}</span>
                        <span className="text-emerald-400">+{log.reward} Credits</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
          )}

        </div>

      </div>

      {/* --- BRAND NEW USER PROFILE DETAIL VIEW MODAL (Requested) --- */}
      {selectedDetailUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setSelectedDetailUser(null)}>
          <div 
            className="w-full max-w-lg bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-400/30 rounded-3xl p-6 relative shadow-2xl text-left overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Absolute close button */}
            <button 
              onClick={() => setSelectedDetailUser(null)}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors font-bold cursor-pointer"
            >
              <X className="w-4.5 h-4.5 text-slate-400 hover:text-white" />
            </button>

            {/* Premium crown backdrop */}
            {selectedDetailUser.isPremium && (
              <div className="absolute top-0 right-0 p-8 text-amber-400/5 rotate-12 pointer-events-none select-none">
                <Crown className="w-40 h-40" />
              </div>
            )}

            {/* Avatar header card */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-5 mb-5 shrink-0">
              <div className="w-14 h-14 bg-amber-450 text-slate-950 border-2 border-amber-300 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 select-none">
                {selectedDetailUser.username.substring(0, 2).toUpperCase()}
              </div>

              <div className="overflow-hidden min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black tracking-wide text-slate-100 font-display truncate">
                    {selectedDetailUser.username}
                  </h3>
                  {selectedDetailUser.isPremium && (
                    <span className="text-[8px] font-black tracking-widest uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                      <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      <span>PREMIUM ELITE</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium mt-1 select-none">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {selectedDetailUser.district || selectedDetailUser.division 
                      ? `${selectedDetailUser.district || ""}, ${selectedDetailUser.division || ""}`
                      : "বাংলাদেশি এলাকা সেট করা নেই"}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile fields content layout */}
            <div className="flex flex-col gap-4">
              
              {/* OCCUPATION & EDUCATION ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* EDUCATION */}
                <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block font-mono">EDUCATIONAL BACKGROUND:</span>
                  <p className="text-xs text-slate-200 mt-1 font-semibold flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{selectedDetailUser.education || "English Student"}</span>
                  </p>
                </div>

                {/* OCCUPATION */}
                <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block font-mono">CURRENT OCCUPATION:</span>
                  <p className="text-xs text-slate-200 mt-1 font-semibold flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{selectedDetailUser.occupation || "Listening Participant"}</span>
                  </p>
                </div>
              </div>

              {/* BIO / BRIEF INTRO */}
              <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl flex flex-col">
                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block font-mono">BIO/ABOUT MYSELF:</span>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans font-medium whitespace-pre-line italic">
                  "{selectedDetailUser.bio || "এই ব্যবহারকারী এখনো নিজের বায়ো কাস্টমাইজ করেননি। কিন্তু সে প্রতিদিন বাডি টিউটরের সাথে সাবলীলভাবে ইংরেজি কথাবলার চর্চা চালিয়ে যাচ্ছেন!"}"
                </p>
              </div>

              {/* TARGET SKILLS AND MILESTONES ACHIEVED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SKILLS */}
                <div className="bg-slate-900 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] text-indigo-300 uppercase block font-mono">ENGLISH TARGET SKILLS:</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
                    <span>{selectedDetailUser.skills || "fluency, pronunciation improvement"}</span>
                  </p>
                </div>

                {/* MILESTONES */}
                <div className="bg-slate-900 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] text-indigo-300 uppercase block font-mono">PERFORMANCE ACHIEVEMENTS:</span>
                  <p className="text-xs font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-yellow-550 shrink-0" />
                    <span>{selectedDetailUser.achievements || "Complete conversational loops"}</span>
                  </p>
                </div>
              </div>

              {/* SPEECH SCORE AND CHATTED SPEED STATS */}
              <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 border border-indigo-500/20 p-3.5 rounded-xl flex items-center justify-between text-left">
                <div>
                  <span className="text-[9px] text-indigo-300 block uppercase font-mono tracking-wider">AI Coach Average Rating:</span>
                  <span className="text-2xl font-mono font-black text-amber-300">{selectedDetailUser.performanceScore || 0}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-indigo-300 block uppercase font-mono tracking-wider">Chat Duration:</span>
                  <span className="text-xs font-mono font-black text-slate-200 block mt-0.5">
                    {Math.round((selectedDetailUser.chatTimeUsed || 0) / 60)} minutes completed
                  </span>
                </div>
              </div>

              {/* WHATSAPP CTA AND SAFE DIAL DIRECTIVES */}
              <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-2.5">
                {selectedDetailUser.isWhatsappPublic && selectedDetailUser.whatsapp ? (
                  <>
                    <a
                      href={getCleanWhatsappLink(selectedDetailUser.whatsapp, selectedDetailUser.username, selectedDetailUser.performanceScore)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs text-center rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:scale-[1.01] transition-all"
                    >
                      <Phone className="w-4 h-4 text-slate-950" />
                      <span>WhatsApp এ সরাসরি যোগাযোগ করুন (Text Now)</span>
                    </a>
                    <span className="text-[9px] text-slate-400 text-center block">
                      নিরাপদ থাকুন! যেকোনো ধরনের ব্যক্তিগত আর্থিক লেনদেনের করার পুর্বে মডারেটরদের সাথে কথা বলুন।
                    </span>
                  </>
                ) : (
                  <div className="p-3.5 bg-slate-950 border border-white/5 rounded-2xl text-center flex flex-col gap-1 text-slate-400 select-none">
                    <span className="text-xxs font-bold text-slate-500 flex items-center gap-1 justify-center">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>WhatsApp Contact is Private</span>
                    </span>
                    <p className="text-[9px] text-slate-500 leading-normal">
                      এই শিক্ষার্থী তার হোয়াটসঅ্যাপ নম্বরটি সবার জন্য উন্মুক্ত রাখতে চাননি। আপনি তার অর্জিত স্কোর দেখে নিজেকে অনুপ্রাণিত করতে পারেন!
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
