import type { Monaco } from '@monaco-editor/react'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { isExplainQuery } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import { generateSnippetTitle } from 'components/interfaces/SQLEditor/SQLEditor.constants'
import {
  createSqlSnippetSkeletonV2,
  suffixWithLimit,
} from 'components/interfaces/SQLEditor/SQLEditor.utils'
import { useAddDefinitions } from 'components/interfaces/SQLEditor/useAddDefinitions'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { SqlRunButton } from 'components/interfaces/SQLEditor/UtilityPanel/RunButton'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useContentQuery, type Content } from 'data/content/content-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { contentKeys } from 'data/content/keys'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { useProfile } from 'lib/profile'
import {
  AlertCircle,
  Book,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Maximize2,
  PlusIcon,
  X,
} from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { editorPanelState, useEditorPanelStateSnapshot } from 'state/editor-panel-state'
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
import { formatSqlError } from './EditorPanel.utils'
import { SaveSnippetDialog } from './SaveSnippetDialog'

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
    activeSnippetId,
    pendingReset,
  } = useEditorPanelStateSnapshot()
  const { profile } = useProfile()
  const { closeSidebar } = useSidebarManagerSnapshot()
  const sqlEditorSnap = useSqlEditorV2StateSnapshot()
  const queryClient = useQueryClient()

  const [activeSnippet, setActiveSnippet] = useState<Extract<Content, { type: 'sql' }> | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [monaco, setMonaco] = useState<Monaco | null>(null)

  useAddDefinitions('', monaco)

  const label = activeSnippet?.name ?? 'SQL Editor'

  const commitRename = () => {
    const newName = titleInput.trim()
    if (!newName || !activeSnippet) {
      setIsEditingTitle(false)
      return
    }
    setActiveSnippet({ ...activeSnippet, name: newName })
    setIsEditingTitle(false)
  }
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
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const originalSnippetRef = useRef<{ sql: string; name: string } | null>(null)

  const showSaveSuccess = () => {
    setSaveStatus('success')
    clearTimeout(saveStatusTimerRef.current)
    saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
  }
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false)
  const [snippetSearch, setSnippetSearch] = useState('')
  const debouncedSnippetSearch = useDebounce(snippetSearch, 300)

  const { data: snippetsData, isLoading: isLoadingSnippets } = useContentQuery(
    { projectRef: ref, type: 'sql', name: debouncedSnippetSearch || undefined },
    { enabled: isSnippetsOpen }
  )

  const { data: snippetById } = useContentIdQuery(
    { projectRef: ref, id: activeSnippetId ?? undefined },
    { enabled: !!activeSnippetId }
  )

  useEffect(() => {
    if (!pendingReset) return
    setActiveSnippet(null)
    setIsEditingTitle(false)
    originalSnippetRef.current = null
    editorPanelState.pendingReset = false
  }, [pendingReset, setActiveSnippet, setIsEditingTitle])

  useEffect(() => {
    if (!snippetById || !activeSnippetId) return
    const sqlSnippet = snippetById as unknown as Extract<Content, { type: 'sql' }>
    const sql = sqlSnippet.content.sql ?? ''
    setValue(sql)
    setActiveSnippet(sqlSnippet)
    originalSnippetRef.current = { sql, name: sqlSnippet.name }
    editorPanelState.setActiveSnippetId(null)
  }, [snippetById, activeSnippetId, setValue, setActiveSnippet])

  const { header: errorHeader, lines: errorContent } = error
    ? formatSqlError(error)
    : { header: undefined, lines: [] as string[] }

  const { mutate: upsertContent, isPending: isUpserting } = useContentUpsertMutation({
    onSuccess: (_, vars) => {
      if (vars.payload.id && ref) {
        queryClient.invalidateQueries({ queryKey: contentKeys.resource(ref, vars.payload.id) })
      }
      originalSnippetRef.current = { sql: currentValue, name: vars.payload.name }
      showSaveSuccess()
    },
    onError: () => setSaveStatus('error'),
  })

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
    setActiveSnippet(null)
    setIsEditingTitle(false)
    editorPanelState.setActiveSnippetId(null)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-b-muted flex items-center justify-between gap-x-4 pl-4 pr-3 h-[var(--header-height)]">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setIsEditingTitle(false)
            }}
            className="text-xs bg-transparent border-b border-foreground-lighter outline-none w-48 py-0.5"
            autoFocus
          />
        ) : (
          <div
            className={cn('text-xs', activeSnippet && 'cursor-pointer hover:text-foreground')}
            onClick={() => {
              if (!activeSnippet) return
              setTitleInput(activeSnippet.name)
              setIsEditingTitle(true)
            }}
          >
            {label}
          </div>
        )}
        <div className="flex items-center gap-2">
          {activeSnippet && (
            <ButtonTooltip
              size="tiny"
              type="text"
              className="w-7 h-7 p-0"
              icon={<PlusIcon size={14} />}
              tooltip={{ content: { side: 'bottom', text: 'New snippet' } }}
              onClick={() => editorPanelState.openAsNew()}
            />
          )}
          <Popover_Shadcn_ open={isSnippetsOpen} onOpenChange={setIsSnippetsOpen}>
            <PopoverTrigger_Shadcn_ asChild>
              <ButtonTooltip
                size="tiny"
                type="text"
                role="combobox"
                aria-expanded={isSnippetsOpen}
                className="w-7 h-7 p-0"
                icon={<FolderOpen size={14} />}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'Open snippet',
                  },
                }}
              ></ButtonTooltip>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ align="end" className="w-[300px] p-0">
              <Command_Shadcn_ shouldFilter={false}>
                <CommandInput_Shadcn_
                  placeholder="Search snippets..."
                  value={snippetSearch}
                  onValueChange={setSnippetSearch}
                />
                <CommandList_Shadcn_>
                  {isLoadingSnippets ? (
                    <div className="py-6 text-center text-sm text-foreground-light">
                      Loading snippets...
                    </div>
                  ) : (
                    <CommandEmpty_Shadcn_>No snippets found.</CommandEmpty_Shadcn_>
                  )}
                  <CommandGroup_Shadcn_>
                    {(snippetsData?.content ?? []).map((snippet) => (
                      <CommandItem_Shadcn_
                        key={snippet.id}
                        value={snippet.id}
                        className="cursor-pointer"
                        onSelect={() => {
                          if (snippet.id) editorPanelState.setActiveSnippetId(snippet.id)
                          setIsSnippetsOpen(false)
                          setSnippetSearch('')
                        }}
                      >
                        {snippet.name}
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
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
            onMount={(_, m) => setMonaco(m)}
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

        <div className="relative shrink-0 flex items-center gap-2 justify-end px-5 py-4 w-full border-t">
          {(isUpserting || saveStatus !== 'idle') && (
            <div
              className={cn(
                'absolute left-0 flex items-center gap-2 px-5 py-3 text-xs',
                saveStatus === 'success' && 'text-brand-600',
                saveStatus === 'error' && 'text-warning',
                saveStatus === 'idle' && 'text-foreground-light'
              )}
            >
              {isUpserting && <Loader2 size={13} className="animate-spin" />}
              {saveStatus === 'success' && <CheckCircle2 size={13} />}
              {saveStatus === 'error' && <AlertCircle size={13} />}
              <span>
                {isUpserting
                  ? 'Saving...'
                  : saveStatus === 'success'
                    ? 'Snippet updated'
                    : 'Failed to save snippet'}
              </span>
            </div>
          )}
          <Button
            type="default"
            size="tiny"
            disabled={
              !currentValue ||
              isExecuting ||
              isUpserting ||
              (!!activeSnippet &&
                currentValue === originalSnippetRef.current?.sql &&
                activeSnippet.name === originalSnippetRef.current?.name)
            }
            onClick={() => {
              if (!ref || !profile || !project) return

              if (activeSnippet) {
                setSaveStatus('idle')
                upsertContent({
                  projectRef: ref,
                  payload: {
                    id: activeSnippet.id,
                    type: 'sql',
                    name: activeSnippet.name,
                    description: activeSnippet.description ?? '',
                    visibility: activeSnippet.visibility ?? 'user',
                    project_id: project.id,
                    owner_id: profile.id,
                    content: {
                      ...activeSnippet.content,
                      sql: currentValue,
                    },
                  },
                })
              } else {
                setIsSaveDialogOpen(true)
              }
            }}
          >
            {activeSnippet ? 'Update snippet' : 'Save as snippet'}
          </Button>
          <SqlRunButton isDisabled={isExecuting} isExecuting={isExecuting} onClick={onExecuteSql} />
        </div>
      </div>
      <SaveSnippetDialog
        open={isSaveDialogOpen}
        sql={currentValue}
        onOpenChange={setIsSaveDialogOpen}
        onSave={(name) => {
          if (!ref || !profile || !project) return
          const snippet = createSqlSnippetSkeletonV2({
            name,
            sql: currentValue,
            owner_id: profile.id,
            project_id: project.id,
          })
          sqlEditorSnap.addSnippet({ projectRef: ref, snippet })
          sqlEditorSnap.addNeedsSaving(snippet.id)
          setActiveSnippet(snippet as unknown as Extract<Content, { type: 'sql' }>)
          originalSnippetRef.current = { sql: currentValue, name }
          showSaveSuccess()
        }}
      />
    </div>
  )
}

export default EditorPanel
