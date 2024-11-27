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

export const endOfLW13Hackathon = '2024-12-07T23:59:59.999-08:00'

const days: (isDark?: boolean) => WeekDayProps[] = (isDark = true) => [
  {
    id: 'day-1',
    d: 1,
    dd: 'Mon',
    shipped: true,
    isToday: false,
    blog: '',
    hasCountdown: false,
    date: '2 December',
    published_at: '2024-12-02T08:00:00.000-07:00',
    title: '',
    description: (
      <>
        <strong className="text-foreground">postgres.new:</strong>
        <br className="hidden sm:block" /> In-browser Postgres
        <br className="hidden sm:block" /> with an AI interface
      </>
    ),
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw13-xspace-1',
      },
    ],
    steps: [],
  },
  {
    id: 'day-2',
    d: 2,
    dd: 'Tue',
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '3 December',
    published_at: '2024-12-03T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw13-xspace-2',
      },
    ],
    steps: [],
  },
  {
    id: 'day-3',
    d: 3,
    dd: 'Wed',
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '4 December',
    published_at: '2024-12-04T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw13-xspace-3',
      },
    ],
    steps: [],
  },
  {
    id: 'day-4',
    d: 4,
    dd: 'Thu',
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '5 December',
    published_at: '2024-12-05T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '-E',
      // },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw13-xspace-4',
      },
    ],
    steps: [],
  },
  {
    id: 'day-5',
    d: 5,
    dd: 'Fri',
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '',
    date: '6 December',
    published_at: '2024-12-06T08:00:00.000-07:00',
    title: '',
    description: null,
    links: [
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw13-xspace-5',
      },
    ],
    steps: [],
  },
]

export default days
