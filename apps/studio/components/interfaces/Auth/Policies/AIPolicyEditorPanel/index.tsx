import { PostgresPolicy } from '@supabase/postgres-meta'
import { useQueryClient } from '@tanstack/react-query'
import { useChat } from 'ai/react'
import { useParams } from 'common'
import { uniqBy } from 'lodash'
import { FileDiff } from 'lucide-react'
import dynamic from 'next/dynamic'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Modal, SheetContent_Shadcn_, SheetFooter_Shadcn_, Sheet_Shadcn_, cn } from 'ui'

import {
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
} from 'components/interfaces/SQLEditor/SQLEditor.types'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useSqlDebugMutation } from 'data/ai/sql-debug-mutation'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { useEntityDefinitionsQuery } from 'data/database/entity-definitions-query'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import { BASE_PATH, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { uuidv4 } from 'lib/helpers'
import { AIPolicyChat } from './AIPolicyChat'
import {
  MessageWithDebug,
  generatePlaceholder,
  generatePolicyDefinition,
  generateThreadMessage,
} from './AIPolicyEditorPanel.utils'
import { AIPolicyHeader } from './AIPolicyHeader'
import PolicyDetails from './PolicyDetails'
import QueryError from './QueryError'
import RLSCodeEditor from './RLSCodeEditor'
import Telemetry from 'lib/telemetry'
import { useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { useAppStateSnapshot } from 'state/app-state'

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
  const telemetryProps = useTelemetryProps()

  // use chat id because useChat doesn't have a reset function to clear all messages
  const [chatId, setChatId] = useState(uuidv4())
  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const diffEditorRef = useRef<IStandaloneDiffEditor | null>(null)
  const placeholder = generatePlaceholder(selectedPolicy)
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const [error, setError] = useState<QueryResponseError>()
  const [errorPanelOpen, setErrorPanelOpen] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  // [Joshen] Separate state here as there's a delay between submitting and the API updating the loading status
  const [debugThread, setDebugThread] = useState<MessageWithDebug[]>([])
  const [assistantVisible, setAssistantPanel] = useState(false)
  const [isAssistantChatInputEmpty, setIsAssistantChatInputEmpty] = useState(true)
  const [incomingChange, setIncomingChange] = useState<string | undefined>(undefined)
  // used for confirmation when closing the panel with unsaved changes
  const [isClosingPolicyEditorPanel, setIsClosingPolicyEditorPanel] = useState(false)

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
      setError(error)
    },
  })

  const { mutateAsync: debugSql, isLoading: isDebugSqlLoading } = useSqlDebugMutation()

  const errorLines =
    error?.formattedError.split('\n').filter((x: string) => x.length > 0).length ?? 0

  const onExecuteSQL = useCallback(() => {
    // clean up the sql before sending
    const policy = editorRef.current?.getValue().replaceAll('  ', ' ')

    if (policy) {
      setError(undefined)
      executeMutation({
        sql: policy,
        projectRef: selectedProject?.ref,
        connectionString: selectedProject?.connectionString,
      })
    }
  }, [executeMutation, selectedProject?.connectionString, selectedProject?.ref])

  const acceptChange = useCallback(async () => {
    if (!incomingChange) {
      return
    }

    if (!editorRef.current || !diffEditorRef.current) {
      return
    }

    const editorModel = editorRef.current.getModel()
    const diffModel = diffEditorRef.current.getModel()

    if (!editorModel || !diffModel) {
      return
    }

    const sql = diffModel.modified.getValue()

    // apply the incoming change in the editor directly so that Undo/Redo work properly
    editorRef.current.executeEdits('apply-ai-edit', [
      {
        text: sql,
        range: editorModel.getFullModelRange(),
      },
    ])

    // remove the incoming change to revert to the original editor
    setIncomingChange(undefined)
  }, [incomingChange])

  function toggleFeaturePreviewModal() {
    snap.setSelectedFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT)
    snap.setShowFeaturePreviewModal(!snap.showFeaturePreviewModal)
    onSelectCancel()
  }

  const onClosingPanel = useCallback(() => {
    const policy = editorRef.current?.getValue()
    if (policy || messages.length > 0 || !isAssistantChatInputEmpty) {
      setIsClosingPolicyEditorPanel(true)
    } else {
      onSelectCancel()
    }
  }, [onSelectCancel, messages, isAssistantChatInputEmpty])

  const onSelectDebug = async () => {
    const policy = editorRef.current?.getValue().replaceAll('\n', ' ').replaceAll('  ', ' ')
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

  // when the panel is closed, reset all values
  useEffect(() => {
    if (!visible) {
      editorRef.current?.setValue('')
      setIncomingChange(undefined)
      setAssistantPanel(false)
      setIsClosingPolicyEditorPanel(false)
      setError(undefined)
      setDebugThread([])
      setChatId(uuidv4())
      setShowDetails(false)
    }
  }, [visible])

  // whenever the deps (current policy details, new error or error panel opens) change, recalculate
  // the height of the editor
  useEffect(() => {
    editorRef.current?.layout({ width: 0, height: 0 })
    window.requestAnimationFrame(() => {
      editorRef.current?.layout()
    })
  }, [showDetails, error, errorPanelOpen])

  return (
    <>
      <Sheet_Shadcn_ open={visible} onOpenChange={() => onClosingPanel()}>
        <SheetContent_Shadcn_
          size={assistantVisible ? 'lg' : 'default'}
          className={cn(
            'p-0 flex flex-row gap-0',
            assistantVisible ? '!min-w-[1024px]' : '!min-w-[600px]'
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
                <div className="px-5 py-3 flex justify-between gap-3 bg-muted">
                  <div className="flex gap-2 items-center text-foreground-light">
                    <FileDiff className="h-4 w-4" />
                    <span className="text-sm">Accept changes from assistant</span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="default"
                      onClick={() => {
                        setIncomingChange(undefined)
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
                  original={editorRef.current?.getValue()}
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
              <div className={`relative h-full ${incomingChange ? 'hidden' : 'block'}`}>
                <RLSCodeEditor
                  id="rls-sql-policy"
                  defaultValue={''}
                  editorRef={editorRef}
                  placeholder={placeholder}
                />
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
                <SheetFooter_Shadcn_ className="flex items-center !justify-between px-5 py-4 w-full">
                  <Button type="text" onClick={toggleFeaturePreviewModal}>
                    Toggle feature preview
                  </Button>
                  <div className="flex items-center gap-x-2">
                    <Button type="default" disabled={isExecuting} onClick={() => onSelectCancel()}>
                      Cancel
                    </Button>
                    <Button
                      loading={isExecuting}
                      htmlType="submit"
                      disabled={isExecuting || incomingChange !== undefined}
                      onClick={() => onExecuteSQL()}
                    >
                      Save policy
                    </Button>
                  </div>
                </SheetFooter_Shadcn_>
              </div>
            </div>
          </div>
          {assistantVisible && (
            <div className={cn('flex border-l grow w-full', assistantVisible && 'w-[40%]')}>
              <AIPolicyChat
                messages={messages}
                onSubmit={(message) =>
                  append({
                    content: message,
                    role: 'user',
                    createdAt: new Date(),
                  })
                }
                onDiff={setIncomingChange}
                onChange={setIsAssistantChatInputEmpty}
                loading={isLoading || isDebugSqlLoading}
              />
            </div>
          )}

          <ConfirmationModal
            visible={isClosingPolicyEditorPanel}
            header="Discard changes"
            buttonLabel="Discard"
            onSelectCancel={() => setIsClosingPolicyEditorPanel(false)}
            onSelectConfirm={() => {
              onSelectCancel()
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
        </SheetContent_Shadcn_>
      </Sheet_Shadcn_>
    </>
  )
})

AIPolicyEditorPanel.displayName = 'AIPolicyEditorPanel'
