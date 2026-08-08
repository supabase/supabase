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

import { PARTNER_TYPES } from '@/components/Partners/PartnerIntakeForm'

export const PARTNER_FORM_ANCHOR = '#become-a-partner'

const partnersPageData = {
  metaTitle: 'Partner with Supabase',
  metaDescription:
    'Reach 9 million developers. Ship integrations and offer services that help businesses build on Supabase.',
  heroSection: {
    title: 'Partners',
    h1: <>Build with Supabase. Reach 9 million developers.</>,
    subheader: <>Ship integrations and offer services that help businesses build on Supabase.</>,
    cta: {
      label: 'Apply as a Partner',
      link: PARTNER_FORM_ANCHOR,
    },
    secondaryCta: {
      label: 'Partner Catalog',
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
    tiers: [
      {
        title: 'Integration Partner',
        description: (
          <>
            You've built something that works with Supabase: a tool, extension, connector, or
            service. We list it, co-market it, and put it in front of developers who are actively
            composing their stack.
          </>
        ),
        cta: {
          label: 'Apply as Integration Partner',
          link: `?partner_type=${PARTNER_TYPES.technology}${PARTNER_FORM_ANCHOR}`,
        },
        bestFor:
          'developer tools, SaaS products, hosting, observability, auth, billing, and anything else developers add to a Postgres project.',
      },
      {
        title: 'Solution Partner',
        description: 'You build on Supabase on behalf of clients.',
        cta: {
          label: 'Apply as Solution Partner',
          link: `?partner_type=${PARTNER_TYPES.solutions}${PARTNER_FORM_ANCHOR}`,
        },
        bestFor: 'agencies, consultancies, and service providers.',
      },
    ],
  },
  benefits: {
    title: 'What your Supabase partnership gets you',
    description: 'Distribution to developers already shipping on Postgres, and much more.',
    items: [
      <>
        <strong className="block text-foreground font-normal">
          A listing in the Partner Catalog:
        </strong>{' '}
        Searchable by category, visible to developers actively evaluating tools
      </>,
      <>
        <strong className="block text-foreground font-normal">Co-marketing:</strong> Supabase's
        highest-traffic moments like Launch Weeks, with blog, social, and Discord reach
      </>,
      <>
        <strong className="block text-foreground font-normal">
          A direct line to the product team:
        </strong>{' '}
        Actual engineers who know the integration surface, not a support queue
      </>,
      <>
        <strong className="block text-foreground font-normal">
          Something your sales team can use:
        </strong>{' '}
        A Supabase-verified listing is a trust signal with developers who already know us
      </>,
    ],
  },
  howToApply: {
    title: 'Ways to apply',
    steps: [
      {
        title: 'Apply',
        description:
          "This takes five minutes. Tell us what you build, who it's for, and how it connects to Supabase.",
      },
      {
        title: 'Review',
        description: 'This takes a week. It’s faster if the integration is already live.',
      },
      {
        title: 'Launch',
        description: 'We help with the listing, the integration, and the launch moment.',
      },
    ],
    cta: {
      label: 'Apply to partner with Supabase',
      link: PARTNER_FORM_ANCHOR,
    },
  },
  featuredPartners: {
    title: 'In good company',
    description: 'Companies building with Supabase, integrating with Supabase, or both.',
    // Order to lead the logo wall with at launch.
    leadSlugs: ['grafana', 'stripe', 'resend', 'doppler', 'aikido', 'vanta', 'cipherstash'],
  },
  integrationOptions: {
    title: 'Ways you can integrate with Supabase',
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
        answer: 'No. The partner catalog is free.',
      },
      {
        question: 'Can I apply before my integration is built?',
        answer:
          "Yes, though your application moves faster if the integration is already live. Tell us what you're building and where you are, and we’ll go from there.",
      },
      {
        question: 'How long is review?',
        answer: 'Usually a week. We get back to you either way.',
      },
      {
        question: 'What’s the difference between an Integration Partner and a Solution Partner?',
        answer:
          'Integration partners build technical products that connect to Supabase. Solution partners are agencies or consultancies that build on Supabase for clients.',
      },
      {
        question: 'Do I need to be a Supabase customer?',
        answer:
          'No, but your integration should work with Supabase projects. Most partners build on a free plan to start.',
      },
    ],
  },
  finalCta: {
    title: 'Partner with Supabase.',
    cta: {
      label: 'Become a partner',
      link: PARTNER_FORM_ANCHOR,
    },
    icon: <ArrowUpRight strokeWidth={1.5} />,
  },
}

export type PARTNER_TIER = {
  title: string
  description: React.ReactNode
  bestFor: string
  whatYouGet?: string
  timeToLaunch?: string
  cta?: {
    label: string
    link: string
    icon?: React.ReactNode
  }
}

export default partnersPageData
