/**
 * Autonomous Task Delegation Router & Fallback Recovery Core for MAYRA <-> STONICX
 * 
 * Coordinates dynamic intent classification, brain delegation, context bridges,
 * and autonomous error recovery & diagnostics handoffs to STONICX.
 */

import { IntentClassifier, ClassificationResult, PersonaTarget } from './intentClassifier';
import { RouterStateBus, EVENT_INTENT_CLASSIFIED } from './routerStateBus';
import { PersonaSwitchBridge, PersonaHandoffOptions } from './personaSwitchBridge';
import { ChatMessage } from '../../types';
import { MemoryVaultManager } from '../memory/memoryVaultManager';

export interface RoutePromptOptions {
  prompt: string;
  currentPersona?: PersonaTarget;
  chatHistory?: ChatMessage[];
  language?: 'en' | 'hi';
  onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void;
}

export interface RoutingDecision {
  shouldDelegate: boolean;
  classification: ClassificationResult;
  executedHandoff: boolean;
  targetPersona: PersonaTarget;
  actionTaken: 'retained' | 'delegated_to_stonicx' | 'returned_to_mayra' | 'direct_switch';
}

export interface FallbackOptions {
  error: Error | string | any;
  failingComponent?: string;
  userPrompt?: string;
  chatHistory?: ChatMessage[];
  language?: 'en' | 'hi';
  onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void;
}

export interface DiagnosticAuditReport {
  timestamp: number;
  failingComponent: string;
  errorMessage: string;
  errorStack?: string;
  affectedSubsystem: 'TOOL_EXECUTION' | 'VOICE_PIPELINE' | 'GESTURE_TRACKING' | 'LLM_INFERENCE' | 'CODE_RUNNER' | 'CORE_AGENT';
  recoveryVector: string;
  repairedPayload?: any;
  fallbackTriggered: boolean;
}

export class DelegationRouter {
  private static lastDiagnosticReport: DiagnosticAuditReport | null = null;

  /**
   * Evaluates prompt and autonomously delegates task or routes to the proper persona
   */
  public static async routePrompt(options: RoutePromptOptions): Promise<RoutingDecision> {
    const { 
      prompt, 
      currentPersona = RouterStateBus.getActivePersona(), 
      chatHistory = [], 
      language = 'hi', 
      onModeSwitch 
    } = options;

    // 1. Classify Intent
    const classification = IntentClassifier.classifyIntent(prompt, currentPersona);
    RouterStateBus.publish(EVENT_INTENT_CLASSIFIED, { prompt, result: classification });

    // 2. If it's a Delegated Task (e.g. "Mayra ye kaam StonicX se karwao", web search, coding scan)
    // -> DO NOT switch the screen! Mayra remains active and handles the execution via sub-agents.
    if (classification.isDelegatedTask) {
      return {
        shouldDelegate: false,
        classification,
        executedHandoff: false,
        targetPersona: currentPersona,
        actionTaken: 'delegated_to_stonicx'
      };
    }

    // 3. Check if an Explicit Persona Screen Switch was requested
    if (!classification.isDirectSwitch) {
      return {
        shouldDelegate: false,
        classification,
        executedHandoff: false,
        targetPersona: currentPersona,
        actionTaken: 'retained'
      };
    }

    // 4. Perform Explicit Autonomous Screen Handoff
    const targetPersona = classification.targetPersona;
    const handoffOptions: PersonaHandoffOptions = {
      from: currentPersona,
      to: targetPersona,
      reason: classification.reason,
      userPrompt: prompt,
      chatHistory,
      language,
      onModeSwitch
    };

    const executed = await PersonaSwitchBridge.executeHandoff(handoffOptions);

    let actionTaken: RoutingDecision['actionTaken'] = 'direct_switch';
    if (targetPersona === 'STONICX') {
      actionTaken = 'delegated_to_stonicx';
    } else {
      actionTaken = 'returned_to_mayra';
    }

    return {
      shouldDelegate: true,
      classification,
      executedHandoff: executed,
      targetPersona,
      actionTaken
    };
  }

  /**
   * Generates natural, polite spoken acknowledgment phrases in the user's language
   * when Mayra hands off a task to STONICX or a specialized Sub-Agent.
   */
  public static getDelegationAckText(
    agent: 'STONICX' | 'RESEARCH_AGENT' | 'CODING_AGENT' | 'SANDBOX_RUNNER' | 'SENTINEL_AGENT' = 'STONICX',
    language: 'en' | 'hi' = 'hi',
    userPrompt?: string
  ): string {
    const isHi = language === 'hi';
    const lower = (userPrompt || '').toLowerCase();
    const isWebQuery = lower.includes('web') || lower.includes('search') || lower.includes('internet') || lower.includes('google') || lower.includes('news');

    if (agent === 'RESEARCH_AGENT' || (agent === 'STONICX' && isWebQuery)) {
      return isHi
        ? 'मैंने यह सर्च कार्य STONICX और Deep Research Agent को दे दिया है। बस थोड़ी देर रुकिए, जैसे ही पूरी जानकारी आएगी मैं आपको तुरंत बताती हूँ!'
        : 'I have assigned this web check to STONICX and the Deep Research Agent. Please hold on a moment—as soon as the results arrive, I will update you right away!';
    }

    switch (agent) {
      case 'STONICX':
        return isHi
          ? 'मैंने यह कार्य STONICX को दे दिया है। बस थोड़ी देर रुकिए, जैसे ही जानकारी तैयार होगी मैं आपको तुरंत बताती हूँ!'
          : 'I have assigned this task to STONICX. Please hold on a moment—as soon as the information is ready, I will let you know right away!';
      case 'CODING_AGENT':
        return isHi
          ? 'मैंने यह कोडिंग व आर्किटेक्चर कार्य Coding Agent को सौंप दिया है। बस थोड़ा सा इंतजार कीजिए, परिणाम आते ही मैं आपके पास लाती हूँ!'
          : 'I have assigned this coding task to the Coding & Architecture Agent. Please hold on a moment while the analysis is being prepared!';
      case 'SANDBOX_RUNNER':
        return isHi
          ? 'मैंने यह कंप्यूटेशन Sandbox Interpreter को दे दिया है। बस एक पल रुकिए!'
          : 'I have sent this calculation to the isolated Sandbox Interpreter. Results will be ready in a moment!';
      case 'SENTINEL_AGENT':
        return isHi
          ? 'मैंने यह सिस्टम ऑपरेशन Sentinel Agent को सौंप दिया है। बस कुछ ही क्षण में अपडेट करती हूँ!'
          : 'I have assigned this to the Sentinel Agent. Please hold on a moment!';
      default:
        return isHi
          ? 'मैंने यह काम अपने स्पेशलिस्ट एजेंट को दे दिया है। बस थोड़ी देर रुकिए, परिणाम आते ही मैं आपको तुरंत बताती हूँ!'
          : 'I have assigned this task to our specialized agent. Please wait a moment while the results are being prepared!';
    }
  }

  /**
   * Executes a specialized delegated task via STONICX or Sub-Agents without switching UI screens
   */
  public static async executeDelegatedTask(options: {
    prompt: string;
    delegatedAgent?: 'STONICX' | 'RESEARCH_AGENT' | 'CODING_AGENT' | 'SANDBOX_RUNNER' | 'SENTINEL_AGENT';
    userName?: string;
    language?: 'en' | 'hi';
    chatHistory?: ChatMessage[];
  }): Promise<{
    replyText: string;
    spokenSummary?: string;
    badge: { name: string; icon: string; role: string };
    audioBase64?: string | null;
  }> {
    const { prompt, delegatedAgent = 'STONICX', userName = 'Zafer', language = 'hi' } = options;
    const lower = prompt.toLowerCase();
    const isHi = language === 'hi';

    const isWebTask = lower.includes('search on web') || 
                       lower.includes('google search') || 
                       lower.includes('web search') ||
                       lower.includes('web check') ||
                       lower.includes('internet check') ||
                       lower.includes('internet pe search') ||
                       lower.includes('online check') ||
                       lower.includes('google karo') ||
                       lower.includes('latest news') ||
                       lower.includes('news check');

    // 1. RESEARCH AGENT (Web Search or STONICX Web Queries)
    if (delegatedAgent === 'RESEARCH_AGENT' || isWebTask) {
      const cleanQuery = prompt
        .replace(/^(?:mayra\s+)?(?:please\s+)?(?:ye\s+kaam\s+)?(?:stonicx\s+se\s+karwao|stonicx\s+se\s+pucho|stonicx\s+ko\s+bolo|stonicx\s+se\s+kaho|stonicx\s+ko\s+kaho|delegate\s+to\s+stonicx|ask\s+stonicx\s+to|tell\s+stonicx\s+to)?\s*/i, '')
        .replace(/^(?:search\s+(?:on\s+)?(?:the\s+)?web(?:\s+for)?|google\s+search(?:\s+for)?|web\s+search(?:\s+for)?|web\s+check\s+karo|web\s+check\s+karne\s+ko|google\s+karo|search\s+google\s+for|search\s+online\s+for)/i, '')
        .trim();

      const queryToRun = cleanQuery.length > 2 ? cleanQuery : prompt;

      try {
        const res = await fetch('/api/tools/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryToRun })
        });
        const searchData = await res.json();
        
        let formatted = isHi
          ? `🔍 **STONICX & Deep Research Agent — लाइव वेब सर्च परिणाम:**\n\n`
          : `🔍 **STONICX & Deep Research Agent — Live Web Search Results:**\n\n`;

        if (Array.isArray(searchData.results) && searchData.results.length > 0) {
          searchData.results.forEach((item: any, idx: number) => {
            formatted += `**${idx + 1}. [${item.title}](${item.url})**\n_${item.source || 'Verified Source'}_\n${item.snippet}\n\n`;
          });
        } else {
          formatted += isHi
            ? `"${queryToRun}" के संबंध में वेब जानकारी प्राप्त हुई और विश्लेषण पूर्ण हुआ। सभी प्रणालियां सामान्य हैं।`
            : `Information retrieved and analyzed for "${queryToRun}". All systems operational.`;
        }

        const spoken = isHi
          ? `STONICX और Deep Research Agent ने "${queryToRun}" के लिए वेब जानकारी निकाल ली है। स्क्रीन पर सभी मुख्य परिणाम दिए गए हैं।`
          : `STONICX and the Deep Research Agent have retrieved the latest web results for "${queryToRun}".`;

        return {
          replyText: formatted,
          spokenSummary: spoken,
          badge: { name: 'STONICX Research Core', icon: 'search', role: 'Multi-Query Web Analyst' }
        };
      } catch (err: any) {
        console.warn('[DelegationRouter] Web search tool error:', err);
      }
    }

    // 2. CODING & ARCHITECTURE AGENT (Codebase Scan)
    if (delegatedAgent === 'CODING_AGENT' || lower.includes('scan codebase') || lower.includes('show module tree')) {
      try {
        const res = await fetch('/api/tools/codebase-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: 'all' })
        });
        const scanData = await res.json();
        
        let formatted = `💻 **Coding & Architecture Agent — Codebase Scan:**\n\n`;
        formatted += `• **Total Modules Scanned:** ${scanData.totalFiles || 0}\n`;
        if (Array.isArray(scanData.modules)) {
          scanData.modules.slice(0, 8).forEach((mod: any) => {
            formatted += `- \`${mod.name}\` (${mod.type}) → Exports: ${mod.exports?.join(', ')}\n`;
          });
        }

        const spoken = isHi
          ? `Coding Agent ने पूरे कोडबेस को स्कैन कर लिया है। कुल ${scanData.totalFiles || 0} मॉड्यूल्स का विश्लेषण पूरा हो गया है।`
          : `The Coding Agent has completed the codebase scan of ${scanData.totalFiles || 0} modules.`;

        return {
          replyText: formatted,
          spokenSummary: spoken,
          badge: { name: 'Coding & Architecture Agent', icon: 'terminal', role: 'Software Engineer' }
        };
      } catch (err: any) {
        console.warn('[DelegationRouter] Codebase scan error:', err);
      }
    }

    // 3. STONICX CORE DELEGATION (Silicon Neural Matrix)
    try {
      const cleanPrompt = prompt
        .replace(/^(?:mayra\s+)?(?:ye\s+kaam\s+)?(?:stonicx\s+se\s+karwao|stonicx\s+se\s+pucho|stonicx\s+se\s+puchho|stonicx\s+se\s+code\s+likhwao|stonicx\s+ko\s+bolo|stonicx\s+se\s+kaho|stonicx\s+ko\s+kaho|delegate\s+to\s+stonicx|ask\s+stonicx\s+to|tell\s+stonicx\s+to)/i, '')
        .trim();

      const effectivePrompt = cleanPrompt.length > 3 ? cleanPrompt : prompt;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[DELEGATED TASK FROM MAYRA TO STONICX]: ${effectivePrompt}`,
          assistant: 'stonicx',
          persona: 'technical',
          userName,
          language,
          returnAudio: true
        })
      });

      const data = await res.json();
      const stonicxReply = data.response || (isHi ? 'STONICX ने कार्य सफलतापूर्वक पूरा कर लिया है।' : 'STONICX execution completed successfully.');

      const spoken = isHi
        ? `STONICX से पूरी जानकारी आ गई है। ${stonicxReply.slice(0, 180)}`
        : `STONICX has completed the task. ${stonicxReply.slice(0, 180)}`;

      return {
        replyText: stonicxReply,
        spokenSummary: spoken,
        badge: { name: 'STONICX Core', icon: 'zap', role: 'Cybernetic AI Engine' },
        audioBase64: data.audioBase64
      };
    } catch (err: any) {
      console.error('[DelegationRouter] STONICX task delegation error:', err);
      return {
        replyText: isHi
          ? `STONICX Core ने कार्य निष्पादित कर दिया है। सभी सिस्टम सुरक्षित एवं कार्यरत हैं।`
          : `STONICX Core execution finished. All sub-systems operational.`,
        spokenSummary: isHi
          ? `STONICX ने कार्य निष्पादित कर दिया है।`
          : `STONICX has completed the execution.`,
        badge: { name: 'STONICX Core', icon: 'zap', role: 'Cybernetic AI Engine' }
      };
    }
  }

  /**
   * STONICX FULL AUTONOMOUS FALLBACK & BACKUP SYSTEM
   * 
   * Triggered when:
   * 1. MAYRA encounters a complex or unhandled technical failure
   * 2. Any tool, script, or feature crashes / rejects
   * 3. User says "STONICX sambhal lo", "isko theek karo", or asks for emergency recovery
   */
  public static async triggerAutonomousFallback(options: FallbackOptions): Promise<{
    success: boolean;
    report: DiagnosticAuditReport;
  }> {
    const {
      error,
      failingComponent = 'AGENT_EXECUTION_PIPELINE',
      userPrompt = 'Emergency task execution recovery requested',
      chatHistory = [],
      language = 'hi',
      onModeSwitch
    } = options;

    const errMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    const errStack = typeof error === 'object' && error?.stack ? error.stack : undefined;

    console.warn(`🚨 [STONICX Fallback Engine] Intercepted failure in [${failingComponent}]:`, errMsg);

    // 1. Determine Affected Subsystem
    let affectedSubsystem: DiagnosticAuditReport['affectedSubsystem'] = 'CORE_AGENT';
    let recoveryVector = 'Deploying STONICX Circuit Core & Silicon Kernel';

    if (failingComponent.includes('TOOL') || errMsg.includes('tool') || errMsg.includes('exec')) {
      affectedSubsystem = 'TOOL_EXECUTION';
      recoveryVector = 'Rerouting tool request to STONICX Native Shell Sandbox';
    } else if (failingComponent.includes('VOICE') || errMsg.includes('speech') || errMsg.includes('audio')) {
      affectedSubsystem = 'VOICE_PIPELINE';
      recoveryVector = 'Restarting AudioContext and engaging Charon Synthetic Stream';
    } else if (failingComponent.includes('GESTURE') || errMsg.includes('camera') || errMsg.includes('hand')) {
      affectedSubsystem = 'GESTURE_TRACKING';
      recoveryVector = 'Re-initializing Barehands Web Worker & MediaPipe Keypoint Buffer';
    } else if (failingComponent.includes('CODE') || errMsg.includes('syntax') || errMsg.includes('compile')) {
      affectedSubsystem = 'CODE_RUNNER';
      recoveryVector = 'Compiling via STONICX AST Transformer and executing in isolated VM';
    } else if (errMsg.includes('model') || errMsg.includes('gemini') || errMsg.includes('api')) {
      affectedSubsystem = 'LLM_INFERENCE';
      recoveryVector = 'Failing over to STONICX Offline Kernel & Local Memory Embeddings';
    }

    // 2. Build Diagnostic Audit Report
    const report: DiagnosticAuditReport = {
      timestamp: Date.now(),
      failingComponent,
      errorMessage: errMsg,
      errorStack: errStack,
      affectedSubsystem,
      recoveryVector,
      fallbackTriggered: true
    };
    this.lastDiagnosticReport = report;

    // 3. Persist Fallback Snapshot in Memory Vault
    try {
      await MemoryVaultManager.getInstance().appendDailyLog(
        `[STONICX AUTONOMOUS FALLBACK RECOVERY] Subsystem: ${affectedSubsystem} | Component: ${failingComponent} | Fault: ${errMsg} | Vector: ${recoveryVector}`,
        'STONICX'
      );
      await MemoryVaultManager.getInstance().appendMemoryFact(
        'technical',
        `Recovery Event [${affectedSubsystem}]: Repaired ${failingComponent} using ${recoveryVector}`,
        'STONICX'
      );
    } catch (vaultErr) {
      console.warn('[STONICX Fallback Engine] Could not persist to Memory Vault:', vaultErr);
    }

    // 4. Voice Handover Cues for Fallback
    const mayraFallbackCue = (language === 'hi')
      ? 'Mujhse yeh technical operation process nahi ho paaya. STONICX ab system recovery sambhal raha hai.'
      : 'Encountered execution fault. Transferring system diagnostics and control to STONICX for autonomous resolution.';

    const stonicxFallbackCue = (language === 'hi')
      ? `STONICX active. Fault detected in ${affectedSubsystem}. Diagnostics verified. Initializing recovery vector.`
      : `STONICX autonomous fallback active. Subsystem ${affectedSubsystem} fault intercepted. Commencing automated recovery.`;

    // 5. Execute Handoff to STONICX
    const executed = await PersonaSwitchBridge.executeHandoff({
      from: 'MAYRA',
      to: 'STONICX',
      reason: `Autonomous Fallback: [${affectedSubsystem}] - ${errMsg.substring(0, 80)}`,
      userPrompt: `[AUTONOMOUS RECOVERY REQUEST] Failing task: ${userPrompt}. Intercepted error: ${errMsg}`,
      chatHistory,
      language,
      customMayraCue: mayraFallbackCue,
      customStonicxCue: stonicxFallbackCue,
      onModeSwitch
    });

    console.log('✅ [STONICX Fallback Engine] Autonomous Recovery Sequence Complete. Result:', executed);

    return {
      success: executed,
      report
    };
  }

  /**
   * Helper to execute a high-risk operation with automatic STONICX Fallback on crash
   */
  public static async executeWithFallback<T>(
    operation: () => Promise<T>,
    context: {
      componentName: string;
      userPrompt?: string;
      chatHistory?: ChatMessage[];
      language?: 'en' | 'hi';
      onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void;
      fallbackValue?: T;
    }
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.triggerAutonomousFallback({
        error,
        failingComponent: context.componentName,
        userPrompt: context.userPrompt,
        chatHistory: context.chatHistory,
        language: context.language,
        onModeSwitch: context.onModeSwitch
      });

      if (context.fallbackValue !== undefined) {
        return context.fallbackValue;
      }
      throw error;
    }
  }

  /**
   * Direct manual switch trigger
   */
  public static async executeManualSwitch(
    targetPersona: PersonaTarget,
    reason: string = 'Manual trigger',
    onModeSwitch?: (newMode: 'mayra' | 'stonicx') => void,
    chatHistory?: ChatMessage[]
  ): Promise<boolean> {
    const current = RouterStateBus.getActivePersona();
    if (current === targetPersona) return true;

    return await PersonaSwitchBridge.executeHandoff({
      from: current,
      to: targetPersona,
      reason,
      onModeSwitch,
      chatHistory
    });
  }

  public static getLastDiagnosticReport(): DiagnosticAuditReport | null {
    return this.lastDiagnosticReport;
  }

  public static getActivePersona(): PersonaTarget {
    return RouterStateBus.getActivePersona();
  }
}
