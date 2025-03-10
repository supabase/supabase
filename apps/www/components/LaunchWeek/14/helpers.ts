import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GlitchPass } from './glitch'

// CRT Shader implementation
const CRTShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    scanlineIntensity: { value: 0.5 },
    scanlineCount: { value: 320 },
    vignetteIntensity: { value: 0.8 },
    noiseIntensity: { value: 0.05 },
    flickerIntensity: { value: 0.03 },
    rgbShiftAmount: { value: 0.003 },
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
      float vignette = smoothstep(0.5, 0.2, dist) * vignetteIntensity;
      
      // Noise
      float noise = random(vUv + time * 0.001) * noiseIntensity;
      
      // Flicker
      float flicker = random(vec2(time * 0.001, 0.0)) * flickerIntensity;
      
      // Combine effects
      vec4 finalColor = shiftedColor;
      finalColor.rgb *= (1.0 - scanline);
      finalColor.rgb *= (1.0 - vignette);
      finalColor.rgb += noise;
      finalColor.rgb *= (1.0 - flicker);
      
      gl_FragColor = finalColor;
    }
  `,
}

/**
 * Custom hook for managing requestAnimationFrame
 * @param callback Animation callback function
 * @returns Object with start and stop functions
 */
export const useThreeAnimation = (callback: (time?: number) => void) => {
  const requestRef = { current: undefined } as { current: number | undefined }
  const previousTimeRef = { current: undefined } as { current: number | undefined }

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      callback(time)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  const start = () => {
    requestRef.current = requestAnimationFrame(animate)
  }

  const stop = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
  }

  return { start, stop }
}

/**
 * Helper function to create a Three.js setup with scene, camera, renderer, and post-processing
 * @param container DOM element to render into
 * @param options Configuration options
 * @returns Object with scene, camera, renderer, composer, and resize function
 */
export const createThreeSetup = (
  container: HTMLElement,
  options: {
    cameraPosition?: THREE.Vector3
    postprocessing?: {
      bloom?: {
        enabled: boolean
        strength?: number
        radius?: number
        threshold?: number
      }
      glitch?: {
        enabled: boolean
        dtSize?: number
        colS?: number
      }
      crt?: {
        enabled: boolean
      }
    }
  } = {}
) => {
  // Create scene
  const scene = new THREE.Scene()

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.copy(options.cameraPosition || new THREE.Vector3(0, 0, 5))

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // Create composer for post-processing
  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  // Add bloom pass if enabled
  let bloomPass: UnrealBloomPass | null = null
  if (options.postprocessing?.bloom?.enabled) {
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      options.postprocessing.bloom.strength || 1.5,
      options.postprocessing.bloom.radius || 0.4,
      options.postprocessing.bloom.threshold || 0.85
    )
    composer.addPass(bloomPass)
  }

  // Add glitch pass if enabled
  let glitchPass: GlitchPass | null = null
  if (options.postprocessing?.glitch?.enabled) {
    glitchPass = new GlitchPass(options.postprocessing.glitch.dtSize || 64)
    glitchPass.setIntensity(options.postprocessing.glitch.colS || 0)
    composer.addPass(glitchPass)
  }

  // Add CRT pass if enabled
  let crtPass: ShaderPass | null = null
  if (options.postprocessing?.crt?.enabled) {
    crtPass = new ShaderPass(CRTShader)
    crtPass.uniforms.resolution.value.set(container.clientWidth, container.clientHeight)
    composer.addPass(crtPass)
  }

  // Resize function
  const resize = () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
    composer.setSize(container.clientWidth, container.clientHeight)

    // Update resolution uniform for CRT shader
    if (crtPass) {
      crtPass.uniforms.resolution.value.set(container.clientWidth, container.clientHeight)
    }
  }

  return {
    scene,
    camera,
    renderer,
    composer,
    resize,
    bloomPass,
    glitchPass,
    crtPass,
  }
}

/**
 * Helper function to load a texture
 * @param url URL of the texture to load
 * @returns Promise that resolves with the loaded texture
 */
export const loadTexture = (url: string): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(
      url,
      (texture) => resolve(texture),
      undefined,
      (error) => reject(error)
    )
  })
}

/**
 * Helper function to load a GLTF model
 * @param url URL of the GLTF model to load
 * @returns Promise that resolves with the loaded model
 */
export const loadGLTFModel = (url: string): Promise<THREE.Group> => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    )
  })
}

/**
 * Helper function to create a flight ticket mesh
 * @param modelUrl URL of the GLTF model to use for the ticket
 * @param width Width of the ticket
 * @param height Height of the ticket
 * @returns Promise that resolves with the created model
 */
export const createTicketMesh = async (
  modelUrl: string,
  width: number = 4,
  height: number = 2
): Promise<THREE.Object3D> => {
  try {
    // Check if the URL ends with .glb or .gltf to determine if it's a 3D model
    if (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf')) {
      // Load the GLTF model
      const model = await loadGLTFModel(modelUrl)
      
      // Calculate scale to fit the model within the specified width and height
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      
      // Calculate scale factors to fit the model within the specified dimensions
      const scaleX = width / size.x
      const scaleY = height / size.y
      const scale = Math.min(scaleX, scaleY)
      
      // Apply the scale
      model.scale.set(scale, scale, scale)
      
      // Center the model
      box.setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      
      // Add emissive material to all meshes in the model for better visibility with CRT effect
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.emissive = new THREE.Color(0xffffff)
                mat.emissiveIntensity = 0.2
              }
            })
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.emissive = new THREE.Color(0xffffff)
            child.material.emissiveIntensity = 0.2
          }
        }
      })
      
      return model
    } else {
      // If it's not a 3D model, load it as a texture
      const texture = await loadTexture(modelUrl)
      
      // Create a plane geometry for the ticket
      const geometry = new THREE.PlaneGeometry(width, height)
      
      // Create a material with the loaded texture
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.2,
      })
      
      // Create the mesh
      const mesh = new THREE.Mesh(geometry, material)
      
      return mesh
    }
  } catch (error) {
    console.error('Error loading model/texture:', error)
    
    // Fallback to a simple plane with a default material if loading fails
    const geometry = new THREE.PlaneGeometry(width, height)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.2,
    })
    
    return new THREE.Mesh(geometry, material)
  }
}

/**
 * Custom hook for Three.js setup and animation
 * @param setupCallback Callback function for setting up the scene
 * @returns Object with containerRef
 */
export const useThreeJS = (
  setupCallback: (container: HTMLElement) => { cleanup: () => void; animate: (time?: number) => void }
) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const { cleanup, animate } = setupCallback(container)
    
    // Set up animation loop
    const { start, stop } = useThreeAnimation(animate)
    start()
    
    // Cleanup on unmount
    return () => {
      stop()
      cleanup()
    }
  }, [setupCallback])
  
  return { containerRef }
}

