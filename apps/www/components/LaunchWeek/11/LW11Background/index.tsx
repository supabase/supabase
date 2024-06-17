import React, { useEffect, useState } from 'react'
import anime from 'animejs'
import { useWindowSize } from 'react-use'
import { isBrowser } from 'common'
import { Dot } from './Dot'
import { cn } from 'ui'

const defaultConfig = {
  dotGrid: 40,
  percentageLarge: 0.98,
  percentageAnimated: 0.6,
  randomizeLargeDots: 3,
  randomizeSmallDots: 0.5,
  minSpeed: 1,
  maxSpeed: 2,
  minOscillation: 1,
  maxOscillation: 12,
  minDelay: -3000,
  maxDelay: 15000,
  minDuration: 200,
  maxDuration: 10000,
}

const LW11Background = ({ className }: { className?: string }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 1200, h: 800 })
  const [config] = useState(defaultConfig)
  const [hasInitialized, setHasInitialized] = useState(false)
  const Window = useWindowSize()

  const DOT_AREA = config.dotGrid
  let c = canvasRef.current?.getContext('2d')
  let dotsArray: any[] = []

  function init() {
    if (!c) return

    setHasInitialized(true)
    c = canvasRef.current?.getContext('2d')!
    c.clearRect(0, 0, size.w, size.h)
    dotsArray = []
    const GRID_COLS = Math.floor(size.w / DOT_AREA)
    const GRID_ROWS = Math.floor(size.h / DOT_AREA)

    for (let i = 0; i < GRID_COLS; i++) {
      for (let j = 0; j < GRID_ROWS; j++) {
        const isLarge = Math.random() > config.percentageLarge
        const isAnimated = isLarge || Math.random() > config.percentageAnimated
        const direction = isAnimated ? (Math.random() > 0.5 ? 'vertical' : 'horizontal') : undefined
        const speed = isAnimated ? anime.random(config.minSpeed, config.maxSpeed) : undefined
        const opacity = isLarge ? 1 : anime.random(0.4, 1)
        const isReverse = isAnimated ? Math.random() > 0.5 : undefined
        const oscillation = isAnimated
          ? anime.random(config.minOscillation, config.maxOscillation).toFixed()
          : undefined
        const dotSize = isLarge
          ? Math.random() * config.randomizeLargeDots
          : Math.random() * config.randomizeSmallDots
        const endPos = {
          x: anime
            .random(
              DOT_AREA * 1 - DOT_AREA / 2 + dotSize / 2,
              DOT_AREA * 10 - DOT_AREA / 2 + dotSize / 2
            )
            .toFixed(),
          y: anime
            .random(
              DOT_AREA * 1 - DOT_AREA / 2 + dotSize / 2,
              DOT_AREA * 10 - DOT_AREA / 2 + dotSize / 2
            )
            .toFixed(),
        }
        const delay = anime.random(config.minDelay, config.maxDelay)
        const duration = anime.random(config.minDuration, config.maxDuration)
        const animationConfig: any = isAnimated
          ? {
              direction,
              speed,
              isReverse,
              oscillation,
              endPos,
              delay,
              duration,
            }
          : undefined
        const x = (size.w / GRID_COLS) * i + DOT_AREA / 2 - dotSize / 2
        const y = (size.h / GRID_ROWS) * j + DOT_AREA / 2 - dotSize / 2
        const w = dotSize
        const h = dotSize

        dotsArray.push(new Dot(x, y, w, h, opacity, animationConfig))
      }
    }

    animate(0)
  }

  function animate(clock?: number) {
    if (!isBrowser) return

    for (let i = 0; i < dotsArray.length; i++) {
      dotsArray[i].update(c, clock)
    }

    const tl = anime
      .timeline({
        targets: dotsArray.filter((dot) => dot.anim),
        loop: true,
        direction: 'alternate',
        autoplay: true,
        update: renderParticule,
      })
      .add(
        {
          x: (p: any) =>
            !p.isVert ? `${p.anim?.isReverse ? '+' : '-'}=${DOT_AREA * p.anim.oscillation}` : p.x,
          y: (p: any) =>
            p.isVert ? `${p.anim?.isReverse ? '+' : '-'}=${DOT_AREA * p.anim.oscillation}` : p.y,
          duration: (p: any) => p.anim?.duration,
          delay: (p: any) => p.anim?.delay - 1000,
          easing: 'easeInOutExpo',
        },
        '-=1000'
      )

    tl.play()
  }

  function renderParticule(anim: any) {
    if (!isBrowser) return

    c?.clearRect(0, 0, size.w, size.h)
    for (let i = 0; i < dotsArray.length; i++) {
      dotsArray[i].update(c, 0)
    }
    for (var i = 0; i < anim.animatables.length; i++) {
      anim.animatables[i].target.update(c, 0)
    }
  }

  function resize() {
    setSize({ w: Window.width, h: Window.height })
    init()
  }

  useEffect(() => {
    if (!isBrowser) return
    resize()
  }, [Window])

  useEffect(() => {
    resize()
    init()
  }, [])

  !hasInitialized && init()

  return (
    <canvas
      ref={canvasRef}
      className={cn('opacity-0 animate-fade-in duration-1000 w-full h-full', className)}
      width={size.w}
      height={size.h}
    />
  )
}

export default LW11Background
