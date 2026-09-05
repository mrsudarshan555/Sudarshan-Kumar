import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, PhoneCall, MapPin, Plus, Trash2, ArrowLeft, Send, ShieldAlert, Check, Users, Navigation
} from 'lucide-react';
import { SystemAutomationEmergencyEngine, EmergencyContact } from '../../services/automation/SystemAutomationEmergencyEngine';
import { Mouth } from '../../services/audio/mouth';

interface EmergencySOSViewProps {
  onBack: () => void;
}

export const EmergencySOSView: React.FC<EmergencySOSViewProps> = ({ onBack }) => {
  const engine = SystemAutomationEmergencyEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [contacts, setContacts] = useState<EmergencyContact[]>(engine.getEmergencyContacts());
  const [isSosActive, setIsSosActive] = useState<boolean>(engine.isSosTriggered());
  const [currentPriority, setCurrentPriority] = useState<number>(engine.getCurrentDialingPriority());
  const [sosStatusLog, setSosStatusLog] = useState<string | null>(null);

  // New Contact Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newRelation, setNewRelation] = useState<string>('Family');

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setContacts([...engine.getEmergencyContacts()]);
      setIsSosActive(engine.isSosTriggered());
      setCurrentPriority(engine.getCurrentDialingPriority());
    });
    return unsub;
  }, [engine]);

  const handleTriggerSOS = async () => {
    const res = await engine.triggerEmergencySOS();
    const gpsType = res.isRealGps ? '🟢 Real GPS Lat/Long' : '🟡 Simulated Default GPS';
    setSosStatusLog(`🚨 SOS SIMULATION DISPATCHED to ${res.dispatchedTo.length} contacts (${gpsType}): ${res.mapsUrl}\n${res.warningMessage}`);
    
    // Transparent, safety-first voice announcement
    await mouth.speak('इमरजेंसी अलर्ट सिम्युलेट कर दिया गया है। ध्यान दें, यह अभी डेमो मोड में है। वास्तविक आपातकाल के लिए कृपया सीधे 112 डायल करें या अपने फोन का बिल्ट-इन एसओएस इस्तेमाल करें।', {
      persona: 'STONICX'
    });
  };

  const handleCancelSOS = async () => {
    engine.cancelSOS();
    setSosStatusLog(null);
    await mouth.speak('Emergency SOS alert cancelled.', { persona: 'STONICX' });
  };

  const handleAddContact = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    engine.addEmergencyContact({
      name: newName.trim(),
      phoneNumber: newPhone.trim(),
      priority: (contacts.length + 1) as any,
      relation: newRelation,
      isFavorite: true
    });
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
  };

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto text-slate-200 transition-colors duration-500 bg-transparent`}>
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
            <div className={`p-1.5 rounded-full shadow-md text-white border border-red-400/50 ${isSosActive ? 'bg-red-600 animate-pulse' : 'bg-red-600'}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-sans font-bold text-white uppercase tracking-wider">
                Emergency SOS & Escalation
              </h2>
              <p className="text-[10px] text-purple-300/70 font-sans">Features 62-66: Voice Trigger, GPS Dispatch & Dialer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* SAFETY FIRST CRITICAL DISCLAIMER */}
        <div className="p-4 bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-3xl flex items-start gap-3 text-amber-200 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-sans font-bold text-[9px] border border-amber-500/30">
                SIMULATION / DEMO MODE
              </span>
              <span className="font-bold text-[11px] text-amber-300">Safety Notice</span>
            </div>
            <p className="text-[10px] text-amber-200/90 leading-relaxed font-sans">
              Browser environment mein background SIM SMS dispatch simulated hota hai. Real-life emergency mein kripya sidhe niche diye gaye <strong>Call 112 (National Emergency)</strong> button ya apne phone ke hardware SOS button ka upyog karein.
            </p>
            <div className="pt-1 flex gap-2">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-[10px] rounded-xl shadow transition-transform active:scale-95"
              >
                <PhoneCall className="w-3 h-3" /> CALL 112 (REAL NATIONAL EMERGENCY)
              </a>
            </div>
          </div>
        </div>

        {/* Big SOS Trigger Button - Magnifying Glass */}
        <div className={`p-5 rounded-3xl border text-center flex flex-col items-center gap-3 transition-all backdrop-blur-2xl ${
          isSosActive
            ? 'bg-red-900/60 border-red-500 shadow-[0_8px_32px_rgba(239,68,68,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            : 'bg-black/35 border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-sans text-[9px] font-bold">
              FEATURE TEST BENCH (SIMULATED SMS)
            </span>
          </div>

          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 backdrop-blur-xl ${
            isSosActive ? 'bg-red-600 border-white text-white animate-ping' : 'bg-red-600/20 border-red-400 text-red-400'
          }`}>
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-sans font-bold text-sm text-white uppercase">
              {isSosActive ? 'EMERGENCY PROTOCOL SIMULATION ACTIVE' : 'VOICE SOS TEST READY'}
            </h3>
            <p className="text-[11px] text-purple-200/70 mt-0.5 font-sans">
              Say <span className="text-red-400 font-bold">"STONICX SOS Activate Karo"</span> to test live GPS lookup & alert simulation.
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            {isSosActive ? (
              <button
                onClick={handleCancelSOS}
                className="flex-1 py-3 bg-white text-red-700 hover:bg-slate-200 font-bold font-sans text-xs rounded-2xl shadow-md cursor-pointer"
              >
                CANCEL EMERGENCY ALERT
              </button>
            ) : (
              <button
                onClick={handleTriggerSOS}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-sans text-xs rounded-2xl shadow-md cursor-pointer transition-opacity"
              >
                🚨 TEST SIMULATED SOS DISPATCH
              </button>
            )}
          </div>
        </div>

        {sosStatusLog && (
          <div className="p-3.5 bg-red-950/60 backdrop-blur-2xl border border-red-500/40 rounded-2xl font-sans text-[11px] text-red-200 shadow-md">
            {sosStatusLog}
          </div>
        )}

        {/* Priority Emergency Contacts List - Magnifying Glass */}
        <div className="p-4 bg-black/35 backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-400" /> Priority Emergency Contacts ({contacts.length}/5)
            </span>
            {contacts.length < 5 && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 font-sans text-[10px] font-bold rounded-xl border border-red-500/30 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Contact
              </button>
            )}
          </div>

          {/* Add Contact Modal Form */}
          {showAddForm && (
            <div className="p-3.5 bg-black/30 backdrop-blur-xl border border-red-500/30 rounded-2xl space-y-2">
              <input
                type="text"
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-red-400/50"
              />
              <input
                type="text"
                placeholder="Phone Number (e.g. +91 98765 43210)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none font-mono focus:border-red-400/50"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 rounded-xl text-[10px] font-sans border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[10px] font-sans cursor-pointer shadow-md"
                >
                  Save Priority Contact
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {contacts.map((contact, idx) => (
              <div
                key={contact.id}
                className="p-3 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center font-sans font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      {contact.name} <span className="text-[9px] font-sans text-purple-300/60">({contact.relation})</span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-200/60">{contact.phoneNumber}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => engine.removeEmergencyContact(contact.id)}
                    className="p-1.5 text-purple-300/50 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
