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
    shipped: true,
    isToday: false,
    blog: '/ga',
    hasCountdown: false,
    date: '15 April',
    published_at: '2024-04-15T08:00:00.000-07:00',
    videoId: 'bRtdk8D4X8w',
    videoThumbnail: '/images/launchweek/11/video-cover.jpg',
    title: 'Supabase is officially launching into General Availability',
    description: 'Supabase is officially launching into General Availability',
    links: [
      {
        type: 'xSpace',
        href: 'https://supabase.link/twitter-space-ga',
      },
    ],
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
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '/blog/ai-inference-now-available-in-supabase-edge-functions',
    date: '16 April',
    published_at: '2024-04-16T08:00:00.000-07:00',
    title: 'Supabase Functions now supports AI models',
    description: (
      <>
        Supabase Functions now supports <strong>AI models</strong>
      </>
    ),
    links: [
      {
        type: 'blog',
        href: '/blog/ai-inference-now-available-in-supabase-edge-functions',
      },
      {
        type: 'video',
        href: 'w4Rr_1whU-U',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/twitter-space-ga-week-2',
      },
    ],
    steps: [
      {
        title: 'Supabase Functions now supports AI models',
        blog: '#',
        bg_layers: [
          {
            img: isDark
              ? '/images/launchweek/11/days/d2-dark.svg'
              : '/images/launchweek/11/days/d2-light.svg',
            mobileImg: isDark
              ? '/images/launchweek/11/days/d2-dark-mobile.svg'
              : '/images/launchweek/11/days/d2-light-mobile.svg',
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
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '/blog/anonymous-sign-ins',
    date: '17 April',
    published_at: '2024-04-17T08:00:00.000-07:00',
    title: 'Supabase Auth now supports Anonymous sign-ins',
    description: (
      <>
        Supabase Auth now supports <strong>Anonymous sign-ins</strong>
      </>
    ),
    links: [
      {
        type: 'blog',
        href: '/blog/anonymous-sign-ins',
      },
      {
        type: 'video',
        href: 'WNN7Pp5Ftk4',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/twitter-space-ga-week-3',
      },
    ],
    steps: [
      {
        title: 'Supabase Auth now supports Anonymous sign-ins',
        blog: '/blog/anonymous-sign-ins',
        bg_layers: [
          {
            img: isDark
              ? '/images/launchweek/11/days/d3-dark.svg'
              : '/images/launchweek/11/days/d3-light.svg',
            mobileImg: isDark
              ? '/images/launchweek/11/days/d3-dark-mobile.svg'
              : '/images/launchweek/11/days/d3-light-mobile.svg',
          },
        ],
        steps: [],
      },
    ],
  },
  {
    id: 'day-4',
    d: 4,
    dd: 'Thu',
    shipped: true,
    isToday: false,
    hasCountdown: false,
    blog: '/blog/s3-compatible-storage',
    date: '18 April',
    published_at: '2024-04-18T08:00:00.000-07:00',
    title: 'Supabase Storage: now supports the S3 protocol',
    description: (
      <>
        Supabase Storage: now supports the <strong>S3 protocol</strong>
      </>
    ),
    links: [
      {
        type: 'blog',
        href: '/blog/s3-compatible-storage',
      },
      {
        type: 'video',
        href: 'WvvGhcNeSPk',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/twitter-space-ga-week-4',
      },
    ],
    steps: [
      {
        title: 'Supabase Storage: now supports the S3 protocol',
        blog: '/blog/s3-compatible-storage',
        bg_layers: [
          {
            img: isDark
              ? '/images/launchweek/11/days/d4-dark.svg'
              : '/images/launchweek/11/days/d4-light.svg',
            mobileImg: isDark
              ? '/images/launchweek/11/days/d4-dark-mobile.svg'
              : '/images/launchweek/11/days/d4-light-mobile.svg',
          },
        ],
        steps: [],
      },
    ],
  },
  {
    id: 'day-5',
    d: 5,
    dd: 'Fri',
    shipped: true,
    isToday: true,
    hasCountdown: false,
    blog: '/blog/security-performance-advisor',
    date: '19 April',
    published_at: '2024-04-19T08:00:00.000-07:00',
    title: 'Supabase Security Advisor & Performance Advisor',
    description: (
      <>
        Supabase <strong>Security Advisor</strong> & <strong>Performance Advisor</strong>
      </>
    ),
    links: [
      {
        type: 'blog',
        href: '/blog/security-performance-advisor',
      },
      // {
      //   type: 'video',
      //   href: '',
      // },
      {
        type: 'xSpace',
        href: 'https://supabase.link/twitter-space-ga-week-5',
      },
    ],
    steps: [
      {
        title: 'Supabase Storage: now supports the S3 protocol',
        blog: '/blog/s3-compatible-storage',
        bg_layers: [
          {
            img: isDark
              ? '/images/launchweek/11/days/d5-dark.svg'
              : '/images/launchweek/11/days/d5-light.svg',
            mobileImg: isDark
              ? '/images/launchweek/11/days/d5-dark-mobile.svg'
              : '/images/launchweek/11/days/d5-light-mobile.svg',
          },
        ],
        steps: [],
      },
    ],
  },
]

export default days
