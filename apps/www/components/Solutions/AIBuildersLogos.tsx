import Link from 'next/link'
import React, { useEffect } from 'react'
import { cn } from 'ui'

import styles from './ai-builders-logos.module.css'

const logos = [
  [
    {
      image: `/images/logos/publicity/v0.svg`,
      alt: 'v0',
      name: 'v0',
      href: 'https://v0.dev',
    },
    {
      image: `/images/logos/publicity/lovable.svg`,
      alt: 'lovable',
      name: 'lovable',
      href: 'https://lovable.dev/',
    },
    {
      image: `/images/logos/publicity/bolt.svg`,
      alt: 'bolt',
      name: 'bolt',
      href: 'https://bolt.new',
    },
  ],
  [
    {
      image: `/images/logos/publicity/figma.svg`,
      alt: 'figma',
      name: 'figma',
      href: 'https://www.figma.com/make/',
    },
    {
      image: `/images/logos/publicity/tempo.svg`,
      alt: 'tempo',
      name: 'tempo',
      href: 'https://tempo.new',
    },
    {
      image: `/images/logos/publicity/gumloop.svg`,
      alt: 'gumloop',
      name: 'gumloop',
      href: 'https://gumloop.com',
    },
  ],
  // {
  //   image: `/images/logos/publicity/co-com.svg`,
  //   alt: 'co.com',
  //   name: 'co-com',
  //   href: 'https://co.dev',
  // },
]

interface Props {
  className?: string
}

const stagger = 0.1

// duration in ms
const duration = 5000

const EnterpriseLogos: React.FC<Props> = ({ className }) => {
  const [index, setIndex] = React.useState(0)
  const [animate, setAnimate] = React.useState(false)

  const currentLogos = logos[index].slice(0, 3)
  const logosNext = logos[(index + 1) % logos.length].slice(0, 3)

  useEffect(() => {
    const id = setTimeout(() => {
      setAnimate(true)
    }, 500)

    return () => {
      clearTimeout(id)
    }
  }, [])

  useEffect(() => {
    if (!animate) {
      return
    }

    function loop() {
      setIndex((index) => (index + 1) % logos.length)
    }

    const interval = setInterval(loop, duration)

    return () => {
      clearInterval(interval)
    }
  }, [animate])

  return (
    <div className={cn('grid place-items-center w-full', className)}>
      <div
        key={`${index}-exit`}
        className="grid grid-cols-3 items-center text-center justify-center sm:flex gap-4 lg:gap-8"
        style={{
          gridArea: '1 / 1',
        }}
      >
        {currentLogos.map((logo, idx) => (
          <Logo
            key={`ent-logo-${logo.name}-${idx}`}
            logo={logo}
            state="exit"
            animate={animate}
            index={idx}
            stagger={stagger}
          />
        ))}
      </div>

      {animate && (
        <div
          key={`${index}-enter`}
          className="items-center text-center justify-center flex-wrap flex gap-4 lg:gap-8"
          style={{
            gridArea: '1 / 1',
          }}
        >
          {logosNext.map((logo, idx) => (
            <Logo
              key={`ent-logo-${logo.name}-${idx}`}
              logo={logo}
              state="enter"
              animate={animate}
              index={idx}
              stagger={stagger}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const Logo = ({
  logo,
  state,
  animate,
  index,
  stagger,
}: {
  logo: (typeof logos)[0][0]
  state: 'enter' | 'exit'
  animate: boolean
  index: number
  stagger: number
}) => {
  return (
    <Link
      href={logo.href}
      target="_blank"
      className={cn(
        'h-8 lg:h-12 w-max mx-auto hover:opacity-100 opacity-80 transition-opacity',
        styles.logo
      )}
      data-state={state}
      data-animate={animate}
      style={
        {
          '--delay': `${index * stagger}s`,
        } as React.CSSProperties
      }
    >
      <img
        src={logo.image}
        alt={logo.alt}
        className="
      w-auto block
      h-10 !min-h-10
      md:h-10 md:!min-h-10
      lg:h-7 lg:!min-h-7
      2xl:h-10 2xl:!min-h-10
    "
        draggable={false}
      />
    </Link>
  )
}

export default EnterpriseLogos
