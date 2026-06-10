const fs = require('fs');
let b = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

b = b.replace("interface AdminPanelProps {", "import { CreditPricingCalculator } from \"./CreditPricingCalculator\";\n\ninterface AdminPanelProps {");

b = b.replace("type TabType = 'user-transactions' | 'approvals' | 'scenarios' | 'plans' | 'messages' | 'payment-methods' | 'sms-receiver';", "type TabType = 'user-transactions' | 'approvals' | 'scenarios' | 'plans' | 'messages' | 'payment-methods' | 'sms-receiver' | 'credit-pricing';");

const buttonTarget = `<CreditCard className="w-3 h-3" /> Payment Methods Editor
                </button>
              </>
            )}`;

const buttonReplacement = `<CreditCard className="w-3 h-3" /> Payment Methods Editor
                </button>
                <button
                  className={\`px-2 py-1.5 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all \${tab === 'credit-pricing' ? 'border-fuchsia-500 text-white bg-fuchsia-500/5' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'}\`} 
                  onClick={() => setTab('credit-pricing')}
                >
                  <Search className="w-3 h-3" /> Token Economy
                </button>
              </>
            )}`;

b = b.replace(buttonTarget, buttonReplacement);

const tabContentTarget = `              {/* TAB 7: SMS RECEIVER PORTAL */}`;
const tabContentReplacement = `              {tab === 'credit-pricing' && (
                <div className="space-y-6">
                   <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                     <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                       <Search className="w-4 h-4 text-fuchsia-400" /> Token Economy Calculator
                     </h3>
                   </div>
                   <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 p-2">
                     <CreditPricingCalculator />
                   </div>
                </div>
              )}

              {/* TAB 7: SMS RECEIVER PORTAL */}`;

b = b.replace(tabContentTarget, tabContentReplacement);

fs.writeFileSync('src/components/AdminPanel.tsx', b);
console.log('Fixed Admin Panel');
