module.exports = [
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
    source: '/ui/:path*',
    destination: '/library/:path*',
  },
  { permanent: false, source: '/blog/page/:number', destination: '/blog' },
  {
    permanent: true,
    source: '/join',
    destination: 'https://supabase.com/',
  },
  {
    permanent: true,
    source: '/_app',
    destination: 'https://supabase.com/dashboard',
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
    source: '/contact/enterprise',
    destination: 'https://forms.supabase.com/enterprise',
  },
  {
    permanent: true,
    source: '/legal/soc2',
    destination: 'https://forms.supabase.com/soc2',
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
    source: '/blog/supabase-ai-content-storm',
    destination: 'https://dev.to/supabase/ai-ignites-the-rain-content-storm-is-back-kdl',
  },
  {
    permanent: false,
    source: '/special-announcement/tickets/:path*',
    destination: '/ga-week/tickets/:path*',
  },
  {
    permanent: true,
    source: '/partners/experts/:path*',
    destination: '/partners',
  },
  // marketing
  {
    permanent: true,
    source: '/changelogpod',
    destination: 'https://forms.supabase.com/changelog-podcast-sponsorship',
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
  {
    permanent: true,
    source: '/downloads/docs/Supabase\\+DPA\\+:version.pdf',
    destination: '/legal/customer-resources/data-processing-addendum',
  },
  {
    permanent: true,
    source: '/downloads/docs/Supabase\\+TIA\\+250314.pdf',
    destination: 'https://trust.supabase.io',
  },
  {
    permanent: true,
    source: '/changelog/29260-upcoming-changes-to-supabase-api-keys',
    destination: 'https://github.com/orgs/supabase/discussions/29260',
  },
  {
    permanent: true,
    source: '/builder-day/:path*',
    destination: '/builderday/:path*',
  },
]
