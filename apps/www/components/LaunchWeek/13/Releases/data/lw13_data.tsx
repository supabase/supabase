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

export const endOfLW13Hackathon = '2024-12-07T23:59:59.999-08:00'

const days: (isDark?: boolean) => WeekDayProps[] = (isDark = true) => [
  {
    id: 'day-1',
    d: 1,
    dd: 'Mon',
    shipped: true,
    isToday: false,
    blog: '/blog/supabase-ai-assistant-v2',
    hasCountdown: false,
    date: '2 December',
    published_at: '2024-12-02T08:00:00.000-07:00',
    title: 'Supabase AI Assistant V2',
    description: 'Supabase AI Assistant V2',
    links: [
      {
        type: 'video',
        href: '_fdP-aaTHgw',
      },
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1OyKAZyeQyWGb',
      },
    ],
    steps: [
      {
        title: 'TBD',
        url: '#',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/13/releases/d1/d1-assistant-dark.svg',
            mobileImg: '/images/launchweek/13/releases/d1/d1-assistant-mobile-dark.svg',
            imgLight: '/images/launchweek/13/releases/d1/d1-assistant-light.svg',
            mobileImgLight: '/images/launchweek/13/releases/d1/d1-assistant-mobile-light.svg',
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
    isToday: true,
    hasCountdown: false,
    blog: '/blog/edge-functions-background-tasks-websockets',
    date: '3 December',
    published_at: '2024-12-03T08:00:00.000-07:00',
    title: 'Supabase Functions: Background Tasks and WebSockets',
    description: (
      <>
        Supabase Functions: <br className="hidden sm:block" /> Background Tasks and WebSockets
      </>
    ),
    links: [
      {
        type: 'video',
        href: 'envrsJ8VfAU',
      },
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1yoJMyjzVWRJQ',
      },
    ],
    steps: [
      {
        title: '',
        bg_layers: [
          {
            img: '/images/launchweek/13/releases/d2/d2-functions-background-tasks-dark.png',
            mobileImg:
              '/images/launchweek/13/releases/d2/d2-functions-background-tasks-mobile-dark.png',
            imgLight: '/images/launchweek/13/releases/d2/d2-functions-background-tasks-light.png',
            mobileImgLight:
              '/images/launchweek/13/releases/d2/d2-functions-background-tasks-mobile-light.png',
          },
        ],
      },
    ],
  },
  {
    id: 'day-3',
    d: 3,
    dd: 'Wed',
    shipped: false,
    isToday: false,
    hasCountdown: true,
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
        href: 'https://twitter.com/i/spaces/1eaKbaOAOdaxX',
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
        href: 'https://twitter.com/i/spaces/1ynKODOwObyGR',
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
        href: 'https://twitter.com/i/spaces/1zqKVYOEODYxB',
      },
    ],
    steps: [],
  },
]

export default days
