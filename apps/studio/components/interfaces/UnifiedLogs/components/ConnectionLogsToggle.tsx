import { useQueryStates } from 'nuqs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Checkbox, Label } from 'ui'

import { SEARCH_PARAMS_PARSER } from '../UnifiedLogs.constants'

export const ConnectionLogsToggle = () => {
  const [{ hide_connection_logs }, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  return (
    <Accordion type="multiple" defaultValue={['misc']}>
      <AccordionItem value="misc" className="border-none">
        <div className="flex items-center gap-2 pr-2">
          <AccordionTrigger className="flex-1 px-2 py-0 hover:no-underline data-[state=closed]:text-muted-foreground data-open:text-foreground focus-within:data-closed:text-foreground hover:data-closed:text-foreground">
            <div className="flex items-center gap-2 truncate py-2">
              <p className="text-sm">Misc</p>
            </div>
          </AccordionTrigger>
        </div>
        <AccordionContent>
          <div className="p-1">
            <div className="rounded-sm border border-border">
              <div className="group relative flex items-center space-x-2 px-2 py-2 hover:bg-accent/50">
                <Checkbox
                  id="connection-logs"
                  checked={!hide_connection_logs}
                  onCheckedChange={(checked) => setSearch({ hide_connection_logs: !checked })}
                />
                <Label
                  htmlFor="connection-logs"
                  className="flex w-full cursor-pointer items-center justify-between gap-2 text-[0.8rem] font-normal text-foreground/70 group-hover:text-accent-foreground"
                >
                  Connection logs
                </Label>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
