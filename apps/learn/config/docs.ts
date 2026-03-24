import { SidebarNavGroup } from 'types/nav'

export const courses: SidebarNavGroup = {
  title: 'Courses',
  items: [
    {
      title: 'Foundations',
      href: '/foundations',
      items: [
        // ✅ Always visible (no requiresAuth)
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
        {
          title: 'Security',
          href: '/foundations/security',
        },
        {
          title: 'Realtime',
          href: '/foundations/realtime',
        },
        {
          title: 'Storage',
          href: '/foundations/storage',
        },
        {
          title: 'Edge Functions',
          href: '/foundations/edge-functions',
        },

        {
          title: 'Vector Search',
          href: '/foundations/vector',
        },
      ],
      commandItemLabel: 'Foundations',
    },
    {
      title: 'Project: Smart Office',
      href: '/projects/smart-office',
      commandItemLabel: 'Project: Smart Office',
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
  ...courses.items.map((item) => ({
    label: item.commandItemLabel,
    href: item.href,
  })),
]
