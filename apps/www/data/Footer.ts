import { PrivacySettings } from 'ui-patterns/PrivacySettings'
import { skillBasedSolutions, useCaseSolutions } from 'data/Solutions'

const footerData = [
  {
    title: 'Product',
    links: [
      {
        text: 'Database',
        url: '/database',
      },
      {
        text: 'Auth',
        url: '/auth',
      },
      {
        text: 'Functions',
        url: '/edge-functions',
      },
      {
        text: 'Realtime',
        url: '/realtime',
      },
      {
        text: 'Storage',
        url: '/storage',
      },
      {
        text: 'Vector',
        url: '/modules/vector',
      },
      {
        text: 'Cron',
        url: '/modules/cron',
      },
      {
        text: 'Pricing',
        url: '/pricing',
      },
      {
        text: 'Launch Week',
        url: '/launch-week',
      },
    ],
  },
  {
    title: 'Solutions',
    links: [
      ...skillBasedSolutions.solutions.map((solution) => ({
        text: solution.text,
        url: solution.url,
      })),
      ...useCaseSolutions.solutions.map((solution) => ({
        text: solution.text,
        url: solution.url,
      })),
    ],
  },
  {
    title: 'Resources',
    links: [
      {
        text: 'Blog',
        url: '/blog',
      },
      {
        text: 'Support',
        url: '/support',
      },
      {
        text: 'System Status',
        url: 'https://status.supabase.com/',
      },
      {
        text: 'Become a Partner',
        url: '/partners',
      },
      {
        text: 'Integrations',
        url: '/partners/integrations',
      },
      {
        text: 'Brand Assets',
        url: '/brand-assets',
      },
      {
        text: 'Security & Compliance',
        url: '/security',
      },
      {
        text: 'DPA',
        url: '/legal/dpa',
      },
      {
        text: 'SOC2',
        url: '/security',
      },
      {
        text: 'HIPAA',
        url: 'https://forms.supabase.com/hipaa2',
      },
    ],
  },
  {
    title: 'Developers',
    links: [
      {
        text: 'Documentation',
        url: '/docs',
      },
      {
        text: 'Supabase UI',
        url: 'https://supabase.com/ui',
      },
      {
        text: 'Changelog',
        url: '/changelog',
      },
      {
        text: 'Careers',
        url: '/careers',
      },
      {
        text: 'Contributing',
        url: 'https://github.com/supabase/supabase/blob/master/CONTRIBUTING.md',
      },
      {
        text: 'Open Source',
        url: '/open-source',
      },
      {
        text: 'SupaSquad',
        url: '/supasquad',
      },
      {
        text: 'DevTo',
        url: 'https://dev.to/supabase',
      },
      {
        text: 'RSS',
        url: '/rss.xml',
      },
    ],
  },
  {
    title: 'Company',
    links: [
      {
        text: 'Company',
        url: '/company',
      },
      {
        text: 'General Availability',
        url: '/ga',
      },
      {
        text: 'Terms of Service',
        url: '/terms',
      },
      {
        text: 'Privacy Policy',
        url: '/privacy',
      },
      {
        text: 'Privacy Settings',
        component: PrivacySettings,
      },
      {
        text: 'Acceptable Use Policy',
        url: '/aup',
      },
      {
        text: 'Support Policy',
        url: '/support-policy',
      },
      {
        text: 'Service Level Agreement',
        url: '/sla',
      },
      {
        text: 'Humans.txt',
        url: '/humans.txt',
      },
      {
        text: 'Lawyers.txt',
        url: '/lawyers.txt',
      },
      {
        text: 'Security.txt',
        url: '/.well-known/security.txt',
      },
    ],
  },
]

export default footerData
