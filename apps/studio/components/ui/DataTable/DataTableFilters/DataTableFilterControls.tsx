import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui'

import { DateRangeDisabled } from '../DataTable.types'
import { useDataTable } from '../providers/DataTableProvider'
import { DataTableFilterCheckbox } from './DataTableFilterCheckbox'
import { DataTableFilterCheckboxAsync } from './DataTableFilterCheckboxAsync'
import { DataTableFilterCheckboxLoader } from './DataTableFilterCheckboxLoader'
import { DataTableFilterInput } from './DataTableFilterInput'
import { DataTableFilterResetButton } from './DataTableFilterResetButton'
import { DataTableFilterSlider } from './DataTableFilterSlider'
import { DataTableFilterTimerange } from './DataTableFilterTimerange'

// FIXME: use @container (especially for the slider element) to restructure elements

// TODO: only pass the columns to generate the filters!
// https://tanstack.com/table/v8/docs/framework/react/examples/filters

interface DataTableFilterControls {
  dateRangeDisabled?: DateRangeDisabled
}

export function DataTableFilterControls({
  dateRangeDisabled: _dateRangeDisabled,
}: DataTableFilterControls) {
  const { filterFields, isLoadingCounts } = useDataTable()
  return (
    <Accordion
      type="multiple"
      defaultValue={filterFields
        ?.filter(({ defaultOpen }) => defaultOpen)
        ?.map(({ value }) => value as string)}
    >
      {filterFields
        ?.filter((field) => !field.hidden)
        .map((field) => {
          const value = field.value as string
          return (
            <AccordionItem key={value} value={value} className="border-none">
              <div className="flex items-center gap-2 pr-2">
                <AccordionTrigger className="flex-1 px-2 py-0 hover:no-underline data-[state=closed]:text-muted-foreground data-open:text-foreground focus-within:data-closed:text-foreground hover:data-closed:text-foreground">
                  <div className="flex items-center gap-2 truncate py-2">
                    <p className="text-sm">{field.label}</p>
                  </div>
                </AccordionTrigger>
                <DataTableFilterResetButton {...field} />
              </div>
              <AccordionContent>
                {/* REMINDER: avoid the focus state to be cut due to overflow-hidden */}
                {/* REMINDER: need to move within here because of accordion height animation */}
                <div className="p-1">
                  {(() => {
                    switch (field.type) {
                      case 'checkbox': {
                        // [Joshen] Loader here so that CheckboxAsync can retrieve the data
                        // immediately to be set in its react query state
                        if (field.hasDynamicOptions && isLoadingCounts) {
                          return <DataTableFilterCheckboxLoader />
                        } else if (field.hasAsyncSearch) {
                          return <DataTableFilterCheckboxAsync {...field} />
                        } else {
                          return <DataTableFilterCheckbox {...field} />
                        }
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
