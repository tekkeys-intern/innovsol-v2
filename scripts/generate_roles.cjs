const fs = require('fs');
const path = require('path');

const careersBodyStr = fs.readFileSync('src/modules/careers/open-roles/open-roles.html', 'utf8');
const templateStr = fs.readFileSync('public/careers/SeniorAiEngineer.html', 'utf8');

// Regex to find each role section
const roleRegex = /<div class="car-role" id="(role-\d+)">(.*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gs;

let match;
const roles = [];

while ((match = roleRegex.exec(careersBodyStr)) !== null) {
  const roleHtml = match[0];
  
  const titleMatch = roleHtml.match(/<h3 class="car-role-title">(.*?)<\/h3>/);
  if (!titleMatch) continue;
  const title = titleMatch[1];
  
  if (title === 'Senior AI Engineer') continue; // Already exists
  
  const tagsMatch = roleHtml.match(/<div class="car-role-tags">\s*([\s\S]*?)\s*<\/div>/);
  const tagsHtml = tagsMatch ? tagsMatch[1] : '';
  const tags = [...tagsHtml.matchAll(/<span>(.*?)<\/span>/g)].map(m => m[1]);
  
  const typeMatch = roleHtml.match(/<span class="car-role-type">(.*?)<\/span>/);
  const type = typeMatch ? typeMatch[1] : '';
  const [employmentType, location] = type.split('&middot;').map(s => s.trim());
  
  const aboutMatch = roleHtml.match(/<h4>About the Role<\/h4>\s*<p>(.*?)<\/p>/);
  const about = aboutMatch ? aboutMatch[1] : '';
  
  const reqMatch = roleHtml.match(/<h4>Requirements<\/h4>\s*<ul>([\s\S]*?)<\/ul>/);
  const requirements = reqMatch ? [...reqMatch[1].matchAll(/<li>(.*?)<\/li>/g)].map(m => m[1]) : [];
  
  roles.push({ title, tags, employmentType, location, about, requirements });
}

// Generate files
roles.forEach(role => {
  const fileName = role.title.replace(/[^a-zA-Z0-9]/g, '') + '.html';
  let outStr = templateStr;
  
  // Update Title
  outStr = outStr.replace(/<title>.*?<\/title>/, `<title>${role.title} – InnovSol Careers</title>`);
  outStr = outStr.replace(/<h1>.*?<\/h1>/, `<h1>${role.title}</h1>`);
  
  // Update Meta
  outStr = outStr.replace(/<div class="meta">[\s\S]*?<\/div>\s*<div class="btns">/, 
    `<div class="meta">
        <div><i data-lucide="map-pin"></i>${role.location || 'Remote'}</div>
        <div><i data-lucide="briefcase-business"></i>${role.employmentType || 'Full-Time'}</div>
        <div><i data-lucide="wallet-cards"></i>Competitive</div>
        <div><i data-lucide="briefcase"></i>Relevant Experience</div>
      </div>
      <div class="btns">`
  );
  
  // Update Hero Art Tags
  // Random positions for tags to look good
  const positions = [
    {left: 8, top: 63},
    {left: 215, top: 41},
    {left: 202, top: 172},
    {left: 10, top: 150}
  ];
  let tagsHtml = '<img src="assets/hero-ai.jpg" alt="AI chip illustration">\n';
  role.tags.slice(0, 3).forEach((tag, i) => {
    tagsHtml += `        <span class="tag" style="left:${positions[i].left}px;top:${positions[i].top}px;padding:2px 8px">${tag}</span>\n`;
  });
  outStr = outStr.replace(/<div class="hero-art">\s*<img src="assets\/hero-ai\.jpg"[\s\S]*?<\/div>/, `<div class="hero-art">\n${tagsHtml}      </div>`);
  
  // Update About
  outStr = outStr.replace(/<h2>About the Role<\/h2>\s*<p>.*?<\/p>/s, `<h2>About the Role</h2>\n        <p>${role.about}</p>`);
  
  // Update Key Responsibilities
  const chkSvg = `<svg class="chk" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1d5be0"/><path d="M7 12.5l3.3 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  let reqHtml = '<ul>\n';
  role.requirements.slice(0, 6).forEach(req => {
    reqHtml += `          <li>${chkSvg}<span>${req}</span></li>\n`;
  });
  reqHtml += '        </ul>';
  outStr = outStr.replace(/<h2>Key Responsibilities<\/h2>\s*<ul>[\s\S]*?<\/ul>/, `<h2>Key Responsibilities</h2>\n        ${reqHtml}`);
  
  fs.writeFileSync(path.join('public/careers', fileName), outStr);
  console.log(`Generated ${fileName}`);
});

// Re-apply the mailto Apply/Playbook links to the freshly generated pages
require("./apply-mailto.cjs");
