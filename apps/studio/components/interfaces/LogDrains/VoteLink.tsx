import Image from 'next/image'
import Link from 'next/link'
import { BASE_PATH } from 'lib/constants'
import { cn } from 'ui'

export const VoteLink = () => {
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm">
      <Image
        className={cn('dark:invert text-muted')}
        src={`${BASE_PATH}/img/icons/github-icon.svg`}
        width={16}
        height={16}
        alt="GitHub icon"
      />
      <p className="text-foreground-light">
        Don't see your preferred drain?{' '}
        <Link
          href="https://github.com/orgs/supabase/discussions/28324?sort=top"
          className="text-foreground underline underline-offset-2 decoration-foreground-muted hover:decoration-foreground transition-all"
          target="_blank"
        >
          Vote here
        </Link>
      </p>
    </div>
  )
}
