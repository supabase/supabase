import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Button } from 'ui'

import { StartYourProjectButton } from '@/components/StartYourProjectButton'

export function Hero() {
  return (
    <SectionContainerWithCn>
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <div>
            <h1 className="text-foreground text-3xl sm:text-5xl sm:leading-none">
              <span className="block">Realtime</span>
            </h1>
            <p className="font-heading font-medium tracking-normal text-foreground-lighter text-3xl sm:text-5xl sm:leading-none">
              sync in milliseconds
            </p>
          </div>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Sync client state globally over WebSockets. Listen to database changes, store user
            presence, and broadcast messages to all connected clients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StartYourProjectButton variant="primary" buttonLocation="Product Page Hero - Realtime" />
          <Button asChild size="medium">
            <a href="/docs/guides/realtime">Documentation</a>
          </Button>
        </div>
      </div>
    </SectionContainerWithCn>
  )
}
