import {
  ArrowRight,
  ArrowUpRight,
  Database,
  FileText,
  Globe,
  Key,
  Plug,
  Puzzle,
  Webhook,
} from 'lucide-react'

export const PARTNER_FORM_ANCHOR = '#become-a-partner'
export const PARTNER_FORM_URL = 'https://share.hsforms.com/1ZSo-7Y0GRfuTdvWusOP13Abvo3m'

const partnersPageData = {
  metaTitle: 'Partner with Supabase',
  metaDescription:
    'Reach 9 million developers. Ship integrations that feel native to Postgres, in front of the developers already building on it.',
  heroSection: {
    title: 'Partners',
    h1: <>Build with Supabase. Reach 9 million developers.</>,
    subheader: (
      <>
        Ship integrations that feel native to Postgres, in front of the developers already building
        on it.
      </>
    ),
    cta: {
      label: 'Become a partner',
      link: PARTNER_FORM_ANCHOR,
    },
    secondaryCta: {
      label: 'Browse the Partner Catalog',
      link: '/partners/catalog',
      icon: <ArrowRight strokeWidth={1.5} />,
    },
  },
  reasonsSection: {
    eyebrow: 'Why partner',
    title: 'Three reasons to partner with Supabase',
    description:
      'A growing developer audience, the deep extensibility of Postgres, and a partner program our customers trust.',
  },
  reasons: [
    {
      title: 'Distribution',
      description:
        '9 million developers and growing. Your product, in front of the ones already shipping.',
    },
    {
      title: 'Technical fit',
      description:
        'Every Supabase project is real Postgres. Standard interfaces, no proprietary glue, no rewrite every six months.',
    },
    {
      title: 'Trust',
      description:
        'We list partners we use and partners that actually ship. The catalog is curated, which is why developers read it.',
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
            A listing on the <span className="text-foreground">Supabase Partner Catalog</span>, open
            to anyone with a real integration or a real relationship with Supabase.
          </>
        ),
        bestFor: 'SaaS, agencies, templates, hosting.',
        whatYouGet: 'Listing, logo, category, outbound link.',
        timeToLaunch: 'Days',
        cta: {
          label: 'Browse the Partner Catalog',
          link: '/partners/catalog',
          icon: <ArrowRight size={18} strokeWidth={1.5} />,
        },
      },
      {
        title: 'Supabase Marketplace',
        description:
          'An install surface inside the dashboard, the moment a developer is composing their stack. Many integrations install in one click through Supabase OAuth: scoped, revocable, no copy-pasted service role keys.',
        bestFor:
          'Things developers add at runtime. Observability, billing, secrets, email, security, compliance.',
        whatYouGet:
          'Everything in the Catalog, plus in-dashboard install, plus joint launch treatment.',
        timeToLaunch: 'Weeks',
        cta: {
          label: 'Browse the Supabase Marketplace',
          link: 'https://supabase.com/dashboard/project/_/integrations',
          icon: <ArrowRight size={18} strokeWidth={1.5} />,
        },
      },
      {
        title: 'Strategic partnerships',
        description:
          'Joint go-to-market, co-built features, named launches, named investments. Talk to us directly.',
        bestFor: 'Hyperscalers, platforms, foundational tools.',
        whatYouGet: 'Defined per partnership.',
        timeToLaunch: 'By arrangement',
      },
    ],
  },
  benefits: {
    title: 'What partnership gets you',
    items: [
      'Distribution to developers already shipping on Postgres',
      'Co-marketing across Launch Weeks, blog, social, and Discord',
      'A direct line to the Supabase product team',
      'A working integration your own sales team can point at',
    ],
  },
  howToApply: {
    title: 'How to apply',
    steps: [
      {
        title: 'Apply',
        description: "Five minutes. What you build, who it's for, and how it works with Supabase.",
      },
      {
        title: 'Review',
        description: 'Usually a week. Faster if the integration is already shipped.',
      },
      {
        title: 'Launch',
        description: 'We help with the listing, the integration, and the launch post.',
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
        title: 'OAuth App',
        description: 'Control organizations and projects programmatically.',
        href: 'https://supabase.com/docs/guides/integrations/build-a-supabase-integration',
        icon: <Key size={18} strokeWidth={1.5} />,
      },
      {
        title: 'Management API',
        description: 'Manage projects, branches, secrets, and deployments.',
        href: 'https://supabase.com/docs/reference/api/introduction',
        icon: <Globe size={18} strokeWidth={1.5} />,
      },
      {
        title: 'Foreign Data Wrapper',
        description: 'Expose your data as Postgres tables developers can query with SQL.',
        href: 'https://supabase.com/docs/guides/database/extensions/wrappers/overview',
        icon: <Database size={18} strokeWidth={1.5} />,
      },
      {
        title: 'Postgres extension',
        description: 'Add types, functions, or operators to every Supabase project.',
        href: 'https://supabase.com/docs/guides/database/extensions',
        icon: <Puzzle size={18} strokeWidth={1.5} />,
      },
      {
        title: 'Log drains',
        description: 'Receive project logs from Pro, Team, and Enterprise projects.',
        href: 'https://supabase.com/docs/guides/platform/log-drains',
        icon: <FileText size={18} strokeWidth={1.5} />,
      },
      {
        title: 'Auth provider',
        description: 'Act as a third-party identity provider over OIDC or SAML.',
        href: 'https://supabase.com/docs/guides/auth/sso',
        icon: <Plug size={18} strokeWidth={1.5} />,
      },
      {
        title: 'Postgres connection',
        description: 'Anything that speaks Postgres works as-is.',
        href: 'https://supabase.com/docs/guides/database/connecting-to-postgres',
        icon: <Webhook size={18} strokeWidth={1.5} />,
      },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'Is there a fee to be listed?',
        answer: 'No. The Catalog and Marketplace are curated, not paid.',
      },
      {
        question: 'How long is review?',
        answer:
          'About a week. Faster if the integration is shipped and the application is specific.',
      },
      {
        question: 'Can I apply before the integration is built?',
        answer: "Yes. Tell us the plan, we'll help you scope it.",
      },
      {
        question: 'Catalog vs. Marketplace?',
        answer:
          'Catalog lives on supabase.com and is open to any real integration. Marketplace lives in the dashboard and is for in-product, often one-click installs. Every Marketplace partner is a Catalog partner.',
      },
    ],
  },
  finalCta: {
    title: 'Partner with Supabase.',
    cta: {
      label: 'Become a partner',
      link: PARTNER_FORM_URL,
    },
    icon: <ArrowUpRight strokeWidth={1.5} />,
  },
}

export default partnersPageData
