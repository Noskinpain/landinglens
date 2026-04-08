const fs = require('fs');
let c = fs.readFileSync('src/app/home-client.tsx', 'utf8');

c = c.replace('action="/result"', '');
c = c.replace('method="GET"', '');

fs.writeFileSync('src/app/home-client.tsx', c);
