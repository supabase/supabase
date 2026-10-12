import { TOPICS, topicToSlug } from './topics'

export interface NavLink {
  label: string
  href: string
}

export interface NavMenu {
  label: string
  links: NavLink[]
}

export const SIGN_UP_URL = 'https://supabase.com/dashboard/sign-up'

export const NAV_MENUS: NavMenu[] = [
  {
    label: 'Topics',
    links: TOPICS.filter((topic) => topic.visible).map((topic) => ({
      label: topic.name,
      href: `${import.meta.env.BASE_URL}/topics/${topicToSlug(topic.name)}`,
    })),
  },
  {
    label: 'Resources',
    links: [
      { label: 'Status', href: 'https://status.supabase.com' },
      { label: 'Changelog', href: 'https://supabase.com/changelog' },
      { label: 'Docs', href: 'https://supabase.com/docs' },
    ],
  },
]
