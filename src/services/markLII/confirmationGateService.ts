/**
 * Mark-LII / Mark-LIII Core Port: Tamper-Proof UI Confirmation Gate
 * 
 * Based on Mark-LII `core/confirm.py`
 * 
 * Protects irreversible actions (factory reset, full memory wipe, chat purge,
 * network/reboot overrides). The LLM CANNOT forge or approve this action;
 * only physical interaction with the UI or explicit human resolution can proceed.
 */

export interface PendingConfirmation {
  id: string;
  actionKey: string;
  title: string;
  description: string;
  dangerLevel: 'warning' | 'critical';
  spokenPrompt: {
    en: string;
    hi: string;
  };
  expiresAt: number;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

export type ConfirmationListener = (current: PendingConfirmation | null) => void;

class ConfirmationGateServiceClass {
  private static instance: ConfirmationGateServiceClass | null = null;
  private pending: PendingConfirmation | null = null;
  private timeoutTimer: any = null;
  private listeners: Set<ConfirmationListener> = new Set();
  private readonly timeoutSeconds = 90;

  private constructor() {}

  public static getInstance(): ConfirmationGateServiceClass {
    if (!this.instance) {
      this.instance = new ConfirmationGateServiceClass();
    }
    return this.instance;
  }

  /**
   * Request user confirmation via UI Gate.
   * Returns immediately with the spoken instruction for the assistant.
   */
  public requestConfirmation(params: {
    actionKey: string;
    title: string;
    description: string;
    dangerLevel?: 'warning' | 'critical';
    spokenPrompt?: { en: string; hi: string };
    onConfirm: () => Promise<void> | void;
    onCancel?: () => void;
  }): { pendingId: string; spokenMessageEn: string; spokenMessageHi: string } {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    const id = `conf-${Date.now()}`;
    const dangerLevel = params.dangerLevel || 'warning';
    const spokenEn = params.spokenPrompt?.en || `Please confirm on your screen to proceed with ${params.title.toLowerCase()}.`;
    const spokenHi = params.spokenPrompt?.hi || `आगे बढ़ने के लिए कृपया स्क्रीन पर पुष्टि (Confirm) करें।`;

    this.pending = {
      id,
      actionKey: params.actionKey,
      title: params.title,
      description: params.description,
      dangerLevel,
      spokenPrompt: { en: spokenEn, hi: spokenHi },
      expiresAt: Date.now() + this.timeoutSeconds * 1000,
      onConfirm: params.onConfirm,
      onCancel: params.onCancel
    };

    console.log(`[Mark-LII Confirmation] Gate opened for: "${params.title}" (Timeout: ${this.timeoutSeconds}s)`);
    this.notifyListeners();

    // Auto-expire
    this.timeoutTimer = setTimeout(() => {
      if (this.pending?.id === id) {
        console.log(`[Mark-LII Confirmation] Expired for: "${params.title}"`);
        if (this.pending.onCancel) {
          try { this.pending.onCancel(); } catch (e) {}
        }
        this.pending = null;
        this.notifyListeners();
      }
    }, this.timeoutSeconds * 1000);

    return {
      pendingId: id,
      spokenMessageEn: spokenEn,
      spokenMessageHi: spokenHi
    };
  }

  /**
   * Called strictly when the user physically clicks "Confirm" in the UI
   */
  public async confirmPending(id: string): Promise<boolean> {
    if (!this.pending || this.pending.id !== id) return false;

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    const task = this.pending;
    this.pending = null;
    this.notifyListeners();

    try {
      console.log(`[Mark-LII Confirmation] Confirmed by user: "${task.title}"`);
      await task.onConfirm();
      return true;
    } catch (err) {
      console.error('[Mark-LII Confirmation] Error executing confirmed action:', err);
      return false;
    }
  }

  /**
   * Called when the user clicks "Cancel" or rejects
   */
  public cancelPending(id: string): boolean {
    if (!this.pending || this.pending.id !== id) return false;

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    const task = this.pending;
    this.pending = null;
    this.notifyListeners();

    if (task.onCancel) {
      try { task.onCancel(); } catch (e) {}
    }
    console.log(`[Mark-LII Confirmation] Cancelled by user: "${task.title}"`);
    return true;
  }

  public getPending(): PendingConfirmation | null {
    return this.pending;
  }

  public subscribe(listener: ConfirmationListener): () => void {
    this.listeners.add(listener);
    listener(this.pending);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const current = this.pending;
    this.listeners.forEach((l) => {
      try { l(current); } catch (e) {}
    });
  }
}

export const ConfirmationGateService = ConfirmationGateServiceClass.getInstance();
