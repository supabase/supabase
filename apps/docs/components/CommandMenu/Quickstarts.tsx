import { ArrowRight } from 'lucide-react'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

interface Quickstart {
  label: string
  url: `/${string}`
}

const quickstarts = [
  {
    label: 'React',
    url: '/guides/getting-started/quickstarts/reactjs',
  },
  {
    label: 'Next.js',
    url: '/guides/getting-started/quickstarts/nextjs',
  },
  {
    label: 'Nuxt.js',
    url: '/guides/getting-started/quickstarts/nuxtjs',
  },
  {
    label: 'Flutter',
    url: '/guides/getting-started/quickstarts/flutter',
  },
  {
    label: 'Kotlin',
    url: '/guides/getting-started/quickstarts/android',
  },
  {
    label: 'SvelteKit',
    url: '/guides/getting-started/quickstarts/sveltekit',
  },
  {
    label: 'SolidJS',
    url: '/guides/getting-started/quickstarts/solidjs',
  },
  {
    label: 'Vue',
    url: '/guides/getting-started/quickstarts/vue',
  },
] as Quickstart[]

const useQuickstartCommands = () => {
  useRegisterCommands(
    'Quick starts',
    quickstarts.map(({ label, url }) => ({
      id: label,
      name: `Get started with ${label}`,
      route: url,
      defaultHidden: true,
      value: `Quick starts: Get started with ${label}`,
      icon: () => <ArrowRight />,
    }))
  )
}

export { useQuickstartCommands }
