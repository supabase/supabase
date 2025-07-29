import { debounce } from 'lodash'
import { Book, Save, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  createSqlSnippetSkeletonV2,
  suffixWithLimit,
} from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { SqlRunButton } from 'components/interfaces/SQLEditor/UtilityPanel/RunButton'
import { useSqlTitleGenerateMutation } from 'data/ai/sql-title-mutation'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useOrgAiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
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
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  SQL_ICON,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { containsUnknownFunction, isReadOnlySelect } from '../AIAssistantPanel/AIAssistant.utils'
import AIEditor from '../AIEditor'
import { ButtonTooltip } from '../ButtonTooltip'
import { InlineLink } from '../InlineLink'
import SqlWarningAdmonition from '../SqlWarningAdmonition'

interface EditorPanelProps {
  onChange?: (value: string) => void
}

export const EditorPanel = ({ onChange }: EditorPanelProps) => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const { editorPanel, setEditorPanel } = useAppStateSnapshot()
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const { includeSchemaMetadata } = useOrgAiOptInLevel()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<undefined | any[]>(undefined)
  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()
  const [currentValue, setCurrentValue] = useState(editorPanel.initialValue || '')
  const [savedCode, setSavedCode] = useState<string>('')
  const [isPreviewingTemplate, setIsPreviewingTemplate] = useState(false)
  const [showResults, setShowResults] = useState(true)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)

  const errorHeader = error?.formattedError?.split('\n')?.filter((x: string) => x.length > 0)?.[0]
  const errorContent =
    error?.formattedError
      ?.split('\n')
      ?.filter((x: string) => x.length > 0)
      ?.slice(1) ?? []

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async (res) => {
      setResults(res.result)
    },
    onError: (error) => {
      setError(error)
      setResults([])
    },
  })

  const onExecuteSql = (skipValidation = false) => {
    setError(undefined)
    setShowWarning(undefined)

    if (currentValue.length === 0) return

    if (!skipValidation) {
      const isReadOnlySelectSQL = isReadOnlySelect(currentValue)
      if (!isReadOnlySelectSQL) {
        const hasUnknownFunctions = containsUnknownFunction(currentValue)
        setShowWarning(hasUnknownFunctions ? 'hasUnknownFunctions' : 'hasWriteOperation')
        return
      }
    }

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
      contextualInvalidation: true,
    })
  }

  const handleChange = (value: string) => {
    setCurrentValue(value)
    onChange?.(value)
  }

  const onSelectTemplate = (content: string) => {
    handleChange(content)
    setIsTemplatesOpen(false)
  }

  // Create a debounced version of the revert code function
  const debouncedRevertCode = useCallback(
    debounce(() => {
      setIsPreviewingTemplate(false)
      handleChange(savedCode)
    }, 300),
    [savedCode]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedRevertCode.cancel()
    }
  }, [debouncedRevertCode])

  useEffect(() => {
    if (editorPanel.initialValue !== undefined && editorPanel.initialValue !== currentValue) {
      setCurrentValue(editorPanel.initialValue)
    }
  }, [editorPanel.initialValue])

  useEffect(() => {
    if (editorPanel.initialValue !== currentValue) {
      setEditorPanel({
        initialValue: currentValue,
      })
    }
  }, [currentValue, setEditorPanel])

  return (
    <div className="flex flex-col h-full bg-surface-100">
      <div className="border-b flex shrink-0 items-center gap-x-3 px-4 h-[46px]">
        <span className="text-sm flex-1">SQL Editor</span>
        <div className="flex gap-2 items-center">
          <Popover_Shadcn_ open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                size="tiny"
                type="default"
                role="combobox"
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
                    {editorPanel.templates?.map((template) => (
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
          <ButtonTooltip
            tooltip={{
              content: {
                side: 'bottom',
                text: 'Save as snippet',
              },
            }}
            size="tiny"
            type="default"
            className="w-7 h-7"
            loading={isSaving}
            icon={<Save size={16} />}
            onClick={async () => {
              if (!ref) return console.error('Project ref is required')
              if (!project) return console.error('Project is required')
              if (!profile) return console.error('Profile is required')

              try {
                setIsSaving(true)
                const { title: name } = await generateSqlTitle({
                  sql: currentValue,
                })
                const snippet = createSqlSnippetSkeletonV2({
                  id: uuidv4(),
                  name,
                  sql: currentValue,
                  owner_id: profile.id,
                  project_id: project.id,
                })
                snapV2.addSnippet({ projectRef: ref, snippet })
                snapV2.addNeedsSaving(snippet.id)
                toast.success(
                  <div>
                    Saved snippet! View it{' '}
                    <InlineLink href={`/project/${ref}/sql/${snippet.id}`}>here</InlineLink>
                  </div>
                )
              } catch (error: any) {
                toast.error(`Failed to create new query: ${error.message}`)
              } finally {
                setIsSaving(false)
              }
            }}
          />

          <Button
            size="tiny"
            type="default"
            className="w-7 h-7"
            onClick={() => setEditorPanel({ open: false })}
            icon={<X size={16} />}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col h-full">
        <div className="flex-1 min-h-0 relative">
          <AIEditor
            language="pgsql"
            value={currentValue}
            onChange={handleChange}
            aiEndpoint={`${BASE_PATH}/api/ai/sql/complete-v2`}
            aiMetadata={{
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              includeSchemaMetadata,
            }}
            initialPrompt={editorPanel.initialPrompt}
            options={{
              tabSize: 2,
              fontSize: 13,
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: false,
              padding: { top: 4 },
              lineNumbersMinChars: 3,
            }}
            executeQuery={onExecuteSql}
          />
        </div>

        {error !== undefined && (
          <div className="shrink-0">
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
          <div className={`max-h-72 shrink-0 flex flex-col ${showResults && 'h-full'}`}>
            {showResults && (
              <div className="border-t flex-1 overflow-auto">
                <Results rows={results} />
              </div>
            )}
            <p className="text-xs text-foreground-light border-t py-2 px-5 flex items-center justify-between">
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
            </p>
          </div>
        )}
        {results !== undefined && results.length === 0 && (
          <div className="shrink-0">
            <p className="text-xs text-foreground-light font-mono py-2 px-5">
              Success. No rows returned.
            </p>
          </div>
        )}

        <div className="bg-surface-100 flex items-center gap-2 justify-end px-5 py-4 w-full border-t shrink-0">
          <SqlRunButton isDisabled={isExecuting} isExecuting={isExecuting} onClick={onExecuteSql} />
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
