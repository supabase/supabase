import React, { useEffect, useRef } from 'react'
import styles from './hero.module.css'
import { useWindowSize } from 'react-use'
import { useBreakpoint, useTheme } from 'common'

const HeroBackground = () => {
  const spacerRef = useRef(null)
  const { isDarkMode } = useTheme()
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

  const svgGridOptions = {
    color: isDarkMode ? '#008d97' : '#005359',
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
          <line
            key={`x-${i}`}
            x1={x}
            y1={svgGridOptions.boxWidth}
            x2={x}
            y2="0"
            stroke={svgGridOptions.color}
            strokeWidth={svgGridOptions.strokeWidth}
          />
        )
      })}
    </svg>
  )

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
      </div>
    </>
  )
}

export default HeroBackground
