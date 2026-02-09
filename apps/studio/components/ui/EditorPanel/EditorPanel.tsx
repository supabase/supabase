import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { isExplainQuery } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import { generateSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import {
  createSqlSnippetSkeletonV2,
  suffixWithLimit,
} from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { SqlRunButton } from 'components/interfaces/SQLEditor/UtilityPanel/RunButton'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { Book, Maximize2, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  cn,
  CodeBlock,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  HoverCard_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  KeyboardShortcut,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  SQL_ICON,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { containsUnknownFunction, isReadOnlySelect } from '../AIAssistantPanel/AIAssistant.utils'
import { AIEditor } from '../AIEditor'
import { ButtonTooltip } from '../ButtonTooltip'
import { SqlWarningAdmonition } from '../SqlWarningAdmonition'

export const EditorPanel = () => {
  const {
    value,
    templates,
    results,
    error,
    initialPrompt,
    onChange,
    setValue,
    setTemplates,
    setResults,
    setError,
  } = useEditorPanelStateSnapshot()
  const { profile } = useProfile()
  const { closeSidebar } = useSidebarManagerSnapshot()
  const sqlEditorSnap = useSqlEditorV2StateSnapshot()

  const label = 'SQL Editor'
  const [isInlineEditorHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.EDITOR_PANEL),
    true
  )
  const [isAIAssistantHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.AI_ASSISTANT),
    true
  )

  const currentValue = value || ''

  const { ref } = useParams()
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()
  const [showResults, setShowResults] = useState(true)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)

  const errorHeader = error?.formattedError?.split('\n')?.filter((x: string) => x.length > 0)?.[0]
  const errorContent =
    'formattedError' in (error || {})
      ? error?.formattedError
          ?.split('\n')
          ?.filter((x: string) => x.length > 0)
          ?.slice(1) ?? []
      : [error?.message ?? '']

  const { mutate: executeSql, isPending: isExecuting } = useExecuteSqlMutation({
    onSuccess: async (res) => {
      setResults(res.result)
      setError(undefined)
    },
    onError: (mutationError) => {
      setError(mutationError)
      setResults([])
    },
  })

  const onExecuteSql = (skipValidation = false) => {
    setError(undefined)
    setShowWarning(undefined)
    setResults(undefined)

    if (currentValue.length === 0) return

    if (!skipValidation) {
      const isReadOnlySelectSQL = isReadOnlySelect(currentValue)
      if (!isReadOnlySelectSQL) {
        const hasUnknownFunctions = containsUnknownFunction(currentValue)
        setShowWarning(hasUnknownFunctions ? 'hasUnknownFunctions' : 'hasWriteOperation')
        return
      }
    }

    executeSql({
      sql: suffixWithLimit(currentValue, 100),
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      isStatementTimeoutDisabled: true,
      handleError: (executeError) => {
        throw executeError
      },
      contextualInvalidation: true,
    })
  }

  // Check if this is an EXPLAIN query result
  const isValidExplainQuery = isExplainQuery(results ?? [])

  const handleChange = (value: string) => {
    setValue(value)
    onChange?.(value)
  }

  const onSelectTemplate = (content: string) => {
    handleChange(content)
    setIsTemplatesOpen(false)
  }

  const handleClosePanel = () => {
    closeSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    setTemplates([])
    setError(undefined)
    setShowWarning(undefined)
    setShowResults(true)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-b-muted flex items-center justify-between gap-x-4 pl-4 pr-3 h-[46px]">
        <div className="text-xs">{label}</div>
        <div className="flex items-center">
          {templates.length > 0 && (
            <Popover_Shadcn_ open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  size="tiny"
                  type="default"
                  role="combobox"
                  className="mr-2"
                  aria-expanded={isTemplatesOpen}
                  icon={<Book size={14} />}
                >
                  Templates
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ align="end" className="w-[300px] p-0">
                <Command_Shadcn_>
                  <CommandInput_Shadcn_ placeholder="Search templates..." />
                  <CommandList_Shadcn_>
                    <CommandEmpty_Shadcn_>No templates found.</CommandEmpty_Shadcn_>
                    <CommandGroup_Shadcn_>
                      {templates.map((template) => (
                        <HoverCard_Shadcn_ key={template.name}>
                          <HoverCardTrigger_Shadcn_ asChild>
                            <CommandItem_Shadcn_
                              value={template.name}
                              onSelect={() => onSelectTemplate(template.content)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <SQL_ICON
                                  size={16}
                                  className={cn(
                                    'w-5 h-5 flex-0 mr-2 transition-colors fill-foreground-muted'
                                  )}
                                />
                                <div className="flex-1">
                                  <h4 className="text-foreground flex-1">{template.name}</h4>
                                  <p className="text-xs text-foreground-light">
                                    {template.description}
                                  </p>
                                </div>
                              </div>
                            </CommandItem_Shadcn_>
                          </HoverCardTrigger_Shadcn_>
                          <HoverCardContent_Shadcn_ side="left" className="w-[500px] p-0">
                            <CodeBlock
                              language="sql"
                              className="language-sql border-none"
                              hideLineNumbers
                              value={template.content}
                            />
                          </HoverCardContent_Shadcn_>
                        </HoverCard_Shadcn_>
                      ))}
                    </CommandGroup_Shadcn_>
                  </CommandList_Shadcn_>
                </Command_Shadcn_>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}
          <ButtonTooltip
            type="text"
            className="w-7 h-7 p-0"
            icon={<Maximize2 strokeWidth={1.5} />}
            tooltip={{
              content: {
                side: 'bottom',
                text: 'Expand to SQL editor',
              },
            }}
            onClick={() => {
              if (!ref) return console.error('Project ref is required')

              if (!project) {
                console.error('Project is required')
                return
              }
              if (!profile) {
                console.error('Profile is required')
                return
              }

              const snippet = createSqlSnippetSkeletonV2({
                name: generateSnippetTitle(),
                sql: currentValue,
                owner_id: profile.id,
                project_id: project.id,
              })

              sqlEditorSnap.addSnippet({ projectRef: ref, snippet })
              sqlEditorSnap.addNeedsSaving(snippet.id)

              router.push(`/project/${ref}/sql/${snippet.id}`)
              handleClosePanel()
            }}
          />

          <ButtonTooltip
            type="text"
            className="w-7 h-7 p-0"
            onClick={handleClosePanel}
            icon={<X strokeWidth={1.5} />}
            tooltip={{
              content: {
                side: 'bottom',
                text: (
                  <div className="flex items-center gap-4">
                    <span>Close Editor</span>
                    {isInlineEditorHotkeyEnabled && <KeyboardShortcut keys={['Meta', 'e']} />}
                  </div>
                ),
              },
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col h-full">
        <div className="flex-1 min-h-0 relative [&_.monaco-editor]:!bg [&_.monaco-editor_.margin]:!bg [&_.monaco-editor_.monaco-editor-background]:!bg">
          <AIEditor
            autoFocus
            language="pgsql"
            value={currentValue}
            onChange={handleChange}
            aiEndpoint={`${BASE_PATH}/api/ai/code/complete`}
            aiMetadata={{
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              orgSlug: org?.slug,
            }}
            initialPrompt={initialPrompt}
            options={{
              tabSize: 2,
              fontSize: 13,
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: false,
              padding: { top: 16 },
              lineNumbersMinChars: 3,
            }}
            executeQuery={onExecuteSql}
            onClose={handleClosePanel}
            closeShortcutEnabled={isInlineEditorHotkeyEnabled}
            openAIAssistantShortcutEnabled={isAIAssistantHotkeyEnabled}
          />
        </div>

        {error !== undefined && (
          <div className="shrink-0">
            <Admonition
              type="warning"
              className="rounded-none border-x-0 border-b-0 [&>div>div>pre]:text-sm [&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
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
                    <p className="font-mono text-xs">{error?.error}</p>
                  )}
                </div>
              }
            />
          </div>
        )}

        {showWarning && (
          <SqlWarningAdmonition
            className="border-t"
            warningType={showWarning}
            onCancel={() => setShowWarning(undefined)}
            onConfirm={() => {
              setShowWarning(undefined)
              onExecuteSql(true)
            }}
          />
        )}

        {results !== undefined && results.length > 0 && (
          <div
            className={cn(
              `shrink-0 flex flex-col`,
              isValidExplainQuery ? 'max-h-[600px]' : 'max-h-72',
              showResults && 'h-full'
            )}
          >
            {showResults && (
              <div className="border-t flex-1 overflow-hidden">
                <Results rows={results} />
              </div>
            )}
            <div className="text-xs text-foreground-light border-t py-2 px-5 flex items-center justify-between">
              <span className="font-mono">
                {results.length} rows{results.length >= 100 && ` (Limited to only 100 rows)`}
              </span>
              <Button
                size="tiny"
                type="default"
                className="ml-2"
                onClick={() => setShowResults((prev) => !prev)}
              >
                {showResults ? 'Hide Results' : 'Show Results'}
              </Button>
            </div>
          </div>
        )}
        {results !== undefined && results.length === 0 && !error && (
          <div className="shrink-0">
            <p className="text-xs text-foreground-light font-mono py-2 px-5">
              Success. No rows returned.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 justify-end px-5 py-4 w-full border-t shrink-0">
          <SqlRunButton isDisabled={isExecuting} isExecuting={isExecuting} onClick={onExecuteSql} />
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
