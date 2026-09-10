/**
 * Mark-LII / Mark-LIII Core Port: Reversible Undo Stack
 * 
 * Based on Mark-LII `core/undo.py`
 * Acts immediately on commands, but stores reverse closures so the user can say
 * "undo", "wapas kar do", "cancel that", or click the floating Undo toast.
 */

export interface UndoEntry {
  id: string;
  label: string;
  category: 'setting' | 'memory' | 'chat' | 'system' | 'custom';
  timestamp: number;
  undoFn: () => Promise<string> | string;
  details?: string;
}

export type UndoListener = (entries: UndoEntry[], lastUndone?: string) => void;

class UndoServiceClass {
  private static instance: UndoServiceClass | null = null;
  private stack: UndoEntry[] = [];
  private readonly maxDepth: number = 15;
  private listeners: Set<UndoListener> = new Set();

  private constructor() {}

  public static getInstance(): UndoServiceClass {
    if (!this.instance) {
      this.instance = new UndoServiceClass();
    }
    return this.instance;
  }

  /**
   * Pushes a reversible action onto the undo stack
   */
  public pushUndo(
    label: string,
    undoFn: () => Promise<string> | string,
    category: UndoEntry['category'] = 'setting',
    details?: string
  ): void {
    const entry: UndoEntry = {
      id: `undo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      category,
      timestamp: Date.now(),
      undoFn,
      details
    };

    this.stack.unshift(entry);
    if (this.stack.length > this.maxDepth) {
      this.stack.pop();
    }

    console.log(`[Mark-LII Undo] Pushed reversible action: "${label}" (Total stack: ${this.stack.length})`);
    this.notifyListeners();
  }

  /**
   * Reverts the most recent action
   */
  public async undoLast(): Promise<{ success: boolean; message: string; undoneLabel?: string }> {
    if (this.stack.length === 0) {
      return {
        success: false,
        message: 'No actions to undo. (वापस करने के लिए कोई क्रिया नहीं है)'
      };
    }

    const entry = this.stack.shift()!;
    try {
      console.log(`[Mark-LII Undo] Reverting: "${entry.label}"...`);
      const result = await entry.undoFn();
      const message = result || `Reverted: ${entry.label}`;
      this.notifyListeners(entry.label);
      return {
        success: true,
        message,
        undoneLabel: entry.label
      };
    } catch (err: any) {
      console.warn(`[Mark-LII Undo] Error during undo:`, err);
      this.notifyListeners();
      return {
        success: false,
        message: `Failed to undo: ${err?.message || 'Unknown error'}`
      };
    }
  }

  public getStack(): UndoEntry[] {
    return [...this.stack];
  }

  public hasUndo(): boolean {
    return this.stack.length > 0;
  }

  public peek(): UndoEntry | null {
    return this.stack[0] || null;
  }

  public clear(): void {
    this.stack = [];
    this.notifyListeners();
  }

  public subscribe(listener: UndoListener): () => void {
    this.listeners.add(listener);
    listener([...this.stack]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(lastUndone?: string): void {
    const current = [...this.stack];
    this.listeners.forEach((l) => {
      try {
        l(current, lastUndone);
      } catch (e) {
        console.error('[Mark-LII Undo] Listener error:', e);
      }
    });
  }
}

export const UndoService = UndoServiceClass.getInstance();
