import React, { useState, useEffect } from "react";
import { Lock, X, Plus, Trash2, CheckCircle } from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secret, setSecret] = useState("");
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New Scenario Form
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💬");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [icebreaker, setIcebreaker] = useState("");
  const [difficulty, setDifficulty] = useState("মাঝারি");
  const [message, setMessage] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret === "admin123") {
      setIsAuthenticated(true);
      fetchScenarios();
    } else {
      setMessage("Invalid secret key.");
    }
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
      if (res.ok) fetchScenarios();
    } catch(err) {
      console.error(err);
    }
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
          systemPrompt,
          icebreaker,
          meta: {
            name,
            icon,
            description,
            difficulty,
            vocabulary: []
          }
        })
      });
      if (res.ok) {
        setMessage("Scenario created successfully!");
        fetchScenarios();
        // Reset form
        setName("");
        setSystemPrompt("");
        setIcebreaker("");
        setDescription("");
      } else {
        setMessage("Failed to create scenario.");
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Create Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-500" />
                  Create New Prompt
                </h3>
                {message && (
                  <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">
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
                  <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Custom Scenario"}
                  </button>
                </form>
              </div>

              {/* Right Column: Existing Scenarios */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">Active Scenarios</h3>
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
                  {scenarios.map(sc => (
                    <div key={sc.id} className="p-4 border border-slate-200 rounded-xl bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sc.icon}</span>
                        <div>
                          <p className="font-bold text-sm text-slate-800">{sc.name}</p>
                          <p className="text-xs text-slate-400">{sc.id}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(sc.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
