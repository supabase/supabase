import { useState } from 'react'
import {
  Badge,
  IconSearch,
  Input,
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
    <div className="flex flex-col gap-y-4 p-4">
      <Input
        size="small"
        icon={<IconSearch />}
        placeholder="Search templates"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="flex flex-col gap-y-2">
        {search.length > 0 && filteredTemplates.length === 0 && (
          <NoSearchResults searchString={search} />
        )}
        {filteredTemplates.map((template) => (
          <Tooltip_Shadcn_ key={template.id} delayDuration={100}>
            <TooltipTrigger_Shadcn_ asChild>
              <div
                className={cn(
                  'grid grid-cols-12 rounded px-4 py-3 gap-x-4 cursor-pointer transition',
                  'border bg-surface-100 hover:border-strong'
                )}
                onClick={() => onSelectTemplate(template.statement)}
              >
                <div className="col-span-2">
                  <Badge className="!rounded" color="scale">
                    {template.command}
                  </Badge>
                </div>
                <div className="col-span-10 text-sm mt-[3px] flex flex-col gap-y-1">
                  <p>{template.name}</p>
                  <Markdown content={template.description} className="[&>p]:m-0 space-y-2" />
                </div>
              </div>
            </TooltipTrigger_Shadcn_>
            <TooltipContent_Shadcn_
              side="left"
              align="start"
              className="w-96 flex flex-col gap-y-2 py-3"
            >
              <p className="text-xs">Policy SQL preview:</p>
              <div className="bg-surface-300 py-2 px-3 rounded relative">
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
              </div>
            </TooltipContent_Shadcn_>
          </Tooltip_Shadcn_>
        ))}
      </div>
    </div>
  )
}
