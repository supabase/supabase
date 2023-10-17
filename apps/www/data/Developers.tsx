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
}
