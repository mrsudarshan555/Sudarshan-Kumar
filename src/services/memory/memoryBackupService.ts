/**
 * Memory Backup & Restore Service (Phase I)
 * 
 * Allows users to export all memories, chat history, contacts, and configuration
 * into a JSON file, and restore them anytime (e.g. on a new device).
 */

export interface BackupData {
  version: string;
  app: string;
  exportedAt: string;
  timestamp: number;
  stats: {
    memoriesCount: number;
    chatMessagesCount: number;
    contactsCount: number;
  };
  data: {
    memories: any[];
    chatHistory: any[];
    familyContacts: any[];
    emergencyContacts: any[];
    preferences: Record<string, any>;
  };
}

export class MemoryBackupService {
  private static instance: MemoryBackupService | null = null;

  public static getInstance(): MemoryBackupService {
    if (!this.instance) {
      this.instance = new MemoryBackupService();
    }
    return this.instance;
  }

  /**
   * Generates and downloads full backup JSON file
   */
  public exportBackup(): { success: boolean; filename: string; stats: BackupData['stats'] } {
    try {
      // 1. Collect memories
      let memories: any[] = [];
      try {
        const rawVault = localStorage.getItem('mayra_memory_vault');
        if (rawVault) memories = JSON.parse(rawVault);
      } catch {}

      // Also check server/memory store sync items
      try {
        const rawMemStore = localStorage.getItem('mayra_memories_list');
        if (rawMemStore) {
          const list = JSON.parse(rawMemStore);
          if (Array.isArray(list)) {
            const ids = new Set(memories.map(m => m.id));
            list.forEach(item => {
              if (!ids.has(item.id)) memories.push(item);
            });
          }
        }
      } catch {}

      // 2. Collect Chat History
      let chatHistory: any[] = [];
      try {
        const rawChat = localStorage.getItem('mayra_chat_messages') || localStorage.getItem('mayra_chat_history');
        if (rawChat) chatHistory = JSON.parse(rawChat);
      } catch {}

      // 3. Collect Contacts
      let familyContacts: any[] = [];
      try {
        const rawFam = localStorage.getItem('mayra_family_contacts');
        if (rawFam) familyContacts = JSON.parse(rawFam);
      } catch {}

      let emergencyContacts: any[] = [];
      try {
        const rawEm = localStorage.getItem('stonicx_emergency_contacts');
        if (rawEm) emergencyContacts = JSON.parse(rawEm);
      } catch {}

      // 4. Collect User Preferences
      const preferences: Record<string, any> = {
        theme: localStorage.getItem('mayra_theme') || 'dark',
        preferredLanguage: localStorage.getItem('mayra_preferred_language') || 'hi',
        voiceTone: localStorage.getItem('mayra_voice_tone') || 'Intelligent & Direct',
        batterySaver: localStorage.getItem('mayra_battery_saver') === 'true',
        echoGuard: localStorage.getItem('mayra_echo_guard_enabled') !== 'false'
      };

      const backup: BackupData = {
        version: '1.2.0',
        app: 'MAYRA',
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        stats: {
          memoriesCount: memories.length,
          chatMessagesCount: chatHistory.length,
          contactsCount: familyContacts.length + emergencyContacts.length
        },
        data: {
          memories,
          chatHistory,
          familyContacts,
          emergencyContacts,
          preferences
        }
      };

      // Create download blob
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `mayra_backup_${dateStr}.json`;

      if (typeof window !== 'undefined') {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      console.log('[MemoryBackup] Export completed:', backup.stats);
      return { success: true, filename, stats: backup.stats };
    } catch (err: any) {
      console.error('[MemoryBackup] Export failed:', err);
      throw new Error(err?.message || 'Backup export failed');
    }
  }

  /**
   * Restores memories, chat history, and contacts from imported JSON
   */
  public async restoreBackup(jsonString: string): Promise<{
    success: boolean;
    memoriesRestored: number;
    chatRestored: number;
    contactsRestored: number;
    message: string;
  }> {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }

      const data = parsed.data || parsed;
      let memoriesRestored = 0;
      let chatRestored = 0;
      let contactsRestored = 0;

      // 1. Restore Memories
      if (Array.isArray(data.memories)) {
        localStorage.setItem('mayra_memory_vault', JSON.stringify(data.memories));
        localStorage.setItem('mayra_memories_list', JSON.stringify(data.memories));
        memoriesRestored = data.memories.length;

        // Also sync to server memory endpoint if available
        try {
          fetch('/api/memory/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memories: data.memories })
          }).catch(() => {});
        } catch {}
      }

      // 2. Restore Chat History
      if (Array.isArray(data.chatHistory)) {
        localStorage.setItem('mayra_chat_messages', JSON.stringify(data.chatHistory));
        localStorage.setItem('mayra_chat_history', JSON.stringify(data.chatHistory));
        chatRestored = data.chatHistory.length;
      }

      // 3. Restore Family Contacts
      if (Array.isArray(data.familyContacts)) {
        localStorage.setItem('mayra_family_contacts', JSON.stringify(data.familyContacts));
        contactsRestored += data.familyContacts.length;
      }

      // 4. Restore Emergency Contacts
      if (Array.isArray(data.emergencyContacts)) {
        localStorage.setItem('stonicx_emergency_contacts', JSON.stringify(data.emergencyContacts));
        contactsRestored += data.emergencyContacts.length;
      }

      // 5. Restore Preferences
      if (data.preferences && typeof data.preferences === 'object') {
        Object.entries(data.preferences).forEach(([key, val]) => {
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            localStorage.setItem(`mayra_${key}`, String(val));
          }
        });
      }

      // 6. Broadcast global restoration event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mayra-memory-restored', {
            detail: {
              memoriesRestored,
              chatRestored,
              contactsRestored,
              timestamp: Date.now()
            }
          })
        );
      }

      const message = `Successfully restored ${memoriesRestored} memories, ${chatRestored} chat messages, and ${contactsRestored} contacts.`;
      console.log('[MemoryBackup] ' + message);

      return {
        success: true,
        memoriesRestored,
        chatRestored,
        contactsRestored,
        message
      };
    } catch (err: any) {
      console.error('[MemoryBackup] Restore failed:', err);
      throw new Error(`Restore failed: ${err?.message || 'Invalid backup file'}`);
    }
  }
}
