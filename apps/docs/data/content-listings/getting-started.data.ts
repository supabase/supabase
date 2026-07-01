import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const gettingStartedGetStarted: ContentListingGroup = {
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
      description: 'Build AI-enabled applications using our Vector toolkit.',
    },
    {
      title: 'Subscription Payments (SaaS)',
      href: 'https://github.com/vercel/nextjs-subscription-payments#nextjs-subscription-payments-starter',
      icon: '/docs/img/icons/nextjs-icon',
      description: 'Clone, deploy, and fully customize a SaaS subscription application with Next.js.',
    },
    {
      title: 'Partner Gallery',
      href: 'https://github.com/supabase-community/partner-gallery-example#supabase-partner-gallery-example',
      icon: '/docs/img/icons/nextjs-icon',
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
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a React app.',
    },
    {
      title: 'Next.js',
      href: '/guides/getting-started/quickstarts/nextjs',
      icon: '/docs/img/icons/nextjs-icon',
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a Next.js app.',
    },
    {
      title: 'Nuxt',
      href: '/guides/getting-started/quickstarts/nuxtjs',
      icon: '/docs/img/icons/nuxt-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a Nuxt app.',
    },
    {
      title: 'Hono',
      href: '/guides/getting-started/quickstarts/hono',
      icon: '/docs/img/icons/hono-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, secure it with auth, and query the data from a Hono app.',
    },
    {
      title: 'RedwoodJS',
      href: '/guides/getting-started/quickstarts/redwoodjs',
      icon: '/docs/img/icons/redwood-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database using Prisma migration and seeds, and query the data from a RedwoodJS app.',
    },
    {
      title: 'Flutter',
      href: '/guides/getting-started/quickstarts/flutter',
      icon: '/docs/img/icons/flutter-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a Flutter app.',
    },
    {
      title: 'iOS SwiftUI',
      href: '/guides/getting-started/quickstarts/ios-swiftui',
      icon: '/docs/img/icons/swift-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from an iOS app.',
    },
    {
      title: 'Android Kotlin',
      href: '/guides/getting-started/quickstarts/kotlin',
      icon: '/docs/img/icons/kotlin-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from an Android Kotlin app.',
    },
    {
      title: 'SvelteKit',
      href: '/guides/getting-started/quickstarts/sveltekit',
      icon: '/docs/img/icons/svelte-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a SvelteKit app.',
    },
    {
      title: 'SolidJS',
      href: '/guides/getting-started/quickstarts/solidjs',
      icon: '/docs/img/icons/solidjs-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a SolidJS app.',
    },
    {
      title: 'Vue',
      href: '/guides/getting-started/quickstarts/vue',
      icon: '/docs/img/icons/vuejs-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a Vue app.',
    },
    {
      title: 'TanStack Start',
      href: '/guides/getting-started/quickstarts/tanstack',
      icon: '/docs/img/icons/tanstack-icon',
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a TanStack Start app.',
    },
    {
      title: 'Refine',
      href: '/guides/getting-started/quickstarts/refine',
      icon: '/docs/img/icons/refine-icon',
      hasLightIcon: false,
      description:
        'Learn how to create a Supabase project, add some sample data to your database, and query the data from a Refine app.',
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
      href: '/guides/getting-started/tutorials/with-nuxt-3',
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
      description:
        'Learn how to build a user management app with Flutter and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Expo React Native',
      href: '/guides/getting-started/tutorials/with-expo-react-native',
      icon: '/docs/img/icons/expo-icon',
      description:
        'Learn how to build a user management app with Expo React Native and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'Expo React Native Social Auth',
      href: '/guides/getting-started/tutorials/with-expo-react-native-social-auth',
      icon: '/docs/img/icons/expo-icon',
      description:
        'Learn how to implement social authentication in an app with Expo React Native and Supabase Database and Auth functionality.',
    },
    {
      title: 'Android Kotlin',
      href: '/guides/getting-started/tutorials/with-kotlin',
      icon: '/docs/img/icons/kotlin-icon',
      hasLightIcon: false,
      description:
        'Learn how to build a product management app with Android and Supabase Database, Auth, and Storage functionality.',
    },
    {
      title: 'iOS Swift',
      href: '/guides/getting-started/tutorials/with-swift',
      icon: '/docs/img/icons/swift-icon',
      hasLightIcon: false,
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

export const gettingStartedNextSteps: ContentListingGroup = {
  id: 'getting-started-next-steps',
  heading: 'Next steps',
  headingLevel: 'h3',
  type: 'grid',
  items: [
    {
      title: 'Architecture',
      href: '/guides/getting-started/architecture',
      description:
        'Learn how the Supabase stack is structured and how all the components fit together.',
    },
    {
      title: 'Features',
      href: '/guides/getting-started/features',
      description: 'Explore the complete list of features and platform capabilities.',
    },
    {
      title: 'Migrate to Supabase',
      href: '/guides/platform/migrating-to-supabase',
      description: 'Move your existing database to Supabase using our migration guides.',
    },
  ],
}
