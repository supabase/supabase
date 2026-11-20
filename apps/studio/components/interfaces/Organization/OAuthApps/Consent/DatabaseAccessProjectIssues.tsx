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
      title="These projects require changes"
      description={onRemove ? 'Fix or remove them to continue.' : 'Fix them to continue.'}
    >
      <div className="mt-1 divide-y text-xs">
        {projects.map(({ ref, name, issue }) => (
          <div key={ref} className="flex items-center justify-between gap-2 py-2">
            <div className="min-w-0 leading-normal">
              <div className="font-medium text-foreground">{name}</div>
              <div>
                {issue === 'postgres_upgrade_required'
                  ? 'Needs Postgres 17 or later.'
                  : 'Database is currently unavailable.'}
              </div>
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
