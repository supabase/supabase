export type Tag =
  | string
  | {
      name: string
      id: number
      documentId: string
      createdAt: string
      updatedAt: string
      publishedAt: string
    }

export type CMSAuthor = {
  author: string
  author_image_url: {
    url: string
  }
  author_url: string
  position: string
}

export type StaticAuthor = {
  author: string
  author_image_url: string | null
  author_url: string
  position: string
}

export type BlogData = {
  slug: string
  title: string
  description?: string
  content: any
  toc: any
  author?: string
  authors?: (CMSAuthor | StaticAuthor)[]
  date: string
  categories?: string[]
  tags?: Tag[]
  toc_depth?: number
  video?: string
  docs_url?: string
  blog_url?: string
  url?: string
  source: string
  image?: string
  thumb?: string
  youtubeHero?: string
  launchweek?: number | string
  meta_title?: string
  meta_description?: string
  isCMS?: boolean
}
