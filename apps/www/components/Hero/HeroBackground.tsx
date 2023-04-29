import React, { useEffect, useRef } from 'react'
import styles from './hero.module.css'
import { useWindowSize } from 'react-use'
import { useTheme } from 'common'
import { motion } from 'framer-motion'

const HeroBackground = () => {
  const divRef = useRef(null)
  const { isDarkMode } = useTheme()
  const { width } = useWindowSize()

  useEffect(() => {
    const newHeight =
      width < 768 ? 100000 / width : width > 1800 ? 30000 / width : (70000 / width) * 2

    if (divRef?.current) {
      ;(divRef.current as HTMLDivElement).style.height = `${Math.round(newHeight)}px`
      console.log(width, newHeight)
    }
  }, [width])

  const svgTraceWidth = 1680
  const svgTraceHeight = 915
  const svgPath =
    // 'M2.16005e-05 -0.000998163L1680 0.129286V234L834.197 1068.2L-0.000248139 234.001L2.16005e-05 -0.000998163Z'
    'M2.16005e-05 -0.000998163L1680 0.129286V234L834.197 1068.2L-0.000248139 234.001L2.16005e-05 -0.000998163Z'

  return (
    <>
      <div
        className={[
          'absolute z-[-4] flex flex-col top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none',
        ].join(' ')}
      >
        <div className="absolute w-screen h-screen">
          <div className={['w-full top-0 relative z-0', styles['shape-gradient']].join(' ')} />
          <div ref={divRef} className="relative w-full bg-scale-100" />
          <div className={['2xl:-mt-52'].join(' ')}>
            <svg
              className={['-mt-1 relative z-[-2]', styles['triangle-svg']].join(' ')}
              preserveAspectRatio="none"
              width="100%"
              height="100%"
              viewBox="0 0 1680 1069"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={svgPath}
                stroke="url(#electric-trace)"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <path
                d={svgPath}
                stroke="url(#electric-trace-right)"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <path d={svgPath} fill="var(--colors-scale1)" />
              <defs>
                {/* 
                // Animated trace
                <motion.linearGradient
                  animate={{
                    x2: [
                      -svgTraceWidth / 2,
                      svgTraceWidth / 3,
                      // (svgTraceWidth / 5) * 2,
                      svgTraceWidth,
                      svgTraceWidth,
                    ],
                    x1: [0, svgTraceWidth / 2, svgTraceWidth * 1.5, svgTraceWidth * 1.5],
                    y1: [
                      svgTraceHeight / 2,
                      svgTraceHeight / 2,
                      svgTraceHeight / 2,
                      svgTraceHeight / 2,
                    ],
                    y2: [
                      svgTraceHeight / 2,
                      svgTraceHeight / 2,
                      svgTraceHeight / 2,
                      svgTraceHeight / 2,
                    ],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: 4,
                  }}
                  id="electric-trace"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3ecf8e" stopOpacity="0" />
                  <stop stopColor="#3ecf8e" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#3E9BCF" stopOpacity="0" />
                </motion.linearGradient> */}
                <linearGradient
                  x1={svgTraceWidth / 2 - 100}
                  y1={svgTraceHeight / 2}
                  x2={0}
                  y2={svgTraceHeight / 2}
                  id="electric-trace"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3ecf8e" stopOpacity="0" />
                  <stop stopColor="#3ecf8e" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#3E9BCF" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  x1={svgTraceWidth + 100}
                  y1={svgTraceHeight / 2}
                  x2={svgTraceWidth / 2}
                  y2={svgTraceHeight / 2}
                  id="electric-trace-right"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3ecf8e" stopOpacity="0" />
                  <stop stopColor="#3ecf8e" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#3E9BCF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div
        className={[
          'absolute top-0 left-0 w-full h-[600px] lg:h-[800px] overflow-hidden pointer-events-none',
          styles['hero-container'],
        ].join(' ')}
      >
        <div className={['w-full h-full', styles['gradient']].join(' ')} />
        <div className="absolute bottom-0 z-[-2] w-full h-full bg-gradient-to-t from-scale-100 to-transparent" />
        <div
          className={[
            'relative -z-10 ![perspective:1200px] sm:![perspective:1200px] md:![perspective:1200px] lg:![perspective:1200px]',
          ].join(' ')}
        >
          <div
            className="z-[100] absolute inset-0 [--gradient-stop-1:0px] [--gradient-stop-2:50%]"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0) 0px, #000000 50%)',
            }}
          ></div>
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
            <div className={[styles['hero-grid-lines']].join(' ')}></div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HeroBackground
