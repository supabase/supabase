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
  const authorArray = blog.author?.split(',').map((a) => a.trim()) || []
  const author = []

  for (let i = 0; i < authorArray.length; i++) {
    const foundAuthor = authors.find((authors: any) => {
      return authors.author_id === authorArray[i]
    })
    if (foundAuthor) {
      author.push(foundAuthor)
    }
  }

  return renderFeaturedThumb(blog, author)
}

function renderFeaturedThumb(blog: PostTypes, author: any[]) {
  const resolveImagePath = (img: string | undefined): string | null => {
    if (!img) return null
    return img.startsWith('/') || img.startsWith('http') ? img : `/images/blog/${img}`
  }

  const imageUrl = blog.isCMS
    ? blog.imgThumb || blog.imgSocial || '/images/blog/blog-placeholder.png'
    : resolveImagePath(blog.imgThumb) ||
      resolveImagePath(blog.imgSocial) ||
      '/images/blog/blog-placeholder.png'

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
            priority
            className="object-cover bg-alternative"
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
