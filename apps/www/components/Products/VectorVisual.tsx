import { detectBrowser, isBrowser } from 'common'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

const VectorVisual = () => {
  const containerRef = useRef(null)
  const ref = useRef(null)
  const [gradientPos, setGradientPos] = useState({ x: 0, y: 0 })
  const isSafari = isBrowser && detectBrowser() === 'Safari'

  const handleGlow = (event: any) => {
    if (!ref.current || !containerRef.current) return null

    const containerRefElement = containerRef.current as HTMLDivElement

    const {
      x: contX,
      y: contY,
      width: containerWidth,
      height: containerHeight,
    } = containerRefElement.getBoundingClientRect()
    const xCont = event.clientX - contX
    const yCont = event.clientY - contY

    const isContainerHovered =
      xCont > -3 && xCont < containerWidth + 3 && yCont > -3 && yCont < containerHeight + 3

    if (!isContainerHovered) return

    const svgElement = ref.current as SVGElement
    const { x: svgX, y: svgY } = svgElement.getBoundingClientRect()
    const x = event.clientX - svgX
    const y = event.clientY - svgY
    setGradientPos({ x, y })
  }

  useEffect(() => {
    if (!isBrowser || isSafari) return

    window.addEventListener('mousemove', handleGlow)
    return () => {
      window.removeEventListener('mousemove', handleGlow)
    }
  }, [])

  const gradientTransform = isSafari
    ? `translate(90 250) rotate(56.4303) scale(132.019)`
    : `translate(${gradientPos?.x} ${gradientPos.y}) rotate(56.4303) scale(132.019)`

  return (
    <figure
      className="absolute inset-0 z-0"
      ref={containerRef}
      role="img"
      aria-label="Supabase Vector uses pgvector to store, index, and access embeddings"
    >
      <span className="absolute w-full lg:w-auto h-full lg:aspect-square flex items-end lg:items-center justify-center lg:justify-end right-0 left-0 lg:left-auto top-24 md:top-24 lg:top-0 lg:bottom-0 my-auto lg:scale-110">
        <Image
          src={`/images/index/products/vector.svg`}
          alt="Supabase Vector graph"
          fill
          sizes="100%"
          quality={100}
          className="absolute inset-0 z-0 object-contain object-center"
        />
        <svg
          ref={ref}
          viewBox="0 0 390 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute w-full h-full z-20 m-auto opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {/* Animated ouline */}
          <path
            d="m195.918 125.344 80.861 46.685v93.37l-80.861 46.685-80.861-46.685v-93.37l80.861-46.685Z"
            stroke="url(#paint0_radial_484_53266)"
            strokeWidth={2}
          />
          <defs>
            <radialGradient
              id="paint0_radial_484_53266"
              cx="0"
              cy="0"
              r={isSafari ? '10' : '2'}
              gradientUnits="userSpaceOnUse"
              gradientTransform={gradientTransform}
            >
              <stop stopColor="hsl(var(--brand-default))" />
              <stop offset="1" stopColor="hsl(var(--brand-default))" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </span>
    </figure>
  )
}

export default VectorVisual
