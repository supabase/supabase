import * as THREE from 'three'
import SceneRenderer, { BaseScene } from '../utils/SceneRenderer'
import { HUDShader } from '../effects/hud-shader'

interface HudSceneState {
  visible: boolean
  peopleOnline: number
  peopleOnlineActive: boolean
  payloadSaturation: number
  payloadFill: number
  meetupsAmount: number
  vignetteRaduis: number
  vignetteSmoothness: number
  layout: 'default' | 'ticket' | 'narrow'
}

interface HudSceneOptions {
  defaultVisible?: boolean
  online?: boolean
  defaultLayout?: 'default' | 'ticket' | 'narrow'
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
  private qualityMultiplier = 2

  private referenceStyles = {
    axis: {
      width: 67,
      textGap: 16,
      fontSize: 12,
      lineHeight: 24,
      headerColor: '#fff',
      ticksColor: '#6E6E6E',
      textShadowBlur: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
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
    },
  }

  private resolutions = {
    0: {
      numberControl: {
        coords: { y: 611 - 20, x: 0, alignment: 'center' as const },
        visible: true as const,
      },
      bars: {
        coords: [
          { y: 611 - 170, x: 0, alignment: 'center' as const },
          {
            y: 611 - 120,
            x: 0,
            alignment: 'center' as const,
          },
          {
            y: 611 - 70,
            x: 0,
            alignment: 'center' as const,
          },
        ],
        visible: true as const,
      },
      axis: {
        visible: false as const,
      },
    },
    768: {
      numberControl: {
        coords: {
          y: 611,
          x: 760 + 25,
          alignment: 'left' as const,
        },
        visible: true as const,
      },
      bars: {
        coords: [
          {
            y: 611,
            x: 190 + 25,
            alignment: 'left' as const,
          },
          {
            y: 611,
            x: 380 + 25,
            alignment: 'left' as const,
          },
          {
            y: 611,
            x: 570 + 25,
            alignment: 'left' as const,
          },
        ],
        visible: true as const,
      },
      axis: {
        visible: false as const,
        leftCoords: {
          x: 92 + 75,
          y: 206,
          alignment: 'left' as const,
        },
        rightCoords: {
          x: 960 - 75,
          y: 206,
          alignment: 'left' as const,
        },
      },
    },

    1024: {
      numberControl: {
        coords: {
          y: 611,
          x: 760 + 25,
          alignment: 'left' as const,
        },
        visible: true as const,
      },
      bars: {
        coords: [
          {
            y: 611,
            x: 190 + 25,
            alignment: 'left' as const,
          },
          {
            y: 611,
            x: 380 + 25,
            alignment: 'left' as const,
          },
          {
            y: 611,
            x: 570 + 25,
            alignment: 'left' as const,
          },
        ],
        visible: true as const,
      },
      axis: {
        visible: false as const,
        leftCoords: {
          x: 92,
          y: 206,
          alignment: 'left' as const,
        },
        rightCoords: {
          x: 960,
          y: 206,
          alignment: 'left' as const,
        },
      },
    },
  }

  resolutionsTicketLayout = {
    0: {
      numberControl: {
        coords: { y: 611 - 20, x: 0, alignment: 'center' as const },
        visible: true as const,
      },
      bars: {
        coords: [
          { y: 611 - 170, x: 0, alignment: 'center' as const },
          {
            y: 611 - 120,
            x: 0,
            alignment: 'center' as const,
          },
          {
            y: 611 - 70,
            x: 0,
            alignment: 'center' as const,
          },
        ],
        visible: true as const,
      },
      axis: {
        visible: false as const,
      },
    },
    768: {
      numberControl: {
        coords: {
          x: 960 - 150,
          y: 206 + 170,
          alignment: 'left' as const,
        },
        visible: true as const,
      },
      bars: {
        coords: [
          {
            x: 92 + 120,
            y: 206 + 100,
            alignment: 'left' as const,
          },
          {
            x: 92 + 120,
            y: 206 + 170,
            alignment: 'left' as const,
          },
          {
            x: 960 - 150,
            y: 206 + 100,
            alignment: 'left' as const,
          },
        ],
        visible: true as const,
      },
      axis: {
        visible: false as const,
      },
    },

    1024: {
      numberControl: {
        coords: {
          x: 940,
          y: 206 + 70,
          alignment: 'left' as const,
        },
        visible: true as const,
      },
      bars: {
        coords: [
          {
            x: 92,
            y: 206,
            alignment: 'left' as const,
          },
          {
            x: 92,
            y: 206 + 70,
            alignment: 'left' as const,
          },
          {
            x: 940,
            y: 206,
            alignment: 'left' as const,
          },
        ],
        visible: true as const,
      },
      axis: {
        visible: false as const,
      },
    },
  }

  resolutionsNarrowLayout = {
    0: {
      numberControl: {
        visible: false as const,
      },
      bars: {
        visible: false as const,
      },
      axis: {
        visible: false as const,
      },
    },

    768: {
      numberControl: {
        visible: false as const,
      },
      bars: {
        visible: false as const,
      },
      axis: {
        visible: false as const,
      },
    },

    // Required for TS discriminated union
    1024: {
      numberControl: {
        visible: false as const,
      },
      bars: {
        visible: false as const,
      },
      axis: {
        visible: false as const,
      },
    },
  }

  activeResolutionKey: keyof typeof this.resolutions = 0

  layouts: {
    default: HUDScene['resolutions']
    ticket: HUDScene['resolutionsTicketLayout']
    narrow: HUDScene['resolutionsNarrowLayout']
  }

  private scaledStyles: typeof this.referenceStyles
  private canvasWidth: number
  private canvasHeight: number

  constructor(private options: HudSceneOptions) {
    this.state = {
      visible: options.defaultVisible ?? false,
      peopleOnline: 0,
      payloadSaturation: 0,
      payloadFill: 0,
      meetupsAmount: 0,
      peopleOnlineActive: options.online ?? false,
      vignetteRaduis: 1,
      vignetteSmoothness: 0,
      layout: options.defaultLayout ?? 'default',
    }

    this.canvasWidth = this.referenceCanvasWidth * this.qualityMultiplier
    this.canvasHeight = this.referenceCanvasHeight * this.qualityMultiplier

    this.scaledStyles = JSON.parse(JSON.stringify(this.referenceStyles), (key, value) => {
      return typeof value === 'number' ? value * this.qualityMultiplier : value
    })

    this.layouts = {
      default: Object.fromEntries(
        Object.entries(this.resolutions).map(([key, resolutions]) => [
          key,
          JSON.parse(JSON.stringify(resolutions), (key, value) => {
            return typeof value === 'number' ? value * this.qualityMultiplier : value
          }),
        ])
      ) as typeof this.resolutions,

      ticket: Object.fromEntries(
        Object.entries(this.resolutionsTicketLayout).map(([key, resolutions]) => [
          key,
          JSON.parse(JSON.stringify(resolutions), (key, value) => {
            return typeof value === 'number' ? value * this.qualityMultiplier : value
          }),
        ])
      ) as typeof this.resolutionsTicketLayout,
      narrow: Object.fromEntries(
        Object.entries(this.resolutionsNarrowLayout).map(([key, resolutions]) => [
          key,
          JSON.parse(JSON.stringify(resolutions), (key, value) => {
            return typeof value === 'number' ? value * this.qualityMultiplier : value
          }),
        ])
      ) as typeof this.resolutionsNarrowLayout,
    }
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

    this.activeResolutionKey = this.getResolutionKey(window.innerWidth)

    this.setHUDDimensionsAndPosition(12)

    // Create canvas for HUD content
    this.hudCanvas = document.createElement('canvas')
    this.hudCanvas.width = this.canvasWidth
    this.hudCanvas.height = this.canvasHeight
    this.hudContext = this.hudCanvas.getContext('2d')

    this._draw()

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
      dithering: true,
    })

    this.shader.uniforms.vignetteRadius.value = this.state.vignetteRaduis
    this.shader.uniforms.vignetteSmoothness.value = this.state.vignetteSmoothness

    // Create HUD mesh
    this.hudPlane = new THREE.PlaneGeometry(this.width, this.height)

    // Apply object-cover effect to the initial geometry
    this.applyObjectCoverUVs(this.hudPlane)

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
      this.shader.uniforms.vignetteRadius.value =
        this.shader.uniforms.vignetteRadius.value +
        (this.state.vignetteRaduis - this.shader.uniforms.vignetteRadius.value) * 0.1
      this.shader.uniforms.vignetteSmoothness.value =
        this.shader.uniforms.vignetteSmoothness.value +
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
  setPeopleOnline(count: number, skipDraw?: boolean): void {
    this.state.peopleOnline = count
    if (skipDraw) {
      return
    }

    this._draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setPayloadSaturation(level: number, skipDraw?: boolean): void {
    this.state.payloadSaturation = Math.max(0, Math.min(1, level))

    if (skipDraw) {
      return
    }
    this._draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setPayloadFill(level: number, skipDraw?: boolean): void {
    this.state.payloadFill = Math.max(0, Math.min(1, level))
    if (skipDraw) {
      return
    }

    this._draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setMeetupsAmount(amount: number, skipDraw?: boolean): void {
    this.state.meetupsAmount = amount

    if (skipDraw) {
      return
    }
    this._draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setPeopleOnlineActive(active: boolean, skipDraw?: boolean): void {
    this.state.peopleOnlineActive = active

    if (skipDraw) {
      return
    }

    this._draw()

    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  setLayout(value: 'default' | 'ticket'): void {
    if (value === this.state.layout) {
      return
    }

    this.state.layout = value
    this._draw()
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

  draw(): void {
    this._draw()
    if (this.hudTexture) this.hudTexture.needsUpdate = true
  }

  resize(ev: UIEvent): void {
    // Update dimensions when window is resized
    if (this._sceneRenderer && this._sceneRenderer.camera) {
      // Recalculate HUD dimensions based on camera
      this.calculateHudDimensions(this._sceneRenderer.camera)

      // Reposition HUD elements based on new dimensions
      this.repositionHudElements()

      const newResolutionKey = this.getResolutionKey(window.innerWidth)
      if (this.activeResolutionKey !== newResolutionKey && this.hudTexture) {
        this.activeResolutionKey = newResolutionKey
        this._draw()
        this.hudTexture.needsUpdate = true
      }
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

  private _draw() {
    if (!this.hudContext) {
      throw new Error('HUD context not initialized')
    }

    if (!this.hudCanvas) {
      throw new Error('HUD canvas not initialized')
    }

    const ctx = this.hudContext
    const canvas = this.hudCanvas

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const layout = this.layouts[this.state.layout]
    const sizes = layout[this.activeResolutionKey as keyof typeof layout]

    // if (sizes.axis.visible) {
    //   this.drawLeftAlignedAxis(ctx, sizes.axis.leftCoords, {
    //     header: 'PREV LWS',
    //     labels: ['7', '8', '9', '10', '11', '12', '13'],
    //   })
    //
    //   this.drawLeftAlignedAxis(ctx, sizes.axis.rightCoords, {
    //     header: 'TEMP',
    //     labels: ['2005', '2027', '2049', '2071', '2093', '2115', '2137'],
    //   })
    // }

    if (sizes.bars.visible) {
      this.drawBarControl(ctx, sizes.bars.coords[0], {
        label: 'PAYLOAD SATURATION',
        percentage: this.state.payloadSaturation,
        alignment: sizes.bars.coords[0].alignment,
      })

      this.drawBarControl(ctx, sizes.bars.coords[1], {
        label: 'PAYLOAD VOLUME',
        percentage: this.state.payloadFill,
        alignment: sizes.bars.coords[1].alignment,
      })

      this.drawNumberControl(ctx, sizes.bars.coords[2], {
        label: 'MEETUPS',
        value: this.state.meetupsAmount,
        active: true,
        alignment: sizes.bars.coords[2].alignment,
        showDot: false,
      })
    }

    if (sizes.numberControl.visible) {
      this.drawNumberControl(ctx, sizes.numberControl.coords, {
        label: 'PEOPLE ONLINE',
        value: this.state.peopleOnline,
        active: this.state.peopleOnlineActive,
        alignment: sizes.numberControl.coords.alignment,
        showDot: true,
      })
    }
  }

  private drawLeftAlignedAxis(
    ctx: CanvasRenderingContext2D,
    axisCoords: { x: number; y: number },
    data: { header: string; labels: string[] }
  ) {
    const axis = this.scaledStyles.axis
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

  /**
   * Draws a bar control with customizable alignment
   * @param ctx Canvas context
   * @param coords Coordinates for the control
   * @param data Control data including label, percentage and alignment
   */
  private drawBarControl(
    ctx: CanvasRenderingContext2D,
    coords: { x: number; y: number },
    data: { label: string; percentage: number; alignment?: 'left' | 'center' }
  ) {
    const bars = this.scaledStyles.bars
    const alignment = data.alignment || 'left'
    ctx.save()

    // Calculate x position based on alignment
    let x = coords.x

    // If center alignment is specified, ignore the provided x coordinate
    // and center the entire component on the canvas
    if (alignment === 'center') {
      x = this.canvasWidth / 2
    }

    // Calculate positions for all elements
    let labelX = x
    let barX = x

    // Adjust for text alignment
    if (alignment === 'center') {
      // For center alignment, calculate offsets
      const labelWidth = ctx.measureText(data.label).width
      labelX = x - labelWidth / 2
      barX = x - bars.barWidth / 2
    }

    // Draw label on top
    ctx.font = `${bars.fontSize}px Source Code Pro, Office Code Pro, Menlo, monospace`
    ctx.fillStyle = bars.labelColor
    ctx.textAlign = alignment === 'center' ? 'center' : 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(data.label, alignment === 'center' ? x : labelX, coords.y)

    // Draw bar below the label
    const barY = coords.y + bars.lineHeight + bars.yGap

    // Bar background
    ctx.strokeStyle = bars.barColor
    ctx.lineWidth = bars.barStroke
    ctx.strokeRect(barX, barY, bars.barWidth, bars.barHeight)

    // Add vertical gradient inside the bar background
    const gradient = ctx.createLinearGradient(0, barY, 0, barY + bars.barHeight)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(barX, barY, bars.barWidth, bars.barHeight)

    // Filled portion of the bar
    const fillWidth = Math.max(0, Math.min(1, data.percentage)) * bars.barWidth
    ctx.fillStyle = bars.barColor
    ctx.fillRect(barX, barY, fillWidth, bars.barHeight)

    // Draw value on the right of the bar
    ctx.fillStyle = bars.valueColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const value = Math.round(data.percentage * 100)
      .toString()
      .padStart(3, '0')
    ctx.fillText(value, barX + bars.barWidth + bars.xGap, barY + bars.barHeight / 2)

    ctx.restore()
  }

  /**
   * Draws a number control with customizable alignment
   * @param ctx Canvas context
   * @param coords Coordinates for the control
   * @param data Control data including label, value, active state and alignment
   */
  private drawNumberControl(
    ctx: CanvasRenderingContext2D,
    coords: { x: number; y: number },
    data: {
      label: string
      value: number | null
      active: boolean
      alignment?: 'left' | 'center'
      showDot?: boolean
    }
  ) {
    const control = this.scaledStyles.numberControl
    const alignment = data.alignment || 'left'
    ctx.save()

    // Calculate x position based on alignment
    let x = coords.x

    // If center alignment is specified, ignore the provided x coordinate
    // and center the entire component on the canvas
    if (alignment === 'center') {
      x = this.canvasWidth / 2
    }

    // Calculate positions for all elements
    let labelX = x
    let contentX = x

    if (alignment === 'center') {
      // For center alignment, calculate offsets
      const labelWidth = ctx.measureText(data.label).width
      labelX = x - labelWidth / 2

      // For the dot and value, we need to calculate total width
      const valueText =
        data.active && data.value !== null ? data.value.toString().padStart(3, '0') : '---'
      const valueWidth = ctx.measureText(valueText).width
      const totalWidth = control.dotSize + control.xGap + valueWidth
      contentX = x - totalWidth / 2
    }

    // Draw label on top
    ctx.font = `${control.fontSize}px Source Code Pro, Office Code Pro, Menlo, monospace`
    ctx.fillStyle = control.labelColor
    ctx.textAlign = alignment === 'center' ? 'center' : 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(data.label, alignment === 'center' ? x : labelX, coords.y)

    // Calculate position for dot and text
    const dotY =
      coords.y + control.lineHeight + control.yGap + control.lineHeight / 2 - control.dotSize / 2

    // Determine if dot should be shown (default to true if not specified)
    const showDot = data.showDot !== undefined ? data.showDot : true

    // Position for text - depends on whether dot is shown
    let textX = contentX

    // Draw the dot if showDot is true
    if (showDot) {
      // Draw the dot with color based on active state
      ctx.fillStyle = data.active ? control.activeColor : control.disabledColor

      ctx.beginPath()
      ctx.arc(
        contentX + control.dotSize / 2,
        dotY + control.dotSize / 2,
        control.dotSize / 2,
        0,
        Math.PI * 2
      )
      ctx.fill()

      // If dot is shown, text starts after dot + gap
      textX = contentX + control.dotSize + control.xGap
    }

    // Draw value or dashes
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    if (data.active && data.value !== null) {
      // Draw the actual value when active
      ctx.fillStyle = control.valueColor
      const value = data.value.toString().padStart(3, '0')
      ctx.fillText(value, textX, dotY + control.dotSize / 2)
    } else {
      // Draw dashes when inactive
      ctx.fillStyle = control.disabledColor
      ctx.fillText('---', textX, dotY + control.dotSize / 2)
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
    this.hudMesh.geometry.dispose() // Dispose of the old geometry
    this.hudPlane = new THREE.PlaneGeometry(this.width, this.height)

    // Apply object-cover effect by manipulating UV coordinates
    this.applyObjectCoverUVs(this.hudPlane)

    this.hudMesh.geometry = this.hudPlane
  }

  /**
   * Applies object-cover style UV mapping to preserve the original aspect ratio
   * of the texture when the geometry's aspect ratio changes
   */
  private applyObjectCoverUVs(geometry: THREE.PlaneGeometry): void {
    if (!this.hudCanvas) return

    // Calculate aspect ratios
    const textureAspect = this.canvasWidth / this.canvasHeight
    const geometryAspect = this.width / this.height

    // Get UV attribute
    const uvAttribute = geometry.attributes.uv
    const uvs = uvAttribute.array as Float32Array

    // Calculate UV scale and offset for object-cover effect
    let scaleX = 1
    let scaleY = 1
    let offsetX = 0
    let offsetY = 0

    if (geometryAspect > textureAspect) {
      // Geometry is wider than texture - scale Y and center vertically
      scaleY = textureAspect / geometryAspect
      offsetY = (1 - scaleY) / 2
    } else {
      // Geometry is taller than texture - scale X and center horizontally
      scaleX = geometryAspect / textureAspect
      offsetX = (1 - scaleX) / 2
    }

    // Apply the UV transformation to each vertex
    // Standard UV coordinates for a plane are:
    // (0,0), (1,0), (0,1), (1,1)

    // In Three.js, texture coordinates are flipped vertically compared to the standard
    // WebGL convention. We need to flip the Y coordinates (1-y) to correct this.

    // Bottom left
    uvs[0] = offsetX
    uvs[1] = 1 - offsetY // Flip Y

    // Bottom right
    uvs[2] = offsetX + scaleX
    uvs[3] = 1 - offsetY // Flip Y

    // Top left
    uvs[4] = offsetX
    uvs[5] = 1 - (offsetY + scaleY) // Flip Y

    // Top right
    uvs[6] = offsetX + scaleX
    uvs[7] = 1 - (offsetY + scaleY) // Flip Y

    // Mark the attribute as needing an update
    uvAttribute.needsUpdate = true
  }

  private getResolutionKey(resolution: number) {
    const resolutions = Object.keys(this.resolutions).map(Number)
    return resolutions.reduce((prev, curr) =>
      resolution - curr >= 0 && resolution - curr < resolution - prev ? curr : prev
    ) as keyof typeof this.resolutions
  }

  devicePixelRatioChanged(newPixelRatio: number, oldPixelRatio: number): void {
    // Update canvas dimensions
    if (this.hudCanvas && this.hudContext) {
      // Recalculate canvas dimensions directly from reference dimensions and new pixel ratio
      // instead of multiplying by ratio change to avoid exponential growth/shrinking
      this.canvasWidth = this.referenceCanvasWidth * this.qualityMultiplier
      this.canvasHeight = this.referenceCanvasHeight * this.qualityMultiplier

      this.hudCanvas.width = this.canvasWidth
      this.hudCanvas.height = this.canvasHeight

      // Recalculate scaled styles directly from reference styles and new pixel ratio
      this.scaledStyles = JSON.parse(JSON.stringify(this.referenceStyles), (key, value) => {
        return typeof value === 'number' ? value * this.qualityMultiplier : value
      })

      // Update layouts with new pixel ratio
      this.layouts = {
        default: Object.fromEntries(
          Object.entries(this.resolutions).map(([key, resolutions]) => [
            key,
            JSON.parse(JSON.stringify(resolutions), (key, value) => {
              return typeof value === 'number' ? value * this.qualityMultiplier : value
            }),
          ])
        ) as typeof this.resolutions,

        ticket: Object.fromEntries(
          Object.entries(this.resolutionsTicketLayout).map(([key, resolutions]) => [
            key,
            JSON.parse(JSON.stringify(resolutions), (key, value) => {
              return typeof value === 'number' ? value * this.qualityMultiplier : value
            }),
          ])
        ) as typeof this.resolutionsTicketLayout,

        narrow: Object.fromEntries(
          Object.entries(this.resolutionsNarrowLayout).map(([key, resolutions]) => [
            key,
            JSON.parse(JSON.stringify(resolutions), (key, value) => {
              return typeof value === 'number' ? value * this.qualityMultiplier : value
            }),
          ])
        ) as typeof this.resolutionsNarrowLayout,
      }

      // Redraw the HUD with new dimensions
      this._draw()
      if (this.hudTexture) this.hudTexture.needsUpdate = true

      // Update the plane geometry with new dimensions if needed
      if (this.hudPlane && this.hudMesh) {
        this.repositionHudElements()
      }
    }
  }
}

export default HUDScene
