import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn, Button, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Row } from 'ui-patterns'

export type GettingStartedAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: React.ComponentProps<typeof Button>['type']
  icon?: React.ReactNode
}

export type GettingStartedStep = {
  key: string
  status: 'complete' | 'incomplete'
  imageUrl?: string
  imageAlt?: string
  title: string
  description: string
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
        <Button size="small" type="outline">
          Dismiss
        </Button>
      </div>
      <Row columns={[3, 2, 1]} className="items-stretch">
        {steps.map((step) => (
          <Card key={step.key} className="overflow-hidden h-full">
            <CardHeader className={cn('py-3 px-4 border-b', 'bg-surface-100')}>
              <CardTitle
                className={cn(
                  'text-xs font-mono uppercase flex items-center gap-1',
                  step.status === 'complete' ? 'text-brand' : 'text-foreground-light'
                )}
              >
                {step.status === 'complete' && <Check size={14} className="text-brand" />}
                <span>{step.status}</span>
              </CardTitle>
            </CardHeader>
            {step.imageUrl ? (
              <img src={step.imageUrl} alt={step.imageAlt ?? ''} className="w-full object-cover" />
            ) : (
              <div className="w-full h-28 bg-surface-200" />
            )}
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm text-foreground">{step.title}</h4>
                <p className="text-sm text-foreground-light">{step.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {step.actions.map((action, i) => {
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
