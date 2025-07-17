import { ReactNode } from 'react'

type StepLinkType = 'productHunt' | 'video' | 'docs' | 'xSpace' | 'blog' | 'podcast'

export interface StepLink {
  type: StepLinkType
  text?: string
  icon?: any
  href: string
}

export interface StepProps {
  title: string
  icon?: string
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
    imgLight?: string
    mobileImgLight?: string
    className?: string
  }[]
  steps?: StepProps[] | []
  links?: StepLink[]
}

export interface WeekDayProps {
  id: string
  title: string
  date: string
  d: number
  dd: string
  published_at: string
  shipped: boolean // show card in layout
  isToday?: boolean // current active day
  hasCountdown?: boolean // use countdown only on "tomorrow"
  description: string | ReactNode
  links?: StepLink[] // types = 'productHunt' | 'video' | 'docs' | 'xSpace' | 'blog' | 'podcast'
  videoId?: string // youtube id
  videoThumbnail?: string
  blog: string
  steps: StepProps[] | []
}

export const endOfLW13Hackathon = '2025-04-04T23:59:59.999-08:00'

const days: (isDark?: boolean) => WeekDayProps[] = (isDark = true) => [
  {
    id: 'day-1',
    d: 1,
    dd: 'Mon',
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '/blog/jwt-signing-keys',
    date: 'Monday',
    published_at: '2025-03-31T07:00:00.000-07:00',
    title: 'Introducing JWT Signing Keys',
    description: '',
    links: [
      {
        type: 'video',
        href: 'htzj9SkkhhA',
      },
    ],
    steps: [
      {
        title: '',
        url: '#',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/15/d1.png',
          },
        ],
      },
    ],
  },
  {
    id: 'day-2',
    d: 2,
    dd: 'Tue',
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '/blog/analytics-buckets',
    date: 'Tuesday',
    published_at: '2025-04-01T07:00:00.000-07:00',
    title: 'Introducing Supabase Analytics Buckets with Iceberg Support',
    description: '',
    links: [
      {
        type: 'video',
        href: 'BigtFoFCVBk',
      },
    ],
    steps: [
      {
        title: '',
        url: '#',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/15/d2.png',
          },
        ],
      },
    ],
  },
  {
    id: 'day-3',
    d: 3,
    dd: 'Wed',
    shipped: true,
    isToday: true,
    hasCountdown: false,
    blog: '/blog/branching-2-0',
    date: 'Wednesday',
    published_at: '2025-04-02T07:00:00.000-07:00',
    title: 'Introducing Branching 2.0',
    description: '',
    links: [
      {
        type: 'video',
        href: 'CRARnyYqrOU',
      },
    ],
    steps: [
      {
        title: '',
        url: '#',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/15/d3.png',
          },
        ],
      },
    ],
  },
  {
    id: 'day-4',
    d: 4,
    dd: 'Thu',
    shipped: false,
    isToday: false,
    hasCountdown: false,
    blog: '/blog/',
    date: 'Thursday',
    published_at: '2025-04-03T07:00:00.000-07:00',
    title: '',
    description: '',
    links: [
      {
        type: 'video',
        href: '',
      },
    ],
    steps: [
      {
        title: '',
        url: '#',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/15/d4.png',
          },
        ],
      },
    ],
  },
  {
    id: 'day-5',
    d: 5,
    dd: 'Fri',
    shipped: false,
    isToday: false,
    hasCountdown: false,
    blog: '/blog/',
    date: 'Friday',
    published_at: '2025-04-04T07:00:00.000-07:00',
    title: '',
    description: '',
    links: [
      {
        type: 'video',
        href: '',
      },
      // {
      //   type: 'xSpace',
      //   href: 'https://twitter.com/i/spaces/',
      // },
    ],
    steps: [
      {
        title: '',
        url: '#',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/15/d5.png',
          },
        ],
      },
    ],
  },
]
export default days
