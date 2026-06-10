const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

const commentInputOld = `                      {/* Add Comment Input Row */}
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
                      </div>`;

const commentInputNew = `                      {/* Add Comment Input Row */}
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
                      )}`;

code = code.replace(commentInputOld, commentInputNew);
fs.writeFileSync('src/components/SocialHub.tsx', code);
