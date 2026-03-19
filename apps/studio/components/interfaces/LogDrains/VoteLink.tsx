import Link from 'next/link'

export const VoteLink = () => {
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm">
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
