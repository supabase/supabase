import { zodResolver } from '@hookform/resolvers/zod'
import type { PostgresPolicy } from '@supabase/postgres-meta'
import { useQueryClient } from '@tanstack/react-query'
import { useChat } from 'ai/react'
import { useParams, useTelemetryProps } from 'common'
import { uniqBy } from 'lodash'
import { FileDiff } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  IconLock,
  Modal,
  ScrollArea,
  SheetContent_Shadcn_,
  SheetFooter_Shadcn_,
  Sheet_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import * as z from 'zod'

import { Monaco } from '@monaco-editor/react'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import {
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
} from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import { BASE_PATH, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import Telemetry from 'lib/telemetry'
import { useAppStateSnapshot } from 'state/app-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { AIPolicyChat } from './AIPolicyChat'
import {
  MessageWithDebug,
  generatePolicyDefinition,
  generateThreadMessage,
} from './AIPolicyEditorPanel.utils'
import { AIPolicyHeader } from './AIPolicyHeader'
import PolicyDetails from './PolicyDetails'
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
  selectedPolicy?: PostgresPolicy
  onSelectCancel: () => void
}

/**
 * Using memo for this component because everything rerenders on window focus because of outside fetches
 */
export const AIPolicyEditorPanel = memo(function ({
  visible,
  selectedPolicy,
  onSelectCancel,
}: AIPolicyEditorPanelProps) {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const router = useRouter()
  const snap = useAppStateSnapshot()
  const state = useTableEditorStateSnapshot()
  const telemetryProps = useTelemetryProps()

  // [Joshen] Hyrid form fields, just spit balling to get a decent POC out
  const [using, setUsing] = useState('')
  const [check, setCheck] = useState('')
  const [showCheckBlock, setShowCheckBlock] = useState(false)

  const monacoOneRef = useRef<Monaco | null>(null)
  const editorOneRef = useRef<IStandaloneCodeEditor | null>(null)
  const [expOneLineCount, setExpOneLineCount] = useState(1)

  const monacoTwoRef = useRef<Monaco | null>(null)
  const editorTwoRef = useRef<IStandaloneCodeEditor | null>(null)
  const [expTwoLineCount, setExpTwoLineCount] = useState(1)

  // use chat id because useChat doesn't have a reset function to clear all messages
  const [chatId, setChatId] = useState(uuidv4())

  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)
  const isTogglingPreviewRef = useRef<boolean>(false)
  // const placeholder = generatePlaceholder(selectedPolicy)
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const [error, setError] = useState<QueryResponseError>()
  const [errorPanelOpen, setErrorPanelOpen] = useState<boolean>(true)
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [selectedDiff, setSelectedDiff] = useState<string>()
  // [Joshen] Separate state here as there's a delay between submitting and the API updating the loading status
  const [debugThread, setDebugThread] = useState<MessageWithDebug[]>([])
  const [assistantVisible, setAssistantPanel] = useState<boolean>(false)
  const [isAssistantChatInputEmpty, setIsAssistantChatInputEmpty] = useState<boolean>(true)
  const [incomingChange, setIncomingChange] = useState<string | undefined>(undefined)
  // Used for confirmation when closing the panel with unsaved changes
  const [isClosingPolicyEditorPanel, setIsClosingPolicyEditorPanel] = useState<boolean>(false)

  const formId = 'rls-editor'
  const FormSchema = z.object({
    name: z.string(),
    table: z.string(),
    behaviour: z.string(),
    command: z.string(),
    roles: z.string(),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', table: '', behaviour: 'permissive', command: 'select', roles: '' },
  })

  // Customers on HIPAA plans should not have access to Supabase AI
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { data: entities } = useEntityDefinitionsQuery(
    {
      projectRef: selectedProject?.ref,
      connectionString: selectedProject?.connectionString,
    },
    { enabled: true, refetchOnWindowFocus: false }
  )

  const entityDefinitions = entities?.map((def) => def.sql.trim())

  const {
    messages: chatMessages,
    append,
    isLoading,
  } = useChat({
    id: chatId,
    api: `${BASE_PATH}/api/ai/sql/suggest`,
    body: {
      entityDefinitions: isOptedInToAI ? entityDefinitions : undefined,
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

  const { mutate: executeMutation, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: () => {
      // refresh all policies
      queryClient.invalidateQueries(databasePoliciesKeys.list(ref))
      toast.success('Successfully created new policy')
      onSelectCancel()
    },
    onError: (error) => {
      console.log({ error })
      setError(error)
    },
  })

  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()

  // const onExecuteSQL = useCallback(() => {
  //   // clean up the sql before sending
  //   const policy = editorOneRef.current?.getValue().replaceAll('  ', ' ')

<<<<<<< HEAD
  //   if (policy) {
  //     setError(undefined)
  //     executeMutation({
  //       sql: policy,
  //       projectRef: selectedProject?.ref,
  //       connectionString: selectedProject?.connectionString,
  //     })
  //   }
  // }, [executeMutation, selectedProject?.connectionString, selectedProject?.ref])
=======
    if (policy) {
      setError(undefined)
      executeMutation({
        sql: policy,
        projectRef: selectedProject?.ref,
        connectionString: selectedProject?.connectionString,
        handleError: (error) => {
          throw error
        },
      })
    }
  }, [executeMutation, selectedProject?.connectionString, selectedProject?.ref])
>>>>>>> master

  const acceptChange = useCallback(async () => {
    if (!incomingChange) {
      return
    }

    if (!editorOneRef.current || !diffEditorRef.current) {
      return
    }

    const editorModel = editorOneRef.current.getModel()
    const diffModel = diffEditorRef.current.getModel()

    if (!editorModel || !diffModel) {
      return
    }

    const sql = diffModel.modified.getValue()

    // apply the incoming change in the editor directly so that Undo/Redo work properly
    editorOneRef.current.executeEdits('apply-ai-edit', [
      {
        text: sql,
        range: editorModel.getFullModelRange(),
      },
    ])

    // remove the incoming change to revert to the original editor
    setIncomingChange(undefined)
  }, [incomingChange])

  const toggleFeaturePreviewModal = () => {
    isTogglingPreviewRef.current = true
    onClosingPanel()
  }

  const onClosingPanel = () => {
    const policy = editorOneRef.current?.getValue()
    if (policy || messages.length > 0 || !isAssistantChatInputEmpty) {
      setIsClosingPolicyEditorPanel(true)
    } else {
      if (isTogglingPreviewRef.current) {
        snap.setSelectedFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT)
        snap.setShowFeaturePreviewModal(!snap.showFeaturePreviewModal)
      }
      onSelectCancel()
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
    const { name, table, behaviour, command, roles } = data
    const using = editorOneRef.current?.getValue() ?? undefined
    const check = editorTwoRef.current?.getValue() ?? undefined
    const sql = generateQuery({
      name: name,
      schema: state.selectedSchemaName,
      table,
      behaviour,
      command,
      roles: roles.length === 0 ? 'public' : roles,
      using: using?.trim(),
      check: command === 'insert' ? using?.trim() : check?.trim(),
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
  }

  const generateQuery = ({
    name,
    schema,
    table,
    behaviour,
    command,
    roles,
    using,
    check,
  }: {
    name: string
    schema: string
    table: string
    behaviour: string
    command: string
    roles: string
    using?: string
    check?: string
  }) => {
    const querySkeleton = `create policy "${name}" on "${schema}"."${table}" as ${behaviour} for ${command} to ${roles}`
    const query =
      command === 'insert'
        ? `${querySkeleton} with check (${check});`
        : `${querySkeleton} using (${using})${(check ?? '').length > 0 ? `with check (${check});` : ';'}`
    return query
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

      form.reset()
    } else {
      setAssistantPanel(true)
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

  const { name, table, behaviour, command, roles } = form.watch()
  const supportWithCheck = ['update', 'all'].includes(command)

  return (
    <>
      <Form_Shadcn_ {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          <Sheet_Shadcn_ open={visible} onOpenChange={() => onClosingPanel()}>
            <SheetContent_Shadcn_
              size={assistantVisible ? 'lg' : 'default'}
              className={cn(
                'bg-surface-200',
                'p-0 flex flex-row gap-0',
                assistantVisible ? '!min-w-[1200px]' : '!min-w-[600px]'
              )}
            >
              <div className={cn('flex flex-col grow w-full', assistantVisible && 'w-[60%]')}>
                <AIPolicyHeader
                  selectedPolicy={selectedPolicy}
                  assistantVisible={assistantVisible}
                  setAssistantVisible={setAssistantPanel}
                />

                <PolicyDetails
                  policy={selectedPolicy}
                  showDetails={showDetails}
                  toggleShowDetails={() => setShowDetails(!showDetails)}
                />

                <div className="flex flex-col h-full w-full justify-between">
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
                            Telemetry.sendEvent(
                              {
                                category: 'rls_editor',
                                action: 'ai_suggestion_discarded',
                                label: 'rls-ai-assistant',
                              },
                              telemetryProps,
                              router
                            )
                          }}
                        >
                          Discard
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => {
                            acceptChange()
                            setSelectedDiff(undefined)
                            Telemetry.sendEvent(
                              {
                                category: 'rls_editor',
                                action: 'ai_suggestion_accepted',
                                label: 'rls-ai-assistant',
                              },
                              telemetryProps,
                              router
                            )
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

                  <PolicyDetailsV2 form={form} />

                  {/* [Joshen] Opting for this way to prevent forced re-rendering of monaco whenever field input changes  */}
                  <div className="h-full">
                    <div className="bg-surface-300 pt-2 pb-1">
                      <div className="flex items-center justify-between px-5 mb-1">
                        <div className="flex items-center">
                          <div className="pl-0.5 pr-5 flex items-center justify-center">
                            <IconLock size={14} className="text-foreground-lighter" />
                          </div>
                          <p className="text-xs text-foreground-lighter font-mono uppercase">
                            Use options above to edit
                          </p>
                        </div>
                        <Button
                          type="default"
                          onClick={() =>
                            router.push(
                              `/project/${ref}/sql/new?content=${generateQuery({
                                name,
                                schema: state.selectedSchemaName,
                                table,
                                behaviour,
                                command,
                                roles: roles.length === 0 ? 'public' : roles,
                                using: (editorOneRef.current?.getValue() ?? undefined)?.trim(),
                                check:
                                  command === 'insert'
                                    ? (editorOneRef.current?.getValue() ?? undefined)?.trim()
                                    : (editorTwoRef.current?.getValue() ?? undefined)?.trim(),
                              })}`
                            )
                          }
                        >
                          Open in SQL Editor
                        </Button>
                      </div>
                      <div className="flex items-center" style={{ fontSize: '14px' }}>
                        <p className="px-6 font-mono text-sm text-foreground-light select-none">
                          1
                        </p>
                        <p className="font-mono tracking-tighter">
                          <span className="text-[#569cd6]">CREATE</span> POLICY "
                          {name.length === 0 ? 'policy_name' : name}"
                        </p>
                      </div>
                      <div className="flex items-center" style={{ fontSize: '14px' }}>
                        <p className="px-6 font-mono text-sm text-foreground-light select-none">
                          2
                        </p>
                        <p className="font-mono tracking-tighter">
                          <span className="text-[#569cd6]">ON</span> "{state.selectedSchemaName}"."
                          {table}"
                        </p>
                      </div>
                      <div className="flex items-center" style={{ fontSize: '14px' }}>
                        <p className="px-6 font-mono text-sm text-foreground-light select-none">
                          3
                        </p>
                        <p className="font-mono tracking-tighter">
                          <span className="text-[#569cd6]">AS</span> {behaviour.toLocaleUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center" style={{ fontSize: '14px' }}>
                        <p className="px-6 font-mono text-sm text-foreground-light select-none">
                          4
                        </p>
                        <p className="font-mono tracking-tighter">
                          <span className="text-[#569cd6]">FOR</span> {command.toLocaleUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center" style={{ fontSize: '14px' }}>
                        <p className="px-6 font-mono text-sm text-foreground-light select-none">
                          5
                        </p>
                        <p className="font-mono tracking-tighter">
                          <span className="text-[#569cd6]">TO</span>{' '}
                          {roles.length === 0 ? 'public' : roles}
                        </p>
                      </div>
                      <div className="flex items-center" style={{ fontSize: '14px' }}>
                        <p className="px-6 font-mono text-sm text-foreground-light select-none">
                          6
                        </p>
                        <p className="font-mono tracking-tighter">
                          <span className="text-[#569cd6]">
                            {command === 'insert' ? 'WITH CHECK' : 'USING'}
                          </span>{' '}
                          <span className="text-[#ffd700]">(</span>
                        </p>
                      </div>
                    </div>

                    <div
                      className={`py-1 relative ${incomingChange ? 'hidden' : 'block'}`}
                      style={{
                        height: expOneLineCount <= 5 ? `${8 + expOneLineCount * 20}px` : '108px',
                      }}
                    >
                      <RLSCodeEditor
                        id="rls-exp-one-editor"
                        defaultValue={command === 'insert' ? check : using}
                        value={command === 'insert' ? check : using}
                        editorRef={editorOneRef}
                        monacoRef={monacoOneRef as any}
                        lineNumberStart={6}
                        onChange={() => {
                          setExpOneLineCount(editorOneRef.current?.getModel()?.getLineCount() ?? 1)
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
                              <span className="text-[#569cd6]">WITH CHECK</span>{' '}
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
                          className={`py-1 relative ${incomingChange ? 'hidden' : 'block'}`}
                          style={{
                            height:
                              expTwoLineCount <= 5 ? `${8 + expTwoLineCount * 20}px` : '108px',
                          }}
                        >
                          <RLSCodeEditor
                            id="rls-exp-two-editor"
                            defaultValue={check}
                            value={check}
                            editorRef={editorTwoRef}
                            monacoRef={monacoTwoRef as any}
                            lineNumberStart={7 + expOneLineCount}
                            onChange={() => {
                              setExpTwoLineCount(
                                editorTwoRef.current?.getModel()?.getLineCount() ?? 1
                              )
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

                    {supportWithCheck && (
                      <div className="px-5 py-3 flex items-center gap-x-2">
                        <Checkbox_Shadcn_
                          checked={showCheckBlock}
                          onCheckedChange={() => setShowCheckBlock(!showCheckBlock)}
                        />
                        <p className="text-xs">Use check expression</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    {error !== undefined && (
                      <QueryError
                        error={error}
                        onSelectDebug={onSelectDebug}
                        open={errorPanelOpen}
                        setOpen={setErrorPanelOpen}
                      />
                    )}
                    <SheetFooter_Shadcn_ className="flex items-center !justify-between px-5 py-4 w-full border-t">
                      <Button type="text" onClick={toggleFeaturePreviewModal}>
                        Toggle feature preview
                      </Button>
                      <div className="flex items-center gap-x-2">
                        <Button
                          type="default"
                          disabled={isExecuting}
                          onClick={() => onSelectCancel()}
                        >
                          Cancel
                        </Button>
                        <Button
                          form={formId}
                          htmlType="submit"
                          loading={isExecuting}
                          disabled={isExecuting || incomingChange !== undefined}
                          // onClick={() => onExecuteSQL()}
                        >
                          Save policy
                        </Button>
                      </div>
                    </SheetFooter_Shadcn_>
                  </div>
                </div>
              </div>
              {assistantVisible && (
                <div
                  className={cn(
                    'border-l shadow-[rgba(0,0,0,0.13)_-4px_0px_6px_0px] z-10',
                    assistantVisible && 'w-[50%]',
                    'bg-studio'
                  )}
                >
                  <Tabs_Shadcn_ defaultValue="templates" className="flex flex-col h-full w-full">
                    <TabsList_Shadcn_ className="flex gap-4 px-content pt-2">
                      <TabsTrigger_Shadcn_
                        key="templates"
                        value="templates"
                        className="px-0 data-[state=active]:bg-transparent"
                      >
                        Templates
                      </TabsTrigger_Shadcn_>
                      {!hasHipaaAddon && (
                        <TabsTrigger_Shadcn_
                          key="conversation"
                          value="conversation"
                          className="px-0 data-[state=active]:bg-transparent"
                        >
                          Assistant
                        </TabsTrigger_Shadcn_>
                      )}
                    </TabsList_Shadcn_>
                    <TabsContent_Shadcn_
                      value="templates"
                      className={cn(
                        '!mt-0 overflow-y-auto',
                        'data-[state=active]:flex data-[state=active]:grow'
                      )}
                    >
                      <ScrollArea className="h-full w-full">
                        <PolicyTemplates
                          selectedTemplate={selectedDiff}
                          onSelectTemplate={(value) => {
                            form.setValue('name', value.name)
                            form.setValue('behaviour', 'permissive')
                            form.setValue('command', value.command.toLowerCase())
                            form.setValue('roles', value.roles.join(', ') ?? '')

                            setUsing(`  ${value.definition}`)
                            setCheck(`  ${value.check}`)
                            setExpOneLineCount(1)
                            setExpTwoLineCount(1)

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
                    <TabsContent_Shadcn_
                      value="conversation"
                      className="flex grow !mt-0 overflow-y-auto"
                    >
                      <AIPolicyChat
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
                        onChange={setIsAssistantChatInputEmpty}
                        loading={isLoading || isDebugSqlLoading}
                      />
                    </TabsContent_Shadcn_>
                  </Tabs_Shadcn_>
                </div>
              )}
            </SheetContent_Shadcn_>
          </Sheet_Shadcn_>
        </form>
      </Form_Shadcn_>

      <ConfirmationModal
        visible={isClosingPolicyEditorPanel}
        header="Discard changes"
        buttonLabel="Discard"
        onSelectCancel={() => {
          isTogglingPreviewRef.current = false
          setIsClosingPolicyEditorPanel(false)
        }}
        onSelectConfirm={() => {
          if (isTogglingPreviewRef.current) {
            snap.setSelectedFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT)
            snap.setShowFeaturePreviewModal(!snap.showFeaturePreviewModal)
          }
          onSelectCancel()
          isTogglingPreviewRef.current = false
          setIsClosingPolicyEditorPanel(false)
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            Are you sure you want to close the editor? Any unsaved changes on your policy and
            conversations with the Assistant will be lost.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
})

AIPolicyEditorPanel.displayName = 'AIPolicyEditorPanel'
