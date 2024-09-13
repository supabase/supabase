import solutions from '~/data/Solutions'
import VideoWithHighlights from '~/components/VideoWithHighlights'

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
        icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
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
        panel: ({ isDark }: { isDark: boolean }) => (
          <VideoWithHighlights
            video={{
              title: 'Supabase dashboard table editor',
              sources: [
                {
                  src: `https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/website/supabase-table-editor${isDark ? '' : '-light'}`,
                  type: 'video/mp4',
                },
              ],
              poster: `/images/index/dashboard/supabase-table-editor${isDark ? '' : '-light'}.png`,
            }}
          />
        ),
        highlights: [
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
        ],
      },
      {
        label: 'SQL Editor',
        panel: ({ isDark }: { isDark: boolean }) => (
          <VideoWithHighlights
            video={{
              title: 'Supabase dashboard SQL editor',
              sources: [
                {
                  src: `https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/website/supabase-sql-editor${isDark ? '' : '-light'}`,
                  type: 'video/mp4',
                },
              ],
              poster: `/images/index/dashboard/supabase-sql-editor${isDark ? '' : '-light'}.png`,
            }}
          />
        ),
        highlights: [
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
        ],
      },
      {
        label: 'RLS Policies',
        panel: ({ isDark }: { isDark: boolean }) => (
          <VideoWithHighlights
            video={{
              title: 'Supabase dashboard Row Level Security',
              sources: [
                {
                  src: `https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/website/supabase-rls${isDark ? '' : '-light'}`,
                  type: 'video/mp4',
                },
              ],
              poster: `/images/index/dashboard/supabase-rls${isDark ? '' : '-light'}.png`,
            }}
          />
        ),
        highlights: [
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
        ],
      },
    ],
  },
}
