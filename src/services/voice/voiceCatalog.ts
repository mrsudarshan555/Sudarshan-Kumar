/**
 * Complete Voice Catalog for MAYRA & STONICX
 * 
 * Includes all 16 high-fidelity neural voices with full Gender (Male/Female) classifications,
 * tonal profiles, and MT Manager file references (e.g. maya_Aoede.ogg, friday_Charon.ogg).
 */

export type VoiceGender = 'Female' | 'Male';

export interface VoiceItem {
  id: string;
  name: string;
  gender: VoiceGender;
  tone: string;
  category: string;
  description: string;
  mtManagerMayaFile: string;
  mtManagerFridayFile: string;
  sampleTextEn: string;
  sampleTextHi: string;
  defaultPitch: number;
  defaultSpeed: number;
  badge?: string;
}

export const VOICE_CATALOG: VoiceItem[] = [
  // ================= FEMALE VOICES =================
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    tone: 'Soft, Warm & Melodic',
    category: 'Natural Conversational',
    description: 'Breezy, natural human speech rhythm with gentle warmth and expressive intonation. Default for Mayra.',
    mtManagerMayaFile: 'maya_Aoede.ogg',
    mtManagerFridayFile: 'friday_Aoede.ogg',
    sampleTextEn: 'Hello Zafer! I am ready to help you with anything today.',
    sampleTextHi: 'नमस्ते ज़फ़र! मैं आपकी पूरी सहायता करने के लिए बिल्कुल तैयार हूँ।',
    defaultPitch: 1.0,
    defaultSpeed: 1.0,
    badge: 'Mayra Default'
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    tone: 'Firm, Articulate & Confident',
    category: 'Executive & Professional',
    description: 'Clear, crisp corporate tone with authoritative cadence. Ideal for meetings, research, and planning.',
    mtManagerMayaFile: 'maya_Kore.ogg',
    mtManagerFridayFile: 'friday_Kore.ogg',
    sampleTextEn: 'Systems are fully synchronized. Awaiting your executive directive.',
    sampleTextHi: 'सभी सिस्टम पूरी तरह सिंक हैं। आपके निर्देश का इंतज़ार है।',
    defaultPitch: 1.02,
    defaultSpeed: 1.02
  },
  {
    id: 'Autonoe',
    name: 'Autonoe',
    gender: 'Female',
    tone: 'Bright, Spirited & Lively',
    category: 'Energetic & Cheerful',
    description: 'Upbeat and radiant female voice with energetic delivery and sparkling clarity.',
    mtManagerMayaFile: 'maya_Autonoe.ogg',
    mtManagerFridayFile: 'friday_Autonoe.ogg',
    sampleTextEn: 'Hey there! Let\'s accomplish something amazing together today!',
    sampleTextHi: 'अरे नमस्ते! चलिए आज मिलकर कुछ नया और शानदार करते हैं!',
    defaultPitch: 1.08,
    defaultSpeed: 1.05
  },
  {
    id: 'Callirrhoe',
    name: 'Callirrhoe',
    gender: 'Female',
    tone: 'Gentle, Empathetic & Calming',
    category: 'Supportive & Mindful',
    description: 'Soothing, relaxed voice designed for calm conversations, meditation, and thoughtful guidance.',
    mtManagerMayaFile: 'maya_Callirrhoe.ogg',
    mtManagerFridayFile: 'friday_Callirrhoe.ogg',
    sampleTextEn: 'Take your time. I am here with you whenever you need me.',
    sampleTextHi: 'आराम से सोचिए। जब भी आपको ज़रूरत हो, मैं आपके साथ हूँ।',
    defaultPitch: 0.96,
    defaultSpeed: 0.95
  },
  {
    id: 'Despina',
    name: 'Despina',
    gender: 'Female',
    tone: 'Polished, Smooth & Accurate',
    category: 'Modern Broadcast',
    description: 'Smooth and refined speech with crisp diction. Highly effective for news, documents, and dictation.',
    mtManagerMayaFile: 'maya_Despina.ogg',
    mtManagerFridayFile: 'friday_Despina.ogg',
    sampleTextEn: 'Document analysis is complete. Key highlights have been transcribed.',
    sampleTextHi: 'दस्तावेज़ का विश्लेषण पूरा हो चुका है। मुख्य बिंदु दर्ज कर लिए गए हैं।',
    defaultPitch: 1.0,
    defaultSpeed: 1.03
  },
  {
    id: 'Erinome',
    name: 'Erinome',
    gender: 'Female',
    tone: 'Sweet, Polite & Friendly',
    category: 'Companion & Social',
    description: 'Courteous and affectionate female voice with a warm, caring touch and sweet resonance.',
    mtManagerMayaFile: 'maya_Erinome.ogg',
    mtManagerFridayFile: 'friday_Erinome.ogg',
    sampleTextEn: 'I hope you are having a wonderful day! What would you like to explore?',
    sampleTextHi: 'उम्मीद है आपका दिन बहुत अच्छा बीत रहा होगा! आप क्या जानना चाहते हैं?',
    defaultPitch: 1.06,
    defaultSpeed: 0.98
  },
  {
    id: 'Leda',
    name: 'Leda',
    gender: 'Female',
    tone: 'Graceful, Youthful & Expressive',
    category: 'Dynamic & Expressive',
    description: 'Vibrant and modern voice with subtle dynamic range and engaging conversational pacing.',
    mtManagerMayaFile: 'maya_Leda.ogg',
    mtManagerFridayFile: 'friday_Leda.ogg',
    sampleTextEn: 'All notifications cleared! What project shall we tackle next?',
    sampleTextHi: 'सारे नोटिफिकेशन चेक हो गए! अब हम किस प्रोजेक्ट पर काम करें?',
    defaultPitch: 1.04,
    defaultSpeed: 1.02
  },
  {
    id: 'Pulcherrima',
    name: 'Pulcherrima',
    gender: 'Female',
    tone: 'Radiant, Musical & Cheerful',
    category: 'Creative & Artistic',
    description: 'Bright harmonic timbre with animated inflections. Great for storytelling and creative tasks.',
    mtManagerMayaFile: 'maya_Pulcherrima.ogg',
    mtManagerFridayFile: 'friday_Pulcherrima.ogg',
    sampleTextEn: 'Ideas are flowing! Let\'s turn your thoughts into reality.',
    sampleTextHi: 'नये विचार तैयार हैं! चलिए आपके सपनों को हकीकत में बदलते हैं।',
    defaultPitch: 1.07,
    defaultSpeed: 1.0
  },
  {
    id: 'Vindemiatrix',
    name: 'Vindemiatrix',
    gender: 'Female',
    tone: 'Deep, Cultured & Sophisticated',
    category: 'Academic & Analytical',
    description: 'Mature, thoughtful female voice with gravitas and rich harmonics. Perfect for complex analysis.',
    mtManagerMayaFile: 'maya_Vindemiatrix.ogg',
    mtManagerFridayFile: 'friday_Vindemiatrix.ogg',
    sampleTextEn: 'Comprehensive diagnostics show nominal latency across all sub-agents.',
    sampleTextHi: 'विस्तृत जांच से पता चला है कि सभी मॉड्यूल सही तरीके से काम कर रहे हैं।',
    defaultPitch: 0.94,
    defaultSpeed: 0.98
  },

  // ================= MALE VOICES =================
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    tone: 'Deep, Resonant Baritone',
    category: 'Tactical & Authoritative',
    description: 'Deep, commanding baritone with grounded authority and calm power. Default for Stonicx.',
    mtManagerMayaFile: 'maya_Charon.ogg',
    mtManagerFridayFile: 'friday_Charon.ogg',
    sampleTextEn: 'STONICX neural core online. All autonomous sub-agents on standby.',
    sampleTextHi: 'स्टोनिक्स न्यूरल कोर ऑनलाइन है। सभी सब-एजेंट्स निर्देश के लिए तैयार हैं।',
    defaultPitch: 0.90,
    defaultSpeed: 1.0,
    badge: 'Stonicx Default'
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    tone: 'Crisp, Intense & Sharp',
    category: 'High-Impact Action',
    description: 'High-energy, focused male voice with razor-sharp articulation and commanding presence.',
    mtManagerMayaFile: 'maya_Fenrir.ogg',
    mtManagerFridayFile: 'friday_Fenrir.ogg',
    sampleTextEn: 'Target locked. Compiling automated task workflow now.',
    sampleTextHi: 'टारगेट लॉक हो गया है। ऑटोमेटेड टास्क तुरंत शुरू किया जा रहा है।',
    defaultPitch: 0.88,
    defaultSpeed: 1.05
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    tone: 'Playful, Quick & Dynamic',
    category: 'Conversational & Casual',
    description: 'Nimble and witty male voice with swift cadence and entertaining personality.',
    mtManagerMayaFile: 'maya_Puck.ogg',
    mtManagerFridayFile: 'friday_Puck.ogg',
    sampleTextEn: 'On it! Give me one second and consider it done.',
    sampleTextHi: 'बस एक सेकंड दीजिए, आपका काम अभी पूरा हो जाएगा।',
    defaultPitch: 1.05,
    defaultSpeed: 1.06
  },
  {
    id: 'Gacrux',
    name: 'Gacrux',
    gender: 'Male',
    tone: 'Strong, Grounded & Resolute',
    category: 'Engineering & Industrial',
    description: 'Solid, reliable male voice with deliberate cadence and trustworthy depth.',
    mtManagerMayaFile: 'maya_Gacrux.ogg',
    mtManagerFridayFile: 'friday_Gacrux.ogg',
    sampleTextEn: 'Codebase builds cleanly. All unit benchmarks passing.',
    sampleTextHi: 'कोडबेस सही तरीके से तैयार है। सभी टेस्ट सफल रहे।',
    defaultPitch: 0.92,
    defaultSpeed: 0.98
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Male',
    tone: 'Smooth, Conversational & Warm',
    category: 'Friendly Modern Male',
    description: 'Natural, warm male voice with relaxed pacing and friendly, approachable delivery.',
    mtManagerMayaFile: 'maya_Zephyr.ogg',
    mtManagerFridayFile: 'friday_Zephyr.ogg',
    sampleTextEn: 'Good to see you! What are we working on right now?',
    sampleTextHi: 'नमस्ते! बताइए, आज हम किस चीज़ पर काम कर रहे हैं?',
    defaultPitch: 0.98,
    defaultSpeed: 1.0
  },
  {
    id: 'Sulafat',
    name: 'Sulafat',
    gender: 'Male',
    tone: 'Calm, Wise & Measured',
    category: 'Philosophical & Strategic',
    description: 'Measured, thoughtful male voice that exudes maturity, wisdom, and strategic calm.',
    mtManagerMayaFile: 'maya_Sulafat.ogg',
    mtManagerFridayFile: 'friday_Sulafat.ogg',
    sampleTextEn: 'Analyzing historical context to optimize our next move.',
    sampleTextHi: 'पुराने रिकॉर्ड का विश्लेषण करके सही रणनीति बनाई जा रही है।',
    defaultPitch: 0.93,
    defaultSpeed: 0.96
  },
  {
    id: 'Laomedeia',
    name: 'Laomedeia',
    gender: 'Male',
    tone: 'Modern, Clear & Upbeat',
    category: 'Digital Native Tech',
    description: 'Youthful and energetic male tone with crisp tech cadence and sharp focus.',
    mtManagerMayaFile: 'maya_Laomedeia.ogg',
    mtManagerFridayFile: 'friday_Laomedeia.ogg',
    sampleTextEn: 'Cloud pipelines operational. Ready to dispatch commands.',
    sampleTextHi: 'क्लाउड पाइपलाइन सक्रिय है। कमांड चलाने के लिए तैयार।',
    defaultPitch: 1.02,
    defaultSpeed: 1.04
  }
];

export class VoiceCatalogManager {
  private static instance: VoiceCatalogManager | null = null;

  public static getInstance(): VoiceCatalogManager {
    if (!this.instance) {
      this.instance = new VoiceCatalogManager();
    }
    return this.instance;
  }

  public getAllVoices(): VoiceItem[] {
    return VOICE_CATALOG;
  }

  public getVoicesByGender(gender: VoiceGender): VoiceItem[] {
    return VOICE_CATALOG.filter((v) => v.gender === gender);
  }

  public getVoiceById(id: string): VoiceItem | undefined {
    return VOICE_CATALOG.find((v) => v.id.toLowerCase() === id.toLowerCase());
  }

  public getMayraDefaultVoice(): VoiceItem {
    return VOICE_CATALOG.find((v) => v.id === 'Aoede') || VOICE_CATALOG[0];
  }

  public getStonicxDefaultVoice(): VoiceItem {
    return VOICE_CATALOG.find((v) => v.id === 'Charon') || VOICE_CATALOG[9];
  }

  public getResolvedVoiceName(assistant: 'mayra' | 'stonicx', preferredVoice?: string): string {
    if (preferredVoice) {
      const match = this.getVoiceById(preferredVoice);
      if (match) return match.id;
    }
    return assistant === 'stonicx' ? 'Charon' : 'Aoede';
  }
}
