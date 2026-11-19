import { Link } from '@tanstack/react-router'
import { Button } from 'ui'

export function DatabaseAccessProjectIssues({
  projects,
  onRemove,
}: {
  projects: { ref: string; name: string }[]
  onRemove?: (ref: string) => void
}) {
  return (
    <section
      className="rounded-md border bg-surface-75 px-4"
      aria-label="Projects that need changes"
    >
      <h3 className="pt-3 text-sm font-medium">Projects that need changes</h3>
      <p className="pt-1 text-xs text-foreground-light">
        Upgrade these projects to Postgres 17 or later before authorizing.
      </p>
      <ul className="divide-y text-xs">
        {projects.map(({ ref, name }) => (
          <li key={ref} className="flex items-start justify-between gap-2 py-3">
            <div className="space-y-1">
              <p className="font-medium">{name}</p>
              <Link
                className="underline"
                to="/project/$ref/settings/infrastructure"
                params={{ ref }}
                target="_blank"
                rel="noreferrer"
              >
                View upgrade options
              </Link>
            </div>
            {onRemove && (
              <Button
                variant="text"
                size="tiny"
                aria-label={`Remove ${name}`}
                onClick={() => onRemove(ref)}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
