const images = {}

type StepIconType = 'productHunt' | 'video' | 'docs' | 'xSpace'

export interface StepLink {
  icon: StepIconType
  text: string
  href: string
}

export interface StepProps {
  title: string
  badge?: string
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
  published_at: string
  description: string
  d: number
  dd: string
  links?: StepLink[]
  videoThumbnail?: string
  blog?: string
  steps: StepProps[] | []
}

export const endOfLW8 = '2023-12-15T23:59:59.999-08:00'

const days: WeekDayProps[] = [
  {
    title: '',
    shipped: false,
    date: '08 Dec',
    published_at: '2023-12-08T08:00:00.000-08:00',
    description: '',
    d: 0,
    dd: 'Pre-release',
    blog: '',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '11 Dec',
    published_at: '2023-12-11T08:00:00.000-08:00',
    description: '',
    d: 1,
    dd: 'Mon',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '12 Dec',
    published_at: '2023-12-12T08:00:00.000-08:00',
    description: '',
    d: 2,
    dd: 'Tue',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '13 Dec',
    published_at: '2023-12-13T08:00:00.000-08:00',
    description: '',
    d: 3,
    dd: 'Wed',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '14 Dec',
    published_at: '2023-12-14T08:00:00.000-08:00',
    description: '',
    d: 4,
    dd: 'Thu',
    steps: [],
  },
  {
    title: '',
    shipped: false,
    date: '15 Dec',
    published_at: '2023-12-15T08:00:00.000-08:00',
    description: '',
    d: 5,
    dd: 'Fri',
    steps: [],
  },
]

export default days
