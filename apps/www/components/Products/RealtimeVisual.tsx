import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import classNames from 'classnames'

function getRandomAxis(prevIteration: number) {
  const possibleXValues = [0, 1, 4]
  const possibleYValues = [0, 1]
  return {
    x: possibleXValues[Math.floor(Math.random() * possibleXValues.length)],
    y: possibleYValues[Math.floor(Math.random() * possibleYValues.length)],
    iteration: prevIteration + 1,
  }
}
const defaultInteractionString = `group-hover:translate-x-0 group-hover:translate-y-0`

const RealtimeVisual = () => {
  const [axis, setAxis] = useState({ x: 8, y: 2, iteration: 0 })
  const dynamicTransformString = `group-hover:translate-x-${axis.x} group-hover:translate-y-${axis.y}`

  useEffect(() => {
    const interval = setInterval(() => {
      setAxis((prev) => getRandomAxis(prev.iteration))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <figure
      className="absolute inset-0 z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(320px 320px at 30% 100%, #85E0B740, transparent)',
      }}
      role="img"
      aria-label="Supabase Realtime multiplayer app demo"
    >
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        alt="user cursor"
        className={classNames(
          `absolute w-6 h-6 z-10 left-14 bottom-[100px] transition translate-x-7 translate-y-2 ${
            axis.iteration > 1 ? dynamicTransformString : defaultInteractionString
          } !duration-300 will-change-transform `
        )}
      />
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        alt="user cursor"
        className="absolute w-6 h-6 z-10 right-[40%] bottom-3 transition translate-x-80 group-hover:translate-x-0 !duration-700 will-change-transform"
      />
      <Image
        src="/images/index/products/realtime-bg.svg"
        alt="Supabase Realtime app demo UI"
        layout="fill"
        objectPosition="50% 50%"
        objectFit="cover"
      />
    </figure>
  )
}

export default RealtimeVisual
