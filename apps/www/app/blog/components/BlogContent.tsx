'use client'

import Image from 'next/image'
import { Badge } from 'ui'
import Link from 'next/link'

import ShareArticleActions from '~/components/Blog/ShareArticleActions'
import { NextCard } from './NextCard'
import { BlogMarkdownProcessor } from './BlogMarkdownProcessor'
import { Tag } from '../types'

interface BlogContentProps {
  content: string
  mdxSource: any
  youtubeHero?: string
  thumb?: string
  imageUrl?: string
  title: string
  tags?: Tag[]
  toc_depth?: number
  prevPost: any
  nextPost: any
}

export const BlogContent = ({
  content,
  mdxSource,
  youtubeHero,
  thumb,
  imageUrl,
  title,
  tags,
  toc_depth,
  prevPost,
  nextPost,
}: BlogContentProps) => {
  return (
    <div className="grid grid-cols-12 lg:gap-16 xl:gap-8">
      <div className="col-span-12 lg:col-span-7 xl:col-span-7">
        <article>
          <div className={['prose prose-docs'].join(' ')}>
            {youtubeHero ? (
              <iframe
                className="w-full"
                width="700"
                height="350"
                src={youtubeHero}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={true}
              />
            ) : (
              thumb &&
              imageUrl && (
                <div className="hidden md:block relative mb-8 w-full aspect-video overflow-auto rounded-lg border">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    quality={100}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover m-0"
                  />
                </div>
              )
            )}
            <BlogMarkdownProcessor content={content} mdxSource={mdxSource} toc_depth={toc_depth} />
          </div>
        </article>
        <div className="block lg:hidden py-8">
          <div className="text-foreground-lighter text-sm">Share this article</div>
          <ShareArticleActions title={title} slug={title} />
        </div>
        <div className="grid gap-8 py-8 lg:grid-cols-1">
          <div>{prevPost && <NextCard post={prevPost} label="Last post" />}</div>
          <div>
            {nextPost && <NextCard post={nextPost} label="Next post" className="text-right" />}
          </div>
        </div>
      </div>
      <div className="relative col-span-12 space-y-8 lg:col-span-5 xl:col-span-3 xl:col-start-9">
        <div className="space-y-6">
          <div className="hidden lg:block">
            <div>
              <div className="flex flex-wrap gap-2">
                {(tags as Tag[])?.map((tag) => {
                  const tagName = typeof tag === 'string' ? tag : tag.name
                  const tagId = typeof tag === 'string' ? tag : tag.id.toString()
                  return (
                    <Link href={`/blog/tags/${tagName}`} key={`category-badge-${tagId}`}>
                      <Badge>{tagName}</Badge>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="text-foreground text-sm">Share this article</div>
            <ShareArticleActions title={title} slug={title} />
          </div>
        </div>
      </div>
    </div>
  )
}
