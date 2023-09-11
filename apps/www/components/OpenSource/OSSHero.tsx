import React from 'react'
import { useBreakpoint, useTheme } from 'common'
import { motion } from 'framer-motion'

import styles from './hero.module.css'
import { useWindowSize } from 'react-use'

const OSSHero = () => (
  <>
    <div
      className={[
        'absolute z-[-4] flex flex-col top-0 left-0 w-screen h-[300px] lg:h-[500px] overflow-hidden pointer-events-none',
      ].join(' ')}
    >
      <div className="absolute bottom-0 z-[1] w-full h-1/3 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute top-0 z-[1] w-full h-3/5 bg-gradient-to-b from-background to-transparent" />
    </div>
    <div
      className={[
        'absolute inset-0 w-full h-[300px] lg:h-[500px] overflow-hidden pointer-events-none',
        styles['hero-container'],
      ].join(' ')}
    >
      <div className={['w-full h-full opacity-20 dark:opacity-60', styles['gradient']].join(' ')} />
      <div className="absolute bottom-0 z-[-2] w-full h-full bg-gradient-to-t from-background to-transparent" />
      <HeroGrid />
    </div>
  </>
)

const HeroGrid = () => {
  const { isDarkMode } = useTheme()
  const { width } = useWindowSize()
  const isSm = useBreakpoint(640)

  const svgGridOptions = {
    color: isDarkMode ? '#00d4ad' : '#015a42',
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
            shapeRendering="crispEdges"
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
              shapeRendering="crispEdges"
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
                    shapeRendering="crispEdges"
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
                    shapeRendering="crispEdges"
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
                    shapeRendering="crispEdges"
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
                    shapeRendering="crispEdges"
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
    <div
      className={[
        'relative -z-10 ![perspective:1200px] sm:![perspective:1200px] md:![perspective:1200px] lg:![perspective:1200px]',
      ].join(' ')}
    >
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
