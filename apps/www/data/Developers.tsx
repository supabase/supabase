import { Calendar, SquarePlus } from 'lucide-react'
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
          text: 'Supabase UI',
          url: 'https://supabase.com/ui',
          icon: (props: any) => (
            <svg
              width="17"
              height="16"
              viewBox="0 0 17 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              {...props}
            >
              <rect
                x="0.973313"
                y="0.64"
                width="14.72"
                height="14.72"
                rx="1.92"
                stroke="currentColor"
                stroke-width="1.28"
              />
              <path
                d="M8.56519 4.69238H9.74564V8.94966C9.74564 9.41632 9.63534 9.82678 9.41473 10.181C9.19625 10.5353 8.88867 10.8121 8.492 11.0115C8.09534 11.2087 7.63185 11.3074 7.10155 11.3074C6.56913 11.3074 6.10458 11.2087 5.70791 11.0115C5.31125 10.8121 5.00367 10.5353 4.78519 10.181C4.5667 9.82678 4.45746 9.41632 4.45746 8.94966V4.69238H5.63791V8.85102C5.63791 9.12253 5.69731 9.36435 5.81609 9.57647C5.937 9.7886 6.1067 9.95511 6.32519 10.076C6.54367 10.1948 6.80246 10.2542 7.10155 10.2542C7.40064 10.2542 7.65943 10.1948 7.87791 10.076C8.09852 9.95511 8.26822 9.7886 8.387 9.57647C8.50579 9.36435 8.56519 9.12253 8.56519 8.85102V4.69238Z"
                fill="currentColor"
              />
              <path d="M12.2092 4.69238V11.2087H11.0287V4.69238H12.2092Z" fill="currentColor" />
            </svg>
          ),
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
        {
          text: 'Events & Webinars',
          url: '/events',
          icon: Calendar,
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
