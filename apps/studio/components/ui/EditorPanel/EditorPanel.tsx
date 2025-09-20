import { Book, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
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
  Form_Shadcn_,
  FormField_Shadcn_,
  HoverCard_Shadcn_,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
  Input_Shadcn_ as Input,
  KeyboardShortcut,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SQL_ICON,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { containsUnknownFunction, isReadOnlySelect } from '../AIAssistantPanel/AIAssistant.utils'
import AIEditor from '../AIEditor'
import { ButtonTooltip } from '../ButtonTooltip'
import { InlineLink } from '../InlineLink'
import { SqlWarningAdmonition } from '../SqlWarningAdmonition'

type Template = {
  name: string
  description: string
  content: string
}

interface EditorPanelProps {
  open: boolean
  onClose: () => void
  initialValue?: string
  label?: string
  saveLabel?: string
  saveValue?: string
  onSave?: (value: string, saveValue: string) => void
  onRunSuccess?: (value: any[]) => void
  onRunError?: (value: any) => void
  functionName?: string
  templates?: Template[]
  initialPrompt?: string
  onChange?: (value: string) => void
}

export const EditorPanel = ({
  open,
  onClose,
  initialValue = '',
  label = '',
  saveLabel = 'Save',
  saveValue = '',
  onSave,
  onRunSuccess,
  onRunError,
  templates = [],
  initialPrompt = '',
  onChange,
}: EditorPanelProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { mutateAsync: generateSqlTitle } = useSqlTitleGenerateMutation()
  const { data: org } = useSelectedOrganizationQuery()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<undefined | any[]>(undefined)
  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()
  const [currentValue, setCurrentValue] = useState(initialValue)
  const [showResults, setShowResults] = useState(true)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)

  const saveForm = useForm({
    defaultValues: {
      saveValue: saveValue || '',
    },
  })

  const errorHeader = error?.formattedError?.split('\n')?.filter((x: string) => x.length > 0)?.[0]
  const errorContent =
    'formattedError' in (error || {})
      ? error?.formattedError
          ?.split('\n')
          ?.filter((x: string) => x.length > 0)
          ?.slice(1) ?? []
      : [error?.message ?? '']

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async (res) => {
      setResults(res.result)
      if (onRunSuccess) {
        onRunSuccess(res.result)
      }
    },
    onError: (error) => {
      setError(error)
      setResults([])
      if (onRunError) {
        onRunError(error)
      }
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

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== currentValue) {
      setCurrentValue(initialValue)
      setResults(undefined)
      setError(undefined)
      setShowWarning(undefined)
    }
  }, [initialValue])

  useEffect(() => {
    saveForm.reset({
      saveValue: saveValue || '',
    })
  }, [saveValue, saveForm])

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        showClose={false}
        className="w-full sm:max-w-3xl flex flex-col h-full p-0 space-y-0 gap-0"
      >
        <SheetHeader className="flex shrink-0 items-center gap-x-3">
          <div className="flex-1">
            <SheetTitle className="text-sm">SQL Editor</SheetTitle>
            {label && <SheetDescription className="text-sm">{label}</SheetDescription>}
          </div>
          <div className="flex gap-2 items-center">
            {templates.length > 0 && (
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

            <ButtonTooltip
              size="tiny"
              type="default"
              className="w-7 h-7"
              onClick={onClose}
              icon={<X size={16} />}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: (
                    <div className="flex items-center gap-4">
                      <span>Close Editor</span>
                      <KeyboardShortcut keys={['Meta', 'e']} />
                    </div>
                  ),
                },
              }}
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col h-full">
          <div className="flex-1 min-h-0 relative">
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
              onClose={() => onClose()}
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
          {results !== undefined && results.length === 0 && !error && (
            <div className="shrink-0">
              <p className="text-xs text-foreground-light font-mono py-2 px-5">
                Success. No rows returned.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 justify-end px-5 py-4 w-full border-t shrink-0">
            {onSave && (
              <Form_Shadcn_ {...saveForm}>
                <form
                  onSubmit={saveForm.handleSubmit((values) => {
                    onSave(currentValue, values.saveValue)
                  })}
                  className="flex items-center gap-2"
                >
                  {saveValue && (
                    <FormField_Shadcn_
                      control={saveForm.control}
                      name="saveValue"
                      render={({ field }) => (
                        <Input size="tiny" placeholder="Enter save value..." {...field} />
                      )}
                    />
                  )}
                  <Button size="tiny" type="default" htmlType="submit">
                    {saveLabel}
                  </Button>
                </form>
              </Form_Shadcn_>
            )}
            <SqlRunButton
              isDisabled={isExecuting}
              isExecuting={isExecuting}
              onClick={onExecuteSql}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default EditorPanel
