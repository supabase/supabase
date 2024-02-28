export default {
  branching: {
    title: 'Branching',
    badge: 'New',
    features: [
      'Branch your Supabase project',
      'Sync with your git branches',
      'Manage every Preview from the Dashboard',
      'Support for Vercel Previews',
    ],
    ctas: [
      {
        label: 'Get Early Access',
        href: 'https://forms.supabase.com/enterprise',
        target: '_blank',
        type: 'primary',
      },
      {
        label: 'Learn more',
        href: '/',
        target: '_blank',
        type: 'default',
      },
    ],
    image: {
      dark: '/images/product/database/branching.svg',
      light: '/images/product/database/branching-light.svg',
    },
  },
  readReplicas: {
    title: 'Read Replicas',
    badge: 'New',
    features: [
      'Serve data closer to your users',
      'Provide data redundancy',
      'Run complex queries without affecting your primary database',
      'Distribute load across various databases',
    ],
    ctas: [
      {
        label: 'Get Early Access',
        href: 'https://forms.supabase.com/enterprise',
        target: '_blank',
        type: 'primary',
      },
      {
        label: 'Learn more',
        href: 'https://supabase.com/docs/reference/cli/supabase-branches',
        target: '_blank',
        type: 'default',
      },
    ],
    image: {
      dark: '/images/product/database/read-replicas.svg',
      light: '/images/product/database/read-replicas-light.svg',
    },
  },
}
