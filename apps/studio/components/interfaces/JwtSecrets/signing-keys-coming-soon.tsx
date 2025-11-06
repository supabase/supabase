import { Github } from 'lucide-react'
import { Button } from 'ui'

import { FeatureBanner } from 'components/ui/FeatureBanner'

export const SigningKeysComingSoonBanner = () => {
  return (
    <FeatureBanner bgAlt className="pb-10">
      <div className="flex flex-col gap-0 z-[2]">
        <p className="text-sm text-foreground">JWT signing keys are coming soon</p>
        <p className="text-sm text-foreground-lighter lg:max-w-sm 2xl:max-w-none">
          We're rolling out JWT signing keys to better support your application needs.
        </p>
        <div className="mt-4">
          <Button type="default" icon={<Github />}>
            <a
              href="https://github.com/orgs/supabase/discussions/29289"
              target="_blank"
              rel="noreferrer"
            >
              Learn more
            </a>
          </Button>
        </div>
      </div>
    </FeatureBanner>
  )
}
