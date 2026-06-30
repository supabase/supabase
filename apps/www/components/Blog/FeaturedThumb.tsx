import Image from 'next/image'
import Link from 'next/link'

import AuthorAvatars from './AuthorAvatars'
import authors from '@/lib/authors.json'
import {
  BLOG_FEATURED_IMAGE_SIZES,
  BLOG_PLACEHOLDER_IMAGE,
  getBlogThumbnailImage,
} from '@/lib/blog-images'
import type PostTypes from '@/types/post'

function FeaturedThumb(blog: PostTypes) {
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
  const imageUrl = getBlogThumbnailImage(blog) ?? BLOG_PLACEHOLDER_IMAGE

  return (
    <article aria-label={`Featured post: ${blog.title}`}>
      <Link
        href={`${blog.path}`}
        prefetch={false}
        key={blog.slug}
        className="group w-full grid lg:grid-cols-12 gap-8 md:gap-12 hover:bg-surface-200 dark:hover:bg-surface-75 p-2 sm:p-4 rounded-xl"
      >
        <div className="relative w-full aspect-[1.91/1] lg:col-span-6 overflow-hidden block group">
          <div className="relative w-full h-full shadow-lg border border-foreground/10 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              fill
              sizes={BLOG_FEATURED_IMAGE_SIZES}
              priority
              className="object-cover bg-alternative group-hover:scale-[1.02] transition-transform duration-300"
              alt=""
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col lg:col-span-6 md:justify-center">
          <div>
            <h2 className="h2 lg:text-2xl! xl:text-3xl! mb-2! group-hover:underline">
              {blog.title}
            </h2>
            <p className="p">{blog.description}</p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="sr-only">Author: </span>
              <AuthorAvatars authors={author} size="md" />
            </div>
            <div className="text-foreground-lighter flex space-x-2 text-sm">
              <span>
                <span className="sr-only">Published </span>
                {blog.formattedDate}
              </span>
              <span aria-hidden="true">·</span>
              <span>{blog.readingTime}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default FeaturedThumb
