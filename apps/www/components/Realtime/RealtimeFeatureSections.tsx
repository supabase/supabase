import Link from 'next/link'
import { Button } from 'ui'

import { BroadcastIllustration } from './illustrations/BroadcastIllustration'
import { DatabaseChangesIllustration } from './illustrations/DatabaseChangesIllustration'
import { PresenceIllustration } from './illustrations/PresenceIllustration'

type Feature = {
  title: string
  description: string
  href: string
  iconSrc: string
  Illustration?: React.ComponentType
}

const FEATURES: Feature[] = [
  {
    title: 'Broadcast',
    description: 'Send any data to any client subscribed to the same channel.',
    href: '/docs/guides/realtime/broadcast',
    iconSrc: '/images/realtime/icons/broadcast.svg',
    Illustration: BroadcastIllustration,
  },
  {
    title: 'Presence',
    description: 'Store and synchronize online user state consistently across clients.',
    href: '/docs/guides/realtime/presence',
    iconSrc: '/images/realtime/icons/presence.svg',
    Illustration: PresenceIllustration,
  },
  {
    title: 'Database changes',
    description:
      'Listen to inserts, updates, and deletes in your Postgres database as they happen.',
    href: '/docs/guides/realtime/postgres-changes',
    iconSrc: '/images/realtime/icons/database-changes.svg',
    Illustration: DatabaseChangesIllustration,
  },
]

function FeatureContent({ feature }: { feature: Feature }) {
  return (
    <div className="prose max-w-none">
      <div className="mb-4 not-prose">
        <img src={feature.iconSrc} alt="" className="h-9 w-9" />
      </div>
      <h3 className="text-foreground">{feature.title}</h3>
      <p className="text-foreground-light">{feature.description}</p>
      <div className="not-prose mt-4">
        <Button asChild type="default">
          <Link href={feature.href}>View docs</Link>
        </Button>
      </div>
    </div>
  )
}

function IllustrationSlot({ Illustration }: { Illustration?: React.ComponentType }) {
  if (Illustration) {
    return <Illustration />
  }

  return (
    <div
      aria-hidden
      className="min-h-52 w-full rounded-lg border border-dashed border-default/60 md:min-h-60"
    />
  )
}

export function RealtimeFeatureSections() {
  return (
    <div className="flex flex-col gap-20 lg:gap-28">
      {FEATURES.map((feature, index) => {
        const contentFirst = index % 2 === 0

        return (
          <div
            key={feature.title}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12"
          >
            <div className={contentFirst ? undefined : 'lg:order-2'}>
              <FeatureContent feature={feature} />
            </div>
            <div className={contentFirst ? undefined : 'lg:order-1'}>
              <IllustrationSlot Illustration={feature.Illustration} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
