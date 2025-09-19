import { ApiDocs, Realtime, Storage, User, Logs } from 'icons'
import { cn } from 'ui'
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

const templateDescriptions: Record<string, string> = {
  'Social Media': 'User profiles, posts, comments, and social interactions',
  'E-commerce': 'Products, orders, inventory, and customer management',
  Blog: 'Articles, categories, authors, and content management',
  'Todo List': 'Tasks, projects, assignments, and productivity tracking',
  Analytics: 'Events, sessions, metrics, and data tracking',
}

export const TemplateSelector = ({ onSelect }: TemplateSelectorProps) => {
  const handleTemplateSelect = (template: TableTemplate) => {
    onSelect(template.tables, template.name)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {APP_TEMPLATES.map((template) => {
          const IconComponent = iconComponents[template.iconName as keyof typeof iconComponents]
          const description = templateDescriptions[template.name] || ''

          return (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={cn(
                'group relative p-4 rounded-lg border bg-surface-100 text-left transition-all',
                'border-default hover:border-foreground/20 hover:shadow-md',
                'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-md bg-surface-200 group-hover:bg-brand/10 transition-colors">
                  <IconComponent className="w-5 h-5 text-foreground-light group-hover:text-brand transition-colors" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-medium text-foreground">{template.name}</h3>
                  <p className="text-xs text-foreground-light line-clamp-2">{description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
