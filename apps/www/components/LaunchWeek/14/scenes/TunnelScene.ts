import * as THREE from 'three'
import SceneRenderer, { BaseScene } from '../utils/SceneRenderer'

interface TunnelSceneState {
  visible: boolean
  texts: {}
}

interface TunnelSceneOptions {
  defaultVisible?: boolean
}

interface InternalState {
  mouseX: number
  mouseY: number
  targetX: number
  targetY: number
  currentX: number
  currentY: number
}

class TunnelScene implements BaseScene {
  raycaster = new THREE.Raycaster()

  state: TunnelSceneState

  private _internalState: InternalState = {
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
  }

  private tunnelGroup: THREE.Group | null = null
  private wallsGroup: THREE.Group | null = null
  private endWallGroup: THREE.Group | null = null
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null
  private _sceneRenderer: SceneRenderer | null = null

  // Tunnel parameters
  private tunnelWidth = 100
  private tunnelHeight = 70
  private tunnelLength = 300

  // Tunnel position parameters - start below camera
  private tunnelStartY = -50
  private color = 0x202020

  constructor(private options: TunnelSceneOptions) {
    this.state = {
      visible: options.defaultVisible ?? false,
      texts: {},
    }
  }

  getId(): string {
    return 'TunnelScene'
  }

  async setup(context: SceneRenderer): Promise<void> {
    this._sceneRenderer = context

    if (!context.mainThreeJsScene) {
      throw new Error('Main Three.js scene not initialized')
    }
    // Add fog to scene for depth effect
    context.mainThreeJsScene.fog = new THREE.Fog(0x000000, 0, 20)

    // Create tunnel
    this.createTunnel(context.mainThreeJsScene)
  }

  private createGrid(width: number, height: number, divisions: number): THREE.Group {
    const material = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 1,
    })

    const group = new THREE.Group()

    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const y = (i / divisions) * height - height / 2

      const geometry = new THREE.BufferGeometry()

      // For longer tunnels, create segmented lines that can bend more naturally
      const segmentCount = 20 // More segments = smoother bending
      const points = []

      for (let j = 0; j <= segmentCount; j++) {
        const x = (j / segmentCount) * width - width / 2
        points.push(new THREE.Vector3(x, y, 0))
      }

      geometry.setFromPoints(points)
      const line = new THREE.Line(geometry, material)
      group.add(line)
    }

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions) * width - width / 2

      const geometry = new THREE.BufferGeometry()

      // For longer tunnels, create segmented lines that can bend more naturally
      const segmentCount = 20 // More segments = smoother bending
      const points = []

      for (let j = 0; j <= segmentCount; j++) {
        const y = (j / segmentCount) * height - height / 2
        points.push(new THREE.Vector3(x, y, 0))
      }

      geometry.setFromPoints(points)
      const line = new THREE.Line(geometry, material)
      group.add(line)
    }

    return group
  }

  private createTunnel(scene: THREE.Scene): void {
    // Create a group to hold all tunnel parts for easier movement
    this.tunnelGroup = new THREE.Group()

    // Create a separate group for the walls that will bend
    this.wallsGroup = new THREE.Group()
    this.tunnelGroup.add(this.wallsGroup)

    // Create a separate group for the end wall that will always face camera
    this.endWallGroup = new THREE.Group()
    this.tunnelGroup.add(this.endWallGroup)

    scene.add(this.tunnelGroup)

    // Increase the number of divisions for smoother bending
    const divisions = 60

    // Floor
    const floor = this.createGrid(this.tunnelWidth, this.tunnelLength, divisions)
    floor.rotation.x = Math.PI / 2
    floor.position.set(0, -this.tunnelHeight / 2, -this.tunnelLength / 2)
    this.wallsGroup.add(floor)

    // Ceiling
    const ceiling = this.createGrid(this.tunnelWidth, this.tunnelLength, divisions)
    ceiling.rotation.x = -Math.PI / 2
    ceiling.position.set(0, this.tunnelHeight / 2, -this.tunnelLength / 2)
    this.wallsGroup.add(ceiling)

    // Left wall
    const leftWall = this.createGrid(this.tunnelLength, this.tunnelHeight, divisions)
    leftWall.rotation.y = Math.PI / 2
    leftWall.position.set(-this.tunnelWidth / 2, 0, -this.tunnelLength / 2)
    this.wallsGroup.add(leftWall)

    // Right wall
    const rightWall = this.createGrid(this.tunnelLength, this.tunnelHeight, divisions)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.position.set(this.tunnelWidth / 2, 0, -this.tunnelLength / 2)
    this.wallsGroup.add(rightWall)

    // Position the entire tunnel group to start below the camera
    this.tunnelGroup.position.y = this.tunnelStartY

    const endWallMaterial = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 1,
    })

    // Create a more distinct end wall with cross pattern
    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const y = (i / divisions) * this.tunnelHeight - this.tunnelHeight / 2

      const geometry = new THREE.BufferGeometry()
      const points = [
        new THREE.Vector3(-this.tunnelWidth / 2, y, -this.tunnelLength),
        new THREE.Vector3(this.tunnelWidth / 2, y, -this.tunnelLength),
      ]
      geometry.setFromPoints(points)

      const line = new THREE.Line(geometry, endWallMaterial)
      this.endWallGroup.add(line)
    }

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions) * this.tunnelWidth - this.tunnelWidth / 2

      const geometry = new THREE.BufferGeometry()
      const points = [
        new THREE.Vector3(x, -this.tunnelHeight / 2, -this.tunnelLength),
        new THREE.Vector3(x, this.tunnelHeight / 2, -this.tunnelLength),
      ]
      geometry.setFromPoints(points)

      const line = new THREE.Line(geometry, endWallMaterial)
      this.endWallGroup.add(line)
    }

    // Add a glowing frame around the edge for extra visibility
    const frameMaterial = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0,
    })

    const frame = new THREE.BufferGeometry()
    const framePoints = [
      new THREE.Vector3(-this.tunnelWidth / 2, -this.tunnelHeight / 2, -this.tunnelLength),
      new THREE.Vector3(this.tunnelWidth / 2, -this.tunnelHeight / 2, -this.tunnelLength),
      new THREE.Vector3(this.tunnelWidth / 2, this.tunnelHeight / 2, -this.tunnelLength),
      new THREE.Vector3(-this.tunnelWidth / 2, this.tunnelHeight / 2, -this.tunnelLength),
      new THREE.Vector3(-this.tunnelWidth / 2, -this.tunnelHeight / 2, -this.tunnelLength),
    ]
    frame.setFromPoints(framePoints)
    const frameLine = new THREE.Line(frame, frameMaterial)
    this.endWallGroup.add(frameLine)

    // Add a central marker
    const markerGeometry = new THREE.BufferGeometry()
    const markerPoints = [
      new THREE.Vector3(-10, 0, -this.tunnelLength),
      new THREE.Vector3(10, 0, -this.tunnelLength),
    ]
    markerGeometry.setFromPoints(markerPoints)
    const markerLine = new THREE.Line(markerGeometry, frameMaterial)
    this.endWallGroup.add(markerLine)

    // Position the end wall at the end of the tunnel
    this.endWallGroup.position.z = -this.tunnelLength
  }

  update(context: SceneRenderer, time?: number): void {
    if (!this.state.visible || !this.tunnelGroup || !this.wallsGroup || !this.endWallGroup) return

    // Clear the renderer with transparent background before rendering
    context.renderer.clear(true, true, true)

    const mouseState = context.mousePositionState

    // Apply base rotation to the entire tunnel group
    const baseRotation = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
    this.tunnelGroup.matrixAutoUpdate = false
    this.tunnelGroup.matrix.copy(baseRotation)

    // Calculate the end wall position based on mouse movement
    // Reduce movement amount and invert direction to match wall bending
    const endWallOffsetX = -mouseState.containerX * 15
    const endWallOffsetY = -mouseState.containerY * 10

    // Create a non-Euclidean tunnel effect where walls connect to the moving end wall
    if (this.wallsGroup && this.endWallGroup) {
      // Position the end wall based on mouse position
      this.endWallGroup.matrixAutoUpdate = false

      // Create a translation matrix for the end wall
      const endWallMatrix = new THREE.Matrix4().makeTranslation(endWallOffsetX, endWallOffsetY, 0)

      // Apply the translation to the end wall (keeping it facing the camera)
      this.endWallGroup.matrix.copy(endWallMatrix)

      // Get the actual camera Z position - critical for calculating proper bend
      const cameraZ = context.camera.position.z

      // Calculate the distance from camera to the end of the tunnel
      // This is crucial for proper non-Euclidean effect calculation
      const distanceToCameraZ = Math.abs(cameraZ - -this.tunnelLength)

      // Calculate the bend strength based on:
      // 1. The end wall offset (how much it moved)
      // 2. The tunnel length (longer tunnels need less bend per unit)
      // 3. The camera distance (closer camera requires stronger bend)
      // This creates a mathematically accurate non-Euclidean effect
      const bendFactor = 1 / distanceToCameraZ

      // Calculate bend strength with camera distance factored in
      const bendStrengthX = (endWallOffsetX / this.tunnelLength) * bendFactor
      const bendStrengthY = (endWallOffsetY / this.tunnelLength) * bendFactor

      // Create a transformation matrix for the walls
      // The walls need to bend in the opposite direction of the back wall movement
      const wallsMatrix = new THREE.Matrix4()

      // Create a matrix that bends the walls to connect to the end wall position
      // The negative signs ensure the walls bend in the opposite direction of the back wall
      // The bend is scaled by tunnel length to ensure proper connection
      wallsMatrix.set(
        1,
        0,
        -bendStrengthX * this.tunnelLength,
        0,
        0,
        1,
        -bendStrengthY * this.tunnelLength,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1
      )

      // Apply the transformation to walls
      this.wallsGroup.matrixAutoUpdate = false
      this.wallsGroup.matrix.copy(wallsMatrix)
    }
  }

  cleanup(): void {
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler)
      this.mouseMoveHandler = null
    }

    // Clean up Three.js resources
    if (this.tunnelGroup) {
      this.tunnelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })

      if (this._sceneRenderer?.mainThreeJsScene) {
        this._sceneRenderer.mainThreeJsScene.remove(this.tunnelGroup)
      }

      this.tunnelGroup = null
    }
  }

  resize(ev: UIEvent): void {
    // No specific resize handling needed as camera is managed by SceneRenderer
  }

  click(e: MouseEvent): void {
    // No click handling needed for tunnel effect
  }

  setVisible(value: boolean): void {
    this.state.visible = value

    // Reset mouse position when visibility changes
    if (value) {
      this._internalState.targetX = 0
      this._internalState.targetY = 0
      this._internalState.currentX = 0
      this._internalState.currentY = 0
    }

    // Make sure tunnel is visible/invisible
    if (this.tunnelGroup) {
      this.tunnelGroup.visible = value
    }
  }

  devicePixelRatioChanged(): void {
    if (this.tunnelGroup) {
      this.tunnelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          if (child.material) {
            // Update any material properties that might depend on pixel ratio
            child.material.needsUpdate = true
          }
        }
      })
    }
  }
}

export default TunnelScene
