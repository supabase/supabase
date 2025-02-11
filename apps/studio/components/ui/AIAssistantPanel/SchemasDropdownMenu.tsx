import {
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
} from 'ui'
import { DropdownScrollArea } from './DropdownScrollArea'
import { Check } from 'lucide-react'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

interface SchemasDropdownMenuProps {
  selectedSchemas: string[]
  onToggleSchema: (schema: string) => void
}

export const SchemasDropdownMenu = ({
  selectedSchemas,
  onToggleSchema,
}: SchemasDropdownMenuProps) => {
  const project = useSelectedProject()

  const { data: schemaDatas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const schemas = (schemaDatas || []).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Command_Shadcn_>
      <CommandInput_Shadcn_ autoFocus placeholder="Find schema..." />
      <CommandList_Shadcn_>
        <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
        <CommandGroup_Shadcn_>
          <DropdownScrollArea
            id="schema-scroll"
            className={cn((schemas || []).length > 7 ? 'h-[210px]' : '')}
          >
            {schemas?.map((schema) => (
              <CommandItem_Shadcn_
                key={schema.id}
                value={schema.id.toString()}
                className="justify-between"
                onSelect={() => onToggleSchema(schema.name)}
                onClick={() => onToggleSchema(schema.name)}
              >
                {schema.name}
                {selectedSchemas.includes(schema.name) && (
                  <Check className="text-brand" strokeWidth={2} size={16} />
                )}
              </CommandItem_Shadcn_>
            ))}
          </DropdownScrollArea>
        </CommandGroup_Shadcn_>
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  )
}
