import { CornerDownLeft, Loader2, Book } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, cn } from 'ui'
import { Admonition } from 'ui-patterns'
import { useParams } from 'common'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useAppStateSnapshot } from 'state/app-state'

interface SQLEditorProps {
  onChange?: (value: string) => void
}

const SQLEditor = ({ onChange }: SQLEditorProps) => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const { editorPanel, setEditorPanel } = useAppStateSnapshot()

  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<undefined | any[]>(undefined)
  const [showResults, setShowResults] = useState(false)
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [currentValue, setCurrentValue] = useState(editorPanel.initialValue || '')
  const [showTemplates, setShowTemplates] = useState(false)

  const numResults = (results ?? []).length
  const [errorHeader, ...errorContent] =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async (res) => {
      setShowResults(true)
      setResults(res.result)
    },
    onError: (error) => {
      setError(error)
      setResults([])
    },
  })

  const onExecuteSql = (skipValidation = false) => {
    setError(undefined)
    setShowWarning(false)

    if (currentValue.length === 0) return

    if (editorPanel.onSave) {
      editorPanel.onSave(currentValue)
    }

    executeSql({
      sql: suffixWithLimit(currentValue, 100),
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      handleError: (error) => {
        throw error
      },
    })
  }

  const handleChange = (value?: string) => {
    const newValue = value || ''
    setCurrentValue(newValue)
    onChange?.(newValue)
  }

  const onSelectTemplate = (content: string) => {
    handleChange(content)
    setShowTemplates(false)
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="relative flex-1">
        {showTemplates && editorPanel.templates && (
          <div className="absolute inset-0 z-10 bg-background border rounded-md m-5 overflow-auto">
            <div className="px-5 py-4 border-b bg-surface-100">
              <h3 className="text-sm">Templates</h3>
              <p className="text-xs text-foreground-light">Select a template to get started</p>
            </div>
            <div className="p-5 space-y-4">
              {editorPanel.templates.map((template, i) => (
                <div
                  key={i}
                  className="cursor-pointer group rounded border px-4 py-3 hover:border-foreground transition"
                  onClick={() => onSelectTemplate(template.content)}
                >
                  <p className="text-sm font-medium mb-1">{template.name}</p>
                  <p className="text-sm text-foreground-light">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <CodeEditor
          id="editor-panel-sql"
          className="!bg-transparent"
          language="pgsql"
          defaultValue={editorPanel.initialValue}
          onInputChange={handleChange}
          actions={{
            runQuery: { enabled: true, callback: () => onExecuteSql() },
          }}
        />
      </div>
      {error !== undefined && (
        <Admonition
          type="warning"
          className="m-0 rounded-none border-x-0 border-b-0 [&>div>div>pre]:text-sm [&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
          title={errorHeader || 'Error running SQL query'}
          description={
            <div>
              {errorContent.length > 0 ? (
                errorContent.map((errorText: string, i: number) => (
                  <pre key={`err-${i}`} className="font-mono text-xs whitespace-pre-wrap">
                    {errorText}
                  </pre>
                ))
              ) : (
                <p className="font-mono text-xs">{error.error}</p>
              )}
            </div>
          }
        />
      )}

      {results !== undefined && results.length > 0 && (
        <div className="h-72 shrink-0 overflow-hidden">
          <div className="border-t">
            <Results rows={results} />
          </div>
          <p className="text-xs text-foreground-light font-mono py-2 px-5">
            {results.length} rows
            {results.length >= 100 && ` (Limited to only 100 rows)`}
          </p>
        </div>
      )}
      {results !== undefined && results.length === 0 && (
        <p className="text-xs text-foreground-light font-mono py-2 px-5">
          Success. No rows returned.
        </p>
      )}
      <div className="z-10 bg-surface-100 flex items-center gap-2 !justify-between px-5 py-4 w-full border-t">
        <Button
          size="tiny"
          type="default"
          onClick={() => setShowTemplates(!showTemplates)}
          icon={<Book size={14} />}
        >
          {showTemplates ? 'Hide templates' : 'Show templates'}
        </Button>
        <Button
          loading={isExecuting}
          onClick={() => onExecuteSql()}
          iconRight={
            isExecuting ? (
              <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
            ) : (
              <div className="flex items-center space-x-1">
                <CornerDownLeft size={10} strokeWidth={1.5} />
              </div>
            )
          }
        >
          Run
        </Button>
      </div>
    </div>
  )
}

export default SQLEditor
