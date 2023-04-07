const images = {
  '0-ogImages-01': '/images/launchweek/seven/day0/ai-images/ai-images-01.png',
  '0-ogImages-02': '/images/launchweek/seven/day0/ai-images/ai-image-03.png',
  '0-ogImages-03': '/images/launchweek/seven/day0/ai-images/ai-image-04.svg',
  '0-ogImages-03-mobile': '/images/launchweek/seven/day0/ai-images/ai-image-text-input.png',
  '0-ogImages-04': '/images/launchweek/seven/day0/ai-images/images/img_3.png',
  '0-ogImages-05': '/images/launchweek/seven/day0/ai-images/ai-images-overlay.png',
  '0-supavisor-01': '/images/launchweek/seven/day0/supavisor/supavisor_01.png',
  '0-supavisor-02': '/images/launchweek/seven/day0/supavisor/supavisor_02.png',
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
    blog?: string
    docs?: string
    description?: string
    github?: string
    hackernews?: string
    isNew?: boolean
    thumb?: string
    url?: string
    youtube_id?: string
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
    docs: 'https://supabase.com/docs',
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
        // hackernews: 'hackernews_link',
        thumb: '/images/launchweek/seven/day0/supavisor/supavisor-thumb.png',
        bg_layers: [{ img: images['0-supavisor-01'] }, { img: images['0-supavisor-02'] }],
      },
    ],
  },
  {
    title: 'Self-hosted Logs & observability',
    shipped: false,
    date: '10 Apr',
    publishedAt: '2023-04-10T07:00:00.000-07:00',
    description: 'Supabase Docs',
    d: 1,
    dd: 'Mon',
    youtube_id: 'OpPOaJI_Z28',
    blogpost: 'https://supabase.com/blog/new-supabase-docs-built-with-nextjs',
    docs: 'https://supabase.com/docs',
    steps: [
      {
        title: 'Supabase Docs',
        blog: '/blog/new-supabase-docs-built-with-nextjs',
        docs: '/docs',
        isNew: true,
        description: '',
        thumb: '/images/launchweek/seven/day1/self-hosted-logs-thumb.png',
      },
    ],
  },
  {
    title: 'Self-hosted Edge Functions',
    shipped: false,
    date: '11 Apr',
    publishedAt: '2023-04-11T07:00:00.000-07:00',
    description: 'Image Transformations',
    d: 2,
    dd: 'Tue',
    youtube_id: 'iqZlPtl_b-I',
    blogpost: 'https://supabase.com/blog',
    docs: 'https://supabase.com/docs',
    steps: [
      {
        title: 'Image Transformations',
        blog: '',
        docs: '',
        isNew: true,
        description: '',
        thumb: '/images/launchweek/seven/day2/self-hosted-edge-functions-thumb.png',
      },
      {
        title: 'Smart CDN',
        description: 'Faster asset delivery, now even faster.',
        blog: '/blog/storage-image-resizing-smart-cdn',
        docs: '/docs/guides/storage/cdn',
        isNew: true,
      },
    ],
  },
  {
    title: 'Storage v3  Multipart upload',
    shipped: false,
    date: '12 Apr',
    publishedAt: '2023-04-12T07:00:00.000-07:00',
    description: 'Storage v3  Multipart upload',
    d: 3,
    dd: 'Wed',
    youtube_id: 'CGZr5tybW18',
    blogpost: 'https://supabase.com/blog',
    docs: 'https://supabase.com/docs',
    steps: [
      {
        title: 'Storage v3  Multipart upload',
        blog: '/blog/mfa-auth-via-rls',
        docs: '/docs/guides/auth/auth-mfa',
        isNew: false,
        description: '',
        thumb: '/images/launchweek/seven/day3/storage-v3-thumb.png',
      },
    ],
  },
  {
    title: 'SSO Support for Projects',
    shipped: false,
    date: '13 Apr',
    publishedAt: '2023-04-13T07:00:00.000-07:00',
    description: 'Supabase Wrappers',
    d: 4,
    dd: 'Thu',
    youtube_id: 'QA2qC5F-4OU',
    blogpost: '/blog/postgres-foreign-data-wrappers-rust',
    docs: 'https://supabase.com/docs',
    steps: [
      {
        title: 'Supabase Wrappers',
        blog: '/blog/postgres-foreign-data-wrappers-rust',
        docs: 'https://supabase.github.io/wrappers/',
        isNew: true,
        description: '',
        thumb: '/images/launchweek/seven/day4/SSO-support-thumb.png',
      },
    ],
  },
  {
    title: 'Community Highlight',
    shipped: false,
    date: '14 Apr',
    publishedAt: '2023-04-14T07:00:00.000-07:00',
    description: 'Vault Release',
    d: 5,
    dd: 'Fri',
    youtube_id: '6bGQotxisoY',
    blogpost: 'https://supabase.com/blog',
    docs: 'https://supabase.com/docs',
    steps: [
      {
        title: 'Vault Release',
        blog: '/blog/vault-now-in-beta',
        isNew: true,
        description: '',
        thumb: '/images/launchweek/seven/day0/ai-images-thumb.png',
      },
      {
        title: 'Transparent Column Encryption',
        description: '',
        blog: '/blog/transparent-column-encryption-with-postgres',
        isNew: true,
      },
    ],
  },
]

export default days
