import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

interface Props {
  animate?: boolean
  children: any
  config: any
  user?: any
}

const Particle = ({ animate = true, children, config }: Props) => {
  const particle = useRef<any>(null)

  const pathOffsetShape =
    Math.pow(
      Math.random() * config.xRandomnessShape,
      config.xRandomness - 1 + 1 - config.xRandomness / 2
    ) * config.xThickness

  const pathOffset = pathOffsetShape * (pathOffsetShape < 1 || Math.random() < 0.5 ? 1 : -1)
  const verticalRandomness = Math.random() * (config.yThickness - 1) + 1 - config.yThickness / 2

  const speed = Math.random() * (config.min_speed - config.max_speed) + config.max_speed

  const circumference = (config.widthRadius * Math.PI * 2) / 100
  const delayOffsetFactor = 100
  const delayOffset = Math.random() * delayOffsetFactor

  useFrame(({ clock }) => {
    if (animate) {
      const timer = clock.getElapsedTime() * speed + delayOffset
      // When the loop count is even, draw bottom 8 shape
      // if odd, draw top 8 shape
      const isEven = Math.floor(timer / circumference) % 2 == 0
      particle.current.position.x = isEven
        ? Math.sin(timer) * config.widthRadius * config.widthRatio + pathOffset
        : Math.sin(timer) * config.widthRadius + pathOffset
      particle.current.position.y = isEven
        ? Math.cos(timer) * config.bottomHeightRadius -
          config.bottomHeightRadius +
          verticalRandomness
        : -Math.cos(timer) * config.topHeightRadius + config.topHeightRadius + verticalRandomness
    }
  })

  return <mesh ref={particle}>{children}</mesh>
}

export default Particle
