/**
 * Cross-Brain Query Engine (Ported from ai-memory-vault-main)
 * 
 * Enables MAYRA & STONICX to perform sub-50ms semantic & keyword queries
 * across the shared Markdown Memory Vault (MEMORY.md, DAILY-NOTE.md, VAULT-INDEX.md).
 * 
 * Console Log:
 * `[MemoryBridge] Cross-brain query resolved -> Context injected to prompt`
 */

import { MemoryVaultManager, VaultFact, VaultIndexEntry } from './memoryVaultManager';

export interface QueryResult {
  found: boolean;
  matchedContent: string[];
  sourceDocs: string[];
  relevanceScore: number;
  extractedAnswer?: string;
  provenanceList?: string[];
  facts?: VaultFact[];
}

export class MemoryQueryEngine {
  private static instance: MemoryQueryEngine | null = null;
  private vault: MemoryVaultManager;

  private constructor() {
    this.vault = MemoryVaultManager.getInstance();
  }

  public static getInstance(): MemoryQueryEngine {
    if (!this.instance) {
      this.instance = new MemoryQueryEngine();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Queries the shared vault across all markdown documents using deterministic multi-signal scoring
   */
  public queryVault(query: string, askingBrain: 'MAYRA' | 'STONICX' = 'MAYRA'): QueryResult {
    const cleanQuery = query.toLowerCase().trim();
    const sourceDocs: string[] = [];
    const matchedContent: string[] = [];
    const provenanceList: string[] = [];

    // 1. Query structured facts with multi-signal scoring and project isolation
    const relevantFacts = this.vault.getRelevantActiveFacts(query, 5);
    let totalScore = 0;

    relevantFacts.forEach(f => {
      matchedContent.push(`[${f.category.toUpperCase()}] ${f.fact}`);
      if (!sourceDocs.includes('MEMORY.md')) sourceDocs.push('MEMORY.md');
      if (f.provenance) provenanceList.push(f.provenance);
      totalScore += (f.relevanceScore || 10);
    });

    // 2. Query index entries if needed
    const indexEntries = this.vault.getIndexEntries();
    const keywords = cleanQuery
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((k) => k.length > 2);

    indexEntries.forEach((entry) => {
      const entryText = `${entry.tag} ${entry.summary} ${entry.category} ${entry.source}`.toLowerCase();
      const hits = keywords.filter((kw) => entryText.includes(kw));
      if (hits.length > 0 && !matchedContent.some(m => m.includes(entry.summary))) {
        matchedContent.push(`[INDEX: ${entry.tag}] (${entry.source}) ${entry.summary}`);
        if (!sourceDocs.includes(entry.referenceDoc)) {
          sourceDocs.push(entry.referenceDoc);
        }
        totalScore += hits.length * 15;
      }
    });

    const isFound = matchedContent.length > 0;
    if (isFound) {
      console.log(`[MemoryBridge] Cross-brain query resolved -> Context injected to prompt (${askingBrain})`);
    }

    return {
      found: isFound,
      matchedContent: matchedContent.slice(0, 5),
      sourceDocs,
      relevanceScore: totalScore,
      extractedAnswer: matchedContent.length > 0 ? matchedContent.join('\n') : undefined,
      provenanceList,
      facts: relevantFacts
    };
  }

  /**
   * Helper to format query results as a compact context snippet for LLM prompts
   */
  public formatQueryResultForPrompt(result: QueryResult): string {
    if (!result.found || result.matchedContent.length === 0) {
      return '';
    }

    return `\n\n[RECALLED FROM SHARED VAULT]:\n${result.matchedContent.join('\n')}\n`;
  }
}
