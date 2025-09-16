import Link from 'next/link'
import { cn, Button, Card, CardContent, CardHeader, CardTitle, Badge } from 'ui'
import { Row } from 'ui-patterns'
import { GettingStartedStep } from './GettingStartedSection'

export interface GettingStartedProps {
  steps: GettingStartedStep[]
}

export function GettingStarted({ steps }: GettingStartedProps) {
  return (
    <Row columns={[3, 2, 1]} className="items-stretch">
      {steps.map((step, index) => (
        <Card key={step.key} className={cn('group overflow-hidden h-full flex flex-col')}>
          <CardHeader className="flex flex-row space-y-0 justify-between items-center border-b-0">
            <div className="flex flex-row items-center gap-3">
              {step.icon && <div>{step.icon}</div>}
              <CardTitle className="text-foreground-light">
                {index + 1}. {step.title}
              </CardTitle>
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
            <p className={cn('text-base text-foreground')}>{step.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {step.actions.map((action, i) => {
                if (action.component) {
                  return <div key={`${step.key}-action-${i}`}>{action.component}</div>
                }
                if (action.href) {
                  return (
                    <Button
                      asChild
                      key={`${step.key}-action-${i}`}
                      type={action.variant ?? 'default'}
                      icon={action.icon}
                      className="text-foreground-light hover:text-foreground"
                    >
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  )
                }
                return (
                  <Button
                    key={`${step.key}-action-${i}`}
                    type={action.variant ?? 'default'}
                    icon={action.icon}
                    onClick={action.onClick}
                    className="text-foreground-light hover:text-foreground"
                  >
                    {action.label}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </Row>
  )
}
