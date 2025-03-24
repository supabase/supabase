import { MainNavItem, SidebarNavGroup, SidebarNavItem } from 'types/nav'

interface DocsConfig {
  mainNav?: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const gettingStarted: SidebarNavGroup = {
  title: 'Getting Started',
  items: [
    {
      title: 'Introduction',
      href: '/docs/getting-started/introduction',
      items: [],
      commandItemLabel: 'Introduction',
    },
    {
      title: 'Quick Start',
      href: '/docs/getting-started/quickstart',
      items: [],
      commandItemLabel: 'Quick Start',
    },
    {
      title: 'FAQ',
      href: '/docs/getting-started/faq',
      items: [],
      commandItemLabel: 'FAQ',
    },
  ],
}

export const aiEditorsRules: SidebarNavGroup = {
  title: 'AI Editors Rules',
  items: [
    {
      title: 'Prompts',
      href: '/docs/ai-editors-rules/prompts',
      items: [],
      commandItemLabel: 'AI Editors Rules',
    },
  ],
}

export const frameworkPages: Record<string, SidebarNavGroup> = {
  nextjs: {
    title: 'Next.js',
    items: [
      {
        title: 'Client',
        href: '/docs/nextjs/client',
        items: [],
        commandItemLabel: 'Supabase Client for Next.js',
      },
      {
        title: 'Password-Based Auth',
        href: '/docs/nextjs/password-based-auth',
        items: [],
        commandItemLabel: 'Password-Based Auth for Next.js',
      },
      {
        title: 'Dropzone',
        href: '/docs/nextjs/dropzone',
        items: [],
        commandItemLabel: 'Dropzone for Next.js',
      },
      {
        title: 'Realtime Cursor',
        href: '/docs/nextjs/realtime-cursor',
        items: [],
        commandItemLabel: 'Realtime Cursor for Next.js',
      },
    ],
  },
  'react-router': {
    title: 'React Router',
    items: [
      {
        title: 'Dropzone',
        href: '/docs/react-router/dropzone',
        items: [],
        commandItemLabel: 'Dropzone for React Router',
      },
      {
        title: 'Realtime Cursor',
        href: '/docs/react-router/realtime-cursor',
        items: [],
        commandItemLabel: 'Realtime Cursor for React Router',
      },
    ],
  },
  tanstack: {
    title: 'Tanstack Start',
    items: [
      {
        title: 'Client',
        href: '/docs/tanstack/client',
        items: [],
        commandItemLabel: 'Supabase Client for Tanstack Start',
      },
      {
        title: 'Password-Based Auth',
        href: '/docs/tanstack/password-based-auth',
        items: [],
        commandItemLabel: 'Password-Based Auth for Tanstack Start',
      },
      {
        title: 'Dropzone',
        href: '/docs/tanstack/dropzone',
        items: [],
        commandItemLabel: 'Dropzone for Tanstack Start',
      },
      {
        title: 'Realtime Cursor',
        href: '/docs/tanstack/realtime-cursor',
        items: [],
        commandItemLabel: 'Realtime Cursor for Tanstack Start',
      },
    ],
  },
  react: {
    title: 'React',
    items: [
      {
        title: 'Password-Based Auth',
        href: '/docs/react/password-based-auth',
        items: [],
        commandItemLabel: 'Password-Based Auth for React',
      },
      {
        title: 'Dropzone',
        href: '/docs/react/dropzone',
        items: [],
        commandItemLabel: 'Dropzone for React',
      },
      {
        title: 'Realtime Cursor',
        href: '/docs/react/realtime-cursor',
        items: [],
        commandItemLabel: 'Realtime Cursor for React',
      },
    ],
  },
}

export const COMMAND_ITEMS = [
  ...gettingStarted.items.map((item) => ({
    label: item.commandItemLabel,
    href: item.href,
  })),
  ...aiEditorsRules.items.map((item) => ({
    label: item.commandItemLabel,
    href: item.href,
  })),
  ...Object.values(frameworkPages).flatMap((group) =>
    group.items.map((item) => ({
      label: item.commandItemLabel,
      href: item.href,
    }))
  ),
]
