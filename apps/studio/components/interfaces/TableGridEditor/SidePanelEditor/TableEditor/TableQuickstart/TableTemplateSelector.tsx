import { Columns3 } from 'lucide-react'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { AiIconAnimation, Button, cn } from 'ui'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { tableTemplates } from './templates'
import { QuickstartVariant } from './types'
import { convertTableSuggestionToTableField } from './utils'
import type { TableSuggestion } from './types'
import type { TableField } from '../TableEditor.types'

interface TableTemplateSelectorProps {
  variant: Exclude<QuickstartVariant, QuickstartVariant.CONTROL>
  onSelectTemplate: (tableField: Partial<TableField>) => void
  onDismiss?: () => void
  disabled?: boolean
}

const SUCCESS_MESSAGE_DURATION_MS = 3000

const CONTEXT_PROMPT = `Help me create a table for my Supabase PostgreSQL database. Use these conventions:
- Use snake_case for all names
- Include an id column (uuid type, primary key, default: gen_random_uuid())
- Include created_at and updated_at columns (timestamptz type, default: now())
- Choose appropriate PostgreSQL data types
- Consider nullable, unique, and default constraints

Reference: https://supabase.com/docs/guides/database/tables`

const AI_GREETING = `I'd be happy to help you design a table schema! What kind of application are you building? Tell me a bit about what data you need to store.`

export const TableTemplateSelector = ({
  variant,
  onSelectTemplate,
  onDismiss,
  disabled,
}: TableTemplateSelectorProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TableSuggestion | null>(null)
  const aiSnap = useAiAssistantStateSnapshot()

  const isAssistant = variant === QuickstartVariant.ASSISTANT

  const handleSelectTemplate = useCallback(
    (template: TableSuggestion) => {
      const tableField = convertTableSuggestionToTableField(template)
      onSelectTemplate(tableField)
      setSelectedTemplate(template)
      toast.success(
        `${template.tableName} template applied. You can add or modify the fields below.`,
        {
          duration: SUCCESS_MESSAGE_DURATION_MS,
        }
      )
    },
    [onSelectTemplate]
  )

  const openAiChatWithGreeting = useCallback(
    (name: string, contextPrompt: string, greetingMessage: string) => {
      // Create new chat
      aiSnap.newChat({ name, open: true })

      // Add hidden context message (user role - sets expectations for AI)
      aiSnap.saveMessage({
        id: uuidv4(),
        role: 'user',
        createdAt: new Date(),
        parts: [{ type: 'text', text: contextPrompt }],
      })

      // Add AI greeting (what user sees first)
      aiSnap.saveMessage({
        id: uuidv4(),
        role: 'assistant',
        createdAt: new Date(),
        parts: [{ type: 'text', text: greetingMessage }],
      })
    },
    [aiSnap]
  )

  const categories = useMemo(() => Object.keys(tableTemplates), [])

  useEffect(() => {
    if (!isAssistant && activeCategory === null && categories.length > 0) {
      setActiveCategory(categories[0])
    }
  }, [categories, activeCategory, isAssistant])

  const displayed = useMemo(() => {
    if (isAssistant) return []
    return activeCategory ? tableTemplates[activeCategory] || [] : []
  }, [activeCategory, isAssistant])

  return (
    <div className="rounded-lg border border-default bg-surface-75 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">
            {isAssistant ? 'Design your table with AI' : 'Start faster with a table template'}
          </h3>
          <p className="text-xs text-foreground-lighter mt-1">
            {isAssistant
              ? 'Let AI help you create a table schema for your application.'
              : 'Save time by starting from a ready-made table schema.'}
          </p>
        </div>
        {onDismiss && (
          <Button type="text" size="tiny" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>

      {isAssistant && (
        <div className="space-y-3">
          <button
            onClick={() =>
              openAiChatWithGreeting('Create database table', CONTEXT_PROMPT, AI_GREETING)
            }
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-default w-full',
              'hover:border-foreground-muted hover:bg-surface-100',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
          >
            <AiIconAnimation size={14} />
            <span>Open AI Assistant</span>
          </button>

          <div>
            <div className="text-xs text-foreground-light mb-2">Or try these quick ideas:</div>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: 'Recipe app',
                  greeting: `I'd love to help you create a recipe table! Tell me more about what recipe data you need to store - ingredients, instructions, cooking times, serving sizes?`,
                },
                {
                  label: 'Task manager',
                  greeting: `Let's design a task management table! What features do you need - priorities, due dates, status tracking, assignments?`,
                },
                {
                  label: 'Blog posts',
                  greeting: `I'll help you create a blog posts table! What information do you want to capture - author details, categories, tags, publish dates?`,
                },
              ].map(({ label, greeting }) => (
                <button
                  key={label}
                  onClick={() =>
                    openAiChatWithGreeting(`Create ${label} table`, CONTEXT_PROMPT, greeting)
                  }
                  disabled={disabled}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-default',
                    'hover:border-foreground-muted hover:bg-surface-100',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all'
                  )}
                >
                  <AiIconAnimation size={12} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isAssistant && (
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              disabled={disabled}
              className={cn(
                'px-2 py-1 rounded-md text-xs capitalize border',
                activeCategory === category
                  ? 'border-foreground bg-surface-200'
                  : 'border-default hover:border-foreground-muted hover:bg-surface-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {displayed.length > 0 && (
        <div className="grid gap-2">
          {displayed.map((t) => (
            <button
              key={`${activeCategory}:${t.tableName}`}
              onClick={() => handleSelectTemplate(t)}
              disabled={disabled}
              className={cn(
                'text-left p-3 rounded-md border transition-all w-full',
                selectedTemplate?.tableName === t.tableName
                  ? 'border-foreground bg-surface-200'
                  : 'border-default hover:border-foreground-muted hover:bg-surface-100',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium font-mono">{t.tableName}</div>
                  {t.rationale && (
                    <div className="text-sm text-foreground-light mt-1">{t.rationale}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-foreground-muted ml-3">
                  <Columns3 size={14} aria-hidden="true" />
                  <span>{t.fields.length}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
