// Builds the mailto: links used by "Apply Now" and "Download Playbook".
// Single source of truth for the address and the email templates.
const TO = 'hello@innovsol.ai';

const enc = (s) => encodeURIComponent(s).replace(/%0A/g, '%0D%0A');
const link = (subject, lines) => `mailto:${TO}?subject=${enc(subject)}&body=${enc(lines.join('\n'))}`;

function applyLink(role) {
  return link(`Application for ${role}`, [
    'Hi InnovSol Hiring Team,',
    '',
    `I would like to apply for the ${role} position.`,
    '',
    '*** IMPORTANT: Please attach your resume/CV (PDF or DOCX) to this email before sending. Applications without a resume cannot be considered. ***',
    '',
    'Full name:',
    'Phone:',
    'Current location:',
    'Current company and role:',
    'Total experience:',
    'Notice period:',
    'LinkedIn / GitHub / portfolio:',
    '',
    'A few lines on why I am a good fit:',
    '',
    '',
    'Thank you,',
  ]);
}

function playbookLink(industry) {
  return link(`Playbook request: ${industry} AI Transformation`, [
    'Hi InnovSol Team,',
    '',
    `Please send me the ${industry} AI Transformation Playbook.`,
    '',
    'Name:',
    'Company:',
    'Job title:',
    'Work email:',
    'What I would like to use AI for:',
    '',
    'Thank you,',
  ]);
}

module.exports = { TO, applyLink, playbookLink };
