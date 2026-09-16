import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Bell, MapPin, MessageSquare, PhoneCall, 
  Mail, Shield, Moon, Briefcase, Car, Check, AlertCircle
} from 'lucide-react';

interface IntelligenceModesViewProps {
  onBack: () => void;
}

export const IntelligenceModesView: React.FC<IntelligenceModesViewProps> = ({ onBack }) => {
  const [notifAccessGranted, setNotifAccessGranted] = useState(false);
  const [readNotifications, setReadNotifications] = useState(true);
  const [speakCallerName, setSpeakCallerName] = useState(true);
  
  // App specific
  const [readWhatsApp, setReadWhatsApp] = useState(true);
  const [readTelegram, setReadTelegram] = useState(false);
  const [readGmail, setReadGmail] = useState(true);

  // Privacy & Intelligence
  const [autoReply, setAutoReply] = useState(false);
  const [replyWhileChatOpen, setReplyWhileChatOpen] = useState(true);
  const [spamFilter, setSpamFilter] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState(true);

  // Smart Modes
  const [drivingMode, setDrivingMode] = useState(false);
  const [sleepMode, setSleepMode] = useState(false);
  const [workMode, setWorkMode] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-white overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#0d0e14] border-b border-white/5 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-bold text-white tracking-wide">
            Intelligence & Modes
          </h1>
          <p className="text-[11px] text-gray-400">
            Map permissions, smart reading, and automation modes
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none pb-24">
        {/* Essential Permissions */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            ESSENTIAL PERMISSIONS
          </span>

          {/* Notification Access */}
          <div className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a1b24] border border-white/10 flex items-center justify-center text-[#ff2a4b] shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Notification Access</h4>
                <p className="text-[11px] text-gray-400">Required to read messages aloud</p>
              </div>
            </div>
            <button
              onClick={() => setNotifAccessGranted(!notifAccessGranted)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                notifAccessGranted 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-[#ff2a4b] text-white shadow-[0_0_10px_rgba(255,42,75,0.4)]'
              }`}
            >
              {notifAccessGranted ? 'GRANTED' : 'ENABLE'}
            </button>
          </div>

          {/* Map & Location */}
          <div className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a1b24] border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Map & Location</h4>
                <p className="text-[11px] text-gray-400">Live navigation & traffic status</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              Permission Granted
            </span>
          </div>
        </div>

        {/* General Notification Readers */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            GENERAL NOTIFICATION READERS
          </span>

          <div className="space-y-2">
            {[
              {
                title: 'Read Notifications',
                desc: 'Announce new notifications as they arrive',
                val: readNotifications,
                setVal: setReadNotifications
              },
              {
                title: 'Speak Caller Name',
                desc: 'Announce incoming callers using your contact book',
                val: speakCallerName,
                setVal: setSpeakCallerName
              }
            ].map(item => (
              <div key={item.title} className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => item.setVal(!item.val)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    item.val ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      item.val ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* App Specific Readers */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            APP SPECIFIC READERS
          </span>

          <div className="space-y-2">
            {[
              { title: 'Read WhatsApp Messages', icon: MessageSquare, val: readWhatsApp, setVal: setReadWhatsApp },
              { title: 'Read Telegram Messages', icon: MessageSquare, val: readTelegram, setVal: setReadTelegram },
              { title: 'Read Gmail Alerts', icon: Mail, val: readGmail, setVal: setReadGmail }
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1a1b24] border border-white/10 flex items-center justify-center text-[#ff2a4b] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setVal(!item.val)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      item.val ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        item.val ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy & Intelligence */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            PRIVACY & INTELLIGENCE
          </span>

          <div className="space-y-2">
            {[
              { title: 'Auto Reply', desc: 'Allow MYRA to compose autonomous smart replies', val: autoReply, setVal: setAutoReply },
              { title: 'Reply While Chat is Open', desc: 'Only read aloud if phone screen is locked or earphones in', val: replyWhileChatOpen, setVal: setReplyWhileChatOpen },
              { title: 'Spam Filter', desc: 'Silence promotional messages & OTPs automatically', val: spamFilter, setVal: setSpamFilter },
              { title: 'Priority Filter', desc: 'Only announce urgent VIP contacts in high priority mode', val: priorityFilter, setVal: setPriorityFilter }
            ].map(item => (
              <div key={item.title} className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => item.setVal(!item.val)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    item.val ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      item.val ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Modes */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-gray-400 tracking-wider">
            SMART MODES
          </span>

          <div className="space-y-2">
            {[
              { title: 'Driving Mode', desc: 'Full hands-free HUD, auto loudspeaker & speed alerts', icon: Car, val: drivingMode, setVal: setDrivingMode },
              { title: 'Sleep Mode', desc: 'Silence all non-essential audio and dim display orbs', icon: Moon, val: sleepMode, setVal: setSleepMode },
              { title: 'Work Mode', desc: 'Prioritize calendar tasks, Slack summaries & email digest', icon: Briefcase, val: workMode, setVal: setWorkMode }
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-3.5 rounded-2xl bg-[#121318] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1a1b24] border border-white/10 flex items-center justify-center text-[#ff2a4b] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{item.title}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setVal(!item.val)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                      item.val ? 'bg-[#ff2a4b]' : 'bg-[#222430]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        item.val ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
