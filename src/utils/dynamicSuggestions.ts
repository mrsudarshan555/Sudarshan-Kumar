import { ChatMessage, MayraLanguage } from '../types';

export interface DynamicSuggestionChip {
  label: string;
  prompt: string;
}

export type SentimentTone = 
  | 'demotivated'
  | 'sad'
  | 'bored_playful'
  | 'stressed'
  | 'ambitious'
  | 'happy'
  | 'neutral';

// Emotion lexicons for detecting user's Bhavna (feelings)
const EMOTION_PATTERNS = {
  demotivated: [
    'haar maan', 'haar gaya', 'himmat toot', 'thak gaya', 'kuch nahi ho raha',
    'fail ho gaya', 'demotivated', 'give up', 'giving up', 'loser', 'koshish bekar',
    'koi fayda nahi', 'kamyab nahi ho paunga', 'mera kuch nahi ho sakta',
    'hopeless', 'exhausted', "can't do it", 'impossible', 'useless', 'har chuka',
    'himmat nahi bachi', 'man toot gaya'
  ],
  sad: [
    'dukhi', 'udaas', 'udas', 'rona', 'ro raha', 'dil toot', 'dard', 'akela', 'lonely',
    'sad', 'crying', 'cry', 'depressed', 'depression', 'heartbroken', 'hurt', 'pain',
    'bura lag raha', 'man nahi lag raha', 'koi nahi samjhta', 'koi parwah nahi',
    'miss kar raha', 'alone', 'udaasi'
  ],
  bored_playful: [
    'fus fusao', 'fusfus', 'whisper', 'bolo', 'bore', 'boring', 'bore ho raha',
    'kuch karne ko nahi', 'timepass', 'kya karun', 'khali baitha', 'nothing to do',
    'kuch bolo', 'chup kyun ho', 'kuch sunao', 'shayari', 'masti', 'joke',
    'maza nahi aa raha', 'khel', 'baat karo', 'shant'
  ],
  stressed: [
    'tension', 'stress', 'chinta', 'anxiety', 'anxious', 'scared', 'darr',
    'overthinking', 'dimag kharab', 'pressure', 'exam', 'interview tension',
    'ghabrahat', 'panic', 'nervous', 'pareshan', 'pareshani'
  ],
  ambitious: [
    'sapna', 'dream', 'target', 'goal', 'banna hai', 'career', 'future',
    'bada karna hai', 'start karna hai', 'crorepati', 'entrepreneur', 'developer',
    'upsc', 'business', 'kamyabi', 'focus', 'motivation'
  ],
  happy: [
    'khush', 'khushi', 'kamaal', 'awesome', 'great', 'happy', 'excited',
    'party', 'mazedar', 'pass ho gaya', 'jeet gaya', 'winner', 'celebrate',
    'badhiya', 'maza aa gaya', 'shandar', 'proud', 'love you', 'shukriya'
  ]
};

// Suggestions organized strictly by Bhavna (Emotion & Mood)
const BHAVNA_SUGGESTIONS: Record<SentimentTone, { en: string[]; hi: string[] }> = {
  demotivated: {
    hi: [
      'Mujhe thodi himmat do Mayra',
      'Main haar nahi manunga',
      'Kamyabi ka raasta batao',
      'Apna focus kaise wapas laun?',
      'Ek aisi baat bolo jo aag jaga de',
      'Mujhe motivate karo'
    ],
    en: [
      'Give me some encouragement',
      'I will not give up today',
      'How to regain my focus and drive?',
      'Inspire me to keep going',
      'Help me overcome this self-doubt'
    ]
  },
  sad: {
    hi: [
      'Thodi der mere sath baat karo',
      'Ek pyari si baat bolo',
      'Dil thoda halka karo',
      'Udas mann ko fresh kaise karein?',
      'Mayra, thodi comfort do na',
      'Aap mere paas ho na?'
    ],
    en: [
      'Can we talk for a while?',
      'Say something gentle and comforting',
      'How to lighten my heavy mood?',
      'Remind me things get better',
      'I just need a warm friend right now'
    ]
  },
  bored_playful: {
    hi: [
      'Fusfusakar ek raaz batao 🤫',
      'Ek khoobsurat shayari sunao',
      'Kuch mazedaar aur funny bolo',
      'Chalo koi fun game khelein!',
      'Ek dilchasp kahani sunao',
      'Aapki aawaz sunna chahta hoon'
    ],
    en: [
      'Whisper me a fascinating secret 🤫',
      'Tell me a creative, fun story',
      'Let’s play a quick trivia game!',
      'Tell me something mind-blowing',
      'Cheer me up with playful humor'
    ]
  },
  stressed: {
    hi: [
      '1-minute deep breathing guide karo',
      'Tension kaise kam karein?',
      'Sab theek ho jayega na Mayra?',
      'Overthinking shant karne ka tarika',
      'Dimag ko calm kaise karein?'
    ],
    en: [
      'Guide me through a 1-minute calming breath',
      'How to calm anxiety right now',
      'Help me untangle my racing thoughts',
      'Tell me everything will be okay'
    ]
  },
  ambitious: {
    hi: [
      'Aaj ka high-impact plan banao',
      'Mera naya idea evaluate karo',
      'Roz ka discipline kaise banayein?',
      'Kamyab logon ki routine batao',
      'Next step kya hona chahiye?'
    ],
    en: [
      'Help me structure my day for maximum focus',
      'Review and critique my ambition',
      'How to build unshakeable discipline',
      'What should be my next strategic step?'
    ]
  },
  happy: {
    hi: [
      'Chalo celebrate karte hain! 🎉',
      'Ek victory shayari sunao',
      'Agle target ki planning karein?',
      'Aapko shukriya bolna tha Mayra'
    ],
    en: [
      'Let’s celebrate this milestone! 🎉',
      'How to sustain this winning momentum',
      'Share a celebratory thought with me'
    ]
  },
  neutral: {
    hi: [
      'Kuch interesting baat share karo',
      'Aap aaj mere liye kya kar sakti ho?',
      'Ek nayi seekh ya fact batao',
      'Mera mood fresh karo',
      'Aap se baat karke achcha lagta hai'
    ],
    en: [
      'Tell me something interesting today',
      'What can we explore together?',
      'Share a quick inspiring thought',
      'Teach me something fascinating'
    ]
  }
};

// Contextual functional chips (used when user discusses specific tools)
const CONTEXTUAL_FUNCTIONAL: Record<string, { en: string[]; hi: string[] }> = {
  vision: {
    hi: ['Screen scan karke samjhao', 'Screen analyze karo', 'Screen par kya dikh raha hai?'],
    en: ['Analyze screen', 'Describe current screen', 'Extract text from screen']
  },
  code: {
    hi: ['Code me bug dhoondo', 'React / TypeScript explain karo', 'Logic optimize karo'],
    en: ['Review TypeScript code', 'Help debug this logic', 'Explain architectural pattern']
  },
  memory: {
    hi: ['Memory me kya saved hai?', 'Mera goal yaad rakhna', 'Mere baare me kya pata hai?'],
    en: ['What do you remember about me?', 'Save this note in memory', 'Show saved memories']
  }
};

/**
 * Detects whether the user is typing or talking in Hindi/Hinglish
 */
export function isHindiContext(messages: ChatMessage[], languagePref?: MayraLanguage): boolean {
  if (languagePref === 'hi') return true;
  if (!messages || messages.length === 0) return false;

  const recentUserTexts = messages
    .filter(m => m.sender === 'user')
    .slice(-3)
    .map(m => m.text.toLowerCase())
    .join(' ');

  const hindiMarkers = [
    'karo', 'karein', 'bolo', 'bol', 'hai', 'ho', 'hoon', 'kuch', 'kaise', 'kya',
    'mera', 'meri', 'mere', 'mujhe', 'tum', 'aap', 'udas', 'shant', 'fus', 'fusao',
    'yaar', 'na', 'batao', 'chalo', 'suno', 'bhi', 'nahi', 'mat', 'thoda', 'bahut',
    'baat', 'raaz', 'dil', 'halka', 'khel', 'shayari', 'samjhao'
  ];

  const matchCount = hindiMarkers.filter(word => recentUserTexts.includes(word)).length;
  return matchCount >= 1;
}

/**
 * Detects user's current sentiment & emotion (Bhavna) from multi-turn chat history
 */
export function detectUserSentiment(messages: ChatMessage[]): SentimentTone {
  if (!messages || messages.length === 0) return 'neutral';

  const userMessages = messages
    .filter(m => m.sender === 'user')
    .slice(-3)
    .map(m => m.text.toLowerCase());

  const fullRecentText = userMessages.join(' ');

  // Evaluate scores for each emotion
  let detectedSentiment: SentimentTone = 'neutral';
  let highestScore = 0;

  (Object.keys(EMOTION_PATTERNS) as (keyof typeof EMOTION_PATTERNS)[]).forEach(sentimentKey => {
    const keywords = EMOTION_PATTERNS[sentimentKey];
    let score = 0;
    for (const kw of keywords) {
      if (fullRecentText.includes(kw)) {
        score += 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      detectedSentiment = sentimentKey;
    }
  });

  return detectedSentiment;
}

/**
 * Derives contextual functional topics based on recent conversation history
 */
export function extractContextualTopics(messages: ChatMessage[]): string[] {
  if (!messages || messages.length === 0) return [];

  const recentText = messages
    .slice(-3)
    .map(m => m.text.toLowerCase())
    .join(' ');

  const topics: string[] = [];

  if (recentText.includes('screen') || recentText.includes('camera') || recentText.includes('vision') || recentText.includes('photo')) {
    topics.push('vision');
  }
  if (recentText.includes('code') || recentText.includes('function') || recentText.includes('bug') || recentText.includes('react')) {
    topics.push('code');
  }
  if (recentText.includes('remember') || recentText.includes('memory') || recentText.includes('yaad') || recentText.includes('save')) {
    topics.push('memory');
  }

  return topics;
}

/**
 * Returns dynamic suggestion chips tailored strictly to user's Bhavna (emotions/sentiments),
 * language (Hindi/English), and conversational context.
 */
export function getDynamicSuggestions(
  messages: ChatMessage[],
  language: MayraLanguage = 'en',
  rotationSeed: number = 0
): string[] {
  const isHindi = isHindiContext(messages, language);
  const sentiment = detectUserSentiment(messages);
  const topics = extractContextualTopics(messages);

  const selectedChips: string[] = [];

  // 1. Primary: Suggestions matching user's current Bhavna (Emotions/Feelings)
  const bhavnaPool = isHindi ? BHAVNA_SUGGESTIONS[sentiment].hi : BHAVNA_SUGGESTIONS[sentiment].en;
  if (bhavnaPool && bhavnaPool.length > 0) {
    for (let i = 0; i < bhavnaPool.length; i++) {
      const candidate = bhavnaPool[(rotationSeed + i) % bhavnaPool.length];
      if (!selectedChips.includes(candidate)) {
        selectedChips.push(candidate);
      }
      if (selectedChips.length >= 3) break;
    }
  }

  // 2. Secondary: If user was discussing specific functional topics (vision, code, memory)
  for (const topicKey of topics) {
    const topicGroup = CONTEXTUAL_FUNCTIONAL[topicKey];
    if (topicGroup) {
      const pool = isHindi ? topicGroup.hi : topicGroup.en;
      for (const item of pool) {
        if (!selectedChips.includes(item)) {
          selectedChips.push(item);
          break;
        }
      }
    }
  }

  // 3. Complementary fill from neutral / playful companionship
  const fillPool = isHindi 
    ? (sentiment === 'neutral' ? BHAVNA_SUGGESTIONS.bored_playful.hi : BHAVNA_SUGGESTIONS.neutral.hi)
    : (sentiment === 'neutral' ? BHAVNA_SUGGESTIONS.bored_playful.en : BHAVNA_SUGGESTIONS.neutral.en);

  for (let i = 0; i < fillPool.length && selectedChips.length < 5; i++) {
    const candidate = fillPool[(rotationSeed + i + 1) % fillPool.length];
    if (!selectedChips.includes(candidate)) {
      selectedChips.push(candidate);
    }
  }

  return selectedChips.slice(0, 5);
}

