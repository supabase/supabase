import { ICommand, useRegisterCommands } from 'ui-patterns/CommandMenu'

const navCommands = [
  {
    id: 'nav-getting-started',
    name: 'Go to Getting Started',
    route: '/guides/getting-started',
  },
  {
    id: 'nav-database',
    name: 'Go to Database',
    route: '/guides/database',
  },
  {
    id: 'nav-auth',
    name: 'Go to Auth',
    route: '/guides/auth',
  },
  {
    id: 'nav-storage',
    name: 'Go to Storage',
    route: '/guides/storage',
  },
  {
    id: 'nav-functions',
    name: 'Go to Functions',
    route: '/guides/functions',
  },
  {
    id: 'nav-realtime',
    name: 'Go to Realtime',
    route: '/guides/realtime',
  },
  {
    id: 'nav-ai',
    name: 'Go to AI & Vectors',
    route: '/guides/ai',
  },
  {
    id: 'nav-rest',
    name: 'Go to REST API',
    route: '/guides/api',
  },
  {
    id: 'nav-graphql',
    name: 'Go to GraphQL',
    route: '/guides/graphql',
  },
  {
    id: 'nav-local-cli',
    name: 'Go to Local Dev / CLI',
    route: '/guides/cli',
  },
  {
    id: 'nav-platform',
    name: 'Go to Platform',
    route: '/guides/platform',
  },
  {
    id: 'nav-self-hosting',
    name: 'Go to Self-Hosting',
    route: '/guides/self-hosting',
  },
  {
    id: 'nav-ref-javascript',
    name: 'Go to JavaScript reference',
    value: 'Reference, API, SDK: Go to JavaScript reference (JS)',
    route: '/reference/javascript/introduction',
  },
  {
    id: 'nav-ref-dart',
    name: 'Go to Dart reference',
    value: 'Reference, API, SDK: Go to Dart reference (Flutter)',
    route: '/reference/dart/introduction',
  },
  {
    id: 'nav-ref-python',
    name: 'Go to Python reference',
    value: 'Reference, API, SDK: Go to Python reference',
    route: '/reference/python/introduction',
  },
  {
    id: 'nav-ref-csharp',
    name: 'Go to C# reference',
    value: 'Reference, API, SDK: Go to C# reference',
    route: '/reference/csharp/introduction',
  },
  {
    id: 'nav-ref-swift',
    name: 'Go to Swift reference',
    value: 'Reference, API, SDK: Go to Swift reference',
    route: '/reference/swift/introduction',
  },
  {
    id: 'nav-ref-kotlin',
    name: 'Go to Kotlin reference',
    value: 'Reference, API, SDK: Go to Kotlin reference',
    route: '/reference/kotlin/introduction',
  },
  {
    id: 'nav-ref-cli',
    name: 'Go to CLI reference',
    value: 'Reference, API, SDK: Go to CLI reference',
    route: '/reference/cli/introduction',
  },
  {
    id: 'nav-ref-api',
    name: 'Go to Management API reference',
    value: 'Reference, API, SDK: Go to Management API reference',
    route: '/reference/api/introduction',
  },
  {
    id: 'nav-resources',
    name: 'Go to Guides & Examples',
    route: '/guides/resources',
  },
  {
    id: 'nav-integrations',
    name: 'Go to Integrations',
    route: 'https://supabase.com/partners/integrations',
  },
] satisfies ICommand[]

const useDocsNavCommands = () => {
  useRegisterCommands('Go to', navCommands)
}

export { useDocsNavCommands }
