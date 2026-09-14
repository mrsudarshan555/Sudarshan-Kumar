/**
 * MAYRA Emotional Resonance & Proactive Companionship Engine
 * 
 * Analyzes multi-turn user sentiments, emotional undertones, and conversation history:
 * - Detects feelings: Sadness, Demotivation, Anxiety/Stress, Happiness, Boredom, Curiosity, Goals/Ambitions.
 * - Drives 3D character animations & facial expressions to match user's emotion.
 * - Dynamically curates contextual recommendations and motivation for the card above the chat box.
 * - Detects silence & idle pauses (shant hona) to proactively spark thoughtful conversation,
 *   emotional support, or exciting ideas so the user never feels bored or alone.
 */

import { ChatMessage, CharacterEmotion } from '../../types';

export type UserSentiment = 
  | 'sad'
  | 'demotivated'
  | 'stressed'
  | 'happy'
  | 'bored'
  | 'curious'
  | 'ambitious'
  | 'neutral';

export interface EmpathyRecommendationChip {
  id: string;
  label: string;
  prompt: string;
  iconType: 'heart' | 'flame' | 'sparkles' | 'smile' | 'compass' | 'coffee' | 'bulb' | 'shield';
}

export interface EmpathyState {
  sentiment: UserSentiment;
  emotion: CharacterEmotion;
  intensity: number; // 0.0 to 1.0
  themeTitle: string;
  themeColor: string; // Tailwind color token
  accentGlow: string; // CSS color string for glow
  empathyNote: string;
  comfortingThought: string;
  recommendedChips: EmpathyRecommendationChip[];
  proactiveSuggestion: {
    title: string;
    message: string;
    actionPrompt: string;
  } | null;
  detectedSignals: string[];
}

// Empathy Memory to track emotional trajectory across multiple conversational turns
interface EmpathyMemoryStore {
  lastSentiment: UserSentiment;
  sentimentHistory: UserSentiment[];
  consecutiveSadTurns: number;
  consecutiveDemotivatedTurns: number;
  lastUserInteractionTime: number;
  lastProactiveCheckinTime: number;
  userStruggles: string[];
  userGoals: string[];
}

const memoryStore: EmpathyMemoryStore = {
  lastSentiment: 'neutral',
  sentimentHistory: [],
  consecutiveSadTurns: 0,
  consecutiveDemotivatedTurns: 0,
  lastUserInteractionTime: Date.now(),
  lastProactiveCheckinTime: 0,
  userStruggles: [],
  userGoals: []
};

// Emotional keywords in Hindi/Hinglish & English
const EMOTIONAL_LEXICON = {
  sad: [
    'dukhi', 'udaas', 'udas', 'rona', 'ro raha', 'dil toot', 'dard', 'akela', 'lonely',
    'sad', 'crying', 'cry', 'depressed', 'depression', 'heartbroken', 'hurt', 'pain',
    'bura lag raha', 'man nahi lag raha', 'koi nahi samjhta', 'koi parwah nahi', 'unhappy',
    'miss kar raha', 'grief', 'alone'
  ],
  demotivated: [
    'haar maan', 'haar gaya', 'himmat toot', 'thak gaya', 'kuch nahi ho raha', 'fail ho gaya',
    'demotivated', 'give up', 'giving up', 'loser', 'koshish bekar', 'koi fayda nahi',
    'kuch samajh nahi aa raha', 'kamyab nahi ho paunga', 'mera kuch nahi ho sakta',
    'hopeless', 'exhausted', 'can\'t do it', 'impossible', 'useless', 'har chuka'
  ],
  stressed: [
    'tension', 'stress', 'chinta', 'anxiety', 'anxious', 'scared', 'darr', 'overthinking',
    'dimag kharab', 'pressure', 'exam', 'interview tension', 'ghabrahat', 'panic', 'nervous',
    'pareshan', 'pareshani', 'problem me hoon'
  ],
  happy: [
    'khush', 'khushi', 'kamaal', 'awesome', 'great', 'happy', 'excited', 'party', 'mazedar',
    'pass ho gaya', 'jeet gaya', 'winner', 'celebrate', 'badhiya', 'maza aa gaya', 'shandar',
    'proud', 'success', 'kamyabi'
  ],
  bored: [
    'bore', 'boring', 'bore ho raha', 'kuch karne ko nahi', 'shant', 'chup', 'timepass',
    'kya karun', 'khali baitha', 'nothing to do', 'idle'
  ],
  curious: [
    'seekhna', 'jaanna hai', 'kaise hota hai', 'explain karo', 'kya hota hai', 'curious',
    'interesting', 'why', 'how', 'kuch naya', 'idea', 'creative', 'deep'
  ],
  ambitious: [
    'sapna', 'dream', 'target', 'goal', 'banna hai', 'career', 'future', 'bada karna hai',
    'start karna hai', 'crorepati', 'entrepreneur', 'developer', 'upsc', 'business'
  ]
};

export class MayraEmpathyEngine {
  /**
   * Records user interaction timestamp
   */
  public static recordUserActivity(): void {
    memoryStore.lastUserInteractionTime = Date.now();
  }

  /**
   * Analyzes recent user messages to determine sentiment, emotional intensity,
   * and builds tailored recommendations for the card above the chat box.
   */
  public static evaluateEmpathyState(
    messages: ChatMessage[],
    currentStatus?: string,
    isIdleSilence?: boolean
  ): EmpathyState {
    const userMessages = messages.filter(m => m.sender === 'user').slice(-4);
    const lastUserMsg = userMessages[userMessages.length - 1]?.text?.toLowerCase() || '';
    const allRecentText = userMessages.map(m => m.text.toLowerCase()).join(' ');

    const detectedSignals: string[] = [];
    const sentimentScores: Record<UserSentiment, number> = {
      sad: 0,
      demotivated: 0,
      stressed: 0,
      happy: 0,
      bored: 0,
      curious: 0,
      ambitious: 0,
      neutral: 0
    };

    // Calculate score based on keyword matches with higher weight on the most recent message
    (Object.keys(EMOTIONAL_LEXICON) as Array<keyof typeof EMOTIONAL_LEXICON>).forEach(sentiment => {
      const keywords = EMOTIONAL_LEXICON[sentiment];
      keywords.forEach(kw => {
        if (lastUserMsg.includes(kw)) {
          sentimentScores[sentiment] += 3.0;
          detectedSignals.push(kw);
        } else if (allRecentText.includes(kw)) {
          sentimentScores[sentiment] += 1.2;
          if (!detectedSignals.includes(kw)) detectedSignals.push(kw);
        }
      });
    });

    // Determine leading sentiment
    let primarySentiment: UserSentiment = 'neutral';
    let maxScore = 0;

    for (const s of (Object.keys(sentimentScores) as UserSentiment[])) {
      if (sentimentScores[s] > maxScore) {
        maxScore = sentimentScores[s];
        primarySentiment = s;
      }
    }

    // If no strong emotional signals detected but conversation is ongoing
    if (maxScore < 1.0) {
      if (isIdleSilence) {
        primarySentiment = 'bored';
      } else if (userMessages.length >= 3) {
        primarySentiment = 'curious';
      } else {
        primarySentiment = 'neutral';
      }
    }

    // Update historical memory store
    if (primarySentiment === 'sad') {
      memoryStore.consecutiveSadTurns += 1;
      memoryStore.consecutiveDemotivatedTurns = 0;
    } else if (primarySentiment === 'demotivated') {
      memoryStore.consecutiveDemotivatedTurns += 1;
      memoryStore.consecutiveSadTurns = 0;
    } else {
      memoryStore.consecutiveSadTurns = 0;
      memoryStore.consecutiveDemotivatedTurns = 0;
    }
    memoryStore.lastSentiment = primarySentiment;
    memoryStore.sentimentHistory.push(primarySentiment);
    if (memoryStore.sentimentHistory.length > 10) {
      memoryStore.sentimentHistory.shift();
    }

    // Map sentiment to CharacterEmotion & UI Configuration
    return this.buildStateForSentiment(primarySentiment, maxScore, isIdleSilence, messages.length);
  }

  /**
   * Generates empathetic configuration, card recommendations & proactive prompts
   */
  private static buildStateForSentiment(
    sentiment: UserSentiment,
    score: number,
    isIdleSilence?: boolean,
    totalMessagesCount: number = 0
  ): EmpathyState {
    const intensity = Math.min(1.0, 0.4 + (score * 0.15));

    switch (sentiment) {
      case 'demotivated':
        return {
          sentiment: 'demotivated',
          emotion: 'proud', // Strong, uplifting encouragement posture
          intensity,
          themeTitle: '🔥 Inner Strength & Motivation Booster',
          themeColor: 'amber',
          accentGlow: 'rgba(245, 158, 11, 0.35)',
          empathyNote: 'Haar nahi maanni bhai! Har bada insaan mushkilon se guzar kar hi banta hai.',
          comfortingThought: 'Ek haar ka matlab yeh nahi ki safar khatam ho gaya. Main tumhare sath hoon, ek nayi shuruwat karte hain!',
          recommendedChips: [
            {
              id: 'chip-demo-1',
              label: '🔥 Mujhe motivate karo',
              prompt: 'Bhai mujhe bohot demotivated feel ho raha hai, mujhe thoda motivate karo aur sambhalo.',
              iconType: 'flame'
            },
            {
              id: 'chip-demo-2',
              label: '✨ Naya plan banate hain',
              prompt: 'Chalo milkar ek simple step-by-step plan banate hain taaki main fir se focus kar sakoon.',
              iconType: 'compass'
            },
            {
              id: 'chip-demo-3',
              label: '💪 Meri strength yaad dilao',
              prompt: 'Mayra, mujhe yaad dilao ki main kis cheez me accha hoon aur main haar kyu nahi maan sakta.',
              iconType: 'shield'
            },
            {
              id: 'chip-demo-4',
              label: '🌱 Thoda relax karte hain',
              prompt: 'Thoda dimag shaant karte hain. Koi relaxing baat ya inspiring kahani sunao.',
              iconType: 'coffee'
            }
          ],
          proactiveSuggestion: {
            title: 'Mayra wants to cheer you up...',
            message: 'Bhai, lagta hai thode low feel kar rahe ho. Ek powerful baat bataun jo aapko himmat degi?',
            actionPrompt: 'Mayra, mujhe himmat chahiye. Ek powerful baat batao jo mujhe aage badhne ki taqat de.'
          },
          detectedSignals: ['demotivation', 'need-motivation']
        };

      case 'sad':
        return {
          sentiment: 'sad',
          emotion: 'sad', // Compassionate, soft, empathetic face
          intensity,
          themeTitle: '💙 Emotional Care & Warm Presence',
          themeColor: 'blue',
          accentGlow: 'rgba(59, 130, 246, 0.35)',
          empathyNote: 'Main aapki baat samajh rahi hoon. Jo bhi dil me hai, khulkar kaho — main hamesha yahan hoon.',
          comfortingThought: 'Udaas hona bilkul normal hai. Kabhi-kabhi bas ek saccha sunne wala chahiye hota hai.',
          recommendedChips: [
            {
              id: 'chip-sad-1',
              label: '💙 Dil halka karna hai',
              prompt: 'Mayra, mera man thoda udaas hai. Bas aapse baat karke dil halka karna chahta hoon.',
              iconType: 'heart'
            },
            {
              id: 'chip-sad-2',
              label: '🌸 Ek pyari si baat sunao',
              prompt: 'Mayra, mujhe accha feel karane ke liye koi pyari si baat ya encouraging thought sunao.',
              iconType: 'sparkles'
            },
            {
              id: 'chip-sad-3',
              label: '☕ Thoda dhyan bhatkayen',
              prompt: 'Chalo koi aisi baat karte hain jisse mera mood thoda fresh ho jaye.',
              iconType: 'coffee'
            },
            {
              id: 'chip-sad-4',
              label: '🫂 Reassurance & Support',
              prompt: 'Mujhe bas yeh sunna hai ki sab theek ho jayega. Thoda bharosa do.',
              iconType: 'shield'
            }
          ],
          proactiveSuggestion: {
            title: 'Mayra is right here with you...',
            message: 'Aap thoda shant lag rahe hain... Main hamesha sunne ke liye taiyaar hoon.',
            actionPrompt: 'Mayra, mujhe thoda sambhalo aur batao sab theek ho jayega na?'
          },
          detectedSignals: ['sadness', 'need-comfort']
        };

      case 'stressed':
        return {
          sentiment: 'stressed',
          emotion: 'thinking',
          intensity,
          themeTitle: '🌿 Calm Mind & Stress Reliever',
          themeColor: 'emerald',
          accentGlow: 'rgba(16, 185, 129, 0.35)',
          empathyNote: 'Tension mat lo bhai, har samasya ka hal hota hai. Ek deep breath lete hain.',
          comfortingThought: 'Sab kuch ek sath karne ki zaroorat nahi hai. Ek samay me ek hi kadam kafi hota hai.',
          recommendedChips: [
            {
              id: 'chip-stress-1',
              label: '🌿 Ek deep breath lete hain',
              prompt: 'Mayra, thodi tension ho rahi hai. Ek 1-minute guided calm breathing karwao.',
              iconType: 'coffee'
            },
            {
              id: 'chip-stress-2',
              label: '📋 Step-by-step simplify karo',
              prompt: 'Jo cheez mujhe pareshan kar rahi hai, usko step-by-step simple banao.',
              iconType: 'compass'
            },
            {
              id: 'chip-stress-3',
              label: '🎯 Priority set karte hain',
              prompt: 'Abhi sabse pehle mujhe kis ek cheez par dhyan dena chahiye?',
              iconType: 'bulb'
            }
          ],
          proactiveSuggestion: {
            title: 'Deep Breath Guidance',
            message: 'Stress lene se kuch nahi hoga, chalo isko milkar step-by-step hal karte hain.',
            actionPrompt: 'Mayra, is stress ko door karne ka sabse practical tareeqa batao.'
          },
          detectedSignals: ['stress', 'anxiety']
        };

      case 'happy':
        return {
          sentiment: 'happy',
          emotion: 'excited',
          intensity,
          themeTitle: '🎉 Celebration & Joyful Energy',
          themeColor: 'emerald',
          accentGlow: 'rgba(52, 211, 153, 0.35)',
          empathyNote: 'Aapki khushi dekh kar dil khush ho gaya! Aisi kamyabi roz manayein.',
          comfortingThought: 'Yeh pal aapki mehnat ka nateeja hai. Is khushi ko poora enjoy karo!',
          recommendedChips: [
            {
              id: 'chip-happy-1',
              label: '🎉 Celebration time!',
              prompt: 'Mayra, main bohot khush hoon! Chalo is kamyabi ko celebrate karte hain.',
              iconType: 'sparkles'
            },
            {
              id: 'chip-happy-2',
              label: '🚀 Agla bada target',
              prompt: 'Is positive momentum ke sath hum agla kya kamaal kar sakte hain?',
              iconType: 'flame'
            },
            {
              id: 'chip-happy-3',
              label: '😄 Ek mazedaar joke sunao',
              prompt: 'Mood bohot badhiya hai, koi ek zabardast aur mazedaar joke sunao!',
              iconType: 'smile'
            }
          ],
          proactiveSuggestion: null,
          detectedSignals: ['joy', 'celebration']
        };

      case 'bored':
        return {
          sentiment: 'bored',
          emotion: 'playful',
          intensity,
          themeTitle: '✨ Anti-Boredom & Creative Spark',
          themeColor: 'purple',
          accentGlow: 'rgba(168, 85, 247, 0.35)',
          empathyNote: 'Shanti acchi hai, par bor hona mana hai! Chalo kuch mazedaar karte hain.',
          comfortingThought: 'Duniya me itni rochak cheezein hain — bas ek sawal pucho aur naya safar shuru.',
          recommendedChips: [
            {
              id: 'chip-bore-1',
              label: '🎲 Ek dilchasp sawal pucho',
              prompt: 'Mayra, mujhse koi bohot dilchasp aur sochne par majboor karne wala sawal pucho!',
              iconType: 'bulb'
            },
            {
              id: 'chip-bore-2',
              label: '🧠 Quick fun quiz khele',
              prompt: 'Chalo ek mazedaar 3-questions quiz khelte hain!',
              iconType: 'sparkles'
            },
            {
              id: 'chip-bore-3',
              label: '💡 Ek mind-blowing fact',
              prompt: 'Mujhe universe ya technology ka ek aisa mind-blowing fact batao jo maine pehle kabhi na suna ho.',
              iconType: 'compass'
            },
            {
              id: 'chip-bore-4',
              label: '🚀 Naya skill sikhna',
              prompt: 'Agar mere paas 10 minute hain, toh main konsi nayi rochak cheez seekh sakta hoon?',
              iconType: 'flame'
            }
          ],
          proactiveSuggestion: {
            title: 'Bor feel ho raha hai?',
            message: 'Aap thode shant ho gaye... Ek super interesting baat bataun ya aapse ek sawal puchun?',
            actionPrompt: 'Mayra, haan batao! Koi rochak baat ya sawal pucho.'
          },
          detectedSignals: ['silence', 'boredom']
        };

      case 'ambitious':
        return {
          sentiment: 'ambitious',
          emotion: 'proud',
          intensity,
          themeTitle: '🚀 Ambition & High Achievement',
          themeColor: 'cyan',
          accentGlow: 'rgba(6, 182, 212, 0.35)',
          empathyNote: 'Bada socho aur aage badho! Aapka vision bohot powerful hai.',
          comfortingThought: 'Bade sapne dekhne walon ko hi duniya yaad rakhti hai. Main execution me sath hoon.',
          recommendedChips: [
            {
              id: 'chip-amb-1',
              label: '🚀 Strategy & Roadmap',
              prompt: 'Mere is goal ko achieve karne ka sabse solid 30-day roadmap banao.',
              iconType: 'compass'
            },
            {
              id: 'chip-amb-2',
              label: '💡 Innovation & Next Move',
              prompt: 'Isme aur kya innovative idea add kiya ja sakta hai jo sabko chaunka de?',
              iconType: 'bulb'
            },
            {
              id: 'chip-amb-3',
              label: '🔥 Relentless Execution',
              prompt: 'Daily consistency banaye rakhne ke liye mujhe ek habit rule batao.',
              iconType: 'flame'
            }
          ],
          proactiveSuggestion: null,
          detectedSignals: ['ambition', 'goals']
        };

      case 'curious':
      default:
        // Neutral / Curious state
        const hasConversationHistory = totalMessagesCount > 2;
        return {
          sentiment: 'curious',
          emotion: 'curious',
          intensity: 0.6,
          themeTitle: hasConversationHistory ? '💬 Active Companionship' : '✨ Mayra Neural Companion',
          themeColor: 'purple',
          accentGlow: 'rgba(147, 51, 234, 0.35)',
          empathyNote: 'Main aapki har baat dhyaan se sun rahi hoon. Kuch bhi pucho ya discuss karo.',
          comfortingThought: 'Baat karne se har uljhan aasan ho jaati hai.',
          recommendedChips: [
            {
              id: 'chip-cur-1',
              label: '💡 Ek zabardast idea batao',
              prompt: 'Mujhe koi fresh creative idea batao jisme maza aaye.',
              iconType: 'bulb'
            },
            {
              id: 'chip-cur-2',
              label: '🗣️ Aapse baat karni hai',
              prompt: 'Mayra, aap batao aaj aapke dimag me kya naya chal raha hai?',
              iconType: 'sparkles'
            },
            {
              id: 'chip-cur-3',
              label: '🔥 Aaj ka motivation',
              prompt: 'Aaj ke din ko shandar banane ke liye ek powerful thought do.',
              iconType: 'flame'
            },
            {
              id: 'chip-cur-4',
              label: '📖 Koi kahani sunao',
              prompt: 'Ek choti si inspiring real-life kahani sunao jo dil ko chhu jaye.',
              iconType: 'heart'
            }
          ],
          proactiveSuggestion: hasConversationHistory ? {
            title: 'Continuing our talk...',
            message: 'Waise hum jo baat kar rahe the, uspar ek accha perspective aaya... Sunoge?',
            actionPrompt: 'Haan Mayra, batao kya perspective aaya?'
          } : null,
          detectedSignals: ['curious', 'dialogue']
        };
    }
  }

  /**
   * Checks if user has been quiet for long enough to trigger proactive outreach.
   * e.g. 20-30 seconds of silence after a response.
   */
  public static checkProactiveSilenceTrigger(
    messages: ChatMessage[],
    status: string,
    silenceThresholdSec: number = 22
  ): boolean {
    if (messages.length < 2) return false;
    if (status === 'SPEAKING' || status === 'LISTENING' || status === 'THINKING') return false;

    const now = Date.now();
    const lastMessage = messages[messages.length - 1];

    // Only trigger if last message was from Mayra (meaning user hasn't replied yet)
    if (lastMessage.sender !== 'mayra') return false;

    const silenceSec = (now - lastMessage.timestamp) / 1000;
    const cooldownPassed = (now - memoryStore.lastProactiveCheckinTime) > 60 * 1000; // 60s cooldown

    return silenceSec >= silenceThresholdSec && cooldownPassed;
  }

  /**
   * Marks proactive checkin as delivered to respect cooldown
   */
  public static markProactiveDelivered(): void {
    memoryStore.lastProactiveCheckinTime = Date.now();
  }
}
