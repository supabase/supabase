module.exports = [
  {
    source: '/:path*',
    destination: `/:path*`,
  },
  {
    source: '/dashboard',
    destination: `${process.env.NEXT_PUBLIC_STUDIO_URL}`,
  },
  {
    source: '/dashboard/:path*',
    destination: `${process.env.NEXT_PUBLIC_STUDIO_URL}/:path*`,
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
    source: '/feed.xml',
    destination: `/rss.xml`,
  },
]
