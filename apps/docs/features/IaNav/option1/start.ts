import { isFeatureEnabled } from 'common/enabled-features'

import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'
import { MIGRATION_PAGES } from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

const {
  docsFrameworkQuickstarts: frameworkQuickstartsEnabled,
  docsMobileTutorials: mobileTutorialsEnabled,
  docsWebApps: webAppsEnabled,
  sdkCsharp: sdkCsharpEnabled,
  sdkDart: sdkDartEnabled,
  sdkKotlin: sdkKotlinEnabled,
  sdkPython: sdkPythonEnabled,
  sdkSwift: sdkSwiftEnabled,
} = isFeatureEnabled([
  'docs:framework_quickstarts',
  'docs:mobile_tutorials',
  'docs:web_apps',
  'sdk:csharp',
  'sdk:dart',
  'sdk:kotlin',
  'sdk:python',
  'sdk:swift',
])

const jsOnly =
  !sdkCsharpEnabled && !sdkDartEnabled && !sdkKotlinEnabled && !sdkPythonEnabled && !sdkSwiftEnabled

const migrationPages = (names: string[]) =>
  MIGRATION_PAGES.filter((page) => names.includes(page.name ?? ''))

export const start: NavMenuConstant = {
  icon: 'getting-started',
  title: 'Start',
  url: '/guides/getting-started',
  items: [
    { name: 'API keys and key rotation', url: '/guides/getting-started/api-keys' },
    {
      name: 'Migrating from legacy API keys',
      url: '/guides/getting-started/migrating-to-new-api-keys',
    },
    { name: 'Architecture', url: '/guides/getting-started/architecture' },
    {
      name: 'Framework Quickstarts',
      enabled: frameworkQuickstartsEnabled,
      items: [
        {
          name: 'JavaScript and TypeScript',
          items: [
            { name: 'React', url: '/guides/getting-started/quickstarts/reactjs' },
            { name: 'Next.js', url: '/guides/getting-started/quickstarts/nextjs' },
            { name: 'TanStack Start', url: '/guides/getting-started/quickstarts/tanstack' },
            { name: 'Astro', url: '/guides/getting-started/quickstarts/astrojs' },
            { name: 'Vue', url: '/guides/getting-started/quickstarts/vue' },
            { name: 'Nuxt', url: '/guides/getting-started/quickstarts/nuxtjs' },
            { name: 'SvelteKit', url: '/guides/getting-started/quickstarts/sveltekit' },
            { name: 'SolidJS', url: '/guides/getting-started/quickstarts/solidjs' },
            { name: 'RedwoodJS', url: '/guides/getting-started/quickstarts/redwoodjs' },
            { name: 'Refine', url: '/guides/getting-started/quickstarts/refine' },
            { name: 'Hono', url: '/guides/getting-started/quickstarts/hono' },
          ],
        },
        {
          name: 'Mobile',
          items: [
            { name: 'iOS SwiftUI', url: '/guides/getting-started/quickstarts/ios-swiftui' },
            { name: 'Android Kotlin', url: '/guides/getting-started/quickstarts/kotlin' },
            {
              name: 'Expo React Native',
              url: '/guides/getting-started/quickstarts/expo-react-native',
            },
            { name: 'Flutter', url: '/guides/getting-started/quickstarts/flutter' },
          ],
        },
        {
          name: 'Python, PHP, Ruby, and Java',
          enabled: !jsOnly,
          items: [
            { name: 'Flask (Python)', url: '/guides/getting-started/quickstarts/flask' },
            { name: 'Reflex (Python)', url: '/guides/getting-started/quickstarts/reflex' },
            { name: 'Laravel PHP', url: '/guides/getting-started/quickstarts/laravel' },
            { name: 'Ruby on Rails', url: '/guides/getting-started/quickstarts/ruby-on-rails' },
            { name: 'Spring Boot', url: '/guides/getting-started/quickstarts/spring-boot' },
          ],
        },
      ],
    },
    {
      name: 'Web app demos',
      enabled: webAppsEnabled,
      items: [
        { name: 'Next.js', url: '/guides/getting-started/tutorials/with-nextjs' },
        { name: 'React', url: '/guides/getting-started/tutorials/with-react' },
        { name: 'Vue 3', url: '/guides/getting-started/tutorials/with-vue-3' },
        { name: 'Nuxt 3', url: '/guides/getting-started/tutorials/with-nuxt-3' },
        { name: 'Angular', url: '/guides/getting-started/tutorials/with-angular' },
        { name: 'RedwoodJS', url: '/guides/getting-started/tutorials/with-redwoodjs' },
        { name: 'SolidJS', url: '/guides/getting-started/tutorials/with-solidjs' },
        { name: 'Svelte', url: '/guides/getting-started/tutorials/with-svelte' },
        { name: 'SvelteKit', url: '/guides/getting-started/tutorials/with-sveltekit' },
        { name: 'Refine', url: '/guides/getting-started/tutorials/with-refine' },
      ],
    },
    {
      name: 'Mobile tutorials',
      enabled: mobileTutorialsEnabled,
      items: [
        {
          name: 'Flutter',
          url: '/guides/getting-started/tutorials/with-flutter',
          enabled: sdkDartEnabled,
        },
        {
          name: 'Expo React Native',
          url: '/guides/getting-started/tutorials/with-expo-react-native',
        },
        {
          name: 'Android Kotlin',
          url: '/guides/getting-started/tutorials/with-kotlin',
          enabled: sdkKotlinEnabled,
        },
        { name: 'Ionic React', url: '/guides/getting-started/tutorials/with-ionic-react' },
        { name: 'Ionic Vue', url: '/guides/getting-started/tutorials/with-ionic-vue' },
        { name: 'Ionic Angular', url: '/guides/getting-started/tutorials/with-ionic-angular' },
        {
          name: 'Swift',
          url: '/guides/getting-started/tutorials/with-swift',
          enabled: sdkSwiftEnabled,
        },
      ],
    },
    {
      name: 'Migrate to Supabase',
      items: [
        { name: 'Overview', url: '/guides/platform/migrating-to-supabase' },
        {
          name: 'From another Postgres host',
          items: migrationPages([
            'Heroku',
            'Render',
            'Amazon RDS',
            'Postgres',
            'Vercel Postgres',
            'Neon',
          ]),
        },
        ...migrationPages(['MySQL', 'MSSQL']),
      ],
    },
  ],
}
