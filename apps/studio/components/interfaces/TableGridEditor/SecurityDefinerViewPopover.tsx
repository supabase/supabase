import { useParams } from 'common'
import { Unlock } from 'lucide-react'
import Link from 'next/link'
import { Button, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

import { type Lint } from '@/data/lint/lint-query'

export const SecurityDefinerViewPopover = ({
  lint,
  onAutofix,
}: {
  lint: Lint | null
  onAutofix?: () => void
}) => {
  const { ref } = useParams()

  return (
    <Popover_Shadcn_ modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="warning" icon={<Unlock strokeWidth={1.5} />}>
          Security Definer view
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="min-w-[395px] text-sm" align="end">
        <h4 className="flex items-center gap-2">
          <Unlock size={14} /> Secure your view
        </h4>
        <div className="grid gap-2 mt-2 text-foreground-light text-sm">
          <p>
            This view is defined with the Security Definer property, giving it permissions of the
            view's creator (Postgres), rather than the permissions of the querying user.
          </p>

          <p>Since this view is in the public schema, it is accessible via your project's APIs.</p>

          <div className="mt-2 flex items-center gap-2">
            {!!onAutofix && (
              <Button type="secondary" onClick={onAutofix}>
                Autofix
              </Button>
            )}
            <Button type="default" asChild>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={`/project/${ref}/advisors/security?preset=${lint?.level}&id=${lint?.cache_key}`}
              >
                Learn more
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
