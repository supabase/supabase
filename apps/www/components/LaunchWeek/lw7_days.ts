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
    shipped: false,
    date: '10 Apr',
    publishedAt: '2023-04-10T07:00:00.000-07:00',
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
    shipped: false,
    date: '11 Apr',
    publishedAt: '2023-04-11T07:00:00.000-07:00',
    description: '',
    d: 2,
    dd: 'Tue',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '12 Apr',
    publishedAt: '2023-04-12T07:00:00.000-07:00',
    description: '',
    d: 3,
    dd: 'Wed',
    youtube_id: '',
    blogpost: '',
    docs: '',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '13 Apr',
    publishedAt: '2023-04-13T07:00:00.000-07:00',
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
