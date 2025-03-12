import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export const CRTShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    scanlineIntensity: { value: 0.5 },
    scanlineCount: { value: 320 },
    vignetteIntensity: { value: 0.5 },
    noiseIntensity: { value: 0.3 },
    flickerIntensity: { value: 0.03 },
    rgbShiftAmount: { value: 0.0015 },
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
    uniform float time;
    uniform vec2 resolution;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float vignetteIntensity;
    uniform float noiseIntensity;
    uniform float flickerIntensity;
    uniform float rgbShiftAmount;

    varying vec2 vUv;

    // Random function
    // https://stackoverflow.com/a/10625698
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      // RGB shift effect
      vec2 shiftR = vec2(rgbShiftAmount, 0.0);
      vec2 shiftG = vec2(0.0, rgbShiftAmount);

      float r = texture2D(tDiffuse, vUv + shiftR).r;
      float g = texture2D(tDiffuse, vUv + shiftG).g;
      float b = texture2D(tDiffuse, vUv).b;

      vec4 shiftedColor = vec4(r, g, b, 1.0);

      // Scanline effect
      float scanline = sin(vUv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
      scanline = pow(scanline, 1.0) * scanlineIntensity;

      // Vignette effect
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float vignette = smoothstep(0.4, 0.75, dist) * vignetteIntensity;

      // Noise
      float noise = random(vUv + time * 0.001) * noiseIntensity;

      // Flicker
      float flicker = random(vec2(time * 0.001, 0.0)) * flickerIntensity;

      vec4 finalColor = shiftedColor;
      finalColor.rgb *= (1.0 - scanline);

      // Apply vignette (darkens edges, not center)
      finalColor.rgb *= (1.0 - vignette);

      // Apply noise properly - add noise but keep it centered around zero
      finalColor.rgb += noise - (noiseIntensity * 0.5);

      // Apply flicker
      finalColor.rgb *= (1.0 - flicker);

      gl_FragColor = finalColor;
    }
  `,
}
