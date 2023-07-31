import React, { useMemo, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import Particle from './Particle'
import useParticlesConfig from './hooks/useParticlesConfig'
import { SupabaseClient } from '@supabase/supabase-js'

const ParticlesCanvas = ({ supabase, users }: { supabase?: SupabaseClient; users: any }) => {
  const isWindowUndefined = typeof window === 'undefined'
  if (isWindowUndefined) return null

  const canvasRef = React.useRef(null)

  const [animate, setAnimate] = useState<boolean>(true)
  const { config, handleSetConfig, particles, setParticles, isDebugMode } =
    useParticlesConfig(users)
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    (typeof supabase | any)['channel']
  > | null>(null)

  const loadUsers = async () => {
    return await supabase!.from('lw8_tickets_golden').select('username, golden', { count: 'exact' })
  }

  // Update particles live when new tickets are generated
  useEffect(() => {
    if (!!supabase) {
      const channel = supabase
        .channel('lw8_tickets_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lw8_tickets_golden',
          },
          async () => {
            const { data: users } = await loadUsers()

            handleSetConfig('particles', users?.length)
            setParticles((prev: any) => users! ?? prev)
          }
        )
        .subscribe()
      setRealtimeChannel(channel)
    }

    return () => {
      // Cleanup realtime subscription on unmount
      realtimeChannel?.unsubscribe()
    }
  }, [])

  // stop animation if canvas if is not in viewport
  // to avoid unnecessary computations
  const handleScroll = () => {
    if (canvasRef.current && typeof window !== 'undefined') {
      const rect = (canvasRef.current as HTMLDivElement)?.getBoundingClientRect()
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
        <meshStandardMaterial
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
      <group position={[0, 70, 0]} scale={[0.9, 0.9, 0.9]}>
        {/* Animated 8 shape particles */}
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
