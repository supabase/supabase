import { SidebarNavGroup } from 'types/nav'

export const gettingStarted: SidebarNavGroup = {
  title: 'Courses',
  items: [
    {
      title: 'Supabase Foundations',
      href: '/foundations',
      items: [
        {
          title: 'Introduction',
          href: '/foundations/introduction',
          items: [],
        },
        {
          title: 'Quickstart',
          href: '/foundations/quickstart',
          items: [],
        },
        {
          title: 'FAQ',
          href: '/foundations/faq',
          items: [],
        },
      ],
      commandItemLabel: 'Supabase Foundations',
    },
    {
      title: 'Project: OpenDesk',
      href: '/projects/open-desk',
      items: [],
      commandItemLabel: 'Project: OpenDesk',
    },
    {
      title: 'Performance & Scaling',
      href: '/internals/performance-scaling',
      items: [],
      commandItemLabel: 'Supabase Internals: Performance & Scaling',
    },
    {
      title: 'Debugging & Operations',
      href: '/internals/debugging-operations',
      items: [],
      commandItemLabel: 'Supabase Internals: Debugging & Operations',
    },
  ],
}

export const COMMAND_ITEMS = [
  ...gettingStarted.items.map((item) => ({
    label: item.commandItemLabel,
    href: item.href,
  })),
]
