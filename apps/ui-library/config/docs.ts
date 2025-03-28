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

// Framework titles for display
export const frameworkTitles: Record<string, string> = {
  nextjs: 'Next.js',
  'react-router': 'React Router',
  tanstack: 'Tanstack Start',
  react: 'React SPA',
}

// Component definitions with supported frameworks
export const componentPages: Record<
  string,
  {
    title: string
    supportedFrameworks: string[]
    commandItemLabel: string
    href: string
  }
> = {
  client: {
    title: 'Client',
    supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
    commandItemLabel: 'Supabase Client',
    href: '/docs/nextjs/client',
  },
  'password-based-auth': {
    title: 'Password-Based Auth',
    supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
    commandItemLabel: 'Password-Based Auth',
    href: '/docs/nextjs/password-based-auth',
  },
  dropzone: {
    title: 'Dropzone',
    supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
    commandItemLabel: 'Dropzone (File Upload)',
    href: '/docs/nextjs/dropzone',
  },
  'realtime-cursor': {
    title: 'Realtime Cursor',
    supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
    commandItemLabel: 'Realtime Cursor',
    href: '/docs/nextjs/realtime-cursor',
  },
  'current-user-avatar': {
    title: 'Current User Avatar',
    supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
    commandItemLabel: 'Current User Avatar',
    href: '/docs/nextjs/current-user-avatar',
  },
  'realtime-avatar-stack': {
    title: 'Realtime Avatar Stack',
    supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
    commandItemLabel: 'Realtime Avatar Stack',
    href: '/docs/nextjs/realtime-avatar-stack',
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
  ...Object.entries(componentPages).map(([_, component]) => ({
    label: component.commandItemLabel,
    href: component.href,
  })),
]
