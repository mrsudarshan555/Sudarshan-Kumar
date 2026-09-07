import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Shield, Bell, Phone, MessageSquare, Send, 
  ExternalLink, CheckCircle2, AlertCircle, Sparkles, RefreshCw, 
  Sliders, Bot, Power, Info, Smartphone, Check, Play, PhoneIncoming,
  PhoneOff, AlertTriangle
} from 'lucide-react';
import { MayraSystemBridge, SystemServiceStatus, IncomingNotificationEvent } from '../../services/native/MayraSystemIntegrationBridge';

interface NativeIntegrationViewProps {
  onBack: () => void;
}

export const NativeIntegrationView: React.FC<NativeIntegrationViewProps> = ({ onBack }) => {
  const [status, setStatus] = useState<SystemServiceStatus>({
    isAccessibilityActive: false,
    isNotificationListenerActive: false,
    isBatteryOptimizationExempt: false,
    canDrawOverlays: false,
    isNativeAndroidEnvironment: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('mayra_wa_auto_send') === 'true';
  });
  const [callAnnounceEnabled, setCallAnnounceEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('mayra_call_announce') !== 'false';
  });

  // Interactive Test State
  const [testModal, setTestModal] = useState<'sms' | 'whatsapp' | 'call' | 'notif' | null>(null);
  const [testRecipient, setTestRecipient] = useState('+91 98765 43210');
  const [testMessage, setTestMessage] = useState('Hello from Mayra! This is an automated system test.');
  const [actionStatusMsg, setActionStatusMsg] = useState<string | null>(null);

  // Recent simulated / captured notifications
  const [recentNotifs, setRecentNotifs] = useState<IncomingNotificationEvent[]>([]);

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const s = await MayraSystemBridge.checkStatus();
      setStatus(s);
      setRecentNotifs(MayraSystemBridge.getRecentNotifications());
    } finally {
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  useEffect(() => {
    refreshStatus();
    const unsubscribe = MayraSystemBridge.addNotificationListener((notif) => {
      setRecentNotifs(prev => [notif, ...prev.slice(0, 9)]);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleAutoSendWA = (enabled: boolean) => {
    setAutoSendWhatsApp(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_wa_auto_send', enabled.toString());
    }
  };

  const handleToggleCallAnnounce = (enabled: boolean) => {
    setCallAnnounceEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_call_announce', enabled.toString());
    }
  };

  const handleExecuteSmsTest = async () => {
    const res = await MayraSystemBridge.sendSmsDirect(testRecipient, testMessage);
    setActionStatusMsg(res.message);
    setTimeout(() => {
      setTestModal(null);
      setActionStatusMsg(null);
    }, 2000);
  };

  const handleExecuteWhatsAppTest = async () => {
    const res = await MayraSystemBridge.sendWhatsAppMessage(testRecipient, testMessage, autoSendWhatsApp);
    setActionStatusMsg(res.message);
    setTimeout(() => {
      setTestModal(null);
      setActionStatusMsg(null);
    }, 2000);
  };

  const handleSimulateIncomingCall = async () => {
    const callerInfo = await MayraSystemBridge.lookupCaller(testRecipient);
    const callerName = callerInfo.found ? callerInfo.contactName : testRecipient;
    
    // Simulate notification
    MayraSystemBridge.simulateIncomingNotification({
      appName: 'Phone',
      packageName: 'com.google.android.dialer',
      sender: callerName,
      text: `Incoming call from ${callerName}...`,
      isCall: true,
      isMessaging: false
    });

    setActionStatusMsg(`Simulated incoming call from ${callerName}. Mayra announced!`);
    setTimeout(() => {
      setTestModal(null);
      setActionStatusMsg(null);
    }, 2500);
  };

  const handleSimulateWhatsAppNotif = () => {
    MayraSystemBridge.simulateIncomingNotification({
      appName: 'WhatsApp',
      packageName: 'com.whatsapp',
      sender: 'Sarah (Team)',
      text: 'Mayra, did you finish drafting the technical report?',
      isCall: false,
      isMessaging: true
    });
    setActionStatusMsg('Dispatched test WhatsApp notification to Mayra!');
    setTimeout(() => {
      setTestModal(null);
      setActionStatusMsg(null);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-slate-100 relative select-none overflow-hidden font-sans">
      
      {/* Top App Bar - Liquid Magnifying Frosted Glass */}
      <div className="h-14 px-4 bg-white/[0.06] backdrop-blur-3xl border-b border-white/10 flex items-center justify-between z-20 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Android System Integration
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Native Plugins
              </span>
            </h1>
          </div>
        </div>

        <button
          onClick={refreshStatus}
          className={`p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer ${
            isLoading ? 'animate-spin text-cyan-400' : ''
          }`}
          title="Refresh Services Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-purple-500/20">

        {/* System Architecture Banner */}
        <div className="p-3.5 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-semibold text-indigo-200">Production Android Native Layer</p>
              <p className="text-purple-200/70 mt-0.5 leading-relaxed">
                Kotlin services and broadcast receivers link directly with <code className="text-cyan-300">TelecomManager</code>, <code className="text-cyan-300">SmsManager</code>, <code className="text-cyan-300">AccessibilityService</code>, and <code className="text-cyan-300">NotificationListenerService</code>.
              </p>
            </div>
          </div>
        </div>

        {/* 1. ACCESSIBILITY SERVICE CARD */}
        <div className="p-4 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:border-purple-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">1. Accessibility Service</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    status.isAccessibilityActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {status.isAccessibilityActive ? 'ACTIVE' : 'SETUP REQUIRED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Task automation, app launching fallback, and UI auto-interaction.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 bg-white/[0.02] p-3 rounded-xl border border-white/5 space-y-1.5 leading-relaxed">
            <p className="text-slate-400">
              <strong className="text-slate-200 font-semibold">• App Launcher Fallback:</strong> Launches any app by name/package even if normal launch intents are blocked.
            </p>
            <p className="text-slate-400">
              <strong className="text-slate-200 font-semibold">• UI Automation:</strong> Taps Send button in messaging apps and interacts with on-screen dialogs.
            </p>
            <p className="text-[11px] text-amber-300/90 pt-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Android requires manual toggle inside system Accessibility Settings.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={async () => {
                await MayraSystemBridge.openAccessibilitySettings();
                refreshStatus();
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-xs border border-cyan-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {status.isAccessibilityActive ? 'Manage in Android Settings' : 'Enable in System Settings'}
            </button>

            <button
              onClick={async () => {
                const res = await MayraSystemBridge.launchApp('Calculator');
                alert(res.message);
              }}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 active:scale-95 transition-all"
            >
              Test App Launch
            </button>
          </div>
        </div>

        {/* 2. NOTIFICATION LISTENER SERVICE CARD */}
        <div className="p-4 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:border-purple-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">2. Notification Listener Service</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    status.isNotificationListenerActive 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  }`}>
                    {status.isNotificationListenerActive ? 'ACTIVE' : 'SETUP REQUIRED'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Reads incoming message notifications (WhatsApp, SMS, Telegram).
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 bg-white/[0.04] p-3 rounded-2xl border border-white/10 space-y-1.5 leading-relaxed backdrop-blur-md">
            <p className="text-purple-200/80">
              <strong className="text-white font-semibold">• Live Interception:</strong> Reads sender name and message content from incoming notifications.
            </p>
            <p className="text-purple-200/80">
              <strong className="text-white font-semibold">• Spoken Digest:</strong> Mayra announces messages aloud and prompts if you want to dictate a reply.
            </p>
            <p className="text-[11px] text-amber-300/90 pt-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Requires granting "Device & app notifications" access in Android Special Access.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={async () => {
                await MayraSystemBridge.openNotificationListenerSettings();
                refreshStatus();
              }}
              className="flex-1 py-2 px-3 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold text-xs border border-purple-400/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {status.isNotificationListenerActive ? 'Manage Notification Access' : 'Enable Notification Access'}
            </button>

            <button
              onClick={handleSimulateWhatsAppNotif}
              className="py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              Simulate Message
            </button>
          </div>
        </div>

        {/* 3. CALL HANDLING & CALLER ID CARD */}
        <div className="p-4 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:border-purple-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">3. Telecom Call Handling & Caller ID</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    KOTLIN PLUGIN
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Detect incoming calls, resolve contact names, and answer/reject hands-free.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs bg-white/[0.04] p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Announce Caller Names Aloud</p>
                <p className="text-[11px] text-purple-200/70">Mayra speaks caller's contact name and asks for decision</p>
              </div>
              <button
                onClick={() => handleToggleCallAnnounce(!callAnnounceEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  callAnnounceEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  callAnnounceEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                <span className="text-purple-200/70">Answer Call:</span>
                <p className="font-mono text-emerald-300">InCallService.answer(0)</p>
              </div>
              <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                <span className="text-purple-200/70">Decline / Reject:</span>
                <p className="font-mono text-rose-300">InCallService.reject()</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setTestModal('call')}
              className="flex-1 py-2 px-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-400/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <PhoneIncoming className="w-3.5 h-3.5" />
              Test Incoming Call Flow
            </button>
          </div>
        </div>

        {/* 4. DIRECT SMS SENDING CARD */}
        <div className="p-4 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:border-purple-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">4. Direct SMS Sending</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-400/30">
                    SmsManager
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Sends cellular SMS directly in the background without opening external apps.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 bg-white/[0.04] p-3 rounded-2xl border border-white/10 space-y-1 leading-relaxed backdrop-blur-md">
            <p className="text-purple-200/80">
              Uses Android <code className="text-blue-300">SmsManager.sendTextMessage()</code> with <code className="text-blue-300">SEND_SMS</code> permission. No accessibility workaround needed.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setTestModal('sms')}
              className="flex-1 py-2 px-3 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold text-xs border border-blue-400/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Test Direct SMS Composer
            </button>
          </div>
        </div>

        {/* 5. WHATSAPP PRE-FILL & AUTO-TAP CARD */}
        <div className="p-4 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:border-purple-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">5. WhatsApp Integration & Auto-Send</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    INTENT + ACCESSIBILITY
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Pre-fills message text and optionally auto-taps Send button.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs bg-white/[0.04] p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Auto-Tap Send via Accessibility</p>
                <p className="text-[11px] text-purple-200/70">Automatically clicks WhatsApp Send button after opening</p>
              </div>
              <button
                onClick={() => handleToggleAutoSendWA(!autoSendWhatsApp)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 cursor-pointer ${
                  autoSendWhatsApp ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoSendWhatsApp ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>Safety & Reliability Note:</strong> Auto-tapping via Accessibility relies on finding WhatsApp's send button view ID. If the screen is locked or WhatsApp updates its layout, manual tap is safer.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setTestModal('whatsapp')}
              className="flex-1 py-2 px-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-400/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Test WhatsApp Pre-fill
            </button>
          </div>
        </div>

        {/* 6. DEFAULT DIGITAL ASSISTANT ROLE */}
        <div className="p-4 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:border-purple-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">6. Default Digital Assistant Role</h3>
                <p className="text-[11px] text-purple-200/70 mt-0.5">
                  Make Mayra replace Google Assistant for power button & corner swipe triggers.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              await MayraSystemBridge.openVoiceInputSettings();
            }}
            className="w-full py-2 px-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-400/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Android Digital Assistant Role Picker
          </button>
        </div>

        {/* RECENT NOTIFICATIONS STREAM */}
        {recentNotifs.length > 0 && (
          <div className="p-4 rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-2.5">
            <h4 className="text-xs font-bold text-purple-200/80 uppercase tracking-wider">
              Recent Intercepted Notifications ({recentNotifs.length})
            </h4>
            <div className="space-y-2">
              {recentNotifs.map((notif) => (
                <div key={notif.id} className="p-2.5 rounded-2xl bg-black/30 border border-white/10 text-xs flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate">{notif.sender}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-purple-200">
                        {notif.appName}
                      </span>
                    </div>
                    <p className="text-purple-200/70 text-[11px] truncate">{notif.text}</p>
                  </div>
                  <span className="text-[10px] text-purple-300/50 shrink-0">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL DIALOGS FOR TESTING */}
      {testModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white/[0.08] backdrop-blur-3xl border border-white/20 rounded-3xl p-5 space-y-4 shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {testModal === 'sms' && 'Direct SMS Sender'}
                {testModal === 'whatsapp' && 'WhatsApp Pre-fill Test'}
                {testModal === 'call' && 'Simulate Incoming Phone Call'}
              </h3>
              <button 
                onClick={() => setTestModal(null)} 
                className="text-purple-300 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-purple-200/80 mb-1">Recipient Phone Number:</label>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-black/40 border border-white/15 text-white font-mono focus:border-purple-400 focus:outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>

              {testModal !== 'call' && (
                <div>
                  <label className="block text-purple-200/80 mb-1">Message Text:</label>
                  <textarea
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/40 border border-white/15 text-white focus:border-purple-400 focus:outline-none"
                    placeholder="Enter message..."
                  />
                </div>
              )}

              {actionStatusMsg && (
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px]">
                  {actionStatusMsg}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setTestModal(null)}
                className="flex-1 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (testModal === 'sms') handleExecuteSmsTest();
                  else if (testModal === 'whatsapp') handleExecuteWhatsAppTest();
                  else if (testModal === 'call') handleSimulateIncomingCall();
                }}
                className="flex-1 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer shadow-lg"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
