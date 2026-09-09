/**
 * MAYRA Self-Aware Capability Registry & Conversational Awareness Engine
 * 
 * Defines ONLY features genuinely implemented in the runtime:
 * - Voice Input (Web Speech API & 16kHz PCM audio stream)
 * - Voice Output (Gemini Aoede/Charon 24kHz neural audio + browser fallback)
 * - Sentence-level Streaming (SSE boundary detection for ~1s time-to-speech)
 * - Push-to-Talk (Hold Center Orb / Mic >260ms or Spacebar with input box protection)
 * - Hands-Free Continuous Conversation (1.1s silence detection turn loop)
 * - Interruption / Barge-in (Immediate cancellation of active TTS audio playback)
 * - 3D Character Avatar (Three.js real-time mesh with viseme lipsync) & 2D Frosted Glow Orb
 * - Memory Vault (Automatic entity/preference extraction, explicit save/search/delete, on-demand context injection)
 * - Multi-Turn Context Window (Bounded recent history turns for conversational follow-ups)
 * - Multimodal CameraX Scanner (WebRTC video viewfinder, document shutter, Gemini vision analysis)
 * - In-App Actions & Navigation (Voice control of Home, Scan, Memories, Chat tabs, Settings/Permissions)
 * - Autonomous Agent V1 Tools (web_search, search_memory, get_device_status, open_app, read_notification, send_sms, send_whatsapp_message, make_call)
 * - Creator Identity (Created by Zafer, partnered with STONICX autonomous silicon brain)
 */

export type SelfAwarenessIntent =
  | 'SELF_INTRO'
  | 'CAPABILITIES'
  | 'SUPERPOWERS'
  | 'ACTIONS'
  | 'VOICE'
  | 'MEMORY'
  | 'VISION_CAMERA'
  | 'TOOLS'
  | 'CREATOR'
  | 'FULL_AGENT_OVERVIEW';

export interface RuntimeCapabilityItem {
  id: string;
  name: string;
  category: 'voice' | 'memory' | 'vision' | 'actions' | 'tools' | 'interface' | 'identity';
  summaryEn: string;
  summaryHi: string;
  concreteExampleEn: string;
  concreteExampleHi: string;
}

export const MAYRA_RUNTIME_CAPABILITIES: Record<string, RuntimeCapabilityItem> = {
  identity: {
    id: 'identity',
    name: 'Creator & Identity',
    category: 'identity',
    summaryEn: 'MAYRA is an advanced personal Android AI companion created by Zafer, designed with a proactive voice-first and screen-first mobile architecture.',
    summaryHi: 'MAYRA ek advanced personal Android AI companion hai jise Zafer ne banaya hai, jo voice-first aur screen-first mobile experience ke liye designed hai.',
    concreteExampleEn: 'Created by Zafer to work as your proactive daily companion and partnered with STONICX for complex autonomous computing.',
    concreteExampleHi: 'Zafer dwara nirmit ek proactive daily companion jo complex computing ke liye STONICX ke saath partner karti hai.'
  },
  voicePtt: {
    id: 'voicePtt',
    name: 'Push-to-Talk (PTT)',
    category: 'voice',
    summaryEn: 'Hold the Center Voice Orb or Mic button for >260ms, or hold the Spacebar key on desktop, to speak without silence timeouts. Releasing immediately submits the turn.',
    summaryHi: 'Center Voice Orb ya Mic button ko 260ms se zyada hold karke rakhein, ya desktop par Spacebar hold karein. Silence timer band rehta hai aur release karte hi turn submit ho jata hai.',
    concreteExampleEn: 'In a noisy room or when taking pauses to think, hold Spacebar or the Orb, speak at your own pace, and release when done.',
    concreteExampleHi: 'Shor-sharabe mein ya sochte waqt Spacebar ya Orb hold karke aaram se bolein, chhodte hi message turant process ho jayega.'
  },
  voiceHandsFree: {
    id: 'voiceHandsFree',
    name: 'Hands-Free Continuous Listening',
    category: 'voice',
    summaryEn: 'A single quick tap on the Center Orb toggles hands-free continuous conversation mode, using a 1.1s natural silence detector to complete conversational turns.',
    summaryHi: 'Center Orb par ek quick tap se hands-free mode on ho jata hai, jisme 1.1 second ke natural silence ke baad turn automatically submit ho jati hai.',
    concreteExampleEn: 'Tap the Orb once and set your phone on the desk to have a continuous back-and-forth conversation without touching the screen.',
    concreteExampleHi: 'Orb par ek baar tap karke phone samne rakh dein aur bina screen chuye natural back-and-forth baat karein.'
  },
  voiceBargeIn: {
    id: 'voiceBargeIn',
    name: 'Real-Time Interruption (Barge-in)',
    category: 'voice',
    summaryEn: 'If MAYRA is speaking and you start talking or tap the Orb/Spacebar, the active speech audio stops immediately and the queue is flushed so she listens to you instantly.',
    summaryHi: 'Agar MAYRA bol rahi hai aur aap bolna shuru karte hain ya Orb/Spacebar dabate hain, to audio playback turant ruk jata hai aur MAYRA seedhe aapko sunne lagti hai.',
    concreteExampleEn: "If I'm reading a long answer and you want to ask something else, just interrupt out loud or press the button and I'll cut off immediately.",
    concreteExampleHi: 'Agar main lamba answer de rahi hoon aur aapko beech mein kuch aur puchna hai, to aap seedhe bol sakte hain — main turant chup ho kar aapko sunungi.'
  },
  voiceSentenceStreaming: {
    id: 'voiceSentenceStreaming',
    name: 'Sentence-Level Audio Streaming',
    category: 'voice',
    summaryEn: 'Responses are split into natural sentences on the fly and streamed via Server-Sent Events with neural audio, reducing time-to-first-spoken-word to ~1 second.',
    summaryHi: 'Pura response generate hone ka wait karne ke bajay pehla sentence bante hi neural audio synthesize hokar stream ho jata hai, jisse latency ~1 second rehti hai.',
    concreteExampleEn: 'You hear me begin speaking almost immediately, while later parts of the answer continue to generate seamlessly in the background.',
    concreteExampleHi: 'Aapko pehla sentence lagbhag 1 second mein sunai dene lagta hai, jabki baaki answer background mein generate hota rehta hai.'
  },
  memoryVault: {
    id: 'memoryVault',
    name: 'Memory Vault Knowledge Base',
    category: 'memory',
    summaryEn: 'A structured persistent memory store that automatically extracts personal facts and preferences from conversation, supports explicit "Save to memory" commands, and provides a dedicated UI to view, pin, search, and delete entries.',
    summaryHi: 'Ek structured persistent Memory Vault jo baat-cheet se aapka naam aur preferences automatically save karta hai, "Save in memory" commands manta hai, aur dedicated screen par search aur manage karne deta hai.',
    concreteExampleEn: 'Say "Save in memory: My flight is on Friday at 6 PM" or simply mention "My name is Zafer", and it is preserved in your Memory Vault for future turns.',
    concreteExampleHi: '"Memory mein save karo ki meri meeting shaam 5 baje hai" bolein ya aam baat mein batayein, wo Vault mein store hokar aage ke sawalon mein yaad rahega.'
  },
  multiTurnContext: {
    id: 'multiTurnContext',
    name: 'Bounded Multi-Turn Context',
    category: 'memory',
    summaryEn: 'Maintains recent conversation history across turns so you can ask natural follow-ups without repeating context.',
    summaryHi: 'Haal hi ki conversation history ko yaad rakhti hai taaki aap "aur batao", "kaise?", ya "pehla wala" jaise natural follow-up sawal puch sakein.',
    concreteExampleEn: 'Ask "What is quantum computing?" and then follow up with "Can you explain that to a 10-year old?" seamlessly.',
    concreteExampleHi: 'Pehle puchein "Vitamins ke fayde kya hain?" aur agle turn mein seedhe kahein "Inhe daily routine mein kaise shamil karein?".'
  },
  cameraVision: {
    id: 'cameraVision',
    name: 'CameraX Vision & Document Scanner',
    category: 'vision',
    summaryEn: 'A dedicated Scanner screen with live device camera viewfinder and shutter to capture documents, receipts, whiteboards, and real-world scenes for multimodal Gemini analysis.',
    summaryHi: 'Live camera viewfinder aur shutter wala dedicated Scanner screen jo documents, receipts, objects aur real-world scenes ko scan karke multimodal vision se analyze karta hai.',
    concreteExampleEn: 'Say "Open camera", point at a printed page or product label, snap the shutter, and ask "Read the key points on this page" or "Explain this diagram".',
    concreteExampleHi: '"Camera kholo" bolein, document ya kisi cheez par point karein, photo capture karein aur puchein "Is page par kya likha hai samjhao".'
  },
  appActions: {
    id: 'appActions',
    name: 'In-App Navigation & Device Actions',
    category: 'actions',
    summaryEn: 'Direct voice control to switch between Home, Scanner, Memories Vault, and Chat tabs, open Android Permissions, clear chat, and initiate WhatsApp messages or Phone calls with fuzzy contact matching.',
    summaryHi: 'Awaaz se tabs (Home, Scanner, Memories, Chat) badalna, Permissions manager kholna, chat clear karna, aur fuzzy matching ke saath WhatsApp message ya Phone call initiate karna.',
    concreteExampleEn: 'Say "Open memories", "Take a photo", "Open permissions", or "Message Mom on WhatsApp".',
    concreteExampleHi: '"Memories kholo", "Camera scanner par jao", "Settings dikhao", ya "Papa ko WhatsApp message bhejo" jaise voice commands dena.'
  },
  avatarVisualizer: {
    id: 'avatarVisualizer',
    name: '3D Interactive Avatar & Frosted Soundwave Orb',
    category: 'interface',
    summaryEn: 'Real-time Three.js 3D character with animated phoneme viseme lip-sync matching spoken audio, alongside a responsive frosted glow soundwave orb reflecting conversational states.',
    summaryHi: 'Three.js powered 3D character jo bolte waqt audio ke saath lipsync karta hai, aur responsive frosted soundwave orb jo states (READY, LISTENING, THINKING, SPEAKING) dikhata hai.',
    concreteExampleEn: 'Watch the 3D character lip-sync smoothly to speech phonemes or switch to the glowing orb that pulses with the audio waveform.',
    concreteExampleHi: 'Awaaz ke sath 3D character ko bolte hue dekhein ya audio wave ke sath glow karne wale orb ka visual feedback payein.'
  },
  agentTools: {
    id: 'agentTools',
    name: 'Autonomous Agent V1 Tools & Web Search',
    category: 'tools',
    summaryEn: 'Autonomous tool calling matrix including real-time web search for technical documentation, memory querying, device status checks, app launching, and confirmed SMS/WhatsApp dispatching.',
    summaryHi: 'Autonomous tools jaise real-time web search, Memory Vault queries, device battery/network status, app opening, aur user confirmation ke saath SMS/WhatsApp actions.',
    concreteExampleEn: 'Ask for up-to-date technical documentation via web search, or have the agent look up a saved note and prepare a confirmation card to send a message.',
    concreteExampleHi: 'Internet se kisi topic ki latest research nikalwana ya saved contact dhoondh kar message bhejne ka confirmation card taiyar karwana.'
  }
};

/**
 * Detects whether a message is asking about MAYRA herself, and classifies the specific intent.
 */
export function detectSelfAwarenessIntent(message: string): SelfAwarenessIntent | null {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase().trim();

  // 1. CREATOR / ORIGIN
  if (
    lower.includes('who created you') ||
    lower.includes('who made you') ||
    lower.includes('who is your creator') ||
    lower.includes('who is your developer') ||
    lower.includes('who built you') ||
    lower.includes('tumhe kisne banaya') ||
    lower.includes('aapko kisne banaya') ||
    lower.includes('kisne banaya') ||
    lower.includes('kisne develop kiya')
  ) {
    return 'CREATOR';
  }

  // 2. VOICE SPECIFIC
  if (
    lower.includes('voice kaise kaam karti') ||
    lower.includes('voice system kaise') ||
    lower.includes('tumhare paas voice kaise') ||
    lower.includes('how does your voice work') ||
    lower.includes('tell me about your voice') ||
    lower.includes('voice capabilities') ||
    lower.includes('ptt kaise') ||
    lower.includes('push to talk kaise') ||
    lower.includes('push-to-talk kaise') ||
    lower.includes('how does push to talk work') ||
    lower.includes('how does ptt work') ||
    lower.includes('hands-free kaise') ||
    lower.includes('hands free kaise') ||
    lower.includes('how does hands free work') ||
    lower.includes('interruption kaise') ||
    lower.includes('barge in kya') ||
    lower.includes('awaaz kaise kaam')
  ) {
    return 'VOICE';
  }

  // 3. MEMORY SPECIFIC
  if (
    lower.includes('tumhari memory kya') ||
    lower.includes('memory kya kar sakti') ||
    lower.includes('memory kaise kaam karti') ||
    lower.includes('how does your memory work') ||
    lower.includes('tell me about your memory') ||
    lower.includes('memory system ke baare') ||
    lower.includes('memory vault kya hai') ||
    lower.includes('what can your memory do') ||
    lower.includes('do you remember things') ||
    lower.includes('tum kya yaad rakh sakti ho') ||
    lower.includes('yadash kaise kaam')
  ) {
    return 'MEMORY';
  }

  // 4. VISION / CAMERA SPECIFIC
  if (
    lower.includes('camera scanner kya kar sakta') ||
    lower.includes('camera kaise kaam karta') ||
    lower.includes('scanner kya kar sakta') ||
    lower.includes('how does your camera work') ||
    lower.includes('how does your scanner work') ||
    lower.includes('vision capabilities') ||
    lower.includes('vision kaise kaam') ||
    lower.includes('document scan kaise') ||
    lower.includes('photo kaise analyze')
  ) {
    return 'VISION_CAMERA';
  }

  // 5. TOOLS SPECIFIC
  if (
    lower.includes('tumhare paas kya tools hain') ||
    lower.includes('tumhare tools kya hain') ||
    lower.includes('what tools do you have') ||
    lower.includes('what tools can you use') ||
    lower.includes('autonomous tools kya') ||
    lower.includes('tools ke baare mein batao') ||
    lower.includes('which tools are available')
  ) {
    return 'TOOLS';
  }

  // 6. ACTIONS (What can I have you do / What actions can you perform)
  if (
    lower.includes('main tumse kya kya karwa sakta hoon') ||
    lower.includes('main tumse kya karwa sakta hoon') ||
    lower.includes('tumse kya kya karwa sakte hain') ||
    lower.includes('what can i have you do') ||
    lower.includes('what can i ask you to do') ||
    lower.includes('what can you do for me') ||
    lower.includes('tum kya actions le sakti ho') ||
    lower.includes('what actions can you take') ||
    lower.includes('tum kya operate kar sakti ho') ||
    lower.includes('main aap se kya kya karwa sakta')
  ) {
    return 'ACTIONS';
  }

  // 7. SUPERPOWERS / PERSONALITY (What makes you special)
  if (
    lower.includes('apni khasiyat batao') ||
    lower.includes('tumhari khasiyat kya') ||
    lower.includes('what are your superpowers') ||
    lower.includes('apni superpowers batao') ||
    lower.includes('tumhe kya khaas banata') ||
    lower.includes('what makes you special') ||
    lower.includes('what makes you unique') ||
    lower.includes('tumhari special capabilities')
  ) {
    return 'SUPERPOWERS';
  }

  // 8. FULL AGENT OVERVIEW / WHAT DO I GET
  if (
    lower.includes('mayra mein kya kya hai') ||
    lower.includes('what do i get when i install this') ||
    lower.includes('what is included in mayra') ||
    lower.includes('full agent overview') ||
    lower.includes('complete overview do') ||
    lower.includes('pura system samjhao') ||
    lower.includes('tell me everything you have') ||
    lower.includes('overall architecture batao')
  ) {
    return 'FULL_AGENT_OVERVIEW';
  }

  // 9. CAPABILITIES GENERAL
  if (
    lower.includes('tum kya kya kar sakti ho') ||
    lower.includes('tum kya kar sakti ho') ||
    lower.includes('kya kya kar sakti ho') ||
    lower.includes('what can you do') ||
    lower.includes('what are your capabilities') ||
    lower.includes('tumhare paas kya capabilities hain') ||
    lower.includes('tumhare features kya hain') ||
    lower.includes('what can this agent actually do') ||
    lower.includes('what are you capable of') ||
    lower.includes('apni capabilities batao') ||
    lower.includes('capabilities batao')
  ) {
    return 'CAPABILITIES';
  }

  // 10. SELF INTRODUCTION GENERAL
  if (
    lower.includes('apne baare mein batao') ||
    lower.includes('tell me about yourself') ||
    lower.includes('tell them a little bit about yourself') ||
    lower.includes('who are you') ||
    lower.includes('tum kaun ho') ||
    lower.includes('apna parichay do') ||
    lower.includes('apna intro do') ||
    lower.includes('introduce yourself') ||
    lower === 'intro' ||
    lower === 'who are u'
  ) {
    return 'SELF_INTRO';
  }

  return null;
}

/**
 * Generates a rich, natural, grounded conversational response for self-awareness queries.
 * Written with the same depth, confidence, and concrete detail seen in Jarvis,
 * strictly bounded by the actual runtime implementation.
 */
export function generateSelfAwarenessResponse(options: {
  intent: SelfAwarenessIntent;
  language?: 'en' | 'hi';
  userName?: string;
}): string {
  const { intent, language = 'hi', userName = 'Zafer' } = options;
  const isHindi = language === 'hi';

  switch (intent) {
    case 'SELF_INTRO': {
      if (isHindi) {
        return `Main MAYRA hoon — Zafer dwara banayi gayi ek personal Android AI companion aur assistant.

Main sirf ek aam chatbot nahi hoon jo text par jawab de; mujhe ek voice-first aur screen-first personal agent ke roop mein craft kiya gaya hai:

Pehle, meri voice capability: Aap mujhse seedhe awaaz mein baat kar sakte hain. Main Push-to-Talk aur hands-free continuous listening dono support karti hoon. Agar main bol rahi hoon aur aap mujhe beech mein tokte hain, to main turant ruk kar aapki baat sunne lagti hoon. Saath hi sentence-level streaming ki wajah se pehla sentence lagbhag 1 second mein bolna shuru kar deti hoon.

Doosra, meri Memory Vault: Main aapke baare mein important facts, preferences aur personal notes yaad rakhti hoon. Chahe aap conversation ke dauran batayein ya 'Save to memory' bolein, wo mere knowledge base mein persist rehta hai aur aage ke turns mein context ke saath use hota hai.

Teesra, Visual Presence aur Scanner: Mere paas 3D animated character hai jo bolte waqt phoneme lipsync karta hai. Saath hi ek dedicated CameraX Scanner hai jisse aap documents, receipts ya surroundings ki photo capture karke mujhse analyze karwa sakte hain.

Chautha, In-App Actions aur Autonomous Tools: Main aapke phone interface mein tabs navigate kar sakti hoon (jaise camera kholna ya memories dekhna), settings manage kar sakti hoon, web search kar sakti hoon, aur complex codebase workflows ke liye STONICX ke saath partner karti hoon.

Aap mujhse normal baatein kar sakte hain, phone manage karwa sakte hain, ya seedhe awaaz se koi bhi kaam start karwa sakte hain.`;
      }

      return `I am MAYRA — an advanced personal Android AI companion and assistant created by Zafer.

Unlike a standard text-only chatbot, I am built as a voice-first, screen-first personal agent integrated directly into this mobile environment:

First, my voice system: You can talk with me out loud instead of typing. I support both Push-to-Talk — where you hold the Spacebar or Center Orb without any silence timeouts — and hands-free continuous conversation. If I am speaking and you start talking, I stop immediately through real-time barge-in and listen. Plus, thanks to sentence-level streaming, I begin speaking aloud within about one second.

Second, my Memory Vault: I maintain a persistent knowledge base of your preferences, notes, and personal facts. Whether you mention details naturally in chat or tell me "Save in memory", they stay stored across sessions and are automatically brought back into context when relevant.

Third, visual presence and vision: I have a real-time 3D avatar that lipsyncs to speech phonemes, along with a dedicated CameraX Scanner. You can open the camera, snap a document or scene, and have me read, explain, or extract data from it.

Fourth, actions and tools: I can navigate in-app screens (like Home, Scanner, Memories, and Chat), check device permissions, perform live web searches for technical documentation, and collaborate side-by-side with STONICX for heavy autonomous computing.

Basically, whether you want to chat out loud, scan a physical document, or automate daily routines, I'm ready to help.`;
    }

    case 'CAPABILITIES': {
      if (isHindi) {
        return `Main is application ke andar concrete runtime capabilities ke saath operate karti hoon:

1. Voice Conversation Engine:
- Push-to-Talk (PTT): Center Voice Orb ya Mic ko hold karein, ya keyboard par Spacebar dabayein. Jab tak aap hold karenge, silence timer bypass rahega. Release karte hi turn turant submit ho jayega.
- Hands-Free Mode: Orb par single tap karke continuous conversation on karein; 1.1s natural silence ke baad mera reply trigger hota hai.
- Real-Time Interruption (Barge-in): Agar main bol rahi hoon aur aap bolna shuru karte hain, to audio queue turant halt ho jati hai aur mic khul jata hai.
- Sentence-Level Streaming: Poora answer aane ka intezar karne ke bajay pehla sentence generate hote hi awaaz shuru ho jati hai.

2. Memory Vault:
- Automatic Extraction: Jab aap batate hain "mera naam Zafer hai" ya apni pasand, to main background mein note kar leti hoon.
- Explicit Commands: "Save in memory: Meeting kal subah 10 baje hai" bol kar direct entry store karwa sakte hain.
- Dedicated Memories Screen: Pin karna, search karna, aur delete karna poori tarah aapke control mein hai.

3. Multimodal Camera & Scanner:
- Built-in CameraX scanner se live camera stream chalta hai. Shutter se document, receipt ya whiteboard capture karke text padhwana ya diagram samjhana possible hai.
- Chat mein images aur screenshots upload karke visual sawal puch sakte hain.

4. In-App Navigation & Actions:
- Voice se screens switch karna: "Open camera", "Open memories", "Go to chat", ya "Home screen par jao".
- Permissions aur Settings manager kholna, chat clear karna, aur fuzzy matching ke saath contacts ko call/WhatsApp message initiate karna.

5. Autonomous Tools & Web Search:
- Internet se live technical documentation aur search query nikalna.
- Device status (battery, network, bridge) inspect karna aur structured action confirmation cards generate karna.

6. Interactive 3D Avatar:
- Real-time Three.js 3D character jo voice audio ke sath lipsync karta hai, ya ambient frosted soundwave orb.`;
      }

      return `Here is a breakdown of what I can actually do in this runtime:

1. Voice Conversation Engine:
- Push-to-Talk (PTT): Hold the Center Voice Orb, Mic button, or desktop Spacebar to speak without any silence timeouts. Releasing immediately submits your turn.
- Hands-Free Mode: A quick tap on the Center Orb toggles continuous listening, using an 1.1s natural pause detector to complete turns.
- Real-Time Interruption (Barge-in): If I'm speaking and you speak or press a button, my queued audio immediately stops and I switch back to listening.
- Sentence-Level Streaming: Audio starts playing as soon as the first sentence is generated (~1s latency), rather than waiting for the entire paragraph.

2. Memory Vault:
- Automatic Extraction: When you mention personal details like your name or preferences in conversation, I automatically save them in the background.
- Explicit Commands: Say "Save in memory: Flight is on Friday at 6 PM" to store explicit entries.
- Dedicated Memories UI: View, search, pin, or delete stored memories directly in the Memories tab.

3. Multimodal CameraX Scanner:
- A live camera viewfinder with shutter capture to photograph documents, receipts, or objects and have Gemini vision analyze or transcribe them.
- Direct image attachment in chat for visual inspection and question answering.

4. In-App Navigation & System Actions:
- Voice navigation: Say "Open camera", "Open memories", "Go to chat", or "Go home".
- Settings & Android Permissions management, chat clearing, and fuzzy contact matching for WhatsApp and phone call intents.

5. Autonomous Tools & Web Search:
- Live web search for technical documentation and current facts.
- Device status queries (battery, network, permissions) and confirmed agent tool dispatches.

6. Visual Presence:
- A Three.js 3D avatar with animated phoneme lipsync matching my voice output, or a frosted glass soundwave orb reacting to audio.`;
    }

    case 'SUPERPOWERS': {
      if (isHindi) {
        return `Meri sabse badi khasiyat (superpowers) aam voice assistants ke mukable ye hain:

Pehli Khasiyat — Voice ke saath Real Action:
Aam voice assistants sirf weather batate hain ya timers set karte hain. Main seedhe is app ke controls operate karti hoon — Camera kholna, Memory Vault mein details save karna, physical documents scan karna, aur tools execute karna.

Doosri Khasiyat — Seamless Conversational Flow aur Interruption:
Agar main koi lamba explanation de rahi hoon aur aapko beech mein kuch aur kehna hai, to aapko wait nahi karna padega. Aap seedhe bolenge ya Spacebar/Orb dabayenge, aur meri awaaz turant cut ho kar mic aapko sunne lagega. Saath hi sentence-level streaming se mujhe jawab dene mein lamba pause nahi lena padta.

Teesri Khasiyat — Push-to-Talk Precision:
Aksar loud environments mein voice assistants galat sunte hain ya beech mein baat kaat dete hain. Mere paas 260ms threshold wala PTT hai; aap Spacebar ya Orb daba kar aaram se sochte hue bolein, aur chhodte hi turn process ho jayegi.

Chauthi Khasiyat — Genuine Persistent Memory:
Aapko har baar apna setup ya preferences dobara nahi samjhani padti. Jo baatein aap Memory Vault mein save karte hain, wo persist rehti hain aur aage ke sessions mein naturally yaad rehti hain.

Paanchvi Khasiyat — STONICX ke saath Partnership:
Mujhe Zafer ne banaya hai, aur deep autonomous terminal computing ya complex system code ke liye main STONICX ke saath seamlessly handoff aur delegate kar sakti hoon.`;
      }

      return `My strongest superpowers compared to conventional voice assistants are:

1. Combining Voice with Real Action:
Most voice assistants can only answer trivia or set timers. I am wired into this application's real engine — I can navigate screens, operate the CameraX scanner, write and retrieve structured memories, and trigger autonomous tools.

2. True Conversational Interruption (Barge-in):
If I'm reading a detailed answer and you want to steer the conversation, you don't have to wait. Just speak out loud or press the button — I immediately halt my active audio output, flush the speech queue, and listen to you. Plus, with sentence-level streaming, I start speaking within ~1 second instead of making you wait.

3. Push-to-Talk Precision:
In noisy environments or when you need time to think, voice assistants often cut you off prematurely. With my PTT mode (holding the Center Orb or desktop Spacebar), silence cutoffs are completely disabled until you let go.

4. Persistent Memory Vault:
You never have to re-explain who you are or what your preferences are. Facts you save or mention are stored in the Memory Vault and recalled in context whenever relevant.

5. Multimodal Vision + STONICX Collaboration:
I can inspect physical documents via the camera scanner, and for heavy autonomous system code or cybernetic computing, I work side-by-side with STONICX.`;
    }

    case 'ACTIONS': {
      if (isHindi) {
        return `Aap mujhse is application ke andar ye saare real actions karwa sakte hain:

1. App Navigation:
- "Open camera" ya "Scanner kholo" bol kar live document scanner launch karwana.
- "Open memories" bol kar Knowledge Base screen par jaana.
- "Go to chat" bol kar messages dekhna, ya "Go home" bol kar main screen par aana.

2. Memory Operations:
- "Memory mein save karo: Mera project deadline agle mahine hai" bol kar instant note store karwana.
- "Memories dikhao" bol kar purani baatein review karna, ya specific fact search karwana.

3. Vision & Scanner Tasks:
- Camera se printed documents, invoices ya notes capture karwa kar unka text extract karwana ya summary banana.
- Chat mein kisi image ya diagram ko attach karke uske bare mein sawal puchna.

4. Communication & System Intents:
- "Message Papa on WhatsApp" ya "Call Mom" bolna — main contact dhoondh kar action initiate karti hoon.
- "Open permissions" ya "Settings kholo" bol kar Android permissions manager screen check karna.

5. Technical & Autonomous Tools:
- Internet se live documentation ya research nikalwane ke liye web search execute karwana.
- Battery, network aur system integration bridge ka status check karwana.

6. Multi-Mode Voice:
- Typing ke bajay Orb ya Spacebar hold karke Push-to-Talk use karna, ya single-tap se hands-free conversation chalana.`;
      }

      return `Here are the concrete actions you can have me perform right now:

1. App Navigation:
- "Open camera" or "Open scanner" to launch the live camera viewfinder.
- "Open memories" to jump straight into your Memory Vault.
- "Open chat" to see the message stream, or "Go home" to return to the home screen.

2. Memory Vault Management:
- "Save in memory: [any fact or preference]" to persist structured notes.
- Query previous notes or view, pin, search, and delete memories in the dedicated UI.

3. Document & Visual Analysis:
- Point the camera at a page, receipt, or diagram, capture a photo, and ask me to OCR the text or explain the content.
- Attach any image or screenshot in chat for visual inspection.

4. Communication & System Controls:
- "Send WhatsApp message to [Contact]" or "Call [Contact]" to trigger direct messaging and dialer intents.
- "Open settings" or "Open permissions" to inspect device automation and permissions.

5. Autonomous Tools & Web Search:
- Perform live web searches to look up up-to-date technical docs and articles.
- Check device status, battery, network, and system bridge health.

6. Flexible Voice Operation:
- Use Push-to-Talk (Spacebar / Orb hold) or hands-free conversation with real-time barge-in whenever you don't feel like typing.`;
    }

    case 'VOICE': {
      if (isHindi) {
        return `Mera voice system actual runtime mein is tarah operate karta hai:

1. Push-to-Talk (PTT) Mode:
- Aap Center Voice Orb ya Mic button ko 260ms se zyada hold karke rakhein, ya desktop par Spacebar daba kar rakhein.
- Jab tak aapne button hold kiya hua hai, silence timer poori tarah bypass rehta hai — chahe aap bolte waqt beech mein 5 second ke liye ruk kar sochein, recording band nahi hogi.
- Jaise hi aap button ya Spacebar release karte hain, turn turant model ko dispatch ho jata hai.
- Note: Jab aap kisi text box mein type kar rahe hote hain, to Spacebar normal space hi type karta hai aur PTT trigger nahi hota.

2. Hands-Free Continuous Mode:
- Center Orb par ek single quick tap (<260ms) karne se hands-free mode ON ho jata hai.
- Isme Web Speech API continuously listen karti hai. Jaise hi aap bolna khatam karte hain aur 1.1 second ka silence aata hai, turn automatically submit ho jati hai aur mera audio reply shuru ho jata hai.

3. Real-Time Barge-in (Interruption):
- Agar main bol rahi hoon aur aap bolna shuru karte hain, ya Orb/Spacebar press karte hain, to active audio playback aur queued chunks turant cancel ho jaate hain aur mic seedhe aapko sunne lagta hai.

4. Sentence-Level Audio Streaming:
- Server-Sent Events (SSE) ke through answers sentence-by-sentence aate hain. Poore paragraph ka wait karne ke bajay pehla sentence generate hote hi 24kHz neural audio synthesize hokar play hona shuru ho jata hai (~1s latency).`;
      }

      return `Here is exactly how my voice architecture works in this application:

1. Push-to-Talk (PTT) Mode:
- Hold down the Center Voice Orb, Mic button, or desktop Spacebar for more than 260ms.
- As long as you hold the button, the silence timeout is completely disabled — you can pause, think, and speak at your own pace without getting cut off.
- The moment you release, your turn is immediately finalized and dispatched to processing.
- Input protection: When your cursor is inside any text input or textarea, pressing Spacebar types a regular space and will not trigger PTT.

2. Hands-Free Continuous Conversation:
- A quick tap on the Center Orb toggles hands-free continuous mode.
- The system listens continuously; once you stop speaking and a natural 1.1s silence pause is detected, your turn auto-submits and I answer out loud.

3. Real-Time Interruption (Barge-in):
- If I am speaking and you start talking or press the Orb/Spacebar, active speech audio is halted instantly, the playback buffer is flushed, and the mic opens to hear your new command.

4. Sentence-Level Low-Latency Streaming:
- Through Server-Sent Events, my responses are split at sentence boundaries. Rather than waiting for the entire text to generate, the first sentence is synthesized to 24kHz neural audio and starts playing in about 1 second.`;
    }

    case 'MEMORY': {
      if (isHindi) {
        return `Mera Memory Vault system is tarah kaam karta hai:

1. Automatic Entity & Fact Extraction:
Jab aap aam baat-cheet mein apne baare mein batate hain (jaise "mera naam Zafer hai", "mujhe cricket pasand hai", ya koi personal preference), to main use background mein detect karke automatically key-value format mein store kar leti hoon.

2. Explicit "Save to Memory" Commands:
Aap direct voice ya text command de sakte hain: "Save in memory: Project meeting Friday ko 4 baje hai" ya "Yaad rakho ki...". Main use category ke sath persist kar leti hoon.

3. Context Injection (How it is recalled):
Har naye conversational turn mein, aapke sabse relevant saved memories server prompt ke context mein inject hoti hain. Iska matlab hai ki aapko bar-bar apna naam, context ya preference dohrana nahi padta.

4. Dedicated Memories Screen:
App ke 'Memories' tab mein jaakar aap apni saari saved memories dekh sakte hain, text search kar sakte hain, important notes ko pin kar sakte hain, ya jinhe nahi rakhna unhe delete kar sakte hain.

Yeh ek transparent aur structured memory system hai jo sessions ke paar aapke context ko sambhal kar rakhta hai.`;
      }

      return `Here is how my Memory Vault system genuinely operates:

1. Automatic Fact & Preference Extraction:
When you mention facts about yourself during conversation (for example, "My name is Zafer" or your preferred topics and routines), the system automatically extracts and registers them in the background as structured key-value entries.

2. Explicit Save Commands:
You can directly command: "Save in memory: Project deadline is next Wednesday" or "Remember that my coffee preference is dark roast". It stores the entry with a timestamp and category.

3. Dynamic Context Injection:
On incoming conversation turns, your saved memory entries are injected into the prompt context. That way, I naturally remember your details without you having to re-introduce yourself every time.

4. Dedicated Memories UI:
In the 'Memories' tab of the app, you can view every saved item, run live keyword searches, pin critical entries to the top, or delete memories you no longer want.

It's a structured, transparent memory system designed to preserve your personal context reliably.`;
    }

    case 'VISION_CAMERA': {
      if (isHindi) {
        return `Meri vision aur camera capabilities is tarah kaam karti hain:

1. Dedicated CameraX Scanner Screen:
App ke Scan tab par click karke ya voice se "Open camera" bolne par live camera viewfinder khul jata hai. Isme physical documents, whiteboards, kitabein ya real-world objects fit karne ke liye visual framing grid hai.

2. Document Shutter Capture:
Shutter button dabane par camera high-resolution image capture karta hai aur seedhe multimodal Gemini vision engine ko bhejta hai.

3. Visual Understanding & OCR:
Aap captured photo ke bare mein sawal puch sakte hain — jaise "Is receipt ka total batao", "Is document ke key bullet points summary karo", ya "Is object ko identify karo".

4. Image Upload in Chat:
Chat screen mein aap device se image ya screenshot attach karke text ya voice ke sath query kar sakte hain.

5. Screen Share Guidance:
Top bar mein Screen Share icon diya gaya hai, jisse aap apna display share karke screen par chal rahi cheezon ko analyze karwa sakte hain.`;
      }

      return `Here is how my vision and camera capabilities work:

1. Dedicated Scanner Screen:
By tapping the Scan tab or saying "Open camera", the live camera viewfinder opens up with an framing overlay designed for documents, whiteboards, receipts, and physical objects.

2. Shutter Capture:
Pressing the shutter captures a high-resolution frame and dispatches it directly to the multimodal Gemini vision pipeline.

3. Visual Reasoning & OCR:
You can ask me to read and extract text from printed pages, summarize receipts, explain diagrams, or identify objects in front of the lens.

4. Chat Image Attachments:
You can also attach images or screenshots directly inside the Chat screen and ask questions about them alongside your text or voice prompts.

5. Screen Sharing:
A screen-share control in the top bar allows you to share your display so we can inspect and troubleshoot live screen content together.`;
    }

    case 'TOOLS': {
      if (isHindi) {
        return `Mera MAYRA Agent V1 tool matrix in capabilities par مشتمل hai:

1. web_search:
Live web sources aur official technical documentation (jaise MDN, GitHub, tech specs) se real-time information extract karta hai.

2. search_memory:
Memory Vault ke andar specific queries aur categories ke hisaab se saved facts dhoondhta hai.

3. get_device_status:
Device battery percentage, network connectivity, system bridge health aur active Android permissions ka status check karta hai.

4. open_app & open_url:
Device par installed applications (jaise WhatsApp, Chrome, Camera, Settings, YouTube) switch karna ya safe web URLs open karna.

5. read_notification:
Android Notification Listener service dwara capture kiye gaye recent notifications (messages, alerts) inspect karna.

6. send_sms, send_whatsapp_message & make_call:
Contacts ke liye SMS, WhatsApp text ya Phone call draft karna, jo user confirmation ke baad securely initiate hote hain.`;
      }

      return `My autonomous agent operates with the MAYRA Agent V1 tool matrix:

1. web_search:
Searches live web sources and official technical documentation (like MDN, GitHub, or documentation portals) for up-to-date information.

2. search_memory:
Queries the Memory Vault knowledge base for saved facts, contact information, and preferences.

3. get_device_status:
Checks battery levels, network connectivity, bridge health, and active Android permissions.

4. open_app & open_url:
Launches or switches to installed device apps (WhatsApp, Chrome, Camera, Settings, YouTube) or opens verified URLs.

5. read_notification:
Reads recent notifications captured by the Android Notification Listener service.

6. send_sms, send_whatsapp_message & make_call:
Drafts text messages or phone call intents for contacts, requiring explicit user confirmation before dispatch.`;
    }

    case 'CREATOR': {
      if (isHindi) {
        return `Mujhe Zafer ne banaya hai.

Main Zafer dwara craft ki gayi ek advanced personal Android AI companion aur assistant hoon. Unhone mujhe is mobile interface ke andar voice-first interactivity (Push-to-Talk aur hands-free continuous conversation), persistent Memory Vault, multimodal camera scanning, aur direct device actions ke saath design kiya hai. Saath hi heavy autonomous computing ke liye main STONICX ke saath seamlessly collaborate karti hoon.`;
      }

      return `I was created by Zafer.

I am an advanced personal Android AI companion designed by Zafer to bring together low-latency voice conversation (with Push-to-Talk and hands-free modes), persistent memory in the Memory Vault, multimodal camera scanning, and device actions into an integrated mobile environment. For heavy autonomous computing, I collaborate side-by-side with STONICX.`;
    }

    case 'FULL_AGENT_OVERVIEW': {
      if (isHindi) {
        return `MAYRA ke complete system mein ye saare modules ek saath integrated hain:

1. Voice Interaction Engine:
- Push-to-Talk (Spacebar ya Center Orb hold karke bina silence timeout ke bolna).
- Hands-Free Mode (quick tap se continuous conversation with 1.1s pause detection).
- Real-Time Barge-in (bolte waqt interrupt karne par instant audio stop).
- Sentence-Level Streaming (SSE ke zariye pehla sentence ~1s mein spoken audio ban kar stream hota hai).

2. Memory Vault Knowledge Base:
- Conversation se facts aur preferences ka automatic background extraction.
- Explicit "Save to memory" commands.
- Naye turns mein automatic context injection.
- Dedicated UI: Memories screen par search, pin aur delete controls.

3. Multimodal CameraX Scanner:
- Live camera stream ke sath document viewfinder aur shutter capture.
- Gemini multimodal vision se OCR, text extraction aur scene analysis.
- Chat screen mein image upload support aur screen sharing.

4. In-App Navigation & Device Actions:
- Voice se screens switch karna: Home, Scan, Memories, aur Chat.
- Android Permissions aur Settings manager kholna.
- Contact fuzzy matching ke saath WhatsApp messaging aur Phone call intents.

5. Autonomous Agent V1 Tools:
- Real-time web search for technical documentation.
- Device status inspection (battery, network, permissions).
- App launching aur notification reading.

6. Visual Presence & Architecture:
- Three.js 3D character with animated phoneme lipsync aur emotional states, ya ambient frosted glow orb.
- Heavy terminal aur codebase tasks ke liye STONICX autonomous brain ke sath collaboration.`;
      }

      return `Here is the complete architectural overview of everything included in MAYRA:

1. Voice Interaction Engine:
- Push-to-Talk (holding the Spacebar or Center Orb for uninterrupted speech without silence timeouts).
- Hands-Free Mode (quick tap for continuous conversation with 1.1s pause auto-detection).
- Real-Time Barge-in (immediate audio cutoff and mic activation when you interrupt).
- Sentence-Level Streaming (SSE streaming delivering spoken audio within ~1 second).

2. Memory Vault Knowledge Base:
- Automatic background extraction of user facts and preferences.
- Explicit "Save to memory" voice and text commands.
- Dynamic memory recall injected into conversation prompts.
- Dedicated Memories tab with search, pinning, and deletion.

3. Multimodal CameraX Scanner:
- Live camera stream with document framing viewfinder and shutter capture.
- Multimodal Gemini vision for OCR, diagram explanation, and visual analysis.
- Image attachments in chat and live screen-share assistance.

4. In-App Navigation & Device Actions:
- Voice navigation across Home, Scanner, Memories Vault, and Chat screens.
- Android Permissions and Settings management.
- Fuzzy contact matching for WhatsApp messages and phone call intents.

5. Autonomous Agent V1 Tools:
- Live web search for technical documentation and current facts.
- Device status inspection (battery, network, permissions).
- App launching and system notification reading.

6. Visual Presence & Silicon Partnership:
- Interactive Three.js 3D character with phoneme lipsync and emotional expressions, or a glowing frosted soundwave orb.
- Native partnership with STONICX for heavy autonomous computing and deep codebase tasks.`;
    }
  }
}

/**
 * Returns a concise, grounded capability summary prompt block to inject into the general system prompt.
 * This guarantees that even when answering subtle or follow-up questions, the LLM is strictly
 * aware of MAYRA's real runtime features.
 */
export function getGroundedCapabilityPromptSection(): string {
  return `
============================================================
MAYRA REAL RUNTIME CAPABILITY MATRIX (GROUND TRUTH):
============================================================
When asked about yourself, your capabilities, memory, voice, camera, actions, or tools, you MUST speak truthfully based ONLY on these real features implemented in the codebase:

1. VOICE INTERACTION:
- Push-to-Talk (PTT): Center Voice Orb/Mic hold (>260ms) or Spacebar hold bypasses silence cutoff. Turn submits instantly on release. Text input fields are protected.
- Hands-Free Mode: Quick tap toggles continuous back-and-forth listening with 1.1s silence detection.
- Barge-in / Interruption: Active speech audio immediately stops if the user speaks or touches the controls.
- Sentence-level Streaming: Generates and streams spoken audio sentence-by-sentence via SSE for ~1s time-to-first-word.

2. MEMORY VAULT:
- Automatic extraction of personal facts/preferences during conversation.
- Explicit commands: "Save in memory: [content]" or "Yaad rakho".
- Stored memories are injected into conversation context.
- Dedicated Memories screen to search, pin, and delete items. (Do NOT claim infinite memory).

3. CAMERA & VISION:
- Scanner Screen: Real camera viewfinder, document shutter capture, and Gemini multimodal vision analysis/OCR.
- Image attachment support in Chat.

4. IN-APP ACTIONS & NAVIGATION:
- Voice-controlled navigation: Home, Scanner, Memories, Chat tabs.
- Settings and Android Permissions manager.
- Contact fuzzy matching for WhatsApp and phone call intents.

5. AUTONOMOUS AGENT TOOLS:
- web_search for tech documentation and live web facts.
- search_memory, get_device_status, open_app, read_notification, send_sms, send_whatsapp_message, make_call.

6. CREATOR & PARTNERSHIP:
- Created by Zafer.
- Works alongside STONICX for deep autonomous cybernetic/terminal tasks.
`;
}
