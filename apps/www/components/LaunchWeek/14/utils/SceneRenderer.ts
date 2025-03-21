import { ColorManagement, HalfFloatType, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer, WebGLRenderTarget } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

export interface MousePositionState {
  clientX: number
  clientY: number
  isWithinContainer: boolean
  containerX: number
  containerY: number
  mouseIntensity: number
}

export interface BaseScene {
  getId(): string
  /**
   * Initialize the scene with the given context
   */
  setup(context: SceneRenderer): Promise<Scene | void>

  /**
   * Update the scene for each animation frame
   */
  update(context: SceneRenderer, dt?: number): void

  /**
   * Clean up resources when the scene is destroyed
   */
  cleanup(): void

  resize(ev: UIEvent): void
}

class SceneRenderer {
  renderer: WebGLRenderer
  composer: EffectComposer
  camera: PerspectiveCamera
  mainThreeJsScene: Scene | null = null
  activeScenes: BaseScene[] = []
  cachedContainerBBox: DOMRect
  mousePositionState: MousePositionState
  mouseIntensityDecay = 0.98
  mouseIntensityGainRate = 0.003

  private _resizeHandler: ((ev: UIEvent) => void) | null = null
  private _mouseMoveHandler: ((ev: MouseEvent) => void) | null = null
  private _isDisposed = false
  private _isInitialized = false
  private _webglrenderTarget: WebGLRenderTarget

  constructor(
    public container: HTMLElement,
    private waitFor?: { init: Promise<void>; renderer: SceneRenderer }[],
    private uuid?: string
  ) {
    this._webglrenderTarget = new WebGLRenderTarget(this.container.clientWidth, this.container.clientHeight, { type: HalfFloatType })
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.composer = new EffectComposer(this.renderer, this._webglrenderTarget)

    this.camera = new PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    )

    this.mousePositionState = {
      clientX: 0,
      clientY: 0,
      isWithinContainer: false,
      containerX: 0,
      containerY: 0,
      mouseIntensity: 0,
    }

    this.cachedContainerBBox = this.container.getBoundingClientRect()
  }

  async init(sceneInitializer: () => Promise<void>) {
    console.log('SCENE RENDERER: Init call', this.waitFor?.length, this.uuid)
    await Promise.allSettled(
      this.waitFor?.filter((t) => t.renderer !== this).map((t) => t.init) || []
    )

    if(this._isDisposed) {
      console.log('SCENE RENDERER: Already disposed before sceneInitializer', this.uuid)
      return
    }

    console.log('SCENE RENDERER: Waited for all pending inits', this.waitFor?.length, this.uuid)

    await sceneInitializer()

    if(this._isDisposed) {
      console.log('SCENE RENDERER: Already disposed after sceneInitializer', this.uuid)
      return
    }

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0x000000, 0) // Set transparent background
    this.renderer.autoClear = false // Prevent automatic clearing
    this.renderer.outputColorSpace = SRGBColorSpace
    ColorManagement.enabled = true

    // Initialize composer with correct size and pixel ratio
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.setPixelRatio(window.devicePixelRatio)

    this.container.appendChild(this.renderer.domElement)

    this._resizeHandler = this._resize.bind(this)
    window.addEventListener('resize', this._resizeHandler)

    this._mouseMoveHandler = this._updateMousePosition.bind(this)
    window.addEventListener('mousemove', this._mouseMoveHandler)
  }

  async activateScene(scene: BaseScene, main?: boolean) {
    if(this._isDisposed) {
      console.log('SCENE RENDERER: Already disposed before activateScene', this.uuid)
      return
    }

    const threeScene = await scene.setup(this)

    if(this._isDisposed) {
      console.log('SCENE RENDERER: Already disposed after activateScene', this.uuid)
      return
    }

    if (main && threeScene) {
      this.mainThreeJsScene = threeScene
    }

    const newId = scene.getId()
    const existingSceneId = this.activeScenes.findIndex((s) => s.getId() === newId)
    if (existingSceneId > -1) {
      const sceneToRemove = this.activeScenes[existingSceneId]
      this.activeScenes[existingSceneId] = scene
      sceneToRemove.cleanup()
    } else {
      this.activeScenes.push(scene)
    }
  }

  animate(time?: number) {
    // Clear the renderer before rendering
    this.renderer.clear()

    this._decayMouseIntensity()

    for (const activeScene of this.activeScenes) {
      activeScene.update(this, time)
    }
    this.composer.render(time)
  }

  cleanup() {
    console.log('SCENE RENDERER: Cleanup', this.uuid)

    this._isDisposed = true
    this.composer.dispose()
    this.renderer.dispose()

    try {
      this.container.removeChild(this.renderer.domElement)
    } catch (e) {
      console.warn(e)
    }

    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
      this._resizeHandler = null
    }

    if (this.waitFor) {
      // Mutate array in place instead of replacing reference
      this.waitFor.splice(
        0,
        this.waitFor.length,
        ...this.waitFor.filter((t) => t.renderer === this)
      )
    }
  }

  private _resize(ev: UIEvent) {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.cachedContainerBBox = this.container.getBoundingClientRect()
    this._webglrenderTarget.setSize(this.container.clientWidth, this.container.clientHeight)

    for (const activeScene of this.activeScenes) {
      activeScene.resize(ev)
    }
  }

  private _decayMouseIntensity() {
    if (this.mousePositionState.mouseIntensity > 0) {
      this.mousePositionState.mouseIntensity *= this.mouseIntensityDecay
      if (this.mousePositionState.mouseIntensity < 0.0000001) {
        this.mousePositionState.mouseIntensity = 0
      }
    }
  }

  private _updateMousePosition(ev: MouseEvent) {
    this.cachedContainerBBox = this.container.getBoundingClientRect()
    const dx = ev.clientX - this.mousePositionState.clientX
    const dy = ev.clientY - this.mousePositionState.clientY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Update intensity based on movement (clamped between 0 and 1)
    this.mousePositionState.mouseIntensity = Math.min(
      1.0,
      Math.max(0, this.mousePositionState.mouseIntensity + distance * this.mouseIntensityGainRate)
    )

    // Update last position
    this.mousePositionState.clientX = ev.clientX
    this.mousePositionState.clientY = ev.clientY

    const rect = this.cachedContainerBBox
    if (!rect) {
      return
    }
    const isWithinContainer =
      ev.clientX >= rect.left &&
      ev.clientX <= rect.right &&
      ev.clientY >= rect.top &&
      ev.clientY <= rect.bottom

    this.mousePositionState.isWithinContainer = isWithinContainer
    this.mousePositionState.containerX = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    this.mousePositionState.containerY = -((ev.clientY - rect.top) / rect.height) * 2 + 1
  }
}

export default SceneRenderer
