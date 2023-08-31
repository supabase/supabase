import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const DatabaseVisual = () => {
  const containerRef = useRef(null)
  const ref = useRef(null)
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

  const gradientTransform = `translate(${gradientPos?.x} ${gradientPos?.y}) rotate(45) scale(166 180)`

  return (
    <figure
      className="absolute inset-0 z-0"
      ref={containerRef}
      role="img"
      aria-label="Supabase Postgres database visual composition"
    >
      <span className="absolute w-full lg:w-auto h-full lg:aspect-square flex items-end lg:items-center justify-center lg:justify-end right-0 left-0 lg:left-auto top-24 md:top-24 lg:top-0 lg:bottom-0 my-auto">
        <svg
          ref={ref}
          viewBox="0 0 390 430"
          fill="none"
          className="absolute w-full h-full z-10 m-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter5_bd_467_4905)">
            <path
              d="M192.144 125.816H138.679C130.173 125.816 122.52 130.986 119.345 138.877L99.0045 189.43C95.9432 197.038 97.6597 205.736 103.382 211.611L113.614 222.117C118.406 227.036 121.088 233.633 121.088 240.501L121.087 254.974C121.087 275.171 137.46 291.543 157.656 291.543C163.816 291.543 168.81 286.55 168.81 280.39L168.811 194.149C168.811 175.52 176.252 157.663 189.479 144.547C192.225 141.824 196.657 141.843 199.379 144.588C202.101 147.333 202.082 151.766 199.337 154.488C188.76 164.976 182.811 179.254 182.811 194.149L182.81 280.39C182.81 294.282 171.548 305.543 157.656 305.543C129.728 305.543 107.087 282.903 107.087 254.974L107.088 240.5C107.088 237.282 105.831 234.191 103.585 231.885L93.353 221.38C83.7626 211.533 80.8857 196.956 86.0164 184.204L106.357 133.651C111.665 120.459 124.458 111.816 138.679 111.816H194.408V111.9H204.747C253.851 111.9 293.657 151.706 293.657 200.81V251.652C293.657 255.518 290.523 258.652 286.657 258.652C282.791 258.652 279.657 255.518 279.657 251.652V200.81C279.657 159.438 246.119 125.9 204.747 125.9H193.23C192.86 125.9 192.498 125.871 192.144 125.816Z"
              stroke="#A0A0A0"
              strokeWidth="0.55"
              shapeRendering="crispEdges"
            />
            <path
              d="M210.03 283.94C210.03 280.074 206.896 276.94 203.03 276.94C199.164 276.94 196.03 280.074 196.03 283.94V287.053C196.03 314.012 217.884 335.867 244.843 335.867C271.194 335.867 292.668 314.988 293.624 288.871H318.238C322.104 288.871 325.238 285.737 325.238 281.871C325.238 278.005 322.104 274.871 318.238 274.871H291.397C260.653 274.871 231.141 262.788 209.224 241.228C206.468 238.517 202.036 238.553 199.325 241.309C196.614 244.065 196.65 248.497 199.406 251.209C221.131 272.58 249.522 285.632 279.634 288.343C278.955 306.972 263.639 321.867 244.843 321.867C225.616 321.867 210.03 306.28 210.03 287.053V283.94Z"
              stroke="#A0A0A0"
              strokeWidth="0.55"
              shapeRendering="crispEdges"
            />
            <path
              d="M238.03 202.145C238.03 206.937 241.915 210.822 246.707 210.822C251.499 210.822 255.383 206.937 255.383 202.145C255.383 197.353 251.499 193.469 246.707 193.469C241.915 193.469 238.03 197.353 238.03 202.145Z"
              stroke="#A0A0A0"
              strokeWidth="0.55"
              shapeRendering="crispEdges"
            />
          </g>
          <g className="opacity-0 transition-opacity group-hover:opacity-100">
            <path
              d="M192.144 125.816H138.679C130.173 125.816 122.52 130.986 119.345 138.877L99.0045 189.43C95.9432 197.038 97.6597 205.736 103.382 211.611L113.614 222.117C118.406 227.036 121.088 233.633 121.088 240.501L121.087 254.974C121.087 275.171 137.46 291.543 157.656 291.543C163.816 291.543 168.81 286.55 168.81 280.39L168.811 194.149C168.811 175.52 176.252 157.663 189.479 144.547C192.225 141.824 196.657 141.843 199.379 144.588C202.101 147.333 202.082 151.766 199.337 154.488C188.76 164.976 182.811 179.254 182.811 194.149L182.81 280.39C182.81 294.282 171.548 305.543 157.656 305.543C129.728 305.543 107.087 282.903 107.087 254.974L107.088 240.5C107.088 237.282 105.831 234.191 103.585 231.885L93.353 221.38C83.7626 211.533 80.8857 196.956 86.0164 184.204L106.357 133.651C111.665 120.459 124.458 111.816 138.679 111.816H194.408V111.9H204.747C253.851 111.9 293.657 151.706 293.657 200.81V251.652C293.657 255.518 290.523 258.652 286.657 258.652C282.791 258.652 279.657 255.518 279.657 251.652V200.81C279.657 159.438 246.119 125.9 204.747 125.9H193.23C192.86 125.9 192.498 125.871 192.144 125.816Z"
              stroke="url(#paint4_radial_467_4905)"
              shapeRendering="crispEdges"
            />
            <path
              d="M210.03 283.94C210.03 280.074 206.896 276.94 203.03 276.94C199.164 276.94 196.03 280.074 196.03 283.94V287.053C196.03 314.012 217.884 335.867 244.843 335.867C271.194 335.867 292.668 314.988 293.624 288.871H318.238C322.104 288.871 325.238 285.737 325.238 281.871C325.238 278.005 322.104 274.871 318.238 274.871H291.397C260.653 274.871 231.141 262.788 209.224 241.228C206.468 238.517 202.036 238.553 199.325 241.309C196.614 244.065 196.65 248.497 199.406 251.209C221.131 272.58 249.522 285.632 279.634 288.343C278.955 306.972 263.639 321.867 244.843 321.867C225.616 321.867 210.03 306.28 210.03 287.053V283.94Z"
              stroke="url(#paint5_radial_467_4905)"
              shapeRendering="crispEdges"
            />
            <path
              d="M238.03 202.145C238.03 206.937 241.915 210.822 246.707 210.822C251.499 210.822 255.383 206.937 255.383 202.145C255.383 197.353 251.499 193.469 246.707 193.469C241.915 193.469 238.03 197.353 238.03 202.145Z"
              stroke="url(#paint6_radial_467_4905)"
              shapeRendering="crispEdges"
            />
          </g>
          <defs>
            <radialGradient
              id="paint4_radial_467_4905"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform={gradientTransform}
            >
              <stop stopColor="var(--colors-brand9)" />
              <stop offset="1" stopColor="#7C7C7C" />
            </radialGradient>
            <radialGradient
              id="paint5_radial_467_4905"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform={gradientTransform}
            >
              <stop stopColor="var(--colors-brand9)" />
              <stop offset="1" stopColor="#7C7C7C" />
            </radialGradient>
            <radialGradient
              id="paint6_radial_467_4905"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform={gradientTransform}
            >
              <stop stopColor="var(--colors-brand9)" />
              <stop offset="1" stopColor="#7C7C7C" />
            </radialGradient>
          </defs>
        </svg>

        <Image
          src={`/images/index/products/database.svg`}
          alt="Supabase Postgres database"
          layout="fill"
          objectFit="contain"
          objectPosition="center"
          className="absolute inset-0 z-0 w-full lg:w-auto h-full transition-opacity group-hover:opacity-80"
          quality={100}
        />
      </span>
    </figure>
  )
}

export default DatabaseVisual
