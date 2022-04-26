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

export interface PartnerContact {
  type: 'technology' | 'expert'
  company: string
  country: string
  details?: string
  email: string
  first: string
  last: string
  phone?: string
  size?: number
  title?: string
  website: string
}
