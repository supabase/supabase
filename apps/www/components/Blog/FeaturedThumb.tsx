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
    <div key={blog.slug} className="w-full grid lg:grid-cols-12 gap-8">
      {/* Image */}
      <Link
        href={`${blog.path}`}
        prefetch={false}
        className="relative w-full aspect-[16/10] lg:col-span-6 overflow-hidden block group"
      >
        <div className="relative w-full h-full min-h-[200px] shadow-lg border border-foreground/10 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            fill
            sizes={BLOG_FEATURED_IMAGE_SIZES}
            priority
            className="object-cover bg-alternative group-hover:scale-[1.02] transition-transform duration-300"
            alt="blog thumbnail"
          />
        </div>
      </Link>

      {/* Text */}
      <div className="flex flex-col lg:col-span-6 px-6 pb-8">
        <div>
          <Link href={`${blog.path}`} prefetch={false} className="group">
            <h2 className="h2 lg:!text-xl xl:!text-2xl !mb-2 group-hover:underline">
              {blog.title}
            </h2>
          </Link>
          <p className="p">{blog.description}</p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <AuthorAvatars authors={author} size="md" />
          <div className="text-foreground-lighter flex space-x-2 text-sm">
            <span>{blog.formattedDate}</span>
            <span>·</span>
            <span>{blog.readingTime}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturedThumb
