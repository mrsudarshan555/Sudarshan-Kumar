/**
 * Mark-LII / Mark-LIII Proactive Engine 2.0
 * 
 * Based on Mark-LII `actions/proactive.py`
 * Time-aware, context-aware, non-repetitive background assistant check-in.
 */

export interface ProactiveBriefing {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  greetingHi: string;
  greetingEn: string;
  focusMessageHi: string;
  focusMessageEn: string;
  suggestionHi: string;
  suggestionEn: string;
}

export class ProactiveEngine {
  private static lastTriggered: number = 0;
  private static rotationIndex: number = 0;
  private static readonly minSilenceSecs = 300; // 5 minutes of silence

  public static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  public static shouldTrigger(lastUserInteractionTime: number): boolean {
    const now = Date.now();
    const silenceDurationSec = (now - lastUserInteractionTime) / 1000;
    const cooldownPassed = (now - this.lastTriggered) > 600 * 1000; // 10 min cooldown

    return silenceDurationSec >= this.minSilenceSecs && cooldownPassed;
  }

  public static markTriggered(): void {
    this.lastTriggered = Date.now();
    this.rotationIndex = (this.rotationIndex + 1) % 4;
  }

  public static generateBriefing(userName: string = 'Zafer'): ProactiveBriefing {
    const timeOfDay = this.getTimeOfDay();

    const briefings: Record<'morning' | 'afternoon' | 'evening' | 'night', ProactiveBriefing> = {
      morning: {
        timeOfDay: 'morning',
        greetingHi: `सुप्रभात ${userName}! नया दिन शुरू हो चुका है।`,
        greetingEn: `Good morning ${userName}! A fresh day begins.`,
        focusMessageHi: `आज के महत्वपूर्ण कार्यों और शेड्यूल की समीक्षा करने का उत्तम समय है।`,
        focusMessageEn: `Great time to review your daily priorities and schedule.`,
        suggestionHi: `क्या आप आज का मौसम और मुख्य कार्य देखना चाहेंगे?`,
        suggestionEn: `Would you like a quick weather and priorities briefing?`
      },
      afternoon: {
        timeOfDay: 'afternoon',
        greetingHi: `नमस्ते ${userName}, दोपहर की शुभकामनाएँ।`,
        greetingEn: `Good afternoon ${userName}.`,
        focusMessageHi: `आपके प्रोजेक्ट्स और टास्क्स सुचारु रूप से चल रहे हैं।`,
        focusMessageEn: `Hope your productivity session is running smoothly.`,
        suggestionHi: `थोड़ा विश्राम लें या बताएं अगर किसी कार्य में सहायता चाहिए।`,
        suggestionEn: `Take a quick breather or let me know if you need any task automated.`
      },
      evening: {
        timeOfDay: 'evening',
        greetingHi: `शुभ संध्या ${userName}!`,
        greetingEn: `Good evening ${userName}!`,
        focusMessageHi: `दिन के कार्यों को समेटने और कल की योजना बनाने का समय है।`,
        focusMessageEn: `Time to wrap up today's accomplishments and prep for tomorrow.`,
        suggestionHi: `क्या आज के किसी काम या रिमाइंडर की समीक्षा करनी है?`,
        suggestionEn: `Would you like to review any pending reminders from today?`
      },
      night: {
        timeOfDay: 'night',
        greetingHi: `शुभ रात्रि ${userName}।`,
        greetingEn: `Good night ${userName}.`,
        focusMessageHi: `अब आराम और स्क्रीन टाइम कम करने का अच्छा समय है।`,
        focusMessageEn: `Time to recharge and wind down.`,
        suggestionHi: `मैं बैकग्राउंड में सुरक्षा और रिमाइंडर्स की निगरानी जारी रखूंगी।`,
        suggestionEn: `I'll keep monitoring reminders and security in the background.`
      }
    };

    return briefings[timeOfDay];
  }
}
