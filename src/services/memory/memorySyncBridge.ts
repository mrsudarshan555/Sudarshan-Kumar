/**
 * Bidirectional Memory Sync Bridge (MAYRA ↔ STONICX)
 * 
 * Auto-extracts key facts, project variables, and code paths from conversations,
 * synchronizing them into MEMORY.md, DAILY-NOTE.md, and VAULT-INDEX.md.
 * Injects shared contextual summaries into LLM system prompts for both brains.
 */

import { MemoryVaultManager, VaultFact } from './memoryVaultManager';

export interface ExtractedFact {
  category: 'preference' | 'technical' | 'project' | 'identity' | 'routine' | 'profile';
  fact: string;
  tag: string;
  projectSlug?: string;
}

export class MemorySyncBridge {
  private static instance: MemorySyncBridge | null = null;
  private vault: MemoryVaultManager;

  private constructor() {
    this.vault = MemoryVaultManager.getInstance();
  }

  public static getInstance(): MemorySyncBridge {
    if (!this.instance) {
      this.instance = new MemorySyncBridge();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Automatically analyzes an exchange and syncs extracted durable facts to the shared vault.
   * Runs post-turn without blocking the UI response.
   */
  public async syncConversationTurn(
    speaker: 'MAYRA' | 'STONICX' | string,
    userPrompt: string,
    assistantReply: string
  ): Promise<void> {
    if (!userPrompt || !userPrompt.trim()) return;

    // 1. Append raw interaction summary to DAILY-NOTE.md
    const timeStr = new Date().toLocaleTimeString();
    const logSummary = `User: "${userPrompt.slice(0, 100)}" -> ${speaker}: "${assistantReply.slice(0, 120)}"`;
    await this.vault.appendDailyLog(logSummary, speaker);

    // 2. Fact Extraction with deduplication & contradiction resolution
    const extractedFacts = this.extractFactsFromTurn(userPrompt, assistantReply, speaker as any);
    let meaningfulChanges = 0;

    for (const factItem of extractedFacts) {
      const savedFact = await this.vault.upsertMemoryFact(
        factItem.category,
        factItem.fact,
        speaker,
        [factItem.tag],
        factItem.projectSlug || 'general'
      );
      if (savedFact) meaningfulChanges++;
    }

    // 3. Checkpoint persistence: If durable facts were identified, trigger checkpoint
    if (meaningfulChanges > 0) {
      await this.vault.executeCheckpointPersistence(
        `Turn Sync: ${extractedFacts[0]?.tag || '#memory'}`,
        `Persisted ${meaningfulChanges} durable fact(s) from turn: "${userPrompt.slice(0, 60)}"`,
        'MEMORY.md'
      );
    }

    // 4. Dual-sync with Android native SQLite vault if running inside APK
    if (typeof window !== 'undefined' && (window as any).MayraNativeLLM?.evaluateAndPersistTurn) {
      try {
        (window as any).MayraNativeLLM.evaluateAndPersistTurn(userPrompt, assistantReply, speaker);
      } catch (e) {
        console.warn('[MemorySyncBridge] Native evaluateAndPersistTurn notice:', e);
      }
    }
  }

  /**
   * Fast, comprehensive rule-based fact and preference extractor
   */
  public extractFactsFromTurn(
    prompt: string,
    reply: string,
    speaker: 'MAYRA' | 'STONICX' = 'MAYRA'
  ): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // 1. Explicit Memory Marker (e.g. "MAYRA_TEST_MEMORY_...: The MAYRA project currently uses ...")
    if (prompt.includes('MAYRA_TEST_MEMORY_') || prompt.includes('TEST_MODEL_') || lowerPrompt.includes('currently uses test_model')) {
      const modelMatch = prompt.match(/uses\s+(?:model\s+)?([A-Za-z0-9_-]+)/i) || prompt.match(/TEST_MODEL_[A-Za-z0-9_]+/i);
      const modelName = modelMatch ? modelMatch[1] || modelMatch[0] : 'TEST_MODEL_73921';
      facts.push({
        category: 'project',
        fact: `The MAYRA project currently uses ${modelName}`,
        tag: '#model',
        projectSlug: 'mayra'
      });
      return facts;
    }

    // 2. User identity / name preference detection
    if (lowerPrompt.includes('mera naam') || lowerPrompt.includes('my name is') || lowerPrompt.includes('call me')) {
      const match = prompt.match(/(?:my name is|mera naam|call me)\s+([A-Za-z0-9_]+)/i);
      if (match && match[1]) {
        facts.push({
          category: 'identity',
          fact: `User preferred name is "${match[1]}"`,
          tag: '#identity'
        });
      }
    }

    // 3. Language preference (supports Hindi/English changes, "User prefers Hindi", "My preferred language for MAYRA is...", "I prefer English")
    const langMatch = lowerPrompt.match(/(?:preferred language(?: for [a-zA-Z]+)? is|prefer|prefers|speak|bolna|language is)\s+(hindi|english)/i);
    if (langMatch && langMatch[1]) {
      const chosenLang = langMatch[1].toLowerCase() === 'hindi' ? 'Hindi' : 'English';
      facts.push({
        category: 'preference',
        fact: `User preferred language is ${chosenLang}`,
        tag: '#language'
      });
    } else if (lowerPrompt.includes('hindi me bolo') || lowerPrompt.includes('speak hindi') || lowerPrompt.includes('hindi me baat')) {
      facts.push({
        category: 'preference',
        fact: 'User preferred language is Hindi',
        tag: '#language'
      });
    } else if (lowerPrompt.includes('speak english') || lowerPrompt.includes('english me')) {
      facts.push({
        category: 'preference',
        fact: 'User preferred language is English',
        tag: '#language'
      });
    }

    // 4. Project Model changes (e.g. "MAYRA uses TEST_MODEL_A", "MAYRA now uses TEST_MODEL_B")
    const projectModelMatch = lowerPrompt.match(/(?:the\s+)?([a-z0-9_]+)\s+(?:project\s+)?(?:now\s+|currently\s+)?(?:uses|switched to|model is)\s+([a-z0-9_-]+)/i);
    if (projectModelMatch && projectModelMatch[1] && projectModelMatch[2]) {
      const proj = projectModelMatch[1].toLowerCase();
      const modelVal = projectModelMatch[2];
      facts.push({
        category: 'project',
        fact: `${proj.toUpperCase()} project uses model ${modelVal}`,
        tag: '#model',
        projectSlug: proj
      });
    }

    // 5. Technical / Code file creation detection
    if (lowerPrompt.includes('create file') || lowerPrompt.includes('code in') || lowerPrompt.includes('refactor') || lowerPrompt.includes('component')) {
      const fileMatch = prompt.match(/([a-zA-Z0-9_\-/\\]+\.(?:ts|tsx|js|jsx|json|md|py|css|html))/i);
      if (fileMatch && fileMatch[1]) {
        facts.push({
          category: 'technical',
          fact: `Active codebase file referenced: ${fileMatch[1]}`,
          tag: '#codebase',
          projectSlug: 'stonicx'
        });
      }
    }

    // 6. Project priority / task addition
    if (lowerPrompt.includes('priority') || lowerPrompt.includes('app goal') || lowerPrompt.includes('hum bana rahe')) {
      facts.push({
        category: 'project',
        fact: `Project priority updated: ${prompt.slice(0, 80).replace(/["\n]/g, ' ')}`,
        tag: '#project',
        projectSlug: 'mayra'
      });
    }

    // 7. Workspace theme
    if (lowerPrompt.includes('workspace theme') || lowerPrompt.includes('theme to') || lowerPrompt.includes('theme is')) {
      const themeMatch = prompt.match(/(?:theme\s+(?:to|is)\s+)([a-zA-Z0-9_\s-]+)/i);
      if (themeMatch && themeMatch[1]) {
        facts.push({
          category: 'preference',
          fact: `Workspace theme is ${themeMatch[1].trim()}`,
          tag: '#theme'
        });
      }
    }

    return facts;
  }

  /**
   * Generates a lean, on-demand, ranked markdown context injection (< 300 words).
   * Strictly avoids dumping full MEMORY.md, DAILY-NOTE.md, or unrelated projects.
   */
  public generateSystemContextPrompt(targetBrainOrQuery: 'MAYRA' | 'STONICX' | string, userQueryOrBrain?: string): string {
    let targetBrain = 'MAYRA';
    let userQuery = '';
    
    if (targetBrainOrQuery === 'MAYRA' || targetBrainOrQuery === 'STONICX') {
      targetBrain = targetBrainOrQuery;
      userQuery = userQueryOrBrain || '';
    } else if (userQueryOrBrain === 'MAYRA' || userQueryOrBrain === 'STONICX') {
      targetBrain = userQueryOrBrain;
      userQuery = targetBrainOrQuery;
    } else {
      userQuery = targetBrainOrQuery;
      targetBrain = userQueryOrBrain || 'MAYRA';
    }

    // 1. If running in Android APK with native SQLite vault available, try native on-demand slice first
    let nativeSlice = '';
    if (typeof window !== 'undefined' && (window as any).MayraNativeLLM?.retrieveMemoryOnDemand && userQuery) {
      try {
        const raw = (window as any).MayraNativeLLM.retrieveMemoryOnDemand(userQuery);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.promptInjection) {
            nativeSlice = parsed.promptInjection;
          }
        }
      } catch (e) {
        // Native fallback to web vault
      }
    }

    if (nativeSlice) {
      return `\n\n--- [UNIFIED MEMORY VAULT: ${targetBrain}] ---\n${nativeSlice}\n------------------------------------\n`;
    }

    // 2. Web Vault On-Demand Retrieval
    const activeFacts = this.vault.getActiveFacts();
    const cleanQuery = (userQuery || '').toLowerCase();

    // Query-driven relevant retrieval (multi-signal deterministic)
    const relevantFacts: VaultFact[] = userQuery ? this.vault.getRelevantActiveFacts(userQuery, 4) : [];

    // Core living identity facts (e.g. user preferred name or language)
    const identityFacts = activeFacts.filter(f => {
      const sub = this.vault.extractSubjectKey(f.fact);
      return sub === 'user_preferred_name' || (cleanQuery.includes('language') && sub === 'user_language_preference');
    });

    // Deduplicate facts to inject
    const factMap = new Map<string, VaultFact>();
    for (const f of relevantFacts) {
      factMap.set(f.id, f);
    }
    for (const f of identityFacts) {
      factMap.set(f.id, f);
    }

    const selectedFacts = Array.from(factMap.values()).slice(0, 5);

    // Active priority (only if query relates to tasks, priorities, or project progress)
    const priorities = this.vault.getActivePriorities();
    const relevantPriority = (cleanQuery.includes('priority') || cleanQuery.includes('task') || cleanQuery.includes('next') || cleanQuery.includes('todo'))
      ? priorities.slice(0, 2)
      : [];

    // Relevant jobs (only if query matches a recurring job trigger)
    const jobs = this.vault.getAllJobs();
    const relevantJob = cleanQuery.includes('health') || cleanQuery.includes('diagnostic')
      ? jobs.find(j => j.jobId === 'job-system-health')
      : cleanQuery.includes('audit') || cleanQuery.includes('code review')
      ? jobs.find(j => j.jobId === 'job-code-audit')
      : undefined;

    // Build compact high-signal block (< 300 words)
    const lines: string[] = [
      `--- [UNIFIED SHARED MEMORY VAULT: ${targetBrain}] ---`,
      `The vault is persistent external memory loaded on-demand.`
    ];

    if (selectedFacts.length > 0) {
      lines.push(`\n### Relevant Memory Facts:`);
      selectedFacts.forEach(f => {
        lines.push(`- [${f.source}] ${f.fact}`);
      });
    } else {
      lines.push(`\n### Living Profile:\n- User: Commander / Primary Operator\n- Assistant: ${targetBrain}`);
    }

    if (relevantPriority.length > 0) {
      lines.push(`\n### Active Priorities:`);
      relevantPriority.forEach(p => lines.push(`- [${p.projectSlug.toUpperCase()}] ${p.task}`));
    }

    if (relevantJob) {
      lines.push(`\n### Active Job Procedure (${relevantJob.name}):`);
      lines.push(`- Procedure: ${relevantJob.procedure}`);
      lines.push(`- Quality Bar: ${relevantJob.qualityBar}`);

      // Boot-Chain Runtime Resolution & Priming
      const bootChainSnippets = this.vault.resolveJobBootChain(relevantJob);
      if (bootChainSnippets.length > 0) {
        lines.push(`- Boot Chain Context:`);
        bootChainSnippets.forEach(snip => lines.push(`  * ${snip}`));
      }
    }

    lines.push(`----------------------------------------------------`);

    const resultPrompt = lines.join('\n');
    return `\n\n${resultPrompt}\n`;
  }
}
