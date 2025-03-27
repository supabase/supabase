import { blendSoftLight, luma, periodicNoise3d, shared, simplexNoise3d } from './helpers'

export const HUDShader = {
  vertexShader: `
precision mediump float;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragmentShader: `
  uniform sampler2D tDiffuse;
  uniform vec2    resolution;
  uniform float   vignetteRadius;
  uniform float   vignetteSmoothness;
  uniform float   time;

  varying vec2 vUv;
  varying vec2 screenPosition;

  ${shared}
  ${periodicNoise3d}
  ${simplexNoise3d}
  ${blendSoftLight}
  ${luma}

  // grain function
  // The MIT License (MIT) Copyright (c) 2015 Matt DesLauriers
  // Permission is hereby granted, free of charge, to any person obtaining a copy
  // of this software and associated documentation files (the "Software"), to deal
  // in the Software without restriction, including without limitation the rights
  // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:
  // 
  // The above copyright notice and this permission notice shall be included in all
  // copies or substantial portions of the Software.
  // 
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  // SOFTWARE.

  float grain(vec2 texCoord, vec2 resolution, float frame, float multiplier) {
      vec2 mult = texCoord * resolution;
      float offset = snoise3D(vec3(mult / multiplier, frame));
      float n1 = pnoise3D(vec3(mult, offset), vec3(1.0/texCoord * resolution, 1.0));
      return n1 / 2.0 + 0.5;
  }

  float grain(vec2 texCoord, vec2 resolution, float frame) {
      return grain(texCoord, resolution, frame, 2.5);
  }

  float grain(vec2 texCoord, vec2 resolution) {
      return grain(texCoord, resolution, 0.0);
  }

  // Vignette function
  // MIT License
  // 
  // Copyright (c) 2017 Tyler Lindberg
  // 
  // Permission is hereby granted, free of charge, to any person obtaining a copy
  // of this software and associated documentation files (the "Software"), to deal
  // in the Software without restriction, including without limitation the rights
  // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:
  // 
  // The above copyright notice and this permission notice shall be included in all
  // copies or substantial portions of the Software.
  // 
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  // SOFTWARE.

  float vignette(vec2 uv, float radius, float smoothness) {
    float diff = radius - distance(uv, vec2(0.5, 0.5));
    return smoothstep(-smoothness, smoothness, diff);
  }

  void main() {
    // Sample the diffuse texture to get base color with alpha

    vec4 blackBase = vec4(0.0, 0.0, 0.0, 1.0);

    float v = vignette(vUv, vignetteRadius, vignetteSmoothness);
    float invertedVignette = 1.0 - v;

    float minAlpha = 0.3;
    blackBase.a *= mix(minAlpha, 1.0, invertedVignette);

    vec4 textureColor = texture2D(tDiffuse, vUv);

    vec4 stackedColor = vec4(
      mix(blackBase.rgb, textureColor.rgb, textureColor.a),
      mix(blackBase.a, max(blackBase.a, textureColor.a), 0.8)
    );

    float grainSize = 3.0 + 4.0 * sin(time);
    vec3 g = vec3(grain(vUv, resolution / grainSize, time));
    
    vec3 noiseColor = blendSoftLight(vec3(0.2,0.2,0.2), g);
    
    float grainStrength = 0.02;
    stackedColor = vec4(
      mix(stackedColor.rgb, noiseColor, grainStrength),
      stackedColor.a
    );
  
    gl_FragColor = stackedColor;
  }
`,
  uniforms: {
    tDiffuse: { value: null as any },
    time: { value: 0.0 },
    resolution: { value: [70.0, 100.0] }, // Adjusted for Lygia noise scale
    vignetteSmoothness: { value: 0 },
    vignetteRadius: { value: 1 },
  },
}
