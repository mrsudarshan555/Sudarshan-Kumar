import { openDB, IDBPDatabase } from 'idb';
import { PMX_MODEL_URL } from '../character/pmxModelLoader';

export interface CharacterModelEntry {
  id: string;
  name: string;
  description: string;
  format: 'PMX' | 'GLB' | 'gLTF' | 'VRM';
  sourceType: 'built_in' | 'cloud_cdn' | 'local_storage' | 'custom_url';
  url: string;
  thumbnail?: string;
  sizeBytes?: number;
  sizeDisplay?: string;
  hasPhysics?: boolean;
  hasFacialMorphs?: boolean;
  dateAdded: number;
  isCustom?: boolean;
}

const STORAGE_ACTIVE_MODEL_KEY = 'mayra_active_3d_model_id';
const STORAGE_CUSTOM_MODELS_KEY = 'mayra_custom_3d_models_list';
const DB_NAME = 'mayra_3d_models_db';
const STORE_NAME = 'models_blobs';

// Curated built-in and Cloud CDN models (APK size stays tiny - loaded on demand)
export const DEFAULT_CATALOG_MODELS: CharacterModelEntry[] = [
  {
    id: 'evelyn_pmx_prime',
    name: 'Evelyn Prime (Default)',
    description: 'Original high-fidelity MMD character with MMD dynamic physics and expressive facial morphs.',
    format: 'PMX',
    sourceType: 'built_in',
    url: PMX_MODEL_URL,
    sizeDisplay: '~4.8 MB',
    hasPhysics: true,
    hasFacialMorphs: true,
    dateAdded: Date.now()
  },
  {
    id: 'cyber_mayra_glb',
    name: 'Cyber Maya (GLB Cloud)',
    description: 'Ultra-optimized PBR humanoid avatar. Instant loading, low battery consumption.',
    format: 'GLB',
    sourceType: 'cloud_cdn',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    sizeDisplay: '~1.2 MB',
    hasPhysics: false,
    hasFacialMorphs: false,
    dateAdded: Date.now()
  },
  {
    id: 'robot_companion_glb',
    name: 'StonicX Mech Bot (GLB Cloud)',
    description: 'Futuristic AI assistant robot mesh with cybernetic emissive nodes.',
    format: 'GLB',
    sourceType: 'cloud_cdn',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    sizeDisplay: '~850 KB',
    hasPhysics: false,
    hasFacialMorphs: false,
    dateAdded: Date.now()
  }
];

class CharacterModelManagerService {
  private static instance: CharacterModelManagerService;
  private activeModel: CharacterModelEntry;
  private models: CharacterModelEntry[] = [];
  private activeListeners: Set<(model: CharacterModelEntry) => void> = new Set();
  private listListeners: Set<(models: CharacterModelEntry[]) => void> = new Set();
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private constructor() {
    this.models = [...DEFAULT_CATALOG_MODELS];
    this.loadCustomModelsMetadata();
    
    const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ACTIVE_MODEL_KEY) : null;
    const found = this.models.find(m => m.id === savedActiveId);
    this.activeModel = found || this.models[0];
  }

  public static getInstance(): CharacterModelManagerService {
    if (!CharacterModelManagerService.instance) {
      CharacterModelManagerService.instance = new CharacterModelManagerService();
    }
    return CharacterModelManagerService.instance;
  }

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        }
      });
    }
    return this.dbPromise;
  }

  private loadCustomModelsMetadata() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_MODELS_KEY);
      if (raw) {
        const parsed: CharacterModelEntry[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Merge custom models
          this.models = [...DEFAULT_CATALOG_MODELS, ...parsed];
        }
      }
    } catch (err) {
      console.warn('[CharacterModelManager] Error loading custom models metadata:', err);
    }
  }

  private saveCustomModelsMetadata() {
    if (typeof window === 'undefined') return;
    try {
      const customs = this.models.filter(m => m.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_MODELS_KEY, JSON.stringify(customs));
    } catch (err) {
      console.warn('[CharacterModelManager] Error saving custom models metadata:', err);
    }
  }

  public getActiveModel(): CharacterModelEntry {
    return this.activeModel;
  }

  public getAvailableModels(): CharacterModelEntry[] {
    return [...this.models];
  }

  public subscribeActiveModel(callback: (model: CharacterModelEntry) => void): () => void {
    this.activeListeners.add(callback);
    callback(this.activeModel);
    return () => {
      this.activeListeners.delete(callback);
    };
  }

  public subscribeModelList(callback: (models: CharacterModelEntry[]) => void): () => void {
    this.listListeners.add(callback);
    callback(this.getAvailableModels());
    return () => {
      this.listListeners.delete(callback);
    };
  }

  public async setActiveModel(modelId: string): Promise<boolean> {
    const target = this.models.find(m => m.id === modelId);
    if (!target) return false;

    // If local storage blob model, resolve the blob URL from IndexedDB if needed
    if (target.sourceType === 'local_storage' && target.url.startsWith('idb://')) {
      const dbKey = target.url.replace('idb://', '');
      try {
        const db = await this.getDb();
        const blob = await db.get(STORE_NAME, dbKey);
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          this.activeModel = {
            ...target,
            url: objectUrl
          };
        } else {
          this.activeModel = target;
        }
      } catch (e) {
        console.warn('[CharacterModelManager] Failed to retrieve blob from IndexedDB:', e);
        this.activeModel = target;
      }
    } else {
      this.activeModel = target;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_MODEL_KEY, target.id);
    }

    this.notifyActiveChanged();
    return true;
  }

  public async importModelFromDevice(file: File): Promise<CharacterModelEntry> {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'GLB';
    const format: 'PMX' | 'GLB' | 'gLTF' | 'VRM' = 
      ext === 'PMX' ? 'PMX' : ext === 'VRM' ? 'VRM' : ext === 'GLTF' ? 'gLTF' : 'GLB';
    
    const id = `custom_local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const dbKey = `blob_${id}`;

    // Store File in IndexedDB so APK size remains ZERO and user device storage is used
    const db = await this.getDb();
    await db.put(STORE_NAME, file, dbKey);

    const objectUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const newEntry: CharacterModelEntry = {
      id,
      name: cleanName,
      description: `Phone Storage Model (${ext}) — Cached locally with zero APK size overhead`,
      format,
      sourceType: 'local_storage',
      url: objectUrl,
      sizeBytes: file.size,
      sizeDisplay: `~${sizeMb} MB`,
      hasPhysics: format === 'PMX',
      hasFacialMorphs: true,
      dateAdded: Date.now(),
      isCustom: true
    };

    this.models.push(newEntry);
    this.saveCustomModelsMetadata();
    this.notifyListChanged();

    // Auto-activate the newly imported model
    await this.setActiveModel(newEntry.id);
    return newEntry;
  }

  public async importModelFromUrl(name: string, url: string, customFormat?: string): Promise<CharacterModelEntry> {
    const cleanUrl = url.trim();
    let format: 'PMX' | 'GLB' | 'gLTF' | 'VRM' = 'GLB';
    const lower = cleanUrl.toLowerCase();
    if (lower.endsWith('.pmx') || customFormat === 'PMX') format = 'PMX';
    else if (lower.endsWith('.vrm') || customFormat === 'VRM') format = 'VRM';
    else if (lower.endsWith('.gltf') || customFormat === 'gLTF') format = 'gLTF';
    else format = 'GLB';

    const id = `custom_url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: CharacterModelEntry = {
      id,
      name: name.trim() || `Cloud 3D Model (${format})`,
      description: `Direct Cloud Link: ${cleanUrl.slice(0, 42)}...`,
      format,
      sourceType: 'custom_url',
      url: cleanUrl,
      sizeDisplay: 'Streamed',
      hasPhysics: format === 'PMX',
      hasFacialMorphs: true,
      dateAdded: Date.now(),
      isCustom: true
    };

    this.models.push(newEntry);
    this.saveCustomModelsMetadata();
    this.notifyListChanged();

    // Auto-activate
    await this.setActiveModel(newEntry.id);
    return newEntry;
  }

  public async deleteCustomModel(modelId: string): Promise<boolean> {
    const idx = this.models.findIndex(m => m.id === modelId && m.isCustom);
    if (idx === -1) return false;

    const [deleted] = this.models.splice(idx, 1);
    this.saveCustomModelsMetadata();

    // Clean up IndexedDB if local blob
    if (deleted.sourceType === 'local_storage') {
      try {
        const db = await this.getDb();
        await db.delete(STORE_NAME, `blob_${deleted.id}`);
      } catch (e) {
        console.warn('[CharacterModelManager] Error deleting blob from IndexedDB:', e);
      }
    }

    // If deleted model was active, fallback to default
    if (this.activeModel.id === modelId) {
      await this.setActiveModel(this.models[0].id);
    } else {
      this.notifyListChanged();
    }

    return true;
  }

  private notifyActiveChanged() {
    this.activeListeners.forEach(cb => {
      try {
        cb(this.activeModel);
      } catch (e) {
        console.error('[CharacterModelManager] Error in activeListener:', e);
      }
    });
  }

  private notifyListChanged() {
    const list = this.getAvailableModels();
    this.listListeners.forEach(cb => {
      try {
        cb(list);
      } catch (e) {
        console.error('[CharacterModelManager] Error in listListener:', e);
      }
    });
  }
}

export const characterModelManager = CharacterModelManagerService.getInstance();
