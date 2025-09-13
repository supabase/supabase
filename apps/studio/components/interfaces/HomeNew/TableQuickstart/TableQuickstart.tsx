import { useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, X } from 'lucide-react'
import { useParams } from 'common'
import { usePHFlag } from 'hooks/ui/useFlag'
import { Card, CardContent, Button } from 'ui'
import { TemplateSelector } from './TemplateSelector'
import { AiPromptInput } from './AiPromptInput'
import type { TableSuggestion } from './types'

export const TableQuickstart = () => {
  const router = useRouter()
  const { ref } = useParams()
  const tableQuickstartVariant = usePHFlag('tableQuickstart') as string
  const [isVisible, setIsVisible] = useState(true)
  const [step, setStep] = useState<1 | 2>(1)
  const [candidates, setCandidates] = useState<TableSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const projectId = ref as string

  // Only render for known treatment variants
  if (tableQuickstartVariant !== 'templates' && tableQuickstartVariant !== 'ai' || !isVisible) {
    return null
  }

  const variant = tableQuickstartVariant as 'ai' | 'templates'

  const onTablesReady = (tables: TableSuggestion[]) => {
    console.log('onTablesReady called with tables:', tables)
    const list = tables.slice(0, 3)
    console.log('Sliced list length:', list.length)
    if (list.length === 0) {
      setError('No tables were generated. Try refining your idea.')
      return
    }
    if (list.length === 1) {
      console.log('Single table, navigating directly')
      handleChooseTable(list[0])
      return
    }
    console.log('Multiple tables, showing step 2')
    setCandidates(list)
    setStep(2)
  }

  const handleChooseTable = async (t: TableSuggestion) => {
    setLoading(true)
    setError(null)
    try {
      // Generate SQL for table creation
      const fieldDefinitions = t.fields.map(field => {
        let def = `${field.name} ${field.type}`
        if (!field.nullable) def += ' NOT NULL'
        if (field.default !== undefined) {
          if (typeof field.default === 'string') {
            def += ` DEFAULT '${field.default}'`
          } else {
            def += ` DEFAULT ${field.default}`
          }
        }
        return def
      }).join(',\n  ')

      const sql = `CREATE TABLE ${t.tableName} (\n  ${fieldDefinitions}\n);`

      // Navigate to editor with SQL
      const encodedSql = encodeURIComponent(sql)
      router.push(`/project/${projectId}/editor?sql=${encodedSql}&new=table`)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create table')
      setLoading(false)
      setStep(2)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const handleBack = () => {
    setStep(1)
    setCandidates([])
    setError(null)
  }

  console.log('Current step:', step, 'Candidates:', candidates.length)

  return (
    <Card className="relative border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <Button
        type="text"
        size="tiny"
        className="absolute top-3 right-3 h-6 w-6 z-10"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="pt-6">
        {/* Step indicator */}
        {step === 2 && (
          <div className="mb-4 flex items-center justify-between">
            <Button
              type="text"
              size="small"
              onClick={handleBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </Button>
            <span className="text-sm text-muted-foreground">Step {step} of 2</span>
          </div>
        )}

        {/* Step 1: Input */}
        {step === 1 && variant === 'ai' && (
          <AiPromptInput onGenerate={onTablesReady} isLoading={loading} />
        )}

        {step === 1 && variant === 'templates' && (
          <TemplateSelector onSelect={onTablesReady} />
        )}

        {/* Step 2: Table selection */}
        {step === 2 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium mb-3">Choose your table</h3>
            <div className="grid gap-3">
              {candidates.map((table) => (
                <button
                  key={table.tableName}
                  className="border rounded-lg p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleChooseTable(table)}
                  disabled={loading}
                >
                  <div className="font-medium mb-2">{table.tableName}</div>
                  {table.rationale && (
                    <p className="text-sm text-muted-foreground mb-3">{table.rationale}</p>
                  )}
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {table.fields.slice(0, 4).map((field) => (
                      <li key={field.name} className="font-mono">
                        {field.name} <span className="text-muted-foreground/70">({field.type})</span>
                      </li>
                    ))}
                    {table.fields.length > 4 && (
                      <li className="text-muted-foreground/70">...and {table.fields.length - 4} more fields</li>
                    )}
                  </ul>
                </button>
              ))}
            </div>
            {error && (
              <div className="text-sm text-destructive mt-3">{error}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
