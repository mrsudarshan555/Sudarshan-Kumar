import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MayraErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MayraErrorBoundary] Caught rendering exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    // A state-only reset does not remount a crashed React subtree. Force a real
    // WebView/page reload so transient render/runtime state is recreated cleanly.
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('mayra_error_boundary_recovery_attempted');
      }
    } catch {
      // Ignore storage failures.
    }

    if (this.props.onReset) {
      this.props.onReset();
    }

    if (typeof window !== 'undefined') {
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public componentDidMount() {
    // Clear a one-time automatic recovery marker only after the app has stayed
    // mounted for a few seconds. This prevents an endless reload loop while
    // still recovering from transient WebView/WebGL startup faults.
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.setTimeout(() => {
          try {
            window.sessionStorage.removeItem('mayra_error_boundary_recovery_attempted');
          } catch {
            // Ignore storage failures.
          }
        }, 10000);
      }
    } catch {
      // Ignore storage failures.
    }
  }

  public render() {
    // Keep the crash boundary invisible. If a child component throws, do not
    // replace the Mayra UI with a custom error/retry screen. The exception is
    // still logged above for diagnostics, while React renders an empty fallback.
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}
