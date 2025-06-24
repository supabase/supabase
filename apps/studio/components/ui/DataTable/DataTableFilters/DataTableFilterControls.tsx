import {
  Accordion_Shadcn_ as Accordion,
  AccordionContent_Shadcn_ as AccordionContent,
  AccordionItem_Shadcn_ as AccordionItem,
  AccordionTrigger_Shadcn_ as AccordionTrigger,
} from 'ui'

import { DataTableFilterCheckbox } from './DataTableFilterCheckbox'
import { DataTableFilterInput } from './DataTableFilterInput'
import { DataTableFilterResetButton } from './DataTableFilterResetButton'
import { DataTableFilterSlider } from './DataTableFilterSlider'
import { DataTableFilterTimerange } from './DataTableFilterTimerange'

import { useDataTable } from '../providers/DataTableProvider'

// FIXME: use @container (especially for the slider element) to restructure elements

// TODO: only pass the columns to generate the filters!
// https://tanstack.com/table/v8/docs/framework/react/examples/filters

export function DataTableFilterControls() {
  const { filterFields } = useDataTable()
  return (
    <Accordion
      type="multiple"
      defaultValue={filterFields
        ?.filter(({ defaultOpen }) => defaultOpen)
        ?.map(({ value }) => value as string)}
    >
      {filterFields?.map((field) => {
        const value = field.value as string
        return (
          <AccordionItem key={value} value={value} className="border-none">
            <AccordionTrigger className="w-full px-2 py-0 hover:no-underline data-[state=closed]:text-muted-foreground data-[state=open]:text-foreground focus-within:data-[state=closed]:text-foreground hover:data-[state=closed]:text-foreground">
              <div className="flex w-full items-center justify-between gap-2 truncate py-2 pr-2">
                <div className="flex items-center gap-2 truncate">
                  <p className="text-sm font-medium">{field.label}</p>
                  {value !== field.label.toLowerCase() && !field.commandDisabled ? (
                    <p className="mt-px truncate font-mono text-[10px] text-muted-foreground">
                      {value}
                    </p>
                  ) : null}
                </div>
                <DataTableFilterResetButton {...field} />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* REMINDER: avoid the focus state to be cut due to overflow-hidden */}
              {/* REMINDER: need to move within here because of accordion height animation */}
              <div className="p-1">
                {(() => {
                  switch (field.type) {
                    case 'checkbox': {
                      return <DataTableFilterCheckbox {...field} />
                    }
                    case 'slider': {
                      return <DataTableFilterSlider {...field} />
                    }
                    case 'input': {
                      return <DataTableFilterInput {...field} />
                    }
                    case 'timerange': {
                      return <DataTableFilterTimerange {...field} />
                    }
                  }
                })()}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
