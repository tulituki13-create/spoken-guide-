const fs = require('fs'); 
let b = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8'); 

const replacement = `                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Step 1: Trigger</span>
                              <h5 className="font-bold text-xs text-white mt-2">Arriving SMS Notification</h5>
                              <div className="text-[11px] text-slate-400 mt-1 lines-spaced">
                                Select <strong>"SMS Received"</strong>. Set <em>"Select Sender"</em> to the platform number (e.g. bKash, Nagad or leave empty for Any Sender). Set <em>"Message Content"</em> to "Any" or containing "TrxID".
                              </div>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                              <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">Step 2: Action</span>
                              <h5 className="font-bold text-xs text-white mt-2">HTTP POST Request Dispatch</h5>
                              <div className="text-[11px] text-slate-400 mt-1 lines-spaced">
                                Add Action <strong>"HTTP POST / Open Website"</strong>:
                                <ul className="list-disc ml-4 mt-1 text-[10px] space-y-0.5 text-slate-300">
                                  <li>Choose request method: <strong>POST</strong></li>
                                  <li>Set Destination URL: Copy from top box</li>
                                  <li>Add Header: <strong>Content-Type: application/json</strong></li>
                                  <li>Add Header: <strong>admin-secret: {secret || 'admin123'}</strong></li>
                                </ul>
                              </div>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Step 3: Post Body</span>
                              <h5 className="font-bold text-xs text-white mt-2">Inject Dynamic SMS Variables</h5>
                              <div className="text-[11px] text-slate-400 mt-1 lines-spaced">
                                Under request body, check <strong>"Raw JSON payload"</strong> and enter:
                                <pre className="bg-slate-900 border border-slate-800 p-1 rounded font-mono text-[9px] mt-1 text-slate-300 overflow-x-auto text-left">
                                  {\`{"smsText": "[sms_message]"}\`}
                                </pre>
                                <em>MacroDroid will automatically replace <code className="text-emerald-400">[sms_message]</code> with the actual arriving SMS text.</em>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">`;

b = b.replace(/<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">[\s\S]*?<\/h5>\s*<div className="text-\[11px\] text-slate-400 mt-1 lines-spaced"><\/div>\s*<div className="space-y-3">/g, replacement); 
fs.writeFileSync('src/components/AdminPanel.tsx', b);
