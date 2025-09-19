import { motion } from 'framer-motion'
import { ApiDocs, Realtime, Storage, User, Logs } from 'icons'
import { cn } from 'ui'
import { APP_TEMPLATES } from '../legacy/constants'
import type { TableSuggestion } from '../legacy/types'
import { itemVariants } from './animations'

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

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">Choose a template to get started</h3>
        <p className="text-sm text-foreground-light">
          Start with pre-built database schemas for common app types. Fully customizable to fit
          your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {APP_TEMPLATES.map((template, index) => {
          const IconComponent = iconComponents[template.iconName as keyof typeof iconComponents]
          const description = templateDescriptions[template.name] || ''

          return (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(template.tables, template.name)}
              className={cn(
                'group relative p-4 rounded-lg border bg-surface-100 text-left transition-all',
                'border-default hover:border-foreground-muted hover:shadow-md',
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
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}