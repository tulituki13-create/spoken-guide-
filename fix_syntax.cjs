const fs = require('fs');
let code = fs.readFileSync('src/components/SocialHub.tsx', 'utf-8');

// `</div>\n    </div>\n    </div>\n  );\n};` was created but misses `</>\n          )}`
// I will just replace `</div>\n    </div>\n    </div>\n  );\n};` with `</>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n};`

code = code.replace(`      </div>
    </div>
    </div>
  );
};`, `        </>
        )}
      </div>
    </div>
  </div>
  );
};`);

fs.writeFileSync('src/components/SocialHub.tsx', code);
