import Link from 'next/link'
import { Button, Card, cn } from 'ui'

import { AnimatedLogos } from './AnimatedLogos'
import { VoteLink } from './VoteLink'
import { DOCS_URL } from '@/lib/constants'

export const LogDrainsEmpty = () => {
  // [console fork] Self-host: no plan/pricing for log drains.
  const items = [
    {
      step: 1,
      title: 'Connect to your drain',
      description:
        'We offer support for multiple destinations including Datadog, Loki, Sentry or a custom endpoint.',
      label: 'Read our documentation',
      link: `${DOCS_URL}/guides/telemetry/log-drains`,
    },
  ]

  return (
    <div className="flex grow h-full">
      <div className="flex grow items-center justify-center p-12 @container">
        <div className="w-full max-w-4xl flex flex-col items-center gap-0">
          <div className="text-center mb-12">
            <AnimatedLogos />
            <h2 className="heading-section mb-1">Capture your logs, your way</h2>
            <p className="text-foreground-light mb-6">
              Send your project logs to your preferred platform
            </p>
          </div>
          <Card className={cn('grid grid-cols-1 bg divide-x mb-8')}>
            {items.map((item, i) => (
              <div className="flex flex-col h-full p-6" key={i}>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md',
                      'hidden'
                    )}
                  >
                    {item.step}
                  </span>
                  <h3 className="heading-default">{item.title}</h3>
                </div>
                <p className="text-foreground-light text-sm mb-4 flex-1">{item.description}</p>
                <Button type="default" className="w-full" asChild>
                  <Link href={item.link} target="_blank">
                    {item.label}
                  </Link>
                </Button>
              </div>
            ))}
          </Card>
          <VoteLink />
        </div>
      </div>
    </div>
  )
}
