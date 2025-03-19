import * as THREE from 'three'
import SceneRenderer, { BaseScene } from '../utils/SceneRenderer'
import { HUDShader } from '../effects/hud-shader'

interface HudSceneState {
  visible: boolean
  peopleOnline: number
  peopleOnlineActive: boolean
  fuelLevel: number
  shieldIntegrity: number
  oxygenLevel: number
  vignetteRaduis: number
  vignetteSmoothness: number
}

interface HudSceneOptions {
  defaultVisible?: boolean
  online?: boolean
}

class HUDScene implements BaseScene {
  raycaster = new THREE.Raycaster()

  state: HudSceneState

  private _sceneRenderer: SceneRenderer | null = null
  private hudGroup: THREE.Group | null = null
  private hudPlane: THREE.PlaneGeometry | null = null
  private hudMesh: THREE.Mesh<THREE.PlaneGeometry> | null = null
  private hudCanvas: HTMLCanvasElement | null = null
  private hudContext: CanvasRenderingContext2D | null = null
  private hudTexture: THREE.CanvasTexture | null = null
  private hudMaterial: THREE.ShaderMaterial | null = null

  // Noise texture for the shader
  private noiseTexture: THREE.Texture | null = null

  // Shader parameters
  private shader = HUDShader
  // HUD parameters
  private width = 0
  private height = 0

  // canvas height will be calculated based on camera aspect ratio
  private referenceCanvasWidth = 1120
  private referenceCanvasHeight = 707
  private qualityMultiplier = 1.5

  private referenceSizes = {
    axis: {
      width: 67,
      textGap: 16,
      fontSize: 12,
      lineHeight: 24,
      headerColor: '#fff',
      ticksColor: '#6E6E6E',
      textShadowBlur: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      leftCoords: {
        x: 92,
        y: 206,
      },
      rightCoords: {
        x: 985,
        y: 206,
      },
    },
    bars: {
      lineHeight: 16,
      fontSize: 12,
      barWidth: 72,
      barHeight: 12,
      barStroke: 1,
      labelColor: '#858585',
      barColor: '#6C6C6C',
      valueColor: '#fff',
      xGap: 8,
      yGap: 2,
      coords: [
        {
          y: 611,
          x: 190 + 25,
        },
        {
          y: 611,
          x: 380 + 25,
        },
        {
          y: 611,
          x: 570 + 25,
        },
      ],
    },
    numberControl: {
      lineHeight: 16,
      fontSize: 12,
      xGap: 4,
      yGap: 2,
      dotSize: 4,
      labelColor: '#858585',
      activeColor: '#2CF494',
      disabledColor: '#6C6C6C',
      valueColor: '#fff',
      coords: {
        y: 611,
        x: 760 + 25,
      },
    },
  }

  private sizes: typeof this.referenceSizes
  private canvasWidth: number
  private canvasHeight: number

  constructor(private options: HudSceneOptions) {
    this.state = {
      visible: options.defaultVisible ?? false,
      peopleOnline: 0,
      fuelLevel: 0,
      shieldIntegrity: 0,
      oxygenLevel: 0,
      peopleOnlineActive: options.online ?? false,
      vignetteRaduis: 1,
      vignetteSmoothness: 0,
    }

    this.canvasWidth = this.referenceCanvasWidth * this.qualityMultiplier
    this.canvasHeight = this.referenceCanvasHeight * this.qualityMultiplier

    this.sizes = JSON.parse(JSON.stringify(this.referenceSizes), (key, value) => {
      return typeof value === 'number' ? value * this.qualityMultiplier : value
    })
  }

  getId(): string {
    return 'HudScene'
  }

  async setup(context: SceneRenderer): Promise<void> {
    this._sceneRenderer = context

    if (!context.mainThreeJsScene) {
      throw new Error('Main Three.js scene not initialized')
    }

    const scene = context.mainThreeJsScene
    // Create main HUD group
    this.hudGroup = new THREE.Group()
    scene.add(this.hudGroup)

    this.setHUDDimensionsAndPosition(12)

    // Create canvas for HUD content
    this.hudCanvas = document.createElement('canvas')
    this.hudCanvas.width = this.canvasWidth
    this.hudCanvas.height = this.canvasHeight
    this.hudContext = this.hudCanvas.getContext('2d')

    this.draw()

    // Create noise texture with higher resolution for more subtle grain
    this.noiseTexture = this.createNoiseTexture(512, 512)

    // Create HUD texture from canvas
    this.hudTexture = new THREE.CanvasTexture(this.hudCanvas)
    // Use linear filtering for better text quality
    this.hudTexture.minFilter = THREE.LinearFilter
    this.hudTexture.magFilter = THREE.LinearFilter

    this.shader.uniforms.tDiffuse.value = this.hudTexture

    // Create shader material
    this.hudMaterial = new THREE.ShaderMaterial({
      uniforms: this.shader.uniforms,
      vertexShader: this.shader.vertexShader,
      fragmentShader: this.shader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false, // Helps with transparency issues
    })

    this.shader.uniforms.vignetteRadius.value = this.state.vignetteRaduis
    this.shader.uniforms.vignetteSmoothness.value = this.state.vignetteSmoothness

    // Create HUD mesh
    this.hudPlane = new THREE.PlaneGeometry(this.width, this.height)
    this.hudMesh = new THREE.Mesh(this.hudPlane, this.hudMaterial)
    this.hudMesh.position.set(0, 0, 0)

    this.hudGroup.add(this.hudMesh)

    // Set initial visibility
    this.setVisible(this.state.visible)
  }

  // Create a noise texture for the shader with more subtle grain pattern
  // Create a noise texture for the shader with more pronounced grain pattern
  private createNoiseTexture(width: number, height: number): THREE.DataTexture {
    const size = width * height
    const data = new Uint8Array(3 * size)

    // Generate noise with more variation around the center point (128)
    for (let i = 0; i < size; i++) {
      const stride = i * 3

      // Generate noise values with wider distribution around mid-gray (128)
      // This creates a more visible grain effect with values that deviate more from center
      const noise = 128 + (Math.random() - 0.5) * 100

      data[stride] = noise
      data[stride + 1] = noise
      data[stride + 2] = noise
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBFormat)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    // Use nearest filtering for more distinct grain
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    texture.needsUpdate = true

    return texture
  }

  update(context: SceneRenderer, time?: number): void {
    // Update HUD elements based on state

    // Update shader uniforms
    if (this.shader.uniforms && time !== undefined) {
      // Update time uniform for animation
      this.shader.uniforms.time.value = time
      this.shader.uniforms.resolution.value[0] = this.canvasWidth
      this.shader.uniforms.resolution.value[1] = this.canvasHeight
      this.shader.uniforms.vignetteRadius.value = this.shader.uniforms.vignetteRadius.value + 
        (this.state.vignetteRaduis - this.shader.uniforms.vignetteRadius.value) * 0.1
      this.shader.uniforms.vignetteSmoothness.value = this.shader.uniforms.vignetteSmoothness.value + 
        (this.state.vignetteSmoothness - this.shader.uniforms.vignetteSmoothness.value) * 0.1
    }
  }

  cleanup(): void {
    // Dispose of textures
    if (this.hudTexture) {
      this.hudTexture.dispose()
    }

    if (this.noiseTexture) {
      this.noiseTexture.dispose()
    }

    // Dispose of materials
    if (this.hudMaterial) {
      this.hudMaterial.dispose()
    }

    // Dispose of geometries
    if (this.hudPlane) {
      this.hudPlane.dispose()
    }

    // Remove from scene
    if (this.hudGroup && this._sceneRenderer && this._sceneRenderer.mainThreeJsScene) {
      this._sceneRenderer.mainThreeJsScene.remove(this.hudGroup)
    }
  }

  // Public methods to update state
  setPeopleOnline(count: number): void {
    this.state.peopleOnline = count

    this.draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setFuelLevel(level: number): void {
    this.state.fuelLevel = Math.max(0, Math.min(1, level))

    this.draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setShieldIntegrity(level: number): void {
    this.state.shieldIntegrity = Math.max(0, Math.min(1, level))

    this.draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setOxygenLevel(level: number): void {
    this.state.oxygenLevel = Math.max(0, Math.min(1, level))

    this.draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setPeopleOnlineActive(active: boolean): void {
    this.state.peopleOnlineActive = active
    this.draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  dimmHud() {
    this.state.vignetteRaduis = 0.2
    this.state.vignetteSmoothness = 0.5
  }

  undimmHud() {
    this.state.vignetteRaduis = 1
    this.state.vignetteSmoothness = 0
  }

  resize(ev: UIEvent): void {
    // Update dimensions when window is resized
    if (this._sceneRenderer && this._sceneRenderer.camera) {
      // Recalculate HUD dimensions based on camera
      this.calculateHudDimensions(this._sceneRenderer.camera)

      // Reposition HUD elements based on new dimensions
      this.repositionHudElements()
    }
  }

  click(e: MouseEvent): void {
    // No click handling needed for tunnel effect
  }

  setVisible(value: boolean): void {
    this.state.visible = value

    if (this.hudGroup) {
      this.hudGroup.visible = value
      console.log('HUD visibility set to:', value)

      // Also update debug helpers visibility
    }
  }

  private draw() {
    if (!this.hudContext) {
      throw new Error('HUD context not initialized')
    }

    if (!this.hudCanvas) {
      throw new Error('HUD canvas not initialized')
    }

    const ctx = this.hudContext
    const canvas = this.hudCanvas

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    this.drawLeftAlignedAxis(ctx, this.sizes.axis.leftCoords, {
      header: 'PREV LWS',
      labels: ['7', '8', '9', '10', '11', '12', '13'],
    })

    this.drawLeftAlignedAxis(ctx, this.sizes.axis.rightCoords, {
      header: 'TEMP',
      labels: ['2005', '2027', '2049', '2071', '2093', '2115', '2137'],
    })

    this.drawLeftAlignedBarControl(ctx, this.sizes.bars.coords[0], {
      label: 'FUEL',
      percentage: this.state.fuelLevel,
    })

    this.drawLeftAlignedBarControl(ctx, this.sizes.bars.coords[1], {
      label: 'SHIELD INTEGRITY',
      percentage: this.state.shieldIntegrity,
    })

    this.drawLeftAlignedBarControl(ctx, this.sizes.bars.coords[2], {
      label: 'OXYGEN',
      percentage: this.state.oxygenLevel,
    })

    this.drawLeftAlignedNumberControl(ctx, this.sizes.numberControl.coords, {
      label: 'PEOPLE ONLINE',
      value: this.state.peopleOnline,
      active: this.state.peopleOnlineActive,
    })
  }

  private drawLeftAlignedAxis(
    ctx: CanvasRenderingContext2D,
    axisCoords: { x: number; y: number },
    data: { header: string; labels: string[] }
  ) {
    const axis = this.sizes.axis
    ctx.save()
    let yCoord = 0
    ctx.translate(axisCoords.x + axis.width / 2, axisCoords.y)
    ctx.font = `${axis.fontSize}px Source Code Pro, Office Code Pro, Menlo, monospace`
    ctx.fillStyle = axis.headerColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(data.header, 0, yCoord)
    ctx.fillStyle = axis.ticksColor
    for (const label of data.labels) {
      yCoord += axis.lineHeight + axis.textGap
      ctx.fillText(label, 0, yCoord)
    }
    ctx.restore()
  }

  private drawLeftAlignedBarControl(
    ctx: CanvasRenderingContext2D,
    coords: { x: number; y: number },
    data: { label: string; percentage: number }
  ) {
    const bars = this.sizes.bars
    ctx.save()

    // Draw label on top
    ctx.font = `${bars.fontSize}px Source Code Pro, Office Code Pro, Menlo, monospace`
    ctx.fillStyle = bars.labelColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(data.label, coords.x, coords.y)

    // Draw bar below the label
    const barY = coords.y + bars.lineHeight + bars.yGap

    // Bar background
    ctx.strokeStyle = bars.barColor
    ctx.lineWidth = bars.barStroke
    ctx.strokeRect(coords.x, barY, bars.barWidth, bars.barHeight)

    // Add vertical gradient inside the bar background
    const gradient = ctx.createLinearGradient(0, barY, 0, barY + bars.barHeight)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(coords.x, barY, bars.barWidth, bars.barHeight)

    // Filled portion of the bar
    const fillWidth = Math.max(0, Math.min(1, data.percentage)) * bars.barWidth
    ctx.fillStyle = bars.barColor
    ctx.fillRect(coords.x, barY, fillWidth, bars.barHeight)

    // Draw value on the right of the bar
    ctx.fillStyle = bars.valueColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const value = Math.round(data.percentage * 100)
      .toString()
      .padStart(3, '0')
    ctx.fillText(value, coords.x + bars.barWidth + bars.xGap, barY + bars.barHeight / 2)

    ctx.restore()
  }

  private drawLeftAlignedNumberControl(
    ctx: CanvasRenderingContext2D,
    coords: { x: number; y: number },
    data: { label: string; value: number | null; active: boolean }
  ) {
    const control = this.sizes.numberControl
    ctx.save()

    // Draw label on top
    ctx.font = `${control.fontSize}px Source Code Pro, Office Code Pro, Menlo, monospace`
    ctx.fillStyle = control.labelColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(data.label, coords.x, coords.y)

    // Draw dot below the label
    const dotY =
      coords.y + control.lineHeight + control.yGap + control.lineHeight / 2 - control.dotSize / 2

    // Draw the dot with color based on active state
    ctx.fillStyle = data.active ? control.activeColor : control.disabledColor
    ctx.beginPath()
    ctx.arc(
      coords.x + control.dotSize / 2,
      dotY + control.dotSize / 2,
      control.dotSize / 2,
      0,
      Math.PI * 2
    )
    ctx.fill()

    // Draw value or dashes on the right of the dot
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    if (data.active && data.value !== null) {
      // Draw the actual value when active
      ctx.fillStyle = control.valueColor
      const value = data.value.toString().padStart(3, '0')
      ctx.fillText(value, coords.x + control.dotSize + control.xGap, dotY + control.dotSize / 2)
    } else {
      // Draw dashes when inactive
      ctx.fillStyle = control.disabledColor
      ctx.fillText('---', coords.x + control.dotSize + control.xGap, dotY + control.dotSize / 2)
    }

    ctx.restore()
  }

  private setHUDDimensionsAndPosition(cameraDistance: number = 12) {
    if (this._sceneRenderer && this._sceneRenderer.camera && this.hudGroup) {
      const cameraPosition = this._sceneRenderer.camera.position.clone()

      // Create a vector pointing in the direction the camera is looking
      const lookDirection = new THREE.Vector3(0, 0, -1)
      lookDirection.applyQuaternion(this._sceneRenderer.camera.quaternion)

      const cameraToHudVector = lookDirection.multiplyScalar(cameraDistance)
      // Position the HUD at the calculated distance in the direction the camera is looking
      const hudPosition = cameraPosition.clone().add(cameraToHudVector)

      this.hudGroup.position.copy(hudPosition)

      // Orient to face camera
      this.hudGroup.rotation.x = -Math.PI / 2 // 90 degrees to face up

      this.calculateHudDimensions(this._sceneRenderer.camera)
    }
  }

  private calculateHudDimensions(camera: THREE.Camera): void {
    if (camera instanceof THREE.PerspectiveCamera && this.hudGroup) {
      // For perspective camera, calculate visible width and height at the HUD distance
      const fov = camera.fov * (Math.PI / 180) // Convert to radians
      const distance = camera.position.distanceTo(this.hudGroup.position)

      // Calculate visible height at the given distance
      const visibleHeight = 2 * Math.tan(fov / 2) * distance

      // Calculate visible width using aspect ratio
      const visibleWidth = visibleHeight * camera.aspect

      this.width = visibleWidth * 1
      this.height = visibleHeight * 1
    } else if (camera instanceof THREE.OrthographicCamera) {
      throw new Error('Orthographic camera not supported')
    } else {
      // Fallback to renderer dimensions if camera type is unknown
      throw new Error('Unknown camera type')
    }
  }

  private repositionHudElements(): void {
    if (!this.hudGroup || !this.hudMesh) return

    // Update the plane geometry with new dimensions
    this.hudMesh.geometry.dispose(); // Dispose of the old geometry
    this.hudPlane = new THREE.PlaneGeometry(this.width, this.height);
    this.hudMesh.geometry = this.hudPlane;
  }

  private getSize(num: number, axis: 'y' | 'x') {
    const aspect = this.width / this.height
    return axis === 'y' ? (num / this.canvasWidth) * aspect : num / this.canvasWidth
  }
}

export default HUDScene
