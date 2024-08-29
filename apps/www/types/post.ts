type PostTypes = {
  slug?: string
  type: 'casestudy' | 'blog'
  title: string
  date?: string
  end_date?: string
  timezone?: string
  coverImage?: string
  author?: string
  excerpt?: string
  ogImage?: {
    url: string
  }
  link?: {
    href: string
    target?: '_blank' | '_self'
    label?: string
  }
  content?: string
  thumb: string
  image?: string
  readingTime?: string
  description: string
  url: string
  path: string
  tags?: []
  categories?: []
  logo?: string
  logo_inverse?: string
  hideAuthor?: boolean
  onDemand?: boolean
  disable_page_build?: boolean
}

export default PostTypes
