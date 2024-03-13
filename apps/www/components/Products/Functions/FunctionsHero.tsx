import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import anime from 'animejs'
import { IconCheck, IconCopy } from 'ui'
import CopyToClipboard from 'react-copy-to-clipboard'
import Typed from 'typed.js'

const FunctionsHero = () => {
  const ref = useRef(null)
  const typerRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  const dots = [
    {
      id: 'dot1',
      type: 'dot',
      left: '50%',
      top: '29.5%',
      delay: 100,
    },
    {
      id: 'dot2',
      type: 'dot',
      left: '24%',
      top: '50%',
      delay: 200,
    },
    {
      id: 'dot3',
      type: 'dot',
      left: '77.4%',
      top: '63.4%',
      delay: 400,
    },
  ]

  const svgs = [
    {
      id: 'svg1',
      type: 'svg',
      viewbox: '0 0 155 284',
      width: '15.544%',
      height: '41.64%',
      left: '38.6%',
      top: '31.1%',
      path: 'M.797 283.216c14.605-22.693 64.498-78.738 87.739-104.396-22.406-17.823-47.852-46.354-57.983-58.555 36.536-29.153 96.735-65.699 122.267-80.327-6.727-8.041-21.226-27.282-26.518-39.053',
      x1: '100%',
      x2: '100%',
      y1: {
        initial: '-20%',
        frames: ['-20%', '100%'],
      },
      y2: {
        initial: '0',
        frames: ['0', '130%'],
      },
      duration: 500,
      delay: 1000,
      offset: '+=30',
      easing: 'linear',
    },
    {
      id: 'svg2',
      type: 'svg',
      viewbox: '0 0 272 235',
      width: '27.658%',
      height: '34.345%',
      left: '51%',
      top: '31%',
      path: 'M271.749 233.614C215.075 230.474 159.599 210.964 138.945 201.602C144.38 186.681 156.517 152.612 161.587 135.71C126.058 122.39 44.25 76.75 1.25 0.75',
      x1: '100%',
      x2: '100%',
      y1: {
        initial: '-20%',
        frames: ['-20%', '100%'],
      },
      y2: {
        initial: '0',
        frames: ['0', '130%'],
      },
      duration: 800,
      delay: 3000,
      offset: '+=3000',
      easing: 'linear',
    },
    {
      id: 'svg3',
      type: 'svg',
      viewbox: '0 0 261 144',
      width: '26.687%',
      height: '20.89%',
      left: '25.1%',
      top: '31%',
      path: 'M260.5 1.5C157.75 30.75 67.75 89 1.13281 143.202',
      x1: '100%',
      x2: '100%',
      y1: {
        initial: '-20%',
        frames: ['-20%', '100%'],
      },
      y2: {
        initial: '0',
        frames: ['0', '130%'],
      },
      duration: 2000,
      delay: 0,
      offset: '+=1000',
      easing: 'linear',
    },
  ]

  useEffect(() => {
    animate()
  }, [])

  const animate = () => {
    console.log('yo')
    const tl = anime.timeline({
      loop: true,
      autoplay: true,
    })

    svgs.forEach((svg: any) => {
      tl.add(
        {
          targets: `#functions-hero #${svg.id} linearGradient`,
          y1: svg.y1.frames,
          y2: svg.y2.frames,
          easing: svg.easing,
          duration: svg.duration,
          // delay: svg.delay,
          // delay: (el) => parseInt(el.dataset.delay!),
          delay: (el) => {
            console.log(parseInt(el.dataset.delay!))
            return parseInt(el.dataset.delay!)
          },
        },
        svg.offset
      )
    })

    tl.play()
  }

  useEffect(() => {
    const typed = new Typed(typerRef.current, {
      strings: ['supabase functions deploy hello'],
      typeSpeed: 10,
      startDelay: 400,
      showCursor: true,
      loop: false,
    })

    return () => {
      // Destroy Typed instance during cleanup to stop animation
      typed.destroy()
    }
  }, [])

  return (
    <div
      ref={ref}
      id="functions-hero"
      className="
        absolute inset-0
        -left-20 w-[150%] md:w-[150%] aspect-[978/678]
        sm:-left-32
        md:-left-44
        lg:-left-10 lg:-top-10 lg:w-[130%]
        xl:-left-32 xl:w-[130%]
      "
    >
      <div
        className="
          opacity-0 animate-fade-in absolute flex-1 flex items-center justify-center h-auto
          w-[50%] left-[27%] top-[2%]
          md:left-[33.5%] md:w-[35%] md:top-[6%]
          lg:left-[26%] lg:w-[52%] lg:top-[3%]
          xl:left-[32%] xl:w-[40%] xl:top-[3%]
        "
      >
        <CopyToClipboard text="supabase functions deploy hello">
          <button
            onClick={handleCopy}
            className="w-full px-3 py-2 group hover:border-strong flex gap-2 items-center bg-alternative rounded-xl border"
          >
            <div className="text-foreground-muted text-sm font-mono">$</div>
            <div ref={typerRef} className="text-foreground text-xs md:text-sm font-mono">
              supabase functions deploy hello
            </div>
            <div className="text-foreground rounded p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {copied ? (
                <span className="text-brand">
                  <IconCheck className="w-3.5 h-3.5" />
                </span>
              ) : (
                <IconCopy className="w-3.5 h-3.5" />
              )}
            </div>
          </button>
        </CopyToClipboard>
      </div>
      {svgs.map((s) => (
        <svg
          key={s.id}
          id={s.id}
          data-delay={s.delay}
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          fill="none"
          viewBox={s.viewbox}
          className="absolute"
          style={{
            width: s.width,
            height: s.height,
            left: s.left,
            top: s.top,
          }}
        >
          <path stroke="url(#a)" strokeWidth="1.396" d={s.path} />
          <defs>
            <linearGradient
              id="a"
              data-delay={s.delay}
              x1={s.x1}
              x2={s.x2}
              y1={s.y1.initial}
              y2={s.y2.initial}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="hsl(var(--foreground-default))" stopOpacity="0" />
              <stop offset="0.5" stopColor="hsl(var(--foreground-default))" stopOpacity="0.6" />
              <stop offset="1" stopColor="hsl(var(--foreground-default))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      ))}
      {dots.map((dot) => (
        <div
          key={dot.id}
          id={dot.id}
          style={{ left: dot.left, top: dot.top }}
          className="absolute animate-pulse origin-center w-5 h-5 flex items-center justify-center"
        >
          <span className="absolute inset-0 w-full h-full rounded-full bg-foreground bg-opacity-20" />
          <span className="absolute w-4/5 h-4/5 rounded-full bg-foreground bg-opacity-90" />
        </div>
      ))}
      <Image
        src="/images/product/functions/globe.svg"
        alt="globe wireframe"
        width={400}
        height={400}
        className="w-full h-full"
        quality={100}
        priority
      />
    </div>
  )
}

export default FunctionsHero
