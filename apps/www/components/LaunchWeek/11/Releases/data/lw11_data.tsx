import { ReactNode } from 'react'
import { products } from 'shared-data/products'

type StepLinkType = 'productHunt' | 'video' | 'docs' | 'xSpace' | 'blog' | 'podcast'

export interface StepLink {
  type: StepLinkType
  text?: string
  icon?: any
  href: string
}

export interface ThemeImage {
  dark?: string
  light?: string
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

export const endOfLWXHackathon = '2024-04-17T23:59:59.999-08:00'

const days: (isDark?: boolean) => WeekDayProps[] = (isDark = true) => [
  {
    id: 'day-1',
    d: 1,
    dd: 'Mon',
    title: 'Lorem ipsum',
    shipped: true,
    isToday: false,
    blog: '#',
    hasCountdown: false,
    date: '15 April',
    published_at: '2024-04-15T08:00:00.000-08:00',
    videoId: 'bRtdk8D4X8w',
    videoThumbnail: '/images/launchweek/11/video-cover.jpg',
    links: [
      {
        type: 'xSpace',
        href: 'https://twitter.com/i/spaces/1MnGnMglMLjKO/peek',
      },
    ],
    description: (
      <>
        <p className="text-foreground">Our products are now ready for production use.</p>{' '}
        <p className="text-foreground-lighter">
          Confidently leverage the full power of Supabase to build scalable, high-performance
          applications with ease.
        </p>
      </>
    ),
    steps: [
      {
        icon: products.database.icon[16],
        title: 'Database',
        description: 'Fully portable Postgres Database',
        url: 'https://supabase.com/docs/guides/database/overview',
      },
      {
        icon: products.authentication.icon[16],
        title: 'Auth',
        description: 'User management out of the box',
        url: 'https://supabase.com/docs/guides/auth',
      },
      {
        icon: products.storage.icon[16],
        title: 'Storage',
        description: 'Serverless storage for any media',
        url: 'https://supabase.com/docs/guides/storage',
      },
      {
        icon: products.functions.icon[16],
        title: 'Edge Functions',
        description: 'Deploy code globally on the edge',
        url: 'https://supabase.com/docs/guides/functions',
      },
      {
        icon: products.realtime.icon[16],
        title: 'Realtime',
        description: 'Syncronize and broadcast events',
        url: 'https://supabase.com/docs/guides/realtime',
      },
      {
        icon: products.vector.icon[16],
        title: 'Vector',
        description: 'AI toolkit to manage embeddings',
        url: 'https://supabase.com/docs/guides/ai',
      },
    ],
  },
  {
    id: 'day-2',
    d: 2,
    dd: 'Tue',
    title: '',
    shipped: false,
    hasCountdown: true,
    blog: '#',
    date: '16 April',
    published_at: '2024-04-16T08:00:00.000-08:00',
    description: <>Create vector embeddings with Edge Functions</>,
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
    steps: [],
  },
  {
    id: 'day-3',
    d: 3,
    dd: 'Wed',
    title: '',
    shipped: false,
    hasCountdown: false,
    blog: '#',
    date: '17 April',
    published_at: '2024-04-17T08:00:00.000-08:00',
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
    date: '18 April',
    published_at: '2024-04-18T08:00:00.000-08:00',
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
    date: '19 April',
    published_at: '2024-04-19T08:00:00.000-08:00',
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
