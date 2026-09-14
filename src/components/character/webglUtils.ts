import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as THREE from 'three';

let cachedWebGLSupport: boolean | null = null;

/**
 * Checks if the current browser environment can successfully obtain a WebGL / WebGL2 context.
 * Uses safe attributes (powerPreference: 'default', failIfMajorPerformanceCaveat: false)
 * to avoid context rejection on integrated GPUs, virtualized runtimes, and sandboxed iframes.
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (cachedWebGLSupport !== null) {
    return cachedWebGLSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const safeAttributes: WebGLContextAttributes = {
      alpha: true,
      antialias: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false
    };

    // Test WebGL2 first
    let gl: RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', safeAttributes);
    } catch {
      // Ignored
    }

    // Test WebGL1 fallback
    if (!gl) {
      try {
        gl = canvas.getContext('webgl', safeAttributes) ||
             canvas.getContext('experimental-webgl', safeAttributes);
      } catch {
        // Ignored
      }
    }

    const isAvailable = Boolean(gl);

    // Clean up test context if created
    if (gl) {
      const ext = (gl as WebGLRenderingContext | WebGL2RenderingContext).getExtension('WEBGL_lose_context');
      if (ext) {
        ext.loseContext();
      }
    }

    cachedWebGLSupport = isAvailable;
    return isAvailable;
  } catch (err) {
    console.warn('[WebGLUtils] Error probing WebGL support:', err);
    cachedWebGLSupport = false;
    return false;
  }
}

/**
 * Creates a Three.js WebGLRenderer safely with progressive attribute fallbacks.
 * Replaces hardcoded `powerPreference: 'high-performance'` which fails on many
 * systems with "Error creating WebGL context with your selected attributes".
 */
export function createSafeWebGLRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const configs: THREE.WebGLRendererParameters[] = [
    {
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false
    },
    {
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false
    },
    {
      canvas,
      alpha: true,
      failIfMajorPerformanceCaveat: false
    }
  ];

  let lastError: any = null;
  for (const config of configs) {
    try {
      const renderer = new THREE.WebGLRenderer(config);
      return renderer;
    } catch (e: any) {
      lastError = e;
      console.warn('[WebGLUtils] WebGLRenderer tier failed, attempting fallback configuration...', e?.message || e);
    }
  }

  throw lastError || new Error('Failed to create WebGL context with available attributes');
}

interface WebGLBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}

interface WebGLBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Error boundary that specifically catches Three.js / WebGL context creation failures
 * and displays a graceful fallback (like MayraOrb) without crashing the application.
 */
export class WebGLFallbackBoundary extends Component<WebGLBoundaryProps, WebGLBoundaryState> {
  constructor(props: WebGLBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): WebGLBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'WebGL context error'
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('[WebGLFallbackBoundary] Caught WebGL initialization error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
