import React, { useState } from 'react';
import { 
  Smartphone, Tablet, Watch, Laptop, Wifi, Bluetooth, 
  Battery, RefreshCw, Plus, Trash2, CheckCircle2, ShieldCheck,
  Radio, Bell, Copy, ArrowLeft
} from 'lucide-react';
import { LinkedDeviceItem } from '../../types';

interface LinkedDevicesViewProps {
  onBack: () => void;
}

const INITIAL_DEVICES: LinkedDeviceItem[] = [
  {
    id: 'dev-1',
    name: 'Zafer’s Pixel 9 Pro',
    model: 'Google Pixel 9 Pro XL',
    type: 'smartphone',
    status: 'online',
    batteryLevel: 88,
    lastSync: 'Just now (Host Device)',
    location: 'Current Device',
    isPrimary: true
  },
  {
    id: 'dev-2',
    name: 'Zafer’s Galaxy Tab S9',
    model: 'Samsung Galaxy Tab S9 Ultra',
    type: 'tablet',
    status: 'online',
    batteryLevel: 74,
    lastSync: '1 min ago (WiFi Sync)',
    location: 'Home Studio'
  },
  {
    id: 'dev-3',
    name: 'MAYRA Neural Watch',
    model: 'Google Pixel Watch 3 (LTE)',
    type: 'smartwatch',
    status: 'nearby_ble',
    batteryLevel: 92,
    lastSync: 'Connected via BLE Mesh',
    location: 'On Wrist'
  },
  {
    id: 'dev-4',
    name: 'Zafer’s MacBook Workstation',
    model: 'Apple MacBook Pro M3 Max',
    type: 'laptop',
    status: 'online',
    batteryLevel: 100,
    lastSync: 'Active (Desktop Relay)',
    location: 'Office Desk'
  }
];

export const LinkedDevicesView: React.FC<LinkedDevicesViewProps> = ({ onBack }) => {
  const [devices, setDevices] = useState<LinkedDeviceItem[]>(INITIAL_DEVICES);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [clipboardSyncEnabled, setClipboardSyncEnabled] = useState<boolean>(true);
  const [notificationMirrorEnabled, setNotificationMirrorEnabled] = useState<boolean>(true);
  const [voiceRelayEnabled, setVoiceRelayEnabled] = useState<boolean>(true);
  const [pingStatus, setPingStatus] = useState<{ [id: string]: string }>({});

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          lastSync: 'Just now (Synced)'
        }))
      );
    }, 1200);
  };

  const handlePingDevice = (device: LinkedDeviceItem) => {
    setPingStatus((prev) => ({ ...prev, [device.id]: 'Pinging...' }));
    setTimeout(() => {
      setPingStatus((prev) => ({ ...prev, [device.id]: 'Chime Sent!' }));
      setTimeout(() => {
        setPingStatus((prev) => {
          const copy = { ...prev };
          delete copy[device.id];
          return copy;
        });
      }, 2500);
    }, 1000);
  };

  const getDeviceIcon = (type: LinkedDeviceItem['type']) => {
    switch (type) {
      case 'smartphone':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-purple-400" />;
      case 'smartwatch':
        return <Watch className="w-5 h-5 text-emerald-400" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-200 select-none">
      
      {/* Header - Liquid Magnifying Glass */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-white/[0.06] backdrop-blur-3xl border-b border-white/10 sticky top-0 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.08] hover:bg-white/[0.16] text-purple-200 hover:text-white rounded-full border border-white/15 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>
          <div>
            <h1 className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              LINKED DEVICES & MULTI-DEVICE SYNC
            </h1>
            <p className="text-[10px] text-purple-300/70 font-sans">Zero-latency cross-device relay & state</p>
          </div>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-full text-[10px] font-mono text-cyan-300 font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        
        {/* Global Sync Controls */}
        <div className="p-4 bg-white/[0.07] backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span className="font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" /> MAYRA Neural Mesh Relay
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> End-to-End Encrypted
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setClipboardSyncEnabled(!clipboardSyncEnabled)}
              className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all backdrop-blur-md cursor-pointer ${
                clipboardSyncEnabled
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200 shadow-sm'
                  : 'bg-white/[0.04] border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[9px] font-mono font-bold">{clipboardSyncEnabled ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[10px] font-semibold">Live Clipboard</span>
            </button>

            <button
              onClick={() => setNotificationMirrorEnabled(!notificationMirrorEnabled)}
              className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all backdrop-blur-md cursor-pointer ${
                notificationMirrorEnabled
                  ? 'bg-purple-500/20 border-purple-400/40 text-purple-200 shadow-sm'
                  : 'bg-white/[0.04] border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Bell className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[9px] font-mono font-bold">{notificationMirrorEnabled ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[10px] font-semibold">Mirror Alerts</span>
            </button>

            <button
              onClick={() => setVoiceRelayEnabled(!voiceRelayEnabled)}
              className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all backdrop-blur-md cursor-pointer ${
                voiceRelayEnabled
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 shadow-sm'
                  : 'bg-white/[0.04] border-white/10 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] font-mono font-bold">{voiceRelayEnabled ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[10px] font-semibold">Voice Hand-off</span>
            </button>
          </div>
        </div>

        {/* Device List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wider">
              Connected Devices ({devices.length})
            </h2>
            <button
              onClick={() => setShowPairModal(true)}
              className="flex items-center gap-1 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Pair Device
            </button>
          </div>

          {devices.map((dev) => (
            <div
              key={dev.id}
              className={`p-4 rounded-3xl border transition-all backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] ${
                dev.isPrimary
                  ? 'bg-white/[0.09] border-cyan-400/40 ring-1 ring-cyan-400/20'
                  : 'bg-white/[0.06] border-white/15 hover:border-purple-400/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/[0.08] border border-white/10 shrink-0">
                    {getDeviceIcon(dev.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{dev.name}</span>
                      {dev.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 font-bold">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-purple-200/70 mt-0.5">{dev.model} • {dev.location}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-purple-200/80">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Battery className="w-3 h-3" /> {dev.batteryLevel}%
                      </span>
                      <span className="flex items-center gap-1">
                        {dev.status === 'online' ? (
                          <Wifi className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Bluetooth className="w-3 h-3 text-purple-400" />
                        )}
                        {dev.lastSync}
                      </span>
                    </div>
                  </div>
                </div>

                {!dev.isPrimary && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePingDevice(dev)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-cyan-500/20 border border-white/15 rounded-full text-[9px] font-mono text-purple-200 hover:text-cyan-300 cursor-pointer active:scale-95 transition-all"
                    >
                      {pingStatus[dev.id] || 'Ping'}
                    </button>
                    <button
                      onClick={() => setDevices((prev) => prev.filter((d) => d.id !== dev.id))}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-full text-rose-300 cursor-pointer active:scale-95 transition-all"
                      title="Unpair Device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pair Device Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xs p-5 bg-white/[0.08] backdrop-blur-3xl border border-white/20 rounded-3xl space-y-4 text-center shadow-[0_16px_48px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)]">
            <h3 className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              PAIR SECOND DEVICE
            </h3>
            <p className="text-[11px] text-purple-200/80">
              Open MAYRA on your secondary phone, tablet, or laptop and scan this neural sync code:
            </p>
            <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
              {/* QR Code Graphic simulation */}
              <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full bg-slate-900 p-1.5 rounded-xl">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 || i % 7 === 0) ? 'bg-cyan-400' : 'bg-slate-950'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 py-1 px-3 rounded-full border border-cyan-500/30 inline-block">PIN: MAYRA-8891-SYNC</p>
            <button
              onClick={() => setShowPairModal(false)}
              className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-2xl text-xs font-mono text-cyan-300 font-bold cursor-pointer transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
