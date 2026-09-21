const REMOTE_BACKEND_URL = 'https://ais-pre-gd2s6u2gwklbs7eaxfbldv-686105212526.asia-east1.run.app';

export function isCapacitorOrNative(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Explicit native bridges
  const isCap = !!(window as any).Capacitor;
  const isCordova = !!(window as any).cordova;
  const isAndroidBridge = !!(window as any).Android || !!(window as any).AndroidBridge;
  
  // Protocol checks for packaged APKs / WebViews
  const proto = window.location.protocol;
  const isCustomProtocol = proto === 'capacitor:' || proto === 'ionic:' || proto === 'file:' || proto === 'app:' || proto === 'content:';
  
  // Origin checks (in file:// or custom WebView origins often 'null' or empty)
  const isNullOrigin = window.location.origin === 'null' || window.location.origin === 'file://' || !window.location.origin;
  
  // Hostname check: if not running on Cloud Run (*.run.app) and not the local dev port (localhost:3000)
  const host = window.location.host;
  const isCloudRun = window.location.hostname.endsWith('run.app');
  const isLocalDevServer = window.location.hostname === 'localhost' && window.location.port === '3000';
  
  // Android WebView UserAgent indicators (e.g. '; wv', 'Version/4.0')
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android.*(wv|\.0\.0\.0)/.test(ua) || (ua.includes('Android') && !isCloudRun && !isLocalDevServer);

  return isCap || isCordova || isAndroidBridge || isCustomProtocol || isNullOrigin || isAndroidWebView || (!isCloudRun && !isLocalDevServer);
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

