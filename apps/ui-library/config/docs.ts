import { SidebarNavGroup } from '@/types/nav'

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

export const platformBlocks: SidebarNavGroup = {
  title: 'Platform',
  items: [
    {
      title: 'Platform Kit',
      href: '/docs/platform/platform-kit',
      items: [],
      commandItemLabel: 'Platform Kit',
    },
  ],
}

// Component definitions with supported frameworks
export const componentPages: SidebarNavGroup = {
  title: 'Components',
  items: [
    {
      title: 'Client',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react', 'vue', 'nuxtjs'],
      href: '/docs/nextjs/client',
      items: [],
      commandItemLabel: 'Supabase Client',
    },
    {
      title: 'Password-Based Auth',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react', 'vue', 'nuxtjs'],
      href: '/docs/nextjs/password-based-auth',
      items: [],
      commandItemLabel: 'Password-Based Auth',
    },
    {
      title: 'Social Auth',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react', 'vue', 'nuxtjs'],
      href: '/docs/nextjs/social-auth',
      items: [],
      new: true,
      commandItemLabel: 'Social Auth',
    },
    {
      title: 'Dropzone',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react', 'vue', 'nuxtjs'],
      href: '/docs/nextjs/dropzone',
      items: [],
      commandItemLabel: 'Dropzone (File Upload)',
    },
    {
      title: 'Realtime Cursor',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react', 'vue', 'nuxtjs'],
      href: '/docs/nextjs/realtime-cursor',
      items: [],
      commandItemLabel: 'Realtime Cursor',
    },
    {
      title: 'Current User Avatar',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
      href: '/docs/nextjs/current-user-avatar',
      items: [],
      commandItemLabel: 'Current User Avatar',
    },
    {
      title: 'Realtime Avatar Stack',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
      href: '/docs/nextjs/realtime-avatar-stack',
      items: [],
      commandItemLabel: 'Realtime Avatar Stack',
    },
    {
      title: 'Realtime Chat',
      supportedFrameworks: ['nextjs', 'react-router', 'tanstack', 'react'],
      href: '/docs/nextjs/realtime-chat',
      items: [],
      commandItemLabel: 'Realtime Chat',
    },
    {
      title: 'Infinite Query Hook',
      supportedFrameworks: [],
      href: '/docs/infinite-query-hook',
      new: true,
      items: [],
      commandItemLabel: 'Infinite Query Hook',
    },
  ],
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
  ...componentPages.items.map((item) => ({
    label: item.commandItemLabel,
    href: item.href,
  })),
]

// Framework titles for display
export const frameworkTitles: Record<string, string> = {
  nextjs: 'Next.js',
  'react-router': 'React Router',
  tanstack: 'TanStack Start',
  react: 'React SPA',
  vue: 'Vue',
  nuxtjs: 'Nuxt.js',
}
