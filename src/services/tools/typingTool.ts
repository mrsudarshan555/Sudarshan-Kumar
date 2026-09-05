/**
 * Autonomous Typing Tool Service (Phase I)
 * 
 * Allows MAYRA to type autonomously into text input fields (search box, form inputs,
 * chat inputs, or any selected element) with human-like adjustable speed.
 * 
 * Speeds:
 * - 'fast': ~15ms per character (rapid automated data entry)
 * - 'normal': ~45ms per character (natural human typing cadence)
 * - 'slow': ~105ms per character (deliberate, visual demonstration typing)
 */

export type TypingSpeed = 'fast' | 'normal' | 'slow';

export interface TypingOptions {
  speed?: TypingSpeed;
  target?: 'chat_input' | 'search_input' | 'form_input' | string;
  addHumanJitter?: boolean;
  clearFirst?: boolean;
  onProgress?: (currentText: string, progress: number) => void;
  onComplete?: (finalText: string) => void;
}

export class TypingToolService {
  private static instance: TypingToolService | null = null;
  private isTyping: boolean = false;
  private cancelRequested: boolean = false;

  public static getInstance(): TypingToolService {
    if (!this.instance) {
      this.instance = new TypingToolService();
    }
    return this.instance;
  }

  public getIsTyping(): boolean {
    return this.isTyping;
  }

  public cancel(): void {
    if (this.isTyping) {
      this.cancelRequested = true;
    }
  }

  /**
   * Types text into a target input element or dispatches typing events
   */
  public async typeText(
    text: string,
    options: TypingOptions = {}
  ): Promise<{ success: boolean; typedText: string; durationMs: number }> {
    const {
      speed = 'normal',
      target = 'chat_input',
      addHumanJitter = true,
      clearFirst = false,
      onProgress,
      onComplete
    } = options;

    if (this.isTyping) {
      this.cancel();
      await new Promise(r => setTimeout(r, 60));
    }

    this.isTyping = true;
    this.cancelRequested = false;
    const startTime = performance.now();

    // Base delay per character based on speed
    const baseDelay = speed === 'fast' ? 18 : speed === 'slow' ? 110 : 48;

    // Locate DOM element if available
    let targetEl: HTMLInputElement | HTMLTextAreaElement | null = null;
    if (typeof document !== 'undefined') {
      if (target === 'chat_input') {
        targetEl = document.querySelector('input[placeholder*="Ask"], input[placeholder*="MAYRA"], input[type="text"]') as HTMLInputElement;
      } else if (target === 'search_input') {
        targetEl = document.querySelector('input[placeholder*="Search"], input[type="search"]') as HTMLInputElement;
      } else if (typeof target === 'string' && target.startsWith('#') || target.startsWith('.')) {
        targetEl = document.querySelector(target) as HTMLInputElement;
      }
    }

    if (targetEl && clearFirst) {
      targetEl.value = '';
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    let accumulatedText = clearFirst || !targetEl ? '' : targetEl.value;

    for (let i = 0; i < text.length; i++) {
      if (this.cancelRequested) {
        console.log('[TypingTool] Typing cancelled by user request');
        this.isTyping = false;
        return { success: false, typedText: accumulatedText, durationMs: performance.now() - startTime };
      }

      const char = text[i];
      accumulatedText += char;

      // Update DOM element if found
      if (targetEl) {
        targetEl.value = accumulatedText;
        targetEl.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Dispatch global window event for components listening directly to MAYRA typing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mayra-autonomous-typing', {
            detail: {
              target,
              text: accumulatedText,
              char,
              progress: (i + 1) / text.length,
              isFinished: i === text.length - 1
            }
          })
        );
      }

      if (onProgress) {
        onProgress(accumulatedText, (i + 1) / text.length);
      }

      // Calculate delay with human cadence jitter
      let delay = baseDelay;
      if (addHumanJitter) {
        // slight variance (± 30%)
        const jitter = (Math.random() - 0.5) * (baseDelay * 0.6);
        delay += jitter;

        // Realistic pause after punctuation
        if (char === '.' || char === '!' || char === '?') {
          delay += 180;
        } else if (char === ',' || char === ';' || char === ':') {
          delay += 90;
        } else if (char === ' ') {
          delay += 25;
        }
      }

      await new Promise(resolve => setTimeout(resolve, Math.max(10, delay)));
    }

    this.isTyping = false;
    const durationMs = performance.now() - startTime;

    if (onComplete) {
      onComplete(accumulatedText);
    }

    console.log(`[TypingTool] Completed typing ${text.length} chars in ${Math.round(durationMs)}ms (speed: ${speed})`);
    return { success: true, typedText: accumulatedText, durationMs };
  }
}
