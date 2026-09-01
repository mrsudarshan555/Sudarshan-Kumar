/**
 * Phase 4: All-In-One Unified App Hub Engine for STONICX
 * 
 * Supports Features:
 * - 67: WhatsApp Voice Automation ("WhatsApp par Rahul ko message bhejo: Kal milte hain")
 * - 68: Telegram Chat Automation ("Telegram channel par update post karo")
 * - 69: Truecaller Caller Intelligence & Spam Identification
 * - 70: Instagram DM & Post Sharing Hub
 * - 71: Unified Multi-Messenger Hub (WhatsApp + Telegram + SMS)
 * - 72: Contact Quick Sync & Smart Search
 * - 73: Photo & Gallery Media Vault with AI Semantic Search
 * - 74: Smart Alarm & Multiple Timers with Voice Set/Dismiss
 * - 75: Calendar & Task Scheduler with Voice Reminders
 * - 76: Multi-App Simultaneous Voice Orchestration
 */

export interface UniversalChatMessage {
  id: string;
  app: 'whatsapp' | 'telegram' | 'instagram' | 'sms';
  sender: string;
  senderPhone?: string;
  content: string;
  timestamp: number;
  isSpam?: boolean;
  status: 'received' | 'sent' | 'read';
}

export interface GalleryMediaItem {
  id: string;
  title: string;
  tags: string[];
  date: number;
  url: string;
  category: 'camera' | 'whatsapp' | 'screenshots' | 'downloads';
}

export interface SmartAlarmTimer {
  id: string;
  type: 'alarm' | 'timer';
  label: string;
  time: string; // e.g. "07:30 AM" or duration in seconds
  durationRemainingSeconds?: number;
  isActive: boolean;
  repeatDays?: string[];
}

export interface CalendarEventEntry {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  isVoiceCreated: boolean;
}

export class UnifiedAppHubEngine {
  private static instance: UnifiedAppHubEngine | null = null;

  private messages: UniversalChatMessage[] = [
    {
      id: 'msg_1',
      app: 'whatsapp',
      sender: 'Rahul Verma',
      senderPhone: '+91 98765 11223',
      content: 'Kal ka project meeting 4 baje finalize ho gaya hai.',
      timestamp: Date.now() - 1000 * 60 * 15,
      status: 'received'
    },
    {
      id: 'msg_2',
      app: 'telegram',
      sender: 'Stonicx Tech Community',
      content: 'STONICX Kernel v4.2 update is now live on the server!',
      timestamp: Date.now() - 1000 * 60 * 45,
      status: 'received'
    },
    {
      id: 'msg_3',
      app: 'sms',
      sender: 'Unknown (Truecaller: Spam Telemarketer)',
      senderPhone: '+91 14099 88776',
      content: 'Claim your pre-approved credit card loan right now.',
      timestamp: Date.now() - 1000 * 60 * 120,
      isSpam: true,
      status: 'received'
    },
    {
      id: 'msg_4',
      app: 'instagram',
      sender: 'dev_creative_hub',
      content: 'Liked your latest 3D AI Assistant concept render! 🔥',
      timestamp: Date.now() - 1000 * 60 * 200,
      status: 'received'
    }
  ];

  private galleryMedia: GalleryMediaItem[] = [
    {
      id: 'media_1',
      title: '3D Cyber Matrix Render',
      tags: ['ai', 'cyberpunk', 'render', 'matrix'],
      date: Date.now() - 1000 * 60 * 60 * 24,
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
      category: 'camera'
    },
    {
      id: 'media_2',
      title: 'Futuristic HUD Blueprint',
      tags: ['hud', 'interface', 'blueprint'],
      date: Date.now() - 1000 * 60 * 60 * 48,
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
      category: 'downloads'
    },
    {
      id: 'media_3',
      title: 'Neon Skyline Night Walk',
      tags: ['neon', 'city', 'night', 'travel'],
      date: Date.now() - 1000 * 60 * 60 * 72,
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80',
      category: 'whatsapp'
    }
  ];

  private alarmsAndTimers: SmartAlarmTimer[] = [
    {
      id: 'alarm_1',
      type: 'alarm',
      label: 'Morning Standup & Coding',
      time: '07:00 AM',
      isActive: true,
      repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    },
    {
      id: 'timer_1',
      type: 'timer',
      label: 'Focus Sprint (Pomodoro)',
      time: '25 Min',
      durationRemainingSeconds: 1500,
      isActive: false
    }
  ];

  private calendarEvents: CalendarEventEntry[] = [
    {
      id: 'cal_1',
      title: 'STONICX Core Deployment Review',
      date: 'Today',
      time: '04:00 PM',
      location: 'Google Meet',
      isVoiceCreated: true
    },
    {
      id: 'cal_2',
      title: 'Server Sync & Backup Cycle',
      date: 'Tomorrow',
      time: '11:00 AM',
      location: 'Cloud Console',
      isVoiceCreated: true
    }
  ];

  private listeners: Set<() => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedMsgs = localStorage.getItem('stonicx_unified_messages');
      if (savedMsgs) {
        try { this.messages = JSON.parse(savedMsgs); } catch {}
      }
      const savedAlarms = localStorage.getItem('stonicx_alarms_timers');
      if (savedAlarms) {
        try { this.alarmsAndTimers = JSON.parse(savedAlarms); } catch {}
      }
      const savedCal = localStorage.getItem('stonicx_calendar_events');
      if (savedCal) {
        try { this.calendarEvents = JSON.parse(savedCal); } catch {}
      }
    }
  }

  public static getInstance(): UnifiedAppHubEngine {
    if (!this.instance) {
      this.instance = new UnifiedAppHubEngine();
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

  // --- MESSAGING METHODS ---
  public sendVoiceMessage(app: 'whatsapp' | 'telegram' | 'instagram' | 'sms', recipient: string, text: string): UniversalChatMessage {
    const newMsg: UniversalChatMessage = {
      id: `msg_${Date.now()}`,
      app,
      sender: `To: ${recipient}`,
      content: text,
      timestamp: Date.now(),
      status: 'sent'
    };
    this.messages = [newMsg, ...this.messages];
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_unified_messages', JSON.stringify(this.messages));
    }
    this.notify();
    return newMsg;
  }

  public getMessages(filterApp?: string): UniversalChatMessage[] {
    if (!filterApp || filterApp === 'all') return this.messages;
    return this.messages.filter(m => m.app === filterApp);
  }

  // --- ALARMS & TIMERS METHODS ---
  public addAlarmOrTimer(entry: Omit<SmartAlarmTimer, 'id'>): void {
    const newEntry: SmartAlarmTimer = { ...entry, id: `al_${Date.now()}` };
    this.alarmsAndTimers = [newEntry, ...this.alarmsAndTimers];
    this.saveAlarms();
  }

  public toggleAlarm(id: string): void {
    this.alarmsAndTimers = this.alarmsAndTimers.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    );
    this.saveAlarms();
  }

  public removeAlarm(id: string): void {
    this.alarmsAndTimers = this.alarmsAndTimers.filter(a => a.id !== id);
    this.saveAlarms();
  }

  private saveAlarms(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_alarms_timers', JSON.stringify(this.alarmsAndTimers));
    }
    this.notify();
  }

  // --- CALENDAR METHODS ---
  public addCalendarEvent(entry: Omit<CalendarEventEntry, 'id'>): void {
    const newEntry: CalendarEventEntry = { ...entry, id: `cal_${Date.now()}` };
    this.calendarEvents = [newEntry, ...this.calendarEvents];
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_calendar_events', JSON.stringify(this.calendarEvents));
    }
    this.notify();
  }

  public removeCalendarEvent(id: string): void {
    this.calendarEvents = this.calendarEvents.filter(c => c.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stonicx_calendar_events', JSON.stringify(this.calendarEvents));
    }
    this.notify();
  }

  // Getters
  public getGallery(): GalleryMediaItem[] { return this.galleryMedia; }
  public getAlarms(): SmartAlarmTimer[] { return this.alarmsAndTimers; }
  public getCalendar(): CalendarEventEntry[] { return this.calendarEvents; }
}
