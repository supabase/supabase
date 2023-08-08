const images = {
  yt_thumbnail: '/images/launchweek/8/lw8-yt-thumb.jpg',
  day_1_thumb: '/images/launchweek/8/day1/day-01-thumb.jpg',
  '00-stay-remote': '/images/launchweek/8/day0/remote.png',
  '00-pg-server': '/images/launchweek/8/day0/pg-server.png',
  '00-constellation': '/images/launchweek/8/day0/constellation.svg',
  '01-hugging': '/images/launchweek/8/day1/hugging.svg',
  '02-localdev': '/images/launchweek/8/day2/localdev.svg',
  '02-localdev-mobile': '/images/launchweek/8/day2/localdev-mobile.svg',
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
  videoThumbnail?: string
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
        blog: '/blog/why-supabase-remote',
        bg_layers: [{ img: images['00-stay-remote'] }],
        steps: [],
      },
      {
        title: 'Postgres Language Server',
        github: 'https://github.com/supabase/postgres_lsp',
        hackernews: 'https://news.ycombinator.com/item?id=37020610',
        bg_layers: [{ img: images['00-pg-server'] }],
        steps: [],
      },
      {
        title: 'Coding an interactive constellation with Three.js and React Three Fiber',
        blog: '/blog/interactive-constellation-threejs-react-three-fiber',
        bg_layers: [{ img: images['00-constellation'] }],
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
    youtube_id: 'RJccSbJ9Go4',
    videoThumbnail: images.day_1_thumb,
    blogpost: '',
    docs: '',
    twitter_spaces: 'https://twitter.com/i/spaces/1DXGyvjkeEeJM',
    steps: [
      {
        title: 'Hugging Face now supported in Supabase',
        blog: '/blog/hugging-face-supabase',
        hackernews: 'https://news.ycombinator.com/item?id=37035960',
        video: 'https://www.youtube.com/watch?v=RJccSbJ9Go4',
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
    youtube_id: 'RJccSbJ9Go4',
    blogpost: '',
    twitter_spaces: 'https://twitter.com/i/spaces/1vAxRAvNQyDJl?s=20',
    docs: '',
    steps: [
      {
        title: 'Supabase Local Dev: Migrations, Branching, Observability',
        blog: '/blog/hugging-face-supabase',
        hackernews: '',
        video: '',
        twitter_spaces: 'https://twitter.com/i/spaces/1vAxRAvNQyDJl?s=20',
        bg_layers: [{ img: images['02-localdev'], mobileImg: images['02-localdev-mobile'] }],
        steps: [],
      },
    ],
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
