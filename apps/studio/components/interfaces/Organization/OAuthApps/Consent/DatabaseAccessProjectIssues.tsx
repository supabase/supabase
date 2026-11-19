import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

export function DatabaseAccessProjectIssues({
  projects,
  onRemove,
}: {
  projects: { ref: string; name: string }[]
  onRemove?: (ref: string) => void
}) {
  return (
    <Admonition type="warning" title="Project upgrade required">
      <ul className="text-xs">
        {projects.map(({ ref, name }) => (
          <li key={ref} className="flex items-start justify-between gap-2 py-3">
            <p>
              <span className="font-medium">{name}</span> needs Postgres 17 or later.
            </p>
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
    </Admonition>
  )
}
