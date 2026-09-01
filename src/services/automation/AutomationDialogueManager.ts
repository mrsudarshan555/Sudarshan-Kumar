/**
 * Automation Voice Dialogue Matrix for Mayra / STONICX AI OS
 * 
 * Maps all 25 automated events with strict user-specified Hindi voice responses:
 * - Trigger Keywords & Matchers
 * - Action Start Speech ("क्या बोलकर शुरू करना है")
 * - Success Speech ("सफलतापूर्वक पूरा होने पर क्या बोलना है")
 * - Failure / Error Speech ("विफलता पर क्या बोलना है")
 * - Disarm & Security Speech (Owner vs Unknown Voice)
 */

export interface AutomationVoiceRule {
  id: string;
  name: string;
  category: 'screen' | 'messaging' | 'social_media' | 'telephony' | 'security' | 'vision_tools' | 'media_iot' | 'system' | 'lifestyle_smart' | 'finance_trading';
  triggers: string[];
  actionSpeech: string;
  successSpeech: string;
  failureSpeech: string;
  disarmSuccessSpeech?: string;
  disarmFailureSpeech?: string;
}

export const AUTOMATION_VOICE_RULES: AutomationVoiceRule[] = [
  // 1. SCREEN UNLOCK AUTOMATION
  {
    id: 'rule_1_screen_unlock',
    name: 'SCREEN UNLOCK AUTOMATION',
    category: 'screen',
    triggers: ['फोन अनलॉक करो', 'स्क्रीन अनलॉक करो', 'अनलॉक करो', 'unlock phone', 'unlock screen'],
    actionSpeech: 'स्क्रीन स्वाइप करके पिन/पैटर्न प्रोसेस कर रही हूँ, {Title}...',
    successSpeech: 'डन {Title}, फोन सफलतापूर्वक अनलॉक हो गया है।',
    failureSpeech: 'स्क्रीन अनलॉक नहीं हो सका {Title}। स्वाइप कोऑर्डिनेट्स मिसमैच हैं, कृपया फाइन-ट्यून करें।'
  },

  // 2. SCREEN LOCK AUTOMATION
  {
    id: 'rule_2_screen_lock',
    name: 'SCREEN LOCK AUTOMATION',
    category: 'screen',
    triggers: ['फोन लॉक कर दो', 'स्क्रीन लॉक करो', 'फोन बंद करो', 'lock phone', 'lock screen'],
    actionSpeech: 'डिवाइस लॉक प्रोसेस कर रही हूँ, {Title}...',
    successSpeech: 'फोन सुरक्षित लॉक कर दिया गया है, {Title}।',
    failureSpeech: 'एक्सेसिबिलिटी परमिशन न होने के कारण फोन लॉक नहीं हुआ, {Title}।'
  },

  // 3. WHATSAPP SCREENSHOT & SEND
  {
    id: 'rule_3_whatsapp_screenshot_send',
    name: 'WHATSAPP SCREENSHOT & SEND',
    category: 'messaging',
    triggers: ['स्क्रीनशॉट लो और whatsapp पर भेजो', 'स्क्रीनशॉट भेजो whatsapp पर', 'screenshot and send to whatsapp'],
    actionSpeech: 'स्क्रीनशॉट कैप्चर कर रही हूँ और WhatsApp चैट ओपन कर रही हूँ, {Title}...',
    successSpeech: '{Target} को स्क्रीनशॉट सफलतापूर्वक भेज दिया गया है, {Title}।',
    failureSpeech: 'स्क्रीनशॉट कैप्चर हो गया है {Title}, लेकिन {Target} का कॉन्टैक्ट नहीं मिला। कृपया सही नाम बताएं।'
  },

  // 4. WHATSAPP VOICE MESSAGING
  {
    id: 'rule_4_whatsapp_voice_msg',
    name: 'WHATSAPP VOICE MESSAGING',
    category: 'messaging',
    triggers: ['whatsapp पर बोलो कि', 'whatsapp मैसेज भेजो', 'send whatsapp message'],
    actionSpeech: 'WhatsApp चैट में मैसेज टाइप कर रही हूँ, {Title}...',
    successSpeech: 'मैसेज सफलतापूर्वक सेंड कर दिया गया है, {Title}।',
    failureSpeech: 'चैट बॉक्स लोड नहीं हो पाया या नेटवर्क समस्या है, {Title}।'
  },

  // 5. WHATSAPP INCOMING MESSAGE AUTO-READER
  {
    id: 'rule_5_whatsapp_msg_reader',
    name: 'WHATSAPP INCOMING MESSAGE AUTO-READER',
    category: 'messaging',
    triggers: ['whatsapp मैसेज पढ़ो', 'read incoming message'],
    actionSpeech: 'WhatsApp पर नया मैसेज आया है...',
    successSpeech: '{Title}, {Sender} ने मैसेज भेजा है: {Message}।',
    failureSpeech: 'नया नोटिफिकेशन आया है लेकिन मैसेज रीड करने की परमिशन ब्लॉक है, {Title}।'
  },

  // 6. WHATSAPP AUTO-REPLY AI CHATBOT
  {
    id: 'rule_6_whatsapp_auto_reply',
    name: 'WHATSAPP AUTO-REPLY AI CHATBOT',
    category: 'messaging',
    triggers: ['auto reply to whatsapp', 'whatsapp ऑटो रिप्लाई'],
    actionSpeech: 'इनकमिंग मैसेज का AI रिस्पॉन्स तैयार कर रही हूँ...',
    successSpeech: 'Auto-replied to {Sender} according to tone rules.',
    failureSpeech: 'Message skipped due to group exclusion or blacklist rule.'
  },

  // 7. SHIFT & PRODUCTION REPORT AUTOMATION
  {
    id: 'rule_7_shift_report',
    name: 'SHIFT & PRODUCTION REPORT AUTOMATION',
    category: 'messaging',
    triggers: ['आज की शिफ्ट रिपोर्ट ग्रुप में सेंड करो', 'शिफ्ट रिपोर्ट भेजो', 'send shift report'],
    actionSpeech: 'शिफ्ट डेटा और आज की तारीख संकलित कर रही हूँ, {Title}...',
    successSpeech: 'शिफ्ट प्रोडक्शन रिपोर्ट निर्धारित ग्रुप में भेज दी गई है, {Title}।',
    failureSpeech: 'रिपोर्ट डेटा मिसिंग है या ग्रुप नहीं मिला, {Title}।'
  },

  // 8. SOCIAL MEDIA LOCAL IMAGE GENERATION & STORY POSTING
  {
    id: 'rule_8_social_media_story',
    name: 'SOCIAL MEDIA LOCAL IMAGE GENERATION & STORY POSTING',
    category: 'social_media',
    triggers: ['मोटिवेशनल कोट की इमेज बनाओ और facebook/instagram स्टोरी पर लगाओ', 'स्टोरी पर लगाओ', 'post to story'],
    actionSpeech: 'लोकल कैनवस रेंडर करके स्टोरी अपलोड प्रोसेस शुरू कर रही हूँ, {Title}...',
    successSpeech: 'इमेज तैयार करके स्टोरी पर सफलतापूर्वक अपलोड कर दी गई है, {Title}।',
    failureSpeech: 'ऐप इंटरफ़ेस पर अपलोड बटन डिटेक्ट नहीं हुआ {Title}, एक्सेसिबिलिटी चेक करें।'
  },

  // 9. SCHEDULED SOCIAL MEDIA POSTING
  {
    id: 'rule_9_scheduled_posting',
    name: 'SCHEDULED SOCIAL MEDIA POSTING',
    category: 'social_media',
    triggers: ['scheduled morning story', 'सुबह की स्टोरी शेड्यूल'],
    actionSpeech: 'शेड्यूल्ड स्टोरी पोस्टिंग प्रोसेस शुरू हो रहा है...',
    successSpeech: 'Scheduled morning story posted successfully, {Title}.',
    failureSpeech: 'Scheduled post failed: Screen unlock timeout.'
  },

  // 10. CALL REJECTION & DRIVING MODE SMS
  {
    id: 'rule_10_driving_mode_sms',
    name: 'CALL REJECTION & DRIVING MODE SMS',
    category: 'telephony',
    triggers: ['driving mode ऑन करो', 'ड्राइविंग मोड चालू करो', 'activate driving mode'],
    actionSpeech: 'ड्राइविंग मोड एक्टिवेट कर दिया गया है, {Title}।',
    successSpeech: '{UserName} अभी ड्राइव कर रहे हैं, बाद में संपर्क करें।',
    failureSpeech: 'कॉल रिजेक्ट परमिशन उपलब्ध नहीं है, {Title}।'
  },

  // 11. CALLER NAME ANNOUNCEMENT
  {
    id: 'rule_11_caller_announcement',
    name: 'CALLER NAME ANNOUNCEMENT',
    category: 'telephony',
    triggers: ['incoming call announcement', 'कॉलर का नाम बताओ'],
    actionSpeech: 'इनकमिंग कॉल चेक कर रही हूँ...',
    successSpeech: '{Title}, {CallerName} की कॉल आ रही है।',
    failureSpeech: '{Title}, किसी अज्ञात नंबर से कॉल आ रही है।'
  },

  // 12. EMERGENCY SOS & PRIORITY CALLING
  {
    id: 'rule_12_emergency_sos',
    name: 'EMERGENCY SOS & PRIORITY CALLING',
    category: 'security',
    triggers: ['sos एक्टिवेट करो', 'इमरजेंसी मोड चालू करो', 'help me', 'emergency sos'],
    actionSpeech: 'इमरजेंसी अलर्ट सक्रिय! GPS लोकेशन के साथ 5 संपर्कों को संदेश भेजा जा रहा है, {Title}...',
    successSpeech: 'एसओएस अलर्ट भेज दिया गया है और प्रायोरिटी 1 पर कॉल मिला रही हूँ, {Title}।',
    failureSpeech: 'GPS सिग्नल नहीं मिल पाया, डिफ़ॉल्ट इमरजेंसी SMS भेज दिया गया है, {Title}।'
  },

  // 13. TOUCH GUARD & INTRUDER PHOTO BURST
  {
    id: 'rule_13_touch_guard',
    name: 'TOUCH GUARD & INTRUDER PHOTO BURST',
    category: 'security',
    triggers: ['टच गार्ड ऑन करो', 'touch guard on', 'सुरक्षा अलार्म चालू करो'],
    actionSpeech: 'टच गार्ड एक्टिवेट हो गया है {Title}, फोन रखने के लिए 12 सेकंड शेष हैं।',
    successSpeech: 'सुरक्षा अलार्म सक्रिय हो गया है! 115dB सायरन और फ्रंट कैमरा कैप्चर चालू है।',
    failureSpeech: 'टच गार्ड सेंसर आरंभ नहीं हो सका, {Title}।',
    disarmSuccessSpeech: 'आवाज़ वेरिफ़ाई हो गई है {Title}, टच गार्ड निष्क्रिय कर दिया गया है।',
    disarmFailureSpeech: 'वार्निंग! अनधिकृत आवाज़ डिटेक्ट हुई है। {Title} का फोन लॉक किया जा रहा है।'
  },

  // 14. CHARGER PULL-OUT ALARM
  {
    id: 'rule_14_charger_alarm',
    name: 'CHARGER PULL-OUT ALARM',
    category: 'security',
    triggers: ['charger unplugged', 'चार्जर निकाला गया'],
    actionSpeech: 'चार्जर डिस्कनेक्ट डिटेक्ट हुआ...',
    successSpeech: '{Title}, चार्जर निकाल लिया गया है और सुरक्षा अलार्म सक्रिय है।',
    failureSpeech: 'सायरन ट्रिगर करने में सिस्टम एरर, {Title}।'
  },

  // 15. SILENT BACKGROUND VIDEO RECORDING
  {
    id: 'rule_15_silent_recording',
    name: 'SILENT BACKGROUND VIDEO RECORDING',
    category: 'security',
    triggers: ['बैकग्राउंड वीडियो रिकॉर्डिंग शुरू करो', 'silent recording', 'start background video'],
    actionSpeech: 'कैमरा सर्विस शुरू कर रही हूँ, {Title}...',
    successSpeech: 'बैकग्राउंड रिकॉर्डिंग प्रारंभ हो गई है और गैलरी में सेव की जा रही है, {Title}।',
    failureSpeech: 'कैमरा सर्विस शुरू नहीं हो सकी {Title}, स्टोरेज या परमिशन चेक करें।'
  },

  // 16. SCREEN VISION & ELEMENT READING
  {
    id: 'rule_16_screen_vision',
    name: 'SCREEN VISION & ELEMENT READING',
    category: 'vision_tools',
    triggers: ['मेरी स्क्रीन देखो', 'screen scan', 'read my screen'],
    actionSpeech: 'स्क्रीन एलिमेंट्स को स्कैन कर रही हूँ, {Title}...',
    successSpeech: 'स्क्रीन स्कैन पूरी हो गई है {Title}, यहाँ प्रदर्शित कंटेंट यह है: {Summary}।',
    failureSpeech: 'स्क्रीन कास्टिंग परमिशन नहीं दी गई, {Title}।'
  },

  // 17. OBJECT & TEXT SCANNER VIA CAMERA
  {
    id: 'rule_17_camera_scanner',
    name: 'OBJECT & TEXT SCANNER VIA CAMERA',
    category: 'vision_tools',
    triggers: ['सामने क्या है स्कैन करके बताओ', 'वस्तु पहचानो', 'scan what is in front of me'],
    actionSpeech: 'कैमरा स्कैन प्रोसेस कर रही हूँ, {Title}...',
    successSpeech: 'कैमरे के सामने {ObjectText} डिटेक्ट हुआ है, {Title}।',
    failureSpeech: 'इमेज स्पष्ट नहीं है या विज़न मॉडल रिस्पॉन्स नहीं दे रहा, {Title}।'
  },

  // 18. SUB-AGENTS DEEP RESEARCH & DOCUMENT CREATION
  {
    id: 'rule_18_sub_agents_research',
    name: 'SUB-AGENTS DEEP RESEARCH & DOCUMENT CREATION',
    category: 'vision_tools',
    triggers: ['रिसर्च करके फ़ाइल बनाओ', 'टॉप 10 न्यूज़ पर रिसर्च करके फ़ाइल बनाओ', 'deep research and create doc'],
    actionSpeech: 'सब-एजेंट्स डीप रिसर्च और फ़ाइल जनरेशन प्रोसेस कर रहे हैं, {Title}...',
    successSpeech: 'रिसर्च पूरी हो गई है {Title}, आज की खबरें नाम से फ़ाइल तैयार करके ओपन कर दी गई है।',
    failureSpeech: 'फ़ाइल टूल उपलब्ध नहीं है {Title}, मैंने पूरा विवरण स्टडी व्हाइटबोर्ड पर लिख दिया है।'
  },

  // 19. INTERACTIVE STUDY WHITEBOARD DRAWING
  {
    id: 'rule_19_study_whiteboard',
    name: 'INTERACTIVE STUDY WHITEBOARD DRAWING',
    category: 'vision_tools',
    triggers: ['व्हाइटबोर्ड पर यह गणित/विज्ञान का सवाल समझाओ', 'व्हाइटबोर्ड पर समझाओ', 'explain on whiteboard'],
    actionSpeech: 'व्हाइटबोर्ड कैनवस ओपन करके स्टेप्स ड्रॉ कर रही हूँ, {Title}...',
    successSpeech: 'व्हाइटबोर्ड पर डायग्राम और स्टेप-बाय-स्टेप सॉल्यूशन लिख दिया गया है, {Title}।',
    failureSpeech: 'कैनवस रेंडरिंग फेल हो गई {Title}, मैं बोलकर समझा देती हूँ।'
  },

  // 20. YOUTUBE MUSIC SEARCH & PLAYBACK
  {
    id: 'rule_20_youtube_music',
    name: 'YOUTUBE MUSIC SEARCH & PLAYBACK',
    category: 'media_iot',
    triggers: ['मेरा पसंदीदा गाना चलाओ', 'youtube पर बजाओ', 'play music on youtube'],
    actionSpeech: 'म्यूज़िक सर्च करके प्ले कर रही हूँ, {Title}...',
    successSpeech: '{SongName} प्ले कर दिया गया है, {Title}।',
    failureSpeech: 'गाना नहीं मिल सका {Title}, क्या आप नाम दोबारा बता सकते हैं?'
  },

  // 21. YOUTUBE CHANNEL SUBSCRIBER & VIEWS TRACKER
  {
    id: 'rule_21_youtube_channel_tracker',
    name: 'YOUTUBE CHANNEL SUBSCRIBER & VIEWS TRACKER',
    category: 'media_iot',
    triggers: ['मेरे youtube चैनल का स्टेटस बताओ', 'youtube subscriber count', 'चैनल सब्सक्राइबर्स चेक करो'],
    actionSpeech: 'लाइव एनालिटिक्स फेच कर रही हूँ, {Title}...',
    successSpeech: 'बधाई हो {Title}, आपके चैनल पर कुल {SubscriberCount} सब्सक्राइबर्स और {ViewCount} व्यूज हो चुके हैं।',
    failureSpeech: 'चैनल एपीआई से कनेक्ट नहीं हो सकी, इंटरनेट कनेक्शन चेक करें, {Title}।'
  },

  // 22. IMAP EMAIL INGESTION & AUTO SPAM PURGE
  {
    id: 'rule_22_email_spam_purge',
    name: 'IMAP EMAIL INGESTION & AUTO SPAM PURGE',
    category: 'messaging',
    triggers: ['ईमेल्स चेक करो और स्पैम साफ करो', 'email spam purge', 'check emails'],
    actionSpeech: 'मेल इनबॉक्स सिंक कर रही हूँ, {Title}...',
    successSpeech: '3 नए महत्वपूर्ण ईमेल्स मिले हैं और 5 स्पैम मेल्स डिलीट कर दिए गए हैं, {Title}।',
    failureSpeech: 'ईमेल सर्वर क्रेडेंशियल्स अमान्य हैं, {Title}।'
  },

  // 23. SMART IOT HOME CONTROL (MAYA HOME BOX)
  {
    id: 'rule_23_smart_iot_home',
    name: 'SMART IOT HOME CONTROL (MAYA HOME BOX)',
    category: 'media_iot',
    triggers: ['कमरे की लाइट और पंखा चालू करो', 'लाइट चालू करो', 'turn on lights and fan'],
    actionSpeech: 'स्मार्ट होम हब को कमांड भेज रही हूँ, {Title}...',
    successSpeech: 'लाइट और पंखा चालू कर दिया गया है, {Title}।',
    failureSpeech: 'होम हब ऑफलाइन दिख रहा है, वाई-फाई चेक करें, {Title}।'
  },

  // 24. REMOTE PC LINK CONTROL
  {
    id: 'rule_24_remote_pc_link',
    name: 'REMOTE PC LINK CONTROL',
    category: 'system',
    triggers: ['पीसी पर कोडिंग प्रोजेक्ट रन करो', 'pc link command', 'run project on pc'],
    actionSpeech: 'पीसी लिंक ब्रिज के ज़रिए कमांड भेजी जा रही है, {Title}...',
    successSpeech: 'पीसी पर कमांड निष्पादित कर दी गई है, {Title}।',
    failureSpeech: 'कंप्यूटर से कनेक्शन स्थापित नहीं हो सका, {Title}।'
  },

  // 25. SYSTEM EVENT AUTOMATIONS
  {
    id: 'rule_25_system_events',
    name: 'SYSTEM EVENT AUTOMATIONS',
    category: 'system',
    triggers: ['battery full', 'battery low', 'headphones connected', 'bluetooth connected'],
    actionSpeech: 'सिस्टम इवेंट डिटेक्ट हुआ...',
    successSpeech: 'बैटरी 100% चार्ज हो चुकी है {Title}, चार्जर हटा लें।',
    failureSpeech: 'सिस्टम इवेंट एरर, {Title}।'
  },

  // ==========================================
  // --- 15 LIFESTYLE & PRO AUTOMATIONS (26-40) ---
  // ==========================================
  {
    id: 'rule_26_upi_voice_pay',
    name: 'UPI & BANK TRANSACTION VOICE ASSISTANT',
    category: 'lifestyle_smart',
    triggers: ['रुपये भेजो', 'upi payment', 'google pay करो', 'phonepe से भेजो'],
    actionSpeech: 'भुगतान ऐप खोलकर {Target} के लिए ₹{Amount} की UPI पेमेंट प्रोसेस कर रही हूँ, {Title}...',
    successSpeech: 'पेमेंट स्क्रीन तैयार है {Title}, कृपया अपना UPI PIN दर्ज करके कन्फर्म करें।',
    failureSpeech: 'अकाउंट में पर्याप्त बैलेंस नहीं है या बैंक सर्वर डाउन है, {Title}।'
  },
  {
    id: 'rule_27_smart_parking_finder',
    name: 'SMART PARKING & CAR FINDER',
    category: 'lifestyle_smart',
    triggers: ['गाड़ी कहाँ पार्क की है', 'मेरी गाड़ी कहाँ है', 'parking location'],
    actionSpeech: 'लाइव GPS कोऑर्डिनेट्स और पार्किंग लोकेशन स्कैन कर रही हूँ, {Title}...',
    successSpeech: 'आपकी गाड़ी {LocationName} पर 120 मीटर की दूरी पर पार्क है, मैप नेविगेशन ओपन कर दिया है, {Title}।',
    failureSpeech: 'पार्किंग का पिछला लोकेशन डेटा उपलब्ध नहीं है, {Title}।'
  },
  {
    id: 'rule_28_meeting_mom_notes',
    name: 'AI MEETING RECORDER & AUTO MINUTES OF MEETING (MoM)',
    category: 'lifestyle_smart',
    triggers: ['मीटिंग रिकॉर्ड करो', 'मीटिंग के नोट्स बनाओ', 'record meeting and notes'],
    actionSpeech: 'मीटिंग ऑडियो विश्लेषण और रियल-टाइम समरी नोट्स तैयार कर रही हूँ, {Title}...',
    successSpeech: 'मीटिंग समाप्त हो गई है {Title}, मुख्य निर्णय और एक्शन पॉइंट्स आपके ईमेल पर भेज दिए गए हैं।',
    failureSpeech: 'माइक रिकॉर्डिंग परमिशन ब्लॉक है या ऑडियो साफ नहीं आ रहा, {Title}।'
  },
  {
    id: 'rule_29_spam_call_recording',
    name: 'AUTOMATIC CALL RECORDING ON SPAM / UNKNOWN NUMBERS',
    category: 'lifestyle_smart',
    triggers: ['अज्ञात कॉल रिकॉर्डिंग', 'spam call record'],
    actionSpeech: 'अज्ञात नंबर डिटेक्ट हुआ, बैकग्राउंड कॉल रिकॉर्डिंग सक्रिय कर रही हूँ...',
    successSpeech: '{Title}, संदिग्ध कॉल की रिकॉर्डिंग सुरक्षित वॉल्ट में सेव कर दी गई है।',
    failureSpeech: 'कॉल रिकॉर्डर इंजन व्यस्त है या स्टोरेज फुल है, {Title}।'
  },
  {
    id: 'rule_30_medication_reminder',
    name: 'MEDICATION & MEDICINE REMINDER WITH PHOTO VERIFICATION',
    category: 'lifestyle_smart',
    triggers: ['दवाई का समय हो गया', 'दवाई लेनी है', 'medicine reminder'],
    actionSpeech: 'दवाई का समय हो गया है {Title}, कृपया {MedicineName} लें और कैमरे में दिखाएँ...',
    successSpeech: 'दवाई की पुष्टि हो गई है {Title}, आपकी हेल्थ डायरी में टिक मार्क कर दिया गया है।',
    failureSpeech: 'दवाई की पहचान नहीं हो सकी {Title}, कृपया सही स्ट्रिप कैमरे के सामने रखें।'
  },
  {
    id: 'rule_31_invoice_to_sheets',
    name: 'AUTO PDF INVOICE / BILL EXTRACTOR TO SHEETS',
    category: 'lifestyle_smart',
    triggers: ['बिल स्कैन करो', 'रसीद खर्चे में जोड़ो', 'scan bill invoice'],
    actionSpeech: 'बिल का टोटल अमाउंट, तारीख और GST नंबर एक्सट्रैक्ट कर रही हूँ, {Title}...',
    successSpeech: '₹{Amount} का खर्च आपके मंथली बजट शीट में सफलतापूर्वक जोड़ दिया गया है, {Title}।',
    failureSpeech: 'बिल की इमेज धुंधली है, अमाउंट साफ नहीं पढ़ा जा सका, {Title}।'
  },
  {
    id: 'rule_32_auto_bday_wishes',
    name: 'AUTO BIRTHDAY & ANNIVERSARY WISHES ON WHATSAPP',
    category: 'lifestyle_smart',
    triggers: ['जन्मदिन की बधाई भेजो', 'auto birthday wish'],
    actionSpeech: 'आज {Target} का जन्मदिन है, पर्सनलाइज्ड विश तैयार कर रही हूँ...',
    successSpeech: '{Target} को ठीक 12:00 बजे WhatsApp पर सुंदर शुभकामना संदेश भेज दिया गया है, {Title}।',
    failureSpeech: '{Target} का फोन नंबर अमान्य है या नेटवर्क डिस्कनेक्ट था, {Title}।'
  },
  {
    id: 'rule_33_weather_umbrella_alert',
    name: 'SMART WEATHER DISASTER & RAIN UMBRELLA ALERT',
    category: 'lifestyle_smart',
    triggers: ['बारिश का अलर्ट', 'weather rain alert', 'छाता लेकर जाना है क्या'],
    actionSpeech: 'लाइव वेदर रडार और आपके रूट का मौसम चेक कर रही हूँ...',
    successSpeech: '{Title}, अगले 45 मिनट में आपके इलाके में भारी बारिश होने की संभावना है, कृपया छाता साथ रख लें।',
    failureSpeech: 'वेदर सैटेलाइट से डेटा फेच नहीं हो पाया, {Title}।'
  },
  {
    id: 'rule_34_storage_duplicate_cleaner',
    name: 'AUTO STORAGE CLEANER & DUPLICATE MEDIA PURGE',
    category: 'lifestyle_smart',
    triggers: ['स्टोरेज खाली करो', 'डुप्लिकेट फोटो डिलीट करो', 'clean phone storage'],
    actionSpeech: 'कैश फाइल्स, जंक डेटा और डुप्लिकेट फोटोज़ स्कैन कर रही हूँ, {Title}...',
    successSpeech: 'सफलतापूर्वक {CleanSize} जंक फाइलें साफ करके स्टोरेज खाली कर दी गई है, {Title}।',
    failureSpeech: 'सिस्टम स्टोरेज क्लीनर प्रोसेस में एरर आया, {Title}।'
  },
  {
    id: 'rule_35_voice_dictation_doc',
    name: 'VOICE DICTATION TO WORD / NOTION DOCUMENT',
    category: 'lifestyle_smart',
    triggers: ['नया आर्टिकल लिखना शुरू करो', 'डॉक्यूमेंट लिखो', 'start voice dictation'],
    actionSpeech: 'डॉक्यूमेंट एडिटर ओपन करके आपकी आवाज़ को टेक्स्ट में ट्रांसक्राइब कर रही हूँ, {Title}...',
    successSpeech: 'आपका 500 शब्दों का आर्टिकल तैयार करके ड्राफ्ट में सेव कर दिया गया है, {Title}।',
    failureSpeech: 'डॉक्यूमेंट सिंक नहीं हो सका, कृपया इंटरनेट चेक करें, {Title}।'
  },
  {
    id: 'rule_36_smart_traffic_commute',
    name: 'SMART TRAFFIC & BEST ROUTE COMMUTE ALERT',
    category: 'lifestyle_smart',
    triggers: ['ट्रैफिक चेक करो', 'ऑफिस का रास्ता बताओ', 'smart traffic commute'],
    actionSpeech: 'आपके ऑफिस रूट का रियल-टाइम ट्रैफिक और जाम चेक कर रही हूँ...',
    successSpeech: '{Title}, मुख्य हाईवे पर 20 मिनट का जाम है, मैंने 15 मिनट तेज़ वाला वैकल्पिक रूट मैप पर सेट कर दिया है।',
    failureSpeech: 'ट्रैफिक सर्वर रिस्पॉन्स नहीं दे रहा, {Title}।'
  },
  {
    id: 'rule_37_eye_strain_break',
    name: 'EYE STRAIN & POSTURE BREAK ALARM',
    category: 'lifestyle_smart',
    triggers: ['स्क्रीन टाइम ब्रेक', 'eye strain alarm'],
    actionSpeech: 'लगातार स्क्रीन उपयोग डिटेक्ट हुआ...',
    successSpeech: '{Title}, आप 45 मिनट से लगातार स्क्रीन देख रहे हैं। कृपया 20 सेकंड के लिए आँखें बंद करें और पानी पिएँ।',
    failureSpeech: 'अलर्ट डिस्पैच नहीं हुआ, {Title}।'
  },
  {
    id: 'rule_38_train_flight_pnr_status',
    name: 'AUTO FLIGHT / TRAIN PNR LIVE STATUS TRACKER',
    category: 'lifestyle_smart',
    triggers: ['ट्रेन का स्टेटस बताओ', 'फ्लाइट स्टेटस', 'train flight pnr tracker'],
    actionSpeech: 'PNR और लाइव रनिंग स्टेटस फेच कर रही हूँ, {Title}...',
    successSpeech: 'आपकी ट्रेन {TrainName} अपने सही समय से 10 मिनट पहले चल रही है और प्लेटफॉर्म नंबर 3 पर आएगी, {Title}।',
    failureSpeech: 'PNR नंबर नहीं मिला या रेलवे सर्वर में समस्या है, {Title}।'
  },
  {
    id: 'rule_39_privacy_panic_button',
    name: 'INCOGNITO / PRIVACY PANIC BUTTON',
    category: 'lifestyle_smart',
    triggers: ['पैनिक मोड एक्टिवेट करो', 'प्राइवेसी हाइड करो', 'privacy panic mode'],
    actionSpeech: 'सभी रीसेंट ऐप्स बंद करके प्राइवेट वॉल्ट और चैट्स लॉक कर रही हूँ, {Title}...',
    successSpeech: 'सभी प्राइवेट डेटा और स्क्रीन सुरक्षित रूप से हाइड और लॉक कर दी गई है, {Title}।',
    failureSpeech: 'पैनिक मोड एग्जीक्यूट करने में रुकावट आई, {Title}।'
  },
  {
    id: 'rule_40_hydration_water_notifier',
    name: 'SMART WATER INTAKE & HYDRATION NOTIFIER',
    category: 'lifestyle_smart',
    triggers: ['पानी पीने का समय', 'water hydration reminder'],
    actionSpeech: 'डेली हाइड्रेशन लेवल मॉनिटर कर रही हूँ...',
    successSpeech: '{Title}, आज आपने 1.5 लीटर पानी पिया है। अपने 3 लीटर लक्ष्य को पूरा करने के लिए एक ग्लास पानी पी लें।',
    failureSpeech: 'सेंसर ट्रैकिंग ऑफलाइन है, {Title}।'
  },

  // =======================================================
  // --- 15 NEURAL TRADING & FINANCE AUTOMATIONS (41-55) ---
  // =======================================================
  {
    id: 'rule_41_support_resistance_marker',
    name: 'AUTO SUPPORT & RESISTANCE LEVEL MARKER',
    category: 'finance_trading',
    triggers: ['सपोर्ट और रेजिस्टेंस मार्क करो', 'levels ड्रॉ करो', 'mark support resistance'],
    actionSpeech: 'चार्ट के स्विंग हाई और स्विंग लो पॉइंट्स स्कैन करके की-लेवल्स मार्क कर रही हूँ, {Title}...',
    successSpeech: 'प्रमुख सपोर्ट ₹{SupportPrice} और रेजिस्टेंस ₹{ResistancePrice} पर हॉरिजॉन्टल ज़ोन मार्क कर दिए गए हैं, {Title}।',
    failureSpeech: 'चार्ट टाइमफ्रेम स्पष्ट नहीं है या डेटा लोड नहीं हो सका, {Title}।'
  },
  {
    id: 'rule_42_breakout_volume_alert',
    name: 'BREAKOUT & BREAKDOWN REAL-TIME VOICE ALERT',
    category: 'finance_trading',
    triggers: ['ब्रेकआउट अलर्ट', 'breakout breakdown radar'],
    actionSpeech: 'लेवल ब्रेकआउट डिटेक्ट हुआ, वॉल्यूम कन्फर्मेशन चेक कर रही हूँ...',
    successSpeech: 'अलर्ट {Title}! {StockIndex} ने ₹{LevelPrice} का रेजिस्टेंस भारी वॉल्यूम के साथ तोड़ा है, बुलिश ब्रेकआउट कन्फर्म हुआ।',
    failureSpeech: 'फेक ब्रेकआउट डिटेक्ट हुआ है {Title}, ट्रैप से बचें।'
  },
  {
    id: 'rule_43_candlestick_pattern_scanner',
    name: 'CANDLESTICK PATTERN RECOGNITION',
    category: 'finance_trading',
    triggers: ['कौन सा कैंडलस्टिक पैटर्न बन रहा है', 'कैंडल पैटर्न पहचानो', 'candlestick pattern scanner'],
    actionSpeech: 'कैंडल फॉर्मेशन (Hammer, Doji, Engulfing, Morning Star) स्कैन कर रही हूँ, {Title}...',
    successSpeech: '{Title}, 15 मिनट चार्ट पर सपोर्ट लेवल पर स्ट्रॉन्ग {CandlePattern} बना है, ट्रेंड रिवर्सल की संभावना है।',
    failureSpeech: 'कोई स्पष्ट कैंडलस्टिक पैटर्न डिटेक्ट नहीं हुआ, मार्केट साइडवेज़ है {Title}।'
  },
  {
    id: 'rule_44_custom_strategy_tracker',
    name: 'CUSTOM USER STRATEGY TRACKER',
    category: 'finance_trading',
    triggers: ['मेरी स्ट्रैटेजी ट्रैक करो', '9:20 ब्रेकआउट ट्रैक करो', 'ema क्रॉसओवर स्ट्रैटेजी'],
    actionSpeech: 'आपकी बताई गई स्ट्रैटेजी के सभी 3 रूल्स (EMA 9/21 + RSI 60 + वॉल्यूम) लाइव मॉनिटर कर रही हूँ, {Title}...',
    successSpeech: 'आपकी स्ट्रैटेजी के सभी रूल्स मैच हो गए हैं {Title}! {StockIndex} में परफेक्ट एंट्री बन रही है।',
    failureSpeech: 'कंडीशन पूरी नहीं हुई {Title}, 1 रूल मिसिंग है इसलिए ट्रेड अवॉयड करें।'
  },
  {
    id: 'rule_45_risk_reward_position_calc',
    name: 'SMART RISK-REWARD & POSITION SIZING CALCULATOR',
    category: 'finance_trading',
    triggers: ['स्टॉपलॉस और टारगेट बताओ', 'लॉट साइज कितना लूँ', 'risk reward calculator'],
    actionSpeech: '1:2 और 1:3 रिस्क-रिवॉर्ड रेश्यो और 2% कैपिटल रिस्क कैलकुलेट कर रही हूँ, {Title}...',
    successSpeech: '{Title}, आपका स्टॉपलॉस ₹{SLPrice} और टारगेट ₹{TargetPrice} होगा। आपकी रिस्क के हिसाब से लॉट साइज {LotSize} शेयर रखें।',
    failureSpeech: 'रिस्क-टू-रिवॉर्ड 1:1.5 से कम आ रहा है, यह ट्रेड रेकमेंडेड नहीं है {Title}।'
  },
  {
    id: 'rule_46_option_chain_pcr_radar',
    name: 'OPTION CHAIN & OPEN INTEREST (OI) RADAR',
    category: 'finance_trading',
    triggers: ['ऑप्शन चेन का डेटा बताओ', 'nifty pcr ratio', 'option chain open interest'],
    actionSpeech: 'कॉल और पुट राइटर्स का ओपन इंटरेस्ट (OI) और PCR रेश्यो फेच कर रही हूँ, {Title}...',
    successSpeech: 'PCR {PCRRatio} है और {StrikePrice} पर सबसे ज्यादा पुट राइटिंग है, मार्केट का सेंटीमेंट बुलिश है {Title}।',
    failureSpeech: 'NSE ऑप्शन चेन सर्वर से लाइव डेटा फेच नहीं हो पाया, {Title}।'
  },
  {
    id: 'rule_47_trailing_stoploss_alert',
    name: 'AUTO TRAILING STOPLOSS & PROFIT BOOKING ALERT',
    category: 'finance_trading',
    triggers: ['ट्रेलिंग स्टॉपलॉस लगाओ', 'trailing stoploss alert'],
    actionSpeech: 'प्रॉफिट टारगेट 1 हिट हुआ, ट्रेलिंग स्टॉपलॉस अपडेट कर रही हूँ...',
    successSpeech: '{Title}, टारगेट 1 आ चुका है! स्टॉपलॉस को कॉस्ट-टू-कॉस्ट ₹{EntryPrice} पर ट्रेल कर दिया गया है, प्रॉफिट सुरक्षित है।',
    failureSpeech: 'ट्रेलिंग स्टॉपलॉस अपडेट करने में समस्या आई, {Title}।'
  },
  {
    id: 'rule_48_smc_orderblock_fvg',
    name: 'SMART MONEY CONCEPTS (SMC) & ORDER BLOCK SCANNER',
    category: 'finance_trading',
    triggers: ['आर्डर ब्लॉक मार्क करो', 'फेयर वैल्यू गैप मार्क करो', 'smc order block fvg'],
    actionSpeech: 'स्मार्ट मनी लिक्विडिटी ज़ोन और इम्बैलेंस (FVG) एरिया ड्रा कर रही हूँ, {Title}...',
    successSpeech: '1 घंटे के टाइमफ्रेम पर ₹{PriceRange} में बुलिश आर्डर ब्लॉक और लिक्विडिटी गैप मार्क कर दिया गया है, {Title}।',
    failureSpeech: 'कोई वैलिड फेयर वैल्यू गैप नहीं मिला, {Title}।'
  },
  {
    id: 'rule_49_rsi_divergence_detector',
    name: 'RSI DIVERGENCE (REGULAR & HIDDEN) DETECTOR',
    category: 'finance_trading',
    triggers: ['rsi डायवर्जेंस चेक करो', 'rsi divergence detector'],
    actionSpeech: 'प्राइस स्विंग्स और RSI इंडिकेटर के बीच डायवर्जेंस की तुलना कर रही हूँ, {Title}...',
    successSpeech: 'अलर्ट {Title}! प्राइस नया लो बना रहा है लेकिन RSI हायर लो बना रहा है, स्ट्रॉन्ग \'बुलिश डायवर्जेंस\' मौजूद है।',
    failureSpeech: 'प्राइस और RSI दोनों एक ही दिशा में चल रहे हैं, कोई डायवर्जेंस नहीं है {Title}।'
  },
  {
    id: 'rule_50_premarket_global_briefing',
    name: 'DAILY PRE-MARKET & GLOBAL MARKET BRIEFING',
    category: 'finance_trading',
    triggers: ['मार्केट का मूड बताओ', 'pre market briefing', 'global market status'],
    actionSpeech: 'GIFT Nifty, डाउ जोन्स (Dow Jones), क्रूड ऑयल और FII/DII डेटा कंपाइल कर रही हूँ, {Title}...',
    successSpeech: '{Title}, आज गिफ्ट निफ्टी 80 अंक ऊपर है और FII ने ₹1200 करोड़ की बाइंग की है। मार्केट गैप-अप खुलने की संभावना है।',
    failureSpeech: 'ग्लोबल मार्केट फीड लोड नहीं हो सकी, {Title}।'
  },
  {
    id: 'rule_51_fibonacci_golden_zone',
    name: 'FIBONACCI GOLDEN RETRACEMENT (0.5 - 0.618) AUTO DRAW',
    category: 'finance_trading',
    triggers: ['फिबोनाची रिट्रेसमेंट लेवल्स लगाओ', 'fibonacci golden zone'],
    actionSpeech: 'हालिया स्विंग लो से स्विंग हाई तक 0.382, 0.50 और 0.618 गोल्डन ज़ोन कैलकुलेट कर रही हूँ, {Title}...',
    successSpeech: 'गोल्डन 0.618 रिट्रेसमेंट लेवल ₹{PriceRange} पर आ रहा है, जहाँ से रिवर्सल का मजबूत चांस है, {Title}।',
    failureSpeech: 'स्विंग हाई/लो पॉइंट सही से डिटेक्ट नहीं हुए, {Title}।'
  },
  {
    id: 'rule_52_rbi_fed_economic_news',
    name: 'HIGH-IMPACT ECONOMIC NEWS & RBI POLICY EVENT ALERT',
    category: 'finance_trading',
    triggers: ['इकोनॉमिक न्यूज़ अलर्ट', 'rbi policy alert', 'high impact news'],
    actionSpeech: 'इकोनॉमिक कैलेंडर और हाई-इम्पैक्ट इवेंट्स ट्रैक कर रही हूँ...',
    successSpeech: 'वार्निंग {Title}! 10 मिनट बाद RBI मॉनेटरी पॉलिसी का फैसला आने वाला है, वोलेटिलिटी से बचने के लिए नई पोजीशन होल्ड रखें।',
    failureSpeech: 'इकोनॉमिक कैलेंडर सिंक नहीं हो पाया, {Title}।'
  },
  {
    id: 'rule_53_auto_trade_pnl_journal',
    name: 'AUTO TRADE JOURNAL & P&L VOICE DIARY',
    category: 'finance_trading',
    triggers: ['आज का ट्रेड जर्नल लिखो', 'trade pnl journal', 'p&l डायरी'],
    actionSpeech: 'एंट्री, एग्जिट, रिस्क-रिवॉर्ड और आज का नेट प्रॉफिट/लॉस ऑटो-जर्नल में रिकॉर्ड कर रही हूँ, {Title}...',
    successSpeech: 'आज का ट्रेड सफलता से जर्नल में दर्ज हो गया है {Title}। आज का नेट P&L: +₹{ProfitAmount}, विन रेट: 75%।',
    failureSpeech: 'जर्नल डेटाबेस सिंक नहीं हो सका, {Title}।'
  },
  {
    id: 'rule_54_crypto_forex_whale_flow',
    name: 'CRYPTO & FOREX 24/7 WHALE MOVEMENT RADAR',
    category: 'finance_trading',
    triggers: ['क्रिप्टो व्हेल मूवमेंट', 'whale alert crypto', 'forex whale flow'],
    actionSpeech: 'ऑन-चेन डेटा और एक्सचेंज इनफ्लो/आउटफ्लो स्कैन कर रही हूँ...',
    successSpeech: '{Title}, पिछले 5 मिनट में Binance पर $25M का बिटकॉइन डंप हुआ है, क्विक डिप की संभावना है।',
    failureSpeech: 'ऑन-चेन ट्रैकर ऑफलाइन है, {Title}।'
  },
  {
    id: 'rule_55_multi_timeframe_confluence',
    name: 'MULTI-TIMEFRAME TREND CONFLUENCE SCANNER',
    category: 'finance_trading',
    triggers: ['मल्टी-टाइमफ्रेम एनालिसिस करो', 'multi timeframe confluence'],
    actionSpeech: 'डेली, 1 घंटा, 15 मिनट और 5 मिनट चार्ट्स का ट्रेंड एक साथ अलाइन कर रही हूँ, {Title}...',
    successSpeech: '{Title}, डेली और 1 घंटे पर अपट्रेंड है, और 15 मिनट पर सपोर्ट से बाउंस हो रहा है। ट्रेंड का 100% कन्फर्मेशन है।',
    failureSpeech: 'टाइमफ्रेम्स आपस में टकरा रहे हैं (Daily बुलिश, 15m बेयरिश), ट्रेड रिस्की है {Title}।'
  }
];

export class AutomationDialogueManager {
  private static instance: AutomationDialogueManager | null = null;
  private rules: AutomationVoiceRule[] = AUTOMATION_VOICE_RULES;
  private userTitle: string = 'सर';
  private userName: string = 'अमित';

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedTitle = localStorage.getItem('mayra_user_title');
      if (savedTitle) this.userTitle = savedTitle;
      const savedName = localStorage.getItem('mayra_user_name');
      if (savedName) this.userName = savedName;
    }
  }

  public static getInstance(): AutomationDialogueManager {
    if (!this.instance) {
      this.instance = new AutomationDialogueManager();
    }
    return this.instance;
  }

  public getRule(id: string): AutomationVoiceRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  public getAllRules(): AutomationVoiceRule[] {
    return this.rules;
  }

  public findMatchingRule(text: string): AutomationVoiceRule | undefined {
    const clean = text.toLowerCase().trim();
    return this.rules.find(r => 
      r.triggers.some(t => clean.includes(t.toLowerCase()))
    );
  }

  /**
   * Formats a dialogue string by interpolating {Title}, {UserName}, and any custom placeholders.
   */
  public formatDialogue(template: string, placeholders: Record<string, string> = {}): string {
    let result = template
      .replace(/{Title}/g, this.userTitle)
      .replace(/{UserName}/g, this.userName)
      .replace(/{User_Name}/g, this.userName);

    Object.entries(placeholders).forEach(([key, val]) => {
      const reg = new RegExp(`{${key}}`, 'g');
      result = result.replace(reg, val);
    });

    return result;
  }

  public setUserTitle(title: string): void {
    this.userTitle = title;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_user_title', title);
    }
  }

  public setUserName(name: string): void {
    this.userName = name;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_user_name', name);
    }
  }

  public getUserTitle(): string { return this.userTitle; }
  public getUserName(): string { return this.userName; }
}
