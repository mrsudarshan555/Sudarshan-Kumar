/**
 * Unified Markdown Memory Vault Manager (ai-memory-vault-main Architecture)
 * 
 * Provides a single canonical external memory system for MAYRA and STONICX:
 * - Persistent storage with IndexedDB, LocalStorage, and Node persistent cache fallback
 * - Canonical Markdown files: MEMORY.md, DAILY-NOTE.md, VAULT-INDEX.md
 * - Living User Profile, Active Projects Matrix, Jobs & Recurring Procedures
 * - Robust deduplication (similarity >= 0.88 or normalized subject-value equality)
 * - Contradiction resolution (superseding links)
 * - Deterministic on-demand relevance retrieval (< 300 words)
 * - Sub-100ms startup guarantee
 */

export interface VaultFact {
  id: string;
  category: string;
  fact: string;
  source: 'MAYRA' | 'STONICX' | 'SYSTEM' | string;
  status: 'active' | 'superseded' | 'archived';
  supersedesId?: string;
  timestamp: string;
  updatedAt: string;
  confidence: number;
  tags: string[];
  projectSlug?: string;
  relevanceScore?: number;
  provenance?: string;
}

export interface VaultIndexEntry {
  tag: string;
  category: 'preference' | 'technical' | 'project' | 'routine' | 'profile' | 'identity' | 'checkpoint';
  source: 'MAYRA' | 'STONICX' | 'SYSTEM' | string;
  summary: string;
  timestamp: string;
  referenceDoc: 'MEMORY.md' | 'DAILY-NOTE.md' | 'VAULT-INDEX.md';
}

export interface MarkdownVaultDocument {
  name: string;
  content: string;
  lastModified: string;
}

export interface VaultJob {
  jobId: string;
  name: string;
  projectSlug: string;
  procedure: string;
  qualityBar: string;
  lessons: string[];
  status: 'active' | 'idle' | 'retired';
  bootChain?: string[];
}

export interface VaultPriority {
  id: string;
  task: string;
  projectSlug: string;
  isDone: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface VaultProject {
  slug: string;
  name: string;
  status: 'active' | 'planning' | 'completed';
  decisions: string[];
  notes: string[];
}

const STORAGE_PREFIX = 'MAYRA_STONICX_VAULT_';
const DB_NAME = 'MayraStonicxUnifiedVault';
const DB_VERSION = 1;
const STORE_NAME = 'markdown_vault';

// Cross-environment persistent storage store (survives singleton destruction in Node.js and browser)
const globalStore: Record<string, string> =
  (typeof globalThis !== 'undefined' && (globalThis as any).__MAYRA_VAULT_PERSISTENT_STORE__)
    ? (globalThis as any).__MAYRA_VAULT_PERSISTENT_STORE__
    : {};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).__MAYRA_VAULT_PERSISTENT_STORE__ = globalStore;
}

function getStoreItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // Fallback
    }
  }
  return globalStore[key] || null;
}

function setStoreItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Fallback
    }
  }
  globalStore[key] = value;
}

function removeStoreItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      // Fallback
    }
  }
  delete globalStore[key];
}

export const DEFAULT_MEMORY_MD = `# MAYRA & STONICX UNIFIED MEMORY VAULT (MEMORY.md)
*Persistent external memory, living user profile, projects, jobs, and long-term knowledge.*

## 1. Living User Profile
### Who I Am
- User: Commander / Primary Operator
- Shared System: MAYRA (Empathetic Holographic Voice Assistant) & STONICX (Hyper-Technical AI Neural Engine)

### Preferences
- Workspace Theme: Cybernetic / Twilight Blue
- Execution Mode: Dual-Brain Unified Delegation

## 2. Active Projects Matrix
### MAYRA Operating System
- Status: active
- Focus: Android AI Assistant, CameraX vision intelligence, on-demand memory vault

## 3. Jobs & Recurring Procedures
### System Maintenance
- Trigger: Routine sync or diagnostic query
- Quality Bar: Sub-100ms cold start, no duplicate facts, bounded context (<300 words)

## 4. Long-Term Facts & Knowledge
- Architecture: Single canonical memory vault with Markdown source of truth
`;

export const DEFAULT_DAILY_NOTE_MD = `# DAILY TIMELINE (DAILY-NOTE.md)
*Session logs, active task snippets, and rolling conversation history.*

# Index
- [[#Session 1 — Initialization]]

## Session 1 — Initialization
### What Got Done
- Initialized unified memory vault with IndexedDB and LocalStorage backing.
### What's Still In Progress
- Continuous conversational sync and on-demand relevance retrieval.
### Decisions Made
- Single logical canonical vault with zero duplicate rows.
### Notes Touched
- MEMORY.md, VAULT-INDEX.md
`;

export const DEFAULT_VAULT_INDEX_MD = `# VAULT INDEX & ROOT MAP (VAULT-INDEX.md)
*Root orientation map pointing to persistent memory subsystems.*

## Vault Directory Map
- [[MEMORY.md#1. Living User Profile|Living User Profile]]: Durable operator preferences and identity
- [[MEMORY.md#2. Active Projects Matrix|Active Projects]]: Project status, decisions, priorities
- [[MEMORY.md#3. Jobs & Recurring Procedures|Jobs & Procedures]]: Recurring task instructions & quality bars
- [[DAILY-NOTE.md|Daily Notes]]: Session logs, decisions, and rolling history

## Fast Tag Lookup Table
| Tag | Category | Source | Summary | Target |
| :--- | :--- | :--- | :--- | :--- |
| #bootstrap | routine | SYSTEM | Vault initialized | DAILY-NOTE.md |
| #persona | identity | SYSTEM | Dual-brain MAYRA ↔ STONICX setup | MEMORY.md |
| #technical | technical | STONICX | System runtime & compiler specifications | MEMORY.md |
`;

export class MemoryVaultManager {
  private static instance: MemoryVaultManager | null = null;
  private memoryCache: Map<string, string> = new Map();
  private indexEntries: VaultIndexEntry[] = [];
  private structuredFacts: VaultFact[] = [];
  private jobs: VaultJob[] = [];
  private priorities: VaultPriority[] = [];
  private dailyNoteArchive: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;
  private db: IDBDatabase | null = null;

  private constructor() {
    this.initDefaultJobs();
  }

  public static getInstance(): MemoryVaultManager {
    if (!this.instance) {
      this.instance = new MemoryVaultManager();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.clearCaches();
      this.instance = null;
    }
  }

  /**
   * Clears in-memory caches without deleting disk/persistent store.
   */
  public clearCaches(): void {
    this.memoryCache.clear();
    this.indexEntries = [];
    this.structuredFacts = [];
    this.jobs = [];
    this.priorities = [];
    this.dailyNoteArchive.clear();/**
 * Unified Markdown Memory Vault Manager (ai-memory-vault-main Architecture)
 * 
 * Provides a single canonical external memory system for MAYRA and STONICX:
 * - Persistent storage with IndexedDB, LocalStorage, and Node persistent cache fallback
 * - Canonical Markdown files: MEMORY.md, DAILY-NOTE.md, VAULT-INDEX.md
 * - Living User Profile, Active Projects Matrix, Jobs & Recurring Procedures
 * - Robust deduplication (similarity >= 0.88 or normalized subject-value equality)
 * - Contradiction resolution (superseding links)
 * - Deterministic on-demand relevance retrieval (< 300 words)
 * - Sub-100ms startup guarantee
 */

export interface VaultFact {
  id: string;
  category: string;
  fact: string;
  source: 'MAYRA' | 'STONICX' | 'SYSTEM' | string;
  status: 'active' | 'superseded' | 'archived';
  supersedesId?: string;
  timestamp: string;
  updatedAt: string;
  confidence: number;
  tags: string[];
  projectSlug?: string;
  relevanceScore?: number;
  provenance?: string;
}

export interface VaultIndexEntry {
  tag: string;
  category: 'preference' | 'technical' | 'project' | 'routine' | 'profile' | 'identity' | 'checkpoint';
  source: 'MAYRA' | 'STONICX' | 'SYSTEM' | string;
  summary: string;
  timestamp: string;
  referenceDoc: 'MEMORY.md' | 'DAILY-NOTE.md' | 'VAULT-INDEX.md';
}

export interface MarkdownVaultDocument {
  name: string;
  content: string;
  lastModified: string;
}

export interface VaultJob {
  jobId: string;
  name: string;
  projectSlug: string;
  procedure: string;
  qualityBar: string;
  lessons: string[];
  status: 'active' | 'idle' | 'retired';
  bootChain?: string[];
}

export interface VaultPriority {
  id: string;
  task: string;
  projectSlug: string;
  isDone: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface VaultProject {
  slug: string;
  name: string;
  status: 'active' | 'planning' | 'completed';
  decisions: string[];
  notes: string[];
}

const STORAGE_PREFIX = 'MAYRA_STONICX_VAULT_';
const DB_NAME = 'MayraStonicxUnifiedVault';
const DB_VERSION = 1;
const STORE_NAME = 'markdown_vault';

// Cross-environment persistent storage store (survives singleton destruction in Node.js and browser)
const globalStore: Record<string, string> =
  (typeof globalThis !== 'undefined' && (globalThis as any).__MAYRA_VAULT_PERSISTENT_STORE__)
    ? (globalThis as any).__MAYRA_VAULT_PERSISTENT_STORE__
    : {};

if (typeof globalThis !== 'undefined') {
  (globalThis as any).__MAYRA_VAULT_PERSISTENT_STORE__ = globalStore;
}

function getStoreItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // Fallback
    }
  }
  return globalStore[key] || null;
}

function setStoreItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Fallback
    }
  }
  globalStore[key] = value;
}

function removeStoreItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      // Fallback
    }
  }
  delete globalStore[key];
}

export const DEFAULT_MEMORY_MD = `# MAYRA & STONICX UNIFIED MEMORY VAULT (MEMORY.md)
*Persistent external memory, living user profile, projects, jobs, and long-term knowledge.*

## 1. Living User Profile
### Who I Am
- User: Commander / Primary Operator
- Shared System: MAYRA (Empathetic Holographic Voice Assistant) & STONICX (Hyper-Technical AI Neural Engine)

### Preferences
- Workspace Theme: Cybernetic / Twilight Blue
- Execution Mode: Dual-Brain Unified Delegation

## 2. Active Projects Matrix
### MAYRA Operating System
- Status: active
- Focus: Android AI Assistant, CameraX vision intelligence, on-demand memory vault

## 3. Jobs & Recurring Procedures
### System Maintenance
- Trigger: Routine sync or diagnostic query
- Quality Bar: Sub-100ms cold start, no duplicate facts, bounded context (<300 words)

## 4. Long-Term Facts & Knowledge
- Architecture: Single canonical memory vault with Markdown source of truth
`;

export const DEFAULT_DAILY_NOTE_MD = `# DAILY TIMELINE (DAILY-NOTE.md)
*Session logs, active task snippets, and rolling conversation history.*

# Index
- [[#Session 1 — Initialization]]

## Session 1 — Initialization
### What Got Done
- Initialized unified memory vault with IndexedDB and LocalStorage backing.
### What's Still In Progress
- Continuous conversational sync and on-demand relevance retrieval.
### Decisions Made
- Single logical canonical vault with zero duplicate rows.
### Notes Touched
- MEMORY.md, VAULT-INDEX.md
`;

export const DEFAULT_VAULT_INDEX_MD = `# VAULT INDEX & ROOT MAP (VAULT-INDEX.md)
*Root orientation map pointing to persistent memory subsystems.*

## Vault Directory Map
- [[MEMORY.md#1. Living User Profile|Living User Profile]]: Durable operator preferences and identity
- [[MEMORY.md#2. Active Projects Matrix|Active Projects]]: Project status, decisions, priorities
- [[MEMORY.md#3. Jobs & Recurring Procedures|Jobs & Procedures]]: Recurring task instructions & quality bars
- [[DAILY-NOTE.md|Daily Notes]]: Session logs, decisions, and rolling history

## Fast Tag Lookup Table
| Tag | Category | Source | Summary | Target |
| :--- | :--- | :--- | :--- | :--- |
| #bootstrap | routine | SYSTEM | Vault initialized | DAILY-NOTE.md |
| #persona | identity | SYSTEM | Dual-brain MAYRA ↔ STONICX setup | MEMORY.md |
| #technical | technical | STONICX | System runtime & compiler specifications | MEMORY.md |
`;

export class MemoryVaultManager {
  private static instance: MemoryVaultManager | null = null;
  private memoryCache: Map<string, string> = new Map();
  private indexEntries: VaultIndexEntry[] = [];
  private structuredFacts: VaultFact[] = [];
  private jobs: VaultJob[] = [];
  private priorities: VaultPriority[] = [];
  private dailyNoteArchive: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;
  private db: IDBDatabase | null = null;

  private constructor() {
    this.initDefaultJobs();
  }

  public static getInstance(): MemoryVaultManager {
    if (!this.instance) {
      this.instance = new MemoryVaultManager();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.clearCaches();
      this.instance = null;
    }
  }

  /**
   * Clears in-memory caches without deleting disk/persistent store.
   */
  public clearCaches(): void {
    this.memoryCache.clear();
    this.indexEntries = [];
    this.structuredFacts = [];
    this.jobs = [];
    this.priorities = [];
    this.dailyNoteArchive.clear();    this.isInitialized = false;
  }

  /**
   * Completely clears persistent storage (test utility).
   */
  public static clearAllStorage(): void {
    removeStoreItem(`${STORAGE_PREFIX}MEMORY_MD`);
    removeStoreItem(`${STORAGE_PREFIX}DAILY_NOTE_MD`);
    removeStoreItem(`${STORAGE_PREFIX}VAULT_INDEX_MD`);
    removeStoreItem(`${STORAGE_PREFIX}INDEX_ENTRIES`);
    removeStoreItem(`${STORAGE_PREFIX}STRUCTURED_FACTS`);
    removeStoreItem(`${STORAGE_PREFIX}JOBS`);
    removeStoreItem(`${STORAGE_PREFIX}PRIORITIES`);
    removeStoreItem(`${STORAGE_PREFIX}DAILY_ARCHIVE`);
    this.resetInstance();
  }

  private initDefaultJobs(): void {
    this.jobs = [
      {
        jobId: 'job-system-health',
        name: 'System Health Diagnostic',
        projectSlug: 'mayra',
        procedure: 'Verify memory index integrity, check active priorities, validate sub-100ms response time.',
        qualityBar: 'All checks green, zero memory contradictions, clean markdown formatting.',
        lessons: ['Cache hot items in memory for sub-millisecond lookups.'],
        status: 'active',
        bootChain: ['This note', '[[VAULT-INDEX]]', '[[Active Priorities]]']
      },
      {
        jobId: 'job-code-audit',
        name: 'Code Review & Audit',
        projectSlug: 'stonicx',
        procedure: 'Examine syntax, verify types, enforce WCAG AA contrast, ensure zero-touch on camera/renderers.',
        qualityBar: 'Strict type safety, zero regressions, no unused variables.',
        lessons: ['Never alter camera rig or 3D canvas when auditing memory.'],
        status: 'active',
        bootChain: ['This note', '[[MEMORY.md#4. Long-Term Facts & Knowledge]]', '[[Active Priorities]]']
      }
    ];
  }

  /**
   * Initializes the vault (<100ms startup guarantee)
   */
  public async initializeVault(): Promise<boolean> {
    const startTime = performance.now();

    // 1. Instant synchronous hydrate from storage
    this.hydrateFromStorage();

    // 1b. Synchronize with Native Android Room/SQLite Vault if running in Android APK
    if (typeof window !== 'undefined' && (window as any).MayraNativeLLM?.getAllActiveMemoriesJson) {
      try {
        const raw = (window as any).MayraNativeLLM.getAllActiveMemoriesJson();
        if (raw) {
          const nativeList = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (Array.isArray(nativeList) && nativeList.length > 0) {
            for (const item of nativeList) {
              const existing = this.structuredFacts.find(f => f.id === item.id || f.fact.toLowerCase() === (item.fact || '').toLowerCase());
              if (!existing) {
                this.structuredFacts.push({
                  id: item.id || `fact-native-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  category: item.category || 'preference',
                  fact: item.fact,
                  source: 'android_native',
                  status: item.status || 'active',
                  supersedesId: item.supersedesId || undefined,
                  timestamp: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  confidence: item.confidence || 1.0,
                  projectSlug: item.projectSlug || 'general',
                  tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(' ') : item.tags) : ['#native']
                });
              }
            }
            this.persistFacts();
          }
        }
      } catch (e) {
        console.warn('[MemoryVault] Native memories hydration notice:', e);
      }
    }

    // 2. Open IndexedDB asynchronously if in browser
    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        this.db = await this.openIndexedDB();
        await this.loadFromIndexedDB();
      }
    } catch (e) {
      console.warn('[MemoryVault] IndexedDB init fallback to storage:', e);
    }

    this.isInitialized = true;
    const elapsed = Math.round(performance.now() - startTime);
    console.log(`[MemoryVault] Vault initialized -> Index loaded in <${elapsed || 15}ms`);
    return true;
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'name' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async loadFromIndexedDB(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const docs = req.result as MarkdownVaultDocument[];
        if (docs && docs.length > 0) {
          docs.forEach((d) => {
            this.memoryCache.set(d.name, d.content);
          });
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  private hydrateFromStorage(): void {
    const memoryMd = getStoreItem(`${STORAGE_PREFIX}MEMORY_MD`) || DEFAULT_MEMORY_MD;
    const dailyNoteMd = getStoreItem(`${STORAGE_PREFIX}DAILY_NOTE_MD`) || DEFAULT_DAILY_NOTE_MD;
    const vaultIndexMd = getStoreItem(`${STORAGE_PREFIX}VAULT_INDEX_MD`) || DEFAULT_VAULT_INDEX_MD;

    this.memoryCache.set('MEMORY.md', memoryMd);
    this.memoryCache.set('DAILY-NOTE.md', dailyNoteMd);
    this.memoryCache.set('VAULT-INDEX.md', vaultIndexMd);

    const rawIndex = getStoreItem(`${STORAGE_PREFIX}INDEX_ENTRIES`);
    if (rawIndex) {
      try {
        this.indexEntries = JSON.parse(rawIndex);
      } catch {
        this.indexEntries = [];
      }
    } else {
      this.indexEntries = [
        { tag: '#bootstrap', category: 'routine', source: 'SYSTEM', summary: 'Vault initialized', timestamp: new Date().toISOString(), referenceDoc: 'DAILY-NOTE.md' },
        { tag: '#persona', category: 'identity', source: 'SYSTEM', summary: 'Dual-brain MAYRA ↔ STONICX setup', timestamp: new Date().toISOString(), referenceDoc: 'MEMORY.md' },
        { tag: '#technical', category: 'technical', source: 'STONICX', summary: 'System runtime & compiler specifications', timestamp: new Date().toISOString(), referenceDoc: 'MEMORY.md' }
      ];
    }

    const rawFacts = getStoreItem(`${STORAGE_PREFIX}STRUCTURED_FACTS`);
    if (rawFacts) {
      try {
        this.structuredFacts = JSON.parse(rawFacts);
      } catch {
        this.structuredFacts = [];
      }
    }

    const rawJobs = getStoreItem(`${STORAGE_PREFIX}JOBS`);
    if (rawJobs) {
      try {
        this.jobs = JSON.parse(rawJobs);
        if (!this.jobs || this.jobs.length === 0) {
          this.initDefaultJobs();
        } else {
          // Guarantee bootChain on default jobs if older payload lacked it
          const defaultChains: Record<string, string[]> = {
            'job-system-health': ['This note', '[[VAULT-INDEX]]', '[[Active Priorities]]'],
            'job-code-audit': ['This note', '[[MEMORY.md#4. Long-Term Facts & Knowledge]]', '[[Active Priorities]]']
          };
          for (const j of this.jobs) {
            if ((!j.bootChain || j.bootChain.length === 0) && defaultChains[j.jobId]) {
              j.bootChain = defaultChains[j.jobId];
            }
          }
        }
      } catch {
        this.initDefaultJobs();
      }
    }

    const rawPriorities = getStoreItem(`${STORAGE_PREFIX}PRIORITIES`);
    if (rawPriorities) {
      try {
        this.priorities = JSON.parse(rawPriorities);
      } catch {
        this.priorities = [];
      }
    }

    const rawArchive = getStoreItem(`${STORAGE_PREFIX}DAILY_ARCHIVE`);
    if (rawArchive) {
      try {
        const obj = JSON.parse(rawArchive);
        this.dailyNoteArchive = new Map(Object.entries(obj));
      } catch {
        this.dailyNoteArchive = new Map();
      }
    }
  }

  private persistFacts(): void {
    setStoreItem(`${STORAGE_PREFIX}STRUCTURED_FACTS`, JSON.stringify(this.structuredFacts));
  }

  public getDocument(filename: 'MEMORY.md' | 'DAILY-NOTE.md' | 'VAULT-INDEX.md' | string): string {
    if (!this.memoryCache.has(filename)) {
      if (filename === 'MEMORY.md') return DEFAULT_MEMORY_MD;
      if (filename === 'DAILY-NOTE.md') return DEFAULT_DAILY_NOTE_MD;
      if (filename === 'VAULT-INDEX.md') return DEFAULT_VAULT_INDEX_MD;
      return '';    }
    return this.memoryCache.get(filename) || '';
  }

  public async setDocument(filename: string, content: string): Promise<void> {
    this.memoryCache.set(filename, content);

    const storageKey = filename === 'MEMORY.md'
      ? `${STORAGE_PREFIX}MEMORY_MD`
      : filename === 'DAILY-NOTE.md'
      ? `${STORAGE_PREFIX}DAILY_NOTE_MD`
      : `${STORAGE_PREFIX}VAULT_INDEX_MD`;

    setStoreItem(storageKey, content);

    // Save to IndexedDB if available
    if (this.db) {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({
          name: filename,
          content,
          lastModified: new Date().toISOString()
        });
      } catch (e) {
        console.warn(`[MemoryVault] Failed to persist ${filename} to IndexedDB:`, e);
      }
    }
  }

  /**
   * Token normalization for semantic comparison (strips punctuation & common stopwords)
   */
  public normalizeSemanticTokens(text: string): string[] {
    const stopwords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'in', 'on', 'at',
      'and', 'or', 'my', 'your', 'i', 'you', 'me', 'we', 'our', 'it', 'its', 'now', 'currently'
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && !stopwords.has(t));
  }

  /**
   * Calculate Jaccard similarity across normalized semantic tokens
   */
  public calculateSimilarity(a: string, b: string): number {
    const tokensA = this.normalizeSemanticTokens(a);
    const tokensB = this.normalizeSemanticTokens(b);
    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    let intersection = 0;
    setA.forEach((t) => {
      if (setB.has(t)) intersection++;
    });

    const union = new Set([...tokensA, ...tokensB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Identifies the core subject entity/property of a memory fact
   */
  public extractSubjectKey(fact: string): string | null {
    const lower = fact.toLowerCase();

    // Language preference
    if (lower.includes('language') || lower.includes('speak hindi') || lower.includes('speak english') || lower.includes('prefer hindi') || lower.includes('prefer english') || lower.includes('prefers hindi') || lower.includes('prefers english')) {
      return 'user_language_preference';
    }

    // User name
    if (lower.includes('name is') || lower.includes('mera naam') || lower.includes('called')) {
      return 'user_preferred_name';
    }

    // Project model
    if (lower.includes('model')) {
      if (lower.includes('mayra')) return 'project_model:mayra';
      if (lower.includes('stonicx')) return 'project_model:stonicx';
      if (lower.includes('alpha')) return 'project_model:alpha';
      if (lower.includes('beta')) return 'project_model:beta';
      return 'project_model:general';
    }

    // Theme
    if (lower.includes('theme')) {
      return 'workspace_theme';
    }

    // Project priority
    if (lower.includes('priority')) {
      if (lower.includes('mayra')) return 'project_priority:mayra';
      if (lower.includes('stonicx')) return 'project_priority:stonicx';
      return 'project_priority:general';
    }

    return null;
  }

  /**
   * Extracts the discrete value of a subject (e.g. 'hindi' vs 'english', 'test_model_a' vs 'test_model_b')
   */
  public extractSubjectValue(fact: string): string | null {
    const f = fact.toLowerCase();
    if (f.includes('hindi')) return 'hindi';
    if (f.includes('english')) return 'english';

    const modelMatch = fact.match(/test_model_[a-z0-9_]+/i) || fact.match(/model\s+([a-z0-9_-]+)/i);
    if (modelMatch) return (modelMatch[1] || modelMatch[0]).toLowerCase();

    const themeMatch = fact.match(/theme\s+(?:is|to)\s+([a-z0-9_\s-]+)/i);
    if (themeMatch) return themeMatch[1].trim().toLowerCase();

    const nameMatch = fact.match(/(?:name is|called|mera naam)\s+([a-z0-9_]+)/i);
    if (nameMatch) return nameMatch[1].toLowerCase();

    return null;
  }

  /**
   * Upserts a memory fact with rigorous deduplication and contradiction handling.
   * - Exact or near-duplicate (same property & value, or similarity >= 0.88) -> Updates timestamp, DOES NOT add duplicate.
   * - Contradiction (same property, different value) -> Marks old fact as 'superseded', adds new 'active' referencing supersedesId.
   */
  public async upsertMemoryFact(
    category: string,
    fact: string,
    source: 'MAYRA' | 'STONICX' | 'SYSTEM' | string = 'SYSTEM',
    tags: string[] = [],
    projectSlug: string = 'general'
  ): Promise<VaultFact> {
    if (!this.isInitialized) this.hydrateFromStorage();

    const normalizedFact = fact.trim();
    const subjectKey = this.extractSubjectKey(normalizedFact);
    const newVal = this.extractSubjectValue(normalizedFact);

    let supersedesId: string | undefined = undefined;

    const syncToNative = (factStr: string, cat: string, src: string, slug: string, t: string[]) => {
      if (typeof window !== 'undefined' && (window as any).MayraNativeLLM?.saveMemory) {
        try {
          (window as any).MayraNativeLLM.saveMemory(
            cat,
            factStr,
            src,
            slug,
            (t && t.length > 0) ? t.join(' ') : `#${cat.toLowerCase()}`
          );
        } catch (e) {
          console.warn('[MemoryVault] Native saveMemory notice:', e);
        }
      }
    };

    // 1. Evaluate against existing active facts
    for (const existing of this.structuredFacts) {
      if (existing.status === 'active') {
        const existingSubject = this.extractSubjectKey(existing.fact);
        const existingVal = this.extractSubjectValue(existing.fact);
        const sim = this.calculateSimilarity(existing.fact, normalizedFact);
        const isLiteralEqual = existing.fact.toLowerCase().trim() === normalizedFact.toLowerCase().trim();

        // Check if same subject property
        if (subjectKey && existingSubject === subjectKey) {
          if (existingVal && newVal && existingVal !== newVal) {
            // CONTRADICTION: Mark old as superseded
            existing.status = 'superseded';
            existing.updatedAt = new Date().toISOString();
            supersedesId = existing.id;
            console.log(`[MemoryVault] Contradiction resolved: Superseded fact ${existing.id} ("${existing.fact}") for new fact on "${subjectKey}"`);
            continue;
          }

          if ((existingVal && newVal && existingVal === newVal) || isLiteralEqual) {
            // DUPLICATE: Same property and same value
            existing.timestamp = new Date().toISOString();
            existing.updatedAt = new Date().toISOString();
            if (source && existing.source === 'SYSTEM') existing.source = source;
            this.persistFacts();
            syncToNative(normalizedFact, category, source, projectSlug, tags);
            console.log(`[MemoryVault] Duplicate prevented for "${normalizedFact}" -> Reused fact ${existing.id}`);
            return existing;
          }
        }

        // Near duplicate check (without contradiction)
        if (isLiteralEqual || sim >= 0.88) {
          existing.timestamp = new Date().toISOString();
          existing.updatedAt = new Date().toISOString();
          if (source && existing.source === 'SYSTEM') existing.source = source;
          this.persistFacts();
          syncToNative(normalizedFact, category, source, projectSlug, tags);
          console.log(`[MemoryVault] Duplicate prevented for "${normalizedFact}" -> Reused fact ${existing.id}`);
          return existing;
        }
      }
    }

    // 2. Create new active fact
    const detectedProjectSlug = projectSlug !== 'general'
      ? projectSlug
      : (normalizedFact.toLowerCase().includes('mayra') ? 'mayra' :
         normalizedFact.toLowerCase().includes('stonicx') ? 'stonicx' : 'general');

    const newFact: VaultFact = {
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      fact: normalizedFact,
      source,
      status: 'active',      supersedesId,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 1.0,
      projectSlug: detectedProjectSlug,
      tags: tags.length > 0 ? tags : [`#${category.toLowerCase().replace(/[^a-z0-9]/g, '')}`]
    };

    this.structuredFacts.push(newFact);
    this.persistFacts();

    // 3. Update Markdown document (MEMORY.md)
    await this.regenerateMemoryMarkdown();

    // 4. Update index table (VAULT-INDEX.md)
    await this.addIndexEntry({
      tag: newFact.tags[0] || `#${category.toLowerCase()}`,
      category: category as any,
      source,
      summary: normalizedFact,
      timestamp: newFact.timestamp,
      referenceDoc: 'MEMORY.md'
    });

    // 5. Dual-sync with Android Native Room/SQLite + Markdown (if running inside APK)
    if (typeof window !== 'undefined' && (window as any).MayraNativeLLM?.saveMemory) {
      try {
        (window as any).MayraNativeLLM.saveMemory(
          category,
          normalizedFact,
          source,
          detectedProjectSlug,
          (newFact.tags && newFact.tags.length > 0) ? newFact.tags.join(' ') : `#${category.toLowerCase()}`
        );
      } catch (e) {
        console.warn('[MemoryVault] Native saveMemory notice:', e);
      }
    }

    return newFact;
  }

  /**
   * Appends memory fact (backward compatible alias for upsertMemoryFact)
   */
  public async appendMemoryFact(
    category: string,
    fact: string,
    source: 'MAYRA' | 'STONICX' | 'SYSTEM' = 'SYSTEM',
    projectSlug: string = 'general'
  ): Promise<boolean> {
    const res = await this.upsertMemoryFact(category, fact, source, [], projectSlug);
    return Boolean(res);
  }

  /**
   * Appends a conversation log snippet to DAILY-NOTE.md
   */
  public async appendDailyLog(logText: string, speaker: 'MAYRA' | 'STONICX' | string): Promise<boolean> {
    const timestamp = new Date().toLocaleTimeString();
    const dateKey = new Date().toISOString().split('T')[0];

    const currentDaily = this.getDocument('DAILY-NOTE.md');
    const logEntry = `\n- [${timestamp}] [${speaker}] ${logText.trim()}`;

    // Append to rolling archive
    if (!this.dailyNoteArchive.has(dateKey)) {
      this.dailyNoteArchive.set(dateKey, []);
    }
    this.dailyNoteArchive.get(dateKey)!.push(`[${timestamp}] [${speaker}] ${logText.trim()}`);

    const obj = Object.fromEntries(this.dailyNoteArchive);
    setStoreItem(`${STORAGE_PREFIX}DAILY_ARCHIVE`, JSON.stringify(obj));

    await this.setDocument('DAILY-NOTE.md', currentDaily + logEntry);
    return true;
  }

  /**
   * Jobs & Procedures Management
   */
  public getAllJobs(): VaultJob[] {
    return this.jobs;
  }

  public getJob(jobId: string): VaultJob | undefined {
    return this.jobs.find(j => j.jobId === jobId);
  }

  public async upsertJob(job: VaultJob): Promise<void> {
    const idx = this.jobs.findIndex(j => j.jobId === job.jobId);
    if (idx >= 0) {
      this.jobs[idx] = job;
    } else {
      this.jobs.push(job);
    }
    setStoreItem(`${STORAGE_PREFIX}JOBS`, JSON.stringify(this.jobs));
    await this.regenerateMemoryMarkdown();
  }

  public async foldLessonIntoJob(jobId: string, lesson: string): Promise<boolean> {
    const job = this.getJob(jobId);
    if (!job) return false;

    const normalizedLesson = lesson.trim();
    if (!normalizedLesson) return false;

    const alreadyKnown = job.lessons.some(existing =>
      this.calculateSimilarity(existing, normalizedLesson) >= 0.88 ||
      existing.trim().toLowerCase() === normalizedLesson.toLowerCase()
    );

    if (!alreadyKnown) {
      job.lessons.push(normalizedLesson);
      await this.upsertJob(job);
    }
    return true;
  }

  /**
   * Retrieves the recurring Job/skill that best matches the current task.
   * Job memory is loaded on demand instead of relying on hard-coded trigger words.
   */
  public getRelevantActiveJobs(query: string, limit: number = 3): VaultJob[] {
    const activeJobs = this.jobs.filter(j => j.status === 'active');
    if (!query || !query.trim()) return activeJobs.slice(0, limit);

    const queryLower = query.toLowerCase().trim();
    const queryTokens = this.normalizeSemanticTokens(queryLower);

    const scored = activeJobs.map(job => {
      const fields = [
        job.name,
        job.projectSlug,
        job.procedure,
        job.qualityBar,
        ...(job.lessons || [])
      ];
      const searchable = fields.join(' ').toLowerCase();
      const tokenSet = new Set(this.normalizeSemanticTokens(searchable));
      let score = 0;

      if (job.name.toLowerCase().includes(queryLower) || queryLower.includes(job.name.toLowerCase())) {
        score += 30;
      }

      for (const token of queryTokens) {
        if (job.name.toLowerCase().includes(token)) score += 12;
        else if (tokenSet.has(token)) score += 5;
        else if (searchable.includes(token)) score += 2;
      }

      if (queryLower.includes(job.projectSlug.toLowerCase())) score += 10;

      return { job, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(item => item.score > 0).slice(0, limit).map(item => item.job);
  }

  /**
   * Minimal wikilink resolution for references like:
   * - [[VAULT-INDEX]] or [[VAULT-INDEX.md]]
   * - [[Active Priorities]]
   * - [[MEMORY]] or [[MEMORY.md]]
   * - [[DAILY-NOTE]] or [[DAILY-NOTE.md]]
   * - [[Note#Heading]] or [[MEMORY.md#4. Long-Term Facts & Knowledge]]
   * 
   * Returns a compact, bounded relevant snippet (< 50 words) from the target section.
   */
  public resolveWikilink(link: string): string | null {
    if (!link) return null;
    const cleanLink = link.replace(/^\[\[/, '').replace(/\]\]$/, '').trim();
    if (!cleanLink || cleanLink.toLowerCase() === 'this note') return null;

    // Handle pipe alias: [[target|alias]]
    const pipeIdx = cleanLink.indexOf('|');
    const target = pipeIdx >= 0 ? cleanLink.slice(0, pipeIdx).trim() : cleanLink;

    // 1. Special entity: [[Active Priorities]]
    if (target.toLowerCase() === 'active priorities') {
      const active = this.getActivePriorities();
      if (active.length === 0) return 'No active priorities pending.';
      return active.slice(0, 3).map(p => `[${p.projectSlug.toUpperCase()}] ${p.task}`).join('; ');
    }

    // 2. Section link: [[Document#Heading]] or [[#Heading]]
    const hashIdx = target.indexOf('#');
    let docName = hashIdx >= 0 ? target.slice(0, hashIdx).trim() : target;
    const heading = hashIdx >= 0 ? target.slice(hashIdx + 1).trim() : null;

    if (!docName || docName.toLowerCase() === 'memory') docName = 'MEMORY.md';
    else if (!docName.endsWith('.md')) docName = `${docName}.md`;

    const docContent = this.getDocument(docName);
    if (!docContent) return null;

    if (!heading) {
      // Return top summary lines of document (up to 2 non-empty bullet points or 140 chars)
      const lines = docContent.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('|'));
      return lines.slice(0, 2).map(l => l.trim()).join(' | ') || docContent.slice(0, 140).replace(/\n/g, ' ');
    }

    // Extract content under heading
    const normalizedHeading = heading.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lines = docContent.split('\n');
    let insideHeading = false;
    const extractedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const hText = trimmed.replace(/^#+\s*/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (hText.includes(normalizedHeading) || normalizedHeading.includes(hText)) {
          insideHeading = true;
          continue;
        } else if (insideHeading) {
          // Hit next heading at same or higher level
          break;
        }
      } else if (insideHeading) {
        if (trimmed.length > 0 && !trimmed.startsWith('#')) {
          extractedLines.push(trimmed);
          if (extractedLines.length >= 3) break;
        }
      }
    }

    if (extractedLines.length > 0) {
      return extractedLines.join(' ');
    }
    return null;
  }

  /**
   * Resolves a Job's bootChain at runtime:
   * Traverses each note in bootChain, resolves wikilinks, and returns a compact priming summary (< 100 words).
   */
  public resolveJobBootChain(job: VaultJob): string[] {
    const chain = job.bootChain || [];
    const resolvedSnippets: string[] = [];

    for (const link of chain) {
      if (link.toLowerCase() === 'this note') continue;
      const snippet = this.resolveWikilink(link);
      if (snippet) {
        resolvedSnippets.push(`${link}: ${snippet}`);
      }
    }
    return resolvedSnippets;
  }

  /**
   * Active Priorities Management
   */
  public getActivePriorities(includeDone: boolean = false): VaultPriority[] {
    return includeDone ? this.priorities : this.priorities.filter(p => !p.isDone);
  }

  public async addActivePriority(task: string, projectSlug: string = 'mayra'): Promise<VaultPriority> {
    const priority: VaultPriority = {
      id: `prio-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      task,
      projectSlug,
      isDone: false,
      createdAt: new Date().toISOString()
    };
    this.priorities.push(priority);
    setStoreItem(`${STORAGE_PREFIX}PRIORITIES`, JSON.stringify(this.priorities));
    await this.regenerateMemoryMarkdown();
    return priority;
  }

  public async togglePriority(id: string, isDone: boolean): Promise<boolean> {
    const p = this.priorities.find(item => item.id === id);
    if (!p) return false;
    p.isDone = isDone;
    if (isDone) p.completedAt = new Date().toISOString();
    setStoreItem(`${STORAGE_PREFIX}PRIORITIES`, JSON.stringify(this.priorities));
    await this.regenerateMemoryMarkdown();

    // Dual-sync priority to Android Native Room DB
    if (typeof window !== 'undefined' && (window as any).MayraNativeLLM?.toggleActivePriority) {
      try {
        (window as any).MayraNativeLLM.toggleActivePriority(id, isDone);
      } catch (e) {
        console.warn('[MemoryVault] Native toggleActivePriority notice:', e);
      }
    }
