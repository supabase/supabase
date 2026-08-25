import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import Link from 'next/link'
import { Badge, Button } from 'ui'

import { WorkersLogo } from './WorkersLogo'
import { WorkersVisual } from './WorkersVisual'

export function Hero() {
  return (
    <SectionContainerWithCn spacing="sections">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 -mt-8">
          <Badge variant="warning">Private Alpha</Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <h1 className="text-foreground text-3xl sm:text-5xl sm:leading-none">
            <span className="flex items-center gap-3">Runtimes for agents</span>
            <span className="text-foreground-lighter block">and production backends</span>
          </h1>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Run isolated sandboxes for AI agents and always-on backend services on a fully managed
            compute with built-in security and observability.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 lg:mt-4">
          <Button asChild size="medium">
            <Link href="#waitlist">Join the waitlist</Link>
          </Button>
        </div>
      </div>
      <WorkersVisual />
    </SectionContainerWithCn>
  )
}
