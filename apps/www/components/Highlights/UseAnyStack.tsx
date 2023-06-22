import React, { ReactNode, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { debounce } from 'lodash'
import { DEFAULT_EASE, EASE_IN, EASE_OUT } from '~/lib/animations'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Telemetry from '~/lib/telemetry'
import { useBreakpoint, useTelemetryProps } from 'common'
import Image from 'next/image'

const frameworks = [
  {
    name: 'Next.js',
    icon: '/images/logos/frameworks/nextjs.svg',
    docs: '/docs/guides/getting-started/quickstarts/nextjs',
    gaEvent: 'www_hp_hero_frameworks_nextjs',
  },
  {
    name: 'React',
    icon: '/images/logos/frameworks/react.svg',
    docs: '/docs/guides/getting-started/quickstarts/reactjs',
    gaEvent: 'www_hp_hero_frameworks_react',
  },
  {
    name: 'Nuxt',
    icon: '/images/logos/frameworks/nuxtjs.svg',
    docs: '/docs/guides/getting-started/quickstarts/nuxtjs',
    gaEvent: 'www_hp_hero_frameworks_nuxt',
  },
  {
    name: 'Flutter',
    icon: '/images/logos/frameworks/flutter.svg',
    docs: '/docs/guides/getting-started/quickstarts/flutter',
    gaEvent: 'www_hp_hero_frameworks_flutter',
  },
  {
    name: 'Svelte',
    icon: '/images/logos/frameworks/svelte.svg',
    docs: '/docs/guides/getting-started/quickstarts/sveltekit',
    gaEvent: 'www_hp_hero_frameworks_svelte',
  },
  {
    name: 'Python',
    icon: '/images/logos/languages/python-icon.svg',
    docs: '/docs/reference/python/introduction',
    gaEvent: 'www_hp_hero_frameworks_python',
  },
  {
    name: 'Vue',
    icon: '/images/logos/frameworks/vue.svg',
    docs: '/docs/guides/getting-started/quickstarts/vue',
    gaEvent: 'www_hp_hero_frameworks_vue',
  },
]

const DELAY = 1.75
const TRANSITION_IN = 0.25
const TRANSITION_OUT = 0.1

const textVariants = {
  initial: {
    y: 10,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: TRANSITION_IN,
      ease: EASE_OUT,
    },
  },
  exit: {
    y: 0,
    opacity: 0,
    transition: {
      duration: TRANSITION_OUT,
      ease: EASE_IN,
    },
  },
}

const UseAnyStack = () => {
  const [activeFramework, setActiveFramework] = useState<any>(null)

  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const isXs = useBreakpoint(640)

  const sendTelemetryEvent = async (gaEvent: string) => {
    return await Telemetry.sendEvent(
      {
        action: gaEvent,
        category: 'link',
        label: '',
      },
      telemetryProps,
      router
    )
  }

  return (
    <div className="relative w-full h-full p-2">
      <div className="relative z-20 w-full h-full flex items-center justify-between px-8 lg:px-16">
        <div className="!leading-tight text-2xl md:text-3xl stroke-text text-center text-transparent bg-clip-text bg-gradient-to-b from-scale-800 to-scale-200 will-change-transform">
          Works with{' '}
          <div className="inline">
            <AnimatePresence exitBeforeEnter>
              <motion.span
                initial="initial"
                animate="animate"
                exit="exit"
                key={activeFramework?.name}
                variants={textVariants}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-b from-white to-scale-300"
              >
                {activeFramework?.name ?? 'any stack'}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div className="grow flex items-center justify-end">
          {frameworks.map((framework) => (
            <Link href={framework.docs} key={framework.name}>
              <a
                key={framework.name}
                className={[
                  '',
                  !!activeFramework && activeFramework.name !== framework.name && '!opacity-20',
                ].join(' ')}
                onClick={() => sendTelemetryEvent(framework.gaEvent)}
                onMouseOver={() => setActiveFramework(framework)}
                onMouseOut={() => setActiveFramework(null)}
              >
                <div className="m-1 bg-[var(--color-bg-darkest)] h-20 w-20 flex transition-opacity items-center justify-center rounded-xl hover:shadow opacity-100">
                  <Image
                    key={framework.name}
                    className="opacity-100 hover:opacity-80 transition-opacity"
                    src={framework.icon}
                    alt={framework.name}
                    width={isXs ? 35 : 55}
                    height={isXs ? 35 : 55}
                  />
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
      <div className="absolute z-10 inset-0 bg-gradient-to-r from-[var(--color-panel-bg)] via-[var(--color-panel-bg)] to-transparent"></div>
      <div
        className="absolute inset-0 z-0 border m-2 rounded-lg pattern-boxes pattern-blue-500 pattern-bg-white 
  pattern-size-6 pattern-opacity-20"
      ></div>
    </div>
  )
}

export default UseAnyStack
