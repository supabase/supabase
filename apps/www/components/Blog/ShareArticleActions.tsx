import Link from 'next/link'
import { cn, IconLinkedinSolid, IconTwitterX, IconYCombinator } from 'ui'

const ShareArticleActions = ({
  title,
  slug,
  iconSize = 20,
  basePath = 'https://supabase.com/blog/',
  className,
}: {
  title: string
  slug: string
  iconSize?: number
  basePath?: string
  className?: string
}) => {
  const permalink = encodeURIComponent(`${basePath}${slug}`)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className={cn('mt-4 flex items-center gap-4', className)}>
      <Link
        aria-label="Share on X"
        href={`https://twitter.com/intent/tweet?url=${permalink}&text=${encodedTitle}`}
        target="_blank"
        className="text-foreground-lighter hover:text-foreground"
      >
        <IconTwitterX size={iconSize} />
      </Link>

      <Link
        aria-label="Share on Linkedin"
        href={`https://www.linkedin.com/shareArticle?url=${permalink}&text=${encodedTitle}`}
        target="_blank"
        className="text-foreground-lighter hover:text-foreground"
      >
        <IconLinkedinSolid size={iconSize} />
      </Link>
      <Link
        aria-label="Share on Hacker News"
        href={`https://news.ycombinator.com/submitlink?u=${permalink}&t=${encodedTitle}`}
        target="_blank"
        className="text-foreground-lighter hover:text-foreground"
      >
        <IconYCombinator size={iconSize} />
      </Link>
    </div>
  )
}

export default ShareArticleActions
