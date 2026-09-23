import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssistantStatus, CharacterTransform, CharacterLockState, CharacterModelMetadata } from '../../types';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { 
  CharacterEmotion, 
  buildCharacterBindings, 
  applyReferenceBasePose, 
  computeReferenceBasePoseRotations,
  tuneCharacterMaterials, 
  updateFacialAnimations,
  EMOTION_EXPRESSIONS, 
  ResolvedMorphTarget, 
  CharacterSkeletonBones,
  EvelynMasterAnimationOrchestrator,
  CharacterBonesMap
} from './myraCharacterEngine';
import { 
  PMX_MODEL_URL, 
  TEXTURES_JSON_URL, 
  RAW_TEXTURE_URLS, 
  loadEvelynPMXModel 
} from './pmxModelLoader';
import { MMDPhysics } from 'three-stdlib';
import { getAmmo } from './ammoLoader';
import { MayraOrb } from './MayraOrb';
import { isWebGLSupported, createSafeWebGLRenderer, WebGLFallbackBoundary } from './webglUtils';

// Priority Model URLs with automatic failover (strictly local)
export const MODEL_CANDIDATE_URLS = [
  PMX_MODEL_URL,
  '/models/model.pmx'
];

export const PRIMARY_MODEL_URL = MODEL_CANDIDATE_URLS[0];
export const MODEL_URL = PRIMARY_MODEL_URL;
export const PMX_URL = PMX_MODEL_URL;
export const TEXTURES_URL = TEXTURES_JSON_URL;
export const TEXTURE_ASSETS = RAW_TEXTURE_URLS;

// Pristine raw source template (never directly mutated or animated)
let cachedRawSourceTemplate: THREE.Group | null = null;
let hasLoadedOnce = false;

interface ModelRendererProps {
  modelScene: THREE.Group;
  status: AssistantStatus;
  emotion?: CharacterEmotion;
  lockState?: CharacterLockState;
  transform?: CharacterTransform;
  characterSkinTone?: number;
}

function ModelRenderer({ 
  modelScene, 
  status, 
  emotion,
  lockState,
  transform,
  characterSkinTone = 50
}: ModelRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const initialMaterialsRef = useRef<Map<THREE.Material, { color: THREE.Color; roughness: number }>>(new Map());

  const { morphTargets, bones, restRotations, facialFeatures, meshRestTransforms } = useMemo(() => {
    return buildCharacterBindings(modelScene);
  }, [modelScene]);

  const targetBaseRotations = useMemo(() => {
    return computeReferenceBasePoseRotations(bones);
  }, [bones]);

  useEffect(() => {
    applyReferenceBasePose(bones);
  }, [bones]);

  useEffect(() => {
    tuneCharacterMaterials(modelScene, characterSkinTone, initialMaterialsRef.current);
  }, [characterSkinTone, modelScene]);

  const morphsByChannel = useMemo(() => {
    const map = new Map<string, ResolvedMorphTarget[]>();
    morphTargets.forEach((target) => {
      if (!map.has(target.channel)) {
        map.set(target.channel, []);
      }
      map.get(target.channel)!.push(target);
    });
    return map;
  }, [morphTargets]);

  // Model bone container for accumulator
  const modelBoneContainer = useMemo(() => {
    const bonesList: THREE.Object3D[] = [];
    const boneIndexByName = new Map<string, number>();

    modelScene.traverse((child) => {
      if (child.name) {
        bonesList.push(child);
        boneIndexByName.set(child.name, bonesList.length - 1);
      }
    });

    return {
      bones: bonesList,
      boneIndexByName,
      mesh: modelScene
    };
  }, [modelScene]);

  // Morph target consumer
  const { morphConsumer, morphMap } = useMemo(() => {
    const morphMap: Record<string, string> = {
      blink: 'blink',
      blinkL: 'blinkL',
      blinkR: 'blinkR',
      visemeA: 'visemeA',
      visemeI: 'visemeI',
      visemeU: 'visemeU',
      visemeE: 'visemeE',
      visemeO: 'visemeO',
      visemeTalk: 'visemeTalk',
      smileEyes: 'smileEyes',
      eyesWideL: 'eyesWideL',
      eyesWideR: 'eyesWideR',
      eyesHalf: 'eyesHalf',
      eyesSad: 'eyesSad',
      lowerLidUp: 'lowerLidUp',
      eyeOuterDown: 'eyeOuterDown',
      browUp: 'browUp',
      browSad: 'browSad',
      browSerious: 'browSerious',
      browTroubled: 'browTroubled',
      browAngryR: 'browAngryR',
      browDown: 'browDown',
      mouthSmile: 'mouthSmile',
      mouthCornerUpL: 'mouthCornerUpL',
      mouthCornerUpR: 'mouthCornerUpR',
      mouthCornerDownL: 'mouthCornerDownL',
      mouthCornerDownR: 'mouthCornerDownR',
      mouthWiden: 'mouthWiden',
      mouthNarrow: 'mouthNarrow',
      mouthShiftLeft: 'mouthShiftLeft',
      mouthShiftRight: 'mouthShiftRight',
      teethUp: 'teethUp',
      teethDown: 'teethDown'
    };

    const currentMorphInfluences = new Map<string, number>();

    const morphConsumer = {
      add(channelOrKey: number | string | undefined, weight: number) {
        if (!channelOrKey) return;
        const key = String(channelOrKey);
        const curr = currentMorphInfluences.get(key) || 0;
        currentMorphInfluences.set(key, Math.max(curr, weight));
      },
      flush(morphsByChannelMap: Map<string, ResolvedMorphTarget[]>, delta: number) {
        const morphDampingFactor = 1.0 - Math.exp(-8.0 * delta);
        morphsByChannelMap.forEach((targets, channel) => {
          const targetVal = currentMorphInfluences.get(channel) || 0;
          targets.forEach((target) => {
            if (target.mesh.morphTargetInfluences) {
              const curr = target.mesh.morphTargetInfluences[target.targetIndex] || 0;
              target.mesh.morphTargetInfluences[target.targetIndex] = THREE.MathUtils.lerp(
                curr,
                targetVal,
                morphDampingFactor
              );
            }
          });
        });
        currentMorphInfluences.clear();
      }
    };

    return { morphConsumer, morphMap };
  }, []);

  const bonesMap = useMemo<CharacterBonesMap>(() => {
    return {
      center: bones.center?.name || bones.upperBody?.parent?.name || 'センター',
      waist: bones.waist?.name || '下半身',
      upperBody: bones.upperBody?.name || '上半身',
      upperBody2: bones.upperBody2?.name || '上半身2',
      neck: bones.neck?.name || '首',
      head: bones.head?.name || '頭',
      shoulderL: bones.shoulderL?.name || '左肩',
      shoulderR: bones.shoulderR?.name || '右肩',
      armL: bones.armL?.name || '左腕',
      armR: bones.armR?.name || '右腕',
      elbowL: bones.elbowL?.name || '左ひじ',
      elbowR: bones.elbowR?.name || '右ひじ',
      wristL: bones.wristL?.name || '左手首',
      wristR: bones.wristR?.name || '右手首'
    };
  }, [bones]);

  const hairBonesL = useMemo(() => bones.hairBonesL.map((b) => b.name).filter(Boolean), [bones]);
  const hairBonesR = useMemo(() => bones.hairBonesR.map((b) => b.name).filter(Boolean), [bones]);
  const clothingBones = useMemo(() => (bones.clothingBones || []).map((b) => b.name).filter(Boolean), [bones]);

  // Master Orchestrator Instance
  const orchestrator = useMemo(() => {
    const orch = new EvelynMasterAnimationOrchestrator(
      modelBoneContainer,
      morphConsumer,
      morphMap,
      bonesMap,
      hairBonesL,
      hairBonesR,
      clothingBones
    );

    // Bake reference base pose (natural arm slope, elbows, wrists) into rest pose
    targetBaseRotations.forEach((targetEuler, bone) => {
      orch.pose.bakeIntoRest(bone.name, targetEuler.x, targetEuler.y, targetEuler.z);
    });

    return orch;
  }, [modelBoneContainer, morphConsumer, morphMap, bonesMap, hairBonesL, hairBonesR, clothingBones, targetBaseRotations]);

  // Native MMD Rigid Body & Constraint Physics Simulation
  const physicsRef = useRef<MMDPhysics | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initNativeMMDPhysics() {
      let skinnedMesh: THREE.SkinnedMesh | null = null;
      modelScene.traverse((child) => {
        if (!skinnedMesh && (child as THREE.SkinnedMesh).isSkinnedMesh) {
          skinnedMesh = child as THREE.SkinnedMesh;
        }
      });

      const pmxData = (skinnedMesh as any)?.userData?.pmxPhysics || (modelScene as any)?.userData?.pmxPhysics;
      if (!pmxData || !pmxData.rigidBodies || pmxData.rigidBodies.length === 0 || !skinnedMesh) {
        return;
      }

      const ammo = await getAmmo();
      if (!ammo || !isMounted) return;

      try {
        const physicsInstance = new MMDPhysics(
          skinnedMesh,
          pmxData.rigidBodies,
          pmxData.constraints || [],
          {
            unitStep: 1 / 60,
            // Keep cloth/hair physics responsive without allowing catch-up spikes on mobile.
            maxStepNum: 2,
            gravity: new THREE.Vector3(0, -9.8 * 4.0, 0)
          }
        );
        physicsRef.current = physicsInstance;
        orchestrator.setHasNativePhysics(true);
        console.log(`[MayraAvatar] Native MMD Physics simulation activated (${pmxData.rigidBodies.length} rigid bodies, ${pmxData.constraints?.length || 0} joints).`);
      } catch (err) {
        console.warn('[MayraAvatar] Failed to initialize MMDPhysics:', err);
        orchestrator.setHasNativePhysics(false);
      }
    }

    initNativeMMDPhysics();

    return () => {
      isMounted = false;
      physicsRef.current = null;
      orchestrator.setHasNativePhysics(false);
    };
  }, [modelScene, orchestrator]);

  const renderedFramesRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(delta, 0.1); // Protect against tab switch spikes

    // Notify window that 3D character is fully drawn and rendered on screen
    if (renderedFramesRef.current < 5) {
      renderedFramesRef.current += 1;
      if (renderedFramesRef.current >= 2) {
        if (typeof window !== 'undefined') {
          (window as any).__MAYRA_MODEL_READY__ = true;
          window.dispatchEvent(new CustomEvent('mayra_model_loaded', { detail: { success: true } }));
        }
      }
    }

    // 1. Root group transform handling (drag, rotation, locked scale)
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.scale.set(1.0, 1.0, 1.0);
    groupRef.current.rotation.x = 0;
    groupRef.current.rotation.z = 0;

    if (transform && !lockState?.isLocked) {
      const targetRadY = (transform.rotationY * Math.PI) / 180;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRadY, 0.1);
    } else if (lockState?.isLocked) {
      groupRef.current.rotation.y = 0;
    }

    // Resolve current emotion & status
    let currentEmotion: CharacterEmotion = emotion || 'idle';
    if (!emotion) {
      if (status === 'SPEAKING') currentEmotion = 'happy';
      else if (status === 'THINKING') currentEmotion = 'thinking';
      else if (status === 'LISTENING') currentEmotion = 'curious';
      else currentEmotion = 'idle';
    }

    // 2. THE ONE CENTRAL MASTER PER-FRAME UPDATE FUNCTION (WA.update)
    // Executes in exact mandated sequence on every single animation frame:
    // pose.begin() -> breathing/idle -> body-language -> micro-behaviors -> gaze -> constraints -> hair -> expression -> lip-sync -> pose.apply() -> updateMatrixWorld(true)
    orchestrator.update({
      delta: clampedDelta,
      status: status as 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING',
      emotion: currentEmotion,
      userLookTarget: state.camera.position,
      audioAnalyser: null
    });

    // 2b. Native MMD Physics Step (Hair, Sleeves & Cloth Simulation)
    if (physicsRef.current) {
      try {
        physicsRef.current.update(clampedDelta);
      } catch (physErr) {
        // Safe catch
      }
    }

    // 3. Flush morph targets to mesh morphTargetInfluences
    morphConsumer.flush(morphsByChannel, clampedDelta);

    // 4. Update facial mesh details
    const isSpeaking = status === 'SPEAKING';
    const speechWeight = isSpeaking ? 1.0 : 0.0;
    updateFacialAnimations(
      facialFeatures,
      meshRestTransforms,
      currentEmotion,
      isSpeaking,
      speechWeight,
      0,
      time
    );

    // 5. Update scene matrices
    modelScene.updateMatrixWorld(true);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <primitive object={modelScene} />
    </group>
  );
}

export interface MayraAvatarProps {
  status: AssistantStatus;
  emotion?: CharacterEmotion;
  scaleMultiplier?: number;
  characterZoom?: number;
  characterSkinTone?: number;
  transform?: CharacterTransform;
  lockState?: CharacterLockState;
  modelMetadata?: CharacterModelMetadata;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onWheel?: (e: React.WheelEvent) => void;
  onTriggerVoice?: () => void;
}

export const MayraAvatar: React.FC<MayraAvatarProps> = ({
  status,
  emotion,
  scaleMultiplier = 1.0,
  characterZoom = 100,
  characterSkinTone = 50,
  transform,
  lockState,
  modelMetadata,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTouchStart,
  onTouchMove,
  onWheel,
  onTriggerVoice
}) => {
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);
  const [isWebGlActive, setIsWebGlActive] = useState<boolean>(() => isWebGLSupported());
  const [isLoading, setIsLoading] = useState<boolean>(() => isWebGLSupported() && !cachedRawSourceTemplate);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [cameraConfig, setCameraConfig] = useState<{
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  }>({
    position: [0, 0, 2.25],
    target: [0, 0, 0],
    fov: 30
  });

  const effectiveZoom = useMemo(() => {
    const rawZoom = (characterZoom ?? 100) / 100;
    return rawZoom * (scaleMultiplier ?? 1.0);
  }, [characterZoom, scaleMultiplier]);

  useEffect(() => {
    let isMounted = true;
    const gltfLoader = new GLTFLoader();

    const configureSceneHierarchy = (scene: THREE.Group) => {
      // Ensure scene transform is reset before computing true bounding box
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
      scene.scale.set(1, 1, 1);
      scene.updateMatrixWorld(true);

      // 1. Calculate Real Bounding Box
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const actualHeight = size.y;
      console.log('[MayraAvatar] Model Bounding Box Computed:', {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
        size: { x: size.x, y: size.y, z: size.z },
        center: { x: center.x, y: center.y, z: center.z },
        actualHeight
      });

      // 2. MODEL SCALE & UPPER-TORSO ALIGNMENT
      const TARGET_HEIGHT = 1.95;
      const scaleFactor = (actualHeight > 0.001 ? (TARGET_HEIGHT / actualHeight) : 1.0) * effectiveZoom;
      scene.scale.setScalar(scaleFactor);

      // Align chest/collar level directly to origin so chest-up (bust) portrait is framed cleanly with headroom for breathing
      const chestY = box.max.y - (actualHeight * 0.255);
      scene.position.x = -center.x * scaleFactor;
      scene.position.y = -chestY * scaleFactor;
      scene.position.z = -center.z * scaleFactor;
      scene.rotation.set(0, 0, 0);

      // 3. CAMERA CALIBRATION
      const CAMERA_DISTANCE = 1.82;
      const fov = 40;

      setCameraConfig({
        position: [0, 0, CAMERA_DISTANCE],
        target: [0, 0, 0],
        fov
      });

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // Shadows are not enabled on the avatar canvas; disabling shadow work avoids
          // unnecessary draw/setup cost on mobile GPUs.
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          // Keep skinned meshes visible while animated; their bounds are not reliably
          // updated by all PMX pipelines during bone/morph animation.
          mesh.frustumCulled = false;
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              mat.side = THREE.DoubleSide;
              mat.needsUpdate = true;
            });
          }
        }
      });
    };

    const instantiateFreshModel = (sourceTemplate: THREE.Group) => {
      // Clones a fresh, unmutated skeleton & hierarchy with zero previous rotations
      const freshInstance = SkeletonUtils.clone(sourceTemplate) as THREE.Group;
      if (sourceTemplate.userData?.pmxPhysics) {
        freshInstance.userData.pmxPhysics = sourceTemplate.userData.pmxPhysics;
      }

      // Ensure skinnedMesh also retains physics metadata
      let srcMesh: THREE.SkinnedMesh | null = null;
      let freshMesh: THREE.SkinnedMesh | null = null;
      sourceTemplate.traverse((c) => {
        if (!srcMesh && (c as THREE.SkinnedMesh).isSkinnedMesh) srcMesh = c as THREE.SkinnedMesh;
      });
      freshInstance.traverse((c) => {
        if (!freshMesh && (c as THREE.SkinnedMesh).isSkinnedMesh) freshMesh = c as THREE.SkinnedMesh;
      });
      if (srcMesh?.userData?.pmxPhysics && freshMesh) {
        (freshMesh as any).userData.pmxPhysics = (srcMesh as any).userData.pmxPhysics;
      }

      configureSceneHierarchy(freshInstance);
      setModelScene(freshInstance);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mayra_model_loaded', { detail: { success: true } }));
      }
    };

    if (cachedRawSourceTemplate) {
      instantiateFreshModel(cachedRawSourceTemplate);
      return;
    }

    const tryLoadGltfFallback = (urlIdx: number, originalErr?: any) => {
      const glbUrls = MODEL_CANDIDATE_URLS.filter(u => !u.endsWith('.pmx'));
      if (urlIdx >= glbUrls.length) {
        if (isMounted) {
          const detail = originalErr?.message ? ` (${originalErr.message})` : '';
          setLoadError(`Failed to load 3D character asset${detail}. Tap Retry.`);
          setIsLoading(false);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mayra_model_loaded', { detail: { success: false } }));
          }
        }
        return;
      }

      const currentUrl = glbUrls[urlIdx];
      gltfLoader.load(
        currentUrl,
        (gltf) => {
          if (!isMounted) return;
          try {
            cachedRawSourceTemplate = gltf.scene;
            hasLoadedOnce = true;
            instantiateFreshModel(gltf.scene);
          } catch (err: any) {
            console.error('[Mayra3D] Error processing GLTF scene:', err);
            tryLoadGltfFallback(urlIdx + 1, originalErr);
          }
        },
        undefined,
        (err) => {
          if (!isMounted) return;
          console.warn(`[Mayra3D] Failed loading GLTF from ${currentUrl}:`, err);
          tryLoadGltfFallback(urlIdx + 1, originalErr);
        }
      );
    };

    const loadCharacter = async () => {
      if (!isWebGlActive) {
        setIsLoading(false);
        return;
      }

      if (isMounted && !hasLoadedOnce) {
        setIsLoading(true);
        setLoadError(null);
      }

      let errorEncountered: any = null;
      try {
        console.log('[Mayra3D] Loading Evelyn PMX model with textures...');
        const pmxScene = await loadEvelynPMXModel();
        if (!isMounted) return;

        cachedRawSourceTemplate = pmxScene;
        hasLoadedOnce = true;
        instantiateFreshModel(pmxScene);
        console.log('[Mayra3D] Evelyn PMX model successfully loaded.');
        return;
      } catch (pmxErr: any) {
        errorEncountered = pmxErr;
        console.warn('[Mayra3D] PMX loader failed, falling back to candidates:', pmxErr);
      }

      tryLoadGltfFallback(0, errorEncountered);
    };

    loadCharacter();

    return () => {
      isMounted = false;
    };
  }, [attemptCount, effectiveZoom, isWebGlActive]);

  const handleRetry = () => {
    cachedRawSourceTemplate = null;
    hasLoadedOnce = false;
    setModelScene(null);
    setIsWebGlActive(isWebGLSupported());
    setAttemptCount(prev => prev + 1);
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center select-none overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/40 via-[#050711] to-[#020308]">
      {/* Background Radial Halo Light */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[340px] h-[340px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="w-[240px] h-[240px] rounded-full bg-indigo-500/10 blur-2xl -mt-12" />
      </div>

      {/* 1. Graceful 2D Fallback when WebGL is unavailable on device/browser */}
      {!isWebGlActive ? (
        <div 
          className="relative z-10 flex flex-col items-center justify-center cursor-pointer p-4 select-none"
          onClick={onTriggerVoice}
        >
          <div className="relative flex flex-col items-center gap-4">
            <div className="transition-transform active:scale-95 duration-200">
              <MayraOrb
                style="electric_plasma"
                color="spectrum"
                size={220}
                status={status}
                interactive={true}
                onClick={onTriggerVoice}
              />
            </div>
            <div className="flex flex-col items-center select-none text-center px-4">
              <span className="text-xs font-mono tracking-widest text-cyan-300 font-bold uppercase drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                {status === 'LISTENING' ? 'LISTENING...' : status === 'SPEAKING' ? 'MAYRA SPEAKING' : status === 'THINKING' ? 'REASONING...' : 'SAY "HEY MAYRA" OR TAP'}
              </span>
              <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                ✦ 2D Quantum Core Active (Optimized Canvas)
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Loading Overlay */}
          {/* Never block the app shell while the 3D asset warms up. The character
              appears as soon as the model is ready; the rest of MAYRA remains usable. */}

          {/* 3. Error Overlay */}
          {loadError && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#050711]/95 p-4 text-center">
              <div className="p-5 bg-[#0D1127] border border-rose-500/40 rounded-3xl text-slate-200 text-xs font-mono max-w-sm w-full space-y-3 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Character Unavailable</p>
                  <p className="text-rose-400/80 text-[11px] mt-1">{loadError}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            </div>
          )}

          {/* 4. Three.js Canvas Scene guarded by WebGLFallbackBoundary */}
          {modelScene && (
            <WebGLFallbackBoundary
              fallback={
                <div 
                  className="relative z-10 flex flex-col items-center justify-center cursor-pointer p-4 select-none"
                  onClick={onTriggerVoice}
                >
                  <div className="relative flex flex-col items-center gap-4">
                    <MayraOrb
                      style="electric_plasma"
                      color="spectrum"
                      size={220}
                      status={status}
                      interactive={true}
                      onClick={onTriggerVoice}
                    />
                    <div className="flex flex-col items-center select-none text-center px-4">
                      <span className="text-xs font-mono tracking-widest text-cyan-300 font-bold uppercase">
                        {status === 'LISTENING' ? 'LISTENING...' : status === 'SPEAKING' ? 'MAYRA SPEAKING' : 'READY'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                        ✦ 2D Quantum Core Active (Optimized Canvas)
                      </span>
                    </div>
                  </div>
                </div>
              }
              onError={(err) => {
                console.warn('[MayraAvatar] WebGL canvas context failed at runtime, switching to 2D core:', err);
                setIsWebGlActive(false);
              }}
            >
              <Canvas
                key={`avatar-canvas-${cameraConfig.fov}-${cameraConfig.position[2]}`}
                camera={{
                  position: cameraConfig.position,
                  fov: cameraConfig.fov,
                  near: 0.1,
                  far: 1000
                }}
                className="w-full h-full touch-none"
                onCreated={({ gl, camera }) => {
                  camera.lookAt(...cameraConfig.target);
                  gl.outputColorSpace = THREE.SRGBColorSpace;
                  gl.toneMapping = THREE.LinearToneMapping;
                  gl.toneMappingExposure = 1.18;
                }}
                dpr={[1, 1.25]}
                gl={(defaultProps) => createSafeWebGLRenderer(defaultProps.canvas as HTMLCanvasElement)}
              >
                {/* Professional 6-Point Anime Studio Lighting Rig */}
                {/* Lightweight mobile-friendly lighting: no shadow maps are used. */}
                <ambientLight intensity={0.64} color="#fff8f3" />
                <hemisphereLight color="#f0f5ff" groundColor="#3a2e36" intensity={0.34} />
                <directionalLight position={[-0.85, 1.7, 2.1]} intensity={0.72} color="#fffaf4" />
                <directionalLight position={[1.6, 1.8, -1.9]} intensity={0.56} color="#cbe4ff" />

                <ModelRenderer 
                  modelScene={modelScene} 
                  status={status} 
                  emotion={emotion}
                  lockState={lockState}
                  transform={transform}
                  characterSkinTone={characterSkinTone}
                />

                <OrbitControls
                  target={cameraConfig.target}
                  enabled={false}
                  enablePan={false}
                  enableZoom={false}
                  enableRotate={false}
                />
              </Canvas>
            </WebGLFallbackBoundary>
          )}
        </>
      )}
    </div>
  );
};
