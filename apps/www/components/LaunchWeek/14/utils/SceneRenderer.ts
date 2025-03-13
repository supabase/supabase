import { PerspectiveCamera, WebGLRenderer } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'

export interface BaseScene {
  /**
   * Initialize the scene with the given context
   */
  setup(context: SceneRenderer): Promise<void>

  /**
   * Update the scene for each animation frame
   */
  update(context: SceneRenderer): void

  /**
   * Clean up resources when the scene is destroyed
   */
  cleanup(): void

  /**
   * Handle events from the parent component
   */
  handleEvent(event: string, data?: any): void

  resize(ev: UIEvent): void
}

class SceneRenderer {
  renderer: WebGLRenderer
  composer: EffectComposer
  camera: PerspectiveCamera
  activeScene: BaseScene | null
  private _resizeHandler: ((ev: UIEvent) => void) | null = null

  constructor(private container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.composer = new EffectComposer(this.renderer)
    this.activeScene = null

    this.camera = new PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    )
  }

  init() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.container.appendChild(this.renderer.domElement)

    this._resizeHandler = this._resize.bind(this)
    window.addEventListener('resize', this._resizeHandler)
  }

  activateScene(scene: BaseScene) {
    this.activeScene = scene
    scene.setup(this)
  }

  animate(dTime?: number) {
    this.composer.render(dTime)
  }

  cleanup() {
    this.composer.dispose()
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
      this._resizeHandler = null
    }
  }

  private _resize(ev: UIEvent) {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)

    this.activeScene?.resize(ev)
  }
}

export default SceneRenderer
