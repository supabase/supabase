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
    className?: string
  }[]
  steps: StepProps[] | []
}

export interface WeekDayProps {
  id: string
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
    id: 'day-1',
    title: 'Read Replicas',
    shipped: false,
    // isToday: true,
    blog: '',
    hasCountdown: true,
    date: '11 Dec',
    published_at: '2023-12-11T08:00:00.000-08:00',
    description: null,
    d: 1,
    dd: 'Mon',
    links: [
      {
        type: 'productHunt',
        href: 'https://www.producthunt.com/',
      },
      {
        type: 'video',
        href: 'https://www.youtube.com/',
      },
      {
        type: 'xSpace',
        href: 'https://twitter.com/home',
      },
      {
        type: 'docs',
        href: 'https://supabase.com/docs',
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
    id: 'day-2',
    title: '',
    shipped: false,
    blog: '',
    hasCountdown: false,
    date: '12 Dec',
    published_at: '2023-12-12T08:00:00.000-08:00',
    description: '',
    d: 2,
    dd: 'Tue',
    steps: [],
  },
  {
    id: 'day-3',
    title: '',
    shipped: false,
    blog: '',
    date: '13 Dec',
    published_at: '2023-12-13T08:00:00.000-08:00',
    description: '',
    d: 3,
    dd: 'Wed',
    steps: [],
  },
  {
    id: 'day-4',
    title: '',
    shipped: false,
    blog: '',
    date: '14 Dec',
    published_at: '2023-12-14T08:00:00.000-08:00',
    description: '',
    d: 4,
    dd: 'Thu',
    steps: [],
  },
  {
    id: 'day-5',
    title: '',
    shipped: false,
    blog: '',
    date: '15 Dec',
    published_at: '2023-12-15T08:00:00.000-08:00',
    description: '',
    d: 5,
    dd: 'Fri',
    steps: [],
  },
]

export default days
