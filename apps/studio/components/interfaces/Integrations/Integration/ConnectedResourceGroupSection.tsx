import { Settings, Trash2, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { type ResourceGroup } from './MarketplaceIntegrationSettingsTab.types'
import { type ConnectedResource } from '@/components/interfaces/Integrations/Landing/Landing.utils'

export const ResourceGroupSection = ({
  group,
  onRemove,
}: {
  group: ResourceGroup
  onRemove: (resource: ConnectedResource) => void
}) => {
  return (
    <section className="flex flex-col gap-y-4 border-b py-8 first:pt-0 last:border-b-0">
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-2">
          <h3 className="text-base text-foreground">{group.title}</h3>
          {group.missing ? (
            <Badge variant="warning" className="gap-x-1.5">
              <TriangleAlert size={12} strokeWidth={1.5} />
              Not connected
            </Badge>
          ) : (
            group.badge && (
              <Badge variant="success" className="gap-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {group.badge}
              </Badge>
            )
          )}
        </div>
        <p className="text-sm text-foreground-light max-w-2xl">{group.description}</p>
      </div>

      <Admonition
        type={group.missing ? 'warning' : 'default'}
        className="m-0 max-w-2xl"
        title={group.missing ? 'This resource is missing' : undefined}
      >
        {group.missing ? group.missingNote : group.note}
      </Admonition>

      {group.missing ? (
        group.manageAction && (
          <div className="max-w-2xl">
            <Button asChild variant="default" icon={<Settings />}>
              <Link href={group.manageAction.href}>{group.manageAction.label}</Link>
            </Button>
          </div>
        )
      ) : (
        <div className="max-w-2xl divide-y rounded-md border bg-surface-100">
          {group.items.map((item) => (
            <div
              key={item.resource.key}
              className="flex items-center justify-between gap-x-4 px-4 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <code
                  className="truncate font-mono text-sm text-foreground"
                  title={item.identifier}
                >
                  {item.identifier}
                </code>
                {item.meta && <span className="text-xs text-foreground-lighter">{item.meta}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-x-2">
                {group.manageAction && (
                  <Button asChild variant="default" icon={<Settings />}>
                    <Link href={group.manageAction.href}>{group.manageAction.label}</Link>
                  </Button>
                )}
                <Button
                  variant="default"
                  icon={<Trash2 className="text-foreground-light" />}
                  onClick={() => onRemove(item.resource)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
