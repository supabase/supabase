import { XIcon } from 'lucide-react'
import { Admonition } from 'ui-patterns/Admonition'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export function DatabaseAccessProjectIssues({
  projects,
  onRemove,
}: {
  projects: { ref: string; name: string }[]
  onRemove?: (ref: string) => void
}) {
  return (
    <Admonition
      type="warning"
      title="These projects block authorization"
      description={onRemove ? 'Upgrade or remove them to continue.' : 'Upgrade them to continue.'}
    >
      <div className="divide-y text-xs">
        {projects.map(({ ref, name }) => (
          <div key={ref} className="flex items-center justify-between gap-2 py-1.5">
            <div>
              <p className="font-medium text-foreground">{name}</p>
              <p>Needs Postgres 17 or later.</p>
            </div>
            {onRemove && (
              <ButtonTooltip
                variant="text"
                size="tiny"
                aria-label={`Remove ${name}`}
                onClick={() => onRemove(ref)}
                icon={<XIcon />}
                tooltip={{ content: { side: 'top', text: `Remove ${name}` } }}
              />
            )}
          </div>
        ))}
      </div>
    </Admonition>
  )
}
