import { ShaderMaterial } from "three/src/materials/ShaderMaterial";
import { Color } from "three/src/math/Color";

// vertexShader.js
const vertexShader = `
  varying vec2 vUv;

  void main() {
    // Pass UV coords to the fragment shader
    vUv = uv;

    // Standard transform
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// fragmentShader.js
const fragmentShader = `
  // A sampler2D to receive your texture
  uniform sampler2D myTexture;

  // Base color, passed in as a uniform
  uniform vec3 baseColor;

  // UV coords from the vertex shader
  varying vec2 vUv;

  void main() {
    // Fetch the texture color
    vec4 texColor = texture2D(myTexture, vUv);

    // Simple alpha-based blend:
    // The texture's alpha decides how strongly we blend it over the base color
    vec3 blendedColor = mix(baseColor, texColor.rgb, texColor.a);

    // Output final color
    gl_FragColor = vec4(blendedColor, 1.0);
  }
`;

export const coloredTextureMaterial = {
  uniforms: {
    myTexture: { value: null },
    // For example, a green base color
    baseColor: { value: new Color(0xffffff) },
  },
  vertexShader,
  fragmentShader,
};
