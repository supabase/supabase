import {
  DataTexture,
  FloatType,
  MathUtils,
  RedFormat,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import { DigitalGlitch } from 'three/examples/jsm/shaders/DigitalGlitch'

class GlitchPass extends Pass {
  uniforms: typeof DigitalGlitch.uniforms
  heightMap: DataTexture
  material: ShaderMaterial
  fsQuad: FullScreenQuad
  goWild: boolean
  curF: number
  randX: number
  intensity: number

  constructor(dt_size = 64) {
    super()

    const shader = DigitalGlitch

    this.uniforms = UniformsUtils.clone(shader.uniforms)

    this.heightMap = this.generateHeightmap(dt_size)

    this.uniforms['tDisp'].value = this.heightMap

    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    })

    this.fsQuad = new FullScreenQuad(this.material)

    this.goWild = false
    this.curF = 0
    this.randX = 0
    this.generateTrigger()
    this.intensity = 0
  }

  render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) {
    this.uniforms['tDiffuse'].value = readBuffer.texture
    this.uniforms['seed'].value = Math.random() //default seeding
    this.uniforms['byp'].value = 0

    if (this.curF % this.randX < this.randX / 10) {
      this.uniforms['amount'].value = 0 * this.intensity
      this.uniforms['angle'].value = Math.PI
      this.uniforms['distortion_x'].value = MathUtils.randFloat(0, 0.05) * this.intensity
      this.uniforms['distortion_y'].value = MathUtils.randFloat(0, 0.05) * this.intensity
      this.uniforms['seed_x'].value = MathUtils.randFloat(-0.05, 0.05) * this.intensity
      this.uniforms['seed_y'].value = MathUtils.randFloat(-0.05, 0.05) * this.intensity
      this.curF = 0
    }

    this.curF++

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
      this.fsQuad.render(renderer)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
      this.fsQuad.render(renderer)
    }
  }

  generateTrigger() {
    this.randX = MathUtils.randInt(200, 240)
  }

  generateHeightmap(dt_size: number) {
    const data_arr = new Float32Array(dt_size * dt_size)
    const length = dt_size * dt_size

    for (let i = 0; i < length; i++) {
      const val = MathUtils.randFloat(0, 1)
      data_arr[i] = val
    }

    const texture = new DataTexture(data_arr, dt_size, dt_size, RedFormat, FloatType)
    texture.needsUpdate = true
    return texture
  }

  setIntensity(amount: number) {
    this.intensity = amount < 0.01 ? 0 : amount / 4
  }

  enable(value: boolean) {
    this.uniforms['byp'].value = value ? 0 : 1
  }

  dispose() {
    this.material.dispose()

    this.heightMap.dispose()

    this.fsQuad.dispose()
  }
}

export { GlitchPass }
