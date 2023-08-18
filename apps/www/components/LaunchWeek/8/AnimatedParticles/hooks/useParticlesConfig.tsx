import { useEffect, useState } from 'react'
import { range } from 'lodash'

let defaultConfig = {
  particles: 700,
  particlesSize: 1.2,
  goldParticlesSize: 1.5,
  particlesSides: 5,
  particlesBlending: true,
  lightIntensity: 0.4,
  widthRadius: 100,
  widthRatio: 1.2,
  topHeightRadius: 80,
  bottomHeightRadius: 100,
  color: '#ffffff',
  colorGold: '#b89d18',
  xThickness: 7,
  xRandomnessFactor: 2.2,
  xRandomnessShape: 2.2,
  xRandomness: 5,
  yThickness: 20,
  max_speed: 0.1,
  min_speed: -0.1,
  showGold: true,
}

const useParticlesConfig = (): any => {
  const isWindowUndefined = typeof window === 'undefined'
  if (isWindowUndefined) return null
  const hash = window.location.hash
  const isDebugMode = hash.includes('#debug')
  const [particles, setParticles] = useState<any[]>(range(0, defaultConfig.particles))

  const [config, setConfig] = useState(defaultConfig)

  const handleSetConfig = (name: string, value: any) => {
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }))
  }

  const init = async () => {
    if (!isDebugMode) return
    const dat = await import('dat.gui')
    const gui = new dat.GUI()
    const particlesFolder = gui.addFolder('Particles')
    const shapeFolder = gui.addFolder('Shape')
    const speedFolder = gui.addFolder('Speed')

    gui.width = 500
    particlesFolder
      .add(config, 'particles')
      .min(1)
      .max(5000)
      .step(1)
      .name('Count')
      .onChange((value) => {
        handleSetConfig('particles', value)
        setParticles(range(0, value))
      })
    particlesFolder
      .add(config, 'particlesSize')
      .min(1)
      .max(10)
      .step(0.05)
      .name('Size')
      .onChange((value) => handleSetConfig('particlesSize', value))
    particlesFolder
      .add(config, 'goldParticlesSize')
      .min(1)
      .max(10)
      .step(0.05)
      .name('Gold Particles Size')
      .onChange((value) => handleSetConfig('goldParticlesSize', value))
    particlesFolder
      .add(config, 'particlesSides')
      .min(3)
      .max(20)
      .step(1)
      .name('Sides')
      .onChange((value) => handleSetConfig('particlesSides', value))
    particlesFolder
      .add(config, 'lightIntensity')
      .min(0)
      .max(10)
      .step(0.05)
      .name('Light intensity')
      .onChange((value) => handleSetConfig('lightIntensity', value))
    particlesFolder
      .add(config, 'showGold')
      .name('Show Gold Particles')
      .onChange((value) => handleSetConfig('showGold', value))
    particlesFolder
      .add(config, 'particlesBlending')
      .name('Blending')
      .onChange((value) => handleSetConfig('particlesBlending', value))
    shapeFolder
      .add(config, 'widthRadius')
      .min(1)
      .max(200)
      .step(1)
      .name('Width Radius')
      .onChange((value) => handleSetConfig('widthRadius', value))
    shapeFolder
      .add(config, 'widthRatio')
      .min(0.5)
      .max(3)
      .step(0.01)
      .name('Top/Bottom Ratio')
      .onChange((value) => handleSetConfig('widthRatio', value))
    shapeFolder
      .add(config, 'topHeightRadius')
      .min(1)
      .max(200)
      .step(1)
      .name('Height Radius - Top')
      .onChange((value) => handleSetConfig('topHeightRadius', value))
    shapeFolder
      .add(config, 'bottomHeightRadius')
      .min(1)
      .max(200)
      .step(1)
      .name('Height Radius - Bottom')
      .onChange((value) => handleSetConfig('bottomHeightRadius', value))
    shapeFolder
      .add(config, 'xThickness')
      .min(1)
      .max(100)
      .step(0.1)
      .name('Stroke Width')
      .onChange((value) => handleSetConfig('xThickness', value))
    shapeFolder
      .add(config, 'xRandomnessShape')
      .min(0)
      .max(5)
      .step(0.001)
      .name('Randomness shape')
      .onChange((value) => handleSetConfig('xRandomnessShape', value))
    shapeFolder
      .add(config, 'xRandomness')
      .min(0)
      .max(50)
      .step(0.01)
      .name('Randomness')
      .onChange((value) => handleSetConfig('xRandomness', value))
    shapeFolder
      .add(config, 'yThickness')
      .min(1)
      .max(50)
      .step(0.1)
      .name('y thickness')
      .onChange((value) => handleSetConfig('yThickness', value))
    speedFolder
      .add(config, 'min_speed')
      .min(-6)
      .max(6)
      .step(0.01)
      .name('Min speed')
      .onChange((value) => handleSetConfig('min_speed', value))
    speedFolder
      .add(config, 'max_speed')
      .min(-6)
      .max(6)
      .step(0.01)
      .name('Max speed')
      .onChange((value) => handleSetConfig('max_speed', value))

    particlesFolder.open()
    shapeFolder.open()
    speedFolder.open()
  }

  useEffect(() => {
    init()
  }, [])

  return { config, handleSetConfig, particles, setParticles, isDebugMode }
}

export default useParticlesConfig
