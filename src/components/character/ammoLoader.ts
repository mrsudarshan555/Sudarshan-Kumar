/**
 * Ammo.js Loader for MMD Native Physics Simulation
 * Loads Bullet physics engine compiled to WebAssembly for hair, cloth, and accessory rigid bodies.
 */

let ammoPromise: Promise<any> | null = null;

export function isAmmoReady(): boolean {
  return typeof window !== 'undefined' && 
    !!(window as any).Ammo && 
    typeof (window as any).Ammo.btVector3 === 'function';
}

export async function getAmmo(): Promise<any> {
  if (typeof window === 'undefined') return null;

  // Already initialized instance
  if (isAmmoReady()) {
    return (window as any).Ammo;
  }

  if (ammoPromise) return ammoPromise;

  ammoPromise = new Promise(async (resolve) => {
    try {
      // 1. Ensure Ammo script is in DOM if not already present
      if (typeof (window as any).Ammo !== 'function' && !isAmmoReady()) {
        await new Promise((res) => {
          const script = document.createElement('script');
          script.src = '/libs/ammo/ammo.wasm.js';
          script.async = true;
          script.onload = () => res(true);
          script.onerror = (e) => {
            console.warn('[AmmoLoader] Failed to load local ammo.wasm.js, attempting CDN fallback', e);
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/ammo.wasm.js';
            cdnScript.async = true;
            cdnScript.onload = () => res(true);
            cdnScript.onerror = () => {
              console.error('[AmmoLoader] CDN fallback also failed.');
              res(false);
            };
            document.head.appendChild(cdnScript);
          };
          document.head.appendChild(script);
        });
      }

      // 2. Call factory function
      const AmmoFactory = (window as any).Ammo;
      if (typeof AmmoFactory === 'function') {
        const ammoInstance = await AmmoFactory({
          locateFile: (wasmPath: string) => {
            if (wasmPath.endsWith('.wasm')) {
              return '/libs/ammo/ammo.wasm.wasm';
            }
            return wasmPath;
          }
        });

        (window as any).Ammo = ammoInstance;
        if (typeof globalThis !== 'undefined') {
          (globalThis as any).Ammo = ammoInstance;
        }
        console.log('[AmmoLoader] Ammo initialized successfully! btVector3 ready.');
        resolve(ammoInstance);
      } else if (isAmmoReady()) {
        if (typeof globalThis !== 'undefined') {
          (globalThis as any).Ammo = (window as any).Ammo;
        }
        resolve((window as any).Ammo);
      } else {
        console.warn('[AmmoLoader] Ammo factory not found on window object.');
        resolve(null);
      }
    } catch (err) {
      console.warn('[AmmoLoader] Error during Ammo initialization:', err);
      resolve(null);
    }
  });

  return ammoPromise;
}

// Proactively initiate Ammo loading in browser
if (typeof window !== 'undefined') {
  getAmmo().catch((e) => console.warn('[AmmoLoader] Background prefetch notice:', e));
}

