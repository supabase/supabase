import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GlitchPass } from './glitch'
import { CRTShader } from './crt-shader'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { coloredTextureMaterial } from './colored-texture-shader'

/**
 * Helper to simplifies controlling requestAnimationFrame
 * @param callback Animation callback function
 * @returns Object with start and stop functions
 */
export const createThreeAnimation = (callback: (time?: number) => void) => {
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
    debug?: boolean
  } = {}
) => {
  // Create scene
  const scene = new THREE.Scene()

  if (options.debug) {
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)
  }

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

  // Enable debug info if debug mode is enabled
  if (options.debug) {
    renderer.info.autoReset = false
    console.log('Three.js Debug Mode Enabled')
  }

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

  // Add stats display if debug mode is enabled
  let stats: { instance: Stats | null } = { instance: null }
  let orbitControls: { instance: OrbitControls | null } = { instance: null }
  if (options.debug) {
    import('three/examples/jsm/libs/stats.module.js').then(({ default: Stats }) => {
      const statsInstance = new Stats()
      statsInstance.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
      statsInstance.dom.style.position = 'absolute'
      statsInstance.dom.style.top = '0px'
      statsInstance.dom.style.left = '0px'
      container.appendChild(statsInstance.dom)
      stats.instance = statsInstance
    })

    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      // Create OrbitControls after the setup
      const controls = new OrbitControls(camera, renderer.domElement)

      // Configure controls as needed
      controls.enableDamping = true // Add smooth damping
      controls.dampingFactor = 0.05
      controls.enableZoom = true
      controls.enablePan = true
      orbitControls.instance = controls
    })
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
    stats,
    orbitControls,
    debug: options.debug || false,
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
      (gltf) => {
        resolve(gltf.scene)
      },
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
    ticketTextureSource?: string
    width?: number
    height?: number
    enhanceEmissive?: boolean
    debug?: boolean
    materialOptions?: {
      transparent?: boolean
      emissiveColor?: THREE.Color | number
      emissiveIntensity?: number
      color?: THREE.Color | number
    }
  } = {}
): Promise<THREE.Object3D> => {
  try {
    const useTextureMode = !(source.endsWith('.glb') || source.endsWith('.gltf'))

    if (!useTextureMode) {
      // Load the GLTF model
      const model = await loadGLTFModel(source)
      const ticketTexture = options.ticketTextureSource ? await loadTexture(options.ticketTextureSource) : null


      if(ticketTexture) {
        const ticket = model.getObjectByName('ticket')
        if (ticket instanceof THREE.Mesh) {
          // Store the original material properties
          const newMaterial = new THREE.ShaderMaterial(coloredTextureMaterial)
          newMaterial.uniforms.myTexture.value = ticketTexture

          ticket.material = newMaterial

        }
      }

      const objectsNames = ['planet', 'name', 'time', 'date', 'spicies', 'number'] as const
      const namedObjects = getNamedTextObjects(objectsNames, model)
      const textures = {} as {
        [key in (typeof objectsNames)[number]]?: ReturnType<typeof createTextureForObject>
      }

      for (let i = 0; i < namedObjects.length; i++) {
        const namedObject = namedObjects[i]
        const objectName = objectsNames[i]

        if (!namedObject) {
          console.error(`Named object ${objectsNames} not found`)
          continue
        }

        let text = ''
        switch (objectName) {
          case 'planet':
            text = 'Earth'
            break
          case 'name':
            text = 'John Doe'
            break

          case 'time':
            text = '00:12:00'
            break

          case 'date':
            text = '03/24/2025'
            break

          case 'spicies':
            text = 'Modern human'
            break

          case 'number':
            text = 'A001'
            break

          default:
            objectName satisfies never
        }

        const meshWithTexture = createTextureForObject(namedObject, text)
        textures[objectName] = meshWithTexture
      }

      // Calculate scale to fit the model within the specified width and height
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())

      // Center the model
      box.setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)

      // Add debug helpers if debug mode is enabled
      if (options.debug) {
        // Add bounding box helper
        const boxHelper = new THREE.BoxHelper(model, 0xff0000)
        model.add(boxHelper)

        // Add wireframe helper for each mesh
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const wireframe = new THREE.WireframeGeometry(child.geometry)
            const line = new THREE.LineSegments(wireframe)
            line.material = new THREE.LineBasicMaterial({ color: 0x00ffff })

            // Instead of adding to the model, add directly to the child mesh
            // This prevents double transformation
            child.add(line)

            // Reset position, rotation, and scale to match the parent mesh exactly
            line.position.set(0, 0, 0)
            line.rotation.set(0, 0, 0)
            line.scale.set(1, 1, 1)

            if (!child.name) {
              console.log('Debug: Mesh has no name', child)
            }

            console.log('Debug: Added wireframe to mesh', child.name || 'unnamed')
          }
        })

        console.log('Debug: Model dimensions', size)
        console.log('Debug: Center position', center)
      }

      // Only enhance emissive properties if explicitly requested
      // This respects the original GLTF materials by default
      if (options.enhanceEmissive) {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
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
    }
    throw new Error(`Failed to load model from: ${source}`)
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
 * Custom hook for Three.js setup and animation
 * @param setupCallback Callback function for setting up the scene
 * @returns Object with containerRef
 */
export const useThreeJS = (
  setupCallback: (container: HTMLElement) => {
    cleanup: () => void
    animate: (time?: number) => void
  }
) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const { cleanup, animate } = setupCallback(container)

    // Set up animation loop
    const { start, stop } = createThreeAnimation(animate)
    start()

    // Cleanup on unmount
    return () => {
      stop()
      cleanup()
    }
  }, [setupCallback])

  return { containerRef }
}

function getNamedTextObjects<TNamedObjects extends readonly string[]>(
  names: TNamedObjects,
  model: THREE.Group<THREE.Object3DEventMap>
): { [K in keyof TNamedObjects]: THREE.Object3D | null } {
  let namedObjects = Array(names.length).fill(null) as (THREE.Object3D | null)[]
  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const obj = model.getObjectByName(name)
    if (obj) {
      namedObjects[i] = obj
    }
  }

  return namedObjects as { [K in keyof TNamedObjects]: THREE.Object3D | null }
}

function createTextureForObject(object: THREE.Object3D, text: string) {
  // Update matrix in case object has moved
  object.updateWorldMatrix(true, true)

  const localBox = new THREE.Box3().setFromObject(object)
  const localSize = localBox.getSize(new THREE.Vector3())

  // Get world scale
  const worldScale = new THREE.Vector3()
  object.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), worldScale)

  // Apply world scale to get world size. Spline by default exports models with 0.01 scale
  const worldSize = new THREE.Vector3(
    localSize.x / Math.abs(worldScale.x),
    localSize.y / Math.abs(worldScale.y),
    localSize.z / Math.abs(worldScale.z)
  )

  const canvas = document.createElement('canvas')
  const canvasWidth = worldSize.x // Base canvas width
  const canvasHeight = Math.floor(canvasWidth * (localSize.y / localSize.x)) // Maintain aspect ratio

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // Get canvas context and set up text rendering
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(`Could not get 2D context for text "${text}"`)
  }

  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height)

  // Set text properties
  context.fillStyle = 'black'

  // Calculate font size based on canvas dimensions
  // Adjust the divisor to control text size relative to canvas
  const fontSize = Math.floor(canvasHeight)
  context.font = `bold ${fontSize}px Arial`

  // Center text
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.fillText(text, 0, canvas.height / 2)

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  // Create a plane geometry sized to match the named object
  const textPlane = new THREE.PlaneGeometry(worldSize.x, worldSize.y)
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false, // Prevents z-fighting
  })

  const textMesh = new THREE.Mesh(textPlane, textMaterial)

  object.add(textMesh)

  // Position the text slightly in front of the object
  // Adjust the z-offset as needed to prevent z-fighting
  // Offset position to align top-left corner instead of center
  textMesh.position.set(worldSize.x / 2, -worldSize.y / 2, 0.01)

  return textMesh
}
