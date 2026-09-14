/**
 * MAYRA Instant Neural Conversational Fallback & Direct Response Engine
 * Guarantees zero-hang, zero-silence, 100% reliable responses
 * even if backend, websocket, or API key has any temporary issues.
 */

export interface FallbackResponseResult {
  reply: string;
  suggestedAction?: string;
  isKeyWarning?: boolean;
}

const BEAUTIFUL_SHAYARIS = [
  `हवाओं से कह दो अपनी हद में रहें,\nहम परों से नहीं हौसलों से उड़ते हैं।\nमंजिल उन्हीं को मिलती है,\nजिनके सपनों में जान होती है! ✨`,
  `मंजिलें भी जिद्दी हैं, रास्ते भी जिद्दी हैं,\nदेखते हैं कल क्या होगा, हौसले भी तो जिद्दी हैं! 💪✨`,
  `तू रख यकीन बस अपने इरादों पर,\nतेरी हार तेरे हौसलों से बड़ी नहीं होगी! 🌟`,
  `खोल दे पंख मेरे, कहता है परिंदा,\nअभी और उड़ान बाकी है।\nजमीन नहीं है मंजिल मेरी,\nअभी तो पूरा आसमान बाकी है! 🦅✨`
];

const INTERESTING_FACTS = [
  `आज की एक बहुत दिलचस्प बात: क्या आप जानते हैं कि एक इंसान का दिल एक दिन में लगभग 1,00,000 बार धड़कता है और पूरे जीवन में 3 अरब से ज्यादा बार! और शहद दुनिया की इकलौती ऐसी खाने की चीज है जो कभी खराब नहीं होती—हजारों साल पुराना शहद भी खाने लायक रहता है! 🍯💖`,
  `अंतरिक्ष की एक हैरान कर देने वाली बात: अंतरिक्ष में पूरी तरह सन्नाटा होता है क्योंकि वहाँ ध्वनि ले जाने के लिए कोई हवा या माध्यम नहीं है। और शुक्र (Venus) ग्रह पर एक दिन पृथ्वी के एक साल से भी ज्यादा लंबा होता है! 🌌🚀`,
  `प्रकृति का करिश्मा: ऑक्टोपस (Octopus) के 3 दिल और 9 दिमाग होते हैं, और उनका खून लाल नहीं बल्कि नीला होता है! 🐙🌊`
];

export function getMayraSmartFallback(
  prompt: string, 
  userName?: string, 
  enteredApiKey?: string
): FallbackResponseResult {
  const clean = prompt.trim().toLowerCase();
  const nameGreeting = userName ? `${userName} भाई` : 'दोस्त';

  // Check for invalid API key format (e.g. starts with 'AQ.')
  let keyWarningNote = '';
  if (enteredApiKey && !enteredApiKey.startsWith('AIzaSy')) {
    keyWarningNote = `\n\n💡 *नोट:* आपकी सेटिंग्स में डाली गई API Key \`${enteredApiKey.slice(0, 7)}...\` Google Gemini की मानक Key नहीं लग रही है (Gemini API Key हमेशा 'AIzaSy...' से शुरू होती है)। तब तक Mayra का बिल्ट-इन इंजन आपकी पूरी सेवा कर रहा है!`;
  }

  // 1. Greetings
  if (/^(hi|hii|hiii|hello|hey|namaste|pranam|salam|kese ho|kaise ho|kaisi ho|bolo|kuch bolo)/i.test(clean)) {
    return {
      reply: `Hii ${nameGreeting}! ❤️ मैं बिल्कुल ठीक हूँ और आपकी आवाज़ सुनने का इंतज़ार कर रही थी। कहिए, आज हम क्या नया करने वाले हैं?` + keyWarningNote,
      isKeyWarning: Boolean(keyWarningNote)
    };
  }

  // 2. Shayari
  if (/shayari|shayri|sher|kavita|poetry/i.test(clean)) {
    const randomShayari = BEAUTIFUL_SHAYARIS[Math.floor(Math.random() * BEAUTIFUL_SHAYARIS.length)];
    return {
      reply: `लीजिए ${nameGreeting}, आपके लिए दिल से एक बेहद खूबसूरत शायरी:\n\n${randomShayari}\n\nकैसी लगी आपको? दिल खुश हुआ ना! 😊` + keyWarningNote,
      isKeyWarning: Boolean(keyWarningNote)
    };
  }

  // 3. Interesting Facts
  if (/interesting|dilchasp|kuch naya|fact|tathya|batao|knowledge/i.test(clean)) {
    const randomFact = INTERESTING_FACTS[Math.floor(Math.random() * INTERESTING_FACTS.length)];
    return {
      reply: `ज़रूर ${nameGreeting}! ${randomFact}` + keyWarningNote,
      isKeyWarning: Boolean(keyWarningNote)
    };
  }

  // 4. Who are you
  if (/who are you|kaun ho|tum kaun ho|naam kya/i.test(clean)) {
    return {
      reply: `मैं Mayra हूँ, आपकी अपनी पर्सनल AI साथी और सुपर-असिस्टेंट! मैं आपके सवालों के जवाब दे सकती हूँ, फोन कॉल्स, कैमरा, नोट्स, और रोज़मर्रा के काम आसानी से संभाल सकती हूँ।` + keyWarningNote,
      isKeyWarning: Boolean(keyWarningNote)
    };
  }

  // Default warm helpful response
  return {
    reply: `हाँ ${nameGreeting}, मैंने आपकी बात सुनी: "${prompt}". मैं आपके साथ हूँ और हमेशा आपकी मदद के लिए तैयार हूँ। कहिए, मैं आपके लिए क्या करूँ?` + keyWarningNote,
    isKeyWarning: Boolean(keyWarningNote)
  };
}
