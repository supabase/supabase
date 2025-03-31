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
    isToday: true,
    hasCountdown: false,
    blog: '/blog/supabase-ui-library',
    date: '31 March',
    published_at: '2025-03-31T07:00:00.000-07:00',
    title: 'Supabase UI Library',
    description: 'Supabase UI Library',
    links: [
      {
        type: 'video',
        href: '2TIuUjkCDFE',
      },
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1BdGYqbwZEZGX',
      },
    ],
    steps: [
      {
        title: 'TBD',
        url: '#',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/14/releases/d1/day-1-dark.svg',
            mobileImg: '/images/launchweek/14/releases/d1/day-1-dark-mobile.svg',
            imgLight: '/images/launchweek/14/releases/d1/day-1-light.svg',
            mobileImgLight: '/images/launchweek/14/releases/d1/day-1-light-mobile.svg',
          },
        ],
      },
    ],
  },
  {
    id: 'day-2',
    d: 2,
    dd: 'Tue',
    shipped: false,
    isToday: false,
    hasCountdown: true,
    blog: '',
    date: '01 April',
    published_at: '2025-04-01T07:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1rmxPyVkLjbKN',
      },
    ],
    steps: [],
  },
  {
    id: 'day-3',
    d: 3,
    dd: 'Wed',
    shipped: false,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '02 April',
    published_at: '2025-04-02T07:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1zqKVjoPQzLKB',
      },
    ],
    steps: [],
  },
  {
    id: 'day-4',
    d: 4,
    dd: 'Thu',
    shipped: false,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '03 April',
    published_at: '2025-04-03T07:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1MnGnwOpYgkJO',
      },
    ],
    steps: [],
  },
  {
    id: 'day-5',
    d: 5,
    dd: 'Fri',
    shipped: false,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '04 April',
    published_at: '2025-04-04T07:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1OwxWXywakQKQ',
      },
    ],
    steps: [],
  },
]

export default days
