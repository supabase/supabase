import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import Link from 'next/link'
import { Button } from 'ui'

import { Highlights } from './Highlights'

export function Hero() {
  return (
    <SectionContainerWithCn spacing="sections">
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <h1 className="text-foreground text-3xl sm:text-5xl sm:leading-none">
            <span className="block">Edge Functions</span>
            <span className="text-foreground-lighter block">globally in seconds</span>
          </h1>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Author, deploy, and monitor serverless functions distributed globally at the edge, close
            to your users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="medium">
            <Link href="https://supabase.com/dashboard">Start your project</Link>
          </Button>
          <Button asChild size="medium" variant="default">
            <Link href="/docs/guides/functions">Documentation</Link>
          </Button>
        </div>
      </div>
    </SectionContainerWithCn>
  )
}
