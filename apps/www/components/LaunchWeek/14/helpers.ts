import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GlitchPass } from './glitch'
import { CRTShader } from './crt-shader'

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
    cameraPosition?: THREE.Vector3,
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
    glitchPass.uniforms.col_s.value = options.postprocessing.glitch.colS || 0
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
 * @param source URL of the GLTF model or texture to use for the ticket
 * @param options Configuration options for the ticket
 * @returns Promise that resolves with the created model
 */
export const createTicketMesh = async (
  source: string,
  options: {
    width?: number
    height?: number
    forceTextureMode?: boolean
    enhanceEmissive?: boolean
    materialOptions?: {
      transparent?: boolean
      emissiveColor?: THREE.Color | number
      emissiveIntensity?: number
      color?: THREE.Color | number
    }
  } = {}
): Promise<THREE.Object3D> => {
  try {
    const width = options.width || 4
    const height = options.height || 2
    
    // Determine if we should use texture mode
    const useTextureMode = options.forceTextureMode || 
      !(source.endsWith('.glb') || source.endsWith('.gltf'))
    
    if (!useTextureMode) {
      // Load the GLTF model
      const model = await loadGLTFModel(source)
      
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
      
      // Only enhance emissive properties if explicitly requested
      // This respects the original GLTF materials by default
      if (options.enhanceEmissive) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.emissive = options.materialOptions?.emissiveColor 
                    ? new THREE.Color(options.materialOptions.emissiveColor) 
                    : new THREE.Color(0xffffff)
                  mat.emissiveIntensity = options.materialOptions?.emissiveIntensity ?? 0.2
                }
              })
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissive = options.materialOptions?.emissiveColor 
                ? new THREE.Color(options.materialOptions.emissiveColor) 
                : new THREE.Color(0xffffff)
              child.material.emissiveIntensity = options.materialOptions?.emissiveIntensity ?? 0.2
            }
          }
        })
      }
      
      return model
    } else {
      // Load as a texture
      const texture = await loadTexture(source)
      
      // Create a plane geometry for the ticket
      const geometry = new THREE.PlaneGeometry(width, height)
      
      // Create a material with the loaded texture
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: options.materialOptions?.transparent !== undefined 
          ? options.materialOptions.transparent 
          : true,
        side: THREE.DoubleSide,
        emissive: options.materialOptions?.emissiveColor 
          ? new THREE.Color(options.materialOptions.emissiveColor) 
          : new THREE.Color(0xffffff),
        emissiveIntensity: options.materialOptions?.emissiveIntensity ?? 0.2,
        color: options.materialOptions?.color 
          ? new THREE.Color(options.materialOptions.color) 
          : new THREE.Color(0xffffff),
      })
      
      // Create the mesh
      const mesh = new THREE.Mesh(geometry, material)
      
      return mesh
    }
  } catch (error) {
    console.error('Error loading model/texture:', error)
    
    // Fallback to a simple plane with a default material if loading fails
    const geometry = new THREE.PlaneGeometry(options.width || 4, options.height || 2)
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
 * Helper function to create a ticket mesh specifically from a texture
 * @param textureUrl URL of the texture to use for the ticket
 * @param options Configuration options for the ticket
 * @returns Promise that resolves with the created mesh
 */
export const createTextureTicketMesh = async (
  textureUrl: string,
  options: {
    width?: number
    height?: number
    materialOptions?: {
      transparent?: boolean
      emissiveColor?: THREE.Color | number
      emissiveIntensity?: number
      color?: THREE.Color | number
    }
  } = {}
): Promise<THREE.Mesh> => {
  return createTicketMesh(textureUrl, {
    ...options,
    forceTextureMode: true
  }) as Promise<THREE.Mesh>
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
