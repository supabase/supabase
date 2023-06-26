import React, { ReactNode, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { debounce } from 'lodash'
import { DEFAULT_EASE, EASE_IN, EASE_OUT } from '~/lib/animations'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Telemetry from '~/lib/telemetry'
import { useBreakpoint, useTelemetryProps } from 'common'
import Image from 'next/image'

export const frameworks = [
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
                className="transition-opacity group"
                onClick={() => sendTelemetryEvent(framework.gaEvent)}
                onMouseOver={() => setActiveFramework(framework)}
                onMouseOut={() => setActiveFramework(null)}
              >
                <div
                  className={[
                    'm-1 bg-[var(--color-bg-darkest)] h-20 w-20 flex transition-opacity items-center justify-center rounded-xl group-hover:border border-brand-900 hover:shadow',
                    !!activeFramework && activeFramework.name !== framework.name && '!opacity-50',
                  ].join(' ')}
                >
                  <Image
                    key={framework.name}
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
      <div className="absolute inset-0 z-0 border border-[#DEDEDE50] m-2 rounded-lg flex justify-end opacity-40">
        <svg
          width="auto"
          height="100%"
          className="w-auto"
          viewBox="0 0 583 163"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clip-path="url(#clip0_231_166170)">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1043.04 127.74V163H1043.33V127.74H1084.37V127.455H1043.33V83.7398H1084.37V83.4546H1043.33V39.7397L1084.37 39.7397V39.4546L1043.33 39.4546V8.76499e-05L1043.04 8.76249e-05V39.4546L1001.57 39.4546V8.39988e-05L1001.28 8.39739e-05V39.4546L959.803 39.4546V8.03478e-05L959.518 8.03228e-05V39.4546L918.04 39.4546V7.66967e-05L917.755 7.66718e-05V39.4546L876.277 39.4546V7.30457e-05L875.992 7.30208e-05V39.4546L834.514 39.4546V6.93946e-05L834.229 6.93697e-05V39.4546L792.751 39.4546V6.57436e-05L792.466 6.57187e-05V39.4546L750.988 39.4546V6.20926e-05L750.703 6.20676e-05V39.4546L709.225 39.4546V5.84415e-05L708.94 5.84166e-05V39.4546L667.462 39.4546V5.47905e-05L667.177 5.47656e-05V39.4546L625.699 39.4546V5.11395e-05L625.414 5.11145e-05V39.4546L583.936 39.4546V4.74884e-05L583.651 4.74635e-05V39.4546L542.173 39.4546V4.38374e-05L541.888 4.38124e-05V39.4546L500.41 39.4546V4.01863e-05L500.125 4.01614e-05V39.4546L458.647 39.4546V3.65353e-05L458.362 3.65104e-05V39.4546L416.884 39.4546V3.28843e-05L416.599 3.28593e-05V39.4546L375.121 39.4546V2.92332e-05L374.836 2.92083e-05V39.4546L333.358 39.4546V2.55822e-05L333.073 2.55573e-05V39.4546L291.595 39.4546V2.19311e-05L291.31 2.19062e-05V39.4546L249.832 39.4546V1.82801e-05L249.547 1.82552e-05V39.4546L208.069 39.4546V1.46291e-05L207.784 1.46041e-05V39.4546L166.306 39.4546V1.0978e-05L166.021 1.09531e-05V39.4546L124.543 39.4546V7.32699e-06L124.258 7.30207e-06V39.4546L82.7798 39.4546V3.67596e-06L82.4946 3.65103e-06V39.4546L41.0167 39.4546L41.0167 2.49165e-08L40.7317 0L40.7317 39.4546L7.71813e-06 39.4546L7.69321e-06 39.7398L40.7317 39.7398L40.7317 83.4546L3.87153e-06 83.4546L3.8466e-06 83.7398L40.7317 83.7398L40.7317 127.455H2.49256e-08L0 127.74H40.7317L40.7317 163H41.0167L41.0167 127.74L82.4946 127.74V163H82.7798V127.74H124.258V163H124.543V127.74H166.021V163H166.306V127.74H207.784V163H208.069V127.74H249.547V163H249.832V127.74H291.31V163H291.595V127.74L333.073 127.74V163H333.358V127.74H374.836V163H375.121V127.74H416.599V163H416.884V127.74H458.362V163H458.647V127.74H500.125V163H500.41V127.74H541.888V163H542.173V127.74H583.651V163H583.936V127.74H625.414L625.414 163H625.699L625.699 127.74H667.177V163H667.462V127.74H708.94L708.94 163H709.225L709.225 127.74H750.703V163H750.988V127.74L792.466 127.74L792.466 163H792.751V127.74H834.229V163H834.514L834.514 127.74H875.992V163H876.277V127.74H917.755V163H918.04V127.74H959.518L959.518 163H959.803V127.74H1001.28V163H1001.57V127.74L1043.04 127.74ZM41.0167 39.7398L41.0167 83.4546H82.4946V39.7398L41.0167 39.7398ZM82.7798 39.7398V83.4546H124.258V39.7398L82.7798 39.7398ZM124.543 39.7398V83.4546H166.021L166.021 39.7398L124.543 39.7398ZM166.306 39.7398L166.306 83.4546H207.784L207.784 39.7398L166.306 39.7398ZM208.069 39.7398L208.069 83.4546L249.547 83.4546L249.547 39.7398L208.069 39.7398ZM249.832 39.7398L249.832 83.4546L291.31 83.4546V39.7398L249.832 39.7398ZM291.595 39.7398V83.4546L333.073 83.4546V39.7397L291.595 39.7398ZM333.358 39.7397V83.4546H374.836V39.7398L333.358 39.7397ZM375.121 39.7398V83.4546H416.599V39.7397L375.121 39.7398ZM416.884 39.7397V83.4546H458.362V39.7398L416.884 39.7397ZM458.647 39.7398V83.4546H500.125V39.7397L458.647 39.7398ZM500.41 39.7397V83.4546H541.888V39.7397H500.41ZM542.173 39.7397V83.4546L583.651 83.4546V39.7397L542.173 39.7397ZM583.936 39.7397V83.4546L625.414 83.4546V39.7397L583.936 39.7397ZM625.699 39.7397V83.4546L667.177 83.4546V39.7397L625.699 39.7397ZM667.462 39.7397V83.4546L708.94 83.4546V39.7397L667.462 39.7397ZM709.225 39.7397V83.4546L750.703 83.4546V39.7397L709.225 39.7397ZM750.988 39.7397V83.4546H792.466V39.7397L750.988 39.7397ZM792.751 39.7397V83.4546H834.229V39.7397L792.751 39.7397ZM834.514 39.7397V83.4546H875.992V39.7397L834.514 39.7397ZM876.277 39.7397V83.4546L917.755 83.4546V39.7397L876.277 39.7397ZM918.04 39.7397V83.4546L959.518 83.4546V39.7397L918.04 39.7397ZM959.803 39.7397V83.4546L1001.28 83.4546V39.7397L959.803 39.7397ZM1001.57 39.7397V83.4546H1043.04V39.7397L1001.57 39.7397ZM1001.57 83.7398H1043.04V127.455H1001.57V83.7398ZM959.803 83.7398L1001.28 83.7398V127.455L959.803 127.455V83.7398ZM918.04 83.7398L959.518 83.7398V127.455H918.04V83.7398ZM876.277 83.7398L917.755 83.7398V127.455H876.277V83.7398ZM834.514 83.7398L875.992 83.7398V127.455H834.514V83.7398ZM792.751 83.7398L834.229 83.7398V127.455H792.751V83.7398ZM750.988 83.7398H792.466V127.455H750.988V83.7398ZM709.225 83.7398H750.703V127.455H709.225V83.7398ZM667.462 83.7398H708.94V127.455H667.462V83.7398ZM625.699 83.7398H667.177V127.455H625.699V83.7398ZM583.936 83.7398H625.414V127.455H583.936V83.7398ZM542.173 83.7398L583.651 83.7398V127.455L542.173 127.455V83.7398ZM500.41 83.7398L541.888 83.7398V127.455H500.41V83.7398ZM458.647 83.7398L500.125 83.7398V127.455H458.647V83.7398ZM416.884 83.7398L458.362 83.7398V127.455H416.884V83.7398ZM375.121 83.7398L416.599 83.7398V127.455H375.121V83.7398ZM333.358 83.7398L374.836 83.7398V127.455H333.358V83.7398ZM291.595 83.7398L333.073 83.7398V127.455H291.595V83.7398ZM249.832 83.7398H291.31V127.455H249.832V83.7398ZM208.069 83.7398H249.547V127.455H208.069V83.7398ZM166.306 83.7398H207.784V127.455H166.306V83.7398ZM124.543 83.7398H166.021V127.455H124.543L124.543 83.7398ZM82.7798 83.7398H124.258L124.258 127.455L82.7798 127.455L82.7798 83.7398ZM41.0167 83.7398H82.4946L82.4946 127.455H41.0167L41.0167 83.7398Z"
              fill="#DEDEDE"
            />
          </g>
          <defs>
            <clipPath id="clip0_231_166170">
              <rect width="583" height="163" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  )
}

export default UseAnyStack
