/**
 * Dynamic Intent Classifier for MAYRA <-> STONICX Delegation
 * 
 * Analyzes user prompts to categorize requests into:
 * - COMPANION / GENERAL -> Handled by MAYRA (Conversational, daily updates, reminders, emotional check-ins, light Q&A)
 * - TECHNICAL / WORK -> Handled by STONICX (Code generation, debugging, terminal ops, architecture design, memory vault indexing, canvas blueprint edits)
 * - DIRECT_SWITCH -> Explicit voice/text commands to swap active brain
 */

export type PersonaTarget = 'MAYRA' | 'STONICX';
export type IntentTrack = 'COMPANION' | 'GENERAL' | 'TECHNICAL' | 'WORK' | 'DIRECT_SWITCH' | 'DELEGATED_TASK';
export type SwitchDirection = 'TO_STONICX' | 'TO_MAYRA';

export interface ClassificationResult {
  targetPersona: PersonaTarget;
  track: IntentTrack;
  confidence: number;
  matchedKeywords: string[];
  isDirectSwitch: boolean;
  isDelegatedTask?: boolean;
  delegatedAgent?: 'STONICX' | 'RESEARCH_AGENT' | 'CODING_AGENT' | 'SANDBOX_RUNNER' | 'SENTINEL_AGENT';
  switchDirection?: SwitchDirection;
  reason: string;
  suggestedPrompt?: string;
}

// 1. Explicit Direct Screen Swap Commands (User explicitly wants to switch views/screens)
export const STONICX_SCREEN_SWITCH_TRIGGERS: string[] = [
  'switch to stonicx screen',
  'open stonicx screen',
  'stonicx screen kholo',
  'switch screen to stonicx',
  'go to stonicx screen',
  'switch to stonicx mode',
  'stonicx mode kholo',
  'open stonicx workstation',
  'switch to stonicx workstation'
];

export const MAYRA_SCREEN_SWITCH_TRIGGERS: string[] = [
  'switch to mayra screen',
  'open mayra screen',
  'mayra screen kholo',
  'switch screen to mayra',
  'go to mayra screen',
  'switch to mayra mode',
  'mayra mode kholo',
  'back to mayra screen'
];

// 2. STONICX Delegation Triggers (Mayra stays on screen, but orchestrates and commands StonicX)
export const STONICX_DELEGATE_TRIGGERS: string[] = [
  'stonicx se karwao',
  'stonicx se pucho',
  'stonicx se puchho',
  'stonicx se code likhwao',
  'stonicx se research karwao',
  'stonicx se solve karwao',
  'stonicx se analyze karwao',
  'stonicx ko bolo',
  'stonicx ko bol kar',
  'stonicx ko bol',
  'stonicx se kaho',
  'stonicx ko kaho',
  'stonicx se karwana',
  'stonicx se karwa do',
  'stonicx se pooch kar',
  'stonicx se web check',
  'stonicx se check karwao',
  'stonicx se check karo',
  'stonicx se internet check',
  'stonicx se search karwao',
  'stonicx se pata lagwao',
  'stonicx se pata lagao',
  'stonicx ko web check',
  'stonicx ke thuru',
  'stonicx ke through',
  'stonicx se task',
  'delegate to stonicx',
  'ask stonicx',
  'tell stonicx',
  'let stonicx handle',
  'stonicx solve this',
  'stonicx sambhalo',
  'stonicx sambhal lo',
  'stonicx isko sambhalo',
  'stonicx fix this',
  'stonicx take over'
];

// 3. Web Search & Deep Research Triggers
export const WEB_SEARCH_TRIGGERS: string[] = [
  'search on web',
  'search the web',
  'web search',
  'google search',
  'google karo',
  'google par search',
  'search google for',
  'search online',
  'find on web',
  'latest news on',
  'documentation for',
  'internet pe search',
  'internet par search',
  'web check karo',
  'web check karwao',
  'online check karo',
  'online search karo'
];

// 4. Codebase Scan & Sandbox Eval Triggers
export const CODE_SCAN_TRIGGERS: string[] = [
  'scan codebase',
  'scan files',
  'inspect architecture',
  'list components',
  'show module tree'
];

export const EVAL_TRIGGERS: string[] = [
  'eval ',
  'evaluate math',
  'calculate in sandbox',
  'run sandbox calculation'
];

// Natural Language Trigger Keywords for Technical / STONICX Workload
export const STONICX_TECHNICAL_KEYWORDS: string[] = [
  'code',
  'debug',
  'terminal',
  'system',
  'circuit',
  'architecture',
  'analyze codebase',
  'stonicx',
  'technical task',
  'refactor',
  'bug',
  'compiler',
  'api',
  'database',
  'sql',
  'git',
  'deploy',
  'algorithm',
  'python',
  'typescript',
  'javascript',
  'rust',
  'c++',
  'kotlin',
  'java',
  'html',
  'css',
  'backend',
  'frontend',
  'kernel',
  'linux',
  'function',
  'pull request',
  'syntax error',
  'stack trace',
  'memory leak',
  'binary tree',
  'rest api',
  'websocket',
  'docker',
  'kubernetes',
  'regex',
  'endpoint',
  'graphql',
  'async',
  'multithreading',
  'blueprint'
];

// Clear Conversational & Companion Triggers
export const COMPANION_TRIGGERS: string[] = [
  'how are you',
  'kaise ho',
  'kaisi ho',
  'kya haal',
  'kya hal',
  'kya chal raha hai',
  'good morning',
  'good night',
  'good evening',
  'good afternoon',
  'shubh prabhat',
  'shubh ratri',
  'joke sunao',
  'tell me a joke',
  'kahani sunao',
  'tell me a story',
  'sing a song',
  'gana gao',
  'i love you',
  'feeling sad',
  'feeling happy',
  'are you happy',
  'are you sad',
  'cheer me up',
  'friend',
  'feeling lonely',
  'miss you'
];

// Technical code syntax patterns (regex checks)
const CODE_SYNTAX_PATTERNS = [
  /\bfunction\s*\(/i,
  /\bconst\s+[a-zA-Z0-9_$]+\s*=/i,
  /\blet\s+[a-zA-Z0-9_$]+\s*=/i,
  /\bimport\s+.*\s+from\s+['"]/i,
  /\bclass\s+[a-zA-Z0-9_$]+\s*\{/i,
  /\bdef\s+[a-zA-Z0-9_]+\s*\(/i,
  /\bconsole\.log\(/i,
  /\bSELECT\s+.*\s+FROM\s+/i,
  /\bINSERT\s+INTO\s+/i,
  /\bgit\s+(commit|push|pull|checkout|clone|status|branch)/i,
  /\bnpm\s+(install|run|start|build|test)/i,
  /\bdocker\s+(run|build|ps|exec)/i,
  /```[\s\S]*?```/,
  /\{\s*[\w\d_$]+\s*:\s*[\w\d_$]+\s*\}/
];

export class IntentClassifier {
  /**
   * Classifies an incoming user prompt into MAYRA (Companion/General/Orchestrator) or STONICX (Technical/Work)
   */
  public static classifyIntent(
    prompt: string,
    currentPersona: PersonaTarget = 'MAYRA'
  ): ClassificationResult {
    const raw = (prompt || '').trim();
    const lower = raw.toLowerCase();

    if (!raw) {
      return {
        targetPersona: currentPersona,
        track: 'GENERAL',
        confidence: 1.0,
        matchedKeywords: [],
        isDirectSwitch: false,
        reason: 'Empty prompt defaults to current active persona'
      };
    }

    // A. Check for Explicit Direct Screen Switch Commands
    const matchedStonicxScreen = STONICX_SCREEN_SWITCH_TRIGGERS.find((t) => lower.includes(t));
    if (matchedStonicxScreen) {
      return {
        targetPersona: 'STONICX',
        track: 'DIRECT_SWITCH',
        confidence: 0.99,
        matchedKeywords: [matchedStonicxScreen],
        isDirectSwitch: true,
        switchDirection: 'TO_STONICX',
        reason: `Explicit direct screen switch trigger matched: "${matchedStonicxScreen}"`
      };
    }

    const matchedMayraScreen = MAYRA_SCREEN_SWITCH_TRIGGERS.find((t) => lower.includes(t));
    if (matchedMayraScreen) {
      return {
        targetPersona: 'MAYRA',
        track: 'DIRECT_SWITCH',
        confidence: 0.99,
        matchedKeywords: [matchedMayraScreen],
        isDirectSwitch: true,
        switchDirection: 'TO_MAYRA',
        reason: `Explicit direct screen switch trigger matched: "${matchedMayraScreen}"`
      };
    }

    // B. Check for Explicit Delegation to STONICX (Without screen switch)
    const matchedStonicxDelegate = STONICX_DELEGATE_TRIGGERS.find((t) => lower.includes(t));
    const isStonicxMentionedWithTask = lower.includes('stonicx') && (
      lower.includes('check') || lower.includes('search') || lower.includes('web') || 
      lower.includes('internet') || lower.includes('puch') || lower.includes('bol') || 
      lower.includes('karwa') || lower.includes('karo') || lower.includes('bata') || 
      lower.includes('solve') || lower.includes('code') || lower.includes('help') ||
      lower.includes('kaho') || lower.includes('ask') || lower.includes('tell') ||
      lower.includes('dekho') || lower.includes('nikalo') || lower.includes('thuru') ||
      lower.includes('through') || lower.includes('kam') || lower.includes('kaam')
    );

    if (matchedStonicxDelegate || isStonicxMentionedWithTask) {
      return {
        targetPersona: 'STONICX',
        track: 'DELEGATED_TASK',
        confidence: 0.95,
        matchedKeywords: matchedStonicxDelegate ? [matchedStonicxDelegate] : ['stonicx_task_delegation'],
        isDirectSwitch: false,
        isDelegatedTask: true,
        delegatedAgent: 'STONICX',
        reason: `Task delegated to STONICX via trigger/context: "${matchedStonicxDelegate || 'stonicx_task_delegation'}"`
      };
    }

    // C. Check for Sub-Agent Tasks (Web Search, Codebase Scan, Sandbox Eval)
    const matchedWebSearch = WEB_SEARCH_TRIGGERS.find((t) => lower.includes(t));
    if (matchedWebSearch) {
      return {
        targetPersona: currentPersona,
        track: 'DELEGATED_TASK',
        confidence: 0.92,
        matchedKeywords: [matchedWebSearch],
        isDirectSwitch: false,
        isDelegatedTask: true,
        delegatedAgent: 'RESEARCH_AGENT',
        reason: `Delegated Web Search / Deep Research Task: "${matchedWebSearch}"`
      };
    }

    const matchedCodeScan = CODE_SCAN_TRIGGERS.find((t) => lower.includes(t));
    if (matchedCodeScan) {
      return {
        targetPersona: currentPersona,
        track: 'DELEGATED_TASK',
        confidence: 0.92,
        matchedKeywords: [matchedCodeScan],
        isDirectSwitch: false,
        isDelegatedTask: true,
        delegatedAgent: 'CODING_AGENT',
        reason: `Delegated Codebase Scanner Task: "${matchedCodeScan}"`
      };
    }

    // D. Check for Technical Keywords & Code Patterns
    const matchedKeywords: string[] = [];
    let technicalScore = 0;

    for (const kw of STONICX_TECHNICAL_KEYWORDS) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lower)) {
        matchedKeywords.push(kw);
        if (['stonicx', 'analyze codebase', 'circuit', 'architecture', 'terminal', 'debug', 'code', 'technical task'].includes(kw)) {
          technicalScore += 0.45;
        } else {
          technicalScore += 0.25;
        }
      }
    }

    let syntaxMatches = 0;
    for (const pattern of CODE_SYNTAX_PATTERNS) {
      if (pattern.test(raw)) {
        syntaxMatches++;
        technicalScore += 0.35;
      }
    }
    if (syntaxMatches > 0) {
      matchedKeywords.push(`code_syntax_pattern(${syntaxMatches})`);
    }

    const confidence = Math.min(1.0, Math.max(0.1, technicalScore));
    const isTechnical = technicalScore >= 0.40;
    const matchedCompanion = COMPANION_TRIGGERS.find((t) => lower.includes(t));

    // E. Autonomous Routing Decision
    if (currentPersona === 'STONICX') {
      if (matchedCompanion) {
        return {
          targetPersona: 'MAYRA',
          track: 'COMPANION',
          confidence: 0.90,
          matchedKeywords: [matchedCompanion],
          isDirectSwitch: false,
          reason: `Companion request "${matchedCompanion}" routed to MAYRA`
        };
      }

      return {
        targetPersona: 'STONICX',
        track: isTechnical ? 'TECHNICAL' : 'GENERAL',
        confidence: isTechnical ? parseFloat(confidence.toFixed(2)) : 0.85,
        matchedKeywords,
        isDirectSwitch: false,
        reason: isTechnical
          ? `Technical workload detected with keywords [${matchedKeywords.join(', ')}]`
          : 'General query retained and answered directly by STONICX'
      };
    }

    // If currently MAYRA:
    if (isTechnical) {
      return {
        targetPersona: 'MAYRA',
        track: 'DELEGATED_TASK',
        confidence: parseFloat(confidence.toFixed(2)),
        matchedKeywords,
        isDirectSwitch: false,
        isDelegatedTask: true,
        delegatedAgent: 'STONICX',
        reason: `Technical workload handled by MAYRA via STONICX brain delegation with keywords [${matchedKeywords.join(', ')}]`
      };
    }

    return {
      targetPersona: 'MAYRA',
      track: matchedCompanion ? 'COMPANION' : 'GENERAL',
      confidence: parseFloat((1.0 - Math.min(0.5, technicalScore)).toFixed(2)),
      matchedKeywords: matchedCompanion ? [matchedCompanion] : [],
      isDirectSwitch: false,
      reason: matchedCompanion
        ? `Conversational companion request "${matchedCompanion}" handled by MAYRA`
        : 'General query handled directly by MAYRA'
    };
  }
}
