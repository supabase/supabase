import { MainNavItem, SidebarNavItem } from 'types/nav'

interface DocsConfig {
  mainNav?: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const docsConfig: DocsConfig = {
  sidebarNav: [
    {
      title: 'Getting Started',
      items: [
        {
          title: 'Introduction',
          href: '/docs/introduction',
          items: [],
        },
        {
          title: 'Quick Start',
          href: '/docs/quick-start',
          items: [],
        },
      ],
    },
    {
      title: 'Clients',
      items: [
        {
          title: 'React',
          href: '/docs/clients/react',
          items: [],
        },
        {
          title: 'Remix',
          href: '/docs/clients/remix',
          items: [],
        },
        {
          title: 'Next.js',
          href: '/docs/clients/nextjs',
          items: [],
        },
        {
          title: 'Tanstack Start',
          href: '/docs/clients/tanstack',
          items: [],
        },
      ],
    },
    {
      title: 'Blocks',
      items: [
        {
          title: 'Password-Based Auth (Next.js)',
          href: '/docs/blocks/password-based-auth-nextjs',
          items: [],
        },
        {
          title: 'Password-Based Auth (React)',
          href: '/docs/blocks/password-based-auth-react',
          items: [],
        },
      ],
    },
    {
      title: 'Components',
      items: [
        {
          title: 'Realtime Cursor',
          href: '/docs/components/realtime-cursor',
          items: [],
        },
        {
          title: 'Dropzone (File Upload)',
          href: '/docs/components/dropzone',
          items: [],
        },
      ],
    },
  ],
}
