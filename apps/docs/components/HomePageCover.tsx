'use client'

import { ChevronRight, Play, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
// End of third-party imports

import { isFeatureEnabled, useBreakpoint } from 'common'
import { cn, IconBackground } from 'ui'
import { IconPanel } from 'ui-patterns/IconPanel'
import { getCustomContent } from '../lib/custom-content/getCustomContent'
import DocsCoverLogo from './DocsCoverLogo'

const {
  sdkDart: sdkDartEnabled,
  sdkKotlin: sdkKotlinEnabled,
  sdkSwift: sdkSwiftEnabled,
} = isFeatureEnabled(['sdk:dart', 'sdk:kotlin', 'sdk:swift'])

function AiPrompt({ className }: { className?: string }) {
  return (
    <Link
      className={cn(
        'group',
        'w-fit rounded-full border px-3 py-1 flex gap-2 items-center text-foreground-light text-sm',
        'hover:border-brand hover:text-brand-link focus-visible:text-brand-link',
        'transition-colors',
        className
      )}
      href="/guides/getting-started/ai-prompts"
    >
      <Sparkles size={14} />
      Start with Supabase AI prompts
      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
    </Link>
  )
}

const HomePageCover = (props) => {
  const isXs = useBreakpoint(639)
  const iconSize = isXs ? 'sm' : 'lg'
  const { homepageHeading } = getCustomContent(['homepage:heading'])
  const { resolvedTheme } = useTheme()
  const isLightMode = resolvedTheme !== 'dark'

  const frameworks = [
    {
      tooltip: 'ReactJS',
      icon: '/docs/img/icons/react-icon',
      href: '/guides/getting-started/quickstarts/reactjs',
      hasLightIcon: false,
    },
    {
      tooltip: 'Next.js',
      icon: '/docs/img/icons/nextjs-icon',
      href: '/guides/getting-started/quickstarts/nextjs',
      hasLightIcon: false,
    },
    {
      tooltip: 'TanStack Start',
      icon: '/docs/img/icons/tanstack-icon',
      href: '/guides/getting-started/quickstarts/tanstack',
      hasLightIcon: true,
    },
    {
      tooltip: 'Vue',
      icon: '/docs/img/icons/vuejs-icon',
      href: '/guides/getting-started/quickstarts/vue',
      hasLightIcon: false,
    },
    {
      tooltip: 'Nuxt',
      icon: '/docs/img/icons/nuxt-icon',
      href: '/guides/getting-started/quickstarts/nuxtjs',
      hasLightIcon: false,
    },
    {
      tooltip: 'iOS Swift',
      icon: '/docs/img/icons/swift-icon-orange',
      href: '/guides/getting-started/quickstarts/ios-swiftui',
      enabled: sdkSwiftEnabled,
      hasLightIcon: false,
    },
    {
      tooltip: 'Android Kotlin',
      icon: '/docs/img/icons/kotlin-icon',
      href: '/guides/getting-started/quickstarts/kotlin',
      enabled: sdkKotlinEnabled,
      hasLightIcon: false,
    },
    {
      tooltip: 'Expo React Native',
      icon: '/docs/img/icons/expo-icon',
      href: '/guides/getting-started/quickstarts/expo-react-native',
      hasLightIcon: true,
    },
    {
      tooltip: 'Flutter',
      icon: '/docs/img/icons/flutter-icon',
      href: '/guides/getting-started/quickstarts/flutter',
      enabled: sdkDartEnabled,
      hasLightIcon: false,
    },
    {
      tooltip: 'Python',
      icon: '/docs/img/icons/python-icon',
      href: '/guides/getting-started/quickstarts/flask',
      hasLightIcon: false,
    },
  ]

  const GettingStarted = () => (
    <div
      className="
        border bg-background
        relative overflow-hidden
        grid grid-cols-12
        rounded-lg
        p-5 md:p-8
        "
    >
      <div className="col-span-full flex flex-col md:flex-row xl:flex-col justify-between gap-3">
        <div className="md:max-w-xs shrink w-fit xl:max-w-none">
          <div className="flex items-center gap-3 mb-3">
            <IconBackground>
              <Play aria-hidden="true" className="text-brand-600 w-4" strokeWidth={2} />
            </IconBackground>
            <h2 className="text-2xl m-0 text-foreground">Getting Started</h2>
          </div>
          <p className="text-foreground-light text-sm">
            Set up and connect a database in just a few minutes.
          </p>
        </div>
        <div className="shrink-0">
          <div className="flex flex-wrap md:grid md:grid-cols-5 gap-2 sm:gap-3">
            {frameworks
              .filter((framework) => framework.enabled !== false)
              .map((framework, i) => {
                const iconToUse =
                  framework.hasLightIcon && isLightMode ? `${framework.icon}-light` : framework.icon

                return (
                  <Link key={i} href={framework.href} passHref className="no-underline">
                    <IconPanel
                      iconSize={iconSize}
                      hideArrow
                      tooltip={framework.tooltip}
                      icon={iconToUse}
                    />
                  </Link>
                )
              })}
          </div>
          <AiPrompt className="mt-6" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative z-10 w-full bg-alternative border-b max-w-none mb-16 md:mb-12 xl:mb-0">
      <div className="max-w-7xl px-5 mx-auto py-8 sm:pb-16 sm:pt-12 xl:pt-16 flex flex-col xl:flex-row justify-between gap-12 xl:gap-12">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center w-full max-w-xl xl:max-w-[33rem]">
          <DocsCoverLogo aria-hidden="true" />
          <div className="flex flex-col">
            <h1 className="m-0 mb-3 text-2xl sm:text-3xl text-foreground">
              {homepageHeading || props.title}
            </h1>
            <p className="m-0 text-foreground-light">
              Learn how to get up and running with Supabase through tutorials, APIs and platform
              resources.
            </p>
          </div>
        </div>
        {isFeatureEnabled('docs:full_getting_started') && (
          <div className="w-full xl:max-w-[440px] -mb-40">
            <GettingStarted />
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePageCover
