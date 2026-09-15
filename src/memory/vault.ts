export type MemoryItem = {
  id: string;
  key: string;
  value: string;
  category: string;
  importance: number;
  source: 'user' | 'auto' | 'system';
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  accessCount: number;
};

const fs = await import('fs');
const path = await import('path');

const STATE_DIR = process.env.MEMORY_STATE_PATH || path.join(process.cwd(), 'state');
const MEM_FILE = path.join(STATE_DIR, 'memories.json');

function ensureStateDir() {
  try {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
  } catch (e) {}
}

function atomicWrite(filePath: string, data: string) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, data, 'utf8');
  fs.renameSync(tmp, filePath);
}

export class MemoryVault {
  memories: MemoryItem[] = [];

  constructor() {
    ensureStateDir();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(MEM_FILE)) {
        const raw = fs.readFileSync(MEM_FILE, 'utf8');
        this.memories = JSON.parse(raw) as MemoryItem[];
      } else {
        this.memories = [];
      }
    } catch (e) {
      console.warn('MemoryVault load failed, initializing empty store');
      this.memories = [];
    }
  }

  persist() {
    try {
      atomicWrite(MEM_FILE, JSON.stringify(this.memories, null, 2));
    } catch (e) {
      console.warn('MemoryVault persist failed', e);
    }
  }

  add(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessedAt' | 'accessCount'>) {
    const now = Date.now();
    const id = `mem-${now}-${Math.floor(Math.random()*100000)}`;
    const mi: MemoryItem = {
      id,
      key: item.key,
      value: item.value,
      category: item.category,
      importance: item.importance ?? 0.5,
      source: item.source || 'user',
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      accessCount: 0
    };
    this.memories.unshift(mi);
    this.persist();
    return mi;
  }

  list() {
    return this.memories.slice();
  }

  searchByKey(key: string) {
    return this.memories.filter(m => m.key.toLowerCase().includes(key.toLowerCase()));
  }

  promote(id: string) {
    const idx = this.memories.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.memories[idx].importance = Math.min(1, this.memories[idx].importance + 0.3);
    this.memories[idx].source = 'user';
    this.memories[idx].updatedAt = Date.now();
    this.persist();
    return true;
  }

  remove(id: string) {
    const idx = this.memories.findIndex(m => m.id === id || m.key === id);
    if (idx === -1) return null;
    const removed = this.memories.splice(idx, 1)[0];
    this.persist();
    return removed;
  }

  semanticSearch(query: string, topK: number = 6) {
    // Simple heuristic: token overlap + importance + recency
    const q = query.toLowerCase();
    const scored = this.memories.map(m => {
      const text = (m.key + ' ' + m.value).toLowerCase();
      const overlap = text.split(/\s+/).filter(t => q.includes(t)).length;
      const sem = overlap / Math.max(1, text.split(/\s+/).length);
      const recency = Math.max(0, 1 - (Date.now() - m.lastAccessedAt) / (1000 * 60 * 60 * 24 * 30));
      const score = sem * 0.6 + m.importance * 0.25 + recency * 0.15;
      return { m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, topK).map(s => s.m);
    // update access metadata
    top.forEach(t => { t.accessCount++; t.lastAccessedAt = Date.now(); });
    this.persist();
    return top;
  }
}
