import Link from 'next/link'
import { IconLinkedinSolid, IconTwitterX, IconYCombinator } from 'ui'

const ShareArticleActions = ({ title, slug }: { title: string; slug: string }) => (
  <div className="mt-4 flex items-center space-x-4">
    <Link
      passHref
      href={`https://twitter.com/share?text=${title}&url=https://supabase.com/blog/${slug}`}
    >
      <a target="_blank" className="text-scale-900 hover:text-scale-1200">
        <IconTwitterX size={24} />
      </a>
    </Link>

    <Link
      passHref
      href={`https://www.linkedin.com/shareArticle?url=https://supabase.com/blog/${slug}&title=${title}`}
    >
      <a target="_blank" className="text-scale-900 hover:text-scale-1200">
        <IconLinkedinSolid size={24} />
      </a>
    </Link>
    <Link
      passHref
      href={`https://news.ycombinator.com/submitlink?u=https://supabase.com/blog/${slug}&t=${title}`}
    >
      <a target="_blank" className="text-scale-900 hover:text-scale-1200">
        <IconYCombinator size={24} />
      </a>
    </Link>
  </div>
)

export default ShareArticleActions
