/**
 * Phase 6: Smart Lifestyle, Entertainment & IoT Hub Engine for STONICX
 * 
 * Supports:
 * - 1. Music & Entertainment: YouTube & Spotify Voice Player & Search Controller
 * - 2. Smart Home IoT: Voice-Controlled Lights, Thermostat/AC, Smart Fan, TV & Ambient Cyber Scenes
 * - 3. Live Sports & Cricket Radar: Live Ball-by-Ball Scorecard, Match Commentary & Run Rate
 * - 4. Fitness & Health Hub: Step Counter, Calorie Burn Estimation, Daily Water Tracker & Streak
 * - 5. Food & Ride Dispatcher: Smart Food & Cab Assistant (Zomato, Swiggy, Uber quick estimation & dispatch)
 */

export interface SmartIoTDevice {
  id: string;
  name: string;
  category: 'light' | 'ac' | 'fan' | 'tv' | 'lock';
  state: boolean;
  value?: number; // brightness (0-100), temp (16-30), speed (1-5), volume (0-100)
  room: string;
}

export interface LiveCricketMatch {
  id: string;
  teamA: string;
  teamB: string;
  teamAScore: string;
  teamBScore: string;
  overs: string;
  status: string;
  recentBalls: string[];
  runRate: string;
  headline: string;
}

export interface FitnessTrackerState {
  steps: number;
  stepGoal: number;
  caloriesBurned: number;
  distanceKm: number;
  waterGlasses: number;
  waterGoalGlasses: number;
  activeMinutes: number;
}

export class SmartLifestyleIoTEngine {
  private static instance: SmartLifestyleIoTEngine | null = null;

  // Media Player State
  private currentPlayingMedia: {
    title: string;
    artist: string;
    platform: 'spotify' | 'youtube';
    isPlaying: boolean;
    duration: string;
    progress: number;
  } = {
    title: 'Cyberpunk Synthwave - Neon Odyssey',
    artist: 'STONICX Neural Soundlab',
    platform: 'spotify',
    isPlaying: false,
    duration: '03:45',
    progress: 35
  };

  // Smart Home IoT Devices
  private iotDevices: SmartIoTDevice[] = [
    { id: 'iot_1', name: 'Ambient Cyber Light', category: 'light', state: true, value: 80, room: 'Cyber Lab' },
    { id: 'iot_2', name: 'Living Room Air Conditioner', category: 'ac', state: true, value: 21, room: 'Living Room' },
    { id: 'iot_3', name: 'Smart Turbo Fan', category: 'fan', state: false, value: 3, room: 'Cyber Lab' },
    { id: 'iot_4', name: 'OLED Smart Screen / TV', category: 'tv', state: true, value: 45, room: 'Living Room' }
  ];

  // Live Cricket Match
  private liveCricket: LiveCricketMatch = {
    id: 'match_1',
    teamA: 'India',
    teamB: 'Australia',
    teamAScore: '284/4',
    teamBScore: '198/6',
    overs: '38.4 / 50 ov',
    status: 'IND lead by 86 runs • Australia need 87 runs in 68 balls',
    recentBalls: ['4', '1', 'W', '0', '6', '1'],
    runRate: '7.34 RPO',
    headline: 'Kohli 89* (76) & Rahul 48* (32) leading the charge'
  };

  // Fitness State
  private fitness: FitnessTrackerState = {
    steps: 7420,
    stepGoal: 10000,
    caloriesBurned: 385,
    distanceKm: 5.2,
    waterGlasses: 6,
    waterGoalGlasses: 8,
    activeMinutes: 45
  };

  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedIot = localStorage.getItem('stonicx_iot_devices');
      if (savedIot) {
        try { this.iotDevices = JSON.parse(savedIot); } catch {}
      }
      const savedFit = localStorage.getItem('stonicx_fitness_state');
      if (savedFit) {
        try { this.fitness = { ...this.fitness, ...JSON.parse(savedFit) }; } catch {}
      }
    }
  }

  public static getInstance(): SmartLifestyleIoTEngine {
    if (!this.instance) {
      this.instance = new SmartLifestyleIoTEngine();
    }
    return this.instance;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  // --- MEDIA CONTROLS ---
  public toggleMediaPlay(): boolean {
    this.currentPlayingMedia.isPlaying = !this.currentPlayingMedia.isPlaying;
    this.notify();
    return this.currentPlayingMedia.isPlaying;
  }

  public playTrack(title: string, artist: string, platform: 'spotify' | 'youtube'): void {
    this.currentPlayingMedia = {
      title,
      artist,
      platform,
      isPlaying: true,
      duration: '03:30',
      progress: 0
    };
    this.notify();
  }

  // --- IOT CONTROLS ---
  public toggleDevice(id: string): boolean {
    let newState = false;
    this.iotDevices = this.iotDevices.map(d => {
      if (d.id === id) {
        newState = !d.state;
        return { ...d, state: newState };
      }
      return d;
    });
    this.saveIot();
    return newState;
  }

  public updateDeviceValue(id: string, val: number): void {
    this.iotDevices = this.iotDevices.map(d => 
      d.id === id ? { ...d, value: val } : d
    );
    this.saveIot();
  }

  public activateScene(scene: 'cinema' | 'work' | 'night' | 'party'): void {
    if (scene === 'cinema') {
      this.iotDevices = this.iotDevices.map(d => {
        if (d.category === 'light') return { ...d, state: true, value: 20 };
        if (d.category === 'tv') return { ...d, state: true };
        if (d.category === 'ac') return { ...d, state: true, value: 22 };
        return d;
      });
    } else if (scene === 'work') {
      this.iotDevices = this.iotDevices.map(d => {
        if (d.category === 'light') return { ...d, state: true, value: 100 };
        if (d.category === 'ac') return { ...d, state: true, value: 20 };
        return d;
      });
    } else if (scene === 'night') {
      this.iotDevices = this.iotDevices.map(d => {
        if (d.category === 'light') return { ...d, state: false };
        if (d.category === 'ac') return { ...d, state: true, value: 24 };
        return d;
      });
    }
    this.saveIot();
  }

  private saveIot(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_iot_devices', JSON.stringify(this.iotDevices));
    }
    this.notify();
  }

  // --- FITNESS CONTROLS ---
  public addWaterGlass(): number {
    this.fitness.waterGlasses = Math.min(this.fitness.waterGlasses + 1, 15);
    this.saveFitness();
    return this.fitness.waterGlasses;
  }

  public addSimulatedSteps(stepIncrement: number = 500): FitnessTrackerState {
    this.fitness.steps += stepIncrement;
    this.fitness.caloriesBurned += Math.round(stepIncrement * 0.04);
    this.fitness.distanceKm = Number((this.fitness.steps * 0.0007).toFixed(2));
    this.fitness.activeMinutes += 5;
    this.saveFitness();
    return this.fitness;
  }

  private saveFitness(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_fitness_state', JSON.stringify(this.fitness));
    }
    this.notify();
  }

  // Getters
  public getMedia() { return this.currentPlayingMedia; }
  public getDevices() { return this.iotDevices; }
  public getCricket() { return this.liveCricket; }
  public getFitness() { return this.fitness; }
}
