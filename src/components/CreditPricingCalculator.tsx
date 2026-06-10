import React, { useState } from 'react';
import { ArrowLeft, Calculator as CalcIcon, DollarSign, Percent, Zap, TrendingUp, Save, Server, Mic, MessageSquare, Bot, FileText, Activity } from 'lucide-react';

export function CreditPricingCalculator() {
  

  const [exchangeRate, setExchangeRate] = useState<number>(120);
  const [costPerMillionUsd, setCostPerMillionUsd] = useState<number>(0.15);
  const [profitMargin, setProfitMargin] = useState<number>(20);

  const [tokensLive, setTokensLive] = useState<number>(18000);
  const [tokensMsg, setTokensMsg] = useState<number>(400);
  const [tokensReport, setTokensReport] = useState<number>(2500);
  const [tokensScenario, setTokensScenario] = useState<number>(5000);

  const costPerMillionBdt = costPerMillionUsd * exchangeRate;
  const sellPricePerMillionBdt = costPerMillionBdt * (1 + (profitMargin / 100));
  const tokensPerTaka = 1000000 / sellPricePerMillionBdt;

  const costPerTk = (t: number) => (t / 1000000) * sellPricePerMillionBdt;
  const srvCost = (t: number) => (t / 1000000) * costPerMillionBdt;

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">Token Economy Calculator</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border p-6 rounded-[2rem]">
            <h3 className="font-bold text-lg mb-4">Base Metrics</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold mb-1 block">Cost per 1M Tokens (USD)</label>
                <input type="number" step="0.01" value={costPerMillionUsd} onChange={e => setCostPerMillionUsd(Number(e.target.value))} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">USD to BDT</label>
                <input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} className="w-full border rounded-xl p-3" />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Target Profit Margin (%)</label>
                <input type="number" value={profitMargin} onChange={e => setProfitMargin(Number(e.target.value))} className="w-full border rounded-xl p-3" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border p-6 rounded-[2rem]">
            <h3 className="font-bold text-lg mb-4">Event Token Costs</h3>
            <div className="flex flex-col gap-3">
              <div><label className="text-xs block">Live Min</label><input type="number" value={tokensLive} onChange={e=>setTokensLive(Number(e.target.value))} className="w-full border rounded-lg p-2" /></div>
              <div><label className="text-xs block">Per Msg</label><input type="number" value={tokensMsg} onChange={e=>setTokensMsg(Number(e.target.value))} className="w-full border rounded-lg p-2" /></div>
              <div><label className="text-xs block">Report</label><input type="number" value={tokensReport} onChange={e=>setTokensReport(Number(e.target.value))} className="w-full border rounded-lg p-2" /></div>
              <div><label className="text-xs block">Scenario</label><input type="number" value={tokensScenario} onChange={e=>setTokensScenario(Number(e.target.value))} className="w-full border rounded-lg p-2" /></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-indigo-600 p-6 rounded-[2rem] text-white">
                 <p className="font-bold text-sm">User Purchasing Power</p>
                 <h2 className="text-4xl font-black">{Math.floor(tokensPerTaka).toLocaleString()} tokens</h2>
                 <p className="text-sm">Per 1 BDT</p>
             </div>
             <div className="bg-emerald-600 p-6 rounded-[2rem] text-white">
                 <p className="font-bold text-sm">Selling Price / 1M</p>
                 <h2 className="text-4xl font-black">BDT {sellPricePerMillionBdt.toFixed(2)}</h2>
                 <p className="text-sm">Actual Cost: BDT {costPerMillionBdt.toFixed(2)}</p>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border p-6 rounded-[2rem] flex flex-col gap-4">
             <h3 className="font-bold text-xl">Platform Costing</h3>
             <div className="grid grid-cols-2 gap-4">
                {[ 
                  { name: 'Gemini Live (Min)', val: tokensLive },
                  { name: 'Standard Message', val: tokensMsg },
                  { name: 'Fluency Report', val: tokensReport },
                  { name: 'Scenario Init.', val: tokensScenario }
                ].map(item => (
                  <div key={item.name} className="border p-4 rounded-2xl">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">{item.val.toLocaleString()} APIs</p>
                    <div className="flex justify-between">
                      <div><p className="text-[10px] font-bold">User Cost</p><p className="font-black text-indigo-600">৳{costPerTk(item.val).toFixed(4)}</p></div>
                      <div className="text-right"><p className="text-[10px] font-bold">Server</p><p className="font-bold">৳{srvCost(item.val).toFixed(4)}</p></div>
                    </div>
                  </div>
                ))}
             </div>
             <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="text-sm font-bold">Every 100 BDT recharge yields {((100 * (profitMargin / (100 + profitMargin)))).toFixed(2)} BDT gross margin.</p>
                <button onClick={() => alert('Pricing settings saved successfully.')} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold text-sm">Save</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
