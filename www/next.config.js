const withMDX = require('@next/mdx')()

module.exports = withMDX({
  basePath: '',
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],

  trailingSlash: false,
  images: {
    domains: [
      'github.com',
      'ca.slack-edge.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'supabase.com',
      'obuldanrptloktxcffvn.supabase.co',
      'avatars.githubusercontent.com',
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
        source: '/docs/:path*',
        destination: `${process.env.NEXT_PUBLIC_DOCS_URL}/:path*`,
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
    ]
  },
})
