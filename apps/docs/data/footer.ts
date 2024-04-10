import { IconCheckCircle, IconLifeBuoy } from 'ui'
import { PrivacySettings } from 'ui-patterns/PrivacySettings'

export const primaryLinks = [
  {
    featherIcon: IconLifeBuoy,
    text: 'Need some help?',
    ctaLabel: 'Contact support',
    url: 'https://supabase.com/support',
  },
  {
    icon: 'M12.9521 10.5073C12.766 10.3212 12.5289 10.1943 12.2708 10.1427L10.6794 9.82467C9.80719 9.65024 8.90169 9.77152 8.10609 10.1693L7.89409 10.2747C7.0985 10.6725 6.193 10.7938 5.32076 10.6193L4.03343 10.362C3.81823 10.319 3.59574 10.3298 3.38571 10.3934C3.17569 10.457 2.9846 10.5715 2.82943 10.7267M5.33343 2.88867H10.6668L10.0001 3.55534V7.00334C10.0002 7.35693 10.1407 7.69602 10.3908 7.94601L13.7241 11.2793C14.5641 12.1193 13.9688 13.5553 12.7808 13.5553H3.21876C2.03076 13.5553 1.43609 12.1193 2.27609 11.2793L5.60943 7.94601C5.85949 7.69602 6.00002 7.35693 6.00009 7.00334V3.55534L5.33343 2.88867Z',
    text: 'Latest product updates?',
    ctaLabel: 'See Changelog',
    url: 'https://supabase.com/changelog',
  },
  {
    featherIcon: IconCheckCircle,
    text: "Something's not right?",
    ctaLabel: 'Check system status',
    url: 'https://status.supabase.com/',
  },
]

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
