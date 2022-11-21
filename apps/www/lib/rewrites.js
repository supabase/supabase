module.exports = [
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
