export const CRTShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    scanlineIntensity: { value: 0.6 },
    scanlineCount: { value: 360 },
    vignetteIntensity: { value: 0.5 },
    noiseIntensity: { value: 0.01 },
    flickerIntensity: { value: 0.01 },
    rgbShiftAmount: { value: 0.0 },
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

      // Scanline effect - thicker and more pronounced
      float scanlineFreq = scanlineCount * 0.7; // Reduce frequency for thicker lines
      float scanline = sin(vUv.y * scanlineFreq * 3.14159) * 0.5 + 0.5;
      scanline = pow(scanline, 0.7) * activeScanlineIntensity * 1.5; // Increase intensity and make lines thicker with lower power
      
      // Apply scanline as a multiplicative overlay with stronger effect
      vec4 scanlineColor = mix(shiftedColor, shiftedColor * (1.0 - scanline), activeScanlineIntensity * 1.2);

      // Vignette effect
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float vignette = smoothstep(0.3, 0.85, dist) * activeVignetteIntensity;
      
      // Apply vignette as the final overlay effect
      vec4 finalColor = scanlineColor * (1.0 - vignette * 0.7);
      
      // Blend between original and effect based on intensity
      vec4 final = mix(originalColor, finalColor, intensity);
      final.a = originalColor.a;
      gl_FragColor = final;
    }
  `,
}
