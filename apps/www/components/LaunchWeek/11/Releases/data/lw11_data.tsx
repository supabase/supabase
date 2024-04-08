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
  shipped: boolean
  date: string
  published_at: string
  isToday?: boolean
  hasCountdown?: boolean
  description: string | ReactNode
  d: number
  dd: string
  links?: StepLink[]
  videoId?: string
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
    date: '15 April',
    published_at: '2024-04-15T08:00:00.000-08:00',
    videoThumbnail: '/images/launchweek/copple-placeholder.jpg',
    links: [
      {
        type: 'blog',
        href: '#',
      },
      {
        type: 'xSpace',
        href: '',
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
        links: [
          // {
          //   type: 'podcast',
          //   href: '#',
          // },
          {
            type: 'docs',
            href: 'https://supabase.com/docs/guides/database/overview',
          },
        ],
      },
      {
        icon: products.authentication.icon[16],
        title: 'Auth',
        description: 'User management out of the box',
        links: [
          // {
          //   type: 'podcast',
          //   href: '#',
          // },
          {
            type: 'docs',
            href: 'https://supabase.com/docs/guides/auth',
          },
        ],
      },
      {
        icon: products.storage.icon[16],
        title: 'Storage',
        description: 'Serverless storage for any media',
        links: [
          // {
          //   type: 'podcast',
          //   href: '#',
          // },
          {
            type: 'docs',
            href: 'https://supabase.com/docs/guides/storage',
          },
        ],
      },
      {
        icon: products.functions.icon[16],
        title: 'Edge Functions',
        description: 'Deploy code globally on the edge',
        links: [
          // {
          //   type: 'podcast',
          //   href: '#',
          // },
          {
            type: 'docs',
            href: 'https://supabase.com/docs/guides/functions',
          },
        ],
      },
      {
        icon: products.realtime.icon[16],
        title: 'Realtime',
        description: 'Syncronize and broadcast events',
        links: [
          // {
          //   type: 'podcast',
          //   href: '#',
          // },
          {
            type: 'docs',
            href: 'https://supabase.com/docs/guides/realtime',
          },
        ],
      },
      {
        icon: products.vector.icon[16],
        title: 'Vector',
        description: 'AI toolkit to manage embeddings',
        links: [
          // {
          //   type: 'podcast',
          //   href: '#',
          // },
          {
            type: 'docs',
            href: 'https://supabase.com/docs/guides/ai',
          },
        ],
      },
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
    date: '16 April',
    published_at: '2024-04-16T08:00:00.000-08:00',
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
