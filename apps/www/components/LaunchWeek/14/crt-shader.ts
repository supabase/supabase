import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

// CRT Scanline shader
export const CRTShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    scanlineIntensity: { value: 0.15 },
    scanlineCount: { value: 800 },
    vignetteIntensity: { value: 0.5 },
    time: { value: 0 },
    noise: { value: 0.08 },
    flickerIntensity: { value: 0.03 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float vignetteIntensity;
    uniform float time;
    uniform float noise;
    uniform float flickerIntensity;
    varying vec2 vUv;
    
    float random(vec2 p) {
      vec2 k1 = vec2(23.14069263277926, 2.665144142690225);
      return fract(cos(dot(p, k1)) * 12345.6789);
    }
    
    void main() {
      // Get the original color
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Scanlines
      float scanline = sin(vUv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
      scanline = pow(scanline, 1.0) * scanlineIntensity;
      color.rgb -= scanline;
      
      // Vignette effect
      float vignette = distance(vUv, vec2(0.5));
      vignette = smoothstep(0.4, 0.75, vignette) * vignetteIntensity;
      color.rgb -= vignette;
      
      // Noise
      float noiseVal = random(vUv + vec2(time * 0.001)) * noise;
      color.rgb += noiseVal - (noise * 0.5);
      
      // Flicker
      float flicker = random(vec2(time * 0.001, 0.0)) * flickerIntensity;
      color.rgb += flicker - (flickerIntensity * 0.5);
      
      // RGB shift
      float rgbShift = 0.003;
      color.r += texture2D(tDiffuse, vUv + vec2(rgbShift, 0.0)).r * 0.1;
      color.b += texture2D(tDiffuse, vUv - vec2(rgbShift, 0.0)).b * 0.1;
      
      gl_FragColor = color;
    }
  `
};
