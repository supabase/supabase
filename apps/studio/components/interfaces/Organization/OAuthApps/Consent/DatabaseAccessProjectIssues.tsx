import { XIcon } from 'lucide-react'
import { Admonition } from 'ui-patterns/Admonition'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export function DatabaseAccessProjectIssues({
  projects,
  onRemove,
}: {
  projects: {
    ref: string
    name: string
    issue: 'postgres_upgrade_required' | 'project_unavailable'
  }[]
  onRemove?: (ref: string) => void
}) {
  return (
    <Admonition
      type="warning"
      title="These projects require changes first"
      description={onRemove ? 'Fix or remove them to continue.' : 'Fix them to continue.'}
    >
      <div className="divide-y rounded-md border px-2 text-xs">
        {projects.map(({ ref, name, issue }) => (
          <div key={ref} className="flex items-center justify-between gap-2 py-1.5">
            <div>
              <p className="font-medium text-foreground">{name}</p>
              <p>
                {issue === 'postgres_upgrade_required'
                  ? 'Needs Postgres 17 or later.'
                  : 'The database is currently unavailable.'}
              </p>
            </div>
            {onRemove && (
              <ButtonTooltip
                variant="text"
                size="tiny"
                aria-label={`Remove ${name}`}
                onClick={() => onRemove(ref)}
                icon={<XIcon />}
                tooltip={{ content: { side: 'top', text: 'Remove project' } }}
              />
            )}
          </div>
        ))}
      </div>
    </Admonition>
  )
}
