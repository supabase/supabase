import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Button } from 'ui'

import { StartYourProjectButton } from '@/components/StartYourProjectButton'

export function Hero() {
  return (
    <SectionContainerWithCn>
      <div className="flex flex-col gap-6 lg:gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <h1 className="text-foreground text-3xl sm:text-5xl sm:leading-none">
            <span className="block">Postgres</span>
            <span className="text-foreground-lighter block">without the hassle</span>
          </h1>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Every Supabase project is a dedicated Postgres database. Use it on its own, or with the
            rest of the Supabase platform. 100% portable with no vendor lock-in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StartYourProjectButton />
          <Button asChild size="medium">
            <a href="/docs/guides/database/overview">Documentation</a>
          </Button>
        </div>
      </div>
    </SectionContainerWithCn>
  )
}
