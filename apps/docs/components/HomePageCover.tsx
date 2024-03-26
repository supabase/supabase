import Link from 'next/link'
import { IconBackground, IconPlay } from 'ui'
import { useBreakpoint } from 'common'
import DocsCoverLogo from './DocsCoverLogo'
import { IconPanel } from 'ui-patterns/IconPanel'

const HomePageCover = (props) => {
  const isXs = useBreakpoint(639)
  const iconSize = isXs ? 'sm' : 'lg'

  const frameworks = [
    {
      tooltip: 'ReactJS',
      icon: '/docs/img/icons/react-icon',
      href: '/guides/getting-started/quickstarts/reactjs',
    },
    {
      tooltip: 'Next.js',
      icon: '/docs/img/icons/nextjs-icon',
      href: '/guides/getting-started/quickstarts/nextjs',
    },
    {
      tooltip: 'RedwoodJS',
      icon: '/docs/img/icons/redwoodjs-icon',
      href: '/guides/getting-started/quickstarts/redwoodjs',
    },
    {
      tooltip: 'Flutter',
      icon: '/docs/img/icons/flutter-icon',
      href: '/guides/getting-started/quickstarts/flutter',
    },
    {
      tooltip: 'Android Kotlin',
      icon: '/docs/img/icons/kotlin-icon',
      href: '/guides/getting-started/quickstarts/kotlin',
    },
    {
      tooltip: 'SvelteKit',
      icon: '/docs/img/icons/svelte-icon',
      href: '/guides/getting-started/quickstarts/sveltekit',
    },
    {
      tooltip: 'SolidJS',
      icon: '/docs/img/icons/solidjs-icon',
      href: '/guides/getting-started/quickstarts/solidjs',
    },
    {
      tooltip: 'Vue',
      icon: '/docs/img/icons/vuejs-icon',
      href: '/guides/getting-started/quickstarts/vue',
    },
    {
      tooltip: 'NuxtJS',
      icon: '/docs/img/icons/nuxt-icon',
      href: '/guides/getting-started/quickstarts/nuxtjs',
    },
    {
      tooltip: 'refine',
      icon: '/docs/img/icons/refine-icon',
      href: '/guides/getting-started/quickstarts/refine',
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
      <div className="col-span-full flex flex-col md:flex-row xl:flex-col justify-between gap-1 md:gap-3">
        <div className="md:max-w-xs shrink w-fit xl:max-w-none">
          <div className="flex items-center gap-3 mb-3">
            <IconBackground>
              <IconPlay aria-hidden="true" className="text-brand-600 w-4" strokeWidth={2} />
            </IconBackground>
            <h2 className="text-2xl m-0 text-foreground">Getting Started</h2>
          </div>
          <p className="text-foreground-light text-sm">
            Discover how to set up a database to an app making queries in just a few minutes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap md:grid md:grid-cols-5 gap-2 sm:gap-3">
          {frameworks.map((framework, i) => (
            <Link key={i} href={framework.href} passHref className="no-underline">
              <IconPanel
                iconSize={iconSize}
                hideArrow
                tooltip={framework.tooltip}
                icon={framework.icon}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full bg-alternative border-b max-w-none mb-16 md:mb-12 xl:mb-0">
      <div className="max-w-7xl px-5 mx-auto py-8 sm:pb-16 sm:pt-12 xl:pt-16 flex flex-col xl:flex-row justify-between gap-12 xl:gap-12">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-center w-full max-w-xl xl:max-w-[33rem]">
          <DocsCoverLogo aria-hidden="true" />
          <div className="flex flex-col">
            <h1 className="m-0 mb-3 text-2xl sm:text-3xl text-foreground">{props.meta?.title}</h1>
            <p className="m-0 text-foreground-light">
              Learn how to get up and running with Supabase through tutorials, APIs and platform
              resources.
            </p>
          </div>
        </div>
        <div className="w-full xl:max-w-[440px] -mb-40">
          <GettingStarted />
        </div>
      </div>
    </div>
  )
}

export default HomePageCover
