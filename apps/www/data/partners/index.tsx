import { ArrowUpRight, Database, FileText, Globe, Key, Plug, Puzzle, Webhook } from 'lucide-react'

const PARTNER_FORM_URL = '#become-a-partner'

const partnersPageData = {
  metaTitle: 'Build with Supabase',
  metaDescription:
    'Reach 2.5 million developers. Ship integrations that feel native to Postgres. Build on the open-source Postgres backend developers love.',
  heroSection: {
    title: 'Partners',
    h1: 'Build with Supabase',
    subheader: (
      <>
        Reach 2.5 million developers. Ship integrations that feel native to Postgres. Build on the
        open-source Postgres backend developers love.
      </>
    ),
    cta: {
      label: 'Become a partner',
      link: PARTNER_FORM_URL,
    },
    secondaryCta: {
      label: 'Browse partners',
      link: '/partners/integrations',
    },
  },
  reasonsSection: {
    eyebrow: 'Why partner',
    title: 'Three reasons to partner with Supabase',
    description:
      'A growing developer audience, a deeply integrable Postgres platform, and a partner program our customers trust.',
  },
  reasons: [
    {
      title: 'Distribution',
      description:
        '2.5 million developers build on Supabase, and growing. Partner with us and build products that delight some of the most engaged, forward-thinking developers on the planet.',
    },
    {
      title: 'Technical fit',
      description:
        'Every Supabase project is a full Postgres database. Partners that work natively with Postgres, OAuth, foreign data wrappers, and edge functions stay integrated, because the integration runs on widely accepted standards.',
    },
    {
      title: 'Trust',
      description:
        'We list partners we use, partners our customers ask for, and partners that ship working integrations. Both the Partner Catalog and Supabase Marketplace are curated for technical depth and relevance.',
    },
  ],
  waysToPartner: {
    title: 'Ways to partner',
    description:
      'Three paths in. Pick the one that fits where you are today. Partners often start in one and grow into the next.',
    tiers: [
      {
        title: 'Partner Catalog',
        description: (
          <>
            For any company building with Supabase, or maintaining an integration that runs on your
            own surface. Get listed on the{' '}
            <a
              href="/partners/integrations"
              className="text-foreground underline underline-offset-2"
            >
              Supabase Partner Catalog
            </a>
            , where developers and prospects come to find tools that work with Supabase.
          </>
        ),
        bestFor:
          'SaaS products that integrate with Supabase, agencies and consultancies, app templates, hosting providers, and anyone building on top of the platform.',
        whatYouGet: 'A listing, a logo, a category, and a link out.',
        timeToLaunch: 'Days',
      },
      {
        title: 'Supabase Marketplace',
        description:
          'For partners with a deeper, in-product integration. Marketplace lives inside the Supabase dashboard, at the moment a developer is composing their stack. Many Marketplace integrations install in one click through Supabase OAuth: scoped permissions, no copy-pasted service role keys, revocable from the dashboard.',
        bestFor:
          'Products developers add to a project at runtime. Observability, billing, secrets, security, email, encryption, compliance.',
        whatYouGet:
          'Everything in the Partner Catalog, plus an install surface inside every Supabase project, plus joint launch treatment when your integration ships.',
        timeToLaunch: 'Weeks',
      },
      {
        title: 'Strategic partnerships',
        description:
          'For partners with a wider commercial relationship. Joint go-to-market, co-built features, named launches, named investments. Talk to us directly.',
        bestFor:
          'Hyperscalers, platforms, foundational tools, and partners where the integration is bigger than a listing.',
        whatYouGet: 'Defined per partnership.',
        timeToLaunch: 'By arrangement',
      },
    ],
  },
  benefits: {
    title: 'What partnership gets you',
    items: [
      'A spot in the Partner Catalog and, where it fits, in the Supabase Marketplace',
      'Co-marketing on Launch Weeks, blog posts, the @supabase social accounts, and Discord',
      'A direct line to the Supabase product team for technical questions',
      'A developer audience that already uses Postgres',
      'A working integration you can point your own sales team at',
    ],
  },
  howToApply: {
    title: 'How to apply',
    steps: [
      {
        title: 'Apply',
        description:
          'Tell us what you build, who you build it for, and how it works with Supabase. Five minutes.',
      },
      {
        title: 'Review',
        description:
          "Our partnerships team reads everything. We'll come back with questions or with a yes.",
      },
      {
        title: 'Launch',
        description:
          "We'll work with you on the integration, the listing, the launch post, and the next cohort.",
      },
    ],
    cta: {
      label: 'Apply to partner with Supabase',
      link: PARTNER_FORM_URL,
    },
  },
  featuredPartners: {
    title: 'Featured partners',
    description: 'Companies building with Supabase, integrating with Supabase, or both.',
    // Order to lead the logo wall with at launch.
    leadSlugs: ['grafana', 'stripe', 'resend', 'doppler', 'aikido', 'vanta', 'cipherstash'],
  },
  integrationOptions: {
    title: 'Ways you can integrate with Supabase',
    description:
      'Every Supabase project is a full Postgres database. Pick the integration point that fits your product.',
    options: [
      {
        title: 'Publish an OAuth App',
        description:
          'Supabase lets you build a third-party app that can control organizations or projects programmatically.',
        href: 'https://supabase.com/docs/guides/integrations/build-a-supabase-integration',
        icon: <Key strokeWidth={1.5} />,
      },
      {
        title: 'Use the Management API',
        description:
          'Supabase lets you manage projects, branches, secrets, and deployments programmatically from your platform.',
        href: 'https://supabase.com/docs/reference/api/introduction',
        icon: <Globe strokeWidth={1.5} />,
      },
      {
        title: 'Build a Foreign Data Wrapper',
        description:
          'Supabase lets you expose your data as Postgres tables developers can query with SQL alongside their own data.',
        href: 'https://supabase.com/docs/guides/database/extensions/wrappers/overview',
        icon: <Database strokeWidth={1.5} />,
      },
      {
        title: 'Ship a Postgres extension',
        description:
          'Supabase lets you add new types, functions, or operators to every Supabase project.',
        href: 'https://supabase.com/docs/guides/database/extensions',
        icon: <Puzzle strokeWidth={1.5} />,
      },
      {
        title: 'Receive log drains',
        description:
          'Supabase lets you ingest project logs from Pro, Team, and Enterprise projects to power observability tools and platforms.',
        href: 'https://supabase.com/docs/guides/platform/log-drains',
        icon: <FileText strokeWidth={1.5} />,
      },
      {
        title: 'Plug into Supabase Auth',
        description:
          'Supabase lets you act as a third-party identity provider over OIDC or SAML, so developers can sign in to their app through your service.',
        href: 'https://supabase.com/docs/guides/auth/sso',
        icon: <Plug strokeWidth={1.5} />,
      },
      {
        title: 'Connect over Postgres',
        description:
          'Supabase lets your product connect to any Supabase project through a standard Postgres connection string, so anything that speaks Postgres works as-is.',
        href: 'https://supabase.com/docs/guides/database/connecting-to-postgres',
        icon: <Webhook strokeWidth={1.5} />,
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'Is there a fee to be listed?',
        answer: 'No. The Partner Catalog and Supabase Marketplace are curated.',
      },
      {
        question: 'How long does the application take to review?',
        answer:
          'Usually a week. Faster if your integration is already shipped and your application is specific.',
      },
      {
        question: "Can I apply if I haven't built the integration yet?",
        answer: "Yes. Tell us what you're planning. We'll help you scope it.",
      },
      {
        question: "What's the difference between the Partner Catalog and Supabase Marketplace?",
        answer:
          'The Partner Catalog is on supabase.com and is open to any company with a relationship or integration with Supabase. Supabase Marketplace lives in the dashboard and is for partners with a deeper, often one-click, in-product integration. Every Marketplace partner is also a Catalog partner by default.',
      },
      {
        question: 'My integration is on my surface, not yours. Can I still partner?',
        answer: 'Yes. The Partner Catalog is the right home for that. Most partners start there.',
      },
      {
        question: 'How does co-marketing work?',
        answer:
          'It depends on the launch. We coordinate joint blog posts, social posts, and Launch Week slots with partners we work closely with.',
      },
    ],
  },
  finalCta: {
    title: 'Partner with Supabase and accelerate your growth.',
    cta: {
      label: 'Partner with Supabase',
      link: PARTNER_FORM_URL,
    },
    icon: <ArrowUpRight strokeWidth={1.5} />,
  },
}

export default partnersPageData
