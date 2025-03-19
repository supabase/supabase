export const siteConfig = {
  name: 'Supabase Design System',
  url: 'https://supabase.com/design-system',
  ogImage: 'https://supabase.com/design-system/og.jpg',
  description: 'Design System of Supabase',
  links: {
    twitter: 'https://twitter.com/supabase',
    github: 'https://github.com/supabase/supabase/tree/master/apps/design-system',
    credits: {
      radix: 'https://www.radix-ui.com/themes/docs/overview/getting-started',
      shadcn: 'https://ui.shadcn.com/',
      geist: 'https://vercel.com/geist/introduction',
    },
  },
}

export type SiteConfig = typeof siteConfig
