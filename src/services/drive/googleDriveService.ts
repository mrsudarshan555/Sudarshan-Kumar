import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { MemoryBackupService } from '../memory/memoryBackupService';

// Workspace integration scopes list
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

// Re-use initialized Firebase App or initialize single instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

// In-memory caching for access token (MUST NOT be stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveUploadedFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: number | string;
  webViewLink?: string;
  createdTime?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface DriveBackupProgress {
  status: 'idle' | 'preparing' | 'creating_folder' | 'uploading' | 'completed' | 'error';
  totalFiles: number;
  completedFiles: number;
  currentFileName?: string;
  folderId?: string;
  folderName: string;
  folderLink?: string;
  uploadedFiles: DriveUploadedFile[];
  errorMessage?: string;
}

export interface AppFileToBackup {
  name: string;
  category: string;
  description: string;
  content: string | Blob;
  mimeType: string;
  size?: number;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService | null = null;
  private authSubscribers: Array<(user: User | null, token: string | null) => void> = [];
  private currentUser: User | null = null;

  private constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (!user) {
        cachedAccessToken = null;
      }
      this.notifySubscribers();
    });
  }

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  public subscribeAuth(callback: (user: User | null, token: string | null) => void): () => void {
    this.authSubscribers.push(callback);
    callback(this.currentUser, cachedAccessToken);
    return () => {
      this.authSubscribers = this.authSubscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    for (const sub of this.authSubscribers) {
      try {
        sub(this.currentUser, cachedAccessToken);
      } catch (e) {
        console.error('[GoogleDriveService] Subscriber error:', e);
      }
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser || auth.currentUser;
  }

  public getAccessToken(): string | null {
    return cachedAccessToken;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.currentUser && cachedAccessToken);
  }

  public async signIn(): Promise<{ user: User; accessToken: string }> {
    if (isSigningIn) {
      throw new Error('Sign in is already in progress');
    }
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Could not obtain Google Drive OAuth access token');
      }
      cachedAccessToken = credential.accessToken;
      this.currentUser = result.user;
      this.notifySubscribers();
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (err: any) {
      console.error('[GoogleDriveService] Sign-in error:', err);
      throw err;
    } finally {
      isSigningIn = false;
    }
  }

  public async signOut(): Promise<void> {
    await signOut(auth);
    cachedAccessToken = null;
    this.currentUser = null;
    this.notifySubscribers();
  }

  /**
   * Search or create a folder named 'Mayra' on Google Drive
   */
  public async getOrCreateFolder(folderName: string = 'Mayra'): Promise<{ id: string; name: string; webViewLink?: string }> {
    const token = cachedAccessToken;
    if (!token) {
      throw new Error('Authentication required. Please sign in with Google first.');
    }

    // 1. Search existing non-trashed folder
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&spaces=drive`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (searchRes.status === 401) {
      cachedAccessToken = null;
      this.notifySubscribers();
      throw new Error('Session expired. Please sign in with Google again.');
    }

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      throw new Error(`Failed to query Google Drive: ${errText}`);
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const existing = searchData.files[0];
      return {
        id: existing.id,
        name: existing.name,
        webViewLink: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`
      };
    }

    // 2. Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create '${folderName}' folder in Google Drive: ${errText}`);
    }

    const folderData = await createRes.json();
    return {
      id: folderData.id,
      name: folderData.name,
      webViewLink: folderData.webViewLink || `https://drive.google.com/drive/folders/${folderData.id}`
    };
  }

  /**
   * Upload a single file into the target Google Drive folder
   */
  public async uploadFile(
    folderId: string,
    file: { name: string; content: string | Blob; mimeType?: string }
  ): Promise<{ id: string; name: string; webViewLink?: string; size?: string }> {
    const token = cachedAccessToken;
    if (!token) {
      throw new Error('Authentication required. Please sign in with Google first.');
    }

    const boundary = '-------MayraDriveBoundary' + Date.now().toString(16);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const mime = file.mimeType || (file.name.endsWith('.json') ? 'application/json' : file.name.endsWith('.md') ? 'text/markdown' : 'text/plain');

    const metadata = {
      name: file.name,
      parents: [folderId],
      mimeType: mime
    };

    let body: BodyInit;
    if (typeof file.content === 'string') {
      body = delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mime}; charset=UTF-8\r\n\r\n` +
        file.content +
        closeDelimiter;
    } else {
      const metadataBlob = new Blob([
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mime}\r\n\r\n`
      ], { type: 'text/plain' });
      const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });
      body = new Blob([metadataBlob, file.content, closeBlob]);
    }

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,createdTime';
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (uploadRes.status === 401) {
      cachedAccessToken = null;
      this.notifySubscribers();
      throw new Error('Session expired. Please sign in with Google again.');
    }

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Failed to upload ${file.name}: ${errText}`);
    }

    const uploaded = await uploadRes.json();
    return {
      id: uploaded.id,
      name: uploaded.name,
      webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
      size: uploaded.size
    };
  }

  /**
   * List files inside the folder
   */
  public async listFiles(folderId: string): Promise<DriveUploadedFile[]> {
    const token = cachedAccessToken;
    if (!token) return [];

    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,webViewLink,createdTime)&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      createdTime: f.createdTime,
      status: 'completed' as const
    }));
  }

  /**
   * Collect all local notes, vault documents, memories, and state to back up
   */
  public async collectAllFiles(): Promise<AppFileToBackup[]> {
    const list: AppFileToBackup[] = [];

    // 1. Fetch server sample-notes and memories from our API
    try {
      const res = await fetch('/api/drive/vault-files');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files)) {
          for (const f of data.files) {
            list.push({
              name: f.name,
              category: f.category || 'Vault Note',
              description: f.relativePath || f.name,
              content: f.content,
              mimeType: f.mimeType || 'text/markdown',
              size: f.size || (f.content ? f.content.length : 0)
            });
          }
        }
      }
    } catch (e) {
      console.warn('[GoogleDriveService] Server vault-files fetch warning:', e);
    }

    // 2. Client-side canonical Markdown documents from MemoryVaultManager / localStorage
    if (typeof window !== 'undefined') {
      const localMemory = localStorage.getItem('mayra_vault_MEMORY_MD') || 
        localStorage.getItem('mayra_memory_md');
      if (localMemory) {
        list.push({
          name: 'MEMORY.md',
          category: 'Canonical Vault',
          description: 'Unified Long-term Knowledge & Facts',
          content: localMemory,
          mimeType: 'text/markdown',
          size: localMemory.length
        });
      }

      const localDaily = localStorage.getItem('mayra_vault_DAILY_NOTE_MD') || 
        localStorage.getItem('mayra_daily_note_md');
      if (localDaily) {
        list.push({
          name: 'DAILY-NOTE.md',
          category: 'Canonical Vault',
          description: 'Daily Activity Timeline & Task Logs',
          content: localDaily,
          mimeType: 'text/markdown',
          size: localDaily.length
        });
      }

      const localIndex = localStorage.getItem('mayra_vault_VAULT_INDEX_MD') || 
        localStorage.getItem('mayra_vault_index_md');
      if (localIndex) {
        list.push({
          name: 'VAULT-INDEX.md',
          category: 'Canonical Vault',
          description: 'Knowledge Graph & Hierarchical Map',
          content: localIndex,
          mimeType: 'text/markdown',
          size: localIndex.length
        });
      }
    }

    // 3. Full Comprehensive JSON Archive (Memories, Chats, Contacts, Settings)
    try {
      const backupObj = MemoryBackupService.getInstance().exportBackup();
      const backupJson = JSON.stringify(backupObj, null, 2);
      list.push({
        name: `Mayra_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`,
        category: 'System Backup',
        description: 'Complete snapshot: context memories, chat logs, contacts & preferences',
        content: backupJson,
        mimeType: 'application/json',
        size: backupJson.length
      });
    } catch (e) {
      console.warn('[GoogleDriveService] Full backup bundle warning:', e);
    }

    // Deduplicate by file name
    const uniqueMap = new Map<string, AppFileToBackup>();
    for (const item of list) {
      if (!uniqueMap.has(item.name)) {
        uniqueMap.set(item.name, item);
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Execute full backup of all files into the 'Mayra' folder
   */
  public async backupAllFiles(
    folderName: string = 'Mayra',
    customFiles?: AppFileToBackup[],
    onProgress?: (progress: DriveBackupProgress) => void
  ): Promise<DriveBackupProgress> {
    const files = customFiles || (await this.collectAllFiles());

    const progress: DriveBackupProgress = {
      status: 'preparing',
      totalFiles: files.length,
      completedFiles: 0,
      folderName,
      uploadedFiles: files.map(f => ({
        id: '',
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        status: 'pending' as const
      }))
    };

    onProgress?.(progress);

    try {
      // 1. Get or create folder
      progress.status = 'creating_folder';
      onProgress?.(progress);

      const folder = await this.getOrCreateFolder(folderName);
      progress.folderId = folder.id;
      progress.folderLink = folder.webViewLink;

      // 2. Upload each file sequentially
      progress.status = 'uploading';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        progress.currentFileName = file.name;
        progress.uploadedFiles[i].status = 'uploading';
        onProgress?.(progress);

        try {
          const uploaded = await this.uploadFile(folder.id, {
            name: file.name,
            content: file.content,
            mimeType: file.mimeType
          });

          progress.uploadedFiles[i] = {
            id: uploaded.id,
            name: uploaded.name,
            mimeType: file.mimeType,
            size: uploaded.size || file.size,
            webViewLink: uploaded.webViewLink,
            status: 'completed'
          };
          progress.completedFiles += 1;
        } catch (fileErr: any) {
          console.error(`[GoogleDriveService] Error uploading ${file.name}:`, fileErr);
          progress.uploadedFiles[i].status = 'failed';
          progress.uploadedFiles[i].error = fileErr?.message || 'Upload failed';
        }

        onProgress?.(progress);
      }

      progress.status = 'completed';
      onProgress?.(progress);
      return progress;
    } catch (err: any) {
      console.error('[GoogleDriveService] Backup process failed:', err);
      progress.status = 'error';
      progress.errorMessage = err?.message || 'Failed to backup files to Google Drive';
      onProgress?.(progress);
      throw err;
    }
  }
}
