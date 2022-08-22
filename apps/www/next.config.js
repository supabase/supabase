const gfm = require('remark-gfm')
const slug = require('rehype-slug')
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [gfm],
    rehypePlugins: [slug],
    // If you use `MDXProvider`, uncomment the following line.
    providerImportSource: '@mdx-js/react',
  },
})

module.exports = withMDX({
  basePath: '',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  trailingSlash: false,
  images: {
    dangerouslyAllowSVG: true,
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'ca.slack-edge.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'supabase.com',
      'obuldanrptloktxcffvn.supabase.co',
      'avatars.githubusercontent.com',
      'colab.research.google.com',
      'api.producthunt.com',
      'https://s3-us-west-2.amazonaws.com',
      's3-us-west-2.amazonaws.com',
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: '',
          },
          {
            key: 'X-Robots-Tag',
            value: 'all',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `/:path*`,
      },
      {
        source: '/docs',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}`,
      },
      {
        // redirect /docs/
        // trailing slash caused by docusaurus issue with multizone
        source: '/docs/',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}`,
      },
      {
        source: '/docs/:path*',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/:path*`,
      },
      // rewrite to keep existing ticket urls working
      {
        source: '/launch-week/tickets/:path',
        destination: `${process.env.NEXT_PUBLIC_LAUNCHWEEKSITE_URL}/tickets/:path`,
      },
      // rewrite to move ticket website to another path
      {
        source: '/launch-week-register',
        destination: `${process.env.NEXT_PUBLIC_LAUNCHWEEKSITE_URL}`,
      },
      {
        source: '/launch-week-register/:path*',
        destination: `${process.env.NEXT_PUBLIC_LAUNCHWEEKSITE_URL}/:path*`,
      },
      {
        source: '/new-docs',
        destination: `${process.env.NEXT_PUBLIC_REFERENCE_DOCS_URL}`,
      },
      {
        // redirect /docs/
        // trailing slash caused by docusaurus issue with multizone
        source: '/new-docs/',
        destination: `${process.env.NEXT_PUBLIC_REFERENCE_DOCS_URL}`,
      },
      {
        source: '/new-docs/:path*',
        destination: `${process.env.NEXT_PUBLIC_REFERENCE_DOCS_URL}/:path*`,
      },
      // misc rewrites
      {
        source: '/humans.txt',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/humans.txt`,
      },
      {
        source: '/lawyers.txt',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/lawyers.txt`,
      },
      {
        source: '/.well-known/security.txt',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/.well-known/security.txt`,
      },
      {
        source: '/oss',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/oss`,
      },
      {
        source: '/feed.xml',
        destination: `/rss.xml`,
      },
    ]
  },
  async redirects() {
    return [
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
        destination: '/docs/reference/javascript/auth-signin',
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
        destination: '/docs/reference/javascript/auth-session',
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
        destination: '/docs/reference/javascript/removesubscription',
      },
      {
        permanent: false,
        source: '/docs/client/getsubscriptions',
        destination: '/docs/reference/javascript/getsubscriptions',
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
        permanent: false,
        source: '/docs/guides/platform',
        destination: '/docs/guides/hosting/platform',
      },
      {
        permanent: false,
        source: '/docs/guides/self-hosting',
        destination: '/docs/guides/hosting/overview',
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
        source: '/oss',
        destination: '/docs/oss',
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
        source: '/guides/database/introduction',
        destination: '/guides/database',
      },
      {
        permanent: true,
        source: '/guides/auth',
        destination: '/guides/auth/intro',
      },
      {
        permanent: false,
        source: '/partners',
        destination: '/partners/integrations',
      },
      {
        permanent: false,
        source: '/learn-more',
        destination: '/?utm_source=event&utm_medium=billboard&utm_campaign=aws-atlanta',
      },
      {
        permanent: true,
        source: '/docs/reference/javascript/supabase-client',
        destination: '/docs/reference',
      },
      {
        permanent: true,
        source: '/join',
        destination: 'https://supabase.com/',
      },
      {
        permanent: true,
        source: '/blog/2022/06/15/blog/2022/06/29/visualizing-supabase-data-using-metabase',
        destination: '/blog/visualizing-supabase-data-using-metabase',
      },
      {
        permanent: true,
        source: '/_app',
        destination: 'https://app.supabase.com',
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
        destination: '/blog/case-study-monitoro',
      },
      {
        permanent: true,
        source: '/blog/2020/12/02/case-study-tayfa',
        destination: '/blog/case-study-tayfa',
      },
      {
        permanent: true,
        source: '/blog/2020/12/02/case-study-xendit',
        destination: '/blog/case-study-xendit',
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
        source: '/blog/2021/02/09/case-study-roboflow',
        destination: '/blog/case-study-roboflow',
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
        destination: '/blog/toad-a-link-shortener-with-simple-apis-for-low-coders',
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
        destination: '/blog/epsilon3-self-hosting',
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
        destination: '/blog/spot-flutter-with-postgres',
      },
      {
        permanent: true,
        source: '/blog/2021/07/27/storage-beta',
        destination: '/blog/storage-beta',
      },
      {
        permanent: true,
        source: '/blog/2021/07/28/mobbin-supabase-200000-users',
        destination: '/blog/mobbin-supabase-200000-users',
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
        destination: '/blog/replenysh-time-to-value-in-less-than-24-hours',
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
        destination: '/blog/how-supabase-accelerates-development-of-all-pull-together',
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

      //  DOCS
      {
        permanent: true,
        source: '/docs/reference/cli/about',
        destination: '/docs/reference/cli',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/config-reference',
        destination: '/docs/reference/cli/config',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-help',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-login',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-link',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-init',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-start',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-branch-list',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-branch-create',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-branch-delete',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-switch',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-changes',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-commit',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-reset',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-remote-set',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-remote-commit',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-db-push',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-functions-delete',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-functions-deploy',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-functions-new',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-functions-serve',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-migration-new',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-orgs-list',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-projects-list',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-projects-create',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-secrets-list',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-secrets-set',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/cli/supabase-secrets-unset',
        destination: '/docs/reference/cli/usage',
      },
      {
        permanent: true,
        source: '/docs/reference/tools/reference-auth',
        destination: '/docs/reference/auth',
      },
      {
        permanent: true,
        source: '/docs/guides/local-development',
        destination: '/docs/guides/cli/local-development',
      },
      {
        permanent: true,
        source: '/docs/guides/realtime/overview',
        destination: '/docs/guides/realtime',
      },
      // V2 redirects
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-update',
      //   destination: '/docs/reference/javascript/auth-updateuser',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-getuser',
      //   destination: '/docs/reference/javascript/auth-getuser',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-resetpasswordforemail',
      //   destination: '/docs/reference/javascript/auth-resetpasswordforemail',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-verifyotp',
      //   destination: '/docs/reference/javascript/auth-verifyotp',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-listusers',
      //   destination: '/docs/reference/javascript/auth-admin-listusers',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-createuser',
      //   destination: '/docs/reference/javascript/auth-admin-createuser',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-deleteuser',
      //   destination: '/docs/reference/javascript/auth-admin-deleteuser',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-generatelink',
      //   destination: '/docs/reference/javascript/auth-admin-generatelink',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-inviteuserbyemail',
      //   destination: '/docs/reference/javascript/auth-admin-inviteuserbyemail',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-getuserbyid',
      //   destination: '/docs/reference/javascript/auth-admin-getuserbyid',
      // },
      // {
      //   permanent: true,
      //   source: '/docs/reference/javascript/auth-api-updateuserbyid',
      //   destination: '/docs/reference/javascript/auth-admin-updateuserbyid',
      // },
    ]
  },
})
