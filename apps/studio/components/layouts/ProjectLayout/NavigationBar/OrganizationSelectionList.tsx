import { Check } from 'lucide-react'
import { useState } from 'react'
import {
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export function OrganizationSelectionList({
  organizations,
  isLoading,
  selectedSlug,
  onSelect,
}: {
  organizations: Array<{ slug: string; name: string }>
  isLoading: boolean
  selectedSlug?: string
  onSelect: (slug: string) => void
}) {
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim().toLowerCase()

  const filteredOrganizations = organizations.filter((organization) => {
    if (normalizedSearch.length === 0) return true

    return (
      organization.name.toLowerCase().includes(normalizedSearch) ||
      organization.slug.toLowerCase().includes(normalizedSearch)
    )
  })

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <Command_Shadcn_ shouldFilter={false} className="min-h-0 flex-1 rounded-none border-0">
        <CommandInput_Shadcn_
          value={search}
          onValueChange={setSearch}
          placeholder="Find organization..."
          showResetIcon
          handleReset={() => setSearch('')}
        />
        <CommandList_Shadcn_ className="max-h-none flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2">
              <ShimmeringLoader className="py-2" />
              <ShimmeringLoader className="py-2 w-4/5" />
            </div>
          ) : (
            <>
              <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {filteredOrganizations.map((organization) => {
                  const isSelected = organization.slug === selectedSlug

                  return (
                    <CommandItem_Shadcn_
                      key={organization.slug}
                      value={`${organization.name.replaceAll('"', '')} - ${organization.slug}`}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer',
                        isSelected && 'bg-surface-200'
                      )}
                      onSelect={() => onSelect(organization.slug)}
                    >
                      <span className="truncate">{organization.name}</span>
                      {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                    </CommandItem_Shadcn_>
                  )
                })}
              </CommandGroup_Shadcn_>
            </>
          )}
        </CommandList_Shadcn_>
      </Command_Shadcn_>
    </div>
  )
}
