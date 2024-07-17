import { ArrowRight } from 'lucide-react'

import type { ICommand } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

const navCommands = [
  {
    id: 'nav-getting-started',
    name: 'Go to Getting Started',
    route: '/guides/getting-started',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-database',
    name: 'Go to Database',
    route: '/guides/database/overview',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-auth',
    name: 'Go to Auth',
    route: '/guides/auth',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-storage',
    name: 'Go to Storage',
    route: '/guides/storage',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-functions',
    name: 'Go to Functions',
    route: '/guides/functions',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-realtime',
    name: 'Go to Realtime',
    route: '/guides/realtime',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ai',
    name: 'Go to AI & Vectors',
    route: '/guides/ai',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-rest',
    name: 'Go to REST API',
    route: '/guides/api',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-graphql',
    name: 'Go to GraphQL',
    route: '/guides/graphql',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-local-cli',
    name: 'Go to Local Dev / CLI',
    route: '/guides/cli',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-platform',
    name: 'Go to Platform',
    route: '/guides/platform',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-self-hosting',
    name: 'Go to Self-Hosting',
    route: '/guides/self-hosting',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-javascript',
    name: 'Go to JavaScript reference',
    value: 'Reference, API, SDK: Go to JavaScript reference (JS)',
    route: '/reference/javascript/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-dart',
    name: 'Go to Dart reference',
    value: 'Reference, API, SDK: Go to Dart reference (Flutter)',
    route: '/reference/dart/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-python',
    name: 'Go to Python reference',
    value: 'Reference, API, SDK: Go to Python reference',
    route: '/reference/python/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-csharp',
    name: 'Go to C# reference',
    value: 'Reference, API, SDK: Go to C# reference',
    route: '/reference/csharp/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-swift',
    name: 'Go to Swift reference',
    value: 'Reference, API, SDK: Go to Swift reference',
    route: '/reference/swift/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-kotlin',
    name: 'Go to Kotlin reference',
    value: 'Reference, API, SDK: Go to Kotlin reference',
    route: '/reference/kotlin/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-cli',
    name: 'Go to CLI reference',
    value: 'Reference, API, SDK: Go to CLI reference',
    route: '/reference/cli/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-ref-api',
    name: 'Go to Management API reference',
    value: 'Reference, API, SDK: Go to Management API reference',
    route: '/reference/api/introduction',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-resources',
    name: 'Go to Guides & Examples',
    route: '/guides/resources',
    icon: () => <ArrowRight />,
  },
  {
    id: 'nav-integrations',
    name: 'Go to Integrations',
    route: 'https://supabase.com/partners/integrations',
    icon: () => <ArrowRight />,
  },
] satisfies ICommand[]

const useDocsNavCommands = () => {
  useRegisterCommands('Go to', navCommands)
}

export { useDocsNavCommands }
