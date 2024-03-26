import { ReactNode } from 'react'

type StepLinkType = 'productHunt' | 'video' | 'docs' | 'xSpace' | 'blog'

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
  blog: string
  steps: StepProps[] | []
}

export const endOfLWXHackathon = '2024-04-17T23:59:59.999-08:00'

const days: WeekDayProps[] = [
  {
    id: 'day-1',
    d: 1,
    dd: 'Mon',
    title: 'Lorem ipsum',
    shipped: true,
    isToday: false,
    blog: '#',
    hasCountdown: true,
    date: '11 Apr',
    published_at: '2024-04-11T08:00:00.000-08:00',
    description: <>Lorem ipsum</>,
    links: [
      // {
      //   type: 'productHunt',
      //   href: 'https://www.producthunt.com/',
      // },
      // {
      //   type: 'blog',
      //   href: '#',
      // },
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: '#',
      // },
    ],
    steps: [
      // {
      //   title: '',
      //   blog: '#',
      //   bg_layers: [
      //     {
      //       img: '',
      //       mobileImg: '',
      //     },
      //   ],
      //   steps: [],
      // },
    ],
  },
  {
    id: 'day-2',
    d: 2,
    dd: 'Tue',
    title: '',
    shipped: false,
    hasCountdown: false,
    blog: '#',
    date: '12 Apr',
    published_at: '2024-04-12T08:00:00.000-08:00',
    description: <>TBD</>,
    links: [
      // {
      //   type: 'blog',
      //   href: '#',
      // },
      // {
      //   type: 'video',
      //   href: 'eCbiywoDORw',
      // },
      // {
      //   type: 'xSpace',
      //   href: '#',
      // },
    ],
    steps: [
      {
        title: '',
        blog: '#',
        bg_layers: [
          {
            img: '/images/launchweek/lwx/day2/d2_edge.svg',
            mobileImg: '/images/launchweek/lwx/day2/d2_edge_mobile.svg',
          },
        ],
        steps: [],
      },
    ],
  },
  {
    id: 'day-3',
    d: 3,
    dd: 'Wed',
    title: '',
    shipped: false,
    hasCountdown: false,
    blog: '#',
    date: '13 Apr',
    published_at: '2024-04-13T08:00:00.000-08:00',
    description: <>TBD</>,
    links: [
      // {
      //   type: 'blog',
      //   href: '#',
      // },
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: '#',
      // },
    ],
    steps: [],
  },
  {
    id: 'day-4',
    d: 4,
    dd: 'Thu',
    title: '',
    shipped: false,
    hasCountdown: false,
    blog: '#',
    date: '14 Apr',
    published_at: '2024-04-14T08:00:00.000-08:00',
    description: <>TBD</>,
    links: [
      // {
      //   type: 'blog',
      //   href: '#',
      // },
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: '#',
      // },
    ],
    steps: [],
  },
  {
    id: 'day-5',
    d: 5,
    dd: 'Fri',
    title: '',
    shipped: false,
    hasCountdown: false,
    blog: '#',
    date: '15 Apr',
    published_at: '2024-04-15T08:00:00.000-08:00',
    description: <>TBD</>,
    links: [
      // {
      //   type: 'blog',
      //   href: '#',
      // },
      // {
      //   type: 'video',
      //   href: '',
      // },
      // {
      //   type: 'xSpace',
      //   href: '#',
      // },
    ],
    steps: [],
  },
]

export default days
