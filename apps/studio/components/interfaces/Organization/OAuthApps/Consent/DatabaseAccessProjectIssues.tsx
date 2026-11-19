import { XIcon } from 'lucide-react'
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
      <div className="divide-y text-xs">
        {projects.map(({ ref, name }) => (
          <div key={ref} className="flex items-center justify-between gap-2 py-1.5">
            <div>
              <p className="font-medium text-foreground">{name}</p>
              <p>Needs Postgres 17 or later.</p>
            </div>
            {onRemove && (
              <Button
                variant="text"
                size="tiny"
                aria-label={`Remove ${name}`}
                onClick={() => onRemove(ref)}
                icon={<XIcon />}
              />
            )}
          </div>
        ))}
      </div>
    </Admonition>
  )
}
