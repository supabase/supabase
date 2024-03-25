import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { detectBrowser, isBrowser } from 'common'

const DatabaseVisual = () => {
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
    ? `translate(150 150) rotate(45) scale(166 180)`
    : `translate(${gradientPos?.x} ${gradientPos?.y}) rotate(45) scale(166 180)`

  return (
    <figure
      className="absolute inset-0 z-0"
      ref={containerRef}
      role="img"
      aria-label="Supabase Postgres database visual composition"
    >
      <span className="absolute w-full lg:w-auto h-full lg:aspect-square flex items-end lg:items-center justify-center lg:justify-end right-0 left-0 lg:left-auto top-24 md:top-24 lg:top-0 lg:bottom-0 my-auto">
        <Image
          src="/images/index/products/database.png"
          alt="Supabase Postgres database"
          fill
          priority
          quality={100}
          sizes="100%"
          className="absolute antialiased inset-0 object-contain object-center z-0 w-full lg:w-auto h-full transition-opacity group-hover:opacity-80"
        />
        <svg
          ref={ref}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 390 430"
          className="absolute w-full h-full z-10 m-auto will-change-transform opacity-0 transition-opacity group-hover:opacity-100"
        >
          <g stroke="hsl(var(--foreground-lighter))" filter="url(#filter5_bd_467_4905)">
            <path d="M192.144 125.816h-53.465c-8.506 0-16.159 5.17-19.334 13.061L99.0045 189.43c-3.0613 7.608-1.3448 16.306 4.3775 22.181l10.232 10.506c4.792 4.919 7.474 11.516 7.474 18.384l-.001 14.473c0 20.197 16.373 36.569 36.569 36.569 6.16 0 11.154-4.993 11.154-11.153l.001-86.241c0-18.629 7.441-36.486 20.668-49.602 2.746-2.723 7.178-2.704 9.9.041 2.722 2.745 2.703 7.178-.042 9.9-10.577 10.488-16.526 24.766-16.526 39.661l-.001 86.241c0 13.892-11.262 25.153-25.154 25.153-27.928 0-50.569-22.64-50.569-50.569l.001-14.474c0-3.218-1.257-6.309-3.503-8.615L93.353 221.38c-9.5904-9.847-12.4673-24.424-7.3366-37.176l20.3406-50.553c5.308-13.192 18.101-21.835 32.322-21.835h55.729v.084h10.339c49.104 0 88.91 39.806 88.91 88.91v50.842c0 3.866-3.134 7-7 7s-7-3.134-7-7V200.81c0-41.372-33.538-74.91-74.91-74.91H193.23c-.37 0-.732-.029-1.086-.084Z" />
            <path d="M210.03 283.94c0-3.866-3.134-7-7-7s-7 3.134-7 7v3.113c0 26.959 21.854 48.814 48.813 48.814 26.351 0 47.825-20.879 48.781-46.996h24.614c3.866 0 7-3.134 7-7s-3.134-7-7-7h-26.841c-30.744 0-60.256-12.083-82.173-33.643-2.756-2.711-7.188-2.675-9.899.081-2.711 2.756-2.675 7.188.081 9.9 21.725 21.371 50.116 34.423 80.228 37.134-.679 18.629-15.995 33.524-34.791 33.524-19.227 0-34.813-15.587-34.813-34.814v-3.113ZM238.03 202.145c0 4.792 3.885 8.677 8.677 8.677s8.676-3.885 8.676-8.677-3.884-8.676-8.676-8.676-8.677 3.884-8.677 8.676Z" />
          </g>
          <path
            stroke="url(#a)"
            d="M192.144 125.816h-53.465c-8.506 0-16.159 5.17-19.334 13.061L99.0045 189.43c-3.0613 7.608-1.3448 16.306 4.3775 22.181l10.232 10.506c4.792 4.919 7.474 11.516 7.474 18.384l-.001 14.473c0 20.197 16.373 36.569 36.569 36.569 6.16 0 11.154-4.993 11.154-11.153l.001-86.241c0-18.629 7.441-36.486 20.668-49.602 2.746-2.723 7.178-2.704 9.9.041 2.722 2.745 2.703 7.178-.042 9.9-10.577 10.488-16.526 24.766-16.526 39.661l-.001 86.241c0 13.892-11.262 25.153-25.154 25.153-27.928 0-50.569-22.64-50.569-50.569l.001-14.474c0-3.218-1.257-6.309-3.503-8.615L93.353 221.38c-9.5904-9.847-12.4673-24.424-7.3366-37.176l20.3406-50.553c5.308-13.192 18.101-21.835 32.322-21.835h55.729v.084h10.339c49.104 0 88.91 39.806 88.91 88.91v50.842c0 3.866-3.134 7-7 7s-7-3.134-7-7V200.81c0-41.372-33.538-74.91-74.91-74.91H193.23c-.37 0-.732-.029-1.086-.084Z"
          />
          <path
            stroke="url(#b)"
            d="M210.03 283.94c0-3.866-3.134-7-7-7s-7 3.134-7 7v3.113c0 26.959 21.854 48.814 48.813 48.814 26.351 0 47.825-20.879 48.781-46.996h24.614c3.866 0 7-3.134 7-7s-3.134-7-7-7h-26.841c-30.744 0-60.256-12.083-82.173-33.643-2.756-2.711-7.188-2.675-9.899.081-2.711 2.756-2.675 7.188.081 9.9 21.725 21.371 50.116 34.423 80.228 37.134-.679 18.629-15.995 33.524-34.791 33.524-19.227 0-34.813-15.587-34.813-34.814v-3.113Z"
          />
          <path
            stroke="url(#c)"
            d="M238.03 202.145c0 4.792 3.885 8.677 8.677 8.677s8.676-3.885 8.676-8.677-3.884-8.676-8.676-8.676-8.677 3.884-8.677 8.676Z"
          />
          <defs>
            <radialGradient
              id="a"
              cx="0"
              cy="0"
              r={isSafari ? '10' : '1'}
              gradientUnits="userSpaceOnUse"
              gradientTransform={gradientTransform}
            >
              <stop stopColor="hsl(var(--brand-default))" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" />
            </radialGradient>
            <radialGradient
              id="b"
              cx="0"
              cy="0"
              r={isSafari ? '3' : '1'}
              gradientUnits="userSpaceOnUse"
              gradientTransform={gradientTransform}
            >
              <stop stopColor="hsl(var(--brand-default))" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" />
            </radialGradient>
            <radialGradient
              id="c"
              cx="0"
              cy="0"
              r={isSafari ? '3' : '1'}
              gradientUnits="userSpaceOnUse"
              gradientTransform={gradientTransform}
            >
              <stop stopColor="hsl(var(--brand-default))" />
              <stop offset="1" stopColor="hsl(var(--foreground-lighter))" />
            </radialGradient>
          </defs>
        </svg>
      </span>
    </figure>
  )
}

export default DatabaseVisual
