import Link from 'next/link'

export const ObservabilityOverviewFooter = () => {
  return (
    <div className="py-12 flex items-center justify-center">
      <p className="text-sm text-foreground-light">
        <Link
          href="https://supabase.com/docs/guides/troubleshooting"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-2 decoration-foreground-muted hover:decoration-foreground transition-all"
        >
          View our troubleshooting guides
        </Link>{' '}
        for solutions to common Supabase issues.{' '}
      </p>
    </div>
  )
}
