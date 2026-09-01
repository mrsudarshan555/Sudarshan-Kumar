/**
 * Phase 1: Regional Language & Multi-Voice Engine for STONICX
 * 
 * Supports Features:
 * - 20: Multi-Voice Selection (Aoede, Charon, Fenrir, Puck, Kore, Zephyr)
 * - 21: Multilingual Support: Hindi (hi-IN)
 * - 22: Multilingual Support: Hinglish (en-IN)
 * - 23: Regional Language: Bhojpuri (bho-IN)
 * - 24: Regional Language: Haryanvi (bgc-IN)
 * - 25: Regional Language: Rajasthani (raj-IN)
 * - 26: Regional Language: Punjabi (pa-IN)
 * - 27: Regional Language: Bangla (bn-IN)
 * - 28: Regional Language: Assamese (as-IN)
 * - 29: Regional Language: Nepali (ne-NP)
 * - 30: Regional Languages: South Indian (ta-IN Tamil, te-IN Telugu, kn-IN Kannada, ml-IN Malayalam)
 * - 31: Regional Languages: Western Indian (mr-IN Marathi, gu-IN Gujarati)
 */

export interface RegionalLanguageConfig {
  id: string;
  code: string;
  nativeName: string;
  englishName: string;
  region: 'North' | 'South' | 'East' | 'West' | 'National';
  sampleGreeting: string;
  voicePitchMultiplier: number;
  speechRateMultiplier: number;
}

export const REGIONAL_LANGUAGES: RegionalLanguageConfig[] = [
  {
    id: 'hinglish',
    code: 'en-IN',
    nativeName: 'हिंग्लिश (Hinglish)',
    englishName: 'English (India)',
    region: 'National',
    sampleGreeting: 'Hello Boss! STONICX system online hai, bataiye kya help chahiye?',
    voicePitchMultiplier: 1.0,
    speechRateMultiplier: 1.0
  },
  {
    id: 'hindi',
    code: 'hi-IN',
    nativeName: 'हिन्दी (Hindi)',
    englishName: 'Hindi',
    region: 'National',
    sampleGreeting: 'नमस्ते! मैं स्टोनिक्स हूँ। आज आपकी क्या सहायता करूँ?',
    voicePitchMultiplier: 1.05,
    speechRateMultiplier: 0.98
  },
  {
    id: 'bhojpuri',
    code: 'bho-IN',
    nativeName: 'भोजपुरी (Bhojpuri)',
    englishName: 'Bhojpuri',
    region: 'North',
    sampleGreeting: 'प्रणाम भैया! स्टोनिक्स हाजिर बा, का हुकुम बा रउआ खातिर?',
    voicePitchMultiplier: 1.1,
    speechRateMultiplier: 1.05
  },
  {
    id: 'haryanvi',
    code: 'bgc-IN',
    nativeName: 'हरियाणवी (Haryanvi)',
    englishName: 'Haryanvi',
    region: 'North',
    sampleGreeting: 'राम राम भाई! स्टोनिक्स तैयार सै, बता के काम सै?',
    voicePitchMultiplier: 1.15,
    speechRateMultiplier: 1.1
  },
  {
    id: 'punjabi',
    code: 'pa-IN',
    nativeName: 'ਪੰਜਾਬੀ (Punjabi)',
    englishName: 'Punjabi',
    region: 'North',
    sampleGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਸਟੋਨਿਕਸ ਹਾਜ਼ਰ ਹੈ, ਦੱਸੋ ਕੀ ਸੇਵਾ ਕਰੀਏ?',
    voicePitchMultiplier: 1.05,
    speechRateMultiplier: 1.02
  },
  {
    id: 'rajasthani',
    code: 'raj-IN',
    nativeName: 'राजस्थानी (Rajasthani)',
    englishName: 'Rajasthani',
    region: 'North',
    sampleGreeting: 'खम्मा घणी सा! स्टोनिक्स तैयार है, हुकुम करो सा!',
    voicePitchMultiplier: 1.08,
    speechRateMultiplier: 0.95
  },
  {
    id: 'bangla',
    code: 'bn-IN',
    nativeName: 'বাংলা (Bangla)',
    englishName: 'Bengali',
    region: 'East',
    sampleGreeting: 'নমস্কার! আমি স্টনিক্স, বলুন আপনাকে কীভাবে সাহায্য করতে পারি?',
    voicePitchMultiplier: 1.0,
    speechRateMultiplier: 0.98
  },
  {
    id: 'assamese',
    code: 'as-IN',
    nativeName: 'অসমীয়া (Assamese)',
    englishName: 'Assamese',
    region: 'East',
    sampleGreeting: 'নমস্কাৰ! মই ষ্টনিক্স, আপোনাক কেনেকৈ সহায় কৰিব পাৰো?',
    voicePitchMultiplier: 1.02,
    speechRateMultiplier: 0.96
  },
  {
    id: 'nepali',
    code: 'ne-NP',
    nativeName: 'नेपाली (Nepali)',
    englishName: 'Nepali',
    region: 'North',
    sampleGreeting: 'नमस्ते! म स्टोनिक्स हुँ, हजुरलाई कसरी सहयोग गर्न सक्छु?',
    voicePitchMultiplier: 1.04,
    speechRateMultiplier: 0.98
  },
  {
    id: 'marathi',
    code: 'mr-IN',
    nativeName: 'मराठी (Marathi)',
    englishName: 'Marathi',
    region: 'West',
    sampleGreeting: 'नमस्कार! मी स्टोनिक्स आहे, मी आपली काय मदत करू शकतो?',
    voicePitchMultiplier: 1.02,
    speechRateMultiplier: 1.0
  },
  {
    id: 'gujarati',
    code: 'gu-IN',
    nativeName: 'ગુજરાતી (Gujarati)',
    englishName: 'Gujarati',
    region: 'West',
    sampleGreeting: 'નમસ્તે! હું સ્ટોનિક્સ છું, બોલો શું મદદ કરું?',
    voicePitchMultiplier: 1.05,
    speechRateMultiplier: 1.02
  },
  {
    id: 'tamil',
    code: 'ta-IN',
    nativeName: 'தமிழ் (Tamil)',
    englishName: 'Tamil',
    region: 'South',
    sampleGreeting: 'வணக்கம்! நான் ஸ்டோனிக்ஸ், உங்களுக்கு என்ன உதவி வேண்டும்?',
    voicePitchMultiplier: 1.0,
    speechRateMultiplier: 1.02
  },
  {
    id: 'telugu',
    code: 'te-IN',
    nativeName: 'తెలుగు (Telugu)',
    englishName: 'Telugu',
    region: 'South',
    sampleGreeting: 'నమస్కారం! నేను స్టోనిక్స్, మీకు ఎలా సహాయం చేయగలను?',
    voicePitchMultiplier: 1.02,
    speechRateMultiplier: 1.0
  },
  {
    id: 'kannada',
    code: 'kn-IN',
    nativeName: 'ಕನ್ನಡ (Kannada)',
    englishName: 'Kannada',
    region: 'South',
    sampleGreeting: 'ನಮಸ್ಕಾರ! ನಾನು ಸ್ಟೋನಿಕ್ಸ್, ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    voicePitchMultiplier: 1.0,
    speechRateMultiplier: 1.0
  },
  {
    id: 'malayalam',
    code: 'ml-IN',
    nativeName: 'മലയാളം (Malayalam)',
    englishName: 'Malayalam',
    region: 'South',
    sampleGreeting: 'നമസ്കാരം! ഞാൻ സ്റ്റോണിക്സ്, നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?',
    voicePitchMultiplier: 1.0,
    speechRateMultiplier: 0.98
  }
];

export class RegionalLanguageAudioEngine {
  private static instance: RegionalLanguageAudioEngine | null = null;
  private currentLanguageId: string = 'hinglish';

  private constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stonicx_regional_lang');
      if (saved) this.currentLanguageId = saved;
    }
  }

  public static getInstance(): RegionalLanguageAudioEngine {
    if (!this.instance) {
      this.instance = new RegionalLanguageAudioEngine();
    }
    return this.instance;
  }

  public getSelectedLanguage(): RegionalLanguageConfig {
    return REGIONAL_LANGUAGES.find(l => l.id === this.currentLanguageId) || REGIONAL_LANGUAGES[0];
  }

  public setLanguage(langId: string): void {
    const found = REGIONAL_LANGUAGES.find(l => l.id === langId);
    if (found) {
      this.currentLanguageId = langId;
      if (typeof window !== 'undefined') {
        localStorage.setItem('stonicx_regional_lang', langId);
      }
    }
  }

  public getAllLanguages(): RegionalLanguageConfig[] {
    return REGIONAL_LANGUAGES;
  }
}
