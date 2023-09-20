import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'

const CURSOR1_INTERVAL_MS = 900
const CURSOR2_INTERVAL_MS = 1350

function getRandomAxis() {
  const possibleXValues = [-1, 1, 2, 3]
  const possibleYValues = [-2, -1, 0.5, 1]
  return {
    x: possibleXValues[Math.floor(Math.random() * possibleXValues.length)],
    y: possibleYValues[Math.floor(Math.random() * possibleYValues.length)],
  }
}

const RealtimeVisual = () => {
  const containerRef = useRef(null)
  const [isContainerHovered, setIsContainerHovered] = useState(false)
  const [axis1, setAxis1] = useState({ x: 2, y: 1 })
  const [axis2, setAxis2] = useState({ x: 1, y: 0 })

  const handleCursors = (event: MouseEvent) => {
    if (!containerRef.current) return null

    const containerRefElement = containerRef.current as HTMLDivElement

    const {
      x: contX,
      y: contY,
      width: containerWidth,
      height: containerHeight,
    } = containerRefElement.getBoundingClientRect()
    const xCont = event.clientX - contX
    const yCont = event.clientY - contY

    const isHovered =
      xCont > -3 && xCont < containerWidth + 3 && yCont > -3 && yCont < containerHeight + 3
    setIsContainerHovered(isHovered)

    if (!isHovered) return
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('mousemove', handleCursors)
    return () => {
      window.removeEventListener('mousemove', handleCursors)
    }
  }, [])

  useEffect(() => {
    let intervalId1: NodeJS.Timer
    let intervalId2: NodeJS.Timer
    // Only update cursor positions (via setInterval) if container is hovered
    if (isContainerHovered) {
      intervalId1 = setInterval(() => {
        setAxis1(getRandomAxis())
      }, CURSOR1_INTERVAL_MS)
      intervalId2 = setInterval(() => {
        setAxis2(getRandomAxis())
      }, CURSOR2_INTERVAL_MS)
    }
    return () => {
      // Clear the intervals when the component unmounts or is updated
      clearInterval(intervalId1)
      clearInterval(intervalId2)
    }
  }, [isContainerHovered])

  return (
    <figure
      className="absolute inset-0 z-0 overflow-hidden"
      ref={containerRef}
      style={{
        background: 'radial-gradient(320px 320px at 30% 100%, #85E0B740, transparent)',
      }}
      role="img"
      aria-label="Supabase Realtime multiplayer app demo"
    >
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        alt="user cursor"
        style={isContainerHovered ? { transform: `translate(${axis1.x}rem, ${axis1.y}rem)` } : {}}
        className={classNames(
          `absolute w-6 h-6 z-10 left-14 bottom-[100px] transition translate-x-7 translate-y-2 !duration-300 will-change-transform `
        )}
      />
      <img
        src="/images/index/products/realtime-user-cursor.svg"
        alt="user cursor"
        style={isContainerHovered ? { transform: `translate(${axis2.x}rem, ${axis2.y}rem)` } : {}}
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
