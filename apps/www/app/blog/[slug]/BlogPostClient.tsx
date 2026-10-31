import BlogPostAnchorEffect from './BlogPostAnchorEffect'
import BlogPostRenderer from '@/components/Blog/BlogPostRenderer'
import authors from '@/lib/authors.json'
import { isNotNullOrUndefined } from '@/lib/helpers'
import type { Blog, BlogData, PostReturnType, ProcessedBlogData } from '@/types/post'

type BlogPostPageProps = {
  prevPost: PostReturnType | null
  nextPost: PostReturnType | null
  relatedPosts: (PostReturnType & BlogData)[]
  blog: Blog & BlogData
  isDraftMode: boolean
}

export default function BlogPostClient(props: BlogPostPageProps) {
  const blogMetaData = props.blog

  const blogAuthors = (blogMetaData.author ?? '')
    ?.split(',')
    .map((authorId) => authorId.trim())
    .filter(Boolean)
    .map((authorId) => {
      const foundAuthor = authors.find((author) => author.author_id === authorId)
      return foundAuthor ?? null
    })
    .filter(isNotNullOrUndefined)

  return (
    <>
      <BlogPostAnchorEffect />
      <BlogPostRenderer
        blog={props.blog as ProcessedBlogData}
        blogMetaData={blogMetaData as ProcessedBlogData}
        isDraftMode={props.isDraftMode}
        prevPost={props.prevPost}
        nextPost={props.nextPost}
        authors={blogAuthors}
      />
    </>
  )
}
