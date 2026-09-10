/**
 * Mark-LIII Instant Acknowledgment Engine
 * 
 * Signature feature from Mark-LIII:
 * Avoids silent pauses when tools/searches take more than a moment.
 * Mayra instantly speaks/renders one natural, context-aware sentence in the user's
 * active language (Hindi or English) acknowledging the specific task before
 * tool completion.
 */

export interface AcknowledgmentConfig {
  taskType: 'search' | 'weather' | 'flight' | 'code' | 'system' | 'memory' | 'general';
  target?: string;
  lang?: 'hi' | 'en' | 'hinglish';
}

export class InstantAcknowledgmentEngine {
  private static recentPhrases: Set<string> = new Set();

  public static getAcknowledgment(config: AcknowledgmentConfig): string {
    const lang = config.lang || 'hi';
    const target = config.target ? `"${config.target}"` : '';

    const hindiPhrases: Record<string, string[]> = {
      search: [
        `एक सेकंड, मैं ${target ? target + ' के बारे में ' : ''}जानकारी निकाल रही हूँ...`,
        `बिल्कुल, मैं अभी वेब और तकनीकी स्रोतों में देख रही हूँ...`,
        `हाँ, तुरंत चेक करके बताती हूँ...`
      ],
      weather: [
        `ज़रूर, मैं ${target ? target + ' के ' : ''}मौसम का ताज़ा हाल देख रही हूँ...`,
        `एक पल, लाइव मौसम रिपोर्ट लोड कर रही हूँ...`,
        `देखती हूँ, अभी तापमान और मौसम की जानकारी निकाल रही हूँ...`
      ],
      flight: [
        `बिल्कुल, मैं उपलब्ध उड़ानों और टिकट के विकल्प खोज रही हूँ...`,
        `एक क्षण, फ़्लाइट शेड्यूल और किराए चेक कर रही हूँ...`,
        `ज़रूर, रूट्स और फ़्लाइट्स की जानकारी देख रही हूँ...`
      ],
      code: [
        `मैं कोड का विश्लेषण और सिंटेक्स जाँच रही हूँ...`,
        `एक सेकंड, कोड रिव्यू और समाधान तैयार कर रही हूँ...`,
        `बिल्कुल, कोड लॉजिक और आर्किटेक्चर देख रही हूँ...`
      ],
      system: [
        `सिस्टम और हार्डवेयर का टेलीमेट्री डेटा पढ़ रही हूँ...`,
        `एक पल, सीपीयू और मेमोरी का स्टेटस देख रही हूँ...`
      ],
      memory: [
        `मैं अपनी मेमोरी वॉल्ट में देख रही हूँ...`,
        `एक सेकंड, सेव की गई यादों को सर्च कर रही हूँ...`
      ],
      general: [
        `तुरंत देख रही हूँ...`,
        `हाँ, मैं इस पर काम कर रही हूँ...`,
        `एक क्षण दीजिए, अभी प्रोसेस कर रही हूँ...`
      ]
    };

    const englishPhrases: Record<string, string[]> = {
      search: [
        `Right away — scanning technical sources and web data ${target ? 'for ' + target : ''}...`,
        `On it — pulling up verified information now...`,
        `Just a moment, researching that for you...`
      ],
      weather: [
        `Looking up the live weather report ${target ? 'for ' + target : ''} right now...`,
        `Checking current temperature and weather conditions...`,
        `On it — fetching the latest meteorological forecast...`
      ],
      flight: [
        `Searching commercial flight availability and schedules now...`,
        `Right away — pulling route options and pricing...`,
        `Checking available flights for you now...`
      ],
      code: [
        `Analyzing the code structure and running diagnostics now...`,
        `Inspecting syntax and performance patterns...`,
        `On it — reviewing the architecture and logic...`
      ],
      system: [
        `Reading system telemetry and hardware health metrics...`,
        `Checking CPU, RAM, and diagnostic performance...`
      ],
      memory: [
        `Querying the local Memory Vault for that record...`,
        `Checking stored memory context now...`
      ],
      general: [
        `Right away, on it...`,
        `One moment, processing that for you...`,
        `Understood, working on it now...`
      ]
    };

    const phrases = (lang === 'en') ? (englishPhrases[config.taskType] || englishPhrases.general) : (hindiPhrases[config.taskType] || hindiPhrases.general);

    // Pick non-repeating phrase
    const available = phrases.filter((p) => !this.recentPhrases.has(p));
    const pool = available.length > 0 ? available : phrases;
    const selected = pool[Math.floor(Math.random() * pool.length)];

    this.recentPhrases.add(selected);
    if (this.recentPhrases.size > 8) {
      const first = Array.from(this.recentPhrases)[0];
      this.recentPhrases.delete(first);
    }

    return selected;
  }
}
