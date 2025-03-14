import * as THREE from 'three'
import { colorObjToRgb, loadGLTFModel } from '../helpers'
import SceneRenderer, { BaseScene } from '../utils/SceneRenderer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { Camera, Euler, MathUtils, Scene, Vector3 } from 'three'

interface TicketSceneState {
  secret: boolean
  platinum: boolean
  frontside: boolean
  startDate: Date
  ticketNumber: number
  texts: {
    username: string
    species: string
    earth: string
    seatCode: string
  }
}

interface TicketSceneOptions {
  defaultSecret?: boolean
  defaultPlatinum?: boolean
  startDate: Date
  user: {
    id?: string
    name?: string
    ticketNumber?: number
  }
  onSeatChartButtonClicked?: () => void
  onWebsiteButtonClicked?: () => void
  onGoBackButtonClicked?: () => void
}

interface MousePositionState {
  clientX: number
  clientY: number
  isWithinContainer: boolean
  containerX: number
  containerY: number
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

      bgColor: { rgb: 0x050505, alpha: 1 },
      textColor: { rgb: 0xffffff, alpha: 1 },
      textDimmedColor: { rgb: 0x515151, alpha: 1 },
      textNeonColor: { rgb: 0x2cf494, alpha: 1 },
      textNeonDimmedColor: { rgb: 0x12623b, alpha: 1 },
      transparentBg: { rgb: 0x2cf494, alpha: 0.4 },
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
    species: {
      x: 367 / 2000,
      y: 628 / 1400,
    },
    planet: {
      x: 367 / 2000,
      y: 721 / 1400,
    },
    date: {
      x: 1249 / 2000,
      y: 255 / 1400,
    },
    ticketNumber: {
      x: 368 / 2000,
      y: 1077.69 / 1400,
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

  private _internalState = {
    mousePosition: undefined as MousePositionState | undefined,
    containerBBox: undefined as DOMRect | undefined,
    naturalPosition: new Vector3(0, 0, 0),
    fontsLoaded: false,
    loadedTextureType: null as 'basic' | 'secret' | 'platinum' | null,
  }

  private _sceneConfig = {
    camera: {
      position: new Vector3(0, 10, 0),
      rotation: new Euler(MathUtils.degToRad(-90), 0, 0),
      fov: 30,
    },
  }

  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null

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

  constructor(private options: TicketSceneOptions) {
    this.state = {
      secret: options.defaultSecret || false,
      platinum: options.defaultPlatinum || false,
      frontside: true,
      startDate: options.startDate,
      ticketNumber: options.user.ticketNumber || 0,
      texts: {
        username: 'Goszczu 123425' ?? options.user.name ?? '',
        species: 'Modern Human',
        earth: 'Earth',
        // Start assigning seats from A001
        seatCode: (466561 + (options.user.ticketNumber || 0)).toString(36),
      },
    }
  }

  async setup(context: SceneRenderer): Promise<void> {
    this._sceneRenderer = context
    this._internalState.containerBBox = context.container.getBoundingClientRect()

    // Load fonts before loading the model
    await this._loadFonts()

    const gltf = await loadGLTFModel(this.sceneUrl)

    this._ticket = gltf.scene as unknown as Scene

    this._setCamera(context.camera)
    this._modelRenderPass = new RenderPass(this._ticket, context.camera)

    // Set renderer clear color to make background visible
    context.renderer.setClearColor(0x000000, 0)

    // Add ambient light with increased intensity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    this._ticket.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 5, 5)
    this._ticket.add(directionalLight)

    // Add a point light to better illuminate the placeholder
    const pointLight = new THREE.PointLight(0xffffff, 1.0)
    pointLight.position.set(0, 0, 5)
    this._ticket.add(pointLight)
    this._registerMousePositionTracking(context)

    this._setupNamedObjects()
    this._setupTextureCanvases()
    await this._loadTextures()

    context.composer.addPass(this._modelRenderPass)
    context.renderer.outputColorSpace = THREE.SRGBColorSpace
  }

  update(context: SceneRenderer, dt?: number): void {
    const ticket = context.composer.passes[0]
    if (ticket instanceof RenderPass) {
      this._updateNaturalPosition()
      this._updateTicketToFollowMouse(ticket.scene, dt)
    }
  }

  cleanup(): void {
    if (this.mouseMoveHandler) window.removeEventListener('mousemove', this.mouseMoveHandler)
  }

  handleEvent(event: string, data?: any): void {
    throw new Error('Method not implemented.')
  }

  resize(_ev: UIEvent): void {
    this._internalState.containerBBox = this._sceneRenderer?.container.getBoundingClientRect()
    return
  }

  showFrontSide() {
    this.state.frontside = true
  }

  showBackSide() {
    this.state.frontside = false
  }

  upgradeToSecret() {
    this.state.secret = true
  }

  // In your click method
  click(e: MouseEvent) {
    this._updateMousePosition(e)

    if (!this._internalState.mousePosition?.isWithinContainer || !this._sceneRenderer) return

    // Set up raycaster
    this.raycaster.setFromCamera(
      new THREE.Vector2(
        this._internalState.mousePosition.containerX,
        this._internalState.mousePosition.containerY
      ),
      this._sceneRenderer.camera
    )

    // Get all meshes to check for intersection
    const meshes = Object.values(this._namedMeshes).filter(Boolean) as THREE.Mesh[]

    // Check for intersections
    const intersects = this.raycaster.intersectObjects(meshes)

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh

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

  private _updateTicketToFollowMouse(scene: THREE.Scene, dt?: number) {
    // Calculate rotation based on mouse position
    // Limit rotation to reasonable angles
    if (this._internalState.mousePosition?.isWithinContainer) {
      const mouseX = this._internalState.mousePosition.containerX
      const mouseY = this._internalState.mousePosition.containerY
      // Limit the rotation angles to a reasonable range
      const targetRotationX = MathUtils.clamp(mouseY * -0.2, -0.3, 0.3)
      const targetRotationZ = MathUtils.clamp(mouseX * -0.3, -0.4, 0.4)

      // Apply smooth rotation with a smaller lerp factor
      const lerpFactor = Math.min(dt ?? 0.05, 0.05)
      scene.rotation.x = MathUtils.lerp(
        scene.rotation.x,
        this._internalState.naturalPosition.x + targetRotationX,
        lerpFactor
      )
      scene.rotation.z = MathUtils.lerp(
        scene.rotation.z,
        this._internalState.naturalPosition.z + targetRotationZ,
        lerpFactor
      )
    } else {
      // Return to neutral position more slowly
      const lerpFactor = Math.min(dt ?? 0.03, 0.03)
      scene.rotation.x = MathUtils.lerp(
        scene.rotation.x,
        this._internalState.naturalPosition.x,
        lerpFactor
      )
      scene.rotation.z = MathUtils.lerp(
        scene.rotation.z,
        this._internalState.naturalPosition.z,
        lerpFactor
      )
    }
  }

  private _updateNaturalPosition() {
    if (this.state.frontside) {
      this._internalState.naturalPosition.set(0, 0, 0)
    } else {
      this._internalState.naturalPosition.set(0, 0, Math.PI)
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

  private _registerMousePositionTracking(context: SceneRenderer) {
    this.mouseMoveHandler = this._updateMousePosition.bind(this)
    window.addEventListener('mousemove', this.mouseMoveHandler)
  }

  private _updateMousePosition(ev: MouseEvent) {
    if (!this._internalState.mousePosition) {
      this._internalState.mousePosition = {
        clientX: 0,
        clientY: 0,
        isWithinContainer: false,
        containerX: 0,
        containerY: 0,
      }
    } else {
      this._internalState.mousePosition.clientX = ev.clientX
      this._internalState.mousePosition.clientY = ev.clientY

      const rect = this._internalState.containerBBox
      if (!rect) {
        return
      }
      const isWithinContainer =
        ev.clientX >= rect.left &&
        ev.clientX <= rect.right &&
        ev.clientY >= rect.top &&
        ev.clientY <= rect.bottom

      this._internalState.mousePosition.isWithinContainer = isWithinContainer
      this._internalState.mousePosition.containerX = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      this._internalState.mousePosition.containerY =
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
    }
  }

  private createMaterial() {}

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
    const mainMeshName = 'Plane'
    const mesh = this._ticket?.getObjectByName(mainMeshName)

    if (!mesh) {
      throw new Error(`Could not find mesh named ${mainMeshName}`)
    }

    for (const part of mesh.children) {
      if (!(part instanceof THREE.Mesh)) {
        continue
      }

      if (!(part.material instanceof THREE.Material)) {
        console.log(`Material is not an instance of THREE.Material. Got:`, part.material)
        continue
      }

      if ((TicketScene.TEXTURE_NAMES as readonly string[]).includes(part.material.name)) {
        this._namedMeshes[part.material.name as AvailableTextures] = part
      }
    }
  }

  private async _loadTextures() {
    // Load textures for each named mesh
    // Create a texture loader
    const textureLoader = new THREE.TextureLoader()
    const loadingPromises: Promise<void>[] = []

    const textureSetKey = this.state.secret ? 'secret' : this.state.platinum ? 'platinum' : 'basic'

    if (this._internalState.loadedTextureType === textureSetKey) {
      console.log('Textures already loaded. Active set:', textureSetKey)
      return
    } else {
      console.log('Loading textures for set:', textureSetKey)
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

    // Preload all textures and prepare canvases
    for (const [name, mesh] of Object.entries(this._namedMeshes)) {
      if (!mesh || !(mesh instanceof THREE.Mesh)) continue
      if (!mesh.material || !(mesh.material instanceof THREE.MeshStandardMaterial)) continue

      const textureKey = name as AvailableTextures
      const textureCanvas = this._textureCanvases[textureKey]

      if (!textureCanvas) continue
      const { canvas, context } = textureCanvas

      // If we have an image for this texture
      const textureDescriptor = textureImageMap[textureKey]
      if (!textureDescriptor) {
        console.warn(`No texture descriptor found for texture ${textureKey}`)
        return
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

      console.log("Drawind texture", textureKey)

      context.drawImage(textureDescriptor.cachedData.image, 0, 0, canvas.width, canvas.height)

      // For meshes without base images, just draw custom content
      this._drawCustomContentOnTexture(textureKey, context, canvas)

      const texture = new THREE.CanvasTexture(canvas)
      texture.flipY = false
      // Fix: Set the correct color space for the canvas texture
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
    const colors = this.state.secret
      ? this.textureImages.secret
      : this.state.platinum
        ? this.textureImages.platinum
        : this.textureImages.basic

    switch (textureKey) {
      case 'TicketFront':
        // Draw username
        context.fillStyle = colorObjToRgb(colors.textColor)
        const fontSize = this.typography.main.relativeSize * canvas.height
        context.font = `400 ${fontSize}px ${mainFontFamily}`
        context.textAlign = 'left'
        context.textBaseline = 'top'
        context.fillText(
          this.state.texts.username,
          this.texts.user.x * canvas.width,
          this.texts.user.y * canvas.height
        )

        // Draw species
        context.fillText(
          this.state.texts.species,
          this.texts.species.x * canvas.width,
          this.texts.species.y * canvas.height
        )

        // Draw planet
        context.fillText(
          this.state.texts.earth,
          this.texts.planet.x * canvas.width,
          this.texts.planet.y * canvas.height
        )

        // Draw ticket number with different font
        const ticketNumberFontSize = this.typography.ticketNumber.relativeSize * canvas.height
        context.font = `${this.typography.ticketNumber.weight} ${ticketNumberFontSize}px ${ticketNumberFontFamily}`
        context.fillText(
          this.state.texts.seatCode.toUpperCase(),
          this.texts.ticketNumber.x * canvas.width,
          this.texts.ticketNumber.y * canvas.height
        )
        break

      case 'TicketBack':
        // Add any custom content for the back of the ticket
        break

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
}

export default TicketScene
