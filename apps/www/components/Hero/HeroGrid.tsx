import React from 'react'
import { useBreakpoint, useTheme } from 'common'
import { motion } from 'framer-motion'

import styles from './hero.module.css'
import { useWindowSize } from 'react-use'

const HeroGrid = () => {
  const { isDarkMode } = useTheme()
  const { width } = useWindowSize()
  const isSm = useBreakpoint(640)

  const svgGridOptions = {
    color: isDarkMode ? '#00c6d4' : '#005359',
    boxWidth: width ? width * 7 : 7500,
    boxHeight: width ? width * 5 : 6000,
    xLines: isSm ? 20 : 50,
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
            duration: isSm ? 3 : 5,
            repeat: Infinity,
            ease: 'linear',
          }}
          id="electric-pulse"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={svgGridOptions.color} stopOpacity="0" />
          <stop stopColor={svgGridOptions.color} stopOpacity="0.8" />
          <stop offset="1" stopColor="#3E9BCF" stopOpacity="0" />
        </motion.linearGradient>
        <motion.linearGradient
          animate={{
            x2: [svgGridOptions.boxWidth / 2, 0, svgGridOptions.boxWidth / 2],
            x1: [svgGridOptions.boxWidth / 2, 0, svgGridOptions.boxWidth / 2],
            y1: [svgGridOptions.boxHeight, svgGridOptions.boxHeight / 3, 0],
            y2: [svgGridOptions.boxHeight, svgGridOptions.boxHeight / 2, 0],
          }}
          transition={{
            duration: isSm ? 3 : 5,
            repeat: Infinity,
            ease: 'linear',
            delay: 2,
          }}
          id="electric-pulse-2"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={svgGridOptions.color} stopOpacity="0" />
          <stop stopColor={svgGridOptions.color} stopOpacity="0.8" />
          <stop offset="1" stopColor="#3E9BCF" stopOpacity="0" />
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
        className="z-[100] absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0) 0px, #000000 50%)',
        }}
      />
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

export default HeroGrid
