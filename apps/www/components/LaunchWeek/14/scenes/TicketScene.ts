import * as THREE from 'three'
import { loadGLTFModel } from '../helpers'
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
  onUpgradeToSecret?: () => {}
}

interface MousePositionState {
  clientX: number
  clientY: number
  isWithinContainer: boolean
  containerX: number
  containerY: number
}

type AvailableTextures = (typeof TicketScene)['TEXTURE_NAMES'][number]

class TicketScene implements BaseScene {
  raycaster = new THREE.Raycaster()
  sceneUrl = '/images/launchweek/14/ticket-model.glb'

  textureImages = {
    basic: {
      back: '/images/launchweek/14/back-basic-ticket-textrue.png',
      front: '/images/launchweek/14/front-basic-ticket-texture.png',

      bgColor: 0x202020,
      textColor: 0xffffff,
      textDimmedColor: 0x515151,
      textNeonColor: 0xffffff,
      textNeonDimmedColor: 0x515151,
      transparentBg: 0x00000000,
    },
    secret: {
      back: '/images/launchweek/14/back-secret-ticket-textrue.png',
      front: '/images/launchweek/14/front-secret-ticket-texture.png',

      bgColor: 0x050505ff,
      textColor: 0xffffffff,
      textDimmedColor: 0x515151ff,
      textNeonColor: 0x2cf494ff,
      textNeonDimmedColor: 0x12623bff,
      transparentBg: 0x2cf49466,
    },
    platinum: {
      back: '/images/launchweek/14/back-platinum-ticket-textrue.png',
      front: '/images/launchweek/14/front-platinum-ticket-texture.png',

      bgColor: 0x050505ff,
      textColor: 0xffc73aff,
      textDimmedColor: 0xffc73aff,
      textNeonColor: 0xffc73aff,
      textNeonDimmedColor: 0xffc73aff,
      transparentBg: 0xffc73a66,
    },
  }

  fontUrl = ''

  state: TicketSceneState

  private _internalState = {
    mousePosition: undefined as MousePositionState | undefined,
    containerBBox: undefined as DOMRect | undefined,
    naturalPosition: new Vector3(0, 0, 0),
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
  private static TEXTURE_PIXEL_DENSITY_FACTOR = 100

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
        username: options.user.name || '',
        species: '',
        earth: '',
        // Start assigning seats from A001
        seatCode: (466561 + (options.user.ticketNumber || 0)).toString(36),
      },
    }
  }

  async setup(context: SceneRenderer): Promise<void> {
    this._sceneRenderer = context
    this._internalState.containerBBox = context.container.getBoundingClientRect()

    const gltf = await loadGLTFModel(this.sceneUrl)

    this._ticket = gltf.scene as unknown as Scene

    this._setCamera(context.camera)
    this._modelRenderPass = new RenderPass(this._ticket, context.camera)
    context.composer.addPass(this._modelRenderPass)

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

  showSecondFace() {
    this.state.frontside = !this.state.frontside
  }

  click(e: MouseEvent) {
    this._updateMousePosition(e)
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
      const localBox = new THREE.Box3().setFromObject(mesh)
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
      const canvasHeight = Math.floor(canvasWidth * (localSize.y / localSize.x)) // Maintain aspect ratio

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

  private _setSecretTextures() {
    if (!this._textureCanvases.TicketFront) {
      throw new Error('TicketFront texture canvas is not set')
    }

    const { context, canvas } = this._textureCanvases.TicketFront

    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  private executeWithObject(
    execFunctions: [(typeof TicketScene)['TEXTURE_NAMES'][number], (mesh: THREE.Mesh) => void][]
  ) {
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

      switch (part.material.name) {
        case 'TicketFront': {
          console.log(part.material.name, part.material)
          break
        }
        case 'TicketBack': {
          console.log(part.material.name, part.material)
          break
        }

        case 'TicketEdge': {
          console.log(part.material.name, part.material)
          break
        }

        case 'TicketFrontWebsiteButton': {
          console.log(part.material.name, part.material)
          break
        }

        case 'TicketFrontSeatChartButton': {
          console.log(part.material.name, part.material)
          break
        }

        case 'TicketBackGoBackButton': {
          console.log(part.material.name, part.material)
          break
        }

        case 'TicketBackWebsiteButton': {
          console.log(part.material.name, part.material)
          break
        }

        default: {
          console.log('Unexpected material name', part.material.name, part.material)
        }
      }
    }
  }
}

export default TicketScene
