module.exports = [
  {
    permanent: true,
    source: '/auth/Auth',
    destination: '/auth',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/compute-add-ons',
    destination: '/docs/guides/platform/compute-and-disk',
  },
  {
    permanent: true,
    source: '/docs/guides/storage-caching',
    destination: '/docs/guides/storage/cdn/fundamentals',
  },
  {
    permanent: true,
    source: '/docs/guides/storage/cdn',
    destination: '/docs/guides/storage/cdn/fundamentals',
  },
  {
    permanent: true,
    source: '/docs/guides/storage/uploads',
    destination: '/docs/guides/storage/uploads/standard-uploads',
  },
  {
    permanent: true,
    source: '/docs/guides/storage/image-transformations',
    destination: '/docs/guides/storage/serving/image-transformations',
  },
  {
    permanent: true,
    source: '/docs/guides/storage/access-control',
    destination: 'docs/guides/storage/security/access-control',
  },
  {
    permanent: true,
    source: '/database/Database',
    destination: '/database',
  },
  {
    permanent: true,
    source: '/docs/guides/database/column-encryption',
    destination: '/docs/guides/database/extensions/pgsodium',
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
    permanent: true,
    source: '/docs/guides/reports/:match*',
    destination: '/docs/guides/observability/:match*',
  },
  {
    permanent: false,
    source: '/blog/2021/03/08/toad-a-link-shorterner-with-simple-apis-for-low-coders',
    destination: '/blog/2021/03/08/toad-a-link-shortener-with-simple-apis-for-low-coders',
  },
  {
    permanent: false,
    source: '/blog/2020/07/10/surviving-hacker-news',
    destination: '/blog/2020/07/10/alpha-launch-postmortem',
  },
  {
    permanent: false,
    source: '/docs/common/_CommonResponses',
    destination: '/docs',
  },
  { permanent: false, source: '/docs/common/_DummyData', destination: '/docs' },
  { permanent: false, source: '/docs/common/_FromFunction', destination: '/docs' },
  {
    permanent: false,
    source: '/docs/common/filters/_adj',
    destination: '/docs/reference/javascript/rangeAdjacent',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_cd',
    destination: '/docs/reference/javascript/containedBy',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_cs',
    destination: '/docs/reference/javascript/contains',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_eq',
    destination: '/docs/reference/javascript/eq',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_filter',
    destination: '/docs/reference/javascript/filter',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_gt',
    destination: '/docs/reference/javascript/gt',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_gte',
    destination: '/docs/reference/javascript/gte',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_ilike',
    destination: '/docs/reference/javascript/ilike',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_in',
    destination: '/docs/reference/javascript/in',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_is',
    destination: '/docs/reference/javascript/is',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_like',
    destination: '/docs/reference/javascript/like',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_lt',
    destination: '/docs/reference/javascript/lt',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_lte',
    destination: '/docs/reference/javascript/lte',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_match',
    destination: '/docs/reference/javascript/match',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_neq',
    destination: '/docs/reference/javascript/neq',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_not',
    destination: '/docs/reference/javascript/not',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_nxl',
    destination: '/docs/reference/javascript/rangeGte',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_nxr',
    destination: '/docs/reference/javascript/rangeLte',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_or',
    destination: '/docs/reference/javascript/or',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_ova',
    destination: '/docs/reference/javascript/overlaps',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_ovr',
    destination: '/docs/reference/javascript/overlaps',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_sl',
    destination: '/docs/reference/javascript/rangeLt',
  },
  {
    permanent: false,
    source: '/docs/common/filters/_sr',
    destination: '/docs/reference/javascript/rangeGt',
  },
  {
    permanent: false,
    source: '/docs/library/authentication',
    destination: '/docs/guides/auth',
  },
  {
    permanent: false,
    source: '/docs/library/delete',
    destination: '/docs/reference/javascript/delete',
  },
  {
    permanent: false,
    source: '/docs/library/get',
    destination: '/docs/reference/javascript/select',
  },
  {
    permanent: false,
    source: '/docs/library/getting-started',
    destination: '/docs/reference/javascript/supabase-client',
  },
  {
    permanent: false,
    source: '/docs/library/patch',
    destination: '/docs/reference/javascript/update',
  },
  {
    permanent: false,
    source: '/docs/library/post',
    destination: '/docs/reference/javascript/insert',
  },
  {
    permanent: false,
    source: '/docs/library/stored-procedures',
    destination: '/docs/reference/javascript/rpc',
  },
  {
    permanent: false,
    source: '/docs/library/subscribe',
    destination: '/docs/reference/javascript/subscribe',
  },
  {
    permanent: false,
    source: '/docs/library/user-management',
    destination: '/docs/guides/auth',
  },
  {
    permanent: false,
    source: '/docs/postgres/postgres-intro',
    destination: '/docs/postgres/server/about',
  },
  {
    permanent: false,
    source: '/docs/realtime/about',
    destination: '/docs/realtime/server/about',
  },
  { permanent: false, source: '/docs/realtime/aws', destination: '/docs/postgres/server/aws' },
  {
    permanent: false,
    source: '/docs/realtime/digitalocean',
    destination: '/docs/postgres/server/digitalocean',
  },
  {
    permanent: false,
    source: '/docs/realtime/docker',
    destination: '/docs/postgres/server/docker',
  },
  {
    permanent: false,
    source: '/docs/realtime/source',
    destination: '/docs/postgres/server/about',
  },
  {
    permanent: false,
    source: '/docs/client/supabase-client',
    destination: '/docs/reference/javascript/supabase-client',
  },
  {
    permanent: false,
    source: '/docs/client/installing',
    destination: '/docs/reference/javascript/installing',
  },
  {
    permanent: false,
    source: '/docs/client/initializing',
    destination: '/docs/reference/javascript/initializing',
  },
  {
    permanent: false,
    source: '/docs/client/generating-types',
    destination: '/docs/reference/javascript/generating-types',
  },
  {
    permanent: false,
    source: '/docs/client/auth-signup',
    destination: '/docs/reference/javascript/auth-signup',
  },
  {
    permanent: false,
    source: '/docs/client/auth-signin',
    destination: '/docs/reference/javascript/v1/auth-signin',
  },
  {
    permanent: false,
    source: '/docs/client/auth-signout',
    destination: '/docs/reference/javascript/auth-signout',
  },
  {
    permanent: false,
    source: '/docs/client/auth-verifyotp',
    destination: '/docs/reference/javascript/auth-verifyotp',
  },
  {
    permanent: false,
    source: '/docs/client/auth-session',
    destination: '/docs/reference/javascript/v1/auth-session',
  },
  {
    permanent: false,
    source: '/docs/client/auth-user',
    destination: '/docs/reference/javascript/auth-user',
  },
  {
    permanent: false,
    source: '/docs/client/auth-update',
    destination: '/docs/reference/javascript/auth-update',
  },
  {
    permanent: false,
    source: '/docs/client/auth-onauthstatechange',
    destination: '/docs/reference/javascript/auth-onauthstatechange',
  },
  {
    permanent: false,
    source: '/docs/client/reset-password-email',
    destination: '/docs/reference/javascript/reset-password-email',
  },
  {
    permanent: false,
    source: '/docs/client/select',
    destination: '/docs/reference/javascript/select',
  },
  {
    permanent: false,
    source: '/docs/client/insert',
    destination: '/docs/reference/javascript/insert',
  },
  {
    permanent: false,
    source: '/docs/client/update',
    destination: '/docs/reference/javascript/update',
  },
  {
    permanent: false,
    source: '/docs/client/delete',
    destination: '/docs/reference/javascript/delete',
  },
  {
    permanent: false,
    source: '/docs/client/rpc',
    destination: '/docs/reference/javascript/rpc',
  },
  {
    permanent: false,
    source: '/docs/client/subscribe',
    destination: '/docs/reference/javascript/subscribe',
  },
  {
    permanent: false,
    source: '/docs/client/removesubscription',
    destination: '/docs/reference/javascript/v1/removesubscription',
  },
  {
    permanent: false,
    source: '/docs/client/getsubscriptions',
    destination: '/docs/reference/javascript/v1/getsubscriptions',
  },
  {
    permanent: false,
    source: '/docs/client/using-modifiers',
    destination: '/docs/reference/javascript/using-modifiers',
  },
  {
    permanent: false,
    source: '/docs/client/limit',
    destination: '/docs/reference/javascript/limit',
  },
  {
    permanent: false,
    source: '/docs/client/order',
    destination: '/docs/reference/javascript/order',
  },
  {
    permanent: false,
    source: '/docs/client/range',
    destination: '/docs/reference/javascript/range',
  },
  {
    permanent: false,
    source: '/docs/client/single',
    destination: '/docs/reference/javascript/single',
  },
  {
    permanent: false,
    source: '/docs/client/using-filters',
    destination: '/docs/reference/javascript/using-filters',
  },
  {
    permanent: false,
    source: '/docs/client/filter',
    destination: '/docs/reference/javascript/filter',
  },
  { permanent: false, source: '/docs/client/or', destination: '/docs/reference/javascript/or' },
  {
    permanent: false,
    source: '/docs/client/not',
    destination: '/docs/reference/javascript/not',
  },
  {
    permanent: false,
    source: '/docs/client/match',
    destination: '/docs/reference/javascript/match',
  },
  { permanent: false, source: '/docs/client/eq', destination: '/docs/reference/javascript/eq' },
  {
    permanent: false,
    source: '/docs/client/neq',
    destination: '/docs/reference/javascript/neq',
  },
  { permanent: false, source: '/docs/client/gt', destination: '/docs/reference/javascript/gt' },
  {
    permanent: false,
    source: '/docs/client/gte',
    destination: '/docs/reference/javascript/gte',
  },
  { permanent: false, source: '/docs/client/lt', destination: '/docs/reference/javascript/lt' },
  {
    permanent: false,
    source: '/docs/client/lte',
    destination: '/docs/reference/javascript/lte',
  },
  {
    permanent: false,
    source: '/docs/client/like',
    destination: '/docs/reference/javascript/like',
  },
  {
    permanent: false,
    source: '/docs/client/ilike',
    destination: '/docs/reference/javascript/ilike',
  },
  { permanent: false, source: '/docs/client/is', destination: '/docs/reference/javascript/is' },
  { permanent: false, source: '/docs/client/in', destination: '/docs/reference/javascript/in' },
  {
    permanent: false,
    source: '/docs/client/gte',
    destination: '/docs/reference/javascript/gte',
  },
  {
    permanent: false,
    source: '/docs/client/cs',
    destination: '/docs/reference/javascript/contains',
  },
  {
    permanent: false,
    source: '/docs/client/cd',
    destination: '/docs/reference/javascript/containedBy',
  },
  {
    permanent: false,
    source: '/docs/client/sl',
    destination: '/docs/reference/javascript/rangeLt',
  },
  {
    permanent: false,
    source: '/docs/client/sr',
    destination: '/docs/reference/javascript/rangeGt',
  },
  {
    permanent: false,
    source: '/docs/client/nxl',
    destination: '/docs/reference/javascript/rangeGte',
  },
  {
    permanent: false,
    source: '/docs/client/nxr',
    destination: '/docs/reference/javascript/rangeLte',
  },
  {
    permanent: false,
    source: '/docs/client/adj',
    destination: '/docs/reference/javascript/rangeAdjacent',
  },
  {
    permanent: false,
    source: '/docs/client/ov',
    destination: '/docs/reference/javascript/overlaps',
  },
  {
    permanent: false,
    source: '/docs/client/ova',
    destination: '/docs/reference/javascript/overlaps',
  },
  {
    permanent: false,
    source: '/docs/client/fts',
    destination: '/docs/reference/javascript/textSearch',
  },
  {
    permanent: false,
    source: '/docs/client/plfts',
    destination: '/docs/reference/javascript/textSearch',
  },
  {
    permanent: false,
    source: '/docs/client/phfts',
    destination: '/docs/reference/javascript/textSearch',
  },
  {
    permanent: false,
    source: '/docs/client/wfts',
    destination: '/docs/reference/javascript/textSearch',
  },
  { permanent: false, source: '/blog/page/:number', destination: '/blog' },
  { permanent: false, source: '/blog/tags', destination: '/blog' },
  { permanent: false, source: '/docs/pricing', destination: '/pricing' },

  {
    permanent: false,
    source: '/docs/careers',
    destination: 'https://about.supabase.com/careers',
  },
  {
    permanent: false,
    source: '/docs/careers/:match*',
    destination: 'https://about.supabase.com/careers//:match*',
  },

  { permanent: false, source: '/docs/resources', destination: '/docs/guides' },

  {
    permanent: false,
    source: '/docs/reference/postgres/getting-started',
    destination: '/docs/guides/database/introduction',
  },
  {
    permanent: false,
    source: '/reference/postgres/connection-strings',
    destination: '/docs/guides/database/connecting/connecting-to-postgres',
  },
  {
    permanent: false,
    source: '/docs/reference/postgres/schemas',
    destination: '/docs/guides/database/tables',
  },
  {
    permanent: false,
    source: '/docs/reference/postgres/tables',
    destination: '/docs/guides/database/tables',
  },
  {
    permanent: false,
    source: '/docs/guides/database/resource-management',
    destination: '/docs/guides/database/timeouts',
  },
  {
    permanent: false,
    source: '/docs/reference/postgres/database-passwords',
    destination: '/docs/guides/database/managing-passwords',
  },
  {
    permanent: false,
    source: '/docs/reference/postgres/changing-timezones',
    destination: '/docs/guides/database/managing-timezones',
  },
  {
    permanent: false,
    source: '/docs/reference/postgres/publications',
    destination: '/docs/guides/database/replication',
  },
  {
    permanent: true,
    source: '/docs/guides/hosting/platform',
    destination: '/docs/guides/platform',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/custom-postgres-config',
    destination: '/docs/guides/database/custom-postgres-config',
  },
  {
    permanent: true,
    source: '/docs/guides/hosting/platform/access-control',
    destination: '/docs/guides/platform/access-control',
  },
  {
    permanent: true,
    source: '/docs/guides/self-hosting/overview',
    destination: '/docs/guides/self-hosting',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript/delete-user',
    destination: '/docs/reference/javascript/auth-api-deleteuser',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript/reset-password-email',
    destination: '/docs/reference/javascript/auth-api-resetpasswordforemail',
  },
  {
    permanent: true,
    source: '/docs/reference/postgres/connection-strings',
    destination: '/docs/guides/database/connecting-to-postgres',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting/connecting-to-postgres',
    destination: '/docs/guides/database/connecting-to-postgres',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting/direct-connections',
    destination: '/docs/guides/database/connecting-to-postgres',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting/direct-connections',
    destination: '/docs/guides/database/connection-pooling',
  },
  {
    permanent: true,
    source: '/docs/guides',
    destination: '/docs/',
  },
  {
    permanent: true,
    source: '/docs/guides/database/introduction',
    destination: '/docs/guides/database',
  },
  {
    permanent: false,
    source: '/learn-more',
    destination: '/?utm_source=event&utm_medium=billboard&utm_campaign=aws-atlanta',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript/supabase-client',
    destination: '/docs#reference-documentation',
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
    destination: 'blog/supabase-alpha-april-2020',
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
    destination: '/blog/in-the-loop',
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
    destination: '/blog/pricing',
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

  //  DOCS
  {
    permanent: true,
    source: '/docs/reference/cli/about',
    destination: '/docs/reference/cli/introduction',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/config-reference',
    destination: '/docs/reference/cli/config',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-help',
    destination: '/docs/reference/cli/global-flags',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-branch-list',
    destination: '/docs/reference/supabase-branches-list',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-branch-create',
    destination: '/docs/reference/supabase-branches-create',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-branch-delete',
    destination: '/docs/reference/supabase-branches-delete',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-switch',
    destination: '/docs/reference/supabase-branches-create',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-changes',
    destination: '/docs/reference/supabase-db-diff',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-commit',
    destination: '/docs/reference/supabase-db-pull',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-remote-set',
    destination: '/docs/reference/supabase-link',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-remote-changes',
    destination: '/docs/reference/supabase-db-diff',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-db-remote-commit',
    destination: '/docs/reference/supabase-db-pull',
  },
  {
    permanent: true,
    source: '/docs/reference/cli/supabase-gen-types-typescript',
    destination: '/docs/reference/supabase-gen-types',
  },

  {
    permanent: true,
    source: '/docs/reference/tools/reference-auth',
    destination: '/docs/reference/auth',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/overview',
    destination: '/docs/guides/realtime',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime#broadcast',
    destination: '/docs/guides/realtime/broadcast',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime#presence',
    destination: '/docs/guides/realtime/presence',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/postgres-cdc',
    destination: '/docs/guides/realtime/postgres-changes',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript/next/migration-guide',
    destination: '/docs/reference/javascript/release-notes',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-helpers/:path*',
    destination: '/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers',
  },
  {
    permanent: false,
    source: '/docs/guides/auth/server-side/nextjs',
    destination:
      '/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs',
  },
  {
    permanent: false,
    source: '/docs/guides/auth/server-side/sveltekit',
    destination:
      '/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=sveltekit',
  },
  {
    permanent: true,
    source: '/docs/guides/client-libraries',
    destination: '/docs#reference-documentation',
  },
  {
    permanent: true,
    source: '/docs/reference/auth-helpers',
    destination: '/docs/guides/auth/auth-helpers/',
  },
  {
    permanent: true,
    source: '/docs/reference/auth-helpers/next-js',
    destination: '/docs/guides/auth/auth-helpers/nextjs',
  },
  {
    permanent: true,
    source: '/docs/reference/auth-helpers/sveltekit',
    destination: '/docs/guides/auth/auth-helpers/sveltekit',
  },
  {
    permanent: true,
    source: '/docs/guides/database/migrating-between-projects',
    destination: '/docs/guides/platform/migrating-and-upgrading-projects',
  },

  // supabase-js v1 to v2 redirects
  // v1: /auth-update
  // v2: /auth-updateuser
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-update',
    destination: '/docs/reference/javascript/v1/auth-update',
  },
  // v1: /auth-api-get-user
  // v2: /auth-getuser
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-getuser',
    destination: '/docs/reference/javascript/v1/auth-api-getuser',
  },
  // v1: /auth-api-resetpasswordforemail
  // v2: /auth-resetpasswordforemail
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-resetpasswordforemail',
    destination: '/docs/reference/javascript/v1/auth-api-resetpasswordforemail',
  },
  // v1: /auth-api-verifyotp
  // v2: /auth-verifyotp
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-verifyotp',
    destination: '/docs/reference/javascript/v1/auth-api-verifyotp',
  },
  // v1: /auth-api-listusers
  // v2: /auth-admin-listusers
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-listusers',
    destination: '/docs/reference/javascript/v1/auth-api-listusers',
  },
  // v1: /auth-api-createuser
  // v2: /auth-admin-createuser
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-createuser',
    destination: '/docs/reference/javascript/v1/auth-api-createuser',
  },
  // v1: /auth-api-deleteuser
  // v2: /auth-admin-deleteuser
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-deleteuser',
    destination: '/docs/reference/javascript/v1/auth-api-deleteuser',
  },
  // v1: /auth-api-generatelink
  // v2: /auth-admin-generatelink
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-generatelink',
    destination: '/docs/reference/javascript/v1/auth-api-generatelink',
  },
  // v1: /auth-api-inviteuserbyemail
  // v2: /auth-admin-inviteuserbyemail
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-inviteuserbyemail',
    destination: '/docs/reference/javascript/v1/auth-api-inviteuserbyemail',
  },
  // v1: /auth-api-getuserbyid
  // v2: /auth-admin-getuserbyid
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-getuserbyid',
    destination: '/docs/reference/javascript/v1/auth-api-getuserbyid',
  },
  // v1: /auth-api-updateuserbyid
  // v2: /auth-admin-updateuserbyid
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-updateuserbyid',
    destination: '/docs/reference/javascript/v1/auth-api-updateuserbyid',
  },
  // signIn method is now split into signInWithPassword ,signInWithOtp ,signInWithOAuth
  // send traffic to v1 docs instead
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-signin',
    destination: '/docs/reference/javascript/v1/auth-signin',
  },
  // v1: /auth-session
  // v2: /auth-getsession
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-session',
    destination: '/docs/reference/javascript/v1/auth-session',
  },
  // v1: /auth-api-sendmobileotp
  // v2: /auth-signinwithotp
  {
    permanent: true,
    source: '/docs/reference/javascript/auth-api-sendmobileotp',
    destination: '/docs/reference/javascript/v1/auth-api-sendmobileotp',
  },

  // realtime methods been replaced with new names
  {
    permanent: true,
    source: '/docs/reference/javascript/removesubscription',
    destination: '/docs/reference/javascript/v1/removesubscription',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript/removeallsubscriptions',
    destination: '/docs/reference/javascript/v1/removeallsubscriptions',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript/getsubscriptions',
    destination: '/docs/reference/javascript/v1/getsubscriptions',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/cicd-workflows',
    destination: '/docs/guides/cli/managing-environments',
  },

  // supabase-flutter v0 to v1 redirects
  // v0: /auth-update
  // v1: /auth-updateuser
  {
    permanent: true,
    source: '/docs/reference/dart/auth-update',
    destination: '/docs/reference/dart/auth-updateuser',
  },
  // v0: /auth-api-resetpasswordforemail
  // v1: /auth-resetpasswordforemail
  {
    permanent: true,
    source: '/docs/reference/dart/reset-password-email',
    destination: '/docs/reference/dart/auth-resetpasswordforemail',
  },
  // signIn method is now split into signInWithPassword ,signInWithOtp ,signInWithOAuth
  // send traffic to v0 docs instead
  {
    permanent: true,
    source: '/docs/reference/dart/auth-signin',
    destination: '/docs/reference/dart/v0/auth-signin',
  },
  // v0: /auth-session
  // v1: /auth-currentsession
  {
    permanent: true,
    source: '/docs/reference/dart/auth-session',
    destination: '/docs/reference/dart/auth-currentsession',
  },
  // v0: /auth-user
  // v1: /auth-currentuser
  {
    permanent: true,
    source: '/docs/reference/dart/auth-user',
    destination: '/docs/reference/dart/auth-currentuser',
  },
  // v0: /auth-signinwithprovider
  // v1: /auth-signinwithoauth
  {
    permanent: true,
    source: '/docs/reference/dart/v0/auth-signinwithprovider',
    destination: '/docs/reference/dart/auth-signinwithoauth',
  },
  // realtime methods been replaced with new names
  {
    permanent: true,
    source: '/docs/reference/dart/removesubscription',
    destination: '/docs/reference/dart/v0/removesubscription',
  },
  {
    permanent: true,
    source: '/docs/reference/dart/getsubscriptions',
    destination: '/docs/reference/dart/v0/getsubscriptions',
  },
  {
    permanent: true,
    source: '/docs/going-into-prod',
    destination: '/docs/guides/platform/going-into-prod',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/disk-usage',
    destination: '/docs/guides/platform/database-usage',
  },
  {
    permanent: true,
    source: '/sign-in',
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
    source: '/docs/guides/storage-cdn',
    destination: '/docs/guides/storage/cdn',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/examples',
    destination: '/docs/guides/functions',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/best-practices',
    destination: '/docs/guides/functions/quickstart',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/local-quickstart',
    destination: '/docs/guides/functions/quickstart',
  },
  {
    permanent: true,
    source: '/projects',
    destination: 'https://supabase.com/dashboard/projects',
  },
  // Reorganizing pooler docs:-----------------------------

  //external libraries
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#integrations',
    destination: '/docs/guides/database/connecting-to-postgres#quickstart-connection-guides',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#connecting-with-drizzle',
    destination: '/docs/guides/database/drizzle',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#connecting-with-prisma',
    destination: '/docs/guides/database/prisma',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#connecting-with-postgresjs',
    destination: '/docs/guides/database/postgres-js',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#connecting-with-pgadmin',
    destination: '/docs/guides/database/pgadmin',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#connecting-with-psql',
    destination: '/docs/guides/database/psql',
  },

  // pooling
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#connection-pooler',
    destination: '/docs/guides/database/connecting-to-postgres#connection-pooling-in-depth',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#troubleshooting-supavisor',
    destination: '/docs/guides/database/supavisor',
  },

  //IPv4/IPv6
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#finding-your-database-hostname',
    destination: '/docs/guides/platform/ipv4-address#finding-your-databases-ip-address',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#managing-your-ip-address',
    destination: '/docs/guides/platform/ipv4-address#supabase-and-ipv6-compatibility',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#ipv6-address',
    destination: '/docs/guides/platform/ipv4-address#supabase-and-ipv6-compatibility',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres#ipv4-address',
    destination: '/docs/guides/platform/ipv4-address',
  },
  //--------------------------------------------------------

  // START docs 2.0, moving pages in to structure
  {
    permanent: true,
    source: '/docs/oss',
    destination: '/oss',
  },
  {
    permanent: true,
    source: '/oss',
    destination: '/open-source',
  },
  {
    permanent: true,
    source: '/docs/company/aup',
    destination: '/aup',
  },
  {
    permanent: true,
    source: '/docs/company/terms',
    destination: '/terms',
  },
  {
    permanent: true,
    source: '/docs/company/privacy',
    destination: '/privacy',
  },
  {
    permanent: true,
    source: '/docs/company/sla',
    destination: '/sla',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/passwordless-login',
    destination: '/docs/guides/auth/phone-login',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/passwordless-login/phone-sms-otp-messagebird',
    destination: '/docs/guides/auth/phone-login/messagebird',
  },
  { permanent: true, source: '/docs/guides/auth/overview', destination: '/docs/guides/auth' },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-messagebird',
    destination: '/docs/guides/auth/phone-login/messagebird',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-twilio',
    destination: '/docs/guides/auth/phone-login/twilio',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-vonage',
    destination: '/docs/guides/auth/phone-login/vonage',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-google',
    destination: '/docs/guides/auth/social-login/auth-google',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-facebook',
    destination: '/docs/guides/auth/social-login/auth-facebook',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-apple',
    destination: '/docs/guides/auth/social-login/auth-apple',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-azure',
    destination: '/docs/guides/auth/social-login/auth-azure',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-twitter',
    destination: '/docs/guides/auth/social-login/auth-twitter',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-github',
    destination: '/docs/guides/auth/social-login/auth-github',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-gitlab',
    destination: '/docs/guides/auth/social-login/auth-gitlab',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-bitbucket',
    destination: '/docs/guides/auth/social-login/auth-bitbucket',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-discord',
    destination: '/docs/guides/auth/social-login/auth-discord',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-keycloak',
    destination: '/docs/guides/auth/social-login/auth-keycloak',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-linkedin',
    destination: '/docs/guides/auth/social-login/auth-linkedin',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-notion',
    destination: '/docs/guides/auth/social-login/auth-notion',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-slack',
    destination: '/docs/guides/auth/social-login/auth-slack',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-spotify',
    destination: '/docs/guides/auth/social-login/auth-spotify',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-twitch',
    destination: '/docs/guides/auth/social-login/auth-twitch',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-workos',
    destination: '/docs/guides/auth/social-login/auth-workos',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-zoom',
    destination: '/docs/guides/auth/social-login/auth-zoom',
  },
  {
    permanent: true,
    source: '/docs/guides/database',
    destination: '/docs/guides/database/overview',
  },
  {
    permanent: true,
    source: '/docs/getting-started',
    destination: '/docs/guides/getting-started/architecture',
  },
  {
    permanent: true,
    source: '/docs/architecture',
    destination: '/docs/guides/getting-started/architecture',
  },
  {
    permanent: true,
    source: '/docs/features',
    destination: '/docs/guides/getting-started/features',
  },
  {
    permanent: true,
    source: '/docs/guides/with-nextjs',
    destination: '/docs/guides/getting-started/tutorials/with-nextjs',
  },
  {
    permanent: true,
    source: '/docs/guides/with-react',
    destination: '/docs/guides/getting-started/tutorials/with-react',
  },
  {
    permanent: true,
    source: '/docs/guides/with-vue-3',
    destination: '/docs/guides/getting-started/tutorials/with-vue-3',
  },
  {
    permanent: true,
    source: '/docs/guides/with-nuxt-3',
    destination: '/docs/guides/getting-started/tutorials/with-nuxt-3',
  },
  {
    permanent: true,
    source: '/docs/guides/with-angular',
    destination: '/docs/guides/getting-started/tutorials/with-angular',
  },
  {
    permanent: true,
    source: '/docs/guides/with-redwoodjs',
    destination: '/docs/guides/getting-started/tutorials/with-redwoodjs',
  },
  {
    permanent: true,
    source: '/docs/guides/with-svelte',
    destination: '/docs/guides/getting-started/tutorials/with-svelte',
  },
  {
    permanent: true,
    source: '/docs/guides/with-sveltekit',
    destination: '/docs/guides/getting-started/tutorials/with-sveltekit',
  },
  {
    permanent: true,
    source: '/docs/guides/with-flutter',
    destination: '/docs/guides/getting-started/tutorials/with-flutter',
  },
  {
    permanent: true,
    source: '/docs/guides/with-expo',
    destination: '/docs/guides/getting-started/tutorials/with-expo-react-native',
  },
  {
    permanent: true,
    source: '/docs/guides/with-expo-social-auth',
    destination: '/docs/guides/getting-started/tutorials/with-expo-react-native-social-auth',
  },
  {
    permanent: true,
    source: '/docs/guides/getting-started/tutorials/with-expo',
    destination: '/docs/guides/getting-started/tutorials/with-expo-react-native',
  },
  {
    permanent: true,
    source: '/docs/guides/getting-started/tutorials/with-expo-social-auth',
    destination: '/docs/guides/getting-started/tutorials/with-expo-react-native-social-auth',
  },
  {
    permanent: true,
    source: '/docs/guides/with-kotlin',
    destination: '/docs/guides/getting-started/tutorials/with-kotlin',
  },
  {
    permanent: true,
    source: '/docs/guides/with-ionic-react',
    destination: '/docs/guides/getting-started/tutorials/with-ionic-react',
  },
  {
    permanent: true,
    source: '/docs/guides/with-ionic-vue',
    destination: '/docs/guides/getting-started/tutorials/with-ionic-vue',
  },
  {
    permanent: true,
    source: '/docs/guides/with-ionic-angular',
    destination: '/docs/guides/getting-started/tutorials/with-ionic-angular',
  },
  {
    permanent: true,
    source: '/docs/guides/tutorials',
    destination: '/docs/guides/getting-started#tutorials',
  },
  {
    permanent: true,
    source: '/docs/guides/hosting/overview',
    destination: '/docs/guides/self-hosting',
  },
  {
    permanent: true,
    source: '/docs/guides/hosting/docker',
    destination: '/docs/guides/self-hosting/docker',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/self-hosting',
    destination: '/docs/guides/self-hosting',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/self-hosting/docker',
    destination: '/docs/guides/self-hosting/docker',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/supabase-cli',
    destination: '/docs/guides/cli',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/supabase-cli/local-development',
    destination: '/docs/guides/cli/local-development',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/supabase-cli/managing-environments',
    destination: '/docs/guides/cli/managing-environments',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/migrations/auth0',
    destination: '/docs/guides/resources/migrating-to-supabase/auth0',
  },
  {
    permanent: true,
    source: '/docs/guides/migrations/firestore-data',
    destination: '/docs/guides/resources/migrating-to-supabase/firestore-data',
  },
  {
    permanent: true,
    source: '/docs/guides/migrations/firebase-auth',
    destination: '/docs/guides/resources/migrating-to-supabase/firebase-auth',
  },
  {
    permanent: true,
    source: '/docs/guides/migrations/firebase-storage',
    destination: '/docs/guides/resources/migrating-to-supabase/firebase-storage',
  },
  {
    permanent: true,
    source: '/docs/guides/migrations/heroku',
    destination: '/docs/guides/resources/migrating-to-supabase/heroku',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript',
    destination: '/docs/reference/javascript/start',
  },
  {
    permanent: true,
    source: '/docs/reference/dart',
    destination: '/docs/reference/dart/start',
  },
  {
    permanent: true,
    source: '/docs/reference/python',
    destination: '/docs/reference/python/start',
  },
  {
    permanent: true,
    source: '/docs/reference/csharp',
    destination: '/docs/reference/csharp/start',
  },
  {
    permanent: true,
    source: '/docs/reference/swift',
    destination: '/docs/reference/swift/start',
  },
  {
    permanent: true,
    source: '/docs/reference/kotlin',
    destination: '/docs/reference/kotlin/start',
  },
  {
    permanent: true,
    source: '/docs/reference/cli',
    destination: '/docs/reference/cli/start',
  },
  {
    permanent: true,
    source: '/docs/reference/api',
    destination: '/docs/reference/api/start',
  },
  {
    permanent: true,
    source: '/docs/reference/auth',
    destination: '/docs/reference/self-hosting-auth/start',
  },
  {
    permanent: true,
    source: '/docs/reference/storage',
    destination: '/docs/reference/self-hosting-storage/start',
  },
  {
    permanent: true,
    source: '/docs/reference/realtime',
    destination: '/docs/reference/self-hosting-realtime/start',
  },
  {
    permanent: true,
    source: '/docs/handbook/supasquad',
    destination: '/supasquad',
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
  {
    permanent: true,
    source: '/docs/reference/javascript/upgrade-guide',
    destination: '/docs/reference/javascript/v1/upgrade-guide',
  },
  {
    permanent: true,
    source: '/docs/guides/examples',
    destination: '/docs/guides/resources/examples',
  },
  {
    permanent: true,
    source: '/docs/reference/javascript/v0/rpc',
    destination: '/docs/reference/javascript/rpc',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/database-usage',
    destination: '/docs/guides/platform/database-size',
  },
  {
    permanent: true,
    source: '/docs/guides/deployment/branching/branching-2',
    destination: '/docs/guides/deployment/branching/dashboard',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/postgres/dropping-all-tables-in-schema',
    destination: '/docs/guides/database/postgres/dropping-all-tables-in-schema',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/postgres/first-row-in-group',
    destination: '/docs/guides/database/postgres/first-row-in-group',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/postgres/which-version-of-postgres',
    destination: '/docs/guides/database/postgres/which-version-of-postgres',
  },
  // Serverless APIs
  {
    permanent: true,
    source: '/docs/guides/database/api',
    destination: '/docs/guides/api',
  },
  {
    permanent: true,
    source: '/docs/guides/database/api/generating-types',
    destination: '/docs/guides/api/rest/generating-types',
  },
  {
    permanent: true,
    source: '/docs/guides/api/generating-types',
    destination: '/docs/guides/api/rest/generating-types',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/dashibase',
    destination: '/docs',
  },
  {
    permanent: true,
    source: '/docs/support',
    destination: '/support',
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
    source: '/docs/guides/getting-started/openai/vector-search',
    destination: '/docs/guides/ai/examples/docs-search',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/examples/huggingface-image-captioning',
    destination: '/docs/guides/ai/examples/huggingface-image-captioning',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/examples/openai',
    destination: '/docs/guides/ai/examples/openai',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/rate-limits',
    destination: '/docs/guides/realtime/limits',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/quotas',
    destination: '/docs/guides/realtime/limits',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/channels',
    destination: '/docs/guides/realtime/protocol#channels',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/extensions/broadcast',
    destination: '/docs/guides/realtime/broadcast',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/extensions/presence',
    destination: '/docs/guides/realtime/presence',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/extensions/postgres-changes',
    destination: '/docs/guides/realtime/postgres-changes',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/quickstart',
    destination: '/docs/guides/realtime',
  },
  {
    permanent: true,
    source: '/docs/guides/realtime/guides/client-side-throttling',
    destination: '/docs/guides/realtime/limits',
  },
  {
    permanent: true,
    source: '/docs/guides/database/extensions/pgcron',
    destination: '/docs/guides/database/extensions/pg_cron',
  },
  {
    permanent: true,
    source: '/docs/guides/database/extensions/pgnet',
    destination: '/docs/guides/database/extensions/pg_net',
  },
  {
    permanent: true,
    source: '/docs/guides/database/extensions/pgrepack',
    destination: '/docs/guides/database/extensions/pg_repack',
  },
  {
    permanent: false,
    source: '/docs/guides/database/extensions/pg_partman',
    destination: '/docs/guides/database/extensions',
  },
  {
    permanent: true,
    source: '/docs/guides/ai/structured-unstructured-embeddings',
    destination: '/docs/guides/ai/structured-unstructured',
  },
  {
    permanent: true,
    source: '/docs/guides/ai/choosing-instance-type',
    destination: '/docs/guides/ai/choosing-compute-addon',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/using-environment-variables-in-config',
    destination: '/docs/guides/cli/managing-config',
  },
  {
    permanent: true,
    source: '/docs/guides/getting-started/local-development',
    destination: '/docs/guides/cli/local-development',
  },
  {
    permanent: true,
    source: '/blog/flutter-authentication-and-authorization-with-rls',
    destination: '/blog/flutter-authorization-with-rls',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/appsmith',
    destination: '/partners/integrations/appsmith',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/auth0',
    destination: '/partners/integrations/auth0',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/authsignal',
    destination: '/partners/integrations/authsignal',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/bracket',
    destination: '/partners/integrations/bracket',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/clerk',
    destination: '/partners/integrations/clerk',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/cloudflare-workers',
    destination: '/partners/integrations/cloudflare-workers',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/dhiwise',
    destination: '/partners/integrations/dhiwise',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/directus',
    destination: '/partners/integrations/directus',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/draftbit',
    destination: '/partners/integrations/draftbit',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/estuary',
    destination: '/partners/integrations/estuary',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/fezto',
    destination: '/partners/integrations/fezto',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/flutterflow',
    destination: '/partners/integrations/flutterflow',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/forestadmin',
    destination: '/partners/integrations/forestadmin',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/illa',
    destination: '/partners/integrations/illa',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/integrations',
    destination: '/partners/integrations',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/keyri',
    destination: '/partners/integrations/keyri',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/oauth-apps/authorize-an-oauth-app',
    destination: '/docs/guides/platform/oauth-apps/authorize-an-oauth-app',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/oauth-apps/publish-an-oauth-app',
    destination: '/docs/guides/platform/oauth-apps/publish-an-oauth-app',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/onesignal',
    destination: '/partners/integrations/onesignal',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/passage',
    destination: '/partners/integrations/passage',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/pgmustard',
    destination: '/partners/integrations/pgmustard',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/picket',
    destination: '/partners/integrations/picket',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/plasmic',
    destination: '/partners/integrations/plasmic',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/polyscale',
    destination: '/partners/integrations/polyscale',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/prisma',
    destination: '/partners/integrations/prisma',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/sequin',
    destination: '/partners/integrations/sequin',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/snaplet',
    destination: '/partners/integrations/snaplet',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/stytch',
    destination: '/partners/integrations/stytch',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/supertokens',
    destination: '/partners/integrations/supertokens',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/vercel',
    destination: '/partners/integrations/vercel',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/weweb',
    destination: '/partners/integrations/weweb',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/zuplo',
    destination: '/partners/integrations/zuplo',
  },
  // toddle.dev pivoted to nordcraft
  {
    permanent: true,
    source: '/partners/integrations/toddle',
    destination: '/partners/integrations/nordcraft',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/oauth-apps/publish-an-oauth-app',
    destination:
      '/docs/guides/platform/oauth-apps/build-a-supabase-integration#create-an-oauth-app',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/oauth-apps/authorize-an-oauth-app',
    destination: '/docs/guides/platform/oauth-apps/build-a-supabase-integration',
  },
  {
    permanent: true,
    source: '/docs/guides/integrations/build-a-supabase-integration',
    destination: '/docs/guides/integrations/build-a-supabase-oauth-integration',
  },
  { permanent: true, source: '/docs/reference/cli/config', destination: '/docs/guides/cli/config' },
  {
    permanent: true,
    source: '/docs/guides/database/timeouts',
    destination: '/docs/guides/database/postgres/configuration',
  },
  {
    permanent: true,
    source: '/docs/guides/database/managing-timezones',
    destination: '/docs/guides/database/postgres/configuration',
  },
  {
    permanent: true,
    source: '/docs/guides/database/managing-passwords',
    destination: '/docs/guides/database/postgres/roles#passwords',
  },
  {
    permanent: true,
    source: '/blog/pgvector-v0-5-0-hnsw',
    destination: '/blog/increase-performance-pgvector-hnsw',
  },
  {
    permanent: true,
    source: '/docs/guides/ai/managing-indexes',
    destination: '/docs/guides/ai/vector-indexes',
  },
  {
    permanent: true,
    source: '/blog/supabase-ai-content-storm',
    destination: 'https://dev.to/supabase/ai-ignites-the-rain-content-storm-is-back-kdl',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/global-deployments',
    destination: '/docs/guides/functions/regional-invocation',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/typescript-support',
    destination: '/docs/guides/functions',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-magic-link',
    destination: '/docs/guides/auth/passwordless-login/auth-magic-link',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-password-reset',
    destination: '/docs/guides/auth/passwords',
  },
  {
    permanent: true,
    source: '/docs/reference/dart/sign-in-with-apple',
    destination: '/docs/reference/dart/sign-in-with-id-token',
  },
  {
    permanent: true,
    source: '/docs/guides/database/large-datasets',
    destination: '/docs/guides/database/import-data',
  },
  {
    permanent: true,
    source: '/docs/guides/api/rest/debugging-performance',
    destination: '/docs/guides/database/debugging-performance',
  },
  {
    permanent: true,
    source: '/docs/guides/api/rest/joins-and-nesting',
    destination: '/docs/guides/database/joins-and-nesting',
  },
  {
    permanent: true,
    source: '/docs/learn/auth-deep-dive/auth-deep-dive-jwts',
    destination: '/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts',
  },
  {
    permanent: true,
    source: '/docs/learn/auth-deep-dive/auth-row-level-security',
    destination: '/docs/guides/auth/auth-deep-dive/auth-row-level-security',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/column-level-security',
    destination: '/docs/guides/database/postgres/column-level-security',
  },
  {
    permanent: true,
    source: '/docs/learn/auth-deep-dive/auth-policies',
    destination: '/docs/guides/auth/auth-deep-dive/auth-policies',
  },
  {
    permanent: true,
    source: '/docs/learn/auth-deep-dive/auth-gotrue',
    destination: '/docs/guides/auth/auth-deep-dive/auth-gotrue',
  },
  {
    permanent: true,
    source: '/docs/learn/auth-deep-dive/auth-google-oauth',
    destination: '/docs/guides/auth/auth-deep-dive/auth-google-oauth',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/sso/auth-sso-saml',
    destination: '/docs/guides/auth/enterprise-sso/auth-sso-saml',
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
    source: '/docs/guides/database/sql-to-api',
    destination: '/docs/guides/api/sql-to-api',
  },
  {
    permanent: true,
    source: '/docs/guides/database/database-linter',
    destination: '/docs/guides/database/database-advisors',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-email',
    destination: '/docs/guides/auth/passwords',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/passwordless-login/auth-magic-link',
    destination: '/docs/guides/auth/auth-email-passwordless',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/passwordless-login/auth-email-otp',
    destination: '/docs/guides/auth/auth-email-passwordless',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/native-mobile-login',
    destination: '/docs/guides/auth/social-login',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/concepts/redirect-urls',
    destination: '/docs/guides/auth/redirect-urls',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-user-management',
    destination: '/docs/guides/auth/managing-user-data',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts',
    destination: '/docs/guides/auth/jwts',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/row-level-security',
    destination: '/docs/guides/database/postgres/row-level-security',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/column-level-security',
    destination: '/docs/guides/database/postgres/column-level-security',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/custom-claims-and-role-based-access-control-rbac',
    destination: '/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-deep-dive/auth-google-oauth',
    destination: '/docs/guides/auth/social-login/auth-google',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-deep-dive/auth-gotrue',
    destination: '/docs/guides/auth/architecture',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-deep-dive/auth-policies',
    destination: '/docs/guides/database/postgres/row-level-security',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/auth-deep-dive/auth-row-level-security',
    destination: '/docs/guides/database/postgres/row-level-security',
  },
  {
    permanent: true,
    source: '/docs/guides/database/replication/etl-destinations',
    destination: '/docs/guides/database/replication/replication-setup',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/server-side-rendering',
    destination: '/docs/guides/auth/server-side/advanced-guide',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/server-side/overview',
    destination: '/docs/guides/auth/server-side',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr',
    destination: '/docs/guides/auth/passwords',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr',
    destination: '/docs/guides/auth/social-login',
  },
  {
    permanent: true,
    source: '/docs/guides/api/data-apis',
    destination: '/docs/guides/api',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/debugging',
    destination: '/docs/functions/logging',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/log-drains',
    destination: '/docs/platform/log-drains',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/functions-headers',
    destination: '/docs/functions/logging',
  },
  {
    permanent: true,
    source: '/docs/guides/functions/import-maps',
    destination: '/docs/guides/functions/dependencies',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/phone-login/messagebird',
    destination: '/docs/guides/auth/phone-login?showSmsProvider=MessageBird',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/phone-login/twilio',
    destination: '/docs/guides/auth/phone-login?showSmsProvider=Twilio',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/phone-login/vonage',
    destination: '/docs/guides/auth/phone-login?showSmsProvider=Vonage',
  },
  {
    permanent: true,
    source: '/docs/guides/auth/phone-login/textlocal',
    destination:
      '/docs/guides/auth/phone-login?showSmsProvider=Textlocal%2520%28Community%2520Supported%29',
  },
  {
    permanent: true,
    source: '/launchweek',
    destination: '/launch-week',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/enterprise-billing',
    destination: '/docs/guides/platform/org-based-billing',
  },
  {
    permanent: true,
    source: '/docs/guides/cli',
    destination: '/docs/guides/local-development',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/getting-started',
    destination: '/docs/guides/local-development/cli/getting-started',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/config',
    destination: '/docs/guides/local-development/cli/config',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/local-development',
    destination: '/docs/guides/local-development/overview',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/managing-environments',
    destination: '/docs/guides/deployment/managing-environments',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/:path*',
    destination: '/docs/guides/local-development/cli/:path*',
  },
  {
    // Not permanent because I don't want to risk decommissioning this
    // path entirely, just solving the problem temporarily for people
    // whose browsers have already cached the wrong redirect above
    permanent: false,
    source: '/docs/guides/local-development/cli/managing-environments',
    destination: '/docs/guides/deployment/managing-environments',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/branching',
    destination: '/docs/guides/deployment/branching',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/terraform',
    destination: '/docs/guides/deployment/terraform',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/terraform/:path*',
    destination: '/docs/guides/deployment/terraform/:path*',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/going-into-prod',
    destination: '/docs/guides/deployment/going-into-prod',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/maturity-model',
    destination: '/docs/guides/deployment/maturity-model',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/shared-responsibility-model',
    destination: '/docs/guides/deployment/shared-responsibility-model',
  },
  {
    permanent: true,
    source: '/docs/guides/cli/github-actions/:path*',
    destination: '/docs/guides/deployment/ci/:path*',
  },
  {
    permanent: true,
    source: '/docs/guides/resources/migrating-to-supabase/:path*',
    destination: '/docs/guides/platform/migrating-to-supabase/:path*',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/migrating-and-upgrading-projects',
    destination: '/docs/guides/platform/upgrading',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/vercel-marketplace',
    destination: '/docs/guides/integrations/vercel-marketplace',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/marketplace',
    destination: '/docs/guides/integrations/supabase-marketplace',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/oauth-apps/build-a-supabase-integration',
    destination: '/docs/guides/integrations/build-a-supabase-integration',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/oauth-apps/oauth-scopes',
    destination: '/docs/guides/integrations/build-a-supabase-integration/oauth-scopes',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/logs',
    destination: '/docs/guides/monitoring-troubleshooting/logs',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/metrics',
    destination: '/docs/guides/monitoring-troubleshooting/metrics',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/sentry-monitoring',
    destination: '/docs/guides/monitoring-troubleshooting/sentry-monitoring',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/advanced-log-filtering',
    destination: '/docs/guides/monitoring-troubleshooting/advanced-log-filtering',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/exhaust-disk-io',
    destination: '/docs/guides/monitoring-troubleshooting/exhaust-disk-io',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/exhaust-cpu',
    destination: '/docs/guides/monitoring-troubleshooting/exhaust-cpu',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/exhaust-ram',
    destination: '/docs/guides/monitoring-troubleshooting/exhaust-ram',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/exhaust-swap',
    destination: '/docs/guides/monitoring-troubleshooting/exhaust-swap',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/http-status-codes',
    destination: '/docs/guides/monitoring-troubleshooting/http-status-codes',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/troubleshooting',
    destination: '/docs/guides/monitoring-troubleshooting/troubleshooting',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/log-drains',
    destination: '/docs/guides/monitoring-troubleshooting/log-drains',
  },
  {
    // [Charis] This is a nice URL and I'm not 100% on permanently
    // decommissioning it yet (cache-busting a permanent redirect could be a
    // hassle if we ever resurrect it with new content)
    permanent: false,
    source: '/docs/guides/resources/examples',
    destination: '/docs/guides/getting-started',
  },
  {
    permanent: true,
    source: '/docs/guides/database/connecting-to-postgres/serverless-drivers',
    destination: '/docs/guides/database/connecting-to-postgres',
  },
  {
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/troubleshooting',
    destination: '/docs/guides/troubleshooting/http-api-issues',
  },
  {
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/exhaust-disk-io',
    destination: '/docs/guides/troubleshooting/exhaust-disk-io',
  },
  {
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/exhaust-ram',
    destination: '/docs/guides/troubleshooting/exhaust-ram',
  },
  {
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/exhaust-swap',
    destination: '/docs/guides/troubleshooting/exhaust-swap',
  },
  {
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/exhaust-cpu',
    destination: '/docs/guides/troubleshooting/high-cpu-usage',
  },
  {
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/http-status-codes',
    destination: '/docs/guides/troubleshooting/http-status-codes',
  },
  {
    permanent: true,
    source: '/docs/guides/monitoring-troubleshooting/:path*',
    destination: '/docs/guides/telemetry/:path*',
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
    source: '/docs/guides/platform/org-based-billing',
    destination: '/docs/guides/platform/billing-on-supabase',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#how-billing-is-organized',
    destination: '/docs/guides/platform/billing-on-supabase#organization-based-billing',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#quotas-and-features',
    destination: '/docs/guides/platform/billing-on-supabase#variable-usage-fees-and-quotas',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#usage-items',
    destination: '/docs/guides/platform/billing-on-supabase#variable-usage-fees-and-quotas',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#billing-for-compute-compute-hours',
    destination: '/docs/guides/platform/manage-your-usage/compute',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#compute-pricing',
    destination: '/docs/guides/platform/manage-your-usage/compute#pricing',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#compute-credits',
    destination: '/docs/guides/platform/manage-your-usage/compute#compute-credits',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#read-replicas',
    destination: '/docs/guides/platform/manage-your-usage/read-replicas',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#project-add-ons',
    destination: '/docs/guides/platform/manage-your-usage',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#unified-egress',
    destination: '/docs/guides/platform/manage-your-usage/egress',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#included-egress-quota',
    destination: '/docs/guides/platform/manage-your-usage/egress#pricing',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#egress-dashboards',
    destination: '/docs/guides/platform/manage-your-usage/egress#usage-page',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#disk-size',
    destination: '/docs/guides/platform/manage-your-usage/disk-size',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#free-plan',
    destination: '/docs/guides/platform/billing-on-supabase#free-plan',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#billing-examples',
    destination: '/docs/guides/platform/billing-on-supabase',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#multiple-projects-in-a-free-plan-organization',
    destination: '/docs/guides/platform/billing-on-supabase',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/org-based-billing#multiple-projects-in-a-pro-plan-organization',
    destination: '/docs/guides/platform/billing-on-supabase',
  },
  {
    permanent: false,
    source: '/docs/guides/platform/spend-cap',
    destination: '/docs/guides/platform/cost-control#spend-cap',
  },
  {
    permanent: true,
    source: '/docs/guides/project-management/api',
    destination: '/docs/reference/api/introduction',
  },
  {
    permanent: false,
    source: '/mcp',
    destination: '/docs/guides/getting-started/mcp',
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
    source: '/features/ai-query-assistance',
    destination: '/features/ai-assistant',
  },
  {
    permanent: true,
    source: '/features/fly-postgres',
    destination: '/features/postgres-database',
  },
  {
    permanent: true,
    source: '/docs/guides/platform/fly-postgres',
    destination: '/docs/guides/database/overview',
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
]
