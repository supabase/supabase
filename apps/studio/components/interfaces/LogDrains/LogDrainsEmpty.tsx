import { Button, Card, cn } from 'ui'
import Link from 'next/link'
import { AnimatedLogos } from './AnimatedLogos'
import Image from 'next/image'
import { BASE_PATH } from 'lib/constants'
import { UpgradePlanButton } from 'components/ui/UpgradePlanButton'

export const LogDrainsEmpty = () => {
  const items = [
    {
      step: 1,
      title: 'Log drain pricing',
      description:
        'Log Drains are available as a project Add-On for all Team and Enterprise users. Each Log Drain costs $60 per month.',
      label: 'See our pricing',
      link: 'https://supabase.com/docs/guides/platform/manage-your-usage/log-drains',
    },
    {
      step: 2,
      title: 'Connect to your drain',
      description:
        'We offer support for multiple destinations including HTTPS, Datadog, Loki and Sentry.',
      label: 'Read our documentation',
      link: 'https://supabase.com/docs/guides/telemetry/log-drains',
    },
  ]

  return (
    <div className="flex grow h-full pt-16">
      <div className="flex grow items-center justify-center p-12 @container">
        <div className="w-full max-w-4xl flex flex-col items-center gap-0">
          <div className="text-center mb-12">
            <AnimatedLogos />
            <h2 className="heading-section mb-1">Capture your logs, your way</h2>
            <p className="text-foreground-light mb-6">
              Upgrade to a Team or Enterprise Plan to send your logs to your preferred platform
            </p>
            <UpgradePlanButton type="primary" plan="Team" source="log-drains-empty-state">
              Upgrade plan
            </UpgradePlanButton>
          </div>
          <Card className="grid grid-cols-1 @xl:grid-cols-2 bg divide-x mb-8">
            {items.map((item, i) => (
              <div className="flex flex-col h-full p-6" key={i}>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={cn(
                      'text-xs shrink-0 font-mono text-foreground-light w-7 h-7 bg border flex items-center justify-center rounded-md'
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
          <div className="flex items-center justify-center gap-1.5 text-sm">
            <Image
              className={cn('dark:invert text-muted')}
              src={`${BASE_PATH}/img/icons/github-icon.svg`}
              width={16}
              height={16}
              alt="GitHub icon"
            />
            <p className="text-foreground-light">
              Don't see your preferred drain?{' '}
              <Link
                href="https://github.com/orgs/supabase/discussions/28324?sort=top"
                className="text-foreground underline underline-offset-2 decoration-foreground-muted hover:decoration-foreground transition-all"
                target="_blank"
              >
                Vote here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
