import dayjs from 'dayjs'
import Image from 'next/image'
import Link from 'next/link'

import AuthorAvatars from './AuthorAvatars'
import authors from '@/lib/authors.json'
import { BLOG_PLACEHOLDER_IMAGE, getBlogThumbnailImage } from '@/lib/blog-images'
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
    <Link href={post.path} prefetch={false} className="group flex flex-col h-full">
      <div
        className="relative w-full aspect-[1.91/1] overflow-hidden rounded-md border border-foreground/10"
        aria-hidden="true"
      >
        <Image fill sizes="100%" quality={100} src={imageUrl} className="object-cover" alt="" />
      </div>
      <div className="flex flex-col gap-1 pt-4">
        <h3 className="text-foreground text-lg group-hover:underline">{post.title}</h3>
        <p className="text-foreground-lighter text-sm mt-1 line-clamp-2">{post.description}</p>
        {post.date && (
          <div className="text-foreground-lighter flex items-center space-x-1.5 text-[11px] mt-3">
            <p>
              <span className="sr-only">Published </span>
              {dayjs(post.date).format('D MMM YYYY')}
            </p>
            {post.readingTime && (
              <>
                <p aria-hidden="true">•</p>
                <p>{post.readingTime}</p>
              </>
            )}
          </div>
        )}
        <div className="mt-1.5">
          <span className="sr-only">Author: </span>
          <AuthorAvatars authors={author} />
        </div>
      </div>
    </Link>
  )
}

export default BlogGridItem
