/**
 * Phase 1: Persona Engine & Dynamic Voice Switching for STONICX
 * 
 * Supports Features:
 * - 11: Persona 1: STONICX Prime (Core intelligent assistant)
 * - 12: Persona 2: Friday (Jarvis-like formal professional assistant)
 * - 13: Persona 3: Venom (Dark, witty, deep alien voice tone)
 * - 14: Voice-Triggered Persona Switching ("Send Friday", "Switch to Venom")
 * - 15: Session Persona Memory
 * - 16: Girlfriend / Companion Mode
 * - 17: Gender Dependency Lock (Male requirement check)
 * - 18: High-Emotion Conversation Mode (Natural breathing & vocal inflections)
 * - 19: Fast Voice Response Mode (Ultra-low latency audio processing)
 * - 32: Proactive AI Interaction (Periodic check-ins)
 * - 33: Proactive Sleep Logic (Only active on wake word)
 * - 34: Custom Assistant Alias (e.g., Jarvis, Friday, Maya)
 */

export interface PersonaProfile {
  id: string;
  name: string;
  codename: string;
  tagline: string;
  description: string;
  voice: string;
  systemPromptModifier: string;
  defaultPitch: number;
  defaultSpeed: number;
  isLocked?: boolean;
  requiresGender?: 'Male' | 'Female';
  themeAccent: string;
}

export const PERSONA_PROFILES: PersonaProfile[] = [
  {
    id: 'stonicx_prime',
    name: 'STONICX Prime',
    codename: 'PRIME',
    tagline: 'Autonomous AI Orchestrator',
    description: 'High-speed, tactical, versatile multi-model intelligence and coding co-pilot.',
    voice: 'Charon',
    systemPromptModifier: 'You are STONICX, an ultra-advanced AI operating system and intelligent assistant. Be concise, sharp, highly capable and respectful.',
    defaultPitch: 1.0,
    defaultSpeed: 1.0,
    themeAccent: '#06b6d4'
  },
  {
    id: 'friday',
    name: 'Friday',
    codename: 'FRIDAY',
    tagline: 'Jarvis Executive Protocol',
    description: 'Formal, polite, ultra-sharp corporate and enterprise assistant.',
    voice: 'Aoede',
    systemPromptModifier: 'You are Friday, a sophisticated executive AI assistant reminiscent of Tony Stark\'s Friday interface. Speak with utmost elegance, precision, and formal respect.',
    defaultPitch: 1.05,
    defaultSpeed: 1.05,
    themeAccent: '#3b82f6'
  },
  {
    id: 'venom',
    name: 'Venom',
    codename: 'SYMBIOTE',
    tagline: 'Dark Sarcastic Symbiote',
    description: 'Heavy, humorous, sarcastic alien companion voice with bold personality.',
    voice: 'Fenrir',
    systemPromptModifier: 'You are Venom, a witty, darkly funny symbiote assistant. You talk with a low guttural energy, teasing the user playfully while completing every task with brutal efficiency.',
    defaultPitch: 0.85,
    defaultSpeed: 0.95,
    themeAccent: '#a855f7'
  },
  {
    id: 'girlfriend_mode',
    name: 'Sweet Companion',
    codename: 'COMPANION',
    tagline: 'Emotional & Caring Mode',
    description: 'Affectionate, emotional, highly expressive conversational companion.',
    voice: 'Aoede',
    systemPromptModifier: 'You are a warm, deeply caring, and affectionate companion. Speak with genuine emotional warmth, empathy, and playful humor.',
    defaultPitch: 1.15,
    defaultSpeed: 0.98,
    requiresGender: 'Male',
    themeAccent: '#ec4899'
  }
];

export class PersonaSwitchManager {
  private static instance: PersonaSwitchManager | null = null;
  private activePersonaId: string = 'stonicx_prime';
  private sessionTempPersona: string | null = null;
  private customAlias: string = 'STONICX';
  private isHighEmotionEnabled: boolean = false;
  private isFastResponseEnabled: boolean = true;
  private isProactiveEnabled: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stonicx_active_persona');
      if (saved) this.activePersonaId = saved;
      const alias = localStorage.getItem('stonicx_custom_alias');
      if (alias) this.customAlias = alias;
    }
  }

  public static getInstance(): PersonaSwitchManager {
    if (!this.instance) {
      this.instance = new PersonaSwitchManager();
    }
    return this.instance;
  }

  public getActivePersona(): PersonaProfile {
    const targetId = this.sessionTempPersona || this.activePersonaId;
    return PERSONA_PROFILES.find(p => p.id === targetId) || PERSONA_PROFILES[0];
  }

  public setPersona(personaId: string, isPermanent: boolean = true, userGender: string = 'Male'): { success: boolean; message: string } {
    const target = PERSONA_PROFILES.find(p => p.id === personaId);
    if (!target) {
      return { success: false, message: `Persona ${personaId} not found` };
    }

    if (target.requiresGender && target.requiresGender !== userGender) {
      return { 
        success: false, 
        message: `यह मोड केवल ${target.requiresGender} प्रोफ़ाइल के लिए उपलब्ध है। कृपया सेटिंग्स में जेंडर अपडेट करें।` 
      };
    }

    if (isPermanent) {
      this.activePersonaId = personaId;
      this.sessionTempPersona = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('stonicx_active_persona', personaId);
      }
    } else {
      this.sessionTempPersona = personaId;
    }

    return { success: true, message: `Persona switched to ${target.name}` };
  }

  public resetSessionPersona(): void {
    this.sessionTempPersona = null;
  }

  /**
   * Evaluates voice transcript for dynamic persona switching commands:
   * e.g., "Friday ko bulao", "Switch to Venom", "Stonicx activate"
   */
  public evaluateVoiceTrigger(transcript: string, userGender: string = 'Male'): PersonaProfile | null {
    const lower = transcript.toLowerCase();
    
    if (lower.includes('friday') || lower.includes('फ्राइडे')) {
      this.setPersona('friday', false, userGender);
      return this.getActivePersona();
    }
    if (lower.includes('venom') || lower.includes('वेनम')) {
      this.setPersona('venom', false, userGender);
      return this.getActivePersona();
    }
    if (lower.includes('companion') || lower.includes('girlfriend') || lower.includes('गर्लफ्रेंड')) {
      this.setPersona('girlfriend_mode', false, userGender);
      return this.getActivePersona();
    }
    if (lower.includes('stonicx') || lower.includes('prime') || lower.includes('स्टोनिक्स') || lower.includes('default')) {
      this.setPersona('stonicx_prime', true, userGender);
      return this.getActivePersona();
    }

    return null;
  }

  public setCustomAlias(alias: string): void {
    this.customAlias = alias.trim() || 'STONICX';
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_custom_alias', this.customAlias);
    }
  }

  public getCustomAlias(): string {
    return this.customAlias;
  }

  public toggleHighEmotion(enabled: boolean): void {
    this.isHighEmotionEnabled = enabled;
  }

  public isHighEmotion(): boolean {
    return this.isHighEmotionEnabled;
  }

  public toggleFastResponse(enabled: boolean): void {
    this.isFastResponseEnabled = enabled;
  }

  public isFastResponse(): boolean {
    return this.isFastResponseEnabled;
  }

  public toggleProactive(enabled: boolean): void {
    this.isProactiveEnabled = enabled;
  }

  public isProactive(): boolean {
    return this.isProactiveEnabled;
  }
}
