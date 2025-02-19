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
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { AiIconAnimation, Button, cn, Input_Shadcn_, SQL_ICON } from 'ui'
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
  const { editorPanel, setEditorPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const isOptedInToAI = useOrgOptedIntoAi()
  const includeSchemaMetadata = isOptedInToAI || !IS_PLATFORM

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<undefined | any[]>(undefined)
  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()
  const [currentValue, setCurrentValue] = useState(editorPanel.initialValue || '')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [savedCode, setSavedCode] = useState<string>('')
  const [isPreviewingTemplate, setIsPreviewingTemplate] = useState(false)
  const [showResults, setShowResults] = useState(true)

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

  const handleChat = () => {
    setAiAssistantPanel({
      open: true,
      sqlSnippets: currentValue ? [currentValue] : [],
      initialInput: 'Help me understand and improve this SQL query...',
      suggestions: {
        title:
          'I can help you understand and improve your SQL query. Here are a few example prompts to get you started:',
        prompts: [
          'Explain what this query does...',
          'Help me optimize this query...',
          'Show me how to add more conditions...',
          'Help me join this with another table...',
        ],
      },
    })
  }

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
    setSavedCode(content)
    setShowTemplates(false)
  }

  // Create a debounced version of the revert code function
  const debouncedRevertCode = useCallback(
    debounce(() => {
      setIsPreviewingTemplate(false)
      handleChange(savedCode)
    }, 300),
    [savedCode]
  )

  const handleTemplateMouseEnter = (templateContent: string) => {
    // Cancel any pending revert
    debouncedRevertCode.cancel()

    if (!isPreviewingTemplate) {
      setSavedCode(currentValue)
    }
    setIsPreviewingTemplate(true)
    handleChange(templateContent)
  }

  const handleTemplateMouseLeave = () => {
    if (isPreviewingTemplate) {
      debouncedRevertCode()
    }
  }

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
      <div className="border-b flex shrink-0 items-center gap-x-3 px-5 h-[46px]">
        <span className="text-sm flex-1">SQL Editor</span>
        <div className="flex gap-2 items-center">
          <Button
            size="tiny"
            type="default"
            className="h-7"
            onClick={handleChat}
            icon={<AiIconAnimation size={16} />}
          >
            Chat
          </Button>
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
                const { title: name } = await generateSqlTitle({ sql: currentValue })
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
            aiEndpoint={`${BASE_PATH}/api/ai/sql/complete`}
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
          <div className={`max-h-72 shrink-0 flex flex-col`}>
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

        {showTemplates && editorPanel.templates && (
          <div className="bg-surface-100 border-t w-full flex flex-col max-h-80 h-full text-sm">
            <div className="px-4 py-3 border-b shrink-0">
              <Input_Shadcn_
                placeholder="Search templates..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
              />
            </div>
            <div className="overflow-auto flex-1 p-2">
              {editorPanel.templates
                ?.filter((template) => {
                  const searchLower = templateSearch.toLowerCase()
                  return (
                    template.name.toLowerCase().includes(searchLower) ||
                    template.description.toLowerCase().includes(searchLower)
                  )
                })
                ?.map((template, i) => (
                  <div
                    key={i}
                    className="cursor-pointer group rounded-lg flex items-center gap-4 px-4 py-3 hover:bg-surface-200"
                    onClick={() => onSelectTemplate(template.content)}
                    onMouseEnter={() => handleTemplateMouseEnter(template.content)}
                    onMouseLeave={handleTemplateMouseLeave}
                  >
                    <SQL_ICON
                      size={18}
                      strokeWidth={1.5}
                      className={cn(
                        'transition-colors fill-foreground-muted group-aria-selected:fill-foreground',
                        'w-5 h-5 shrink-0 grow-0 -ml-0.5'
                      )}
                    />
                    <div>
                      <p className="text-xs mb-1">{template.name}</p>
                      <p className="text-xs text-foreground-light">{template.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        <div className="bg-surface-100 flex items-center gap-2 !justify-between px-5 py-4 w-full border-t shrink-0">
          <Button
            size="tiny"
            type="default"
            onClick={() => setShowTemplates(!showTemplates)}
            icon={<Book size={14} />}
          >
            {showTemplates ? 'Templates' : 'Templates'}
          </Button>
          <SqlRunButton isDisabled={isExecuting} isExecuting={isExecuting} onClick={onExecuteSql} />
        </div>
      </div>
    </div>
  )
}

export default EditorPanel
