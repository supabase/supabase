import { ComponentProps, forwardRef } from 'react'
import { Button, Card, CardDescription, CardHeader, CardTitle } from 'ui'

import { Shortcut } from '@/components/ui/Shortcut'
import type { ShortcutId } from '@/state/shortcuts/registry'

interface ActionPanelProps extends Omit<React.ComponentProps<typeof Card>, 'onClick' | 'type'> {
  title: string
  description: string
  buttonLabel: ComponentProps<typeof Button>['children']
  onClick: () => void
  loading: ComponentProps<typeof Button>['loading']
  icon?: ComponentProps<typeof Button>['icon']
  variant?: ComponentProps<typeof Button>['variant']
  shortcutId?: ShortcutId
}

export const ActionPanel = forwardRef<HTMLDivElement, ActionPanelProps>(
  (
    { title, description, buttonLabel, onClick, loading, icon, variant, shortcutId, ...props },
    ref
  ) => {
    const button = (
      <Button onClick={onClick} loading={loading} icon={icon} variant={variant}>
        {buttonLabel}
      </Button>
    )

    return (
      <Card
        className="first:rounded-b-none last:rounded-t-none shadow-none only:rounded-lg"
        ref={ref}
        {...props}
      >
        <CardHeader className="lg:flex-row lg:items-center gap-3 lg:gap-10 py-4 border-0">
          <div className="flex flex-col gap-2 flex-1 grow">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="max-w-xl">{description}</CardDescription>
          </div>
          <div className="flex lg:justify-end flex-">
            {shortcutId ? (
              <Shortcut
                id={shortcutId}
                onTrigger={onClick}
                side="bottom"
                options={{ enabled: !loading }}
              >
                {button}
              </Shortcut>
            ) : (
              button
            )}
          </div>
        </CardHeader>
      </Card>
    )
  }
)
ActionPanel.displayName = 'ActionPanel'
