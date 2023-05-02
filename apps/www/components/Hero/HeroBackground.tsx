import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useWindowSize } from 'react-use'
import { useBreakpoint } from 'common'

import styles from './hero.module.css'

const HeroGrid = dynamic(() => import('./HeroGrid'))

const HeroBackground = () => {
  const spacerRef = useRef(null)
  const { width } = useWindowSize()
  const isSm = useBreakpoint(640)

  useEffect(() => {
    const divHeight =
      width < 768 ? 50000 / width : width > 1800 ? 30000 / width : (70000 / width) * 2

    if (spacerRef?.current) {
      ;(spacerRef.current as HTMLDivElement).style.height = `${Math.round(divHeight)}px`
    }
  }, [width])

  const svgTraceWidth = 1680
  const svgTraceHeight = 915
  const svgPath =
    'M2.16005e-05 -0.000998163L1680 0.129286V234L890.763 1012.41C859.46 1043.28 809.108 1043.11 778.018 1012.02L-0.000248139 234.001L2.16005e-05 -0.000998163Z'

  return (
    <>
      <div
        className={[
          'absolute z-[-4] flex flex-col top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none',
        ].join(' ')}
      >
        <div className="absolute w-screen h-screen">
          <div className={['w-full top-0 relative z-0', styles['shape-gradient']].join(' ')} />
          <div className="absolute bottom-0 z-[1] w-full h-1/3 bg-gradient-to-t from-scale-100 to-transparent" />
          <div ref={spacerRef} className="relative w-full bg-scale-100" />
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
                strokeWidth={isSm ? '4' : '2'}
              />
              <path
                d={svgPath}
                stroke="url(#electric-trace-right)"
                strokeLinecap="round"
                strokeWidth="2"
              />
              <path d={svgPath} fill="var(--colors-scale1)" />
              <defs>
                <linearGradient
                  x1={isSm ? svgTraceWidth : svgTraceWidth / 2 - 100}
                  y1={svgTraceHeight / 2}
                  x2={0}
                  y2={svgTraceHeight / 2}
                  id="electric-trace"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3ecf8e" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#3ecf8e" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#3E9BCF" stopOpacity="0" />
                </linearGradient>
                {!isSm && (
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
                )}
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <div
        className={[
          'absolute inset-0 w-full h-[600px] lg:h-[800px] overflow-hidden pointer-events-none',
          styles['hero-container'],
        ].join(' ')}
      >
        <div className={['w-full h-full', styles['gradient']].join(' ')} />
        <div className="absolute bottom-0 z-[-2] w-full h-full bg-gradient-to-t from-scale-100 to-transparent" />
        <HeroGrid />
      </div>
    </>
  )
}

export default HeroBackground
