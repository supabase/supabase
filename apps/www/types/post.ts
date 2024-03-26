type PostTypes = {
  slug?: string
  type: 'casestudy' | 'blog'
  title: string
  date?: string
  coverImage?: string
  author?: string
  excerpt?: string
  ogImage?: {
    url: string
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
}

export default PostTypes
