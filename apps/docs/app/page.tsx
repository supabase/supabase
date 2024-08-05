import { type Metadata, type ResolvingMetadata } from 'next'
import Link from 'next/link'
import { IconBackground, TextLink } from 'ui'
import { IconPanel } from 'ui-patterns/IconPanel'

import MenuIconPicker from '~/components/Navigation/NavigationMenu/MenuIconPicker'
import { GlassPanelWithIconPicker } from '~/features/ui/GlassPanelWithIconPicker'
import { IconPanelWithIconPicker } from '~/features/ui/IconPanelWithIconPicker'
import HomeLayout from '~/layouts/HomeLayout'
import { BASE_PATH } from '~/lib/constants'

const generateMetadata = async (_, parent: ResolvingMetadata): Promise<Metadata> => {
  const parentAlternates = (await parent).alternates

  return {
    alternates: {
      ...parentAlternates,
      canonical: `${BASE_PATH}`,
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
  },
  {
    title: 'Auth',
    icon: 'auth',
    hasLightIcon: true,
    href: '/guides/auth',
    description:
      'Add and manage email and password, passwordless, OAuth, and mobile logins to your project through a suite of identity providers and APIs.',
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
    title: 'AI & Vectors',
    icon: 'ai',
    hasLightIcon: true,
    href: '/guides/ai',
    description: 'Use Supabase to store and search embedding vectors.',
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

const migrationGuides = [
  {
    title: 'Auth',
    icon: '/docs/img/icons/auth0-icon',
    href: '/guides/resources/migrating-to-supabase/auth0',
  },
  {
    title: 'Firebase Auth',
    icon: '/docs/img/icons/firebase-icon',
    href: '/guides/resources/migrating-to-supabase/firebase-auth',
  },
  {
    title: 'Firestore Data',
    icon: '/docs/img/icons/firebase-icon',
    href: '/guides/resources/migrating-to-supabase/firestore-data',
  },
  {
    title: 'Firebase Storage',
    icon: '/docs/img/icons/firebase-icon',
    href: '/guides/resources/migrating-to-supabase/firebase-storage',
  },
  {
    title: 'Heroku',
    icon: '/docs/img/icons/heroku-icon',
    href: '/guides/resources/migrating-to-supabase/heroku',
  },
  {
    title: 'Render',
    icon: '/docs/img/icons/render-icon',
    href: '/guides/resources/migrating-to-supabase/render',
  },
  {
    title: 'Amazon RDS',
    icon: '/docs/img/icons/aws-rds-icon',
    href: '/guides/resources/migrating-to-supabase/amazon-rds',
  },
  {
    title: 'Postgres',
    icon: '/docs/img/icons/postgres-icon',
    href: '/guides/resources/migrating-to-supabase/postgres',
  },
  {
    title: 'MySQL',
    icon: '/docs/img/icons/mysql-icon',
    href: '/guides/resources/migrating-to-supabase/mysql',
  },
  {
    title: 'MSSQL',
    icon: '/docs/img/icons/mssql-icon',
    href: '/guides/resources/migrating-to-supabase/mssql',
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
    title: 'Javascript',
    icon: 'reference-javascript',
    href: '/reference/javascript/introduction',
  },
  {
    title: 'Flutter',
    icon: 'reference-dart',
    href: '/reference/dart/introduction',
  },
  {
    title: 'Python',
    icon: 'reference-python',
    href: '/reference/python/introduction',
  },
  {
    title: 'C#',
    icon: 'reference-csharp',
    href: '/reference/csharp/introduction',
  },
  {
    title: 'Swift',
    icon: 'reference-swift',
    href: '/reference/swift/introduction',
  },
  {
    title: 'Kotlin',
    icon: 'reference-kotlin',
    href: '/reference/kotlin/introduction',
  },
]

const additionalResources = [
  {
    title: 'Management API',
    description: 'Manage your Supabase projects and organizations.',
    icon: 'reference-api',
    href: '/reference/api/introduction',
  },
  {
    title: 'Supabase CLI',
    description: 'Use the CLI to develop, manage and deploy your projects.',
    icon: 'reference-cli',
    href: '/reference/cli/introduction',
  },
  {
    title: 'Platform Guides',
    description: 'Learn more about the tools and services powering Supabase.',
    icon: 'platform',
    href: '/guides/platform',
  },
  {
    title: 'Integrations',
    description: 'Explore a variety of integrations from Supabase partners.',
    icon: 'integrations',
    href: '/guides/integrations',
  },
]

const HomePage = () => (
  <HomeLayout>
    <div className="flex flex-col">
      <h2 id="products">Products</h2>
      <ul className="grid grid-cols-12 gap-6 not-prose [&_svg]:text-brand-600">
        {products.map((product) => {
          return (
            <li key={product.title} className="col-span-12 md:col-span-4">
              <Link href={product.href} passHref>
                <GlassPanelWithIconPicker {...product}>
                  {product.description}
                </GlassPanelWithIconPicker>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col lg:grid grid-cols-12 gap-6 py-12 border-b">
        <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0 [&_h3]:m-0">
          <div className="md:max-w-xs 2xl:max-w-none">
            <div className="flex items-center gap-3 mb-3 text-brand-600">
              <h2 id="client-libraries" className="group scroll-mt-24">
                Client Libraries
              </h2>
            </div>
          </div>
        </div>

        <div className="grid col-span-8 grid-cols-12 gap-6 not-prose">
          {clientLibraries.map((library) => {
            return (
              <Link
                href={library.href}
                key={library.title}
                passHref
                className="col-span-6 md:col-span-4"
              >
                <IconPanelWithIconPicker {...library} />
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col lg:grid grid-cols-12 gap-6 py-12 border-b">
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
            className="no-underline text-brand text-sm"
          />
        </div>

        <ul className="grid col-span-8 grid-cols-12 gap-6 not-prose">
          {migrationGuides.map((guide) => {
            return (
              <li key={guide.title} className="col-span-6 md:col-span-4">
                <Link href={guide.href} passHref>
                  <IconPanel {...guide} background={true} showLink={false} />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-6 py-12 border-b">
        <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0 [&_h3]:m-0">
          <h3 id="additional-resources" className="group scroll-mt-24">
            Additional resources
          </h3>
        </div>

        <ul className="grid grid-cols-12 gap-6 not-prose">
          {additionalResources.map((resource) => {
            return (
              <li key={resource.title} className="col-span-12 md:col-span-6 lg:col-span-3">
                <Link
                  href={resource.href}
                  className="col-span-12 md:col-span-6 lg:col-span-3"
                  passHref
                >
                  <GlassPanelWithIconPicker {...resource} background={false}>
                    {resource.description}
                  </GlassPanelWithIconPicker>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col lg:grid grid-cols-12 gap-6 py-12">
        <div className="col-span-4 flex flex-col gap-1 [&_h2]:m-0 [&_h3]:m-0">
          <div className="md:max-w-xs 2xl:max-w-none">
            <div className="flex items-center gap-3 mb-3 text-brand-600">
              <IconBackground>
                <MenuIconPicker icon="self-hosting" width={18} height={18} />
              </IconBackground>
              <h3 id="self-hosting" className="group scroll-mt-24">
                Self-Hosting
              </h3>
            </div>
            <p className="text-foreground-light text-sm">Get started with self-hosting Supabase.</p>
            <TextLink
              label="More on Self-Hosting"
              url="/guides/self-hosting"
              className="no-underline text-brand text-sm"
            />
          </div>
        </div>

        <div className="grid col-span-8 grid-cols-12 gap-6 not-prose">
          <ul className="col-span-full lg:col-span-8 grid grid-cols-12 gap-6">
            {selfHostingOptions.map((option) => {
              return (
                <li key={option.title} className="col-span-6">
                  <Link href={option.href} passHref>
                    <IconPanelWithIconPicker {...option} background={true} showLink={false} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  </HomeLayout>
)

export default HomePage
export { generateMetadata }
