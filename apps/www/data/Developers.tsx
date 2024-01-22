import {
  IconBriefcase2,
  IconChangelog,
  IconDiscussions,
  IconDocumentation,
  IconGitHubSolid,
  IconIntegrations,
  IconLifeBuoy2,
  IconPartners,
} from 'ui'

export const data = {
  navigation: [
    {
      label: 'Developers',
      links: [
        {
          text: 'Documentation',
          url: '/docs',
          icon: IconDocumentation,
        },
        {
          text: 'Integrations',
          url: '/partners/integrations',
          icon: IconIntegrations,
        },
        {
          text: 'Changelog',
          description: 'See the latest updates and product improvements.',
          url: '/changelog',
          icon: IconChangelog,
        },
        {
          text: 'Support',
          description: 'See the latest updates and product improvements.',
          url: '/support',
          icon: IconLifeBuoy2,
        },
      ],
    },
    {
      label: 'Resources',
      links: [
        {
          text: 'Open Source',
          description: 'We support existing open source tools and communities wherever possible.',
          url: '/open-source',
          icon: IconGitHubSolid,
        },
        {
          text: 'GitHub Discussions',
          url: 'https://github.com/orgs/supabase/discussions',
          icon: IconDiscussions,
        },
        {
          text: 'Become a Partner',
          url: '/partners',
          icon: IconPartners,
        },
        {
          text: 'Careers',
          url: '/careers',
          icon: IconBriefcase2,
        },
      ],
    },
  ],
  footer: {
    support: {
      text: 'Support',
      description: '',
      url: '/support',
      icon: 'M6.87232 21.5743C9.09669 21.5743 10.8999 19.7711 10.8999 17.5467C10.8999 15.3223 9.09669 13.5191 6.87232 13.5191C4.64794 13.5191 2.84473 15.3223 2.84473 17.5467C2.84473 19.7711 4.64794 21.5743 6.87232 21.5743Z M17.127 3.67236V11.1724M20.877 7.42274H13.377M3.12305 3.67236H10.6231V11.1724H3.12305V3.67236ZM13.377 13.7966H20.877V21.2966H13.377V13.7966ZM10.8999 17.5467C10.8999 19.7711 9.09669 21.5743 6.87232 21.5743C4.64794 21.5743 2.84473 19.7711 2.84473 17.5467C2.84473 15.3223 4.64794 13.5191 6.87232 13.5191C9.09669 13.5191 10.8999 15.3223 10.8999 17.5467Z',
    },
    systemStatus: {
      text: 'System Status',
      description: '',
      url: 'https://status.supabase.com/',
      icon: 'M6.87232 21.5743C9.09669 21.5743 10.8999 19.7711 10.8999 17.5467C10.8999 15.3223 9.09669 13.5191 6.87232 13.5191C4.64794 13.5191 2.84473 15.3223 2.84473 17.5467C2.84473 19.7711 4.64794 21.5743 6.87232 21.5743Z M17.127 3.67236V11.1724M20.877 7.42274H13.377M3.12305 3.67236H10.6231V11.1724H3.12305V3.67236ZM13.377 13.7966H20.877V21.2966H13.377V13.7966ZM10.8999 17.5467C10.8999 19.7711 9.09669 21.5743 6.87232 21.5743C4.64794 21.5743 2.84473 19.7711 2.84473 17.5467C2.84473 15.3223 4.64794 13.5191 6.87232 13.5191C9.09669 13.5191 10.8999 15.3223 10.8999 17.5467Z',
    },
  },
}
