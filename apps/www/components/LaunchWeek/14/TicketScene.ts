import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GlitchPass } from './effects/glitch'
import { loadGLTFModel } from './helpers'

export interface SceneSetupOptions {
  debug?: boolean
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
}

export interface SceneRenderContext {
  scene: THREE.Scene
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  composer: EffectComposer
  container: HTMLElement
  bloomPass?: UnrealBloomPass
  glitchPass?: GlitchPass
  crtPass?: ShaderPass
  orbitControls?: OrbitControls
  stats?: any
  debug?: boolean
  time?: number
}

export interface TicketSceneEvents {
  onMouseMove?: (event: MouseEvent) => void
  onResize?: () => void
  onToggleSecret?: (isSecret: boolean) => void
}

export interface BaseScene {
  /**
   * Initialize the scene with the given context
   */
  setup(context: SceneRenderContext): Promise<void>
  
  /**
   * Update the scene for each animation frame
   */
  update(context: SceneRenderContext): void
  
  /**
   * Clean up resources when the scene is destroyed
   */
  cleanup(): void
  
  /**
   * Handle events from the parent component
   */
  handleEvent(event: string, data?: any): void
  
  /**
   * Get the current ticket model
   */
  getTicket(): THREE.Object3D | null
  
  /**
   * Update a text element on the ticket
   */
  updateText(elementName: string, text: string): void
}

interface TicketSceneImplOptions {
  modelUrl: string
  fontUrl: string
}

export class TicketSceneImpl implements BaseScene {
  protected ticket: THREE.Object3D | null = null
  protected textElements: Map<string, THREE.Mesh> = new Map()
  protected events: TicketSceneEvents = {}
  protected isSecret: boolean = false

  constructor(private options: TicketSceneImplOptions) {

  }
  
  async setup() {
    const gltf = await loadGLTFModel(this.options.modelUrl)
    gltf.scene
  }
  
  update(context: SceneRenderContext): void {
    // Default implementation - can be overridden by subclasses
    if (this.isSecret) {
      if (context.crtPass) context.crtPass.enabled = true
      if (context.glitchPass) context.glitchPass.enabled = true
      if (context.bloomPass) context.bloomPass.enabled = true
    } else {
      if (context.crtPass) context.crtPass.enabled = false
      if (context.glitchPass) context.glitchPass.enabled = false
      if (context.bloomPass) context.bloomPass.enabled = false
    }
  }
  
  cleanup(): void {
    // Default implementation - can be overridden by subclasses
    this.ticket = null
    this.textElements.clear()
  }
  
  handleEvent(event: string, data?: any): void {
    switch (event) {
      case 'toggleSecret':
        this.isSecret = !!data
        break;
      default:
        console.warn(`Unhandled event: ${event}`, data)
    }
  }
  
  getTicket(): THREE.Object3D | null {
    return this.ticket
  }
  
  updateText(elementName: string, text: string): void {
    const textMesh = this.textElements.get(elementName)
    if (!textMesh) {
      console.warn(`Text element "${elementName}" not found`)
      return
    }
    
    // Update the texture with new text
    if (textMesh.material instanceof THREE.MeshBasicMaterial && textMesh.material.map) {
      const texture = textMesh.material.map
      const canvas = texture.image
      const context = canvas.getContext('2d')
      
      if (context) {
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)
        
        // Set text properties
        context.fillStyle = 'black'
        const fontSize = Math.floor(canvas.height)
        context.font = `bold ${fontSize}px Arial`
        
        // Center text
        context.textAlign = 'left'
        context.textBaseline = 'middle'
        context.fillText(text, 0, canvas.height / 2)
        
        // Update texture
        texture.needsUpdate = true
      }
    }
  }
  
  protected createLighting(scene: THREE.Scene): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)
    
    // Add a point light
    const pointLight = new THREE.PointLight(0xffffff, 1.0)
    pointLight.position.set(0, 0, 5)
    scene.add(pointLight)
  }
}
