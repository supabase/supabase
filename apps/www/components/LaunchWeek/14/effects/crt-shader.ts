import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export const CRTShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    scanlineIntensity: { value: 0.7 },
    scanlineCount: { value: 320 },
    vignetteIntensity: { value: 0.5 },
    noiseIntensity: { value: 0.1 },
    flickerIntensity: { value: 0.02 },
    rgbShiftAmount: { value: 0.0015 },
    // Add intensity control
    intensity: { value: 1.0 },
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
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float vignetteIntensity;
    uniform float noiseIntensity;
    uniform float flickerIntensity;
    uniform float rgbShiftAmount;
    uniform float intensity;

    varying vec2 vUv;

    // Random function
    // https://stackoverflow.com/a/10625698
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      // Get original color
      vec4 originalColor = texture2D(tDiffuse, vUv);
      
      // Skip effects if intensity is zero
      if (intensity <= 0.0) {
        gl_FragColor = originalColor;
        return;
      }
      
      // Scale effect parameters by intensity
      float activeRGBShift = rgbShiftAmount * intensity;
      float activeScanlineIntensity = scanlineIntensity * intensity;
      float activeVignetteIntensity = vignetteIntensity * intensity;
      float activeNoiseIntensity = noiseIntensity * intensity;
      float activeFlickerIntensity = flickerIntensity * intensity;
      
      // RGB shift effect - more subtle to preserve detail
      vec2 shiftR = vec2(activeRGBShift, 0.0);
      vec2 shiftG = vec2(0.0, activeRGBShift);

      float r = texture2D(tDiffuse, vUv + shiftR).r;
      float g = texture2D(tDiffuse, vUv + shiftG).g;
      float b = texture2D(tDiffuse, vUv).b;

      vec4 shiftedColor = vec4(r, g, b, originalColor.a);

      // Scanline effect - more subtle
      float scanline = sin(vUv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
      scanline = pow(scanline, 1.0) * activeScanlineIntensity;
      
      // Apply scanline as a multiplicative overlay
      vec4 scanlineColor = mix(shiftedColor, shiftedColor * (1.0 - scanline), activeScanlineIntensity);

      // Vignette effect
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float vignette = smoothstep(0.4, 0.75, dist) * activeVignetteIntensity;
      
      // Apply vignette (darkens edges, not center)
      vec4 vignetteColor = scanlineColor * (1.0 - vignette * 0.7);

      // Noise - more subtle
      float noise = random(vUv + time * 0.001) * activeNoiseIntensity;
      
      // Apply noise properly - add noise but keep it centered around zero
      vec4 noiseColor = vignetteColor;
      noiseColor.rgb += noise - (activeNoiseIntensity * 0.5);
      
      // Completely revised flicker implementation that won't fade out
      // Use modulo time to create a repeating pattern that never diminishes
      float timeModA = mod(time * 0.7, 10.0);
      float timeModB = mod(time * 1.5, 5.0);
      
      // Create two independent flicker patterns
      float flickerA = step(0.95, random(vec2(timeModA, 0.0))) * random(vec2(timeModA, 1.0));
      float flickerB = step(0.98, random(vec2(timeModB, 2.0))) * random(vec2(timeModB, 3.0));
      
      // Combine flickers with a constant baseline
      float flicker = (flickerA * 16.0 + flickerB * 8.0 + 2.0) * activeFlickerIntensity;
      
      // Apply flicker with a guaranteed minimum effect
      vec4 finalColor = noiseColor * (1.0 - flicker);
      
      // Blend between original and effect based on intensity
      gl_FragColor = mix(originalColor, finalColor, intensity);
    }
  `,
}
