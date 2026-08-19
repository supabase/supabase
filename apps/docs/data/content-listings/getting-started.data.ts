import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const gettingStartedOverview: ContentListingGroup = {
  id: 'getting-started-overview',
  type: 'grid',
  items: [
    {
      title: 'Build with AI tools',
      href: '/guides/ai-tools',
      description: 'Develop with Supabase AI-first using plugins, MCP, and skills.',
    },
    {
      title: 'API Keys',
      href: '/guides/getting-started/api-keys',
      description: 'Learn about the different API keys in Supabase and how to use them.',
    },
    {
      title: 'Local Development',
      href: '/guides/local-development',
      description: 'Use the Supabase CLI to develop locally and collaborate between teams.',
    },
  ],
}

export const gettingStartedUseCases: ContentListingGroup = {
  id: 'getting-started-use-cases',
  heading: 'Use cases',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'AI, Vectors, and embeddings',
      href: '/guides/ai#examples',
      icon: '/docs/img/icons/openai_logo',
      hasLightIcon: true,
      description: 'Build AI-enabled applications using our Vector toolkit.',
    },
    {
      title: 'Subscription Payments (SaaS)',
      href: 'https://github.com/vercel/nextjs-subscription-payments#nextjs-subscription-payments-starter',
      icon: '/docs/img/icons/nextjs-icon',
      hasLightIcon: false,
      description:
        'Clone, deploy, and fully customize a SaaS subscription application with Next.js.',
    },
    {
      title: 'Partner Gallery',
      href: 'https://github.com/supabase-community/partner-gallery-example#supabase-partner-gallery-example',
      icon: '/docs/img/icons/nextjs-icon',
      hasLightIcon: false,
      description: 'Postgres full-text search, image storage, and more.',
    },
  ],
}

export const gettingStartedFrameworkQuickstarts: ContentListingGroup = {
  id: 'getting-started-framework-quickstarts',
  heading: 'Framework quickstarts',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'React',
      href: '/guides/getting-started/quickstarts/reactjs',
      icon: '/docs/img/icons/react-icon',
      hasLightIcon: false,
      description:
        'Build single-page apps from reusable components, and query Supabase Postgres from the browser.',
    },
    {
      title: 'Next.js',
      href: '/guides/getting-started/quickstarts/nextjs',
      icon: '/docs/img/icons/nextjs-icon',
      hasLightIcon: true,
      description:
        'Full-stack React with server rendering, wired to Supabase Postgres and cookie-based auth.',
    },
    {
      title: 'Nuxt',
      href: '/guides/getting-started/quickstarts/nuxtjs',
      icon: '/docs/img/icons/nuxt-icon',
      hasLightIcon: false,
      description:
        'Full-stack Vue with server rendering, reading Postgres through a Supabase composable.',
    },
    {
      title: 'Astro',
      href: '/guides/getting-started/quickstarts/astrojs',
      icon: '/docs/img/icons/astro-icon',
      hasLightIcon: true,
      description:
        'Content-driven sites that render on the server and pull Supabase Postgres data per request.',
    },
    {
      title: 'Hono',
      href: '/guides/getting-started/quickstarts/hono',
      icon: '/docs/img/icons/hono-icon',
      hasLightIcon: false,
      description:
        'Lightweight web APIs with Supabase Auth anonymous sign-in and RLS-protected reads.',
    },
    {
      title: 'RedwoodJS',
      href: '/guides/getting-started/quickstarts/redwoodjs',
      icon: '/docs/img/icons/redwood-icon',
      hasLightIcon: false,
      description:
        'Full-stack React and GraphQL, with Prisma migrations against your Supabase Postgres database.',
    },
    {
      title: 'Expo React Native',
      href: '/guides/getting-started/quickstarts/expo-react-native',
      icon: '/docs/img/icons/expo-icon',
      hasLightIcon: true,
      description:
        'Ship iOS and Android from one React Native codebase, backed by Supabase Postgres.',
    },
    {
      title: 'Flutter',
      href: '/guides/getting-started/quickstarts/flutter',
      icon: '/docs/img/icons/flutter-icon',
      hasLightIcon: false,
      feature: 'sdk:dart',
      description: 'Ship iOS and Android from one Dart codebase, backed by Supabase Postgres.',
    },
    {
      title: 'iOS SwiftUI',
      href: '/guides/getting-started/quickstarts/ios-swiftui',
      icon: '/docs/img/icons/swift-icon',
      hasLightIcon: false,
      feature: 'sdk:swift',
      description: 'Native iOS apps in Swift, reading Postgres through the Supabase Swift SDK.',
    },
    {
      title: 'Android Kotlin',
      href: '/guides/getting-started/quickstarts/kotlin',
      icon: '/docs/img/icons/kotlin-icon',
      hasLightIcon: false,
      feature: 'sdk:kotlin',
      description:
        'Native Android apps in Kotlin and Jetpack Compose, using the Supabase Kotlin SDK.',
    },
    {
      title: 'SvelteKit',
      href: '/guides/getting-started/quickstarts/sveltekit',
      icon: '/docs/img/icons/svelte-icon',
      hasLightIcon: false,
      description: 'Full-stack Svelte that loads Supabase Postgres data in server load functions.',
    },
    {
      title: 'SolidJS',
      href: '/guides/getting-started/quickstarts/solidjs',
      icon: '/docs/img/icons/solidjs-icon',
      hasLightIcon: false,
      description:
        'Fine-grained reactive UIs that load Supabase Postgres data with Solid resources.',
    },
    {
      title: 'Vue',
      href: '/guides/getting-started/quickstarts/vue',
      icon: '/docs/img/icons/vuejs-icon',
      hasLightIcon: false,
      description:
        'Build single-page apps with the Vue composition API, backed by Supabase Postgres.',
    },
    {
      title: 'TanStack Start',
      href: '/guides/getting-started/quickstarts/tanstack',
      icon: '/docs/img/icons/tanstack-icon',
      hasLightIcon: true,
      description: 'Type-safe full-stack React that queries Supabase Postgres in server functions.',
    },
    {
      title: 'Refine',
      href: '/guides/getting-started/quickstarts/refine',
      icon: '/docs/img/icons/refine-icon',
      hasLightIcon: false,
      description:
        'Scaffold CRUD dashboards and admin panels straight from your Supabase Postgres tables.',
    },
    {
      title: 'Python',
      href: '/guides/getting-started/quickstarts/flask',
      icon: '/docs/img/icons/python-icon',
      hasLightIcon: false,
      description: 'Serve Flask web apps that query Postgres with the Supabase Python client.',
    },
    {
      title: 'Laravel',
      href: '/guides/getting-started/quickstarts/laravel',
      icon: '/docs/img/icons/laravel-icon',
      hasLightIcon: false,
      description:
        'Full-stack PHP with Eloquent ORM connected directly to your Supabase Postgres database.',
    },
    {
      title: 'Ruby on Rails',
      href: '/guides/getting-started/quickstarts/ruby-on-rails',
      icon: '/docs/img/icons/rails-icon',
      hasLightIcon: false,
      description:
        'Convention-driven Ruby apps with Active Record connected directly to your Supabase Postgres database.',
    },
  ],
}

export const gettingStartedWebAppDemos: ContentListingGroup = {
  id: 'getting-started-web-app-demos',
  heading: 'Web app demos',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Next.js',
      href: '/guides/getting-started/tutorials/with-nextjs',
      icon: '/docs/img/icons/nextjs-icon',
      hasLightIcon: true,
      description:
        'Learn how to build a user management app with Next.js and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'React',
      href: '/guides/getting-started/tutorials/with-react',
      icon: '/docs/img/icons/react-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with React and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Vue 3',
      href: '/guides/getting-started/tutorials/with-vue-3',
      icon: '/docs/img/icons/vuejs-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Vue 3 and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Nuxt 3',
      href: '/guides/getting-started/tutorials/with-nuxt',
      icon: '/docs/img/icons/nuxt-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Nuxt 3 and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Angular',
      href: '/guides/getting-started/tutorials/with-angular',
      icon: '/docs/img/icons/angular-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Angular and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'RedwoodJS',
      href: '/guides/getting-started/tutorials/with-redwoodjs',
      icon: '/docs/img/icons/redwood-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with RedwoodJS and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Svelte',
      href: '/guides/getting-started/tutorials/with-svelte',
      icon: '/docs/img/icons/svelte-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Svelte and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'SvelteKit',
      href: '/guides/getting-started/tutorials/with-sveltekit',
      icon: '/docs/img/icons/svelte-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with SvelteKit and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Refine',
      href: '/guides/getting-started/tutorials/with-refine',
      icon: '/docs/img/icons/refine-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Refine and Supabase Database, Auth, and Storage functionality.',
    },
  ],
}

export const gettingStartedMobileTutorials: ContentListingGroup = {
  id: 'getting-started-mobile-tutorials',
  heading: 'Mobile tutorials',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Flutter',
      href: '/guides/getting-started/tutorials/with-flutter',
      icon: '/docs/img/icons/flutter-icon',
      hasLightIcon: false,
      feature: 'sdk:dart',
      description:
        'Learn how to build a user management app with Flutter and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Expo React Native',
      href: '/guides/getting-started/tutorials/with-expo-react-native',
      icon: '/docs/img/icons/expo-icon',
      hasLightIcon: true,
      description:
        'Learn how to build a user management app with Expo React Native and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Expo React Native Social Auth',
      href: '/guides/auth/quickstarts/with-expo-react-native-social-auth',
      icon: '/docs/img/icons/expo-icon',
      hasLightIcon: true,
      description:
        'Learn how to implement social authentication in an app with Expo React Native and Supabase Database and Auth functionality.',
    },
    {
      title: 'Android Kotlin',
      href: '/guides/getting-started/tutorials/with-kotlin',
      icon: '/docs/img/icons/kotlin-icon',
      hasLightIcon: false,
      feature: 'sdk:kotlin',
      description:
        'Learn how to build a product management app with Android and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'iOS Swift',
      href: '/guides/getting-started/tutorials/with-swift',
      icon: '/docs/img/icons/swift-icon',
      hasLightIcon: false,
      feature: 'sdk:swift',
      description:
        'Learn how to build a user management app with iOS and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Ionic React',
      href: '/guides/getting-started/tutorials/with-ionic-react',
      icon: '/docs/img/icons/ionic-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Ionic React and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Ionic Vue',
      href: '/guides/getting-started/tutorials/with-ionic-vue',
      icon: '/docs/img/icons/ionic-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Ionic Vue and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Ionic Angular',
      href: '/guides/getting-started/tutorials/with-ionic-angular',
      icon: '/docs/img/icons/ionic-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a user management app with Ionic Angular and Supabase Database, Auth, and Storage functionality.',
    },
  ],
}
