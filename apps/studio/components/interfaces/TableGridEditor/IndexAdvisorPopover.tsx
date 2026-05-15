import { Lightbulb } from 'lucide-react'
import { Button, Popover, PopoverContent, PopoverTrigger } from 'ui'

import { EnableIndexAdvisorButton } from '../QueryPerformance/IndexAdvisor/EnableIndexAdvisorButton'

export const IndexAdvisorPopover = () => {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button type="default" icon={<Lightbulb strokeWidth={1.5} />}>
          Index Advisor
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="end">
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
      </PopoverContent>
    </Popover>
  )
}
