import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ReactTooltip from 'react-tooltip'
import Telemetry from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import { useRouter } from 'next/router'
import { useBreakpoint } from 'common'

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
    name: 'Android',
    icon: '/images/logos/frameworks/kotlin.svg',
    docs: '/docs/guides/getting-started/quickstarts/android',
    gaEvent: 'www_hp_hero_frameworks_kotlin',
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

const HeroFrameworks = ({ className }: { className?: string }) => {
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
    <div className={['flex text-center flex-col items-center', className].join(' ')}>
      <small className="small !text-scale-1100">Works seamlessly with 20+ frameworks</small>
      <div className="w-full sm:max-w-lg mt-4 md:mt-3 lg:ml-0">
        <div className="flex flex-wrap items-center justify-center gap-1 xs:gap-2 sm:flex-nowrap">
          {frameworks.map((framework) => (
            <Link href={framework.docs} key={framework.name}>
              <a
                key={framework.name}
                className="m-0"
                data-tip={framework.name}
                onClick={() => sendTelemetryEvent(framework.gaEvent)}
              >
                <Image
                  key={framework.name}
                  className="opacity-100 hover:opacity-80 transition-opacity"
                  src={framework.icon}
                  alt={framework.name}
                  width={isXs ? 35 : 45}
                  height={isXs ? 35 : 45}
                />
              </a>
            </Link>
          ))}
          <ReactTooltip
            effect={'solid'}
            place="bottom"
            backgroundColor="#2e2e2e"
            textColor="white"
            className="!py-2 !px-4"
          />
        </div>
      </div>
    </div>
  )
}

export default HeroFrameworks
