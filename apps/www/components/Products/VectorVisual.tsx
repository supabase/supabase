import { detectBrowser, isBrowser } from 'common'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

interface Props {
  className?: string
}

const VectorVisual: React.FC<Props> = ({ className }) => {
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
      className={cn(
        'absolute inset-0',
        'z-0 flex items-end',
        'top-auto',
        'aspect-[390/430]',
        'w-full md:w-[calc(100%+4rem)] 2xl:w-full',
        'md:-mx-8 2xl:mx-0',
        '-bottom-0 sm:-bottom-28 md:bottom-0 lg:-bottom-28 xl:bottom-0',
        className
      )}
      ref={containerRef}
      role="img"
      aria-label="Supabase Vector uses pgvector to store, index, and access embeddings"
    >
      <span className="absolute w-full h-full lg:!aspect-[390/430] flex items-end justify-center inset-0 top-16 md:top-20 lg:top-0 bottom-auto mx-auto">
        <Image
          src={`/images/index/products/vector-dark.svg`}
          alt="Supabase Vector graph"
          fill
          sizes="100%"
          quality={100}
          className="hidden dark:block absolute inset-0 z-0 object-contain object-center"
        />
        <Image
          src={`/images/index/products/vector-light.svg`}
          alt="Supabase Vector graph"
          fill
          sizes="100%"
          quality={100}
          className="dark:hidden absolute inset-0 z-0 object-contain object-center"
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
