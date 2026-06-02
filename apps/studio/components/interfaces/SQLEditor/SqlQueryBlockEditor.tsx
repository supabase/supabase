import type { Monaco } from '@monaco-editor/react'
import { acceptUntrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'
import { ChevronUp, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRef } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { RunQueryWarningModal } from './RunQueryWarningModal'
import { SnippetEditorShell } from './SnippetEditorShell'
import { ROWS_PER_PAGE_OPTIONS } from './SQLEditor.constants'
import type { IStandaloneCodeEditor } from './SQLEditor.types'
import { appendEnableRLSStatements } from './SQLEditor.utils'
import { useSqlEditorCompletion } from './useSqlEditorCompletion'
import { useSqlQueryBlockEditor } from './useSqlQueryBlockEditor'
import { UtilityPanel } from './UtilityPanel/UtilityPanel'
import { GridFooter } from '@/components/ui/GridFooter'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

const MonacoEditor = dynamic(() => import('./MonacoEditor'), { ssr: false })

export interface SqlQueryBlockEditorProps {
  id: string
  snippetName: string
  /** When true, uses a fixed height suitable for stacking in notebook pages */
  variant?: 'full' | 'block'
  /** When false, only the utility panel (results) is shown */
  isSqlEditorVisible?: boolean
  autoFocus?: boolean
  isLoading?: boolean
  className?: string
}

export const SqlQueryBlockEditor = ({
  id,
  snippetName,
  variant = 'full',
  isSqlEditorVisible = true,
  autoFocus = true,
  isLoading = false,
  className,
}: SqlQueryBlockEditorProps) => {
  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const snapV2 = useSqlEditorV2StateSnapshot()

  useSqlEditorCompletion(id, monacoRef.current)

  const {
    hasSelection,
    setHasSelection,
    potentialIssues,
    setPotentialIssues,
    activeUtilityTab,
    setActiveUtilityTab,
    results,
    isExecuting,
    isExplainExecuting,
    isLogsExecuting,
    prettifyQuery,
    executeQueryFromButton,
    executeExplainQuery,
    buildDebugPrompt,
    onDebug,
    executeQuery,
    limit,
  } = useSqlQueryBlockEditor({ id, editorRef, monacoRef })

  const containerClassName = cn(
    variant === 'full' ? 'h-full' : isSqlEditorVisible ? 'h-[480px]' : 'h-[280px]',
    className
  )

  return (
    <>
      <RunQueryWarningModal
        visible={!!potentialIssues}
        potentialIssues={potentialIssues}
        onCancel={() => setPotentialIssues(undefined)}
        onConfirm={() => {
          setPotentialIssues(undefined)
          void executeQuery(true)
        }}
        onConfirmWithRLS={() => {
          const tables = potentialIssues?.createTablesMissingRLS ?? []
          if (tables.length === 0) return
          const editor = editorRef.current
          const selection = editor?.getSelection()
          const selectedValue = selection
            ? editor?.getModel()?.getValueInRange(selection)
            : undefined
          const baseSql = selectedValue || editor?.getValue() || ''
          const rewrittenSql = appendEnableRLSStatements(baseSql, tables)
          setPotentialIssues(undefined)
          void executeQuery(true, acceptUntrustedSql(rewrittenSql as UntrustedSqlFragment))
        }}
      />

      <div className={containerClassName}>
        <SnippetEditorShell
          hideEditorPanel={variant === 'block' && !isSqlEditorVisible}
          editorPanel={
            isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-brand" />
              </div>
            ) : (
              <div key={id} className="w-full h-full relative">
                <MonacoEditor
                  autoFocus={autoFocus}
                  id={id}
                  snippetName={snippetName}
                  editorRef={editorRef}
                  monacoRef={monacoRef}
                  executeQuery={executeQueryFromButton}
                  executeExplainQuery={executeExplainQuery}
                  prettifyQuery={prettifyQuery}
                  onHasSelection={setHasSelection}
                />
              </div>
            )
          }
          utilityPanel={
            isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="animate-spin text-brand" />
              </div>
            ) : (
              <UtilityPanel
                id={id}
                isExecuting={isExecuting || isLogsExecuting}
                isExplainExecuting={isExplainExecuting}
                hasSelection={hasSelection}
                prettifyQuery={prettifyQuery}
                executeQuery={executeQueryFromButton}
                executeExplainQuery={executeExplainQuery}
                onDebug={onDebug}
                buildDebugPrompt={buildDebugPrompt}
                activeTab={activeUtilityTab}
                onActiveTabChange={setActiveUtilityTab}
              />
            )
          }
          footer={
            variant === 'full' ? (
              <div className="h-9">
                {results?.rows !== undefined && !isExecuting && (
                  <GridFooter className="flex items-center justify-between gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="text-xs">
                          <span className="text-foreground">
                            {results.rows.length} row{results.rows.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-foreground-lighter ml-1">
                            {results.autoLimit !== undefined &&
                              ` (Limited to only ${results.autoLimit} rows)`}
                          </span>
                        </p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="flex flex-col gap-y-1">
                          <span>
                            Results are automatically limited to preserve browser performance, in
                            particular if your query returns an exceptionally large number of rows.
                          </span>
                          <span className="text-foreground-light">
                            You may change or remove this limit from the dropdown on the right
                          </span>
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    {results.autoLimit !== undefined && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="default" iconRight={<ChevronUp size={14} />}>
                            Limit results to:{' '}
                            {ROWS_PER_PAGE_OPTIONS.find((opt) => opt.value === limit)?.label}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-40" align="end">
                          <DropdownMenuRadioGroup
                            value={snapV2.limit.toString()}
                            onValueChange={(val) => snapV2.setLimit(Number(val))}
                          >
                            {ROWS_PER_PAGE_OPTIONS.map((option) => (
                              <DropdownMenuRadioItem
                                key={option.label}
                                value={option.value.toString()}
                              >
                                {option.label}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </GridFooter>
                )}
              </div>
            ) : undefined
          }
        />
      </div>
    </>
  )
}
