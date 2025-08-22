import authors from 'lib/authors.json'
import Image from 'next/image'
import Link from 'next/link'
import type PostTypes from 'types/post'

// Extend PostTypes for CMS blog posts
interface CMSPostTypes extends PostTypes {
  isCMS?: boolean
  authors?: Array<{
    author: string
    author_id: string
    position: string
    author_url: string
    author_image_url: {
      url: string
    }
    username: string
  }>
}

function FeaturedThumb(blog: PostTypes | CMSPostTypes) {
  // First check if this is a CMS post
  if ('isCMS' in blog && blog.isCMS) {
    // For CMS posts, display author directly from the blog data
    const cmsBlog = blog as CMSPostTypes
    const author =
      cmsBlog.authors?.map((author) => ({
        author: author.author || 'Unknown Author',
        author_image_url: author.author_image_url || null,
        author_url: author.author_url || '#',
        position: author.position || '',
      })) || []

    return renderFeaturedThumb(blog, author)
  }

  // For static posts, look up author info from authors.json
  const authorArray = blog.author?.split(',') || []
  const author = []

  for (let i = 0; i < authorArray.length; i++) {
    author.push(
      authors.find((authors: any) => {
        return authors.author_id === authorArray[i]
      })
    )
  }

  return renderFeaturedThumb(blog, author)
}
// A base64 encoded image to use as a placeholder while the image is loading
const placeholderBlur =
  'data:image/png;base64,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'

function renderFeaturedThumb(blog: PostTypes, author: any[]) {
  const imageUrl = blog.isCMS
    ? blog.thumb
      ? blog.thumb
      : blog.image
        ? blog.image
        : '/images/blog/blog-placeholder.png'
    : blog.thumb
      ? `/images/blog/${blog.thumb}`
      : blog.image
        ? `/images/blog/${blog.image}`
        : '/images/blog/blog-placeholder.png'

  return (
    <div key={blog.slug} className="w-full">
      <Link
        href={`${blog.path}`}
        className="grid gap-4 lg:grid-cols-7 lg:gap-8 xl:gap-12 hover:bg-surface-200 dark:hover:bg-surface-75 p-2 sm:p-4 rounded-xl"
      >
        <div className="relative w-full aspect-[2/1] lg:col-span-3 lg:aspect-[3/2] overflow-auto rounded-lg border">
          <Image
            src={imageUrl}
            fill
            sizes="100%"
            quality={100}
            placeholder="blur"
            blurDataURL={placeholderBlur}
            priority
            className="object-cover"
            alt="blog thumbnail"
          />
        </div>
        <div className="flex flex-col space-y-2 lg:col-span-4 xl:justify-center max-w-xl">
          <div className="text-lighter flex space-x-2 text-sm">
            <span>{blog.formattedDate}</span>
            <span>•</span>
            <span>{blog.readingTime}</span>
          </div>

          <div>
            <h2 className="h2 lg:!text-2xl xl:!text-3xl !mb-2">{blog.title}</h2>
            <p className="p xl:text-lg">{blog.description}</p>
          </div>

          <div className="flex flex-col w-max gap-2">
            {author.filter(Boolean).map((author: any, i: number) => {
              const authorImageUrl =
                typeof author.author_image_url === 'string'
                  ? author.author_image_url
                  : (author.author_image_url as { url: string })?.url || ''

              return (
                <div
                  className="flex items-center space-x-2"
                  key={`author-feat-${i}-${author.author}`}
                >
                  {imageUrl && (
                    <div className="relative h-6 w-6 overflow-auto">
                      <Image
                        src={authorImageUrl}
                        alt={`${author.author} avatar`}
                        className="rounded-full object-cover"
                        fill
                        sizes="30px"
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-foreground m-0 text-sm">{author.author}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default FeaturedThumb
