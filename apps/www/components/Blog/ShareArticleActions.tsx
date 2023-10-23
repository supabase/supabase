import Link from 'next/link'
import { IconLinkedinSolid, IconTwitterX, IconYCombinator } from 'ui'

const ShareArticleActions = ({ title, slug }: { title: string; slug: string }) => (
  <div className="mt-4 flex items-center space-x-4">
    <Link
      passHref
      href={`https://twitter.com/share?text=${title}&url=https://supabase.com/blog/${slug}`}
    >
      <a target="_blank" className="text-lighter hover:text-foreground">
        <IconTwitterX size={24} />
      </a>
    </Link>

    <Link
      passHref
      href={`https://www.linkedin.com/shareArticle?url=https://supabase.com/blog/${slug}&title=${title}`}
    >
      <a target="_blank" className="text-lighter hover:text-foreground">
        <IconLinkedinSolid size={24} />
      </a>
    </Link>
    <Link
      passHref
      href={`https://news.ycombinator.com/submitlink?u=https://supabase.com/blog/${slug}&t=${title}`}
    >
      <a target="_blank" className="text-lighter hover:text-foreground">
        <IconYCombinator size={24} />
      </a>
    </Link>
  </div>
)

export default ShareArticleActions
