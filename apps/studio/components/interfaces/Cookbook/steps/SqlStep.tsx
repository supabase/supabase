import { useState } from 'react'
import { QueryBlock } from 'components/ui/QueryBlock/QueryBlock'
import { ConfirmFooter } from 'components/ui/AIAssistantPanel/ConfirmFooter'
import { executeSql } from 'data/sql/execute-sql-query'
import { parseTemplateVariables } from 'lib/cookbook/template-parser'
import type { SqlStep as SqlStepType, RecipeContext } from 'types/cookbook'

interface SqlStepProps {
  step: SqlStepType
  context: RecipeContext
  projectRef: string
  connectionString?: string | null
  onComplete: (outputs?: Record<string, any>) => void
  isActive: boolean
  isCompleted: boolean
  isDisabled: boolean
}

export function SqlStep({
  step,
  context,
  projectRef,
  connectionString,
  onComplete,
  isActive,
  isCompleted,
  isDisabled,
}: SqlStepProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<any[]>()
  const [errorText, setErrorText] = useState<string>()

  // Parse SQL with context variables
  const parsedSql = parseTemplateVariables(step.run.content, context)

  console.log('parsedSql', context)

  const handleExecute = async () => {
    setIsExecuting(true)
    setErrorText(undefined)

    try {
      const { result } = await executeSql({
        projectRef,
        connectionString,
        sql: parsedSql,
      })

      setResults(Array.isArray(result) ? result : [])

      // Parse outputs if defined
      let outputs: Record<string, any> | undefined
      if (step.output) {
        outputs = {}
        Object.entries(step.output).forEach(([key, template]) => {
          outputs![key] = parseTemplateVariables(template, { ...context, result })
        })
      }

      // Auto-advance after successful execution
      setTimeout(() => {
        onComplete(outputs)
      }, 1000)
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to execute SQL')
    } finally {
      setIsExecuting(false)
    }
  }

  const showConfirmFooter = isActive && !isCompleted && results === undefined

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-medium mb-1">{step.title}</h3>
        <p className="text-sm text-foreground-light">{step.description}</p>
      </div>

      <div className="display-block w-auto overflow-x-hidden">
        <div className="relative z-10">
          <QueryBlock
            label="SQL Query"
            sql={parsedSql}
            results={results}
            errorText={errorText}
            isExecuting={isExecuting}
            disabled={isDisabled || isCompleted || showConfirmFooter}
            onExecute={handleExecute}
          />
        </div>
        {showConfirmFooter && (
          <div className="mx-4">
            <ConfirmFooter
              message="Ready to execute this SQL query?"
              cancelLabel="Skip"
              confirmLabel="Run Query"
              isLoading={isExecuting}
              onCancel={() => {
                // Skip - do nothing, user can come back later
              }}
              onConfirm={handleExecute}
            />
          </div>
        )}
      </div>
    </div>
  )
}
