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
    setStatusNotification(`Dispatched ${targetApp.toUpperCase()} to ${recipient}`);
    await mouth.speak(`Message sent to ${recipient} via ${targetApp}.`, { persona: 'STONICX' });
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
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-emerald-600 to-cyan-600 text-white rounded-lg shadow-md">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                All-In-One Unified App Hub
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">
                Features 67-76: WhatsApp, Telegram, Truecaller, Gallery & Alarms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 px-4 gap-2 pt-2 bg-[#0C1021]/50">
        {[
          { id: 'messages', label: 'Messages & Spam', icon: MessageSquare },
          { id: 'alarms', label: 'Alarms & Timers', icon: Clock },
          { id: 'calendar', label: 'Smart Calendar', icon: Calendar },
          { id: 'gallery', label: 'Media Vault', icon: Image }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 px-3 flex items-center gap-1.5 text-xs font-mono font-bold transition-all border-b-2 ${
              activeTab === t.id
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {statusNotification && (
        <div className="mx-4 mt-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{statusNotification}</span>
        </div>
      )}

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* TAB 1: MESSAGES & SPAM RADAR */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {/* Quick Dispatch Composer */}
            <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Voice & Quick Messenger Dispatch
                </span>
                <span className="text-[9px] font-mono text-slate-400">Multi-Channel Bridge</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(['whatsapp', 'telegram', 'sms', 'instagram'] as const).map(app => (
                  <button
                    key={app}
                    onClick={() => setTargetApp(app)}
                    className={`py-1.5 rounded-lg border font-mono text-[10px] uppercase font-bold transition-all ${
                      targetApp === app
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                        : 'bg-[#070913] text-slate-400 border-white/10'
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
                  className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-cyan-500"
                />
                <textarea
                  rows={2}
                  placeholder={`Write ${targetApp} message...`}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  className="w-full bg-[#070913] border border-white/10 rounded-xl p-2.5 text-white font-sans text-xs outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" /> SEND VIA {targetApp.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Unified Inbox & Truecaller Spam Radar */}
            <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Unified Inbox & Truecaller Radar
                </span>
                <div className="flex gap-1">
                  {(['all', 'whatsapp', 'telegram', 'sms', 'instagram'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setAppFilter(f)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                        appFilter === f ? 'bg-white/20 text-white' : 'text-slate-500'
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
                    className={`p-3 rounded-xl border flex flex-col gap-1 ${
                      m.isSpam
                        ? 'bg-rose-950/30 border-rose-500/40'
                        : 'bg-[#070913] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          m.app === 'whatsapp' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                          m.app === 'telegram' ? 'bg-sky-950 text-sky-300 border border-sky-500/30' :
                          m.app === 'instagram' ? 'bg-pink-950 text-pink-300 border border-pink-500/30' :
                          'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}>
                          {m.app}
                        </span>
                        <span className="font-bold text-white text-xs">{m.sender}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{m.content}</p>
                    {m.isSpam && (
                      <span className="text-[9px] font-mono text-rose-400 flex items-center gap-1">
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
            <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Set Smart Alarm
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  placeholder="e.g. 07:00 AM"
                  className="w-32 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                />
                <input
                  type="text"
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  placeholder="Alarm Label"
                  className="flex-1 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
                <button
                  onClick={handleAddAlarm}
                  className="px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs rounded-xl"
                >
                  SET
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-slate-200 uppercase">Active Alarms & Timers</span>
              <div className="space-y-2">
                {alarms.map(a => (
                  <div key={a.id} className="p-3 bg-[#070913] rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-mono font-bold text-white">{a.time}</div>
                      <div className="text-[10px] text-slate-400">{a.label}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => engine.toggleAlarm(a.id)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          a.isActive ? 'bg-cyan-600' : 'bg-white/20'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                          a.isActive ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                      <button
                        onClick={() => engine.removeAlarm(a.id)}
                        className="text-slate-500 hover:text-rose-400"
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
            <div className="p-4 bg-[#0C1021] border border-indigo-500/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Quick Schedule Event
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Meeting / Event Title"
                  className="flex-1 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="04:00 PM"
                  className="w-28 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                />
                <button
                  onClick={handleAddEvent}
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs rounded-xl"
                >
                  ADD
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-slate-200 uppercase">Upcoming Schedule</span>
              <div className="space-y-2">
                {events.map(ev => (
                  <div key={ev.id} className="p-3 bg-[#070913] rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{ev.title}</div>
                      <div className="text-[10px] font-mono text-indigo-300">{ev.date} at {ev.time}</div>
                    </div>
                    <button
                      onClick={() => engine.removeCalendarEvent(ev.id)}
                      className="text-slate-500 hover:text-rose-400"
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
          <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
            <span className="text-[11px] font-mono font-bold text-purple-400 uppercase flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" /> Media Vault & AI Semantic Search
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {gallery.map(g => (
                <div key={g.id} className="p-2 bg-[#070913] rounded-xl border border-white/10 space-y-1.5">
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-black/60">
                    <img src={g.url} alt={g.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="font-bold text-[10px] text-white truncate">{g.title}</div>
                  <div className="flex flex-wrap gap-1">
                    {g.tags.map(t => (
                      <span key={t} className="text-[8px] font-mono bg-white/5 text-slate-400 px-1 py-0.5 rounded">
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
