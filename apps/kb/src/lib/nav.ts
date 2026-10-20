import { FORMAT_TOPICS, topicToSlug, type Topic } from './topics'

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

const toTopicLink = (topic: Topic): NavLink => ({
  label: topic,
  href: `${import.meta.env.BASE_URL}/topics/${topicToSlug(topic)}`,
})

// topics come from getListedTopics, so the menu only links to topics with entries
export const getNavMenus = (topics: Topic[]): NavMenu[] => [
  {
    label: 'Topics',
    groups: [
      {
        label: 'By category',
        links: topics.filter((topic) => FORMAT_TOPICS.includes(topic)).map(toTopicLink),
      },
      {
        label: 'By feature',
        links: topics.filter((topic) => !FORMAT_TOPICS.includes(topic)).map(toTopicLink),
      },
    ].filter((group) => group.links.length > 0),
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
