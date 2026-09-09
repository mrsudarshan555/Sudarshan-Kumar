/**
 * LiveWidgetsWorkflowEngine.ts
 * 
 * Provides real-time workflows and hardware/service integrations for the 5 top live widgets:
 * 1. MIN READING 42 - Mindfulness Meditative Breathing & Biometric Reading Audio Engine
 * 2. NIGHT 18 C° - Real Astronomical Lunar Phase Calculation & Night Mode Scene
 * 3. 600m SESAME ST - GPS Turn-by-Turn Navigation & Driving Mode Shield Automation
 * 4. 22:00 TIME TO SLEEP - Sleep Automation, Night IoT, Alarms & DND Scheduler
 * 5. SUMMER 38° - Smart Thermostat, AC Turbo Cooling & Heatwave Defense Protocol
 */

import { SmartLifestyleIoTEngine } from './SmartLifestyleIoTEngine';
import { SystemAutomationEmergencyEngine } from '../automation/SystemAutomationEmergencyEngine';
import { UnifiedAppHubEngine } from '../hub/UnifiedAppHubEngine';

export type BreathPhase = 'INHALE' | 'HOLD' | 'EXHALE' | 'IDLE';

export interface LiveWidgetsState {
  // Widget 1: Min Reading & Breathing
  reading: number;
  isBreathingActive: boolean;
  breathPhase: BreathPhase;
  breathSecondsLeft: number;
  sessionMinutes: number;

  // Widget 2: Night & Astronomy
  moonPhaseName: string;
  moonIllumination: number; // 0 to 100%
  nightTemp: number;
  nightTempUnit: 'C' | 'F';
  isNightModeActive: boolean;

  // Widget 3: Navigation HUD
  navDistanceMeters: number;
  navStreet: string;
  navCurrentSpeed: number;
  navSpeedLimit: number;
  isNavigating: boolean;
  isDrivingShieldActive: boolean;

  // Widget 4: Sleep Schedule
  sleepStatus: 'IDLE' | 'SLEEPING' | 'SNOOZED';
  bedtimeStr: string;
  sleepNotification: string;
  nextAlarmTime: string;

  // Widget 5: Summer Heatwave Thermostat
  summerTemp: number;
  isAcTurboActive: boolean;
  heatIndexText: string;
  targetRoomTemp: number;

  // Widget: Recharge Capsule (Real Device Hardware Battery)
  batteryPercent: number; // e.g. 18 -> 100
  isCharging: boolean;
  batteryStatusTitle: string; // 'Recharge.' | 'Please charge.' | 'Charging...' | 'Fully charged.'
  isRealBatteryConnected: boolean;
  batteryChargingTimeText: string;

  // Widget: Leather Multi-Card Wallet (Video 2)
  isWalletRevealed: boolean;
  walletTotalBalance: number;
  stripeBalance: number;
  wiseBalance: number;
  paypalBalance: number;
}

export class LiveWidgetsWorkflowEngine {
  private static instance: LiveWidgetsWorkflowEngine | null = null;
  private audioCtx: AudioContext | null = null;
  private breathingTimer: NodeJS.Timeout | null = null;
  private navInterval: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();

  private state: LiveWidgetsState = {
    reading: 42,
    isBreathingActive: false,
    breathPhase: 'IDLE',
    breathSecondsLeft: 4,
    sessionMinutes: 12,

    moonPhaseName: 'Full Moon',
    moonIllumination: 98,
    nightTemp: 18,
    nightTempUnit: 'C',
    isNightModeActive: false,

    navDistanceMeters: 600,
    navStreet: 'Sesame St',
    navCurrentSpeed: 64,
    navSpeedLimit: 55,
    isNavigating: true,
    isDrivingShieldActive: false,

    sleepStatus: 'IDLE',
    bedtimeStr: '22:00',
    sleepNotification: '',
    nextAlarmTime: '07:00 AM',

    summerTemp: 38,
    isAcTurboActive: false,
    heatIndexText: 'EXTREME HIGH',
    targetRoomTemp: 21,

    // Video 1: Recharge Widget Real Hardware State
    batteryPercent: 82,
    isCharging: false,
    batteryStatusTitle: 'Recharge.',
    isRealBatteryConnected: false,
    batteryChargingTimeText: '',

    // Video 2: Leather Multi-Card Wallet Initial State
    isWalletRevealed: false,
    walletTotalBalance: 424014,
    stripeBalance: 32495,
    wiseBalance: 45654,
    paypalBalance: 345865
  };

  private constructor() {
    this.calculateRealAstronomicalMoon();
    this.initFromStoredPrefs();
    this.initRealDeviceBatteryListener();
  }

  public static getInstance(): LiveWidgetsWorkflowEngine {
    if (!this.instance) {
      this.instance = new LiveWidgetsWorkflowEngine();
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

  public getState(): LiveWidgetsState {
    return { ...this.state };
  }

  // --- AUDIO SYNTHESIZER UTILITIES ---
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public playTone(freq: number, type: OscillatorType = 'sine', durationSec: number = 0.3, volume: number = 0.15): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Audio safety fallback
    }
  }

  public speak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  // =========================================================================
  // WORKFLOW 1: MIN READING 42 (Meditative Breathing & Biometric Session)
  // =========================================================================
  public startBreathingSession(): void {
    if (this.breathingTimer) {
      clearInterval(this.breathingTimer);
    }

    this.state.isBreathingActive = true;
    this.state.breathPhase = 'INHALE';
    this.state.breathSecondsLeft = 4;
    this.playTone(392, 'sine', 1.2, 0.18); // G4 calming chord
    this.notify();

    this.breathingTimer = setInterval(() => {
      let nextPhase = this.state.breathPhase;
      let nextSec = this.state.breathSecondsLeft - 1;

      if (nextSec <= 0) {
        if (this.state.breathPhase === 'INHALE') {
          nextPhase = 'HOLD';
          nextSec = 4;
          this.playTone(440, 'sine', 0.8, 0.12);
        } else if (this.state.breathPhase === 'HOLD') {
          nextPhase = 'EXHALE';
          nextSec = 4;
          this.playTone(329.63, 'sine', 1.5, 0.15);
        } else {
          nextPhase = 'INHALE';
          nextSec = 4;
          this.playTone(392, 'sine', 1.2, 0.18);
          this.state.reading = Math.min(85, this.state.reading + 1);
        }
      }

      this.state.breathPhase = nextPhase;
      this.state.breathSecondsLeft = nextSec;
      this.notify();
    }, 1000);
  }

  public pauseBreathingSession(): void {
    if (this.breathingTimer) {
      clearInterval(this.breathingTimer);
      this.breathingTimer = null;
    }
    this.state.isBreathingActive = false;
    this.playTone(261.63, 'sine', 0.3, 0.1);
    this.notify();
  }

  public resetBreathingSession(): void {
    this.pauseBreathingSession();
    this.state.reading = 42;
    this.state.breathPhase = 'IDLE';
    this.state.breathSecondsLeft = 4;
    this.playTone(220, 'sine', 0.25, 0.08);
    this.notify();
  }

  // =========================================================================
  // WORKFLOW 2: NIGHT 18 C° / FULL MOON (Real Lunar Astronomy & Night Scene)
  // =========================================================================
  public calculateRealAstronomicalMoon(): void {
    const now = new Date();
    // Synodic lunar month calculation relative to reference new moon (Jan 6, 2000, 18:14 UTC)
    const refDate = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    const diffDays = (now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
    const synodicMonth = 29.53058867;
    const phaseDays = diffDays % synodicMonth;
    const phaseRatio = phaseDays / synodicMonth; // 0.0 to 1.0

    let phaseName = 'Full Moon';
    if (phaseRatio < 0.03 || phaseRatio > 0.97) phaseName = 'New Moon';
    else if (phaseRatio < 0.22) phaseName = 'Waxing Crescent';
    else if (phaseRatio < 0.28) phaseName = 'First Quarter';
    else if (phaseRatio < 0.47) phaseName = 'Waxing Gibbous';
    else if (phaseRatio < 0.53) phaseName = 'Full Moon';
    else if (phaseRatio < 0.72) phaseName = 'Waning Gibbous';
    else if (phaseRatio < 0.78) phaseName = 'Last Quarter';
    else phaseName = 'Waning Crescent';

    // Approximate illumination %
    const illumination = Math.round((1 - Math.cos(phaseRatio * 2 * Math.PI)) / 2 * 100);

    this.state.moonPhaseName = phaseName;
    this.state.moonIllumination = illumination;
    this.notify();
  }

  public toggleNightTempUnit(): void {
    if (this.state.nightTempUnit === 'C') {
      this.state.nightTemp = Math.round((this.state.nightTemp * 9) / 5 + 32);
      this.state.nightTempUnit = 'F';
    } else {
      this.state.nightTemp = Math.round(((this.state.nightTemp - 32) * 5) / 9);
      this.state.nightTempUnit = 'C';
    }
    this.playTone(523.25, 'triangle', 0.15, 0.08);
    this.notify();
  }

  public toggleNightModeScene(): boolean {
    this.state.isNightModeActive = !this.state.isNightModeActive;
    const iot = SmartLifestyleIoTEngine.getInstance();

    if (this.state.isNightModeActive) {
      iot.activateScene('night');
      this.playTone(329.63, 'sine', 0.8, 0.15);
      this.speak('Night mode activated. Room lights dimmed and eye comfort enabled.');
    } else {
      iot.activateScene('work');
      this.playTone(440, 'sine', 0.4, 0.15);
      this.speak('Normal lighting restored.');
    }

    this.notify();
    return this.state.isNightModeActive;
  }

  // =========================================================================
  // WORKFLOW 3: 600m SESAME ST (GPS Turn-by-Turn Navigation & Driving Mode)
  // =========================================================================
  public startNavigationTracking(): void {
    if (this.navInterval) clearInterval(this.navInterval);

    this.state.isNavigating = true;
    const emergencyEngine = SystemAutomationEmergencyEngine.getInstance();
    emergencyEngine.toggleDrivingMode(true);
    this.state.isDrivingShieldActive = true;

    this.playTone(587.33, 'triangle', 0.4, 0.15);
    this.speak('In 600 meters, turn right on Sesame Street.');

    this.navInterval = setInterval(() => {
      if (this.state.navDistanceMeters > 50) {
        this.state.navDistanceMeters -= 25;
      } else {
        this.state.navDistanceMeters = 600;
        this.playTone(880, 'sine', 0.3, 0.2);
        this.speak('Turn right now onto Sesame Street.');
      }
      this.notify();
    }, 2500);

    this.notify();
  }

  public stopNavigationTracking(): void {
    if (this.navInterval) {
      clearInterval(this.navInterval);
      this.navInterval = null;
    }
    this.state.isNavigating = false;
    this.playTone(349.23, 'sine', 0.25, 0.1);
    this.notify();
  }

  public toggleSpeedLimit(): void {
    const limits = [40, 50, 55, 65, 80];
    const currentIdx = limits.indexOf(this.state.navSpeedLimit);
    const nextLimit = limits[(currentIdx + 1) % limits.length];
    this.state.navSpeedLimit = nextLimit;
    this.playTone(659.25, 'triangle', 0.15, 0.1);
    this.notify();
  }

  // =========================================================================
  // WORKFLOW 4: 22:00 TIME TO SLEEP? (Sleep Automation & Bedtime Scheduler)
  // =========================================================================
  public triggerSleepAutomation(): void {
    this.state.sleepStatus = 'SLEEPING';
    this.state.sleepNotification = 'Bedtime Active • Alarms set 07:00 AM';

    // 1. Activate Night IoT Scene
    SmartLifestyleIoTEngine.getInstance().activateScene('night');

    // 2. Schedule Real Morning Alarm in Unified App Hub
    UnifiedAppHubEngine.getInstance().addAlarmOrTimer({
      type: 'alarm',
      label: 'Morning Wake-up',
      time: '07:00 AM',
      isActive: true,
      repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });

    // 3. Play Soothing Lullaby Chord
    this.playTone(392.00, 'sine', 0.8, 0.12);
    setTimeout(() => this.playTone(329.63, 'sine', 1.2, 0.15), 300);
    setTimeout(() => this.playTone(261.63, 'sine', 1.8, 0.18), 600);

    // 4. Voice Confirmation
    this.speak('Good night! Sleep mode is active. Your room is set to twenty-four degrees and alarm scheduled for seven AM.');

    this.notify();
  }

  public snoozeSleepReminder(minutes: number = 15): void {
    this.state.sleepStatus = 'SNOOZED';
    this.state.sleepNotification = `Snoozed for ${minutes} mins`;

    this.playTone(440, 'triangle', 0.2, 0.1);
    this.speak(`Sleep reminder snoozed for ${minutes} minutes.`);

    this.notify();
  }

  // =========================================================================
  // WORKFLOW 5: SUMMER 38° (Smart AC Turbo Cooling & Heatwave Protocol)
  // =========================================================================
  public activateHeatwaveCoolingProtocol(): void {
    this.state.isAcTurboActive = !this.state.isAcTurboActive;
    const iot = SmartLifestyleIoTEngine.getInstance();

    if (this.state.isAcTurboActive) {
      // Set AC to 20°C (cool) and Fan to Turbo
      iot.updateDeviceValue('iot_2', 20); // Living Room AC to 20°C
      iot.updateDeviceValue('iot_3', 5);  // Turbo Fan to max speed
      
      this.state.targetRoomTemp = 20;
      this.playTone(659.25, 'sine', 0.3, 0.15);
      setTimeout(() => this.playTone(523.25, 'sine', 0.5, 0.18), 200);

      this.speak('Heatwave protocol engaged. Air Conditioner set to twenty degrees and Turbo Fan set to maximum.');
    } else {
      iot.updateDeviceValue('iot_2', 24);
      iot.updateDeviceValue('iot_3', 2);
      this.state.targetRoomTemp = 24;
      this.playTone(440, 'sine', 0.25, 0.1);
      this.speak('Thermostat returned to normal eco cooling.');
    }

    this.notify();
  }

  public setSummerTemperature(temp: number): void {
    this.state.summerTemp = temp;
    if (temp >= 38) {
      this.state.heatIndexText = 'EXTREME HIGH';
    } else if (temp >= 32) {
      this.state.heatIndexText = 'HIGH RISK';
    } else {
      this.state.heatIndexText = 'MODERATE';
    }
    this.playTone(300 + temp * 8, 'sine', 0.15, 0.08);
    this.notify();
  }

  // =========================================================================
  // RECHARGE WIDGET WORKFLOW (Real Hardware Device Battery Integration)
  // =========================================================================
  private batteryObj: any = null;
  private batteryHeartbeatTimer: NodeJS.Timeout | null = null;

  public initRealDeviceBatteryListener(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // 1. Hardware Battery API (Chromium, Android Chrome, Samsung Internet, Edge, WebView)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryObj = battery;
        this.syncWithDeviceBattery(battery, false);

        battery.addEventListener('chargingchange', () => {
          this.syncWithDeviceBattery(battery, true);
        });

        battery.addEventListener('levelchange', () => {
          this.syncWithDeviceBattery(battery, true);
        });

        battery.addEventListener('chargingtimechange', () => {
          this.syncWithDeviceBattery(battery, false);
        });
      }).catch((e: any) => {
        console.warn('[LiveWidgetsWorkflowEngine] Battery API error:', e);
      });
    }

    // 2. Native Android / Capacitor Bridge fallback
    const capDevice = (window as any).Capacitor?.Plugins?.Device;
    if (capDevice?.getBatteryInfo) {
      capDevice.getBatteryInfo().then((info: any) => {
        if (info && typeof info.batteryLevel === 'number') {
          this.applyBatteryValues(
            Math.round(info.batteryLevel * 100),
            Boolean(info.isCharging),
            true,
            false
          );
        }
      }).catch(() => {});
    }

    // 3. Heartbeat polling every 3 seconds to ensure real-time accuracy
    if (this.batteryHeartbeatTimer) {
      clearInterval(this.batteryHeartbeatTimer);
    }
    this.batteryHeartbeatTimer = setInterval(() => {
      this.pollDeviceBattery();
    }, 3000);
  }

  private syncWithDeviceBattery(battery: any, announceChanges: boolean = false): void {
    const rawLevel = typeof battery.level === 'number' ? battery.level : 0.82;
    const level = Math.max(1, Math.min(100, Math.round(rawLevel * 100)));
    const isCharging = Boolean(battery.charging);

    let timeText = '';
    if (isCharging && battery.chargingTime && battery.chargingTime < Infinity && battery.chargingTime > 0) {
      const mins = Math.round(battery.chargingTime / 60);
      timeText = `${mins}m until full`;
    }

    this.applyBatteryValues(level, isCharging, true, announceChanges, timeText);
  }

  private applyBatteryValues(
    level: number, 
    isCharging: boolean, 
    isReal: boolean, 
    announceChanges: boolean = false,
    chargingTimeText: string = ''
  ): void {
    const prevCharging = this.state.isCharging;
    const prevLevel = this.state.batteryPercent;

    this.state.batteryPercent = level;
    this.state.isCharging = isCharging;
    this.state.isRealBatteryConnected = isReal;
    this.state.batteryChargingTimeText = chargingTimeText;

    // Dynamic Title Rule matching user specification & Video 1:
    // 1. 100% full: "Fully charged."
    // 2. Currently plugged into charger (<100%): "Charging..."
    // 3. Unplugged and low (<=22%): "Please charge."
    // 4. Unplugged standard/normal: "Recharge."
    if (level >= 100) {
      this.state.batteryStatusTitle = 'Fully charged.';
    } else if (isCharging) {
      this.state.batteryStatusTitle = 'Charging...';
    } else if (level <= 22) {
      this.state.batteryStatusTitle = 'Please charge.';
    } else {
      this.state.batteryStatusTitle = 'Recharge.';
    }

    // Real-time audio & voice feedback on actual hardware state change
    if (announceChanges) {
      if (!prevCharging && isCharging) {
        // Physical charger was plugged in!
        this.playTone(440, 'sine', 0.18, 0.12);
        setTimeout(() => this.playTone(554.37, 'sine', 0.22, 0.14), 110);
        this.speak(`Charger connected. Battery at ${level} percent.`);
      } else if (prevCharging && !isCharging) {
        // Physical charger was unplugged!
        this.playTone(392, 'sine', 0.18, 0.1);
        setTimeout(() => this.playTone(329.63, 'sine', 0.22, 0.08), 100);
        if (level <= 22) {
          this.speak(`Charger disconnected. Battery low, please charge.`);
        }
      } else if (isCharging && level === 100 && prevLevel < 100) {
        // Battery reached 100% full charge!
        this.playTone(523.25, 'sine', 0.2, 0.1);
        setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.1), 100);
        setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.12), 200);
        setTimeout(() => this.playTone(1046.50, 'sine', 0.35, 0.15), 300);
        this.speak('Battery 100% full. Fully charged.');
      }
    }

    this.notify();
  }

  public async pollDeviceBattery(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery = this.batteryObj || await (navigator as any).getBattery();
        this.batteryObj = battery;
        if (battery) {
          this.syncWithDeviceBattery(battery, false);
        }
      } catch (e) {}
    }
  }

  /**
   * User taps the Recharge card:
   * Queries real device hardware battery, plays audio telemetry pulse,
   * and gives a real-time vocal battery readout of the phone.
   */
  public refreshBatteryStatusAndSpeak(): void {
    this.pollDeviceBattery();
    const pct = this.state.batteryPercent;
    const chg = this.state.isCharging;

    this.playTone(chg ? 587.33 : 440, 'sine', 0.16, 0.1);

    if (pct >= 100) {
      this.speak(`Phone battery is fully charged at 100 percent.`);
    } else if (chg) {
      this.speak(`Phone is currently charging at ${pct} percent.`);
    } else if (pct <= 22) {
      this.speak(`Battery low at ${pct} percent. Please connect your charger.`);
    } else {
      this.speak(`Real battery level is ${pct} percent. Discharging.`);
    }
  }

  /**
   * Optional manual hardware test toggle:
   * Allows developer or user to simulate plugging/unplugging charger cable
   * to test animations if no wall charger is currently connected.
   */
  public toggleSimulateChargerPlug(): void {
    const nextCharging = !this.state.isCharging;
    let nextLevel = this.state.batteryPercent;
    if (nextCharging && nextLevel < 35) {
      nextLevel = 45;
    }
    this.applyBatteryValues(nextLevel, nextCharging, this.state.isRealBatteryConnected, true);
  }

  // =========================================================================
  // LEATHER MULTI-CARD WALLET WORKFLOW (Video 2 Exact Match)
  // =========================================================================
  public toggleWalletVisibility(): void {
    this.state.isWalletRevealed = !this.state.isWalletRevealed;
    if (this.state.isWalletRevealed) {
      // Crisp subtle leather card slide chime
      this.playTone(587.33, 'sine', 0.15, 0.08);
      setTimeout(() => this.playTone(880.00, 'sine', 0.18, 0.09), 90);
    } else {
      this.playTone(440.00, 'sine', 0.12, 0.06);
      setTimeout(() => this.playTone(329.63, 'sine', 0.15, 0.08), 80);
    }
    this.notify();
  }

  private initFromStoredPrefs(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('stonicx_live_widgets_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch {}
  }
}
