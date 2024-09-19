import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { isBrowser, useReducedMotion } from 'common'

const RealtimeVisual = () => {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [svgTransformSelf, setSvgTransformSelf] = useState<string>('translate(0px, 0px)')
  const [svgTransform, setSvgTransform] = useState<string>('translate(0px, 0px)')
  const [svgTransform2, setSvgTransform2] = useState<string>('translate(0px, 0px)')
  const reduceMotion = isBrowser && useReducedMotion()

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect()
      const mouseX = event.clientX - cardRect.left // Mouse X relative to card
      const mouseY = event.clientY - cardRect.top // Mouse Y relative to card
      const cardWidth = cardRect.width
      const cardHeight = cardRect.height

      const svgX = (mouseX / cardRect.width) * 100 - 50 // Calculate SVG X position
      const svgY = (mouseY / cardRect.height) * 100 - 50 // Calculate SVG Y position

      // Set the transform to move the SVG in the opposite direction
      setSvgTransform(
        `translate(${mouseX > cardWidth / 4 + 40 ? svgX * 3 : svgX * 1.2}px, ${mouseY > cardHeight / 2 + 30 ? -svgY * 1.5 : -svgY * 2.2}px)`
      )
      setSvgTransform2(
        `translate(${mouseX > cardWidth / 2 + 40 ? -svgX * 3 : svgX * 1.6}px, ${mouseY > cardHeight / 2 - 100 ? svgY * 1.2 : svgY * 2.8}px)`
      )
      setSvgTransformSelf(`translate(${mouseX + 12}px, ${mouseY + 4}px)`)
    }
  }

  const handleMouseLeave = () => {
    setSvgTransform('translate(0px, 0px)')
    setSvgTransform2('translate(0px, 0px)')
  }

  return (
    <figure
      ref={cardRef}
      className="absolute inset-0 xl:-bottom-2 2xl:bottom-0 z-0 w-full overflow-hidden pointer-events-auto"
      role="img"
      aria-label="Supabase Realtime multiplayer app demo"
      onMouseMove={reduceMotion ? undefined : handleMouseMove}
      onMouseLeave={handleMouseLeave} // Reset on mouse leave
    >
      <Image
        src="/images/index/products/realtime-dark.svg"
        alt="Supabase Realtime"
        fill
        sizes="100%"
        quality={100}
        className="hidden dark:block absolute object-cover xl:object-center inset-0"
      />
      <Image
        src="/images/index/products/realtime-light.svg"
        alt="Supabase Realtime"
        fill
        sizes="100%"
        quality={100}
        className="dark:hidden absolute object-cover xl:object-center inset-0"
      />
      {/* User 1 */}
      <div
        className="absolute will-change-transform"
        style={{
          position: 'absolute',
          top: '60%',
          left: '30%',
          transform: `${svgTransform} translate(-50%, -50%)`, // Center the SVG
          transition: 'transform 0.75s ease-out', // Smooth transition
        }}
      >
        <svg
          width="30"
          height="38"
          viewBox="0 0 30 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.58385 1.69742C2.57836 0.865603 1.05859 1.58076 1.05859 2.88572V35.6296C1.05859 37.1049 2.93111 37.7381 3.8265 36.5656L12.5863 25.0943C12.6889 24.96 12.8483 24.8812 13.0173 24.8812H27.3245C28.7697 24.8812 29.4211 23.0719 28.3076 22.1507L3.58385 1.69742Z"
            fill="hsl(var(--background-surface-200))"
            stroke="hsl(var(--foreground-lighter))"
            stroke-linejoin="round"
          />
        </svg>

        <div className="!w-[66.70px] !h-[33.35px] absolute left-full flex items-center justify-center gap-1 -top-6 border border-foreground-lighter/70 rounded-full bg-surface-100">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground-lighter animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_infinite] pause group-hover:run" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground-lighter animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_200ms_infinite] pause group-hover:run" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground-lighter animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_400ms_infinite] pause group-hover:run" />
        </div>
      </div>
      {/* User 2 */}
      <div
        className="absolute will-change-transform scale-[80%]"
        style={{
          position: 'absolute',
          top: '80%',
          left: '65%',
          transform: `${svgTransform2} translate(-50%, -50%)`, // Center the SVG
          transition: 'transform 1s ease-out', // Smooth transition
        }}
      >
        <svg
          width="20"
          height="28"
          viewBox="0 0 30 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.58385 1.69742C2.57836 0.865603 1.05859 1.58076 1.05859 2.88572V35.6296C1.05859 37.1049 2.93111 37.7381 3.8265 36.5656L12.5863 25.0943C12.6889 24.96 12.8483 24.8812 13.0173 24.8812H27.3245C28.7697 24.8812 29.4211 23.0719 28.3076 22.1507L3.58385 1.69742Z"
            fill="hsl(var(--background-surface-200))"
            stroke="hsl(var(--foreground-lighter))"
            stroke-linejoin="round"
          />
        </svg>

        <div className="!w-[55px] !h-[28px] absolute left-full flex items-center justify-center gap-1 -top-6 border border-foreground-muted rounded-full bg-surface-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground-lighter animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_infinite] pause group-hover:run" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground-lighter animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_200ms_infinite] pause group-hover:run" />
          <div className="w-1.5 h-1.5 rounded-full bg-foreground-lighter animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_400ms_infinite] pause group-hover:run" />
        </div>
      </div>
      {/* Self */}
      <div
        className="absolute will-change-transform w-1 h-1 opacity-0 motion-safe:group-hover:opacity-100 delay-0 duration-75 group-hover:duration-300 transition-opacity"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          transform: `${svgTransformSelf} translate(-50%, -50%)`, // Center the SVG
          // transition: 'transform 0.1s ease-out', // Smooth transition
        }}
      >
        <div className="w-auto h-auto px-2.5 py-1.5 absolute left-full flex items-center justify-center gap-1 -top-6 border border-brand rounded-full bg-brand-300">
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_infinite] pause group-hover:run" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_200ms_infinite] pause group-hover:run" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-[pulse_600ms_cubic-bezier(0.4,0,0.6,1)_400ms_infinite] pause group-hover:run" />
        </div>
      </div>
      {/* Gradient to hide animation under text to maintain readability */}
      <div
        className="
          absolute pointer-events-none
          w-full h-full max-h-[400px] lg:max-h-none
          inset-0 top-auto
          bg-[linear-gradient(to_top,transparent_0%,transparent_50%,hsl(var(--background-surface-75))_85%)]
        "
      />
    </figure>
  )
}

export default RealtimeVisual
