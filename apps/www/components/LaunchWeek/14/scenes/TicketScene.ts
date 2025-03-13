import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
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

class TicketScene implements BaseScene {
  sceneUrl = '/images/launchweek/14/ticket-model.glb'
  staticBasicTexture = '/images/launchweek/14/basic-static-ticket.png'
  staticSecretTexture = '/images/launchweek/14/secret-static-ticket.png'
  staticPlatinumTexture = '/images/launchweek/14/platinum-static-ticket.png'
  fontUrl = ''

  state: TicketSceneState

  private _sceneConfig = {
    camera: {
      position: new Vector3(0, 3, 0),
      rotation: new Euler(MathUtils.degToRad(-90), 0, 0),
    },
  }

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
        // Start asigning seats from A001
        seatCode: (466561 + (options.user.ticketNumber || 0)).toString(36),
      },
    }
  }

  async setup(context: SceneRenderer): Promise<void> {
    const gltf = await loadGLTFModel(this.sceneUrl)

    const ticket = gltf.scene as unknown as Scene
    const frontFace = gltf.scene.getObjectByName('FrontFace')
    if (frontFace instanceof THREE.Mesh) {
      frontFace.material = new THREE.MeshPhongMaterial({
        opacity: 0,
        transparent: true,
      })
    }

    const backFace = gltf.scene.getObjectByName('BackFace')
    if (backFace instanceof THREE.Mesh) {
      backFace.material = new THREE.MeshPhongMaterial({
        opacity: 0,
        transparent: true,
      })
    }
    this.setCamera(context.camera)
    const modelRenderPass = new RenderPass(ticket, context.camera)
    context.composer.addPass(modelRenderPass)

    // Set renderer clear color to make background visible
    context.renderer.setClearColor(0x000000, 0)

    // Add ambient light with increased intensity
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    ticket.add(ambientLight)

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 5, 5)
    ticket.add(directionalLight)

    // Add a point light to better illuminate the placeholder
    const pointLight = new THREE.PointLight(0xffffff, 1.0)
    pointLight.position.set(0, 0, 5)
    ticket.add(pointLight)
  }

  update(context: SceneRenderer): void {
    throw new Error('Method not implemented.')
  }
  cleanup(): void {
    throw new Error('Method not implemented.')
  }

  handleEvent(event: string, data?: any): void {
    throw new Error('Method not implemented.')
  }

  resize(_ev: UIEvent): void {
    return
  }

  private setCamera(camera: Camera) {
    camera.position.copy(this._sceneConfig.camera.position)
    camera.rotation.copy(this._sceneConfig.camera.rotation)
  }

  private createMaterial() {}
}

export default TicketScene
