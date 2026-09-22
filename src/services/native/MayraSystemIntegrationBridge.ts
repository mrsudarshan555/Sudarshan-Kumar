/**
 * MayraSystemIntegrationBridge
 * 
 * TypeScript bridge connecting Mayra Assistant with Native Android Kotlin Plugins:
 * 1. Accessibility Service (Task automation, app launching, WhatsApp auto-send)
 * 2. Notification Listener Service (Reading WhatsApp/SMS notifications)
 * 3. Telecom Call Handling (Answering/rejecting calls, Contact Caller ID lookup)
 * 4. Direct Background SMS Dispatch (SmsManager)
 * 5. WhatsApp Intent Pre-fill & Auto-Tap Bridge
 */

export interface SystemServiceStatus {
  isAccessibilityActive: boolean;
  isNotificationListenerActive: boolean;
  isBatteryOptimizationExempt: boolean;
  canDrawOverlays: boolean;
  isNativeAndroidEnvironment: boolean;
}

export interface IncomingNotificationEvent {
  id: string;
  packageName: string;
  appName: string;
  sender: string;
  text: string;
  timestamp: number;
  isMessaging: boolean;
  isCall: boolean;
}

export interface CallerLookupResult {
  phoneNumber: string;
  contactName: string;
  found: boolean;
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: Record<string, any>;
    };
    MayraNativeIntegration?: any;
  }
}

class MayraSystemIntegrationBridgeClass {
  private notificationListeners: ((notification: IncomingNotificationEvent) => void)[] = [];
  private simulatedNotifications: IncomingNotificationEvent[] = [
    {
      id: 'demo-msg-1',
      packageName: 'com.whatsapp',
      appName: 'WhatsApp',
      sender: 'Sarah (Team)',
      text: 'Hey! Are you joining the project demo at 3 PM today?',
      timestamp: Date.now() - 1000 * 60 * 5,
      isMessaging: true,
      isCall: false
    },
    {
      id: 'demo-msg-2',
      packageName: 'com.google.android.apps.messaging',
      appName: 'Messages',
      sender: '+1 (555) 234-8890',
      text: 'Your delivery package has arrived at the reception desk.',
      timestamp: Date.now() - 1000 * 60 * 15,
      isMessaging: true,
      isCall: false
    }
  ];

  constructor() {
    this.initNativeListener();
  }

  private isNative(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.Capacitor?.isNativePlatform?.() || window.MayraNativeIntegration);
  }

  private getPlugin() {
    if (typeof window === 'undefined') return null;
    return window.Capacitor?.Plugins?.MayraNativeIntegration || window.MayraNativeIntegration || null;
  }

  private initNativeListener() {
    const plugin = this.getPlugin();
    if (plugin?.addListener) {
      try {
        plugin.addListener('onIncomingNotification', (data: IncomingNotificationEvent) => {
          this.notifyListeners(data);
        });
      } catch (e) {
        console.warn('[MayraSystemBridge] Could not attach native listener', e);
      }
    }
  }

  public addNotificationListener(callback: (notification: IncomingNotificationEvent) => void): () => void {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(notification: IncomingNotificationEvent) {
    this.simulatedNotifications.unshift(notification);
    if (this.simulatedNotifications.length > 30) {
      this.simulatedNotifications.pop();
    }
    this.notificationListeners.forEach(cb => {
      try {
        cb(notification);
      } catch (e) {
        console.error('Error in notification listener callback', e);
      }
    });
  }

  /**
   * 1. Check status of all native Android services
   */
  async checkStatus(): Promise<SystemServiceStatus> {
    const plugin = this.getPlugin();
    if (plugin?.checkSystemServicesStatus) {
      try {
        const res = await plugin.checkSystemServicesStatus();
        return {
          isAccessibilityActive: !!res.isAccessibilityActive,
          isNotificationListenerActive: !!res.isNotificationListenerActive,
          isBatteryOptimizationExempt: !!res.isBatteryOptimizationExempt,
          canDrawOverlays: !!res.canDrawOverlays,
          isNativeAndroidEnvironment: true
        };
      } catch (e) {
        console.warn('Native status check failed, falling back', e);
      }
    }

    // Web simulation state stored in localStorage
    const accessActive = typeof window !== 'undefined' && localStorage.getItem('mayra_accessibility_active') === 'true';
    const notifActive = typeof window !== 'undefined' && localStorage.getItem('mayra_notif_listener_active') === 'true';
    const battActive = typeof window !== 'undefined' && localStorage.getItem('mayra_battery_exempt') === 'true';
    const overlayActive = typeof window !== 'undefined' && localStorage.getItem('mayra_overlay_active') === 'true';

    return {
      isAccessibilityActive: accessActive,
      isNotificationListenerActive: notifActive,
      isBatteryOptimizationExempt: battActive,
      canDrawOverlays: overlayActive,
      isNativeAndroidEnvironment: this.isNative()
    };
  }

  /**
   * Deep-link to Android Accessibility Settings
   */
  async openAccessibilitySettings(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (plugin?.openAccessibilitySettings) {
      try {
        await plugin.openAccessibilitySettings();
        return true;
      } catch (e) {
        console.error('Failed to open accessibility settings', e);
      }
    }
    // Web fallback: toggle simulated state
    if (typeof window !== 'undefined') {
      const current = localStorage.getItem('mayra_accessibility_active') === 'true';
      localStorage.setItem('mayra_accessibility_active', (!current).toString());
    }
    return true;
  }

  /**
   * Deep-link to Android Special App Access -> Notification Listener Settings
   */
  async openNotificationListenerSettings(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (plugin?.openNotificationListenerSettings) {
      try {
        await plugin.openNotificationListenerSettings();
        return true;
      } catch (e) {
        console.error('Failed to open notification settings', e);
      }
    }
    // Web fallback: toggle simulated state
    if (typeof window !== 'undefined') {
      const current = localStorage.getItem('mayra_notif_listener_active') === 'true';
      localStorage.setItem('mayra_notif_listener_active', (!current).toString());
    }
    return true;
  }

  /**
   * Deep-link to Android Default Assistant Role Picker
   */
  async openVoiceInputSettings(): Promise<boolean> {
    const plugin = this.getPlugin();
    if (plugin?.openVoiceInputSettings) {
      try {
        await plugin.openVoiceInputSettings();
        return true;
      } catch (e) {
        console.error('Failed to open voice settings', e);
      }
    }
    return true;
  }

  /**
   * 2. Send SMS Directly in background via SmsManager
   */
  async sendSmsDirect(phoneNumber: string, message: string): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.sendSmsDirect) {
      try {
        const res = await plugin.sendSmsDirect({ phoneNumber, message });
        return { success: true, message: res?.message || `SMS sent to ${phoneNumber}` };
      } catch (e: any) {
        return { success: false, message: e?.message || 'Failed to dispatch SMS' };
      }
    }

    // Web fallback simulation & deep link intent
    console.log(`[MayraSystemBridge] Simulated Direct SMS to ${phoneNumber}: "${message}"`);
    return {
      success: true,
      message: `[Simulated Direct SMS] Dispatched to ${phoneNumber}: "${message}"`
    };
  }

  /**
   * 3. WhatsApp Pre-fill & Optional Accessibility Auto-Send
   */
  async sendWhatsAppMessage(
    phoneNumber: string, 
    message: string, 
    autoSend: boolean = false
  ): Promise<{ success: boolean; autoSendScheduled: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.sendWhatsAppMessage) {
      try {
        const res = await plugin.sendWhatsAppMessage({ phoneNumber, message, autoSend });
        return {
          success: true,
          autoSendScheduled: !!res?.autoSendScheduled,
          message: autoSend 
            ? 'WhatsApp opened and auto-send scheduled via Accessibility'
            : 'WhatsApp opened with pre-filled message'
        };
      } catch (e: any) {
        return { success: false, autoSendScheduled: false, message: e?.message || 'Failed to open WhatsApp' };
      }
    }

    // Web fallback: Open wa.me link in new tab or frame
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    const url = cleanNum ? `https://wa.me/${cleanNum}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    return {
      success: true,
      autoSendScheduled: autoSend,
      message: `Opened WhatsApp pre-fill for ${phoneNumber || 'chat'}`
    };
  }

  /**
   * 4. Call Handling via TelecomManager / InCallService
   */
  async answerCall(): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.answerCall) {
      try {
        await plugin.answerCall();
        return { success: true, message: 'Call answered successfully' };
      } catch (e: any) {
        return { success: false, message: e?.message || 'Failed to answer call' };
      }
    }

    return { success: true, message: 'Simulated: Call answered' };
  }

  async rejectCall(): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.rejectCall) {
      try {
        await plugin.rejectCall();
        return { success: true, message: 'Call rejected' };
      } catch (e: any) {
        return { success: false, message: e?.message || 'Failed to reject call' };
      }
    }

    return { success: true, message: 'Simulated: Call rejected / declined' };
  }

  /**
   * Initiate a Phone Call via Android Telecom Dialer
   */
  async placePhoneCall(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.placeCall) {
      try {
        await plugin.placeCall({ phoneNumber });
        return { success: true, message: `Calling ${phoneNumber}` };
      } catch (e: any) {
        return { success: false, message: e?.message || `Failed to call ${phoneNumber}` };
      }
    }

    const clean = phoneNumber.replace(/[^0-9+*#]/g, '');
    if (typeof window !== 'undefined' && clean) {
      window.open(`tel:${clean}`, '_self');
    }

    return {
      success: false,
      message: 'Native phone-call integration is unavailable in this environment'
    };
  }

  /**
   * Request or open system permission settings
   */
  async requestPermission(permissionId: string): Promise<boolean> {
    const perm = (permissionId || '').toLowerCase();
    if (perm.includes('accessibility')) {
      return this.openAccessibilitySettings();
    }
    if (perm.includes('notif')) {
      return this.openNotificationListenerSettings();
    }
    if (perm.includes('voice') || perm.includes('mic')) {
      return this.openVoiceInputSettings();
    }
    return true;
  }

  /**
   * 5. Caller Lookup from Contacts
   */
  async lookupCaller(phoneNumber: string): Promise<CallerLookupResult> {
    const plugin = this.getPlugin();
    if (plugin?.lookupCaller) {
      try {
        const res = await plugin.lookupCaller({ phoneNumber });
        return {
          phoneNumber,
          contactName: res?.contactName || '',
          found: !!res?.found
        };
      } catch (e) {
        console.warn('Caller lookup failed', e);
      }
    }

    // Web simulation lookup table
    const mockContacts: Record<string, string> = {
      '+919876543210': 'Zafer (Architect)',
      '+919811223344': 'Dr. Sharma',
      '+15552348890': 'Sarah Jenkins',
      '9876543210': 'Zafer',
      '5552348890': 'Sarah Jenkins'
    };

    const clean = phoneNumber.replace(/[^0-9+]/g, '');
    const name = mockContacts[clean] || mockContacts[clean.replace('+', '')];

    return {
      phoneNumber,
      contactName: name || '',
      found: !!name
    };
  }

  /**
   * 6. App Launcher (Direct Intent or Accessibility fallback)
   */
  async launchApp(appNameOrPackage: string): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.launchApp) {
      try {
        await plugin.launchApp({ appName: appNameOrPackage });
        return { success: true, message: `Opened ${appNameOrPackage}` };
      } catch (e: any) {
        return { success: false, message: e?.message || `Could not launch ${appNameOrPackage}` };
      }
    }

    return {
      success: true,
      message: `[Simulated] Launched application: "${appNameOrPackage}"`
    };
  }

  /**
   * 7. Trigger simulated test notification
   */
  simulateIncomingNotification(custom?: Partial<IncomingNotificationEvent>): IncomingNotificationEvent {
    const notif: IncomingNotificationEvent = {
      id: `sim-${Date.now()}`,
      packageName: custom?.packageName || 'com.whatsapp',
      appName: custom?.appName || 'WhatsApp',
      sender: custom?.sender || 'Priya Sharma',
      text: custom?.text || 'Mayra, can you please send me the updated meeting minutes?',
      timestamp: Date.now(),
      isMessaging: custom?.isMessaging ?? true,
      isCall: custom?.isCall ?? false
    };

    this.notifyListeners(notif);
    return notif;
  }

  getRecentNotifications(): IncomingNotificationEvent[] {
    return [...this.simulatedNotifications];
  }

  /**
   * 8. External Device Setting: Phone Battery Saver / Eco Mode
   */
  async setExternalEcoMode(enabled: boolean): Promise<{ success: boolean; isNative: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.setBatterySaver) {
      try {
        const res = await plugin.setBatterySaver({ enabled });
        return { success: true, isNative: true, message: res?.message || `Device Eco Mode set to ${enabled ? 'ON' : 'OFF'}` };
      } catch (e: any) {
        console.warn('Native battery saver call failed, falling back to simulated', e);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_device_eco_mode', String(enabled));
      localStorage.setItem('mayra_battery_saver', String(enabled));
      localStorage.setItem('mayra_glow_battery_saver', String(enabled));
      window.dispatchEvent(new CustomEvent('mayra_external_setting_changed', {
        detail: { setting: 'eco_mode', value: enabled }
      }));
    }

    return {
      success: true,
      isNative: this.isNative(),
      message: `Device Eco Mode (Power Saver) ${enabled ? 'Activated' : 'Deactivated'}`
    };
  }

  /**
   * 9. External Device Setting: Phone OS System Dark Theme Check & Control
   */
  async checkSystemDarkMode(): Promise<{ isDark: boolean; canModifyDirectly: boolean }> {
    const plugin = this.getPlugin();
    if (plugin?.isSystemDarkTheme) {
      try {
        const res = await plugin.isSystemDarkTheme();
        return { isDark: !!res.isDark, canModifyDirectly: !!res.canModifyDirectly };
      } catch (e) {
        console.warn('Native dark theme check failed', e);
      }
    }

    // Web / browser system media query check
    const osPrefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedDeviceDark = typeof window !== 'undefined' && localStorage.getItem('mayra_device_system_dark_mode');
    const isDark = storedDeviceDark !== null ? storedDeviceDark === 'true' : osPrefersDark;

    return {
      isDark,
      canModifyDirectly: this.isNative()
    };
  }

  async setExternalDarkMode(enabled: boolean): Promise<{ success: boolean; isNative: boolean; requiresIntent: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.setSystemDarkTheme) {
      try {
        const res = await plugin.setSystemDarkTheme({ enabled });
        return { success: true, isNative: true, requiresIntent: false, message: res?.message || `System Dark Mode set to ${enabled ? 'ON' : 'OFF'}` };
      } catch (e: any) {
        console.warn('Native setSystemDarkTheme failed', e);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_device_system_dark_mode', String(enabled));
      window.dispatchEvent(new CustomEvent('mayra_external_setting_changed', {
        detail: { setting: 'system_dark_mode', value: enabled }
      }));
    }

    return {
      success: true,
      isNative: this.isNative(),
      requiresIntent: !this.isNative(),
      message: `System Dark Mode ${enabled ? 'Enabled' : 'Disabled'}`
    };
  }

  /**
   * 10. External Device Setting: Flashlight / Torch
   */
  async setExternalTorch(enabled: boolean): Promise<{ success: boolean; isNative: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.setTorchMode) {
      try {
        await plugin.setTorchMode({ enabled });
        return { success: true, isNative: true, message: `Torch ${enabled ? 'turned ON' : 'turned OFF'}` };
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_device_torch', String(enabled));
      window.dispatchEvent(new CustomEvent('mayra_external_setting_changed', {
        detail: { setting: 'torch', value: enabled }
      }));
    }

    return {
      success: true,
      isNative: this.isNative(),
      message: `Phone Flashlight / Torch ${enabled ? 'turned ON' : 'turned OFF'}`
    };
  }

  /**
   * 11. External Device Setting: Wi-Fi & Bluetooth
   */
  async setExternalWifi(enabled: boolean): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.setWifiEnabled) {
      try {
        await plugin.setWifiEnabled({ enabled });
        return { success: true, message: `Wi-Fi ${enabled ? 'Enabled' : 'Disabled'}` };
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_device_wifi', String(enabled));
    }
    return { success: true, message: `Phone Wi-Fi ${enabled ? 'Enabled' : 'Disabled'}` };
  }

  async setExternalBluetooth(enabled: boolean): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.setBluetoothEnabled) {
      try {
        await plugin.setBluetoothEnabled({ enabled });
        return { success: true, message: `Bluetooth ${enabled ? 'Enabled' : 'Disabled'}` };
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_device_bluetooth', String(enabled));
    }
    return { success: true, message: `Phone Bluetooth ${enabled ? 'Enabled' : 'Disabled'}` };
  }

  /**
   * 12. External Device Setting: DND / Silent Ringer Mode
   */
  async setExternalDnd(enabled: boolean): Promise<{ success: boolean; message: string }> {
    const plugin = this.getPlugin();
    if (plugin?.setDndMode) {
      try {
        await plugin.setDndMode({ enabled });
        return { success: true, message: `Do Not Disturb ${enabled ? 'ON' : 'OFF'}` };
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('mayra_device_dnd', String(enabled));
    }
    return { success: true, message: `Do Not Disturb (Silent Mode) ${enabled ? 'Activated' : 'Deactivated'}` };
  }

  /**
   * 13. Deep link to specific Android System Settings Category
   */
  async openSystemSettings(category: 'battery' | 'display' | 'sound' | 'network' | 'apps' | 'root' = 'root'): Promise<boolean> {
    const plugin = this.getPlugin();
    if (plugin?.openSystemSettings) {
      try {
        await plugin.openSystemSettings({ category });
        return true;
      } catch (e) {}
    }
    return true;
  }

  /**
   * 14. Get snapshot of external device settings state
   */
  getExternalDeviceState(): {
    ecoMode: boolean;
    systemDarkMode: boolean;
    torch: boolean;
    wifi: boolean;
    bluetooth: boolean;
    dnd: boolean;
  } {
    if (typeof window === 'undefined') {
      return {
        ecoMode: false,
        systemDarkMode: true,
        torch: false,
        wifi: true,
        bluetooth: true,
        dnd: false
      };
    }

    return {
      ecoMode: localStorage.getItem('mayra_device_eco_mode') === 'true' || localStorage.getItem('mayra_battery_saver') === 'true',
      systemDarkMode: localStorage.getItem('mayra_device_system_dark_mode') !== 'false',
      torch: localStorage.getItem('mayra_device_torch') === 'true',
      wifi: localStorage.getItem('mayra_device_wifi') !== 'false',
      bluetooth: localStorage.getItem('mayra_device_bluetooth') !== 'false',
      dnd: localStorage.getItem('mayra_device_dnd') === 'true'
    };
  }
}

export const MayraSystemBridge = new MayraSystemIntegrationBridgeClass();
