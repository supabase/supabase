import React, { useMemo, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import Particle from './Particle'
import useParticlesConfig from './hooks/useParticlesConfig'

const ParticlesCanvas = () => {
  const isWindowUndefined = typeof window === 'undefined'
  if (isWindowUndefined) return null

  const canvasRef = React.useRef(null)

  const [animate, setAnimate] = useState<boolean>(true)
  const { config, particles } = useParticlesConfig()

  // stop animation if canvas if is not in viewport
  // to stop unnecessary computations
  const handleScroll = () => {
    if (canvasRef.current && typeof window !== 'undefined') {
      const rect = (canvasRef.current as HTMLCanvasElement)?.getBoundingClientRect()
      const isInView = rect.bottom > 0

      setAnimate(isInView)
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  /* ThreeJs setup */

  const Geometry = useMemo(
    () => () => <circleGeometry args={[config.particlesSize, config.particlesSides]} />,
    []
  )
  const GoldGeometry = useMemo(
    () => () => <circleGeometry args={[config.goldParticlesSize, config.particlesSides]} />,
    []
  )
  const Material = () =>
    useMemo(
      () => (
        <meshPhysicalMaterial
          color={config.color}
          blending={config.particlesBlending ? AdditiveBlending : undefined}
        />
      ),
      []
    )
  const GoldMaterial = () =>
    useMemo(
      () => (
        <meshPhysicalMaterial
          color={config.colorGold}
          metalness={35}
          blending={config.particlesBlending ? AdditiveBlending : undefined}
        />
      ),
      []
    )

  return (
    <Canvas
      ref={canvasRef}
      dpr={[1, 2]}
      camera={{ fov: 75, position: [0, 0, 500] }}
      className="relative z-30"
    >
      <ambientLight intensity={config.lightIntensity} />
      <group position={[0, 0, 0]} scale={[1, 1, 1]}>
        {particles?.map((user: any, index: number) => (
          <Particle
            key={`particle-${user.username ?? index}`}
            user={user}
            config={config}
            animate={animate}
          >
            {config.showGold && Math.random() <= 0.5 ? (
              <>
                <GoldGeometry />
                <GoldMaterial />
              </>
            ) : (
              <>
                <Geometry />
                <Material />
              </>
            )}
          </Particle>
        ))}
      </group>
    </Canvas>
  )
}

export default ParticlesCanvas
