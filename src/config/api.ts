const REMOTE_BACKEND_URL = 'https://ais-pre-gd2s6u2gwklbs7eaxfbldv-686105212526.asia-east1.run.app';

export function isCapacitorOrNative(): boolean {
  if (typeof window === 'undefined') return false;
  const isCap = !!(window as any).Capacitor;
  const isCapProtocol = window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:';
  const isAndroidLocal = window.location.hostname === 'localhost' && window.location.port === '';
  return isCap || isCapProtocol || isAndroidLocal;
}

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (isCapacitorOrNative()) {
    return REMOTE_BACKEND_URL;
  }
  return '';
}

export const API_BASE_URL = getApiBaseUrl();

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function getWebSocketUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (isCapacitorOrNative()) {
    return `wss://ais-pre-gd2s6u2gwklbs7eaxfbldv-686105212526.asia-east1.run.app${normalizedPath}`;
  }
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  return `${protocol}//${host}${normalizedPath}`;
}

