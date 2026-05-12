import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'

import authors from '@/lib/authors.json'
import {
  BLOG_GRID_IMAGE_SIZES,
  BLOG_PLACEHOLDER_IMAGE,
  getBlogThumbnailImage,
} from '@/lib/blog-images'
import type Author from '@/types/author'
import type PostTypes from '@/types/post'

interface Props {
  post: PostTypes
}

const BlogGridItem = ({ post }: Props) => {
  const authorArray: string[] | undefined = post.author ? post.author.split(',') : []
  const author = []

  if (authorArray) {
    for (let i = 0; i < authorArray.length; i++) {
      author.push(
        authors.find((authors: Author) => {
          return authors.author_id === authorArray[i]
        })
      )
    }
  }

  const imageUrl = getBlogThumbnailImage(post) ?? BLOG_PLACEHOLDER_IMAGE

  return (
    <Link
      href={post.path}
      prefetch={false}
      className="group inline-block min-w-full p-2 sm:p-4 h-full border border-transparent transition-all hover:bg-surface-200 dark:hover:bg-surface-75 rounded-xl"
    >
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col space-y-1">
          <div className="border-default relative mb-3 w-full aspect-[1.91/1] overflow-hidden rounded-lg border shadow-xs">
            <Image
              fill
              sizes={BLOG_GRID_IMAGE_SIZES}
              src={imageUrl}
              className="scale-100 object-cover overflow-hidden"
              alt={`${post.title} thumbnail`}
            />
          </div>

          {post.date && (
            <div className="text-foreground-lighter flex items-center space-x-1.5 text-sm">
              <p>{dayjs(post.date).format('D MMM YYYY')}</p>
              {post.readingTime && (
                <>
                  <p>·</p>
                  <p>{post.readingTime}</p>
                </>
              )}
            </div>
          )}
          <h3 className="text-foreground max-w-sm text-xl">{post.title}</h3>
          <p className="text-foreground-light max-w-sm text-base mb-0!">{post.description}</p>
        </div>
      </div>
    </Link>
  )
}

export default BlogGridItem
