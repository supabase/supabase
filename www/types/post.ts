import Author from './author'

type PostTypes = {
  slug: string
  title: string
  date: string
  coverImage: string
  author: Author
  excerpt: string
  ogImage: {
    url: string
  }
  content: string
  thumb: string
  image: string
  readingTime: string
  url: string
  tags: []
}

export default PostTypes
