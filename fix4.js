const fs = require('fs');
let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!c.includes('export const viewport')) {
    c = c.replace('export const metadata', 'export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };\n\nexport const metadata');
    fs.writeFileSync('src/app/layout.tsx', c);
}
