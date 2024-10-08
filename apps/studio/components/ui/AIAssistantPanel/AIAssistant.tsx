import { useSchemasQuery } from 'data/database/schemas-query'
import { Check, Plus } from 'lucide-react'
import { useRef, useState } from 'react'

import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import {
  AiIconAnimation,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  SheetHeader,
  SheetSection,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { AssistantChatForm } from 'ui-patterns'

const ASSISTANT_SUPPORT_ENTITIES = [
  { id: 'rls-policies', name: 'RLS Policies' },
  { id: 'functions', name: 'Functions' },
]

interface AIAssistantProps {
  className?: string
  isLoading: boolean
  onSubmit: (value: string) => void
}

// [Joshen] For some reason I'm having issues working with dropdown menu and scroll area

export const AIAssistant = ({ className, isLoading, onSubmit }: AIAssistantProps) => {
  const project = useSelectedProject()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState<string>('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [selectedSchemas, setSelectedSchemas] = useSchemasForAi(project?.ref!)

  const noContextAdded = selectedEntity.length === 0 && selectedSchemas.length === 0

  const { data } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const schemas = (data || []).sort((a, b) => a.name.localeCompare(b.name))

  const toggleSchema = (schema: string) => {
    if (selectedSchemas.includes(schema)) {
      setSelectedSchemas(selectedSchemas.filter((s) => s !== schema))
    } else {
      const newSelectedSchemas = [...selectedSchemas, schema].sort((a, b) => a.localeCompare(b))
      setSelectedSchemas(newSelectedSchemas)
    }
  }

  return (
    <div className={cn('flex flex-col w-1/2', className)}>
      <SheetHeader className="flex items-center gap-x-2 py-3">
        <AiIconAnimation
          allowHoverEffect
          className="[&>div>div]:border-black dark:[&>div>div]:border-white"
        />
        <p>Assistant</p>
      </SheetHeader>
      <SheetSection className="flex-grow flex flex-col items-center justify-center gap-y-2">
        <p className="text-sm text-foreground-light">What would you like to create?</p>
        <div className="w-full border rounded">
          <div className="py-2 px-3 border-b flex gap-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* [Joshen] Having problems using Tooltip here */}
                <Button type="default" icon={<Plus />} className={noContextAdded ? '' : 'px-1.5'}>
                  {noContextAdded && 'Add context'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[350px]">
                <DropdownMenuLabel>
                  Improve the output quality of the assistant by giving it context about what you
                  need help with
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="flex flex-col gap-y-1">
                      <p>Database Entity</p>
                      <p className="text-foreground-lighter">
                        Inform about what you're working with
                      </p>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={selectedEntity}
                      onValueChange={setSelectedEntity}
                    >
                      {ASSISTANT_SUPPORT_ENTITIES.map((x) => (
                        <DropdownMenuRadioItem key={x.id} value={x.id}>
                          {x.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="flex flex-col gap-y-1">
                      <p>Schemas</p>
                      <p className="text-foreground-lighter">
                        Attach definitions of all tables in the selected schemas
                      </p>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0">
                    {/* [Joshen] I'm having issues using scroll area within the DropdownMenuSubContent */}
                    {/* <Command_Shadcn_>
                      <CommandInput_Shadcn_ placeholder="Find schema..." />
                      <CommandList_Shadcn_>
                        <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                        <CommandGroup_Shadcn_>
                          <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                            {schemas?.map((schema) => (
                              <CommandItem_Shadcn_
                                key={schema.id}
                                className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                                onSelect={() => toggleSchema(schema.name)}
                                onClick={() => toggleSchema(schema.name)}
                              >
                                <span>{schema.name}</span>
                                {selectedSchemas.includes(schema.name) && (
                                  <Check className="text-brand" strokeWidth={2} size={16} />
                                )}
                              </CommandItem_Shadcn_>
                            ))}
                          </ScrollArea>
                        </CommandGroup_Shadcn_>
                      </CommandList_Shadcn_>
                    </Command_Shadcn_> */}
                    {schemas.map((schema) => (
                      <DropdownMenuItem
                        key={schema.id}
                        className="w-full flex items-center justify-between w-40"
                        onClick={() => toggleSchema(schema.name)}
                      >
                        {schema.name}
                        {selectedSchemas.includes(schema.name) && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            {!!selectedEntity && (
              <div className="border rounded px-2 flex items-center gap-x-1">
                <span className="text-foreground-lighter text-xs">Entity</span>
                <span className="text-xs">
                  {ASSISTANT_SUPPORT_ENTITIES.find((x) => x.id === selectedEntity)?.name}
                </span>
              </div>
            )}

            {selectedSchemas.length > 0 && (
              <div className="border rounded px-2 flex items-center gap-x-1">
                <span className="text-foreground-lighter text-xs">Schemas</span>
                <span className="text-xs">{selectedSchemas.join(', ')}</span>
              </div>
            )}
          </div>
          <AssistantChatForm
            textAreaRef={inputRef}
            className={cn('[&>textarea]:rounded-none [&>textarea]:border-0')}
            loading={isLoading}
            disabled={isLoading}
            placeholder="Some placeholder here"
            value={value}
            onValueChange={(e) => setValue(e.target.value)}
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit(value)
            }}
          />
        </div>
      </SheetSection>
    </div>
  )
}
