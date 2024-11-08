import { zodResolver } from '@hookform/resolvers/zod'
import { Monaco } from '@monaco-editor/react'
import type { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { isEqual, uniqBy } from 'lodash'
import { FileDiff } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useQueryState } from 'nuqs'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useChat } from 'ai/react'
import { IS_PLATFORM, useParams } from 'common'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import {
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
} from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useDatabasePolicyUpdateMutation } from 'data/database-policies/database-policy-update-mutation'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import {
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  Label_Shadcn_,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetFooter,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { AIPolicyChat } from './AIPolicyChat'
import {
  MessageWithDebug,
  checkIfPolicyHasChanged,
  generateCreatePolicyQuery,
  generatePlaceholder,
  generatePolicyDefinition,
  generateThreadMessage,
} from './AIPolicyEditorPanel.utils'
import { AIPolicyHeader } from './AIPolicyHeader'
import { LockedCreateQuerySection, LockedRenameQuerySection } from './LockedQuerySection'
import { PolicyDetailsV2 } from './PolicyDetailsV2'
import { PolicyTemplates } from './PolicyTemplates'
import QueryError from './QueryError'
import RLSCodeEditor from './RLSCodeEditor'

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then(({ DiffEditor }) => DiffEditor),
  { ssr: false }
)

interface AIPolicyEditorPanelProps {
  visible: boolean
  schema: string
  searchString?: string
  selectedTable?: string
  selectedPolicy?: PostgresPolicy
  onSelectCancel: () => void
  authContext: 'database' | 'realtime'
}

/**
 * Using memo for this component because everything rerenders on window focus because of outside fetches
 */
export const AIPolicyEditorPanel = memo(function ({
  visible,
  schema,
  searchString,
  selectedTable,
  selectedPolicy,
  onSelectCancel,
  authContext,
}: AIPolicyEditorPanelProps) {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()

  const canUpdatePolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const [editView, setEditView] = useQueryState('view', { defaultValue: 'templates' as const })

  // [Joshen] Hyrid form fields, just spit balling to get a decent POC out
  const [using, setUsing] = useState('')
  const [check, setCheck] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [showCheckBlock, setShowCheckBlock] = useState(true)

  const monacoOneRef = useRef<Monaco | null>(null)
  const editorOneRef = useRef<IStandaloneCodeEditor | null>(null)
  const [expOneLineCount, setExpOneLineCount] = useState(1)
  const [expOneContentHeight, setExpOneContentHeight] = useState(0)

  const monacoTwoRef = useRef<Monaco | null>(null)
  const editorTwoRef = useRef<IStandaloneCodeEditor | null>(null)
  const [expTwoLineCount, setExpTwoLineCount] = useState(1)
  const [expTwoContentHeight, setExpTwoContentHeight] = useState(0)

  // Use chat id because useChat doesn't have a reset function to clear all messages
  const [chatId, setChatId] = useState(uuidv4())
  const [tabId, setTabId] = useState<'templates' | 'conversation'>(
    editView as 'templates' | 'conversation'
  )

  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)
  const placeholder = generatePlaceholder(selectedPolicy)
  const isOptedInToAI = useOrgOptedIntoAi()

  const [error, setError] = useState<QueryResponseError>()
  const [errorPanelOpen, setErrorPanelOpen] = useState<boolean>(true)
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [selectedDiff, setSelectedDiff] = useState<string>()
  // [Joshen] Separate state here as there's a delay between submitting and the API updating the loading status
  const [debugThread, setDebugThread] = useState<MessageWithDebug[]>([])
  const [assistantVisible, setAssistantPanel] = useState<boolean>(false)
  const [incomingChange, setIncomingChange] = useState<string>()
  // Used for confirmation when closing the panel with unsaved changes
  const [isClosingPolicyEditorPanel, setIsClosingPolicyEditorPanel] = useState<boolean>(false)

  const formId = 'rls-editor'
  const FormSchema = z.object({
    name: z.string().min(1, 'Please provide a name'),
    table: z.string(),
    behavior: z.string(),
    command: z.string(),
    roles: z.string(),
  })
  const defaultValues = {
    name: '',
    table: '',
    behavior: 'permissive',
    command: 'select',
    roles: '',
  }
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  // Customers on HIPAA plans should not have access to Supabase AI
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const [selectedSchemas] = useSchemasForAi(selectedProject?.ref!)

  // get entitiy (tables/views/materialized views/etc) definitions  to pass to AI Assistant
  const { data: entities } = useEntityDefinitionsQuery(
    {
      schemas: selectedSchemas,
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: true, refetchOnWindowFocus: false }
  )
  const entityDefinitions = entities?.map((def) => def.sql.trim())

  const { name, table, behavior, command, roles } = form.watch()
  const supportWithCheck = ['update', 'all'].includes(command)
  const isRenamingPolicy = selectedPolicy !== undefined && name !== selectedPolicy.name

  const { project } = useProjectContext()
  const { data } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const existingPolicies = (data ?? [])
    .filter((policy) => policy.schema === schema && policy.table === selectedTable)
    .sort((a, b) => a.name.localeCompare(b.name))

  const existingPolicyDefinition = existingPolicies
    .map((policy) => {
      const definition = generatePolicyDefinition(policy)
      return (
        definition
          .trim()
          .replace(/\s*;\s*$/, '')
          .replace(/\n\s*$/, '') + ';'
      )
    })
    .join('\n\n')

  const {
    messages: chatMessages,
    append,
    isLoading,
  } = useChat({
    id: chatId,
    api: `${BASE_PATH}/api/ai/sql/suggest`,
    body: {
      entityDefinitions: isOptedInToAI || !IS_PLATFORM ? entityDefinitions : undefined,
      existingPolicies,
      policyDefinition:
        selectedPolicy !== undefined ? generatePolicyDefinition(selectedPolicy) : undefined,
    },
  })

  const messages = useMemo(() => {
    const merged = [...debugThread, ...chatMessages.map((m) => ({ ...m, isDebug: false }))]

    return merged.sort(
      (a, b) =>
        (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) ||
        a.role.localeCompare(b.role)
    )
  }, [chatMessages, debugThread])

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: executeMutation, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async () => {
      // refresh all policies
      await queryClient.invalidateQueries(databasePoliciesKeys.list(ref))
      toast.success('Successfully created new policy')
      onSelectCancel()
    },
    onError: (error) => setError(error),
  })

  const { mutate: updatePolicy, isLoading: isUpdating } = useDatabasePolicyUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated policy')
      onSelectCancel()
    },
  })

  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()

  const acceptChange = useCallback(async () => {
    if (!incomingChange || !editorOneRef.current || !diffEditorRef.current) return

    const editorModel = editorOneRef.current.getModel()
    const diffModel = diffEditorRef.current.getModel()
    if (!editorModel || !diffModel) return

    const sql = diffModel.modified.getValue()

    // apply the incoming change in the editor directly so that Undo/Redo work properly
    editorOneRef.current.executeEdits('apply-ai-edit', [
      { text: sql, range: editorModel.getFullModelRange() },
    ])

    // remove the incoming change to revert to the original editor
    setIncomingChange(undefined)
  }, [incomingChange])

  const onClosingPanel = () => {
    const editorOneValue = editorOneRef.current?.getValue().trim() ?? null
    const editorOneFormattedValue = !editorOneValue ? null : editorOneValue
    const editorTwoValue = editorTwoRef.current?.getValue().trim() ?? null
    const editorTwoFormattedValue = !editorTwoValue ? null : editorTwoValue

    const policyCreateUnsaved =
      selectedPolicy === undefined &&
      (name.length > 0 || roles.length > 0 || editorOneFormattedValue || editorTwoFormattedValue)
    const policyUpdateUnsaved =
      selectedPolicy !== undefined
        ? checkIfPolicyHasChanged(selectedPolicy, {
            name,
            roles: roles.length === 0 ? ['public'] : roles.split(', '),
            definition: editorOneFormattedValue,
            check: command === 'INSERT' ? editorOneFormattedValue : editorTwoFormattedValue,
          })
        : false

    if (policyCreateUnsaved || policyUpdateUnsaved || messages.length > 0) {
      setIsClosingPolicyEditorPanel(true)
    } else {
      onSelectCancel()
      setEditView(null)
    }
  }

  const onSelectDebug = async () => {
    const policy = editorOneRef.current?.getValue().replaceAll('\n', ' ').replaceAll('  ', ' ')
    if (error === undefined || policy === undefined) return

    setAssistantPanel(true)
    const messageId = uuidv4()

    const assistantMessageBefore = generateThreadMessage({
      id: messageId,
      content: 'Thinking...',
      isDebug: true,
    })
    setDebugThread([...debugThread, assistantMessageBefore])

    const { solution, sql } = await debugSql({
      sql: policy.trim(),
      errorMessage: error.message,
      entityDefinitions,
    })

    const assistantMessageAfter = generateThreadMessage({
      id: messageId,
      content: `${solution}\n\`\`\`sql\n${sql}\n\`\`\``,
      isDebug: true,
    })
    const cleanedMessages = uniqBy([...debugThread, assistantMessageAfter], (m) => m.id)

    setDebugThread(cleanedMessages)
  }

  const updateEditorWithCheckForDiff = (value: { id: string; content: string }) => {
    const editorModel = editorOneRef.current?.getModel()
    if (!editorModel) return

    const existingValue = editorOneRef.current?.getValue() ?? ''
    if (existingValue.length === 0) {
      editorOneRef.current?.executeEdits('apply-template', [
        {
          text: value.content,
          range: editorModel.getFullModelRange(),
        },
      ])
    } else {
      setSelectedDiff(value.id)
      setIncomingChange(value.content)
    }
  }

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const { name, table, behavior, command, roles } = data
    let using = editorOneRef.current?.getValue().trim() ?? undefined
    let check = editorTwoRef.current?.getValue().trim()

    // [Terry] b/c editorOneRef will be the check statement in this scenario
    if (command === 'insert') {
      check = using
    }

    if (command === 'insert' && (check === undefined || check.length === 0)) {
      return setFieldError('Please provide a SQL expression for the WITH CHECK statement')
    } else if (command !== 'insert' && (using === undefined || using.length === 0)) {
      return setFieldError('Please provide a SQL expression for the USING statement')
    } else {
      setFieldError(undefined)
    }

    if (selectedPolicy === undefined) {
      const sql = generateCreatePolicyQuery({
        name: name,
        schema,
        table,
        behavior,
        command,
        roles: roles.length === 0 ? 'public' : roles,
        using: using ?? '',
        check: command === 'insert' ? using ?? '' : check ?? '',
      })

      setError(undefined)
      executeMutation({
        sql,
        projectRef: selectedProject?.ref,
        connectionString: selectedProject?.connectionString,
        handleError: (error) => {
          throw error
        },
      })
    } else if (selectedProject !== undefined) {
      const payload: {
        name?: string
        definition?: string
        check?: string
        roles?: string[]
      } = {}
      const updatedRoles = roles.length === 0 ? ['public'] : roles.split(', ')

      if (name !== selectedPolicy.name) payload.name = name
      if (!isEqual(selectedPolicy.roles, updatedRoles)) payload.roles = updatedRoles
      if (selectedPolicy.definition !== null && selectedPolicy.definition !== using)
        payload.definition = using

      if (selectedPolicy.command === 'INSERT') {
        // [Joshen] Cause editorOneRef will be the check statement in this scenario
        if (selectedPolicy.check !== null && selectedPolicy.check !== using) payload.check = using
      } else {
        if (selectedPolicy.check !== null && selectedPolicy.check !== check) payload.check = check
      }

      if (Object.keys(payload).length === 0) return onSelectCancel()

      updatePolicy({
        id: selectedPolicy.id,
        projectRef: selectedProject.ref,
        connectionString: selectedProject?.connectionString,
        payload,
      })
    }
  }

  const clearHistory = () => {
    setChatId(uuidv4())
  }

  // when the panel is closed, reset all values
  useEffect(() => {
    if (!visible) {
      editorOneRef.current?.setValue('')
      editorTwoRef.current?.setValue('')
      setIncomingChange(undefined)
      setAssistantPanel(false)
      setIsClosingPolicyEditorPanel(false)
      setError(undefined)
      setDebugThread([])
      setChatId(uuidv4())
      setShowDetails(false)
      setSelectedDiff(undefined)

      setUsing('')
      setCheck('')
      setShowCheckBlock(false)
      setFieldError(undefined)

      form.reset(defaultValues)
    } else {
      if (canUpdatePolicies) setAssistantPanel(true)
      if (selectedPolicy !== undefined) {
        const { name, action, table, command, roles } = selectedPolicy
        form.reset({
          name,
          table,
          behavior: action.toLowerCase(),
          command: command.toLowerCase(),
          roles: roles.length === 1 && roles[0] === 'public' ? '' : roles.join(', '),
        })
        if (selectedPolicy.definition) setUsing(`  ${selectedPolicy.definition}`)
        if (selectedPolicy.check) setCheck(`  ${selectedPolicy.check}`)
        if (selectedPolicy.check && selectedPolicy.command !== 'INSERT') {
          setShowCheckBlock(true)
        }
      } else if (selectedTable !== undefined) {
        form.reset({ ...defaultValues, table: selectedTable })
      }
    }
  }, [visible])

  // whenever the deps (current policy details, new error or error panel opens) change, recalculate
  // the height of the editor
  useEffect(() => {
    editorOneRef.current?.layout({ width: 0, height: 0 })
    window.requestAnimationFrame(() => {
      editorOneRef.current?.layout()
    })
  }, [showDetails, error, errorPanelOpen])

  // update tabId when the editView changes
  useEffect(() => {
    editView === 'conversation' ? setTabId('conversation') : setTabId('templates')
  }, [editView])

  return (
    <>
      <Form_Shadcn_ {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          <Sheet open={visible} onOpenChange={() => onClosingPanel()}>
            <SheetContent
              showClose={false}
              size={assistantVisible ? 'lg' : 'default'}
              className={cn(
                'bg-surface-200',
                'p-0 flex flex-row gap-0',
                assistantVisible ? '!min-w-[1000px]' : '!min-w-[600px]'
              )}
            >
              <div className={cn('flex flex-col grow w-full', assistantVisible && 'w-[60%]')}>
                <AIPolicyHeader
                  selectedPolicy={selectedPolicy}
                  assistantVisible={assistantVisible}
                  setAssistantVisible={setAssistantPanel}
                />

                <div className="flex flex-col h-full w-full justify-between overflow-y-auto">
                  {incomingChange ? (
                    <div className="px-5 py-3 flex justify-between gap-3 bg-surface-75">
                      <div className="flex gap-2 items-center text-foreground-light">
                        <FileDiff className="h-4 w-4" />
                        <span className="text-sm">Accept changes from assistant</span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="default"
                          onClick={() => {
                            setIncomingChange(undefined)
                            setSelectedDiff(undefined)
                            sendEvent({
                              category: 'rls_editor',
                              action: 'ai_suggestion_discarded',
                              label: 'rls-ai-assistant',
                            })
                          }}
                        >
                          Discard
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => {
                            acceptChange()
                            setSelectedDiff(undefined)
                            sendEvent({
                              category: 'rls_editor',
                              action: 'ai_suggestion_accepted',
                              label: 'rls-ai-assistant',
                            })
                          }}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {incomingChange ? (
                    <DiffEditor
                      theme="supabase"
                      language="pgsql"
                      className="grow"
                      original={editorOneRef.current?.getValue()}
                      modified={incomingChange}
                      onMount={(editor) => (diffEditorRef.current = editor)}
                      options={{
                        wordWrap: 'on',
                        renderSideBySide: false,
                        scrollBeyondLastLine: false,
                        renderOverviewRuler: false,
                        renderLineHighlight: 'none',
                        minimap: { enabled: false },
                        occurrencesHighlight: false,
                        folding: false,
                        selectionHighlight: false,
                        lineHeight: 20,
                        padding: { top: 10, bottom: 10 },
                      }}
                    />
                  ) : null}

                  {/* which left side editor to show in the sheet  */}
                  {editView === 'conversation' ? (
                    <div className={`relative h-full ${incomingChange ? 'hidden' : 'block'}`}>
                      <RLSCodeEditor
                        id="rls-sql-policy"
                        defaultValue={''}
                        value={existingPolicyDefinition}
                        placeholder={placeholder}
                        editorRef={editorOneRef}
                        editView={editView as 'templates' | 'conversation'} // someone help
                      />
                    </div>
                  ) : (
                    <>
                      <PolicyDetailsV2
                        schema={schema}
                        searchString={searchString}
                        selectedTable={selectedTable}
                        isEditing={selectedPolicy !== undefined}
                        form={form}
                        onUpdateCommand={(command: string) => {
                          setFieldError(undefined)
                          if (!['update', 'all'].includes(command)) {
                            setShowCheckBlock(false)
                          } else {
                            setShowCheckBlock(true)
                          }
                        }}
                        authContext={authContext}
                      />
                      <div className="h-full">
                        <LockedCreateQuerySection
                          schema={schema}
                          selectedPolicy={selectedPolicy}
                          formFields={{ name, table, behavior, command, roles }}
                        />

                        <div
                          className={`mt-1 relative ${incomingChange ? 'hidden' : 'block'}`}
                          style={{
                            height:
                              expOneContentHeight <= 100 ? `${8 + expOneContentHeight}px` : '108px',
                          }}
                        >
                          <RLSCodeEditor
                            disableTabToUsePlaceholder
                            readOnly={!canUpdatePolicies}
                            id="rls-exp-one-editor"
                            editView={editView as 'templates' | 'conversation'} // someone help
                            placeholder={
                              command === 'insert'
                                ? '-- Provide a SQL expression for the with check statement'
                                : '-- Provide a SQL expression for the using statement'
                            }
                            defaultValue={command === 'insert' ? check : using}
                            value={command === 'insert' ? check : using}
                            editorRef={editorOneRef}
                            monacoRef={monacoOneRef as any}
                            lineNumberStart={6}
                            onChange={() => {
                              setExpOneContentHeight(editorOneRef.current?.getContentHeight() ?? 0)
                              setExpOneLineCount(
                                editorOneRef.current?.getModel()?.getLineCount() ?? 1
                              )
                            }}
                            onMount={() => {
                              setTimeout(() => {
                                setExpOneContentHeight(
                                  editorOneRef.current?.getContentHeight() ?? 0
                                )
                                setExpOneLineCount(
                                  editorOneRef.current?.getModel()?.getLineCount() ?? 1
                                )
                              }, 200)
                            }}
                          />
                        </div>

                        <div className="bg-surface-300 py-1">
                          <div className="flex items-center" style={{ fontSize: '14px' }}>
                            <div className="w-[57px]">
                              <p className="w-[31px] flex justify-end font-mono text-sm text-foreground-light select-none">
                                {7 + expOneLineCount}
                              </p>
                            </div>
                            <p className="font-mono tracking-tighter">
                              {showCheckBlock ? (
                                <>
                                  <span className="text-[#569cd6]">with check</span>{' '}
                                  <span className="text-[#ffd700]">(</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[#ffd700]">)</span>;
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {showCheckBlock && (
                          <>
                            <div
                              className={`mt-1 min-h-[28px] relative ${incomingChange ? 'hidden' : 'block'}`}
                              style={{
                                height:
                                  expTwoContentHeight <= 100
                                    ? `${8 + expTwoContentHeight}px`
                                    : '108px',
                              }}
                            >
                              <RLSCodeEditor
                                disableTabToUsePlaceholder
                                readOnly={!canUpdatePolicies}
                                id="rls-exp-two-editor"
                                placeholder="-- Provide a SQL expression for the with check statement"
                                defaultValue={check}
                                value={check}
                                editorRef={editorTwoRef}
                                monacoRef={monacoTwoRef as any}
                                lineNumberStart={7 + expOneLineCount}
                                editView={editView as 'templates' | 'conversation'} // someone help
                                onChange={() => {
                                  setExpTwoContentHeight(
                                    editorTwoRef.current?.getContentHeight() ?? 0
                                  )
                                  setExpTwoLineCount(
                                    editorTwoRef.current?.getModel()?.getLineCount() ?? 1
                                  )
                                }}
                                onMount={() => {
                                  setTimeout(() => {
                                    setExpTwoContentHeight(
                                      editorTwoRef.current?.getContentHeight() ?? 0
                                    )
                                    setExpTwoLineCount(
                                      editorTwoRef.current?.getModel()?.getLineCount() ?? 1
                                    )
                                  }, 200)
                                }}
                              />
                            </div>
                            <div className="bg-surface-300 py-1">
                              <div className="flex items-center" style={{ fontSize: '14px' }}>
                                <div className="w-[57px]">
                                  <p className="w-[31px] flex justify-end font-mono text-sm text-foreground-light select-none">
                                    {8 + expOneLineCount + expTwoLineCount}
                                  </p>
                                </div>
                                <p className="font-mono tracking-tighter">
                                  <span className="text-[#ffd700]">)</span>;
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                        {isRenamingPolicy && (
                          <LockedRenameQuerySection
                            oldName={selectedPolicy.name}
                            newName={name}
                            schema={schema}
                            table={table}
                            lineNumber={
                              8 + expOneLineCount + (showCheckBlock ? expTwoLineCount : 0)
                            }
                          />
                        )}

                        {fieldError !== undefined && (
                          <p className="px-5 py-2 pb-0 text-sm text-red-900">{fieldError}</p>
                        )}

                        {supportWithCheck && (
                          <div className="px-5 py-3 flex items-center gap-x-2">
                            <Checkbox_Shadcn_
                              id="use-check"
                              name="use-check"
                              checked={showCheckBlock}
                              onCheckedChange={() => {
                                setFieldError(undefined)
                                setShowCheckBlock(!showCheckBlock)
                              }}
                            />
                            <Label_Shadcn_ className="text-xs cursor-pointer" htmlFor="use-check">
                              Use check expression
                            </Label_Shadcn_>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex flex-col">
                    {error !== undefined && (
                      <QueryError
                        error={error}
                        onSelectDebug={() => {
                          setTabId('conversation')
                          onSelectDebug()
                        }}
                        open={errorPanelOpen}
                        setOpen={setErrorPanelOpen}
                      />
                    )}
                    <SheetFooter className="flex items-center !justify-end px-5 py-4 w-full border-t">
                      <Button
                        type="default"
                        disabled={isExecuting || isUpdating}
                        onClick={() => onClosingPanel()}
                      >
                        Cancel
                      </Button>

                      <ButtonTooltip
                        form={formId}
                        htmlType="submit"
                        loading={isExecuting || isUpdating}
                        disabled={
                          !canUpdatePolicies ||
                          isExecuting ||
                          isUpdating ||
                          incomingChange !== undefined
                        }
                        onClick={() => {
                          if (editView === 'conversation') {
                            const sql = editorOneRef.current?.getValue().trim()
                            if (!sql) return onSelectCancel()
                            executeMutation({
                              sql: sql,
                              projectRef: selectedProject?.ref,
                              connectionString: selectedProject?.connectionString,
                              handleError: (error) => {
                                throw error
                              },
                            })
                          }
                        }}
                        tooltip={{
                          content: {
                            side: 'top',
                            text: !canUpdatePolicies
                              ? 'You need additional permissions to update policies'
                              : undefined,
                          },
                        }}
                      >
                        Save policy
                      </ButtonTooltip>
                    </SheetFooter>
                  </div>
                </div>
              </div>
              {assistantVisible && (
                <div
                  className={cn(
                    'border-l shadow-[rgba(0,0,0,0.13)_-4px_0px_6px_0px] z-10',
                    assistantVisible && 'w-[50%]',
                    'bg-studio overflow-auto'
                  )}
                >
                  <Tabs_Shadcn_
                    value={tabId}
                    defaultValue="templates"
                    className="flex flex-col h-full w-full"
                  >
                    <TabsList_Shadcn_ className="flex gap-4 px-content pt-2">
                      {editView === 'templates' && (
                        <TabsTrigger_Shadcn_
                          key="templates"
                          value="templates"
                          onClick={() => setTabId('templates')}
                          className="px-0 data-[state=active]:bg-transparent"
                        >
                          Templates
                        </TabsTrigger_Shadcn_>
                      )}

                      {editView === 'conversation' && !hasHipaaAddon && (
                        <TabsTrigger_Shadcn_
                          key="conversation"
                          value="conversation"
                          onClick={() => setTabId('conversation')}
                          className="px-0 data-[state=active]:bg-transparent"
                        >
                          Assistant
                        </TabsTrigger_Shadcn_>
                      )}
                    </TabsList_Shadcn_>

                    {editView === 'templates' && (
                      <TabsContent_Shadcn_
                        value="templates"
                        className={cn(
                          '!mt-0 overflow-y-auto',
                          'data-[state=active]:flex data-[state=active]:grow'
                        )}
                      >
                        <ScrollArea className="h-full w-full">
                          <PolicyTemplates
                            schema={schema}
                            table={table}
                            selectedPolicy={selectedPolicy}
                            selectedTemplate={selectedDiff}
                            onSelectTemplate={(value) => {
                              form.setValue('name', value.name)
                              form.setValue('behavior', 'permissive')
                              form.setValue('command', value.command.toLowerCase())
                              form.setValue('roles', value.roles.join(', ') ?? '')

                              setUsing(`  ${value.definition}`)
                              setCheck(`  ${value.check}`)
                              setExpOneLineCount(1)
                              setExpTwoLineCount(1)
                              setFieldError(undefined)

                              if (!['update', 'all'].includes(value.command.toLowerCase())) {
                                setShowCheckBlock(false)
                              } else if (value.check.length > 0) {
                                setShowCheckBlock(true)
                              } else {
                                setShowCheckBlock(false)
                              }
                            }}
                          />
                        </ScrollArea>
                      </TabsContent_Shadcn_>
                    )}

                    <TabsContent_Shadcn_
                      value="conversation"
                      className="flex grow !mt-0 overflow-y-auto"
                    >
                      <AIPolicyChat
                        selectedTable={selectedTable!}
                        messages={messages}
                        selectedMessage={selectedDiff}
                        onSubmit={(message) =>
                          append({
                            content: message,
                            role: 'user',
                            createdAt: new Date(),
                          })
                        }
                        onDiff={updateEditorWithCheckForDiff}
                        loading={isLoading || isDebugSqlLoading}
                        clearHistory={clearHistory}
                      />
                    </TabsContent_Shadcn_>
                  </Tabs_Shadcn_>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </form>
      </Form_Shadcn_>

      <ConfirmationModal
        visible={isClosingPolicyEditorPanel}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => {
          setIsClosingPolicyEditorPanel(false)
        }}
        onConfirm={() => {
          onSelectCancel()
          setIsClosingPolicyEditorPanel(false)
          setEditView(null)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to close the editor? Any unsaved changes on your policy and
          conversations with the Assistant will be lost.
        </p>
      </ConfirmationModal>
    </>
  )
})

AIPolicyEditorPanel.displayName = 'AIPolicyEditorPanel'
