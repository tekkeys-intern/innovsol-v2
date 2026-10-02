const fs = require('fs');
let content = fs.readFileSync('src/innovsol/body.html.txt', 'utf8');

// The original file probably had 
// "your team — shipping" and bullets "Python • LLMs" or "Python &middot; LLMs"
content = content.replace(/your team \? shipping/g, 'your team &mdash; shipping');
content = content.replace(/Python \? LLMs \? MLOps \? Cloud infrastructure/g, 'Python &middot; LLMs &middot; MLOps &middot; Cloud infrastructure');
content = content.replace(/NLP \? Classification \? Time-series \? Production models/g, 'NLP &middot; Classification &middot; Time-series &middot; Production models');
content = content.replace(/Pre-sales \? Enterprise architecture \? Delivery leadership/g, 'Pre-sales &middot; Enterprise architecture &middot; Delivery leadership');
content = content.replace(/Pipelines \? Streaming \? AI data infrastructure/g, 'Pipelines &middot; Streaming &middot; AI data infrastructure');
content = content.replace(/Roadmaps \? ROI models \? C-suite engagement/g, 'Roadmaps &middot; ROI models &middot; C-suite engagement');
content = content.replace(/Senior engineer \+ client leadership \? 12-week sprints/g, 'Senior engineer + client leadership &middot; 12-week sprints');

fs.writeFileSync('src/innovsol/body.html.txt', content, 'utf8');
console.log('Fixed encoding issues in body.html.txt');
