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
    <div className={`flex-1 flex flex-col overflow-y-auto text-slate-200 transition-colors duration-500 ${
      isSosActive ? 'bg-red-950/90' : 'bg-[#070913]'
    }`}>
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
            <div className={`p-1.5 rounded-lg shadow-md text-white ${isSosActive ? 'bg-red-600 animate-pulse' : 'bg-red-600'}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Emergency SOS & Escalation
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">Features 62-66: Voice Trigger, GPS Dispatch & Dialer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* SAFETY FIRST CRITICAL DISCLAIMER */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-start gap-3 text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[9px] border border-amber-500/30">
                SIMULATION / DEMO MODE
              </span>
              <span className="font-bold text-[11px] text-amber-300">Safety Notice</span>
            </div>
            <p className="text-[10px] text-amber-200/90 leading-relaxed">
              Browser environment mein background SIM SMS dispatch simulated hota hai. Real-life emergency mein kripya sidhe niche diye gaye <strong>Call 112 (National Emergency)</strong> button ya apne phone ke hardware SOS button ka upyog karein.
            </p>
            <div className="pt-1 flex gap-2">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[10px] rounded-lg shadow transition-transform active:scale-95"
              >
                <PhoneCall className="w-3 h-3" /> CALL 112 (REAL NATIONAL EMERGENCY)
              </a>
            </div>
          </div>
        </div>

        {/* Big SOS Trigger Button */}
        <div className={`p-5 rounded-2xl border text-center flex flex-col items-center gap-3 transition-all ${
          isSosActive ? 'bg-red-900/60 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-[#0C1021] border-red-500/20'
        }`}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono text-[9px] font-bold">
              FEATURE TEST BENCH (SIMULATED SMS)
            </span>
          </div>

          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
            isSosActive ? 'bg-red-600 border-white text-white animate-ping' : 'bg-red-600/20 border-red-500 text-red-400'
          }`}>
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-mono font-bold text-sm text-white uppercase">
              {isSosActive ? 'EMERGENCY PROTOCOL SIMULATION ACTIVE' : 'VOICE SOS TEST READY'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Say <span className="text-red-400 font-mono">"STONICX SOS Activate Karo"</span> to test live GPS lookup & alert simulation.
            </p>
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            {isSosActive ? (
              <button
                onClick={handleCancelSOS}
                className="flex-1 py-3 bg-white text-red-700 hover:bg-slate-200 font-bold font-mono text-xs rounded-xl shadow-md"
              >
                CANCEL EMERGENCY ALERT
              </button>
            ) : (
              <button
                onClick={handleTriggerSOS}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-xs rounded-xl shadow-md"
              >
                🚨 TEST SIMULATED SOS DISPATCH
              </button>
            )}
          </div>
        </div>

        {sosStatusLog && (
          <div className="p-3 bg-red-950 border border-red-500/40 rounded-xl font-mono text-[11px] text-red-200">
            {sosStatusLog}
          </div>
        )}

        {/* Priority Emergency Contacts List */}
        <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-red-400" /> Priority Emergency Contacts ({contacts.length}/5)
            </span>
            {contacts.length < 5 && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 font-mono text-[10px] font-bold rounded-lg border border-red-500/30 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Contact
              </button>
            )}
          </div>

          {/* Add Contact Modal Form */}
          {showAddForm && (
            <div className="p-3 bg-[#070913] border border-red-500/30 rounded-xl space-y-2">
              <input
                type="text"
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#0C1021] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none"
              />
              <input
                type="text"
                placeholder="Phone Number (e.g. +91 98765 43210)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-[#0C1021] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none font-mono"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 bg-white/10 text-slate-300 rounded-lg text-[10px] font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-[10px] font-mono"
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
                className="p-3 bg-[#070913] rounded-xl border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center font-mono font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      {contact.name} <span className="text-[9px] font-mono text-slate-500">({contact.relation})</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{contact.phoneNumber}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => engine.removeEmergencyContact(contact.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
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
