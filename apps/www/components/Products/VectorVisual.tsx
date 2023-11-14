import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

const VectorVisual = () => {
  const containerRef = useRef(null)
  const ref = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [gradientPos, setGradientPos] = useState({ x: 0, y: 0 })

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
    setIsActive(isContainerHovered)

    if (!isContainerHovered) return

    const svgElement = ref.current as SVGElement
    const { x: svgX, y: svgY } = svgElement.getBoundingClientRect()
    const x = event.clientX - svgX
    const y = event.clientY - svgY
    setGradientPos({ x, y })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('mousemove', handleGlow)
    return () => {
      window.removeEventListener('mousemove', handleGlow)
    }
  }, [])

  return (
    <figure
      className="absolute inset-0 z-0"
      ref={containerRef}
      role="img"
      aria-label="Supabase Vector uses pgvector to store, index, and access embeddings"
    >
      <span className="absolute w-full lg:w-auto h-full lg:aspect-square flex items-end lg:items-center justify-center lg:justify-end right-0 left-0 lg:left-auto top-24 md:top-24 lg:top-0 lg:bottom-0 my-auto lg:scale-110">
        <svg
          ref={ref}
          viewBox="0 0 390 430"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute w-full h-full z-20 m-auto"
        >
          <path
            d="M195.918 125.344L276.779 172.029V265.399L195.918 312.084L115.057 265.399V172.029L195.918 125.344Z"
            stroke="url(#paint0_radial_484_53266)"
          />
          <defs>
            {isActive && (
              <radialGradient
                id="paint0_radial_484_53266"
                cx="0"
                cy="0"
                r="2"
                gradientUnits="userSpaceOnUse"
                gradientTransform={`translate(${gradientPos?.x} ${gradientPos.y}) rotate(56.4303) scale(132.019)`}
              >
                <stop stopColor="#3FCF8E" />
                <stop offset="1" stopColor="#3FCF8E" stopOpacity="0" />
              </radialGradient>
            )}
          </defs>
        </svg>

        <Image
          src={`/images/index/products/vector2.svg`}
          alt="Supabase Vector graph"
          layout="fill"
          objectFit="contain"
          objectPosition="center"
          className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          quality={100}
        />
        <Image
          src={`/images/index/products/vector1.svg`}
          alt="Supabase Vector graph"
          layout="fill"
          objectFit="contain"
          objectPosition="center"
          className="absolute inset-0"
          quality={100}
        />
      </span>
    </figure>
  )
}

export default VectorVisual
