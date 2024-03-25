import { Search } from 'lucide-react'
import { useState } from 'react'
import { Badge, HoverCard, HoverCardContent, HoverCardTrigger, Input, cn } from 'ui'

import { Markdown } from 'components/interfaces/Markdown'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import CardButton from 'components/ui/CardButton'
import CopyButton from 'components/ui/CopyButton'
import NoSearchResults from 'components/ui/NoSearchResults'
import { getGeneralPolicyTemplates } from '../PolicyEditorModal/PolicyEditorModal.constants'

interface PolicyTemplatesProps {
  selectedTemplate?: string
  onSelectTemplate: (template: { id: string; content: string }) => void
}

export const PolicyTemplates = ({ selectedTemplate, onSelectTemplate }: PolicyTemplatesProps) => {
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
              <HoverCardTrigger>
                <CardButton
                  title={template.name}
                  titleClass="text-sm"
                  className={cn(
                    'transition',
                    template.id === selectedTemplate
                      ? '!border-stronger bg-surface-200 hover:!border-stronger'
                      : ''
                  )}
                  key={template.id}
                  onClick={() => onSelectTemplate({ id: template.id, content: template.statement })}
                  hideChevron
                  fixedHeight={false}
                  icon={
                    <div className="min-w-16">
                      <Badge
                        className="!rounded font-mono"
                        variant={
                          template.command === 'ALL'
                            ? 'default'
                            : template.command === 'SELECT'
                              ? 'brand'
                              : template.command === 'UPDATE'
                                ? 'default'
                                : template.command === 'DELETE'
                                  ? 'destructive'
                                  : 'warning'
                        }
                      >
                        {template.command}
                      </Badge>
                    </div>
                  }
                >
                  <Markdown content={template.description} className="[&>p]:m-0 space-y-2" />
                </CardButton>
              </HoverCardTrigger>
              <HoverCardContent
                hideWhenDetached
                side="left"
                align="center"
                className="w-96 flex"
                animate="slide-in"
              >
                <SimpleCodeBlock
                  showCopy={false}
                  className="sql"
                  parentClassName="!p-0 [&>div>span]:text-xs"
                >
                  {template.statement}
                </SimpleCodeBlock>
                <CopyButton
                  iconOnly
                  type="default"
                  className="px-1 absolute top-1.5 right-1.5"
                  text={template.statement}
                />
              </HoverCardContent>
            </HoverCard>
          )
        })}
      </div>
    </div>
  )
}
