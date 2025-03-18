import * as THREE from 'three'
import SceneRenderer, { BaseScene } from '../utils/SceneRenderer'

interface HudSceneState {
  visible: boolean
  peopleOnline: number
  peopleOnlineActive: boolean
  fuelLevel: number
  shieldIntegrity: number
  oxygenLevel: number
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
  private hudMaterial: THREE.MeshBasicMaterial | null = null

  // HUD parameters
  private width = 0
  private height = 0

  // canvas height will be calculated based on camera aspect ratio
  private referenceCanvasWidth = 1120
  private referenceCanvasHeight = 707
  private qualityMultiplier = 1.5 

  // Bar elements
  private fuelBar: THREE.Mesh | null = null
  private shieldBar: THREE.Mesh | null = null
  private oxygenBar: THREE.Mesh | null = null

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
          x: 190,
        },
        {
          y: 611,
          x: 380,
        },
        {
          y: 611,
          x: 570,
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
        x: 760,
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

    this.hudCanvas = document.createElement('canvas')
    this.hudCanvas.width = this.canvasWidth
    this.hudCanvas.height = this.canvasHeight
    this.hudContext = this.hudCanvas.getContext('2d')

    this.draw()

    this.hudPlane = new THREE.PlaneGeometry(this.width, this.height)
    this.hudTexture = new THREE.CanvasTexture(this.hudCanvas)
    this.hudMaterial = new THREE.MeshBasicMaterial({
      map: this.hudTexture,
      // color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
    })
    this.hudMesh = new THREE.Mesh(this.hudPlane, this.hudMaterial)
    this.hudMesh.position.set(0, 0, 0)

    this.hudGroup.add(this.hudMesh)

    // Set initial visibility
    this.setVisible(this.state.visible)
  }

  update(context: SceneRenderer, time?: number): void {
    // Update HUD elements based on state
  }

  cleanup(): void {
  }

  // Public methods to update state
  setPeopleOnline(count: number): void {
    this.state.peopleOnline = count

    this.draw()
    if(this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setFuelLevel(level: number): void {
    this.state.fuelLevel = Math.max(0, Math.min(1, level))

    this.draw()
    if(this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setShieldIntegrity(level: number): void {
    this.state.shieldIntegrity = Math.max(0, Math.min(1, level))

    this.draw()
    if(this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setOxygenLevel(level: number): void {
    this.state.oxygenLevel = Math.max(0, Math.min(1, level))

    this.draw()
    if(this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setPeopleOnlineActive(active: boolean): void {
    this.state.peopleOnlineActive = active
    this.draw()
    if(this.hudTexture) this.hudTexture.needsUpdate = true
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

    console.log('Drawing HUD', canvas.width, canvas.height)

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
    if (!this.hudGroup) return
  }

  private getSize(num: number, axis: 'y' | 'x') {
    const aspect = this.width / this.height
    return axis === 'y' ? (num / this.canvasWidth) * aspect : num / this.canvasWidth
  }
}

export default HUDScene
