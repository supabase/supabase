import { isFeatureEnabled } from 'common'
import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { cn } from 'ui'
import { TextLink } from 'ui-patterns/TextLink'

import { FrameworkQuickstarts } from '@/components/FrameworkQuickstarts'
import { MIGRATION_PAGES } from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { GlassPanelWithIconPicker } from '@/features/ui/GlassPanelWithIconPicker'
import { IconLinkImage, IconLinkList, IconLinkMenuIcon } from '@/features/ui/IconLink'
import HomeLayout from '@/layouts/HomeLayout'
import { BASE_PATH } from '@/lib/constants'

const { sdkCsharp, sdkDart, sdkKotlin, sdkPython, sdkSwift } = isFeatureEnabled([
  'sdk:csharp',
  'sdk:dart',
  'sdk:kotlin',
  'sdk:python',
  'sdk:swift',
])

const generateMetadata = async (_, parent: ResolvingMetadata): Promise<Metadata> => {
  const parentAlternates = (await parent).alternates

  return {
    alternates: {
      canonical: `${BASE_PATH}`,
      ...(parentAlternates && {
        languages: parentAlternates.languages || undefined,
        media: parentAlternates.media || undefined,
        types: parentAlternates.types || undefined,
      }),
    },
  }
}

const products = [
  {
    title: 'Database',
    icon: 'database',
    hasLightIcon: true,
    href: '/guides/database/overview',
    description:
      'Supabase provides a full Postgres database for every project with Realtime functionality, database backups, extensions, and more.',
    span: 'col-span-12',
  },
  {
    title: 'Auth',
    icon: 'auth',
    hasLightIcon: true,
    href: '/guides/auth',
    description:
      'Add and manage email and password, passwordless, OAuth, and mobile logins to your project through a suite of identity providers and APIs.',
    span: 'col-span-12 md:col-span-6',
  },
  {
    title: 'Storage',
    icon: 'storage',
    hasLightIcon: true,
    href: '/guides/storage',
    description:
      'Store, organize, transform, and serve large files—fully integrated with your Postgres database with Row Level Security access policies.',
  },
  {
    title: 'Realtime',
    icon: 'realtime',
    hasLightIcon: true,
    href: '/guides/realtime',
    description:
      'Listen to database changes, store and sync user states across clients, broadcast data to clients subscribed to a channel, and more.',
  },
  {
    title: 'Edge Functions',
    icon: 'edge-functions',
    hasLightIcon: true,
    href: '/guides/functions',
    description:
      'Globally distributed, server-side functions to execute your code closest to your users for the lowest latency.',
  },
]

const postgresIntegrations = [
  {
    title: 'AI & Vectors',
    icon: 'ai',
    href: '/guides/ai',
  },
  {
    title: 'Cron',
    icon: 'cron',
    href: '/guides/cron',
  },
  {
    title: 'Queues',
    icon: 'queues',
    href: '/guides/queues',
  },
  {
    title: 'Data REST API',
    icon: 'rest',
    href: '/guides/api',
  },
  {
    title: 'GraphQL API',
    icon: 'graphql',
    href: '/guides/graphql',
  },
]

const selfHostingOptions = [
  {
    title: 'Auth',
    icon: 'auth',
    href: '/reference/self-hosting-auth/introduction',
  },
  {
    title: 'Realtime',
    icon: 'realtime',
    href: '/reference/self-hosting-realtime/introduction',
  },
  {
    title: 'Storage',
    icon: 'storage',
    href: '/reference/self-hosting-storage/introduction',
  },
  {
    title: 'Analytics',
    icon: 'analytics',
    href: '/reference/self-hosting-analytics/introduction',
  },
]

const clientLibraries = [
  {
    title: 'JavaScript',
    icon: 'reference-javascript',
    href: '/reference/javascript/introduction',
    enabled: true,
  },
  {
    title: 'Flutter',
    icon: 'reference-dart',
    href: '/reference/dart/introduction',
    enabled: sdkDart,
  },
  {
    title: 'Python',
    icon: 'reference-python',
    href: '/reference/python/introduction',
    enabled: sdkPython,
  },
  {
    title: 'C#',
    icon: 'reference-csharp',
    href: '/reference/csharp/introduction',
    enabled: sdkCsharp,
  },
  {
    title: 'Swift',
    icon: 'reference-swift',
    href: '/reference/swift/introduction',
    enabled: sdkSwift,
  },
  {
    title: 'Kotlin',
    icon: 'reference-kotlin',
    href: '/reference/kotlin/introduction',
    enabled: sdkKotlin,
  },
]

const additionalResources = [
  {
    title: 'AI tools',
    description: 'Develop with Supabase AI-first using plugins, MCP, and skills.',
    icon: 'ai-tools',
    href: '/guides/ai',
  },
  {
    title: 'Platform guides',
    description: 'Learn more about the tools and services powering Supabase.',
    icon: 'platform',
    href: '/guides/platform',
  },
  {
    title: 'Supabase CLI',
    description: 'Use the CLI to develop, manage and deploy your projects.',
    icon: 'reference-cli',
    href: '/reference/cli/introduction',
  },
  {
    title: 'Management API',
    description: 'Manage your Supabase projects and organizations.',
    icon: 'reference-api',
    href: '/reference/api/introduction',
  },
  {
    title: 'Integrations',
    description: 'Explore a variety of integrations from Supabase partners.',
    icon: 'integrations',
    href: '/guides/integrations',
  },
  {
    title: 'Supabase UI',
    description: 'A collection of pre-built Supabase components to speed up your project.',
    icon: 'ui',
    href: 'https://supabase.com/ui',
    external: true,
  },
  {
    title: 'Troubleshooting',
    description: 'Our troubleshooting guide for solutions to common Supabase issues.',
    icon: 'troubleshooting',
    href: '/guides/troubleshooting',
  },
]

const migrationGuides = [...MIGRATION_PAGES]
  .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  .flatMap((guide) => {
    if (!guide.name || !guide.url || typeof guide.icon !== 'string') return []

    return [
      {
        title: guide.name,
        href: guide.url,
        icon: <IconLinkImage path={guide.icon} hasLightIcon={guide.hasLightIcon} />,
      },
    ]
  })

const HomePage = () => (
  <HomeLayout>
    <div className="flex flex-col">
      {isFeatureEnabled('docs:full_getting_started') && (
        <div className="flex flex-col gap-6 border-b py-12 lg:grid lg:grid-cols-12 lg:gap-x-16">
          <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0">
            <h2 id="connect-a-framework" className="group scroll-mt-24">
              Connect a framework
            </h2>
            <p className="m-0 p-0 text-sm text-foreground-light">
              Start with a quickstart guide to connect your project in minutes.
            </p>
          </div>

          <div className="col-span-8 not-prose">
            <FrameworkQuickstarts labelledBy="connect-a-framework" />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6 border-b py-12 lg:grid lg:grid-cols-12 lg:gap-x-16">
        <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0">
          <h2 id="products" className="group scroll-mt-24">
            Build your backend
          </h2>
          <p className="m-0 p-0 text-sm text-foreground-light">
            Build with a complete backend platform, from your database to your application logic.
          </p>
        </div>

        <ul
          aria-labelledby="products"
          className="col-span-8 grid grid-cols-12 gap-6 not-prose [&_svg]:text-brand-600"
        >
          {products.map((product) => {
            return (
              <li key={product.title} className={cn(product.span ?? 'col-span-12 md:col-span-6')}>
                <Link href={product.href} passHref>
                  <GlassPanelWithIconPicker {...product}>
                    {product.description}
                  </GlassPanelWithIconPicker>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-6 border-b py-12 lg:grid lg:grid-cols-12 lg:gap-x-16">
        <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0">
          <h2 id="postgres-integrations" className="scroll-mt-24">
            Extend your database
          </h2>
          <p className="m-0 p-0 text-sm text-foreground-light">
            Extend your database with built-in tools for AI, APIs, scheduled jobs, and queues.
          </p>
        </div>
        <IconLinkList
          labelledBy="postgres-integrations"
          className="col-span-8 not-prose"
          items={postgresIntegrations.map((integration) => ({
            title: integration.title,
            href: integration.href,
            icon: <IconLinkMenuIcon icon={integration.icon} />,
          }))}
        />
      </div>

      <div className="flex flex-col gap-6 border-b py-12 lg:grid lg:grid-cols-12 lg:gap-x-16">
        <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0 [&_h3]:m-0">
          <h2 id="client-libraries" className="group scroll-mt-24">
            Use a client library
          </h2>
          <p className="m-0 p-0 text-sm text-foreground-light">
            Use Supabase from the language and framework your application is built with.
          </p>
        </div>

        <IconLinkList
          labelledBy="client-libraries"
          className="col-span-8 not-prose"
          items={clientLibraries
            .filter((library) => library.enabled)
            .map((library) => ({
              title: library.title,
              href: library.href,
              icon: <IconLinkMenuIcon icon={library.icon} />,
            }))}
        />
      </div>
      {isFeatureEnabled('docs:full_getting_started') && (
        <div className="flex flex-col gap-6 border-b py-12 lg:grid lg:grid-cols-12 lg:gap-x-16">
          <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0">
            <h2 id="migrate-to-supabase" className="group scroll-mt-24">
              Migrate to Supabase
            </h2>
            <p className="text-foreground-light text-sm p-0 m-0">
              Bring your existing data, auth and storage to Supabase following our migration guides.
            </p>
            <TextLink
              label="Explore more resources"
              url="/guides/resources"
              className="no-underline text-brand-link text-sm"
            />
          </div>

          <IconLinkList
            labelledBy="migrate-to-supabase"
            className="col-span-8 not-prose"
            items={migrationGuides}
          />
        </div>
      )}

      <div className="flex flex-col gap-6 border-b py-12 lg:grid lg:grid-cols-12 lg:gap-x-16">
        <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0">
          <h2 id="additional-resources" className="group scroll-mt-24">
            Explore more
          </h2>
          <p className="m-0 p-0 text-sm text-foreground-light">
            Explore the tools, integrations, and guides that help you get more from Supabase.
          </p>
        </div>

        <ul
          aria-labelledby="additional-resources"
          className="col-span-8 grid grid-cols-12 gap-6 not-prose"
        >
          {additionalResources.map((resource) => {
            return (
              <li key={resource.title} className="col-span-12 md:col-span-6">
                <Link
                  href={resource.href}
                  passHref
                  target={resource.external ? '_blank' : undefined}
                >
                  <GlassPanelWithIconPicker {...resource}>
                    {resource.description}
                  </GlassPanelWithIconPicker>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
      {isFeatureEnabled('docs:full_getting_started') && (
        <div className="flex flex-col gap-6 py-12 lg:grid lg:grid-cols-12 lg:gap-x-16">
          <div className="col-span-4 flex flex-col gap-1">
            <div className="md:max-w-xs 2xl:max-w-none">
              <div className="flex items-center gap-3 mb-3 text-brand-600">
                <h2 id="self-hosting" className="group scroll-mt-24 m-0">
                  Self-host Supabase
                </h2>
              </div>
              <p className="text-foreground-light text-sm m-0 p-0">
                Get started with self-hosting Supabase.
              </p>
              <TextLink
                label="More on self-hosting"
                url="/guides/self-hosting"
                className="no-underline text-brand-link text-sm"
              />
            </div>
          </div>

          <div className="col-span-8 grid grid-cols-12 not-prose">
            <IconLinkList
              labelledBy="self-hosting"
              className="col-span-full lg:col-span-8"
              itemClassName="col-span-6"
              items={selfHostingOptions.map((option) => ({
                title: option.title,
                href: option.href,
                icon: <IconLinkMenuIcon icon={option.icon} />,
              }))}
            />
          </div>
        </div>
      )}
    </div>
  </HomeLayout>
)

export default HomePage
export { generateMetadata }
