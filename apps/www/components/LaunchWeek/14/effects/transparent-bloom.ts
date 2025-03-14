import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

// Custom shader to blend bloom with original while preserving alpha
const TransparentBlendShader = {
  uniforms: {
    baseTexture: { value: null },
    bloomTexture: { value: null }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    void main() {
      vec4 base = texture2D(baseTexture, vUv);
      vec4 bloom = texture2D(bloomTexture, vUv);
      
      // Add bloom only to non-transparent pixels
      gl_FragColor = vec4(base.rgb + bloom.rgb, base.a);
    }
  `
};

export class TransparentBloomPass extends UnrealBloomPass {
  constructor(resolution: any, strength: any, radius: any, threshold: any) {
    super(resolution, strength, radius, threshold);
    
    // Set clear values to preserve transparency
    this.clearColor = new THREE.Color(0x000000);
    this.oldClearAlpha = 0;
  }
  
  // Override the render method to preserve transparency
  render(renderer: any, writeBuffer: any, readBuffer: any, deltaTime: any, maskActive: any) {
    // Store the original autoClear value
    const originalAutoClear = renderer.autoClear;
    
    // Disable auto clearing to preserve alpha
    renderer.autoClear = false;
    
    // Call the parent class render method
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    
    // Restore the original autoClear value
    renderer.autoClear = originalAutoClear;
  }
}
