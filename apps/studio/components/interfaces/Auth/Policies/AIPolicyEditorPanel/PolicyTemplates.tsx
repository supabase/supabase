import { useState } from 'react'
import {
  Badge,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  IconSearch,
  Input,
  ScrollArea,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'

import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import { getGeneralPolicyTemplates } from '../PolicyEditorModal/PolicyEditorModal.constants'
import NoSearchResults from 'components/ui/NoSearchResults'
import { Markdown } from 'components/interfaces/Markdown'
import CopyButton from 'components/ui/CopyButton'
import { Search } from 'lucide-react'

interface PolicyTemplatesProps {
  onSelectTemplate: (template: any) => void
}

export const PolicyTemplates = ({ onSelectTemplate }: PolicyTemplatesProps) => {
  const [search, setSearch] = useState('')
  const templates = getGeneralPolicyTemplates('schema_name', 'table_name')
  const filteredTemplates =
    search.length > 0
      ? templates.filter(
          (template) =>
            template.name.toLowerCase().includes(search.toLowerCase()) ||
            template.command.toLowerCase().includes(search.toLowerCase())
        )
      : templates

  return (
    <div className="h-full px-content py-content flex flex-col gap-3">
      <label className="sr-only" htmlFor="template-search">
        Search templates
      </label>
      <Input
        size="small"
        id="template-search"
        icon={<Search size={16} className="text-foreground-muted" />}
        placeholder="Search templates"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {search.length > 0 && filteredTemplates.length === 0 && (
        <NoSearchResults searchString={search} className="min-w-full" />
      )}

      <div className="flex flex-col gap-1.5">
        {filteredTemplates.map((template) => {
          return (
            <HoverCard key={template.id} openDelay={100} closeDelay={0}>
              <HoverCardTrigger asChild>
                <button
                  key={template.id}
                  className={cn(
                    'text-left',
                    'flex flex-row',
                    'rounded-panel px-4 py-3 gap-x-4 cursor-pointer transition',
                    'border bg-surface-100 hover:border-strong'
                  )}
                  onClick={() => onSelectTemplate(template.statement)}
                >
                  <div className="min-w-16">
                    <Badge className="!rounded font-mono" color="scale">
                      {template.command}
                    </Badge>
                  </div>
                  <div className="text-sm mt-[3px] flex flex-col gap-y-1">
                    <p>{template.name}</p>
                    <Markdown content={template.description} className="[&>p]:m-0 space-y-2" />
                    {/* <p>{template.description}</p> */}
                  </div>
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                hideWhenDetached
                side="left"
                align="center"
                className="w-96 flex flex-col gap-y-2"
              >
                {/* <p className="text-xs">Policy SQL preview:</p> */}
                {/* <div className="bg-surface-300 py-2 px-3 rounded relative"> */}
                <SimpleCodeBlock
                  showCopy={false}
                  className="sql"
                  parentClassName="!p-0 [&>div>span]:text-xs [&>div>span]:tracking-tighter"
                >
                  {template.statement}
                </SimpleCodeBlock>
                <CopyButton
                  iconOnly
                  type="default"
                  className="px-1 absolute top-1.5 right-1.5"
                  text={template.statement}
                />
                {/* </div> */}
              </HoverCardContent>
            </HoverCard>
          )
        })}
      </div>
    </div>
  )
}
