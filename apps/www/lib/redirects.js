module.exports = [
  {
    permanent: true,
    source: '/brand-assets',
    destination: '/brand',
  },
  {
    permanent: true,
    source: '/images/customers/logos/light/:path*',
    destination: '/images/customers/logos/on-dark/:path*',
  },
  // Legacy root wordmarks moved to on-light/. Keep dreambase-mark.png at logos/ root.
  {
    permanent: true,
    source: '/images/customers/logos/:slug((?!dreambase-mark\\.png)[^/.]+).png',
    destination: '/images/customers/logos/on-light/:slug.png',
  },
  {
    permanent: true,
    source: '/blog/pricing',
    destination: '/pricing',
  },
  {
    permanent: true,
    source: '/blog/rss.xml',
    destination: '/rss.xml',
  },
  {
    permanent: true,
    source: '/blog/introducing-supabase-etl',
    destination: '/blog/introducing-supabase-pipelines',
  },
  {
    permanent: true,
    source: '/blog/supabase-etl',
    destination: '/blog/introducing-supabase-pipelines',
  },
  {
    permanent: true,
    source: '/blog/realtime-or-etl-how-to-choose-the-right-tool',
    destination: '/blog/realtime-or-pipelines-how-to-choose-the-right-tool',
  },
  {
    permanent: true,
    source: '/features/supabase-etl',
    destination: '/features/supabase-pipelines',
  },
  {
    permanent: true,
    source: '/go/supabase-pipelines-new-destinations',
    destination: '/docs/guides/database/replication#supported-destinations',
  },
  {
    permanent: true,
    source: '/go/supabase-pipelines-new-destinations/thank-you',
    destination: '/docs/guides/database/replication#supported-destinations',
  },
  {
    permanent: true,
    source: '/ui/docs/ai-editors-rules/prompts',
    destination: '/docs/guides/ai-tools/ai-skills',
  },
  {
    permanent: true,
    source: '/ui/docs/ai-editors-rules/skills',
    destination: '/docs/guides/ai-tools/ai-skills',
  },
  {
    permanent: true,
    source: '/ui',
    destination: '/library',
  },
  {
    permanent: true,
    source: '/ui/:path*',
    destination: '/library/:path*',
  },
  {
    permanent: true,
    source: '/auth/Auth',
    destination: '/auth',
  },
  {
    permanent: true,
    source: '/database/Database',
    destination: '/database',
  },
  {
    permanent: true,
    source: '/edge-functions/edge-functions',
    destination: '/edge-functions',
  },
  {
    permanent: true,
    source: '/storage/Storage',
    destination: '/storage',
  },
  {
    permanent: false,
    source: '/blog/2020/07/10/surviving-hacker-news',
    destination: '/blog/alpha-launch-postmortem',
  },
  { permanent: false, source: '/blog/page/:number', destination: '/blog' },
  { permanent: false, source: '/blog/tags', destination: '/blog' },
  {
    permanent: false,
    source: '/reference/postgres/connection-strings',
    destination: '/docs/guides/database/connecting-to-postgres',
  },
  {
    permanent: false,
    source: '/learn-more',
    destination: '/?utm_source=event&utm_medium=billboard&utm_campaign=aws-atlanta',
  },
  {
    permanent: true,
    source: '/join',
    destination: 'https://supabase.com/',
  },
  {
    permanent: true,
    source: '/blog/supavisor-postgres-connection-pooler-ga',
    destination: '/blog/supavisor-postgres-connection-pooler',
  },
  {
    permanent: true,
    source: '/blog/2022/06/15/blog/2022/06/29/visualizing-supabase-data-using-metabase',
    destination: '/blog/visualizing-supabase-data-using-metabase',
  },
  {
    permanent: true,
    source: '/_app',
    destination: 'https://supabase.com/dashboard',
  },
  {
    permanent: true,
    source: '/blog/2020/05/01/supabase-alpha-april-2020',
    destination: '/blog/supabase-alpha-april-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/06/01/supabase-alpha-may-2020',
    destination: '/blog/supabase-alpha-may-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/06/15/supabase-steve-chavez',
    destination: '/blog/supabase-steve-chavez',
  },
  {
    permanent: true,
    source: '/blog/2020/07/01/supabase-alpha-june-2020',
    destination: '/blog/supabase-alpha-june-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/07/09/postgresql-templates',
    destination: '/blog/postgresql-templates',
  },
  {
    permanent: true,
    source: '/blog/2020/07/10/alpha-launch-postmortem',
    destination: '/blog/alpha-launch-postmortem',
  },
  {
    permanent: true,
    source: '/blog/2020/07/17/postgresql-physical-logical-backups',
    destination: '/blog/postgresql-physical-logical-backups',
  },
  {
    permanent: true,
    source: '/blog/2020/08/02/continuous-postgresql-backup-walg',
    destination: '/blog/continuous-postgresql-backup-walg',
  },
  {
    permanent: true,
    source: '/blog/2020/08/02/supabase-alpha-july-2020',
    destination: '/blog/supabase-alpha-july-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/08/05/supabase-auth',
    destination: '/blog/supabase-auth',
  },
  {
    permanent: true,
    source: '/blog/2020/09/03/supabase-alpha-august-2020',
    destination: '/blog/supabase-alpha-august-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/09/11/supabase-hacktoberfest-2020',
    destination: '/blog/supabase-hacktoberfest-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/10/03/supabase-alpha-september-2020',
    destination: '/blog/supabase-alpha-september-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/10/30/improved-dx',
    destination: '/blog/improved-dx',
  },
  {
    permanent: true,
    source: '/blog/2020/11/02/supabase-alpha-october-2020',
    destination: '/blog/supabase-alpha-october-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/11/18/postgresql-views',
    destination: '/blog/postgresql-views',
  },
  {
    permanent: true,
    source: '/blog/2020/12/01/supabase-alpha-november-2020',
    destination: '/blog/supabase-alpha-november-2020',
  },
  {
    permanent: true,
    source: '/blog/2020/12/02/case-study-monitoro',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/2020/12/02/case-study-tayfa',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/2020/12/02/case-study-xendit',
    destination: '/customers/xendit',
  },
  {
    permanent: true,
    source: '/blog/2020/12/02/supabase-striveschool',
    destination: '/blog/supabase-striveschool',
  },
  {
    permanent: true,
    source: '/blog/2020/12/13/supabase-dashboard-performance',
    destination: '/blog/supabase-dashboard-performance',
  },
  {
    permanent: true,
    source: '/blog/2021/01/02/supabase-beta-december-2020',
    destination: '/blog/supabase-beta-december-2020',
  },
  {
    permanent: true,
    source: '/blog/2021/02/02/supabase-beta-january-2021',
    destination: '/blog/supabase-beta-january-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/02/27/cracking-postgres-interview',
    destination: '/blog/cracking-postgres-interview',
  },
  {
    permanent: true,
    source: '/blog/2021/03/02/supabase-beta-february-2021',
    destination: '/blog/supabase-beta-february-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/03/05/postgres-as-a-cron-server',
    destination: '/blog/postgres-as-a-cron-server',
  },
  {
    permanent: true,
    source: '/blog/2021/03/08/toad-a-link-shortener-with-simple-apis-for-low-coders',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/2021/03/11/using-supabase-replit',
    destination: '/blog/using-supabase-replit',
  },
  {
    permanent: true,
    source: '/blog/2021/03/22/In-The-Loop',
    destination: '/blog/In-The-Loop',
  },
  {
    permanent: true,
    source: '/blog/2021/03/25/angels-of-supabase',
    destination: '/blog/angels-of-supabase',
  },
  {
    permanent: true,
    source: '/blog/2021/03/25/launch-week',
    destination: '/blog/launch-week',
  },
  {
    permanent: true,
    source: '/blog/2021/03/29/pricing',
    destination: '/pricing',
  },
  {
    permanent: true,
    source: '/blog/2021/03/30/supabase-storage',
    destination: '/blog/supabase-storage',
  },
  {
    permanent: true,
    source: '/blog/2021/03/31/supabase-cli',
    destination: '/blog/supabase-cli',
  },
  {
    permanent: true,
    source: '/blog/2021/04/01/supabase-nft-marketplace',
    destination: '/blog/supabase-nft-marketplace',
  },
  {
    permanent: true,
    source: '/blog/2021/04/02/supabase-dot-com',
    destination: '/blog/supabase-dot-com',
  },
  {
    permanent: true,
    source: '/blog/2021/04/02/supabase-pgbouncer',
    destination: '/blog/supabase-pgbouncer',
  },
  {
    permanent: true,
    source: '/blog/2021/04/02/supabase-workflows',
    destination: '/blog/supabase-workflows',
  },
  {
    permanent: true,
    source: '/blog/2021/04/06/supabase-beta-march-2021',
    destination: '/blog/supabase-beta-march-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/05/03/supabase-beta-april-2021',
    destination: '/blog/supabase-beta-april-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/06/02/supabase-beta-may-2021',
    destination: '/blog/supabase-beta-may-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/07/01/roles-postgres-hooks',
    destination: '/blog/roles-postgres-hooks',
  },
  {
    permanent: true,
    source: '/blog/2021/07/02/supabase-beta-june-2021',
    destination: '/blog/supabase-beta-june-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/07/22/supabase-launch-week-sql',
    destination: '/blog/supabase-launch-week-sql',
  },
  {
    permanent: true,
    source: '/blog/2021/07/26/epsilon3-self-hosting',
    destination: '/customers/epsilon3',
  },
  {
    permanent: true,
    source: '/blog/2021/07/26/supabase-community-day',
    destination: '/blog/supabase-community-day',
  },
  {
    permanent: true,
    source: '/blog/2021/07/26/supabase-postgres-13',
    destination: '/blog/supabase-postgres-13',
  },
  {
    permanent: true,
    source: '/blog/2021/07/27/spot-flutter-with-postgres',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/2021/07/27/storage-beta',
    destination: '/blog/storage-beta',
  },
  {
    permanent: true,
    source: '/blog/2021/07/28/mobbin-supabase-200000-users',
    destination: '/customers/mobbin',
  },
  {
    permanent: true,
    source: '/blog/2021/07/28/supabase-auth-passwordless-sms-login',
    destination: '/blog/supabase-auth-passwordless-sms-login',
  },
  {
    permanent: true,
    source: '/blog/2021/07/29/supabase-reports-and-metrics',
    destination: '/blog/supabase-reports-and-metrics',
  },
  {
    permanent: true,
    source: '/blog/2021/07/30/1-the-supabase-hackathon',
    destination: '/blog/the-supabase-hackathon',
  },
  {
    permanent: true,
    source: '/blog/2021/07/30/supabase-functions-updates',
    destination: '/blog/supabase-functions-updates',
  },
  {
    permanent: true,
    source: '/blog/2021/07/30/supabase-swag-store',
    destination: '/blog/supabase-swag-store',
  },
  {
    permanent: true,
    source: '/blog/2021/08/09/hackathon-winners',
    destination: '/blog/hackathon-winners',
  },
  {
    permanent: true,
    source: '/blog/2021/08/12/supabase-beta-july-2021',
    destination: '/blog/supabase-beta-july-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/09/10/supabase-beta-august-2021',
    destination: '/blog/supabase-beta-august-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/09/28/supabase-hacktoberfest-hackathon-2021',
    destination: '/blog/supabase-hacktoberfest-hackathon-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/10/04/supabase-beta-sept-2021',
    destination: '/blog/supabase-beta-sept-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/10/14/hacktoberfest-hackathon-winners-2021',
    destination: '/blog/hacktoberfest-hackathon-winners-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/10/19/replenysh-time-to-value-in-less-than-24-hours',
    destination: '/customers/replenysh',
  },
  {
    permanent: true,
    source: '/blog/2021/10/28/supabase-series-a',
    destination: '/blog/supabase-series-a',
  },
  {
    permanent: true,
    source: '/blog/2021/11/05/supabase-beta-october-2021',
    destination: '/blog/supabase-beta-october-2021',
  },
  {
    permanent: true,
    source: '/blog/2021/11/26/supabase-how-we-launch',
    destination: '/blog/supabase-how-we-launch',
  },
  {
    permanent: true,
    source: '/blog/2021/11/26/supabase-launch-week-the-trilogy',
    destination: '/blog/supabase-launch-week-the-trilogy',
  },
  {
    permanent: true,
    source: '/blog/2021/11/28/postgrest-9',
    destination: '/blog/postgrest-9',
  },
  {
    permanent: true,
    source: '/blog/2021/11/28/whats-new-in-postgres-14',
    destination: '/blog/whats-new-in-postgres-14',
  },
  {
    permanent: true,
    source: '/blog/2021/11/29/community-day-lw3',
    destination: '/blog/community-day-lw3',
  },
  {
    permanent: true,
    source: '/blog/2021/11/30/supabase-studio',
    destination: '/blog/supabase-studio',
  },
  {
    permanent: true,
    source: '/blog/2021/12/01/realtime-row-level-security-in-postgresql',
    destination: '/blog/realtime-row-level-security-in-postgresql',
  },
  {
    permanent: true,
    source: '/blog/2021/12/02/supabase-acquires-logflare',
    destination: '/blog/supabase-acquires-logflare',
  },
  {
    permanent: true,
    source: '/blog/2021/12/03/launch-week-three-friday-five-more-things',
    destination: '/blog/launch-week-three-friday-five-more-things',
  },
  {
    permanent: true,
    source: '/blog/2021/12/03/pg-graphql',
    destination: '/blog/pg-graphql',
  },
  {
    permanent: true,
    source: '/blog/2021/12/03/supabase-holiday-hackdays-hackathon',
    destination: '/blog/supabase-holiday-hackdays-hackathon',
  },
  {
    permanent: true,
    source: '/blog/2021/12/15/beta-november-2021-launch-week-recap',
    destination: '/blog/beta-november-2021-launch-week-recap',
  },
  {
    permanent: true,
    source: '/blog/2021/12/17/holiday-hackdays-winners-2021',
    destination: '/blog/holiday-hackdays-winners-2021',
  },
  {
    permanent: true,
    source: '/blog/2022/01/20/product-hunt-golden-kitty-awards-2021',
    destination: '/blog/product-hunt-golden-kitty-awards-2021',
  },
  {
    permanent: true,
    source: '/blog/2022/01/20/supabase-beta-december-2021',
    destination: '/blog/supabase-beta-december-2021',
  },
  {
    permanent: true,
    source: '/blog/2022/02/22/supabase-beta-january-2022',
    destination: '/blog/supabase-beta-january-2022',
  },
  {
    permanent: true,
    source: '/blog/audit',
    destination: '/blog/postgres-audit',
  },
  {
    permanent: true,
    source: '/blog/2022/03/08/audit',
    destination: '/blog/postgres-audit',
  },
  {
    permanent: true,
    source: '/blog/2022/03/25/should-i-open-source-my-company',
    destination: '/blog/should-i-open-source-my-company',
  },
  {
    permanent: true,
    source: '/blog/2022/03/25/supabase-launch-week-four',
    destination: '/blog/supabase-launch-week-four',
  },
  {
    permanent: true,
    source: '/blog/2022/03/28/community-day-lw4',
    destination: '/blog/community-day-lw4',
  },
  {
    permanent: true,
    source: '/blog/2022/03/29/graphql-now-available',
    destination: '/blog/graphql-now-available',
  },
  {
    permanent: true,
    source: '/blog/2022/03/30/supabase-enterprise',
    destination: '/blog/supabase-enterprise',
  },
  {
    permanent: true,
    source: '/blog/2022/03/31/supabase-edge-functions',
    destination: '/blog/supabase-edge-functions',
  },
  {
    permanent: true,
    source: '/blog/2022/04/01/hackathon-bring-the-func',
    destination: '/blog/hackathon-bring-the-func',
  },
  {
    permanent: true,
    source: '/blog/2022/04/01/supabase-realtime-with-multiplayer-features',
    destination: '/blog/supabase-realtime-with-multiplayer-features',
  },
  {
    permanent: true,
    source: '/blog/2022/04/01/supabrew',
    destination: '/blog/supabrew',
  },
  {
    permanent: true,
    source: '/blog/2022/04/15/beta-update-march-2022',
    destination: '/blog/beta-update-march-2022',
  },
  {
    permanent: true,
    source: '/blog/2022/04/18/bring-the-func-hackathon-winners',
    destination: '/blog/bring-the-func-hackathon-winners',
  },
  {
    permanent: true,
    source: '/blog/2022/04/20/partner-gallery-works-with-supabase',
    destination: '/blog/partner-gallery-works-with-supabase',
  },
  {
    permanent: true,
    source: '/blog/2022/05/26/how-supabase-accelerates-development-of-all-pull-together',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/2022/06/07/beta-update-may-2022',
    destination: '/blog/beta-update-may-2022',
  },
  {
    permanent: true,
    source: '/blog/2022/06/15/loading-data-supabase-python',
    destination: '/blog/loading-data-supabase-python',
  },
  {
    permanent: true,
    source: '/blog/2022/06/28/partial-postgresql-data-dumps-with-rls',
    destination: '/blog/partial-postgresql-data-dumps-with-rls',
  },
  {
    permanent: true,
    source: '/blog/2022/06/29/visualizing-supabase-data-using-metabase',
    destination: '/blog/visualizing-supabase-data-using-metabase',
  },
  {
    permanent: true,
    source: '/blog/2022/06/30/flutter-tutorial-building-a-chat-app',
    destination: '/blog/flutter-tutorial-building-a-chat-app',
  },
  {
    permanent: true,
    source: '/blog/2022/07/05/beta-update-june-2022',
    destination: '/blog/beta-update-june-2022',
  },
  {
    permanent: true,
    source: '/blog/2022/07/13/supabase-auth-helpers-with-sveltekit-support',
    destination: '/blog/supabase-auth-helpers-with-sveltekit-support',
  },
  {
    permanent: true,
    source: '/blog/2022/07/18/seen-by-in-postgresql',
    destination: '/blog/seen-by-in-postgresql',
  },
  {
    permanent: true,
    source: '/blog/2022/08/02/supabase-flutter-sdk-1-developer-preview',
    destination: '/blog/supabase-flutter-sdk-1-developer-preview',
  },
  {
    permanent: true,
    source: '/blog/2022/08/03/supabase-beta-update-july-2022',
    destination: '/blog/supabase-beta-update-july-2022',
  },
  {
    permanent: true,
    source: '/blog/supabase-aquires-oriole',
    destination: '/blog/supabase-acquires-oriole',
  },
  {
    permanent: true,
    source: '/events/scale-to-billions-generative-ai-humata',
    destination: '/events/scale-to-millions-generative-ai-humata',
  },
  {
    permanent: true,
    source: '/sign-in',
    destination: 'https://supabase.com/dashboard/sign-in',
  },
  {
    permanent: true,
    source: '/login',
    destination: 'https://supabase.com/dashboard/sign-in',
  },
  {
    permanent: true,
    source: '/sign-up',
    destination: 'https://supabase.com/dashboard/sign-up',
  },
  {
    permanent: true,
    source: '/forgot-password',
    destination: 'https://supabase.com/dashboard/forgot-password',
  },
  {
    permanent: true,
    source: '/projects',
    destination: 'https://supabase.com/dashboard/projects',
  },
  {
    permanent: true,
    source: '/support/new',
    destination: 'https://supabase.com/dashboard/support/new',
  },
  {
    permanent: true,
    source: '/account/tokens',
    destination: 'https://supabase.com/dashboard/account/tokens',
  },
  {
    permanent: true,
    source: '/project/:path+',
    destination: 'https://supabase.com/dashboard/project/:path+',
  },
  {
    permanent: true,
    source: '/oss',
    destination: '/open-source',
  },
  {
    permanent: true,
    source: '/privacy-260316',
    destination: '/privacy?version=v2',
  },
  {
    permanent: true,
    source: '/privacy-250528',
    destination: '/privacy?version=v1',
  },
  {
    permanent: true,
    source: '/legal/dpa',
    destination: '/legal/customer-resources/data-processing-addendum',
  },
  {
    permanent: true,
    source: '/supasquad',
    destination: '/open-source/contributing/supasquad',
  },
  {
    permanent: true,
    source: '/contact/enterprise',
    destination: 'https://forms.supabase.com/enterprise',
  },
  {
    permanent: true,
    source: '/enterprise',
    destination: '/solutions/enterprise',
  },
  {
    permanent: true,
    source: '/legal/soc2',
    destination: 'https://forms.supabase.com/soc2',
  },
  // old case studies moved to /customers
  {
    permanent: true,
    source: '/blog/tags/case-study',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/case-study-monitoro',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/case-study-tayfa',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/case-study-xendit',
    destination: '/customers/xendit',
  },
  {
    permanent: true,
    source: '/blog/toad-a-link-shortener-with-simple-apis-for-low-coders',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/epsilon3-self-hosting',
    destination: '/customers/epsilon3',
  },
  {
    permanent: true,
    source: '/blog/spot-flutter-with-postgres',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/mobbin-supabase-200000-users',
    destination: '/customers/mobbin',
  },
  {
    permanent: true,
    source: '/blog/replenysh-time-to-value-in-less-than-24-hours',
    destination: '/customers/replenysh',
  },
  {
    permanent: true,
    source: '/blog/how-supabase-accelerates-development-of-all-pull-together',
    destination: '/customers',
  },
  {
    permanent: true,
    source: '/blog/case-study-happyteams',
    destination: '/customers/happyteams',
  },
  {
    permanent: true,
    source: '/customers/mendableai',
    destination: '/customers/firecrawl',
  },
  {
    permanent: true,
    source: '/customers/lingo-dev',
    destination: '/customers/lingodotdev',
  },
  {
    permanent: true,
    source: '/blog/flutter-authentication-and-authorization-with-rls',
    destination: '/blog/flutter-authorization-with-rls',
  },
  // /partners/integrations → /partners/catalog redirects
  // Wrapper listing slugs → clean partner slugs (open the matching listing tab)
  {
    permanent: true,
    source: '/partners/catalog/bigquery-wrapper',
    destination: '/partners/catalog/bigquery?tab=bigquery-wrapper',
  },
  {
    permanent: true,
    source: '/partners/catalog/firebase-wrapper',
    destination: '/partners/catalog/firebase?tab=firebase-wrapper',
  },
  {
    permanent: true,
    source: '/partners/catalog/stripe-wrapper',
    destination: '/partners/catalog/stripe?tab=stripe-wrapper',
  },
  {
    permanent: true,
    source: '/partners/catalog/aikido-security',
    destination: '/partners/catalog/aikido',
  },
  {
    permanent: true,
    source: '/partners/catalog/cloudflare-workers',
    destination: '/partners/catalog/cloudflare',
  },
  {
    permanent: true,
    source: '/partners/catalog/clickhouse-clickpipes',
    destination: '/partners/catalog/clickhouse',
  },
  {
    permanent: true,
    source: '/partners/integrations',
    destination: '/partners/catalog',
  },
  {
    permanent: true,
    source: '/partners/integrations/atomic_crm',
    destination: '/partners/catalog',
  },
  {
    permanent: true,
    source: '/partners/integrations/cloudflare-workers',
    destination: '/partners/catalog/cloudflare',
  },
  {
    permanent: true,
    source: '/partners/integrations/clickhouse-clickpipes',
    destination: '/partners/catalog/clickhouse',
  },
  {
    permanent: true,
    source: '/partners/integrations/refine_dev',
    destination: '/partners/catalog/refine',
  },
  {
    permanent: true,
    source: '/partners/integrations/supabase_wrapper_bigquery',
    destination: '/partners/catalog/bigquery?tab=bigquery-wrapper',
  },
  {
    permanent: true,
    source: '/partners/integrations/supabase_wrapper_firebase',
    destination: '/partners/catalog/firebase?tab=firebase-wrapper',
  },
  {
    permanent: true,
    source: '/partners/integrations/supabase_wrapper_stripe',
    destination: '/partners/catalog/stripe?tab=stripe-wrapper',
  },
  // toddle.dev pivoted to nordcraft
  {
    permanent: true,
    source: '/partners/integrations/toddle',
    destination: '/partners/catalog/nordcraft',
  },
  // Catch-all: any other /partners/integrations/<slug> not covered by a specific rule above.
  // Must come after all specific /partners/integrations/* rules
  {
    permanent: true,
    source: '/partners/integrations/:slug*',
    destination: '/partners/catalog/:slug*',
  },
  {
    permanent: true,
    source: '/blog/pgvector-v0-5-0-hnsw',
    destination: '/blog/increase-performance-pgvector-hnsw',
  },
  {
    permanent: true,
    source: '/blog/supabase-ai-content-storm',
    destination: 'https://dev.to/supabase/ai-ignites-the-rain-content-storm-is-back-kdl',
  },
  {
    permanent: true,
    source: '/contact/mfa',
    destination: '/docs/guides/auth/auth-mfa',
  },
  {
    permanent: false,
    source: '/special-announcement',
    destination: '/ga-week',
  },
  {
    permanent: false,
    source: '/special-announcement/tickets/:path*',
    destination: '/ga-week/tickets/:path*',
  },
  {
    permanent: true,
    source: '/launchweek',
    destination: '/launch-week',
  },
  {
    permanent: true,
    source: '/launch-week/6',
    destination: '/blog/launch-week-6-wrap-up',
  },
  {
    permanent: true,
    source: '/launch-week/x',
    destination: '/blog/launch-week-x-best-launches',
  },
  {
    permanent: true,
    source: '/launch-week/12',
    destination: '/blog/launch-week-12-top-10',
  },
  {
    permanent: true,
    source: '/launch-week/13',
    destination: '/blog/launch-week-13-top-10',
  },
  {
    permanent: true,
    source: '/launch-week/14',
    destination: '/blog/launch-week-14-top-10',
  },
  {
    permanent: true,
    source: '/partners/experts',
    destination: '/partners',
  },
  {
    permanent: true,
    source: '/partners/experts/:path*',
    destination: '/partners',
  },
  {
    permanent: false,
    source: '/mcp',
    destination: '/docs/guides/ai-tools/mcp',
  },
  // marketing
  {
    permanent: true,
    source: '/changelogpod',
    destination: 'https://forms.supabase.com/changelog-podcast-sponsorship',
  },
  // features
  {
    permanent: true,
    source: '/features/social-login',
    destination: '/features/social-sign-in',
  },
  {
    permanent: true,
    source: '/features/ai-query-assistance',
    destination: '/features/ai-assistant',
  },
  {
    permanent: true,
    source: '/features/fly-postgres',
    destination: '/features/postgres-database',
  },
  // design
  {
    permanent: true,
    source: '/:path*',
    has: [
      {
        type: 'host',
        value: 'supabase.design',
      },
    ],
    destination: 'https://supabase.com/design-system/:path*',
  },
  {
    permanent: true,
    source: '/design',
    destination: '/design-system',
  },
  {
    source: '/redeem',
    has: [
      {
        type: 'query',
        key: 'code',
      },
    ],
    destination: '/dashboard/redeem?code=:code',
    permanent: false,
  },
  { permanent: true, source: '/signup', destination: '/dashboard/sign-up' },
  { permanent: true, source: '/about', destination: '/company' },
  { permanent: true, source: '/startups', destination: '/solutions/startups' },
  {
    permanent: true,
    source: '/legal/subprocessors',
    destination: '/legal/customer-resources/subprocessor-list',
  },
  {
    permanent: true,
    source: '/downloads/docs/Supabase\\+DPA\\+:version.pdf',
    destination: '/legal/customer-resources/data-processing-addendum',
  },
  // Legacy product .txt URLs → new .md routes
  { permanent: true, source: '/llms/homepage.txt', destination: '/index.md' },
  { permanent: true, source: '/llms/auth.txt', destination: '/auth.md' },
  { permanent: true, source: '/llms/database.txt', destination: '/database.md' },
  { permanent: true, source: '/llms/edge-functions.txt', destination: '/edge-functions.md' },
  { permanent: true, source: '/llms/realtime.txt', destination: '/realtime.md' },
  { permanent: true, source: '/llms/storage.txt', destination: '/storage.md' },
  { permanent: true, source: '/llms/vector.txt', destination: '/modules/vector.md' },
  { permanent: true, source: '/llms/pricing.txt', destination: '/pricing.md' },
  { permanent: true, source: '/vector.md', destination: '/modules/vector.md' },
  { permanent: true, source: '/homepage.md', destination: '/index.md' },
  { permanent: true, source: '/.md', destination: '/index.md' },
  { permanent: true, source: '/kb.md', destination: '/kb/sitemap.md' },
  { permanent: true, source: '/index', destination: '/' },
  {
    permanent: true,
    source: '/changelog/29260-upcoming-changes-to-supabase-api-keys',
    destination: 'https://github.com/orgs/supabase/discussions/29260',
  },
  {
    permanent: true,
    source: '/changelog/45329',
    destination:
      '/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically',
  },
  {
    permanent: true,
    source: '/changelog/48235-migration-of-supabase-management-api-logs-all-endpoint',
    destination:
      '/changelog/48235-migration-of-supabase-management-api-logs-all-analytics-endpoint-to-logs-endpoint',
  },
  {
    permanent: true,
    source: '/changelog/rss.xml',
    destination: '/changelog-rss.xml',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/sso/enterprise-mcp-authentication',
    destination: '/docs/guides/platform/sso/enterprise-mcp-authorization',
  },
]
