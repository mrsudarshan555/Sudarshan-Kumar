/**
 * Offline & On-Device Voice Matching Engine
 * 
 * Selects high-fidelity on-device SpeechSynthesis voices calibrated to match
 * the online personalities of MAYRA ('Aoede' - Soft, Warm Female) and STONICX ('Charon' - Deep, Confident Male).
 * 
 * Works seamlessly in Offline Mode (GGUF local model / no internet) and as resilient local fallback.
 */

export interface VoiceMatchOptions {
  persona?: 'MAYRA' | 'STONICX';
  language?: 'en' | 'hi';
  onStart?: () => void;
  onEnd?: () => void;
}

export class OfflineVoiceMatcher {
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static isInitialized: boolean = false;
  private static activeUtteranceQueue: SpeechSynthesisUtterance[] = [];

  /**
   * Initializes and warms the available system speech synthesis voices
   */
  public static init(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          this.cachedVoices = voices;
          this.isInitialized = true;
        }
      } catch (e) {}
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const freshVoices = window.speechSynthesis.getVoices();
      if (freshVoices && freshVoices.length > 0) {
        this.cachedVoices = freshVoices;
      }
    }
    return this.cachedVoices;
  }

  /**
   * Finds the best matching on-device voice for the given persona and language
   */
  public static findBestVoice(persona: 'MAYRA' | 'STONICX', lang: 'en' | 'hi' = 'en'): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (!voices || voices.length === 0) return null;

    const isHindi = lang === 'hi';

    if (persona === 'STONICX') {
      // -------------------------------------------------------------
      // STONICX: Deep, Confident, Authoritative Male ('Charon' persona match)
      // -------------------------------------------------------------
      const deepMalePriorityNames = [
        // Premium / Natural Neural voices
        'google uk english male',
        'google us english male',
        'microsoft guy online (natural)',
        'microsoft ryan online (natural)',
        'microsoft david desktop',
        'microsoft david',
        'microsoft george',
        'microsoft mark',
        'daniel (enhanced)',
        'daniel',
        'oliver',
        'alex',
        'fred',
        'arthur',
        'rishi',
        'neil',
        'male'
      ];

      // Exclude female voice names explicitly
      const femaleBlacklist = [
        'female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen', 
        'jenny', 'aria', 'hazel', 'susan', 'catherine', 'moira', 'tessa', 'veena', 'lekha'
      ];

      // 1. Check priority list in order
      for (const nameKeyword of deepMalePriorityNames) {
        const match = voices.find(v => {
          const vName = v.name.toLowerCase();
          const matchesKeyword = vName.includes(nameKeyword);
          const isNotFemale = !femaleBlacklist.some(b => vName.includes(b));
          if (isHindi) {
            return matchesKeyword && isNotFemale && (v.lang.startsWith('hi') || v.lang.startsWith('en'));
          }
          return matchesKeyword && isNotFemale && v.lang.startsWith('en');
        });
        if (match) return match;
      }

      // 2. Generic search for any male voice in matching language
      const anyMale = voices.find(v => {
        const vName = v.name.toLowerCase();
        const isMale = (vName.includes('male') || vName.includes('guy') || vName.includes('man') || vName.includes('david')) &&
                       !femaleBlacklist.some(b => vName.includes(b));
        return isMale && (isHindi ? (v.lang.startsWith('hi') || v.lang.startsWith('en')) : v.lang.startsWith('en'));
      });
      if (anyMale) return anyMale;

      // 3. Fallback to any non-female English/Hindi voice
      const nonFemale = voices.find(v => {
        const vName = v.name.toLowerCase();
        return !femaleBlacklist.some(b => vName.includes(b)) && (v.lang.startsWith('en') || v.lang.startsWith('hi'));
      });
      if (nonFemale) return nonFemale;

      // 4. Ultimate fallback
      return voices.find(v => v.lang.startsWith('en')) || voices[0];

    } else {
      // -------------------------------------------------------------
      // MAYRA: Soft, Warm, Melodic Female ('Aoede' persona match)
      // -------------------------------------------------------------
      const warmFemalePriorityNames = isHindi
        ? [
            'google हिन्दी',
            'hi-in-x-hie-local',
            'hi-in-x-cfn-local',
            'hi-in-x-hie-network',
            'lekha',
            'veena',
            'kalyani',
            'google uk english female',
            'microsoft heera',
            'microsoft kalpana',
            'microsoft zira'
          ]
        : [
            'google uk english female',
            'google us english female',
            'microsoft jenny online (natural)',
            'microsoft aria online (natural)',
            'microsoft zira desktop',
            'microsoft zira',
            'samantha (enhanced)',
            'samantha',
            'karen (enhanced)',
            'karen',
            'serena',
            'victoria',
            'moira',
            'tessa',
            'fiona',
            'female'
          ];

      const maleBlacklist = ['male', 'guy', 'david', 'george', 'mark', 'daniel', 'alex', 'fred', 'arthur', 'rishi', 'neil'];

      // 1. Check priority list in order
      for (const nameKeyword of warmFemalePriorityNames) {
        const match = voices.find(v => {
          const vName = v.name.toLowerCase();
          const matchesKeyword = vName.includes(nameKeyword);
          const isNotMale = !maleBlacklist.some(b => vName.includes(b));
          return matchesKeyword && isNotMale;
        });
        if (match) return match;
      }

      // 2. Any female voice matching the language
      const anyFemale = voices.find(v => {
        const vName = v.name.toLowerCase();
        const isFemale = (vName.includes('female') || vName.includes('woman') || vName.includes('zira') || vName.includes('samantha')) &&
                         !maleBlacklist.some(b => vName.includes(b));
        return isFemale && (isHindi ? (v.lang.startsWith('hi') || v.lang.startsWith('en')) : v.lang.startsWith('en'));
      });
      if (anyFemale) return anyFemale;

      // 3. Fallback to first language-matching voice
      const langVoice = voices.find(v => isHindi ? (v.lang.startsWith('hi') || v.lang.startsWith('en')) : v.lang.startsWith('en'));
      return langVoice || voices[0];
    }
  }

  /**
   * Sanitizes text for clean, natural speech without punctuation noise
   */
  public static cleanTextForSpeech(text: string): string {
    return text
      .replace(/\[.*?\]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[`*#_~]/g, '')
      .replace(/\{.*?\}/g, '')
      .replace(/<.*?>/g, '')
      .replace(/•|\*|-/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Splits long text into manageable sentences so SpeechSynthesis never freezes
   */
  public static splitSentences(text: string, maxLen: number = 180): string[] {
    const clean = this.cleanTextForSpeech(text);
    if (!clean) return [];
    if (clean.length <= maxLen) return [clean];

    const rawSentences = clean.split(/(?<=[.?!।\n])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const s of rawSentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if (!current) {
        current = trimmed;
      } else if ((current + ' ' + trimmed).length <= maxLen) {
        current += ' ' + trimmed;
      } else {
        chunks.push(current);
        current = trimmed;
      }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [clean];
  }

  /**
   * Speaks using calibrated On-Device Voice synthesis with character-accurate pitch and rate modulation
   */
  public static speakOffline(text: string, options: VoiceMatchOptions = {}): boolean {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      if (options.onEnd) options.onEnd();
      return false;
    }

    const persona = options.persona || 'MAYRA';
    const lang = options.language || 'en';
    const clean = this.cleanTextForSpeech(text);
    if (!clean) {
      if (options.onEnd) options.onEnd();
      return false;
    }

    try {
      window.speechSynthesis.cancel();
      this.activeUtteranceQueue = [];

      const sentences = this.splitSentences(clean, 200);
      if (sentences.length === 0) {
        if (options.onEnd) options.onEnd();
        return false;
      }

      const matchedVoice = this.findBestVoice(persona, lang);
      let started = false;

      sentences.forEach((sentenceText, idx) => {
        const utterance = new SpeechSynthesisUtterance(sentenceText);
        if (matchedVoice) {
          utterance.voice = matchedVoice;
          utterance.lang = matchedVoice.lang;
        }

        if (persona === 'STONICX') {
          // Charon Persona Tuning: Deep, authoritative, confident baritone
          utterance.pitch = 0.78;
          utterance.rate = 0.96;
          utterance.volume = 1.0;
        } else {
          // Aoede Persona Tuning: Soft, warm, melodic, natural feminine pace
          utterance.pitch = 1.06;
          utterance.rate = 0.98;
          utterance.volume = 1.0;
        }

        if (idx === 0) {
          utterance.onstart = () => {
            if (!started) {
              started = true;
              if (options.onStart) options.onStart();
            }
          };
        }

        if (idx === sentences.length - 1) {
          utterance.onend = () => {
            this.activeUtteranceQueue = [];
            if (options.onEnd) options.onEnd();
          };
          utterance.onerror = () => {
            this.activeUtteranceQueue = [];
            if (options.onEnd) options.onEnd();
          };
        }

        this.activeUtteranceQueue.push(utterance);
        window.speechSynthesis.speak(utterance);
      });

      return true;
    } catch (err) {
      console.warn('[OfflineVoiceMatcher] SpeechSynthesis error:', err);
      if (options.onEnd) options.onEnd();
      return false;
    }
  }

  /**
   * Stop current speech
   */
  public static stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        this.activeUtteranceQueue = [];
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}

// Pre-initialize on load
if (typeof window !== 'undefined') {
  OfflineVoiceMatcher.init();
}
