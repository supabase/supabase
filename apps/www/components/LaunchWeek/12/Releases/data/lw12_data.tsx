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

export const endOfLWXHackathon = '2024-08-17T23:59:59.999-08:00'

const days: (isDark?: boolean) => WeekDayProps[] = (isDark = true) => [
  {
    id: 'day-1',
    d: 1,
    dd: 'Mon',
    shipped: true,
    isToday: false,
    blog: '/blog/postgres-new',
    hasCountdown: false,
    date: '12 August',
    published_at: '2024-08-12T08:00:00.000-07:00',
    title: 'postgres.new: In-browser Postgres with an AI interface',
    description: (
      <>
        <strong className="text-foreground">postgres.new:</strong>
        <br className="hidden sm:block" /> In-browser Postgres
        <br className="hidden sm:block" /> with an AI interface
      </>
    ),
    links: [
      {
        type: 'video',
        href: 'ooWaPVvljlU',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw12-xspace-1',
      },
    ],
    steps: [
      {
        title: 'postgres.new: In-browser Postgres with an AI interface',
        blog: '/blog/postgres-new',
        bg_layers: [
          {
            img: '/images/launchweek/12/d1/postgresnew-dark.svg',
            mobileImg: '/images/launchweek/12/d1/postgresnew-dark-mobile.svg',
            imgLight: '/images/launchweek/12/d1/postgresnew-light.svg',
            mobileImgLight: '/images/launchweek/12/d1/postgresnew-light-mobile.svg',
          },
        ],
        steps: [],
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
    blog: '/blog/supabase-realtime-broadcast-and-presence-authorization',
    date: '13 August',
    published_at: '2024-08-13T08:00:00.000-07:00',
    title: 'Realtime Broadcast and Presence Authorization',
    description: (
      <>
        <span className="text-foreground">Realtime</span> Broadcast and
        <br className="hidden sm:block" /> Presence Authorization
      </>
    ),
    links: [
      {
        type: 'video',
        href: 'IXRrU9MpA8Q',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw12-xspace-2',
      },
    ],
    steps: [
      {
        title: 'Realtime Broadcast and Presence Authorization',
        blog: '/blog/supabase-realtime-broadcast-and-presence-authorization',
        bg_layers: [
          {
            img: '/images/launchweek/12/d2/realtime-dark.svg',
            mobileImg: '/images/launchweek/12/d2/realtime-dark-mobile.svg',
            imgLight: '/images/launchweek/12/d2/realtime-light.svg',
            mobileImgLight: '/images/launchweek/12/d2/realtime-light-mobile.svg',
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
    blog: '/blog/third-party-auth-mfa-phone-send-hooks',
    date: '14 August',
    published_at: '2024-08-14T08:00:00.000-07:00',
    title: 'Supabase Auth: Bring-your-own Auth0, Cognito, or Firebase',
    description: (
      <>
        <span className="text-foreground">Supabase Auth</span>:<br className="hidden sm:block" />{' '}
        Bring-your-own Auth0,
        <br className="hidden sm:block" /> Cognito, or Firebase
      </>
    ),
    links: [
      {
        type: 'video',
        href: 'BPD7kxb5N84',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw12-xspace-3',
      },
    ],
    steps: [
      {
        title: 'Supabase Auth: Bring-your-own Auth0, Cognito, or Firebase',
        blog: '/blog/third-party-auth-mfa-phone-send-hooks',
        bg_layers: [
          {
            img: '/images/launchweek/12/d3/auth-dark.svg',
            mobileImg: '/images/launchweek/12/d3/auth-dark-mobile.svg',
            imgLight: '/images/launchweek/12/d3/auth-light.svg',
            mobileImgLight: '/images/launchweek/12/d3/auth-light-mobile.svg',
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
    blog: '/blog/log-drains',
    date: '15 August',
    published_at: '2024-08-15T08:00:00.000-07:00',
    title: 'Introducing Log Drains',
    description: 'Introducing Log Drains',
    links: [
      {
        type: 'video',
        href: 'A4GFmvgxS-E',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw12-xspace-4',
      },
    ],
    steps: [
      {
        title: 'Introducing Log Drains',
        blog: '/blog/log-drains',
        bg_layers: [
          {
            img: '/images/launchweek/12/d4/logdrains-dark.svg',
            mobileImg: '/images/launchweek/12/d4/logdrains-dark-mobile.svg',
            imgLight: '/images/launchweek/12/d4/logdrains-light.svg',
            mobileImgLight: '/images/launchweek/12/d4/logdrains-light-mobile.svg',
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
    isToday: false,
    hasCountdown: false,
    blog: '/blog/postgres-foreign-data-wrappers-with-wasm',
    date: '16 August',
    published_at: '2024-08-16T08:00:00.000-07:00',
    title: 'Postgres Foreign Data Wrappers with Wasm',
    description: (
      <>
        Postgres<span className="text-foreground sm:block"> Foreign Data Wrappers</span> with Wasm
      </>
    ),
    links: [
      {
        type: 'video',
        href: 'wCwEWR4k0no',
      },
      {
        type: 'xSpace',
        href: 'https://supabase.link/lw12-xspace-5',
      },
    ],
    steps: [
      {
        title: 'Postgres Foreign Data Wrappers with Wasm',
        blog: '/blog/postgres-foreign-data-wrappers-with-wasm',
        bg_layers: [
          {
            img: '/images/launchweek/12/d5/FDW-with-WASM-dark.svg',
            mobileImg: '/images/launchweek/12/d5/FDW-with-WASM-dark-mobile.svg',
            imgLight: '/images/launchweek/12/d5/FDW-with-WASM-light.svg',
            mobileImgLight: '/images/launchweek/12/d5/FDW-with-WASM-light-mobile.svg',
          },
        ],
        steps: [],
      },
    ],
  },
]

export default days
