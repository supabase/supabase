import React from 'react'
import { Button } from 'ui'
import { Card, CardHeader, CardTitle, CardDescription } from 'ui/src/components/shadcn/ui/card'

interface ActionPanelProps extends Omit<React.ComponentProps<typeof Card>, 'onClick' | 'type'> {
  title: string
  description: string
  buttonLabel: React.ComponentProps<typeof Button>['children']
  onClick: React.ComponentProps<typeof Button>['onClick']
  loading: React.ComponentProps<typeof Button>['loading']
  icon?: React.ComponentProps<typeof Button>['icon']
  type?: React.ComponentProps<typeof Button>['type']
}

export const ActionPanel = React.forwardRef<HTMLDivElement, ActionPanelProps>(
  ({ title, description, buttonLabel, onClick, loading, icon, type, ...props }, ref) => {
    return (
      <Card
        className="bg-surface-100 first:rounded-b-none last:rounded-t-none shadow-none only:rounded-lg"
        ref={ref}
        {...props}
      >
        <CardHeader className="lg:flex-row lg:items-center gap-3 lg:gap-10 py-4 border-0">
          <div className="flex flex-col gap-0 flex-1 grow">
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="max-w-xl">{description}</CardDescription>
          </div>
          <div className="flex lg:justify-end flex-">
            <Button onClick={onClick} loading={loading} icon={icon} type={type}>
              {buttonLabel}
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }
)

ActionPanel.displayName = 'ActionPanel'
