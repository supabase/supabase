import { Lightbulb } from 'lucide-react'
import { Button, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

import { EnableIndexAdvisorButton } from '../QueryPerformance/IndexAdvisor/EnableIndexAdvisorButton'

export const IndexAdvisorPopover = () => {
  return (
    <Popover_Shadcn_ modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" icon={<Lightbulb strokeWidth={1.5} />}>
          Index Advisor
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-80 text-sm" align="end">
        <h4 className="flex items-center gap-2">
          <Lightbulb size={16} /> Index Advisor
        </h4>
        <div className="grid gap-2 mt-4 text-foreground-light text-xs">
          <p>Index Advisor recommends indexes to improve query performance on this table.</p>
          <p>Enable Index Advisor to get recommendations based on your actual query patterns.</p>
          <div className="mt-2">
            <EnableIndexAdvisorButton />
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
