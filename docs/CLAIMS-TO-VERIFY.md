# Claims to verify before launch

These statements appear on the site. They came from the original copy; I could not confirm them. Anything you cannot evidence should be removed or softened. Misstated compliance or results can create legal and reputational risk.

**Already softened in this version:** "compliant" → "built to support / designed for" (HIPAA, PCI DSS, GDPR, IRDAI, SOC 2); "Trusted by…" → "Delivering AI for enterprises across 10+ industries"; testimonials hidden; disclosure notes added under results.

## 1. Compliance and security

| Where | Claim | Evidence needed |
|---|---|---|
| Healthcare page | "Built to support HIPAA & HL7 FHIR requirements", "HIPAA Support" | Describe what you actually do (BAAs? PHI handling?). Remove if you have no healthcare delivery experience |
| Retail page | "Designed for GDPR & PCI DSS requirements" | Same: scope of PCI involvement |
| Telecom / Insurance / Banking pages | "regulatory requirements", "IRDAI" | Named regulations you have delivered under |
| Startups page | "SOC 2 & GDPR support" | Whether you hold SOC 2 (report) or only support customers' SOC 2 work |
| All industry pages | "Enterprise Grade Security": data encryption, role-based access, audit logs, on-prem / private cloud | Confirm each is offered in delivery |
| Contact module | "Enterprise-grade security · Privacy-first handling" | General statement; fine if the above holds |

## 2. Results and numbers

| Where | Claim | Evidence needed |
|---|---|---|
| Home – case studies, `/case-studies/*` | 50,000+ claims/month; 68 % handle-time reduction; 40 % cost-per-claim; 42 % less unplanned downtime; $1.4M saving; 51 % resolved without escalation; CSAT 72 % → 84 % | Written client approval to publish (anonymised) and the measurement method |
| Industry pages – stats rows | e.g. 70 % faster loan processing, 20–40 % less downtime, 60 % fewer documentation hours | Source (past engagement, benchmark, or research). A disclosure line is shown; consider footnoting the source |
| Industry pages – Before/After | Outcomes like "Loan approval in same day" | Mark as typical or illustrative |
| Home – hero & metrics | "<12 weeks idea to production", "10+ industries", "24×7 AI-powered workflows" | Be able to point to examples for each |
| Careers page hero | "12+ active engagements · 6 countries · 40+ AI engineers" | Current, accurate headcounts |
| Insights draft #1 | "a widely quoted figure…" about pilot failure rates | Add a citation or delete the sentence |

## 3. People and brand

| Where | Item | Action |
|---|---|---|
| Job pages (hidden) | Testimonials "Arjun K.", "Neha S." | Confirm they are real, named with consent, then set `showTestimonials` to `true` in `content/site.json` |
| Job pages | "Life at Innovsol" photos | Confirm you own them / people consented |
| Home – "logo strip" | Sector labels (not real clients) | Replace with real logos only with written permission |
| Industry pages – integrations | SAP, Oracle, Microsoft, Epic, Salesforce… as text | Check each vendor's trademark / partner-use guidelines; "Works with" is safe only where true |
| Home – Unsplash photos | Stock images | Confirm licensing is acceptable or replace with own photography |
| Job pages | Salary "₹30-50 LPA" etc. | Confirm current ranges |

## 4. Legal pages
`/privacy.html`, `/terms.html`, `/cookies.html`, `/accessibility.html`, `/security.html` are carefully worded templates, not legal advice. Have counsel review for India's DPDP Act, GDPR (if you serve EU users) and your actual data practices (retention of applications, processors used: hosting, email, Supabase).

## 5. Company details
Add `legalName` and `registration` to `content/site.json` (shown in the footer) once confirmed.
