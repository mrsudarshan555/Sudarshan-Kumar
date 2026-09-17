import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type AppLanguage = 
  | 'en'       // English
  | 'hi'       // हिन्दी (Hindi)
  | 'hinglish' // हिंग्लिश (Hinglish)
  | 'es'       // Español (Spanish)
  | 'fr'       // Français (French)
  | 'de'       // Deutsch (German)
  | 'bn'       // বাংলা (Bengali)
  | 'mr'       // मराठी (Marathi)
  | 'te'       // తెలుగు (Telugu)
  | 'ta'       // தமிழ் (Tamil)
  | 'ur'       // اردو (Urdu)
  | 'gu'       // ગુજરાતી (Gujarati)
  | 'kn'       // ಕನ್ನಡ (Kannada)
  | 'ml'       // മലയാളം (Malayalam)
  | 'pa'       // ਪੰਜਾਬੀ (Punjabi)
  | 'ar'       // العربية (Arabic)
  | 'ja';      // 日本語 (Japanese)

export type LanguageCode = AppLanguage;

export interface LanguageOption {
  id: AppLanguage;
  code: AppLanguage;
  name: string;
  label: string;
  nativeName: string;
  native: string;
  flag: string;
  region: string;
  badge?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'en', code: 'en', name: 'English', label: 'English', nativeName: 'English (US/UK)', native: 'English (US/UK)', flag: '🇺🇸', region: 'Global', badge: 'Default' },
  { id: 'hi', code: 'hi', name: 'Hindi', label: 'Hindi', nativeName: 'हिन्दी', native: 'हिन्दी', flag: '🇮🇳', region: 'India', badge: 'Popular' },
  { id: 'hinglish', code: 'hinglish', name: 'Hinglish', label: 'Hinglish', nativeName: 'हिंग्लिश (Mix)', native: 'हिंग्लिश (Mix)', flag: '🇮🇳', region: 'India', badge: 'Casual' },
  { id: 'es', code: 'es', name: 'Spanish', label: 'Spanish', nativeName: 'Español', native: 'Español', flag: '🇪🇸', region: 'Global' },
  { id: 'fr', code: 'fr', name: 'French', label: 'French', nativeName: 'Français', native: 'Français', flag: '🇫🇷', region: 'Europe' },
  { id: 'de', code: 'de', name: 'German', label: 'German', nativeName: 'Deutsch', native: 'Deutsch', flag: '🇩🇪', region: 'Europe' },
  { id: 'bn', code: 'bn', name: 'Bengali', label: 'Bengali', nativeName: 'বাংলা', native: 'বাংলা', flag: '🇧🇩', region: 'South Asia' },
  { id: 'mr', code: 'mr', name: 'Marathi', label: 'Marathi', nativeName: 'मराठी', native: 'मराठी', flag: '🇮🇳', region: 'India' },
  { id: 'te', code: 'te', name: 'Telugu', label: 'Telugu', nativeName: 'తెలుగు', native: 'తెలుగు', flag: '🇮🇳', region: 'India' },
  { id: 'ta', code: 'ta', name: 'Tamil', label: 'Tamil', nativeName: 'தமிழ்', native: 'தமிழ்', flag: '🇮🇳', region: 'India' },
  { id: 'ur', code: 'ur', name: 'Urdu', label: 'Urdu', nativeName: 'اردو', native: 'اردو', flag: '🇵🇰', region: 'South Asia' },
  { id: 'gu', code: 'gu', name: 'Gujarati', label: 'Gujarati', nativeName: 'ગુજરાતી', native: 'ગુજરાતી', flag: '🇮🇳', region: 'India' },
  { id: 'kn', code: 'kn', name: 'Kannada', label: 'Kannada', nativeName: 'ಕನ್ನಡ', native: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'India' },
  { id: 'ml', code: 'ml', name: 'Malayalam', label: 'Malayalam', nativeName: 'മലയാളം', native: 'മലയാളം', flag: '🇮🇳', region: 'India' },
  { id: 'pa', code: 'pa', name: 'Punjabi', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'India' },
  { id: 'ar', code: 'ar', name: 'Arabic', label: 'Arabic', nativeName: 'العربية', native: 'العربية', flag: '🇸🇦', region: 'Middle East' },
  { id: 'ja', code: 'ja', name: 'Japanese', label: 'Japanese', nativeName: '日本語', native: '日本語', flag: '🇯🇵', region: 'East Asia' },
];


export interface PermissionDetailsTranslation {
  description: string;
  whatBecomesPossible: string;
  subCapabilities: string;
  riskWarning: string;
  privacyPolicy: string;
}

export interface AppTranslations {
  // Navigation & Common
  home: string;
  chat: string;
  camera: string;
  settings: string;
  profile: string;
  loading: string;
  granted: string;
  grant: string;
  required: string;
  save: string;
  cancel: string;
  back: string;
  search: string;

  // Onboarding
  selectLanguageTitle: string;
  selectLanguageSubtitle: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  getStarted: string;
  continueBtn: string;
  profileSetupTitle: string;
  profileSetupSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  permissionsTitle: string;
  permissionsSubtitle: string;
  grantAll: string;
  readyTitle: string;
  readySubtitle: string;
  launchApp: string;
  launchMayra: string;
  chooseLanguage: string;
  chooseLanguageSub: string;

  // Profile Photo
  profilePhoto: string;
  uploadPhoto: string;
  chooseDefaultPhoto: string;
  changePhoto: string;
  removePhoto: string;
  photoUpdatedToast: string;

  // Permission Center
  permissionCenterTitle: string;
  permissionCenterSubtitle: string;
  permissionCenterNotice: string;
  whatBecomesPossibleLabel: string;
  subCapabilitiesLabel: string;
  riskWarningLabel: string;
  privacyPolicyLabel: string;
  allPermissionsGood: string;

  // Permissions Map
  permissions: Record<string, PermissionDetailsTranslation>;
}

const EN_PERMISSIONS: Record<string, PermissionDetailsTranslation> = {
  default_assistant: {
    description: "Make MAYRA the phone's primary digital assistant, replacing default phone assistant.",
    whatBecomesPossible: "Swiping from screen corners or holding the power key summons MAYRA instantly even when the screen is locked.",
    subCapabilities: "Sub-capabilities: Hardware key interception, lockscreen overlay rendering, and hands-free background standby listening.",
    riskWarning: "⚠️ Replaces your system default assistant. Allows MAYRA to intercept hardware shortcut triggers.",
    privacyPolicy: "Privacy Policy: Standby monitoring happens entirely locally. No ambient audio or keystrokes are uploaded during standby."
  },
  microphone: {
    description: "Required so you can talk to MAYRA hands-free and issue voice instructions.",
    whatBecomesPossible: "Enables hands-free wake word recognition ('Hey Mayra'), voice queries, push-to-talk voice recording, and voice calls.",
    subCapabilities: "Sub-capabilities: Live microphone audio streaming, on-device audio threshold detection, real-time speech transcription.",
    riskWarning: "⚠️ Accesses your device microphone. Audio is captured only during active voice sessions and never recorded secretly.",
    privacyPolicy: "Privacy Policy: Voice streams are processed in real-time to answer your queries. Audio is never sold, shared, or used for advertising."
  },
  camera: {
    description: "So MAYRA can take photos, record video, scan QR codes, and visually analyze documents.",
    whatBecomesPossible: "Allows MAYRA to inspect photos/receipts, assist with live video queries, scan document text, and snap front/back camera pictures.",
    subCapabilities: "Sub-capabilities: Front & rear lens capture, high-resolution photo snapping, and live video stream frame processing.",
    riskWarning: "⚠️ Grants full camera access to take photos and video. Never activates in background without your explicit command.",
    privacyPolicy: "Privacy Policy: Camera images are processed ephemerally in memory to answer queries and are not retained on remote servers."
  },
  phone_calls: {
    description: "So MAYRA can place direct phone calls to your contacts and emergency services.",
    whatBecomesPossible: "Enables voice-triggered calling (e.g. 'Call Mom') and rapid dispatch to 112 / 108 emergency dialers via cellular SIM.",
    subCapabilities: "Sub-capabilities: Telecom dialer intent dispatch, direct phone call initiation, cellular telephony status query.",
    riskWarning: "⚠️ Cellular network calls may incur carrier charges according to your mobile operator plan.",
    privacyPolicy: "Privacy Policy: Dialed numbers are resolved purely from your local address book. Call audio is not tapped or recorded."
  },
  location: {
    description: "So MAYRA can provide local weather, navigation directions, and live SOS GPS coordinates.",
    whatBecomesPossible: "Gives you hyper-local weather updates, route navigation guidance, nearby services, and dispatches GPS in emergency SOS alerts.",
    subCapabilities: "Sub-capabilities: High-accuracy GPS (Fine location), cell/Wi-Fi triangulation (Coarse location), and geofence alerts.",
    riskWarning: "⚠️ Reveals precise geographic location coordinates. Coordinates are broadcast to emergency contacts during active SOS.",
    privacyPolicy: "Privacy Policy: Location is accessed on-demand for specific requests (weather/maps/SOS) and is never tracked continuously or sold."
  },
  contacts: {
    description: "So MAYRA can look up contact numbers and relationship nicknames when placing calls or sending SMS.",
    whatBecomesPossible: "Allows hands-free dialing ('Call Priya') and contact search without manually browsing your phonebook.",
    subCapabilities: "Sub-capabilities: Read contacts list, search names, phonetic pronunciation resolution, and emergency contact lookup.",
    riskWarning: "⚠️ Reads your private contact phone numbers, emails, and address book entries.",
    privacyPolicy: "Privacy Policy: Contacts are indexed locally on your phone. Your address book is never synchronized with external marketing lists."
  },
  sms: {
    description: "So MAYRA can draft text messages and automatically dispatch emergency SMS with coordinates.",
    whatBecomesPossible: "Enables voice dictation of SMS messages and automated safety SMS broadcasts during emergency SOS triggers.",
    subCapabilities: "Sub-capabilities: Send SMS via SIM card, compose message payloads, and trigger auto-replies while in Driving Mode.",
    riskWarning: "⚠️ SMS messages are dispatched via your carrier SIM card and may incur standard carrier messaging fees.",
    privacyPolicy: "Privacy Policy: Messages are dispatched only upon your confirmation or during emergency SOS trigger. Incoming SMS is not mined."
  },
  gallery_files: {
    description: "So MAYRA can find photos, videos, receipts, and files to share or analyze with AI vision.",
    whatBecomesPossible: "Allows you to ask MAYRA to retrieve specific photos, inspect documents, or attach files to WhatsApp or emails.",
    subCapabilities: "Sub-capabilities: Read media images, browse video files, access downloaded PDF/office documents.",
    riskWarning: "⚠️ Grants read access to personal media files and downloads on device storage.",
    privacyPolicy: "Privacy Policy: Only files specifically requested or uploaded by you are accessed. Your gallery is never scanned or uploaded in bulk."
  },
  manage_calls: {
    description: "So MAYRA can announce incoming caller names and answer or reject calls via voice commands.",
    whatBecomesPossible: "Speaks the caller's name aloud during incoming rings and lets you say 'Answer' or 'Decline' hands-free.",
    subCapabilities: "Sub-capabilities: Inspect incoming call state, match caller phone numbers against call log, issue answer/end telephony intents.",
    riskWarning: "⚠️ Controls incoming phone call states. Note that cellular calls cannot have two-way AI speech on standard Android.",
    privacyPolicy: "Privacy Policy: Caller information is checked in real-time memory strictly to speak the name. No call recording is performed."
  },
  notification_access: {
    description: "To read aloud notifications from messaging apps and resolve caller names hidden by Android.",
    whatBecomesPossible: "Enables notification summaries, reading WhatsApp/Telegram messages aloud while driving, and detecting incoming caller IDs.",
    subCapabilities: "Sub-capabilities: Notification listener service, message text extraction, inline quick-reply actions.",
    riskWarning: "⚠️ Highly sensitive: Grants visibility into notifications from all apps, including OTPs and chat previews.",
    privacyPolicy: "Privacy Policy: Notifications are parsed locally in device RAM. Banking credentials and OTPs are ignored and never logged."
  },
  accessibility_service: {
    description: "For deep automation: navigating inside apps (WhatsApp/YouTube) and screen reading.",
    whatBecomesPossible: "Empowers MAYRA to perform complex multi-step tasks across apps, tap buttons, play YouTube videos, and assist visually.",
    subCapabilities: "Sub-capabilities: UI node tree inspection, simulated touch/tap/scroll gestures, active application state monitoring.",
    riskWarning: "⚠️ Deep device control permission. Can observe your screen and perform touches on your behalf.",
    privacyPolicy: "Privacy Policy: Automation triggers only upon explicit user voice command. Passwords and banking inputs are completely bypassed."
  },
  battery_optimization: {
    description: "So MAYRA keeps running reliably in the background when the screen is locked.",
    whatBecomesPossible: "Prevents the operating system from terminating MAYRA, ensuring wake-word detection and driving shields remain active.",
    subCapabilities: "Sub-capabilities: Exemption from OS Doze mode and manufacturer aggressive background task cleaners.",
    riskWarning: "⚠️ Slightly increases standby battery usage to maintain continuous background readiness.",
    privacyPolicy: "Privacy Policy: Does not collect any user data. This is an operating system process execution permission."
  },
  overlay: {
    description: "So MAYRA can render a floating glass bubble and heads-up voice controls over other apps.",
    whatBecomesPossible: "Displays the floating MAYRA glass orb over your games, browser, or maps for one-tap voice access anywhere.",
    subCapabilities: "Sub-capabilities: System alert window rendering, floating touch event handling, compact multi-tasking UI.",
    riskWarning: "⚠️ Renders visual elements on top of other running applications.",
    privacyPolicy: "Privacy Policy: The overlay strictly receives touches within its own boundaries; it does not log inputs from apps beneath it."
  },
  screen_capture: {
    description: "So MAYRA can inspect your screen live when you request screen sharing or visual assistance.",
    whatBecomesPossible: "Allows MAYRA to analyze what is currently visible on your display, explain complex articles, or troubleshoot bugs.",
    subCapabilities: "Sub-capabilities: Media projection video capture stream, real-time visual frame analysis.",
    riskWarning: "⚠️ Everything visible on your screen (including personal chats or private info) is visible to the AI while active.",
    privacyPolicy: "Privacy Policy: Requires explicit system confirmation prompt each time. Video stream terminates immediately when you tap Stop."
  }
};

const HI_PERMISSIONS: Record<string, PermissionDetailsTranslation> = {
  default_assistant: {
    description: "MAYRA को फ़ोन का मुख्य डिजिटल असिस्टेंट बनाएं, जिससे यह डिफ़ॉल्ट असिस्टेंट को बदल सके।",
    whatBecomesPossible: "स्क्रीन के कोनों से स्वाइप करने या पावर बटन दबाने पर लॉक स्क्रीन पर भी MAYRA तुरंत सक्रिय हो जाती है।",
    subCapabilities: "उप-क्षमताएं: हार्डवेयर बटन शॉर्टकट, लॉकस्क्रीन ओवरले प्रदर्शन, और हैंड्स-फ़्री बैकग्राउंड स्टैंडबाय लिसनिंग।",
    riskWarning: "⚠️ यह आपके सिस्टम डिफ़ॉल्ट असिस्टेंट को बदलता है और हार्डवेयर शॉर्टकट को सक्रिय करता है।",
    privacyPolicy: "गोपनीयता नीति: स्टैंडबाय लिसनिंग पूरी तरह से डिवाइस पर होती है। बैकग्राउंड में कोई बातचीत रिकॉर्ड नहीं होती।"
  },
  microphone: {
    description: "आवश्यक अनुमति, ताकि आप MAYRA से हैंड्स-फ़्री बोल सकें और वॉयस कमांड दे सकें।",
    whatBecomesPossible: "हैंड्स-फ़्री वेक वर्ड ('हे मायरा'), वॉयस कमांड, पुश-टू-टॉक रिकॉर्डिंग और वॉयस कॉल सक्षम करता है।",
    subCapabilities: "उप-क्षमताएं: लाइव माइक्रोफ़ोन ऑडियो स्ट्रीमिंग, ऑन-डिवाइस वॉयस डिटेक्शन, और रियल-टाइम स्पीच ट्रांसक्रिप्शन।",
    riskWarning: "⚠️ माइक्रोफ़ोन का उपयोग करता है। ऑडियो केवल सक्रिय सत्र के दौरान ही उपयोग होता है, कभी गुप्त रिकॉर्डिंग नहीं होती।",
    privacyPolicy: "गोपनीयता नीति: वॉयस स्ट्रीम का उपयोग केवल आपके सवालों का जवाब देने के लिए होता है। ऑडियो कभी बेचा या विज्ञापनों में नहीं जाता।"
  },
  camera: {
    description: "ताकि MAYRA फ़ोटो ले सके, वीडियो रिकॉर्ड कर सके, QR कोड स्कैन कर सके और दस्तावेज़ देख सके।",
    whatBecomesPossible: "MAYRA को रसीदें/फ़ोटो देखने, लाइव वीडियो प्रश्नों में मदद करने, और फ़्रंट/बैक कैमरा से फ़ोटो लेने की सुविधा देता है।",
    subCapabilities: "उप-क्षमताएं: फ़्रंट व बैक कैमरा कैप्चर, हाई-रिज़ॉल्यूशन फ़ोटो क्लिक, और लाइव वीडियो फ्रेम विश्लेषण।",
    riskWarning: "⚠️ फ़ोटो और वीडियो लेने की पूरी अनुमति देता है। आपकी स्पष्ट आज्ञा के बिना कभी बैकग्राउंड में सक्रिय नहीं होता।",
    privacyPolicy: "गोपनीयता नीति: कैमरा छवियों का विश्लेषण केवल तात्कालिक उत्तर के लिए होता है और इन्हें रिमोट सर्वर पर सुरक्षित नहीं रखा जाता।"
  },
  phone_calls: {
    description: "ताकि MAYRA आपके संपर्कों और आपातकालीन सेवाओं को सीधे फ़ोन कॉल लगा सके।",
    whatBecomesPossible: "वॉयस से कॉल लगाने ('मम्मी को कॉल करो') और सिम कार्ड के ज़रिए 112 / 108 डायल करने की सुविधा मिलती है।",
    subCapabilities: "उप-क्षमताएं: टेलीकॉम डायलर ट्रिगर, सीधी फ़ोन कॉल शुरुआत, और सेलुलर नेटवर्क स्थिति जांच।",
    riskWarning: "⚠️ सेलुलर नेटवर्क कॉल्स के लिए आपके ऑपरेटर प्लान के अनुसार कॉल शुल्क लग सकता है।",
    privacyPolicy: "गोपनीयता नीति: नंबर केवल आपकी स्थानीय संपर्क सूची से लिए जाते हैं। कॉल की बातचीत रिकॉर्ड नहीं की जाती।"
  },
  location: {
    description: "ताकि MAYRA मौसम, नेविगेशन दिशा-निर्देश और आपातकालीन SOS GPS निर्देशांक दे सके।",
    whatBecomesPossible: "सटीक स्थानीय मौसम, मैप नेविगेशन, आस-पास की सेवाएं और आपातकालीन स्थिति में लाइव GPS स्थान साझा करता है।",
    subCapabilities: "उप-क्षमताएं: उच्च-सटीक GPS (फ़ाइन लोकेशन), सेल टॉवर ट्राइएंगुलेशन, और जियोफ़ेंस चेतावनी।",
    riskWarning: "⚠️ आपके सटीक भौगोलिक स्थान की जानकारी देता है। सक्रिय SOS के दौरान यह आपातकालीन संपर्कों को भेजा जाता है।",
    privacyPolicy: "गोपनीयता नीति: लोकेशन केवल विशिष्ट अनुरोधों (मौसम/मैप/SOS) पर ही जांची जाती है और कभी बेची नहीं जाती।"
  },
  contacts: {
    description: "ताकि MAYRA कॉल लगाने या संदेश भेजने के समय संपर्क नंबर व नाम पहचान सके।",
    whatBecomesPossible: "संपर्क सूची खोले बिना हैंड्स-फ़्री कॉल ('प्रिया को कॉल करो') और नाम की पहचान संभव होती है।",
    subCapabilities: "उप-क्षमताएं: संपर्क सूची पढ़ना, नामों की खोज, उच्चारण मिलान, और आपातकालीन संपर्कों की पहचान।",
    riskWarning: "⚠️ आपकी निजी संपर्क सूची, फ़ोन नंबर और ईमेल पते को पढ़ने की अनुमति मांगता है।",
    privacyPolicy: "गोपनीयता नीति: संपर्क जानकारी केवल आपके फ़ोन पर ही सुरक्षित रहती है और किसी बाहरी सर्वर पर अपलोड नहीं होती।"
  },
  sms: {
    description: "ताकि MAYRA टेक्स्ट मैसेज भेज सके और SOS में GPS सहित आपातकालीन SMS भेज सके।",
    whatBecomesPossible: "वॉयस डिक्टेशन से SMS भेजने और आपातकालीन SOS ट्रिगर होने पर स्वचालित सुरक्षा SMS भेजने की सुविधा।",
    subCapabilities: "उप-क्षमताएं: सिम कार्ड द्वारा SMS प्रेषण, संदेश निर्माण, और ड्राइविंग मोड में ऑटो-रिप्लाई।",
    riskWarning: "⚠️ आपके सिम कार्ड से SMS भेजे जाते हैं, जिसके लिए मानक ऑपरेटर संदेश शुल्क लग सकता है।",
    privacyPolicy: "गोपनीयता नीति: संदेश केवल आपकी सहमति या आपातकालीन SOS पर ही भेजे जाते हैं। आने वाले निजी SMS को नहीं पढ़ा जाता।"
  },
  gallery_files: {
    description: "ताकि MAYRA फ़ोटो, वीडियो, रसीदें व फ़ाइलें ढूंढ सके और AI विज़न से उनका विश्लेषण कर सके।",
    whatBecomesPossible: "MAYRA को पुरानी फ़ोटो खोजने, दस्तावेज़ देखने, या व्हाट्सएप/ईमेल पर फ़ाइलें अटैच करने का आदेश दे सकते हैं।",
    subCapabilities: "उप-क्षमताएं: मीडिया छवियां पढ़ना, वीडियो फ़ाइलें देखना, और डाउनलोड की गई PDF/दस्तावेज़ फ़ाइलें खोलना।",
    riskWarning: "⚠️ डिवाइस स्टोरेज में मौजूद निजी मीडिया फ़ाइलों और डाउनलोड्स को पढ़ने की अनुमति देता है।",
    privacyPolicy: "गोपनीयता नीति: केवल आपके द्वारा अनुरोधित फ़ाइलों की ही जांच की जाती है। आपकी गैलरी कभी बल्क में अपलोड नहीं होती।"
  },
  manage_calls: {
    description: "ताकि MAYRA आने वाले कॉलर का नाम बोलकर बताए और वॉयस से कॉल उठाने या काटने की सुविधा दे।",
    whatBecomesPossible: "फ़ोन बजने पर कॉलर का नाम बोलकर सुनाता है और 'Answer' या 'Decline' बोलकर कॉल नियंत्रित करने देता है।",
    subCapabilities: "उप-क्षमताएं: इनकमिंग कॉल स्थिति जांचना, कॉल लॉग से नंबर मिलाना, और कॉल उठाने/काटने का आदेश देना।",
    riskWarning: "⚠️ इनकमिंग कॉल को नियंत्रित करता है। ध्यान दें कि सामान्य सेलुलर कॉल पर सीधे AI बात नहीं कर सकता।",
    privacyPolicy: "गोपनीयता नीति: कॉलर की पहचान केवल नाम बोलने के लिए तात्कालिक मेमोरी में जांची जाती है। कॉल रिकॉर्डिंग नहीं होती।"
  },
  notification_access: {
    description: "संदेश ऐप से सूचनाएं बोलकर सुनाने और एंड्रॉयड द्वारा छिपाई गई कॉलर पहचान जानने के लिए।",
    whatBecomesPossible: "ड्राइविंग के दौरान व्हाट्सएप/टेलीग्राम संदेश पढ़कर सुनाने और नोटिफिकेशन सारांश तैयार करने की सुविधा।",
    subCapabilities: "उप-क्षमताएं: नोटिफिकेशन लिसनर सेवा, संदेश टेक्स्ट पढ़ना, और त्वरित उत्तर (Quick Reply) ट्रिगर करना।",
    riskWarning: "⚠️ अत्यधिक संवेदनशील: सभी ऐप्स के नोटिफिकेशन (ओटीपी और निजी चैट पूर्वावलोकन सहित) देख सकता है।",
    privacyPolicy: "गोपनीयता नीति: नोटिफिकेशन केवल डिवाइस मेमोरी में स्थानीय रूप से जांचे जाते हैं। बैंकिंग ओटीपी कभी सुरक्षित नहीं रखे जाते।"
  },
  accessibility_service: {
    description: "गहन ऑटोमेशन के लिए: ऐप्स (व्हाट्सएप/यूट्यूब) के अंदर नेविगेट करना और स्क्रीन पढ़ना।",
    whatBecomesPossible: "MAYRA को ऐप्स में जटिल कार्य करने, बटन दबाने, यूट्यूब वीडियो चलाने और हैंड्स-फ़्री सहायता देने में सक्षम बनाता है।",
    subCapabilities: "उप-क्षमताएं: यूआई नोड ट्री देखना, स्क्रीन पर टच/स्क्रॉल जेस्चर बनाना, और सक्रिय ऐप की निगरानी।",
    riskWarning: "⚠️ पूर्ण डिवाइस नियंत्रण अनुमति। आपकी स्क्रीन देख सकता है और आपकी ओर से टच कर सकता है।",
    privacyPolicy: "गोपनीयता नीति: ऑटोमेशन केवल आपकी सीधी वॉयस आज्ञा पर ही चलता है। पासवर्ड और बैंकिंग पिन को पूरी तरह छोड़ दिया जाता है।"
  },
  battery_optimization: {
    description: "ताकि स्क्रीन बंद होने पर भी MAYRA बैकग्राउंड में बिना रुकावट चलती रहे।",
    whatBecomesPossible: "ऑपरेटिंग सिस्टम द्वारा ऐप बंद करने से रोकता है, जिससे वेक-वर्ड और ड्राइविंग शील्ड लगातार सक्रिय रहते हैं।",
    subCapabilities: "उप-क्षमताएं: ओएस डोज मोड और आक्रामक बैकग्राउंड टास्क किलर से छूट।",
    riskWarning: "⚠️ बैकग्राउंड में लगातार तैयार रहने के कारण स्टैंडबाय बैटरी खपत में थोड़ी वृद्धि हो सकती है।",
    privacyPolicy: "गोपनीयता नीति: कोई डेटा एकत्र नहीं करता। यह केवल एक सिस्टम प्रोसेस निष्पादन अनुमति है।"
  },
  overlay: {
    description: "ताकि अन्य ऐप्स के ऊपर फ्लोटिंग ग्लास बबल और वॉयस कंट्रोल दिखाई दे सके।",
    whatBecomesPossible: "गेम, ब्राउज़र या मैप्स चलाते समय एक-टैप में वॉयस एक्सेस के लिए फ्लोटिंग ग्लास ऑर्ब प्रदर्शित करता है।",
    subCapabilities: "उप-क्षमताएं: सिस्टम अलर्ट विंडो दिखाना, फ्लोटिंग टच इवेंट संभालना, और कॉम्पैक्ट यूआई।",
    riskWarning: "⚠️ अन्य चल रहे एप्लिकेशन के ऊपर दृश्य तत्व प्रदर्शित करता है।",
    privacyPolicy: "गोपनीयता नीति: ओवरले केवल अपनी सीमाओं के अंदर टच प्राप्त करता है; नीचे चल रहे ऐप्स के इनपुट रिकॉर्ड नहीं करता।"
  },
  screen_capture: {
    description: "ताकि जब आप स्क्रीन शेयरिंग का अनुरोध करें, तो MAYRA आपकी स्क्रीन लाइव देख सके।",
    whatBecomesPossible: "स्क्रीन पर दिखने वाले लेखों, चार्ट्स या समस्याओं को देखकर AI द्वारा तात्कालिक समाधान और मार्गदर्शन प्रदान करता है।",
    subCapabilities: "उप-क्षमताएं: मीडिया प्रोजेक्शन वीडियो कैप्चर, और रियल-टाइम विज़ुअल फ्रेम विश्लेषण।",
    riskWarning: "⚠️ सक्रिय रहने के दौरान स्क्रीन पर दिखाई देने वाली सभी जानकारी (निजी चैट व फॉर्म) AI को दिखाई देती है।",
    privacyPolicy: "गोपनीयता नीति: हर बार स्पष्ट सिस्टम अनुमति आवश्यक होती है। 'Stop' दबाते ही वीडियो कैप्चर तुरंत बंद हो जाता है।"
  }
};

// Hinglish dictionary
const HINGLISH_PERMISSIONS: Record<string, PermissionDetailsTranslation> = {
  default_assistant: {
    description: "MAYRA ko phone ka primary digital assistant banayein, taaki default assistant replace ho sake.",
    whatBecomesPossible: "Screen corners se swipe ya power button hold karne par lock screen par bhi MAYRA turant open hogi.",
    subCapabilities: "Sub-capabilities: Hardware key triggers, lockscreen overlay rendering, aur background standby listening.",
    riskWarning: "⚠️ System default assistant ko replace karta hai aur hardware shortcut triggers ko listen karta hai.",
    privacyPolicy: "Privacy Policy: Standby monitoring local device par hoti hai. Koi bhi private baat upload nahi hoti."
  },
  microphone: {
    description: "Zaroori permission, taaki aap MAYRA se hands-free baat kar sakein aur voice instructions de sakein.",
    whatBecomesPossible: "Hands-free wake word ('Hey Mayra'), voice queries, push-to-talk recording aur voice commands enable karta hai.",
    subCapabilities: "Sub-capabilities: Live microphone audio stream, on-device voice threshold detection, real-time speech transcription.",
    riskWarning: "⚠️ Device microphone use karta hai. Audio sirf active voice session ke dauran use hota hai, kabhi secret recording nahi hoti.",
    privacyPolicy: "Privacy Policy: Voice data sirf aapke sawal ka jawab dene ke liye process hota hai. Kahi bhi becha ya share nahi hota."
  },
  camera: {
    description: "Taaki MAYRA photos le sake, video record kare, QR codes scan kare aur documents dekh sake.",
    whatBecomesPossible: "Photos/receipts analyze karne, live video queries me help lene, aur front/back camera se photo khinchne deta hai.",
    subCapabilities: "Sub-capabilities: Front aur back camera capture, photo snapping, aur live video frame AI processing.",
    riskWarning: "⚠️ Photo aur video lene ki full permission. Aapke direct order ke bina kabhi background me activate nahi hota.",
    privacyPolicy: "Privacy Policy: Camera frames ephemerally memory me check hote hain aur remote server par store nahi hote."
  },
  phone_calls: {
    description: "Taaki MAYRA contacts aur emergency services ko direct call laga sake.",
    whatBecomesPossible: "Voice se direct call lagane ('Call Mom') aur SIM card se 112 / 108 dialer trigger karne ki suvidha milti hai.",
    subCapabilities: "Sub-capabilities: Telecom dialer trigger, direct phone call initiation, aur network status check.",
    riskWarning: "⚠️ Cellular network calls ke liye aapke SIM operator plan ke mutabik call charges lag sakte hain.",
    privacyPolicy: "Privacy Policy: Numbers sirf aapke phonebook se fetch hote hain. Call ki baatein record nahi hoti."
  },
  location: {
    description: "Taaki MAYRA live weather, route navigation aur emergency SOS GPS coordinates de sake.",
    whatBecomesPossible: "Accurate local weather, navigation directions, nearby places, aur SOS ke dauran live GPS location share karta hai.",
    subCapabilities: "Sub-capabilities: High-accuracy GPS (Fine location), cell/Wi-Fi triangulation, aur geofence alerts.",
    riskWarning: "⚠️ Exact geographical location batata hai. Active SOS alert ke dauran emergency contacts ko send hota hai.",
    privacyPolicy: "Privacy Policy: Location sirf specific requests (weather/maps/SOS) par check hoti hai aur track nahi hoti."
  },
  contacts: {
    description: "Taaki MAYRA call ya SMS karte waqt contact numbers aur nicknames dhoondh sake.",
    whatBecomesPossible: "Phonebook open kiye bina hands-free calling ('Call Rohit') aur contacts search karna possible hota hai.",
    subCapabilities: "Sub-capabilities: Address book reading, contact name search, aur emergency contact resolution.",
    riskWarning: "⚠️ Aapke saved private contacts list aur phone numbers ko access karta hai.",
    privacyPolicy: "Privacy Policy: Contacts data sirf aapke phone par rehta hai aur external server par upload nahi hota."
  },
  sms: {
    description: "Taaki MAYRA text messages bhej sake aur SOS me GPS ke sath emergency SMS dispatch kare.",
    whatBecomesPossible: "Voice dictation se SMS send karne aur emergency SOS me automatic safety SMS bhejne ki capability milti hai.",
    subCapabilities: "Sub-capabilities: SIM card se SMS dispatch, message composition, aur Driving Mode auto-reply.",
    riskWarning: "⚠️ SIM card se SMS send hote hain, isliye standard operator SMS charges lag sakte hain.",
    privacyPolicy: "Privacy Policy: Messages sirf aapke order ya emergency SOS par send hote hain. Incoming SMS spy nahi hote."
  },
  gallery_files: {
    description: "Taaki MAYRA photos, videos aur documents search kare aur AI vision se analyze kare.",
    whatBecomesPossible: "MAYRA se photo retrieve karne, receipts check karne, ya WhatsApp/Email par files attach karne ka order de sakte hain.",
    subCapabilities: "Sub-capabilities: Media images access, video files browsing, aur PDF/documents reading.",
    riskWarning: "⚠️ Device storage ke private photos aur downloads ko read karne ki permission mangta hai.",
    privacyPolicy: "Privacy Policy: Sirf wahi files access hoti hain jo aap bolte hain. Puri gallery bulk me upload nahi hoti."
  },
  manage_calls: {
    description: "Taaki MAYRA incoming caller ka name bol kar bataye aur voice se call receive ya cut karne de.",
    whatBecomesPossible: "Ring aane par caller ka name bolta hai aur 'Answer' ya 'Decline' bol kar hands-free call control karne deta hai.",
    subCapabilities: "Sub-capabilities: Incoming call state inspect karna, call log se number match karna, aur call answer/end karna.",
    riskWarning: "⚠️ Phone call state control karta hai. Cellular calls par direct AI bol nahi sakta standard Android rules ke kaaran.",
    privacyPolicy: "Privacy Policy: Caller details sirf name bolne ke liye memory me check hoti hain. Call record nahi hoti."
  },
  notification_access: {
    description: "Messages padh kar sunane aur Android dwara hide kiye gaye caller names ko identify karne ke liye.",
    whatBecomesPossible: "Drive karte waqt WhatsApp/Telegram messages bol kar sunata hai aur incoming notifications ka summary deta hai.",
    subCapabilities: "Sub-capabilities: Notification listener service, message text extraction, aur quick-reply actions.",
    riskWarning: "⚠️ High sensitivity: Sabhi apps ke notifications (OTPs aur private chats preview sahit) dekh sakta hai.",
    privacyPolicy: "Privacy Policy: Notifications local RAM me process hote hain. Bank OTPs aur passwords ko ignore kiya jata hai."
  },
  accessibility_service: {
    description: "Deep automation ke liye: Apps (WhatsApp/YouTube) ke andar navigate karna aur screen read karna.",
    whatBecomesPossible: "MAYRA ko multi-step actions karne, buttons click karne, YouTube videos play karne aur screen read karne me saksham banata hai.",
    subCapabilities: "Sub-capabilities: UI node tree inspection, virtual tap/scroll gestures, aur active application tracking.",
    riskWarning: "⚠️ Full device control permission. Aapki screen dekh sakta hai aur aapki taraf se tap/type kar sakta hai.",
    privacyPolicy: "Privacy Policy: Automation sirf aapke direct voice command par run hota hai. Passwords aur banking PINs touch nahi hote."
  },
  battery_optimization: {
    description: "Taaki screen lock hone par bhi MAYRA background me smooth chalti rahe.",
    whatBecomesPossible: "Operating system ko background me MAYRA kill karne se rokta hai, jisse wake-word hamesha active rahe.",
    subCapabilities: "Sub-capabilities: Android Doze mode aur aggressive task killers se exemption.",
    riskWarning: "⚠️ Background me continuous ready rehne ki wajah se thodi si battery usage badh sakti hai.",
    privacyPolicy: "Privacy Policy: Koi data collect nahi karta. Yeh OS execution permission hai."
  },
  overlay: {
    description: "Taaki doosre apps ke upar floating glass bubble aur voice bar show ho sake.",
    whatBecomesPossible: "Games, browser ya maps chalate waqt 1-tap voice access ke liye floating glass orb display karta hai.",
    subCapabilities: "Sub-capabilities: System alert window rendering, floating touch handling, aur quick HUD UI.",
    riskWarning: "⚠️ Chal rahe apps ke upar visual floating elements display karta hai.",
    privacyPolicy: "Privacy Policy: Overlay sirf apne circle ke touches leti hai, neeche chal rahe apps ka data nahi leti."
  },
  screen_capture: {
    description: "Taaki screen sharing request karne par MAYRA aapki screen live dekh sake.",
    whatBecomesPossible: "Screen par chal rahe article, error ya form ko dekh kar instant solution aur AI step-by-step guidance deta hai.",
    subCapabilities: "Sub-capabilities: Media projection video stream aur real-time frame visual analysis.",
    riskWarning: "⚠️ Active hone par screen par dikh rahi har cheez (private chats ya form) AI ko dikhegi.",
    privacyPolicy: "Privacy Policy: Har baar system dialog confirm karna hota hai. 'Stop' dabate hi screen sharing turant band hoti hai."
  }
};

const BASE_EN_DICTIONARY: AppTranslations = {
  home: "Home",
  chat: "Chat",
  camera: "Camera",
  settings: "Settings",
  profile: "Profile",
  loading: "Loading...",
  granted: "Granted",
  grant: "Grant",
  required: "REQUIRED",
  save: "Save Changes",
  cancel: "Cancel",
  back: "Back",
  search: "Search...",

  selectLanguageTitle: "Choose Your Language",
  selectLanguageSubtitle: "Select your preferred language. All descriptions, permissions, and guidance will display in this language.",
  welcomeTitle: "Welcome to MAYRA",
  welcomeSubtitle: "Your Next-Gen Autonomous AI Guardian & Intelligent Voice Companion.",
  getStarted: "Get Started",
  continueBtn: "Continue",
  profileSetupTitle: "Personalize Your Profile",
  profileSetupSubtitle: "Tell us your name and customize your presence.",
  nameLabel: "Your Name / Call-Sign",
  namePlaceholder: "e.g. MindSet Zafer",
  permissionsTitle: "System Permissions",
  permissionsSubtitle: "Grant capabilities for hands-free voice, camera analysis, and safety shields.",
  grantAll: "Grant All Permissions",
  readyTitle: "You're All Set!",
  readySubtitle: "MAYRA is configured and ready to assist you anytime.",
  launchApp: "Launch MAYRA Now",
  launchMayra: "Launch MAYRA",
  chooseLanguage: "Choose Language",
  chooseLanguageSub: "Select your preferred language",

  profilePhoto: "Profile Photo",
  uploadPhoto: "Upload Photo",
  chooseDefaultPhoto: "Choose Default Avatar",
  changePhoto: "Change Photo",
  removePhoto: "Reset Photo",
  photoUpdatedToast: "Profile photo updated successfully!",

  permissionCenterTitle: "Permissions Center",
  permissionCenterSubtitle: "Manage device capabilities, live privacy policies, and security warnings",
  permissionCenterNotice: "MAYRA requires specific system permissions to function autonomously. Review the capabilities, risk warnings, and privacy policies below before enabling each toggle.",
  whatBecomesPossibleLabel: "What becomes possible:",
  subCapabilitiesLabel: "Sub-capabilities & features:",
  riskWarningLabel: "Privacy & Sensitive Capability Notice:",
  privacyPolicyLabel: "Inline Privacy Policy:",
  allPermissionsGood: "All essential permissions granted! Your assistant operates at full capability.",

  permissions: EN_PERMISSIONS
};

const BASE_HI_DICTIONARY: AppTranslations = {
  home: "होम",
  chat: "चैट",
  camera: "कैमरा",
  settings: "सेटिंग्स",
  profile: "प्रोफाइल",
  loading: "लोड हो रहा है...",
  granted: "स्वीकृत",
  grant: "अनुमति दें",
  required: "अनिवार्य",
  save: "सहेजें",
  cancel: "रद्द करें",
  back: "पीछे",
  search: "खोजें...",

  selectLanguageTitle: "अपनी भाषा चुनें",
  selectLanguageSubtitle: "अपनी पसंदीदा भाषा चुनें। सभी विवरण, अनुमतियां और दिशानिर्देश इसी भाषा में प्रदर्शित होंगे।",
  welcomeTitle: "MAYRA में आपका स्वागत है",
  welcomeSubtitle: "आपकी अगली पीढ़ी की स्वायत्त एआई साथी और बुद्धिमान वॉयस सहायक।",
  getStarted: "शुरू करें",
  continueBtn: "आगे बढ़ें",
  profileSetupTitle: "अपनी प्रोफ़ाइल सेटअप करें",
  profileSetupSubtitle: "अपना नाम बताएं और अपनी पहचान कस्टमाइज़ करें।",
  nameLabel: "आपका नाम / कॉल-साइन",
  namePlaceholder: "उदा. MindSet Zafer",
  permissionsTitle: "सिस्टम अनुमतियां",
  permissionsSubtitle: "हैंड्स-फ़्री वॉयस, कैमरा विज़न और सुरक्षा शील्ड्स के लिए अनुमतियां प्रदान करें।",
  grantAll: "सभी अनुमतियां दें",
  readyTitle: "सब तैयार है!",
  readySubtitle: "MAYRA पूरी तरह से कॉन्फ़िगर हो चुकी है और आपकी सहायता के लिए तैयार है।",
  launchApp: "MAYRA शुरू करें",
  launchMayra: "MAYRA लॉन्च करें",
  chooseLanguage: "भाषा चुनें",
  chooseLanguageSub: "अपनी पसंदीदा भाषा का चयन करें",

  profilePhoto: "प्रोफ़ाइल फ़ोटो",
  uploadPhoto: "फ़ोटो अपलोड करें",
  chooseDefaultPhoto: "डिफ़ॉल्ट अवतार चुनें",
  changePhoto: "फ़ोटो बदलें",
  removePhoto: "फ़ोटो हटाएं",
  photoUpdatedToast: "प्रोफ़ाइल फ़ोटो सफलतापूर्वक अपडेट हो गई!",

  permissionCenterTitle: "अनुमति केंद्र",
  permissionCenterSubtitle: "डिवाइस क्षमताएं, लाइव गोपनीयता नीतियां और सुरक्षा चेतावनियां प्रबंधित करें",
  permissionCenterNotice: "MAYRA को स्वायत्त रूप से काम करने के लिए विशिष्ट सिस्टम अनुमतियों की आवश्यकता होती है। टॉगल चालू करने से पहले नीचे दिए गए विवरण, जोखिम चेतावनी और गोपनीयता नीति की समीक्षा करें।",
  whatBecomesPossibleLabel: "क्या संभव होगा:",
  subCapabilitiesLabel: "उप-क्षमताएं एवं सुविधाएं:",
  riskWarningLabel: "गोपनीयता एवं संवेदनशील क्षमता सूचना:",
  privacyPolicyLabel: "सीधी गोपनीयता नीति:",
  allPermissionsGood: "सभी आवश्यक अनुमतियां स्वीकृत हैं! आपकी सहायक पूरी क्षमता से सक्रिय है।",

  permissions: HI_PERMISSIONS
};

const BASE_HINGLISH_DICTIONARY: AppTranslations = {
  home: "Home",
  chat: "Chat",
  camera: "Camera",
  settings: "Settings",
  profile: "Profile",
  loading: "Loading ho raha hai...",
  granted: "Granted",
  grant: "Grant",
  required: "REQUIRED",
  save: "Save Karein",
  cancel: "Cancel",
  back: "Back",
  search: "Search karein...",

  selectLanguageTitle: "Apni Language Select Karein",
  selectLanguageSubtitle: "Apni preferred language chunein. Saare descriptions, permissions aur explanations isi language me display honge.",
  welcomeTitle: "Welcome to MAYRA",
  welcomeSubtitle: "Aapki Next-Gen Autonomous AI Companion & Intelligent Voice Assistant.",
  getStarted: "Start Karein",
  continueBtn: "Aage Badhein",
  profileSetupTitle: "Profile Setup Karein",
  profileSetupSubtitle: "Apna naam enter karein aur profile personalize karein.",
  nameLabel: "Aapka Naam / Call-Sign",
  namePlaceholder: "e.g. MindSet Zafer",
  permissionsTitle: "System Permissions",
  permissionsSubtitle: "Hands-free voice, camera analysis aur safety features ke liye permissions grant karein.",
  grantAll: "Sabhi Permissions Grant Karein",
  readyTitle: "Sab Ready Hai!",
  readySubtitle: "MAYRA successfully configure ho chuki hai aur aapki help ke liye ready hai.",
  launchApp: "MAYRA Launch Karein",
  launchMayra: "MAYRA Launch Karein",
  chooseLanguage: "Language Chunein",
  chooseLanguageSub: "Apni preferred language select karein",

  profilePhoto: "Profile Photo",
  uploadPhoto: "Photo Upload Karein",
  chooseDefaultPhoto: "Default Avatar Chunein",
  changePhoto: "Photo Badlein",
  removePhoto: "Photo Reset Karein",
  photoUpdatedToast: "Profile photo successfully update ho gayi!",

  permissionCenterTitle: "Permissions Center",
  permissionCenterSubtitle: "Device capabilities, live privacy policies aur security warnings manage karein",
  permissionCenterNotice: "MAYRA ko smoothly kaam karne ke liye specific permissions chahiye hoti hain. Toggle on karne se pehle har permission ka description, risk warning aur privacy policy zaroor padhein.",
  whatBecomesPossibleLabel: "Isse kya possible hoga:",
  subCapabilitiesLabel: "Sub-capabilities & linked features:",
  riskWarningLabel: "Privacy & Sensitive Capability Notice:",
  privacyPolicyLabel: "Inline Privacy Policy:",
  allPermissionsGood: "Sabhi zaroori permissions granted hain! Aapki assistant full power me active hai.",

  permissions: HINGLISH_PERMISSIONS
};

function generateLocalizedDictionary(lang: AppLanguage): AppTranslations {
  if (lang === 'hi') return BASE_HI_DICTIONARY;
  if (lang === 'hinglish') return BASE_HINGLISH_DICTIONARY;
  // For other languages, we fallback to English with localized headings
  if (lang === 'es') {
    return {
      ...BASE_EN_DICTIONARY,
      selectLanguageTitle: "Elige Tu Idioma",
      selectLanguageSubtitle: "Selecciona tu idioma preferido. Todas las descripciones y políticas se mostrarán en este idioma.",
      welcomeTitle: "Bienvenido a MAYRA",
      welcomeSubtitle: "Tu compañera inteligente y asistente de voz autónoma.",
      getStarted: "Empezar",
      continueBtn: "Continuar",
      profileSetupTitle: "Configura tu perfil",
      profileSetupSubtitle: "Introduce tu nombre y personaliza tu experiencia.",
      nameLabel: "Tu Nombre",
      permissionsTitle: "Permisos del Sistema",
      grantAll: "Conceder Todos",
      readyTitle: "¡Todo Listo!",
      launchApp: "Iniciar MAYRA",
      profilePhoto: "Foto de Perfil",
      uploadPhoto: "Subir Foto",
      chooseDefaultPhoto: "Elegir Avatar Predeterminado",
      permissionCenterTitle: "Centro de Permisos",
      permissionCenterSubtitle: "Administra capacidades, políticas de privacidad y advertencias de seguridad",
      whatBecomesPossibleLabel: "Qué será posible:",
      subCapabilitiesLabel: "Sub-capacidades vinculadas:",
      riskWarningLabel: "Aviso de privacidad y capacidad sensible:",
      privacyPolicyLabel: "Política de privacidad directa:"
    };
  }
  if (lang === 'fr') {
    return {
      ...BASE_EN_DICTIONARY,
      selectLanguageTitle: "Choisissez Votre Langue",
      selectLanguageSubtitle: "Sélectionnez votre langue préférée. Toutes les explications et politiques s'afficheront dans cette langue.",
      welcomeTitle: "Bienvenue sur MAYRA",
      welcomeSubtitle: "Votre assistante vocale intelligente et autonome de nouvelle génération.",
      getStarted: "Commencer",
      continueBtn: "Continuer",
      profilePhoto: "Photo de Profil",
      uploadPhoto: "Télécharger une photo",
      permissionCenterTitle: "Centre des Permissions",
      whatBecomesPossibleLabel: "Ce qui devient possible :",
      subCapabilitiesLabel: "Sous-capacités associées :",
      riskWarningLabel: "Avertissement de confidentialité et sensibilité :",
      privacyPolicyLabel: "Politique de confidentialité directe :"
    };
  }
  return BASE_EN_DICTIONARY;
}

export interface LanguageContextType {
  language: AppLanguage;
  currentLanguage: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  languages: LanguageOption[];
  t: AppTranslations;
  getPermissionDetails: (permId: string) => PermissionDetailsTranslation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mayra_app_language') as AppLanguage;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.id === saved)) {
        return saved;
      }
      const legacy = localStorage.getItem('mayra_preferred_language');
      if (legacy === 'hi') return 'hi';
    }
    return 'en';
  });

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_app_language', newLang);
      localStorage.setItem('mayra_preferred_language', newLang === 'hi' ? 'hi' : 'en');
    }
  };

  const currentTranslations = useMemo(() => {
    return generateLocalizedDictionary(language);
  }, [language]);

  const getPermissionDetails = (permId: string): PermissionDetailsTranslation => {
    if (currentTranslations.permissions[permId]) {
      return currentTranslations.permissions[permId];
    }
    if (EN_PERMISSIONS[permId]) {
      return EN_PERMISSIONS[permId];
    }
    return {
      description: "Permission needed for assistant functionality.",
      whatBecomesPossible: "Allows MAYRA to access this device feature when you request it.",
      subCapabilities: "Sub-capabilities tied to this system permission.",
      riskWarning: "⚠️ Standard system permission access.",
      privacyPolicy: "Privacy Policy: Data is accessed only on-demand and kept private."
    };
  };

  return (
    <LanguageContext.Provider value={{
      language,
      currentLanguage: language,
      setLanguage,
      languages: SUPPORTED_LANGUAGES,
      t: currentTranslations,
      getPermissionDetails
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return fallback if used outside provider
    const fallbackT = BASE_EN_DICTIONARY;
    return {
      language: 'en',
      currentLanguage: 'en',
      setLanguage: () => {},
      languages: SUPPORTED_LANGUAGES,
      t: fallbackT,
      getPermissionDetails: (id: string) => EN_PERMISSIONS[id] || {
        description: "Permission needed for assistant functionality.",
        whatBecomesPossible: "Allows MAYRA to access this device feature when you request it.",
        subCapabilities: "Sub-capabilities tied to this system permission.",
        riskWarning: "⚠️ Standard system permission access.",
        privacyPolicy: "Privacy Policy: Data is accessed only on-demand and kept private."
      }
    };
  }
  return context;
}

