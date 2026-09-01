import { UserAccount, UserAccountSyncData } from '../../types/auth';
import { MemoryVaultManager } from '../memory/memoryVaultManager';

const ACTIVE_USER_KEY = 'mayra_active_user_session';
const ACCOUNTS_DB_KEY = 'mayra_registered_accounts_db';
const USER_DATA_PREFIX = 'mayra_user_data_';

export class AccountSyncService {
  private static instance: AccountSyncService;
  private currentUser: UserAccount | null = null;
  private syncListeners: ((user: UserAccount | null) => void)[] = [];

  private constructor() {
    this.loadSession();
  }

  public static getInstance(): AccountSyncService {
    if (!AccountSyncService.instance) {
      AccountSyncService.instance = new AccountSyncService();
    }
    return AccountSyncService.instance;
  }

  public subscribe(listener: (user: UserAccount | null) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.syncListeners) {
      listener(this.currentUser);
    }
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public loadSession(): UserAccount | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem(ACTIVE_USER_KEY);
      if (raw) {
        this.currentUser = JSON.parse(raw);
        return this.currentUser;
      }
    } catch (e) {
      console.error('[AccountSyncService] Error loading session:', e);
    }
    return null;
  }

  public async loginWithEmail(email: string, name?: string): Promise<{ success: boolean; user: UserAccount; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || (trimmedEmail.split('@')[0] ? trimmedEmail.split('@')[0].replace(/[._]/g, ' ') : 'User');
    
    // Capitalize first letter
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const user: UserAccount = {
      id: `usr_${btoa(trimmedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
      name: formattedName,
      email: trimmedEmail,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      authProvider: 'email'
    };

    return this.persistUserSession(user);
  }

  public async loginWithGoogle(email: string, name: string, avatarUrl?: string): Promise<{ success: boolean; user: UserAccount }> {
    const user: UserAccount = {
      id: `usr_g_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
      name: name || 'Google User',
      email: email.toLowerCase(),
      avatarUrl,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      authProvider: 'google'
    };

    return this.persistUserSession(user);
  }

  private async persistUserSession(user: UserAccount): Promise<{ success: boolean; user: UserAccount }> {
    this.currentUser = user;
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));

    // Register in all accounts DB
    const accounts = this.getAllAccounts();
    const existingIndex = accounts.findIndex(a => a.email === user.email);
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...user, lastLoginAt: new Date().toISOString() };
    } else {
      accounts.push(user);
    }
    localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(accounts));

    // Restore user-specific cloud/local vault & memories
    await this.restoreUserData(user.id);

    this.notify();
    return { success: true, user };
  }

  public getAllAccounts(): UserAccount[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_DB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async backupCurrentUserData(state: {
    messages?: any[];
    memories?: any[];
    personalConfig?: any;
    assistantConfig?: any;
    appearanceConfig?: any;
    voiceGuardianConfig?: any;
    advancedConfig?: any;
  }): Promise<void> {
    if (!this.currentUser) return;

    try {
      const vault = MemoryVaultManager.getInstance();
      await vault.initializeVault();

      const memoryMd = vault.getDocument('MEMORY.md');
      const dailyNoteMd = vault.getDocument('DAILY-NOTE.md');
      const vaultIndexMd = vault.getDocument('VAULT-INDEX.md');

      const payload: UserAccountSyncData = {
        user: this.currentUser,
        chatHistory: state.messages || [],
        memories: state.memories || [],
        memoryVaultDocs: {
          'MEMORY.md': memoryMd,
          'DAILY-NOTE.md': dailyNoteMd,
          'VAULT-INDEX.md': vaultIndexMd
        },
        settings: {
          personalConfig: state.personalConfig,
          assistantConfig: state.assistantConfig,
          appearanceConfig: state.appearanceConfig,
          voiceGuardianConfig: state.voiceGuardianConfig,
          advancedConfig: state.advancedConfig
        },
        lastSyncedAt: new Date().toISOString()
      };

      const key = `${USER_DATA_PREFIX}${this.currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(payload));
      console.log(`[AccountSyncService] Synced cloud/local state for ${this.currentUser.email} at ${payload.lastSyncedAt}`);
    } catch (e) {
      console.error('[AccountSyncService] Backup failed:', e);
    }
  }

  public async restoreUserData(userId: string): Promise<UserAccountSyncData | null> {
    try {
      const key = `${USER_DATA_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const data: UserAccountSyncData = JSON.parse(raw);

      // Restore Markdown Memory Docs
      if (data.memoryVaultDocs) {
        const vault = MemoryVaultManager.getInstance();
        await vault.initializeVault();
        if (data.memoryVaultDocs['MEMORY.md']) {
          await vault.setDocument('MEMORY.md', data.memoryVaultDocs['MEMORY.md']);
        }
        if (data.memoryVaultDocs['DAILY-NOTE.md']) {
          await vault.setDocument('DAILY-NOTE.md', data.memoryVaultDocs['DAILY-NOTE.md']);
        }
        if (data.memoryVaultDocs['VAULT-INDEX.md']) {
          await vault.setDocument('VAULT-INDEX.md', data.memoryVaultDocs['VAULT-INDEX.md']);
        }
      }

      return data;
    } catch (e) {
      console.error('[AccountSyncService] Restore failed:', e);
      return null;
    }
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem(ACTIVE_USER_KEY);
    this.notify();
  }

  public async updateUserProfile(updates: Partial<UserAccount>): Promise<UserAccount | null> {
    if (!this.currentUser) return null;
    this.currentUser = { ...this.currentUser, ...updates };
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(this.currentUser));
    const accounts = this.getAllAccounts();
    const existingIndex = accounts.findIndex(a => a.id === this.currentUser?.id);
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...this.currentUser };
      localStorage.setItem(ACCOUNTS_DB_KEY, JSON.stringify(accounts));
    }
    this.notify();
    return this.currentUser;
  }
}
