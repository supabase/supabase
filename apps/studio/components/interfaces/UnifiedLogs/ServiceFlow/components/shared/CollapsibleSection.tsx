import { Table } from '@tanstack/react-table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'
import {
  Button,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'
import { BlockFieldConfig } from '../../types'
import { BlockField } from './BlockField'

interface CollapsibleSectionProps {
  title: string
  fields: BlockFieldConfig[]
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
  defaultOpen?: boolean
}

const CollapsibleSection = ({
  title,
  fields,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
  defaultOpen = false,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="text"
            size="tiny"
            className="w-full justify-start py-1 px-2 h-auto text-xs font-medium text-foreground-light hover:text-foreground"
          >
            <div className="flex items-center gap-1">
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>{title}</span>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down pt-1">
          {fields.map((field) => (
            <BlockField
              key={field.id}
              config={field}
              data={data}
              enrichedData={enrichedData}
              isLoading={isLoading}
              filterFields={filterFields}
              table={table}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export { CollapsibleSection }
