import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Bell, Clock, Calendar, Image, PhoneCall, 
  ShieldCheck, ArrowLeft, Plus, Trash2, Check, Search, Sparkles, Filter
} from 'lucide-react';
import { 
  UnifiedAppHubEngine, UniversalChatMessage, GalleryMediaItem, 
  SmartAlarmTimer, CalendarEventEntry 
} from '../../services/hub/UnifiedAppHubEngine';
import { Mouth } from '../../services/audio/mouth';

interface UnifiedAppHubViewProps {
  onBack: () => void;
}

export const UnifiedAppHubView: React.FC<UnifiedAppHubViewProps> = ({ onBack }) => {
  const engine = UnifiedAppHubEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [activeTab, setActiveTab] = useState<'messages' | 'alarms' | 'calendar' | 'gallery'>('messages');
  const [messages, setMessages] = useState<UniversalChatMessage[]>(engine.getMessages());
  const [appFilter, setAppFilter] = useState<string>('all');
  const [alarms, setAlarms] = useState<SmartAlarmTimer[]>(engine.getAlarms());
  const [events, setEvents] = useState<CalendarEventEntry[]>(engine.getCalendar());
  const [gallery, setGallery] = useState<GalleryMediaItem[]>(engine.getGallery());

  // Message compose form
  const [recipient, setRecipient] = useState<string>('');
  const [msgContent, setMsgContent] = useState<string>('');
  const [targetApp, setTargetApp] = useState<'whatsapp' | 'telegram' | 'sms' | 'instagram'>('whatsapp');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // New Alarm form
  const [alarmTime, setAlarmTime] = useState<string>('08:00 AM');
  const [alarmLabel, setAlarmLabel] = useState<string>('Workout & Coding');

  // New Event form
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('03:00 PM');

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setMessages([...engine.getMessages()]);
      setAlarms([...engine.getAlarms()]);
      setEvents([...engine.getCalendar()]);
      setGallery([...engine.getGallery()]);
    });
    return unsub;
  }, [engine]);

  const handleSendMessage = async () => {
    if (!recipient.trim() || !msgContent.trim()) return;
    engine.sendVoiceMessage(targetApp, recipient.trim(), msgContent.trim());
    
    // Trigger real web action for WhatsApp / Telegram / SMS where applicable
    if (typeof window !== 'undefined') {
      const cleanText = encodeURIComponent(`${msgContent.trim()}`);
      if (targetApp === 'whatsapp') {
        const cleanPhone = recipient.replace(/[^0-9]/g, '');
        const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${cleanText}` : `https://wa.me/?text=${cleanText}`;
        window.open(waUrl, '_blank');
      } else if (targetApp === 'telegram') {
        window.open(`https://t.me/share/url?url=&text=${cleanText}`, '_blank');
      } else if (targetApp === 'sms') {
        window.open(`sms:${recipient}?body=${cleanText}`, '_self');
      }
    }

    setStatusNotification(`Dispatched ${targetApp.toUpperCase()} to ${recipient} (Opened real intent)`);
    await mouth.speak(`Message link generated for ${recipient} via ${targetApp}.`, { persona: 'STONICX' });
    setRecipient('');
    setMsgContent('');
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleAddAlarm = async () => {
    if (!alarmTime.trim()) return;
    engine.addAlarmOrTimer({
      type: 'alarm',
      label: alarmLabel.trim() || 'Custom Alarm',
      time: alarmTime.trim(),
      isActive: true
    });
    setStatusNotification(`Alarm set for ${alarmTime}`);
    await mouth.speak(`Alarm set for ${alarmTime}.`, { persona: 'STONICX' });
    setTimeout(() => setStatusNotification(null), 2500);
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) return;
    engine.addCalendarEvent({
      title: eventTitle.trim(),
      date: 'Today',
      time: eventTime.trim(),
      isVoiceCreated: true
    });
    setStatusNotification(`Event created: ${eventTitle}`);
    await mouth.speak(`Event added to schedule for ${eventTime}.`, { persona: 'STONICX' });
    setEventTitle('');
    setTimeout(() => setStatusNotification(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent text-slate-200">
      {/* Header - Liquid Magnifying Glass */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/30 backdrop-blur-3xl z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-full border border-purple-400/40 shadow-md">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                  All-In-One Unified App Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-sans font-bold">
                  SIMULATION INBOX + REAL DISPATCH
                </span>
              </div>
              <p className="text-[10px] text-purple-300/70 font-sans">
                Features 67-76: WhatsApp, Telegram, Truecaller, Gallery & Alarms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs - Magnifying Glass Bar */}
      <div className="flex border-b border-white/10 px-4 gap-2 pt-2 bg-black/20 backdrop-blur-xl">
        {[
          { id: 'messages', label: 'Messages & Spam', icon: MessageSquare },
          { id: 'alarms', label: 'Alarms & Timers', icon: Clock },
          { id: 'calendar', label: 'Smart Calendar', icon: Calendar },
          { id: 'gallery', label: 'Media Vault', icon: Image }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 px-3 flex items-center gap-1.5 text-xs font-sans font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === t.id
                ? 'text-purple-300 border-purple-400'
                : 'text-purple-300/60 border-transparent hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {statusNotification && (
        <div className="mx-4 mt-3 p-3 bg-emerald-950/60 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl text-emerald-300 font-sans text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{statusNotification}</span>
        </div>
      )}

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* TAB 1: MESSAGES & SPAM RADAR */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {/* Quick Dispatch Composer - Magnifying Glass */}
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-purple-400" /> Voice & Quick Messenger Dispatch
                </span>
                <span className="text-[9px] text-purple-200/60">Multi-Channel Bridge</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(['whatsapp', 'telegram', 'sms', 'instagram'] as const).map(app => (
                  <button
                    key={app}
                    onClick={() => setTargetApp(app)}
                    className={`py-2 rounded-2xl border font-sans text-[10px] uppercase font-bold transition-all cursor-pointer ${
                      targetApp === app
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md backdrop-blur-xl'
                        : 'bg-black/30 backdrop-blur-xl text-purple-300/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {app}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Recipient Name / Number"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2.5 text-white font-sans text-xs outline-none focus:border-purple-400/50"
                />
                <textarea
                  rows={2}
                  placeholder={`Write ${targetApp} message...`}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 text-white font-sans text-xs outline-none focus:border-purple-400/50"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold font-sans text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" /> SEND VIA {targetApp.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Unified Inbox & Truecaller Spam Radar - Magnifying Glass */}
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-sans font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Unified Inbox & Truecaller Radar
                </span>
                <div className="flex gap-1">
                  {(['all', 'whatsapp', 'telegram', 'sms', 'instagram'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setAppFilter(f)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-sans uppercase transition-colors cursor-pointer ${
                        appFilter === f ? 'bg-white/20 text-white font-bold' : 'text-purple-300/60 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {engine.getMessages(appFilter).map(m => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border flex flex-col gap-1 backdrop-blur-xl ${
                      m.isSpam
                        ? 'bg-rose-950/40 border-rose-500/40 shadow-sm'
                        : 'bg-black/30 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-sans px-2 py-0.5 rounded-full uppercase font-bold border ${
                          m.app === 'whatsapp' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30' :
                          m.app === 'telegram' ? 'bg-sky-950/60 text-sky-300 border-sky-500/30' :
                          m.app === 'instagram' ? 'bg-pink-950/60 text-pink-300 border-pink-500/30' :
                          'bg-amber-950/60 text-amber-300 border-amber-500/30'
                        }`}>
                          {m.app}
                        </span>
                        <span className="font-bold text-white text-xs">{m.sender}</span>
                      </div>
                      <span className="text-[9px] text-purple-200/50">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-purple-100 text-[11px]">{m.content}</p>
                    {m.isSpam && (
                      <span className="text-[9px] font-sans text-rose-300 flex items-center gap-1 font-medium">
                        🛡️ Truecaller Radar: Flagged as High-Risk Telemarketer Spam
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALARMS & TIMERS */}
        {activeTab === 'alarms' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> Set Smart Alarm
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  placeholder="e.g. 07:00 AM"
                  className="w-32 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-purple-400/50"
                />
                <input
                  type="text"
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  placeholder="Alarm Label"
                  className="flex-1 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 text-white text-xs outline-none focus:border-purple-400/50"
                />
                <button
                  onClick={handleAddAlarm}
                  className="px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold font-sans text-xs rounded-2xl cursor-pointer shadow-md"
                >
                  SET
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-slate-200 uppercase">Active Alarms & Timers</span>
              <div className="space-y-2">
                {alarms.map(a => (
                  <div key={a.id} className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-mono font-bold text-white">{a.time}</div>
                      <div className="text-[10px] text-purple-200/60">{a.label}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => engine.toggleAlarm(a.id)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          a.isActive ? 'bg-purple-600' : 'bg-white/20'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                          a.isActive ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                      <button
                        onClick={() => engine.removeAlarm(a.id)}
                        className="text-purple-300/40 hover:text-rose-400 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Quick Schedule Event
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Meeting / Event Title"
                  className="flex-1 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 text-white text-xs outline-none focus:border-indigo-400/50"
                />
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="04:00 PM"
                  className="w-28 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-indigo-400/50"
                />
                <button
                  onClick={handleAddEvent}
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-sans text-xs rounded-2xl cursor-pointer shadow-md"
                >
                  ADD
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="text-[11px] font-sans font-bold text-slate-200 uppercase">Upcoming Schedule</span>
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{ev.title}</div>
                      <div className="text-[10px] text-indigo-300 font-medium">{ev.date} at {ev.time}</div>
                    </div>
                    <button
                      onClick={() => engine.removeCalendarEvent(ev.id)}
                      className="text-purple-300/40 hover:text-rose-400 cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <span className="text-[11px] font-sans font-bold text-purple-300 uppercase flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-purple-400" /> Media Vault & AI Semantic Search
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {gallery.map(g => (
                <div key={g.id} className="p-2.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 space-y-1.5 shadow-md">
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-black/60">
                    <img src={g.url} alt={g.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="font-bold text-[10px] text-white truncate">{g.title}</div>
                  <div className="flex flex-wrap gap-1">
                    {g.tags.map(t => (
                      <span key={t} className="text-[8px] font-sans bg-white/10 text-purple-200 px-1.5 py-0.5 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
