const images = {
  '00-stay-remote': '/images/launchweek/8/day0/remote.png',
  '00-pg-server': '/images/launchweek/8/day0/pg-server.png',
  '00-constellation': '/images/launchweek/8/day0/constellation-pre.svg',
  '00-constellation-mobile': '/images/launchweek/8/day0/constellation.svg',
  '01-hugging': '/images/launchweek/8/day1/hugging.svg',
}

export interface StepProps {
  title: string
  badge?: string
  break_thumb_title?: boolean
  blog?: string
  docs?: string
  description?: string
  github?: string
  hackernews?: string
  isNew?: boolean
  thumb?: string
  url?: string
  video?: string
  twitter_spaces?: string
  className?: string
  hideInBlog?: boolean
  bg_layers?: {
    lottie?: any
    img?: string
    mobileImg?: string
  }[]
  steps: StepProps[] | []
}
export interface WeekDayProps {
  title: string
  shipped: boolean
  date: string
  publishedAt: string
  description: string
  d: number
  dd: string
  youtube_id: string
  blogpost: string
  docs: string
  twitter_spaces?: string
  steps: StepProps[] | []
}

export const endOfLW8 = '2023-08-11T23:59:59.999-07:00'

const days: WeekDayProps[] = [
  {
    title: '',
    shipped: true,
    date: '04 Aug',
    publishedAt: '2023-08-04T09:00:00.000-07:00',
    description: '',
    d: 0,
    dd: 'Pre-release',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [
      {
        title: "Why we'll stay remote",
        blog: '/blog/',
        bg_layers: [{ img: images['00-stay-remote'] }],
        steps: [],
      },
      {
        title: 'Postgres Language Server',
        github: '/blog/',
        hackernews: '/blog/',
        bg_layers: [{ img: images['00-pg-server'] }],
        steps: [],
      },
      {
        title:
          'Coding the stars - an interactive constellation with Three.js and React Three Fiber',
        blog: '/blog/interactive-constellation-threejs-react-three-fiber',
        bg_layers: [
          { img: images['00-constellation'], mobileImg: images['00-constellation-mobile'] },
        ],
        steps: [],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '07 Aug',
    publishedAt: '2023-08-07T09:00:00.000-07:00',
    description: '',
    d: 1,
    dd: 'Mon',
    youtube_id: '',
    blogpost: '',
    docs: '',
    twitter_spaces: 'https://twitter.com/i/spaces/1DXGyvjkeEeJM',
    steps: [
      {
        title: 'Huggingface now supported in Supabase',
        blog: '/blog/',
        hackernews: '/blog/',
        twitter_spaces: 'https://twitter.com/i/spaces/1DXGyvjkeEeJM',
        bg_layers: [{ img: images['01-hugging'] }],
        steps: [],
      },
    ],
  },
  {
    title: '',
    shipped: false,
    date: '08 Aug',
    publishedAt: '2023-08-08T09:00:00.000-07:00',
    description: '',
    d: 2,
    dd: 'Tue',
    youtube_id: 'cPGxPl1lx4Y',
    blogpost: '',
    docs: '',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '09 Aug',
    publishedAt: '2023-08-09T09:00:00.000-07:00',
    description: '',
    d: 3,
    dd: 'Wed',
    youtube_id: '',
    blogpost: '',
    docs: '/docs/guides/storage/uploads#resumable-upload',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '10 Aug',
    publishedAt: '2023-08-10T09:00:00.000-07:00',
    description: '',
    d: 4,
    dd: 'Thu',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '11 Aug',
    publishedAt: '2023-08-11T00:00:00.000-07:00',
    description: '',
    d: 5,
    dd: 'Fri',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [],
  },
]

export default days
