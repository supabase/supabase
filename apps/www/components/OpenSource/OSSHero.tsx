import React from 'react'
import { motion } from 'framer-motion'
import { useWindowSize } from 'react-use'
import { useBreakpoint } from 'common'
import { useTheme } from 'next-themes'
import { cn } from 'ui'

import styles from './hero.module.css'

const OSSHero = () => (
  <>
    <div className="absolute z-[-4] flex flex-col top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none">
      <div className="absolute bottom-0 z-[1] w-full h-4/5 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute top-0 z-[1] w-full h-2/5 bg-gradient-to-b from-background to-transparent" />
    </div>
    <div
      className={cn(
        'absolute inset-0 w-full h-[300px] lg:h-[500px] overflow-hidden pointer-events-none',
        styles['hero-container']
      )}
    >
      <div
        className="absolute select-none pointer-events-none inset-0 z-[3] blur-[100px] w-full h-full opacity-60"
        style={{ transform: 'translateZ(0px)' }}
      />
      <div className="absolute bottom-0 z-[-2] w-full h-full bg-gradient-to-t from-background to-transparent" />
      <HeroGrid />
    </div>
  </>
)

const HeroGrid = () => {
  const { resolvedTheme } = useTheme()
  const { width } = useWindowSize()
  const isSm = useBreakpoint(640)

  const svgGridOptions = {
    color: resolvedTheme?.includes('dark') ? '#00d4ad' : '#015a42',
    boxWidth: width ? width * 7 : 7500,
    boxHeight: width ? width * 5 : 6000,
    xLines: isSm ? 20 : 49,
    yLines: isSm ? 65 : 130,
    strokeWidth: 1,
  }

  const GridSVG = () => (
    <svg
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgGridOptions.boxWidth} ${svgGridOptions.boxHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {[...new Array(svgGridOptions.yLines)].map((_: any, i: number) => {
        const y = (svgGridOptions.boxWidth * i) / svgGridOptions.yLines
        return (
          <line
            key={`y-${i}`}
            x1={svgGridOptions.boxHeight}
            y1={y}
            x2="0"
            y2={y}
            stroke={svgGridOptions.color}
            strokeWidth={svgGridOptions.strokeWidth}
            shapeRendering="geometricPrecision"
          />
        )
      })}
      {[...new Array(svgGridOptions.xLines)].map((_: any, i: number) => {
        const x = (svgGridOptions.boxHeight * i) / svgGridOptions.xLines
        return (
          <>
            <line
              key={`x-${i}`}
              x1={x}
              y1={svgGridOptions.boxWidth}
              x2={x}
              y2="0"
              stroke={svgGridOptions.color}
              strokeWidth={svgGridOptions.strokeWidth}
              shapeRendering="geometricPrecision"
            />
            {isSm
              ? i === 9 && (
                  <line
                    x1={x}
                    y1={svgGridOptions.boxWidth}
                    x2={x}
                    y2="0"
                    stroke="url(#electric-pulse)"
                    strokeLinecap="round"
                    strokeWidth={4}
                    shapeRendering="geometricPrecision"
                  />
                )
              : i === 25 && (
                  <line
                    x1={x}
                    y1={svgGridOptions.boxWidth}
                    x2={x}
                    y2="0"
                    stroke="url(#electric-pulse)"
                    strokeLinecap="round"
                    strokeWidth={4}
                    shapeRendering="geometricPrecision"
                  />
                )}
            {isSm
              ? i === 14 && (
                  <line
                    x1={x}
                    y1={svgGridOptions.boxWidth}
                    x2={x}
                    y2="0"
                    stroke="url(#electric-pulse-2)"
                    strokeLinecap="round"
                    strokeWidth={4}
                    shapeRendering="geometricPrecision"
                  />
                )
              : i === 33 && (
                  <line
                    x1={x}
                    y1={svgGridOptions.boxWidth}
                    x2={x}
                    y2="0"
                    stroke="url(#electric-pulse-2)"
                    strokeLinecap="round"
                    strokeWidth={4}
                    shapeRendering="geometricPrecision"
                  />
                )}
          </>
        )
      })}
      <defs>
        <motion.linearGradient
          animate={{
            x2: [svgGridOptions.boxWidth / 2, 0, svgGridOptions.boxWidth / 2],
            x1: [svgGridOptions.boxWidth / 2, 0, svgGridOptions.boxWidth / 2],
            y1: [svgGridOptions.boxHeight, svgGridOptions.boxHeight / 3, 0],
            y2: [svgGridOptions.boxHeight, svgGridOptions.boxHeight / 2, 0],
          }}
          transition={{
            duration: isSm ? 4 : 5,
            repeat: Infinity,
            ease: 'linear',
          }}
          id="electric-pulse"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={svgGridOptions.color} stopOpacity="0" />
          <stop stopColor={svgGridOptions.color} stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--colors-brand9)" stopOpacity="0" />
        </motion.linearGradient>
        <motion.linearGradient
          animate={{
            x2: [svgGridOptions.boxWidth / 2, 0, svgGridOptions.boxWidth / 2],
            x1: [svgGridOptions.boxWidth / 2, 0, svgGridOptions.boxWidth / 2],
            y1: [svgGridOptions.boxHeight, svgGridOptions.boxHeight / 3, 0],
            y2: [svgGridOptions.boxHeight, svgGridOptions.boxHeight / 2, 0],
          }}
          transition={{
            duration: isSm ? 4 : 5,
            repeat: Infinity,
            ease: 'linear',
            delay: 2,
          }}
          id="electric-pulse-2"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={svgGridOptions.color} stopOpacity="0" />
          <stop stopColor={svgGridOptions.color} stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--colors-brand9)" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  )

  return (
    <div className="relative -z-10 ![perspective:1200px] sm:![perspective:1200px] md:![perspective:1200px] lg:![perspective:1200px]">
      <div
        style={{
          transform: 'rotateX(85deg)',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <div className={[styles['hero-grid-lines']].join(' ')}>
          <GridSVG />
        </div>
      </div>
    </div>
  )
}

export default OSSHero
