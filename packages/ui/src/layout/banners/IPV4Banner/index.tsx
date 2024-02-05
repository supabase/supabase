import { memo } from 'react'
import { IconExternalLink } from '../../../components/Icon/icons/IconExternalLink'
import { Button } from '../../../components/Button'

const index = memo(() => {
  return (
    <div className="relative w-full h-auto min-h-[44px] border-b p-2 flex items-center group justify-center text-foreground bg-surface-100 transition-colors overflow-hidden">
      <div className="relative z-10 flex items-center justify-center">
        <div className="w-full flex gap-4 items-center md:justify-center text-sm">
          <div className="flex gap-2 items-center">
            <p>Prepare for the PgBouncer and IPv4 deprecations on 26th January 2024</p>
          </div>
          <Button asChild type="link" iconRight={<IconExternalLink className="hidden sm:block" />}>
            <a
              href="https://github.com/orgs/supabase/discussions/17817"
              target="_blank"
              rel="noreferrer"
            >
              Learn more
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
})

export default index
