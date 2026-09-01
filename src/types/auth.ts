export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
  authProvider: 'email' | 'google';
}

export interface UserAccountSyncData {
  user: UserAccount;
  chatHistory: any[];
  memories: any[];
  memoryVaultDocs: {
    'MEMORY.md'?: string;
    'DAILY-NOTE.md'?: string;
    'VAULT-INDEX.md'?: string;
  };
  settings: {
    personalConfig?: any;
    assistantConfig?: any;
    appearanceConfig?: any;
    voiceGuardianConfig?: any;
    advancedConfig?: any;
  };
  lastSyncedAt: string;
}
