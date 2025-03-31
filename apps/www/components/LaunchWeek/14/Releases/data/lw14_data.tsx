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
    shipped: false,
    isToday: false,
    hasCountdown: true,
    blog: '',
    date: '31 March',
    published_at: '2025-03-31T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: 'https://twitter.com/i/spaces/1yoJMyjzVWRJQ',
      // },
    ],
    steps: [],
  },
  {
    id: 'day-2',
    d: 2,
    dd: 'Tue',
    shipped: false,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '01 April',
    published_at: '2025-04-01T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: 'https://twitter.com/i/spaces/1yoJMyjzVWRJQ',
      // },
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
    published_at: '2025-04-02T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: 'https://twitter.com/i/spaces/1yoJMyjzVWRJQ',
      // },
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
    published_at: '2025-04-03T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: 'https://twitter.com/i/spaces/1yoJMyjzVWRJQ',
      // },
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
    published_at: '2025-04-04T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: 'https://twitter.com/i/spaces/1yoJMyjzVWRJQ',
      // },
    ],
    steps: [],
  },
]

export default days
