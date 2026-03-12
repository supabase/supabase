import Image from 'next/image'
import Link from 'next/link'
import { cn } from 'ui'
import { getSortedPosts } from '~/lib/posts'
import SectionContainer from '../Layouts/SectionContainer'

interface PostGridProps {
  id?: string
  className?: string

  header: React.ReactNode
  subheader: React.ReactNode
  posts: ReturnType<typeof getSortedPosts>
}

function PostGrid({ id, className, header, subheader, posts }: PostGridProps) {
  const hasPosts = posts.length > 0

  return (
    <SectionContainer id={id} className={cn('flex flex-col gap-12 py-16 md:py-24', className)}>
      <div className="flex flex-col lg:max-w-[50%]">
        <h2 className="h2">{header}</h2>
        <p className="p">{subheader}</p>
      </div>

      {hasPosts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Link
              href={post.path}
              className="border rounded-md flex flex-col relative overflow-hidden"
              key={post.slug}
            >
              {post.imgThumb && (
                <div className="w-full aspect-video relative rounded-t-md dark:[mask-image:linear-gradient(to_bottom,_#000_0%,_#000_60%,_transparent_100%)]">
                  <Image
                    src={
                      post.imgThumb.startsWith('/') || post.imgThumb.startsWith('http')
                        ? post.imgThumb
                        : `/images/blog/${post.imgThumb}`
                    }
                    alt={post.title || ''}
                    className="object-cover"
                    fill
                  />
                </div>
              )}

              <div className="p-3 mt-auto flex flex-col gap-1">
                <h3 className="p !mb-0 !text-foreground line-clamp-1">{post.title}</h3>
                <p className="text-sm !mb-0 !text-foreground-light inline-flex items-center gap-2">
                  <span>{post.readingTime}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="p">No posts found</p>
      )}
    </SectionContainer>
  )
}

export default PostGrid

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
