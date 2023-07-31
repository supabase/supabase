const images = {
  '0-ogImages-01': '/images/launchweek/seven/day0/ai-images/ai-images-01.png',
  '0-ogImages-02': '/images/launchweek/seven/day0/ai-images/ai-image-03.svg',
  '0-ogImages-03': '/images/launchweek/seven/day0/ai-images/ai-image-04.png',
  '0-ogImages-03-mobile': '/images/launchweek/seven/day0/ai-images/ai-image-text-input.png',
  '0-ogImages-04': '/images/launchweek/seven/day0/ai-images/images/img_3.png',
  '0-ogImages-05': '/images/launchweek/seven/day0/ai-images/ai-images-overlay.png',
  '0-supavisor-01': '/images/launchweek/seven/day0/supavisor/supavisor_01.svg',
  '0-supavisor-02': '/images/launchweek/seven/day0/supavisor/supavisor_02.svg',
  '01-self-hosted-logs-01': '/images/launchweek/seven/day1/self-hosted-logs-base.jpg',
  '01-self-hosted-logs-01-mobile':
    '/images/launchweek/seven/day1/self-hosted-logs-007-mobile-base.jpg',
  '01-self-hosted-logs-03': '/images/launchweek/seven/day1/self-hosted-logs-001-5.svg',
  '01-self-hosted-logs-03-mobile':
    '/images/launchweek/seven/day1/self-hosted-logs-001-5-mobile.svg',
  '01-self-hosted-logs-04': '/images/launchweek/seven/day1/self-hosted-logs-001-7.svg',
  '01-self-hosted-logs-04-mobile':
    '/images/launchweek/seven/day1/self-hosted-logs-001-7-mobile.svg',
  '01-self-hosted-logs-06': '/images/launchweek/seven/day1/self-hosted-logs-004.png',
  '02-self-hosted-edge-functions-thumb':
    '/images/launchweek/seven/day2/self-hosted-edge-functions-thumb.png',
  '02-self-hosted-edge-functions-01':
    '/images/launchweek/seven/day2/self-hosted-edge-functions-001.png',
  '02-self-hosted-edge-functions-02':
    '/images/launchweek/seven/day2/self-hosted-edge-functions-002.png',
  '03-storage-thumb': '/images/launchweek/seven/day3/storage-v3-thumb.png',
  '03-storage-01': '/images/launchweek/seven/day3/storage-01.png',
  '03-storage-02': '/images/launchweek/seven/day3/storage-02.png',
  '03-storage-02-mobile': '/images/launchweek/seven/day3/storage-02-mobile.png',
  '03-storage-03': '/images/launchweek/seven/day3/storage-03.png',
  '04-sso-thumb': '/images/launchweek/seven/day4/sso-support-thumb.jpg',
  '04-sso-01': '/images/launchweek/seven/day4/sso-support-01.png',
  '04-sso-01-mobile': '/images/launchweek/seven/day4/sso-support-01-mobile.jpg',
  '04-sso-02': '/images/launchweek/seven/day4/sso-support-02.png',
  '04-sso-02-mobile': '/images/launchweek/seven/day4/sso-support-02-mobile.png',
  '05-community-01-001': '/images/launchweek/seven/day5/community/community-01-01.jpg',
  '05-community-01-001-mobile':
    '/images/launchweek/seven/day5/community/community-01-01-mobile.jpg',
  '05-community-01-002': '/images/launchweek/seven/day5/community/community-01-02.png',
  '05-community-01-002-mobile':
    '/images/launchweek/seven/day5/community/community-01-02-mobile.png',
  '05-community-01-thumb': '/images/launchweek/seven/day5/community/community-thumb.jpg',
  '05-studio-01-thumb': '/images/launchweek/seven/day5/studio/studio-thumb.jpg',
  '05-studio-01-base': '/images/launchweek/seven/day5/studio/studio-01-commandK.jpg',
  '05-studio-01-base-mobile': '/images/launchweek/seven/day5/studio/studio-01-commandK-mobile.jpg',
  '05-studio-02-base': '/images/launchweek/seven/day5/studio/studio-02-wrappers.jpg',
  '05-studio-03-base': '/images/launchweek/seven/day5/studio/studio-03-nullableCols.jpg',
  '05-studio-04-base': '/images/launchweek/seven/day5/studio/studio-04-apiAutodocs.jpg',
  '05-studio-05-base': '/images/launchweek/seven/day5/studio/studio-05-pgRoles.jpg',
  '05-studio-06-base': '/images/launchweek/seven/day5/studio/studio-06-casDeletes.jpg',
  '05-studio-07-base': '/images/launchweek/seven/day5/studio/studio-07-graphiQL-02.jpg',
  '05-studio-08-base': '/images/launchweek/seven/day5/studio/studio-08-dbWebhooks.jpg',
  '05-studio-08-base-mobile':
    '/images/launchweek/seven/day5/studio/studio-08-dbWebhooks-mobile.jpg',
  '05-studio-09-base': '/images/launchweek/seven/day5/studio/studio-09-viewsTables.jpg',
  '05-studio-10-base': '/images/launchweek/seven/day5/studio/studio-10-JSONsupport.jpg',
  '05-studio-11-base': '/images/launchweek/seven/day5/studio/studio-11-insights.jpg',
  '05-omt-01-001': '/images/launchweek/seven/day5/one-more-thing/omt-01-01.jpg',
  '05-omt-01-001-mobile': '/images/launchweek/seven/day5/one-more-thing/omt-01-01-mobile.jpg',
  '05-omt-01-002': '/images/launchweek/seven/day5/one-more-thing/omt-01-02.png',
  '05-omt-01-003': '/images/launchweek/seven/day5/one-more-thing/omt-01-03.png',
  '05-omt-01-002-mobile': '/images/launchweek/seven/day5/one-more-thing/omt-01-02-mobile.png',
  '05-omt-02-001': '/images/launchweek/seven/day5/one-more-thing/omt-02-01.jpg',
  '05-omt-02-001-mobile': '/images/launchweek/seven/day5/one-more-thing/omt-02-01-mobile.jpg',
  '05-omt-02-002': '/images/launchweek/seven/day5/one-more-thing/omt-02-02.png',
  '05-omt-02-003': '/images/launchweek/seven/day5/one-more-thing/omt-02-03.png',
  '05-omt-02-002-mobile': '/images/launchweek/seven/day5/one-more-thing/omt-02-02-mobile.png',
  '05-omt-01-thumb': '/images/launchweek/seven/day5/one-more-thing/dbdev-thumb.jpg',
  '05-omt-02-thumb': '/images/launchweek/seven/day5/one-more-thing/pgTLE-thumb.jpg',
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
        title: "Why we'll stay remote",
        blog: 'asdf',
        thumb: '/images/launchweek/seven/day0/ai-images/00-ai-images-thumb.png',
        // bg_layers: [{ img: images['0-ogImages-01'] }],
        steps: [],
      },
      {
        title: 'Postgres Language Server',
        github: 'https://github.com/supabase/...',
        hackernews: 'https://news.ycombinator.com/item?id=...',
        thumb: '/images/launchweek/seven/day0/supavisor/supavisor-thumb.png',
        // bg_layers: [{ img: images['0-supavisor-01'] }],
        steps: [],
      },
      {
        title: 'How we made LW8',
        blog: 'asdf',
        thumb: '/images/launchweek/seven/day0/ai-images/00-ai-images-thumb.png',
        // bg_layers: [{ img: images['0-ogImages-01'] }],
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
