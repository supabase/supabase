const images = {
  yt_thumbnail: '/images/launchweek/8/lw8-yt-thumb.jpg',
  day_1_thumb: '/images/launchweek/8/day1/yt_d1.jpg',
  day_2_thumb: '/images/launchweek/8/day2/yt_d2.jpg',
  day_3_thumb: '/images/launchweek/8/day3/yt_d3.jpg',
  day_4_thumb: '/images/launchweek/8/day4/yt_d4.jpg',
  day_5_thumb: '/images/launchweek/8/day5/yt_d5.jpg',
  '00-stay-remote': '/images/launchweek/8/day0/remote.png',
  '00-pg-server': '/images/launchweek/8/day0/pg-server.png',
  '00-constellation': '/images/launchweek/8/day0/constellation.svg',
  '01-hugging': '/images/launchweek/8/day1/hugging.svg',
  '02-localdev': '/images/launchweek/8/day2/localdev.svg',
  '02-localdev-mobile': '/images/launchweek/8/day2/localdev-mobile.svg',
  '03-studio3': '/images/launchweek/8/day3/studio3.svg',
  '03-studio3-mobile': '/images/launchweek/8/day3/studio3-mobile.svg',
  '04-marketplace': '/images/launchweek/8/day4/marketplace.svg',
  '04-marketplace-mobile': '/images/launchweek/8/day4/marketplace-mobile.svg',
  '04-vercel': '/images/launchweek/8/day4/vercel-integration.svg',
  '05-supavisor': '/images/launchweek/8/day5/supavisor.svg',
  '05-community': '/images/launchweek/8/day5/community.svg',
  '05-compliant': '/images/launchweek/8/day5/compliant.svg',
  '05-supavisor-mobile': '/images/launchweek/8/day5/supavisor-mobile.svg',
  '05-community-mobile': '/images/launchweek/8/day5/community-mobile.svg',
  '05-compliant-mobile': '/images/launchweek/8/day5/compliant-mobile.svg',
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
  product_hunt?: string
  isNew?: boolean
  thumb?: string
  url?: string
  video?: string
  twitter_spaces?: string
  className?: string
  hideInBlog?: boolean
  bg_layers?: {
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
  blogpost?: string
  docs?: string
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
    shipped: true,
    date: '08 Aug',
    publishedAt: '2023-08-08T09:00:00.000-07:00',
    description: '',
    d: 2,
    dd: 'Tue',
    youtube_id: 'N0Wb85m3YMI',
    videoThumbnail: images.day_2_thumb,
    twitter_spaces: 'https://twitter.com/i/spaces/1vAxRAvNQyDJl?s=20',
    steps: [
      {
        title: 'Supabase Local Dev: Migrations, Branching, Observability',
        blog: '/blog/supabase-local-dev',
        hackernews: 'https://news.ycombinator.com/item?id=37059400',
        twitter_spaces: 'https://twitter.com/i/spaces/1vAxRAvNQyDJl?s=20',
        bg_layers: [{ img: images['02-localdev'], mobileImg: images['02-localdev-mobile'] }],
        steps: [],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '09 Aug',
    publishedAt: '2023-08-09T09:00:00.000-07:00',
    description: '',
    d: 3,
    dd: 'Wed',
    youtube_id: '51tCMQPiitQ',
    videoThumbnail: images.day_3_thumb,
    steps: [
      {
        title: 'Supabase Studio 3.0',
        blog: '/blog/supabase-studio-3-0',
        hackernews: '',
        video: '',
        product_hunt: 'https://www.producthunt.com/posts/ai-powered-sql-editor',
        twitter_spaces: 'https://twitter.com/i/spaces/1vAxRAvNQyDJl?s=20',
        bg_layers: [{ img: images['03-studio3'], mobileImg: images['03-studio3-mobile'] }],
        steps: [],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '10 Aug',
    publishedAt: '2023-08-10T09:00:00.000-07:00',
    description: '',
    d: 4,
    dd: 'Thu',
    youtube_id: 'gtJo1lTxHfs',
    videoThumbnail: images.day_4_thumb,
    twitter_spaces: 'https://twitter.com/supabase/status/1688544207571484672?s=20',
    steps: [
      {
        title: 'Supabase Integrations Marketplace',
        blog: '/blog/supabase-integrations-marketplace',
        bg_layers: [{ img: images['04-marketplace'], mobileImg: images['04-marketplace-mobile'] }],
        steps: [],
      },
      {
        title: 'Vercel integrations',
        blog: '/blog/using-supabase-with-vercel',
        bg_layers: [{ img: images['04-vercel'] }],
        steps: [],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '11 Aug',
    publishedAt: '2023-08-11T09:00:00.000-07:00',
    description: '',
    d: 5,
    dd: 'Fri',
    youtube_id: 'qzxzLSAJDfE',
    videoThumbnail: images.day_5_thumb,
    steps: [
      {
        title: 'Supabase Supavisor: 1M Postgres connections',
        blog: '/blog/supavisor-1-million',
        hackernews: '',
        video: '',
        twitter_spaces: '',
        bg_layers: [{ img: images['05-supavisor'], mobileImg: images['05-supavisor-mobile'] }],
        steps: [],
      },
      {
        title: 'Community day',
        blog: '/blog/launch-week-8-community-highlights',
        hackernews: '',
        video: '',
        twitter_spaces: '',
        bg_layers: [{ img: images['05-community'], mobileImg: images['05-community-mobile'] }],
        steps: [],
      },
      {
        title: 'SOC2 type 2 and HIPAA compliant',
        blog: '/blog/supabase-soc2-hipaa',
        hackernews: '',
        bg_layers: [{ img: images['05-compliant'], mobileImg: images['05-compliant-mobile'] }],
        steps: [],
      },
    ],
  },
]

export default days
