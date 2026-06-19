'use client'

import FeaturedThumb from 'components/Blog/FeaturedThumb'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type PostTypes from 'types/post'

import blogAuthors from '@/lib/authors.json'

function SecondarySpotlight({ post }: { post: PostTypes }) {
  const resolveImagePath = (img: string | undefined): string | null => {
    if (!img) return null
    return img.startsWith('/') || img.startsWith('http') ? img : `/images/blog/${img}`
  }
  const imageUrl =
    resolveImagePath(post.imgThumb) ||
    resolveImagePath(post.imgSocial) ||
    '/images/blog/blog-placeholder.png'

  const authorNames = (post.author?.split(',') ?? [])
    .map((id) => blogAuthors.find((a: any) => a.author_id === id.trim())?.author)
    .filter(Boolean)
    .join(', ')

  return (
    <Link href={post.path} prefetch={false} className="group flex gap-4 items-start">
      <div className="relative shrink-0 w-36 aspect-[1.91/1] overflow-hidden rounded-md border border-foreground/10">
        <Image
          src={imageUrl}
          fill
          sizes="112px"
          quality={80}
          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          alt={post.title}
        />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="text-foreground text-sm leading-snug group-hover:underline line-clamp-3">
          {post.title}
        </h3>
        {post.formattedDate && (
          <p className="text-foreground-lighter text-xs">{post.formattedDate}</p>
        )}
        {authorNames && <p className="text-foreground-light text-xs">{authorNames}</p>}
      </div>
    </Link>
  )
}

/**
 * Featured hero for the blog. Rendered by the blog route layout so it stays
 * mounted across navigation between `/blog` and `/blog/categories/*`. It's only
 * meant for the index, so on other blog routes we animate its height to 0 —
 * collapsing it smoothly slides the page content up/down instead of jumping.
 */
export default function BlogHero({
  featuredPost,
  secondaryPosts,
}: {
  featuredPost: PostTypes | null
  secondaryPosts: PostTypes[]
}) {
  const pathname = usePathname()
  // Only mount the hero on the listing routes it animates between (index ⇄
  // category). Elsewhere (posts, tags, authors) it's irrelevant — rendering it
  // would needlessly preload the featured image.
  const isListingRoute = pathname === '/blog' || Boolean(pathname?.startsWith('/blog/categories/'))
  const expanded = pathname === '/blog'

  if (!featuredPost || !isListingRoute) return null

  // When collapsed, `inert` removes the clipped hero (and its links) from the
  // a11y tree and tab order entirely.
  const collapsedProps = expanded ? {} : ({ inert: '' } as any)

  return (
    <motion.div
      {...collapsedProps}
      initial={false}
      animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden={!expanded}
      className="overflow-hidden"
    >
      <div className="pt-32 pb-10">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6">
          <div className="max-w-4xl">
            <FeaturedThumb key={featuredPost.slug} {...featuredPost} />
          </div>

          {secondaryPosts.length > 0 && (
            <div className="mt-14 max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6">
              {secondaryPosts.map((post) => (
                <SecondarySpotlight key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
