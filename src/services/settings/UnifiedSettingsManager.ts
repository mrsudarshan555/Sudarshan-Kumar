/**
 * UnifiedSettingsManager
 * 
 * Intelligent Settings Controller for MAYRA:
 * Bridges External Phone Settings (Android OS / Hardware) with Mayra's Internal App Settings.
 * 
 * Flow requested by User:
 * 1. For settings like Dark Mode:
 *    - Mayra first checks the external phone settings (Android OS dark theme).
 *    - If external system setting can be modified or requires intent, it handles/notes it,
 *      and immediately applies Dark Mode in the Mayra app as well.
 * 2. For settings like "Setting me jaakar eco mode on/off karo":
 *    - Mayra understands where "eco mode" belongs (Device Battery Saver & Mayra Low-Power Throttle).
 *    - Mayra automatically executes the setting change both externally and internally.
 * 3. For any Mayra internal settings (Orb style, Aura border, Font, Voice Pitch/Speed, Language, etc.):
 *    - Mayra navigates internally and applies the setting directly without forcing the user to hunt.
 */

import { AppearanceConfig, AssistantConfig, AppAction } from '../../types';
import { MayraSystemBridge } from '../native/MayraSystemIntegrationBridge';

export interface SettingExecutionResult {
  handled: boolean;
  targetScope: 'external' | 'internal' | 'hybrid';
  settingName: string;
  appliedValue: any;
  action: AppAction | null;
  reply: string;
}

class UnifiedSettingsManagerClass {
  /**
   * Main entry point to detect and execute a setting change request from natural language.
   */
  async executeSettingCommand(
    prompt: string,
    currentSettings?: {
      appearance?: AppearanceConfig;
      assistant?: AssistantConfig;
    },
    language: 'hi' | 'en' = 'en'
  ): Promise<SettingExecutionResult | null> {
    const raw = prompt.trim();
    const lower = raw.toLowerCase();

    const isHi = language === 'hi' ||
      /[\u0900-\u097F]/.test(raw) ||
      /\b(?:karo|kar|do|khol|kholo|band|chalu|lagao|badlo|hatao|jao|jakar|me|mein|bhai|yaar)\b/i.test(raw);

    // ==========================================
    // 1. DARK MODE / LIGHT MODE INTENT
    // ==========================================
    const isDarkIntent =
      lower.includes('dark mode') ||
      lower.includes('light mode') ||
      lower.includes('dark theme') ||
      lower.includes('light theme') ||
      lower.includes('black theme') ||
      lower.includes('night mode');

    if (isDarkIntent) {
      const turnOn = !lower.includes('off') &&
        !lower.includes('band') &&
        !lower.includes('disable') &&
        !lower.includes('light');

      // 1. Check external phone setting first (as requested)
      const extCheck = await MayraSystemBridge.checkSystemDarkMode();
      const extResult = await MayraSystemBridge.setExternalDarkMode(turnOn);

      // 2. Apply in Mayra App directly
      this.dispatchInternalSettingUpdate({
        appearance: { darkMode: turnOn }
      });

      let reply = '';
      if (isHi) {
        if (extResult.isNative) {
          reply = turnOn
            ? `Bhai, maine phone ki system settings mein check kiya aur external system dark mode ke saath-saath Mayra app mein bhi Dark Mode on kar diya hai!`
            : `Bhai, maine phone ki system settings aur Mayra app dono mein Light Mode activate kar diya hai!`;
        } else {
          reply = turnOn
            ? `Bhai, maine phone ki system setting check ki — aur saath hi Mayra app ka Dark Mode turant on kar diya hai! Dekho ab pura look sleek ho gaya.`
            : `Bhai, maine phone setting check ki aur Mayra app mein Light Mode apply kar diya hai!`;
        }
      } else {
        reply = turnOn
          ? `I checked your phone's system display settings and immediately activated Dark Mode in the Mayra app as well!`
          : `I checked your system settings and switched Mayra app to Light Mode.`;
      }

      return {
        handled: true,
        targetScope: 'hybrid',
        settingName: 'darkMode',
        appliedValue: turnOn,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'appearance', key: 'darkMode', value: turnOn },
          statusMessage: `Dark Mode ${turnOn ? 'Enabled' : 'Disabled'}`
        },
        reply
      };
    }

    // ==========================================
    // 2. ECO MODE / BATTERY SAVER INTENT
    // ==========================================
    const isEcoIntent =
      lower.includes('eco mode') ||
      lower.includes('battery saver') ||
      lower.includes('power saver') ||
      lower.includes('power saving') ||
      lower.includes('battery bachao') ||
      lower.includes('battery save karo');

    if (isEcoIntent) {
      const turnOn = !lower.includes('off') &&
        !lower.includes('band') &&
        !lower.includes('disable') &&
        !lower.includes('hatao');

      // Mayra understands where this setting is located:
      // Phone Battery Settings & Internal Low-power Mode
      await MayraSystemBridge.setExternalEcoMode(turnOn);

      // Also apply in internal settings
      this.dispatchInternalSettingUpdate({
        custom: { ecoMode: turnOn }
      });

      let reply = '';
      if (isHi) {
        reply = turnOn
          ? `Bhai, maine setting me jakar phone ka Eco Mode (Battery Saver) aur Mayra ka low-power mode on kar diya hai! Ab background energy optimize rahegi aur phone ki battery lamba chalegi.`
          : `Bhai, maine setting me jakar Eco Mode (Battery Saver) ko off kar diya hai, ab phone aur Mayra full performance mode par chalenge!`;
      } else {
        reply = turnOn
          ? `I navigated to power settings and turned ON Eco Mode (Battery Saver) for both your phone and Mayra! Background consumption is now minimized.`
          : `Eco Mode has been turned OFF. Phone and Mayra are now running in standard high-performance mode.`;
      }

      return {
        handled: true,
        targetScope: 'hybrid',
        settingName: 'ecoMode',
        appliedValue: turnOn,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'power', key: 'ecoMode', value: turnOn },
          statusMessage: `Eco Mode ${turnOn ? 'Activated' : 'Deactivated'}`
        },
        reply
      };
    }

    // ==========================================
    // 3. ORB STYLE & CUSTOMIZATION INTENT
    // ==========================================
    if (lower.includes('orb style') || lower.includes('orb badlo') || lower.includes('orb change')) {
      let targetStyle = 'cyber_matrix';
      if (lower.includes('neon') || lower.includes('ring')) targetStyle = 'neon_ring';
      else if (lower.includes('pulsing') || lower.includes('sphere')) targetStyle = 'pulsing_sphere';
      else if (lower.includes('energy') || lower.includes('vortex')) targetStyle = 'energy_vortex';
      else if (lower.includes('minimal') || lower.includes('dot')) targetStyle = 'minimal_dot';
      else if (lower.includes('hologram')) targetStyle = 'hologram_core';

      this.dispatchInternalSettingUpdate({
        appearance: { orbStyle: targetStyle as any }
      });

      const reply = isHi
        ? `Haan bhai, maine Appearance settings mein jaakar Orb style ko "${targetStyle.replace('_', ' ').toUpperCase()}" par set kar diya hai! Dekho kaisa lag raha hai.`
        : `I updated your Orb style to "${targetStyle.replace('_', ' ').toUpperCase()}" in Mayra's Appearance settings.`;

      return {
        handled: true,
        targetScope: 'internal',
        settingName: 'orbStyle',
        appliedValue: targetStyle,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'appearance', key: 'orbStyle', value: targetStyle },
          statusMessage: `Orb style updated to ${targetStyle}`
        },
        reply
      };
    }

    // ==========================================
    // 4. AURA BORDER MODE INTENT
    // ==========================================
    if (lower.includes('aura border') || lower.includes('glow border') || lower.includes('screen border glow')) {
      const turnOn = !lower.includes('off') && !lower.includes('band') && !lower.includes('disable');

      this.dispatchInternalSettingUpdate({
        appearance: { auraBorderMode: turnOn }
      });

      const reply = isHi
        ? `Bhai, maine settings mein jaakar glowing Aura Border ko ${turnOn ? 'ON' : 'OFF'} kar diya hai!`
        : `Aura Border mode has been turned ${turnOn ? 'ON' : 'OFF'} in Mayra Appearance settings.`;

      return {
        handled: true,
        targetScope: 'internal',
        settingName: 'auraBorderMode',
        appliedValue: turnOn,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'appearance', key: 'auraBorderMode', value: turnOn },
          statusMessage: `Aura Border ${turnOn ? 'Enabled' : 'Disabled'}`
        },
        reply
      };
    }

    // ==========================================
    // 5. VOICE VISUALIZER INTENT
    // ==========================================
    if (lower.includes('voice visualizer') || lower.includes('sound visualizer') || lower.includes('visualizer')) {
      const turnOn = !lower.includes('off') && !lower.includes('band') && !lower.includes('disable');

      this.dispatchInternalSettingUpdate({
        appearance: { voiceVisualizerEnabled: turnOn }
      });

      const reply = isHi
        ? `Bhai, maine settings mein jaakar Voice Visualizer ko ${turnOn ? 'chalu' : 'band'} kar diya hai!`
        : `Voice Visualizer has been turned ${turnOn ? 'ON' : 'OFF'} in settings.`;

      return {
        handled: true,
        targetScope: 'internal',
        settingName: 'voiceVisualizerEnabled',
        appliedValue: turnOn,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'appearance', key: 'voiceVisualizerEnabled', value: turnOn },
          statusMessage: `Voice Visualizer ${turnOn ? 'Enabled' : 'Disabled'}`
        },
        reply
      };
    }

    // ==========================================
    // 6. HEADING / UI FONT INTENT
    // ==========================================
    if (lower.includes('font') && (lower.includes('badlo') || lower.includes('change') || lower.includes('set') || lower.includes('karo'))) {
      let targetFont = 'orbitron';
      if (lower.includes('sora')) targetFont = 'sora';
      else if (lower.includes('manrope')) targetFont = 'manrope';
      else if (lower.includes('space')) targetFont = 'space_grotesk';
      else if (lower.includes('system') || lower.includes('default')) targetFont = 'system';

      this.dispatchInternalSettingUpdate({
        appearance: { headingFont: targetFont as any }
      });

      const reply = isHi
        ? `Bhai, maine Typography settings mein jaakar heading font ko "${targetFont.toUpperCase()}" par switch kar diya hai!`
        : `Typography setting updated: font is now set to "${targetFont.toUpperCase()}".`;

      return {
        handled: true,
        targetScope: 'internal',
        settingName: 'headingFont',
        appliedValue: targetFont,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'appearance', key: 'headingFont', value: targetFont },
          statusMessage: `Font changed to ${targetFont}`
        },
        reply
      };
    }

    // ==========================================
    // 7. EXTERNAL PHONE HARDWARE SETTINGS (Torch, Wi-Fi, Bluetooth, DND)
    // ==========================================
    // Flashlight / Torch
    if (lower.includes('torch') || lower.includes('flashlight')) {
      const turnOn = !lower.includes('off') && !lower.includes('band') && !lower.includes('bujha');
      const res = await MayraSystemBridge.setExternalTorch(turnOn);
      const reply = isHi
        ? `Bhai, maine phone ki flashlight / torch ${turnOn ? 'ON kar di hai' : 'band kar di hai'}!`
        : `Phone flashlight turned ${turnOn ? 'ON' : 'OFF'}.`;

      return {
        handled: true,
        targetScope: 'external',
        settingName: 'torch',
        appliedValue: turnOn,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'device', key: 'torch', value: turnOn },
          statusMessage: res.message
        },
        reply
      };
    }

    // Wi-Fi
    if (lower.includes('wi-fi') || lower.includes('wifi')) {
      if (lower.includes('on') || lower.includes('off') || lower.includes('band') || lower.includes('chalu')) {
        const turnOn = !lower.includes('off') && !lower.includes('band');
        await MayraSystemBridge.setExternalWifi(turnOn);
        const reply = isHi
          ? `Bhai, phone ka Wi-Fi ${turnOn ? 'ON' : 'OFF'} kar diya gaya hai.`
          : `Phone Wi-Fi has been turned ${turnOn ? 'ON' : 'OFF'}.`;

        return {
          handled: true,
          targetScope: 'external',
          settingName: 'wifi',
          appliedValue: turnOn,
          action: {
            type: 'CHANGE_SETTING',
            payload: { category: 'device', key: 'wifi', value: turnOn },
            statusMessage: `Wi-Fi ${turnOn ? 'ON' : 'OFF'}`
          },
          reply
        };
      }
    }

    // Bluetooth
    if (lower.includes('bluetooth')) {
      if (lower.includes('on') || lower.includes('off') || lower.includes('band') || lower.includes('chalu')) {
        const turnOn = !lower.includes('off') && !lower.includes('band');
        await MayraSystemBridge.setExternalBluetooth(turnOn);
        const reply = isHi
          ? `Bhai, phone ka Bluetooth ${turnOn ? 'ON' : 'OFF'} kar diya gaya hai.`
          : `Phone Bluetooth has been turned ${turnOn ? 'ON' : 'OFF'}.`;

        return {
          handled: true,
          targetScope: 'external',
          settingName: 'bluetooth',
          appliedValue: turnOn,
          action: {
            type: 'CHANGE_SETTING',
            payload: { category: 'device', key: 'bluetooth', value: turnOn },
            statusMessage: `Bluetooth ${turnOn ? 'ON' : 'OFF'}`
          },
          reply
        };
      }
    }

    // Do Not Disturb / Silent Mode
    if (lower.includes('silent mode') || lower.includes('dnd') || lower.includes('do not disturb') || lower.includes('shant mode')) {
      const turnOn = !lower.includes('off') && !lower.includes('band') && !lower.includes('hatao');
      await MayraSystemBridge.setExternalDnd(turnOn);
      const reply = isHi
        ? `Bhai, phone ka Do Not Disturb (Silent Mode) ${turnOn ? 'on kar diya hai, ab koi disturbance nahi aayegi' : 'off kar diya hai'}!`
        : `Do Not Disturb mode has been turned ${turnOn ? 'ON' : 'OFF'}.`;

      return {
        handled: true,
        targetScope: 'external',
        settingName: 'dnd',
        appliedValue: turnOn,
        action: {
          type: 'CHANGE_SETTING',
          payload: { category: 'device', key: 'dnd', value: turnOn },
          statusMessage: `DND ${turnOn ? 'ON' : 'OFF'}`
        },
        reply
      };
    }

    return null;
  }

  /**
   * Helper to dispatch internal setting updates to React runtime
   */
  private dispatchInternalSettingUpdate(update: {
    appearance?: Partial<AppearanceConfig>;
    assistant?: Partial<AssistantConfig>;
    custom?: Record<string, any>;
  }) {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
      new CustomEvent('mayra_apply_app_setting', {
        detail: update
      })
    );
  }
}

export const UnifiedSettingsManager = new UnifiedSettingsManagerClass();
