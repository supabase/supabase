import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

interface Props {
  animate?: boolean
  children: any
  config: any
  user: any
}

const Particle = ({ animate = true, user, children, config }: Props) => {
  const particle = useRef<any>(null)
  const isDebugMode = !user?.username
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) {
      setTimeout(() => {
        setIsHovered(false)
      }, 1000)
    }
  }, [isHovered])

  const timestamp = new Date(user.createdAt).getTime()
  const unixTimestamp = Math.floor(timestamp / 1000)
  const lastDigit = parseInt(timestamp.toString().split('')?.pop() as string)

  const pathOffsetShape = isDebugMode
    ? Math.pow(
        Math.random() * config.xRandomnessShape,
        config.xRandomness - 1 + 1 - config.xRandomness / 2
      ) * config.xThickness
    : Math.pow(
        Math.random() * config.xRandomnessShape,
        config.xRandomness - 1 + 1 - config.xRandomness / 2
      ) * config.xThickness

  const pathOffset = pathOffsetShape * (pathOffsetShape < 1 || Math.random() < 0.5 ? 1 : -1)
  const verticalRandomness = isDebugMode
    ? Math.random() * (config.yThickness - 1) + 1 - config.yThickness / 2
    : Math.random() * (config.yThickness - 1) + 1 - config.yThickness / 2

  const smol = (unixTimestamp / 10000000000) * -1
  const sub1 = 1 / smol

  console.log(smol, sub1)
  const speed = isDebugMode
    ? Math.random() * (config.min_speed - config.max_speed) + config.max_speed
    : sub1 * (config.min_speed - config.max_speed) + config.max_speed
  // Math.random() * (config.min_speed - config.max_speed) + config.max_speed

  const circumference = (config.widthRadius * Math.PI * 2) / 100
  const delayOffsetFactor = 100
  const delayOffset = isDebugMode ? Math.random() : unixTimestamp * delayOffsetFactor

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

  return (
    <mesh ref={particle} onPointerEnter={() => !isDebugMode && setIsHovered(true)}>
      {children}

      {!isDebugMode && isHovered && user.username && (
        <Html
          as="div"
          position={[1, 0, 0]}
          wrapperClass={[
            `invisible hidden text-[11px] text-[#aaaec2] bg-black items-center justify-center rounded-full py-1 px-2 [&>div]:!relative`,
            isHovered && '!visible !flex',
          ].join(' ')}
        >
          @{user.username}
        </Html>
      )}
    </mesh>
  )
}

export default Particle
