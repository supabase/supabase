import * as THREE from 'three'
import { colorObjToRgb, loadGLTFModel } from '../helpers'
import SceneRenderer, { BaseScene } from '../utils/SceneRenderer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { Camera, Euler, MathUtils, Scene, Vector3 } from 'three'
import { GlitchPass } from '../effects/glitch'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { CRTShader } from '../effects/crt-shader'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass'
import { TransparentBloomPass } from '../effects/transparent-bloom'

interface TicketSceneState {
  visible: boolean
  secret: boolean
  platinum: boolean
  frontside: boolean
  ticketNumber: number
  narrow: boolean
  texts: {
    username: string
    seatCode: string
    date: string
  }
}

interface TicketSceneOptions {
  defaultVisible?: boolean
  defaultSecret?: boolean
  defaultPlatinum?: boolean
  user: {
    id?: string
    name?: string
    ticketNumber?: number
  }
  narrow?: boolean
  onSeatChartButtonClicked?: () => void
  onWebsiteButtonClicked?: () => void
  onGoBackButtonClicked?: () => void
}

type AvailableTextures = (typeof TicketScene)['TEXTURE_NAMES'][number]

interface TextureDescriptor {
  url: string
  cachedData: THREE.Texture | null
}

class TicketScene implements BaseScene {
  raycaster = new THREE.Raycaster()
  sceneUrl = '/images/launchweek/14/ticket-model.glb'

  textureImages = {
    basic: {
      back: {
        url: '/images/launchweek/14/back-basic-ticket-texture.png',
        cachedData: null,
      } as TextureDescriptor,
      front: {
        url: '/images/launchweek/14/front-basic-ticket-texture.png',
        cachedData: null,
      } as TextureDescriptor,

      bgColor: { rgb: 0x202020, alpha: 1 },
      textColor: { rgb: 0xffffff, alpha: 1 },
      textDimmedColor: { rgb: 0x515151, alpha: 1 },
      textNeonColor: { rgb: 0xffffff, alpha: 1 },
      textNeonDimmedColor: { rgb: 0x515151, alpha: 1 },
      transparentBg: { rgb: 0x000000, alpha: 0 },
    },
    secret: {
      back: {
        url: '/images/launchweek/14/back-secret-ticket-texture.png',
        cachedData: null,
      } as TextureDescriptor,
      front: {
        url: '/images/launchweek/14/front-secret-ticket-texture.png',
        cachedData: null,
      } as TextureDescriptor,
      seat: {
        url: '',
        cachedData: null,
      } as TextureDescriptor,
      bgColor: { rgb: 0x050505, alpha: 1 },
      textColor: { rgb: 0xffffff, alpha: 1 },
      textDimmedColor: { rgb: 0x515151, alpha: 1 },
      textNeonColor: { rgb: 0x2cf494, alpha: 1 },
      textNeonDimmedColor: { rgb: 0x12623b, alpha: 1 },
      transparentBg: { rgb: 0x2cf494, alpha: 0.4 },
      seatPath: new Path2D(
        'M0.824219 0.661133H41.2231C48.5923 0.661133 54.5703 6.63925 54.5703 14.0084V41.06C54.5703 48.4292 48.5923 54.4072 41.2231 54.4072H0.824219V0.661133Z'
      ),
    },
    platinum: {
      back: {
        url: '/images/launchweek/14/back-platinum-ticket-texture.png',
        cachedData: null,
      } as TextureDescriptor,
      front: {
        url: '/images/launchweek/14/front-platinum-ticket-texture.png',
        cachedData: null,
      } as TextureDescriptor,

      bgColor: { rgb: 0x050505, alpha: 1 },
      textColor: { rgb: 0xffc73a, alpha: 1 },
      textDimmedColor: { rgb: 0xffc73a, alpha: 1 },
      textNeonColor: { rgb: 0xffc73a, alpha: 1 },
      textNeonDimmedColor: { rgb: 0xffc73a, alpha: 1 },
      transparentBg: { rgb: 0xffc73a, alpha: 0.4 },
    },
  }

  typography = {
    main: {
      family: 'Departure Mono',
      relativeSize: 100 / 1400,
    },
    ticketNumber: {
      family: 'Nippo-Variable',
      weight: 400,
      relativeSize: 125 / 1400,
    },
  }

  texts = {
    user: {
      x: 367 / 2000,
      y: 533 / 1400,
    },
    date: {
      x: 1185 / 2000,
      y: 255 / 1400,
    },
    ticketNumber: {
      x: 368 / 2000,
      y: 1077.69 / 1400,
    },
    ticketNumberBack: {
      x: 368 / 2000,
      y: 1070 / 1400,
    },
    seatStart: {
      x: 561.89 / 2000,
      y: 739.4 / 1400,
    },
    seatPositions: {
      x: [
        0 / 2000,
        99.82 / 2000,
        199.77 / 2000,
        389.84 / 2000,
        488.05 / 2000,
        588.25 / 2000,
        688.43 / 2000,
        788.63 / 2000,
      ],
      y: [0 / 1400, 71.61 / 1400, 163.5 / 1400, 235.54 / 1400],
    },
  }

  fonts: ConstructorParameters<typeof FontFace>[] = [
    [
      'Departure Mono',
      'url("/fonts/launchweek/14/DepartureMono-Regular.woff2") format("woff2")',
      {
        weight: '400',
        style: 'normal',
      },
    ],
    [
      'Nippo-Variable',
      'url("/fonts/launchweek/14/Nippo-Variable.woff2") format("woff2")',
      {
        weight: '400 700',
        style: 'normal',
      },
    ],
  ]

  state: TicketSceneState

  resolutions = {
    0: {
      ticketPosition: new Vector3(0, 0, -1.6),
      ticketScale: new Vector3(0.55, 0.55, 0.55),
    },

    480: {
      ticketPosition: new Vector3(0, 0, -1.5),
      ticketScale: new Vector3(0.65, 0.65, 0.65),
    },

    768: {
      ticketPosition: new Vector3(0, 0, -0.5),
      ticketScale: new Vector3(0.65, 0.65, 0.65),
    },

    // 784: {
    //   ticketPosition: new Vector3(0, 0, -0.5),
    //   ticketScale: new Vector3(0.85, 0.85, 0.85),
    // },

    1024: {
      ticketPosition: new Vector3(0, 0, -0.5),
      ticketScale: new Vector3(1, 1, 1),
    },
  }

  narrowResolutions = {
    0: {
      ticketPosition: new Vector3(0, 0, -1.6),
      ticketScale: new Vector3(0.65, 0.65, 0.65),
    },

    480: {
      ticketPosition: new Vector3(0, 0, -1.5),
      ticketScale: new Vector3(0.65, 0.65, 0.65),
    },

    768: {
      ticketPosition: new Vector3(0, 0, -0.5),
      ticketScale: new Vector3(0.65, 0.65, 0.65),
    },

    // 784: {
    //   ticketPosition: new Vector3(0, 0, -0.5),
    //   ticketScale: new Vector3(0.85, 0.85, 0.85),
    // },

    1024: {
      ticketPosition: new Vector3(3.0, 0, 0),
      ticketScale: new Vector3(1.2, 1.2, 1.2),
    },

    1280: {
      ticketPosition: new Vector3(4.0, 0, 0),
      ticketScale: new Vector3(1.4, 1.4, 1.4),
    },
  }

  private _internalState = {
    naturalRotation: new Vector3(0, 0, Math.PI),
    naturalPosition: new Vector3(0, 0, -0.5),
    naturalScale: new Vector3(1, 1, 1),

    fontsLoaded: false,
    loadedTextureType: null as 'basic' | 'secret' | 'platinum' | null,
    effectsIntensity: 0,
  }

  private _sceneConfig = {
    camera: {
      position: new Vector3(0, 10, 0),
      rotation: new Euler(MathUtils.degToRad(-90), 0, 0),
      fov: 30,
    },
  }

  private _sceneRenderer: SceneRenderer | null = null

  private _ticket: THREE.Scene | null = null
  private _modelRenderPass: RenderPass | null = null
  private static TEXTURE_NAMES = [
    'TicketFront',
    'TicketBack',
    'TicketEdge',
    'TicketFrontWebsiteButton',
    'TicketFrontSeatChartButton',
    'TicketBackGoBackButton',
    'TicketBackWebsiteButton',
  ] as const
  private static TEXTURE_PIXEL_DENSITY_FACTOR = 400
  private texturePlaneMapping: { [key in AvailableTextures]?: 'back' | 'front' | 'edge' } = {
    TicketFront: 'front',
    TicketBack: 'back',
    TicketEdge: 'edge',
    TicketFrontWebsiteButton: 'front',
    TicketFrontSeatChartButton: 'front',
    TicketBackGoBackButton: 'back',
    TicketBackWebsiteButton: 'back',
  }

  private _textureCanvases: {
    [key in AvailableTextures]?: { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D }
  } = {}

  private _namedMeshes: { [key in AvailableTextures]?: THREE.Mesh } = {}

  private _bloomPass: TransparentBloomPass | null = null
  private _glitchPass: GlitchPass | null = null
  private _crtPass: ShaderPass | null = null
  private _effectsEnabled = false
  private _fxaaPass: ShaderPass | null = null

  constructor(private options: TicketSceneOptions) {
    this.state = {
      visible: options.defaultVisible ?? false,
      secret: options.defaultSecret || false,
      platinum: options.defaultPlatinum || false,
      frontside: true,
      ticketNumber: options.user.ticketNumber || 0,
      narrow: Boolean(options.narrow),
      texts: {
        username: options.user.name ?? '',
        date: 'MAR 31—APR 4',
        // Start assigning seats from A001
        seatCode: (466561 + (options.user.ticketNumber || 0)).toString(36),
      },
    }
  }

  getId(): string {
    return 'TicketScene'
  }

  async setup(context: SceneRenderer): Promise<Scene> {
    this._sceneRenderer = context

    // Load fonts before loading the model
    await this._loadFonts()
    await this._preloadAllTextureSets()

    const resolutionDescriptor = this.getResolutionDescriptor(window.innerWidth)

    this._internalState.naturalPosition.set(
      resolutionDescriptor.ticketPosition.x,
      resolutionDescriptor.ticketPosition.y,
      resolutionDescriptor.ticketPosition.z
    )

    this._internalState.naturalScale.set(
      resolutionDescriptor.ticketScale.x,
      resolutionDescriptor.ticketScale.y,
      resolutionDescriptor.ticketScale.z
    )

    const gltf = await loadGLTFModel(this.sceneUrl)

    this._ticket = gltf.scene.getObjectByName('Plane') as unknown as Scene

    if (!this.state.visible) this._ticket.scale.set(0, 0, 0)
    this._ticket.rotation.setFromVector3(this._internalState.naturalRotation)
    this._ticket.position.set(
      this._internalState.naturalPosition.x,
      this._internalState.naturalPosition.y,
      this._internalState.naturalPosition.z
    )

    this._setCamera(context.camera)
    this._modelRenderPass = new RenderPass(gltf.scene as unknown as Scene, context.camera)

    // Set up post-processing effects but keep them disabled initially
    this._setupPostProcessingEffects(context)

    // Important: Don't set clear values for the render pass
    // Let the renderer handle clearing

    // Set renderer clear color to make background transparent
    context.renderer.setClearColor(0x000000, 0)

    // Keep everything in linear space until the end of the pipeline
    // Don't set outputColorSpace here
    context.renderer.autoClear = false

    // Add ambient light with increased intensity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    this._ticket.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 5, 5)
    gltf.scene.add(directionalLight)

    // Add a point light to better illuminate the placeholder
    const pointLight = new THREE.PointLight(0xffffff, 1.0)
    pointLight.position.set(0, 0, 5)
    this._ticket.add(pointLight)

    this._setupNamedObjects()
    this._setupTextureCanvases()
    await this._loadTextures()

    context.composer.addPass(this._modelRenderPass)

    this._fxaaPass = new ShaderPass(FXAAShader)
    this._fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * 2)
    this._fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * 2)

    // Add the effects passes but with zero intensity
    if (this._glitchPass) context.composer.addPass(this._glitchPass)
    if (this._crtPass) context.composer.addPass(this._crtPass)
    if (this._bloomPass) context.composer.addPass(this._bloomPass)
    context.composer.addPass(new OutputPass())

    context.composer.addPass(this._fxaaPass)

    return gltf.scene as unknown as Scene
  }

  update(context: SceneRenderer, time?: number): void {
    // Clear the renderer with transparent background before rendering
    context.renderer.clear(true, true, true)

    const mainRenderPass = context.composer.passes[0]
    if (mainRenderPass instanceof RenderPass) {
      this._updateNaturalPosition()
      this._updateTicketSize()
      this._updateTicketPosition()
      if (this._ticket) this._updateTicketToFollowMouse(this._ticket, time)
      this._updatePasses(time)
    }
  }

  cleanup(): void {}

  resize(_ev: UIEvent): void {
    const resolutionDescriptor = this.getResolutionDescriptor(window.innerWidth)

    this._internalState.naturalPosition.set(
      resolutionDescriptor.ticketPosition.x,
      resolutionDescriptor.ticketPosition.y,
      resolutionDescriptor.ticketPosition.z
    )

    this._internalState.naturalScale.set(
      resolutionDescriptor.ticketScale.x,
      resolutionDescriptor.ticketScale.y,
      resolutionDescriptor.ticketScale.z
    )

    if (this._sceneRenderer && this._fxaaPass) {
      this._fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * 2)
      this._fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * 2)
    }

    return
  }

  showFrontSide() {
    this.state.frontside = true
  }

  showBackSide() {
    this.state.frontside = false
  }

  async upgradeToSecret() {
    this.state.secret = true
    await this._loadTextures()
    // Start enabling effects gradually
    this._enableSecretEffects()
  }

  async upgradeToPlatinum() {
    this.state.platinum = true
    await this._loadTextures()
  }

  // In your click method
  click(_e: MouseEvent) {
    if (!this._sceneRenderer || !this._sceneRenderer.mousePositionState?.isWithinContainer) return

    const mousePosition = this._sceneRenderer.mousePositionState

    this.raycaster.setFromCamera(
      new THREE.Vector2(mousePosition.containerX, mousePosition.containerY),
      this._sceneRenderer.camera
    )

    // Get all meshes to check for intersection
    const meshes = Object.values(this._namedMeshes).filter(Boolean) as THREE.Mesh[]

    // Check for intersections
    const intersects = this.raycaster.intersectObjects(meshes, false)
    //
    for (const intersect of intersects) {
      const clickedMesh = intersect.object as THREE.Mesh

      // Handle click based on which mesh was clicked
      if (clickedMesh === this._namedMeshes.TicketFrontWebsiteButton) {
        this.options.onWebsiteButtonClicked?.()
        // Add your action here
      } else if (clickedMesh === this._namedMeshes.TicketFrontSeatChartButton) {
        this.options.onSeatChartButtonClicked?.()
        // Add your action here
      } else if (clickedMesh === this._namedMeshes.TicketBackGoBackButton) {
        this.options.onGoBackButtonClicked?.()
      } else if (clickedMesh === this._namedMeshes.TicketBackWebsiteButton) {
        this.options.onWebsiteButtonClicked?.()
        // Add your action here
      }
    }
  }

  setVisible(value: boolean) {
    this.state.visible = value
  }

  setTicketNumber(ticketNumber: number) {
    this.state.ticketNumber = ticketNumber
    this.state.texts.seatCode = (466561 + ticketNumber).toString(36)
  }

  setUserName(name: string) {
    this.state.texts.username = name
  }

  reloadTextures() {
    this._loadTextures(true)
  }

  devicePixelRatioChanged(newPixelRatio: number, oldPixelRatio: number): void {
    // Update FXAA pass resolution values if it exists
    if (this._fxaaPass) {
      this._fxaaPass.material.uniforms['resolution'].value.x =
        1 / (window.innerWidth * newPixelRatio)
      this._fxaaPass.material.uniforms['resolution'].value.y =
        1 / (window.innerHeight * newPixelRatio)
    }

    // Regenerate texture canvases with new pixel ratio
    this._setupTextureCanvases()

    // Reload textures to apply new pixel ratio
    this._loadTextures(true)

    // Update bloom pass resolution if it exists
    if (this._bloomPass && this._sceneRenderer) {
      this._bloomPass.resolution.set(
        this._sceneRenderer.container.clientWidth * newPixelRatio,
        this._sceneRenderer.container.clientHeight * newPixelRatio
      )
    }
  }

  private _enableSecretEffects() {
    if (this._effectsEnabled) return // Already enabled

    this._effectsEnabled = true
    this._internalState.effectsIntensity = 0

    // Enable all passes
    if (this._glitchPass) this._glitchPass.enabled = true
    if (this._crtPass) this._crtPass.enabled = true
    if (this._bloomPass) this._bloomPass.enabled = true
  }

  private _updatePasses(time?: number) {
    if (!this._sceneRenderer) {
      throw new Error('SceneRenderer not loaded')
    }

    const mousePosition = this._sceneRenderer.mousePositionState

    // Update time-based uniforms for shader passes
    if (this._crtPass && this._crtPass.uniforms['time']) {
      this._crtPass.uniforms['time'].value = time
    }

    // Update effect intensities if effects are enabled
    if (this._effectsEnabled) {
      // Gradually increase effect intensity over time
      this._internalState.effectsIntensity = Math.min(
        this._internalState.effectsIntensity + 0.01,
        1.0
      )

      // Update glitch pass intensity
      if (this._glitchPass) {
        const glitchIntensity = mousePosition?.mouseIntensity ?? 1
        this._glitchPass.setIntensity(glitchIntensity * this._internalState.effectsIntensity * 4)
      }

      // Update CRT shader intensity
      if (this._crtPass && this._crtPass.uniforms['intensity']) {
        this._crtPass.uniforms['intensity'].value = this._internalState.effectsIntensity * 1 // Scale to desired max (0.3)
      }

      // Update bloom pass parameters based on secret version state
      if (this._bloomPass) {
        if (this.state.secret) {
          // Gradually increase bloom strength from 0 to 3 without affecting transparency
          const targetStrength = 3.0
          const currentStrength = this._bloomPass.strength || 0
          const newStrength = currentStrength + (targetStrength - currentStrength) * 0.05
          this._bloomPass.strength = newStrength

          // Gradually decrease threshold for more bloom
          const targetThreshold = 0.2
          const currentThreshold = this._bloomPass.threshold || 1.0
          const newThreshold = currentThreshold - (currentThreshold - targetThreshold) * 0.05
          this._bloomPass.threshold = newThreshold
        } else {
          // Gradually reset bloom to initial values
          this._bloomPass.strength = Math.max(0, (this._bloomPass.strength || 0) - 0.05)
          this._bloomPass.threshold = Math.min(1.0, (this._bloomPass.threshold || 0.2) + 0.05)
        }
      }
    } else {
      // If effects are disabled, ensure all intensities are zero
      this._internalState.effectsIntensity = 0

      if (this._glitchPass) this._glitchPass.setIntensity(0)
      if (this._crtPass && this._crtPass.uniforms['intensity'])
        this._crtPass.uniforms['intensity'].value = 0
      if (this._bloomPass) {
        this._bloomPass.strength = 0
        this._bloomPass.threshold = 1.0
        this._bloomPass.radius = 0.5
      }
    }
  }

  private _setupPostProcessingEffects(context: SceneRenderer) {
    // Create glitch pass and disable it initially
    const glitchPass = new GlitchPass(521)
    glitchPass.enabled = false // Start disabled
    glitchPass.uniforms.col_s.value = 0
    glitchPass.setIntensity(0) // Start with zero intensity
    this._glitchPass = glitchPass

    // Create CRT pass with initial zero intensity
    const crtPass = new ShaderPass(CRTShader)
    crtPass.enabled = false // Start disabled
    crtPass.uniforms.intensity.value = 0 // Start with zero intensity
    this._crtPass = crtPass

    if (!this._ticket) throw new Error('Ticket not loaded')
    if (!this._sceneRenderer) throw new Error('SceneRenderer not loaded')

    // Create bloom pass with initial zero intensity
    const bloomPass = new TransparentBloomPass(
      new THREE.Vector2(context.container.clientWidth, context.container.clientHeight),
      0, // Initial strength (0-3)
      0.5, // Initial radius
      1.0 // Initial threshold (higher = less bloom)
    )

    bloomPass.enabled = false // Start disabled
    this._bloomPass = bloomPass
  }

  private _updateTicketToFollowMouse(scene: THREE.Scene, dt?: number) {
    if (!this._sceneRenderer) {
      throw new Error('SceneRenderer not loaded')
    }

    const mousePosition = this._sceneRenderer.mousePositionState

    if (mousePosition.isWithinContainer) {
      // Get the scene's current position in world space
      const scenePosition = new THREE.Vector3()
      scene.getWorldPosition(scenePosition)

      // Convert scene position to normalized device coordinates (NDC)
      const sceneNDC = scenePosition.clone()
      sceneNDC.project(this._sceneRenderer.camera)

      // Calculate mouse position relative to the scene's position
      // This gives us a vector from the scene center to the mouse
      const relativeMouseX = mousePosition.containerX - sceneNDC.x
      const relativeMouseY = mousePosition.containerY - sceneNDC.y

      // Scale the rotation based on distance from scene center
      // The further from center, the more rotation
      const distanceScale = Math.min(
        1.0,
        Math.sqrt(relativeMouseX * relativeMouseX + relativeMouseY * relativeMouseY) * 2
      )

      // Calculate rotation angles with distance scaling
      // Limit the rotation angles to a reasonable range
      const targetRotationX = MathUtils.clamp(relativeMouseY * -0.2 * distanceScale, -0.3, 0.3)
      const targetRotationZ = MathUtils.clamp(relativeMouseX * -0.3 * distanceScale, -0.4, 0.4)

      // Apply smooth rotation with a smaller lerp factor
      const lerpFactor = Math.min(dt ?? 0.05, 0.05)
      scene.rotation.x = MathUtils.lerp(
        scene.rotation.x,
        this._internalState.naturalRotation.x + targetRotationX,
        lerpFactor
      )
      scene.rotation.z = MathUtils.lerp(
        scene.rotation.z,
        this._internalState.naturalRotation.z + targetRotationZ,
        lerpFactor
      )
    } else {
      // Return to neutral position more slowly
      const lerpFactor = Math.min(dt ?? 0.03, 0.03)
      scene.rotation.x = MathUtils.lerp(
        scene.rotation.x,
        this._internalState.naturalRotation.x,
        lerpFactor
      )
      scene.rotation.z = MathUtils.lerp(
        scene.rotation.z,
        this._internalState.naturalRotation.z,
        lerpFactor
      )
    }
  }

  private _updateNaturalPosition() {
    if (this.state.frontside) {
      this._internalState.naturalRotation.set(0, 0, Math.PI)
    } else {
      this._internalState.naturalRotation.set(0, 0, 0)
    }
  }

  private _setCamera(camera: Camera) {
    camera.position.copy(this._sceneConfig.camera.position)
    camera.rotation.copy(this._sceneConfig.camera.rotation)

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = this._sceneConfig.camera.fov
      camera.updateProjectionMatrix()
    }
  }

  _invisibleScaleVector = new Vector3(0, 0, 0)

  private _updateTicketSize() {
    if (this.state.visible) {
      this._ticket?.scale.lerp(this._internalState.naturalScale, 0.1)
    } else {
      this._ticket?.scale.lerp(this._invisibleScaleVector, 0.1)
    }

    // Update world matrices after scaling to ensure raycaster works correctly
    this._ticket?.updateMatrixWorld(true)

    // Update bounding boxes for all meshes after scaling
    this._updateMeshBoundingBoxes()
  }

  private _updateTicketPosition() {
    this._ticket?.position.lerp(this._internalState.naturalPosition, 0.01)
  }

  private _updateMeshBoundingBoxes() {
    // Update bounding boxes for all named meshes
    for (const meshName in this._namedMeshes) {
      const mesh = this._namedMeshes[meshName as AvailableTextures]
      if (mesh && mesh.geometry) {
        // Ensure the geometry has a bounding box
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox()
        }
      }
    }
  }

  private _setupTextureCanvases() {
    for (const [name, mesh] of Object.entries(this._namedMeshes)) {
      const planeType = this.texturePlaneMapping[name as AvailableTextures]
      let referenceMesh: THREE.Mesh | undefined
      if (planeType === 'front') {
        referenceMesh = this._namedMeshes.TicketFront
      } else if (planeType === 'back') {
        referenceMesh = this._namedMeshes.TicketBack
      } else if (planeType === 'edge') {
        referenceMesh = this._namedMeshes.TicketEdge
      }

      if (!referenceMesh) {
        throw new Error(`Could not find reference mesh for texture ${name}`)
      }

      const localBox = new THREE.Box3().setFromObject(referenceMesh)
      const localSize = localBox.getSize(new THREE.Vector3())

      // Get world scale
      const worldScale = new THREE.Vector3()
      mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), worldScale)

      // Apply world scale to get world size
      const worldSize = new THREE.Vector3(
        localSize.x / Math.abs(worldScale.x),
        localSize.y / Math.abs(worldScale.y),
        localSize.z / Math.abs(worldScale.z)
      )

      const canvas = document.createElement('canvas')
      const canvasWidth = worldSize.x * TicketScene.TEXTURE_PIXEL_DENSITY_FACTOR
      const canvasHeight = Math.floor(canvasWidth * (localSize.z / localSize.x)) // Maintain aspect ratio

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // Get canvas context and set up text rendering
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error(`Could not get 2D context for text "${name}"`)
      }

      this._textureCanvases[name as AvailableTextures] = {
        canvas,
        context,
      }
    }
  }

  private _setupNamedObjects() {
    const mesh = this._ticket

    if (!mesh) {
      throw new Error(`Ticket mesh not loaded`)
    }

    for (const part of mesh.children) {
      if (!(part instanceof THREE.Mesh)) {
        continue
      }

      if (!(part.material instanceof THREE.Material)) {
        console.warn(`Material is not an instance of THREE.Material. Got:`, part.material)
        continue
      }

      if ((TicketScene.TEXTURE_NAMES as readonly string[]).includes(part.material.name)) {
        part.material.dithering = true
        this._namedMeshes[part.material.name as AvailableTextures] = part
      } else {
        console.warn(`Mesh ${part.material.name} is not a named texture`)
      }
    }
  }

  private async _loadTextures(force?: boolean) {
    // Load textures for each named mesh
    // Create a texture loader
    const textureLoader = new THREE.TextureLoader()
    const loadingPromises: Promise<void>[] = []

    const textureSetKey = this.state.platinum ? 'platinum' : this.state.secret ? 'secret' : 'basic'

    if (!force) {
      if (this._internalState.loadedTextureType === textureSetKey) {
        return
      }
    }

    this._internalState.loadedTextureType = textureSetKey

    // Determine which texture set to use based on ticket type
    const textureSet = this.textureImages[textureSetKey]

    // Map of which image to use for each mesh
    const textureImageMap: Partial<Record<AvailableTextures, TextureDescriptor>> = {
      TicketFront: textureSet.front,
      TicketBack: textureSet.back,
      TicketFrontWebsiteButton: textureSet.front,
      TicketBackGoBackButton: textureSet.back,
      TicketFrontSeatChartButton: textureSet.front,
      TicketBackWebsiteButton: textureSet.back,
      // Add mappings for buttons if they have separate textures
      // Or they can reuse the front/back textures with different UV coordinates
    }

    const allMeshes = Object.entries(this._namedMeshes)
    // Preload all textures and prepare canvases
    for (const [name, mesh] of allMeshes) {
      if (!mesh || !(mesh instanceof THREE.Mesh)) {
        console.warn(`Mesh ${name} is not a THREE.Mesh`)
        continue
      }
      if (!mesh.material || !(mesh.material instanceof THREE.MeshStandardMaterial)) {
        console.warn(`Mesh ${name} has no material or is not a MeshStandardMaterial`)
        continue
      }

      const textureKey = name as AvailableTextures
      const textureCanvas = this._textureCanvases[textureKey]

      if (!textureCanvas) {
        console.warn(`No texture canvas found for texture ${textureKey}`)
        continue
      }
      const { canvas, context } = textureCanvas

      // If we have an image for this texture
      const textureDescriptor = textureImageMap[textureKey]
      if (!textureDescriptor) {
        continue
      }

      if (textureDescriptor.cachedData === null) {
        // Create a loading promise for this texture
        await new Promise<void>((resolve) => {
          textureLoader.load(
            textureDescriptor.url,
            (loadedTexture) => {
              // Create an image from the loaded texture
              textureDescriptor.cachedData = loadedTexture

              // Fix: Set the correct color space to match the original model
              loadedTexture.colorSpace = THREE.SRGBColorSpace

              resolve()
            },
            undefined, // onProgress callback
            (error) => {
              console.error(`Error loading texture ${textureDescriptor.url}:`, error)
              resolve() // Resolve anyway to not block other textures
            }
          )
        })
      }

      if (!textureDescriptor.cachedData) {
        throw new Error(`Failed to load texture ${textureDescriptor.url}`)
      }

      context.drawImage(textureDescriptor.cachedData.image, 0, 0, canvas.width, canvas.height)

      // For meshes without base images, just draw custom content
      this._drawCustomContentOnTexture(textureKey, context, canvas)

      const texture = new THREE.CanvasTexture(canvas)
      texture.flipY = false
      // Set the correct color space for the texture
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true

      // Fix: Preserve the original material properties
      const originalMaterial = mesh.material
      const originalColor = mesh.material.color.clone()
      const originalEmissive = mesh.material.emissive ? mesh.material.emissive.clone() : null
      const originalEmissiveIntensity = mesh.material.emissiveIntensity

      mesh.material.map = texture
      mesh.material.color = originalColor
      if (originalEmissive) mesh.material.emissive = originalEmissive
      if (originalEmissiveIntensity) mesh.material.emissiveIntensity = originalEmissiveIntensity

      // Ensure material properties are preserved
      mesh.material.needsUpdate = true
    }

    // Return a promise that resolves when all textures are loaded
    return Promise.all(loadingPromises)
  }

  // Method to draw custom content on each texture type
  private _drawCustomContentOnTexture(
    textureKey: AvailableTextures,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) {
    // Use fallback fonts if custom fonts failed to load
    const mainFontFamily = this._internalState.fontsLoaded
      ? this.typography.main.family
      : 'monospace'

    const ticketNumberFontFamily = this._internalState.fontsLoaded
      ? this.typography.ticketNumber.family
      : 'monospace'

    // Get the appropriate color scheme based on ticket type
    const colors = this.state.platinum
      ? this.textureImages.platinum
      : this.state.secret
        ? this.textureImages.secret
        : this.textureImages.basic

    const isNeon = this.state.secret || this.state.platinum

    function getWrappedText({
      text,
      maxChars,
      maxLines,
    }: {
      text: string
      maxChars: number
      maxLines: number
    }): string[] {
      const lines: string[] = []
      let remainingText = text.trim()

      for (let i = 0; i < maxLines && remainingText.length > 0; i++) {
        // If remaining text fits in one line
        if (remainingText.length <= maxChars) {
          lines.push(remainingText)
          break
        }

        // Check if we're on the last allowed line
        if (i === maxLines - 1) {
          // Add ellipsis for truncated text
          lines.push(remainingText.substring(0, maxChars - 3) + '...')
          break
        }

        // Try to find a space to break at
        let breakPos = remainingText.lastIndexOf(' ', maxChars)

        // If no space found or it's too early in the string, break at maxChars
        if (breakPos <= 0 || breakPos < maxChars / 3) {
          breakPos = maxChars
        }

        // Add the line and update remaining text
        lines.push(remainingText.substring(0, breakPos).trim())
        remainingText = remainingText.substring(breakPos).trim()
      }

      return lines
    }

    switch (textureKey) {
      case 'TicketFront': {
        const fontSize = this.typography.main.relativeSize * canvas.height
        const usernameLines = getWrappedText({
          text: this.state.texts.username,
          maxChars: 18,
          maxLines: 4,
        })

        context.font = `400 ${fontSize}px ${mainFontFamily}`
        context.textAlign = 'left'
        context.textBaseline = 'top'
        const lineHeight = fontSize * 1.2
        const padding = 4

        // Calculate max line width for consistent background width
        const maxLineWidth = Math.max(
          ...usernameLines.map((line) => context.measureText(line).width)
        )

        // Draw username lines with background
        usernameLines.forEach((line, index) => {
          const x = this.texts.user.x * canvas.width
          const y = this.texts.user.y * canvas.height + index * lineHeight

          const textWidth = context.measureText(line).width
          const isLastLine = index === usernameLines.length - 1
          const backgroundWidth = isLastLine ? textWidth : maxLineWidth

          // Draw main background
          context.fillStyle = colorObjToRgb(colors.bgColor)
          context.fillRect(
            x - padding,
            y - padding,
            backgroundWidth + padding * 2,
            fontSize + padding * 2
          )

          // Draw secondary background (glow effect)
          context.fillStyle = colorObjToRgb(colors.transparentBg)
          context.fillRect(x - 287, y + 4, backgroundWidth + 280, fontSize - 24)

          // Draw text
          context.fillStyle = colorObjToRgb(isNeon ? colors.textNeonColor : colors.textColor)
          context.fillText(line, x, y)
        })

        context.fillStyle = colorObjToRgb(isNeon ? colors.textDimmedColor : colors.textColor)
        context.fillText(
          this.state.texts.date,
          this.texts.date.x * canvas.width,
          this.texts.date.y * canvas.height
        )

        context.fillStyle = colorObjToRgb(isNeon ? colors.textNeonColor : colors.textDimmedColor)
        const ticketNumberFontSize = this.typography.ticketNumber.relativeSize * canvas.height
        context.font = `${this.typography.ticketNumber.weight} ${ticketNumberFontSize}px ${ticketNumberFontFamily}`
        context.fillText(
          this.state.texts.seatCode.toUpperCase(),
          this.texts.ticketNumber.x * canvas.width,
          this.texts.ticketNumber.y * canvas.height
        )
        break
      }
      case 'TicketBack': {
        context.textAlign = 'left'
        context.textBaseline = 'top'

        const fontSize = this.typography.main.relativeSize * canvas.height
        context.font = `400 ${fontSize}px ${mainFontFamily}`
        context.fillStyle = colorObjToRgb(isNeon ? colors.textDimmedColor : colors.textColor)
        context.fillText(
          this.state.texts.date,
          this.texts.date.x * canvas.width,
          this.texts.date.y * canvas.height
        )

        context.fillStyle = colorObjToRgb(isNeon ? colors.textNeonColor : colors.textColor)

        // Draw ticket number with different font
        const ticketNumberFontSize = this.typography.ticketNumber.relativeSize * canvas.height
        context.font = `${this.typography.ticketNumber.weight} ${ticketNumberFontSize}px ${ticketNumberFontFamily}`
        context.fillText(
          this.state.texts.seatCode.toUpperCase(),
          this.texts.ticketNumberBack.x * canvas.width,
          this.texts.ticketNumberBack.y * canvas.height
        )

        const seatCoord = this.state.ticketNumber % 32
        const seatCol = seatCoord % 8
        const seatRow = Math.floor(seatCoord / 8)

        context.fillStyle = colorObjToRgb(colors.textNeonColor)

        // Save the current context state
        context.save()
        // Translate the context based on seat coordinates
        // Adjust these multipliers to control spacing between seats
        context.translate(
          this.texts.seatStart.x * canvas.width +
            (this.texts.seatPositions.x[seatCol] ?? 0) * canvas.width,
          this.texts.seatStart.y * canvas.height +
            (this.texts.seatPositions.y[seatRow] ?? 0) * canvas.height
        )
        // Fill the path at the new position
        context.fill(this.textureImages.secret.seatPath)
        // Restore the context to its original state
        context.restore()

        break
      }
      // Handle other texture types as needed
      case 'TicketFrontWebsiteButton':
      case 'TicketFrontSeatChartButton':
      case 'TicketBackGoBackButton':
      case 'TicketBackWebsiteButton':
        // These might not need custom content if the base image is sufficient
        break
    }
  }

  private async _loadFonts(): Promise<void> {
    try {
      // Define the fonts to load
      const fontFaces = this.fonts.map((f) => new FontFace(...f))
      // Load all fonts
      await Promise.all(
        fontFaces.map(async (font) => {
          const loadedFont = await font.load()
          // Add the loaded font to the document
          document.fonts.add(loadedFont)
          return loadedFont
        })
      )

      // All fonts loaded successfully
      this._internalState.fontsLoaded = true
    } catch (error) {
      // Handle font loading errors
      console.error('Failed to load fonts:', error)
      // Still continue to not block rendering, but with a warning
      this._internalState.fontsLoaded = false
    }
  }

  private async _preloadAllTextureSets() {
    const textureLoader = new THREE.TextureLoader()
    const allSets = ['basic', 'secret', 'platinum'] as const

    let promises: Promise<void>[] = []
    for (const set of allSets) {
      const textureSet = this.textureImages[set]
      if (textureSet.front.cachedData === null) {
        const promise = new Promise<void>((resolve, reject) => {
          textureLoader.load(
            textureSet.front.url,
            (texture) => {
              textureSet.front.cachedData = texture
              resolve()
            },
            undefined,
            reject
          )
        })
        promises.push(promise)
      }
      if (textureSet.back.cachedData === null) {
        const promise = new Promise<void>((resolve, reject) => {
          textureLoader.load(
            textureSet.back.url,
            (texture) => {
              textureSet.back.cachedData = texture
              resolve()
            },
            undefined,
            reject
          )
        })

        promises.push(promise)
      }
    }

    await Promise.all(promises)
  }

  private getResolutionDescriptor(resolution: number) {
    const resolutionBase = this.state.narrow ? this.narrowResolutions : this.resolutions
    const resolutions = Object.keys(resolutionBase).map(Number)
    const closestResolution = resolutions.reduce((prev, curr) =>
      resolution - curr >= 0 && resolution - curr < resolution - prev ? curr : prev
    ) as keyof typeof this.resolutions

    return resolutionBase[closestResolution]
  }
}

export default TicketScene
