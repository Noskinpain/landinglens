const fs = require('fs');
let c = fs.readFileSync('src/app/result/ResultPageClient.tsx', 'utf8');

c = c.replace(/minHeight: "100vh"/g, 'minHeight: "100dvh"');

fs.writeFileSync('src/app/result/ResultPageClient.tsx', c);
