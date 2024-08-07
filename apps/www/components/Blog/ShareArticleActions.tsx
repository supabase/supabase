import Link from 'next/link'
import { IconLinkedinSolid, IconTwitterX, IconYCombinator } from 'ui'

const ShareArticleActions = ({
  title,
  slug,
  iconSize = 20,
  basePath = 'https://supabase.com/blog/',
}: {
  title: string
  slug: string
  iconSize?: number
  basePath?: string
}) => (
  <div className="mt-4 flex items-center gap-4">
    <Link
      aria-label="Share on X"
      href={`https://twitter.com/share?text=${title}&url=${basePath}${slug}`}
      target="_blank"
      className="text-foreground-lighter hover:text-foreground"
    >
      <IconTwitterX size={iconSize} />
    </Link>

    <Link
      aria-label="Share on Linkedin"
      href={`https://www.linkedin.com/shareArticle?url=${basePath}${slug}&title=${title}&text=${title}`}
      target="_blank"
      className="text-foreground-lighter hover:text-foreground"
    >
      <IconLinkedinSolid size={iconSize} />
    </Link>
    <Link
      aria-label="Share on Hacker News"
      href={`https://news.ycombinator.com/submitlink?u=${basePath}${slug}&t=${title}`}
      target="_blank"
      className="text-foreground-lighter hover:text-foreground"
    >
      <IconYCombinator size={iconSize} />
    </Link>
  </div>
)

export default ShareArticleActions
