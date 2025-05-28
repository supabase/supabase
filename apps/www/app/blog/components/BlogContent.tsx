'use client'

import Image from 'next/image'
import { Badge } from 'ui'
import Link from 'next/link'
import React from 'react'

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
  isCMS?: boolean
  richContent?: any // Raw Lexical content from CMS
}

// Simple Lexical content renderer for CMS content
const LexicalContentRenderer = ({ content }: { content: any }) => {
  if (!content?.root?.children) {
    return <p>No content available</p>
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-4">
            {node.children?.map((child: any, childIndex: number) =>
              child.type === 'text' ? child.text : ''
            )}
          </p>
        )
      case 'heading':
        const HeadingTag = node.tag || 'h2'
        const headingText = node.children?.map((child: any) => child.text).join('') || ''
        return React.createElement(
          HeadingTag,
          { key: index, className: 'mb-4 font-bold' },
          headingText
        )
      case 'list':
        const ListTag = node.listType === 'number' ? 'ol' : 'ul'
        return React.createElement(
          ListTag,
          { key: index, className: 'mb-4 ml-6' },
          node.children?.map((listItem: any, listIndex: number) => (
            <li key={listIndex} className="mb-2">
              {listItem.children?.map((child: any) => child.text).join('') || ''}
            </li>
          ))
        )
      default:
        return null
    }
  }

  return (
    <div className="prose prose-docs max-w-none">
      {content.root.children.map((node: any, index: number) => renderNode(node, index))}
    </div>
  )
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
  isCMS = false,
  richContent,
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
            {isCMS && richContent ? (
              <LexicalContentRenderer content={richContent} />
            ) : (
              <BlogMarkdownProcessor
                content={content}
                mdxSource={mdxSource}
                toc_depth={toc_depth}
              />
            )}
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
