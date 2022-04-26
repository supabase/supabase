type PressItem = {
  type: 'podcast' | 'video' | 'article' | 'blog' | 'news' | 'event' | 'other'
  href: string
  title: string
  publisher: string
}

const data: PressItem[] = [
  {
    type: 'article',
    href: 'https://techcrunch.com/2021/09/09/supabase-raises-30m-for-its-open-source-insta-backend',
    title: 'Open source backend-as-a-service startup Supabase raises $30M',
    publisher: 'TechCrunch',
  },
  {
    type: 'article',
    href: 'https://techcrunch.com/2020/12/15/supabase-raises-6m-for-its-open-source-firebase-alternative',
    title: 'Supabase raises $6M for its open-source Firebase alternative',
    publisher: 'TechCrunch',
  },
  {
    type: 'podcast',
    href: 'https://softwareengineeringdaily.com/2020/10/15/supabase-open-source-firebase-with-paul-copplestone',
    title: 'Software Engineering Daily',
    publisher: 'Software Engineering Daily',
  },
  {
    type: 'podcast',
    href: 'https://fsjam.org/episodes/episode-33-supabase-with-paul-copplestone',
    title: 'FS Jam',
    publisher: 'FS Jam',
  },
  {
    type: 'podcast',
    href: 'https://www.heavybit.com/library/podcasts/jamstack-radio/ep-71-open-source-firebase-alternative-with-paul-copplestone-of-supabase',
    title: 'Jamstack Radio',
    publisher: 'Heavybit',
  },
  {
    type: 'podcast',
    href: 'https://podrocket.logrocket.com/9',
    title: 'PodRocket',
    publisher: 'LogRocket',
  },
]

export default data
