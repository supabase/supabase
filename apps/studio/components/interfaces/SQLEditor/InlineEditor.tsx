import { useQueryClient } from '@tanstack/react-query'
import { Command, CornerDownLeft, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useIsDatabaseFunctionsAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { sqlKeys } from 'data/sql/keys'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { SqlEditor } from 'icons'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useAppStateSnapshot } from 'state/app-state'
import { Button, cn, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { validateQuery } from 'components/ui/AIAssistantPanel/AIAssistant.utils'

export const InlineEditor = () => {
  const os = detectOS()
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const queryClient = useQueryClient()
  const { inlineEditorPanel, setInlineEditorPanel } = useAppStateSnapshot()
  const isEnabled = useIsDatabaseFunctionsAssistantEnabled()

  const { open } = inlineEditorPanel

  const [isAcknowledged, setIsAcknowledged] = useLocalStorage(
    LOCAL_STORAGE_KEYS.SQL_SCRATCH_PAD_BANNER_ACKNOWLEDGED,
    false
  )

  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<undefined | any[]>(undefined)
  const [showResults, setShowResults] = useState(false)
  const [showWarning, setShowWarning] = useState<boolean>(false)

  const editorRef = useRef<IStandaloneCodeEditor | undefined>()

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

    const query = editorRef.current?.getValue() ?? ''
    if (query.length === 0) return

    executeSql({
      sql: suffixWithLimit(query, 100),
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      handleError: (error) => {
        throw error
      },
    })
  }

  useEffect(() => {
    editorRef.current?.layout({ width: 0, height: 0 })
    window.requestAnimationFrame(() => editorRef.current?.layout())
  }, [error, showWarning, isExecuting, numResults, showResults])

  return (
    <div className={cn('flex flex-col w-full h-full')}>
      <div className="flex items-center justify-between py-3 px-5 border-b h-[46px]">
        Inline Editor
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              type="outline"
              icon={<SqlEditor />}
              className="h-[24px] w-[24px] px-1"
              onClick={() => {
                const content = editorRef.current?.getValue() ?? ''
                router.push(`/project/${ref}/sql/new?content=${encodeURIComponent(content)}`)
                setInlineEditorPanel({ open: false })
              }}
            />
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">Open in SQL Editor</TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      </div>

      <div className="flex flex-col flex-1">
        <div className="relative flex-grow flex flex-col">
          <div className="relative my-5 w-full flex-1">
            <CodeEditor
              id="assistant-code-editor"
              language="pgsql"
              editorRef={editorRef}
              placeholder={'Write some SQL...'}
              actions={{
                runQuery: { enabled: true, callback: () => onExecuteSql() },
              }}
            />
          </div>
        </div>
        <div className="flex flex-col">
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
            <>
              <div className={cn(showResults ? 'h-72 border-t' : 'h-0')}>
                <Results rows={results} />
              </div>
              <div className="flex items-center justify-between border-t bg-surface-100 py-2 pl-2 pr-5">
                <p className="text-xs text-foreground-light">
                  {results.length} rows
                  {results.length >= 100 && ` (Limited to only 100 rows)`}
                </p>
                <Button size="tiny" type="default" onClick={() => setShowResults(!showResults)}>
                  {showResults ? 'Hide' : 'Show'} results
                </Button>
              </div>
            </>
          )}
          {results !== undefined && results.length === 0 && (
            <div className="flex items-center justify-between border-t bg-surface-100 h-[43px] pl-2 pr-5">
              <p className="text-xs text-foreground-light">Success. No rows returned.</p>
            </div>
          )}
          <div className="bg-surface-100 flex items-center gap-2 !justify-end px-5 py-4 w-full border-t">
            <Button
              type="default"
              disabled={isExecuting}
              onClick={() => {
                const content = editorRef.current?.getValue() ?? ''
                router.push(`/project/${ref}/sql/new?content=${encodeURIComponent(content)}`)
                setInlineEditorPanel({ open: false })
              }}
            >
              Save for later
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
      </div>
    </div>
  )
}
