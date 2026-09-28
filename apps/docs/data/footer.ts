import { PrivacySettings } from 'ui-patterns/PrivacySettings'

export const secondaryLinks = [
  {
    title: 'Contributing',
    url: 'https://github.com/supabase/supabase/blob/master/apps/docs/DEVELOPERS.md',
  },
  {
    title: 'Author Styleguide',
    url: 'https://github.com/supabase/supabase/blob/master/apps/docs/CONTRIBUTING.md',
  },
  { title: 'Open Source', url: 'https://supabase.com/open-source' },
  { title: 'SupaSquad', url: 'https://supabase.com/supasquad' },
  { title: 'Privacy Settings', component: PrivacySettings },
]
