import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button, IconBookOpen } from 'ui'
import SectionContainer from '../Layouts/SectionContainer'
import styles from './hero.module.css'
import { useWindowSize } from 'react-use'
import BackedBy from '../BackedBy'
import { useTheme } from 'common'
import { motion } from 'framer-motion'

const Hero = () => {
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

  return (
    <div className="relative">
      <SectionContainer className="md:py-16 lg:py-20">
        <div className="relative">
          <div className="mx-auto">
            <div className="mx-auto max-w-2xl lg:col-span-6 lg:flex lg:items-center justify-center text-center">
              <div className="lg:h-[50vh] lg:min-h-[300px] lg:max-h-[450px] flex flex-col items-center justify-center sm:mx-auto md:w-3/4 lg:mx-0 lg:w-full gap-4 lg:gap-8">
                <div>
                  <motion.h1
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: [0, 0.13, 0.28, 1], delay: 0.2 }}
                    className="
                        text-scale-1200
                        text-4xl sm:text-5xl sm:leading-none lg:text-6xl
                        xl:text-7xl
                        "
                  >
                    <span className="block">Build in a weekend.</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3E9BCF] block md:ml-0">
                      Scale to millions.
                    </span>
                  </motion.h1>
                  <p className="py-2 text-scale-1200 !mb-0 mt-1.5 text-sm sm:mt-5 sm:text-base lg:text-lg">
                    Supabase is an open source Firebase alternative for building secure and
                    performant Postgres backends with minimal configuration.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="https://app.supabase.com" as="https://app.supabase.com" passHref>
                    <a>
                      <Button size="small" className="text-white">
                        Start your project
                      </Button>
                    </a>
                  </Link>
                  <Link href="/docs" as="/docs" passHref>
                    <a>
                      <Button size="small" type="default" icon={<IconBookOpen />}>
                        Documentation
                      </Button>
                    </a>
                  </Link>
                </div>
                <BackedBy className="hidden md:block" />
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
      <div
        className={[
          'absolute z-[-4] flex flex-col top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none',
        ].join(' ')}
      >
        <div className="absolute w-screen h-screen">
          <div className={['w-full top-0', styles['shape-gradient']].join(' ')} />
          <div ref={divRef} className="w-full bg-scale-100" />
          <div className={['2xl:-mt-52'].join(' ')}>
            <svg
              className={['', styles['triangle-svg']].join(' ')}
              preserveAspectRatio="none"
              width="100%"
              height="100%"
              viewBox="0 0 1680 915"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.16005e-05 -0.000998163L1680 0.129286V234L834.197 1068.2L-0.000248139 234.001L2.16005e-05 -0.000998163Z"
                fill={isDarkMode ? '#171717' : '#fbfcfd'}
              />
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
    </div>
  )
}

export default Hero
