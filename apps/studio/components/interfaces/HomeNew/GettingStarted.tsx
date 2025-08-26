import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn, Button, Card, CardContent, CardHeader, CardTitle, Badge } from 'ui'
import { Row } from 'ui-patterns'

export type GettingStartedAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: React.ComponentProps<typeof Button>['type']
  icon?: React.ReactNode
  component?: React.ReactNode
}

export type GettingStartedStep = {
  key: string
  status: 'complete' | 'incomplete'
  icon?: React.ReactNode
  title: string
  description: string
  image?: React.ReactNode
  actions: GettingStartedAction[]
}

export interface GettingStartedProps {
  steps: GettingStartedStep[]
  className?: string
}

export function GettingStarted({ steps, className }: GettingStartedProps) {
  return (
    <section className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="heading-section">Getting started</h3>
        <Button size="tiny" type="outline">
          Dismiss
        </Button>
      </div>
      <Row columns={[3, 2, 1]} className="items-stretch">
        {steps.map((step) => (
          <Card key={step.key} className="overflow-hidden h-full flex flex-col">
            <CardHeader className="flex flex-row space-y-0 justify-between items-center border-b-0">
              <div className="flex flex-row items-center gap-3">
                {step.icon && <div>{step.icon}</div>}
                <CardTitle className="text-foreground-light">{step.title}</CardTitle>
              </div>
              <Badge
                variant={step.status === 'complete' ? 'success' : 'default'}
                className="capitalize"
              >
                {step.status}
              </Badge>
            </CardHeader>
            <CardContent className="p-6 pt-16 flex-1 flex flex-col justify-end">
              {step.image && <div className="w-full">{step.image}</div>}
              <p className="text-base text-foreground">{step.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {step.actions.map((action, i) => {
                  if (action.component) {
                    return <span key={`${step.key}-action-${i}`}>{action.component}</span>
                  }
                  const content = (
                    <Button
                      key={`${step.key}-action-${i}`}
                      type={action.variant ?? 'default'}
                      icon={action.icon}
                    >
                      {action.label}
                    </Button>
                  )
                  if (action.href) {
                    return (
                      <Button
                        asChild
                        key={`${step.key}-action-${i}`}
                        type={action.variant ?? 'default'}
                        icon={action.icon}
                      >
                        <Link href={action.href}>{action.label}</Link>
                      </Button>
                    )
                  }
                  return (
                    <span key={`${step.key}-action-${i}`} onClick={action.onClick}>
                      {content}
                    </span>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </Row>
    </section>
  )
}

export default GettingStarted
