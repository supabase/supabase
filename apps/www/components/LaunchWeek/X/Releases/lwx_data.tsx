import { ReactNode } from 'react'

const images = {}

type StepLinkType = 'productHunt' | 'video' | 'docs' | 'xSpace'

export interface StepLink {
  type: StepLinkType
  text?: string
  icon?: any
  href: string
}

export interface StepProps {
  title: string
  badge?: string
  blog?: string
  docs?: string
  description?: string
  github?: string
  hackernews?: string
  product_hunt?: string
  thumb?: string
  url?: string
  video?: string
  twitter_spaces?: string
  className?: string
  hideInBlog?: boolean
  bg_layers?: {
    img?: string
    mobileImg?: string
  }[]
  steps: StepProps[] | []
}

export interface WeekDayProps {
  title: string
  shipped: boolean
  date: string
  published_at: string
  isToday?: boolean
  hasCountdown?: boolean
  description: string | ReactNode
  d: number
  dd: string
  links?: StepLink[]
  videoThumbnail?: string
  blog?: string
  steps: StepProps[] | []
}

export const endOfLW8 = '2023-12-15T23:59:59.999-08:00'

const days: WeekDayProps[] = [
  {
    title: 'Lorem ipsum',
    shipped: true,
    isToday: true,
    hasCountdown: true,
    date: '11 Dec',
    published_at: '2023-12-11T08:00:00.000-08:00',
    description: (
      <>
        Read Replicas Placeholder title for blog post for{' '}
        <strong className="text-foreground">the first day of Launch Week</strong>, can be a bit
        longer and then few things highlighted
      </>
    ),
    d: 1,
    dd: 'Mon',
    links: [
      {
        type: 'productHunt',
        href: '',
      },
      {
        type: 'video',
        href: '',
      },
      {
        type: 'xSpace',
        href: '',
      },
      {
        type: 'docs',
        href: '',
      },
    ],
    steps: [
      {
        title: "Why we'll stay remote",
        blog: '/blog/why-supabase-remote',
        // bg_layers: [{ img: images['00-stay-remote'] }],
        steps: [],
      },
    ],
  },
  {
    title: '',
    shipped: false,
    date: '12 Dec',
    published_at: '2023-12-12T08:00:00.000-08:00',
    description: '',
    d: 2,
    dd: 'Tue',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '13 Dec',
    published_at: '2023-12-13T08:00:00.000-08:00',
    description: '',
    d: 3,
    dd: 'Wed',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '14 Dec',
    published_at: '2023-12-14T08:00:00.000-08:00',
    description: '',
    d: 4,
    dd: 'Thu',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '15 Dec',
    published_at: '2023-12-15T08:00:00.000-08:00',
    description: '',
    d: 5,
    dd: 'Fri',
    steps: [],
  },
]

export default days
