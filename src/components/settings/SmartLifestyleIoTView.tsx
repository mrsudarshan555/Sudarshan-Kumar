import React, { useState, useEffect } from 'react';
import { 
  Music, Tv, Activity, Trophy, Utensils, Car, ArrowLeft, 
  Play, Pause, SkipForward, SkipBack, Volume2, Power, 
  Lightbulb, Wind, Thermometer, Droplets, Flame, Footprints, 
  Check, Sparkles, Sliders, Smartphone, ExternalLink, Zap
} from 'lucide-react';
import { SmartLifestyleIoTEngine, SmartIoTDevice, LiveCricketMatch, FitnessTrackerState } from '../../services/lifestyle/SmartLifestyleIoTEngine';
import { Mouth } from '../../services/audio/mouth';

interface SmartLifestyleIoTViewProps {
  onBack: () => void;
}

export const SmartLifestyleIoTView: React.FC<SmartLifestyleIoTViewProps> = ({ onBack }) => {
  const engine = SmartLifestyleIoTEngine.getInstance();
  const mouth = Mouth.getInstance();

  const [activeTab, setActiveTab] = useState<'media' | 'iot' | 'cricket' | 'fitness' | 'food_cab'>('media');
  const [media, setMedia] = useState(engine.getMedia());
  const [devices, setDevices] = useState<SmartIoTDevice[]>(engine.getDevices());
  const [cricket, setCricket] = useState<LiveCricketMatch>(engine.getCricket());
  const [fitness, setFitness] = useState<FitnessTrackerState>(engine.getFitness());
  const [notification, setNotification] = useState<string | null>(null);

  // Search Media Query
  const [searchSong, setSearchSong] = useState<string>('Arijit Singh Chill Hits');
  const [foodItem, setFoodItem] = useState<string>('Paneer Butter Masala & Garlic Naan');
  const [cabDestination, setCabDestination] = useState<string>('Cyber Hub, Gurugram');

  useEffect(() => {
    const unsub = engine.subscribe(() => {
      setMedia(engine.getMedia());
      setDevices([...engine.getDevices()]);
      setCricket(engine.getCricket());
      setFitness({ ...engine.getFitness() });
    });
    return unsub;
  }, [engine]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  // Media Handlers
  const handleTogglePlay = async () => {
    const isPlaying = engine.toggleMediaPlay();
    if (isPlaying) {
      await mouth.speak(`Playing ${media.title} on ${media.platform}.`, { persona: 'STONICX' });
    } else {
      await mouth.speak('Media playback paused.', { persona: 'STONICX' });
    }
  };

  const handlePlayCustom = async (platform: 'spotify' | 'youtube') => {
    if (!searchSong.trim()) return;
    engine.playTrack(searchSong.trim(), 'Popular Audio Stream', platform);
    showToast(`Streaming "${searchSong}" on ${platform.toUpperCase()}`);
    await mouth.speak(`Searching and playing ${searchSong} on ${platform}.`, { persona: 'STONICX' });
  };

  // IoT Handlers
  const handleToggleDevice = async (d: SmartIoTDevice) => {
    const newState = engine.toggleDevice(d.id);
    showToast(`${d.name} is now ${newState ? 'ON' : 'OFF'}`);
    await mouth.speak(`${d.name} turned ${newState ? 'on' : 'off'}.`, { persona: 'STONICX' });
  };

  const handleScene = async (scene: 'cinema' | 'work' | 'night') => {
    engine.activateScene(scene);
    showToast(`Activated ${scene.toUpperCase()} Ambient Scene`);
    await mouth.speak(`Activated ${scene} environment scene. Lights and cooling adjusted.`, { persona: 'STONICX' });
  };

  // Cricket Commentary Handler
  const handleAnnounceScore = async () => {
    const speech = `${cricket.teamA} vs ${cricket.teamB}. ${cricket.status}. ${cricket.headline}`;
    await mouth.speak(speech, { persona: 'STONICX' });
  };

  // Fitness Handlers
  const handleLogWater = async () => {
    const count = engine.addWaterGlass();
    showToast(`Logged Water Intake: ${count}/${fitness.waterGoalGlasses} Glasses`);
    await mouth.speak(`Water intake logged. You have completed ${count} of ${fitness.waterGoalGlasses} glasses today.`, { persona: 'STONICX' });
  };

  const handleAddSteps = async () => {
    const updated = engine.addSimulatedSteps(500);
    showToast(`Steps Updated: ${updated.steps} (${updated.caloriesBurned} kcal burned)`);
  };

  // Food & Ride Handlers
  const handleDispatchFood = async (service: 'Zomato' | 'Swiggy') => {
    showToast(`Order request dispatched to ${service}: ${foodItem}`);
    await mouth.speak(`Looking up the fastest restaurant for ${foodItem} on ${service}.`, { persona: 'STONICX' });
  };

  const handleBookRide = async (service: 'Uber' | 'Ola') => {
    showToast(`Estimating fare for ${cabDestination} via ${service}`);
    await mouth.speak(`Finding nearby ${service} drivers for ${cabDestination}. Estimated time of arrival is 4 minutes.`, { persona: 'STONICX' });
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
            <div className="p-1.5 bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white rounded-lg shadow-md">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Smart Lifestyle, Media & IoT Hub
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">
                Spotify/YouTube • Smart Home • Cricket Radar • Fitness & Cabs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 px-4 gap-2 pt-2 bg-[#0C1021]/50 overflow-x-auto">
        {[
          { id: 'media', label: 'Music & Video', icon: Music },
          { id: 'iot', label: 'Smart Home IoT', icon: Tv },
          { id: 'cricket', label: 'Cricket Radar', icon: Trophy },
          { id: 'fitness', label: 'Fitness & Health', icon: Activity },
          { id: 'food_cab', label: 'Food & Cabs', icon: Utensils }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 px-3 flex items-center gap-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all border-b-2 ${
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

      {notification && (
        <div className="mx-4 mt-3 p-3 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-300 font-mono text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <div className="p-4 space-y-4 text-xs font-sans pb-12">
        {/* TAB 1: MUSIC & YOUTUBE PLAYER */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" /> Voice Stream Search (Spotify & YouTube)
              </span>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchSong}
                  onChange={(e) => setSearchSong(e.target.value)}
                  placeholder="Song name or artist..."
                  className="flex-1 bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handlePlayCustom('spotify')}
                  className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-[10px] rounded-xl"
                >
                  SPOTIFY
                </button>
                <button
                  onClick={() => handlePlayCustom('youtube')}
                  className="px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-[10px] rounded-xl"
                >
                  YOUTUBE
                </button>
              </div>
            </div>

            {/* Live Media Player Card */}
            <div className="p-5 bg-gradient-to-b from-[#0C1021] to-[#070913] border border-white/10 rounded-2xl space-y-4 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Music className={`w-10 h-10 text-white ${media.isPlaying ? 'animate-bounce' : ''}`} />
              </div>

              <div>
                <h3 className="font-bold text-sm text-white">{media.title}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{media.artist} • {media.platform.toUpperCase()}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full w-1/3" />
              </div>

              <div className="flex items-center justify-center gap-4 pt-1">
                <button className="p-2 bg-white/5 hover:bg-white/15 text-slate-300 rounded-full">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTogglePlay}
                  className="p-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg active:scale-95 transition-all"
                >
                  {media.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>
                <button className="p-2 bg-white/5 hover:bg-white/15 text-slate-300 rounded-full">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SMART HOME IOT */}
        {activeTab === 'iot' && (
          <div className="space-y-4">
            {/* Quick Scenes */}
            <div className="p-4 bg-[#0C1021] border border-white/10 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase">Ambient Cyber Scenes</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cinema', label: 'Cinema Mode', icon: Tv },
                  { id: 'work', label: 'Focus Lab', icon: Lightbulb },
                  { id: 'night', label: 'Night Sleep', icon: Wind }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleScene(s.id as any)}
                    className="p-2.5 bg-[#070913] hover:bg-indigo-950/40 border border-white/10 hover:border-indigo-500/40 rounded-xl flex flex-col items-center gap-1 font-mono text-[10px] text-slate-300"
                  >
                    <s.icon className="w-4 h-4 text-indigo-400" />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Devices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {devices.map(d => (
                <div
                  key={d.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    d.state ? 'bg-[#0C1021] border-cyan-500/30' : 'bg-[#070913] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${d.state ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                        {d.category === 'light' && <Lightbulb className="w-4 h-4" />}
                        {d.category === 'ac' && <Thermometer className="w-4 h-4" />}
                        {d.category === 'fan' && <Wind className="w-4 h-4" />}
                        {d.category === 'tv' && <Tv className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{d.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{d.room}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleDevice(d)}
                      className={`p-2 rounded-xl transition-all ${
                        d.state ? 'bg-cyan-600 text-white shadow-md' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {d.value !== undefined && d.state && (
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                      <span>Value Level:</span>
                      <span className="font-bold">{d.value} {d.category === 'ac' ? '°C' : '%'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CRICKET RADAR */}
        {activeTab === 'cricket' && (
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-b from-[#0C1021] to-[#070913] border border-amber-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Live International Match
                </span>
                <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[9px] font-bold rounded-full animate-pulse">
                  LIVE
                </span>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{cricket.teamA}</div>
                  <div className="text-lg font-mono font-black text-amber-400">{cricket.teamAScore}</div>
                </div>
                <span className="text-slate-500 font-mono font-bold text-xs">VS</span>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{cricket.teamB}</div>
                  <div className="text-lg font-mono font-black text-cyan-400">{cricket.teamBScore}</div>
                </div>
              </div>

              <div className="p-3 bg-[#070913] rounded-xl border border-white/10 space-y-1 text-center">
                <div className="text-[11px] text-white font-medium">{cricket.status}</div>
                <div className="text-[10px] font-mono text-slate-400">{cricket.headline}</div>
              </div>

              {/* Recent Balls */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Recent Over:</span>
                <div className="flex gap-1.5">
                  {cricket.recentBalls.map((b, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        b === 'W' ? 'bg-rose-600 text-white' :
                        b === '6' || b === '4' ? 'bg-amber-600 text-white' :
                        'bg-white/10 text-slate-200'
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAnnounceScore}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
              >
                <Volume2 className="w-3.5 h-3.5" /> VOICE COMMENTARY READOUT
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: FITNESS & HEALTH */}
        {activeTab === 'fitness' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Steps Card */}
              <div className="p-4 bg-[#0C1021] border border-cyan-500/20 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-cyan-400 font-mono text-[10px]">
                  <span className="flex items-center gap-1"><Footprints className="w-3.5 h-3.5" /> Daily Steps</span>
                  <span>{Math.round((fitness.steps / fitness.stepGoal) * 100)}%</span>
                </div>
                <div className="text-xl font-mono font-black text-white">{fitness.steps.toLocaleString()}</div>
                <p className="text-[10px] text-slate-400 font-mono">Goal: {fitness.stepGoal.toLocaleString()} • {fitness.distanceKm} km</p>
                <button
                  onClick={handleAddSteps}
                  className="w-full py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] rounded-lg mt-1"
                >
                  +500 Steps Sync
                </button>
              </div>

              {/* Water Card */}
              <div className="p-4 bg-[#0C1021] border border-sky-500/20 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-sky-400 font-mono text-[10px]">
                  <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> Hydration</span>
                  <span>{fitness.waterGlasses}/{fitness.waterGoalGlasses}</span>
                </div>
                <div className="text-xl font-mono font-black text-white">{fitness.waterGlasses * 250} ml</div>
                <p className="text-[10px] text-slate-400 font-mono">Daily Target: 2,000 ml</p>
                <button
                  onClick={handleLogWater}
                  className="w-full py-1.5 bg-sky-950/60 hover:bg-sky-900 border border-sky-500/30 text-sky-300 font-mono text-[10px] rounded-lg mt-1"
                >
                  +1 Glass (250ml)
                </button>
              </div>
            </div>

            {/* Calorie Burn Card */}
            <div className="p-4 bg-[#0C1021] border border-rose-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-400 rounded-xl">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Active Calories Burned</div>
                  <div className="text-[10px] text-slate-400 font-mono">{fitness.activeMinutes} minutes active today</div>
                </div>
              </div>
              <div className="text-lg font-mono font-black text-rose-400">{fitness.caloriesBurned} kcal</div>
            </div>
          </div>
        )}

        {/* TAB 5: FOOD & CABS */}
        {activeTab === 'food_cab' && (
          <div className="space-y-4">
            {/* Food Delivery Quick Dispatch */}
            <div className="p-4 bg-[#0C1021] border border-orange-500/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-orange-400 uppercase flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" /> Food Delivery Quick Dispatch
              </span>
              <input
                type="text"
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                placeholder="Dish or meal name..."
                className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-orange-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDispatchFood('Zomato')}
                  className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-xs rounded-xl"
                >
                  ORDER ON ZOMATO
                </button>
                <button
                  onClick={() => handleDispatchFood('Swiggy')}
                  className="py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold font-mono text-xs rounded-xl"
                >
                  ORDER ON SWIGGY
                </button>
              </div>
            </div>

            {/* Cab Ride Dispatcher */}
            <div className="p-4 bg-[#0C1021] border border-yellow-500/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Instant Cab & Travel Booking
              </span>
              <input
                type="text"
                value={cabDestination}
                onChange={(e) => setCabDestination(e.target.value)}
                placeholder="Where to? (Destination address)"
                className="w-full bg-[#070913] border border-white/10 rounded-xl px-3 py-2 text-white font-sans text-xs outline-none focus:border-yellow-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleBookRide('Uber')}
                  className="py-2 bg-black border border-white/20 hover:bg-neutral-900 text-white font-bold font-mono text-xs rounded-xl"
                >
                  ESTIMATE UBER
                </button>
                <button
                  onClick={() => handleBookRide('Ola')}
                  className="py-2 bg-lime-600 hover:bg-lime-500 text-black font-bold font-mono text-xs rounded-xl"
                >
                  BOOK OLA CAB
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
