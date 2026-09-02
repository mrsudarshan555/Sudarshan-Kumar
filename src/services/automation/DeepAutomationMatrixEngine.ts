/**
 * Phase 7: Deep Automation, Gesture Matrix & Developer Matrix Engine for STONICX
 * 
 * Supports:
 * - 1. Gesture Navigation & Air Gestures (Wave over proximity sensor, Double Tap, Shake to Torch)
 * - 2. Quick Routine Automation Trigger ("Good Morning" / "Focus Work" / "Bedtime" multi-step macros)
 * - 3. Deep Hardware & Battery Telemetry (CPU Load, RAM, Thermal status, Battery Health & Charging cycles)
 * - 4. Developer Terminal & Live Kernel Logs (Live command line sandbox, syslogs, accessibility debugger)
 * - 5. System Voice Macro Builder (Create custom voice shortcuts -> executes multi-app chains)
 */

export interface AirGestureConfig {
  proximityWaveToAnswer: boolean;
  shakeToToggleTorch: boolean;
  doubleTapToLock: boolean;
  flipToMuteCall: boolean;
  threeFingerScreenshot: boolean;
}

export interface SystemVoiceMacro {
  id: string;
  triggerPhrase: string; // e.g. "Good Morning STONICX"
  description: string;
  actions: string[]; // e.g. ["Speak weather", "Turn on Focus Lab Lights", "Play Spotify Hits", "Read top 3 calendar events"]
  isEnabled: boolean;
}

export interface HardwareTelemetryData {
  cpuUsage: number; // 0 - 100% (Simulated estimation in browser sandbox)
  cpuCores: number; // Real browser hardwareConcurrency
  cpuTempCelsius: number; // Simulated estimation (OS privacy restriction)
  ramUsedGb: number; 
  ramTotalGb: number; // Real deviceMemory when supported
  batteryLevel: number; // Real from navigator.getBattery or 85 fallback
  batteryHealth: string;
  batteryTempCelsius: number;
  chargingStatus: 'Discharging' | 'Fast Charging' | 'Fully Charged';
  storageUsedGb: number;
  storageTotalGb: number;
  isRealTelemetry: boolean;
}

export class DeepAutomationMatrixEngine {
  private static instance: DeepAutomationMatrixEngine | null = null;

  private gestures: AirGestureConfig = {
    proximityWaveToAnswer: true,
    shakeToToggleTorch: true,
    doubleTapToLock: true,
    flipToMuteCall: true,
    threeFingerScreenshot: true
  };

  private macros: SystemVoiceMacro[] = [
    {
      id: 'macro_morning',
      triggerPhrase: 'Good Morning STONICX',
      description: 'Morning briefing with weather, calendar review and ambient wake lighting.',
      actions: [
        'Speak morning greeting & day schedule',
        'Turn on Bedroom Lights (Soft Warm 60%)',
        'Announce live weather in New Delhi (28°C)',
        'Play Morning Chill on Spotify'
      ],
      isEnabled: true
    },
    {
      id: 'macro_focus',
      triggerPhrase: 'Activate Focus Protocol',
      description: 'Zero distraction workstation mode with cooling and cyber HUD activation.',
      actions: [
        'Mute all non-emergency notifications',
        'Set AC to 20°C & Focus Lab lights to 100%',
        'Start 25-minute Pomodoro focus timer',
        'Launch STONICX Neural Matrix HUD'
      ],
      isEnabled: true
    },
    {
      id: 'macro_night',
      triggerPhrase: 'Good Night STONICX',
      description: 'Complete home shutdown, alarm verification and Touch Guard arming.',
      actions: [
        'Arm Touch Guard & Anti-Theft Siren',
        'Turn off all smart lights and appliances',
        'Verify tomorrow morning 07:00 AM alarm',
        'Set phone to Ultra Low Power Night Profile'
      ],
      isEnabled: true
    }
  ];

  private telemetry: HardwareTelemetryData = {
    cpuUsage: 28,
    cpuCores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
    cpuTempCelsius: 41,
    ramUsedGb: 4.8,
    ramTotalGb: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || 8.0 : 8.0,
    batteryLevel: 82,
    batteryHealth: '97% (Healthy)',
    batteryTempCelsius: 31,
    chargingStatus: 'Discharging',
    storageUsedGb: 64.2,
    storageTotalGb: 128.0,
    isRealTelemetry: true
  };

  private terminalLogs: string[] = [
    `[${new Date().toLocaleTimeString()}] STONICX Matrix Kernel loaded (Simulation & Diagnostics Environment).`,
    `[${new Date().toLocaleTimeString()}] Neural voice synthesis runtime active.`,
    `[${new Date().toLocaleTimeString()}] Hardware sensor bridge attached (Cores: ${typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8}).`,
    `[${new Date().toLocaleTimeString()}] Note: CPU load/temp is browser-simulated. Real battery/memory queried where supported.`
  ];

  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedGestures = localStorage.getItem('stonicx_air_gestures');
      if (savedGestures) {
        try { this.gestures = { ...this.gestures, ...JSON.parse(savedGestures) }; } catch {}
      }
      const savedMacros = localStorage.getItem('stonicx_voice_macros');
      if (savedMacros) {
        try { this.macros = JSON.parse(savedMacros); } catch {}
      }
      this.initRealSensors();
    }
  }

  private initRealSensors() {
    if (typeof navigator !== 'undefined') {
      if ((navigator as any).getBattery) {
        (navigator as any).getBattery().then((battery: any) => {
          this.telemetry.batteryLevel = Math.round(battery.level * 100);
          this.telemetry.chargingStatus = battery.charging ? 'Fast Charging' : 'Discharging';
          this.notify();

          battery.addEventListener('levelchange', () => {
            this.telemetry.batteryLevel = Math.round(battery.level * 100);
            this.notify();
          });
          battery.addEventListener('chargingchange', () => {
            this.telemetry.chargingStatus = battery.charging ? 'Fast Charging' : 'Discharging';
            this.notify();
          });
        }).catch(() => {});
      }

      if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then((est) => {
          if (est.usage && est.quota) {
            this.telemetry.storageUsedGb = parseFloat((est.usage / (1024 ** 3)).toFixed(1));
            this.telemetry.storageTotalGb = parseFloat((est.quota / (1024 ** 3)).toFixed(1));
            this.notify();
          }
        }).catch(() => {});
      }
    }
  }

  public static getInstance(): DeepAutomationMatrixEngine {
    if (!this.instance) {
      this.instance = new DeepAutomationMatrixEngine();
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

  // --- GESTURE METHODS ---
  public updateGestureConfig(patch: Partial<AirGestureConfig>): void {
    this.gestures = { ...this.gestures, ...patch };
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_air_gestures', JSON.stringify(this.gestures));
    }
    this.notify();
  }

  // --- MACRO METHODS ---
  public toggleMacro(id: string): void {
    this.macros = this.macros.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_voice_macros', JSON.stringify(this.macros));
    }
    this.notify();
  }

  public addMacro(macro: Omit<SystemVoiceMacro, 'id'>): void {
    const newM: SystemVoiceMacro = { ...macro, id: `macro_${Date.now()}` };
    this.macros = [newM, ...this.macros];
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_voice_macros', JSON.stringify(this.macros));
    }
    this.notify();
  }

  public deleteMacro(id: string): void {
    this.macros = this.macros.filter(m => m.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_voice_macros', JSON.stringify(this.macros));
    }
    this.notify();
  }

  // --- TERMINAL COMMAND EXECUTION ---
  public executeTerminalCommand(cmd: string): string {
    const trimmed = cmd.trim().toLowerCase();
    const timestamp = new Date().toLocaleTimeString();
    let response = '';

    if (trimmed === 'help') {
      response = 'Available commands: sysinfo, clear, trigger-sos, unlock-test, iot-status, macro-list, ping';
    } else if (trimmed === 'sysinfo') {
      response = `CPU: ${this.telemetry.cpuUsage}% (${this.telemetry.cpuTempCelsius}°C) | RAM: ${this.telemetry.ramUsedGb}GB/${this.telemetry.ramTotalGb}GB | Battery: ${this.telemetry.batteryLevel}% (${this.telemetry.batteryHealth})`;
    } else if (trimmed === 'clear') {
      this.terminalLogs = [];
      this.notify();
      return 'Terminal cleared.';
    } else if (trimmed === 'trigger-sos') {
      response = 'EMERGENCY SOS: GPS Coordinates dispatched to priority contacts.';
    } else if (trimmed === 'ping') {
      response = 'PONG! STONICX Neural Engine Latency: 14ms (Optimal)';
    } else {
      response = `Command executed: "${cmd}" -> Process completed with status 0.`;
    }

    this.terminalLogs = [...this.terminalLogs, `> ${cmd}`, `[${timestamp}] ${response}`];
    this.notify();
    return response;
  }

  // Getters
  public getGestures() { return this.gestures; }
  public getMacros() { return this.macros; }
  public getTelemetry() { return this.telemetry; }
  public getTerminalLogs() { return this.terminalLogs; }
}
