import fs from 'fs';
import path from 'path';

const STATE_DIR = process.env.MEMORY_STATE_PATH || path.join(process.cwd(), 'state');
const CONV_FILE = path.join(STATE_DIR, 'conversations.json');

function ensureStateDir() {
  try { if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true }); } catch (e) {}
}

export class ConversationStore {
  conversations: Array<{ id: string; turns: Array<{ role: string; text: string; ts: number }> }> = [];

  constructor() {
    ensureStateDir();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONV_FILE)) {
        this.conversations = JSON.parse(fs.readFileSync(CONV_FILE, 'utf8'));
      } else this.conversations = [];
    } catch (e) { this.conversations = []; }
  }

  persist() {
    try { fs.writeFileSync(CONV_FILE + '.tmp', JSON.stringify(this.conversations, null, 2), 'utf8'); fs.renameSync(CONV_FILE + '.tmp', CONV_FILE); } catch (e) {}
  }

  appendTurn(sessionId: string, role: 'user' | 'assistant', text: string) {
    let conv = this.conversations.find(c => c.id === sessionId);
    if (!conv) { conv = { id: sessionId, turns: [] }; this.conversations.unshift(conv); }
    conv.turns.push({ role, text, ts: Date.now() });
    if (conv.turns.length > 200) conv.turns.shift();
    this.persist();
  }

  search(query: string, topK = 3) {
    const q = query.toLowerCase();
    const scored = this.conversations.map(c => {
      const joined = c.turns.map(t => t.text).join(' ').toLowerCase();
      const score = joined.includes(q) ? 1 : 0;
      return { c, score };
    }).filter(s => s.score > 0);
    const out: Array<{ id: string; snippet: string }> = [];
    for (const s of scored.slice(0, topK)) {
      out.push({ id: s.c.id, snippet: s.c.turns.slice(-4).map(t => `${t.role}: ${t.text}`).join('\n') });
    }
    return out;
  }
}
