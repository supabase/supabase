const images = {
  '00-constellation': '/images/launchweek/8/day0/constellation.svg',
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
  steps: StepProps[] | []
}

export const endOfLW8 = '2023-08-11T23:59:59.999-08:00'

const days: WeekDayProps[] = [
  {
    title: '',
    shipped: true,
    date: '04 Aug',
    publishedAt: '2023-08-04T07:00:00.000-08:00',
    description: '',
    d: 0,
    dd: 'Pre-release',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [
      {
        title: 'How we made LW8',
        blog: '/blog/launch-week-8-constellation-breakdown',
        bg_layers: [{ img: images['00-constellation'] }],
        steps: [],
      },
      {
        title: 'Postgres Language Server',
        github: 'https://github.com/supabase/...',
        hackernews: 'https://news.ycombinator.com/item?id=...',
        // bg_layers: [{ img: images['0-supavisor-01'] }],
        steps: [],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '07 Aug',
    publishedAt: '2023-08-07T07:00:00.000-08:00',
    description: '',
    d: 1,
    dd: 'Mon',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [],
  },
  {
    title: '',
    shipped: true,
    date: '08 Aug',
    publishedAt: '2023-08-08T07:00:00.000-08:00',
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
    shipped: true,
    date: '09 Aug',
    publishedAt: '2023-08-09T07:00:00.000-08:00',
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
    shipped: true,
    date: '10 Aug',
    publishedAt: '2023-08-10T07:00:00.000-08:00',
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
    shipped: true,
    date: '11 Aug',
    publishedAt: '2023-08-11T00:00:00.000-08:00',
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
