import React, { useState, useEffect } from "react";
import { Lock, X, Plus, Trash2, CheckCircle, Edit2, RotateCcw } from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New Scenario Form / Edit Scenario Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💬");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [icebreaker, setIcebreaker] = useState("");
  const [difficulty, setDifficulty] = useState("মাঝারি");
  const [topicPdfId, setTopicPdfId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [tab, setTab] = useState<'scenarios' | 'users' | 'messages'>('scenarios');
  const [users, setUsers] = useState<any[]>([]);
  const [messagesList, setMessagesList] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/admin/users", { headers: { "admin-secret": secret } });
      setUsers(await res.json());
    } catch (e) {}
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/auth/admin/messages", { headers: { "admin-secret": secret } });
      setMessagesList(await res.json());
    } catch (e) {}
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret === "admin123" || secret === "admin") {
      setIsAuthenticated(true);
      fetchScenarios();
      fetchUsers();
      fetchMessages();
    } else {
      setMessage("Invalid secret key.");
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

  const replyToMessage = async (id: string) => {
    const reply = window.prompt("Reply message:");
    if (!reply) return;
    await fetch(`/api/auth/admin/messages/${id}/reply`, {
      method: "POST",
      headers: { "admin-secret": secret, "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    });
    fetchMessages();
  };

  const fetchScenarios = () => {
    fetch("/api/scenarios")
      .then(res => res.json())
      .then(data => setScenarios(data))
      .catch(err => console.error(err));
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}`, {
        method: "DELETE",
        headers: { Authorization: secret }
      });
      if (res.ok) {
        fetchScenarios();
        if (editingId === id) {
          handleCancelEdit();
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditClick = (sc: any) => {
    setEditingId(sc.id);
    setName(sc.name);
    setIcon(sc.icon || "💬");
    setDescription(sc.description || "");
    setSystemPrompt(sc.systemPrompt || "");
    setIcebreaker(sc.icebreaker || "");
    setDifficulty(sc.difficulty || "মাঝারি");
    setTopicPdfId(sc.pdfId || null);
    setMessage(`Editing scenario: ${sc.name}`);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setIcon("💬");
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
            description,
            difficulty,
            pdfId: topicPdfId,
            vocabulary: []
          }
        })
      });
      if (res.ok) {
        setMessage(editingId ? "Scenario updated successfully!" : "Scenario created successfully!");
        fetchScenarios();
        // Reset/Clear form
        setEditingId(null);
        setName("");
        setIcon("💬");
        setSystemPrompt("");
        setIcebreaker("");
        setDescription("");
        setDifficulty("মাঝারি");
        setTopicPdfId(null);
      } else {
        setMessage("Failed to save scenario.");
      }
    } catch(err) {
      console.error(err);
      setMessage("Error occurred.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-slate-800">Admin Control Panel</h2>
            <p className="text-sm font-medium text-slate-500">Manage interactive scenarios for users.</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex border-b border-slate-200">
            <button className={`px-4 py-3 font-bold ${tab === 'scenarios' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`} onClick={() => setTab('scenarios')}>Scenarios</button>
            <button className={`px-4 py-3 font-bold ${tab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`} onClick={() => setTab('users')}>Users</button>
            <button className={`px-4 py-3 font-bold ${tab === 'messages' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`} onClick={() => setTab('messages')}>Messages</button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Enter Admin Secret</h3>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                  type="password"
                  required
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                  placeholder="Secret key..."
                />
                <button type="submit" className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition-colors">
                  Unlock Access
                </button>
                {message && <p className="text-red-500 text-sm p-2 bg-red-50 rounded-lg">{message}</p>}
              </form>
            </div>
          ) : tab === 'users' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Manage Users</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((u: any) => (
                   <div key={u.id} className="p-4 border rounded-xl flex justify-between items-center">
                     <div>
                       <p className="font-bold">{u.username}</p>
                       <p className="text-xs text-slate-500">Time used: {u.chatTimeUsed}s</p>
                     </div>
                     <button onClick={() => togglePremium(u.id, u.isPremium)} className={`px-3 py-1 text-xs font-bold rounded-full ${u.isPremium ? 'bg-amber-100 text-amber-700' : 'bg-slate-100'}`}>
                       {u.isPremium ? 'Premium' : 'Make Premium'}
                     </button>
                   </div>
                ))}
              </div>
            </div>
          ) : tab === 'messages' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">User Messages</h3>
              <div className="flex flex-col gap-4">
                {messagesList.map((m: any) => (
                   <div key={m.id} className="p-4 border rounded-xl">
                     <p className="font-bold text-sm text-indigo-600">{m.username} <span className="text-slate-400 text-xs font-normal">{new Date(m.createdAt).toLocaleString()}</span></p>
                     <p className="mt-1">{m.message}</p>
                     {m.reply ? (
                       <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm"><span className="font-bold">Reply:</span> {m.reply}</div>
                     ) : (
                       <button onClick={() => replyToMessage(m.id)} className="mt-3 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 font-bold rounded-lg hover:bg-indigo-200">Reply</button>
                     )}
                   </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Create or Edit Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {editingId ? <Edit2 className="w-5 h-5 text-amber-500 animate-pulse" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                    {editingId ? "Edit Existing Prompt" : "Create New Prompt"}
                  </span>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer font-bold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Cancel Edit
                    </button>
                  )}
                </h3>
                {message && (
                  <div className={`p-3 border rounded-lg text-sm font-medium ${
                    editingId ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {message}
                  </div>
                )}
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scenario Name</label>
                      <input 
                        required value={name} onChange={e => setName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                        placeholder="e.g. Job Interview" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Icon Emoji</label>
                      <input 
                        required value={icon} onChange={e => setIcon(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                        placeholder="e.g. 💼" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                    <input 
                      required value={description} onChange={e => setDescription(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                      placeholder="Short description for users" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">System Prompt Context</label>
                    <textarea 
                      required value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm h-32" 
                      placeholder="You are acting as..." 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">AI Icebreaker (First Line)</label>
                    <input 
                      required value={icebreaker} onChange={e => setIcebreaker(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                      placeholder="Hello! Welcome to..." 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Attached PDF for Students (Premium Only)</label>
                    <div className="flex items-center gap-2">
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
                               alert("PDF uploaded successfully! Save scenario to attach.");
                             } else {
                               alert("Failed to upload PDF.");
                             }
                           };
                           reader.readAsDataURL(file);
                         }}
                         className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                       />
                       {topicPdfId && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Linked</span>}
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    type="submit" 
                    className={`w-full py-3 text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${
                      editingId ? "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-100" : "bg-slate-800 hover:bg-slate-900"
                    }`}
                  >
                    {loading ? "Saving..." : editingId ? "Update Custom Scenario" : "Save Custom Scenario"}
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Scenarios */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Active Scenarios</h3>
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
                  {scenarios.map(sc => (
                    <div 
                      key={sc.id} 
                      className={`p-4 border rounded-xl bg-white flex items-center justify-between transition-all ${
                        editingId === sc.id 
                          ? "border-amber-400 ring-4 ring-amber-100/50 bg-amber-50/20" 
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <span className="text-2xl shrink-0">{sc.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate">{sc.name}</p>
                          <p className="text-xs text-slate-400 truncate font-mono">{sc.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleEditClick(sc)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            editingId === sc.id ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "text-amber-500 hover:bg-amber-50"
                          }`}
                          title="Edit Scenario Prompt"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(sc.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Scenario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
