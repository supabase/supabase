import { ReactNode } from 'react'
import { products } from 'shared-data/products'

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

export const endOfLWXHackathon = '2024-08-17T23:59:59.999-08:00'

const days: (isDark?: boolean) => WeekDayProps[] = (isDark = true) => [
  {
    id: 'day-1',
    d: 1,
    dd: 'Mon',
    shipped: true,
    isToday: true,
    blog: '#',
    hasCountdown: false,
    date: '12 August',
    published_at: '2024-08-12T08:00:00.000-07:00',
    videoId: '',
    videoThumbnail: '',
    title: 'Lorem ipsum',
    description: 'Lorem ipsum',
    links: [
      {
        type: 'xSpace',
        href: 'https://supabase.link/',
      },
    ],
    steps: [],
  },
  {
    id: 'day-2',
    d: 2,
    dd: 'Tue',
    shipped: false,
    isToday: false,
    hasCountdown: true,
    blog: '',
    date: '13 August',
    published_at: '2024-08-13T08:00:00.000-07:00',
    title: '',
    description: '',
    links: [],
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
    date: '14 August',
    published_at: '2024-08-14T08:00:00.000-07:00',
    title: '',
    description: '',
    links: [],
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
    date: '15 August',
    published_at: '2024-08-15T08:00:00.000-07:00',
    title: '',
    description: '',
    links: [],
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
    date: '16 August',
    published_at: '2024-08-16T08:00:00.000-07:00',
    title: '',
    description: '',
    links: [],
    steps: [],
  },
]

export default days
