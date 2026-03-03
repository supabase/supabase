import { DOCS_URL } from 'lib/constants'
import Link from 'next/link'

export const ObservabilityLink = () => {
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm">
      <p className="text-foreground-light">
        Export Metrics to your dashboards.{' '}
        <Link
          href={`${DOCS_URL}/guides/telemetry/metrics`}
          className="text-foreground underline underline-offset-2 decoration-foreground-muted hover:decoration-foreground transition-all"
          target="_blank"
        >
          Get started for free!
        </Link>
      </p>
    </div>
  )
}
