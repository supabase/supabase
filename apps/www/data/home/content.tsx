import solutions from '~/data/Solutions'
// import { frameworks } from '../frameworks'
import VideoWithHighlights from '~/components/VideoWithHighlights'
import { products } from 'shared-data'

export default {
  heroSection: {
    heading: (
      <>
        <span className="block text-[#F4FFFA00] bg-clip-text bg-gradient-to-b from-foreground to-foreground-light">
          Build in a weekend
        </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#3ECF8E] via-[#3ECF8E] to-[#3ecfb2] block md:ml-0">
          Scale to billions
        </span>
      </>
    ),
    subheading: (
      <>
        Supabase is an open source Firebase alternative. <br className="hidden md:block" />
        Start your project with a Postgres database, Authentication, instant APIs, Edge Functions,
        Realtime subscriptions, Storage, and Vector embeddings.
      </>
    ),
    image: '/images/index/gradient-bg.png',
    cta: {
      label: 'Start your project',
      link: 'https://app.supabase.com',
    },
    secondaryCta: {
      label: 'Documentation',
      link: '/docs',
    },
  },
  productsSection: {
    products: {
      ...solutions,
      'data-api': {
        name: 'Data APIs',
        icon: products.vector.icon[24],
        description: (
          <>
            Instant ready-to-use <strong>Restful APIs</strong>.
          </>
        ),
        description_short: 'Instant ready-to-use Restful APIs.',
        label: '',
        url: 'https://supabase.com/docs/guides/api',
      },
    },
  },
  dashboardFeatures: {
    title: (
      <>
        <span className="text-foreground">Stay productive and manage your app</span>
        <br className="hidden md:block" />
        without leaving the dashboard
      </>
    ),
    tabs: [
      {
        label: 'Table Editor',
        panel: () => (
          <VideoWithHighlights
            video={{
              title: 'Supabase dashboard table editor',
              sources: [
                {
                  src: 'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/website/supabase-table-editor.mp4',
                  type: 'video/mp4',
                },
              ],
              poster: '/images/index/dashboard/supabase-table-editor.png',
            }}
            highlights={[
              {
                label: 'Full CRUD',
                link: '/docs/guides/database/tables?queryGroups=database-method&database-method=sql&queryGroups=language&language=js',
              },
              {
                label: 'Materialized Views',
                link: '/docs/guides/database/tables?queryGroups=database-method&database-method=sql&queryGroups=language&language=js#materialized-views',
              },
              {
                label: 'Foreign Tables',
                link: '/docs/guides/database/tables?queryGroups=database-method&database-method=sql&queryGroups=language&language=js#joining-tables-with-foreign-keys',
              },
              { label: 'Partitioned Tables', link: '/docs/guides/database/partitions' },
              { label: 'Easy as a spreadsheet', link: '/docs/guides/database/overview#table-view' },
            ]}
          />
        ),
      },
      {
        label: 'SQL Editor',
        panel: () => (
          <VideoWithHighlights
            video={{
              title: 'Supabase dashboard SQL editor',
              sources: [
                {
                  src: 'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/website/supabase-sql-editor.mp4',
                  type: 'video/mp4',
                },
              ],
              poster: '/images/index/dashboard/supabase-sql-editor.png',
            }}
            highlights={[
              { label: 'AI SQL Editor', link: '/docs/guides/database/overview#the-sql-editor' },
              {
                label: 'Row Level Security',
                link: '/docs/guides/database/postgres/row-level-security',
              },
              {
                label: 'Save time using Templates',
                link: '/docs/guides/database/overview#the-sql-editor',
              },
              {
                label: 'Save and reuse Queries',
                link: '/docs/guides/database/overview#the-sql-editor',
              },
            ]}
          />
        ),
      },
      {
        label: 'RLS Policies',
        panel: () => (
          <VideoWithHighlights
            video={{
              title: 'Supabase dashboard Row Level Security',
              sources: [
                {
                  src: 'https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/website/supabase-rls.mp4',
                  type: 'video/mp4',
                },
              ],
              poster: '/images/index/dashboard/supabase-rls.png',
            }}
            highlights={[
              { label: 'Email Logins', link: '/docs/guides/auth/auth-email-passwordless' },
              {
                label: 'Magic Links',
                link: '/docs/guides/auth/auth-email-passwordless?queryGroups=language&language=js#with-magic-link',
              },
              {
                label: '20+ Third-party Logins',
                link: '/docs/guides/auth/social-login#set-up-a-social-provider-with-supabase-auth',
              },
              {
                label: 'Custom Access Policies via RLS',
                link: '/docs/guides/database/postgres/row-level-security',
              },
              {
                label: 'Password Recovery',
                link: '/docs/guides/auth/passwords?queryGroups=language&language=js#resetting-a-password',
              },
            ]}
          />
        ),
      },
    ],
  },
}
