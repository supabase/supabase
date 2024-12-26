import { debounce } from 'lodash'
import { Check, Loader2, Search } from 'lucide-react'
import { useCallback, useState } from 'react'

import { useEntityTypesQuery } from 'data/entity-types/entity-types-infinite-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { DropdownScrollArea } from './DropdownScrollArea'

interface EntitiesDropdownMenuProps {
  selectedSchemas: string[]
  selectedEntities: readonly { schema: string; name: string }[]
  onToggleEntity: (value: { schema: string; name: string }) => void
}

export const EntitiesDropdownMenu = ({
  selectedSchemas,
  selectedEntities,
  onToggleEntity,
}: EntitiesDropdownMenuProps) => {
  const project = useSelectedProject()
  const [search, setSearch] = useState('')

  // [Joshen] Not gonna do infinite loading here, but rather just try to load sufficient tables
  // I reckon users will opt to just search if there's many tables here given the small real estate
  const {
    data: entitiesData,
    error,
    isLoading,
    isFetching,
    isError,
  } = useEntityTypesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schemas: selectedSchemas,
    limit: 100,
    search: search.length === 0 ? undefined : search,
  })
  const entities = (
    entitiesData?.pages[0].data.entities ? [...entitiesData?.pages[0].data.entities] : []
  ).sort((a, b) => (a.name > b.name ? 0 : -1))

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchInputHandler = useCallback(debounce(setSearch, 1000), [])

  if (isError) {
    return (
      <Admonition
        type="default"
        className="m-0 rounded-none border-0 [&>h5]:text-xs [&>div]:text-xs"
        showIcon={false}
        title="Failed to retrieve tables"
        description={`Error: ${(error as any)?.message ?? 'Unknown'}`}
      />
    )
  }

  return (
    <Command_Shadcn_>
      <CommandList_Shadcn_>
        {/* Separate input for async searching */}
        <Input
          autoFocus
          placeholder="Find table..."
          icon={<Search size={14} />}
          className="text-xs outline-none rounded-b-none border-0 border-b pl-9 pr-7"
          onChange={(e) => searchInputHandler(e.target.value)}
          actions={
            (isLoading || isFetching) && (
              <Loader2 key="hint" size={14} className="mr-1 animate-spin" />
            )
          }
        />
        <CommandEmpty_Shadcn_>No tables found</CommandEmpty_Shadcn_>
        <CommandGroup_Shadcn_>
          <DropdownScrollArea
            id="tables-scroll"
            className={(entities || []).length > 7 ? 'h-[210px]' : ''}
          >
            {entities?.map((entity) => (
              <CommandItem_Shadcn_
                key={entity.id}
                value={entity.id.toString()}
                className="justify-between"
                onSelect={() => onToggleEntity({ schema: entity.schema, name: entity.name })}
                onClick={() => onToggleEntity({ schema: entity.schema, name: entity.name })}
              >
                <span className="flex gap-x-1">
                  <span className="text-foreground-lighter">{entity.schema}</span>
                  <span>{entity.name}</span>
                </span>
                {selectedEntities.find(
                  (x) => x.name === entity.name && x.schema === entity.schema
                ) && <Check className="text-brand" strokeWidth={2} size={16} />}
              </CommandItem_Shadcn_>
            ))}
          </DropdownScrollArea>
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  )
}
