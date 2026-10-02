// Pure, dependency-free input handling for the public forms. Unit-tested in tests/unit.

export const LIMITS = {
  firstName: 60,
  lastName: 60,
  email: 254,
  phone: 30,
  company: 120,
  industry: 80,
  enquiryType: 80,
  message: 4000,
} as const;
export type Field = keyof typeof LIMITS;

export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
export const PHONE_RE = /^[0-9+()\-.\s]{5,30}$/;

/** Strip control characters, trim and cap the length. */
export const clean = (v: unknown, max: number): string =>
  String(v ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);

/** Escape text for safe inclusion in an HTML email body. */
export const esc = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Collapse newlines (header-injection safe) for subjects and display names. */
export const oneLine = (s: string): string => s.replace(/[\r\n]+/g, " ");

export type EnquiryKind = "contact" | "playbook";
export interface Enquiry extends Record<Field, string> {
  kind: EnquiryKind;
}

export type ValidationResult =
  | { ok: true; value: Enquiry; honeypot: false }
  | { ok: true; honeypot: true }
  | { ok: false; error: string };

/** Validate and normalise a raw JSON body from the contact / playbook forms. */
export function validateEnquiry(raw: Record<string, unknown>): ValidationResult {
  // Honeypot: real users never fill this hidden field.
  if (clean(raw.website, 100)) return { ok: true, honeypot: true };

  const v = {} as Record<Field, string>;
  for (const k of Object.keys(LIMITS) as Field[]) v[k] = clean(raw[k], LIMITS[k]);
  const kind: EnquiryKind = raw.kind === "playbook" ? "playbook" : "contact";

  if (!v.firstName || !v.lastName || !v.email || !v.company)
    return { ok: false, error: "Please fill in all required fields." };
  if (!EMAIL_RE.test(v.email)) return { ok: false, error: "Please enter a valid email address." };
  if (v.phone && !PHONE_RE.test(v.phone))
    return { ok: false, error: "Please enter a valid phone number." };

  return { ok: true, honeypot: false, value: { ...v, kind } };
}
