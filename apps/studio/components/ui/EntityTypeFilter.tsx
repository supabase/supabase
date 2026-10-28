import { FilterIcon } from 'lucide-react'
import { Button, Checkbox, Label, Popover, PopoverContent, PopoverTrigger } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

export const ALL_ENTITY_TYPES: ENTITY_TYPE[] = Object.values(ENTITY_TYPE)

/** Picks which kinds of database objects (tables, views, …) a list of entities shows. */
export const EntityTypeFilter = ({
  visibleTypes,
  onVisibleTypesChange,
}: {
  visibleTypes: readonly ENTITY_TYPE[]
  onVisibleTypesChange: (types: ENTITY_TYPE[]) => void
}) => {
  const hasFiltersApplied = visibleTypes.length !== ALL_ENTITY_TYPES.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ButtonTooltip
          className="h-[32px] md:h-[28px] px-1.5"
          variant={hasFiltersApplied ? 'default' : 'dashed'}
          icon={<FilterIcon />}
          aria-label="Filter"
          tooltip={{ content: { side: 'bottom', text: 'Filter' } }}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-60" side="bottom" align="center">
        <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
          <p className="text-xs">Filter entity types</p>
          <div className="flex flex-col">
            {Object.entries(ENTITY_TYPE).map(([key, value]) => (
              <div key={key} className="group flex items-center justify-between py-0.5">
                <div className="flex items-center gap-x-2">
                  <Checkbox
                    id={key}
                    name={key}
                    checked={visibleTypes.includes(value)}
                    onCheckedChange={() => {
                      if (visibleTypes.includes(value)) {
                        onVisibleTypesChange(visibleTypes.filter((type) => type !== value))
                      } else {
                        onVisibleTypesChange([...visibleTypes, value])
                      }
                    }}
                  />
                  <Label htmlFor={key} className="capitalize text-xs">
                    {key.toLowerCase().replace('_', ' ')}
                  </Label>
                </div>
                <Button
                  size="tiny"
                  onClick={() => onVisibleTypesChange([value])}
                  className="transition opacity-0 group-hover:opacity-100 h-auto px-1 py-0.5"
                >
                  Select only
                </Button>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
