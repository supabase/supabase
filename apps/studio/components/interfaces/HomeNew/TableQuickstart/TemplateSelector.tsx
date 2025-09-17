import { ApiDocs, Realtime, Storage, User, Logs } from 'icons'
import { Button } from 'ui'
import { APP_TEMPLATES } from './constants'
import type { TableSuggestion, TableTemplate } from './types'

interface TemplateSelectorProps {
  onSelect: (tables: TableSuggestion[], templateName: string) => void
}

const iconComponents = {
  User,
  ApiDocs,
  Storage,
  Logs,
  Realtime,
} as const

export const TemplateSelector = ({ onSelect }: TemplateSelectorProps) => {
  const handleTemplateSelect = (template: TableTemplate) => {
    onSelect(template.tables, template.name)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {APP_TEMPLATES.map((template) => {
          const IconComponent = iconComponents[template.iconName as keyof typeof iconComponents]

          return (
            <Button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              type="default"
              icon={<IconComponent />}
              className="flex items-center justify-start w-fit"
            >
              {template.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
