export function tokenOverlapScore(a: string, b: string) {
  if (!a || !b) return 0;
  const sa = a.toLowerCase().split(/\W+/).filter(Boolean);
  const sb = b.toLowerCase().split(/\W+/).filter(Boolean);
  const aset = new Set(sa);
  let common = 0;
  for (const t of sb) if (aset.has(t)) common++;
  return common / Math.max(sa.length, sb.length, 1);
}

export function fuzzyContains(hay: string, needle: string) {
  if (!hay || !needle) return false;
  hay = hay.toLowerCase(); needle = needle.toLowerCase();
  if (hay.includes(needle)) return true;
  // fuzzy simple: all tokens must be present
  const nq = needle.split(/\W+/).filter(Boolean);
  for (const tk of nq) if (!hay.includes(tk)) return false;
  return true;
}
