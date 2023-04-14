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
  steps: {
    title: string
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
    bg_layers?: {
      lottie?: any
      img?: string
      mobileImg?: string
    }[]
  }[]
}

export const endOfLW7 = '2023-04-16T23:59:59.999-07:00'

const days: WeekDayProps[] = [
  {
    title: '',
    shipped: true,
    date: '07 Apr',
    publishedAt: '2023-04-07T07:00:00.000-07:00',
    description: '',
    d: 0,
    dd: 'Pre-release',
    youtube_id: '',
    blogpost: 'https://supabase.com/blog/designing-with-ai-midjourney',
    docs: '',
    steps: [
      {
        title: 'Designing with AI',
        blog: '/blog/designing-with-ai-midjourney',
        thumb: '/images/launchweek/seven/day0/ai-images/00-ai-images-thumb.png',
        bg_layers: [
          { img: images['0-ogImages-01'] },
          { img: images['0-ogImages-02'] },
          { img: images['0-ogImages-03'], mobileImg: images['0-ogImages-03-mobile'] },
          { img: images['0-ogImages-04'] },
          { img: images['0-ogImages-05'] },
        ],
      },
      {
        title: 'Supavisor',
        github: 'https://github.com/supabase/supavisor',
        hackernews: 'https://news.ycombinator.com/item?id=35501718',
        thumb: '/images/launchweek/seven/day0/supavisor/supavisor-thumb.png',
        bg_layers: [{ img: images['0-supavisor-01'] }, { img: images['0-supavisor-02'] }],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '10 Apr',
    publishedAt: '2023-04-10T07:00:00.000-07:00',
    description: '',
    d: 1,
    dd: 'Mon',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [
      {
        title: 'Open Source Logging',
        blog: '/blog/supabase-logs-self-hosted',
        thumb: '/images/launchweek/seven/day1/self-hosted-logs-thumb.jpg',
        video: 'https://www.youtube.com/watch?v=Ai2BjHV36Ng',
        hackernews: 'https://news.ycombinator.com/item?id=35518786',
        bg_layers: [
          {
            img: images['01-self-hosted-logs-01'],
            mobileImg: images['01-self-hosted-logs-01-mobile'],
          },
          {
            img: images['01-self-hosted-logs-03'],
            mobileImg: images['01-self-hosted-logs-03-mobile'],
          },
          {
            img: images['01-self-hosted-logs-04'],
            mobileImg: images['01-self-hosted-logs-04-mobile'],
          },
          { img: images['01-self-hosted-logs-06'] },
        ],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '11 Apr',
    publishedAt: '2023-04-11T07:00:00.000-07:00',
    description: '',
    d: 2,
    dd: 'Tue',
    youtube_id: 'cPGxPl1lx4Y',
    blogpost: '',
    docs: '',
    steps: [
      {
        title: 'Self-hosted Deno Edge Functions',
        blog: '/blog/edge-runtime-self-hosted-deno-functions',
        thumb: images['02-self-hosted-edge-functions-thumb'],
        video: 'https://www.youtube.com/watch?v=cPGxPl1lx4Y',
        hackernews: 'https://news.ycombinator.com/item?id=35525222',
        bg_layers: [
          {
            img: images['02-self-hosted-edge-functions-01'],
          },
          {
            img: images['02-self-hosted-edge-functions-02'],
          },
        ],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '12 Apr',
    publishedAt: '2023-04-12T07:00:00.000-07:00',
    description: '',
    d: 3,
    dd: 'Wed',
    youtube_id: '',
    blogpost: '',
    docs: '/docs/guides/storage/uploads#resumable-upload',
    steps: [
      {
        title: 'Storage v3: Resumable Uploads with support for 50GB files',
        break_thumb_title: true,
        description: 'Resumable Uploads with support for 50GB files',
        blog: '/blog/storage-v3-resumable-uploads',
        thumb: images['03-storage-thumb'],
        video: 'https://www.youtube.com/watch?v=pT2PcZFq_M0',
        docs: '/docs/guides/storage/uploads#resumable-upload',
        bg_layers: [
          {
            img: images['03-storage-01'],
          },
          {
            img: images['03-storage-02'],
            mobileImg: images['03-storage-02-mobile'],
          },
          {
            img: images['03-storage-03'],
          },
        ],
      },
    ],
  },
  {
    title: '',
    shipped: true,
    date: '13 Apr',
    publishedAt: '2023-04-13T00:00:00.000-07:00',
    description: '',
    d: 4,
    dd: 'Thu',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [
      {
        title: 'Supabase Auth: SSO, Mobile, and Server-side support',
        break_thumb_title: true,
        description: '',
        blog: '/blog/supabase-auth-sso-pkce',
        thumb: images['04-sso-thumb'],
        video: 'https://www.youtube.com/watch?v=hAwJeR6mhB0',
        docs: '/docs/guides/auth/sso/auth-sso-saml',
        hackernews: 'https://news.ycombinator.com/item?id=35555263',
        bg_layers: [
          {
            img: images['04-sso-01'],
            mobileImg: images['04-sso-01-mobile'],
          },
          {
            img: images['04-sso-02'],
            mobileImg: images['04-sso-02-mobile'],
          },
        ],
      },
    ],
  },
  {
    title: '',
    shipped: false,
    date: '14 Apr',
    publishedAt: '2023-04-14T07:00:00.000-07:00',
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
