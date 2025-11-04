import { SidebarNavGroup } from 'types/nav'

export const gettingStarted: SidebarNavGroup = {
  title: 'Courses',
  items: [
    {
      title: 'Foundations',
      href: '/foundations',
      items: [
        {
          title: 'Introduction',
          href: '/foundations/introduction',
        },
        {
          title: 'Architecture',
          href: '/foundations/architecture',
        },
        {
          title: 'Data Fundamentals',
          href: '/foundations/data-fundamentals',
        },
        {
          title: 'Authentication',
          href: '/foundations/authentication',
        },
      ],
      commandItemLabel: 'Foundations',
    },
    {
      title: 'Project: OpenDesk',
      href: '/projects/open-desk',
      commandItemLabel: 'Project: OpenDesk',
    },
    {
      title: 'Performance & Scaling',
      href: '/internals/performance-scaling',
      commandItemLabel: 'Supabase Internals: Performance & Scaling',
    },
    {
      title: 'Debugging & Operations',
      href: '/internals/debugging-operations',
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
