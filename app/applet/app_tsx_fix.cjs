const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

if (!appTsx.includes('import { CreditPricingCalculator }')) {
  appTsx = appTsx.replace(
    'import { AdminPanel } from "./components/AdminPanel";',
    'import { AdminPanel } from "./components/AdminPanel";\nimport { CreditPricingCalculator } from "./components/CreditPricingCalculator";'
  );
}

if (!appTsx.includes('path="/buy"')) {
  appTsx = appTsx.replace(
    '<BuyPremium />\n            </ProtectedRoute>\n          } />',
    '<BuyPremium />\n            </ProtectedRoute>\n          } />\n          <Route path="/buy" element={\n            <ProtectedRoute>\n              <CreditPricingCalculator />\n            </ProtectedRoute>\n          } />'
  );
}

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Updated App.tsx successfully.");
