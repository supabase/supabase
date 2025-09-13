import { ApiDocs, Database, Realtime, Reports, Storage, User } from 'icons'
import { Card, CardContent, CardDescription, CardTitle } from 'ui'
import { TABLE_TEMPLATES, TableTemplate } from './constants'
import type { TableSuggestion } from './types'

interface TemplateSelectorProps {
  onSelect: (tables: TableSuggestion[]) => void
}

const iconComponents = {
  User,
  ApiDocs,
  Storage,
  Reports,
  Realtime,
} as const

export const TemplateSelector = ({ onSelect }: TemplateSelectorProps) => {
  const handleTemplateSelect = (template: TableTemplate) => {
    // Simply pass the pre-defined tables from the template
    onSelect(template.tables)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
            Click to create your first table
          </h3>
          <CardDescription>
            Pick from common database patterns to get started quickly
          </CardDescription>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {TABLE_TEMPLATES.map((template) => {
          const IconComponent = iconComponents[template.iconName as keyof typeof iconComponents]

          return (
            <Card
              key={template.id}
              className="cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50 hover:scale-105"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium mb-1">{template.name}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
