const fs = require('fs');
let c = fs.readFileSync('src/app/result/ResultClient.tsx', 'utf8');

// Fix duplicate background
c = c.replace(/background: "rgba\(10,10,10,0\.95\)",\r?\n\s*background: "rgba\(10,10,10,1\)",/, 'background: "rgba(10,10,10,1)",');

// Fix hardware acceleration for spinner
c = c.replace(/animation: spin 0\.8s linear infinite;/g, 'animation: spin 0.8s linear infinite;\n          transform: translateZ(0);\n          will-change: transform;');

// Fix minHeight layout thrashing
c = c.replace(/minHeight: "100vh"/g, 'minHeight: "100dvh"');
// Remove native eager img loading tags that can break iOS Safari fetches
c = c.replace(/loading="eager"/g, '');
c = c.replace(/fetchPriority="high"/g, '');

fs.writeFileSync('src/app/result/ResultClient.tsx', c);
