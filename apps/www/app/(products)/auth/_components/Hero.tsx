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
              <span className="block">Authentication</span>
            </h1>
            <p className="font-heading font-medium tracking-normal text-foreground-lighter text-3xl sm:text-5xl sm:leading-none">
              built in, not bolted on
            </p>
          </div>
          <p className="text-foreground-lighter text-sm lg:text-base">
            Every Supabase project comes with a complete user management system. Including
            Postgres&apos; Row Level Security for fine-grained access control.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StartYourProjectButton variant="primary" buttonLocation="Product Page Hero - Auth" />
          <Button asChild size="medium">
            <a href="/docs/guides/auth">Documentation</a>
          </Button>
        </div>
      </div>
    </SectionContainerWithCn>
  )
}
