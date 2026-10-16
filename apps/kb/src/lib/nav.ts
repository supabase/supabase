import { FORMAT_TOPICS, TOPICS, topicToSlug, type Topic } from './topics'

interface NavLink {
  label: string
  href: string
}

interface NavLinkGroup {
  label: string
  links: NavLink[]
}

export interface NavMenu {
  label: string
  groups: NavLinkGroup[]
}

export const SIGN_UP_URL = 'https://supabase.com/dashboard/sign-up'

const VISIBLE_TOPICS = TOPICS.filter((topic) => topic.visible).map((topic) => topic.name)

const toTopicLink = (topic: Topic): NavLink => ({
  label: topic,
  href: `${import.meta.env.BASE_URL}/topics/${topicToSlug(topic)}`,
})

export const NAV_MENUS: NavMenu[] = [
  {
    label: 'Topics',
    groups: [
      {
        label: 'By category',
        links: VISIBLE_TOPICS.filter((topic) => FORMAT_TOPICS.includes(topic)).map(toTopicLink),
      },
      {
        label: 'By feature',
        links: VISIBLE_TOPICS.filter((topic) => !FORMAT_TOPICS.includes(topic)).map(toTopicLink),
      },
    ],
  },
  {
    label: 'Resources',
    groups: [
      {
        label: 'Resources',
        links: [
          { label: 'Status', href: 'https://status.supabase.com' },
          { label: 'Changelog', href: 'https://supabase.com/changelog' },
          { label: 'Docs', href: 'https://supabase.com/docs' },
        ],
      },
    ],
  },
]
