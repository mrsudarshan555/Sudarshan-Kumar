/**
 * Kinetic Multi-Touch Gesture Physics Engine (Phase H)
 * 
 * Ported from barehands-main: stage.html & server.py
 * 
 * Features:
 * - 60 FPS spatial transform loop using Hardware-Accelerated translate3d.
 * - Raycast Hit-Testing against spatial cards using Hand Landmarks 4 (Thumb) & 8 (Index).
 * - Velocity tracking on pinch drag & kinetic throw/fling with decay (V *= 0.92).
 * - Bimanual Two-Hand Zoom scaling.
 * - Integration with GestureEventBus for GESTURE_CLAP_CLEAR (workspace flush) & GESTURE_FIST_HOLD (kinetic freeze).
 * 
 * Console Outputs:
 * `[StageCanvas] Canvas initialized -> 60 FPS Kinetic Engine Active`
 * `[StagePhysics] Grab detected -> Card bound to Hand Landmark 8`
 * `[StagePhysics] Throw executed -> Decay active (V: x, y)`
 * `[StageCanvas] Workspace cleared via Clap`
 */

import { SpatialCard, StageParticle, StageCanvasConfig } from './types';
import { GestureEventBus } from '../gestures/gestureEventBus';
import { BarehandsTracker } from '../gestures/barehandsTracker';
import { BarehandsGestureState, DetectedHand } from '../../types/gestures';

export class StagePhysicsEngine {
  private static instance: StagePhysicsEngine | null = null;

  private cards: Map<string, SpatialCard> = new Map();
  private particles: StageParticle[] = [];
  private config: StageCanvasConfig = {
    isOpen: false,
    gravity: 0,
    friction: 0.92, // 0.92 decay factor per frame
    throwVelocityThreshold: 1.2, // 1.2 px/ms release velocity
    isFrozen: false,
    showGrid: true,
    enableSoundEffects: true
  };

  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;

  // Hand tracking state
  private activeGrabbedCardId: string | null = null;
  private grabOffset: { x: number; y: number } = { x: 0, y: 0 };
  private velocityHistory: Array<{ x: number; y: number; time: number }> = [];

  // Listeners for UI state synchronizations
  private cardListeners: Set<(cards: SpatialCard[]) => void> = new Set();
  private particleListeners: Set<(particles: StageParticle[]) => void> = new Set();
  private configListeners: Set<(config: StageCanvasConfig) => void> = new Set();

  private unsubTracker: (() => void) | null = null;
  private unsubClap: (() => void) | null = null;
  private unsubFist: (() => void) | null = null;
  private unsubClaw: (() => void) | null = null;
  private unsubHoldRotate: (() => void) | null = null;
  private unsubExplode: (() => void) | null = null;
  private unsubFlick: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): StagePhysicsEngine {
    if (!this.instance) {
      this.instance = new StagePhysicsEngine();
    }
    return this.instance;
  }

  /**
   * Initializes the 60 FPS Kinetic Physics Loop & Event Subscriptions
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[StageCanvas] Canvas initialized -> 60 FPS Kinetic Engine Active`);

    // Subscribe to BarehandsTracker hand telemetry
    const tracker = BarehandsTracker.getInstance();
    this.unsubTracker = tracker.subscribe((state: BarehandsGestureState) => {
      this.handleHandState(state);
    });

    // Subscribe to Physical Gesture Events
    const gestureBus = GestureEventBus.getInstance();

    // 1. Clap to Clear Workspace
    this.unsubClap = gestureBus.on('GESTURE_CLAP_CLEAR', () => {
      this.handleClapClear();
    });

    // 2. Fist Hold Kinetic Freeze
    this.unsubFist = gestureBus.on('GESTURE_FIST_HOLD', (payload) => {
      if (payload.isHolding) {
        this.freezeWorkspace();
      } else {
        this.unfreezeWorkspace();
      }
    });

    // 3. Claw Force-Pull
    this.unsubClaw = gestureBus.on('GESTURE_CLAW_FORCE_PULL', (payload) => {
      this.handleClawForcePull(payload);
    });

    // 4. Hold-to-Rotate 3D
    this.unsubHoldRotate = gestureBus.on('GESTURE_HOLD_TO_ROTATE', (payload) => {
      this.handleHoldToRotate(payload);
    });

    // 5. Explode Scrub
    this.unsubExplode = gestureBus.on('GESTURE_EXPLODE_SCRUB', (payload) => {
      this.handleExplodeScrub(payload);
    });

    // 6. Flick to Dismiss
    this.unsubFlick = gestureBus.on('GESTURE_FLICK_DISMISS', (payload) => {
      this.handleFlickDismiss(payload);
    });

    // Start 60 FPS Render Loop
    this.lastFrameTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.unsubTracker) {
      this.unsubTracker();
      this.unsubTracker = null;
    }
    if (this.unsubClap) {
      this.unsubClap();
      this.unsubClap = null;
    }
    if (this.unsubFist) {
      this.unsubFist();
      this.unsubFist = null;
    }
    if (this.unsubClaw) {
      this.unsubClaw();
      this.unsubClaw = null;
    }
    if (this.unsubHoldRotate) {
      this.unsubHoldRotate();
      this.unsubHoldRotate = null;
    }
    if (this.unsubExplode) {
      this.unsubExplode();
      this.unsubExplode = null;
    }
    if (this.unsubFlick) {
      this.unsubFlick();
      this.unsubFlick = null;
    }
  }

  // --------------------------------------------------------------------------
  // 60 FPS KINETIC LOOP & INERTIA SIMULATION
  // --------------------------------------------------------------------------

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // in seconds
    this.lastFrameTime = currentTime;

    if (!this.config.isFrozen) {
      this.updateCardPhysics(dt);
      this.updateParticles(dt);
    }

    this.notifyCardListeners();
    this.notifyParticleListeners();

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private updateCardPhysics(dt: number): void {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const cardsToDelete: string[] = [];

    this.cards.forEach((card) => {
      // 1. Force-Pull "Flying to Hand" Spring Animation
      if (card.isFlyingToHand) {
        const targetX = card.position.x;
        const targetY = card.position.y;
        // Fast dynamic lerp into user's hand
        card.position.x += (targetX - card.position.x) * 0.35;
        card.position.y += (targetY - card.position.y) * 0.35;
        card.rotation *= 0.8;

        this.spawnParticle(
          card.position.x + card.width / 2 + (Math.random() - 0.5) * 40,
          card.position.y + card.height / 2 + (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          '#38bdf8'
        );
        return;
      }

      // 2. Flick-to-Dismiss Kinetic Offscreen Animation
      if (card.isDismissing) {
        const dir = card.dismissVector || { vx: 25, vy: -15 };
        card.position.x += dir.vx * dt * 60;
        card.position.y += dir.vy * dt * 60;
        card.rotation += dir.vx * 0.15;
        card.scale = Math.max(0.1, card.scale * 0.94);

        this.spawnParticle(
          card.position.x + card.width / 2,
          card.position.y + card.height / 2,
          -dir.vx * 0.1 + (Math.random() - 0.5) * 4,
          -dir.vy * 0.1 + (Math.random() - 0.5) * 4,
          '#f43f5e'
        );

        // Delete card once it passes screen boundary
        if (
          card.position.x < -card.width - 100 ||
          card.position.x > screenWidth + 100 ||
          card.position.y < -card.height - 100 ||
          card.position.y > screenHeight + 100
        ) {
          cardsToDelete.push(card.id);
        }
        return;
      }

      // 3. Straining Vibration Physics for "The Claw"
      if (card.isStraining && card.strainProgress && card.strainProgress > 0) {
        const shakeAmplitude = card.strainProgress * 5.0;
        const shakeX = (Math.random() - 0.5) * shakeAmplitude;
        const shakeY = (Math.random() - 0.5) * shakeAmplitude;
        card.position.x += shakeX;
        card.position.y += shakeY;

        if (Math.random() < card.strainProgress * 0.6) {
          this.spawnParticle(
            card.position.x + card.width / 2 + (Math.random() - 0.5) * card.width,
            card.position.y + card.height / 2 + (Math.random() - 0.5) * card.height,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            '#a855f7'
          );
        }
      }

      if (card.isGrabbed) return; // Managed by hand cursor directly

      // If card has velocity, apply decay
      if (Math.abs(card.velocity.vx) > 0.05 || Math.abs(card.velocity.vy) > 0.05) {
        card.isSliding = true;
        card.position.x += card.velocity.vx * dt * 60;
        card.position.y += card.velocity.vy * dt * 60;

        // Apply friction decay (V *= 0.92)
        card.velocity.vx *= this.config.friction;
        card.velocity.vy *= this.config.friction;

        // Slight natural spin on throw
        card.rotation += card.velocity.vx * 0.08;

        // Screen boundary soft bounce / clamp
        const minX = 10;
        const maxX = Math.max(10, screenWidth - card.width * card.scale - 10);
        const minY = 60;
        const maxY = Math.max(60, screenHeight - card.height * card.scale - 60);

        if (card.position.x < minX) {
          card.position.x = minX;
          card.velocity.vx = -card.velocity.vx * 0.5;
        } else if (card.position.x > maxX) {
          card.position.x = maxX;
          card.velocity.vx = -card.velocity.vx * 0.5;
        }

        if (card.position.y < minY) {
          card.position.y = minY;
          card.velocity.vy = -card.velocity.vy * 0.5;
        } else if (card.position.y > maxY) {
          card.position.y = maxY;
          card.velocity.vy = -card.velocity.vy * 0.5;
        }

        // Spawn subtle trailing particles during fast glide
        const speed = Math.hypot(card.velocity.vx, card.velocity.vy);
        if (speed > 8 && Math.random() < 0.3) {
          this.spawnParticle(
            card.position.x + card.width / 2,
            card.position.y + card.height / 2,
            -card.velocity.vx * 0.2 + (Math.random() - 0.5) * 2,
            -card.velocity.vy * 0.2 + (Math.random() - 0.5) * 2,
            '#06b6d4'
          );
        }
      } else {
        card.velocity.vx = 0;
        card.velocity.vy = 0;
        card.isSliding = false;
        // Smoothly settle rotation to nearest 0deg when stationary
        card.rotation *= 0.85;
      }
    });

    // Clean up dismissed cards
    cardsToDelete.forEach((id) => {
      this.cards.delete(id);
    });
  }

  // --------------------------------------------------------------------------
  // ADVANCED 3D GESTURE HANDLERS: CLAW, ROTATE, EXPLODE, FLICK
  // --------------------------------------------------------------------------

  /**
   * THE CLAW (Force-Pull) Handler:
   * Finds distant card in line of sight, highlights it, shakes during strain,
   * then flies to hand on fist snap trigger.
   */
  public handleClawForcePull(payload: {
    hand: 'Left' | 'Right';
    strainDuration: number;
    strainLevel: number;
    handPosition: { x: number; y: number };
    isTriggered: boolean;
  }): void {
    const cardsList = Array.from(this.cards.values());
    if (cardsList.length === 0) return;

    if (!payload.isTriggered) {
      // 1. Find card closest to hand aim raycast
      let closestCard: SpatialCard | null = null;
      let minDistance = Infinity;

      for (const card of cardsList) {
        const cardCenterX = card.position.x + (card.width * card.scale) / 2;
        const cardCenterY = card.position.y + (card.height * card.scale) / 2;
        const dist = Math.hypot(cardCenterX - payload.handPosition.x, cardCenterY - payload.handPosition.y);

        if (dist < minDistance) {
          minDistance = dist;
          closestCard = card;
        }
      }

      // Reset other cards
      cardsList.forEach((c) => {
        if (c !== closestCard) {
          c.isClawTarget = false;
          c.isStraining = false;
          c.strainProgress = 0;
        }
      });

      if (closestCard) {
        closestCard.isClawTarget = true;
        closestCard.isStraining = payload.strainLevel > 0.15;
        closestCard.strainProgress = payload.strainLevel;
      }
    } else {
      // 2. TRIGGER SNAP: Force-Pull locked target into user's hand!
      const targetCard = cardsList.find((c) => c.isClawTarget) || cardsList[0];
      if (targetCard) {
        console.log(`[StagePhysics] Force-Pulling card "${targetCard.title}" directly to hand!`);
        targetCard.isClawTarget = false;
        targetCard.isStraining = false;
        targetCard.strainProgress = 0;
        targetCard.isFlyingToHand = false;

        // Position card directly at hand location
        targetCard.position.x = payload.handPosition.x - (targetCard.width * targetCard.scale) / 2;
        targetCard.position.y = payload.handPosition.y - (targetCard.height * targetCard.scale) / 2;
        targetCard.isGrabbed = true;
        this.activeGrabbedCardId = targetCard.id;
        this.grabOffset = {
          x: (targetCard.width * targetCard.scale) / 2,
          y: (targetCard.height * targetCard.scale) / 2
        };

        // Big particle ripple celebration
        this.spawnParticleBurst(payload.handPosition.x, payload.handPosition.y, '#38bdf8', 20);
        this.spawnParticleBurst(payload.handPosition.x, payload.handPosition.y, '#a855f7', 15);
      }
    }
    this.notifyCardListeners();
  }

  /**
   * HOLD-TO-ROTATE (3D Euler Rotation While Carrying)
   */
  public handleHoldToRotate(payload: {
    rotationDelta: { pitch: number; yaw: number; roll: number };
    isActive: boolean;
  }): void {
    if (!this.activeGrabbedCardId) return;

    const card = this.cards.get(this.activeGrabbedCardId);
    if (!card) return;

    card.is3DRotating = payload.isActive;
    if (!card.rotation3D) {
      card.rotation3D = { pitch: 0, yaw: 0, roll: 0 };
    }

    card.rotation3D.pitch = (card.rotation3D.pitch + payload.rotationDelta.pitch) % 360;
    card.rotation3D.yaw = (card.rotation3D.yaw + payload.rotationDelta.yaw) % 360;
    card.rotation3D.roll = (card.rotation3D.roll + payload.rotationDelta.roll) % 360;

    this.notifyCardListeners();
  }

  /**
   * EXPLODE SCRUB (3D Model Part Assembly / Disassembly)
   */
  public handleExplodeScrub(payload: {
    progress: number;
    direction: 'expand' | 'assemble';
  }): void {
    this.cards.forEach((card) => {
      if (card.type === 'airlock_model_3d' || card.type === 'airlock_hologram' || card.modelData) {
        if (!card.modelData) {
          card.modelData = {
            modelId: card.id,
            name: card.title,
            parts: [],
            explodeProgress: payload.progress,
            isExploding: payload.progress > 0.05,
            hologramEffect: card.type === 'airlock_hologram',
            autoRotateSpeed: 0.5
          };
        } else {
          card.modelData.explodeProgress = payload.progress;
          card.modelData.isExploding = payload.progress > 0.05;
        }

        // Particle spark along parts
        if (Math.random() < 0.25) {
          this.spawnParticle(
            card.position.x + card.width / 2 + (Math.random() - 0.5) * 120,
            card.position.y + card.height / 2 + (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            payload.direction === 'expand' ? '#06b6d4' : '#10b981'
          );
        }
      }
    });
    this.notifyCardListeners();
  }

  /**
   * FLICK (Throw to Dismiss)
   */
  public handleFlickDismiss(payload: {
    direction: { x: number; y: number };
    velocity: number;
    releasePosition: { x: number; y: number };
  }): void {
    const cardsList = Array.from(this.cards.values());
    if (cardsList.length === 0) return;

    // Find card closest to release point
    let targetCard: SpatialCard | null = null;
    let minDistance = Infinity;

    for (const card of cardsList) {
      const cardCenterX = card.position.x + (card.width * card.scale) / 2;
      const cardCenterY = card.position.y + (card.height * card.scale) / 2;
      const dist = Math.hypot(cardCenterX - payload.releasePosition.x, cardCenterY - payload.releasePosition.y);

      if (dist < minDistance && dist < 350) {
        minDistance = dist;
        targetCard = card;
      }
    }

    if (!targetCard && this.activeGrabbedCardId) {
      targetCard = this.cards.get(this.activeGrabbedCardId) || null;
    }

    if (targetCard) {
      console.log(`[StagePhysics] Flick Dismissing card "${targetCard.title}" offscreen!`);
      targetCard.isGrabbed = false;
      targetCard.isDismissing = true;
      const speed = Math.max(28, payload.velocity / 30);
      targetCard.dismissVector = {
        vx: payload.direction.x * speed,
        vy: payload.direction.y * speed
      };
      if (this.activeGrabbedCardId === targetCard.id) {
        this.activeGrabbedCardId = null;
      }
      this.spawnParticleBurst(targetCard.position.x + targetCard.width / 2, targetCard.position.y + targetCard.height / 2, '#f43f5e', 16);
      this.notifyCardListeners();
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt * 60;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // MEDIA-PIPE HAND INTERACTION & RAYCAST HIT-TESTING
  // --------------------------------------------------------------------------

  public handleHandState(state: BarehandsGestureState): void {
    if (!state.isActive || state.hands.length === 0) {
      if (this.activeGrabbedCardId) {
        this.releaseGrabbedCard();
      }
      return;
    }

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const primaryHand = state.hands[0];
    const indexTip = primaryHand.landmarks[8] || primaryHand.indexTip;
    const thumbTip = primaryHand.landmarks[4] || primaryHand.thumbTip;

    if (!indexTip) return;

    // Convert normalized [0, 1] landmark to screen pixel coordinates
    const handX = (1 - indexTip.x) * screenWidth; // Mirrored for natural selfie view
    const handY = indexTip.y * screenHeight;

    // 1. PINCH-TO-GRAB (Thumb & Index within pinch threshold)
    const isPinching = primaryHand.isPinching || (thumbTip && Math.hypot((1 - thumbTip.x) * screenWidth - handX, thumbTip.y * screenHeight - handY) < 65);

    if (isPinching) {
      if (!this.activeGrabbedCardId) {
        // Perform raycast hit test
        const hitCard = this.hitTest(handX, handY);
        if (hitCard) {
          this.activeGrabbedCardId = hitCard.id;
          hitCard.isGrabbed = true;
          hitCard.velocity = { vx: 0, vy: 0 };
          this.grabOffset = {
            x: handX - hitCard.position.x,
            y: handY - hitCard.position.y
          };
          this.velocityHistory = [{ x: handX, y: handY, time: performance.now() }];

          console.log(`[StagePhysics] Grab detected -> Card bound to Hand Landmark 8`);

          // Spawn grab particle ripple
          this.spawnParticleBurst(handX, handY, '#22d3ee', 8);
        }
      } else {
        // Drag active grabbed card
        const card = this.cards.get(this.activeGrabbedCardId);
        if (card) {
          card.position.x = handX - this.grabOffset.x;
          card.position.y = handY - this.grabOffset.y;

          // Track velocity buffer for fling calculation
          const now = performance.now();
          this.velocityHistory.push({ x: handX, y: handY, time: now });
          if (this.velocityHistory.length > 5) {
            this.velocityHistory.shift();
          }
        }
      }
    } else {
      // Pinch released
      if (this.activeGrabbedCardId) {
        this.releaseGrabbedCard();
      }
    }

    // 2. TWO-HAND BIMANUAL ZOOM
    if (state.hands.length >= 2 && state.twoHandScaleDelta && state.twoHandScaleDelta !== 1.0) {
      if (this.activeGrabbedCardId) {
        const card = this.cards.get(this.activeGrabbedCardId);
        if (card) {
          card.scale = Math.max(0.6, Math.min(2.5, card.scale * state.twoHandScaleDelta));
        }
      }
    }
  }

  /**
   * Raycasts point (x, y) against all active spatial cards (topmost z-index first)
   */
  public hitTest(x: number, y: number): SpatialCard | null {
    const sortedCards = Array.from(this.cards.values()).sort((a, b) => b.position.z - a.position.z);

    for (const card of sortedCards) {
      const cardWidth = card.width * card.scale;
      const cardHeight = card.height * card.scale;

      if (
        x >= card.position.x &&
        x <= card.position.x + cardWidth &&
        y >= card.position.y &&
        y <= card.position.y + cardHeight
      ) {
        return card;
      }
    }
    return null;
  }

  /**
   * Releases currently grabbed card, calculating release velocity and fling inertia
   */
  public releaseGrabbedCard(): void {
    if (!this.activeGrabbedCardId) return;

    const card = this.cards.get(this.activeGrabbedCardId);
    this.activeGrabbedCardId = null;

    if (!card) return;
    card.isGrabbed = false;

    // Calculate instantaneous release velocity from history buffer
    if (this.velocityHistory.length >= 2) {
      const first = this.velocityHistory[0];
      const last = this.velocityHistory[this.velocityHistory.length - 1];
      const dt = (last.time - first.time) || 1;
      const vx = ((last.x - first.x) / dt) * 16; // scaled to 60fps unit
      const vy = ((last.y - first.y) / dt) * 16;
      const speed = Math.hypot(vx, vy);

      if (speed >= this.config.throwVelocityThreshold) {
        card.velocity = { vx, vy };
        card.isSliding = true;
        console.log(`[StagePhysics] Throw executed -> Decay active (V: ${vx.toFixed(2)}, ${vy.toFixed(2)})`);
        this.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#38bdf8', 12);
      } else {
        card.velocity = { vx: 0, vy: 0 };
        card.isSliding = false;
      }
    }
    this.velocityHistory = [];
  }

  // --------------------------------------------------------------------------
  // GESTURE ACTIONS: CLAP CLEAR & FIST HOLD
  // --------------------------------------------------------------------------

  public handleClapClear(): void {
    console.log(`[StageCanvas] Workspace cleared via Clap`);

    // Particle burst on all cards before removing
    this.cards.forEach((card) => {
      this.spawnParticleBurst(
        card.position.x + card.width / 2,
        card.position.y + card.height / 2,
        '#f43f5e',
        16
      );
    });

    // Clear non-pinned cards
    const retainedCards = new Map<string, SpatialCard>();
    this.cards.forEach((card, id) => {
      if (card.isPinned) {
        retainedCards.set(id, card);
      }
    });

    this.cards = retainedCards;
    this.activeGrabbedCardId = null;
    this.notifyCardListeners();
  }

  public freezeWorkspace(): void {
    this.config.isFrozen = true;
    this.cards.forEach((card) => {
      card.velocity = { vx: 0, vy: 0 };
      card.isSliding = false;
    });
    this.notifyConfigListeners();
    console.log(`[StagePhysics] Fist Hold -> Workspace motion frozen`);
  }

  public unfreezeWorkspace(): void {
    this.config.isFrozen = false;
    this.notifyConfigListeners();
  }

  // --------------------------------------------------------------------------
  // PARTICLE EMITTER
  // --------------------------------------------------------------------------

  public spawnParticle(x: number, y: number, vx: number, vy: number, color: string): void {
    this.particles.push({
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x,
      y,
      vx,
      vy,
      life: 25,
      maxLife: 25,
      color,
      size: Math.random() * 3 + 2
    });
  }

  public spawnParticleBurst(x: number, y: number, color: string, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color
      );
    }
  }

  // --------------------------------------------------------------------------
  // CARD & CONFIG MANAGEMENT
  // --------------------------------------------------------------------------

  public setCards(cardsList: SpatialCard[]): void {
    this.cards.clear();
    cardsList.forEach((c) => this.cards.set(c.id, c));
    this.notifyCardListeners();
  }

  public addCard(card: SpatialCard): void {
    this.cards.set(card.id, card);
    this.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#a855f7', 12);
    this.notifyCardListeners();
  }

  public removeCard(id: string): void {
    const card = this.cards.get(id);
    if (card) {
      this.spawnParticleBurst(card.position.x + card.width / 2, card.position.y + card.height / 2, '#f43f5e', 8);
    }
    this.cards.delete(id);
    if (this.activeGrabbedCardId === id) {
      this.activeGrabbedCardId = null;
    }
    this.notifyCardListeners();
  }

  public getCards(): SpatialCard[] {
    return Array.from(this.cards.values());
  }

  public getParticles(): StageParticle[] {
    return this.particles;
  }

  public getConfig(): StageCanvasConfig {
    return { ...this.config };
  }

  public setConfig(configUpdate: Partial<StageCanvasConfig>): void {
    this.config = { ...this.config, ...configUpdate };
    this.notifyConfigListeners();
  }

  // --------------------------------------------------------------------------
  // LISTENER SUBSCRIPTIONS
  // --------------------------------------------------------------------------

  public subscribeCards(listener: (cards: SpatialCard[]) => void): () => void {
    this.cardListeners.add(listener);
    listener(this.getCards());
    return () => this.cardListeners.delete(listener);
  }

  public subscribeParticles(listener: (particles: StageParticle[]) => void): () => void {
    this.particleListeners.add(listener);
    return () => this.particleListeners.delete(listener);
  }

  public subscribeConfig(listener: (config: StageCanvasConfig) => void): () => void {
    this.configListeners.add(listener);
    listener(this.getConfig());
    return () => this.configListeners.delete(listener);
  }

  private notifyCardListeners(): void {
    const cards = this.getCards();
    this.cardListeners.forEach((l) => l(cards));
  }

  private notifyParticleListeners(): void {
    this.particleListeners.forEach((l) => l(this.particles));
  }

  private notifyConfigListeners(): void {
    this.configListeners.forEach((l) => l(this.getConfig()));
  }
}
