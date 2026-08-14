'use client'

import { useCopyMarkdownFromUrl } from 'common'
import Link from 'next/link'
import {
  cn,
  IconLinkedinSolid,
  IconTwitterX,
  IconYCombinator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'ui'

import { SITE_ORIGIN } from '@/lib/constants'

const ShareArticleActions = ({
  title,
  slug,
  iconSize = 16,
  basePath = 'https://supabase.com/blog/',
  className,
}: {
  title: string
  slug: string
  iconSize?: number
  basePath?: string
  className?: string
}) => {
  const { copied, copyMarkdown } = useCopyMarkdownFromUrl()

  const permalink = encodeURIComponent(`${basePath}${slug}`)
  const encodedTitle = encodeURIComponent(title)
  const mdPath = `/blog/${slug}.md`
  const mdAbs = `${SITE_ORIGIN}${mdPath}`
  const aiPrompt = `Read from ${mdAbs} so I can ask questions about its contents`

  return (
    <TooltipProvider>
      <div className={cn('mt-4 flex items-center gap-4', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              aria-label="Share on X"
              href={`https://twitter.com/intent/tweet?url=${permalink}&text=${encodedTitle}`}
              target="_blank"
              className="text-foreground-lighter hover:text-foreground transition-colors"
            >
              <IconTwitterX size={iconSize} />
            </Link>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>Share on X</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              aria-label="Share on LinkedIn"
              href={`https://www.linkedin.com/shareArticle?url=${permalink}&text=${encodedTitle}`}
              target="_blank"
              className="text-foreground-lighter hover:text-foreground transition-colors"
            >
              <IconLinkedinSolid size={iconSize} />
            </Link>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>Share on LinkedIn</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              aria-label="Share on Hacker News"
              href={`https://news.ycombinator.com/submitlink?u=${permalink}&t=${encodedTitle}`}
              target="_blank"
              className="text-foreground-lighter hover:text-foreground transition-colors"
            >
              <IconYCombinator size={iconSize} />
            </Link>
          </TooltipTrigger>
          <TooltipContent sideOffset={8}>Share on Hacker News</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export default ShareArticleActions
