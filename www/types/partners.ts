export interface Partner {
  id: number
  slug: string
  type: 'technology' | 'expert'
  category: string
  developer: string
  title: string
  description: string
  logo: string
  images: string[]
  overview: string
  website: string
  docs: string
  approved: boolean
}
