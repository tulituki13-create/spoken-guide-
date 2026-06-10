const fs = require('fs');
let txt = fs.readFileSync('src/components/MyCreditCosts.tsx', 'utf8');

txt = txt.replace(`      ]).then(([costsData, txData]) => {
        if (costsData && costsData.costs) {
          setCosts(costsData.costs);
        }
        if (txData && txData.transactions) {
          setTransactions(txData.transactions);
        }
      }).catch(err => console.error("Error loading credit costs:", err))`, `      ]).then(([costsData, txData]) => {
        if (costsData && costsData.costs) {
          const mappedCosts = costsData.costs.map((c: any) => {
            if (c.activity === "Voice Chat (Live Duration)") {
              const seconds = Math.round((c.totalCost || 0) / 5);
              const durationStr = seconds >= 60 ? \`\${Math.floor(seconds/60)}m \${seconds%60}s\` : \`\${seconds}s\`;
              return {
                 ...c,
                 activity: "Voice Conversation",
                 usageCountDisplay: \`Total Duration: \${durationStr}\`
              };
            }
            return {
               ...c,
               usageCountDisplay: \`\${c.usageCount} transactions\`
            };
          });
          setCosts(mappedCosts);
        }
        if (txData && txData.transactions) {
          const grouped: any[] = [];
          const txs = txData.transactions;
          for (let i = 0; i < txs.length; i++) {
            const t = txs[i];
            if (t.activity === "Voice Chat (Live Duration)") {
               let sumAmount = Number(t.amount) || 0;
               let j = i + 1;
               while (j < txs.length && txs[j].activity === "Voice Chat (Live Duration)") {
                   const timeI = new Date(txs[j-1].createdAt).getTime();
                   const timeJ = new Date(txs[j].createdAt).getTime();
                   if (timeI - timeJ < 180000) {
                      sumAmount += Number(txs[j].amount) || 0;
                      j++;
                   } else {
                      break;
                   }
               }
               const seconds = Math.round(sumAmount / 5);
               const durationStr = seconds >= 60 ? \`\${Math.floor(seconds/60)}m \${seconds%60}s\` : \`\${seconds}s\`;
               grouped.push({
                 ...t,
                 activity: \`Voice Conversation (\${durationStr})\`,
                 amount: sumAmount
               });
               i = j - 1;
            } else {
               grouped.push(t);
            }
          }
          setTransactions(grouped);
        }
      }).catch(err => console.error("Error loading credit costs:", err))`);

txt = txt.replace(`{c.usageCount} transactions`, `{c.usageCountDisplay || \`\${c.usageCount} transactions\`}`);

fs.writeFileSync('src/components/MyCreditCosts.tsx', txt);
console.log("Updated MyCreditCosts.tsx");
