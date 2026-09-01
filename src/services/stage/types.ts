/**
 * Types & Interfaces for Barehands Virtual Workspace & Stage Canvas (Phase H & Extended 3D Airlock)
 */

export type SpatialCardType = 
  | 'code_snippet' 
  | 'markdown_note' 
  | 'tool_card' 
  | 'terminal_runner'
  | 'airlock_image'       // Normal images (glass-card frame)
  | 'airlock_prop'        // Transparent props (borderless floating cutout)
  | 'airlock_model_3d'    // Full texture 3D model with explode scrub
  | 'airlock_hologram';   // Translucent wireframe hologram + scan-beam

export interface Model3DPart {
  id: string;
  name: string;
  color: string;
  geometry: 'box' | 'cylinder' | 'sphere' | 'ring' | 'pyramid' | 'chip';
  basePosition: { x: number; y: number; z: number };
  explodeOffset: { x: number; y: number; z: number }; // Vector along which part expands
  dimensions: { width: number; height: number; depth: number };
  wireframeOnly?: boolean;
}

export interface Model3DData {
  modelId: string;
  name: string;
  parts: Model3DPart[];
  explodeProgress: number; // 0.0 (assembled) to 1.0 (fully exploded)
  isExploding: boolean;
  hologramEffect: boolean; // Translucent cyan/purple wireframe + scan-line
  autoRotateSpeed: number;
}

export interface SpatialCard {
  id: string;
  type: SpatialCardType;
  title: string;
  content: string;
  // Media / Asset URL for image / prop / hologram
  mediaUrl?: string;
  mediaAspect?: string;
  isTransparentProp?: boolean;
  // 3D Model Data
  modelData?: Model3DData;
  // Code snippet data
  codeSnippet?: {
    language: string;
    code: string;
    filename?: string;
  };
  // Spatial 3D Coordinates
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: {
    vx: number;
    vy: number;
  };
  // 3D Euler Rotation & 2D Spin
  rotation: number; // 2D planar rotation (deg)
  rotation3D?: {
    pitch: number; // X-axis (deg)
    yaw: number;   // Y-axis (deg)
    roll: number;  // Z-axis (deg)
  };
  is3DRotating?: boolean; // Hold-to-Rotate mode active
  scale: number;
  width: number;
  height: number;
  // Interaction & Physics Flags
  isGrabbed: boolean;
  grabOffset?: { x: number; y: number };
  isPinned: boolean;
  isSliding: boolean;
  // Force-Pull "The Claw" States
  isClawTarget?: boolean;
  isStraining?: boolean;
  strainProgress?: number; // 0.0 to 1.0 (vibration level)
  isFlyingToHand?: boolean;
  // Flick to Dismiss
  isDismissing?: boolean;
  dismissVector?: { vx: number; vy: number };
  // Visual Theme
  colorTheme?: string;
  timestamp: number;
}

export interface StageParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface StageCanvasConfig {
  isOpen: boolean;
  gravity: number;
  friction: number; // 0.92 default
  throwVelocityThreshold: number; // 1.2 px/ms
  flickDismissThreshold?: number; // 2.5 px/ms
  isFrozen: boolean;
  showGrid: boolean;
  enableSoundEffects: boolean;
  hologramScanBeam?: boolean;
}

export interface StageEventMap {
  'STAGE_CARD_GRABBED': { cardId: string; handX: number; handY: number };
  'STAGE_CARD_RELEASED': { cardId: string; velocity: { vx: number; vy: number } };
  'STAGE_CARD_FLUNG': { cardId: string; velocity: { vx: number; vy: number } };
  'STAGE_CARD_DISMISSED': { cardId: string; direction: { vx: number; vy: number } };
  'STAGE_CLAW_LOCKED': { cardId: string };
  'STAGE_CLAW_PULLED': { cardId: string; targetHandPos: { x: number; y: number } };
  'STAGE_EXPLODE_SCRUB': { delta: number; progress: number };
  'STAGE_WORKSPACE_CLEARED': void;
  'STAGE_FIST_FREEZE': void;
  'STAGE_CANVAS_TOGGLE': { isOpen: boolean };
}

export interface AIStageCommand {
  action: 'spawn_card' | 'show_media' | 'explode' | 'assemble' | 'remove_card' | 'clear_stage' | 'force_pull';
  payload: {
    cardType?: SpatialCardType;
    title?: string;
    content?: string;
    mediaUrl?: string;
    modelType?: 'engine_core' | 'quantum_satellite' | 'cyber_drone' | 'custom';
    cardId?: string;
    hologram?: boolean;
    explodeProgress?: number;
    position?: { x: number; y: number };
  };
}

