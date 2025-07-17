export const siteConfig = {
  name: 'Assistant Eval',
  url: 'https://eval.supabase.com/',
  ogImage: 'https://supabase.com/ui/og.jpg',
  description: 'Evaluates the Supabase Assistant',
  links: {
    twitter: 'https://twitter.com/supabase',
    github: 'https://github.com/supabase/supabase/tree/master/apps/eval',
    credits: {
      radix: 'https://www.radix-ui.com/themes/docs/overview/getting-started',
      shadcn: 'https://ui.shadcn.com/',
    },
  },
}

export type SiteConfig = typeof siteConfig
