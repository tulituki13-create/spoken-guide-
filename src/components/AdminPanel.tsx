import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { 
  Lock, X, Plus, Trash2, CheckCircle, Edit2, RotateCcw, 
  Users, CreditCard, MessageSquare, RefreshCw, Sparkles, 
  Shield, UserCheck, Search, Clock, AlertCircle, Check, Save, 
  BookOpen, Sliders, Upload, Play, Eye, Copy, ExternalLink, Smartphone, Terminal
} from "lucide-react";



interface AdminPanelProps {
  onClose: () => void;
}

type TabType = 'user-transactions' | 'approvals' | 'scenarios' | 'plans' | 'messages' | 'payment-methods' | 'sms-receiver' | 'credit-pricing';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestrictedAuditor, setIsRestrictedAuditor] = useState(false);
  const [secret, setSecret] = useState("");
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localProfitMargin, setLocalProfitMargin] = useState('20');
  const [calcBdt, setCalcBdt] = useState<number>(20);
  const [feedback, setFeedback] = useState('');
  const fetchSettings = async () => { try { const res = await fetch('/api/auth/settings'); if (res.ok) { const data = await res.json(); setLocalProfitMargin(data.profitMargin || '20'); } } catch(e) {} };
  useEffect(() => { if (isAuthenticated) fetchSettings(); }, [isAuthenticated]);
  const saveSettings = async () => { try { setFeedback('Saving...'); const res = await fetch('/api/auth/admin/settings', { method: 'POST', headers: { 'admin-secret': secret, 'Content-Type': 'application/json' }, body: JSON.stringify({ profitMargin: localProfitMargin }) }); if (res.ok) setFeedback('Saved successfully!'); setTimeout(()=>setFeedback(''), 3000); } catch(e) {} };
  
  // Payment methods states
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState("");
  const [methodNumber, setMethodNumber] = useState("");
  const [methodType, setMethodType] = useState("Personal");
  const [pmStatusMsg, setPmStatusMsg] = useState("");
  
  // New Scenario Form / Edit Scenario Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💬");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [icebreaker, setIcebreaker] = useState("");
  const [difficulty, setDifficulty] = useState("মাঝারি");
  const [topicPdfId, setTopicPdfId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get('tab') as TabType;
  const [tab, setTab] = useState<TabType>(queryTab || 'user-transactions');
  
  // Lists fetched from APIs
  const [users, setUsers] = useState<any[]>([]);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  
  // Controls
  const [trxSubTab, setTrxSubTab] = useState<'waiting-matches' | 'submitted-purchases' | 'complete-billing' | 'users'>('waiting-matches');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [smsText, setSmsText] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [plansStatusMsg, setPlansStatusMsg] = useState("");
  const [userSearchText, setUserSearchText] = useState("");
  const [trxSearchText, setTrxSearchText] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [activeGuideTab, setActiveGuideTab] = useState<'macrodroid' | 'shortcuts' | 'apps' | 'payload'>('macrodroid');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };
  
  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/auth/payment-methods");
      if (res.ok) {
        setPaymentMethods(await res.json());
      }
    } catch (e) {
      console.error("fetchPaymentMethods error", e);
    }
  };

  const savePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodName || !methodNumber) return;
    try {
      setLoading(true);
      setPmStatusMsg("পেমেন্ট পদ্ধতি আপডেট করা হচ্ছে...");
      const url = editingPaymentMethodId 
        ? `/api/auth/admin/payment-methods/${editingPaymentMethodId}` 
        : `/api/auth/admin/payment-methods`;
      const method = editingPaymentMethodId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          "admin-secret": secret,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: methodName, number: methodNumber, type: methodType })
      });
      
      if (res.ok) {
        setPmStatusMsg(editingPaymentMethodId ? "Payment method updated successfully!" : "Payment method created successfully!");
        setMethodName("");
        setMethodNumber("");
        setMethodType("Personal");
        setEditingPaymentMethodId(null);
        fetchPaymentMethods();
        setTimeout(() => setPmStatusMsg(""), 3500);
      } else {
        const errData = await res.json();
        setPmStatusMsg(`Error: ${errData.error || "Failed to save payment method"}`);
      }
    } catch (err: any) {
      setPmStatusMsg(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/auth/admin/payment-methods/${id}`, {
        method: "DELETE",
        headers: {
          "admin-secret": secret
        }
      });
      if (res.ok) {
        setPmStatusMsg("Payment method deleted successfully!");
        fetchPaymentMethods();
        setTimeout(() => setPmStatusMsg(""), 3500);
      } else {
        const errData = await res.json();
        setPmStatusMsg(`Error: ${errData.error || "Failed to delete"}`);
      }
    } catch (err: any) {
      setPmStatusMsg(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditPaymentMethod = (pm: any) => {
    setEditingPaymentMethodId(pm.id);
    setMethodName(pm.name);
    setMethodNumber(pm.number);
    setMethodType(pm.type || "Personal");
  };

  const cancelEditPaymentMethod = () => {
    setEditingPaymentMethodId(null);
    setMethodName("");
    setMethodNumber("");
    setMethodType("Personal");
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/auth/plans");
      if (res.ok) {
        setPlans(await res.json());
      }
    } catch (e) {}
  };

  const savePlanChanges = async (planId: string, updatedPlan: any) => {
    try {
      setPlansStatusMsg(`অবস্থা: ${updatedPlan.name || planId} আপডেট করা হচ্ছে...`);
      const res = await fetch(`/api/auth/admin/plans/${planId}`, {
        method: "POST",
        headers: {
          "admin-secret": secret,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedPlan)
      });
      if (res.ok) {
        setPlansStatusMsg("Pricing Plan limits updated successfully!");
        fetchPlans();
        setTimeout(() => setPlansStatusMsg(""), 3500);
      } else {
        const errData = await res.json();
        setPlansStatusMsg(`Error: ${errData.error || "Failed to save changes"}`);
      }
    } catch (e: any) {
      setPlansStatusMsg(`Network Error: ${e.message}`);
    }
  };

  const addNewPlan = async () => {
    const id = "feature_" + Math.random().toString(36).substring(2, 9);
    const name = "Custom Premium Feature";
    const price = 100;

    try {
      setPlansStatusMsg(`Adding custom feature plan...`);
      const res = await fetch(`/api/auth/admin/plans-add`, {
        method: "POST",
        headers: {
          "admin-secret": secret,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          name,
          price,
          timeLimitSeconds: 3600,
          pdfUploadAllowed: 1,
          whatsappAllowed: 1,
          scenarioPdfAllowed: 1
        })
      });
      if (res.ok) {
        setPlansStatusMsg("Custom premium plan drafted successfully!");
        fetchPlans();
        // Expand the newly drafted plan immediately
        setExpandedItems(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setPlansStatusMsg(""), 3500);
      } else {
        const errData = await res.json();
        setPlansStatusMsg(`Error: ${errData.error || "Failed to add plan"}`);
      }
    } catch (e: any) {
      setPlansStatusMsg(`Network Error: ${e.message}`);
    }
  };

  const deletePlanMethod = async (planId: string) => {
    try {
      setPlansStatusMsg(`Deleting plan ${planId}...`);
      const res = await fetch(`/api/auth/admin/plans/${planId}`, {
        method: "DELETE",
        headers: {
          "admin-secret": secret
        }
      });
      if (res.ok) {
        setPlansStatusMsg("Plan deleted successfully!");
        fetchPlans();
        setTimeout(() => setPlansStatusMsg(""), 3500);
      } else {
        const errData = await res.json();
        setPlansStatusMsg(`Error: ${errData.error || "Failed to delete"}`);
      }
    } catch (e: any) {
      setPlansStatusMsg(`Network Error: ${e.message}`);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/admin/users", { headers: { "admin-secret": secret } });
      console.log("fetchUsers response:", res.status);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error("fetchUsers error", e); }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/auth/admin/messages", { headers: { "admin-secret": secret } });
      if (res.ok) {
        const data = await res.json();
        setMessagesList(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
  };

  const fetchPendingPayments = async () => {
    try {
      const res = await fetch("/api/auth/admin/payments/pending", { headers: { "admin-secret": secret } });
      console.log("fetchPendingPayments response:", res.status);
      if (res.ok) {
        const data = await res.json();
        setPendingPayments(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error("fetchPendingPayments error", e); }
  };

  const fetchAllPayments = async () => {
    try {
      const res = await fetch("/api/auth/admin/payments/all", { headers: { "admin-secret": secret } });
      console.log("fetchAllPayments response:", res.status);
      if (res.ok) {
        const data = await res.json();
        setAllPayments(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error("fetchAllPayments error", e); }
  };

  const fetchAdminMessages = async () => {
    try {
      const res = await fetch("/api/auth/admin/sms-messages", { headers: { "admin-secret": secret } });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setAdminMessages(Array.isArray(data) ? data : []);
          setLastRefreshed(new Date());
        }
      }
    } catch (e) {
      // Ignored console.error("fetchAdminMessages error", e);
    }
  };

  const fetchScenarios = () => {
    fetch("/api/scenarios")
      .then(res => res.json())
      .then(data => setScenarios(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  // Bulk automagic SMS matching & approvals
  const verifyPayments = async () => {
    if (!smsText.trim()) return;
    try {
      setLoading(true);
      const res = await fetch("/api/auth/admin/payments/verify", {
        method: "POST",
        headers: { "admin-secret": secret, "Content-Type": "application/json" },
        body: JSON.stringify({ smsText })
      });
      const data = await res.json();
      setVerifyResult(data);
      setSmsText(""); // Clear textarea on submit/success
      
      // Auto-reload data state immediately
      await fetchPendingPayments();
      await fetchAllPayments();
      if (!isRestrictedAuditor) {
        await fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Single manual transaction bypass
  const approveSingleTransaction = async (trxId: string) => {
    try {
      const res = await fetch("/api/auth/admin/payments/approve", {
        method: "POST",
        headers: { "admin-secret": secret, "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: trxId })
      });
      if (res.ok) {
        await fetchPendingPayments();
        await fetchAllPayments();
        await fetchUsers();
        setVerifyResult({ message: `Transaction ${trxId} manually approved successfully.` });
      } else {
        const err = await res.json();
        setVerifyResult({ error: err.error || "Could not approve transaction" });
      }
    } catch (e: any) {
      setVerifyResult({ error: `Error: ${e.message}` });
    }
  };

  const togglePremium = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/auth/admin/users/${id}/approve`, {
      method: "POST",
      headers: { "admin-secret": secret, "Content-Type": "application/json" },
      body: JSON.stringify({ isPremium: !currentStatus })
    });
    fetchUsers();
  };

  const [replyInputActive, setReplyInputActive] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    await fetch(`/api/auth/admin/messages/${id}/reply`, {
      method: "POST",
      headers: { "admin-secret": secret, "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText })
    });
    fetchMessages();
    setReplyInputActive(null);
    setReplyText("");
  };

  const replyToMessage = async (id: string) => {
    setReplyInputActive(id);
    setReplyText("");
  };

  const handleDelete = async (id: string) => {
    try {
      setMessage(`Deleting Dialogue Topic: ${id}...`);
      const res = await fetch(`/api/scenarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: secret }
      });
      if (res.ok) {
        setMessage(`✓ Scenario "${id}" deleted successfully!`);
        fetchScenarios();
        if (editingId === id) {
          handleCancelEdit();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessage(`Error: ${errData.error || "Failed to delete topic. Check your admin secret."}`);
      }
    } catch(err: any) {
      console.error(err);
      setMessage(`Network Error: ${err.message}`);
    }
  };

  const handleEditClick = (sc: any) => {
    setEditingId(sc.id);
    setName(sc.name);
    setIcon(sc.icon || "💬");
    setCategory(sc.category || "general");
    setDescription(sc.description || "");
    setSystemPrompt(sc.systemPrompt || "");
    setIcebreaker(sc.icebreaker || "");
    setDifficulty(sc.difficulty || "মাঝারি");
    setTopicPdfId(sc.pdfId || null);
    setMessage(`Editing Scenario Prompt: "${sc.name}"`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setIcon("💬");
    setCategory("general");
    setDescription("");
    setSystemPrompt("");
    setIcebreaker("");
    setDifficulty("মাঝারি");
    setTopicPdfId(null);
    setMessage("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminSecret: secret,
          id: editingId || undefined,
          systemPrompt,
          icebreaker,
          meta: {
            name,
            icon,
            category,
            description,
            difficulty,
            pdfId: topicPdfId,
            vocabulary: []
          }
        })
      });
      if (res.ok) {
        setMessage(editingId ? `✓ Scenario updated successfully!` : `✓ Scenario created successfully!`);
        fetchScenarios();
        handleCancelEdit();
      } else {
        setMessage("Failed to save or compile scenario.");
      }
    } catch(err) {
      console.error(err);
      setMessage("Error occurred processing operation.");
    }
    setLoading(false);
  };

  const loadRestrictedAuditorData = () => {
    fetchPendingPayments();
    fetchAllPayments();
    setLastRefreshed(new Date());
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAuthenticated && tab === 'sms-receiver') {
      fetchAdminMessages();
      interval = setInterval(() => {
        fetchAdminMessages();
      }, 2000); // 2 second auto-refresh
    }
    return () => clearInterval(interval);
  }, [tab, isAuthenticated, secret]);

  const loadAllDataOnce = () => {
    if (isRestrictedAuditor) {
      loadRestrictedAuditorData();
    } else {
      fetchScenarios();
      fetchUsers();
      fetchMessages();
      fetchPendingPayments();
      fetchAllPayments();
      fetchPlans();
      fetchPaymentMethods();
      setLastRefreshed(new Date());
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret === "admin123" || secret === "admin") {
      setIsAuthenticated(true);
      setIsRestrictedAuditor(false);
      setTab('user-transactions');
      // Set to an all-data loading state
      fetchScenarios();
      fetchUsers();
      fetchMessages();
      fetchPendingPayments();
      fetchAllPayments();
      fetchPlans();
      fetchPaymentMethods();
      setLastRefreshed(new Date());
    } else if (secret === "auditor" || secret === "auditor123") {
      setIsAuthenticated(true);
      setIsRestrictedAuditor(true);
      setTab('approvals');
      // Fetch only allowed payments lists
      fetchPendingPayments();
      fetchAllPayments();
      setLastRefreshed(new Date());
    } else {
      setMessage("🔒 Invalid Admin secret password.");
    }
  };

  // Auto-refresh removed as requested by user. Keeps only manual refresh.

  // Compute key metadata / metrics for rendering of dashboards
  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.isPremium).length,
    pendingPayments: pendingPayments.length,
    totalPaymentsSubmitted: allPayments.length,
    approvedPayments: allPayments.filter(p => p.status === 'approved'),
    totalEarnings: allPayments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  // User and Transaction filtering
  const filteredUsers = (users || []).filter(u => {
    const un = typeof u?.username === 'string' ? u.username : "";
    return un.toLowerCase().includes((userSearchText || "").toLowerCase());
  });

  const filteredPayments = (allPayments || []).filter(p => {
    const trxId = typeof p?.transactionId === 'string' ? p.transactionId : "";
    const un = typeof p?.username === 'string' ? p.username : "";
    const pl = typeof p?.plan === 'string' ? p.plan : "";
    
    return (
      trxId.toLowerCase().includes((trxSearchText || "").toLowerCase()) ||
      un.toLowerCase().includes((trxSearchText || "").toLowerCase()) ||
      pl.toLowerCase().includes((trxSearchText || "").toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 animate-fade-in">
      <div className="bg-slate-900 text-slate-100 w-full h-full overflow-hidden flex flex-col relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-full transition-all z-10 duration-200"
          title="Close Panel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Admin Panel Header */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white font-sans">AI English Buddy Admin Control</h2>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Console v2.0
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Automated membership matching, scenario creation, and plan customization dashboards.</p>
            </div>
          </div>
          
          {isAuthenticated && (
            <button 
              onClick={loadAllDataOnce}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title={`Last refreshed at ${lastRefreshed.toLocaleTimeString()}`}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
              <span className="text-[10px] font-normal opacity-70">({lastRefreshed.toLocaleTimeString()})</span>
            </button>
          )}
        </div>

        {/* Tab Selection */}
        {isAuthenticated && (
          <div className="flex bg-slate-950/40 border-b border-slate-800 overflow-x-auto scrollbar-thin">
            {!isRestrictedAuditor && (
              <button 
                className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                  tab === 'user-transactions' 
                  ? 'border-indigo-500 text-white bg-indigo-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                }`} 
                onClick={() => setTab('user-transactions')}
              >
                <Users className="w-3 h-3" /> User Analytics & Transactions
              </button>
            )}
            
            <button 
              className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                tab === 'approvals' 
                ? 'border-emerald-500 text-white bg-emerald-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`} 
              onClick={() => setTab('approvals')}
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" /> Automated SMS Approvals {isRestrictedAuditor && "(Restricted auditor portal)"}
            </button>

            <button 
              className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                tab === 'sms-receiver' 
                ? 'border-cyan-500 text-white bg-cyan-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`} 
              onClick={() => setTab('sms-receiver')}
            >
              <MessageSquare className="w-3 h-3 text-cyan-400" /> SMS Receiver Portal
            </button>

            {!isRestrictedAuditor && (
              <>
                <button 
                  className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                    tab === 'scenarios' 
                    ? 'border-violet-500 text-white bg-violet-500/5' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`} 
                  onClick={() => setTab('scenarios')}
                >
                  <BookOpen className="w-3 h-3" /> Dialogue Scenarios
                </button>
                <button 
                  className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                    tab === 'plans' 
                    ? 'border-amber-500 text-white bg-amber-500/5' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`} 
                  onClick={() => setTab('plans')}
                >
                  <Sliders className="w-3 h-3" /> Pricing & Services Editor
                </button>
                <button 
                  className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                    tab === 'messages' 
                    ? 'border-sky-500 text-white bg-sky-500/5' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`} 
                  onClick={() => setTab('messages')}
                >
                  <MessageSquare className="w-3 h-3" /> Helpdesk Messages
                </button>
                <button 
                  className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${
                    tab === 'payment-methods' 
                    ? 'border-indigo-500 text-white bg-indigo-500/5' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`} 
                  onClick={() => {
                    setTab('payment-methods');
                    fetchPaymentMethods();
                  }}
                >
                  <CreditCard className="w-3 h-3" /> Payment Methods Editor
                </button>
                <button
                  className={`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all ${tab === 'credit-pricing' ? 'border-fuchsia-500 text-white bg-fuchsia-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'}`} 
                  onClick={() => {
                    setTab('credit-pricing');
                  }}
                >
                  Token Economy Calculator
                </button>
              </>
            )}
          </div>
        )}

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Unlocking Secretary Controls</h3>
              <p className="text-sm text-slate-400 mb-6">Verify your system administrator passcode to monitor subscriptions, generate dynamic practice materials, and manage users.</p>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                  type="password"
                  required
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  className="px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-full text-center tracking-widest text-lg font-mono font-bold"
                  placeholder="••••••••••••••"
                />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-bold transition-all duration-200 shadow-md transform hover:-translate-y-0.5">
                  Unlock Access
                </button>
                {message && <p className="text-red-400 text-xs p-3 bg-red-400/5 border border-red-500/20 rounded-xl">{message}</p>}
              </form>
            </div>
          ) : (
            <>
              {/* STATS STRIP FOR AUTHENTICATED ADMINISTRATORS */}
              {isRestrictedAuditor ? (
                <div className="bg-emerald-950/20 border border-emerald-500/20 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">RESTRICTED AUDITOR MODE</span>
                    <h3 className="text-sm font-bold text-white mt-1">Transaction Matching Controller</h3>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="text-amber-400">
                      <span>Pending Matching: </span>
                      <strong className="text-white text-sm">{stats.pendingPayments}</strong>
                    </div>
                    <div className="text-indigo-400">
                      <span>Total Registered: </span>
                      <strong className="text-white text-sm">{stats.totalPaymentsSubmitted}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                  <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-lg">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">TOTAL USERS</p>
                    <p className="text-lg font-black text-white font-mono">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-lg">
                    <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">PREMIUM MEMBERS</p>
                    <p className="text-lg font-black text-emerald-400 font-mono">
                      {stats.premiumUsers} <span className="text-[9px] text-slate-500 font-normal">({stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%)</span>
                    </p>
                  </div>
                  <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-lg">
                    <p className="text-[8px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">WAITING MATCHES</p>
                    <p className="text-lg font-black text-amber-400 font-mono">{stats.pendingPayments}</p>
                  </div>
                  <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-lg">
                    <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider mb-0.5">RECORDS FILED</p>
                    <p className="text-lg font-black text-indigo-400 font-mono">{stats.totalPaymentsSubmitted}</p>
                  </div>
                  <div className="bg-slate-950/50 col-span-2 md:col-span-1 p-2 border border-emerald-500/20 rounded-lg bg-emerald-950/10">
                    <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">REVENUE COLLECTED</p>
                    <p className="text-lg font-black text-white font-mono">৳{stats.totalEarnings}</p>
                  </div>
                </div>
              )}

              {/* TAB 1: SUB-TABBED RESPONSIVE AUDIT & MEMBER REGISTRY */}
              {tab === 'user-transactions' && (
                <div className="space-y-4 flex flex-col h-full overflow-hidden max-h-[66vh] font-sans">
                  {/* Sub-tab selection row */}
                  <div className="flex bg-slate-950/60 border border-slate-800/80 p-1 rounded-xl overflow-x-auto gap-1 scrollbar-thin shrink-0">
                    <button 
                      type="button"
                      onClick={() => {
                        setTrxSubTab('waiting-matches');
                        fetchPendingPayments();
                      }} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        trxSubTab === 'waiting-matches' 
                          ? 'bg-amber-500 text-slate-950 font-extrabold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Waiting Matches ({pendingPayments.length})</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setTrxSubTab('submitted-purchases');
                        fetchAllPayments();
                      }} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        trxSubTab === 'submitted-purchases' 
                          ? 'bg-indigo-600 text-white font-extrabold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Submitted Purchases ({allPayments.length})</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setTrxSubTab('complete-billing');
                        fetchAllPayments();
                      }} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        trxSubTab === 'complete-billing' 
                          ? 'bg-emerald-600 text-white font-extrabold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Complete Billing Info ({allPayments.length})</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setTrxSubTab('users');
                        fetchUsers();
                      }} 
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        trxSubTab === 'users' 
                          ? 'bg-indigo-500 text-white font-extrabold' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Members ({users.length})</span>
                    </button>
                  </div>

                  {/* Header title & search combined - mini size for mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/20 px-3 py-2.5 rounded-xl border border-slate-850 shrink-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {trxSubTab === 'waiting-matches' && "⏳ Transaction Waiting Matches Queue"}
                        {trxSubTab === 'submitted-purchases' && "📝 Total Submitted Purchase Stream"}
                        {trxSubTab === 'complete-billing' && "📋 Detailed Billing Records"}
                        {trxSubTab === 'users' && "👥 Registered Members Analytics"}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {trxSubTab === 'waiting-matches' && "Filter by TrxID or Username. Click to expand and manual bypass approve."}
                        {trxSubTab === 'submitted-purchases' && "Audit logs of all submitted subscriptions."}
                        {trxSubTab === 'complete-billing' && "Compact listing of TrxID, Amount, Plan, and Owner Username."}
                        {trxSubTab === 'users' && "Verify practice logs, toggle subscriber limits."}
                      </p>
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        value={trxSearchText}
                        onChange={e => setTrxSearchText(e.target.value)}
                        placeholder="🔍 Search registry..."
                        className="bg-slate-950 border border-slate-800 text-[11px] text-slate-200 pl-8 pr-3 py-1 px-2.5 rounded-lg w-full sm:w-48 outline-none focus:border-indigo-500 placeholder-slate-500 font-sans"
                      />
                    </div>
                  </div>

                  {/* Feed containing lists with expandable click headers */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {/* MODE 1: WAITING MATCHES */}
                    {trxSubTab === 'waiting-matches' && (() => {
                      const list = (pendingPayments || []).filter(p => {
                        const id = String(p?.transactionId || "").toLowerCase();
                        const un = String(p?.username || "").toLowerCase();
                        return id.includes(trxSearchText.toLowerCase()) || un.includes(trxSearchText.toLowerCase());
                      });

                      if (list.length === 0) {
                        return (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                            No active waiting matches found matching search criteria.
                          </div>
                        );
                      }

                      return list.map(p => {
                        const isExpanded = !!expandedItems[p.id];
                        return (
                          <div 
                            key={p.id} 
                            className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                          >
                            {/* Clickable Header */}
                            <div 
                              onClick={() => toggleExpand(p.id)}
                              className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none active:bg-slate-900 duration-150"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transaction ID</p>
                                <p className="font-mono text-xs font-bold text-white bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded inline-block mt-0.5">{p.transactionId}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1 justify-end">
                                  <Clock className="w-2.5 h-2.5 animate-pulse" /> Pending Match
                                </p>
                                <p className="text-sm font-black text-rose-400 font-mono mt-0.5">৳{p.amount || "N/A"}</p>
                              </div>
                            </div>

                            {/* Expandable Details Area */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-2 bg-slate-950/40 border-t border-slate-850 text-[11px] space-y-2 animate-fade-in">
                                <div className="grid grid-cols-2 gap-2 text-slate-300">
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Registered User</span>
                                    <strong className="text-indigo-300">{p.username}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase font-sans">Applicable Plan</span>
                                    <span className="text-white px-1.5 py-0.2 rounded bg-slate-800 font-mono text-[9px] font-bold">{p.plan || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Submitted Time</span>
                                    <span>{new Date(p.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Attachment Screenshot</span>
                                    {p.screenshotUrl ? (
                                      <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> View Proof Image
                                      </a>
                                    ) : (
                                      <span className="text-slate-600">None Provided</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 pt-2 border-t border-slate-850">
                                  <button
                                    onClick={() => approveSingleTransaction(p.transactionId)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] text-white py-1.5 px-3 rounded-lg text-xs font-black cursor-pointer transition-all uppercase tracking-wider"
                                  >
                                    ✓ Approve & Toggle Subscriber Premium Option
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* MODE 2: SUBMITTED PURCHASES */}
                    {trxSubTab === 'submitted-purchases' && (() => {
                      const list = (allPayments || []).filter(p => {
                        const id = String(p?.transactionId || "").toLowerCase();
                        const un = String(p?.username || "").toLowerCase();
                        return id.includes(trxSearchText.toLowerCase()) || un.includes(trxSearchText.toLowerCase());
                      });

                      if (list.length === 0) {
                        return (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                            No purchase transactions found matching search criteria.
                          </div>
                        );
                      }

                      return list.map(p => {
                        const isExpanded = !!expandedItems[p.id];
                        const isApproved = p.status === 'approved';
                        return (
                          <div 
                            key={p.id} 
                            className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                          >
                            {/* Clickable Header */}
                            <div 
                              onClick={() => toggleExpand(p.id)}
                              className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none active:bg-slate-900 duration-150"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Transaction ID</p>
                                <p className="font-mono text-xs font-bold text-white bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 rounded inline-block mt-0.5">{p.transactionId}</p>
                              </div>
                              <div className="text-right shrink-0">
                                {isApproved ? (
                                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" /> Approved
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> Pending
                                  </span>
                                )}
                                <p className="text-sm font-black text-rose-400 font-mono mt-1">৳{p.amount || "N/A"}</p>
                              </div>
                            </div>

                            {/* Expandable Details Area */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-2 bg-slate-950/40 border-t border-slate-850 text-[11px] space-y-2 animate-fade-in">
                                <div className="grid grid-cols-2 gap-2 text-slate-300 font-sans">
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Registered User Name</span>
                                    <strong className="text-indigo-300">{p.username}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Plan requested</span>
                                    <span className="text-white px-1.5 py-0.2 rounded bg-slate-800 font-mono text-[9px] font-bold">{p.plan || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Filing date</span>
                                    <span>{new Date(p.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Screenshot Proof</span>
                                    {p.screenshotUrl ? (
                                      <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> View Image
                                      </a>
                                    ) : (
                                      <span className="text-slate-600">None</span>
                                    )}
                                  </div>
                                </div>
                                
                                {!isApproved && (
                                  <div className="pt-2 border-t border-slate-850">
                                    <button
                                      onClick={() => approveSingleTransaction(p.transactionId)}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1 text-xs font-bold rounded-lg cursor-pointer transition-all uppercase"
                                    >
                                      ✓ Process & Pass Approve
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* MODE 3: COMPLETE BILLING INFO */}
                    {trxSubTab === 'complete-billing' && (() => {
                      const list = (allPayments || []).filter(p => {
                        const trx = String(p?.transactionId || "").toLowerCase();
                        const un = String(p?.username || "").toLowerCase();
                        const pl = String(p?.plan || "").toLowerCase();
                        return (
                          trx.includes(trxSearchText.toLowerCase()) || 
                          un.includes(trxSearchText.toLowerCase()) ||
                          pl.toLowerCase().includes(trxSearchText.toLowerCase())
                        );
                      });

                      if (list.length === 0) {
                        return (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                            No billing records matched.
                          </div>
                        );
                      }

                      return list.map(p => {
                        const isExpanded = !!expandedItems[p.id];
                        const isApproved = p.status === 'approved';
                        return (
                          <div 
                            key={p.id} 
                            className="bg-slate-900/40 border border-slate-850/80 rounded-xl overflow-hidden hover:border-slate-800 transition-colors"
                          >
                            {/* Clickable Header showing 4 details clearly: TransactionID, Amount, Plan, Username */}
                            <div 
                              onClick={() => toggleExpand(p.id)}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-900/80 transition-colors select-none"
                            >
                              <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-4 flex-1 min-w-0">
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] text-slate-500 uppercase font-sans">Transaction ID</span>
                                  <span className="font-mono text-xs font-bold text-slate-200 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">{p.transactionId}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] text-slate-500 uppercase font-sans font-medium">Depositor</span>
                                  <span className="text-indigo-400 font-bold text-xs truncate block max-w-[100px]">{p.username}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="block text-[9px] text-slate-500 uppercase font-sans">Plan</span>
                                  <span className="text-xs text-white font-mono uppercase font-black">{p.plan || "N/A"}</span>
                                </div>
                                <div className="space-y-0.5 text-right sm:text-left">
                                  <span className="block text-[9px] text-slate-500 uppercase font-sans">Deposited Amount</span>
                                  <span className="text-xs text-rose-400 font-extrabold font-mono">৳{p.amount || 0} BDT</span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center justify-end gap-1">
                                {isApproved ? (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded uppercase font-bold">Approved</span>
                                ) : (
                                  <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase font-bold">Waiting Match</span>
                                )}
                              </div>
                            </div>

                            {/* Expandable Proof details */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-2 bg-slate-950/40 border-t border-slate-850 text-[11px] space-y-1 my-0.5 animate-fade-in text-slate-400">
                                <p>• Record Identifier key: <span className="font-mono text-white">{p.id}</span></p>
                                <p>• Audited creation date: <span className="text-white">{new Date(p.createdAt).toLocaleString()}</span></p>
                                {p.screenshotUrl && (
                                  <p>• Screenshot Upload: <a href={p.screenshotUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-bold"><Eye className="w-3 h-3" /> Open in tab</a></p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* MODE 4: SYSTEM USERS */}
                    {trxSubTab === 'users' && (() => {
                      const list = (users || []).filter(u => {
                        const un = String(u?.username || "").toLowerCase();
                        return un.includes(trxSearchText.toLowerCase());
                      });

                      if (list.length === 0) {
                        return (
                          <div className="text-center py-10 bg-slate-950/20 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                            No member users matching criteria.
                          </div>
                        );
                      }

                      return list.map(u => {
                        const isExpanded = !!expandedItems[u.id];
                        const minutesUsed = (u.chatTimeUsed / 60).toFixed(1);
                        return (
                          <div 
                            key={u.id} 
                            className="bg-slate-900/40 border border-slate-850/80 rounded-xl overflow-hidden hover:border-slate-800 transition-colors"
                          >
                            {/* Clickable Header */}
                            <div 
                              onClick={() => toggleExpand(u.id)}
                              className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none active:bg-slate-900"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="font-extrabold text-slate-200 text-xs truncate max-w-[140px]">{u.username}</p>
                                {u.isPremium ? (
                                  <span className="text-[8px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/25 px-1.5 py-0.2 rounded">
                                    PREMIUM
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold uppercase text-slate-500 bg-slate-800/80 px-1.5 py-0.2 rounded">
                                    FREE
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0 font-mono">{minutesUsed} mins</span>
                            </div>

                            {/* Expanded operations */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-2 bg-slate-950/40 border-t border-slate-850 text-[11px] space-y-2.5 animate-fade-in text-slate-300">
                                <div className="grid grid-cols-2 gap-2 font-sans">
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Member unique key</span>
                                    <span className="font-mono text-[10px] text-slate-400">{u.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[9px] uppercase">Practice usage logger</span>
                                    <span>{u.chatTimeUsed} seconds utilized</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-4">
                                  <span className="text-[10px] text-slate-400">Subscription Control Bypass:</span>
                                  <button 
                                    onClick={() => togglePremium(u.id, u.isPremium)} 
                                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                      u.isPremium 
                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20' 
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                    }`}
                                  >
                                    {u.isPremium ? 'Downgrade status' : 'Upgrade to Premium'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 2: AUTOMATED SMS MATCHING & APPROVALS (APPROVABLE ID LIST) */}
              {tab === 'approvals' && (
                <div className="space-y-6">
                  {/* Info alert block */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Automated SMS Verification Gateway</h4>
                      <p className="text-xs text-slate-300 mt-1">Upload or paste bulk mobile banking text alerts (bKash/Nagad receipt SMS alerts etc.) below. The system automatically reads, parses the TrxID codes, instantly updates matched subscription states to Premium, and logs approved items live!</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT PANEL: PASTE TEXTBOX (SMS UPLOADER) */}
                    <div className="lg:col-span-5 bg-slate-950/30 border border-slate-800 p-5 rounded-2xl space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-white">Feed Bulk Transaction Log Outputs</h3>
                        <p className="text-xs text-slate-400 mt-1">Paste standard smartphone text alerts containing TrxIDs.</p>
                      </div>

                      <textarea 
                        className="w-full h-44 p-4 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs font-mono"
                        placeholder="Paste SMS text dumps here...&#10;(e.g. You have received Tk 500 from 0192837482. TrxID AE239A8FDS...)"
                        value={smsText}
                        onChange={e => setSmsText(e.target.value)}
                      />

                      <button 
                        disabled={loading || !smsText.trim()}
                        onClick={verifyPayments}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-indigo-900/10"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Run Automated Parser & Approve Matches
                      </button>

                      {/* Display parsing results */}
                      {verifyResult && (
                        <div className="p-4 flex-1 overflow-y-auto bg-emerald-950/15 text-emerald-200 rounded-xl border border-emerald-500/20 text-xs space-y-2">
                          <p className="font-bold flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-4 h-4 shrink-0" /> SMS Automation Process Complete
                          </p>
                          <div className="flex flex-col gap-1 text-[11px] py-2 border-y border-emerald-500/10">
                            <span>Messages Parsed: <strong className="text-white">{verifyResult.parsedCount || 0}</strong></span>
                            <span>Pending Checked: <strong className="text-white">{verifyResult.totalChecked}</strong></span>
                            <span>Matched Approved: <strong className="text-white">{verifyResult.verified.length}</strong></span>
                          </div>
                          {verifyResult.verified.length > 0 ? (
                            <ul className="space-y-2">
                              {verifyResult.verified.map((v: any, index: number) => (
                                <li key={index} className="text-[10px] bg-slate-900/60 p-2 rounded-lg text-slate-300 border border-slate-700/50">
                                  ✓ Approved user <strong className="text-white">{v.username}</strong>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    <span className="font-mono text-emerald-300 bg-emerald-500/10 px-1 rounded">TrxID: {v.transactionId}</span>
                                    {v.parsedAmount && <span className="bg-slate-800 text-slate-200 px-1 rounded">💰 Tk {v.parsedAmount}</span>}
                                    {v.parsedTime && <span className="bg-slate-800 text-slate-200 px-1 rounded">🕒 {v.parsedTime}</span>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-slate-400">No new pending transaction IDs matched with the parsed sms data.</p>
                          )}
                          
                          {verifyResult.parsedCount > 0 && verifyResult.parsedTransactions && (
                            <div className="mt-3 pt-3 border-t border-emerald-500/10">
                              <p className="font-bold mb-2">Parsed Transactions:</p>
                              <ul className="space-y-1">
                                {verifyResult.parsedTransactions.map((pt: any, i: number) => (
                                  <li key={i} className="text-[9px] font-mono text-slate-400 truncate">
                                    TrxID: <span className="text-white">{pt.trxId}</span> | Amt: {pt.amount || 'N/A'} | Time: {pt.time || 'N/A'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANEL: APPROVABLE TRANSACTION IDS (WAITING VS APPROVED METRICS) */}
                    <div className="lg:col-span-7 bg-slate-950/30 border border-slate-800 p-5 rounded-2xl flex flex-col h-[52vh]">
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" /> Approvable ID Registry Side-by-Side
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Live interactive audit indicating which IDs matched automatically and which remain waiting.</p>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {allPayments.map((p: any) => {
                          const isApproved = p.status === 'approved';
                          return (
                            <div 
                              key={p.id} 
                              className={`p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                                isApproved 
                                  ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-200' 
                                  : 'bg-amber-950/5 border-amber-500/20 text-amber-200'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{p.username}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono uppercase text-slate-400">{p.plan}</span>
                                </div>
                                <p className="font-mono text-[11px]">
                                  ID: <span className="underline font-bold text-white bg-slate-950 px-1 py-0.5 rounded border border-slate-800/80">{p.transactionId}</span>
                                </p>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                  {p.amount ? <span>৳{p.amount} BDT</span> : null}
                                  <span>• Submitted: {new Date(p.createdAt).toLocaleTimeString()}</span>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-start sm:items-end gap-2 text-right shrink-0">
                                {isApproved ? (
                                  <div className="flex flex-col sm:items-end">
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Approved automatically
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-1">Complete</span>
                                  </div>
                                ) : (
                                  <div className="flex sm:flex-col items-center sm:items-end gap-1.5">
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                      Waiting Match
                                    </span>
                                    {!isRestrictedAuditor ? (
                                      <button 
                                        onClick={() => approveSingleTransaction(p.transactionId)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-all cursor-pointer whitespace-nowrap"
                                      >
                                        Approve Manually
                                      </button>
                                    ) : (
                                      <span className="text-[9px] text-slate-500 italic block mt-0.5 bg-slate-950/40 px-1.5 py-0.5 rounded">
                                        Automated Match Only
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {p.screenshotUrl && (
                                  <a 
                                    href={p.screenshotUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline flex items-center gap-0.5 mt-0.5"
                                  >
                                    <Eye className="w-3 h-3" /> View Screenshot
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {allPayments.length === 0 && (
                          <div className="text-center py-12 text-slate-400 text-xs">
                            No payment transaction logs filed yet. Provide some via forms to test!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AUTOMATED PHONE MESSAGE INTEGRATION BLUEPRINT */}
                  <div className="bg-slate-905 border border-slate-800/80 rounded-2xl p-6 mt-4 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-indigo-400" /> Webhook Integration: Forward Real Phone Messages
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Configure your smartphone to automatically forward incoming SMS receipts (bKash, Nagad, bank alerts) to this system. Once set up, your phone will trigger the system to verify the payment and approve matched premium requests instantly.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full shrink-0">
                        <span>LIVE WEBHOOK ENDPOINT ACTIVE</span>
                      </div>
                    </div>

                    {/* Quick Config Display Box */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-2">
                        <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Target API endpoint url</p>
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-white select-all break-all">{window.location.origin}/api/admin/payments/verify</span>
                          <button 
                            onClick={() => handleCopy(`${window.location.origin}/api/admin/payments/verify`, 'endpoint')}
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedText === 'endpoint' && <span className="text-[9px] text-emerald-400 block">✓ Copied to clipboard!</span>}
                      </div>

                      <div className="space-y-2">
                        <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Required Header (admin-secret)</p>
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-emerald-400 select-all break-all">{secret || "YOUR_ADMIN_SECRET"}</span>
                          <button 
                            onClick={() => handleCopy(secret || "admin123", 'secret_key')}
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {copiedText === 'secret_key' && <span className="text-[9px] text-emerald-400 block">✓ Copied to clipboard!</span>}
                      </div>
                    </div>

                    {/* Integration Instruction Tabs */}
                    <div className="flex border-b border-indigo-950 overflow-x-auto gap-2">
                      <button
                        onClick={() => setActiveGuideTab('macrodroid')}
                        className={`px-3 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap border-b-2 ${
                          activeGuideTab === 'macrodroid' 
                            ? 'border-indigo-500 text-white bg-indigo-500/5' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🤖 Android (MacroDroid / Tasker)
                      </button>
                      <button
                        onClick={() => setActiveGuideTab('shortcuts')}
                        className={`px-3 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap border-b-2 ${
                          activeGuideTab === 'shortcuts' 
                            ? 'border-indigo-500 text-white bg-indigo-500/5' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🍏 iOS iPhone (Shortcuts)
                      </button>
                      <button
                        onClick={() => setActiveGuideTab('apps')}
                        className={`px-3 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap border-b-2 ${
                          activeGuideTab === 'apps' 
                            ? 'border-indigo-500 text-white bg-indigo-500/5' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        📲 Google Play Store Apps (Easy)
                      </button>
                      <button
                        onClick={() => setActiveGuideTab('payload')}
                        className={`px-3 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap border-b-2 ${
                          activeGuideTab === 'payload' 
                            ? 'border-indigo-500 text-white bg-indigo-500/5' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🧠 Developers JSON/Curl API
                      </button>
                    </div>

                    {/* Tab Body Contents */}
                    <div className="space-y-4 animate-fade-in text-slate-300 text-xs">
                      {activeGuideTab === 'macrodroid' && (
                        <div className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-850">
                          <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Setting Up Android MacroDroid (Highly Recommended, 100% Free)
                          </h4>
                          <p className="text-slate-400 leading-relaxed">
                            MacroDroid is the easiest automation tool for Android. Install it from the Google Play Store, then construct this macro:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"><div className="bg-slate-950 p-4 rounded-xl border border-slate-850"><span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Step 1: Trigger</span><h5 className="font-bold text-xs text-white mt-2">Arriving SMS Notification</h5><div className="text-[11px] text-slate-400 mt-1 lines-spaced">Select <strong>"SMS Received"</strong>. Set <em>"Select Sender"</em> to the platform number (e.g. bKash, Nagad or leave empty for Any Sender). Set <em>"Message Content"</em> to "Any" or containing "TrxID".</div></div><div className="bg-slate-950 p-4 rounded-xl border border-slate-850"><span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">Step 2: Action</span><h5 className="font-bold text-xs text-white mt-2">HTTP POST Request Dispatch</h5><div className="text-[11px] text-slate-400 mt-1 lines-spaced">Add Action <strong>"HTTP POST / Open Website"</strong>:<ul className="list-disc ml-4 mt-1 text-[10px] space-y-0.5 text-slate-300"><li>Choose request method: <strong>POST</strong></li><li>Set Destination URL: Copy from top box</li><li>Add Header: <strong>Content-Type: application/json</strong></li><li>Add Header: <strong>admin-secret: {secret || 'admin123'}</strong></li></ul></div></div><div className="bg-slate-950 p-4 rounded-xl border border-slate-850"><span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Step 3: Post Body</span><h5 className="font-bold text-xs text-white mt-2">Inject Dynamic SMS Variables</h5><div className="text-[11px] text-slate-400 mt-1 lines-spaced">Under request body, check <strong>"Raw JSON payload"</strong> and enter:<pre className="bg-slate-900 border border-slate-800 p-1 rounded font-mono text-[9px] mt-1 text-slate-300 overflow-x-auto text-left">{`{"smsText": "[sms_message]"}`}</pre><em>MacroDroid will automatically replace <code className="text-emerald-400">[sms_message]</code> with the actual arriving SMS text.</em></div></div></div><div className="space-y-3">
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                              <h5 className="font-extrabold text-xs text-white">🔥 SMS Forwarder (by SGMobile or similar publishers)</h5>
                              <p className="text-[11px] text-slate-400 mt-1">
                                This app monitors notifications or SMS. Inside the app:
                              </p>
                              <ul className="list-disc ml-4 mt-2 text-[10.5px] space-y-1 text-slate-300">
                                <li>Navigate to <strong>Rules</strong> ➔ Add Rule ➔ set forward direction to "Internet Web Server / Webhook".</li>
                                <li>Server URL: <code className="font-mono text-indigo-400 select-all bg-slate-900 border border-slate-850 rounded px-1">{window.location.origin}/api/admin/payments/verify</code></li>
                                <li>Template body: Use JSON mode and enter <code className="font-mono bg-slate-900 border border-slate-850 rounded px-1">{"{"}"smsText": "%sms_text"{"}"}</code></li>
                                <li>Add header rule: Key: <code className="font-mono bg-slate-900 border border-slate-850 rounded px-1">admin-secret</code>, Value: <code className="font-mono text-emerald-400 bg-slate-900 border border-slate-850 rounded px-1">{secret || 'admin123'}</code></li>
                              </ul>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                              <h5 className="font-extrabold text-xs text-white">🛠️ SMS Gateway / SMS to HTTP APIs</h5>
                              <p className="text-[11px] text-slate-400 mt-1 lines-spaced">Search <em>"sms gateway to webhook"</em> on Google Play. Most of these apps feature simple interfaces requiring only three variables: URL, method (POST), and standard header lists. You can easily test connections live within the application itself.</p></div>
</div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 mt-4">
                            <h5 className="font-bold text-xs text-white mb-2">API Response Reference</h5>
                            <pre className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-slate-400 overflow-x-auto text-left">
                              {`{
  "message": "Automated verification completed",
  "parsedCount": 1,
  "totalChecked": 3,
  "verified": [
    {
      "username": "learner_p",
      "transactionId": "TXN89324789",
      "parsedAmount": 500,
      "parsedTime": "2026-06-04 10:11"
    }
  ],
  "parsedTransactions": [
    {
      "trxId": "TXN89324789",
      "amount": 500,
      "time": "2026-06-04 10:11"
    }
  ]
}`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SCENARIOS */}
              {tab === 'scenarios' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Create or Edit Form */}
                  <div className="bg-slate-950/30 border border-slate-800 p-5 rounded-2xl flex flex-col space-y-4">
                    <h3 className="text-md font-bold text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {editingId ? <Edit2 className="w-5 h-5 text-amber-400 animate-pulse" /> : <Plus className="w-5 h-5 text-indigo-400" />}
                        {editingId ? "Edit Dialogue Scenario" : "Create Dialogue Scenario"}
                      </span>
                      {editingId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-xs flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Cancel Edit
                        </button>
                      )}
                    </h3>
                    {message && (
                      <div className={`p-3 border rounded-xl text-xs font-semibold ${
                        message.includes("✓") ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" : "bg-indigo-950/20 text-indigo-400 border-indigo-500/20"
                      }`}>
                        {message}
                      </div>
                    )}
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scenario Name</label>
                          <input 
                            required value={name} onChange={e => setName(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-indigo-500" 
                            placeholder="e.g. Job Interview" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Emoji Icon</label>
                          <input 
                            required value={icon} onChange={e => setIcon(e.target.value)}
                            className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-indigo-500" 
                            placeholder="e.g. 💼, 🎓" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description (short banner)</label>
                        <input 
                          required value={description} onChange={e => setDescription(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-indigo-500" 
                          placeholder="What will users practice here?" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Prompt Context (AI Coach instructions)</label>
                        <textarea 
                          required value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-indigo-500 h-24 font-mono text-[11px]" 
                          placeholder="You are an English speaking partner conducting a job interview. Act professional, ask follow-up questions..." 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Icebreaker / Greeting Word</label>
                        <input 
                          required value={icebreaker} onChange={e => setIcebreaker(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg outline-none focus:border-indigo-500" 
                          placeholder="Hello there! Welcome. Please share your self-introduction..." 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category (ক্যাটাগরি)</label>
                          <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs font-semibold outline-none focus:border-indigo-500"
                          >
                            <option value="general">💼 General / সাধারণ</option>
                            <option value="ielts">🎓 IELTS / আইইএলটিএস</option>
                            <option value="ppt">🖥️ PPT / এক্সাম প্রেজেন্টেশন</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Difficulty (কঠিনতা)</label>
                          <select 
                            value={difficulty} 
                            onChange={e => setDifficulty(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-lg outline-none focus:border-indigo-500"
                          >
                            <option value="সহজ">সহজ (Easy)</option>
                            <option value="মাঝারি">মাঝারি (Medium)</option>
                            <option value="কঠিন">কঠিন (Hard)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attach Study Syllabus Material (PDF)</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="file" accept=".pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const base64String = (reader.result as string).replace(/^data:application\/pdf;base64,/, "");
                                const res = await fetch("/api/upload-pdf", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ pdfBase64: base64String, adminSecret: secret }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setTopicPdfId(data.pdfId);
                                  alert("✓ PDF uploaded and registered! Click Save/Update Scenario to bind this material.");
                                } else {
                                  alert("Failed to submit PDF binary.");
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="flex-1 p-1 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs" 
                          />
                          {topicPdfId && <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded">Attached file</span>}
                        </div>
                      </div>
                      <button 
                        disabled={loading}
                        type="submit" 
                        className={`w-full py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                          editingId ? "bg-amber-500 hover:bg-amber-600 shadow-md" : "bg-slate-100 hover:bg-white text-slate-950"
                        }`}
                      >
                        {loading ? "Processing..." : editingId ? "Update Scenario" : "Save Active Scenario"}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Existing Scenarios */}
                  <div className="bg-slate-950/30 border border-slate-800 p-5 rounded-2xl flex flex-col h-[52vh]">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white">Interactive Dialogue Prompt Lists ({scenarios.length})</h3>
                      <p className="text-xs text-slate-400 mt-1">Select and edit existant speaking practice sessions.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                      {scenarios.map(sc => {
                        const isExpanded = !!expandedItems[sc.id];
                        return (
                          <div 
                            key={sc.id} 
                            className={`border rounded-xl bg-slate-950/40 overflow-hidden transition-all duration-150 ${
                              editingId === sc.id 
                                ? "border-amber-400 ring-4 ring-amber-400/10 bg-amber-500/5 text-white" 
                                : "border-slate-800/80 hover:border-slate-700"
                            }`}
                          >
                            <div 
                              onClick={() => toggleExpand(sc.id)}
                              className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                <span className="text-2xl shrink-0">{sc.icon}</span>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-slate-200 truncate">{sc.name}</p>
                                  <p className="text-[10px] text-slate-500 truncate font-mono">
                                    Type: {sc.category} | Diff: {sc.difficulty}
                                  </p>
                                  {sc.pdfId && (
                                    <span className="inline-block mt-1 text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 px-1.5 py-0.2 rounded font-semibold">
                                      PDF Integrated
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleEditClick(sc)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    editingId === sc.id ? "bg-amber-500 text-slate-950" : "text-amber-400 hover:bg-amber-400/10"
                                  }`}
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(sc.id)}
                                  className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-2 bg-slate-950/50 border-t border-slate-800/80 text-xs text-slate-300 space-y-2 animate-fade-in font-sans">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Description Banner:</span>
                                  <p className="text-slate-200">{sc.description}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Icebreaker Greeting:</span>
                                  <p className="italic text-slate-300">"{sc.icebreaker}"</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase text-[9px] mb-0.5">Practice Prompt Context (Instructions):</span>
                                  <code className="bg-slate-950 p-2 block rounded border border-slate-850 text-[10px] text-indigo-300 font-mono whitespace-pre-wrap">{sc.systemPrompt}</code>
                                </div>
                                {sc.pdfId && (
                                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-800/55">
                                    <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-400/20 px-2 py-0.5 rounded font-mono text-[9px] font-black uppercase">Study PDF Connected</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1 py-0.2 rounded">ID: {sc.pdfId}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PRICING PLANS */}
              {tab === 'plans' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-500" /> Customize Pricing Plans & Limits
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Configure subscription fees, active speaking lesson limits, and feature permissions dynamically.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={addNewPlan}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all border border-emerald-500"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Plan
                      </button>
                      <button 
                        onClick={fetchPlans}
                        className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reload Config
                      </button>
                    </div>
                  </div>

                  {plansStatusMsg && (
                    <div className={`p-3 border rounded-xl text-xs font-semibold ${
                      plansStatusMsg.includes("successfully") ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" : "bg-indigo-950/20 text-indigo-300 border-indigo-500/20"
                    }`}>
                      {plansStatusMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((p, index) => {
                      const isExpanded = !!expandedItems[p.id];
                      return (
                        <div key={p.id} className="bg-slate-950/20 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between font-sans">
                          {/* Header banner */}
                          <div 
                            onClick={() => toggleExpand(p.id)}
                            className="p-4 flex justify-between items-center bg-slate-900/60 hover:bg-slate-900 transition-colors cursor-pointer select-none border-b border-slate-850"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-2 py-0.5 rounded-full font-black">
                                {p.id} Category
                              </span>
                              <p className="text-sm font-bold text-white mt-1">{p.name || p.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-black text-rose-400">৳{p.price} BDT</p>
                              <p className="text-[10px] text-slate-500 font-medium">{(p.timeLimitSeconds / 60).toFixed(1)} mins cap</p>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 space-y-4 bg-slate-950/40 animate-fade-in border-t border-slate-800/20">
                              <div className="space-y-3 pb-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Display Name</label>
                                  <input 
                                    type="text"
                                    value={p.name}
                                    onChange={(e) => {
                                      const updated = [...plans];
                                      updated[index].name = e.target.value;
                                      setPlans(updated);
                                    }}
                                    className="w-full p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs font-semibold text-slate-200 outline-none focus:border-indigo-500"
                                    placeholder="Plan name"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pricing (৳ BDT)</label>
                                  <input 
                                    type="number"
                                    value={p.price}
                                    onChange={(e) => {
                                      const updated = [...plans];
                                      updated[index].price = Number(e.target.value);
                                      setPlans(updated);
                                    }}
                                    className="w-full p-2 bg-slate-950 border border-slate-855 rounded-lg text-xs font-bold text-white outline-none focus:border-indigo-500"
                                    placeholder="Price in BDT"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Practice Limit (Seconds)</label>
                                  <input 
                                    type="number"
                                    value={p.timeLimitSeconds}
                                    onChange={(e) => {
                                      const updated = [...plans];
                                      updated[index].timeLimitSeconds = Number(e.target.value);
                                      setPlans(updated);
                                    }}
                                    className="w-full p-2 bg-slate-950 border border-slate-855 rounded-lg text-xs text-white outline-none focus:border-indigo-500 font-mono"
                                    placeholder="e.g. 300 for 5 mins, 3600 for 60 mins"
                                  />
                                  <p className="text-[10px] text-indigo-400 font-semibold mt-1">Speaking duration allowance: {(p.timeLimitSeconds / 60).toFixed(1)} minutes</p>
                                </div>

                                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                                  <p className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Active Entitlements</p>
                                  
                                  <label className="flex items-start gap-3 cursor-pointer p-1.5 hover:bg-slate-850/50 rounded-lg transition-colors border border-transparent">
                                    <input 
                                      type="checkbox"
                                      checked={!!p.pdfUploadAllowed}
                                      onChange={(e) => {
                                        const updated = [...plans];
                                        updated[index].pdfUploadAllowed = e.target.checked ? 1 : 0;
                                        setPlans(updated);
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-300">Direct PDF Handout Uploads</p>
                                      <p className="text-[10px] text-slate-400 font-sans">Permit user custom study material attachment options.</p>
                                    </div>
                                  </label>

                                  <label className="flex items-start gap-3 cursor-pointer p-1.5 hover:bg-slate-850/50 rounded-lg transition-colors border border-transparent">
                                    <input 
                                      type="checkbox"
                                      checked={!!p.whatsappAllowed}
                                      onChange={(e) => {
                                        const updated = [...plans];
                                        updated[index].whatsappAllowed = e.target.checked ? 1 : 0;
                                        setPlans(updated);
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-300">Public WhatsApp Badge Highlight</p>
                                      <p className="text-[10px] text-slate-400 font-sans">Differentiate Premium numbers publicly for user search list indexes.</p>
                                    </div>
                                  </label>

                                  <label className="flex items-start gap-3 cursor-pointer p-1.5 hover:bg-slate-850/50 rounded-lg transition-colors border border-transparent">
                                    <input 
                                      type="checkbox"
                                      checked={!!p.scenarioPdfAllowed}
                                      onChange={(e) => {
                                        const updated = [...plans];
                                        updated[index].scenarioPdfAllowed = e.target.checked ? 1 : 0;
                                        setPlans(updated);
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-slate-300">Situational Prompt Support</p>
                                      <p className="text-[10px] text-slate-400 font-sans">Enforce dynamic text prompt options on custom talking scenarios.</p>
                                    </div>
                                  </label>
                                </div>

                                {/* Custom Features List */}
                                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                                  <p className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Custom Features & Benefits List</p>
                                  
                                  <div className="space-y-1.5">
                                    {(() => {
                                      let featureArr = [];
                                      try {
                                        featureArr = p.customFeatures ? (typeof p.customFeatures === 'string' ? JSON.parse(p.customFeatures) : p.customFeatures) : [];
                                      } catch (e) {
                                        featureArr = [];
                                      }
                                      if (!Array.isArray(featureArr)) featureArr = [];
                                      
                                      return (
                                        <>
                                          {featureArr.map((feat: string, featIdx: number) => (
                                            <div key={featIdx} className="flex items-center gap-2 bg-slate-900/60 border border-slate-900 p-2 rounded-xl">
                                              <span className="text-slate-200 text-xs flex-1 truncate">{feat}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedPlans = [...plans];
                                                  const currentFeatures = [...featureArr];
                                                  currentFeatures.splice(featIdx, 1);
                                                  updatedPlans[index].customFeatures = currentFeatures;
                                                  setPlans(updatedPlans);
                                                }}
                                                className="text-red-400 hover:text-red-300 text-xs px-2.5 py-1 font-bold shrink-0 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          ))}
                                          
                                          <div className="flex gap-2 pt-1">
                                            <input
                                              type="text"
                                              id={`new-feature-input-${p.id}`}
                                              placeholder="e.g. 24/7 priority tutor reviews"
                                              className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-indigo-500 placeholder-slate-600"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  const val = e.currentTarget.value.trim();
                                                  if (val) {
                                                    const updatedPlans = [...plans];
                                                    const currentFeatures = [...featureArr, val];
                                                    updatedPlans[index].customFeatures = currentFeatures;
                                                    setPlans(updatedPlans);
                                                    e.currentTarget.value = '';
                                                  }
                                                }
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const inputEl = document.getElementById(`new-feature-input-${p.id}`) as HTMLInputElement;
                                                const val = inputEl?.value.trim();
                                                if (val) {
                                                  const updatedPlans = [...plans];
                                                  const currentFeatures = [...featureArr, val];
                                                  updatedPlans[index].customFeatures = currentFeatures;
                                                  setPlans(updatedPlans);
                                                  if (inputEl) inputEl.value = '';
                                                }
                                              }}
                                              className="px-3 bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs rounded-lg transition-colors cursor-pointer"
                                            >
                                              Add
                                            </button>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => savePlanChanges(p.id, p)}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                                >
                                  Save {p.name || p.id} Settings
                                </button>
                                {p.id !== 'free' && p.id !== 'premium' && (
                                  <button
                                    onClick={() => deletePlanMethod(p.id)}
                                    className="p-2 border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all cursor-pointer"
                                    title={`Delete ${p.name || p.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: SUPPORT HELP MESSAGES */}
              {tab === 'messages' && (
                <div className="space-y-4">
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-400" /> Helpdesk Interaction Tickets
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Review contact questions or requests and type an instant in-app text prompt replies.</p>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-2 scrollbar-thin">
                    {messagesList.map((m: any) => {
                      const isExpanded = !!expandedItems[m.id];
                      return (
                        <div key={m.id} className="bg-slate-950/40 border border-slate-850 rounded-xl overflow-hidden font-sans transition-all">
                          {/* Message Header */}
                          <div 
                            onClick={() => toggleExpand(m.id)}
                            className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none bg-slate-900/40 hover:bg-slate-900/90 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-xs text-white truncate">{m.username}</span>
                              {m.reply ? (
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded tracking-wider uppercase">Answered</span>
                              ) : (
                                <span className="text-[9px] font-black text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded tracking-wider uppercase animate-pulse">New Ticket</span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[10px] shrink-0">
                              {new Date(m.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="p-4 bg-slate-950/50 border-t border-slate-800/60 space-y-3 animate-fade-in text-xs">
                              <div>
                                <span className="text-slate-500 font-bold block uppercase text-[9px] mb-1">Ticket Details</span>
                                <div className="text-[10px] text-slate-400 font-mono flex flex-col gap-0.5">
                                  <span>ID: {m.id}</span>
                                  <span>Created: {new Date(m.createdAt).toLocaleString()}</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-slate-500 font-bold block uppercase text-[9px] mb-1">Inquiry Message</span>
                                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                                  {m.message}
                                </p>
                              </div>

                              {m.reply ? (
                                <div className="p-3 bg-indigo-950/15 border border-indigo-950/40 text-xs rounded-lg text-slate-300">
                                  <span className="font-bold text-indigo-400 block mb-1">✓ System Advisor Reply:</span> 
                                  <p>{m.reply}</p>
                                </div>
                              ) : (
                                <div className="pt-2">
                                  <span className="text-slate-500 font-bold block uppercase text-[9px] mb-2">Write In-app Response Reply</span>
                                  {replyInputActive === m.id ? (
                                    <div className="space-y-2 mt-2">
                                      <textarea
                                        autoFocus
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your response here..."
                                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 rounded-lg outline-none focus:border-indigo-500 h-20 resize-none font-sans"
                                      />
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={() => submitReply(m.id)} 
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                          Send Reply
                                        </button>
                                        <button 
                                          onClick={() => setReplyInputActive(null)} 
                                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => replyToMessage(m.id)} 
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      Write Inline Reply
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {messagesList.length === 0 && (
                      <div className="text-center py-16 text-slate-400 text-xs">
                        No support messages recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: PAYMENT METHODS */}
              {tab === 'payment-methods' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-500" /> Customize Mobile Banking Payment Methods & Numbers
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Configure bKash, Nagad, Rocket or any other transaction channel details that users will see on the billing screen.</p>
                    </div>
                    <button 
                      onClick={fetchPaymentMethods}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-700 font-sans"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reload List
                    </button>
                  </div>

                  {pmStatusMsg && (
                    <div className={`p-3 border rounded-xl text-xs font-semibold ${
                      pmStatusMsg.includes("successfully") ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" : "bg-indigo-950/20 text-indigo-300 border-indigo-500/20 font-sans"
                    }`}>
                      {pmStatusMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    {/* Add/Edit Form */}
                    <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        {editingPaymentMethodId ? "Edit Payment Method" : "Add New Payment Method"}
                      </h4>
                      
                      <form onSubmit={savePaymentMethod} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Provider Name *</label>
                          <input 
                            type="text"
                            required
                            value={methodName}
                            onChange={(e) => setMethodName(e.target.value)}
                            placeholder="e.g. bKash, Nagad, Rocket"
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-205 outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number *</label>
                          <input 
                            type="text"
                            required
                            value={methodNumber}
                            onChange={(e) => setMethodNumber(e.target.value)}
                            placeholder="e.g. 017XXXXXXXX"
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-205 outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Type</label>
                          <select 
                            value={methodType}
                            onChange={(e) => setMethodType(e.target.value)}
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-205 outline-none focus:border-indigo-500"
                          >
                            <option value="Personal">Personal</option>
                            <option value="Agent">Agent</option>
                            <option value="Merchant">Merchant</option>
                          </select>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            {editingPaymentMethodId ? "Update Method" : "Create Method"}
                          </button>
                          {editingPaymentMethodId && (
                            <button
                              type="button"
                              onClick={cancelEditPaymentMethod}
                              className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer text-center border border-slate-850"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Active list */}
                    <div className="lg:col-span-2 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Active Payment Channels
                      </h4>

                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/20 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                          No active payment methods saved. Please add one.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {paymentMethods.map((pm: any) => {
                            const isExpanded = !!expandedItems[pm.id];
                            return (
                              <div key={pm.id} className="bg-slate-950/40 border border-slate-850 rounded-xl overflow-hidden font-sans transition-all">
                                <div 
                                  onClick={() => toggleExpand(pm.id)}
                                  className="p-4 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-900/40 transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-slate-200">{pm.name}</span>
                                      <span className="text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 px-2 py-0.5 rounded font-black">{pm.type}</span>
                                    </div>
                                    <p className="font-mono text-xs text-slate-400 mt-1.5 tracking-wider bg-slate-950 px-2 py-0.5 rounded inline-block border border-slate-900/40">{pm.number}</p>
                                  </div>
                                  <div className="text-slate-500 hover:text-slate-300">
                                    <Sliders className="w-3.5 h-3.5" />
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs animate-fade-in">
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      <span>Channel Ref ID: {pm.id}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => startEditPaymentMethod(pm)}
                                        className="p-1 px-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer"
                                        title="Edit Provider"
                                      >
                                        <Edit2 className="w-3 h-3" /> Edit
                                      </button>
                                      <button
                                        onClick={() => deletePaymentMethod(pm.id)}
                                        className="p-1 px-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                                        title="Delete Provider"
                                      >
                                        <Trash2 className="w-3 h-3" /> Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'credit-pricing' && (
                <div className="space-y-6">
                   <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                     <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                       <Search className="w-4 h-4 text-fuchsia-400" /> Token Economy & Profit Margin System
                     </h3>
                     <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                       Configure AI costs dynamically. 1 Million tokens generated by the AI costs approximately 240 BDT ($2.00 * 120 BDT/USD rates on average). 
                       <br/>You define a margin on top of this. The calculator below allows you to accurately foresee the token values users get based on their BDT purchase. Note: 1 Coin = 1 Token. An average 1-minute voice chat consumes roughly 15,000 tokens (or coins). High outputs (tens of thousands of coins per standard BDT charge) are totally normal AI economy token ranges!
                     </p>
                   </div>
                   <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 p-2">
                     <div className="p-6 space-y-4">
                       <h2 className="text-lg font-bold text-white">Profit Margin (%)</h2>
                       <div className="flex gap-4 items-end">
                         <div className="flex-1">
                           <input type="number" value={localProfitMargin} onChange={e => setLocalProfitMargin(e.target.value)} className="w-full bg-slate-800 text-white border border-slate-700 p-3 rounded-xl outline-none focus:ring-1 focus:ring-fuchsia-500 font-mono text-lg" />
                         </div>
                         <button onClick={saveSettings} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Save className="w-4 h-4"/> Update Margin</button>
                       </div>
                       {feedback && <p className="text-emerald-400 text-xs font-bold">{feedback}</p>}
                     </div>
                   </div>
                   
                   <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 p-6">
                     <h2 className="text-lg font-bold text-white mb-4">Custom Feature Calculator Testing</h2>
                     <div className="flex flex-col gap-4">
                       <div>
                         <label className="text-xs font-bold text-slate-400 block mb-1">If User Purchases Plan For (BDT/Taka):</label>
                         <div className="relative">
                           <span className="absolute left-3 top-3.5 text-sm font-bold text-slate-500">৳</span>
                           <input type="number" value={calcBdt} onChange={(e) => setCalcBdt(Number(e.target.value))} className="w-full bg-slate-800 pl-8 pr-3 py-3 rounded-xl text-white outline-none focus:ring-1 focus:ring-fuchsia-500 border border-slate-700 font-mono" />
                         </div>
                       </div>
                       
                       <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 mt-2">
                         <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-400">Yields Token Quantity:</span>
                           <strong className="text-fuchsia-400 font-mono text-lg tracking-wider">
                             {Math.floor(calcBdt * Math.floor(1000000 / ((2.0 * 120) * (1 + Number(localProfitMargin||20) / 100)))).toLocaleString()} Coins
                           </strong>
                         </div>
                         <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-3">
                           <span className="text-slate-400">Est. Voice Chat Time:</span>
                           <strong className="text-emerald-400 font-mono text-lg">
                             {Math.floor(calcBdt * Math.floor(1000000 / ((2.0 * 120) * (1 + Number(localProfitMargin||20) / 100))) / 15000)} Minutes
                           </strong>
                         </div>
                         <p className="text-[9px] text-slate-500 pt-1 leading-relaxed">Calculated based on {localProfitMargin}% profit margin overhead. Values will seamlessly apply to Custom Plan purchases inside the user Buy Premium portal.</p>
                       </div>
                     </div>
                   </div>
                </div>
              )}

              {/* TAB 7: SMS RECEIVER PORTAL */}
              {tab === 'sms-receiver' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-cyan-400" /> SMS Receiver Portal
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Live feed of SMS messages received from your external Android application webhook.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/20 border border-slate-800 rounded-2xl overflow-hidden font-sans">
                    <div className="grid grid-cols-6 p-4 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60">
                      <div className="col-span-1">Time & Sender</div>
                      <div className="col-span-3">Raw Message Details</div>
                      <div className="col-span-1">Extracted TrxID</div>
                      <div className="col-span-1 text-right">Status</div>
                    </div>
                    <div className="flex flex-col max-h-[500px] overflow-y-auto">
                      {adminMessages.map((msg, i) => (
                        <div key={i} className="grid grid-cols-6 p-4 border-b border-slate-800/50 hover:bg-slate-800/20 transition-all text-xs items-center">
                          <div className="col-span-1 flex flex-col gap-1 pr-2">
                            <span className="font-mono text-[10px] text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                            <span className="font-bold text-indigo-300">{msg.sender}</span>
                          </div>
                          <div className="col-span-3 pr-4 text-slate-300 break-words line-clamp-2" title={msg.rawMessage}>
                            {msg.rawMessage}
                          </div>
                          <div className="col-span-1 flex flex-col gap-1">
                            {msg.extractedTrxId ? (
                              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20 inline-block w-fit">
                                {msg.extractedTrxId}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">No TrxID</span>
                            )}
                            {msg.extractedAmount > 0 && (
                              <span className="font-mono text-[10px] text-emerald-400">Tk {msg.extractedAmount}</span>
                            )}
                          </div>
                          <div className="col-span-1 text-right">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              msg.status === 'matched' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {msg.status === 'matched' ? 'Approved' : 'Waiting'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {adminMessages.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          <MessageSquare className="w-8 h-8 opacity-20 mx-auto mb-2" />
                          No incoming messages received yet.
                        </div>
                      )}
                    </div>
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
