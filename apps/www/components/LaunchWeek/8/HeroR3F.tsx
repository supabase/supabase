import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import { range } from 'lodash'
import { AdditiveBlending } from 'three'

interface Props {
  index?: number
  animate?: boolean
  children: any
  config: any
}

const Particle = ({ index = 0, animate = true, children, config }: Props) => {
  const particle = useRef<any>(null)
  // const pathOffset =
  //   Math.random() * (config.xThicknessRandomness - 1) + 1 - config.xThicknessRandomness / 2
  const pathOffsetRandomness =
    Math.pow(
      Math.random() * config.xThicknessRandomnessFactor,
      config.xThicknessRandomness - 1 + 1 - config.xThicknessRandomness / 2
    ) * config.xThickness
  const pathOffset =
    pathOffsetRandomness * (pathOffsetRandomness < 1 || Math.random() < 0.5 ? 1 : -1)

  const verticalRandomness = Math.random() * (config.yThickness - 1) + 1 - config.yThickness / 2
  // const hasTrail = config.particles < 500 && index + 1 <= config.trails
  const hasTrail = index + 1 <= config.trails
  const speed = hasTrail
    ? config.min_speed
    : Math.random() * (config.max_speed - config.min_speed) + config.min_speed
  const circumference = (config.widthRadius * Math.PI * 2) / 100
  const delayOffsetFactor = 100
  const delayOffset = Math.random() * (delayOffsetFactor - 1) + 1

  useFrame(({ clock }) => {
    if (animate) {
      const timer = clock.getElapsedTime() * speed + delayOffset
      const isEven = Math.floor(timer / circumference) % 2 == 0
      particle.current.position.x = isEven
        ? Math.sin(timer) * config.widthRadius * config.bottomTopWidthRatio + pathOffset
        : Math.sin(timer) * config.widthRadius + pathOffset
      particle.current.position.y = isEven
        ? Math.cos(timer) * config.bottomHeightRadius -
          config.bottomHeightRadius +
          verticalRandomness
        : -Math.cos(timer) * config.topHeightRadius + config.topHeightRadius + verticalRandomness
    }
  })

  return (
    <>
      {hasTrail && (
        <Trail
          width={config.trailWidth} // Width of the line
          color={'white'} // Color of the line
          length={config.trailLength} // Length of the line
          decay={config.trailDecay} // How fast the line fades away
          local={true} // Wether to use the target's world or local positions
          stride={0} // Min distance between previous and current point
          interval={1} // Number of frames to wait before next calculation
          target={particle} // Optional target. This object will produce the trail.
          attenuation={(width) => (width / 2) * width} // A function to define the width in each point along it.
        />
      )}
      <mesh ref={particle}>{children}</mesh>
    </>
  )
}

let defaultConfig = {
  particles: 1500,
  particlesSize: 1.8,
  particlesSides: 5,
  particlesBlending: true,
  lightIntensity: 0.5,
  widthRadius: 100,
  bottomTopWidthRatio: 1.2,
  topHeightRadius: 80,
  bottomHeightRadius: 100,
  trails: 1,
  trailWidth: 40,
  trailLength: 100,
  trailDecay: 450,
  color: 'white',
  xThickness: 5,
  xThicknessRandomnessFactor: 3.5,
  xThicknessRandomness: 2.5,
  yThickness: 20,
  min_speed: 1.3,
  max_speed: -0.3,
}

export default function () {
  const [particles, setParticles] = useState(range(0, 1))
  const [config, setConfig] = useState(defaultConfig)
  const isWindowUndefined = typeof window === 'undefined'
  if (isWindowUndefined) return null

  const handleSetConfig = (name: string, value: any) => {
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }))
  }
  const init = async () => {
    const dat = await import('dat.gui')
    const gui = new dat.GUI()
    gui.width = 500
    gui
      .add(config, 'particles')
      .min(1)
      .max(5000)
      .step(1)
      .name('Particles')
      .onChange((value) => {
        handleSetConfig('particles', value)
        setParticles(range(0, value))
      })
    gui
      .add(config, 'particlesSize')
      .min(1)
      .max(10)
      .step(0.05)
      .name('Particles size')
      .onChange((value) => handleSetConfig('particlesSize', value))
    gui
      .add(config, 'particlesSides')
      .min(3)
      .max(20)
      .step(1)
      .name('Particles sides')
      .onChange((value) => handleSetConfig('particlesSides', value))
    gui
      .add(config, 'particlesBlending')
      .name('Particles blending')
      .onChange((value) => handleSetConfig('particlesBlending', value))
    gui
      .add(config, 'lightIntensity')
      .min(0)
      .max(10)
      .step(0.05)
      .name('Light intensity')
      .onChange((value) => handleSetConfig('lightIntensity', value))
    gui
      .add(config, 'widthRadius')
      .min(1)
      .max(200)
      .step(1)
      .name('Width Radius')
      .onChange((value) => handleSetConfig('widthRadius', value))
    gui
      .add(config, 'bottomTopWidthRatio')
      .min(0.5)
      .max(3)
      .step(0.01)
      .name('Bottom/Top Width Ratio')
      .onChange((value) => handleSetConfig('bottomTopWidthRatio', value))
    gui
      .add(config, 'topHeightRadius')
      .min(1)
      .max(200)
      .step(1)
      .onChange((value) => handleSetConfig('topHeightRadius', value))
    gui
      .add(config, 'bottomHeightRadius')
      .min(1)
      .max(200)
      .step(1)
      .onChange((value) => handleSetConfig('bottomHeightRadius', value))
    gui
      .add(config, 'xThickness')
      .min(1)
      .max(100)
      .step(0.1)
      .name('x thickness')
      .onChange((value) => handleSetConfig('xThickness', value))
    gui
      .add(config, 'xThicknessRandomnessFactor')
      .min(0)
      .max(5)
      .step(0.001)
      .name('xThick randomn factor')
      .onChange((value) => handleSetConfig('xThicknessRandomnessFactor', value))
    gui
      .add(config, 'xThicknessRandomness')
      .min(0)
      .max(50)
      .step(0.01)
      .name('xThick randomness')
      .onChange((value) => handleSetConfig('xThicknessRandomness', value))
    gui
      .add(config, 'yThickness')
      .min(1)
      .max(50)
      .step(0.1)
      .name('y thickness')
      .onChange((value) => handleSetConfig('yThickness', value))
    gui
      .add(config, 'min_speed')
      .min(-6)
      .max(6)
      .step(0.1)
      .name('Min speed')
      .onChange((value) => handleSetConfig('min_speed', value))
    gui
      .add(config, 'max_speed')
      .min(-6)
      .max(6)
      .step(0.1)
      .name('Max speed')
      .onChange((value) => handleSetConfig('max_speed', value))
    gui
      .add(config, 'trails')
      .min(0)
      .max(10)
      .step(1)
      .name('Trails count')
      .onChange((value) => handleSetConfig('trails', value))
    gui
      .add(config, 'trailWidth')
      .min(0)
      .max(100)
      .step(0.1)
      .name('Trails thickness')
      .onChange((value) => handleSetConfig('trailWidth', value))
    gui
      .add(config, 'trailLength')
      .min(1)
      .max(100)
      .step(0.1)
      .name('Trails length')
      .onChange((value) => handleSetConfig('trailLength', value))
    gui
      .add(config, 'trailDecay')
      .min(1)
      .max(1000)
      .step(0.1)
      .name('Trails decay')
      .onChange((value) => handleSetConfig('trailLength', value))
  }

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    setParticles(range(0, config.particles))
  }, [config.particles])

  const Geometry = useMemo(
    () => () => <circleGeometry args={[config.particlesSize, config.particlesSides]} />,
    []
  )
  const Material = () =>
    useMemo(
      () => (
        <meshStandardMaterial
          color={config.color}
          blending={config.particlesBlending ? AdditiveBlending : undefined}
        />
        // <pointsMaterial
        //   size={1}
        //   sizeAttenuation={true}
        //   depthWrite={false}
        //   color={config.color}
        //   blending={config.particlesBlending ? AdditiveBlending : undefined}
        // />
      ),
      []
    )

  return (
    <Canvas
      linear
      dpr={[1, 2]}
      camera={{ fov: 75, position: [0, 0, 400] }}
      // onCreated={}
    >
      <ambientLight intensity={config.lightIntensity} />
      {particles?.map((_, index) => (
        <Particle key={`particle-${index}`} index={index} config={config}>
          <Geometry />
          <Material />
        </Particle>
      ))}
    </Canvas>
  )
}
