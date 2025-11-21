import { ComponentProps, forwardRef } from 'react'
import { Button, Card, CardDescription, CardHeader, CardTitle } from 'ui'

interface ActionPanelProps extends Omit<React.ComponentProps<typeof Card>, 'onClick' | 'type'> {
  title: string
  description: string
  buttonLabel: ComponentProps<typeof Button>['children']
  onClick: ComponentProps<typeof Button>['onClick']
  loading: ComponentProps<typeof Button>['loading']
  icon?: ComponentProps<typeof Button>['icon']
  type?: ComponentProps<typeof Button>['type']
}

export const ActionPanel = forwardRef<HTMLDivElement, ActionPanelProps>(
  ({ title, description, buttonLabel, onClick, loading, icon, type, ...props }, ref) => {
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
