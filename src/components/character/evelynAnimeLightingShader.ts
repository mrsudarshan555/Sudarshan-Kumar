import * as THREE from 'three';

/**
 * Custom Evelyn Face & Body Studio Lighting Shader
 * 
 * Ported from reference implementation with:
 * - Dedicated Face Rig (camera-relative view-space softbox, fill through bangs, overhead sheen, chin reflector bounce)
 * - Soft-ceiling exposure clamp (`level = clamp(level, uMinLight, 1.04)`) preventing blown-out clipped highlights
 * - Soft ambient occlusion mix on face (`indirect *= mix(1.0, ao, 0.28)`) so creases read as softness, not dirt
 * - Body Rig with independent beauty fill and proper AO occlusion (`indirect *= ao`)
 * - Three-tone cel shading with core band hue shift and gentle warmth tinting
 */

export interface EvelynLightingUniforms {
  uFaceTopDirView: THREE.Vector3;
  uFaceRimDirView: THREE.Vector3;
  uFaceKeyLevel: number;
  uFaceFillLevel: number;
  uFaceTopLevel: number;
  uFaceRimLevel: number;
  uFaceBounceLevel: number;
  uAmbientLevel: number;
  uMinLight: number;

  uFillLevel: number;
  uBounceLevel: number;
  uRimLevel: number;
  uHairLevel: number;
  uFrontFillLevel: number;
  uViewFillStrength: number;
  uViewTopStrength: number;

  uShadowMid: number;
  uSecondShadow: number;
  uShadowDepth: number;
  uShadowTint: THREE.Color;
  uLightTint: THREE.Color;
  uKeyTint: number;
  uFillTint: number;
  uHairTint: number;
  uRimTint: number;
  uBounceTint: number;
  uFrontFillTint: number;
  uAmbientTint: number;
  uWarmth: number;
  uWarmColor: THREE.Color;

  uFaceFillColor: THREE.Color;
  uFaceTopColor: THREE.Color;
  uFaceRimColor: THREE.Color;
  uFaceBounceColor: THREE.Color;

  uFillColor: THREE.Color;
  uRimLightColor: THREE.Color;
  uHairLightColor: THREE.Color;
  uBounceColor: THREE.Color;
  uFrontFillColor: THREE.Color;
  uAmbientGround: THREE.Color;
  uAmbientSky: THREE.Color;
}

export const DEFAULT_EVELYN_LIGHTING_CONFIG: EvelynLightingUniforms = {
  uFaceTopDirView: new THREE.Vector3(0.0, 0.85, 0.52).normalize(),
  uFaceRimDirView: new THREE.Vector3(0.7, 0.3, -0.6).normalize(),
  uFaceKeyLevel: 0.52,
  uFaceFillLevel: 0.36,
  uFaceTopLevel: 0.18,
  uFaceRimLevel: 0.22,
  uFaceBounceLevel: 0.16,
  uAmbientLevel: 0.32,
  uMinLight: 0.70, // Soft-ceiling exposure floor so face & body stay bright & readable without clipping

  uFillLevel: 0.38,
  uBounceLevel: 0.18,
  uRimLevel: 0.24,
  uHairLevel: 0.22,
  uFrontFillLevel: 0.26,
  uViewFillStrength: 0.40,
  uViewTopStrength: 0.25,

  uShadowMid: 0.55,
  uSecondShadow: 0.22,
  uShadowDepth: 0.32,
  uShadowTint: new THREE.Color(0.88, 0.80, 0.86), // Gentle violet-warm anime shadow tone
  uLightTint: new THREE.Color(1.0, 0.99, 0.98),
  uKeyTint: 0.25,
  uFillTint: 0.18,
  uHairTint: 0.15,
  uRimTint: 0.22,
  uBounceTint: 0.16,
  uFrontFillTint: 0.14,
  uAmbientTint: 0.20,
  uWarmth: 0.08, // Subtle warmth lifting skin out of grey without desaturation
  uWarmColor: new THREE.Color(1.03, 0.98, 0.95),

  uFaceFillColor: new THREE.Color(1.0, 0.98, 0.96),
  uFaceTopColor: new THREE.Color(1.0, 1.0, 0.98),
  uFaceRimColor: new THREE.Color(0.92, 0.95, 1.0),
  uFaceBounceColor: new THREE.Color(1.0, 0.95, 0.92),

  uFillColor: new THREE.Color(0.95, 0.95, 1.0),
  uRimLightColor: new THREE.Color(0.88, 0.92, 1.0),
  uHairLightColor: new THREE.Color(1.0, 0.98, 0.94),
  uBounceColor: new THREE.Color(0.98, 0.95, 0.92),
  uFrontFillColor: new THREE.Color(1.0, 0.97, 0.95),
  uAmbientGround: new THREE.Color(0.42, 0.38, 0.42),
  uAmbientSky: new THREE.Color(0.90, 0.93, 1.0)
};

/**
 * Checks whether a material belongs to the Face Rig (facial skin, eyes, eyebrows, mouth, teeth)
 */
export function isFaceMaterial(matName: string): boolean {
  if (!matName) return false;
  const name = matName.toLowerCase();
  return (
    matName.includes('颜') ||
    matName.includes('痣') ||
    matName.includes('眉') ||
    matName.includes('眉睫影') ||
    matName.includes('白目') ||
    matName.includes('目') ||
    matName.includes('目光') ||
    matName.includes('目光2') ||
    matName.includes('睫') ||
    matName.includes('口') ||
    matName.includes('舌') ||
    matName.includes('齿') ||
    matName.includes('目影') ||
    name.includes('face') ||
    name.includes('eye') ||
    name.includes('mouth') ||
    name.includes('brow') ||
    name.includes('lash')
  );
}

/**
 * Injects the custom anime face/body lighting GLSL shader into a Three.js material
 */
export function applyEvelynLightingShader(
  material: THREE.Material,
  isFace: boolean,
  customConfig?: Partial<EvelynLightingUniforms>
) {
  const config = { ...DEFAULT_EVELYN_LIGHTING_CONFIG, ...customConfig };

  // Separate program cache keys ensure independent shader compilation
  material.customProgramCacheKey = () => (isFace ? 'evelyn_face_lighting_v2' : 'evelyn_body_lighting_v2');

  material.onBeforeCompile = (shader) => {
    shader.defines = shader.defines || {};
    if (isFace) {
      shader.defines.USE_FACE_RIG = '1';
    } else {
      delete shader.defines.USE_FACE_RIG;
    }

    // Bind uniforms
    shader.uniforms.uFaceTopDirView = { value: config.uFaceTopDirView };
    shader.uniforms.uFaceRimDirView = { value: config.uFaceRimDirView };
    shader.uniforms.uFaceKeyLevel = { value: config.uFaceKeyLevel };
    shader.uniforms.uFaceFillLevel = { value: config.uFaceFillLevel };
    shader.uniforms.uFaceTopLevel = { value: config.uFaceTopLevel };
    shader.uniforms.uFaceRimLevel = { value: config.uFaceRimLevel };
    shader.uniforms.uFaceBounceLevel = { value: config.uFaceBounceLevel };
    shader.uniforms.uAmbientLevel = { value: config.uAmbientLevel };
    shader.uniforms.uMinLight = { value: config.uMinLight };

    shader.uniforms.uFillLevel = { value: config.uFillLevel };
    shader.uniforms.uBounceLevel = { value: config.uBounceLevel };
    shader.uniforms.uRimLevel = { value: config.uRimLevel };
    shader.uniforms.uHairLevel = { value: config.uHairLevel };
    shader.uniforms.uFrontFillLevel = { value: config.uFrontFillLevel };
    shader.uniforms.uViewFillStrength = { value: config.uViewFillStrength };
    shader.uniforms.uViewTopStrength = { value: config.uViewTopStrength };

    shader.uniforms.uShadowMid = { value: config.uShadowMid };
    shader.uniforms.uSecondShadow = { value: config.uSecondShadow };
    shader.uniforms.uShadowDepth = { value: config.uShadowDepth };
    shader.uniforms.uShadowTint = { value: config.uShadowTint };
    shader.uniforms.uLightTint = { value: config.uLightTint };
    shader.uniforms.uKeyTint = { value: config.uKeyTint };
    shader.uniforms.uFillTint = { value: config.uFillTint };
    shader.uniforms.uHairTint = { value: config.uHairTint };
    shader.uniforms.uRimTint = { value: config.uRimTint };
    shader.uniforms.uBounceTint = { value: config.uBounceTint };
    shader.uniforms.uFrontFillTint = { value: config.uFrontFillTint };
    shader.uniforms.uAmbientTint = { value: config.uAmbientTint };
    shader.uniforms.uWarmth = { value: config.uWarmth };
    shader.uniforms.uWarmColor = { value: config.uWarmColor };

    shader.uniforms.uFaceFillColor = { value: config.uFaceFillColor };
    shader.uniforms.uFaceTopColor = { value: config.uFaceTopColor };
    shader.uniforms.uFaceRimColor = { value: config.uFaceRimColor };
    shader.uniforms.uFaceBounceColor = { value: config.uFaceBounceColor };

    shader.uniforms.uFillColor = { value: config.uFillColor };
    shader.uniforms.uRimLightColor = { value: config.uRimLightColor };
    shader.uniforms.uHairLightColor = { value: config.uHairLightColor };
    shader.uniforms.uBounceColor = { value: config.uBounceColor };
    shader.uniforms.uFrontFillColor = { value: config.uFrontFillColor };
    shader.uniforms.uAmbientGround = { value: config.uAmbientGround };
    shader.uniforms.uAmbientSky = { value: config.uAmbientSky };

    // Inject Uniform Declarations into Fragment Shader Header
    const uniformDeclarations = /* glsl */ `
      uniform vec3 uFaceTopDirView;
      uniform vec3 uFaceRimDirView;
      uniform float uFaceKeyLevel;
      uniform float uFaceFillLevel;
      uniform float uFaceTopLevel;
      uniform float uFaceRimLevel;
      uniform float uFaceBounceLevel;
      uniform float uAmbientLevel;
      uniform float uMinLight;

      uniform float uFillLevel;
      uniform float uBounceLevel;
      uniform float uRimLevel;
      uniform float uHairLevel;
      uniform float uFrontFillLevel;
      uniform float uViewFillStrength;
      uniform float uViewTopStrength;

      uniform float uShadowMid;
      uniform float uSecondShadow;
      uniform float uShadowDepth;
      uniform vec3 uShadowTint;
      uniform vec3 uLightTint;
      uniform float uKeyTint;
      uniform float uFillTint;
      uniform float uHairTint;
      uniform float uRimTint;
      uniform float uBounceTint;
      uniform float uFrontFillTint;
      uniform float uAmbientTint;
      uniform float uWarmth;
      uniform vec3 uWarmColor;

      uniform vec3 uFaceFillColor;
      uniform vec3 uFaceTopColor;
      uniform vec3 uFaceRimColor;
      uniform vec3 uFaceBounceColor;

      uniform vec3 uFillColor;
      uniform vec3 uRimLightColor;
      uniform vec3 uHairLightColor;
      uniform vec3 uBounceColor;
      uniform vec3 uFrontFillColor;
      uniform vec3 uAmbientGround;
      uniform vec3 uAmbientSky;
    `;

    shader.fragmentShader = uniformDeclarations + '\n' + shader.fragmentShader;

    // Inject Custom Face / Body Lighting Stage right before <opaque_fragment>
    const customLightingStage = /* glsl */ `
      vec3 customNormal = normalize( normal );
      vec3 customViewDir = -geometryViewDir;
      float NdotV = clamp( dot( customNormal, customViewDir ), 0.0, 1.0 );
      vec3 albedo = diffuseColor.rgb;

      // Studio key light in view space
      vec3 keyDirView = normalize( vec3( 0.35, 0.75, 0.55 ) );
      vec3 keyHue = vec3( 1.0, 0.98, 0.96 );

      float halfLambert = dot( customNormal, keyDirView ) * 0.5 + 0.5;
      float shadowMask = 1.0;
      float lightFactor = smoothstep( 0.36, 0.44, halfLambert * shadowMask );
      float direct = lightFactor;

      float frontFacing = clamp( dot( customNormal, customViewDir ), 0.0, 1.0 );
      float bounceFacing = clamp( dot( customNormal, vec3( 0.0, -0.9, 0.43 ) ) * -0.5 + 0.5, 0.0, 1.0 );
      float viewTopFacing = clamp( dot( customNormal, vec3( 0.0, 1.0, 0.0 ) ), 0.0, 1.0 );
      float hairFacing = pow( clamp( dot( customNormal, vec3( 0.0, 0.85, -0.52 ) ) * 0.5 + 0.5, 0.0, 1.0 ), 2.0 );
      float rimFacing = pow( 1.0 - NdotV, 2.0 );
      float fillFactor = mix( 0.65, 1.0, dot( customNormal, vec3( -0.4, 0.2, 0.9 ) ) * 0.5 + 0.5 );
      float up = clamp( dot( customNormal, vec3( 0.0, 1.0, 0.0 ) ) * 0.5 + 0.5, 0.0, 1.0 );

      #ifdef USE_AOMAP
        float ao = ambientOcclusion;
      #else
        float ao = 1.0;
      #endif

      #ifdef USE_FACE_RIG
        // A photographer lighting a face does not rely on whatever the
        // room bounces back; they place a fill, a hair light and a
        // reflector under the chin. This does the same, in view space, so
        // the setup holds from any viewing angle:
        //
        //   fill   - broad camera-axis source, guarantees eyes, cheeks and
        //            forehead stay readable THROUGH the bangs' shadow
        //   top    - subtle overhead sheen on forehead and cheekbones
        //   rim    - gentle edge separating cheek and jaw from background
        //   bounce - reflector under the chin, lifting jaw and throat
        //
        // The hair shadow is deliberately still there; the fill simply
        // sits above the level at which it would swallow the face.
        float faceTopFacing = smoothstep(
          -0.18, 0.78, dot( customNormal, uFaceTopDirView )
        );
        float faceRimFacing = pow(
          clamp( dot( customNormal, uFaceRimDirView ) * 0.5 + 0.5, 0.0, 1.0 ),
          2.2
        ) * pow( 1.0 - NdotV, 1.35 );

        // The fill is deliberately strongest where the key's shadow map
        // says the bangs are blocking the face. It does not erase that
        // shadow: lightFactor still controls the anime shadow tone and
        // the face key. It merely keeps the shadow from swallowing the
        // forehead, eyes and cheeks.
        float shadowFill = mix( 1.0, 1.28, 1.0 - shadowMask );
        float indirect = uFaceFillLevel * frontFacing * shadowFill
          + uFaceTopLevel * faceTopFacing
          + uFaceRimLevel * faceRimFacing
          + uFaceBounceLevel * pow( bounceFacing, 0.65 )
          + uAmbientLevel * 0.38;

        // The face takes only light occlusion: creases should read as
        // softness, never as dirt.
        indirect *= mix( 1.0, ao, 0.28 );
      #else
        // Indirect light - fill, ambient, bounce and the wrap-around back
        // lights. This is what AO legitimately occludes.
        float indirect = uFillLevel * fillFactor * ( 1.0 - lightFactor )
          + uAmbientLevel
          + uBounceLevel * bounceFacing
          + uRimLevel * rimFacing
          + uHairLevel * hairFacing;
        indirect *= ao;
      #endif

      #ifdef USE_FACE_RIG
        // Face levels are authored as a self-contained studio exposure.
        // Do not add the body's front fill here: the dedicated camera
        // softbox above replaces it and keeps body lighting independent.
        float level = direct * uFaceKeyLevel + indirect;
        // The old implementation floored INDIRECT and then divided it,
        // so a requested 0.70 floor could become less than 0.60 on screen.
        // Floor the final face exposure instead. A soft ceiling protects
        // the original texture colours from clipping.
        level = clamp( level, uMinLight, 1.04 );
      #else
        // The body keeps its existing invisible front fill and its exact
        // normalization; none of the portrait changes alter body light.
        float beautyFill = frontFacing * uViewFillStrength
          + viewTopFacing * uViewTopStrength;
        indirect += uFrontFillLevel * beautyFill * mix( 1.0, ao, 0.28 );
        indirect = max( indirect, uMinLight );
        // Key + ambient is full body illumination by definition.
        float level = ( direct + indirect ) / ( 1.0 + uAmbientLevel );
      #endif

      // ---- illumination HUE -------------------------------------------
      //
      // Shadow is a hue shift of the texture, with a deeper core band so
      // the shading has three tones rather than a flat two-step. The lit
      // side stays neutral so the texture reads as authored.
      float coreFactor = smoothstep( 0.0, uShadowMid, halfLambert * shadowMask );
      vec3 shadeTint = uShadowTint * mix( 1.0 - uSecondShadow, 1.0, coreFactor );
      vec3 tint = mix( mix( vec3( 1.0 ), shadeTint, uShadowDepth ), uLightTint, lightFactor );

      // Rig colour enters ONLY as a gentle tint, never a full multiply, so
      // a warm key warms the image without draining its blues.
      tint *= mix( vec3( 1.0 ), keyHue, uKeyTint * lightFactor );
      #ifdef USE_FACE_RIG
        tint *= mix( vec3( 1.0 ), uFaceFillColor, uFillTint * frontFacing );
        tint *= mix( vec3( 1.0 ), uFaceTopColor, uHairTint * faceTopFacing );
        tint *= mix( vec3( 1.0 ), uFaceRimColor, uRimTint * faceRimFacing );
        tint *= mix( vec3( 1.0 ), uFaceBounceColor, uBounceTint * bounceFacing );
      #else
        tint *= mix( vec3( 1.0 ), uFillColor, uFillTint * ( 1.0 - lightFactor ) * fillFactor );
        tint *= mix( vec3( 1.0 ), mix( uAmbientGround, uAmbientSky, up ), uAmbientTint );
        tint *= mix( vec3( 1.0 ), uRimLightColor, uRimTint * rimFacing );
        tint *= mix( vec3( 1.0 ), uHairLightColor, uHairTint * hairFacing );
        tint *= mix( vec3( 1.0 ), uBounceColor, uBounceTint * bounceFacing );
      #endif
      // Warm bounce colour where the bounce actually lands.
      tint *= mix( vec3( 1.0 ), uFrontFillColor, uFrontFillTint * frontFacing );

      // Material warmth. A gentle push toward a warm hue that lifts skin
      // out of grey WITHOUT desaturating it or lightening it - the texture
      // keeps its own colour, it is simply lit by warmer light.
      tint *= mix( vec3( 1.0 ), uWarmColor, uWarmth );

      // Texture colour scaled by a neutral level and shaped by tint.
      outgoingLight = albedo * tint * level;
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      customLightingStage + '\n#include <opaque_fragment>'
    );
  };

  material.needsUpdate = true;
}
