export function buildVaultContext(memories: any[], convSnippets: any[]) {
  const memLines = memories.map(m => `- ${m.key} (${m.category}, importance=${m.importance}): ${m.value}`).join('\n');
  const convLines = convSnippets.map(c => `- [${c.id}] ${c.snippet}`).join('\n');
  let out = '';
  if (memLines) out += `RETRIEVED_MEMORIES:\n${memLines}\n\n`;
  if (convLines) out += `RELEVANT_CONVERSATIONS:\n${convLines}\n\n`;
  out += 'INSTRUCTION: Use only the above facts when directly relevant to answer concisely.';
  return out;
}
