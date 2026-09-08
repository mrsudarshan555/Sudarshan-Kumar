// src/memory/semantic.ts

export const SYNONYMS: Record<string, string[]> = {
  mom: ['mother', 'माँ', 'मम्मी', 'mommy', 'ma'],
  mother: ['mom', 'माँ', 'मम्मी'],
  dad: ['father', 'पिता', 'पापा'],
  name: ['naam', 'नाम'],
  project: ['प्रोजेक्ट', 'काम']
};

export function normalizeText(t: string): string {
  if (!t) return '';
  // Keep Devanagari and basic alphanumerics; remove punctuation except unicode letters
  return t
    .toLowerCase()
    .replace(/[^\p{L}0-9\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(t: string): string[] {
  const n = normalizeText(t);
  if (!n) return [];
  return n.split(/\s+/).filter(Boolean);
}

export function expandTokens(tokens: string[]): string[] {
  const set = new Set<string>();
  for (const tok of tokens) {
    set.add(tok);
    const syns = SYNONYMS[tok];
    if (syns) syns.forEach(s => set.add(s));
  }
  return Array.from(set);
}

export function tokenOverlapScore(query: string, text: string): number {
  const qTokens = tokenize(query);
  const expanded = expandTokens(qTokens);
  const tTokens = new Set(tokenize(text));
  if (expanded.length === 0 || tTokens.size === 0) return 0;
  let matches = 0;
  for (const tok of expanded) if (tTokens.has(tok)) matches++;
  return matches / Math.max(1, Math.min(tTokens.size, expanded.length));
}

export function fuzzySubstringScore(query: string, text: string): number {
  const q = normalizeText(query);
  const t = normalizeText(text);
  if (!q || !t) return 0;
  if (t.includes(q)) return 1.0;
  const qtoks = q.split(/\s+/).filter(Boolean);
  let best = 0;
  for (const qt of qtoks) {
    if (!qt) continue;
    if (t.includes(qt)) best = Math.max(best, 0.8);
    if (t.startsWith(qt) || t.endsWith(qt)) best = Math.max(best, 0.6);
  }
  return best;
}
