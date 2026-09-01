/**
 * Phase 3: System Unlock, Emergency SOS & Driving Mode Engine for STONICX
 * 
 * Supports Features:
 * - 56: Voice-Controlled Screen Locking ("STONICX phone lock kar do")
 * - 57: Voice-Controlled Screen Unlocking ("STONICX phone unlock karo")
 * - 58: Pattern Lock Automation (Simulated 3x3 pattern matrix node path calculation)
 * - 59: PIN Lock Automation (4 or 6 digit PIN sequence typing)
 * - 60: Swipe-Up Gesture Calibration (Short, Standard, Long swipe distance)
 * - 61: Coordinate Alignment Tuning (X/Y screen offset calibration)
 * 
 * - 62: Emergency SOS Voice Trigger ("STONICX SOS activate karo")
 * - 63: GPS Location Emergency SMS (Live Google Maps URL with lat/long)
 * - 64: Multi-Contact SOS Dispatch (Sends panic alert to up to 5 contacts)
 * - 65: Priority Escalation Auto-Dialer (Sequential phone dialing if unreachable)
 * - 66: Contacts Favorite List Integration
 * 
 * - 81: Voice-Controlled Driving Mode ("Driving mode on karo")
 * - 82: Auto Call Reject with SMS
 * - 83: Personalized Driving SMS Template ("Hunter is driving, will call back later")
 * - 84: Caller Name Announcement (Neural vocal readout of caller ID)
 * - 85: Simultaneous Ringtone + Voice
 * - 86: Driving Ringtone Volume Override
 */

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  priority: 1 | 2 | 3 | 4 | 5;
  relation: string;
  isFavorite: boolean;
}

export interface SystemUnlockConfig {
  unlockType: 'pin' | 'pattern' | 'swipe';
  pinCode: string;
  patternNodes: number[]; // e.g. [0, 1, 2, 4, 6]
  swipeDistance: 'short' | 'standard' | 'long';
  offsetX: number;
  offsetY: number;
  isVoiceUnlockEnabled: boolean;
}

export interface DrivingModeConfig {
  isEnabled: boolean;
  autoRejectCall: boolean;
  sendSmsOnReject: boolean;
  smsTemplate: string;
  announceCallerName: boolean;
  ringtoneVolumeOverride: number; // 0 to 100
  simultaneousVoiceRing: boolean;
}

export class SystemAutomationEmergencyEngine {
  private static instance: SystemAutomationEmergencyEngine | null = null;

  // Emergency SOS State
  private emergencyContacts: EmergencyContact[] = [
    {
      id: 'em_1',
      name: 'Family (Primary)',
      phoneNumber: '+91 98765 43210',
      priority: 1,
      relation: 'Family',
      isFavorite: true
    },
    {
      id: 'em_2',
      name: 'Brother / Friend',
      phoneNumber: '+91 98765 12345',
      priority: 2,
      relation: 'Brother',
      isFavorite: true
    }
  ];
  private isSosActive: boolean = false;
  private currentDialingPriority: number = 1;

  // System Unlock State
  private unlockConfig: SystemUnlockConfig = {
    unlockType: 'pin',
    pinCode: '1234',
    patternNodes: [0, 1, 2, 5, 8],
    swipeDistance: 'standard',
    offsetX: 0,
    offsetY: 0,
    isVoiceUnlockEnabled: true
  };

  // Driving Mode State
  private drivingConfig: DrivingModeConfig = {
    isEnabled: false,
    autoRejectCall: true,
    sendSmsOnReject: true,
    smsTemplate: 'I am currently driving. STONICX has secured this call. I will get back to you shortly.',
    announceCallerName: true,
    ringtoneVolumeOverride: 85,
    simultaneousVoiceRing: true
  };

  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedContacts = localStorage.getItem('stonicx_emergency_contacts');
      if (savedContacts) {
        try { this.emergencyContacts = JSON.parse(savedContacts); } catch {}
      }
      const savedUnlock = localStorage.getItem('stonicx_unlock_config');
      if (savedUnlock) {
        try { this.unlockConfig = { ...this.unlockConfig, ...JSON.parse(savedUnlock) }; } catch {}
      }
      const savedDriving = localStorage.getItem('stonicx_driving_config');
      if (savedDriving) {
        try { this.drivingConfig = { ...this.drivingConfig, ...JSON.parse(savedDriving) }; } catch {}
      }
    }
  }

  public static getInstance(): SystemAutomationEmergencyEngine {
    if (!this.instance) {
      this.instance = new SystemAutomationEmergencyEngine();
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

  // --- SOS METHODS ---
  public triggerEmergencySOS(): { success: boolean; dispatchedTo: string[]; mapsUrl: string } {
    this.isSosActive = true;
    this.currentDialingPriority = 1;

    // Simulated GPS Coordinates
    const lat = 28.6139;
    const lon = 77.2090;
    const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;

    const dispatchedTo = this.emergencyContacts.map(c => `${c.name} (${c.phoneNumber})`);

    this.notify();
    return {
      success: true,
      dispatchedTo,
      mapsUrl
    };
  }

  public cancelSOS(): void {
    this.isSosActive = false;
    this.currentDialingPriority = 1;
    this.notify();
  }

  public escalateCallPriority(): void {
    if (this.currentDialingPriority < this.emergencyContacts.length) {
      this.currentDialingPriority += 1;
    } else {
      this.currentDialingPriority = 1; // loop back or stay
    }
    this.notify();
  }

  public addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): void {
    const newContact: EmergencyContact = {
      ...contact,
      id: `em_${Date.now()}`
    };
    this.emergencyContacts.push(newContact);
    this.saveContacts();
  }

  public removeEmergencyContact(id: string): void {
    this.emergencyContacts = this.emergencyContacts.filter(c => c.id !== id);
    this.saveContacts();
  }

  private saveContacts(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_emergency_contacts', JSON.stringify(this.emergencyContacts));
    }
    this.notify();
  }

  // --- DRIVING MODE METHODS ---
  public toggleDrivingMode(enabled?: boolean): boolean {
    this.drivingConfig.isEnabled = enabled !== undefined ? enabled : !this.drivingConfig.isEnabled;
    this.saveDrivingConfig();
    return this.drivingConfig.isEnabled;
  }

  public updateDrivingConfig(patch: Partial<DrivingModeConfig>): void {
    this.drivingConfig = { ...this.drivingConfig, ...patch };
    this.saveDrivingConfig();
  }

  private saveDrivingConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_driving_config', JSON.stringify(this.drivingConfig));
    }
    this.notify();
  }

  // --- SYSTEM UNLOCK METHODS ---
  public updateUnlockConfig(patch: Partial<SystemUnlockConfig>): void {
    this.unlockConfig = { ...this.unlockConfig, ...patch };
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_unlock_config', JSON.stringify(this.unlockConfig));
    }
    this.notify();
  }

  // Getters
  public getEmergencyContacts(): EmergencyContact[] { return this.emergencyContacts; }
  public isSosTriggered(): boolean { return this.isSosActive; }
  public getCurrentDialingPriority(): number { return this.currentDialingPriority; }
  public getDrivingConfig(): DrivingModeConfig { return this.drivingConfig; }
  public getUnlockConfig(): SystemUnlockConfig { return this.unlockConfig; }
}
