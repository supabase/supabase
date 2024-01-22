import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from 'ui'
import useConfData from '../hooks/use-conf-data'
import { useBreakpoint } from 'common'

interface Props {
  className?: string
  isGameMode?: boolean
}

const LWXBackground = ({ className, isGameMode = false }: Props) => {
  const { ticketState } = useConfData()
  const containerRef = useRef(null)
  const isMobile = useBreakpoint()
  const ref = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [gradientPos, setGradientPos] = useState({ x: 0, y: 0 })

  const hasTicket = ticketState === 'ticket'

  const handleGlow = (event: any) => {
    if (isMobile) return setGradientPos({ x: 70, y: 40 })
    if (!ref.current || !containerRef.current || hasTicket || isGameMode) return null

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
    const x = event.clientX - svgX - 50
    const y = event.clientY - svgY - 50

    setGradientPos({ x, y })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('mousemove', handleGlow)
    return () => {
      window.removeEventListener('mousemove', handleGlow)
    }
  }, [ticketState, isMobile])

  const gradientTransformBg = `translate(${gradientPos?.x} ${gradientPos?.y}) rotate(67.9381) scale(182.424)`
  const gradientTransformStroke = `translate(${gradientPos?.x} ${gradientPos?.y})  rotate(71.6455) scale(105.635)`

  return (
    <div className={cn('w-full h-[620px] md:!h-[720px] !min-h-[350px] absolute', className)}>
      <svg
        ref={ref}
        width="100%"
        height="100%"
        className={cn(
          `
          m-auto
          
          w-[136px] h-[136px] mt-[157px] 
          sm:w-[142px] sm:h-[142px] sm:mt-[153px] 
          md:w-[247px] md:h-[247px] md:translate-y-3 md:mt-auto
          xl:w-[285px] xl:h-[285px] xl:translate-y-2
          2xl:w-[342px] 2xl:h-[342px] 2xl:translate-y-px
          `,
          isGameMode && 'hidden'
        )}
        viewBox="0 0 186 185"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_d_399_21473)">
          <path
            d="M134.141 10.0457H175.282V51.1867L134.141 92.3278V51.1867H92.9999L134.141 10.0457Z"
            fill="url(#paint0_radial_399_21473)"
            fillOpacity="0.01"
            shapeRendering="crispEdges"
          />
          <path
            d="M51.8588 174.61L92.9999 133.469H51.8588V92.3278L10.7178 133.469V174.61H51.8588Z"
            fill="url(#paint1_radial_399_21473)"
            fillOpacity="0.01"
            shapeRendering="crispEdges"
          />
          <path
            d="M51.8588 10.0457L92.9999 51.1867L134.141 92.3278L175.282 133.469V174.61H134.141L92.9999 133.469L51.8588 92.3278L10.7178 51.1867V10.0457L51.8588 10.0457Z"
            fill="url(#paint2_radial_399_21473)"
            fillOpacity="0.01"
            shapeRendering="crispEdges"
          />
          <path
            d="M175.782 10.0457V9.54565H175.282H134.141H133.934L133.787 9.6921L92.9999 50.4796L52.2124 9.6921L52.0659 9.54565L51.8588 9.54565L10.7178 9.54567L10.2178 9.54567V10.0457V51.1867V51.3938L10.3642 51.5403L51.1517 92.3278L10.3642 133.115L10.2178 133.262V133.469V174.61V175.11H10.7178H51.8588H52.0659L52.2124 174.963L92.9999 134.176L133.787 174.963L133.934 175.11H134.141H175.282H175.782V174.61V133.469V133.262L175.636 133.115L134.848 92.3278L175.636 51.5403L175.782 51.3938V51.1867V10.0457ZM52.3588 132.969V93.5349L91.7928 132.969H52.3588ZM133.641 91.1207L94.207 51.6867H133.641V91.1207Z"
            stroke="url(#paint3_radial_399_21473)"
            strokeOpacity="0.5"
            shapeRendering="crispEdges"
          />
        </g>
        <defs>
          <radialGradient
            id="paint0_radial_399_21473"
            cx="0"
            cy="0"
            r="2"
            gradientUnits="userSpaceOnUse"
            gradientTransform={gradientTransformBg}
          >
            <stop stopColor="#FFFEFE" />
            <stop offset="1" stopColor="#060809" />
          </radialGradient>
          <radialGradient
            id="paint1_radial_399_21473"
            cx="0"
            cy="0"
            r="2"
            gradientUnits="userSpaceOnUse"
            gradientTransform={gradientTransformBg}
          >
            <stop stopColor="#FFFEFE" />
            <stop offset="1" stopColor="#060809" />
          </radialGradient>
          <radialGradient
            id="paint2_radial_399_21473"
            cx="0"
            cy="0"
            r="2"
            gradientUnits="userSpaceOnUse"
            gradientTransform={gradientTransformBg}
          >
            <stop stopColor="#FFFEFE" />
            <stop offset="1" stopColor="#060809" />
          </radialGradient>
          <radialGradient
            id="paint3_radial_399_21473"
            cx="0"
            cy="0"
            r="2"
            gradientUnits="userSpaceOnUse"
            gradientTransform={gradientTransformStroke}
          >
            <stop stopColor="hsl(var(--foreground-lighter))" />
            <stop offset="1" stopColor="hsl(var(--border-default))" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      <Image
        src="/images/launchweek/lwx/lwx_bg.svg"
        alt=""
        className={cn(
          'absolute w-full !h-[400px] md:!h-full inset-0 mt-10 object-cover object-center overflow-visible',
          isGameMode && 'opacity-30'
        )}
        role="presentation"
        fill
        priority
        ref={containerRef}
      />
      <Image
        src="/images/launchweek/lwx/lwx_bg.svg"
        alt=""
        className="absolute block md:hidden pointer-events-none w-full !h-[400px] md:!h-full inset-0 mt-10 object-cover object-center overflow-visible"
        role="presentation"
        fill
        priority
      />
    </div>
  )
}

export default LWXBackground
