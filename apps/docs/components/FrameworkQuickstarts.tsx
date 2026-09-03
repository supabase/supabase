import { isFeatureEnabled } from 'common'

import { IconLinkImage, IconLinkList } from '@/features/ui/IconLink'

const {
  sdkDart: sdkDartEnabled,
  sdkKotlin: sdkKotlinEnabled,
  sdkSwift: sdkSwiftEnabled,
} = isFeatureEnabled(['sdk:dart', 'sdk:kotlin', 'sdk:swift'])

const frameworks = [
  {
    name: 'React',
    icon: '/docs/img/icons/react-icon',
    href: '/guides/getting-started/quickstarts/reactjs',
  },
  {
    name: 'Next.js',
    icon: '/docs/img/icons/nextjs-icon',
    href: '/guides/getting-started/quickstarts/nextjs',
    hasLightIcon: true,
  },
  {
    name: 'TanStack Start',
    icon: '/docs/img/icons/tanstack-icon',
    href: '/guides/getting-started/quickstarts/tanstack',
    hasLightIcon: true,
  },
  {
    name: 'Astro',
    icon: '/docs/img/icons/astro-icon',
    href: '/guides/getting-started/quickstarts/astrojs',
    hasLightIcon: true,
  },
  {
    name: 'Vue',
    icon: '/docs/img/icons/vuejs-icon',
    href: '/guides/getting-started/quickstarts/vue',
  },
  {
    name: 'Nuxt',
    icon: '/docs/img/icons/nuxt-icon',
    href: '/guides/getting-started/quickstarts/nuxtjs',
  },
  {
    name: 'SvelteKit',
    icon: '/docs/img/icons/svelte-icon',
    href: '/guides/getting-started/quickstarts/sveltekit',
  },
  {
    name: 'SolidJS',
    icon: '/docs/img/icons/solidjs-icon',
    href: '/guides/getting-started/quickstarts/solidjs',
  },
  {
    name: 'RedwoodJS',
    icon: '/docs/img/icons/redwood-icon',
    href: '/guides/getting-started/quickstarts/redwoodjs',
  },
  {
    name: 'Refine',
    icon: '/docs/img/icons/refine-icon',
    href: '/guides/getting-started/quickstarts/refine',
  },
  {
    name: 'Hono',
    icon: '/docs/img/icons/hono-icon',
    href: '/guides/getting-started/quickstarts/hono',
  },
  {
    name: 'iOS Swift',
    icon: '/docs/img/icons/swift-icon-orange',
    href: '/guides/getting-started/quickstarts/ios-swiftui',
    enabled: sdkSwiftEnabled,
  },
  {
    name: 'Android Kotlin',
    icon: '/docs/img/icons/kotlin-icon',
    href: '/guides/getting-started/quickstarts/kotlin',
    enabled: sdkKotlinEnabled,
  },
  {
    name: 'Expo React Native',
    icon: '/docs/img/icons/expo-icon',
    href: '/guides/getting-started/quickstarts/expo-react-native',
    hasLightIcon: true,
  },
  {
    name: 'Flutter',
    icon: '/docs/img/icons/flutter-icon',
    href: '/guides/getting-started/quickstarts/flutter',
    enabled: sdkDartEnabled,
  },
  {
    name: 'Python',
    icon: '/docs/img/icons/python-icon',
    href: '/guides/getting-started/quickstarts/flask',
  },
  {
    name: 'Laravel',
    icon: '/docs/img/icons/laravel-icon',
    href: '/guides/getting-started/quickstarts/laravel',
  },
  {
    name: 'Ruby on Rails',
    icon: '/docs/img/icons/rails-icon',
    href: '/guides/getting-started/quickstarts/ruby-on-rails',
  },
]

export function FrameworkQuickstarts({ labelledBy }: { labelledBy?: string }) {
  return (
    <IconLinkList
      labelledBy={labelledBy}
      size="lg"
      items={frameworks
        .filter((framework) => framework.enabled !== false)
        .map((framework) => ({
          title: framework.name,
          href: framework.href,
          icon: (
            <IconLinkImage path={framework.icon} hasLightIcon={framework.hasLightIcon} size="lg" />
          ),
        }))}
    />
  )
}
